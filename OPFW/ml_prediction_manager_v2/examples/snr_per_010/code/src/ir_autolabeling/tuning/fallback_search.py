from __future__ import annotations

import hashlib
import json
import os
import random
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ir_autolabeling.data.mot20 import iter_frame_paths, load_mot20_sequences
from ir_autolabeling.eval.mot import MOTSummary, SequenceEvalInput, evaluate_motchallenge
from ir_autolabeling.reporting.experiment_logger import (
    append_iteration_journal,
    append_trial_ledger,
    build_config_signature,
    build_trial_signature,
    canonicalize_trial_ledger,
    load_trial_ledger,
    write_json_summary,
    write_trial_report,
)
from ir_autolabeling.tracking.boxmot_adapter import run_tracker_on_sequence
from ir_autolabeling.tuning.search_space import sample_detector_params, sample_tracker_params
from ir_autolabeling.utils.config import ensure_dir
from ir_autolabeling.utils.io import hash_jsonl_frame_window, inspect_jsonl_frame_sequence


class TrialPruned(Exception):
    def __init__(self, message: str, *, partial_summary: MOTSummary | None = None):
        super().__init__(message)
        self.partial_summary = partial_summary


@dataclass(frozen=True)
class RandomSearchResult:
    best_trial_number: int | None
    best_value: float | None


class _RandomTrial:
    def __init__(self, number: int, rng: random.Random):
        self.number = int(number)
        self._rng = rng
        self.params: dict[str, Any] = {}
        self.user_attrs: dict[str, Any] = {}
        self._reports: list[tuple[int, float]] = []

    def suggest_categorical(self, name: str, choices: list[Any]) -> Any:
        if name in self.params:
            return self.params[name]
        if not choices:
            raise ValueError(f"No choices provided for {name}")
        value = self._rng.choice(list(choices))
        self.params[name] = value
        return value

    def suggest_float(self, name: str, low: float, high: float, *, log: bool = False) -> float:
        if name in self.params:
            return float(self.params[name])
        low = float(low)
        high = float(high)
        if low > high:
            raise ValueError(f"Invalid range for {name}: low={low}, high={high}")
        if log:
            if low <= 0 or high <= 0:
                raise ValueError(f"Log-uniform requires positive bounds for {name}: low={low}, high={high}")
            value = float(low * (high / low) ** self._rng.random())
        else:
            value = float(low + (high - low) * self._rng.random())
        self.params[name] = value
        return value

    def suggest_int(self, name: str, low: int, high: int, *, step: int = 1) -> int:
        if name in self.params:
            return int(self.params[name])
        low = int(low)
        high = int(high)
        step = max(1, int(step))
        if low > high:
            raise ValueError(f"Invalid range for {name}: low={low}, high={high}")
        values = list(range(low, high + 1, step))
        value = int(self._rng.choice(values))
        self.params[name] = value
        return value

    def set_user_attr(self, name: str, value: Any) -> None:
        self.user_attrs[str(name)] = value

    def report(self, value: float, *, step: int) -> None:
        self._reports.append((int(step), float(value)))

    def should_prune(self) -> bool:
        return False


