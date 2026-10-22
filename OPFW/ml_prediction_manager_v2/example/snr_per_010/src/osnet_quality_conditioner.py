from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd
import torch
from scipy.optimize import linear_sum_assignment
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import SequenceInfo, gt_to_xyxy, load_gt, read_mot_rows
from neural_vlm_conditioner import _resolve_device
from nms import pairwise_iou_xyxy
from vlm_conditioner import FEATURE_NAMES, _frame_features


OSNET_DIM = 512
QUALITY_GEOMETRY_NAMES = (
    "raw_score",
    "calibrated_score",
    "score_log",
    "score_sqrt",
    "score_rank_norm",
    "score_percentile",
    "score_over_frame_max",
    "score_over_frame_median",
    "frame_detection_count_log",
    "w_norm",
    "h_norm",
    "area_norm_log",
    "aspect_h_over_w",
    "border_min_norm",
    "tile_id_norm",
)
ROBUST_QUALITY_GEOMETRY_NAMES = (
    "raw_score",
    "calibrated_score",
    "score_log",
    "score_sqrt",
    "score_rank_norm",
    "score_percentile",
    "score_over_frame_max",
    "score_over_frame_median",
    "aspect_h_over_w",
)
RELATIONAL_FEATURE_NAMES = (
    "height_rank_percentile",
    "height_log_over_frame_median",
    "width_rank_percentile",
    "width_log_over_frame_median",
    "area_rank_percentile",
    "area_log_over_frame_median",
    "aspect_log_over_frame_median",
    "bottom_rank_percentile",
    "center_y_rank_percentile",
)
RELATIONAL_QUALITY_GEOMETRY_NAMES = (
    *ROBUST_QUALITY_GEOMETRY_NAMES,
    *RELATIONAL_FEATURE_NAMES,
)
COMPETITION_FEATURE_NAMES = (
    "overlap_count_log_iou030",
    "overlap_count_log_iou050",
    "overlap_count_log_iou070",
    "max_neighbor_iou",
    "max_higher_score_iou",
    "max_neighbor_score_iou030",
    "max_neighbor_score_iou050",
    "score_margin_iou030",
    "overlap_score_support_mean",
)
COMPETITION_QUALITY_GEOMETRY_NAMES = (
    *ROBUST_QUALITY_GEOMETRY_NAMES,
    *COMPETITION_FEATURE_NAMES,
)
CAMERA_QUALITY_GEOMETRY_NAMES = (
    *ROBUST_QUALITY_GEOMETRY_NAMES,
    "frame_detection_count_log",
    "cx_norm",
    "cy_norm",
    "bottom_norm",
    "w_norm",
    "h_norm",
    "area_norm_log",
    "border_min_norm",
    "tile_id_norm",
    *COMPETITION_FEATURE_NAMES,
)


def _geometry_names(profile: str) -> tuple[str, ...]:
    if str(profile) == "full":
        return QUALITY_GEOMETRY_NAMES
    if str(profile) == "robust":
        return ROBUST_QUALITY_GEOMETRY_NAMES
    if str(profile) == "relational":
        return RELATIONAL_QUALITY_GEOMETRY_NAMES
    if str(profile) == "competition":
        return COMPETITION_QUALITY_GEOMETRY_NAMES
    if str(profile) == "camera":
        return CAMERA_QUALITY_GEOMETRY_NAMES
    raise ValueError(f"Unknown OSNet quality geometry profile: {profile}")


def _average_percentile_rank(values: np.ndarray) -> np.ndarray:
    values = np.asarray(values, dtype=np.float32)
    if len(values) == 0:
        return np.zeros((0,), dtype=np.float32)
    if len(values) == 1:
        return np.full((1,), 0.5, dtype=np.float32)
    sorted_values = np.sort(values, kind="stable")
    lower = np.searchsorted(sorted_values, values, side="left")
    upper = np.searchsorted(sorted_values, values, side="right")
    average_rank = 0.5 * (lower + upper - 1)
    return (average_rank / float(len(values) - 1)).astype(np.float32)


