from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from scipy.optimize import linear_sum_assignment

from mot20_io import SequenceInfo, gt_to_xyxy, load_gt, read_mot_rows, write_mot_rows
from nms import pairwise_iou_xyxy
from tracklet_linker import Tracklet, _tlwh_to_xyxy, load_tracklets


TRACK_FEATURE_NAMES = [
    "length",
    "log_length",
    "span",
    "density",
    "mean_conf",
    "median_conf",
    "max_conf",
    "min_conf",
    "std_conf",
    "mean_h",
    "median_area_log",
    "aspect_median",
    "motion_per_h",
    "jitter_per_h",
    "start_frame_norm",
    "end_frame_norm",
]


@dataclass(slots=True)
class TrackMatchStats:
    track_id: int
    matched_frames: int
    dominant_gt_id: int
    purity: float


def track_features(track: Tracklet, sequence: SequenceInfo) -> np.ndarray:
    boxes = np.asarray(track.boxes, dtype=np.float32)
    scores = np.asarray(track.scores, dtype=np.float32)
    frames = np.asarray(track.frames, dtype=np.float32)
    length = max(int(track.length), 1)
    span = max(float(track.end_frame - track.start_frame + 1), 1.0)
    centers = np.column_stack([boxes[:, 0] + boxes[:, 2] * 0.5, boxes[:, 1] + boxes[:, 3] * 0.5])
    heights = np.maximum(boxes[:, 3], 1.0)
    mean_h = float(np.mean(heights))
    if len(centers) >= 2:
        steps = np.linalg.norm(np.diff(centers, axis=0), axis=1)
        motion_per_h = float(np.sum(steps) / max(mean_h * max(len(steps), 1), 1e-6))
        if len(steps) >= 2:
            jitter_per_h = float(np.std(steps) / max(mean_h, 1e-6))
        else:
            jitter_per_h = 0.0
    else:
        motion_per_h = 0.0
        jitter_per_h = 0.0
    areas = np.maximum(boxes[:, 2] * boxes[:, 3], 1.0)
    aspects = boxes[:, 3] / np.maximum(boxes[:, 2], 1.0)
    return np.asarray(
        [
            float(length),
            math.log1p(float(length)),
            span,
            float(length / span),
            float(np.mean(scores)) if len(scores) else 0.0,
            float(np.median(scores)) if len(scores) else 0.0,
            float(np.max(scores)) if len(scores) else 0.0,
            float(np.min(scores)) if len(scores) else 0.0,
            float(np.std(scores)) if len(scores) else 0.0,
            mean_h,
            float(np.median(np.log(areas))),
            float(np.median(aspects)),
            motion_per_h,
            jitter_per_h,
            float(track.start_frame / max(sequence.seq_length, 1)),
            float(track.end_frame / max(sequence.seq_length, 1)),
        ],
        dtype=np.float32,
    )


def assign_track_match_stats(
    tracklets: list[Tracklet],
    sequence: SequenceInfo,
    *,
    iou_threshold: float = 0.5,
) -> dict[int, TrackMatchStats]:
    valid_gt, _ignore = load_gt(sequence.gt_path)
    rows_by_frame: dict[int, list[tuple[int, int, np.ndarray]]] = {}
    for track in tracklets:
        for local_idx, frame in enumerate(track.frames.astype(int).tolist()):
            rows_by_frame.setdefault(int(frame), []).append((track.track_id, local_idx, track.boxes[local_idx]))

    matched_gt_ids: dict[int, list[int]] = {track.track_id: [] for track in tracklets}
    for frame_idx, track_rows in rows_by_frame.items():
        gt_frame = valid_gt[valid_gt["frame"] == int(frame_idx)]
        if len(gt_frame) == 0 or not track_rows:
            continue
        gt_boxes = gt_to_xyxy(gt_frame).astype(np.float32)
        det_boxes = _tlwh_to_xyxy(np.asarray([item[2] for item in track_rows], dtype=np.float32))
        iou = pairwise_iou_xyxy(gt_boxes, det_boxes)
        rows, cols = linear_sum_assignment(1.0 - iou)
        gt_ids = gt_frame["id"].to_numpy(dtype=np.int64)
        for row, col in zip(rows, cols, strict=False):
            if float(iou[row, col]) < float(iou_threshold):
                continue
            matched_gt_ids[int(track_rows[int(col)][0])].append(int(gt_ids[int(row)]))

    stats: dict[int, TrackMatchStats] = {}
    for track in tracklets:
        gt_ids = matched_gt_ids.get(track.track_id, [])
        if not gt_ids:
            stats[track.track_id] = TrackMatchStats(track.track_id, 0, -1, 0.0)
            continue
        values, counts = np.unique(np.asarray(gt_ids, dtype=np.int64), return_counts=True)
        best = int(np.argmax(counts))
        stats[track.track_id] = TrackMatchStats(
            track.track_id,
            int(len(gt_ids)),
            int(values[best]),
            float(counts[best] / max(1, len(gt_ids))),
        )
    return stats


