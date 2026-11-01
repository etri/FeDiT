from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from scipy.optimize import linear_sum_assignment
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import SequenceInfo, gt_to_xyxy, load_gt
from neural_vlm_conditioner import _resolve_device
from nms import pairwise_iou_xyxy, standard_nms
from vlm_conditioner import FEATURE_NAMES, _frame_features


BASE_FEATURE_NAMES = (
    "raw_score",
    "calibrated_score",
    "score_log",
    "score_sqrt",
    "score_rank_norm",
    "score_percentile",
    "score_over_frame_max",
    "score_over_frame_median",
    "w_norm",
    "h_norm",
    "area_norm_log",
    "aspect_h_over_w",
    "border_min_norm",
    "prompt_id_norm",
)
ANCHOR_FEATURE_NAMES = (
    "anchor_max_iou",
    "anchor_count_iou010_log",
    "anchor_count_iou030_log",
    "anchor_count_iou050_log",
    "anchor_count_iou070_log",
    "anchor_max_overlap_score",
    "anchor_best_score_iou",
    "anchor_score_margin",
    "anchor_width_log_ratio",
    "anchor_height_log_ratio",
)
RESCUE_FEATURE_NAMES = (*BASE_FEATURE_NAMES, *ANCHOR_FEATURE_NAMES)


class NeuralRescueConditioner(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 128) -> None:
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.15),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.10),
            nn.Linear(hidden_dim, 64),
            nn.GELU(),
            nn.Linear(64, 1),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return self.network(features).squeeze(1)


def _top_candidates(
    detections: DetectionSet,
    indices: np.ndarray,
    top_k: int,
) -> np.ndarray:
    if len(indices) <= int(top_k):
        return indices.astype(np.int64)
    scores = detections.calibrated_scores[indices]
    return indices[np.argsort(-scores)[: int(top_k)]].astype(np.int64)


def _rescue_features(
    expanded: DetectionSet,
    expanded_indices: np.ndarray,
    anchor: DetectionSet,
    anchor_indices: np.ndarray,
    sequence: SequenceInfo,
) -> np.ndarray:
    base = _frame_features(expanded, expanded_indices, sequence)
    base = base[
        :,
        [FEATURE_NAMES.index(name) for name in BASE_FEATURE_NAMES],
    ].astype(np.float32)
    if not len(anchor_indices):
        relation = np.zeros(
            (len(expanded_indices), len(ANCHOR_FEATURE_NAMES)),
            dtype=np.float32,
        )
        relation[:, 7] = expanded.calibrated_scores[expanded_indices]
        return np.concatenate([base, relation], axis=1).astype(np.float32)

    expanded_boxes = expanded.boxes[expanded_indices].astype(np.float32)
    anchor_boxes = anchor.boxes[anchor_indices].astype(np.float32)
    anchor_scores = anchor.calibrated_scores[anchor_indices].astype(np.float32)
    iou = pairwise_iou_xyxy(expanded_boxes, anchor_boxes).astype(np.float32)
    best_anchor = np.argmax(iou, axis=1)
    max_iou = iou[np.arange(len(iou)), best_anchor]
    overlap_mask = iou >= 0.10
    max_overlap_score = np.max(
        np.where(overlap_mask, anchor_scores[None, :], 0.0),
        axis=1,
    )
    best_score_iou = np.max(iou * anchor_scores[None, :], axis=1)
    normalizer = max(float(np.log1p(len(anchor_indices))), 1.0)

    expanded_widths = np.maximum(
        expanded_boxes[:, 2] - expanded_boxes[:, 0],
        1.0,
    )
    expanded_heights = np.maximum(
        expanded_boxes[:, 3] - expanded_boxes[:, 1],
        1.0,
    )
    matched_anchor_boxes = anchor_boxes[best_anchor]
    anchor_widths = np.maximum(
        matched_anchor_boxes[:, 2] - matched_anchor_boxes[:, 0],
        1.0,
    )
    anchor_heights = np.maximum(
        matched_anchor_boxes[:, 3] - matched_anchor_boxes[:, 1],
        1.0,
    )
    relation = np.column_stack(
        [
            max_iou,
            np.log1p(np.sum(iou >= 0.10, axis=1)) / normalizer,
            np.log1p(np.sum(iou >= 0.30, axis=1)) / normalizer,
            np.log1p(np.sum(iou >= 0.50, axis=1)) / normalizer,
            np.log1p(np.sum(iou >= 0.70, axis=1)) / normalizer,
            max_overlap_score,
            best_score_iou,
            expanded.calibrated_scores[expanded_indices] - max_overlap_score,
            np.log(expanded_widths / anchor_widths),
            np.log(expanded_heights / anchor_heights),
        ]
    ).astype(np.float32)
    return np.concatenate([base, relation], axis=1).astype(np.float32)


