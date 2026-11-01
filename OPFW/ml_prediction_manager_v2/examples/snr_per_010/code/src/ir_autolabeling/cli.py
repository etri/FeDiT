from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import time
from pathlib import Path

from ir_autolabeling.data.mot20 import load_mot20_sequences
from ir_autolabeling.eval.detector import DetectorAuditInput, evaluate_detection_caches
from ir_autolabeling.eval.mot import SequenceEvalInput, evaluate_motchallenge
from ir_autolabeling.pipeline.experiment_runner import cache_mot20_detections, refine_mot20_detections_from_cache
from ir_autolabeling.reporting.experiment_logger import append_event_journal, build_trial_signature
from ir_autolabeling.repro.fasttracker_official import reproduce_fasttracker_official
from ir_autolabeling.repro.fasttracker_public import reproduce_fasttracker_public
from ir_autolabeling.supervised import (
    cache_bytetrack_teacher_detections,
    cache_student_detections,
    export_vlm_pseudo_labels,
    train_vlm_detection_head,
    train_vlm_student_detector,
)
from ir_autolabeling.tracking.boxmot_adapter import run_tracker_on_sequence
from ir_autolabeling.utils.config import ensure_dir, load_yaml
from ir_autolabeling.utils.io import inspect_jsonl_frame_sequence
from ir_autolabeling.utils.lock import exclusive_file_lock, exclusive_file_lock_wait


_LSOF_FD_MODE_RE = re.compile(r"^\\s*\\S+\\s+\\d+\\s+\\S+\\s+(\\S+)\\s+")


def _best_effort_has_open_writer(path: Path) -> bool:
    pass

    try:
        result = subprocess.run(
            ["lsof", "-nP", "--", str(path)],
            check=False,
            capture_output=True,
            text=True,
        )
    except Exception:
        return False

    if result.returncode != 0:
        return False

    lines = [line for line in (result.stdout or "").splitlines() if line.strip()]
    if not lines:
        return False

    
    for line in lines[1:]:
        match = _LSOF_FD_MODE_RE.match(line)
        if not match:
            continue
        fd = match.group(1)
        
        if fd.endswith("w") or fd.endswith("u") or "w" in fd:
            return True

    return False


def _raise_if_missing_lock_but_writers(lock_path: Path, candidate_outputs: list[Path]) -> None:
    if lock_path.exists():
        return
    writers = [path for path in candidate_outputs if path.exists() and _best_effort_has_open_writer(path)]
    if not writers:
        return
    preview = ", ".join(str(path) for path in writers[:4])
    suffix = "..." if len(writers) > 4 else ""
    raise RuntimeError(
        f"Lock already exists: {lock_path} "
        f"(lock missing on disk but output cache appears in-flight; writer(s)={preview}{suffix})"
    )


_LOCK_EXISTS_PATH_RE = re.compile(r"Lock already exists:\\s*(\\S+)")


