from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from sklearn.metrics import average_precision_score
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import SequenceInfo, load_gt
from neural_vlm_conditioner import _resolve_device
from osnet_quality_conditioner import OSNET_DIM, _load_embeddings
from temporal_box_conditioner import _frame_targets
from temporal_neural_conditioner import (
    ALL_FEATURE_NAMES,
    DOMAIN_INVARIANT_FEATURE_INDICES,
    temporal_frame_features,
)


class TemporalOSNetConditioner(nn.Module):
    def __init__(
        self,
        geometry_dim: int,
        appearance_dim: int = OSNET_DIM,
        hidden_dim: int = 384,
    ) -> None:
        super().__init__()
        branch_dim = hidden_dim // 2
        self.geometry = nn.Sequential(
            nn.Linear(geometry_dim, branch_dim),
            nn.LayerNorm(branch_dim),
            nn.GELU(),
            nn.Dropout(0.05),
        )
        self.appearance = nn.Sequential(
            nn.Linear(appearance_dim, branch_dim),
            nn.LayerNorm(branch_dim),
            nn.GELU(),
            nn.Dropout(0.10),
        )
        self.fusion = nn.Sequential(
            nn.Linear(branch_dim * 2, hidden_dim),
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
            nn.Linear(hidden_dim, 128),
            nn.GELU(),
            nn.Dropout(0.05),
            nn.Linear(128, 5),
        )

    def forward(
        self,
        geometry: torch.Tensor,
        appearance: torch.Tensor,
    ) -> tuple[torch.Tensor, torch.Tensor]:
        hidden = self.fusion(
            torch.cat([self.geometry(geometry), self.appearance(appearance)], dim=1)
        )
        output = self.output(hidden + self.block(hidden))
        return output[:, 0], 0.35 * torch.tanh(output[:, 1:])


def _collect_sequence(
    *,
    detection_path: Path,
    embedding_dir: Path,
    sequence: SequenceInfo,
    max_samples: int,
    negative_ratio: float,
    negative_expansion_power: float,
    neighbor_k: int,
    match_iou: float,
    rng: np.random.Generator,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, dict]:
    detections = load_detections(detection_path)
    embeddings = _load_embeddings(embedding_dir, sequence.name, len(detections))
    valid_gt, ignore_gt = load_gt(sequence.gt_path)
    valid_by_frame = {int(frame): rows for frame, rows in valid_gt.groupby("frame")}
    ignore_by_frame = {int(frame): rows for frame, rows in ignore_gt.groupby("frame")}
    empty_valid = valid_gt.iloc[0:0]
    empty_ignore = ignore_gt.iloc[0:0]
    by_frame = {int(frame): indices for frame, indices in detections.by_frame().items()}
    xs: list[np.ndarray] = []
    ys: list[np.ndarray] = []
    ds: list[np.ndarray] = []
    ws: list[np.ndarray] = []
    matched_gt = 0

    for frame, indices in sorted(by_frame.items()):
        temporal = temporal_frame_features(
            detections,
            indices,
            frame=int(frame),
            by_frame=by_frame,
            sequence=sequence,
            neighbor_k=int(neighbor_k),
        )[:, DOMAIN_INVARIANT_FEATURE_INDICES]
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
        negative = negative_all
        if len(positive) and len(negative):
            limit = max(int(math.ceil(len(positive) * float(negative_ratio))), 1)
            if len(negative) > limit:
                negative = rng.choice(negative, size=limit, replace=False)
        elif len(negative) > 8:
            negative = rng.choice(negative, size=8, replace=False)
        keep = np.concatenate([positive, negative]).astype(np.int64)
        if len(keep):
            appearance = np.asarray(embeddings[indices[keep]], dtype=np.float32)
            xs.append(
                np.concatenate([temporal[keep], appearance], axis=1).astype(np.float32)
            )
            ys.append(labels[keep])
            ds.append(deltas[keep])
            expansion = (
                float(len(negative_all) / max(len(negative), 1))
                if len(negative)
                else 1.0
            )
            negative_weight = expansion ** float(negative_expansion_power)
            ws.append(
                np.where(labels[keep] == 1, 1.0, negative_weight).astype(np.float32)
            )
        matched_gt += int(matched)

    if not xs:
        raise RuntimeError(f"No temporal OSNet samples collected for {sequence.name}")
    x = np.concatenate(xs).astype(np.float32)
    y = np.concatenate(ys).astype(np.float32)
    d = np.concatenate(ds).astype(np.float32)
    w = np.concatenate(ws).astype(np.float32)
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
        chosen_negative = (
            rng.choice(
                negative,
                size=min(len(negative), negative_budget),
                replace=False,
            )
            if len(negative)
            else np.zeros((0,), dtype=np.int64)
        )
        chosen = np.concatenate([chosen_positive, chosen_negative])
        rng.shuffle(chosen)
        x, y, d, w = x[chosen], y[chosen], d[chosen], w[chosen]
    return x, y, d, w, {
        "detections": int(len(detections)),
        "samples": int(len(y)),
        "positive": int(np.sum(y == 1)),
        "negative": int(np.sum(y == 0)),
        "valid_gt": int(len(valid_gt)),
        "matched_gt_at_iou": int(matched_gt),
        "candidate_recall_at_iou": float(matched_gt / max(len(valid_gt), 1)),
    }


