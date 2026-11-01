from __future__ import annotations

import contextlib
import json
import os
import signal
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import motmetrics as mm
import numpy as np

from ir_autolabeling.utils.config import ensure_dir

if not hasattr(np, "asfarray"):
    np.asfarray = lambda array, dtype=float: np.asarray(array, dtype=dtype)  


@dataclass(slots=True)
class FastTrackerOfficialResult:
    variant_name: str
    run_dir: Path
    log_path: Path
    tracker_config_json: Path
    summary: dict[str, Any]


def _ensure_fasttracker_dataset_layout(repo_root: Path, dataset_root: Path) -> None:
    datasets_dir = ensure_dir(repo_root / "datasets")
    mot20_link = datasets_dir / "MOT20"
    dataset_root = dataset_root.expanduser().resolve()
    if mot20_link.is_symlink():
        if mot20_link.resolve() == dataset_root:
            return
        mot20_link.unlink()
    elif mot20_link.exists():
        return
    mot20_link.symlink_to(dataset_root, target_is_directory=True)


def _ensure_mot20_train_annotations(repo_root: Path) -> None:
    train_json = repo_root / "datasets" / "MOT20" / "annotations" / "train.json"
    if train_json.exists():
        return
    subprocess.run(
        [sys.executable, "tools/convert_mot20_to_coco.py"],
        cwd=repo_root,
        check=True,
        env={**os.environ, "PYTHONPATH": str(repo_root)},
    )