def _format_lock_debug(lock_path: Path, *, max_context_chars: int = 500) -> list[str]:
    resolved = Path(lock_path).expanduser().resolve()
    if not resolved.exists():
        return [f"Lock: `{resolved}` (missing on disk)"]
    created_at = None
    pid = None
    context = None
    try:
        for line in resolved.read_text(encoding="utf-8").splitlines():
            if line.startswith("created_at="):
                created_at = line.split("=", 1)[1].strip() or None
            elif line.startswith("pid="):
                pid = line.split("=", 1)[1].strip() or None
            elif line.startswith("context="):
                context = line.split("=", 1)[1].strip() or None
    except Exception:
        return [f"Lock: `{resolved}`", "Lock info: `(failed to read lock file)`"]

    bullets = [f"Lock: `{resolved}`"]
    if created_at:
        bullets.append(f"Lock created_at: `{created_at}`")
    if pid:
        bullets.append(f"Lock pid: `{pid}`")
    if context:
        preview = context if len(context) <= max_context_chars else (context[:max_context_chars] + "…")
        bullets.append(f"Lock context: `{preview}`")
    return bullets


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Grounded SAM 2 + BoxMOT tuning pipeline")
    subparsers = parser.add_subparsers(dest="command", required=True)

    cache_parser = subparsers.add_parser("cache-detections", help="Create raw Grounded SAM 2 caches for MOT20")
    cache_parser.add_argument("--config", default="configs/project.yaml")
    cache_parser.add_argument("--overwrite", action="store_true")
    cache_parser.add_argument("--max-frames", type=int, default=None)
    cache_parser.add_argument(
        "--max-new-frames",
        type=int,
        default=None,
        help="Optional cap on how many *new* frames to append per sequence (useful for incremental cache fills).",
    )
    cache_parser.add_argument(
        "--wait-lock-seconds",
        type=float,
        default=0.0,
        help="When > 0, wait up to this many seconds for the stage lock to clear instead of failing immediately.",
    )
    cache_parser.add_argument(
        "--wait-lock-poll-seconds",
        type=float,
        default=5.0,
        help="Polling interval in seconds used by --wait-lock-seconds.",
    )

    refine_parser = subparsers.add_parser(
        "refine-detections",
        help="Add/refresh SAM2 refinements on top of an existing detection cache (skips Grounding DINO).",
    )
    refine_parser.add_argument("--config", default="configs/project.yaml")
    refine_parser.add_argument("--source-cache-tag", required=True)
    refine_parser.add_argument("--overwrite", action="store_true")
    refine_parser.add_argument("--max-frames", type=int, default=None)
    refine_parser.add_argument(
        "--max-new-frames",
        type=int,
        default=None,
        help="Optional cap on how many *new* frames to append per sequence (useful for incremental refinement fills).",
    )
    refine_parser.add_argument(
        "--wait-lock-seconds",
        type=float,
        default=0.0,
        help="When > 0, wait up to this many seconds for the stage lock to clear instead of failing immediately.",
    )
    refine_parser.add_argument(
        "--wait-lock-poll-seconds",
        type=float,
        default=5.0,
        help="Polling interval in seconds used by --wait-lock-seconds.",
    )

    tune_parser = subparsers.add_parser("tune", help="Run Optuna tuning")
    tune_parser.add_argument("--config", default="configs/project.yaml")
    tune_parser.add_argument("--trials", type=int, default=None)
    tune_parser.add_argument("--timeout-hours", type=float, default=None)
    tune_parser.add_argument(
        "--wait-lock-seconds",
        type=float,
        default=0.0,
        help="When > 0, wait up to this many seconds for the tune lock(s) to clear instead of failing immediately.",
    )
    tune_parser.add_argument(
        "--wait-lock-poll-seconds",
        type=float,
        default=5.0,
        help="Polling interval in seconds used by --wait-lock-seconds.",
    )
    tune_parser.add_argument(
        "--enqueue-summary",
        action="append",
        default=[],
        help="Path to a prior trial summary.json to enqueue as a seed trial (repeatable).",
    )

    eval_parser = subparsers.add_parser("evaluate", help="Evaluate an existing result directory")
    eval_parser.add_argument("--config", default="configs/project.yaml")
    eval_parser.add_argument("--results", required=True)

    detector_parser = subparsers.add_parser("audit-detector", help="Audit detector recall/precision from cached detections")
    detector_parser.add_argument("--config", default="configs/project.yaml")
    detector_parser.add_argument("--box-source", default="union")
    detector_parser.add_argument("--score-threshold", type=float, default=0.05)
    detector_parser.add_argument("--nms-iou-threshold", type=float, default=0.7)
    detector_parser.add_argument("--min-box-area", type=float, default=16.0)
    detector_parser.add_argument("--min-height", type=float, default=1.0)
    detector_parser.add_argument("--min-width", type=float, default=1.0)
    detector_parser.add_argument("--min-height-width-ratio", type=float, default=0.2)
    detector_parser.add_argument("--max-height-width-ratio", type=float, default=20.0)
    detector_parser.add_argument("--top-k", type=int, default=400)
    detector_parser.add_argument("--rescue-score-threshold", type=float, default=None)
    detector_parser.add_argument("--rescue-max-area", type=float, default=None)
    detector_parser.add_argument("--rescue-min-height", type=float, default=None)
    detector_parser.add_argument("--rescue-min-width", type=float, default=None)
    detector_parser.add_argument("--rescue-min-height-width-ratio", type=float, default=None)
    detector_parser.add_argument("--upper-zone-y-limit", type=float, default=None)
    detector_parser.add_argument("--upper-zone-score-threshold", type=float, default=None)
    detector_parser.add_argument("--upper-zone-min-box-area", type=float, default=None)
    detector_parser.add_argument("--upper-zone-min-height", type=float, default=None)
    detector_parser.add_argument("--upper-zone-min-width", type=float, default=None)
    detector_parser.add_argument("--upper-zone-min-height-width-ratio", type=float, default=None)
    detector_parser.add_argument("--min-prompt-votes", type=int, default=None)
    detector_parser.add_argument("--prompt-support-weight", type=float, default=None)
    detector_parser.add_argument("--aspect-ratio-target", type=float, default=None)
    detector_parser.add_argument("--aspect-ratio-tolerance", type=float, default=None)
    detector_parser.add_argument("--aspect-ratio-score-bonus", type=float, default=None)
    detector_parser.add_argument("--small-box-area-threshold", type=float, default=None)
    detector_parser.add_argument("--small-box-score-bonus", type=float, default=None)
    detector_parser.add_argument("--upper-zone-small-box-bonus", type=float, default=None)
    detector_parser.add_argument("--gs-iou-min", type=float, default=None)
    detector_parser.add_argument("--gs-iou-weight", type=float, default=None)
    detector_parser.add_argument("--score-power", type=float, default=None)
    detector_parser.add_argument("--score-bias", type=float, default=None)
    detector_parser.add_argument("--iou-threshold", type=float, default=0.5)

    verify_parser = subparsers.add_parser("verify-trial", help="Re-run a trial config to verify determinism")
    verify_parser.add_argument("--config", default="configs/project.yaml")
    verify_parser.add_argument("--summary", required=True, help="Path to a trial summary.json (or verification_summary.json).")
    verify_parser.add_argument("--output-dir", default=None, help="Optional output directory for verification artifacts.")

    legacy_parser = subparsers.add_parser(
        "reproduce-fasttracker-public",
        help="Run FastTracker directly on MOT20 public detections and evaluate on MOT20 train",
    )
    legacy_parser.add_argument("--config", default="configs/legacy_fasttracker_public.yaml")

    official_legacy_parser = subparsers.add_parser(
        "reproduce-fasttracker-official",
        help="Run the official FastTracker detector+tracker pipeline on MOT20 train and summarize train MOTA",
    )
    official_legacy_parser.add_argument("--config", default="configs/legacy_fasttracker_official.yaml")

    pseudo_parser = subparsers.add_parser(
        "export-vlm-pseudo-labels",
        help="Export person-only pseudo labels from a VLM teacher cache into YOLO and COCO training assets",
    )
    pseudo_parser.add_argument("--config", default="configs/vlm_student_person_smoke.yaml")

    student_train_parser = subparsers.add_parser(
        "train-vlm-student",
        help="Train a person-only student detector from exported VLM pseudo labels",
    )
    student_train_parser.add_argument("--config", default="configs/vlm_student_person_smoke.yaml")

    student_cache_parser = subparsers.add_parser(
        "cache-student-detections",
        help="Run a trained student detector on MOT20 frames and export detections as cache jsonl files",
    )
    student_cache_parser.add_argument("--config", default="configs/vlm_student_person_smoke.yaml")

    teacher_cache_parser = subparsers.add_parser(
        "cache-bytetrack-teacher",
        help="Run the official ByteTrack detector on MOT20 frames and export a teacher cache",
    )
    teacher_cache_parser.add_argument("--config", default="configs/vlm_head_distill_bytetrack_smoke.yaml")
    teacher_cache_parser.add_argument("--overwrite", action="store_true")
    teacher_cache_parser.add_argument("--max-frames", type=int, default=None)
    teacher_cache_parser.add_argument(
        "--max-new-frames",
        type=int,
        default=None,
        help="Optional cap on how many *new* frames to append per sequence (useful for incremental cache fills).",
    )

    head_train_parser = subparsers.add_parser(
        "train-vlm-head-student",
        help="Freeze the VLM backbone and train only the final detection heads from pseudo labels",
    )
    head_train_parser.add_argument("--config", default="configs/vlm_head_distill_bytetrack_smoke.yaml")

    return parser