def _relational_features(
    detections: DetectionSet,
    indices: np.ndarray,
) -> np.ndarray:
    count = len(indices)
    if count == 0:
        return np.zeros((0, len(RELATIONAL_FEATURE_NAMES)), dtype=np.float32)
    boxes = detections.boxes[indices].astype(np.float32)
    widths = np.maximum(boxes[:, 2] - boxes[:, 0], 1.0)
    heights = np.maximum(boxes[:, 3] - boxes[:, 1], 1.0)
    areas = widths * heights
    aspects = heights / widths
    bottoms = boxes[:, 3]
    centers_y = 0.5 * (boxes[:, 1] + boxes[:, 3])

    def _log_over_median(values: np.ndarray) -> np.ndarray:
        median = max(float(np.median(values)), 1.0e-6)
        return np.clip(
            np.log(np.maximum(values, 1.0e-6) / median),
            -6.0,
            6.0,
        ).astype(np.float32)

    return np.column_stack(
        [
            _average_percentile_rank(heights),
            _log_over_median(heights),
            _average_percentile_rank(widths),
            _log_over_median(widths),
            _average_percentile_rank(areas),
            _log_over_median(areas),
            _log_over_median(aspects),
            _average_percentile_rank(bottoms),
            _average_percentile_rank(centers_y),
        ]
    ).astype(np.float32)


def _competition_features(
    detections: DetectionSet,
    indices: np.ndarray,
) -> np.ndarray:
    count = len(indices)
    if count == 0:
        return np.zeros((0, len(COMPETITION_FEATURE_NAMES)), dtype=np.float32)
    boxes = detections.boxes[indices].astype(np.float32)
    scores = detections.calibrated_scores[indices].astype(np.float32)
    iou = pairwise_iou_xyxy(boxes, boxes).astype(np.float32)
    np.fill_diagonal(iou, 0.0)
    normalizer = max(float(np.log1p(max(count - 1, 1))), 1.0)

    def _normalized_count(threshold: float) -> np.ndarray:
        return (
            np.log1p(np.sum(iou >= float(threshold), axis=1).astype(np.float32))
            / normalizer
        ).astype(np.float32)

    higher_score = scores[None, :] > (scores[:, None] + 1.0e-6)
    max_higher_iou = np.max(np.where(higher_score, iou, 0.0), axis=1)

    def _max_neighbor_score(threshold: float) -> np.ndarray:
        return np.max(
            np.where(iou >= float(threshold), scores[None, :], 0.0),
            axis=1,
        )

    max_score_030 = _max_neighbor_score(0.30)
    max_score_050 = _max_neighbor_score(0.50)
    overlap_mask = iou >= 0.10
    overlap_denominator = np.maximum(overlap_mask.sum(axis=1), 1)
    overlap_support = (
        np.sum(np.where(overlap_mask, iou * scores[None, :], 0.0), axis=1)
        / overlap_denominator
    )
    return np.column_stack(
        [
            _normalized_count(0.30),
            _normalized_count(0.50),
            _normalized_count(0.70),
            np.max(iou, axis=1),
            max_higher_iou,
            max_score_030,
            max_score_050,
            scores - max_score_030,
            overlap_support,
        ]
    ).astype(np.float32)


def _quality_geometry_features(
    detections: DetectionSet,
    indices: np.ndarray,
    sequence: SequenceInfo,
    names: Iterable[str],
) -> np.ndarray:
    requested = tuple(str(name) for name in names)
    base = _frame_features(detections, indices, sequence)
    competition = None
    relational = None
    columns: list[np.ndarray] = []
    for name in requested:
        if name in FEATURE_NAMES:
            columns.append(base[:, FEATURE_NAMES.index(name)])
            continue
        if name in COMPETITION_FEATURE_NAMES:
            if competition is None:
                competition = _competition_features(detections, indices)
            columns.append(
                competition[:, COMPETITION_FEATURE_NAMES.index(name)]
            )
            continue
        if name in RELATIONAL_FEATURE_NAMES:
            if relational is None:
                relational = _relational_features(detections, indices)
            columns.append(
                relational[:, RELATIONAL_FEATURE_NAMES.index(name)]
            )
            continue
        raise ValueError(f"Unknown OSNet quality feature: {name}")
    return np.column_stack(columns).astype(np.float32)


