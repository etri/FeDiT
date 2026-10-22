from __future__ import annotations

import gzip
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
import time
from typing import Any, Iterator


def _open_text(path: Path, mode: str):
    if path.suffix == ".gz":
        return gzip.open(path, mode, encoding="utf-8")
    return path.open(mode, encoding="utf-8")


def append_jsonl(path: str | Path, row: dict[str, Any]) -> None:
    resolved = Path(path).expanduser().resolve()
    resolved.parent.mkdir(parents=True, exist_ok=True)
    with _open_text(resolved, "at") as handle:
        handle.write(json.dumps(row, ensure_ascii=True) + "\n")


def iter_jsonl(path: str | Path) -> Iterator[dict[str, Any]]:
    resolved = Path(path).expanduser().resolve()
    with _open_text(resolved, "rt") as handle:
        for raw_line in handle:
            if not raw_line.strip():
                continue
            line = raw_line.strip()
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                
                
                
                
                
                
                if not raw_line.endswith("\n"):
                    break
                raise


def dedupe_jsonl_by_int_key(
    path: str | Path,
    *,
    key: str = "frame_idx",
    sort_by_key: bool = True,
) -> bool:
    resolved = Path(path).expanduser().resolve()
    if not resolved.exists():
        return False

    rows: list[tuple[int, dict[str, Any]]] = []
    seen: set[int] = set()
    had_duplicates = False
    strictly_increasing = True
    previous_key: int | None = None

    for payload in iter_jsonl(resolved):
        raw = payload.get(key)
        try:
            value = int(raw)
        except (TypeError, ValueError):
            rows.append((-1, payload))
            continue
        if value in seen:
            had_duplicates = True
            continue
        if previous_key is not None and value <= previous_key:
            strictly_increasing = False
        previous_key = value
        seen.add(value)
        rows.append((value, payload))

    if not had_duplicates and (strictly_increasing or not sort_by_key):
        return False

    if sort_by_key:
        rows.sort(key=lambda item: item[0])

    
    
    tmp_path = resolved.with_name(resolved.name + ".tmp")
    tmp_path.parent.mkdir(parents=True, exist_ok=True)
    with _open_text(tmp_path, "wt") as handle:
        for _, payload in rows:
            handle.write(json.dumps(payload, ensure_ascii=True) + "\n")
    
    
    last_exc: Exception | None = None
    for _ in range(5):
        try:
            tmp_path.replace(resolved)
            return True
        except FileNotFoundError as exc:
            last_exc = exc
            time.sleep(0.05)
            continue
    raise RuntimeError(f"Failed to replace dedupe temp file {tmp_path} -> {resolved}: {last_exc!r}")


@dataclass(slots=True)
class JsonlFrameSequenceStats:
    row_count: int
    last_frame_idx: int | None
    unique_frame_count: int
    duplicate_frames: list[int]
    strictly_increasing: bool

    @property
    def is_valid(self) -> bool:
        return not self.duplicate_frames and self.strictly_increasing


def inspect_jsonl_frame_sequence(
    path: str | Path,
    *,
    frame_key: str = "frame_idx",
    max_frame_idx: int | None = None,
    max_unique_frames: int | None = None,
) -> JsonlFrameSequenceStats:
    resolved = Path(path).expanduser().resolve()
    if not resolved.exists():
        return JsonlFrameSequenceStats(
            row_count=0,
            last_frame_idx=None,
            unique_frame_count=0,
            duplicate_frames=[],
            strictly_increasing=True,
        )

    seen: dict[int, int] = {}
    duplicate_frames: list[int] = []
    row_count = 0
    last_frame_idx: int | None = None
    previous_frame_idx: int | None = None
    strictly_increasing = True

    for payload in iter_jsonl(resolved):
        row_count += 1
        frame_idx_raw = payload.get(frame_key)
        try:
            frame_idx = int(frame_idx_raw)
        except (TypeError, ValueError):
            strictly_increasing = False
            continue
        last_frame_idx = frame_idx
        if previous_frame_idx is not None and frame_idx <= previous_frame_idx:
            strictly_increasing = False
        previous_frame_idx = frame_idx
        seen[frame_idx] = seen.get(frame_idx, 0) + 1
        if strictly_increasing:
            if max_frame_idx is not None and frame_idx >= int(max_frame_idx):
                break
            if max_unique_frames is not None and len(seen) >= int(max_unique_frames):
                break

    duplicate_frames = sorted(frame_idx for frame_idx, count in seen.items() if count > 1)
    return JsonlFrameSequenceStats(
        row_count=row_count,
        last_frame_idx=last_frame_idx,
        unique_frame_count=len(seen),
        duplicate_frames=duplicate_frames,
        strictly_increasing=strictly_increasing,
    )


def hash_jsonl_frame_window(
    path: str | Path,
    *,
    frame_key: str = "frame_idx",
    start_frame_idx: int = 1,
    frame_stride: int = 1,
    max_frames: int | None = None,
) -> str:
    pass
    resolved = Path(path).expanduser().resolve()
    hasher = hashlib.sha256()
    try:
        start_frame_idx = max(1, int(start_frame_idx or 1))
    except Exception:
        start_frame_idx = 1
    try:
        frame_stride = max(1, int(frame_stride or 1))
    except Exception:
        frame_stride = 1
    try:
        max_frames_value = int(max_frames) if max_frames is not None else None
        if max_frames_value is not None and max_frames_value <= 0:
            max_frames_value = None
    except Exception:
        max_frames_value = None

    kept = 0
    for payload in iter_jsonl(resolved):
        raw = payload.get(frame_key)
        try:
            frame_idx = int(raw)
        except (TypeError, ValueError):
            continue
        if frame_idx < start_frame_idx:
            continue
        if ((frame_idx - start_frame_idx) % frame_stride) != 0:
            continue
        encoded = json.dumps(payload, sort_keys=True, ensure_ascii=True, separators=(",", ":")).encode("utf-8")
        hasher.update(encoded)
        hasher.update(b"\n")
        kept += 1
        if max_frames_value is not None and kept >= max_frames_value:
            break
    return hasher.hexdigest()[:16]