def _cmd_cache(args: argparse.Namespace) -> int:
    cfg = load_yaml(args.config)
    pre_rows: dict[str, int] = {}
    pre_mtime_ns: dict[str, int] = {}
    artifact_root = Path(cfg["paths"]["artifact_root"]).expanduser().resolve()
    lock_path = artifact_root / "detections.lock"
    cache_tag = str(cfg.get("detector", {}).get("cache_tag") or "unknown_cache")
    try:
        cache_dir = artifact_root / "detections" / cache_tag
        sequences = list(cfg.get("dataset", {}).get("sequences") or [])
        if sequences:
            candidate_outputs = [cache_dir / f"{name}.jsonl" for name in sequences]
        else:
            candidate_outputs = list(cache_dir.glob("*.jsonl")) if cache_dir.exists() else []
        _raise_if_missing_lock_but_writers(lock_path, candidate_outputs)
        lock_context_prev = os.environ.get("IR_LOCK_CONTEXT")
        os.environ["IR_LOCK_CONTEXT"] = json.dumps(
            {
                "command": "cache-detections",
                "config": str(args.config),
                "cache_tag": cache_tag,
                "sequences": sequences,
                "max_frames": args.max_frames,
                "max_new_frames": args.max_new_frames,
                "overwrite": bool(args.overwrite),
            },
            ensure_ascii=True,
            sort_keys=True,
        )
        with exclusive_file_lock_wait(
            lock_path,
            timeout_seconds=(float(args.wait_lock_seconds) if float(args.wait_lock_seconds) > 0 else None),
            poll_seconds=float(args.wait_lock_poll_seconds),
        ):
            try:
                if cache_dir.exists():
                    for path in sorted(cache_dir.glob("*.jsonl")):
                        pre_rows[path.name] = inspect_jsonl_frame_sequence(path, frame_key="frame_idx").row_count
                        try:
                            pre_mtime_ns[path.name] = path.stat().st_mtime_ns
                        except Exception:
                            continue
            except Exception:
                pre_rows = {}
                pre_mtime_ns = {}
            written = cache_mot20_detections(
                cfg,
                overwrite=bool(args.overwrite),
                max_frames_override=args.max_frames,
                max_new_frames_override=args.max_new_frames,
            )
        if lock_context_prev is None:
            os.environ.pop("IR_LOCK_CONTEXT", None)
        else:
            os.environ["IR_LOCK_CONTEXT"] = lock_context_prev
    except RuntimeError as exc:
        message = str(exc)
        if "Missing detection cache file." in message:
            try:
                journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
                append_event_journal(
                    journal_path,
                    category="blocker",
                    name="tune_missing_cache",
                    bullets=[f"Config: `{args.config}`", f"Error: `{exc}`"],
                )
            except Exception:
                pass
            print(f"ERROR: {exc}")
            return 1
        if "Lock already exists:" not in message:
            raise
        try:
            journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
            append_event_journal(
                journal_path,
                category="blocker",
                name="detections_lock_exists",
                bullets=[f"Config: `{args.config}`", f"Error: `{exc}`"],
            )
        except Exception:
            pass
        print(f"ERROR: {exc}")
        return 1
    except KeyboardInterrupt:
        try:
            journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
            append_event_journal(
                journal_path,
                category="blocker",
                name="cache_interrupted",
                bullets=[
                    f"Config: `{args.config}`",
                    f"Cache tag: `{cache_tag}`",
                    f"Max frames/seq: {args.max_frames if args.max_frames is not None else '(cfg default)'}",
                    f"Max new frames/seq: {args.max_new_frames if args.max_new_frames is not None else '(unlimited)'}",
                    "Error: `KeyboardInterrupt`",
                ],
            )
        except Exception:
            pass
        print("ERROR: cache interrupted (KeyboardInterrupt)")
        return 1
    except Exception as exc:
        try:
            import traceback

            journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
            append_event_journal(
                journal_path,
                category="blocker",
                name="cache_failed",
                bullets=[
                    f"Config: `{args.config}`",
                    f"Cache tag: `{cache_tag}`",
                    f"Max frames/seq: {args.max_frames if args.max_frames is not None else '(cfg default)'}",
                    f"Max new frames/seq: {args.max_new_frames if args.max_new_frames is not None else '(unlimited)'}",
                    f"Error: `{repr(exc)}`",
                    "Traceback:",
                    "```",
                    traceback.format_exc().rstrip(),
                    "```",
                ],
            )
        except Exception:
            pass
        print(f"ERROR: cache failed: {repr(exc)}")
        return 1
    try:
        sequences = list(cfg.get("dataset", {}).get("sequences") or [])
        max_frames = args.max_frames if args.max_frames is not None else cfg.get("dataset", {}).get("max_frames_per_sequence")
        bullets: list[str] = [
            f"Config: `{args.config}`",
            f"Cache tag: `{cache_tag}`",
            f"Sequences: {', '.join(sequences) if sequences else '(all)'}",
            f"Max frames/seq: {max_frames if max_frames is not None else '(full)'}",
            f"Max new frames/seq: {args.max_new_frames if args.max_new_frames is not None else '(unlimited)'}",
            f"Overwrite: {bool(args.overwrite)}",
        ]
        for path in written:
            path = Path(path)
            stats = inspect_jsonl_frame_sequence(path, frame_key="frame_idx")
            delta = ""
            if path.name in pre_rows:
                try:
                    mtime_changed = path.stat().st_mtime_ns != pre_mtime_ns.get(path.name)
                except Exception:
                    mtime_changed = True
                if mtime_changed:
                    added = stats.row_count - int(pre_rows.get(path.name, 0) or 0)
                    if added != 0:
                        delta = f" (+{added})"
            bullets.append(
                f"Cache: `{path.name}` rows={stats.row_count}{delta} unique={stats.unique_frame_count} valid={stats.is_valid}"
            )
        journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
        append_event_journal(journal_path, category="cache-detections", name=cache_tag, bullets=bullets)
    except Exception:
        
        pass
    for path in written:
        print(path)
    return 0


