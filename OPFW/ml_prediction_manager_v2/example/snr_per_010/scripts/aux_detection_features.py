from __future__ import annotations

from pathlib import Path

import numpy as np

from detection_io import load_detections
from nms import pairwise_iou_xyxy


DEFAULT_AUX_SCORE_THRESHOLDS = (0.10, 0.20, 0.35, 0.50)


def aux_feature_names(score_thresholds=DEFAULT_AUX_SCORE_THRESHOLDS) -> list[str]:
    names = [
        f"aux_support_ratio_s{int(round(float(score) * 100)):03d}"
        for score in score_thresholds
    ]
    return names + [
        "aux_mean_best_iou",
        "aux_p90_best_iou",
        "aux_mean_matched_score",
    ]


def _tlwh_to_xyxy(boxes: np.ndarray) -> np.ndarray:
    out = boxes.astype(np.float32, copy=True)
    out[:, 2] = out[:, 0] + out[:, 2]
    out[:, 3] = out[:, 1] + out[:, 3]
    return out


def make_aux_feature_matrix(
    tracklets,
    detection_path: Path,
    *,
    score_thresholds=DEFAULT_AUX_SCORE_THRESHOLDS,
    iou_threshold: float = 0.30,
) -> np.ndarray:
    thresholds = tuple(float(value) for value in score_thresholds)
    width = len(aux_feature_names(thresholds))
    if not tracklets:
        return np.zeros((0, width), dtype=np.float32)

    detections = load_detections(detection_path)
    by_frame = detections.by_frame()
    min_score = min(thresholds)
    rows: list[np.ndarray] = []
    for track in tracklets:
        boxes = _tlwh_to_xyxy(track.boxes)
        support_counts = np.zeros((len(thresholds),), dtype=np.float32)
        best_ious: list[float] = []
        matched_scores: list[float] = []
        for frame_idx, box in zip(track.frames, boxes, strict=True):
            indices = by_frame.get(int(frame_idx), np.zeros((0,), dtype=np.int64))
            if len(indices):
                indices = indices[detections.calibrated_scores[indices] >= min_score]
            if len(indices) == 0:
                best_ious.append(0.0)
                matched_scores.append(0.0)
                continue

            candidate_ious = pairwise_iou_xyxy(
                box[None, :].astype(np.float32),
                detections.boxes[indices].astype(np.float32),
            )[0]
            candidate_scores = detections.calibrated_scores[indices].astype(np.float32)
            best_ious.append(float(np.max(candidate_ious)))
            matched = candidate_ious >= float(iou_threshold)
            matched_scores.append(float(np.max(candidate_scores[matched])) if np.any(matched) else 0.0)
            for threshold_idx, threshold in enumerate(thresholds):
                eligible = candidate_scores >= threshold
                if np.any(eligible) and float(np.max(candidate_ious[eligible])) >= float(iou_threshold):
                    support_counts[threshold_idx] += 1.0

        length = max(int(track.length), 1)
        best_iou_array = np.asarray(best_ious, dtype=np.float32)
        matched_score_array = np.asarray(matched_scores, dtype=np.float32)
        rows.append(
            np.concatenate(
                [
                    support_counts / float(length),
                    np.asarray(
                        [
                            float(np.mean(best_iou_array)),
                            float(np.quantile(best_iou_array, 0.90)),
                            float(np.mean(matched_score_array)),
                        ],
                        dtype=np.float32,
                    ),
                ]
            )
        )
    return np.stack(rows).astype(np.float32)
