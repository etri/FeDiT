from __future__ import annotations

from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
from typing import Any, Callable


def _pct(value: float) -> str:
    return f"{value * 100:.2f}%"


def _tracker_table(per_sequence: dict[str, dict[str, Any]]) -> str:
    lines = [
        "| Sequence | MOTA | IDF1 | Precision | Recall | FP | FN | IDs |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for sequence_name, metrics in sorted(per_sequence.items()):
        lines.append(
            "| "
            + " | ".join(
                [
                    sequence_name,
                    _pct(float(metrics["mota"])),
                    _pct(float(metrics["idf1"])),
                    _pct(float(metrics["precision"])),
                    _pct(float(metrics["recall"])),
                    str(metrics["num_false_positives"]),
                    str(metrics["num_misses"]),
                    str(metrics["num_switches"]),
                ]
            )
            + " |"
        )
    return "\n".join(lines)


def write_trial_report(
    *,
    docs_dir: str | Path,
    study_name: str | None = None,
    trial_number: int,
    status: str,
    tracker_name: str,
    detector_params: dict[str, Any],
    tracker_params: dict[str, Any],
    summary: dict[str, Any],
    per_sequence: dict[str, dict[str, Any]],
    error: str | None = None,
) -> Path:
    docs_root = Path(docs_dir).expanduser().resolve() / "generated"
    if study_name:
        docs_root = docs_root / str(study_name)
    docs_root.mkdir(parents=True, exist_ok=True)
    report_path = docs_root / f"trial_{trial_number:04d}.md"

    content = "\n".join(
        [
            f"# Trial {trial_number:04d}",
            "",
            "## Summary",
            "",
            f"- Status: {status}",
            f"- Tracker: `{tracker_name}`",
            f"- MOTA: {_pct(float(summary['mota']))}",
            f"- IDF1: {_pct(float(summary['idf1']))}",
            f"- Precision: {_pct(float(summary['precision']))}",
            f"- Recall: {_pct(float(summary['recall']))}",
            f"- FP: {summary['num_false_positives']}",
            f"- FN: {summary['num_misses']}",
            f"- IDs: {summary['num_switches']}",
            "",
            "## Error" if error else "",
            error or "",
            "" if error else "",
            "## Detector Params",
            "",
            "```json",
            json.dumps(detector_params, indent=2, ensure_ascii=True),
            "```",
            "",
            "## Tracker Params",
            "",
            "```json",
            json.dumps(tracker_params, indent=2, ensure_ascii=True),
            "```",
            "",
            "## Sequence Metrics",
            "",
            _tracker_table(per_sequence),
            "",
        ]
    )
    report_path.write_text(content + "\n", encoding="utf-8")
    return report_path


def write_json_summary(path: str | Path, payload: dict[str, Any]) -> Path:
    resolved = Path(path).expanduser().resolve()
    resolved.parent.mkdir(parents=True, exist_ok=True)
    resolved.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    return resolved


def build_trial_signature(
    *,
    tracker_name: str,
    detector_params: dict[str, Any],
    tracker_params: dict[str, Any],
    detector_cache_signature: str | None = None,
    tracking_postprocess: dict[str, Any] | None = None,
) -> str:
    payload: dict[str, Any] = {
        "detector_cache_signature": detector_cache_signature,
        "tracker_name": tracker_name,
        "detector_params": detector_params,
        "tracker_params": tracker_params,
    }
    if tracking_postprocess:
        payload["tracking_postprocess"] = tracking_postprocess
    encoded = json.dumps(payload, sort_keys=True, ensure_ascii=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:16]


def build_config_signature(payload: dict[str, Any]) -> str:
    encoded = json.dumps(payload, sort_keys=True, ensure_ascii=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:16]


def load_trial_ledger(path: str | Path) -> dict[str, dict[str, Any]]:
    resolved = Path(path).expanduser().resolve()
    if not resolved.exists():
        return {}

    def score(payload: dict[str, Any]) -> tuple[int, float]:
        summary = payload.get("summary") or {}
        frames = int(summary.get("num_frames") or 0)
        mota = float(summary.get("mota") or 0.0)
        return (frames, mota)

    def status_rank(payload: dict[str, Any]) -> int:
        status = str(payload.get("status") or "").lower()
        if status == "completed":
            return 4
        if status == "pruned":
            return 3
        if status == "failed":
            return 2
        if status == "skipped_duplicate":
            return 1
        return 0

    ledger: dict[str, dict[str, Any]] = {}
    for line in resolved.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        payload = json.loads(line)
        signature = payload.get("signature")
        if signature:
            sig = str(signature)
            existing = ledger.get(sig)
            if existing is None:
                ledger[sig] = payload
                continue
            if score(payload) > score(existing):
                ledger[sig] = payload
                continue
            if score(payload) == score(existing) and status_rank(payload) > status_rank(existing):
                ledger[sig] = payload
    return ledger


def canonicalize_trial_ledger(
    ledger: dict[str, dict[str, Any]],
    *,
    detector_cache_signature: str,
    tracking_postprocess: dict[str, Any] | None = None,
    normalize_detector_params: Callable[[dict[str, Any]], dict[str, Any]] | None = None,
) -> dict[str, dict[str, Any]]:
    pass

    
    
    
    canonical: dict[str, dict[str, Any]] = {}
    for key, payload in ledger.items():
        status = str(payload.get("status") or "").lower()
        if status in {"running", "skipped_duplicate"}:
            continue
        canonical[key] = payload

    def score(payload: dict[str, Any]) -> tuple[int, float]:
        summary = payload.get("summary") or {}
        frames = int(summary.get("num_frames") or 0)
        mota = float(summary.get("mota") or 0.0)
        return (frames, mota)

    def matches_cache_scope(study_name: str) -> bool:
        pass

        if not study_name:
            return False
        try:
            parts = [part for part in str(study_name).split("_") if part]
        except Exception:
            return False
        return str(detector_cache_signature) in parts

    for payload in list(ledger.values()):
        status = str(payload.get("status") or "").lower()
        if status in {"running", "skipped_duplicate"}:
            continue
        study_name = str(payload.get("study_name") or "")
        if not matches_cache_scope(study_name):
            continue
        if tracking_postprocess is not None:
            stored_postprocess = payload.get("tracking_postprocess")
            if stored_postprocess is None:
                
                continue
            try:
                if dict(stored_postprocess) != dict(tracking_postprocess):
                    continue
            except Exception:
                continue
        tracker_name = payload.get("tracker_name")
        if not tracker_name:
            continue
        detector_params = dict(payload.get("detector_params") or {})
        if normalize_detector_params is not None:
            try:
                detector_params = dict(normalize_detector_params(dict(detector_params)) or detector_params)
            except Exception:
                detector_params = dict(payload.get("detector_params") or {})
        tracker_params = dict(payload.get("tracker_params") or {})
        try:
            canonical_sig = build_trial_signature(
                tracker_name=str(tracker_name),
                detector_params=detector_params,
                tracker_params=tracker_params,
                detector_cache_signature=detector_cache_signature,
                tracking_postprocess=tracking_postprocess,
            )
        except Exception:
            continue

        existing = canonical.get(canonical_sig)
        if existing is None or score(payload) > score(existing):
            canonical[canonical_sig] = payload

    return canonical


def append_trial_ledger(path: str | Path, payload: dict[str, Any]) -> Path:
    resolved = Path(path).expanduser().resolve()
    resolved.parent.mkdir(parents=True, exist_ok=True)
    with resolved.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, ensure_ascii=True) + "\n")
    return resolved


