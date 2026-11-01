from __future__ import annotations

import math
from collections import defaultdict
from pathlib import Path
from typing import Iterable

import numpy as np

from mot20_io import SequenceInfo, read_mot_rows, write_mot_rows


def _rows_by_track(rows: list[list[float]]) -> dict[int, list[list[float]]]:
    grouped: dict[int, list[list[float]]] = defaultdict(list)
    for row in rows:
        grouped[int(row[1])].append(row)
    for track_rows in grouped.values():
        track_rows.sort(key=lambda row: int(row[0]))
    return grouped


def _center(row: list[float]) -> tuple[float, float]:
    return float(row[2]) + 0.5 * float(row[4]), float(row[3]) + 0.5 * float(row[5])


def _cell_for_point(x: float, y: float, sequence: SequenceInfo, grid_x: int, grid_y: int) -> tuple[int, int]:
    gx = min(max(int(float(x) / max(sequence.width, 1) * int(grid_x)), 0), int(grid_x) - 1)
    gy = min(max(int(float(y) / max(sequence.height, 1) * int(grid_y)), 0), int(grid_y) - 1)
    return gx, gy


def _iou_tlwh(a: list[float], b: list[float]) -> float:
    ax1, ay1, aw, ah = float(a[2]), float(a[3]), float(a[4]), float(a[5])
    bx1, by1, bw, bh = float(b[2]), float(b[3]), float(b[4]), float(b[5])
    ax2, ay2 = ax1 + aw, ay1 + ah
    bx2, by2 = bx1 + bw, by1 + bh
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    if inter <= 0.0:
        return 0.0
    return float(inter / max(aw * ah + bw * bh - inter, 1e-9))


def estimate_occlusion_hotspots(
    rows: list[list[float]],
    sequence: SequenceInfo,
    *,
    grid_x: int = 16,
    grid_y: int = 9,
    overlap_iou: float = 0.25,
    min_count_percentile: float = 85.0,
) -> np.ndarray:
    pass
    grid = np.zeros((int(grid_y), int(grid_x)), dtype=np.float32)
    rows_by_frame: dict[int, list[list[float]]] = defaultdict(list)
    for row in rows:
        rows_by_frame[int(row[0])].append(row)
        cx, cy = _center(row)
        gx, gy = _cell_for_point(cx, cy, sequence, grid_x, grid_y)
        grid[gy, gx] += 1.0

    for frame_rows in rows_by_frame.values():
        if len(frame_rows) < 2:
            continue
        for idx, first in enumerate(frame_rows):
            for second in frame_rows[idx + 1 :]:
                if _iou_tlwh(first, second) < float(overlap_iou):
                    continue
                for row in (first, second):
                    cx, cy = _center(row)
                    gx, gy = _cell_for_point(cx, cy, sequence, grid_x, grid_y)
                    grid[gy, gx] += 2.0

    positive = grid[grid > 0]
    hotspots = np.zeros_like(grid, dtype=bool)
    if len(positive):
        threshold = float(np.percentile(positive, float(min_count_percentile)))
        hotspots = grid >= max(threshold, 1.0)
    return hotspots


def _path_touches_hotspot(
    left: list[float],
    right: list[float],
    sequence: SequenceInfo,
    hotspots: np.ndarray,
    *,
    samples: int = 5,
) -> bool:
    if hotspots.size == 0:
        return False
    grid_y, grid_x = hotspots.shape
    lx, ly = _center(left)
    rx, ry = _center(right)
    for alpha in np.linspace(0.0, 1.0, max(int(samples), 2)):
        x = lx * (1.0 - float(alpha)) + rx * float(alpha)
        y = ly * (1.0 - float(alpha)) + ry * float(alpha)
        gx, gy = _cell_for_point(x, y, sequence, grid_x, grid_y)
        if bool(hotspots[gy, gx]):
            return True
    return False


def _momentum_consistent(track_rows: list[list[float]], index: int, *, max_angle_deg: float) -> bool:
    if index <= 0 or index + 1 >= len(track_rows):
        return True
    prev_row = track_rows[index - 1]
    left = track_rows[index]
    right = track_rows[index + 1]
    px, py = _center(prev_row)
    lx, ly = _center(left)
    rx, ry = _center(right)
    a = np.asarray([lx - px, ly - py], dtype=np.float32)
    b = np.asarray([rx - lx, ry - ly], dtype=np.float32)
    na = float(np.linalg.norm(a))
    nb = float(np.linalg.norm(b))
    if na < 1e-6 or nb < 1e-6:
        return True
    cosine = float(np.dot(a, b) / max(na * nb, 1e-6))
    cosine = min(max(cosine, -1.0), 1.0)
    angle = math.degrees(math.acos(cosine))
    return bool(angle <= float(max_angle_deg))


