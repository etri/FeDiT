from __future__ import annotations

import contextlib
import importlib.util
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import numpy as np
import pandas as pd

from ir_autolabeling.data.mot20 import load_mot20_sequences
from ir_autolabeling.eval.mot import MOTSummary, SequenceEvalInput, evaluate_motchallenge
from ir_autolabeling.utils.config import ensure_dir


DEFAULT_FASTTRACKER_CONFIG: dict[str, Any] = {
    "track_thresh": 0.6,
    "track_buffer": 30,
    "match_thresh": 0.7,
    "min_box_area": 100,
    "reset_velocity_offset_occ": 5,
    "reset_pos_offset_occ": 3,
    "enlarge_bbox_occ": 1.2,
    "dampen_motion_occ": 0.85,
    "active_occ_to_lost_thresh": 15,
    "init_iou_suppress": 0.8,
    "ROIs": {},
}


@dataclass(slots=True)
class FastTrackerVariantResult:
    variant_name: str
    result_dir: Path
    tracker_config: dict[str, Any]
    apply_gsi: bool
    summary: MOTSummary


def _load_fasttracker_modules(repo_root: Path) -> tuple[Any, Any]:
    repo_root = repo_root.expanduser().resolve()
    if not repo_root.exists():
        raise FileNotFoundError(f"FastTracker repo not found: {repo_root}")
    repo_root_str = str(repo_root)
    if repo_root_str not in sys.path:
        sys.path.insert(0, repo_root_str)

    from yolox.tracker.fasttracker import Fasttracker  
    from yolox.tracker.basetrack import BaseTrack  

    return Fasttracker, BaseTrack