def _cmd_refine(args: argparse.Namespace) -> int:
    cfg = load_yaml(args.config)
    pre_rows: dict[str, int] = {}
    pre_mtime_ns: dict[str, int] = {}
    artifact_root = Path(cfg["paths"]["artifact_root"]).expanduser().resolve()
    cache_tag = str(cfg.get("detector", {}).get("cache_tag") or "unknown_cache")
    lock_path = artifact_root / f"refine_{cache_tag}.lock"
    try:
        cache_dir = artifact_root / "detections" / cache_tag
        sequences = list(cfg.get("dataset", {}).get("sequences") or [])
        if sequences:
            candidate_outputs = [cache_dir / f"{name}.jsonl" for name in sequences]
        else:
            candidate_outputs = list(cache_dir.glob("*.jsonl")) if cache_dir.exists() else []
        writers = [path for path in candidate_outputs if path.exists() and _best_effort_has_open_writer(path)]
        if writers:
            preview = ", ".join(str(path) for path in writers[:4])
            suffix = "..." if len(writers) > 4 else ""
            raise RuntimeError(
                f"Lock already exists: {lock_path} "
                f"(output cache appears in-flight; writer(s)={preview}{suffix})"
            )
        _raise_if_missing_lock_but_writers(lock_path, candidate_outputs)
        lock_context_prev = os.environ.get("IR_LOCK_CONTEXT")
        os.environ["IR_LOCK_CONTEXT"] = json.dumps(
            {
                "command": "refine-detections",
                "config": str(args.config),
                "source_cache_tag": str(args.source_cache_tag),
                "target_cache_tag": cache_tag,
                "sequences": sequences,
                "max_frames": args.max_frames,
                "max_new_frames": args.max_new_frames,
                "overwrite": bool(args.overwrite),
            },
            ensure_ascii=True,
            sort_keys=True,
        )
        with exclusive_file_lock_wait(
            lock_path,
            timeout_seconds=(float(args.wait_lock_seconds) if float(args.wait_lock_seconds) > 0 else None),
            poll_seconds=float(args.wait_lock_poll_seconds),
        ):
            try:
                if cache_dir.exists():
                    for path in sorted(cache_dir.glob("*.jsonl")):
                        pre_rows[path.name] = inspect_jsonl_frame_sequence(path, frame_key="frame_idx").row_count
                        try:
                            pre_mtime_ns[path.name] = path.stat().st_mtime_ns
                        except Exception:
                            continue
            except Exception:
                pre_rows = {}
                pre_mtime_ns = {}

            written = refine_mot20_detections_from_cache(
                cfg,
                source_cache_tag=str(args.source_cache_tag),
                overwrite=bool(args.overwrite),
                max_frames_override=args.max_frames,
                max_new_frames_override=args.max_new_frames,
            )
        if lock_context_prev is None:
            os.environ.pop("IR_LOCK_CONTEXT", None)
        else:
            os.environ["IR_LOCK_CONTEXT"] = lock_context_prev
    except RuntimeError as exc:
        if "Lock already exists:" not in str(exc):
            raise
        try:
            journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
            append_event_journal(
                journal_path,
                category="blocker",
                name="refine_lock_exists",
                bullets=[f"Config: `{args.config}`", f"Lock: `{lock_path}`", f"Error: `{exc}`"],
            )
        except Exception:
            pass
        print(f"ERROR: {exc}")
        return 1
    except KeyboardInterrupt:
        try:
            journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
            append_event_journal(
                journal_path,
                category="blocker",
                name="refine_interrupted",
                bullets=[
                    f"Config: `{args.config}`",
                    f"Source cache tag: `{args.source_cache_tag}`",
                    f"Target cache tag: `{cache_tag}`",
                    f"Max frames/seq: {args.max_frames if args.max_frames is not None else '(cfg default)'}",
                    f"Max new frames/seq: {args.max_new_frames if args.max_new_frames is not None else '(unlimited)'}",
                    "Error: `KeyboardInterrupt`",
                ],
            )
        except Exception:
            pass
        print("ERROR: refine interrupted (KeyboardInterrupt)")
        return 1
    except Exception as exc:
        try:
            import traceback

            journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
            append_event_journal(
                journal_path,
                category="blocker",
                name="refine_failed",
                bullets=[
                    f"Config: `{args.config}`",
                    f"Source cache tag: `{args.source_cache_tag}`",
                    f"Error: `{repr(exc)}`",
                    "Traceback:",
                    "```",
                    traceback.format_exc().rstrip(),
                    "```",
                ],
            )
        except Exception:
            pass
        print(f"ERROR: refine failed: {repr(exc)}")
        return 1
    try:
        sequences = list(cfg.get("dataset", {}).get("sequences") or [])
        max_frames = args.max_frames if args.max_frames is not None else cfg.get("dataset", {}).get("max_frames_per_sequence")
        cache_tag = str(cfg.get("detector", {}).get("cache_tag") or "unknown_cache")
        bullets: list[str] = [
            f"Config: `{args.config}`",
            f"Source cache tag: `{args.source_cache_tag}`",
            f"Target cache tag: `{cache_tag}`",
            f"Sequences: {', '.join(sequences) if sequences else '(all)'}",
            f"Max frames/seq: {max_frames if max_frames is not None else '(full)'}",
            f"Max new frames/seq: {args.max_new_frames if args.max_new_frames is not None else '(unlimited)'}",
            f"Overwrite: {bool(args.overwrite)}",
        ]
        for path in written:
            path = Path(path)
            stats = inspect_jsonl_frame_sequence(path, frame_key="frame_idx")
            delta = ""
            if path.name in pre_rows:
                try:
                    mtime_changed = path.stat().st_mtime_ns != pre_mtime_ns.get(path.name)
                except Exception:
                    mtime_changed = True
                if mtime_changed:
                    added = stats.row_count - int(pre_rows.get(path.name, 0) or 0)
                    if added != 0:
                        delta = f" (+{added})"
            bullets.append(
                f"Cache: `{path.name}` rows={stats.row_count}{delta} unique={stats.unique_frame_count} valid={stats.is_valid}"
            )
        journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
        append_event_journal(journal_path, category="refine-detections", name=cache_tag, bullets=bullets)
    except Exception:
        pass

    for path in written:
        print(path)
    return 0


def _cmd_tune(args: argparse.Namespace) -> int:
    cfg = load_yaml(args.config)
    try:
        artifact_root = Path(cfg["paths"]["artifact_root"]).expanduser().resolve()
        lock_path = artifact_root / "detections.lock"
        if lock_path.exists():
            cache_tag = str(cfg.get("detector", {}).get("cache_tag") or "unknown_cache")
            cache_dir = artifact_root / "detections" / cache_tag
            sequences = list(cfg.get("dataset", {}).get("sequences") or [])
            if sequences:
                candidate_outputs = [cache_dir / f"{name}.jsonl" for name in sequences]
            else:
                candidate_outputs = list(cache_dir.glob("*.jsonl")) if cache_dir.exists() else []
            writers = [path for path in candidate_outputs if path.exists() and _best_effort_has_open_writer(path)]
            if writers:
                journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
                writer_preview = ", ".join(str(path) for path in writers[:4]) + ("..." if len(writers) > 4 else "")
                append_event_journal(
                    journal_path,
                    category="blocker",
                    name="tune_cache_inflight",
                    bullets=[
                        f"Config: `{args.config}`",
                        f"Cache tag: `{cache_tag}`",
                        f"Lock: `{lock_path}`",
                        f"Writer(s): `{writer_preview}`",
                        "Note: wait for cache writers to finish before tuning to avoid partial/inconsistent metrics.",
                    ],
                )
                print(f"ERROR: detection cache appears in-flight; wait for {lock_path} to clear before tuning.")
                return 1

        
        
        
        cache_tag = str(cfg.get("detector", {}).get("cache_tag") or "unknown_cache")
        refine_lock_path = artifact_root / f"refine_{cache_tag}.lock"
        if refine_lock_path.exists():
            cache_dir = artifact_root / "detections" / cache_tag
            sequences = list(cfg.get("dataset", {}).get("sequences") or [])
            if sequences:
                candidate_outputs = [cache_dir / f"{name}.jsonl" for name in sequences]
            else:
                candidate_outputs = list(cache_dir.glob("*.jsonl")) if cache_dir.exists() else []

            wait_seconds = float(args.wait_lock_seconds or 0.0)
            poll_seconds = float(args.wait_lock_poll_seconds or 5.0)
            deadline = None if wait_seconds <= 0 else (time.monotonic() + wait_seconds)
            writers: list[Path] = []
            while True:
                if not refine_lock_path.exists():
                    writers = []
                    break
                writers = [path for path in candidate_outputs if path.exists() and _best_effort_has_open_writer(path)]
                if not writers:
                    break
                if deadline is not None and time.monotonic() >= deadline:
                    break
                time.sleep(poll_seconds)

            if writers:
                journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
                writer_preview = ", ".join(str(path) for path in writers[:4]) + ("..." if len(writers) > 4 else "")
                append_event_journal(
                    journal_path,
                    category="blocker",
                    name="tune_refine_inflight",
                    bullets=[
                        f"Config: `{args.config}`",
                        f"Cache tag: `{cache_tag}`",
                        f"Lock: `{refine_lock_path}`",
                        f"Writer(s): `{writer_preview}`",
                        f"Waited: {wait_seconds:.0f}s (poll={poll_seconds:.1f}s)",
                        "Note: wait for refinement writers to finish before tuning to avoid partial/inconsistent metrics.",
                    ],
                )
                print(
                    f"ERROR: detection refinement appears in-flight; wait for {refine_lock_path} to clear before tuning."
                )
                return 1
    except Exception:
        
        pass
    try:
        from ir_autolabeling.tuning.optuna_search import OptunaSearchRunner

        lock_context_prev = os.environ.get("IR_LOCK_CONTEXT")
        try:
            os.environ["IR_LOCK_CONTEXT"] = json.dumps(
                {
                    "command": "tune",
                    "config": str(args.config),
                    "study_name": str(cfg.get("tuning", {}).get("study_name") or ""),
                    "storage": str(cfg.get("tuning", {}).get("storage") or ""),
                    "trials": args.trials,
                    "timeout_hours": args.timeout_hours,
                    "enqueue_summary": list(args.enqueue_summary or []),
                    "wait_lock_seconds": float(args.wait_lock_seconds),
                    "wait_lock_poll_seconds": float(args.wait_lock_poll_seconds),
                },
                ensure_ascii=True,
                sort_keys=True,
            )
        except Exception:
            
            pass

        runner = OptunaSearchRunner(cfg)
        try:
            study = runner.run(
                n_trials=args.trials,
                timeout_hours=args.timeout_hours,
                enqueue_summaries=list(args.enqueue_summary or []),
                wait_lock_seconds=float(args.wait_lock_seconds),
                wait_lock_poll_seconds=float(args.wait_lock_poll_seconds),
            )
        finally:
            if lock_context_prev is None:
                os.environ.pop("IR_LOCK_CONTEXT", None)
            else:
                os.environ["IR_LOCK_CONTEXT"] = lock_context_prev
        try:
            best_trial = study.best_trial
        except ValueError:
            best_trial = None
        if best_trial is None:
            print("best_trial=None")
            print("best_value=None")
        else:
            print(f"best_trial={best_trial.number}")
            print(f"best_value={study.best_value:.6f}")
    except RuntimeError as exc:
        message = str(exc)
        try:
            journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
            bullets = [f"Config: `{args.config}`", f"Error: `{exc}`"]
            if "Lock already exists:" in message:
                match = _LOCK_EXISTS_PATH_RE.search(message)
                if match:
                    try:
                        lock_debug = _format_lock_debug(Path(match.group(1)))
                    except Exception:
                        lock_debug = []
                    if lock_debug:
                        bullets.extend(lock_debug)
            append_event_journal(
                journal_path,
                category="blocker",
                name=("tune_lock_exists" if "Lock already exists:" in message else "tune_runtime_error"),
                bullets=bullets,
            )
        except Exception:
            pass
        print(f"ERROR: {exc}")
        return 1
    except ModuleNotFoundError as exc:
        if getattr(exc, "name", None) != "optuna":
            raise
        from ir_autolabeling.tuning.fallback_search import FallbackSearchRunner

        print("WARNING: optuna is not installed; using fallback random search runner.")
        runner = FallbackSearchRunner(cfg)
        result = runner.run(
            n_trials=args.trials,
            timeout_hours=args.timeout_hours,
            enqueue_summaries=list(args.enqueue_summary or []),
        )
        print(f"best_trial={result.best_trial_number}")
        if result.best_value is None:
            print("best_value=None")
        else:
            print(f"best_value={result.best_value:.6f}")
    except Exception as exc:
        try:
            import traceback

            journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
            append_event_journal(
                journal_path,
                category="blocker",
                name="tune_failed",
                bullets=[
                    f"Config: `{args.config}`",
                    f"Error: `{repr(exc)}`",
                    "Traceback:",
                    "```",
                    traceback.format_exc().rstrip(),
                    "```",
                ],
            )
        except Exception:
            pass
        print(f"ERROR: tune failed: {repr(exc)}")
        return 1
    return 0