def _labels_for_frame(
    *,
    expanded: DetectionSet,
    expanded_indices: np.ndarray,
    anchor: DetectionSet,
    anchor_indices: np.ndarray,
    gt_frame,
    ignore_frame,
    iou_threshold: float,
) -> tuple[np.ndarray, np.ndarray, int, int]:
    labels = np.zeros((len(expanded_indices),), dtype=np.float32)
    ignored = np.zeros((len(expanded_indices),), dtype=bool)
    gt_boxes = gt_to_xyxy(gt_frame).astype(np.float32)
    expanded_boxes = expanded.boxes[expanded_indices].astype(np.float32)
    anchor_boxes = anchor.boxes[anchor_indices].astype(np.float32)

    anchor_covered = np.zeros((len(gt_boxes),), dtype=bool)
    if len(gt_boxes) and len(anchor_boxes):
        anchor_iou = pairwise_iou_xyxy(gt_boxes, anchor_boxes)
        anchor_covered = np.max(anchor_iou, axis=1) >= float(iou_threshold)

    uncovered_indices = np.flatnonzero(~anchor_covered)
    rescued = 0
    if len(uncovered_indices) and len(expanded_boxes):
        uncovered_boxes = gt_boxes[uncovered_indices]
        rescue_iou = pairwise_iou_xyxy(uncovered_boxes, expanded_boxes)
        rows, cols = linear_sum_assignment(1.0 - rescue_iou)
        valid = rescue_iou[rows, cols] >= float(iou_threshold)
        labels[cols[valid]] = 1.0
        rescued = int(np.sum(valid))

    ignore_boxes = gt_to_xyxy(ignore_frame).astype(np.float32)
    if len(ignore_boxes) and len(expanded_boxes):
        ignore_iou = pairwise_iou_xyxy(expanded_boxes, ignore_boxes)
        ignored = np.max(ignore_iou, axis=1) >= 0.5
        ignored &= labels < 0.5
    return labels, ignored, int(np.sum(anchor_covered)), rescued