def predict_track_probability(model: dict, features: np.ndarray) -> np.ndarray:
    x = np.asarray(features, dtype=np.float32)
    mean = np.asarray(model["feature_mean"], dtype=np.float32)
    std = np.asarray(model["feature_std"], dtype=np.float32)
    coef = np.asarray(model["coef"], dtype=np.float32)
    intercept = float(model["intercept"])
    z = ((x - mean) / np.maximum(std, 1e-6)) @ coef + intercept
    return 1.0 / (1.0 + np.exp(-np.clip(z, -60.0, 60.0)))


def load_filter_model(path: str | Path) -> dict:
    return json.loads(Path(path).expanduser().resolve().read_text(encoding="utf-8"))


def apply_track_filter(
    *,
    tracker_dir: str | Path,
    output_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    model: dict,
    threshold: float | None = None,
    keep_long_min_len: int = 0,
    keep_long_min_median_conf: float = 1.1,
    support_tracker_dir: str | Path | None = None,
) -> None:
    threshold_value = float(model.get("threshold", 0.5) if threshold is None else threshold)
    tracker_root = Path(tracker_dir).expanduser().resolve()
    if (tracker_root / "data").exists():
        tracker_root = tracker_root / "data"
    out_root = Path(output_dir).expanduser().resolve()
    out_root.mkdir(parents=True, exist_ok=True)

    for sequence in sequences:
        tracklets = load_tracklets(tracker_root, sequence, compute_hist=False)
        if tracklets:
            x = np.stack([track_features(track, sequence) for track in tracklets], axis=0)
            if bool(model.get("uses_support_tracker")):
                if support_tracker_dir is None:
                    raise ValueError(
                        "Consensus track filter requires support_tracker_dir"
                    )
                from complementary_track_filter import base_relation_features

                relation = base_relation_features(
                    tracklets,
                    sequence,
                    base_tracker_dir=support_tracker_dir,
                )
                x = np.concatenate([x, relation], axis=1).astype(np.float32)
            probabilities = predict_track_probability(model, x)
        else:
            probabilities = np.zeros((0,), dtype=np.float32)
        keep_ids: set[int] = set()
        for track, prob in zip(tracklets, probabilities, strict=False):
            long_keep = (
                int(keep_long_min_len) > 0
                and track.length >= int(keep_long_min_len)
                and float(np.median(track.scores)) >= float(keep_long_min_median_conf)
            )
            if float(prob) >= threshold_value or long_keep:
                keep_ids.add(int(track.track_id))
        rows = read_mot_rows(tracker_root / f"{sequence.name}.txt")
        out_rows = [
            (int(row[0]), int(row[1]), float(row[2]), float(row[3]), float(row[4]), float(row[5]), float(row[6]))
            for row in rows
            if int(row[1]) in keep_ids
        ]
        write_mot_rows(out_root / f"{sequence.name}.txt", out_rows)
        print(f"{sequence.name}: kept {len(keep_ids)}/{len(tracklets)} tracks at threshold {threshold_value:.3f}")
