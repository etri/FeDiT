from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Literal

import numpy as np
from scipy.optimize import linear_sum_assignment

from detection_io import DetectionSet, load_detections, save_detections
from mot20_io import TRAIN_SEQUENCES, gt_to_xyxy, load_gt, load_sequences
from nms import pairwise_iou_xyxy


CalibrationType = Literal[
    "identity",
    "global_quantile",
    "per_sequence_quantile",
    "empirical_precision_bins",
    "size_aware_bins",
    "prompt_aware_bins",
]


def _rank_percentile(values: np.ndarray) -> np.ndarray:
    if len(values) == 0:
        return values.astype(np.float32)
    order = np.argsort(values, kind="mergesort")
    ranks = np.empty_like(order, dtype=np.float32)
    if len(values) == 1:
        ranks[order] = 1.0
    else:
        ranks[order] = np.linspace(0.0, 1.0, len(values), dtype=np.float32)
    return ranks


def _match_detection_labels(
    detections: DetectionSet,
    gt_path: Path,
    *,
    iou_threshold: float = 0.5,
) -> tuple[np.ndarray, np.ndarray]:
    valid_gt, ignore_gt = load_gt(gt_path)
    labels = np.zeros((len(detections),), dtype=np.int8)
    max_ious = np.zeros((len(detections),), dtype=np.float32)
    by_frame = detections.by_frame()

    for frame, det_indices in by_frame.items():
        boxes = detections.boxes[det_indices].astype(np.float64)
        gt_frame = valid_gt[valid_gt["frame"] == frame]
        ignore_frame = ignore_gt[ignore_gt["frame"] == frame]
        gt_boxes = gt_to_xyxy(gt_frame)
        ignore_boxes = gt_to_xyxy(ignore_frame)

        if len(gt_boxes) > 0 and len(boxes) > 0:
            iou = pairwise_iou_xyxy(gt_boxes, boxes)
            max_ious[det_indices] = np.maximum(max_ious[det_indices], iou.max(axis=0).astype(np.float32))
            rows, cols = linear_sum_assignment(1.0 - iou)
            for row, col in zip(rows, cols, strict=False):
                if float(iou[row, col]) >= float(iou_threshold):
                    labels[int(det_indices[col])] = 1

        if len(ignore_boxes) > 0 and len(boxes) > 0:
            ignore_iou = pairwise_iou_xyxy(ignore_boxes, boxes)
            ignored = ignore_iou.max(axis=0) >= float(iou_threshold)
            for local_idx, is_ignored in enumerate(ignored.tolist()):
                abs_idx = int(det_indices[local_idx])
                if is_ignored and labels[abs_idx] == 0:
                    labels[abs_idx] = -1
    return labels, max_ious


def _empirical_bin_scores(
    scores: np.ndarray,
    labels: np.ndarray,
    *,
    bins: int,
    smoothing: float,
) -> tuple[np.ndarray, dict]:
    bins = max(2, int(bins))
    valid_mask = labels >= 0
    if not np.any(valid_mask):
        return scores.astype(np.float32), {"bins": bins, "edges": [], "precision": []}
    valid_scores = scores[valid_mask]
    edges = np.quantile(valid_scores, np.linspace(0.0, 1.0, bins + 1))
    edges = np.unique(edges)
    if len(edges) <= 2:
        edges = np.linspace(float(valid_scores.min()), float(valid_scores.max()) + 1e-6, bins + 1)
    bin_ids = np.clip(np.searchsorted(edges, scores, side="right") - 1, 0, len(edges) - 2)
    precision = np.zeros((len(edges) - 1,), dtype=np.float32)
    for bin_id in range(len(precision)):
        mask = (bin_ids == bin_id) & valid_mask
        tp = float(np.sum(labels[mask] == 1))
        total = float(np.sum(mask))
        precision[bin_id] = (tp + float(smoothing)) / max(total + 2.0 * float(smoothing), 1e-6)
    calibrated = precision[bin_ids]
    calibrated[labels < 0] = np.minimum(calibrated[labels < 0], 0.01)
    return calibrated.astype(np.float32), {
        "bins": int(len(precision)),
        "edges": [float(v) for v in edges.tolist()],
        "precision": [float(v) for v in precision.tolist()],
    }