def _cmd_evaluate(args: argparse.Namespace) -> int:
    cfg = load_yaml(args.config)
    sequences = load_mot20_sequences(
        cfg["paths"]["dataset_root"],
        split=cfg["dataset"]["split"],
        sequence_names=cfg["dataset"].get("sequences"),
    )
    results_root = Path(args.results).expanduser().resolve()
    inputs = [
        SequenceEvalInput(
            name=sequence.name,
            gt_path=sequence.gt_path,
            result_path=results_root / f"{sequence.name}.txt",
            evaluated_frames_path=(
                (results_root / f"{sequence.name}.frames.txt")
                if (results_root / f"{sequence.name}.frames.txt").exists()
                else None
            ),
        )
        for sequence in sequences
    ]
    summary = evaluate_motchallenge(inputs)
    print(f"MOTA={summary.mota:.6f}")
    print(f"IDF1={summary.idf1:.6f}")
    print(f"Precision={summary.precision:.6f}")
    print(f"Recall={summary.recall:.6f}")
    return 0


def _cmd_audit_detector(args: argparse.Namespace) -> int:
    cfg = load_yaml(args.config)
    sequences = load_mot20_sequences(
        cfg["paths"]["dataset_root"],
        split=cfg["dataset"]["split"],
        sequence_names=cfg["dataset"].get("sequences"),
    )
    cache_dir = (
        Path(cfg["paths"]["artifact_root"]).expanduser().resolve()
        / "detections"
        / cfg["detector"]["cache_tag"]
    )
    inputs = [
        DetectorAuditInput(
            name=sequence.name,
            gt_path=sequence.gt_path,
            cache_path=cache_dir / f"{sequence.name}.jsonl",
        )
        for sequence in sequences
    ]
    detector_postprocess = {
        "box_source": args.box_source,
        "score_threshold": float(args.score_threshold),
        "nms_iou_threshold": float(args.nms_iou_threshold),
        "min_box_area": float(args.min_box_area),
        "min_height": float(args.min_height),
        "min_width": float(args.min_width),
        "min_height_width_ratio": float(args.min_height_width_ratio),
        "max_height_width_ratio": float(args.max_height_width_ratio),
        "top_k": int(args.top_k),
        "rescue_score_threshold": (
            float(args.rescue_score_threshold) if args.rescue_score_threshold is not None else None
        ),
        "rescue_max_area": float(args.rescue_max_area) if args.rescue_max_area is not None else None,
        "rescue_min_height": float(args.rescue_min_height) if args.rescue_min_height is not None else None,
        "rescue_min_width": float(args.rescue_min_width) if args.rescue_min_width is not None else None,
        "rescue_min_height_width_ratio": (
            float(args.rescue_min_height_width_ratio)
            if args.rescue_min_height_width_ratio is not None
            else None
        ),
        "upper_zone_y_limit": float(args.upper_zone_y_limit) if args.upper_zone_y_limit is not None else None,
        "upper_zone_score_threshold": (
            float(args.upper_zone_score_threshold) if args.upper_zone_score_threshold is not None else None
        ),
        "upper_zone_min_box_area": (
            float(args.upper_zone_min_box_area) if args.upper_zone_min_box_area is not None else None
        ),
        "upper_zone_min_height": float(args.upper_zone_min_height) if args.upper_zone_min_height is not None else None,
        "upper_zone_min_width": float(args.upper_zone_min_width) if args.upper_zone_min_width is not None else None,
        "upper_zone_min_height_width_ratio": (
            float(args.upper_zone_min_height_width_ratio)
            if args.upper_zone_min_height_width_ratio is not None
            else None
        ),
        "min_prompt_votes": int(args.min_prompt_votes) if args.min_prompt_votes is not None else None,
        "prompt_support_weight": (
            float(args.prompt_support_weight) if args.prompt_support_weight is not None else None
        ),
        "aspect_ratio_target": float(args.aspect_ratio_target) if args.aspect_ratio_target is not None else None,
        "aspect_ratio_tolerance": (
            float(args.aspect_ratio_tolerance) if args.aspect_ratio_tolerance is not None else None
        ),
        "aspect_ratio_score_bonus": (
            float(args.aspect_ratio_score_bonus) if args.aspect_ratio_score_bonus is not None else None
        ),
        "small_box_area_threshold": (
            float(args.small_box_area_threshold) if args.small_box_area_threshold is not None else None
        ),
        "small_box_score_bonus": (
            float(args.small_box_score_bonus) if args.small_box_score_bonus is not None else None
        ),
        "upper_zone_small_box_bonus": (
            float(args.upper_zone_small_box_bonus) if args.upper_zone_small_box_bonus is not None else None
        ),
        "gs_iou_min": float(args.gs_iou_min) if args.gs_iou_min is not None else None,
        "gs_iou_weight": float(args.gs_iou_weight) if args.gs_iou_weight is not None else None,
        "score_power": float(args.score_power) if args.score_power is not None else None,
        "score_bias": float(args.score_bias) if args.score_bias is not None else None,
    }
    summary = evaluate_detection_caches(
        inputs,
        detector_postprocess=detector_postprocess,
        iou_threshold=float(args.iou_threshold),
        max_frames_per_sequence=(
            int(cfg["dataset"]["max_frames_per_sequence"]) if cfg["dataset"].get("max_frames_per_sequence") is not None else None
        ),
        frame_stride=int(cfg["dataset"].get("frame_stride") or 1),
        start_frame=1,
    )
    print(f"Recall={summary.recall:.6f}")
    print(f"Precision={summary.precision:.6f}")
    print(f"F1={summary.f1:.6f}")
    print(f"GTBoxes={summary.gt_boxes}")
    print(f"PredictedBoxes={summary.predicted_boxes}")
    print(f"TP={summary.true_positives}")
    print(f"FP={summary.false_positives}")
    print(f"FN={summary.false_negatives}")
    output_dir = ensure_dir(Path(cfg["paths"]["artifact_root"]).expanduser().resolve() / "detector_audits")
    audit_payload = {
        "summary": {
            "recall": summary.recall,
            "precision": summary.precision,
            "f1": summary.f1,
            "gt_boxes": summary.gt_boxes,
            "predicted_boxes": summary.predicted_boxes,
            "true_positives": summary.true_positives,
            "false_positives": summary.false_positives,
            "false_negatives": summary.false_negatives,
            "num_frames": summary.num_frames,
        },
        "per_sequence": summary.per_sequence,
        "detector_postprocess": detector_postprocess,
        "iou_threshold": float(args.iou_threshold),
    }
    (output_dir / "latest.json").write_text(json.dumps(audit_payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    return 0


def _infer_config_path_from_trial_summary(summary_path: Path) -> Path | None:
    pass

    try:
        resolved = summary_path.expanduser().resolve()
    except Exception:
        resolved = summary_path

    study_dir = None
    try:
        parts = list(resolved.parts)
        idx = parts.index("trials")
        if idx + 1 < len(parts):
            study_dir = parts[idx + 1]
    except Exception:
        study_dir = None

    if not study_dir:
        return None

    configs_dir = Path(__file__).resolve().parents[2] / "configs"
    try:
        candidates = list(configs_dir.glob("*.yaml"))
    except Exception:
        return None

    matches = [(path, path.stem) for path in candidates if path.stem and path.stem in study_dir]
    if not matches:
        return None

    matches.sort(key=lambda item: len(item[1]), reverse=True)
    best_len = len(matches[0][1])
    best = [path for path, stem in matches if len(stem) == best_len]
    if len(best) != 1:
        return None
    return best[0]


def _cmd_verify_trial(args: argparse.Namespace) -> int:
    summary_path = Path(args.summary).expanduser().resolve()
    payload = json.loads(summary_path.read_text(encoding="utf-8"))

    effective_config = str(args.config)
    if effective_config == "configs/project.yaml":
        recorded = payload.get("config_path")
        if recorded is not None and str(recorded).strip():
            effective_config = str(recorded)
        else:
            inferred = _infer_config_path_from_trial_summary(summary_path)
            if inferred is not None:
                effective_config = str(inferred)

    cfg = load_yaml(effective_config)
    sequences = load_mot20_sequences(
        cfg["paths"]["dataset_root"],
        split=cfg["dataset"]["split"],
        sequence_names=cfg["dataset"].get("sequences"),
    )

    tracker_name = payload["tracker_name"]
    detector_params = payload["detector_params"]
    tracker_params = payload["tracker_params"]

    artifact_root = Path(cfg["paths"]["artifact_root"]).expanduser().resolve()
    output_root = Path(args.output_dir).expanduser().resolve() if args.output_dir else (artifact_root / "verifications")
    output_root.mkdir(parents=True, exist_ok=True)

    trial_number = payload.get("trial_number", payload.get("source_trial"))
    tag = "trial_unknown"

    eval_inputs: list[SequenceEvalInput] = []
    postprocess_cfg = dict(cfg.get("tracking", {}).get("postprocess") or {})
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
    eval_version = None
    try:
        eval_version = (cfg.get("tuning") or {}).get("eval_version")
    except Exception:
        eval_version = None

    override = payload.get("tracking_postprocess")
    if isinstance(override, dict):
        if "eval_version" in override:
            eval_version = override.get("eval_version")
        if "interpolate_max_gap" in override:
            try:
                interpolate_max_gap = int(override.get("interpolate_max_gap") or 0)
            except Exception:
                pass
        if "interpolate_min_endpoint_score" in override:
            interpolate_min_endpoint_score = override.get("interpolate_min_endpoint_score")
        if "interpolate_min_endpoint_iou" in override:
            interpolate_min_endpoint_iou = override.get("interpolate_min_endpoint_iou")
        if "emit_predicted_max_gap" in override:
            try:
                emit_predicted_max_gap = int(override.get("emit_predicted_max_gap") or 0)
            except Exception:
                pass
        if "emit_predicted_min_score" in override:
            emit_predicted_min_score = override.get("emit_predicted_min_score")
        if "clip_boxes" in override:
            clip_boxes = bool(override.get("clip_boxes"))
        if "min_score" in override:
            postprocess_min_score = override.get("min_score")
        if "min_box_area" in override:
            postprocess_min_box_area = override.get("min_box_area")
        if "min_height" in override:
            postprocess_min_height = override.get("min_height")
        if "min_width" in override:
            postprocess_min_width = override.get("min_width")
        if "min_height_width_ratio" in override:
            postprocess_min_height_width_ratio = override.get("min_height_width_ratio")
        if "max_height_width_ratio" in override:
            postprocess_max_height_width_ratio = override.get("max_height_width_ratio")
        if "max_box_area_fraction" in override:
            postprocess_max_box_area_fraction = override.get("max_box_area_fraction")
        if "min_track_length" in override:
            postprocess_min_track_length = override.get("min_track_length")
        if "min_track_avg_score" in override:
            postprocess_min_track_avg_score = override.get("min_track_avg_score")
        if "min_track_total_score" in override:
            postprocess_min_track_total_score = override.get("min_track_total_score")
    tracking_postprocess = None
    if postprocess_cfg or eval_version is not None:
        tracking_postprocess = {
            "eval_version": eval_version,
            "interpolate_max_gap": interpolate_max_gap,
            "interpolate_min_endpoint_score": float(interpolate_min_endpoint_score)
            if interpolate_min_endpoint_score is not None
            else None,
            "interpolate_min_endpoint_iou": float(interpolate_min_endpoint_iou)
            if interpolate_min_endpoint_iou is not None
            else None,
            "emit_predicted_max_gap": emit_predicted_max_gap,
            "emit_predicted_min_score": float(emit_predicted_min_score) if emit_predicted_min_score is not None else None,
            "clip_boxes": clip_boxes,
            "min_score": float(postprocess_min_score) if postprocess_min_score is not None else None,
            "min_box_area": float(postprocess_min_box_area) if postprocess_min_box_area is not None else None,
            "min_height": float(postprocess_min_height) if postprocess_min_height is not None else None,
            "min_width": float(postprocess_min_width) if postprocess_min_width is not None else None,
            "min_height_width_ratio": (
                float(postprocess_min_height_width_ratio) if postprocess_min_height_width_ratio is not None else None
            ),
            "max_height_width_ratio": (
                float(postprocess_max_height_width_ratio) if postprocess_max_height_width_ratio is not None else None
            ),
            "max_box_area_fraction": (
                float(postprocess_max_box_area_fraction) if postprocess_max_box_area_fraction is not None else None
            ),
            "min_track_length": (
                int(postprocess_min_track_length) if postprocess_min_track_length is not None else None
            ),
            "min_track_avg_score": (
                float(postprocess_min_track_avg_score) if postprocess_min_track_avg_score is not None else None
            ),
            "min_track_total_score": (
                float(postprocess_min_track_total_score) if postprocess_min_track_total_score is not None else None
            ),
        }

    
    
    
    
    
    
    signature = None
    try:
        signature = build_trial_signature(
            tracker_name=str(tracker_name),
            detector_params=dict(detector_params or {}),
            tracker_params=dict(tracker_params or {}),
            detector_cache_signature=str(cfg.get("detector", {}).get("cache_tag") or "unknown_cache"),
            tracking_postprocess=tracking_postprocess,
        )
    except Exception:
        signature = None

    if trial_number is not None:
        try:
            tag = f"trial_{int(trial_number):04d}"
        except Exception:
            raw = str(trial_number)
            safe = re.sub(r"[^A-Za-z0-9_-]+", "_", raw).strip("_")
            safe = safe[:64] if safe else "unknown"
            tag = safe if safe.startswith("trial_") else f"trial_{safe}"
        if signature:
            tag = f"{tag}_sig_{signature}"
    else:
        tag = f"trial_sig_{signature}" if signature else "trial_unknown"

    run_dir = ensure_dir(output_root / f"{tag}_rerun")
    tracks_dir = ensure_dir(run_dir / "tracks")
    cache_dir = artifact_root / "detections" / cfg["detector"]["cache_tag"]
    try:
        for sequence in sequences:
            cache_path = cache_dir / f"{sequence.name}.jsonl"
            artifact = run_tracker_on_sequence(
                sequence_name=sequence.name,
                detection_cache_path=cache_path,
                max_frames=cfg["dataset"].get("max_frames_per_sequence"),
                frame_stride=int(cfg["dataset"].get("frame_stride") or 1),
                start_frame=1,
                tracker_name=tracker_name,
                tracker_params=tracker_params,
                detector_postprocess=detector_params,
                frame_rate=sequence.frame_rate,
                image_width=sequence.width,
                image_height=sequence.height,
                tracker_device=cfg["tracking"]["device"],
                tracker_half=bool(cfg["tracking"].get("half", False)),
                reid_weights=cfg["tracking"].get("reid_weights"),
                output_dir=tracks_dir,
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
                postprocess_min_score=(float(postprocess_min_score) if postprocess_min_score is not None else None),
                postprocess_min_box_area=(
                    float(postprocess_min_box_area) if postprocess_min_box_area is not None else None
                ),
                postprocess_min_height=(float(postprocess_min_height) if postprocess_min_height is not None else None),
                postprocess_min_width=(float(postprocess_min_width) if postprocess_min_width is not None else None),
                postprocess_min_height_width_ratio=(
                    float(postprocess_min_height_width_ratio) if postprocess_min_height_width_ratio is not None else None
                ),
                postprocess_max_height_width_ratio=(
                    float(postprocess_max_height_width_ratio) if postprocess_max_height_width_ratio is not None else None
                ),
                postprocess_max_box_area_fraction=(
                    float(postprocess_max_box_area_fraction) if postprocess_max_box_area_fraction is not None else None
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

        summary = evaluate_motchallenge(eval_inputs)
    except Exception as exc:
        try:
            import traceback

            journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
            append_event_journal(
                journal_path,
                category="blocker",
                name="verify_trial_failed",
                bullets=[
                    f"Config: `{effective_config}`",
                    f"Source summary: `{summary_path}`",
                    f"Output dir: `{run_dir}`",
                    f"Error: `{repr(exc)}`",
                    "Traceback:",
                    "```",
                    traceback.format_exc().rstrip(),
                    "```",
                ],
            )
        except Exception:
            pass
        print(f"ERROR: verify-trial failed: {repr(exc)}")
        return 1
    verification_payload = {
        "source_summary": str(summary_path),
        "tracker_name": tracker_name,
        "tracking_postprocess": tracking_postprocess,
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
    (run_dir / "verification_summary.json").write_text(
        json.dumps(verification_payload, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    try:
        journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
        append_event_journal(
            journal_path,
            category="verify-trial",
            name=tag,
            bullets=[
                f"Config: `{effective_config}`",
                f"Source summary: `{summary_path}`",
                f"Output: `{run_dir / 'verification_summary.json'}`",
                f"MOTA: {summary.mota:.6f}",
                f"IDF1: {summary.idf1:.6f}",
                f"Frames: {summary.num_frames}",
            ],
        )
    except Exception:
        pass
    print(run_dir / "verification_summary.json")
    return 0


def _cmd_reproduce_fasttracker_public(args: argparse.Namespace) -> int:
    cfg = load_yaml(args.config)
    results = reproduce_fasttracker_public(cfg)
    for result in results:
        print(
            f"{result.variant_name}: "
            f"MOTA={result.summary.mota:.6f} "
            f"IDF1={result.summary.idf1:.6f} "
            f"Precision={result.summary.precision:.6f} "
            f"Recall={result.summary.recall:.6f}"
        )
    return 0


def _cmd_reproduce_fasttracker_official(args: argparse.Namespace) -> int:
    cfg = load_yaml(args.config)
    results = reproduce_fasttracker_official(cfg)
    for result in results:
        overall = result.summary["overall"]
        print(
            f"{result.variant_name}: "
            f"MOTA={float(overall['mota']):.6f} "
            f"IDF1={float(overall['idf1']):.6f} "
            f"Precision={float(overall['precision']):.6f} "
            f"Recall={float(overall['recall']):.6f}"
        )
    return 0


def _cmd_export_vlm_pseudo_labels(args: argparse.Namespace) -> int:
    cfg = load_yaml(args.config)
    payload = export_vlm_pseudo_labels(cfg)
    try:
        journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
        append_event_journal(
            journal_path,
            category="export-vlm-pseudo-labels",
            name=str(cfg["vlm_supervised_detector"]["pseudo_labels"]["output_tag"]),
            bullets=[
                f"Config: `{args.config}`",
                f"Source cache tag: `{cfg['vlm_supervised_detector']['pseudo_labels']['source_cache_tag']}`",
                f"Output root: `{payload['pseudo_label_export']['output_root']}`",
                f"Train images: {payload['pseudo_label_export']['subsets']['train']['images']}",
                f"Val images: {payload['pseudo_label_export']['subsets']['val']['images']}",
                f"Train boxes: {payload['pseudo_label_export']['subsets']['train']['boxes']}",
                f"Val boxes: {payload['pseudo_label_export']['subsets']['val']['boxes']}",
            ],
        )
    except Exception:
        pass
    print(payload["artifacts"]["dataset_yaml"])
    return 0


def _cmd_train_vlm_student(args: argparse.Namespace) -> int:
    cfg = load_yaml(args.config)
    payload = train_vlm_student_detector(cfg)
    try:
        journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
        append_event_journal(
            journal_path,
            category="train-vlm-student",
            name=str(cfg["vlm_supervised_detector"]["student"]["run_name"]),
            bullets=[
                f"Config: `{args.config}`",
                f"Pseudo dataset root: `{payload['pseudo_dataset_root']}`",
                f"Run dir: `{payload['run_dir']}`",
                f"Selected weights: `{payload['weights']['selected']}`",
            ],
        )
    except Exception:
        pass
    print(payload["weights"]["selected"])
    return 0


def _cmd_cache_student_detections(args: argparse.Namespace) -> int:
    cfg = load_yaml(args.config)
    payload = cache_student_detections(cfg)
    try:
        journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
        append_event_journal(
            journal_path,
            category="cache-student-detections",
            name=str(cfg["vlm_supervised_detector"]["student_cache"]["cache_tag"]),
            bullets=[
                f"Config: `{args.config}`",
                f"Weights path: `{payload['weights_path']}`",
                f"Cache tag: `{payload['cache_tag']}`",
            ],
        )
    except Exception:
        pass
    for path in payload["cache_paths"]:
        print(path)
    return 0


def _cmd_cache_bytetrack_teacher(args: argparse.Namespace) -> int:
    cfg = load_yaml(args.config)
    artifact_root = Path(cfg["paths"]["artifact_root"]).expanduser().resolve()
    lock_path = artifact_root / "detections.lock"
    cache_tag = str(cfg["vlm_head_distillation"]["teacher_detector"]["cache_tag"])
    cache_dir = artifact_root / "detections" / cache_tag
    sequences = list(cfg.get("dataset", {}).get("sequences") or [])
    candidate_outputs = [cache_dir / f"{name}.jsonl" for name in sequences] if sequences else list(cache_dir.glob("*.jsonl"))
    try:
        _raise_if_missing_lock_but_writers(lock_path, candidate_outputs)
        with exclusive_file_lock(lock_path):
            payload = cache_bytetrack_teacher_detections(
                cfg,
                overwrite=bool(args.overwrite),
                max_frames_override=args.max_frames,
                max_new_frames_override=args.max_new_frames,
            )
    except RuntimeError as exc:
        if "Lock already exists:" not in str(exc):
            raise
        try:
            journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
            append_event_journal(
                journal_path,
                category="blocker",
                name="cache_bytetrack_teacher_lock_exists",
                bullets=[f"Config: `{args.config}`", f"Error: `{exc}`"],
            )
        except Exception:
            pass
        print(f"ERROR: {exc}")
        return 1
    try:
        journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
        append_event_journal(
            journal_path,
            category="cache-bytetrack-teacher",
            name=str(cfg["vlm_head_distillation"]["teacher_detector"]["cache_tag"]),
            bullets=[
                f"Config: `{args.config}`",
                f"Cache tag: `{payload['cache_tag']}`",
                f"Device: `{payload['device']}`",
                f"Checkpoint: `{payload['checkpoint']}`",
                f"Overwrite: {bool(args.overwrite)}",
                f"Max frames/seq: {args.max_frames if args.max_frames is not None else '(config default)'}",
                f"Max new frames/seq: {args.max_new_frames if args.max_new_frames is not None else '(unlimited)'}",
            ],
        )
    except Exception:
        pass
    for path in payload["cache_paths"]:
        print(path)
    return 0


def _cmd_train_vlm_head_student(args: argparse.Namespace) -> int:
    cfg = load_yaml(args.config)
    payload = train_vlm_detection_head(cfg)
    try:
        journal_path = Path(cfg["paths"]["docs_experiments_dir"]) / "EXP-003-optimization-journal.md"
        append_event_journal(
            journal_path,
            category="train-vlm-head-student",
            name=str(cfg["vlm_head_distillation"]["student"]["output_tag"]),
            bullets=[
                f"Config: `{args.config}`",
                f"Prompt: `{payload['prompt']}`",
                f"Checkpoint: `{payload['checkpoint_path']}`",
                f"Train images: {payload['dataset_sizes']['train_images']}",
                f"Val images: {payload['dataset_sizes']['val_images']}",
                f"Trainable params: {payload['trainable_parameter_count']}",
            ],
        )
    except Exception:
        pass
    print(payload["checkpoint_path"])
    return 0


def main() -> int:
    parser = _build_parser()
    args = parser.parse_args()
    if args.command == "cache-detections":
        return _cmd_cache(args)
    if args.command == "refine-detections":
        return _cmd_refine(args)
    if args.command == "tune":
        return _cmd_tune(args)
    if args.command == "evaluate":
        return _cmd_evaluate(args)
    if args.command == "audit-detector":
        return _cmd_audit_detector(args)
    if args.command == "verify-trial":
        return _cmd_verify_trial(args)
    if args.command == "reproduce-fasttracker-public":
        return _cmd_reproduce_fasttracker_public(args)
    if args.command == "reproduce-fasttracker-official":
        return _cmd_reproduce_fasttracker_official(args)
    if args.command == "export-vlm-pseudo-labels":
        return _cmd_export_vlm_pseudo_labels(args)
    if args.command == "train-vlm-student":
        return _cmd_train_vlm_student(args)
    if args.command == "cache-student-detections":
        return _cmd_cache_student_detections(args)
    if args.command == "cache-bytetrack-teacher":
        return _cmd_cache_bytetrack_teacher(args)
    if args.command == "train-vlm-head-student":
        return _cmd_train_vlm_head_student(args)
    raise ValueError(f"Unsupported command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
