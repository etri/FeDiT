from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd
import torch
from scipy.optimize import linear_sum_assignment
from torch import nn
from torch.utils.data import DataLoader, TensorDataset
from scipy.spatial import cKDTree

from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import SequenceInfo, gt_to_xyxy, load_gt, read_mot_rows
from neural_vlm_conditioner import _resolve_device
from nms import pairwise_iou_xyxy
from temporal_neural_conditioner import (
    ALL_FEATURE_NAMES,
    DOMAIN_INVARIANT_FEATURE_INDICES,
    temporal_frame_features,
)


SET_CONTEXT_FEATURE_NAMES = [
    "set_max_neighbor_iou",
    "set_mean_neighbor_iou",
    "set_overlap_count_log_iou010",
    "set_overlap_count_log_iou030",
    "set_overlap_count_log_iou050",
    "set_overlap_count_log_iou070",
    "set_overlap_fraction_iou010",
    "set_overlap_fraction_iou030",
    "set_overlap_fraction_iou050",
    "set_overlap_fraction_iou070",
    "set_higher_score_count_log_iou010",
    "set_higher_score_count_log_iou030",
    "set_max_neighbor_score_iou010",
    "set_mean_neighbor_score_iou010",
    "set_score_minus_neighbor_max_iou010",
    "set_same_prompt_fraction_iou010",
    "set_same_tile_fraction_iou010",
    "set_consensus_dx_per_w",
    "set_consensus_dy_per_h",
    "set_consensus_log_width_ratio",
    "set_consensus_log_height_ratio",
]