def _area_groups(boxes: np.ndarray) -> np.ndarray:
    if len(boxes) == 0:
        return np.zeros((0,), dtype=np.int8)
    areas = np.maximum(0.0, boxes[:, 2] - boxes[:, 0]) * np.maximum(0.0, boxes[:, 3] - boxes[:, 1])
    q1, q2 = np.quantile(areas, [0.33, 0.66])
    return np.where(areas <= q1, 0, np.where(areas <= q2, 1, 2)).astype(np.int8)


def calibrate_detection_dir(
    *,
    src_dir: str | Path,
    dst_dir: str | Path,
    data_root: str | Path,
    method: CalibrationType,
    bins: int = 50,
    smoothing: float = 1.0,
    iou_threshold: float = 0.5,
    overwrite: bool = False,
) -> Path:
    source = Path(src_dir).expanduser().resolve()
    target = Path(dst_dir).expanduser().resolve()
    if target.exists() and overwrite:
        shutil.rmtree(target)
    target.mkdir(parents=True, exist_ok=True)
    sequences = load_sequences(data_root)
    seq_by_name = {seq.name: seq for seq in sequences}
    metadata: dict = {
        "method": method,
        "source": str(source),
        "iou_threshold": float(iou_threshold),
        "bins": int(bins),
        "smoothing": float(smoothing),
        "maps": {},
    }

    loaded = {seq: load_detections(source / f"{seq}.npz") for seq in TRAIN_SEQUENCES}
    if method == "identity":
        for seq, detections in loaded.items():
            out = detections.copy()
            out.calibrated_scores = out.raw_scores.copy()
            save_detections(target / f"{seq}.npz", out)
    elif method == "global_quantile":
        all_scores = np.concatenate([det.raw_scores for det in loaded.values()])
        all_cal = _rank_percentile(all_scores)
        offset = 0
        for seq, detections in loaded.items():
            count = len(detections)
            out = detections.copy()
            out.calibrated_scores = all_cal[offset : offset + count].astype(np.float32)
            offset += count
            save_detections(target / f"{seq}.npz", out)
    elif method == "per_sequence_quantile":
        for seq, detections in loaded.items():
            out = detections.copy()
            out.calibrated_scores = _rank_percentile(out.raw_scores).astype(np.float32)
            save_detections(target / f"{seq}.npz", out)
    elif method in {"empirical_precision_bins", "size_aware_bins", "prompt_aware_bins"}:
        for seq, detections in loaded.items():
            labels, _ = _match_detection_labels(
                detections,
                seq_by_name[seq].gt_path,
                iou_threshold=iou_threshold,
            )
            out = detections.copy()
            seq_maps: dict = {}
            if method == "empirical_precision_bins":
                calibrated, map_payload = _empirical_bin_scores(
                    out.raw_scores,
                    labels,
                    bins=bins,
                    smoothing=smoothing,
                )
                out.calibrated_scores = calibrated
                seq_maps["all"] = map_payload
            else:
                out.calibrated_scores = np.zeros_like(out.raw_scores, dtype=np.float32)
                groups = _area_groups(out.boxes) if method == "size_aware_bins" else out.prompt_ids.astype(np.int32)
                for group in sorted(set(groups.astype(int).tolist())):
                    mask = groups == int(group)
                    calibrated, map_payload = _empirical_bin_scores(
                        out.raw_scores[mask],
                        labels[mask],
                        bins=bins,
                        smoothing=smoothing,
                    )
                    out.calibrated_scores[mask] = calibrated
                    seq_maps[str(group)] = map_payload
            metadata["maps"][seq] = seq_maps
            save_detections(target / f"{seq}.npz", out)
    else:
        raise ValueError(f"Unsupported calibration method: {method}")

    (target / "calibration").mkdir(exist_ok=True)
    (target / "calibration" / "map.json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=True, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return target
