from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from scipy.spatial import cKDTree
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import TRAIN_SEQUENCES, SequenceInfo, load_gt
from neural_vlm_conditioner import _resolve_device
from vlm_conditioner import FEATURE_NAMES, _frame_features, _labels_for_frame


TEMPORAL_OFFSETS = (-2, -1, 1, 2)
TEMPORAL_FEATURE_NAMES = [
    f"{name}_dt{offset:+d}"
    for offset in TEMPORAL_OFFSETS
    for name in (
        "max_iou",
        "matched_score",
        "center_dist_per_h",
        "abs_log_height_ratio",
        "iou_score_support",
    )
] + [
    "adjacent_iou_min",
    "adjacent_iou_mean",
    "adjacent_iou_product",
    "context_iou_mean",
    "context_iou_max",
    "context_iou_ge_030",
    "context_iou_ge_050",
    "context_support_mean",
]
ALL_FEATURE_NAMES = FEATURE_NAMES + TEMPORAL_FEATURE_NAMES
DOMAIN_INVARIANT_BASE_FEATURES = {
    "raw_score",
    "calibrated_score",
    "score_log",
    "score_sqrt",
    "score_rank_norm",
    "score_percentile",
    "score_over_frame_max",
    "score_over_frame_median",
    "aspect_h_over_w",
}
DOMAIN_INVARIANT_FEATURE_INDICES = [
    index
    for index, name in enumerate(ALL_FEATURE_NAMES)
    if name in DOMAIN_INVARIANT_BASE_FEATURES or name in TEMPORAL_FEATURE_NAMES
]


class TemporalNeuralConditioner(nn.Module):
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
            nn.Linear(96, 1),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        hidden = self.input(features)
        hidden = hidden + self.block(hidden)
        return self.output(hidden).squeeze(1)


def _candidate_match_features(
    boxes: np.ndarray,
    neighbor_boxes: np.ndarray,
    neighbor_scores: np.ndarray,
    *,
    neighbor_k: int,
) -> np.ndarray:
    count = len(boxes)
    output = np.zeros((count, 5), dtype=np.float32)
    if count == 0 or len(neighbor_boxes) == 0:
        return output

    centers = (boxes[:, :2] + boxes[:, 2:]) * 0.5
    neighbor_centers = (neighbor_boxes[:, :2] + neighbor_boxes[:, 2:]) * 0.5
    k = min(max(int(neighbor_k), 1), len(neighbor_boxes))
    _, neighbor_indices = cKDTree(neighbor_centers).query(centers, k=k)
    if k == 1:
        neighbor_indices = neighbor_indices[:, None]

    candidates = neighbor_boxes[neighbor_indices]
    intersection_lt = np.maximum(boxes[:, None, :2], candidates[:, :, :2])
    intersection_rb = np.minimum(boxes[:, None, 2:], candidates[:, :, 2:])
    intersection_wh = np.maximum(intersection_rb - intersection_lt, 0.0)
    intersection = intersection_wh[:, :, 0] * intersection_wh[:, :, 1]
    areas = np.maximum(boxes[:, 2] - boxes[:, 0], 0.0) * np.maximum(
        boxes[:, 3] - boxes[:, 1], 0.0
    )
    neighbor_areas = np.maximum(candidates[:, :, 2] - candidates[:, :, 0], 0.0) * np.maximum(
        candidates[:, :, 3] - candidates[:, :, 1], 0.0
    )
    union = areas[:, None] + neighbor_areas - intersection
    iou = intersection / np.maximum(union, 1.0e-6)
    best_local = np.argmax(iou, axis=1)
    row = np.arange(count)
    matched_indices = neighbor_indices[row, best_local]
    matched_boxes = neighbor_boxes[matched_indices]
    matched_iou = iou[row, best_local].astype(np.float32)
    matched_scores = neighbor_scores[matched_indices].astype(np.float32)

    heights = np.maximum(boxes[:, 3] - boxes[:, 1], 1.0)
    matched_heights = np.maximum(matched_boxes[:, 3] - matched_boxes[:, 1], 1.0)
    matched_centers = (matched_boxes[:, :2] + matched_boxes[:, 2:]) * 0.5
    center_distance = np.linalg.norm(centers - matched_centers, axis=1) / heights
    output[:, 0] = matched_iou
    output[:, 1] = matched_scores
    output[:, 2] = np.clip(center_distance, 0.0, 20.0)
    output[:, 3] = np.clip(np.abs(np.log(matched_heights / heights)), 0.0, 5.0)
    output[:, 4] = matched_iou * np.sqrt(np.clip(matched_scores, 0.0, 1.0))
    return output


