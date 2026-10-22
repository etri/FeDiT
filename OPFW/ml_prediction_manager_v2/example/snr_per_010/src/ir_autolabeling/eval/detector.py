from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from scipy.optimize import linear_sum_assignment

from ir_autolabeling.detectors.base import RawDetections
from ir_autolabeling.eval.mot import _load_gt, _remove_ignore_matched_predictions
from ir_autolabeling.utils.geometry import pairwise_iou_xyxy
from ir_autolabeling.utils.io import iter_jsonl


@dataclass(slots=True)
class DetectorAuditInput:
    name: str
    gt_path: Path
    cache_path: Path


@dataclass(slots=True)
class DetectorAuditSummary:
    recall: float
    precision: float
    f1: float
    gt_boxes: int
    predicted_boxes: int
    true_positives: int
    false_positives: int
    false_negatives: int
    num_frames: int
    per_sequence: dict[str, dict[str, float | int]]


def _to_xyxy(gt_frame) -> np.ndarray:
    if len(gt_frame) == 0:
        return np.zeros((0, 4), dtype=np.float64)
    boxes = gt_frame[["x", "y", "w", "h"]].to_numpy(dtype=np.float64)
    boxes[:, 2] = boxes[:, 0] + boxes[:, 2]
    boxes[:, 3] = boxes[:, 1] + boxes[:, 3]
    return boxes


def _empty_metrics() -> dict[str, float | int]:
    return {
        "recall": 0.0,
        "precision": 0.0,
        "f1": 0.0,
        "gt_boxes": 0,
        "predicted_boxes": 0,
        "true_positives": 0,
        "false_positives": 0,
        "false_negatives": 0,
        "num_frames": 0,
    }


def _evaluate_sequence(
    input_item: DetectorAuditInput,
    *,
    detector_postprocess: dict[str, Any],
    iou_threshold: float,
    max_frames: int | None = None,
    frame_stride: int = 1,
    start_frame: int = 1,
) -> dict[str, float | int]:
    gt_df, ignore_df = _load_gt(input_item.gt_path)
    tp = 0
    fp = 0
    fn = 0
    predicted_boxes = 0
    gt_boxes_total = 0
    num_frames = 0

    try:
        frame_stride = max(1, int(frame_stride or 1))
    except Exception:
        frame_stride = 1
    try:
        start_frame = max(1, int(start_frame or 1))
    except Exception:
        start_frame = 1

    for payload in iter_jsonl(input_item.cache_path):
        raw = RawDetections.from_json_dict(payload)
        try:
            frame_idx = int(raw.frame_idx)
        except Exception:
            frame_idx = 0
        if frame_idx < start_frame:
            continue
        if ((frame_idx - start_frame) % frame_stride) != 0:
            continue
        if max_frames is not None and num_frames >= int(max_frames):
            break
        num_frames += 1
        gt_frame = gt_df[gt_df["frame"] == raw.frame_idx].copy()
        ignore_frame = ignore_df[ignore_df["frame"] == raw.frame_idx].copy()
        pred_detections = raw.to_tracker_detections(**detector_postprocess)

        if len(pred_detections) == 0:
            gt_boxes_total += len(gt_frame)
            fn += len(gt_frame)
            continue

        pred_frame = {
            "x": pred_detections[:, 0],
            "y": pred_detections[:, 1],
            "w": pred_detections[:, 2] - pred_detections[:, 0],
            "h": pred_detections[:, 3] - pred_detections[:, 1],
        }
        import pandas as pd

        pred_df = pd.DataFrame(pred_frame)
        pred_df = _remove_ignore_matched_predictions(
            pred_df,
            gt_frame,
            ignore_frame,
            iou_threshold=iou_threshold,
        )

        pred_boxes = np.zeros((0, 4), dtype=np.float64)
        if len(pred_df) > 0:
            pred_boxes = np.stack(
                [
                    pred_df["x"].to_numpy(dtype=np.float64),
                    pred_df["y"].to_numpy(dtype=np.float64),
                    (pred_df["x"] + pred_df["w"]).to_numpy(dtype=np.float64),
                    (pred_df["y"] + pred_df["h"]).to_numpy(dtype=np.float64),
                ],
                axis=1,
            )

        gt_boxes = _to_xyxy(gt_frame)
        gt_boxes_total += len(gt_boxes)
        predicted_boxes += len(pred_boxes)

        if len(gt_boxes) == 0:
            fp += len(pred_boxes)
            continue
        if len(pred_boxes) == 0:
            fn += len(gt_boxes)
            continue

        iou = pairwise_iou_xyxy(gt_boxes, pred_boxes)
        cost = 1.0 - iou
        gt_indices, pred_indices = linear_sum_assignment(cost)
        matched_gt: set[int] = set()
        matched_pred: set[int] = set()
        for gt_index, pred_index in zip(gt_indices.tolist(), pred_indices.tolist()):
            if float(iou[gt_index, pred_index]) >= iou_threshold:
                matched_gt.add(gt_index)
                matched_pred.add(pred_index)

        tp += len(matched_gt)
        fp += len(pred_boxes) - len(matched_pred)
        fn += len(gt_boxes) - len(matched_gt)

    precision = float(tp / max(tp + fp, 1))
    recall = float(tp / max(tp + fn, 1))
    f1 = float((2 * precision * recall) / max(precision + recall, 1e-6))
    return {
        "recall": recall,
        "precision": precision,
        "f1": f1,
        "gt_boxes": gt_boxes_total,
        "predicted_boxes": predicted_boxes,
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "num_frames": num_frames,
    }


def evaluate_detection_caches(
    inputs: list[DetectorAuditInput],
    *,
    detector_postprocess: dict[str, Any],
    iou_threshold: float = 0.5,
    max_frames_per_sequence: int | None = None,
    frame_stride: int = 1,
    start_frame: int = 1,
) -> DetectorAuditSummary:
    per_sequence = {
        input_item.name: _evaluate_sequence(
            input_item,
            detector_postprocess=detector_postprocess,
            iou_threshold=iou_threshold,
            max_frames=max_frames_per_sequence,
            frame_stride=frame_stride,
            start_frame=start_frame,
        )
        for input_item in inputs
    }
    if not per_sequence:
        empty = _empty_metrics()
        return DetectorAuditSummary(per_sequence={}, **empty)

    tp = sum(int(metrics["true_positives"]) for metrics in per_sequence.values())
    fp = sum(int(metrics["false_positives"]) for metrics in per_sequence.values())
    fn = sum(int(metrics["false_negatives"]) for metrics in per_sequence.values())
    gt_boxes = sum(int(metrics["gt_boxes"]) for metrics in per_sequence.values())
    predicted_boxes = sum(int(metrics["predicted_boxes"]) for metrics in per_sequence.values())
    num_frames = sum(int(metrics["num_frames"]) for metrics in per_sequence.values())
    precision = float(tp / max(tp + fp, 1))
    recall = float(tp / max(tp + fn, 1))
    f1 = float((2 * precision * recall) / max(precision + recall, 1e-6))
    return DetectorAuditSummary(
        recall=recall,
        precision=precision,
        f1=f1,
        gt_boxes=gt_boxes,
        predicted_boxes=predicted_boxes,
        true_positives=tp,
        false_positives=fp,
        false_negatives=fn,
        num_frames=num_frames,
        per_sequence=per_sequence,
    )
