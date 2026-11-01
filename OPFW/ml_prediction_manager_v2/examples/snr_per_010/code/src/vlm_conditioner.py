from __future__ import annotations

import json
import math
import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from scipy.optimize import linear_sum_assignment

from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import TRAIN_SEQUENCES, SequenceInfo, gt_to_xyxy, load_gt
from nms import pairwise_iou_xyxy, standard_nms


FEATURE_NAMES = [
    "raw_score",
    "calibrated_score",
    "score_log",
    "score_sqrt",
    "score_rank_norm",
    "score_percentile",
    "score_over_frame_max",
    "score_over_frame_median",
    "frame_detection_count_log",
    "frame_norm",
    "cx_norm",
    "cy_norm",
    "bottom_norm",
    "w_norm",
    "h_norm",
    "area_norm_log",
    "aspect_h_over_w",
    "border_min_norm",
    "prompt_id_norm",
    "tile_id_norm",
]


@dataclass(slots=True)
class LabeledSamples:
    x: np.ndarray
    y: np.ndarray
    sample_weight: np.ndarray
    stats: dict


def _sigmoid(values: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(values, -60.0, 60.0)))


def _frame_features(detections: DetectionSet, indices: np.ndarray, sequence: SequenceInfo) -> np.ndarray:
    boxes = detections.boxes[indices].astype(np.float32)
    raw = detections.raw_scores[indices].astype(np.float32)
    scores = detections.calibrated_scores[indices].astype(np.float32)
    frame_values = detections.frames[indices].astype(np.float32)
    widths = np.maximum(boxes[:, 2] - boxes[:, 0], 1.0)
    heights = np.maximum(boxes[:, 3] - boxes[:, 1], 1.0)
    image_w = np.maximum(detections.image_widths[indices].astype(np.float32), float(sequence.width))
    image_h = np.maximum(detections.image_heights[indices].astype(np.float32), float(sequence.height))
    cx = (boxes[:, 0] + boxes[:, 2]) * 0.5
    cy = (boxes[:, 1] + boxes[:, 3]) * 0.5
    bottom = boxes[:, 3]
    area_norm = (widths * heights) / np.maximum(image_w * image_h, 1.0)

    order = np.argsort(-scores)
    rank = np.empty_like(order, dtype=np.float32)
    rank[order] = np.arange(len(order), dtype=np.float32)
    denom = max(len(indices) - 1, 1)
    rank_norm = rank / float(denom)
    percentile = 1.0 - rank_norm
    frame_max = max(float(np.max(scores)) if len(scores) else 0.0, 1e-6)
    frame_median = max(float(np.median(scores)) if len(scores) else 0.0, 1e-6)
    border_min = np.minimum.reduce([boxes[:, 0], boxes[:, 1], image_w - boxes[:, 2], image_h - boxes[:, 3]])
    border_min_norm = border_min / np.maximum(np.minimum(image_w, image_h), 1.0)

    return np.column_stack(
        [
            raw,
            scores,
            np.log(np.maximum(scores, 1e-6)),
            np.sqrt(np.clip(scores, 0.0, 1.0)),
            rank_norm,
            percentile,
            scores / frame_max,
            scores / frame_median,
            np.full(len(indices), math.log1p(float(len(indices))), dtype=np.float32),
            frame_values / max(float(sequence.seq_length), 1.0),
            cx / image_w,
            cy / image_h,
            bottom / image_h,
            widths / image_w,
            heights / image_h,
            np.log1p(area_norm * 10000.0),
            heights / np.maximum(widths, 1.0),
            border_min_norm,
            detections.prompt_ids[indices].astype(np.float32) / 100.0,
            detections.tile_ids[indices].astype(np.float32) / 100.0,
        ]
    ).astype(np.float32)


def iter_sequence_features(detections: DetectionSet, sequence: SequenceInfo) -> Iterable[tuple[int, np.ndarray, np.ndarray]]:
    for frame_idx, indices in sorted(detections.by_frame().items()):
        yield int(frame_idx), indices, _frame_features(detections, indices, sequence)