def temporal_frame_features(
    detections: DetectionSet,
    frame_indices: np.ndarray,
    *,
    frame: int,
    by_frame: dict[int, np.ndarray],
    sequence: SequenceInfo,
    neighbor_k: int = 12,
) -> np.ndarray:
    base = _frame_features(detections, frame_indices, sequence)
    boxes = detections.boxes[frame_indices].astype(np.float32)
    offset_features: list[np.ndarray] = []
    for offset in TEMPORAL_OFFSETS:
        neighbor_indices = by_frame.get(int(frame + offset))
        if neighbor_indices is None:
            offset_features.append(np.zeros((len(frame_indices), 5), dtype=np.float32))
            continue
        offset_features.append(
            _candidate_match_features(
                boxes,
                detections.boxes[neighbor_indices].astype(np.float32),
                detections.calibrated_scores[neighbor_indices].astype(np.float32),
                neighbor_k=int(neighbor_k),
            )
        )

    temporal = np.concatenate(offset_features, axis=1)
    ious = np.column_stack([features[:, 0] for features in offset_features])
    supports = np.column_stack([features[:, 4] for features in offset_features])
    adjacent = ious[:, 1:3]
    aggregate = np.column_stack(
        [
            np.min(adjacent, axis=1),
            np.mean(adjacent, axis=1),
            np.prod(adjacent, axis=1),
            np.mean(ious, axis=1),
            np.max(ious, axis=1),
            np.mean(ious >= 0.30, axis=1),
            np.mean(ious >= 0.50, axis=1),
            np.mean(supports, axis=1),
        ]
    ).astype(np.float32)
    return np.concatenate([base, temporal, aggregate], axis=1).astype(np.float32)


def _predict(
    model: TemporalNeuralConditioner,
    features: np.ndarray,
    *,
    mean: np.ndarray,
    scale: np.ndarray,
    device: str,
    batch_size: int,
) -> np.ndarray:
    output = np.empty((len(features),), dtype=np.float32)
    model.eval()
    with torch.inference_mode():
        for start in range(0, len(features), int(batch_size)):
            end = min(start + int(batch_size), len(features))
            normalized = (features[start:end] - mean) / scale
            tensor = torch.from_numpy(normalized.astype(np.float32, copy=False)).to(device)
            output[start:end] = torch.sigmoid(model(tensor)).cpu().numpy().astype(np.float32)
    return output