def _load_gsi_module(repo_root: Path) -> Any:
    gsi_path = repo_root / "tools" / "GSI.py"
    spec = importlib.util.spec_from_file_location("fasttracker_gsi", gsi_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load GSI module from {gsi_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _read_tracker_config(variant: dict[str, Any]) -> dict[str, Any]:
    tracker_config = dict(DEFAULT_FASTTRACKER_CONFIG)

    config_json = variant.get("tracker_config_json")
    if config_json:
        tracker_config.update(json.loads(Path(config_json).expanduser().resolve().read_text(encoding="utf-8")))

    inline_config = variant.get("tracker_config") or {}
    tracker_config.update(inline_config)

    if variant.get("strip_rois", False):
        tracker_config["ROIs"] = {}

    return tracker_config


def _group_public_detections_by_frame(det_path: Path) -> dict[int, np.ndarray]:
    frame = pd.read_csv(det_path, header=None)
    if frame.empty:
        return {}

    frame = frame.iloc[:, :7].copy()
    frame.columns = ["frame", "track_id", "x", "y", "w", "h", "score"]
    grouped: dict[int, np.ndarray] = {}
    for frame_idx, group in frame.groupby("frame", sort=True):
        values = group[["x", "y", "w", "h", "score"]].to_numpy(dtype=np.float64, copy=True)
        values[:, 2] = values[:, 0] + values[:, 2]
        values[:, 3] = values[:, 1] + values[:, 3]
        grouped[int(frame_idx)] = values
    return grouped


def _write_results(path: Path, rows: list[list[float]]) -> None:
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    pd.DataFrame(rows).to_csv(path, header=False, index=False)


def _run_fasttracker_variant(
    cfg: dict[str, Any],
    variant: dict[str, Any],
) -> FastTrackerVariantResult:
    paths = cfg["paths"]
    dataset_cfg = cfg["dataset"]
    repo_root = Path(paths["fasttracker_repo_root"]).expanduser().resolve()
    output_root = ensure_dir(Path(paths["artifact_root"]).expanduser().resolve() / "legacy_reproductions" / "fasttracker_public")

    Fasttracker, BaseTrack = _load_fasttracker_modules(repo_root)
    tracker_config = _read_tracker_config(variant)
    variant_name = variant["name"]
    result_dir = ensure_dir(output_root / variant_name / "tracks")
    sequences = load_mot20_sequences(
        paths["dataset_root"],
        split=dataset_cfg.get("split", "train"),
        sequence_names=dataset_cfg.get("sequences"),
    )
    max_frames = dataset_cfg.get("max_frames_per_sequence")

    for sequence in sequences:
        BaseTrack._count = 0
        detections_by_frame = _group_public_detections_by_frame(sequence.root / "det" / "det.txt")
        result_rows: list[list[float]] = []
        last_frame = sequence.seq_length if max_frames is None else min(sequence.seq_length, int(max_frames))
        with Path(os.devnull).open("w", encoding="utf-8") as devnull:
            with contextlib.redirect_stdout(devnull):
                tracker = Fasttracker(
                    SimpleNamespace(mot20=bool(variant.get("mot20", True))),
                    tracker_config,
                    frame_rate=sequence.frame_rate,
                )

                for frame_idx in range(1, last_frame + 1):
                    detections = detections_by_frame.get(frame_idx)
                    if detections is None:
                        detections = np.zeros((0, 5), dtype=np.float64)

                    online_targets = tracker.update(
                        detections,
                        (sequence.height, sequence.width),
                        (sequence.height, sequence.width),
                    )
                    for target in online_targets:
                        tlwh = target.tlwh
                        if float(tlwh[2] * tlwh[3]) <= float(tracker_config["min_box_area"]):
                            continue
                        vertical = float(tlwh[2]) / max(1e-6, float(tlwh[3])) > 1.6
                        if vertical:
                            continue
                        result_rows.append(
                            [
                                frame_idx,
                                int(target.track_id),
                                float(tlwh[0]),
                                float(tlwh[1]),
                                float(tlwh[2]),
                                float(tlwh[3]),
                                float(target.score),
                                -1,
                                -1,
                                -1,
                            ]
                        )

        _write_results(result_dir / f"{sequence.name}.txt", result_rows)

    apply_gsi = bool(variant.get("apply_gsi", False))
    eval_dir = result_dir
    if apply_gsi:
        gsi_dir = ensure_dir(output_root / variant_name / "tracks_gsi")
        gsi_module = _load_gsi_module(repo_root)
        for result_path in sorted(result_dir.glob("*.txt")):
            gsi_module.GSInterpolation(
                path_in=str(result_path),
                path_out=str(gsi_dir / result_path.name),
                interval=int(variant.get("gsi_interval", 20)),
                tau=int(variant.get("gsi_tau", 10)),
            )
        eval_dir = gsi_dir

    inputs = [
        SequenceEvalInput(
            name=sequence.name,
            gt_path=sequence.gt_path,
            result_path=eval_dir / f"{sequence.name}.txt",
        )
        for sequence in sequences
    ]
    summary = evaluate_motchallenge(inputs)
    payload = {
        "variant_name": variant_name,
        "result_dir": str(eval_dir),
        "tracker_config": tracker_config,
        "apply_gsi": apply_gsi,
        "summary": {
            "mota": summary.mota,
            "idf1": summary.idf1,
            "precision": summary.precision,
            "recall": summary.recall,
            "num_switches": summary.num_switches,
            "num_false_positives": summary.num_false_positives,
            "num_misses": summary.num_misses,
            "num_frames": summary.num_frames,
            "per_sequence": summary.per_sequence,
        },
    }
    (output_root / variant_name / "summary.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    return FastTrackerVariantResult(
        variant_name=variant_name,
        result_dir=eval_dir,
        tracker_config=tracker_config,
        apply_gsi=apply_gsi,
        summary=summary,
    )


def reproduce_fasttracker_public(cfg: dict[str, Any]) -> list[FastTrackerVariantResult]:
    reproduction_cfg = cfg["legacy_fasttracker_public"]
    variants = reproduction_cfg.get("variants") or []
    if not variants:
        raise ValueError("legacy_fasttracker_public.variants is empty")

    results = [_run_fasttracker_variant(cfg, variant) for variant in variants]
    leaderboard = []
    for result in results:
        leaderboard.append(
            {
                "variant_name": result.variant_name,
                "result_dir": str(result.result_dir),
                "apply_gsi": result.apply_gsi,
                "mota": result.summary.mota,
                "idf1": result.summary.idf1,
                "precision": result.summary.precision,
                "recall": result.summary.recall,
                "num_switches": result.summary.num_switches,
                "num_false_positives": result.summary.num_false_positives,
                "num_misses": result.summary.num_misses,
            }
        )
    leaderboard.sort(key=lambda item: float(item["mota"]), reverse=True)
    output_root = ensure_dir(Path(cfg["paths"]["artifact_root"]).expanduser().resolve() / "legacy_reproductions" / "fasttracker_public")
    (output_root / "leaderboard.json").write_text(
        json.dumps({"results": leaderboard}, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    return results