class TemporalBoxConditioner(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 192) -> None:
        super().__init__()
        self.input = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
        )
        self.block = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.10),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
        )
        self.output = nn.Sequential(
            nn.GELU(),
            nn.Linear(hidden_dim, 96),
            nn.GELU(),
            nn.Dropout(0.05),
            nn.Linear(96, 5),
        )

    def forward(self, features: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        hidden = self.input(features)
        hidden = hidden + self.block(hidden)
        output = self.output(hidden)
        return output[:, 0], 0.35 * torch.tanh(output[:, 1:])


def _set_context_features(
    detections: DetectionSet,
    indices: np.ndarray,
    *,
    neighbor_k: int,
) -> np.ndarray:
    count = len(indices)
    output = np.zeros((count, len(SET_CONTEXT_FEATURE_NAMES)), dtype=np.float32)
    if count <= 1 or int(neighbor_k) <= 0:
        return output

    boxes = detections.boxes[indices].astype(np.float32)
    scores = detections.calibrated_scores[indices].astype(np.float32)
    centers = (boxes[:, :2] + boxes[:, 2:]) * 0.5
    widths = np.maximum(boxes[:, 2] - boxes[:, 0], 1.0)
    heights = np.maximum(boxes[:, 3] - boxes[:, 1], 1.0)
    k = min(count, max(2, int(neighbor_k) + 1))
    _, neighbors = cKDTree(centers).query(centers, k=k)
    if k == 1:
        neighbors = neighbors[:, None]

    candidates = boxes[neighbors]
    intersection_lt = np.maximum(boxes[:, None, :2], candidates[:, :, :2])
    intersection_rb = np.minimum(boxes[:, None, 2:], candidates[:, :, 2:])
    intersection_wh = np.maximum(intersection_rb - intersection_lt, 0.0)
    intersection = intersection_wh[:, :, 0] * intersection_wh[:, :, 1]
    areas = widths * heights
    candidate_areas = np.maximum(
        candidates[:, :, 2] - candidates[:, :, 0],
        0.0,
    ) * np.maximum(candidates[:, :, 3] - candidates[:, :, 1], 0.0)
    iou = intersection / np.maximum(
        areas[:, None] + candidate_areas - intersection,
        1.0e-6,
    )
    row_ids = np.arange(count, dtype=np.int64)[:, None]
    valid_neighbor = neighbors != row_ids
    iou = np.where(valid_neighbor, iou, 0.0).astype(np.float32)
    neighbor_scores = scores[neighbors]

    valid_count = np.maximum(valid_neighbor.sum(axis=1), 1)
    output[:, 0] = np.max(iou, axis=1)
    output[:, 1] = np.sum(iou, axis=1) / valid_count
    thresholds = (0.10, 0.30, 0.50, 0.70)
    overlap_masks: list[np.ndarray] = []
    for threshold_index, threshold in enumerate(thresholds):
        overlap = valid_neighbor & (iou >= float(threshold))
        overlap_masks.append(overlap)
        overlap_count = overlap.sum(axis=1)
        output[:, 2 + threshold_index] = np.log1p(overlap_count)
        output[:, 6 + threshold_index] = overlap_count / valid_count

    higher_score = neighbor_scores > scores[:, None]
    for threshold_index, overlap in enumerate(overlap_masks[:2]):
        output[:, 10 + threshold_index] = np.log1p(
            np.sum(overlap & higher_score, axis=1)
        )

    local = overlap_masks[0]
    local_count = np.maximum(local.sum(axis=1), 1)
    local_scores = np.where(local, neighbor_scores, 0.0)
    max_local_score = np.max(local_scores, axis=1)
    output[:, 12] = max_local_score
    output[:, 13] = np.sum(local_scores, axis=1) / local_count
    output[:, 14] = scores - max_local_score

    prompt_ids = detections.prompt_ids[indices]
    tile_ids = detections.tile_ids[indices]
    output[:, 15] = np.sum(
        local & (prompt_ids[neighbors] == prompt_ids[:, None]),
        axis=1,
    ) / local_count
    output[:, 16] = np.sum(
        local & (tile_ids[neighbors] == tile_ids[:, None]),
        axis=1,
    ) / local_count

    consensus_weights = (
        local.astype(np.float32)
        * np.maximum(iou, 0.0)
        * np.sqrt(np.clip(neighbor_scores, 0.0, 1.0))
    )
    weight_sum = consensus_weights.sum(axis=1, keepdims=True)
    has_consensus = weight_sum[:, 0] > 1.0e-8
    consensus = boxes.copy()
    if np.any(has_consensus):
        consensus[has_consensus] = (
            np.sum(
                candidates[has_consensus]
                * consensus_weights[has_consensus, :, None],
                axis=1,
            )
            / weight_sum[has_consensus]
        )
    consensus_centers = (consensus[:, :2] + consensus[:, 2:]) * 0.5
    consensus_widths = np.maximum(consensus[:, 2] - consensus[:, 0], 1.0)
    consensus_heights = np.maximum(consensus[:, 3] - consensus[:, 1], 1.0)
    output[:, 17] = (consensus_centers[:, 0] - centers[:, 0]) / widths
    output[:, 18] = (consensus_centers[:, 1] - centers[:, 1]) / heights
    output[:, 19] = np.clip(np.log(consensus_widths / widths), -3.0, 3.0)
    output[:, 20] = np.clip(np.log(consensus_heights / heights), -3.0, 3.0)
    return output


def _conditioner_features(
    detections: DetectionSet,
    indices: np.ndarray,
    *,
    frame: int,
    by_frame: dict[int, np.ndarray],
    sequence: SequenceInfo,
    neighbor_k: int,
    set_neighbor_k: int,
) -> np.ndarray:
    temporal = temporal_frame_features(
        detections,
        indices,
        frame=int(frame),
        by_frame=by_frame,
        sequence=sequence,
        neighbor_k=int(neighbor_k),
    )
    if int(set_neighbor_k) <= 0:
        return temporal
    context = _set_context_features(
        detections,
        indices,
        neighbor_k=int(set_neighbor_k),
    )
    return np.concatenate([temporal, context], axis=1).astype(np.float32)


def _frame_targets(
    detections: DetectionSet,
    indices: np.ndarray,
    gt_frame,
    ignore_frame,
    *,
    match_iou: float,
    ignore_iou: float,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, int]:
    boxes = detections.boxes[indices].astype(np.float32)
    gt_boxes = gt_to_xyxy(gt_frame).astype(np.float32)
    labels = np.zeros((len(indices),), dtype=np.float32)
    deltas = np.zeros((len(indices), 4), dtype=np.float32)
    ignored = np.zeros((len(indices),), dtype=bool)
    matched = 0

    if len(boxes) and len(gt_boxes):
        iou = pairwise_iou_xyxy(gt_boxes, boxes)
        rows, cols = linear_sum_assignment(1.0 - iou)
        for row, col in zip(rows, cols, strict=False):
            if float(iou[row, col]) < float(match_iou):
                continue
            labels[int(col)] = 1.0
            width = max(float(boxes[col, 2] - boxes[col, 0]), 1.0)
            height = max(float(boxes[col, 3] - boxes[col, 1]), 1.0)
            deltas[int(col)] = np.clip(
                (gt_boxes[int(row)] - boxes[int(col)])
                / np.asarray([width, height, width, height], dtype=np.float32),
                -0.35,
                0.35,
            )
            matched += 1

    ignore_boxes = gt_to_xyxy(ignore_frame).astype(np.float32)
    if len(boxes) and len(ignore_boxes):
        ignored = pairwise_iou_xyxy(ignore_boxes, boxes).max(axis=0) >= float(ignore_iou)
        ignored &= labels == 0
    return labels, deltas, ignored, matched


def _collect_sequence(
    *,
    detection_path: Path,
    sequence: SequenceInfo,
    max_samples: int,
    negative_ratio: float,
    hard_negative_fraction: float,
    neighbor_k: int,
    set_neighbor_k: int,
    match_iou: float,
    target_tracker_dir: Path | None,
    rng: np.random.Generator,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, dict]:
    detections = load_detections(detection_path)
    if target_tracker_dir is None:
        valid_gt, ignore_gt = load_gt(sequence.gt_path)
        target_kind = "ground_truth"
    else:
        rows = read_mot_rows(target_tracker_dir / f"{sequence.name}.txt")
        valid_gt = pd.DataFrame(
            [row[:6] for row in rows],
            columns=["frame", "id", "x", "y", "w", "h"],
        )
        if len(valid_gt):
            valid_gt["frame"] = valid_gt["frame"].astype(np.int64)
        ignore_gt = valid_gt.iloc[0:0].copy()
        target_kind = "pseudo_tracker"
    valid_by_frame = {int(frame): rows for frame, rows in valid_gt.groupby("frame")}
    ignore_by_frame = {int(frame): rows for frame, rows in ignore_gt.groupby("frame")}
    empty_valid = valid_gt.iloc[0:0]
    empty_ignore = ignore_gt.iloc[0:0]
    by_frame = {int(frame): indices for frame, indices in detections.by_frame().items()}
    xs: list[np.ndarray] = []
    ys: list[np.ndarray] = []
    ds: list[np.ndarray] = []
    ws: list[np.ndarray] = []
    hs: list[np.ndarray] = []
    matched_gt = 0

    for frame, indices in sorted(by_frame.items()):
        features = _conditioner_features(
            detections,
            indices,
            frame=int(frame),
            by_frame=by_frame,
            sequence=sequence,
            neighbor_k=int(neighbor_k),
            set_neighbor_k=int(set_neighbor_k),
        )
        labels, deltas, ignored, matched = _frame_targets(
            detections,
            indices,
            valid_by_frame.get(frame, empty_valid),
            ignore_by_frame.get(frame, empty_ignore),
            match_iou=float(match_iou),
            ignore_iou=0.5,
        )
        positive = np.flatnonzero((labels == 1) & (~ignored))
        negative_all = np.flatnonzero((labels == 0) & (~ignored))
        hardness = np.zeros((len(indices),), dtype=np.float32)
        if len(negative_all) and float(hard_negative_fraction) > 0.0:
            score_percentile_index = ALL_FEATURE_NAMES.index("score_percentile")
            context_iou_index = ALL_FEATURE_NAMES.index("context_iou_mean")
            score_hardness = np.clip(
                features[negative_all, score_percentile_index], 0.0, 1.0
            )
            temporal_hardness = np.clip(
                features[negative_all, context_iou_index], 0.0, 1.0
            )
            duplicate_hardness = np.zeros_like(score_hardness)
            if len(positive):
                duplicate_hardness = pairwise_iou_xyxy(
                    detections.boxes[indices[negative_all]].astype(np.float32),
                    detections.boxes[indices[positive]].astype(np.float32),
                ).max(axis=1)
            hardness[negative_all] = (
                0.40 * score_hardness
                + 0.35 * duplicate_hardness
                + 0.25 * temporal_hardness
            )
        negative = negative_all
        if len(positive) and len(negative):
            limit = max(int(math.ceil(len(positive) * float(negative_ratio))), 1)
            if len(negative) > limit:
                hard_count = min(
                    limit,
                    int(round(limit * float(hard_negative_fraction))),
                )
                if hard_count:
                    order = np.argsort(-hardness[negative], kind="stable")
                    hard = negative[order[:hard_count]]
                    remaining = negative[order[hard_count:]]
                    random_count = min(limit - len(hard), len(remaining))
                    random = (
                        rng.choice(remaining, size=random_count, replace=False)
                        if random_count
                        else np.zeros((0,), dtype=np.int64)
                    )
                    negative = np.concatenate([hard, random])
                else:
                    negative = rng.choice(negative, size=limit, replace=False)
        elif len(negative) > 8:
            if float(hard_negative_fraction) > 0.0:
                order = np.argsort(-hardness[negative], kind="stable")
                hard_count = min(
                    8,
                    int(round(8 * float(hard_negative_fraction))),
                )
                hard = negative[order[:hard_count]]
                remaining = negative[order[hard_count:]]
                random_count = min(8 - len(hard), len(remaining))
                random = (
                    rng.choice(remaining, size=random_count, replace=False)
                    if random_count
                    else np.zeros((0,), dtype=np.int64)
                )
                negative = np.concatenate([hard, random])
            else:
                negative = rng.choice(negative, size=8, replace=False)
        keep = np.concatenate([positive, negative]).astype(np.int64)
        if len(keep):
            xs.append(features[keep])
            ys.append(labels[keep])
            ds.append(deltas[keep])
            hs.append(hardness[keep])
            negative_weight = (
                float(len(negative_all) / max(len(negative), 1))
                if len(negative)
                else 1.0
            )
            ws.append(
                np.where(labels[keep] == 1, 1.0, negative_weight).astype(np.float32)
            )
        matched_gt += int(matched)

    if not xs:
        raise RuntimeError(f"No temporal box samples collected for {sequence.name}")
    x = np.concatenate(xs).astype(np.float32)
    y = np.concatenate(ys).astype(np.float32)
    d = np.concatenate(ds).astype(np.float32)
    w = np.concatenate(ws).astype(np.float32)
    h = np.concatenate(hs).astype(np.float32)
    if len(y) > int(max_samples):
        positive = np.flatnonzero(y == 1)
        negative = np.flatnonzero(y == 0)
        positive_budget = min(len(positive), max(1, int(max_samples * 0.50)))
        negative_budget = int(max_samples) - positive_budget
        chosen_positive = (
            rng.choice(positive, size=positive_budget, replace=False)
            if len(positive) > positive_budget
            else positive
        )
        negative_budget = min(len(negative), negative_budget)
        hard_count = min(
            negative_budget,
            int(round(negative_budget * float(hard_negative_fraction))),
        )
        if hard_count:
            order = np.argsort(-h[negative], kind="stable")
            chosen_hard = negative[order[:hard_count]]
            remaining = negative[order[hard_count:]]
            random_count = min(negative_budget - len(chosen_hard), len(remaining))
            chosen_random = (
                rng.choice(remaining, size=random_count, replace=False)
                if random_count
                else np.zeros((0,), dtype=np.int64)
            )
            chosen_negative = np.concatenate([chosen_hard, chosen_random])
        else:
            chosen_negative = (
                rng.choice(negative, size=negative_budget, replace=False)
                if negative_budget
                else np.zeros((0,), dtype=np.int64)
            )
        chosen = np.concatenate([chosen_positive, chosen_negative])
        rng.shuffle(chosen)
        x, y, d, w = x[chosen], y[chosen], d[chosen], w[chosen]
    stats = {
        "detections": int(len(detections)),
        "samples": int(len(y)),
        "positive": int(np.sum(y == 1)),
        "negative": int(np.sum(y == 0)),
        "valid_gt": int(len(valid_gt)),
        "matched_gt_at_iou": int(matched_gt),
        "candidate_recall_at_iou": float(matched_gt / max(len(valid_gt), 1)),
        "target_kind": target_kind,
        "hard_negative_fraction": float(hard_negative_fraction),
    }
    return x, y, d, w, stats


def _predict(
    model: TemporalBoxConditioner,
    features: np.ndarray,
    *,
    mean: np.ndarray,
    scale: np.ndarray,
    device: str,
    batch_size: int,
) -> tuple[np.ndarray, np.ndarray]:
    scores = np.empty((len(features),), dtype=np.float32)
    deltas = np.empty((len(features), 4), dtype=np.float32)
    model.eval()
    with torch.inference_mode():
        for start in range(0, len(features), int(batch_size)):
            end = min(start + int(batch_size), len(features))
            normalized = (features[start:end] - mean) / scale
            tensor = torch.from_numpy(
                normalized.astype(np.float32, copy=False)
            ).to(device)
            logits, batch_deltas = model(tensor)
            scores[start:end] = torch.sigmoid(logits).cpu().numpy().astype(np.float32)
            deltas[start:end] = batch_deltas.cpu().numpy().astype(np.float32)
    return scores, deltas


def train_temporal_box_conditioner(
    *,
    detection_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    device: str = "auto",
    max_samples_per_sequence: int = 300_000,
    negative_ratio: float = 8.0,
    hard_negative_fraction: float = 0.0,
    neighbor_k: int = 16,
    set_neighbor_k: int = 0,
    match_iou: float = 0.3,
    epochs: int = 8,
    batch_size: int = 4096,
    learning_rate: float = 6.0e-4,
    weight_decay: float = 1.0e-4,
    validation_fraction: float = 0.15,
    focal_gamma: float = 1.5,
    regression_weight: float = 2.0,
    seed: int = 20260728,
    target_tracker_root: str | Path | None = None,
    pseudo_sequences: Iterable[str] | None = None,
) -> dict:
    supervised_names = [str(name) for name in train_sequences]
    requested_pseudo_names = [str(name) for name in (pseudo_sequences or [])]
    if target_tracker_root is not None and not requested_pseudo_names:
        requested_pseudo_names = list(supervised_names)
        supervised_names = []
    overlap = sorted(set(supervised_names) & set(requested_pseudo_names))
    if overlap:
        raise ValueError(
            f"Sequences cannot be both supervised and pseudo targets: {overlap}"
        )
    names = [*supervised_names, *requested_pseudo_names]
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    source = Path(detection_dir).expanduser().resolve()
    target_tracker_dir = (
        None
        if target_tracker_root is None
        else Path(target_tracker_root).expanduser().resolve()
    )
    if requested_pseudo_names and target_tracker_dir is None:
        raise ValueError(
            "pseudo_sequences requires target_tracker_root"
        )
    pseudo_name_set = set(requested_pseudo_names)
    rng = np.random.default_rng(int(seed))
    xs: list[np.ndarray] = []
    ys: list[np.ndarray] = []
    ds: list[np.ndarray] = []
    ws: list[np.ndarray] = []
    sequence_stats: dict[str, dict] = {}
    for name in names:
        x, y, d, w, stats = _collect_sequence(
            detection_path=source / f"{name}.npz",
            sequence=sequence_by_name[name],
            max_samples=int(max_samples_per_sequence),
            negative_ratio=float(negative_ratio),
            hard_negative_fraction=float(hard_negative_fraction),
            neighbor_k=int(neighbor_k),
            set_neighbor_k=int(set_neighbor_k),
            match_iou=float(match_iou),
            target_tracker_dir=(
                target_tracker_dir
                if name in pseudo_name_set
                else None
            ),
            rng=rng,
        )
        target_count = float(max_samples_per_sequence)
        w = w / max(float(w.mean()), 1.0e-6)
        w *= target_count / max(len(y), 1)
        selected_indices = list(DOMAIN_INVARIANT_FEATURE_INDICES)
        if int(set_neighbor_k) > 0:
            selected_indices.extend(
                range(
                    len(ALL_FEATURE_NAMES),
                    len(ALL_FEATURE_NAMES) + len(SET_CONTEXT_FEATURE_NAMES),
                )
            )
        xs.append(x[:, selected_indices])
        ys.append(y)
        ds.append(d)
        ws.append(w)
        sequence_stats[name] = stats
        print(
            f"{name}: box samples={len(y)} "
            f"recall@{match_iou:.2f}={stats['candidate_recall_at_iou']:.4f}"
        )

    features = np.concatenate(xs).astype(np.float32)
    labels = np.concatenate(ys).astype(np.float32)
    delta_targets = np.concatenate(ds).astype(np.float32)
    weights = np.concatenate(ws).astype(np.float32)
    order = rng.permutation(len(labels))
    validation_count = max(1, int(round(len(order) * float(validation_fraction))))
    validation_indices = order[:validation_count]
    train_indices = order[validation_count:]
    mean = features[train_indices].mean(axis=0, dtype=np.float64).astype(np.float32)
    scale = np.maximum(
        features[train_indices].std(axis=0, dtype=np.float64).astype(np.float32),
        1.0e-4,
    )
    train_x = ((features[train_indices] - mean) / scale).astype(np.float32)
    train_y = labels[train_indices]
    train_d = delta_targets[train_indices]
    train_w = weights[train_indices]
    train_w /= max(float(train_w.mean()), 1.0e-6)

    resolved_device = _resolve_device(device)
    torch.manual_seed(int(seed))
    model = TemporalBoxConditioner(features.shape[1]).to(resolved_device)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=float(learning_rate),
        weight_decay=float(weight_decay),
    )
    loader = DataLoader(
        TensorDataset(
            torch.from_numpy(train_x),
            torch.from_numpy(train_y),
            torch.from_numpy(train_d),
            torch.from_numpy(train_w),
        ),
        batch_size=int(batch_size),
        shuffle=True,
        num_workers=0,
    )
    best_loss = float("inf")
    best_state: dict[str, torch.Tensor] | None = None
    history: list[dict] = []
    for epoch in range(1, int(epochs) + 1):
        model.train()
        total_loss = 0.0
        count = 0
        for batch_x, batch_y, batch_d, batch_w in loader:
            batch_x = batch_x.to(resolved_device)
            batch_y = batch_y.to(resolved_device)
            batch_d = batch_d.to(resolved_device)
            batch_w = batch_w.to(resolved_device)
            optimizer.zero_grad(set_to_none=True)
            logits, predicted_deltas = model(batch_x)
            probabilities = torch.sigmoid(logits)
            bce = nn.functional.binary_cross_entropy_with_logits(
                logits, batch_y, reduction="none"
            )
            p_t = batch_y * probabilities + (1.0 - batch_y) * (1.0 - probabilities)
            classification = bce * torch.pow(1.0 - p_t, float(focal_gamma))
            positive = batch_y > 0.5
            regression = torch.zeros_like(classification)
            if bool(torch.any(positive)):
                regression[positive] = nn.functional.smooth_l1_loss(
                    predicted_deltas[positive],
                    batch_d[positive],
                    reduction="none",
                    beta=0.05,
                ).mean(dim=1)
            loss = (
                (classification + float(regression_weight) * regression) * batch_w
            ).mean()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            optimizer.step()
            total_loss += float(loss.detach().cpu()) * len(batch_x)
            count += len(batch_x)

        validation_scores, validation_deltas = _predict(
            model,
            features[validation_indices],
            mean=mean,
            scale=scale,
            device=resolved_device,
            batch_size=int(batch_size),
        )
        validation_labels = labels[validation_indices]
        classification_loss = -(
            validation_labels * np.log(np.maximum(validation_scores, 1.0e-7))
            + (1.0 - validation_labels)
            * np.log(np.maximum(1.0 - validation_scores, 1.0e-7))
        )
        positive = validation_labels > 0.5
        regression_loss = np.zeros_like(classification_loss)
        if np.any(positive):
            difference = np.abs(
                validation_deltas[positive] - delta_targets[validation_indices][positive]
            )
            beta = 0.05
            smooth_l1 = np.where(
                difference < beta,
                0.5 * difference * difference / beta,
                difference - 0.5 * beta,
            )
            regression_loss[positive] = smooth_l1.mean(axis=1)
        validation_loss = float(
            np.average(
                classification_loss + float(regression_weight) * regression_loss,
                weights=weights[validation_indices],
            )
        )
        history.append(
            {
                "epoch": int(epoch),
                "train_loss": float(total_loss / max(count, 1)),
                "validation_loss": validation_loss,
            }
        )
        print(
            f"epoch {epoch}: train={history[-1]['train_loss']:.6f} "
            f"validation={validation_loss:.6f}"
        )
        if np.isfinite(validation_loss) and validation_loss <= best_loss:
            best_loss = validation_loss
            best_state = {
                key: value.detach().cpu().clone()
                for key, value in model.state_dict().items()
            }

    if best_state is None:
        raise RuntimeError("No finite temporal box checkpoint was produced")
    selected_feature_indices = list(DOMAIN_INVARIANT_FEATURE_INDICES)
    all_feature_names = list(ALL_FEATURE_NAMES)
    if int(set_neighbor_k) > 0:
        selected_feature_indices.extend(
            range(
                len(ALL_FEATURE_NAMES),
                len(ALL_FEATURE_NAMES) + len(SET_CONTEXT_FEATURE_NAMES),
            )
        )
        all_feature_names.extend(SET_CONTEXT_FEATURE_NAMES)
    metadata = {
        "kind": "temporal_box_conditioner",
        "source_detections": str(source),
        "train_sequences": supervised_names,
        "pseudo_sequences": requested_pseudo_names,
        "optimization_sequences": names,
        "device": resolved_device,
        "input_dim": int(features.shape[1]),
        "hidden_dim": 192,
        "feature_names": [
            all_feature_names[index] for index in selected_feature_indices
        ],
        "selected_feature_indices": selected_feature_indices,
        "neighbor_k": int(neighbor_k),
        "set_neighbor_k": int(set_neighbor_k),
        "match_iou": float(match_iou),
        "epochs": int(epochs),
        "batch_size": int(batch_size),
        "hard_negative_fraction": float(hard_negative_fraction),
        "learning_rate": float(learning_rate),
        "weight_decay": float(weight_decay),
        "validation_fraction": float(validation_fraction),
        "focal_gamma": float(focal_gamma),
        "regression_weight": float(regression_weight),
        "seed": int(seed),
        "history": history,
        "sequence_stats": sequence_stats,
        "between_detector_and_tracker": True,
        "uses_temporal_context": True,
        "predicts_objectness": True,
        "predicts_box_deltas": True,
        "tracker_unchanged": True,
        "no_oracle_ids": True,
        "target_source": (
            None if target_tracker_dir is None else str(target_tracker_dir)
        ),
        "uses_ground_truth_targets": bool(supervised_names),
        "pseudo_label_adaptation": bool(requested_pseudo_names),
        "mixed_supervised_pseudo_training": bool(
            supervised_names and requested_pseudo_names
        ),
    }
    return {
        "state_dict": best_state,
        "mean": mean,
        "scale": scale,
        "metadata": metadata,
    }