def _load_tracker_config(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _experiment_output_dir(repo_root: Path, exp_file: Path) -> Path:
    return repo_root / "YOLOX_outputs" / exp_file.stem


def _wait_for_new_run_dir(base_dir: Path, existing: set[Path], poll_seconds: float, process: subprocess.Popen[Any]) -> Path:
    while True:
        current = {path for path in base_dir.glob("run*") if path.is_dir()}
        new_dirs = sorted(current - existing)
        if new_dirs:
            return new_dirs[-1]
        if process.poll() is not None:
            raise RuntimeError(f"FastTracker process exited before creating a run dir under {base_dir}")
        time.sleep(poll_seconds)


def _compute_overall_summary(gt_root: Path, track_results_dir: Path) -> dict[str, Any]:
    gt = {}
    ts = {}
    for seq_dir in sorted(gt_root.iterdir()):
        if not seq_dir.is_dir():
            continue
        gt_file = seq_dir / "gt" / "gt.txt"
        if gt_file.exists():
            gt[seq_dir.name] = mm.io.loadtxt(str(gt_file), fmt="mot15-2D", min_confidence=1)
    for txt_path in sorted(track_results_dir.glob("*.txt")):
        ts[txt_path.stem] = mm.io.loadtxt(str(txt_path), fmt="mot15-2D")

    accs = []
    names = []
    for name in sorted(ts):
        if name not in gt:
            continue
        accs.append(mm.utils.compare_to_groundtruth(gt[name], ts[name], "iou", distth=0.5))
        names.append(name)

    metrics = mm.metrics.motchallenge_metrics + ["num_objects"]
    summary = mm.metrics.create().compute_many(accs, names=names, metrics=metrics, generate_overall=True)
    overall = summary.loc["OVERALL"]
    return {
        "names": names,
        "overall": {key: float(overall[key]) for key in summary.columns},
    }


def _terminate_process_tree(process: subprocess.Popen[Any]) -> None:
    if process.poll() is not None:
        return
    with contextlib.suppress(ProcessLookupError):
        process.send_signal(signal.SIGTERM)
    try:
        process.wait(timeout=10)
        return
    except subprocess.TimeoutExpired:
        pass
    with contextlib.suppress(ProcessLookupError):
        process.kill()
    with contextlib.suppress(subprocess.TimeoutExpired):
        process.wait(timeout=5)


def _run_variant(cfg: dict[str, Any], variant: dict[str, Any]) -> FastTrackerOfficialResult:
    paths = cfg["paths"]
    dataset_cfg = cfg["dataset"]
    official_cfg = cfg["legacy_fasttracker_official"]
    runtime_cfg = official_cfg.get("runtime", {})

    repo_root = Path(paths["fasttracker_repo_root"]).expanduser().resolve()
    dataset_root = Path(paths["dataset_root"]).expanduser().resolve()
    output_root = ensure_dir(Path(paths["artifact_root"]).expanduser().resolve() / "legacy_reproductions" / "official_fasttracker_train_repro")
    logs_root = ensure_dir(Path(paths["artifact_root"]).expanduser().resolve() / "legacy_reproductions" / "logs")
    gt_root = dataset_root / str(dataset_cfg.get("split", "train"))

    _ensure_fasttracker_dataset_layout(repo_root, dataset_root)
    _ensure_mot20_train_annotations(repo_root)

    tracker_config_json = Path(variant["tracker_config_json"]).expanduser().resolve()
    if not tracker_config_json.exists():
        raise FileNotFoundError(f"Tracker config not found: {tracker_config_json}")

    exp_file = Path(runtime_cfg["exp_file"]).expanduser().resolve()
    checkpoint = Path(runtime_cfg["checkpoint"]).expanduser().resolve()
    if not exp_file.exists():
        raise FileNotFoundError(f"FastTracker exp file not found: {exp_file}")
    if not checkpoint.exists():
        raise FileNotFoundError(f"FastTracker checkpoint not found: {checkpoint}")

    base_dir = _experiment_output_dir(repo_root, exp_file)
    ensure_dir(base_dir)
    existing_runs = {path for path in base_dir.glob("run*") if path.is_dir()}

    variant_name = str(variant["name"])
    log_path = logs_root / f"{variant_name}.log"
    log_handle = log_path.open("w", encoding="utf-8")
    command = [
        sys.executable,
        "tools/track.py",
        "-f",
        str(exp_file),
        "-c",
        str(checkpoint),
        "-b",
        str(int(runtime_cfg.get("batch_size", 1))),
        "--device",
        str(runtime_cfg.get("device", "mps")),
        "--config",
        str(tracker_config_json),
    ]
    if bool(runtime_cfg.get("mot20", True)):
        command.append("--mot20")
    if bool(runtime_cfg.get("fp16", False)):
        command.append("--fp16")
    if bool(runtime_cfg.get("fuse", False)):
        command.append("--fuse")

    process = subprocess.Popen(
        command,
        cwd=repo_root,
        stdout=log_handle,
        stderr=subprocess.STDOUT,
        env={
            **os.environ,
            "PYTHONPATH": str(repo_root),
            "YOLOX_DATADIR": str(repo_root / "datasets"),
        },
        text=True,
    )
    poll_seconds = float(runtime_cfg.get("poll_interval_seconds", 30))
    stop_after_track_results = bool(runtime_cfg.get("stop_after_track_results", True))
    expected_sequences = set(dataset_cfg.get("sequences") or [])
    if not expected_sequences:
        expected_sequences = {path.name for path in gt_root.iterdir() if path.is_dir()}

    try:
        run_dir = _wait_for_new_run_dir(base_dir, existing_runs, poll_seconds, process)
        track_results_dir = run_dir / "track_results"
        while True:
            if track_results_dir.exists():
                produced = {path.stem for path in track_results_dir.glob("*.txt")}
                if expected_sequences.issubset(produced):
                    break
            if process.poll() is not None:
                if not track_results_dir.exists():
                    raise RuntimeError(f"FastTracker process exited before producing track_results: {log_path}")
                break
            time.sleep(poll_seconds)

        summary = _compute_overall_summary(gt_root, track_results_dir)
        if stop_after_track_results and process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
    finally:
        if process.poll() is None:
            with contextlib.suppress(Exception):
                process.terminate()
                process.wait(timeout=5)
        log_handle.close()

    result_payload = {
        "variant_name": variant_name,
        "run_dir": str(run_dir),
        "log_path": str(log_path),
        "tracker_config_json": str(tracker_config_json),
        "tracker_config": _load_tracker_config(tracker_config_json),
        "summary": summary,
    }
    (output_root / f"{variant_name}_summary.json").write_text(
        json.dumps(result_payload, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    return FastTrackerOfficialResult(
        variant_name=variant_name,
        run_dir=run_dir,
        log_path=log_path,
        tracker_config_json=tracker_config_json,
        summary=summary,
    )


def reproduce_fasttracker_official(cfg: dict[str, Any]) -> list[FastTrackerOfficialResult]:
    official_cfg = cfg["legacy_fasttracker_official"]
    variants = official_cfg.get("variants") or []
    if not variants:
        raise ValueError("legacy_fasttracker_official.variants is empty")

    results = [_run_variant(cfg, variant) for variant in variants]
    leaderboard = []
    for result in results:
        overall = result.summary["overall"]
        leaderboard.append(
            {
                "variant_name": result.variant_name,
                "run_dir": str(result.run_dir),
                "log_path": str(result.log_path),
                "tracker_config_json": str(result.tracker_config_json),
                "mota": float(overall["mota"]),
                "idf1": float(overall["idf1"]),
                "precision": float(overall["precision"]),
                "recall": float(overall["recall"]),
                "num_switches": float(overall["num_switches"]),
                "num_false_positives": float(overall["num_false_positives"]),
                "num_misses": float(overall["num_misses"]),
            }
        )
    leaderboard.sort(key=lambda item: float(item["mota"]), reverse=True)
    output_root = ensure_dir(Path(cfg["paths"]["artifact_root"]).expanduser().resolve() / "legacy_reproductions" / "official_fasttracker_train_repro")
    (output_root / "leaderboard.json").write_text(
        json.dumps({"results": leaderboard}, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    return results