def adaptive_gap_recovery(
    rows: list[list[float]],
    sequence: SequenceInfo,
    *,
    base_max_gap: int = 10,
    hotspot_max_gap: int = 45,
    grid_x: int = 16,
    grid_y: int = 9,
    overlap_iou: float = 0.25,
    hotspot_percentile: float = 85.0,
    max_momentum_angle: float = 135.0,
    interpolated_conf_decay: float = 0.90,
) -> tuple[list[tuple[int, int, float, float, float, float, float]], dict]:
    hotspots = estimate_occlusion_hotspots(
        rows,
        sequence,
        grid_x=int(grid_x),
        grid_y=int(grid_y),
        overlap_iou=float(overlap_iou),
        min_count_percentile=float(hotspot_percentile),
    )
    out_rows: list[tuple[int, int, float, float, float, float, float]] = []
    added_rows = 0
    hotspot_gaps = 0
    normal_gaps = 0
    for track_id, track_rows in _rows_by_track(rows).items():
        for index, row in enumerate(track_rows):
            out_rows.append((int(row[0]), int(track_id), float(row[2]), float(row[3]), float(row[4]), float(row[5]), float(row[6])))
            if index + 1 >= len(track_rows):
                continue
            right = track_rows[index + 1]
            gap = int(right[0] - row[0] - 1)
            if gap <= 0:
                continue
            in_hotspot = _path_touches_hotspot(row, right, sequence, hotspots)
            max_gap = int(hotspot_max_gap if in_hotspot else base_max_gap)
            if gap > max_gap:
                continue
            if not _momentum_consistent(track_rows, index, max_angle_deg=float(max_momentum_angle)):
                continue
            if in_hotspot:
                hotspot_gaps += 1
            else:
                normal_gaps += 1
            total_dt = float(right[0] - row[0])
            conf = min(float(row[6]), float(right[6]))
            for step, frame in enumerate(range(int(row[0]) + 1, int(right[0])), start=1):
                alpha = float(step) / max(total_dt, 1.0)
                x = float(row[2]) * (1.0 - alpha) + float(right[2]) * alpha
                y = float(row[3]) * (1.0 - alpha) + float(right[3]) * alpha
                w = float(row[4]) * (1.0 - alpha) + float(right[4]) * alpha
                h = float(row[5]) * (1.0 - alpha) + float(right[5]) * alpha
                decayed = conf * (float(interpolated_conf_decay) ** min(step, gap - step + 1))
                out_rows.append((int(frame), int(track_id), x, y, w, h, decayed))
                added_rows += 1
    metadata = {
        "added_rows": int(added_rows),
        "hotspot_gaps_filled": int(hotspot_gaps),
        "normal_gaps_filled": int(normal_gaps),
        "hotspot_cells": int(np.sum(hotspots)),
        "grid_x": int(grid_x),
        "grid_y": int(grid_y),
    }
    return out_rows, metadata


def apply_adaptive_gap_recovery(
    *,
    tracker_dir: str | Path,
    output_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    base_max_gap: int = 10,
    hotspot_max_gap: int = 45,
    grid_x: int = 16,
    grid_y: int = 9,
    overlap_iou: float = 0.25,
    hotspot_percentile: float = 85.0,
    max_momentum_angle: float = 135.0,
    interpolated_conf_decay: float = 0.90,
) -> dict[str, dict]:
    tracker_root = Path(tracker_dir).expanduser().resolve()
    if (tracker_root / "data").exists():
        tracker_root = tracker_root / "data"
    out_root = Path(output_dir).expanduser().resolve()
    out_root.mkdir(parents=True, exist_ok=True)
    metadata: dict[str, dict] = {}
    for sequence in sequences:
        rows = read_mot_rows(tracker_root / f"{sequence.name}.txt")
        out_rows, seq_meta = adaptive_gap_recovery(
            rows,
            sequence,
            base_max_gap=int(base_max_gap),
            hotspot_max_gap=int(hotspot_max_gap),
            grid_x=int(grid_x),
            grid_y=int(grid_y),
            overlap_iou=float(overlap_iou),
            hotspot_percentile=float(hotspot_percentile),
            max_momentum_angle=float(max_momentum_angle),
            interpolated_conf_decay=float(interpolated_conf_decay),
        )
        write_mot_rows(out_root / f"{sequence.name}.txt", out_rows)
        metadata[sequence.name] = seq_meta
        print(f"{sequence.name}: adaptive FN recovery added {seq_meta['added_rows']} rows")
    return metadata
