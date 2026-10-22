from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class MotRow:
    frame: int
    track_id: int
    x: float
    y: float
    w: float
    h: float
    score: float


def _parse_mot_results(path: Path) -> list[MotRow]:
    if not path.exists() or path.stat().st_size == 0:
        return []
    rows: list[MotRow] = []
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            text = line.strip()
            if not text:
                continue
            parts = text.split(",")
            if len(parts) < 6:
                continue
            if len(parts) < 7:
                parts = parts + ["-1"] * (7 - len(parts))
            parts = parts[:7]
            try:
                frame = int(float(parts[0]))
                track_id = int(float(parts[1]))
                x = float(parts[2])
                y = float(parts[3])
                w = float(parts[4])
                h = float(parts[5])
                score = float(parts[6])
            except Exception:
                continue
            rows.append(
                MotRow(
                    frame=frame,
                    track_id=track_id,
                    x=x,
                    y=y,
                    w=w,
                    h=h,
                    score=score,
                )
            )
    return rows


def _write_mot_results(path: Path, rows: list[MotRow]) -> None:
    rows_sorted = sorted(rows, key=lambda r: (r.frame, r.track_id))
    with path.open("w", encoding="utf-8") as handle:
        for row in rows_sorted:
            handle.write(
                f"{row.frame},{row.track_id},"
                f"{row.x:.3f},{row.y:.3f},{row.w:.3f},{row.h:.3f},"
                f"{row.score:.6f},-1,-1,-1\n"
            )


def interpolate_mot_results(
    path: str | Path,
    *,
    max_gap: int,
    min_endpoint_score: float | None = None,
    min_endpoint_iou: float | None = None,
) -> int:
    pass
    max_gap = int(max_gap)
    if max_gap <= 0:
        return 0

    resolved = Path(path).expanduser().resolve()
    rows = _parse_mot_results(resolved)
    if not rows:
        return 0

    def _row_xyxy(row: MotRow) -> tuple[float, float, float, float]:
        return (row.x, row.y, row.x + row.w, row.y + row.h)

    def _iou(a: tuple[float, float, float, float], b: tuple[float, float, float, float]) -> float:
        ax1, ay1, ax2, ay2 = a
        bx1, by1, bx2, by2 = b
        ix1 = max(ax1, bx1)
        iy1 = max(ay1, by1)
        ix2 = min(ax2, bx2)
        iy2 = min(ay2, by2)
        iw = max(0.0, ix2 - ix1)
        ih = max(0.0, iy2 - iy1)
        inter = iw * ih
        if inter <= 0.0:
            return 0.0
        area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
        area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)
        denom = area_a + area_b - inter
        if denom <= 0.0:
            return 0.0
        return float(inter / denom)

    by_track: dict[int, list[MotRow]] = {}
    for row in rows:
        by_track.setdefault(row.track_id, []).append(row)

    added: list[MotRow] = []
    for track_id, track_rows in by_track.items():
        track_rows.sort(key=lambda r: r.frame)
        existing_frames = {r.frame for r in track_rows}
        for left, right in zip(track_rows, track_rows[1:]):
            gap = int(right.frame - left.frame)
            if gap <= 1 or gap > max_gap + 1:
                continue
            endpoint_score = min(float(left.score), float(right.score))
            if min_endpoint_score is not None and endpoint_score < float(min_endpoint_score):
                continue
            if min_endpoint_iou is not None and float(min_endpoint_iou) > 0.0:
                if _iou(_row_xyxy(left), _row_xyxy(right)) < float(min_endpoint_iou):
                    continue
            for frame in range(left.frame + 1, right.frame):
                if frame in existing_frames:
                    continue
                t = (frame - left.frame) / float(gap)
                added.append(
                    MotRow(
                        frame=frame,
                        track_id=track_id,
                        x=left.x + (right.x - left.x) * t,
                        y=left.y + (right.y - left.y) * t,
                        w=left.w + (right.w - left.w) * t,
                        h=left.h + (right.h - left.h) * t,
                        score=endpoint_score,
                    )
                )

    if not added:
        return 0

    _write_mot_results(resolved, rows + added)
    return len(added)