def _sample_negatives(
    indices: np.ndarray,
    scores: np.ndarray,
    budget: int,
    rng: np.random.Generator,
) -> np.ndarray:
    if len(indices) <= int(budget):
        return indices
    hard_budget = min(len(indices), max(1, int(budget) // 2))
    hard_order = np.argsort(-scores[indices])[:hard_budget]
    hard = indices[hard_order]
    remaining = np.setdiff1d(indices, hard, assume_unique=False)
    random_budget = max(int(budget) - len(hard), 0)
    random_part = (
        rng.choice(remaining, size=random_budget, replace=False)
        if random_budget and len(remaining) > random_budget
        else remaining[:random_budget]
    )
    return np.concatenate([hard, random_part]).astype(np.int64)


def _collect_sequence(
    *,
    anchor_path: Path,
    expanded_path: Path,
    sequence: SequenceInfo,
    top_k: int,
    negative_ratio: float,
    max_samples: int,
    iou_threshold: float,
    rng: np.random.Generator,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, dict]:
    anchor = load_detections(anchor_path)
    expanded = load_detections(expanded_path)
    valid_gt, ignore_gt = load_gt(sequence.gt_path)
    valid_by_frame = {int(frame): rows for frame, rows in valid_gt.groupby("frame")}
    ignore_by_frame = {int(frame): rows for frame, rows in ignore_gt.groupby("frame")}
    empty_valid = valid_gt.iloc[0:0]
    empty_ignore = ignore_gt.iloc[0:0]
    anchor_by_frame = anchor.by_frame()

    xs: list[np.ndarray] = []
    ys: list[np.ndarray] = []
    ws: list[np.ndarray] = []
    anchor_covered_total = rescued_total = candidates_total = 0
    for frame, frame_indices in sorted(expanded.by_frame().items()):
        expanded_indices = _top_candidates(
            expanded,
            frame_indices,
            int(top_k),
        )
        anchor_indices = anchor_by_frame.get(
            int(frame),
            np.zeros((0,), dtype=np.int64),
        )
        labels, ignored, anchor_covered, rescued = _labels_for_frame(
            expanded=expanded,
            expanded_indices=expanded_indices,
            anchor=anchor,
            anchor_indices=anchor_indices,
            gt_frame=valid_by_frame.get(int(frame), empty_valid),
            ignore_frame=ignore_by_frame.get(int(frame), empty_ignore),
            iou_threshold=float(iou_threshold),
        )
        positive = np.flatnonzero((labels >= 0.5) & (~ignored))
        negative = np.flatnonzero((labels < 0.5) & (~ignored))
        negative_budget = max(
            int(round(len(positive) * float(negative_ratio))),
            12,
        )
        selected_negative = _sample_negatives(
            negative,
            expanded.calibrated_scores[expanded_indices],
            negative_budget,
            rng,
        )
        selected = np.concatenate([positive, selected_negative]).astype(np.int64)
        if not len(selected):
            continue
        features = _rescue_features(
            expanded,
            expanded_indices,
            anchor,
            anchor_indices,
            sequence,
        )
        negative_weight = (
            float(len(negative) / max(len(selected_negative), 1))
            if len(selected_negative)
            else 1.0
        )
        sample_weight = np.where(
            labels[selected] >= 0.5,
            1.0,
            negative_weight,
        ).astype(np.float32)
        xs.append(features[selected])
        ys.append(labels[selected])
        ws.append(sample_weight)
        anchor_covered_total += int(anchor_covered)
        rescued_total += int(rescued)
        candidates_total += int(len(expanded_indices))

    features = np.concatenate(xs).astype(np.float32)
    labels = np.concatenate(ys).astype(np.float32)
    weights = np.concatenate(ws).astype(np.float32)
    if len(labels) > int(max_samples):
        positive = np.flatnonzero(labels >= 0.5)
        negative = np.flatnonzero(labels < 0.5)
        negative_budget = max(int(max_samples) - len(positive), 0)
        selected_negative = (
            rng.choice(negative, size=negative_budget, replace=False)
            if len(negative) > negative_budget
            else negative
        )
        selected = np.concatenate([positive, selected_negative]).astype(np.int64)
        rng.shuffle(selected)
        features = features[selected]
        labels = labels[selected]
        weights = weights[selected]
    stats = {
        "anchor_detections": int(len(anchor)),
        "expanded_detections": int(len(expanded)),
        "top_k_candidates": int(candidates_total),
        "valid_gt": int(len(valid_gt)),
        "anchor_covered_gt": int(anchor_covered_total),
        "rescuable_gt": int(rescued_total),
        "samples": int(len(labels)),
        "positive_samples": int(np.sum(labels >= 0.5)),
        "negative_samples": int(np.sum(labels < 0.5)),
    }
    return features, labels, weights, stats


def _predict(
    model: NeuralRescueConditioner,
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
            tensor = torch.from_numpy(
                normalized.astype(np.float32, copy=False)
            ).to(device)
            output[start:end] = torch.sigmoid(model(tensor)).cpu().numpy()
    return output


def _select_threshold(
    labels: np.ndarray,
    probabilities: np.ndarray,
    weights: np.ndarray,
    min_precision: float,
) -> tuple[float, dict]:
    thresholds = np.unique(
        np.concatenate(
            [
                np.quantile(probabilities, np.linspace(0.01, 0.999, 250)),
                np.asarray([0.5, 0.7, 0.8, 0.9, 0.95, 0.98, 0.99]),
            ]
        )
    )
    positive = labels >= 0.5
    positive_total = float(np.sum(weights[positive]))
    best: tuple | None = None
    best_stats: dict = {}
    best_threshold = 0.9
    for threshold in thresholds:
        keep = probabilities >= float(threshold)
        tp = float(np.sum(weights[keep & positive]))
        fp = float(np.sum(weights[keep & ~positive]))
        fn = max(positive_total - tp, 0.0)
        precision = tp / max(tp + fp, 1.0e-9)
        recall = tp / max(positive_total, 1.0e-9)
        feasible = precision >= float(min_precision)
        candidate = (int(feasible), recall if feasible else precision, precision, -fp)
        if best is None or candidate > best:
            best = candidate
            best_threshold = float(threshold)
            best_stats = {
                "weighted_tp": tp,
                "weighted_fp": fp,
                "weighted_fn": fn,
                "weighted_precision": precision,
                "weighted_recall": recall,
                "selected_threshold": best_threshold,
                "minimum_precision": float(min_precision),
                "precision_constraint_met": bool(feasible),
            }
    return best_threshold, best_stats


def train_neural_rescue_conditioner(
    *,
    anchor_dir: str | Path,
    expanded_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    device: str,
    top_k: int = 800,
    negative_ratio: float = 30.0,
    max_samples_per_sequence: int = 300_000,
    iou_threshold: float = 0.5,
    min_precision: float = 0.85,
    epochs: int = 16,
    batch_size: int = 8192,
    learning_rate: float = 6.0e-4,
    weight_decay: float = 1.0e-3,
    validation_fraction: float = 0.15,
    focal_gamma: float = 1.5,
    seed: int = 20260730,
) -> dict:
    anchor_root = Path(anchor_dir).expanduser().resolve()
    expanded_root = Path(expanded_dir).expanduser().resolve()
    names = [str(value) for value in train_sequences]
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    rng = np.random.default_rng(int(seed))
    xs: list[np.ndarray] = []
    ys: list[np.ndarray] = []
    ws: list[np.ndarray] = []
    sequence_stats: dict[str, dict] = {}
    for name in names:
        x, y, w, stats = _collect_sequence(
            anchor_path=anchor_root / f"{name}.npz",
            expanded_path=expanded_root / f"{name}.npz",
            sequence=sequence_by_name[name],
            top_k=int(top_k),
            negative_ratio=float(negative_ratio),
            max_samples=int(max_samples_per_sequence),
            iou_threshold=float(iou_threshold),
            rng=rng,
        )
        xs.append(x)
        ys.append(y)
        ws.append(w)
        sequence_stats[name] = stats
        print(
            f"{name}: samples={len(y)} positives={int(np.sum(y >= 0.5))} "
            f"rescuable_gt={stats['rescuable_gt']}",
            flush=True,
        )

    features = np.concatenate(xs).astype(np.float32)
    labels = np.concatenate(ys).astype(np.float32)
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
    train_w = weights[train_indices].copy()
    train_w /= max(float(np.mean(train_w)), 1.0e-6)

    resolved_device = _resolve_device(device)
    torch.manual_seed(int(seed))
    model = NeuralRescueConditioner(len(RESCUE_FEATURE_NAMES)).to(resolved_device)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=float(learning_rate),
        weight_decay=float(weight_decay),
    )
    loader = DataLoader(
        TensorDataset(
            torch.from_numpy(train_x),
            torch.from_numpy(labels[train_indices]),
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
            bce = nn.functional.binary_cross_entropy_with_logits(
                logits,
                batch_y,
                reduction="none",
            )
            p_t = batch_y * probabilities + (1.0 - batch_y) * (1.0 - probabilities)
            loss = (
                bce
                * torch.pow(1.0 - p_t, float(focal_gamma))
                * batch_w
            ).mean()
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
        validation_loss = -(
            validation_labels * np.log(np.maximum(validation_probabilities, 1.0e-7))
            + (1.0 - validation_labels)
            * np.log(np.maximum(1.0 - validation_probabilities, 1.0e-7))
        )
        validation_loss_value = float(
            np.average(validation_loss, weights=weights[validation_indices])
        )
        history.append(
            {
                "epoch": int(epoch),
                "train_loss": float(total_loss / max(count, 1)),
                "validation_loss": validation_loss_value,
            }
        )
        print(
            f"epoch {epoch}: train={history[-1]['train_loss']:.6f} "
            f"validation={validation_loss_value:.6f}",
            flush=True,
        )
        if np.isfinite(validation_loss_value) and validation_loss_value <= best_loss:
            best_loss = validation_loss_value
            best_state = {
                key: value.detach().cpu().clone()
                for key, value in model.state_dict().items()
            }
    if best_state is None:
        raise RuntimeError("No finite rescue conditioner checkpoint was produced")
    model.load_state_dict(best_state)
    validation_probabilities = _predict(
        model,
        features[validation_indices],
        mean=mean,
        scale=scale,
        device=resolved_device,
        batch_size=int(batch_size),
    )
    threshold, threshold_stats = _select_threshold(
        labels[validation_indices],
        validation_probabilities,
        weights[validation_indices],
        float(min_precision),
    )
    metadata = {
        "kind": "neural_rescue_conditioner",
        "anchor_detections": str(anchor_root),
        "expanded_detections": str(expanded_root),
        "train_sequences": names,
        "device": resolved_device,
        "feature_names": list(RESCUE_FEATURE_NAMES),
        "input_dim": int(len(RESCUE_FEATURE_NAMES)),
        "hidden_dim": 128,
        "top_k": int(top_k),
        "negative_ratio": float(negative_ratio),
        "max_samples_per_sequence": int(max_samples_per_sequence),
        "iou_threshold": float(iou_threshold),
        "min_precision": float(min_precision),
        "threshold": float(threshold),
        "threshold_stats": threshold_stats,
        "sequence_stats": sequence_stats,
        "training_samples": {
            "count": int(len(train_indices)),
            "validation": int(len(validation_indices)),
            "positive": int(np.sum(labels[train_indices] >= 0.5)),
            "negative": int(np.sum(labels[train_indices] < 0.5)),
        },
        "epochs": int(epochs),
        "batch_size": int(batch_size),
        "learning_rate": float(learning_rate),
        "weight_decay": float(weight_decay),
        "validation_fraction": float(validation_fraction),
        "focal_gamma": float(focal_gamma),
        "seed": int(seed),
        "history": history,
        "between_vlm_detector_and_tracker": True,
        "rescue_only": True,
        "no_heldout_gt": True,
        "no_yolo_inference": True,
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


def apply_neural_rescue_conditioner(
    *,
    model_path: str | Path,
    anchor_dir: str | Path,
    expanded_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    device: str,
    threshold: float | None = None,
    nms_iou: float = 0.5,
    top_rescues_per_frame: int = 50,
    score_base: float = 0.5,
    score_scale: float = 0.5,
    batch_size: int = 65536,
    overwrite: bool = False,
) -> Path:
    resolved_device = _resolve_device(device)
    payload = torch.load(
        Path(model_path).expanduser().resolve(),
        map_location="cpu",
        weights_only=False,
    )
    metadata = dict(payload["metadata"])
    if metadata.get("kind") != "neural_rescue_conditioner":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    model = NeuralRescueConditioner(
        int(metadata["input_dim"]),
        int(metadata["hidden_dim"]),
    ).to(resolved_device)
    model.load_state_dict(payload["state_dict"])
    mean = np.asarray(payload["mean"], dtype=np.float32)
    scale = np.asarray(payload["scale"], dtype=np.float32)
    threshold_value = float(
        metadata["threshold"] if threshold is None else threshold
    )
    anchor_root = Path(anchor_dir).expanduser().resolve()
    expanded_root = Path(expanded_dir).expanduser().resolve()
    target = Path(target_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    totals: dict[str, dict] = {}

    for name in [str(value) for value in sequence_names]:
        output_path = target / f"{name}.npz"
        if output_path.exists() and not overwrite:
            continue
        anchor = load_detections(anchor_root / f"{name}.npz")
        expanded = load_detections(expanded_root / f"{name}.npz")
        anchor_by_frame = anchor.by_frame()
        selected_indices: list[np.ndarray] = []
        selected_scores: list[np.ndarray] = []
        scored = 0
        for frame, frame_indices in sorted(expanded.by_frame().items()):
            expanded_indices = _top_candidates(
                expanded,
                frame_indices,
                int(metadata["top_k"]),
            )
            anchor_indices = anchor_by_frame.get(
                int(frame),
                np.zeros((0,), dtype=np.int64),
            )
            features = _rescue_features(
                expanded,
                expanded_indices,
                anchor,
                anchor_indices,
                sequence_by_name[name],
            )
            probabilities = _predict(
                model,
                features,
                mean=mean,
                scale=scale,
                device=resolved_device,
                batch_size=int(batch_size),
            )
            scored += int(len(probabilities))
            keep = np.flatnonzero(probabilities >= threshold_value)
            if not len(keep):
                continue
            frame_keep = expanded_indices[keep]
            frame_scores = probabilities[keep]
            local_keep = standard_nms(
                expanded.boxes[frame_keep],
                frame_scores,
                float(nms_iou),
            )
            frame_keep = frame_keep[local_keep]
            frame_scores = frame_scores[local_keep]
            if len(frame_keep) > int(top_rescues_per_frame):
                order = np.argsort(-frame_scores)[: int(top_rescues_per_frame)]
                frame_keep = frame_keep[order]
                frame_scores = frame_scores[order]
            selected_indices.append(frame_keep.astype(np.int64))
            selected_scores.append(frame_scores.astype(np.float32))

        keep_indices = (
            np.concatenate(selected_indices)
            if selected_indices
            else np.zeros((0,), dtype=np.int64)
        )
        probabilities = (
            np.concatenate(selected_scores)
            if selected_scores
            else np.zeros((0,), dtype=np.float32)
        )
        mapped_scores = np.clip(
            float(score_base) + float(score_scale) * probabilities,
            0.0,
            1.0,
        ).astype(np.float32)
        output = DetectionSet(
            frames=expanded.frames[keep_indices],
            boxes=expanded.boxes[keep_indices],
            raw_scores=expanded.raw_scores[keep_indices],
            calibrated_scores=mapped_scores,
            prompt_ids=expanded.prompt_ids[keep_indices],
            tile_ids=expanded.tile_ids[keep_indices],
            image_widths=expanded.image_widths[keep_indices],
            image_heights=expanded.image_heights[keep_indices],
            prompt_texts=expanded.prompt_texts[keep_indices],
        )
        save_detections(output_path, output)
        totals[name] = {
            "anchor_detections": int(len(anchor)),
            "expanded_detections": int(len(expanded)),
            "scored_candidates": int(scored),
            "selected_rescues": int(len(output)),
        }
        print(
            f"{name}: scored={scored} selected_rescues={len(output)}",
            flush=True,
        )

    write_run_metadata(
        target,
        {
            "kind": "neural_rescue_conditioned",
            "model": str(Path(model_path).expanduser().resolve()),
            "model_metadata": metadata,
            "anchor_detections": str(anchor_root),
            "expanded_detections": str(expanded_root),
            "threshold": threshold_value,
            "nms_iou": float(nms_iou),
            "top_rescues_per_frame": int(top_rescues_per_frame),
            "score_base": float(score_base),
            "score_scale": float(score_scale),
            "device": resolved_device,
            "counts": totals,
            "between_vlm_detector_and_tracker": True,
            "rescue_only": True,
            "no_heldout_gt": True,
            "no_yolo_inference": True,
        },
    )
    return target