def _collect_sequence_samples(
    *,
    detection_path: Path,
    sequence: SequenceInfo,
    max_samples: int,
    negative_ratio: float,
    neighbor_k: int,
    rng: np.random.Generator,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, dict]:
    detections = load_detections(detection_path)
    valid_gt, ignore_gt = load_gt(sequence.gt_path)
    valid_by_frame = {int(frame): rows for frame, rows in valid_gt.groupby("frame")}
    ignore_by_frame = {int(frame): rows for frame, rows in ignore_gt.groupby("frame")}
    by_frame = {int(frame): indices for frame, indices in detections.by_frame().items()}
    empty_valid = valid_gt.iloc[0:0]
    empty_ignore = ignore_gt.iloc[0:0]
    xs: list[np.ndarray] = []
    ys: list[np.ndarray] = []
    ws: list[np.ndarray] = []
    matched_gt = 0
    ignored_count = 0

    for frame, indices in sorted(by_frame.items()):
        features = temporal_frame_features(
            detections,
            indices,
            frame=int(frame),
            by_frame=by_frame,
            sequence=sequence,
            neighbor_k=int(neighbor_k),
        )
        labels, ignored, matched = _labels_for_frame(
            detections=detections,
            indices=indices,
            gt_frame=valid_by_frame.get(frame, empty_valid),
            ignore_frame=ignore_by_frame.get(frame, empty_ignore),
            iou_threshold=0.5,
            ignore_iou_threshold=0.5,
        )
        positive = np.flatnonzero((labels == 1) & (~ignored))
        negative_all = np.flatnonzero((labels == 0) & (~ignored))
        negative = negative_all
        if len(positive) and len(negative):
            limit = max(int(math.ceil(len(positive) * float(negative_ratio))), 1)
            if len(negative) > limit:
                negative = rng.choice(negative, size=limit, replace=False)
        elif len(negative) > 8:
            negative = rng.choice(negative, size=8, replace=False)
        keep = np.concatenate([positive, negative]).astype(np.int64)
        if len(keep):
            xs.append(features[keep])
            ys.append(labels[keep].astype(np.float32))
            negative_weight = float(len(negative_all) / max(len(negative), 1)) if len(negative) else 1.0
            ws.append(np.where(labels[keep] == 1, 1.0, negative_weight).astype(np.float32))
        matched_gt += int(matched)
        ignored_count += int(np.sum(ignored))

    if not xs:
        raise RuntimeError(f"No temporal samples collected for {sequence.name}")
    x = np.concatenate(xs)
    y = np.concatenate(ys)
    w = np.concatenate(ws)
    if len(y) > int(max_samples):
        positive = np.flatnonzero(y == 1)
        negative = np.flatnonzero(y == 0)
        positive_budget = min(len(positive), max(1, int(max_samples * 0.45)))
        negative_budget = int(max_samples) - positive_budget
        chosen_positive = (
            rng.choice(positive, size=positive_budget, replace=False)
            if len(positive) > positive_budget
            else positive
        )
        chosen_negative = (
            rng.choice(negative, size=min(len(negative), negative_budget), replace=False)
            if len(negative)
            else np.zeros((0,), dtype=np.int64)
        )
        chosen = np.concatenate([chosen_positive, chosen_negative])
        rng.shuffle(chosen)
        x, y, w = x[chosen], y[chosen], w[chosen]
    stats = {
        "detections": int(len(detections)),
        "sampled": int(len(y)),
        "sampled_positive": int(np.sum(y == 1)),
        "sampled_negative": int(np.sum(y == 0)),
        "valid_gt": int(len(valid_gt)),
        "matched_gt_by_candidates": int(matched_gt),
        "candidate_recall_at_iou": float(matched_gt / max(len(valid_gt), 1)),
        "ignored_detections": int(ignored_count),
    }
    return x, y, w, stats