def _labels_for_frame(
    *,
    detections: DetectionSet,
    indices: np.ndarray,
    gt_frame,
    ignore_frame,
    iou_threshold: float,
    ignore_iou_threshold: float,
) -> tuple[np.ndarray, np.ndarray, int]:
    labels = np.zeros((len(indices),), dtype=np.int8)
    ignored = np.zeros((len(indices),), dtype=bool)
    det_boxes = detections.boxes[indices].astype(np.float32)
    matched_gt_count = 0

    if len(ignore_frame):
        ignore_boxes = gt_to_xyxy(ignore_frame).astype(np.float32)
        if len(ignore_boxes):
            ignored = np.max(pairwise_iou_xyxy(det_boxes, ignore_boxes), axis=1) >= float(ignore_iou_threshold)

    if len(gt_frame):
        gt_boxes = gt_to_xyxy(gt_frame).astype(np.float32)
        if len(gt_boxes) and len(det_boxes):
            iou = pairwise_iou_xyxy(gt_boxes, det_boxes)
            rows, cols = linear_sum_assignment(1.0 - iou)
            for row, col in zip(rows, cols, strict=False):
                if float(iou[row, col]) >= float(iou_threshold) and not bool(ignored[int(col)]):
                    labels[int(col)] = 1
                    matched_gt_count += 1
    return labels, ignored, matched_gt_count


def collect_labeled_samples(
    *,
    detection_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    max_samples_per_sequence: int = 250_000,
    negative_ratio: float = 8.0,
    iou_threshold: float = 0.5,
    ignore_iou_threshold: float = 0.5,
    seed: int = 20260427,
) -> LabeledSamples:
    names = [str(name) for name in sequence_names]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be used: {unknown}")
    seq_by_name = {sequence.name: sequence for sequence in sequences}
    rng = np.random.default_rng(int(seed))

    xs: list[np.ndarray] = []
    ys: list[np.ndarray] = []
    weights: list[np.ndarray] = []
    stats: dict[str, dict] = {}
    det_root = Path(detection_dir).expanduser().resolve()

    for seq_name in names:
        sequence = seq_by_name[seq_name]
        detections = load_detections(det_root / f"{seq_name}.npz")
        valid_gt, ignore_gt = load_gt(sequence.gt_path)
        valid_by_frame = {int(frame): rows for frame, rows in valid_gt.groupby("frame")}
        ignore_by_frame = {int(frame): rows for frame, rows in ignore_gt.groupby("frame")}
        seq_x: list[np.ndarray] = []
        seq_y: list[np.ndarray] = []
        seq_w: list[np.ndarray] = []
        positives = negatives = ignored_count = matched_gt = 0
        total_gt = int(len(valid_gt))

        for frame_idx, indices, features in iter_sequence_features(detections, sequence):
            labels, ignored, matched = _labels_for_frame(
                detections=detections,
                indices=indices,
                gt_frame=valid_by_frame.get(frame_idx, valid_gt.iloc[0:0]),
                ignore_frame=ignore_by_frame.get(frame_idx, ignore_gt.iloc[0:0]),
                iou_threshold=float(iou_threshold),
                ignore_iou_threshold=float(ignore_iou_threshold),
            )
            keep_pos = np.flatnonzero((labels == 1) & (~ignored))
            keep_neg = np.flatnonzero((labels == 0) & (~ignored))
            if len(keep_neg) and len(keep_pos):
                max_neg = max(int(math.ceil(len(keep_pos) * float(negative_ratio))), 1)
                if len(keep_neg) > max_neg:
                    keep_neg = rng.choice(keep_neg, size=max_neg, replace=False)
            elif len(keep_neg) > 8:
                keep_neg = rng.choice(keep_neg, size=min(len(keep_neg), 8), replace=False)
            keep = np.concatenate([keep_pos, keep_neg]).astype(np.int64) if len(keep_pos) or len(keep_neg) else np.zeros((0,), dtype=np.int64)
            if len(keep) == 0:
                ignored_count += int(np.sum(ignored))
                continue
            seq_x.append(features[keep])
            seq_y.append(labels[keep].astype(np.int8))
            
            neg_weight = float(len(np.flatnonzero((labels == 0) & (~ignored))) / max(len(keep_neg), 1)) if len(keep_neg) else 1.0
            frame_weights = np.where(labels[keep] == 1, 1.0, neg_weight).astype(np.float32)
            seq_w.append(frame_weights)
            positives += int(len(keep_pos))
            negatives += int(len(keep_neg))
            ignored_count += int(np.sum(ignored))
            matched_gt += int(matched)

        if not seq_x:
            continue
        x_seq = np.concatenate(seq_x, axis=0)
        y_seq = np.concatenate(seq_y, axis=0)
        w_seq = np.concatenate(seq_w, axis=0)
        if len(y_seq) > int(max_samples_per_sequence):
            pos_idx = np.flatnonzero(y_seq == 1)
            neg_idx = np.flatnonzero(y_seq == 0)
            pos_budget = min(len(pos_idx), max(1, int(max_samples_per_sequence * 0.45)))
            neg_budget = int(max_samples_per_sequence) - pos_budget
            chosen_pos = rng.choice(pos_idx, size=pos_budget, replace=False) if len(pos_idx) > pos_budget else pos_idx
            chosen_neg = rng.choice(neg_idx, size=min(len(neg_idx), neg_budget), replace=False) if len(neg_idx) else np.zeros((0,), dtype=np.int64)
            chosen = np.concatenate([chosen_pos, chosen_neg]).astype(np.int64)
            rng.shuffle(chosen)
            x_seq = x_seq[chosen]
            y_seq = y_seq[chosen]
            w_seq = w_seq[chosen]
        xs.append(x_seq)
        ys.append(y_seq)
        weights.append(w_seq)
        stats[seq_name] = {
            "detections": int(len(detections)),
            "sampled": int(len(y_seq)),
            "sampled_positive": int(np.sum(y_seq == 1)),
            "sampled_negative": int(np.sum(y_seq == 0)),
            "frame_positive_labels_before_cap": int(positives),
            "frame_negative_labels_before_cap": int(negatives),
            "ignored_detections": int(ignored_count),
            "valid_gt": total_gt,
            "matched_gt_by_candidates": int(matched_gt),
            "candidate_recall_at_iou": float(matched_gt / max(total_gt, 1)),
        }

    if not xs:
        raise RuntimeError("No labeled VLM detection samples were collected.")
    return LabeledSamples(
        x=np.concatenate(xs, axis=0).astype(np.float32),
        y=np.concatenate(ys, axis=0).astype(np.int8),
        sample_weight=np.concatenate(weights, axis=0).astype(np.float32),
        stats=stats,
    )