def clip_filter_mot_results(
    path: str | Path,
    *,
    image_width: int,
    image_height: int,
    clip_boxes: bool = True,
    min_score: float | None = None,
    min_box_area: float | None = None,
    min_height: float | None = None,
    min_width: float | None = None,
    min_height_width_ratio: float | None = None,
    max_height_width_ratio: float | None = None,
    max_box_area_fraction: float | None = None,
) -> int:
    pass
    resolved = Path(path).expanduser().resolve()
    rows = _parse_mot_results(resolved)
    if not rows:
        return 0

    width_limit = max(float(image_width), 1.0)
    height_limit = max(float(image_height), 1.0)
    filtered: list[MotRow] = []
    removed = 0

    for row in rows:
        x1 = float(row.x)
        y1 = float(row.y)
        x2 = float(row.x + row.w)
        y2 = float(row.y + row.h)

        if clip_boxes:
            x1 = min(max(0.0, x1), width_limit)
            y1 = min(max(0.0, y1), height_limit)
            x2 = min(max(0.0, x2), width_limit)
            y2 = min(max(0.0, y2), height_limit)

        width = max(0.0, x2 - x1)
        height = max(0.0, y2 - y1)
        area = width * height
        ratio = height / max(width, 1e-6)

        keep = True
        if min_score is not None and float(row.score) < float(min_score):
            keep = False
        if min_box_area is not None and area < float(min_box_area):
            keep = False
        if min_height is not None and height < float(min_height):
            keep = False
        if min_width is not None and width < float(min_width):
            keep = False
        if min_height_width_ratio is not None and ratio < float(min_height_width_ratio):
            keep = False
        if max_height_width_ratio is not None and ratio > float(max_height_width_ratio):
            keep = False
        if max_box_area_fraction is not None and area > float(max_box_area_fraction) * (width_limit * height_limit):
            keep = False
        if width <= 0.0 or height <= 0.0:
            keep = False

        if keep:
            filtered.append(
                MotRow(
                    frame=row.frame,
                    track_id=row.track_id,
                    x=x1,
                    y=y1,
                    w=width,
                    h=height,
                    score=float(row.score),
                )
            )
        else:
            removed += 1

    if removed > 0 or clip_boxes:
        _write_mot_results(resolved, filtered)
    return removed


def filter_short_tracks(
    path: str | Path,
    *,
    min_track_length: int,
    min_avg_score: float | None = None,
    min_total_score: float | None = None,
) -> int:
    pass
    resolved = Path(path).expanduser().resolve()
    rows = _parse_mot_results(resolved)
    if not rows:
        return 0

    min_track_length = int(min_track_length)
    if min_track_length <= 1 and min_avg_score is None and min_total_score is None:
        return 0

    stats: dict[int, dict[str, float | int]] = {}
    for row in rows:
        entry = stats.setdefault(row.track_id, {"count": 0, "sum": 0.0})
        entry["count"] = int(entry["count"]) + 1
        entry["sum"] = float(entry["sum"]) + float(row.score)

    keep_ids: set[int] = set()
    for track_id, entry in stats.items():
        count = int(entry["count"])
        total = float(entry["sum"])
        if min_track_length > 1 and count < min_track_length:
            continue
        if min_total_score is not None and total < float(min_total_score):
            continue
        if min_avg_score is not None and (total / max(count, 1)) < float(min_avg_score):
            continue
        keep_ids.add(int(track_id))

    if not keep_ids:
        removed = len(rows)
        if removed:
            resolved.write_text("", encoding="utf-8")
        return removed

    filtered = [row for row in rows if row.track_id in keep_ids]
    removed = len(rows) - len(filtered)
    if removed > 0:
        _write_mot_results(resolved, filtered)
    return removed