def train_temporal_neural_conditioner(
    *,
    detection_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    device: str = "auto",
    max_samples_per_sequence: int = 300_000,
    negative_ratio: float = 8.0,
    neighbor_k: int = 12,
    epochs: int = 8,
    batch_size: int = 4096,
    learning_rate: float = 6.0e-4,
    weight_decay: float = 1.0e-4,
    validation_fraction: float = 0.15,
    focal_gamma: float = 1.5,
    positive_weight: float = 1.0,
    sequence_balance: bool = False,
    domain_invariant: bool = False,
    seed: int = 20260728,
) -> dict:
    names = [str(name) for name in train_sequences]
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    rng = np.random.default_rng(int(seed))
    source = Path(detection_dir).expanduser().resolve()
    xs: list[np.ndarray] = []
    ys: list[np.ndarray] = []
    ws: list[np.ndarray] = []
    sequence_stats: dict[str, dict] = {}
    for name in names:
        x, y, w, stats = _collect_sequence_samples(
            detection_path=source / f"{name}.npz",
            sequence=sequence_by_name[name],
            max_samples=int(max_samples_per_sequence),
            negative_ratio=float(negative_ratio),
            neighbor_k=int(neighbor_k),
            rng=rng,
        )
        xs.append(x)
        ys.append(y)
        ws.append(w)
        sequence_stats[name] = stats
        print(f"{name}: temporal samples={len(y)} recall={stats['candidate_recall_at_iou']:.4f}")

    if sequence_balance:
        target_count = float(np.mean([len(y) for y in ys]))
        for index, (y, w) in enumerate(zip(ys, ws, strict=True)):
            normalized = w / max(float(w.mean()), 1.0e-6)
            ws[index] = normalized * (target_count / max(len(y), 1))

    features = np.concatenate(xs).astype(np.float32)
    selected_feature_indices = (
        DOMAIN_INVARIANT_FEATURE_INDICES
        if domain_invariant
        else list(range(len(ALL_FEATURE_NAMES)))
    )
    features = features[:, selected_feature_indices]
    labels = np.concatenate(ys).astype(np.float32)
    weights = np.concatenate(ws).astype(np.float32)
    weights[labels == 1] *= float(positive_weight)
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
    train_w = weights[train_indices]
    train_w /= max(float(train_w.mean()), 1.0e-6)

    resolved_device = _resolve_device(device)
    torch.manual_seed(int(seed))
    model = TemporalNeuralConditioner(features.shape[1]).to(resolved_device)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=float(learning_rate),
        weight_decay=float(weight_decay),
    )
    loader = DataLoader(
        TensorDataset(
            torch.from_numpy(train_x),
            torch.from_numpy(train_y),
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
        for batch_x, batch_y, batch_w in loader:
            batch_x = batch_x.to(resolved_device)
            batch_y = batch_y.to(resolved_device)
            batch_w = batch_w.to(resolved_device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(batch_x)
            probabilities = torch.sigmoid(logits)
            bce = nn.functional.binary_cross_entropy_with_logits(logits, batch_y, reduction="none")
            p_t = batch_y * probabilities + (1.0 - batch_y) * (1.0 - probabilities)
            loss = (bce * torch.pow(1.0 - p_t, float(focal_gamma)) * batch_w).mean()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            optimizer.step()
            total_loss += float(loss.detach().cpu()) * len(batch_x)
            count += len(batch_x)

        validation_probabilities = _predict(
            model,
            features[validation_indices],
            mean=mean,
            scale=scale,
            device=resolved_device,
            batch_size=int(batch_size),
        )
        validation_labels = labels[validation_indices]
        validation_weights = weights[validation_indices]
        validation_loss = -(
            validation_labels * np.log(np.maximum(validation_probabilities, 1.0e-7))
            + (1.0 - validation_labels)
            * np.log(np.maximum(1.0 - validation_probabilities, 1.0e-7))
        )
        validation_loss_value = float(np.average(validation_loss, weights=validation_weights))
        history.append(
            {
                "epoch": int(epoch),
                "train_loss": float(total_loss / max(count, 1)),
                "validation_loss": validation_loss_value,
            }
        )
        print(
            f"epoch {epoch}: train={history[-1]['train_loss']:.6f} "
            f"validation={validation_loss_value:.6f}"
        )
        if np.isfinite(validation_loss_value) and validation_loss_value <= best_loss:
            best_loss = validation_loss_value
            best_state = {
                key: value.detach().cpu().clone()
                for key, value in model.state_dict().items()
            }

    if best_state is None:
        raise RuntimeError("No finite temporal neural checkpoint was produced")
    metadata = {
        "kind": "temporal_neural_conditioner",
        "source_detections": str(source),
        "train_sequences": names,
        "device": resolved_device,
        "input_dim": int(features.shape[1]),
        "hidden_dim": 192,
        "feature_names": [ALL_FEATURE_NAMES[index] for index in selected_feature_indices],
        "selected_feature_indices": selected_feature_indices,
        "domain_invariant": bool(domain_invariant),
        "neighbor_k": int(neighbor_k),
        "epochs": int(epochs),
        "batch_size": int(batch_size),
        "learning_rate": float(learning_rate),
        "weight_decay": float(weight_decay),
        "validation_fraction": float(validation_fraction),
        "focal_gamma": float(focal_gamma),
        "positive_weight": float(positive_weight),
        "sequence_balance": bool(sequence_balance),
        "sequence_loss_weighting": (
            "equal_total_weight_per_sequence"
            if sequence_balance
            else "sample_proportional"
        ),
        "seed": int(seed),
        "history": history,
        "sequence_stats": sequence_stats,
        "training_samples": {
            "count": int(len(train_indices)),
            "positive": int(np.sum(labels[train_indices] == 1)),
            "negative": int(np.sum(labels[train_indices] == 0)),
            "validation": int(len(validation_indices)),
        },
        "between_vlm_detector_and_tracker": True,
        "uses_temporal_context": True,
        "boxes_unchanged": True,
        "tracker_unchanged": True,
        "no_detector_finetuning": True,
        "no_external_dataset": True,
        "no_oracle_ids": True,
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


def apply_temporal_neural_conditioner(
    *,
    model_path: str | Path,
    detection_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    device: str = "auto",
    threshold: float = 0.05,
    top_k: int | None = 700,
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
    if metadata.get("kind") != "temporal_neural_conditioner":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    model = TemporalNeuralConditioner(
        int(metadata["input_dim"]),
        int(metadata["hidden_dim"]),
    ).to(resolved_device)
    model.load_state_dict(payload["state_dict"])
    mean = np.asarray(payload["mean"], dtype=np.float32)
    scale = np.asarray(payload["scale"], dtype=np.float32)
    neighbor_k = int(metadata["neighbor_k"])
    source = Path(detection_dir).expanduser().resolve()
    target = Path(target_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    totals: dict[str, dict] = {}

    for name in [str(value) for value in sequence_names]:
        output_path = target / f"{name}.npz"
        if output_path.exists() and not overwrite:
            continue
        detections = load_detections(source / f"{name}.npz")
        by_frame = {int(frame): indices for frame, indices in detections.by_frame().items()}
        selected_indices: list[np.ndarray] = []
        selected_scores: list[np.ndarray] = []
        for frame, indices in sorted(by_frame.items()):
            features = temporal_frame_features(
                detections,
                indices,
                frame=int(frame),
                by_frame=by_frame,
                sequence=sequence_by_name[name],
                neighbor_k=neighbor_k,
            )
            selected_feature_indices = metadata.get("selected_feature_indices")
            if selected_feature_indices is not None:
                features = features[:, np.asarray(selected_feature_indices, dtype=np.int64)]
            scores = _predict(
                model,
                features,
                mean=mean,
                scale=scale,
                device=resolved_device,
                batch_size=int(batch_size),
            )
            keep = np.flatnonzero(scores >= float(threshold))
            if top_k is not None and len(keep) > int(top_k):
                keep = keep[np.argsort(-scores[keep])[: int(top_k)]]
            if len(keep):
                selected_indices.append(indices[keep].astype(np.int64))
                selected_scores.append(scores[keep].astype(np.float32))

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
        conditioned = DetectionSet(
            frames=detections.frames[selected],
            boxes=detections.boxes[selected],
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
            "kind": "temporal_neural_conditioned",
            "source": str(source),
            "model": str(Path(model_path).expanduser().resolve()),
            "model_metadata": metadata,
            "device": resolved_device,
            "threshold": float(threshold),
            "top_k": None if top_k is None else int(top_k),
            "counts": totals,
            "between_vlm_detector_and_tracker": True,
            "uses_temporal_context": True,
            "boxes_unchanged": True,
            "tracker_unchanged": True,
            "no_detector_finetuning": True,
            "no_external_dataset": True,
            "no_oracle_ids": True,
        },
    )
    return target
