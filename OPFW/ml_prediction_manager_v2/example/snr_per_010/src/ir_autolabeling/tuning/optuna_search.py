from __future__ import annotations

from contextlib import ExitStack
import json
import os
from pathlib import Path
import re
from typing import Any

import optuna
import yaml
from boxmot import get_tracker_config

from ir_autolabeling.data.mot20 import iter_frame_paths, load_mot20_sequences
from ir_autolabeling.detectors.base import RawDetections
from ir_autolabeling.eval.mot import MOTSummary, SequenceEvalInput, count_mot_gt_objects, evaluate_motchallenge
from ir_autolabeling.reporting.experiment_logger import (
    append_iteration_journal,
    append_trial_ledger,
    build_config_signature,
    build_trial_signature,
    canonicalize_trial_ledger,
    load_trial_ledger,
    append_event_journal,
    write_json_summary,
    write_trial_report,
)
from ir_autolabeling.tracking.boxmot_adapter import run_tracker_on_sequence
from ir_autolabeling.tuning.search_space import COMMON_BASE_TRACKER_SEARCH, sample_detector_params, sample_tracker_params
from ir_autolabeling.utils.config import ensure_dir
from ir_autolabeling.utils.io import hash_jsonl_frame_window, inspect_jsonl_frame_sequence
from ir_autolabeling.utils.lock import exclusive_file_lock, exclusive_file_lock_wait