class OSNetQualityConditioner(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 256) -> None:
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
        self.quality = nn.Sequential(
            nn.GELU(),
            nn.Linear(hidden_dim, 128),
            nn.GELU(),
            nn.Dropout(0.05),
            nn.Linear(128, 1),
        )
        self.box_delta = nn.Sequential(
            nn.GELU(),
            nn.Linear(hidden_dim, 128),
            nn.GELU(),
            nn.Linear(128, 4),
        )

    def forward(self, features: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        hidden = self.input(features)
        hidden = hidden + self.block(hidden)
        quality_logit = self.quality(hidden).squeeze(1)
        box_delta = 0.5 * torch.tanh(self.box_delta(hidden))
        return quality_logit, box_delta


def _embedding_path(root: Path, sequence_name: str) -> Path:
    return root / f"{sequence_name}.npy"


def _load_embeddings(
    embedding_dir: str | Path,
    sequence_name: str,
    expected_count: int,
) -> np.ndarray:
    path = _embedding_path(Path(embedding_dir).expanduser().resolve(), sequence_name)
    embeddings = np.load(path, mmap_mode="r")
    if embeddings.shape != (int(expected_count), OSNET_DIM):
        raise AssertionError(
            f"OSNet cache shape mismatch for {sequence_name}: "
            f"{embeddings.shape} != {(int(expected_count), OSNET_DIM)}"
        )
    return embeddings


def _quality_targets_for_frame(
    detections: DetectionSet,
    indices: np.ndarray,
    gt_frame,
    ignore_frame,
    *,
    negative_iou: float,
    regression_iou: float,
    target_mode: str,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    boxes = detections.boxes[indices].astype(np.float32)
    gt_boxes = gt_to_xyxy(gt_frame).astype(np.float32)
    ignore_boxes = gt_to_xyxy(ignore_frame).astype(np.float32)
    quality = np.zeros((len(indices),), dtype=np.float32)
    deltas = np.zeros((len(indices), 4), dtype=np.float32)
    regression = np.zeros((len(indices),), dtype=bool)
    ignored = np.zeros((len(indices),), dtype=bool)

    if len(boxes) and len(gt_boxes):
        iou = pairwise_iou_xyxy(boxes, gt_boxes)
        if str(target_mode) == "independent":
            best_gt = np.argmax(iou, axis=1)
            quality = iou[np.arange(len(boxes)), best_gt].astype(np.float32)
        elif str(target_mode) == "one_to_one":
            best_gt = np.full((len(boxes),), -1, dtype=np.int64)
            det_rows, gt_cols = linear_sum_assignment(1.0 - iou)
            best_gt[det_rows] = gt_cols
            quality[det_rows] = iou[det_rows, gt_cols].astype(np.float32)
        else:
            raise ValueError(f"Unsupported quality target mode: {target_mode}")
        regression = quality >= float(regression_iou)
        if np.any(regression):
            matched_gt = gt_boxes[best_gt[regression]]
            matched_boxes = boxes[regression]
            widths = np.maximum(matched_boxes[:, 2] - matched_boxes[:, 0], 1.0)
            heights = np.maximum(matched_boxes[:, 3] - matched_boxes[:, 1], 1.0)
            factors = np.column_stack([widths, heights, widths, heights]).astype(np.float32)
            deltas[regression] = np.clip(
                (matched_gt - matched_boxes) / factors,
                -0.5,
                0.5,
            )

    if len(boxes) and len(ignore_boxes):
        ignore_overlap = pairwise_iou_xyxy(boxes, ignore_boxes).max(axis=1)
        ignored = (ignore_overlap >= 0.5) & (quality < 0.5)

    
    
    return quality, deltas, regression, ignored


def _sample_sequence(
    *,
    detection_path: Path,
    embedding_dir: Path,
    sequence: SequenceInfo,
    max_samples: int,
    high_quality_fraction: float,
    negative_iou: float,
    regression_iou: float,
    target_mode: str,
    geometry_names: tuple[str, ...],
    target_tracker_dir: Path | None,
    rng: np.random.Generator,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, dict]:
    detections = load_detections(detection_path)
    embeddings = _load_embeddings(embedding_dir, sequence.name, len(detections))
    if target_tracker_dir is None:
        valid_gt, ignore_gt = load_gt(sequence.gt_path)
        target_kind = "ground_truth"
    else:
        tracker_root = (
            target_tracker_dir / "data"
            if (target_tracker_dir / "data").exists()
            else target_tracker_dir
        )
        rows = read_mot_rows(tracker_root / f"{sequence.name}.txt")
        valid_gt = pd.DataFrame(
            [
                {
                    "frame": int(row[0]),
                    "id": int(row[1]),
                    "x": float(row[2]),
                    "y": float(row[3]),
                    "w": float(row[4]),
                    "h": float(row[5]),
                }
                for row in rows
            ],
            columns=["frame", "id", "x", "y", "w", "h"],
        )
        ignore_gt = valid_gt.iloc[0:0].copy()
        target_kind = "pseudo_tracker"
    valid_by_frame = {int(frame): rows for frame, rows in valid_gt.groupby("frame")}
    ignore_by_frame = {int(frame): rows for frame, rows in ignore_gt.groupby("frame")}
    empty_valid = valid_gt.iloc[0:0]
    empty_ignore = ignore_gt.iloc[0:0]

    candidate_indices: list[np.ndarray] = []
    quality_targets: list[np.ndarray] = []
    delta_targets: list[np.ndarray] = []
    regression_masks: list[np.ndarray] = []
    geometry_features: list[np.ndarray] = []
    matched_gt = 0

    for frame, indices in sorted(detections.by_frame().items()):
        quality, deltas, regression, ignored = _quality_targets_for_frame(
            detections,
            indices,
            valid_by_frame.get(int(frame), empty_valid),
            ignore_by_frame.get(int(frame), empty_ignore),
            negative_iou=float(negative_iou),
            regression_iou=float(regression_iou),
            target_mode=str(target_mode),
        )
        keep = np.flatnonzero(~ignored)
        if not len(keep):
            continue
        candidate_indices.append(indices[keep].astype(np.int64))
        quality_targets.append(quality[keep])
        delta_targets.append(deltas[keep])
        regression_masks.append(regression[keep])
        geometry_features.append(
            _quality_geometry_features(
                detections,
                indices,
                sequence,
                geometry_names,
            )[keep]
        )

        gt_count = len(valid_by_frame.get(int(frame), empty_valid))
        if gt_count and len(indices):
            gt_boxes = gt_to_xyxy(valid_by_frame[int(frame)]).astype(np.float32)
            iou = pairwise_iou_xyxy(gt_boxes, detections.boxes[indices].astype(np.float32))
            rows, cols = linear_sum_assignment(1.0 - iou)
            matched_gt += int(np.sum(iou[rows, cols] >= 0.5))

    selected_indices = np.concatenate(candidate_indices)
    quality = np.concatenate(quality_targets).astype(np.float32)
    deltas = np.concatenate(delta_targets).astype(np.float32)
    regression = np.concatenate(regression_masks).astype(bool)
    geometry = np.concatenate(geometry_features).astype(np.float32)

    high_quality = np.flatnonzero(quality >= 0.5)
    medium_quality = np.flatnonzero(
        (quality >= float(regression_iou)) & (quality < 0.5)
    )
    negative = np.flatnonzero(quality <= float(negative_iou))
    ambiguous = np.flatnonzero(
        (quality > float(negative_iou)) & (quality < float(regression_iou))
    )
    high_budget = min(
        len(high_quality),
        max(1, int(round(int(max_samples) * float(high_quality_fraction)))),
    )
    medium_budget = min(len(medium_quality), int(round(int(max_samples) * 0.20)))
    ambiguous_budget = min(len(ambiguous), int(round(int(max_samples) * 0.10)))
    negative_budget = min(
        len(negative),
        max(int(max_samples) - high_budget - medium_budget - ambiguous_budget, 0),
    )
    chosen_high = (
        rng.choice(high_quality, size=high_budget, replace=False)
        if len(high_quality) > high_budget
        else high_quality
    )
    chosen_medium = (
        rng.choice(medium_quality, size=medium_budget, replace=False)
        if len(medium_quality) > medium_budget
        else medium_quality
    )
    chosen_ambiguous = (
        rng.choice(ambiguous, size=ambiguous_budget, replace=False)
        if len(ambiguous) > ambiguous_budget
        else ambiguous
    )
    chosen_negative = (
        rng.choice(negative, size=negative_budget, replace=False)
        if len(negative) > negative_budget
        else negative
    )
    chosen = np.concatenate(
        [chosen_high, chosen_medium, chosen_ambiguous, chosen_negative]
    ).astype(np.int64)
    if len(chosen) < min(int(max_samples), len(quality)):
        selected_mask = np.zeros((len(quality),), dtype=bool)
        selected_mask[chosen] = True
        remaining_indices = np.flatnonzero(~selected_mask)
        fill_count = min(int(max_samples) - len(chosen), len(remaining_indices))
        if fill_count:
            fill = rng.choice(remaining_indices, size=fill_count, replace=False)
            chosen = np.concatenate([chosen, fill]).astype(np.int64)
    rng.shuffle(chosen)

    embedding_features = np.asarray(
        embeddings[selected_indices[chosen]],
        dtype=np.float32,
    )
    features = np.concatenate(
        [geometry[chosen], embedding_features],
        axis=1,
    ).astype(np.float32)
    stats = {
        "source_detections": int(len(detections)),
        "samples": int(len(chosen)),
        "quality_ge_050": int(np.sum(quality[chosen] >= 0.5)),
        "quality_020_to_050": int(
            np.sum(
                (quality[chosen] >= float(regression_iou))
                & (quality[chosen] < 0.5)
            )
        ),
        "regression_samples": int(np.sum(regression[chosen])),
        "negative_samples": int(np.sum(quality[chosen] <= float(negative_iou))),
        "valid_gt": int(len(valid_gt)),
        "target_kind": target_kind,
        "matched_gt_at_iou_050": int(matched_gt),
        "candidate_recall_at_iou_050": float(matched_gt / max(len(valid_gt), 1)),
    }
    return (
        features,
        quality[chosen],
        deltas[chosen],
        regression[chosen],
        stats,
    )


def _predict(
    model: OSNetQualityConditioner,
    features: np.ndarray,
    *,
    mean: np.ndarray,
    scale: np.ndarray,
    device: str,
    batch_size: int,
) -> tuple[np.ndarray, np.ndarray]:
    quality = np.empty((len(features),), dtype=np.float32)
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
            quality[start:end] = torch.sigmoid(logits).cpu().numpy().astype(np.float32)
            deltas[start:end] = batch_deltas.cpu().numpy().astype(np.float32)
    return quality, deltas


def train_osnet_quality_conditioner(
    *,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    device: str = "auto",
    max_samples_per_sequence: int = 250_000,
    high_quality_fraction: float = 0.45,
    negative_iou: float = 0.05,
    regression_iou: float = 0.20,
    epochs: int = 10,
    batch_size: int = 4096,
    learning_rate: float = 6.0e-4,
    weight_decay: float = 1.0e-4,
    validation_fraction: float = 0.15,
    regression_weight: float = 1.5,
    hidden_dim: int = 384,
    geometry_profile: str = "full",
    target_mode: str = "independent",
    target_tracker_dir: str | Path | None = None,
    seed: int = 20260730,
) -> dict:
    names = [str(name) for name in train_sequences]
    source = Path(detection_dir).expanduser().resolve()
    embedding_root = Path(embedding_dir).expanduser().resolve()
    target_tracker_root = (
        Path(target_tracker_dir).expanduser().resolve()
        if target_tracker_dir is not None
        else None
    )
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    rng = np.random.default_rng(int(seed))
    xs: list[np.ndarray] = []
    qs: list[np.ndarray] = []
    ds: list[np.ndarray] = []
    rs: list[np.ndarray] = []
    sequence_stats: dict[str, dict] = {}
    geometry_names = _geometry_names(geometry_profile)

    for name in names:
        x, q, d, r, stats = _sample_sequence(
            detection_path=source / f"{name}.npz",
            embedding_dir=embedding_root,
            sequence=sequence_by_name[name],
            max_samples=int(max_samples_per_sequence),
            high_quality_fraction=float(high_quality_fraction),
            negative_iou=float(negative_iou),
            regression_iou=float(regression_iou),
            target_mode=str(target_mode),
            geometry_names=geometry_names,
            target_tracker_dir=target_tracker_root,
            rng=rng,
        )
        xs.append(x)
        qs.append(q)
        ds.append(d)
        rs.append(r)
        sequence_stats[name] = stats
        print(
            f"{name}: samples={len(q)} quality>=.5={int(np.sum(q >= 0.5))} "
            f"candidate_recall={stats['candidate_recall_at_iou_050']:.4f}"
        )

    features = np.concatenate(xs).astype(np.float32)
    quality_targets = np.concatenate(qs).astype(np.float32)
    delta_targets = np.concatenate(ds).astype(np.float32)
    regression_masks = np.concatenate(rs).astype(np.float32)
    order = rng.permutation(len(quality_targets))
    validation_count = max(1, int(round(len(order) * float(validation_fraction))))
    validation_indices = order[:validation_count]
    train_indices = order[validation_count:]
    mean = features[train_indices].mean(axis=0, dtype=np.float64).astype(np.float32)
    scale = np.maximum(
        features[train_indices].std(axis=0, dtype=np.float64).astype(np.float32),
        1.0e-4,
    )
    train_x = ((features[train_indices] - mean) / scale).astype(np.float32)

    resolved_device = _resolve_device(device)
    torch.manual_seed(int(seed))
    model = OSNetQualityConditioner(
        features.shape[1],
        hidden_dim=int(hidden_dim),
    ).to(resolved_device)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=float(learning_rate),
        weight_decay=float(weight_decay),
    )
    loader = DataLoader(
        TensorDataset(
            torch.from_numpy(train_x),
            torch.from_numpy(quality_targets[train_indices]),
            torch.from_numpy(delta_targets[train_indices]),
            torch.from_numpy(regression_masks[train_indices]),
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
        for batch_x, batch_q, batch_d, batch_r in loader:
            batch_x = batch_x.to(resolved_device)
            batch_q = batch_q.to(resolved_device)
            batch_d = batch_d.to(resolved_device)
            batch_r = batch_r.to(resolved_device)
            optimizer.zero_grad(set_to_none=True)
            logits, predicted_deltas = model(batch_x)
            quality_loss = nn.functional.binary_cross_entropy_with_logits(
                logits,
                batch_q,
                reduction="none",
            )
            quality_weight = 0.5 + 2.5 * batch_q
            regression_loss = nn.functional.smooth_l1_loss(
                predicted_deltas,
                batch_d,
                reduction="none",
                beta=0.05,
            ).mean(dim=1)
            regression_weight_per_sample = batch_r * torch.clamp(batch_q, min=0.2)
            regression_denominator = torch.clamp(
                regression_weight_per_sample.sum(),
                min=1.0,
            )
            loss = (quality_loss * quality_weight).mean() + float(regression_weight) * (
                (regression_loss * regression_weight_per_sample).sum()
                / regression_denominator
            )
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            optimizer.step()
            total_loss += float(loss.detach().cpu()) * len(batch_x)
            count += len(batch_x)

        validation_quality, validation_deltas = _predict(
            model,
            features[validation_indices],
            mean=mean,
            scale=scale,
            device=resolved_device,
            batch_size=int(batch_size),
        )
        target_quality = quality_targets[validation_indices]
        quality_loss = -(
            target_quality * np.log(np.maximum(validation_quality, 1.0e-7))
            + (1.0 - target_quality)
            * np.log(np.maximum(1.0 - validation_quality, 1.0e-7))
        )
        regression_mask = regression_masks[validation_indices] > 0.5
        regression_loss = 0.0
        if np.any(regression_mask):
            difference = np.abs(
                validation_deltas[regression_mask]
                - delta_targets[validation_indices][regression_mask]
            )
            beta = 0.05
            smooth_l1 = np.where(
                difference < beta,
                0.5 * difference * difference / beta,
                difference - 0.5 * beta,
            )
            regression_loss = float(smooth_l1.mean())
        validation_quality_weight = 0.5 + 2.5 * target_quality
        validation_loss = float(
            np.mean(quality_loss * validation_quality_weight)
            + float(regression_weight) * regression_loss
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
        raise RuntimeError("No finite OSNet quality checkpoint was produced")
    metadata = {
        "kind": "osnet_quality_conditioner",
        "source_detections": str(source),
        "embedding_dir": str(embedding_root),
        "train_sequences": names,
        "device": resolved_device,
        "input_dim": int(features.shape[1]),
        "hidden_dim": int(hidden_dim),
        "geometry_profile": str(geometry_profile),
        "target_mode": str(target_mode),
        "target_source": (
            str(target_tracker_root)
            if target_tracker_root is not None
            else "MOT20 training ground truth"
        ),
        "pseudo_label_adaptation": target_tracker_root is not None,
        "geometry_feature_names": list(geometry_names),
        "appearance_backbone": "osnet_x0_25_msmt17",
        "appearance_dim": OSNET_DIM,
        "appearance_backbone_frozen": True,
        "max_samples_per_sequence": int(max_samples_per_sequence),
        "high_quality_fraction": float(high_quality_fraction),
        "negative_iou": float(negative_iou),
        "regression_iou": float(regression_iou),
        "epochs": int(epochs),
        "batch_size": int(batch_size),
        "learning_rate": float(learning_rate),
        "weight_decay": float(weight_decay),
        "validation_fraction": float(validation_fraction),
        "regression_weight": float(regression_weight),
        "seed": int(seed),
        "history": history,
        "sequence_stats": sequence_stats,
        "training_samples": {
            "count": int(len(train_indices)),
            "validation": int(len(validation_indices)),
        },
        "between_vlm_detector_and_tracker": True,
        "predicts_iou_quality": True,
        "predicts_box_deltas": True,
        "uses_absolute_camera_position": False,
        "boxes_start_from_groundingdino": True,
        "tracker_unchanged": True,
        "no_detector_finetuning": True,
        "no_yolo_inference": True,
        "no_oracle_ids": True,
        "uses_ground_truth_targets": target_tracker_root is None,
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


def apply_osnet_quality_conditioner(
    *,
    model_path: str | Path,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    device: str = "auto",
    threshold: float = 0.01,
    top_k: int | None = None,
    blend_input: float = 0.0,
    box_delta_scale: float = 0.0,
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
    if metadata.get("kind") != "osnet_quality_conditioner":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    model = OSNetQualityConditioner(
        int(metadata["input_dim"]),
        int(metadata["hidden_dim"]),
    ).to(resolved_device)
    model.load_state_dict(payload["state_dict"])
    mean = np.asarray(payload["mean"], dtype=np.float32)
    scale = np.asarray(payload["scale"], dtype=np.float32)
    geometry_names = tuple(
        metadata.get("geometry_feature_names", QUALITY_GEOMETRY_NAMES)
    )
    source = Path(detection_dir).expanduser().resolve()
    embedding_root = Path(embedding_dir).expanduser().resolve()
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
        embeddings = _load_embeddings(embedding_root, name, len(detections))
        geometry = np.empty(
            (len(detections), len(geometry_names)),
            dtype=np.float32,
        )
        for _, indices in sorted(detections.by_frame().items()):
            geometry[indices] = _quality_geometry_features(
                detections,
                indices,
                sequence,
                geometry_names,
            )
        features = np.concatenate(
            [geometry, np.asarray(embeddings, dtype=np.float32)],
            axis=1,
        )
        scores, deltas = _predict(
            model,
            features,
            mean=mean,
            scale=scale,
            device=resolved_device,
            batch_size=int(batch_size),
        )
        del features
        if float(blend_input) > 0:
            scores = (
                (1.0 - float(blend_input)) * scores
                + float(blend_input) * detections.calibrated_scores
            ).astype(np.float32)

        boxes = detections.boxes.astype(np.float32).copy()
        if float(box_delta_scale) != 0.0:
            widths = np.maximum(boxes[:, 2] - boxes[:, 0], 1.0)
            heights = np.maximum(boxes[:, 3] - boxes[:, 1], 1.0)
            factors = np.column_stack(
                [widths, heights, widths, heights]
            ).astype(np.float32)
            boxes += float(box_delta_scale) * deltas * factors
            boxes[:, [0, 2]] = np.clip(
                boxes[:, [0, 2]],
                0,
                float(sequence.width),
            )
            boxes[:, [1, 3]] = np.clip(
                boxes[:, [1, 3]],
                0,
                float(sequence.height),
            )

        selected_indices: list[np.ndarray] = []
        selected_scores: list[np.ndarray] = []
        by_frame = detections.by_frame()
        for _, indices in sorted(by_frame.items()):
            keep = indices[scores[indices] >= float(threshold)]
            if top_k is not None and len(keep) > int(top_k):
                keep = keep[np.argsort(-scores[keep])[: int(top_k)]]
            valid = (boxes[keep, 2] > boxes[keep, 0] + 1.0) & (
                boxes[keep, 3] > boxes[keep, 1] + 1.0
            )
            if np.any(valid):
                selected_indices.append(keep[valid].astype(np.int64))
                selected_scores.append(scores[keep][valid].astype(np.float32))

        selected = (
            np.concatenate(selected_indices)
            if selected_indices
            else np.zeros((0,), dtype=np.int64)
        )
        selected_quality = (
            np.concatenate(selected_scores)
            if selected_scores
            else np.zeros((0,), dtype=np.float32)
        )
        conditioned = DetectionSet(
            frames=detections.frames[selected],
            boxes=boxes[selected],
            raw_scores=detections.raw_scores[selected],
            calibrated_scores=selected_quality,
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
            "kind": "osnet_quality_conditioned",
            "source": str(source),
            "embedding_dir": str(embedding_root),
            "model": str(Path(model_path).expanduser().resolve()),
            "model_metadata": metadata,
            "device": resolved_device,
            "threshold": float(threshold),
            "top_k": None if top_k is None else int(top_k),
            "blend_input": float(blend_input),
            "box_delta_scale": float(box_delta_scale),
            "counts": totals,
            "between_vlm_detector_and_tracker": True,
            "predicts_iou_quality": True,
            "predicts_box_deltas": True,
            "boxes_start_from_groundingdino": True,
            "tracker_unchanged": True,
            "no_detector_finetuning": True,
            "no_yolo_inference": True,
            "no_oracle_ids": True,
        },
    )
    return target