def threshold_from_training_labels(
    y_true: np.ndarray,
    probabilities: np.ndarray,
    sample_weight: np.ndarray,
    *,
    min_recall: float = 0.82,
    fp_weight: float = 1.0,
    fn_weight: float = 1.0,
) -> tuple[float, dict]:
    y = np.asarray(y_true).astype(bool)
    p = np.asarray(probabilities, dtype=np.float32)
    w = np.asarray(sample_weight, dtype=np.float32)
    thresholds = np.unique(np.quantile(p, np.linspace(0.01, 0.99, 199))).astype(np.float32)
    thresholds = np.unique(np.concatenate([thresholds, np.asarray([0.001, 0.005, 0.01, 0.02, 0.05, 0.10, 0.20, 0.35, 0.50], dtype=np.float32)]))
    best_t = 0.05
    best = None
    pos_total = float(np.sum(w[y]))
    for threshold in thresholds:
        keep = p >= float(threshold)
        tp = float(np.sum(w[keep & y]))
        fp = float(np.sum(w[keep & ~y]))
        fn = max(pos_total - tp, 0.0)
        recall = tp / max(pos_total, 1e-9)
        precision = tp / max(tp + fp, 1e-9)
        score = tp - float(fp_weight) * fp - float(fn_weight) * fn
        if recall < float(min_recall):
            score -= (float(min_recall) - recall) * pos_total * 2.0
        candidate = (score, recall, precision, -fp, -fn)
        if best is None or candidate > best:
            best = candidate
            best_t = float(threshold)
    keep = p >= best_t
    tp = float(np.sum(w[keep & y]))
    fp = float(np.sum(w[keep & ~y]))
    fn = float(max(pos_total - tp, 0.0))
    return best_t, {
        "weighted_tp": tp,
        "weighted_fp": fp,
        "weighted_fn": fn,
        "weighted_precision": float(tp / max(tp + fp, 1e-9)),
        "weighted_recall": float(tp / max(pos_total, 1e-9)),
        "selected_threshold": float(best_t),
    }


def save_conditioner_model(path: str | Path, *, estimator, metadata: dict) -> Path:
    out = Path(path).expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("wb") as handle:
        pickle.dump({"estimator": estimator, "metadata": metadata}, handle)
    meta_path = out.with_suffix(out.suffix + ".json")
    meta_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=True, sort_keys=True) + "\n", encoding="utf-8")
    return out


def load_conditioner_model(path: str | Path) -> dict:
    with Path(path).expanduser().resolve().open("rb") as handle:
        payload = pickle.load(handle)
    metadata = dict(payload.get("metadata") or {})
    if metadata.get("kind") != "vlm_detection_conditioner":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    return payload


def predict_conditioner_probability(model_payload: dict, features: np.ndarray) -> np.ndarray:
    estimator = model_payload["estimator"]
    if hasattr(estimator, "predict_proba"):
        return estimator.predict_proba(features)[:, 1].astype(np.float32)
    if hasattr(estimator, "decision_function"):
        return _sigmoid(estimator.decision_function(features)).astype(np.float32)
    raise TypeError(f"Unsupported estimator type: {type(estimator)!r}")