class OptunaSearchRunner:
    def __init__(self, project_cfg: dict[str, Any]):
        self.project_cfg = project_cfg
        self.paths_cfg = project_cfg["paths"]
        self.dataset_cfg = project_cfg["dataset"]
        self.tracking_cfg = project_cfg["tracking"]
        self.tuning_cfg = project_cfg["tuning"]
        self._lock_tracker_params = bool(self.tuning_cfg.get("lock_tracker_params", False))
        self._locked_tracker_name: str | None = None
        self._locked_tracker_params: dict[str, Any] | None = None
        skip_tracker_names = self.tuning_cfg.get("skip_tracker_names") or []
        if not isinstance(skip_tracker_names, list):
            skip_tracker_names = [skip_tracker_names]
        self._skip_tracker_names = {str(name) for name in skip_tracker_names if str(name).strip()}
        self.eval_version = self.tuning_cfg.get("eval_version")
        self.artifact_root = ensure_dir(self.paths_cfg["artifact_root"])
        self.docs_dir = ensure_dir(self.paths_cfg["docs_experiments_dir"])
        base_study_name = str(self.tuning_cfg["study_name"])
        self.cache_dir = (
            self.artifact_root / "detections" / project_cfg["detector"]["cache_tag"]
        )
        self.sequences = load_mot20_sequences(
            self.paths_cfg["dataset_root"],
            split=self.dataset_cfg["split"],
            sequence_names=self.dataset_cfg.get("sequences"),
        )
        self._sequence_by_name = {sequence.name: sequence for sequence in self.sequences}

        if self._lock_tracker_params:
            summary_path = self.tuning_cfg.get("lock_tracker_summary")
            if summary_path:
                summary_file = Path(str(summary_path)).expanduser().resolve()
                if not summary_file.exists():
                    raise RuntimeError(
                        f"lock_tracker_params=True but lock_tracker_summary does not exist: {summary_file}"
                    )
                try:
                    payload = json.loads(summary_file.read_text())
                except Exception as exc:
                    raise RuntimeError(f"Failed to parse lock_tracker_summary JSON at {summary_file}: {exc}") from exc
                tracker_name = payload.get("tracker_name")
                if tracker_name is not None and str(tracker_name).strip():
                    self._locked_tracker_name = str(tracker_name)
                tracker_params = payload.get("tracker_params")
                if isinstance(tracker_params, dict):
                    self._locked_tracker_params = dict(tracker_params)

            locked_name_cfg = self.tuning_cfg.get("locked_tracker_name")
            if locked_name_cfg is not None and str(locked_name_cfg).strip():
                self._locked_tracker_name = str(locked_name_cfg)
            locked_params_cfg = self.tuning_cfg.get("locked_tracker_params")
            if locked_params_cfg is not None:
                if not isinstance(locked_params_cfg, dict):
                    raise RuntimeError("locked_tracker_params must be a mapping when provided.")
                self._locked_tracker_params = dict(locked_params_cfg)

            tracker_names = list(self.tracking_cfg.get("tracker_names") or [])
            if self._locked_tracker_name is None and len(tracker_names) == 1:
                self._locked_tracker_name = str(tracker_names[0])
            if self._locked_tracker_name is None or self._locked_tracker_params is None:
                raise RuntimeError(
                    "lock_tracker_params=True requires either "
                    "tuning.lock_tracker_summary=<summary.json> or "
                    "tuning.locked_tracker_name + tuning.locked_tracker_params."
                )
            if self._locked_tracker_name not in {str(name) for name in tracker_names}:
                raise RuntimeError(
                    f"lock_tracker_params=True but locked tracker_name={self._locked_tracker_name!r} "
                    f"is not in tracking.tracker_names={tracker_names}"
                )
            try:
                if "max_age" in self._locked_tracker_params and "max_obs" in self._locked_tracker_params:
                    self._locked_tracker_params["max_obs"] = max(
                        int(self._locked_tracker_params["max_obs"]),
                        int(self._locked_tracker_params["max_age"]),
                    )
            except Exception:
                pass

        frames_by_sequence: dict[str, list[int]] = {}
        try:
            frame_stride = int(self.dataset_cfg.get("frame_stride") or 1)
        except Exception:
            frame_stride = 1
        max_frames_per_sequence_cfg = self.dataset_cfg.get("max_frames_per_sequence")
        try:
            max_frames_per_sequence_count = (
                int(max_frames_per_sequence_cfg) if max_frames_per_sequence_cfg is not None else None
            )
        except Exception:
            max_frames_per_sequence_count = None
        try:
            for sequence in self.sequences:
                frames_by_sequence[sequence.name] = [
                    frame_idx
                    for frame_idx, _frame_path in iter_frame_paths(
                        sequence,
                        frame_stride=frame_stride,
                        max_frames=max_frames_per_sequence_count,
                    )
                ]
        except Exception:
            frames_by_sequence = {}

        cache_coverage: dict[str, Any] = {}
        cache_window_hashes: dict[str, str] = {}
        max_frames_per_sequence = self.dataset_cfg.get("max_frames_per_sequence")
        try:
            max_frames_per_sequence = int(max_frames_per_sequence) if max_frames_per_sequence is not None else None
        except Exception:
            max_frames_per_sequence = None
        for sequence in self.sequences:
            cache_path = self.cache_dir / f"{sequence.name}.jsonl"
            if not cache_path.exists():
                raise RuntimeError(
                    "Missing detection cache file. "
                    f"Expected {cache_path} to exist for cache_tag={project_cfg['detector']['cache_tag']!r}. "
                    "Run `ir-autolabeling cache-detections --config <cfg>` (or create a symlink under "
                    f"{self.cache_dir}) before tuning."
                )
            expected_frames = frames_by_sequence.get(sequence.name)
            expected_count = len(expected_frames) if expected_frames else None
            expected_last = int(expected_frames[-1]) if expected_frames else None
            max_frame_idx = expected_last if (max_frames_per_sequence is not None and expected_last is not None) else None
            cache_stats = inspect_jsonl_frame_sequence(cache_path, frame_key="frame_idx", max_frame_idx=max_frame_idx)
            if cache_path.exists() and not cache_stats.is_valid:
                duplicate_preview = ",".join(str(frame) for frame in cache_stats.duplicate_frames[:10])
                raise RuntimeError(
                    f"Corrupted detection cache detected at {cache_path}: "
                    f"row_count={cache_stats.row_count}, unique_frames={cache_stats.unique_frame_count}, "
                    f"duplicate_frames=[{duplicate_preview}]"
                )
            if max_frames_per_sequence is not None:
                last_frame = int(cache_stats.last_frame_idx or 0)
            else:
                last_frame = self._read_cache_last_frame(cache_path)
            if expected_count is not None and expected_last is not None:
                if cache_stats.unique_frame_count < expected_count or last_frame < expected_last:
                    raise RuntimeError(
                        "Incomplete detection cache detected at "
                        f"{cache_path}: unique_frames={cache_stats.unique_frame_count}, last_frame={last_frame}, "
                        f"expected_unique_frames={expected_count}, expected_last_frame={expected_last}. "
                        "Finish `cache-detections` before tuning to avoid partial metrics."
                    )
            
            
            if max_frames_per_sequence is not None and last_frame > max_frames_per_sequence:
                last_frame = max_frames_per_sequence
            cache_coverage[sequence.name] = last_frame
            if max_frames_per_sequence_count is not None:
                cache_window_hashes[sequence.name] = hash_jsonl_frame_window(
                    cache_path,
                    frame_key="frame_idx",
                    start_frame_idx=1,
                    frame_stride=frame_stride,
                    max_frames=max_frames_per_sequence_count,
                )

        self._eval_frames_by_sequence: dict[str, list[int]] = {}
        self._gt_objects_by_sequence: dict[str, int] = {}
        self._total_gt_objects: int | None = None
        try:
            total = 0
            for sequence in self.sequences:
                frames = frames_by_sequence.get(sequence.name)
                if frames is None:
                    frames = [
                        frame_idx
                        for frame_idx, _frame_path in iter_frame_paths(
                            sequence,
                            frame_stride=frame_stride,
                            max_frames=max_frames_per_sequence_count,
                        )
                    ]
                self._eval_frames_by_sequence[sequence.name] = frames
                gt_objects = count_mot_gt_objects(sequence.gt_path, frames)
                self._gt_objects_by_sequence[sequence.name] = gt_objects
                total += int(gt_objects)
            self._total_gt_objects = int(total)
        except Exception:
            self._eval_frames_by_sequence = {}
            self._gt_objects_by_sequence = {}
            self._total_gt_objects = None

        self.detector_cache_signature = build_config_signature(
            {
                "detector": project_cfg["detector"],
                "dataset": {
                    "split": self.dataset_cfg.get("split"),
                    "sequences": self.dataset_cfg.get("sequences"),
                    "frame_stride": self.dataset_cfg.get("frame_stride"),
                    "max_frames_per_sequence": self.dataset_cfg.get("max_frames_per_sequence"),
                },
                "cache_coverage": cache_coverage,
                "cache_window_hashes": cache_window_hashes if cache_window_hashes else None,
            }
        )
        study_name = base_study_name
        if bool(self.tuning_cfg.get("scope_study_by_cache", False)):
            study_name = f"{study_name}_{self.detector_cache_signature}"
        if bool(self.tuning_cfg.get("scope_study_by_search_space", False)):
            refinement_limit = project_cfg.get("detector", {}).get("sam2_max_refinement_boxes")
            try:
                has_sam_boxes = refinement_limit is None or int(refinement_limit) > 0
            except Exception:
                has_sam_boxes = True
            postprocess_cfg = dict(self.tracking_cfg.get("postprocess") or {})
            search_space_signature = build_config_signature(
                {
                    "tracker_names": list(self.tracking_cfg.get("tracker_names") or []),
                    "detector_search": self.tuning_cfg.get("detector_search"),
                    "tracker_search": self.tuning_cfg.get("tracker_search"),
                    "has_sam_boxes": bool(has_sam_boxes),
                    "tracking_postprocess": postprocess_cfg,
                    "eval_version": self.eval_version,
                    "lock_tracker_params": bool(self._lock_tracker_params),
                    "locked_tracker_name": self._locked_tracker_name if self._lock_tracker_params else None,
                    "locked_tracker_params": self._locked_tracker_params if self._lock_tracker_params else None,
                }
            )
            study_name = f"{study_name}_{search_space_signature}"
        self.study_name = study_name

        self.trials_dir = self.artifact_root / "trials" / self.study_name
        self.trials_dir.mkdir(parents=True, exist_ok=True)
        self.ledger_path = self.artifact_root / "trial_ledger.jsonl"
        self.journal_path = self.docs_dir / "EXP-003-optimization-journal.md"
        self.tracking_postprocess_signature: dict[str, Any] = {}
        if self.eval_version is not None:
            self.tracking_postprocess_signature["eval_version"] = self.eval_version
        postprocess_cfg = dict(self.tracking_cfg.get("postprocess") or {})
        interpolate_max_gap = int(postprocess_cfg.get("interpolate_max_gap", 0) or 0)
        interpolate_min_endpoint_score = postprocess_cfg.get("interpolate_min_endpoint_score")
        interpolate_min_endpoint_iou = postprocess_cfg.get("interpolate_min_endpoint_iou")
        emit_predicted_max_gap = int(postprocess_cfg.get("emit_predicted_max_gap", 0) or 0)
        emit_predicted_min_score = postprocess_cfg.get("emit_predicted_min_score")
        clip_boxes = bool(postprocess_cfg.get("clip_boxes", False))
        postprocess_min_score = postprocess_cfg.get("min_score")
        postprocess_min_box_area = postprocess_cfg.get("min_box_area")
        postprocess_min_height = postprocess_cfg.get("min_height")
        postprocess_min_width = postprocess_cfg.get("min_width")
        postprocess_min_height_width_ratio = postprocess_cfg.get("min_height_width_ratio")
        postprocess_max_height_width_ratio = postprocess_cfg.get("max_height_width_ratio")
        postprocess_max_box_area_fraction = postprocess_cfg.get("max_box_area_fraction")
        postprocess_min_track_length = postprocess_cfg.get("min_track_length")
        postprocess_min_track_avg_score = postprocess_cfg.get("min_track_avg_score")
        postprocess_min_track_total_score = postprocess_cfg.get("min_track_total_score")
        if interpolate_max_gap > 0:
            self.tracking_postprocess_signature.update(
                {
                    "interpolate_max_gap": interpolate_max_gap,
                    "interpolate_min_endpoint_score": (
                        float(interpolate_min_endpoint_score) if interpolate_min_endpoint_score is not None else None
                    ),
                    "interpolate_min_endpoint_iou": (
                        float(interpolate_min_endpoint_iou) if interpolate_min_endpoint_iou is not None else None
                    ),
                }
            )
        if emit_predicted_max_gap > 0:
            self.tracking_postprocess_signature.update(
                {
                    "emit_predicted_max_gap": emit_predicted_max_gap,
                    "emit_predicted_min_score": (
                        float(emit_predicted_min_score) if emit_predicted_min_score is not None else None
                    ),
                }
            )
        if (
            clip_boxes
            or postprocess_min_score is not None
            or postprocess_min_box_area is not None
            or postprocess_min_height is not None
            or postprocess_min_width is not None
            or postprocess_min_height_width_ratio is not None
            or postprocess_max_height_width_ratio is not None
            or postprocess_max_box_area_fraction is not None
        ):
            self.tracking_postprocess_signature.update(
                {
                    "clip_boxes": clip_boxes,
                    "min_score": float(postprocess_min_score) if postprocess_min_score is not None else None,
                    "min_box_area": float(postprocess_min_box_area) if postprocess_min_box_area is not None else None,
                    "min_height": float(postprocess_min_height) if postprocess_min_height is not None else None,
                    "min_width": float(postprocess_min_width) if postprocess_min_width is not None else None,
                    "min_height_width_ratio": (
                        float(postprocess_min_height_width_ratio)
                        if postprocess_min_height_width_ratio is not None
                        else None
                    ),
                    "max_height_width_ratio": (
                        float(postprocess_max_height_width_ratio)
                        if postprocess_max_height_width_ratio is not None
                        else None
                    ),
                    "max_box_area_fraction": (
                        float(postprocess_max_box_area_fraction)
                        if postprocess_max_box_area_fraction is not None
                        else None
                    ),
                }
            )

        try:
            min_track_length_value = int(postprocess_min_track_length) if postprocess_min_track_length is not None else 0
        except Exception:
            min_track_length_value = 0
        if (
            min_track_length_value > 1
            or postprocess_min_track_avg_score is not None
            or postprocess_min_track_total_score is not None
        ):
            normalized_min_track_length = max(1, int(min_track_length_value) if min_track_length_value else 1)
            self.tracking_postprocess_signature.update(
                {
                    "min_track_length": normalized_min_track_length,
                    "min_track_avg_score": (
                        float(postprocess_min_track_avg_score) if postprocess_min_track_avg_score is not None else None
                    ),
                    "min_track_total_score": (
                        float(postprocess_min_track_total_score)
                        if postprocess_min_track_total_score is not None
                        else None
                    ),
                }
            )

        refinement_limit = project_cfg.get("detector", {}).get("sam2_max_refinement_boxes")
        try:
            self._has_sam_boxes = refinement_limit is None or int(refinement_limit) > 0
        except Exception:
            self._has_sam_boxes = True

        try:
            self._max_avg_detections_per_frame = float(self.tuning_cfg.get("max_avg_detections_per_frame") or 0.0)
        except Exception:
            self._max_avg_detections_per_frame = 0.0
        try:
            self._guardrail_probe_frames = int(self.tuning_cfg.get("guardrail_probe_frames") or 0)
        except Exception:
            self._guardrail_probe_frames = 0

        self._detector_probe_frames: int = 0
        self._detector_probe_iou_threshold: float = 0.5
        self._detector_probe_min_precision: float | None = None
        self._detector_probe_min_recall: float | None = None
        self._detector_probe_frame_strategy: str = "strided"
        try:
            explicit_probe_frames = "detector_probe_frames" in self.tuning_cfg
            raw_probe_frames = self.tuning_cfg.get("detector_probe_frames") if explicit_probe_frames else None
            if raw_probe_frames is None:
                raw_probe_frames = self._guardrail_probe_frames
            self._detector_probe_frames = int(raw_probe_frames or 0)
            raw_strategy = self.tuning_cfg.get("detector_probe_frame_strategy")
            if raw_strategy is None:
                raw_strategy = "first" if explicit_probe_frames else "strided"
            self._detector_probe_frame_strategy = str(raw_strategy or "strided")
        except Exception:
            self._detector_probe_frames = int(self._guardrail_probe_frames or 0)
            self._detector_probe_frame_strategy = "strided"
        self._detector_probe_frames = max(0, min(50, int(self._detector_probe_frames or 0)))
        try:
            self._detector_probe_iou_threshold = float(self.tuning_cfg.get("detector_probe_iou_threshold") or 0.5)
        except Exception:
            self._detector_probe_iou_threshold = 0.5
        try:
            raw_min_precision = self.tuning_cfg.get("detector_probe_min_precision")
            self._detector_probe_min_precision = float(raw_min_precision) if raw_min_precision is not None else None
        except Exception:
            self._detector_probe_min_precision = None
        try:
            raw_min_recall = self.tuning_cfg.get("detector_probe_min_recall")
            self._detector_probe_min_recall = float(raw_min_recall) if raw_min_recall is not None else None
        except Exception:
            self._detector_probe_min_recall = None
        try:
            probe_frames = int(self._guardrail_probe_frames or 0)
        except Exception:
            probe_frames = 0
        probe_frames = max(10, min(50, probe_frames)) if probe_frames > 0 else 10
        self._prompt_support_max = self._estimate_prompt_support_max(probe_frames=probe_frames)

        def _normalize_detector_params(params: dict[str, Any]) -> dict[str, Any]:
            mutated = False
            if not self._has_sam_boxes:
                params = dict(params)
                mutated = True
                params["box_source"] = "grounding"

            
            
            
            
            try:
                prompt_support_max = int(getattr(self, "_prompt_support_max", 1) or 1)
            except Exception:
                prompt_support_max = 1
            if prompt_support_max <= 1 and ("min_prompt_votes" in params or "prompt_support_weight" in params):
                if not mutated:
                    params = dict(params)
                    mutated = True
                params.pop("min_prompt_votes", None)
                params.pop("prompt_support_weight", None)

            return params

        self._normalize_detector_params = _normalize_detector_params

        self.known_signatures = canonicalize_trial_ledger(
            load_trial_ledger(self.ledger_path),
            detector_cache_signature=self.detector_cache_signature,
            tracking_postprocess=(self.tracking_postprocess_signature or None),
            normalize_detector_params=self._normalize_detector_params,
        )

    def _estimate_detector_probe_metrics(
        self,
        detector_params: dict[str, Any],
        *,
        probe_frames: int,
        iou_threshold: float,
    ) -> tuple[float, float, float]:
        pass

        probe_frames = max(1, min(50, int(probe_frames or 0)))
        if probe_frames <= 0:
            return 0.0, 0.0, 0.0

        try:
            probe_sequence = next(iter(self._iter_eval_sequences()))
        except Exception:
            return 0.0, 0.0, 0.0

        cache_path = self.cache_dir / f"{probe_sequence.name}.jsonl"
        if not cache_path.exists():
            return 0.0, 0.0, 0.0

        from ir_autolabeling.eval.detector import DetectorAuditInput, evaluate_detection_caches

        frame_stride = 1
        if str(getattr(self, "_detector_probe_frame_strategy", "first") or "first").lower() == "strided":
            try:
                eval_window = int(self.dataset_cfg.get("max_frames_per_sequence") or 0)
            except Exception:
                eval_window = 0
            if eval_window > 0:
                frame_stride = max(1, int(eval_window // max(1, probe_frames)))

        summary = evaluate_detection_caches(
            [
                DetectorAuditInput(
                    name=str(probe_sequence.name),
                    gt_path=probe_sequence.gt_path,
                    cache_path=cache_path,
                )
            ],
            detector_postprocess=detector_params,
            iou_threshold=float(iou_threshold),
            max_frames_per_sequence=int(probe_frames),
            frame_stride=int(frame_stride),
            start_frame=1,
        )
        return float(summary.precision), float(summary.recall), float(summary.f1)

    def _trial_state_to_status(self, state: optuna.trial.TrialState) -> str:
        if state == optuna.trial.TrialState.COMPLETE:
            return "completed"
        if state == optuna.trial.TrialState.PRUNED:
            return "pruned"
        if state in {optuna.trial.TrialState.FAIL, optuna.trial.TrialState.WAITING}:
            return "failed"
        return str(getattr(state, "name", None) or "unknown").lower()

    def _extract_params_from_optuna_trial(
        self, frozen: optuna.trial.FrozenTrial
    ) -> tuple[str, dict[str, Any], dict[str, Any]]:
        tracker_name = str(frozen.params.get("tracker_name") or frozen.user_attrs.get("tracker_name") or "unknown")
        detector_params: dict[str, Any] = {}
        tracker_params: dict[str, Any] = {}

        for key, value in (frozen.params or {}).items():
            if not isinstance(key, str):
                continue
            if key.startswith("detector."):
                subkey = key.removeprefix("detector.")
                if subkey.startswith("enable_"):
                    continue
                detector_params[subkey] = value
                continue
            if tracker_name != "unknown" and key.startswith(f"tracker.{tracker_name}."):
                subkey = key.removeprefix(f"tracker.{tracker_name}.")
                tracker_params[subkey] = value
                continue

        detector_params = self._normalize_detector_params(detector_params)
        return tracker_name, detector_params, tracker_params

    def _backfill_known_signatures_from_optuna(self, study: optuna.study.Study) -> int:
        pass

        try:
            ledger = load_trial_ledger(self.ledger_path)
        except Exception:
            ledger = {}
        
        
        
        
        
        
        existing: set[str] = set()
        for signature, payload in (ledger or {}).items():
            status = str((payload or {}).get("status") or "").lower()
            if status in {"running", "skipped_duplicate"}:
                continue
            existing.add(str(signature))

        imported = 0
        for frozen in list(study.trials):
            if frozen.state == optuna.trial.TrialState.RUNNING:
                
                
                
                continue
            signature = frozen.user_attrs.get("signature")
            if not signature:
                continue
            signature = str(signature)
            if signature in existing or signature in self.known_signatures:
                continue

            tracker_name, detector_params, tracker_params = self._extract_params_from_optuna_trial(frozen)
            run_dir = self.trials_dir / f"trial_{int(frozen.number):04d}"
            summary: dict[str, Any] | None = None
            per_sequence: dict[str, Any] | None = None
            status = self._trial_state_to_status(frozen.state)
            error: str | None = None
            try:
                summary_path = run_dir / "summary.json"
                if summary_path.exists():
                    payload = json.loads(summary_path.read_text(encoding="utf-8"))
                    status = str(payload.get("status") or status)
                    summary = payload.get("summary")
                    per_sequence = payload.get("per_sequence")
                    error = payload.get("error")
            except Exception:
                summary = None
                per_sequence = None

            if summary is None:
                summary = self._empty_summary()
                if frozen.value is not None:
                    try:
                        summary["mota"] = float(frozen.value)
                    except Exception:
                        pass
                error = error or "backfilled_from_optuna_without_summary_json"
            if per_sequence is None:
                per_sequence = {}

            ledger_payload = {
                "study_name": self.study_name,
                "trial_number": int(frozen.number),
                "status": status,
                "signature": signature,
                "tracking_postprocess": (self.tracking_postprocess_signature or None),
                "tracker_name": tracker_name,
                "detector_params": detector_params,
                "tracker_params": tracker_params,
                "summary": summary,
                "per_sequence": per_sequence,
                "error": error,
                "duplicate_of": None,
            }
            
            try:
                append_trial_ledger(self.ledger_path, ledger_payload)
            except Exception:
                pass
            self.known_signatures[signature] = ledger_payload
            imported += 1

        if imported > 0:
            try:
                append_event_journal(
                    self.journal_path,
                    category="infra",
                    name="optuna_backfill_ledger",
                    bullets=[
                        f"Study: `{self.study_name}`",
                        f"Imported missing signatures from Optuna storage: {imported}",
                        f"Ledger: `{self.ledger_path}`",
                    ],
                )
            except Exception:
                pass
        return imported

    def _repair_stale_running_trials(self, study: optuna.study.Study) -> int:
        pass

        storage = getattr(study, "_storage", None)
        if storage is None:
            return 0

        repaired = 0
        for frozen in list(study.trials):
            if frozen.state != optuna.trial.TrialState.RUNNING:
                continue

            signature = frozen.user_attrs.get("signature")
            tracker_name, detector_params, tracker_params = self._extract_params_from_optuna_trial(frozen)
            if signature:
                signature = str(signature)
            else:
                try:
                    signature = build_trial_signature(
                        tracker_name=tracker_name,
                        detector_params=detector_params,
                        tracker_params=tracker_params,
                        detector_cache_signature=self.detector_cache_signature,
                        tracking_postprocess=self.tracking_postprocess_signature,
                    )
                except Exception:
                    signature = build_config_signature(
                        {"trial_number": int(frozen.number), "type": "stale_running_signature_failed"}
                    )

            if signature in self.known_signatures:
                
                try:
                    storage.set_trial_state_values(int(getattr(frozen, "_trial_id")), optuna.trial.TrialState.FAIL)
                except Exception:
                    pass
                repaired += 1
                continue

            try:
                storage.set_trial_state_values(int(getattr(frozen, "_trial_id")), optuna.trial.TrialState.FAIL)
            except Exception:
                
                
                pass

            run_dir = self.trials_dir / f"trial_{int(frozen.number):04d}"
            run_dir.mkdir(parents=True, exist_ok=True)
            error = "repaired_stale_running_trial"
            payload = {
                "trial_number": int(frozen.number),
                "status": "failed",
                "tracker_name": tracker_name,
                "detector_params": detector_params,
                "tracker_params": tracker_params,
                "error": error,
            }
            try:
                write_json_summary(run_dir / "summary.json", payload)
            except Exception:
                pass
            try:
                write_trial_report(
                    docs_dir=self.docs_dir,
                    study_name=self.study_name,
                    trial_number=int(frozen.number),
                    status="failed",
                    tracker_name=tracker_name,
                    detector_params=detector_params,
                    tracker_params=tracker_params,
                    summary=self._empty_summary(),
                    per_sequence={},
                    error=error,
                )
            except Exception:
                pass
            try:
                self._record_history(
                    trial_number=int(frozen.number),
                    status="failed",
                    signature=signature,
                    tracker_name=tracker_name,
                    detector_params=detector_params,
                    tracker_params=tracker_params,
                    summary=self._empty_summary(),
                    per_sequence={},
                    error=error,
                )
            except Exception:
                pass
            repaired += 1

        if repaired > 0:
            try:
                append_event_journal(
                    self.journal_path,
                    category="infra",
                    name="optuna_repair_stale_running_trials",
                    bullets=[
                        f"Study: `{self.study_name}`",
                        f"Repaired RUNNING trials: {repaired}",
                        f"Ledger: `{self.ledger_path}`",
                    ],
                )
            except Exception:
                pass
        return repaired

    def _iter_eval_sequences(self):
        order = self.tuning_cfg.get("eval_sequence_order")
        if isinstance(order, list) and order:
            seen: set[str] = set()
            for name in order:
                key = str(name)
                sequence = self._sequence_by_name.get(key)
                if sequence is None or key in seen:
                    continue
                seen.add(key)
                yield sequence
            for sequence in self.sequences:
                if sequence.name in seen:
                    continue
                yield sequence
            return
        yield from self.sequences

    def _estimate_avg_detections_per_frame(self, detector_params: dict[str, Any], *, probe_frames: int) -> float:
        if probe_frames <= 0:
            return 0.0
        counts: list[int] = []
        try:
            eval_window = int(self.dataset_cfg.get("max_frames_per_sequence") or 0)
        except Exception:
            eval_window = 0
        frame_stride = max(1, int(eval_window // max(1, probe_frames))) if eval_window > 0 else 1
        for sequence in self._iter_eval_sequences():
            cache_path = self.cache_dir / f"{sequence.name}.jsonl"
            if not cache_path.exists():
                continue
            with cache_path.open("r", encoding="utf-8") as handle:
                for line in handle:
                    if len(counts) >= probe_frames:
                        break
                    line = line.strip()
                    if not line:
                        continue
                    payload = json.loads(line)
                    raw = RawDetections.from_json_dict(payload)
                    try:
                        frame_idx = int(raw.frame_idx)
                    except Exception:
                        frame_idx = 0
                    if frame_idx <= 0:
                        continue
                    if ((frame_idx - 1) % frame_stride) != 0:
                        continue
                    detections = raw.to_tracker_detections(**detector_params)
                    counts.append(int(len(detections)))
            break
        if not counts:
            return 0.0
        return float(sum(counts)) / float(len(counts))

    def _estimate_prompt_support_max(self, *, probe_frames: int) -> int:
        if probe_frames <= 0:
            return 1
        max_support = 1
        for sequence in self._iter_eval_sequences():
            cache_path = self.cache_dir / f"{sequence.name}.jsonl"
            if not cache_path.exists():
                continue
            with cache_path.open("r", encoding="utf-8") as handle:
                for idx, line in enumerate(handle):
                    if idx >= probe_frames:
                        break
                    line = line.strip()
                    if not line:
                        continue
                    payload = json.loads(line)
                    raw = RawDetections.from_json_dict(payload)
                    counts = raw.prompt_support_counts or []
                    if counts:
                        try:
                            max_support = max(max_support, int(max(counts)))
                        except Exception:
                            continue
                    if max_support > 1:
                        return max_support
            break
        return max_support

    @staticmethod
    def _parse_guardrail_avg_detections(error: str | None) -> float | None:
        if not error:
            return None
        text = str(error)
        if "Guardrail:" not in text or "avg_detections_per_frame" not in text:
            return None
        match = re.search(r"avg_detections_per_frame≈\\s*([0-9]+(?:\\.[0-9]+)?)", text)
        if match is None:
            return None
        try:
            return float(match.group(1))
        except Exception:
            return None

    def _should_skip_duplicate(self, previous: dict[str, Any]) -> bool:
        pass

        status = str(previous.get("status") or "")
        if status in {"completed"}:
            return True
        if status in {"failed"}:
            
            
            return False
        if status in {"skipped_duplicate"}:
            
            
            summary = previous.get("summary") or {}
            try:
                frames = int(summary.get("num_frames") or 0)
            except Exception:
                frames = 0
            return frames > 0
        if status != "pruned":
            return True

        error = str(previous.get("error") or "")

        if "Guardrail:" in error:
            avg_dets = self._parse_guardrail_avg_detections(error)
            if avg_dets is None:
                return True

            current_limit = float(self._max_avg_detections_per_frame or 0.0)
            if current_limit <= 0.0:
                return False
            return avg_dets > current_limit

        if "Probe:" in error and "precision=" in error:
            match = re.search(r"<\s*([0-9]*\.?[0-9]+)\b", error)
            if match is None:
                return True
            previous_threshold = float(match.group(1))
            current_threshold = self._detector_probe_min_precision
            if current_threshold is None:
                return False
            return float(current_threshold) >= previous_threshold

        if "Probe:" in error and "recall=" in error:
            match = re.search(r"<\s*([0-9]*\.?[0-9]+)\b", error)
            if match is None:
                return True
            previous_threshold = float(match.group(1))
            current_threshold = self._detector_probe_min_recall
            if current_threshold is None:
                return False
            return float(current_threshold) >= previous_threshold

        if ("Pruned by floor" in error or "optimistic-final floor" in error) and " < " in error:
            match = re.search(r"<\s*([0-9]*\.?[0-9]+)\b", error)
            if match is None:
                return True
            previous_floor = float(match.group(1))
            current_floor = self.tuning_cfg.get("prune_floor_mota")
            if current_floor is None:
                return False
            try:
                current_floor_value = float(current_floor)
            except Exception:
                return True
            return current_floor_value >= previous_floor

        return True

    @staticmethod
    def _read_cache_last_frame(path: Path) -> int:
        if not path.exists():
            return 0
        try:
            with path.open("rb") as handle:
                handle.seek(0, os.SEEK_END)
                pos = handle.tell()
                buf = b""
                
                
                
                while pos > 0 and buf.count(b"\n") < 2:
                    read_size = min(1024 * 1024, pos)
                    pos -= read_size
                    handle.seek(pos)
                    buf = handle.read(read_size) + buf
                lines = buf.splitlines()
                for raw in reversed(lines):
                    if not raw.strip():
                        continue
                    try:
                        payload = json.loads(raw.decode("utf-8"))
                    except Exception:
                        continue
                    return int(payload.get("frame_idx", 0))
            return 0
        except Exception:
            return 0

    def _enqueue_from_summary(self, study: optuna.study.Study, summary_path: Path) -> None:
        payload = yaml.safe_load(summary_path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise ValueError(f"Invalid seed summary payload: {summary_path}")

        tracker_name = payload.get("tracker_name")
        detector_params = dict(payload.get("detector_params") or {})
        tracker_params = dict(payload.get("tracker_params") or {})
        if not tracker_name:
            raise ValueError(f"Missing tracker_name in seed summary: {summary_path}")

        detector_search_cfg = self.tuning_cfg.get("detector_search", {})

        filtered_detector_params: dict[str, Any] = {}
        try:
            box_source_options = set(detector_search_cfg.get("box_source") or [])
            if not self._has_sam_boxes:
                filtered_detector_params["box_source"] = "grounding"
            elif "box_source" in detector_params and detector_params["box_source"] in box_source_options:
                filtered_detector_params["box_source"] = detector_params["box_source"]

            def keep_float_param(name: str, key: str) -> None:
                if key not in detector_params:
                    return
                cfg = detector_search_cfg.get(key)
                if not isinstance(cfg, dict) or "low" not in cfg or "high" not in cfg:
                    return
                value = float(detector_params[key])
                low = float(cfg["low"])
                high = float(cfg["high"])
                if low <= value <= high:
                    filtered_detector_params[name] = value

            keep_float_param("score_threshold", "score_threshold")
            keep_float_param("nms_iou_threshold", "nms_iou_threshold")
            keep_float_param("min_box_area", "min_box_area")
            keep_float_param("min_height", "min_height")
            keep_float_param("min_width", "min_width")
            keep_float_param("min_height_width_ratio", "min_height_width_ratio")
            keep_float_param("max_height_width_ratio", "max_height_width_ratio")

            top_k_options = set(detector_search_cfg.get("top_k") or [])
            if "top_k" in detector_params and detector_params["top_k"] in top_k_options:
                filtered_detector_params["top_k"] = detector_params["top_k"]

            rescue_cfg = detector_search_cfg.get("small_box_rescue") or {}
            if rescue_cfg:
                for key in ["score_threshold", "max_area", "min_height", "min_width", "min_height_width_ratio"]:
                    cfg = rescue_cfg.get(key)
                    raw_key = f"rescue_{key}" if key != "max_area" else "rescue_max_area"
                    if raw_key not in detector_params:
                        continue
                    if not isinstance(cfg, dict) or "low" not in cfg or "high" not in cfg:
                        continue
                    value = float(detector_params[raw_key])
                    low = float(cfg["low"])
                    high = float(cfg["high"])
                    if low <= value <= high:
                        filtered_detector_params[raw_key] = value

            upper_cfg = detector_search_cfg.get("upper_zone") or {}
            if upper_cfg:
                for raw_key, cfg_path in [
                    ("upper_zone_y_limit", ("y_limit",)),
                    ("upper_zone_score_threshold", ("score_threshold",)),
                    ("upper_zone_min_box_area", ("min_box_area",)),
                    ("upper_zone_min_height", ("min_height",)),
                    ("upper_zone_min_width", ("min_width",)),
                    ("upper_zone_min_height_width_ratio", ("min_height_width_ratio",)),
                ]:
                    if raw_key not in detector_params:
                        continue
                    cfg = upper_cfg
                    for part in cfg_path:
                        cfg = cfg.get(part, {})
                    if not isinstance(cfg, dict) or "low" not in cfg or "high" not in cfg:
                        continue
                    value = float(detector_params[raw_key])
                    low = float(cfg["low"])
                    high = float(cfg["high"])
                    if low <= value <= high:
                        filtered_detector_params[raw_key] = value

            score_calibration_cfg = detector_search_cfg.get("score_calibration") or {}
            if score_calibration_cfg:
                min_votes_options = set(score_calibration_cfg.get("min_prompt_votes") or [])
                if "min_prompt_votes" in detector_params and detector_params["min_prompt_votes"] in min_votes_options:
                    filtered_detector_params["min_prompt_votes"] = detector_params["min_prompt_votes"]
                for float_key in [
                    "prompt_support_weight",
                    "aspect_ratio_target",
                    "aspect_ratio_tolerance",
                    "aspect_ratio_score_bonus",
                    "aspect_ratio_score_penalty",
                    "mask_fill_target",
                    "mask_fill_tolerance",
                    "mask_fill_score_bonus",
                    "mask_fill_score_penalty",
                    "small_box_area_threshold",
                    "small_box_score_bonus",
                    "upper_zone_small_box_bonus",
                    "gs_iou_min",
                    "gs_iou_weight",
                    "score_power",
                    "score_bias",
                ]:
                    if float_key not in detector_params:
                        continue
                    cfg = score_calibration_cfg.get(float_key)
                    if not isinstance(cfg, dict) or "low" not in cfg or "high" not in cfg:
                        continue
                    value = float(detector_params[float_key])
                    low = float(cfg["low"])
                    high = float(cfg["high"])
                    if low <= value <= high:
                        filtered_detector_params[float_key] = value
        except Exception:
            filtered_detector_params = {}

        config_path = get_tracker_config(str(tracker_name))
        with open(config_path, "r", encoding="utf-8") as handle:
            tracker_spec = yaml.safe_load(handle) or {}

        
        
        
        
        tracker_search_cfg = self.tuning_cfg.get("tracker_search") or {}
        override_cfg = {}
        if isinstance(tracker_search_cfg, dict):
            nested = tracker_search_cfg.get(str(tracker_name))
            if isinstance(nested, dict) and nested:
                override_cfg = nested
            else:
                
                flat_keys = {"det_thresh", "max_age", "max_obs", "min_hits", "iou_threshold", "asso_func", "with_reid"}
                if any(key in tracker_search_cfg for key in flat_keys):
                    override_cfg = tracker_search_cfg
        if override_cfg:
            tracker_spec = {**tracker_spec, **override_cfg}

        allowed_tracker_keys = {k for k in tracker_spec.keys() if k != "frame_rate"}
        for common_key in [
            "det_thresh",
            "max_age",
            "max_obs",
            "min_hits",
            "iou_threshold",
            "asso_func",
        ]:
            allowed_tracker_keys.add(common_key)
        if str(tracker_name) == "sfsort":
            allowed_tracker_keys.discard("det_thresh")

        normalized_detector_params = self._normalize_detector_params(filtered_detector_params)
        filtered_tracker_params: dict[str, Any] = {}
        params: dict[str, Any] = {"tracker_name": str(tracker_name)}
        for key, value in normalized_detector_params.items():
            params[f"detector.{key}"] = value
        for key, value in (tracker_params or {}).items():
            if key not in allowed_tracker_keys:
                continue
            spec = tracker_spec.get(key) or COMMON_BASE_TRACKER_SEARCH.get(key)
            accepted = False
            if isinstance(spec, dict) and "type" in spec:
                kind = spec["type"]
                try:
                    if kind in {"uniform", "loguniform"}:
                        low, high = [float(v) for v in spec["range"]]
                        numeric = float(value)
                        if low <= numeric <= high:
                            params[f"tracker.{tracker_name}.{key}"] = value
                            accepted = True
                    elif kind == "choice":
                        if value in list(spec.get("options") or []):
                            params[f"tracker.{tracker_name}.{key}"] = value
                            accepted = True
                    elif kind == "grid_search":
                        if value in list(spec.get("values") or []):
                            params[f"tracker.{tracker_name}.{key}"] = value
                            accepted = True
                    elif kind == "randint":
                        low, high = [int(v) for v in spec["range"]]
                        numeric = int(value)
                        if low <= numeric <= high:
                            params[f"tracker.{tracker_name}.{key}"] = numeric
                            accepted = True
                    elif kind == "qrandint":
                        low, high, step = [int(v) for v in spec["range"]]
                        numeric = int(value)
                        if low <= numeric <= high and (numeric - low) % max(step, 1) == 0:
                            params[f"tracker.{tracker_name}.{key}"] = numeric
                            accepted = True
                    else:
                        params[f"tracker.{tracker_name}.{key}"] = value
                        accepted = True
                except Exception:
                    accepted = False
            else:
                params[f"tracker.{tracker_name}.{key}"] = value
                accepted = True

            if accepted:
                filtered_tracker_params[key] = value

        if str(tracker_name) == "hybridsort":
            params[f"tracker.{tracker_name}.use_custom_kf"] = True
            params[f"tracker.{tracker_name}.with_reid"] = True
            filtered_tracker_params["use_custom_kf"] = True
            filtered_tracker_params["with_reid"] = True

        
        if detector_search_cfg.get("small_box_rescue") is not None:
            rescue_keys = {
                "rescue_score_threshold",
                "rescue_max_area",
                "rescue_min_height",
                "rescue_min_width",
                "rescue_min_height_width_ratio",
            }
            params["detector.enable_rescue"] = any(str(k) in rescue_keys for k in filtered_detector_params.keys())
        if detector_search_cfg.get("upper_zone") is not None:
            upper_zone_keys = {
                "upper_zone_y_limit",
                "upper_zone_score_threshold",
                "upper_zone_min_box_area",
                "upper_zone_min_height",
                "upper_zone_min_width",
                "upper_zone_min_height_width_ratio",
            }
            params["detector.enable_upper_zone"] = any(str(k) in upper_zone_keys for k in filtered_detector_params.keys())
        if detector_search_cfg.get("score_calibration") is not None:
            calibration_keys = {
                "min_prompt_votes",
                "prompt_support_weight",
                "aspect_ratio_target",
                "aspect_ratio_tolerance",
                "aspect_ratio_score_bonus",
                "aspect_ratio_score_penalty",
                "mask_fill_target",
                "mask_fill_tolerance",
                "mask_fill_score_bonus",
                "mask_fill_score_penalty",
                "small_box_area_threshold",
                "small_box_score_bonus",
                "upper_zone_small_box_bonus",
                "gs_iou_min",
                "gs_iou_weight",
                "score_power",
                "score_bias",
            }
            params["detector.enable_score_calibration"] = any(
                str(k) in calibration_keys for k in filtered_detector_params.keys()
            )

        seed_signature = build_trial_signature(
            tracker_name=str(tracker_name),
            detector_params=dict(normalized_detector_params),
            tracker_params=dict(filtered_tracker_params),
            detector_cache_signature=self.detector_cache_signature,
            tracking_postprocess=(self.tracking_postprocess_signature or None),
        )
        
        
        
        if len(study.trials) > 0 and seed_signature in self.known_signatures:
            try:
                append_event_journal(
                    self.journal_path,
                    category="skipped_duplicate",
                    name="enqueue_seed",
                    bullets=[
                        f"Study: `{self.study_name}`",
                        f"Seed summary: `{summary_path}`",
                        f"Signature: `{seed_signature}`",
                    ],
                )
            except Exception:
                pass
            return

        study.enqueue_trial(params)

    @staticmethod
    def _empty_summary() -> dict[str, Any]:
        return {
            "mota": 0.0,
            "idf1": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "num_switches": 0,
            "num_false_positives": 0,
            "num_misses": 0,
            "num_frames": 0,
        }

    def _record_history(
        self,
        *,
        trial_number: int,
        status: str,
        signature: str,
        tracker_name: str,
        detector_params: dict[str, Any],
        tracker_params: dict[str, Any],
        summary: dict[str, Any] | None,
        per_sequence: dict[str, Any] | None,
        error: str | None = None,
        duplicate_of: str | None = None,
    ) -> None:
        ledger_payload = {
            "study_name": self.study_name,
            "trial_number": trial_number,
            "status": status,
            "signature": signature,
            "tracking_postprocess": (self.tracking_postprocess_signature or None),
            "tracker_name": tracker_name,
            "detector_params": detector_params,
            "tracker_params": tracker_params,
            "summary": summary,
            "per_sequence": per_sequence,
            "error": error,
            "duplicate_of": duplicate_of,
        }
        append_trial_ledger(self.ledger_path, ledger_payload)
        append_iteration_journal(
            self.journal_path,
            study_name=self.study_name,
            trial_number=trial_number,
            status=status,
            signature=signature,
            tracker_name=tracker_name,
            detector_params=detector_params,
            tracker_params=tracker_params,
            summary=summary,
            error=error,
            duplicate_of=duplicate_of,
        )
        if status not in {"skipped_duplicate"}:
            self.known_signatures[signature] = ledger_payload

    def _build_eval_inputs(
        self,
        *,
        trial: optuna.trial.Trial | None,
        tracker_name: str,
        tracker_params: dict[str, Any],
        detector_params: dict[str, Any],
        run_dir: Path,
    ) -> tuple[list[SequenceEvalInput], MOTSummary]:
        eval_inputs: list[SequenceEvalInput] = []
        running_summary: MOTSummary | None = None
        postprocess_cfg = dict(self.tracking_cfg.get("postprocess") or {})
        interpolate_max_gap = int(postprocess_cfg.get("interpolate_max_gap", 0) or 0)
        interpolate_min_endpoint_score = postprocess_cfg.get("interpolate_min_endpoint_score")
        interpolate_min_endpoint_iou = postprocess_cfg.get("interpolate_min_endpoint_iou")
        emit_predicted_max_gap = int(postprocess_cfg.get("emit_predicted_max_gap", 0) or 0)
        emit_predicted_min_score = postprocess_cfg.get("emit_predicted_min_score")
        clip_boxes = bool(postprocess_cfg.get("clip_boxes", False))
        postprocess_min_score = postprocess_cfg.get("min_score")
        postprocess_min_box_area = postprocess_cfg.get("min_box_area")
        postprocess_min_height = postprocess_cfg.get("min_height")
        postprocess_min_width = postprocess_cfg.get("min_width")
        postprocess_min_height_width_ratio = postprocess_cfg.get("min_height_width_ratio")
        postprocess_max_height_width_ratio = postprocess_cfg.get("max_height_width_ratio")
        postprocess_max_box_area_fraction = postprocess_cfg.get("max_box_area_fraction")
        postprocess_min_track_length = postprocess_cfg.get("min_track_length")
        postprocess_min_track_avg_score = postprocess_cfg.get("min_track_avg_score")
        postprocess_min_track_total_score = postprocess_cfg.get("min_track_total_score")
        num_sequences = len(self.sequences)
        for step_idx, sequence in enumerate(self._iter_eval_sequences(), start=1):
            cache_path = self.cache_dir / f"{sequence.name}.jsonl"
            sequence_tracks_dir = run_dir / "tracks"
            artifact = run_tracker_on_sequence(
                sequence_name=sequence.name,
                detection_cache_path=cache_path,
                max_frames=self.dataset_cfg.get("max_frames_per_sequence"),
                frame_stride=int(self.dataset_cfg.get("frame_stride") or 1),
                start_frame=1,
                tracker_name=tracker_name,
                tracker_params=tracker_params,
                detector_postprocess=detector_params,
                frame_rate=sequence.frame_rate,
                image_width=sequence.width,
                image_height=sequence.height,
                tracker_device=self.tracking_cfg["device"],
                tracker_half=bool(self.tracking_cfg.get("half", False)),
                reid_weights=self.tracking_cfg.get("reid_weights"),
                output_dir=sequence_tracks_dir,
                interpolate_max_gap=interpolate_max_gap,
                interpolate_min_endpoint_score=interpolate_min_endpoint_score,
                interpolate_min_endpoint_iou=(
                    float(interpolate_min_endpoint_iou) if interpolate_min_endpoint_iou is not None else None
                ),
                emit_predicted_max_gap=emit_predicted_max_gap,
                emit_predicted_min_score=(
                    float(emit_predicted_min_score) if emit_predicted_min_score is not None else None
                ),
                clip_boxes=clip_boxes,
                postprocess_min_score=(
                    float(postprocess_min_score) if postprocess_min_score is not None else None
                ),
                postprocess_min_box_area=(
                    float(postprocess_min_box_area) if postprocess_min_box_area is not None else None
                ),
                postprocess_min_height=(
                    float(postprocess_min_height) if postprocess_min_height is not None else None
                ),
                postprocess_min_width=(
                    float(postprocess_min_width) if postprocess_min_width is not None else None
                ),
                postprocess_min_height_width_ratio=(
                    float(postprocess_min_height_width_ratio)
                    if postprocess_min_height_width_ratio is not None
                    else None
                ),
                postprocess_max_height_width_ratio=(
                    float(postprocess_max_height_width_ratio)
                    if postprocess_max_height_width_ratio is not None
                    else None
                ),
                postprocess_max_box_area_fraction=(
                    float(postprocess_max_box_area_fraction)
                    if postprocess_max_box_area_fraction is not None
                    else None
                ),
                postprocess_min_track_length=(
                    int(postprocess_min_track_length) if postprocess_min_track_length is not None else None
                ),
                postprocess_min_track_avg_score=(
                    float(postprocess_min_track_avg_score) if postprocess_min_track_avg_score is not None else None
                ),
                postprocess_min_track_total_score=(
                    float(postprocess_min_track_total_score) if postprocess_min_track_total_score is not None else None
                ),
            )
            eval_inputs.append(
                SequenceEvalInput(
                    name=sequence.name,
                    gt_path=sequence.gt_path,
                    result_path=artifact.result_path,
                    evaluated_frames_path=artifact.frames_path,
                )
            )
            running_summary = evaluate_motchallenge(eval_inputs)
            try:
                signature = None
                if trial is not None:
                    signature = trial.user_attrs.get("signature")
                write_json_summary(
                    run_dir / "summary.partial.json",
                    {
                        "trial_number": trial.number if trial is not None else None,
                        "status": "running",
                        "signature": signature,
                        "tracker_name": tracker_name,
                        "detector_params": detector_params,
                        "tracker_params": tracker_params,
                        "summary": {
                            "mota": float(running_summary.mota),
                            "idf1": float(running_summary.idf1),
                            "precision": float(running_summary.precision),
                            "recall": float(running_summary.recall),
                            "num_switches": int(running_summary.num_switches),
                            "num_false_positives": int(running_summary.num_false_positives),
                            "num_misses": int(running_summary.num_misses),
                            "num_frames": int(running_summary.num_frames),
                        },
                        "per_sequence": running_summary.per_sequence,
                        "completed_sequences": [item.name for item in eval_inputs],
                        "step": int(step_idx),
                        "num_sequences": int(num_sequences),
                    },
                )
            except Exception:
                pass
            if trial is not None:
                prune_floor_mota = self.tuning_cfg.get("prune_floor_mota")
                if prune_floor_mota is not None and step_idx < num_sequences:
                    prune_floor_mode = str(self.tuning_cfg.get("prune_floor_mode") or "partial").strip().lower()
                    if prune_floor_mode == "optimistic_final" and self._total_gt_objects:
                        errors_so_far = int(running_summary.num_false_positives) + int(running_summary.num_misses) + int(
                            running_summary.num_switches
                        )
                        optimistic_final_mota = 1.0 - (float(errors_so_far) / float(self._total_gt_objects))
                        should_prune = float(optimistic_final_mota) < float(prune_floor_mota)
                        prune_reason = (
                            f"Pruned by optimistic-final floor after sequence {sequence.name} with "
                            f"optimistic_final_MOTA={optimistic_final_mota:.4f} < {float(prune_floor_mota):.4f} "
                            f"(errors_so_far={errors_so_far}, total_gt={self._total_gt_objects})"
                        )
                    else:
                        should_prune = float(running_summary.mota) < float(prune_floor_mota)
                        prune_reason = (
                            f"Pruned by floor after sequence {sequence.name} "
                            f"with MOTA={running_summary.mota:.4f} < {float(prune_floor_mota):.4f}"
                        )
                    if should_prune:
                        try:
                            trial.set_user_attr(
                                "partial_summary",
                                {
                                    "mota": running_summary.mota,
                                    "idf1": running_summary.idf1,
                                    "precision": running_summary.precision,
                                    "recall": running_summary.recall,
                                    "num_switches": running_summary.num_switches,
                                    "num_false_positives": running_summary.num_false_positives,
                                    "num_misses": running_summary.num_misses,
                                    "num_frames": running_summary.num_frames,
                                },
                            )
                            trial.set_user_attr("partial_per_sequence", running_summary.per_sequence)
                            if prune_floor_mode == "optimistic_final" and self._total_gt_objects:
                                errors_so_far = (
                                    int(running_summary.num_false_positives)
                                    + int(running_summary.num_misses)
                                    + int(running_summary.num_switches)
                                )
                                optimistic_final_mota = 1.0 - (float(errors_so_far) / float(self._total_gt_objects))
                                trial.set_user_attr(
                                    "partial_optimistic_final_mota",
                                    float(optimistic_final_mota),
                                )
                        except Exception:
                            pass
                        raise optuna.TrialPruned(prune_reason)
                trial.report(float(running_summary.mota), step=step_idx)
                if step_idx < num_sequences and trial.should_prune():
                    try:
                        trial.set_user_attr(
                            "partial_summary",
                            {
                                "mota": running_summary.mota,
                                "idf1": running_summary.idf1,
                                "precision": running_summary.precision,
                                "recall": running_summary.recall,
                                "num_switches": running_summary.num_switches,
                                "num_false_positives": running_summary.num_false_positives,
                                "num_misses": running_summary.num_misses,
                                "num_frames": running_summary.num_frames,
                            },
                        )
                        trial.set_user_attr("partial_per_sequence", running_summary.per_sequence)
                    except Exception:
                        pass
                    raise optuna.TrialPruned(
                        f"Pruned after sequence {sequence.name} with MOTA={running_summary.mota:.4f}"
                    )
        assert running_summary is not None
        return eval_inputs, running_summary

    def objective(self, trial: optuna.trial.Trial) -> float:
        run_dir = self.trials_dir / f"trial_{trial.number:04d}"
        run_dir.mkdir(parents=True, exist_ok=True)
        tracker_name = "unknown"
        detector_params: dict[str, Any] = {}
        tracker_params: dict[str, Any] = {}
        signature = build_config_signature({"trial_number": trial.number, "type": "uninitialized"})
        invalid_prompt_votes_prune: str | None = None
        skip_tracker_prune: str | None = None
        try:
            if self._lock_tracker_params:
                tracker_name = trial.suggest_categorical("tracker_name", [str(self._locked_tracker_name)])
                tracker_params = dict(self._locked_tracker_params or {})
            else:
                tracker_name = trial.suggest_categorical(
                    "tracker_name",
                    list(self.tracking_cfg["tracker_names"]),
                )
            detector_params = sample_detector_params(
                trial,
                self.tuning_cfg["detector_search"],
                has_sam_boxes=bool(self._has_sam_boxes),
            )
            detector_params = self._normalize_detector_params(detector_params)
            if "min_prompt_votes" in detector_params:
                try:
                    min_votes = int(detector_params["min_prompt_votes"])
                except Exception:
                    min_votes = 1
                if min_votes > 1 and int(getattr(self, "_prompt_support_max", 1)) <= 1:
                    invalid_prompt_votes_prune = (
                        f"Unsupported detector.min_prompt_votes={min_votes} "
                        f"(cache prompt_support_counts max={self._prompt_support_max})."
                    )
            if not self._lock_tracker_params:
                tracker_params = sample_tracker_params(
                    trial,
                    tracker_name,
                    tracker_search_cfg=self.tuning_cfg.get("tracker_search"),
                )
            signature = build_trial_signature(
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                detector_cache_signature=self.detector_cache_signature,
                tracking_postprocess=self.tracking_postprocess_signature,
            )
            trial.set_user_attr("signature", signature)
            if tracker_name in self._skip_tracker_names:
                skip_tracker_prune = f"Skipped tracker_name={tracker_name!r} (skip_tracker_names)."
        except Exception as exc:
            signature = build_config_signature(
                {"trial_number": trial.number, "type": "param_sampling_failed", "error": repr(exc)}
            )
            payload = {
                "trial_number": trial.number,
                "status": "failed",
                "tracker_name": tracker_name,
                "detector_params": detector_params,
                "tracker_params": tracker_params,
                "error": repr(exc),
            }
            write_json_summary(run_dir / "summary.json", payload)
            write_trial_report(
                docs_dir=self.docs_dir,
                study_name=self.study_name,
                trial_number=trial.number,
                status="failed",
                tracker_name=str(tracker_name),
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=self._empty_summary(),
                per_sequence={},
                error=repr(exc),
            )
            self._record_history(
                trial_number=trial.number,
                status="failed",
                signature=signature,
                tracker_name=str(tracker_name),
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=self._empty_summary(),
                per_sequence={},
                error=repr(exc),
            )
            raise

        previous = self.known_signatures.get(signature)
        if previous is not None and self._should_skip_duplicate(previous):
            previous_summary = previous.get("summary") or self._empty_summary()
            previous_per_sequence = previous.get("per_sequence") or {}
            payload = {
                "trial_number": trial.number,
                "status": "skipped_duplicate",
                "tracker_name": tracker_name,
                "detector_params": detector_params,
                "tracker_params": tracker_params,
                "summary": previous_summary,
                "per_sequence": previous_per_sequence,
                "duplicate_of": previous.get("signature"),
                "source_trial_number": previous.get("trial_number"),
            }
            write_json_summary(run_dir / "summary.json", payload)
            write_trial_report(
                docs_dir=self.docs_dir,
                study_name=self.study_name,
                trial_number=trial.number,
                status="skipped_duplicate",
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=previous_summary,
                per_sequence=previous_per_sequence,
                error=f"Duplicate signature of prior trial {previous.get('trial_number')}",
            )
            self._record_history(
                trial_number=trial.number,
                status="skipped_duplicate",
                signature=signature,
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=previous_summary,
                per_sequence=previous_per_sequence,
                duplicate_of=str(previous.get("signature") or previous.get("trial_number")),
            )
            return float(previous_summary.get("mota", 0.0))

        try:
            if skip_tracker_prune is not None:
                trial.set_user_attr("prune_reason", str(skip_tracker_prune))
                raise optuna.TrialPruned(str(skip_tracker_prune))
            if invalid_prompt_votes_prune is not None:
                trial.set_user_attr("prune_reason", str(invalid_prompt_votes_prune))
                raise optuna.TrialPruned(str(invalid_prompt_votes_prune))
            if self._max_avg_detections_per_frame > 0.0 and self._guardrail_probe_frames > 0:
                avg_dets = self._estimate_avg_detections_per_frame(detector_params, probe_frames=self._guardrail_probe_frames)
                trial.set_user_attr("avg_detections_per_frame_probe", float(avg_dets))
                if avg_dets > float(self._max_avg_detections_per_frame):
                    raise optuna.TrialPruned(
                        f"Guardrail: avg_detections_per_frame≈{avg_dets:.1f} "
                        f"> {self._max_avg_detections_per_frame:.1f} (probe_frames={self._guardrail_probe_frames})"
                    )
            if (
                self._detector_probe_frames > 0
                and (
                    self._detector_probe_min_precision is not None
                    or self._detector_probe_min_recall is not None
                )
            ):
                precision, recall, f1 = self._estimate_detector_probe_metrics(
                    detector_params,
                    probe_frames=int(self._detector_probe_frames),
                    iou_threshold=float(self._detector_probe_iou_threshold),
                )
                try:
                    trial.set_user_attr(
                        "detector_probe",
                        {
                            "precision": float(precision),
                            "recall": float(recall),
                            "f1": float(f1),
                            "frames": int(self._detector_probe_frames),
                            "iou_threshold": float(self._detector_probe_iou_threshold),
                        },
                    )
                except Exception:
                    pass
                if self._detector_probe_min_precision is not None and float(precision) < float(self._detector_probe_min_precision):
                    raise optuna.TrialPruned(
                        f"Probe: precision={precision:.4f} < {float(self._detector_probe_min_precision):.4f} "
                        f"(frames={int(self._detector_probe_frames)}, iou={float(self._detector_probe_iou_threshold):.2f})"
                    )
                if self._detector_probe_min_recall is not None and float(recall) < float(self._detector_probe_min_recall):
                    raise optuna.TrialPruned(
                        f"Probe: recall={recall:.4f} < {float(self._detector_probe_min_recall):.4f} "
                        f"(frames={int(self._detector_probe_frames)}, iou={float(self._detector_probe_iou_threshold):.2f})"
                    )
            _, summary = self._build_eval_inputs(
                trial=trial,
                tracker_name=tracker_name,
                tracker_params=tracker_params,
                detector_params=detector_params,
                run_dir=run_dir,
            )
            payload = {
                "trial_number": trial.number,
                "status": "completed",
                "tracker_name": tracker_name,
                "detector_params": detector_params,
                "tracker_params": tracker_params,
                "summary": {
                    "mota": summary.mota,
                    "idf1": summary.idf1,
                    "precision": summary.precision,
                    "recall": summary.recall,
                    "num_switches": summary.num_switches,
                    "num_false_positives": summary.num_false_positives,
                    "num_misses": summary.num_misses,
                    "num_frames": summary.num_frames,
                },
                "per_sequence": summary.per_sequence,
            }
            write_json_summary(run_dir / "summary.json", payload)
            write_trial_report(
                docs_dir=self.docs_dir,
                study_name=self.study_name,
                trial_number=trial.number,
                status="completed",
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=payload["summary"],
                per_sequence=summary.per_sequence,
            )
            self._record_history(
                trial_number=trial.number,
                status="completed",
                signature=signature,
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=payload["summary"],
                per_sequence=summary.per_sequence,
            )
            trial.set_user_attr("tracker_name", tracker_name)
            trial.set_user_attr("run_dir", str(run_dir))
            return float(summary.mota)
        except KeyboardInterrupt as exc:
            payload = {
                "trial_number": trial.number,
                "status": "failed",
                "tracker_name": tracker_name,
                "detector_params": detector_params,
                "tracker_params": tracker_params,
                "error": repr(exc),
            }
            write_json_summary(run_dir / "summary.json", payload)
            write_trial_report(
                docs_dir=self.docs_dir,
                study_name=self.study_name,
                trial_number=trial.number,
                status="failed",
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=self._empty_summary(),
                per_sequence={},
                error=repr(exc),
            )
            self._record_history(
                trial_number=trial.number,
                status="failed",
                signature=signature,
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=self._empty_summary(),
                per_sequence={},
                error=repr(exc),
            )
            raise
        except optuna.TrialPruned as exc:
            partial_summary = None
            partial_per_sequence = None
            try:
                partial_summary = trial.user_attrs.get("partial_summary")
                partial_per_sequence = trial.user_attrs.get("partial_per_sequence")
            except Exception:
                partial_summary = None
                partial_per_sequence = None
            summary_payload = partial_summary or self._empty_summary()
            per_sequence_payload = partial_per_sequence or {}
            payload = {
                "trial_number": trial.number,
                "status": "pruned",
                "tracker_name": tracker_name,
                "detector_params": detector_params,
                "tracker_params": tracker_params,
                "summary": summary_payload,
                "per_sequence": per_sequence_payload,
                "error": repr(exc),
            }
            write_json_summary(run_dir / "summary.json", payload)
            write_trial_report(
                docs_dir=self.docs_dir,
                study_name=self.study_name,
                trial_number=trial.number,
                status="pruned",
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=summary_payload,
                per_sequence=per_sequence_payload,
                error=repr(exc),
            )
            self._record_history(
                trial_number=trial.number,
                status="pruned",
                signature=signature,
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=summary_payload,
                per_sequence=per_sequence_payload,
                error=repr(exc),
            )
            raise
        except Exception as exc:
            payload = {
                "trial_number": trial.number,
                "status": "failed",
                "tracker_name": tracker_name,
                "detector_params": detector_params,
                "tracker_params": tracker_params,
                "error": repr(exc),
            }
            write_json_summary(run_dir / "summary.json", payload)
            write_trial_report(
                docs_dir=self.docs_dir,
                study_name=self.study_name,
                trial_number=trial.number,
                status="failed",
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=self._empty_summary(),
                per_sequence={},
                error=repr(exc),
            )
            self._record_history(
                trial_number=trial.number,
                status="failed",
                signature=signature,
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=self._empty_summary(),
                per_sequence={},
                error=repr(exc),
            )
            raise

    def run(
        self,
        *,
        n_trials: int | None = None,
        timeout_hours: float | None = None,
        enqueue_summaries: list[str | Path] | None = None,
        wait_lock_seconds: float | None = None,
        wait_lock_poll_seconds: float | None = None,
    ):
        storage = self.tuning_cfg["storage"]
        storage_path = storage.replace("sqlite:///", "/")
        storage_db_path = Path(storage_path).expanduser().resolve()
        ensure_dir(storage_db_path.parent)
        if storage_db_path.suffix:
            lock_path = storage_db_path.with_suffix(storage_db_path.suffix + ".lock")
        else:
            lock_path = Path(str(storage_db_path) + ".lock")

        pruner = optuna.pruners.MedianPruner() if self.tuning_cfg.get("prune", True) else optuna.pruners.NopPruner()
        
        
        
        
        
        global_lock_path = self.artifact_root / "tune.lock"
        wait_seconds = float(wait_lock_seconds or 0.0) if wait_lock_seconds is not None else float(
            self.tuning_cfg.get("wait_lock_seconds") or 0.0
        )
        poll_seconds = float(wait_lock_poll_seconds or 5.0) if wait_lock_poll_seconds is not None else float(
            self.tuning_cfg.get("wait_lock_poll_seconds") or 5.0
        )
        use_wait = wait_seconds > 0.0

        with ExitStack() as stack:
            if use_wait:
                stack.enter_context(
                    exclusive_file_lock_wait(global_lock_path, timeout_seconds=wait_seconds, poll_seconds=poll_seconds)
                )
                stack.enter_context(
                    exclusive_file_lock_wait(lock_path, timeout_seconds=wait_seconds, poll_seconds=poll_seconds)
                )
            else:
                stack.enter_context(exclusive_file_lock(global_lock_path))
                stack.enter_context(exclusive_file_lock(lock_path))

            study = optuna.create_study(
                study_name=self.study_name,
                storage=storage,
                direction="maximize",
                load_if_exists=True,
                sampler=optuna.samplers.TPESampler(
                    seed=int(self.tuning_cfg.get("sampler_seed", 42)),
                    n_startup_trials=int(self.tuning_cfg.get("tpe_startup_trials", 10)),
                ),
                pruner=pruner,
            )

            for seed in enqueue_summaries or self.tuning_cfg.get("enqueue_summaries", []):
                self._enqueue_from_summary(study, Path(seed).expanduser().resolve())

            
            
            
            self._repair_stale_running_trials(study)

            
            
            
            
            
            
            sampler_seed = int(self.tuning_cfg.get("sampler_seed", 42))
            tpe_startup_trials = int(self.tuning_cfg.get("tpe_startup_trials", 10))
            finished_trials = sum(1 for t in study.trials if t.state.is_finished())
            if finished_trials > 0:
                study.sampler = optuna.samplers.TPESampler(
                    seed=sampler_seed + finished_trials,
                    n_startup_trials=tpe_startup_trials,
                )

            
            
            self._backfill_known_signatures_from_optuna(study)

            target_mota = float(self.tuning_cfg["target_mota"])

            def stop_on_target(search_study: optuna.study.Study, _trial: optuna.trial.FrozenTrial) -> None:
                try:
                    best_value = search_study.best_value
                except ValueError:
                    return
                if best_value is not None and float(best_value) >= target_mota:
                    search_study.stop()

            resolved_trials = int(self.tuning_cfg["n_trials"]) if n_trials is None else int(n_trials)
            resolved_timeout_hours = (
                float(self.tuning_cfg["timeout_hours"]) if timeout_hours is None else float(timeout_hours)
            )
            study.optimize(
                self.objective,
                n_trials=resolved_trials,
                timeout=int(resolved_timeout_hours * 3600),
                callbacks=[stop_on_target],
                catch=(Exception,),
            )
            return study