def _predict(
    model: TemporalOSNetConditioner,
    features: np.ndarray,
    *,
    geometry_dim: int,
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
            logits, batch_deltas = model(
                tensor[:, :geometry_dim],
                tensor[:, geometry_dim:],
            )
            scores[start:end] = torch.sigmoid(logits).cpu().numpy().astype(np.float32)
            deltas[start:end] = batch_deltas.cpu().numpy().astype(np.float32)
    return scores, deltas


def train_temporal_osnet_conditioner(
    *,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    device: str = "auto",
    max_samples_per_sequence: int = 300_000,
    negative_ratio: float = 6.0,
    negative_expansion_power: float = 0.5,
    neighbor_k: int = 16,
    match_iou: float = 0.30,
    epochs: int = 10,
    batch_size: int = 4096,
    learning_rate: float = 6.0e-4,
    weight_decay: float = 1.0e-4,
    validation_fraction: float = 0.15,
    focal_gamma: float = 1.5,
    regression_weight: float = 2.0,
    hidden_dim: int = 384,
    seed: int = 20260730,
) -> dict:
    names = [str(name) for name in train_sequences]
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    source = Path(detection_dir).expanduser().resolve()
    embedding_root = Path(embedding_dir).expanduser().resolve()
    rng = np.random.default_rng(int(seed))
    xs: list[np.ndarray] = []
    ys: list[np.ndarray] = []
    ds: list[np.ndarray] = []
    ws: list[np.ndarray] = []
    sequence_stats: dict[str, dict] = {}
    for name in names:
        x, y, d, w, stats = _collect_sequence(
            detection_path=source / f"{name}.npz",
            embedding_dir=embedding_root,
            sequence=sequence_by_name[name],
            max_samples=int(max_samples_per_sequence),
            negative_ratio=float(negative_ratio),
            negative_expansion_power=float(negative_expansion_power),
            neighbor_k=int(neighbor_k),
            match_iou=float(match_iou),
            rng=rng,
        )
        target_count = float(max_samples_per_sequence)
        w = w / max(float(w.mean()), 1.0e-6)
        w *= target_count / max(len(y), 1)
        xs.append(x)
        ys.append(y)
        ds.append(d)
        ws.append(w)
        sequence_stats[name] = stats
        print(
            f"{name}: samples={len(y)} positive={int(np.sum(y == 1))} "
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
    geometry_dim = len(DOMAIN_INVARIANT_FEATURE_INDICES)
    model = TemporalOSNetConditioner(
        geometry_dim=geometry_dim,
        appearance_dim=OSNET_DIM,
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
            logits, predicted_deltas = model(
                batch_x[:, :geometry_dim],
                batch_x[:, geometry_dim:],
            )
            probabilities = torch.sigmoid(logits)
            bce = nn.functional.binary_cross_entropy_with_logits(
                logits,
                batch_y,
                reduction="none",
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
            geometry_dim=geometry_dim,
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
                validation_deltas[positive]
                - delta_targets[validation_indices][positive]
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
        validation_ap = float(
            average_precision_score(validation_labels, validation_scores)
        )
        history.append(
            {
                "epoch": int(epoch),
                "train_loss": float(total_loss / max(count, 1)),
                "validation_loss": validation_loss,
                "validation_average_precision": validation_ap,
            }
        )
        print(
            f"epoch {epoch}: train={history[-1]['train_loss']:.6f} "
            f"validation={validation_loss:.6f} AP={validation_ap:.6f}"
        )
        if np.isfinite(validation_loss) and validation_loss <= best_loss:
            best_loss = validation_loss
            best_state = {
                key: value.detach().cpu().clone()
                for key, value in model.state_dict().items()
            }

    if best_state is None:
        raise RuntimeError("No finite temporal OSNet checkpoint was produced")
    metadata = {
        "kind": "temporal_osnet_conditioner",
        "source_detections": str(source),
        "embedding_dir": str(embedding_root),
        "train_sequences": names,
        "device": resolved_device,
        "input_dim": int(features.shape[1]),
        "geometry_dim": int(geometry_dim),
        "appearance_dim": OSNET_DIM,
        "hidden_dim": int(hidden_dim),
        "feature_names": [
            ALL_FEATURE_NAMES[index] for index in DOMAIN_INVARIANT_FEATURE_INDICES
        ]
        + [f"osnet_{index:03d}" for index in range(OSNET_DIM)],
        "selected_feature_indices": DOMAIN_INVARIANT_FEATURE_INDICES,
        "neighbor_k": int(neighbor_k),
        "match_iou": float(match_iou),
        "negative_ratio": float(negative_ratio),
        "negative_expansion_power": float(negative_expansion_power),
        "epochs": int(epochs),
        "batch_size": int(batch_size),
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
        "uses_frozen_osnet_appearance": True,
        "predicts_objectness": True,
        "predicts_box_deltas": True,
        "boxes_start_from_groundingdino": True,
        "tracker_unchanged": True,
        "no_detector_finetuning": True,
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


def apply_temporal_osnet_conditioner(
    *,
    model_path: str | Path,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    device: str = "auto",
    threshold: float = 0.01,
    top_k: int | None = 600,
    blend_input: float = 0.0,
    box_delta_scale: float = 1.0,
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
    if metadata.get("kind") != "temporal_osnet_conditioner":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    geometry_dim = int(metadata["geometry_dim"])
    model = TemporalOSNetConditioner(
        geometry_dim=geometry_dim,
        appearance_dim=int(metadata["appearance_dim"]),
        hidden_dim=int(metadata["hidden_dim"]),
    ).to(resolved_device)
    model.load_state_dict(payload["state_dict"])
    mean = np.asarray(payload["mean"], dtype=np.float32)
    scale = np.asarray(payload["scale"], dtype=np.float32)
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
        by_frame = {
            int(frame): indices for frame, indices in detections.by_frame().items()
        }
        selected_indices: list[np.ndarray] = []
        selected_scores: list[np.ndarray] = []
        selected_boxes: list[np.ndarray] = []
        for frame, indices in sorted(by_frame.items()):
            temporal = temporal_frame_features(
                detections,
                indices,
                frame=int(frame),
                by_frame=by_frame,
                sequence=sequence,
                neighbor_k=int(metadata["neighbor_k"]),
            )[:, np.asarray(metadata["selected_feature_indices"], dtype=np.int64)]
            appearance = np.asarray(embeddings[indices], dtype=np.float32)
            features = np.concatenate([temporal, appearance], axis=1)
            scores, deltas = _predict(
                model,
                features,
                geometry_dim=geometry_dim,
                mean=mean,
                scale=scale,
                device=resolved_device,
                batch_size=int(batch_size),
            )
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
            factors = np.column_stack([widths, heights, widths, heights]).astype(
                np.float32
            )
            boxes += float(box_delta_scale) * deltas[keep] * factors
            boxes[:, [0, 2]] = np.clip(
                boxes[:, [0, 2]], 0, float(sequence.width)
            )
            boxes[:, [1, 3]] = np.clip(
                boxes[:, [1, 3]], 0, float(sequence.height)
            )
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
            "kind": "temporal_osnet_conditioned",
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
            "between_detector_and_tracker": True,
            "boxes_start_from_groundingdino": True,
            "no_detector_finetuning": True,
            "no_yolo_inference": True,
            "no_oracle_ids": True,
        },
    )
    return target