class FallbackSearchRunner:
    pass

    def __init__(self, project_cfg: dict[str, Any]):
        self.project_cfg = project_cfg
        self.paths_cfg = project_cfg["paths"]
        self.dataset_cfg = project_cfg["dataset"]
        self.tracking_cfg = project_cfg["tracking"]
        self.tuning_cfg = project_cfg["tuning"]
        self.eval_version = self.tuning_cfg.get("eval_version")

        self.artifact_root = ensure_dir(self.paths_cfg["artifact_root"])
        self.docs_dir = ensure_dir(self.paths_cfg["docs_experiments_dir"])
        base_study_name = str(self.tuning_cfg["study_name"])

        self.cache_dir = self.artifact_root / "detections" / project_cfg["detector"]["cache_tag"]
        self.sequences = load_mot20_sequences(
            self.paths_cfg["dataset_root"],
            split=self.dataset_cfg["split"],
            sequence_names=self.dataset_cfg.get("sequences"),
        )
        self._sequence_by_name = {sequence.name: sequence for sequence in self.sequences}

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
                }
            )
            study_name = f"{study_name}_{search_space_signature}"
        self.study_name = study_name

        self.trials_dir = self.artifact_root / "trials" / self.study_name
        self.trials_dir.mkdir(parents=True, exist_ok=True)
        self.ledger_path = self.artifact_root / "trial_ledger.jsonl"
        self.journal_path = ensure_dir(self.docs_dir) / "EXP-003-optimization-journal.md"
        self._sampler_seed = int(self.tuning_cfg.get("sampler_seed", 42))

        postprocess_cfg = dict(self.tracking_cfg.get("postprocess") or {})
        interpolate_max_gap = int(postprocess_cfg.get("interpolate_max_gap", 0) or 0)
        interpolate_min_endpoint_score = postprocess_cfg.get("interpolate_min_endpoint_score")
        interpolate_min_endpoint_iou = postprocess_cfg.get("interpolate_min_endpoint_iou")
        self.tracking_postprocess_signature: dict[str, Any] = {}
        if self.eval_version is not None:
            self.tracking_postprocess_signature["eval_version"] = self.eval_version
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

        self._prompt_support_max = self._estimate_prompt_support_max(probe_frames=10)

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
        self._best_mota_so_far = self._scan_best_mota_for_study()
        fallback_cfg = self.tuning_cfg.get("fallback") or {}
        self._fallback_local_prob = float(fallback_cfg.get("local_search_probability", 0.0) or 0.0)
        self._fallback_jitter_fraction = float(fallback_cfg.get("jitter_fraction", 0.15) or 0.15)
        self._fallback_lock_tracker = bool(fallback_cfg.get("lock_tracker_params", False))
        self._fallback_lock_detector_extras = bool(fallback_cfg.get("lock_detector_extras", True))
        self._fallback_prune_delta = float(fallback_cfg.get("prune_delta", 0.20) or 0.20)
        self._fallback_prune_min_step = int(fallback_cfg.get("prune_min_step", 2) or 2)
        self._fallback_prune_min_mota = float(fallback_cfg.get("prune_min_mota", 0.05) or 0.05)

    def _trial_rng(self, trial_number: int) -> random.Random:
        pass
        material = f"{self._sampler_seed}:{self.study_name}:{int(trial_number)}".encode("utf-8")
        digest = hashlib.sha256(material).digest()
        seed = int.from_bytes(digest[:8], byteorder="big", signed=False)
        return random.Random(seed)

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
                    try:
                        payload = json.loads(line)
                    except Exception:
                        continue
                    counts = payload.get("prompt_support_counts") or []
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
    def _clamp(value: float, low: float, high: float) -> float:
        return float(min(float(high), max(float(low), float(value))))

    def _jitter_float(self, rng: random.Random, value: float, low: float, high: float, *, log: bool = False) -> float:
        frac = max(0.0, float(self._fallback_jitter_fraction))
        low_f = float(low)
        high_f = float(high)
        if log and value > 0 and low_f > 0 and high_f > 0:
            scale = (high_f / low_f) ** frac
            jitter = rng.uniform(1.0 / scale, scale)
            return self._clamp(float(value) * float(jitter), low_f, high_f)
        span = max(0.0, high_f - low_f)
        jitter = rng.uniform(-frac * span, frac * span)
        return self._clamp(float(value) + float(jitter), low_f, high_f)

    def _prefill_local_trial(self, trial: _RandomTrial) -> None:
        if self._fallback_local_prob <= 0.0:
            return
        if not self.ledger_path.exists():
            return
        if trial._rng.random() >= float(self._fallback_local_prob):
            return

        best_payload: dict[str, Any] | None = None
        best_mota = -1e9
        for line in self.ledger_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            payload = json.loads(line)
            if payload.get("study_name") != self.study_name:
                continue
            summary = payload.get("summary") or {}
            mota = summary.get("mota")
            if mota is None:
                continue
            try:
                mota_f = float(mota)
            except Exception:
                continue
            if mota_f > best_mota:
                best_mota = mota_f
                best_payload = payload

        if not best_payload:
            return

        tracker_name = str(best_payload.get("tracker_name") or "")
        if tracker_name:
            trial.params["tracker_name"] = tracker_name

        detector_params = dict(best_payload.get("detector_params") or {})
        tracker_params = dict(best_payload.get("tracker_params") or {})

        detector_search_cfg = dict(self.tuning_cfg.get("detector_search") or {})
        min_area_cfg = detector_search_cfg.get("min_box_area") or {}
        log_area = bool(min_area_cfg.get("log", False))

        def jitter_key(param_key: str, suggest_name: str, cfg_key: str, *, log: bool = False) -> None:
            if param_key not in detector_params:
                return
            cfg = detector_search_cfg.get(cfg_key) or {}
            if "low" not in cfg or "high" not in cfg:
                return
            trial.params[suggest_name] = self._jitter_float(
                trial._rng,
                float(detector_params[param_key]),
                float(cfg["low"]),
                float(cfg["high"]),
                log=log,
            )

        if "box_source" in detector_params:
            trial.params["detector.box_source"] = detector_params["box_source"]
        jitter_key("score_threshold", "detector.score_threshold", "score_threshold")
        jitter_key("nms_iou_threshold", "detector.nms_iou_threshold", "nms_iou_threshold")
        jitter_key("min_box_area", "detector.min_box_area", "min_box_area", log=log_area)
        jitter_key("min_height", "detector.min_height", "min_height")
        jitter_key("min_width", "detector.min_width", "min_width")
        jitter_key("min_height_width_ratio", "detector.min_height_width_ratio", "min_height_width_ratio")
        jitter_key("max_height_width_ratio", "detector.max_height_width_ratio", "max_height_width_ratio")

        top_k_options = list(detector_search_cfg.get("top_k") or [])
        if top_k_options and "top_k" in detector_params and detector_params["top_k"] in top_k_options:
            trial.params["detector.top_k"] = detector_params["top_k"]

        rescue_cfg = detector_search_cfg.get("small_box_rescue")
        if rescue_cfg is not None and "detector.enable_rescue" not in trial.params:
            has_rescue = any(k.startswith("rescue_") for k in detector_params)
            trial.params["detector.enable_rescue"] = bool(has_rescue) if self._fallback_lock_detector_extras else bool(
                trial._rng.choice([False, True])
            )
        upper_cfg = detector_search_cfg.get("upper_zone")
        if upper_cfg is not None and "detector.enable_upper_zone" not in trial.params:
            has_upper = any(k.startswith("upper_zone_") for k in detector_params)
            trial.params["detector.enable_upper_zone"] = bool(has_upper) if self._fallback_lock_detector_extras else bool(
                trial._rng.choice([False, True])
            )
        score_cal_cfg = detector_search_cfg.get("score_calibration")
        if score_cal_cfg is not None and "detector.enable_score_calibration" not in trial.params:
            has_score_cal = any(
                k
                in detector_params
                for k in [
                    "min_prompt_votes",
                    "prompt_support_weight",
                    "aspect_ratio_target",
                    "aspect_ratio_tolerance",
                    "aspect_ratio_score_bonus",
                    "small_box_area_threshold",
                    "small_box_score_bonus",
                    "upper_zone_small_box_bonus",
                ]
            )
            trial.params["detector.enable_score_calibration"] = bool(has_score_cal) if self._fallback_lock_detector_extras else bool(
                trial._rng.choice([False, True])
            )

        if self._fallback_lock_tracker and tracker_name:
            tracker_search_cfg = (self.tuning_cfg.get("tracker_search") or {}).get(tracker_name) or {}

            for key, value in tracker_params.items():
                spec = tracker_search_cfg.get(key)
                if not isinstance(spec, dict):
                    continue
                spec_type = str(spec.get("type") or "").strip().lower()

                clamped: Any = value
                if spec_type == "choice":
                    options = list(spec.get("options") or [])
                    if not options:
                        continue
                    clamped = value if value in options else options[0]
                elif spec_type == "uniform":
                    bounds = list(spec.get("range") or [])
                    if len(bounds) != 2:
                        continue
                    try:
                        clamped = self._clamp(float(value), float(bounds[0]), float(bounds[1]))
                    except Exception:
                        clamped = float(bounds[0])
                elif spec_type == "randint":
                    bounds = list(spec.get("range") or [])
                    if len(bounds) != 2:
                        continue
                    try:
                        lo = int(bounds[0])
                        hi = int(bounds[1])
                        clamped = int(min(hi, max(lo, int(value))))
                    except Exception:
                        clamped = int(bounds[0])

                trial.params[f"tracker.{tracker_name}.{key}"] = clamped

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

    def _scan_best_mota_for_study(self) -> float:
        if not self.ledger_path.exists():
            return 0.0
        best = 0.0
        for line in self.ledger_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            payload = json.loads(line)
            if payload.get("study_name") != self.study_name:
                continue
            if payload.get("status") != "completed":
                continue
            summary = payload.get("summary") or {}
            mota = summary.get("mota")
            if mota is None:
                continue
            best = max(best, float(mota))
        return best

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
            "trial_number": int(trial_number),
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
            trial_number=int(trial_number),
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
        tracker_name: str,
        tracker_params: dict[str, Any],
        detector_params: dict[str, Any],
        run_dir: Path,
        enable_prune: bool,
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
            if enable_prune and step_idx < num_sequences:
                min_step = max(1, int(self._fallback_prune_min_step))
                if step_idx >= min_step:
                    threshold = max(
                        float(self._fallback_prune_min_mota),
                        float(self._best_mota_so_far) - float(self._fallback_prune_delta),
                    )
                    if float(running_summary.mota) < float(threshold):
                        raise TrialPruned(
                            f"Pruned after sequence {sequence.name} with MOTA={running_summary.mota:.4f}",
                            partial_summary=running_summary,
                        )
        assert running_summary is not None
        return eval_inputs, running_summary

    def _next_trial_number(self) -> int:
        if not self.ledger_path.exists():
            return 0
        max_n = -1
        for line in self.ledger_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            payload = json.loads(line)
            if payload.get("study_name") != self.study_name:
                continue
            try:
                max_n = max(max_n, int(payload.get("trial_number", -1)))
            except Exception:
                continue
        return max_n + 1

    def objective(self, trial: _RandomTrial) -> float:
        run_dir = self.trials_dir / f"trial_{trial.number:04d}"
        run_dir.mkdir(parents=True, exist_ok=True)
        tracker_name = "unknown"
        detector_params: dict[str, Any] = {}
        tracker_params: dict[str, Any] = {}
        signature = build_config_signature({"trial_number": trial.number, "type": "uninitialized"})
        invalid_prompt_votes_prune: str | None = None
        try:
            self._prefill_local_trial(trial)
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
            tracker_params = sample_tracker_params(
                trial,
                tracker_name,
                tracker_search_cfg=self.tuning_cfg.get("tracker_search"),
            )
            if str(tracker_name) == "sfsort":
                tracker_params.pop("det_thresh", None)
            signature = build_trial_signature(
                tracker_name=str(tracker_name),
                detector_params=detector_params,
                tracker_params=tracker_params,
                detector_cache_signature=self.detector_cache_signature,
                tracking_postprocess=self.tracking_postprocess_signature,
            )
            trial.set_user_attr("signature", signature)
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
        if previous is not None:
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
                error=f"duplicate_of={previous.get('signature')}",
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
                error=None,
                duplicate_of=str(previous.get("signature") or ""),
            )
            try:
                self._best_mota_so_far = max(self._best_mota_so_far, float(previous_summary.get("mota") or 0.0))
            except Exception:
                pass
            return float(previous_summary.get("mota") or 0.0)

        try:
            if invalid_prompt_votes_prune is not None:
                trial.set_user_attr("prune_reason", str(invalid_prompt_votes_prune))
                raise TrialPruned(str(invalid_prompt_votes_prune))
            _eval_inputs, summary = self._build_eval_inputs(
                tracker_name=tracker_name,
                tracker_params=tracker_params,
                detector_params=detector_params,
                run_dir=run_dir,
                enable_prune=bool(self.tuning_cfg.get("prune", True)),
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
            self._best_mota_so_far = max(self._best_mota_so_far, float(summary.mota))
            return float(summary.mota)
        except TrialPruned as exc:
            summary_payload = (
                {
                    "mota": exc.partial_summary.mota,
                    "idf1": exc.partial_summary.idf1,
                    "precision": exc.partial_summary.precision,
                    "recall": exc.partial_summary.recall,
                    "num_switches": exc.partial_summary.num_switches,
                    "num_false_positives": exc.partial_summary.num_false_positives,
                    "num_misses": exc.partial_summary.num_misses,
                    "num_frames": exc.partial_summary.num_frames,
                }
                if getattr(exc, "partial_summary", None) is not None
                else self._empty_summary()
            )
            per_sequence_payload = (
                (exc.partial_summary.per_sequence if getattr(exc, "partial_summary", None) is not None else {})
            )
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
    ) -> RandomSearchResult:
        
        target_mota = float(self.tuning_cfg.get("target_mota", 1.0))
        max_trials = int(n_trials or int(self.tuning_cfg.get("n_trials", 10)))
        timeout_seconds = float((timeout_hours or float(self.tuning_cfg.get("timeout_hours", 1.0))) * 3600.0)
        deadline = time.time() + timeout_seconds if timeout_seconds > 0 else None

        best_trial_number: int | None = None
        best_value: float | None = None

        def _deadline_reached() -> bool:
            return bool(deadline is not None and time.time() >= deadline)

        start_trial = self._next_trial_number()
        next_trial_number = int(start_trial)

        
        seeds: list[Path] = []
        for seed in list(enqueue_summaries or self.tuning_cfg.get("enqueue_summaries", [])):
            try:
                seeds.append(Path(seed).expanduser().resolve())
            except Exception:
                continue

        for seed_path in seeds:
            if _deadline_reached() or next_trial_number >= start_trial + max_trials:
                break
            value = self._run_enqueued_summary(trial_number=next_trial_number, summary_path=seed_path)
            if best_value is None or float(value) > float(best_value):
                best_value = float(value)
                best_trial_number = int(next_trial_number)
            if best_value is not None and float(best_value) >= target_mota:
                break
            next_trial_number += 1

        while next_trial_number < start_trial + max_trials:
            if deadline is not None and time.time() >= deadline:
                break
            trial_number = int(next_trial_number)
            trial = _RandomTrial(trial_number, self._trial_rng(trial_number))
            try:
                value = self.objective(trial)
            except TrialPruned:
                next_trial_number += 1
                continue
            except Exception:
                next_trial_number += 1
                continue

            if best_value is None or float(value) > float(best_value):
                best_value = float(value)
                best_trial_number = int(trial_number)
            if best_value is not None and float(best_value) >= target_mota:
                break
            next_trial_number += 1

        return RandomSearchResult(best_trial_number=best_trial_number, best_value=best_value)

    @staticmethod
    def _extract_config_from_summary(payload: dict[str, Any]) -> tuple[str, dict[str, Any], dict[str, Any]]:
        tracker_name = str(payload.get("tracker_name") or "unknown")
        detector_params = dict(payload.get("detector_params") or {})
        tracker_params = dict(payload.get("tracker_params") or {})
        return tracker_name, detector_params, tracker_params

    def _run_enqueued_summary(self, *, trial_number: int, summary_path: Path) -> float:
        run_dir = self.trials_dir / f"trial_{int(trial_number):04d}"
        run_dir.mkdir(parents=True, exist_ok=True)

        try:
            payload = json.loads(summary_path.read_text(encoding="utf-8"))
        except Exception as exc:
            tracker_name = "unknown"
            detector_params: dict[str, Any] = {}
            tracker_params: dict[str, Any] = {}
            signature = build_config_signature(
                {
                    "trial_number": int(trial_number),
                    "type": "enqueue_read_failed",
                    "path": str(summary_path),
                    "error": repr(exc),
                }
            )
            write_json_summary(
                run_dir / "summary.json",
                {
                    "trial_number": int(trial_number),
                    "status": "failed",
                    "tracker_name": tracker_name,
                    "detector_params": detector_params,
                    "tracker_params": tracker_params,
                    "error": repr(exc),
                },
            )
            write_trial_report(
                docs_dir=self.docs_dir,
                study_name=self.study_name,
                trial_number=int(trial_number),
                status="failed",
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=self._empty_summary(),
                per_sequence={},
                error=repr(exc),
            )
            self._record_history(
                trial_number=int(trial_number),
                status="failed",
                signature=signature,
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=self._empty_summary(),
                per_sequence={},
                error=repr(exc),
            )
            return 0.0

        tracker_name, detector_params, tracker_params = self._extract_config_from_summary(payload)
        detector_params = self._normalize_detector_params(detector_params)
        if tracker_name == "sfsort":
            tracker_params.pop("det_thresh", None)

        signature = build_trial_signature(
            tracker_name=str(tracker_name),
            detector_params=detector_params,
            tracker_params=tracker_params,
            detector_cache_signature=self.detector_cache_signature,
            tracking_postprocess=self.tracking_postprocess_signature,
        )

        previous = self.known_signatures.get(signature)
        if previous is not None:
            previous_summary = previous.get("summary") or self._empty_summary()
            previous_per_sequence = previous.get("per_sequence") or {}
            write_json_summary(
                run_dir / "summary.json",
                {
                    "trial_number": int(trial_number),
                    "status": "skipped_duplicate",
                    "tracker_name": tracker_name,
                    "detector_params": detector_params,
                    "tracker_params": tracker_params,
                    "summary": previous_summary,
                    "per_sequence": previous_per_sequence,
                    "duplicate_of": previous.get("signature"),
                    "source_trial_number": previous.get("trial_number"),
                    "source_summary": str(summary_path),
                },
            )
            write_trial_report(
                docs_dir=self.docs_dir,
                study_name=self.study_name,
                trial_number=int(trial_number),
                status="skipped_duplicate",
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=previous_summary,
                per_sequence=previous_per_sequence,
                error=f"duplicate_of={previous.get('signature')}",
            )
            self._record_history(
                trial_number=int(trial_number),
                status="skipped_duplicate",
                signature=signature,
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=previous_summary,
                per_sequence=previous_per_sequence,
                duplicate_of=str(previous.get("signature") or ""),
            )
            try:
                self._best_mota_so_far = max(self._best_mota_so_far, float(previous_summary.get("mota") or 0.0))
            except Exception:
                pass
            return float(previous_summary.get("mota") or 0.0)

        try:
            _eval_inputs, summary = self._build_eval_inputs(
                tracker_name=tracker_name,
                tracker_params=tracker_params,
                detector_params=detector_params,
                run_dir=run_dir,
                enable_prune=False,
            )
            completed_payload = {
                "trial_number": int(trial_number),
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
                "source_summary": str(summary_path),
            }
            write_json_summary(run_dir / "summary.json", completed_payload)
            write_trial_report(
                docs_dir=self.docs_dir,
                study_name=self.study_name,
                trial_number=int(trial_number),
                status="completed",
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=completed_payload["summary"],
                per_sequence=summary.per_sequence,
                error=None,
            )
            self._record_history(
                trial_number=int(trial_number),
                status="completed",
                signature=signature,
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=completed_payload["summary"],
                per_sequence=summary.per_sequence,
            )
            self._best_mota_so_far = max(self._best_mota_so_far, float(summary.mota))
            return float(summary.mota)
        except Exception as exc:
            write_json_summary(
                run_dir / "summary.json",
                {
                    "trial_number": int(trial_number),
                    "status": "failed",
                    "tracker_name": tracker_name,
                    "detector_params": detector_params,
                    "tracker_params": tracker_params,
                    "error": repr(exc),
                    "source_summary": str(summary_path),
                },
            )
            write_trial_report(
                docs_dir=self.docs_dir,
                study_name=self.study_name,
                trial_number=int(trial_number),
                status="failed",
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=self._empty_summary(),
                per_sequence={},
                error=repr(exc),
            )
            self._record_history(
                trial_number=int(trial_number),
                status="failed",
                signature=signature,
                tracker_name=tracker_name,
                detector_params=detector_params,
                tracker_params=tracker_params,
                summary=self._empty_summary(),
                per_sequence={},
                error=repr(exc),
            )
            return 0.0