def apply_conditioner_to_dir(
    *,
    model_path: str | Path,
    source_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str] | None = None,
    threshold: float | None = None,
    blend_raw: float = 0.0,
    score_floor: float = 0.0,
    top_k: int | None = 900,
    nms_iou: float | None = 0.85,
    overwrite: bool = False,
) -> Path:
    payload = load_conditioner_model(model_path)
    metadata = dict(payload["metadata"])
    names = [str(name) for name in (sequence_names or TRAIN_SEQUENCES)]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be conditioned: {unknown}")
    seq_by_name = {seq.name: seq for seq in sequences}
    source = Path(source_dir).expanduser().resolve()
    target = Path(target_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    threshold_value = float(metadata.get("threshold", 0.05) if threshold is None else threshold)
    totals: dict[str, dict] = {}

    for seq_name in names:
        out_path = target / f"{seq_name}.npz"
        if out_path.exists() and not overwrite:
            continue
        sequence = seq_by_name[seq_name]
        detections = load_detections(source / f"{seq_name}.npz")
        selected_indices: list[np.ndarray] = []
        selected_scores: list[np.ndarray] = []
        kept_before_nms = 0
        pending_frames: list[tuple[np.ndarray, np.ndarray]] = []
        pending_count = 0

        def flush_pending() -> None:
            nonlocal kept_before_nms, pending_count
            if not pending_frames:
                return
            batch_features = np.concatenate([features for _, features in pending_frames], axis=0)
            batch_prob = predict_conditioner_probability(payload, batch_features)
            offset = 0
            for indices, features in pending_frames:
                end = offset + len(features)
                prob = batch_prob[offset:end]
                offset = end
                if float(blend_raw) > 0:
                    raw = detections.calibrated_scores[indices].astype(np.float32)
                    prob = (1.0 - float(blend_raw)) * prob + float(blend_raw) * raw
                prob = np.clip(prob, 0.0, 1.0).astype(np.float32)
                keep = (prob >= threshold_value) & (detections.raw_scores[indices] >= float(score_floor))
                frame_indices = indices[keep]
                frame_scores = prob[keep]
                kept_before_nms += int(len(frame_indices))
                if len(frame_indices) and nms_iou is not None and float(nms_iou) < 1.0:
                    local_keep = standard_nms(detections.boxes[frame_indices], frame_scores, float(nms_iou))
                    frame_indices = frame_indices[local_keep]
                    frame_scores = frame_scores[local_keep]
                if top_k is not None and len(frame_indices) > int(top_k):
                    order = np.argsort(-frame_scores)[: int(top_k)]
                    frame_indices = frame_indices[order]
                    frame_scores = frame_scores[order]
                if len(frame_indices):
                    selected_indices.append(frame_indices.astype(np.int64))
                    selected_scores.append(frame_scores.astype(np.float32))
            pending_frames.clear()
            pending_count = 0

        for _frame_idx, indices, features in iter_sequence_features(detections, sequence):
            pending_frames.append((indices, features))
            pending_count += len(features)
            if pending_count >= 100_000:
                flush_pending()
        flush_pending()
        if selected_indices:
            keep_indices = np.concatenate(selected_indices).astype(np.int64)
            keep_scores = np.concatenate(selected_scores).astype(np.float32)
        else:
            keep_indices = np.zeros((0,), dtype=np.int64)
            keep_scores = np.zeros((0,), dtype=np.float32)
        out = DetectionSet(
            frames=detections.frames[keep_indices],
            boxes=detections.boxes[keep_indices],
            raw_scores=detections.raw_scores[keep_indices],
            calibrated_scores=keep_scores,
            prompt_ids=detections.prompt_ids[keep_indices],
            tile_ids=detections.tile_ids[keep_indices],
            image_widths=detections.image_widths[keep_indices],
            image_heights=detections.image_heights[keep_indices],
            prompt_texts=detections.prompt_texts[keep_indices],
        )
        save_detections(out_path, out)
        totals[seq_name] = {
            "source_detections": int(len(detections)),
            "kept_before_nms": int(kept_before_nms),
            "kept_after_nms_topk": int(len(out)),
            "last_frame": int(out.frames.max()) if len(out) else 0,
        }

    write_run_metadata(
        target,
        {
            "kind": "vlm_detection_conditioned",
            "source": str(source),
            "model": str(Path(model_path).expanduser().resolve()),
            "model_metadata": metadata,
            "threshold": threshold_value,
            "blend_raw": float(blend_raw),
            "score_floor": float(score_floor),
            "top_k": None if top_k is None else int(top_k),
            "nms_iou": None if nms_iou is None else float(nms_iou),
            "counts": totals,
            "between_vlm_detector_and_tracker": True,
            "boxes_unchanged": True,
            "no_detector_finetuning": True,
            "no_external_dataset": True,
            "no_oracle_ids": True,
        },
    )
    return target