def save_model(path: str | Path, payload: dict) -> Path:
    output = Path(path).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    torch.save(payload, output)
    output.with_suffix(output.suffix + ".json").write_text(
        json.dumps(payload["metadata"], indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return output


def apply_temporal_box_conditioner(
    *,
    model_path: str | Path,
    secondary_model_path: str | Path | None = None,
    detection_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    device: str = "auto",
    threshold: float = 0.05,
    top_k: int | None = 700,
    blend_input: float = 0.0,
    box_delta_scale: float = 1.0,
    secondary_weight: float = 0.0,
    secondary_box_weight: float = 0.0,
    batch_size: int = 4096,
    overwrite: bool = False,
) -> Path:
    resolved_device = _resolve_device(device)
    payload = torch.load(
        Path(model_path).expanduser().resolve(),
        map_location="cpu",
        weights_only=False,
    )
    metadata = dict(payload["metadata"])
    if metadata.get("kind") != "temporal_box_conditioner":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    model = TemporalBoxConditioner(
        int(metadata["input_dim"]),
        int(metadata["hidden_dim"]),
    ).to(resolved_device)
    model.load_state_dict(payload["state_dict"])
    mean = np.asarray(payload["mean"], dtype=np.float32)
    scale = np.asarray(payload["scale"], dtype=np.float32)
    secondary_model = None
    secondary_mean = None
    secondary_scale = None
    secondary_metadata = None
    secondary_path = None
    if secondary_model_path is not None:
        if not 0.0 <= float(secondary_weight) <= 1.0:
            raise ValueError("secondary_weight must be in [0, 1]")
        if not 0.0 <= float(secondary_box_weight) <= 1.0:
            raise ValueError("secondary_box_weight must be in [0, 1]")
        secondary_path = Path(secondary_model_path).expanduser().resolve()
        secondary_payload = torch.load(
            secondary_path,
            map_location="cpu",
            weights_only=False,
        )
        secondary_metadata = dict(secondary_payload["metadata"])
        if secondary_metadata.get("kind") != "temporal_box_conditioner":
            raise AssertionError(
                f"Unexpected secondary model kind: "
                f"{secondary_metadata.get('kind')}"
            )
        compatibility_keys = (
            "input_dim",
            "neighbor_k",
            "set_neighbor_k",
            "selected_feature_indices",
        )
        mismatches = [
            key
            for key in compatibility_keys
            if secondary_metadata.get(key) != metadata.get(key)
        ]
        if mismatches:
            raise AssertionError(
                "Temporal ensemble models have incompatible features: "
                + ", ".join(mismatches)
            )
        secondary_model = TemporalBoxConditioner(
            int(secondary_metadata["input_dim"]),
            int(secondary_metadata["hidden_dim"]),
        ).to(resolved_device)
        secondary_model.load_state_dict(secondary_payload["state_dict"])
        secondary_mean = np.asarray(secondary_payload["mean"], dtype=np.float32)
        secondary_scale = np.asarray(secondary_payload["scale"], dtype=np.float32)
    source = Path(detection_dir).expanduser().resolve()
    target = Path(target_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    totals: dict[str, dict] = {}

    for name in [str(value) for value in sequence_names]:
        output_path = target / f"{name}.npz"
        if output_path.exists() and not overwrite:
            continue
        sequence = sequence_by_name[name]
        detections = load_detections(source / f"{name}.npz")
        by_frame = {int(frame): indices for frame, indices in detections.by_frame().items()}
        selected_indices: list[np.ndarray] = []
        selected_scores: list[np.ndarray] = []
        selected_boxes: list[np.ndarray] = []
        for frame, indices in sorted(by_frame.items()):
            features = _conditioner_features(
                detections,
                indices,
                frame=int(frame),
                by_frame=by_frame,
                sequence=sequence,
                neighbor_k=int(metadata["neighbor_k"]),
                set_neighbor_k=int(metadata.get("set_neighbor_k", 0)),
            )
            features = features[
                :, np.asarray(metadata["selected_feature_indices"], dtype=np.int64)
            ]
            scores, deltas = _predict(
                model,
                features,
                mean=mean,
                scale=scale,
                device=resolved_device,
                batch_size=int(batch_size),
            )
            if secondary_model is not None:
                secondary_scores, secondary_deltas = _predict(
                    secondary_model,
                    features,
                    mean=secondary_mean,
                    scale=secondary_scale,
                    device=resolved_device,
                    batch_size=int(batch_size),
                )
                scores = (
                    (1.0 - float(secondary_weight)) * scores
                    + float(secondary_weight) * secondary_scores
                ).astype(np.float32)
                deltas = (
                    (1.0 - float(secondary_box_weight)) * deltas
                    + float(secondary_box_weight) * secondary_deltas
                ).astype(np.float32)
            if float(blend_input) > 0:
                input_scores = detections.calibrated_scores[indices].astype(np.float32)
                scores = (
                    (1.0 - float(blend_input)) * scores
                    + float(blend_input) * input_scores
                ).astype(np.float32)
            keep = np.flatnonzero(scores >= float(threshold))
            if top_k is not None and len(keep) > int(top_k):
                keep = keep[np.argsort(-scores[keep])[: int(top_k)]]
            if not len(keep):
                continue
            boxes = detections.boxes[indices[keep]].astype(np.float32).copy()
            widths = np.maximum(boxes[:, 2] - boxes[:, 0], 1.0)
            heights = np.maximum(boxes[:, 3] - boxes[:, 1], 1.0)
            delta_factors = np.column_stack(
                [widths, heights, widths, heights]
            ).astype(np.float32)
            boxes += float(box_delta_scale) * deltas[keep] * delta_factors
            boxes[:, [0, 2]] = np.clip(boxes[:, [0, 2]], 0, float(sequence.width))
            boxes[:, [1, 3]] = np.clip(boxes[:, [1, 3]], 0, float(sequence.height))
            valid = (boxes[:, 2] > boxes[:, 0] + 1.0) & (
                boxes[:, 3] > boxes[:, 1] + 1.0
            )
            if np.any(valid):
                selected_indices.append(indices[keep][valid].astype(np.int64))
                selected_scores.append(scores[keep][valid].astype(np.float32))
                selected_boxes.append(boxes[valid].astype(np.float32))

        selected = (
            np.concatenate(selected_indices)
            if selected_indices
            else np.zeros((0,), dtype=np.int64)
        )
        scores = (
            np.concatenate(selected_scores)
            if selected_scores
            else np.zeros((0,), dtype=np.float32)
        )
        boxes = (
            np.concatenate(selected_boxes)
            if selected_boxes
            else np.zeros((0, 4), dtype=np.float32)
        )
        conditioned = DetectionSet(
            frames=detections.frames[selected],
            boxes=boxes,
            raw_scores=detections.raw_scores[selected],
            calibrated_scores=scores,
            prompt_ids=detections.prompt_ids[selected],
            tile_ids=detections.tile_ids[selected],
            image_widths=detections.image_widths[selected],
            image_heights=detections.image_heights[selected],
            prompt_texts=detections.prompt_texts[selected],
        )
        save_detections(output_path, conditioned)
        totals[name] = {
            "source_detections": int(len(detections)),
            "conditioned_detections": int(len(conditioned)),
        }
        print(f"{name}: {len(detections)} -> {len(conditioned)}")

    write_run_metadata(
        target,
        {
            "kind": "temporal_box_conditioned",
            "source": str(source),
            "model": str(Path(model_path).expanduser().resolve()),
            "model_metadata": metadata,
            "secondary_model": (
                None if secondary_path is None else str(secondary_path)
            ),
            "secondary_model_metadata": secondary_metadata,
            "secondary_weight": float(secondary_weight),
            "secondary_box_weight": float(secondary_box_weight),
            "device": resolved_device,
            "threshold": float(threshold),
            "top_k": None if top_k is None else int(top_k),
            "blend_input": float(blend_input),
            "box_delta_scale": float(box_delta_scale),
            "counts": totals,
            "between_detector_and_tracker": True,
            "uses_temporal_context": True,
            "predicts_objectness": True,
            "predicts_box_deltas": True,
            "tracker_unchanged": True,
            "no_oracle_ids": True,
        },
    )
    return target
