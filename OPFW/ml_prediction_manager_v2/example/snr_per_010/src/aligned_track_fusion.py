from __future__ import annotations

from collections import defaultdict
from pathlib import Path

import numpy as np

from mot20_io import read_mot_rows, write_mot_rows
from nms import pairwise_iou_xyxy


def _tracker_root(path: str | Path) -> Path:
    root = Path(path).expanduser().resolve()
    return root / "data" if (root / "data").exists() else root


def _group_rows(
    rows: list[list[float]],
    column: int,
) -> dict[int, list[list[float]]]:
    grouped: dict[int, list[list[float]]] = defaultdict(list)
    for row in rows:
        grouped[int(row[column])].append(row)
    for values in grouped.values():
        values.sort(key=lambda row: int(row[0]))
    return dict(grouped)


def _boxes(rows: list[list[float]]) -> np.ndarray:
    if not rows:
        return np.zeros((0, 4), dtype=np.float32)
    return np.asarray(
        [
            [
                float(row[2]),
                float(row[3]),
                float(row[2] + row[4]),
                float(row[3] + row[5]),
            ]
            for row in rows
        ],
        dtype=np.float32,
    )


def fuse_aligned_tracks(
    *,
    base_rows: list[list[float]],
    auxiliary_rows: list[list[float]],
    anchor_iou: float = 0.5,
    min_anchor_rows: int = 3,
    min_anchor_fraction: float = 0.05,
    duplicate_iou: float = 0.3,
    endpoint_extension: int = 20,
    min_score: float = 0.0,
) -> tuple[list[tuple[int, int, float, float, float, float, float]], dict]:
    base_by_frame = _group_rows(base_rows, 0)
    base_by_track = _group_rows(base_rows, 1)
    auxiliary_by_track = _group_rows(auxiliary_rows, 1)
    occupied = {(int(row[0]), int(row[1])) for row in base_rows}

    
    
    proposals: dict[
        tuple[int, int],
        tuple[tuple[float, float, float, float], list[float]],
    ] = {}
    mapped_tracks = 0
    rejected_unanchored = 0
    rejected_duplicate = 0
    rejected_range = 0

    for track_rows in auxiliary_by_track.values():
        votes: dict[int, list[tuple[int, float]]] = defaultdict(list)
        for row in track_rows:
            frame_rows = base_by_frame.get(int(row[0]), [])
            if not frame_rows:
                continue
            iou = pairwise_iou_xyxy(_boxes([row]), _boxes(frame_rows))[0]
            best = int(np.argmax(iou))
            if float(iou[best]) >= float(anchor_iou):
                votes[int(frame_rows[best][1])].append(
                    (int(row[0]), float(iou[best]))
                )

        if not votes:
            rejected_unanchored += 1
            continue
        base_id, anchors = max(
            votes.items(),
            key=lambda item: (
                len(item[1]),
                float(np.sum([value for _frame, value in item[1]])),
            ),
        )
        anchor_count = len(anchors)
        anchor_fraction = float(anchor_count / max(len(track_rows), 1))
        if anchor_count < int(min_anchor_rows) or anchor_fraction < float(
            min_anchor_fraction
        ):
            rejected_unanchored += 1
            continue
        mapped_tracks += 1
        anchor_frames = np.asarray(
            [frame for frame, _value in anchors],
            dtype=np.int32,
        )
        anchor_mean_iou = float(np.mean([value for _frame, value in anchors]))
        allowed_start = int(np.min(anchor_frames)) - int(endpoint_extension)
        allowed_end = int(np.max(anchor_frames)) + int(endpoint_extension)
        base_frames = {
            int(row[0]) for row in base_by_track.get(int(base_id), [])
        }

        for row in track_rows:
            frame = int(row[0])
            if frame < allowed_start or frame > allowed_end:
                rejected_range += 1
                continue
            if frame in base_frames or (frame, int(base_id)) in occupied:
                continue
            if float(row[6]) < float(min_score):
                continue
            frame_rows = base_by_frame.get(frame, [])
            if frame_rows and float(duplicate_iou) < 1.0:
                max_iou = float(
                    np.max(pairwise_iou_xyxy(_boxes([row]), _boxes(frame_rows)))
                )
                if max_iou >= float(duplicate_iou):
                    rejected_duplicate += 1
                    continue
            priority = (
                float(anchor_count),
                anchor_fraction,
                anchor_mean_iou,
                float(row[6]),
            )
            key = (frame, int(base_id))
            current = proposals.get(key)
            if current is None or priority > current[0]:
                proposals[key] = (priority, row)

    added_rows = [
        (
            int(frame),
            int(track_id),
            float(row[2]),
            float(row[3]),
            float(row[4]),
            float(row[5]),
            float(row[6]),
        )
        for (frame, track_id), (_priority, row) in proposals.items()
    ]
    output_rows = [
        (
            int(row[0]),
            int(row[1]),
            float(row[2]),
            float(row[3]),
            float(row[4]),
            float(row[5]),
            float(row[6]),
        )
        for row in base_rows
    ]
    output_rows.extend(added_rows)
    stats = {
        "base_rows": int(len(base_rows)),
        "auxiliary_rows": int(len(auxiliary_rows)),
        "auxiliary_tracks": int(len(auxiliary_by_track)),
        "mapped_tracks": int(mapped_tracks),
        "rejected_unanchored_tracks": int(rejected_unanchored),
        "rejected_duplicate_rows": int(rejected_duplicate),
        "rejected_range_rows": int(rejected_range),
        "added_rows": int(len(added_rows)),
        "output_rows": int(len(output_rows)),
    }
    return output_rows, stats


def fuse_tracker_directories(
    *,
    base_tracker_dir: str | Path,
    auxiliary_tracker_dir: str | Path,
    output_dir: str | Path,
    sequence_names: list[str],
    anchor_iou: float = 0.5,
    min_anchor_rows: int = 3,
    min_anchor_fraction: float = 0.05,
    duplicate_iou: float = 0.3,
    endpoint_extension: int = 20,
    min_score: float = 0.0,
) -> dict[str, dict]:
    base_root = _tracker_root(base_tracker_dir)
    auxiliary_root = _tracker_root(auxiliary_tracker_dir)
    target = Path(output_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    result: dict[str, dict] = {}
    for name in sequence_names:
        output_rows, stats = fuse_aligned_tracks(
            base_rows=read_mot_rows(base_root / f"{name}.txt"),
            auxiliary_rows=read_mot_rows(auxiliary_root / f"{name}.txt"),
            anchor_iou=float(anchor_iou),
            min_anchor_rows=int(min_anchor_rows),
            min_anchor_fraction=float(min_anchor_fraction),
            duplicate_iou=float(duplicate_iou),
            endpoint_extension=int(endpoint_extension),
            min_score=float(min_score),
        )
        write_mot_rows(target / f"{name}.txt", output_rows)
        result[name] = stats
    return result