def append_iteration_journal(
    path: str | Path,
    *,
    study_name: str,
    trial_number: int,
    status: str,
    signature: str,
    tracker_name: str,
    detector_params: dict[str, Any],
    tracker_params: dict[str, Any],
    summary: dict[str, Any] | None = None,
    error: str | None = None,
    duplicate_of: str | None = None,
) -> Path:
    resolved = Path(path).expanduser().resolve()
    resolved.parent.mkdir(parents=True, exist_ok=True)

    if not resolved.exists():
        resolved.write_text(
            "\n".join(
                [
                    "# Optimization Journal",
                    "",
                    "- 목적: 목표 MOTA 달성까지 반복 실험 로그를 누적 기록",
                    "- 규칙: trial signature 기준으로 중복 실행을 피하고, 모든 trial 상태를 남김",
                    "",
                ]
            )
            + "\n",
            encoding="utf-8",
        )

    timestamp = datetime.now().astimezone().isoformat(timespec="seconds")
    lines = [
        f"## {timestamp} | {study_name} | trial_{trial_number:04d}",
        "",
        f"- Status: {status}",
        f"- Signature: `{signature}`",
        f"- Tracker: `{tracker_name}`",
    ]
    if duplicate_of:
        lines.append(f"- Duplicate Of: `{duplicate_of}`")
    if summary is not None:
        lines.extend(
            [
                f"- MOTA: {_pct(float(summary['mota']))}",
                f"- IDF1: {_pct(float(summary['idf1']))}",
                f"- Precision: {_pct(float(summary['precision']))}",
                f"- Recall: {_pct(float(summary['recall']))}",
                f"- FP: {summary['num_false_positives']}",
                f"- FN: {summary['num_misses']}",
                f"- IDs: {summary['num_switches']}",
            ]
        )
    if error:
        lines.append(f"- Error: `{error}`")

    lines.extend(
        [
            "",
            "### Detector Params",
            "",
            "```json",
            json.dumps(detector_params, indent=2, ensure_ascii=True),
            "```",
            "",
            "### Tracker Params",
            "",
            "```json",
            json.dumps(tracker_params, indent=2, ensure_ascii=True),
            "```",
            "",
        ]
    )

    with resolved.open("a", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")
    return resolved


def append_event_journal(
    path: str | Path,
    *,
    category: str,
    name: str,
    bullets: list[str] | None = None,
) -> Path:
    resolved = Path(path).expanduser().resolve()
    resolved.parent.mkdir(parents=True, exist_ok=True)

    if not resolved.exists():
        resolved.write_text(
            "\n".join(
                [
                    "# Optimization Journal",
                    "",
                    "- 목적: 목표 MOTA 달성까지 반복 실험 로그를 누적 기록",
                    "- 규칙: trial signature 기준으로 중복 실행을 피하고, 모든 trial 상태를 남김",
                    "",
                ]
            )
            + "\n",
            encoding="utf-8",
        )

    timestamp = datetime.now().astimezone().isoformat(timespec="seconds")
    lines = [f"## {timestamp} | {category} | {name}", ""]
    for bullet in bullets or []:
        safe = str(bullet).strip()
        if not safe:
            continue
        lines.append(f"- {safe}")
    lines.append("")

    with resolved.open("a", encoding="utf-8") as handle:
        
        
        try:
            import fcntl  

            fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        except Exception:
            pass
        handle.write("\n".join(lines) + "\n")
        try:
            handle.flush()
            os.fsync(handle.fileno())
        except Exception:
            pass
    return resolved
