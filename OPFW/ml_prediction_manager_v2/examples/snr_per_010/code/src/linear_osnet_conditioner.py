from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from sklearn.metrics import average_precision_score
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import SequenceInfo
from neural_vlm_conditioner import _resolve_device
from osnet_quality_conditioner import (
    OSNET_DIM,
    _geometry_names,
    _load_embeddings,
    _quality_geometry_features,
    _sample_sequence,
)


class LinearOSNetConditioner(nn.Module):
    def __init__(self, input_dim: int) -> None:
        super().__init__()
        self.output = nn.Linear(input_dim, 1)

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return self.output(features).squeeze(1)


def _predict(
    model: LinearOSNetConditioner,
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
            normalized = (
                (features[start:end] - mean) / scale
            ).astype(np.float32)
            tensor = torch.from_numpy(normalized).to(device)
            output[start:end] = (
                torch.sigmoid(model(tensor)).cpu().numpy().astype(np.float32)
            )
    return output


def train_linear_osnet_conditioner(
    *,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    device: str = "mps",
    max_samples_per_sequence: int = 100_000,
    epochs: int = 30,
    batch_size: int = 4096,
    learning_rate: float = 0.02,
    weight_decay: float = 0.003,
    validation_fraction: float = 0.15,
    seed: int = 20260732,
    target_mode: str = "independent",
    geometry_profile: str = "robust",
) -> dict:
    source = Path(detection_dir).expanduser().resolve()
    embedding_root = Path(embedding_dir).expanduser().resolve()
    names = [str(value) for value in train_sequences]
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    geometry_names = _geometry_names(str(geometry_profile))
    rng = np.random.default_rng(int(seed))
    xs: list[np.ndarray] = []
    ys: list[np.ndarray] = []
    sequence_ids: list[np.ndarray] = []
    sequence_stats: dict[str, dict] = {}

    for sequence_id, name in enumerate(names):
        features, quality, _deltas, _regression, stats = _sample_sequence(
            detection_path=source / f"{name}.npz",
            embedding_dir=embedding_root,
            sequence=sequence_by_name[name],
            max_samples=int(max_samples_per_sequence),
            high_quality_fraction=0.45,
            negative_iou=0.05,
            regression_iou=0.20,
            target_mode=str(target_mode),
            geometry_names=geometry_names,
            target_tracker_dir=None,
            rng=rng,
        )
        labels = (quality >= 0.5).astype(np.float32)
        xs.append(features)
        ys.append(labels)
        sequence_ids.append(
            np.full((len(labels),), sequence_id, dtype=np.int16)
        )
        sequence_stats[name] = {
            **stats,
            "positive": int(np.sum(labels == 1)),
            "negative": int(np.sum(labels == 0)),
        }
        print(
            f"{name}: samples={len(labels)} "
            f"positive={int(np.sum(labels == 1))}",
            flush=True,
        )

    features = np.concatenate(xs).astype(np.float32)
    labels = np.concatenate(ys).astype(np.float32)
    ids = np.concatenate(sequence_ids)
    validation_mask = np.zeros((len(labels),), dtype=bool)
    for sequence_id in np.unique(ids):
        indices = np.flatnonzero(ids == sequence_id)
        count = max(1, int(round(len(indices) * float(validation_fraction))))
        validation_mask[
            rng.choice(indices, size=count, replace=False)
        ] = True
    train_indices = np.flatnonzero(~validation_mask)
    validation_indices = np.flatnonzero(validation_mask)
    mean = features[train_indices].mean(axis=0, dtype=np.float64).astype(
        np.float32
    )
    scale = np.maximum(
        features[train_indices].std(axis=0, dtype=np.float64).astype(np.float32),
        1.0e-4,
    )
    normalized = ((features - mean) / scale).astype(np.float32)

    train_labels = labels[train_indices]
    positive = max(int(np.sum(train_labels == 1)), 1)
    negative = max(int(np.sum(train_labels == 0)), 1)
    sample_weights = np.where(
        train_labels == 1,
        len(train_labels) / (2.0 * positive),
        len(train_labels) / (2.0 * negative),
    ).astype(np.float32)

    resolved_device = _resolve_device(device)
    torch.manual_seed(int(seed))
    model = LinearOSNetConditioner(int(features.shape[1])).to(resolved_device)
    optimizer = torch.optim.SGD(
        model.parameters(),
        lr=float(learning_rate),
        momentum=0.9,
        weight_decay=float(weight_decay),
        nesterov=True,
    )
    loader = DataLoader(
        TensorDataset(
            torch.from_numpy(normalized[train_indices]),
            torch.from_numpy(train_labels),
            torch.from_numpy(sample_weights),
        ),
        batch_size=int(batch_size),
        shuffle=True,
        generator=torch.Generator().manual_seed(int(seed)),
        num_workers=0,
    )
    best_ap = -1.0
    best_state: dict[str, torch.Tensor] | None = None
    history: list[dict] = []
    for epoch in range(1, int(epochs) + 1):
        model.train()
        total_loss = 0.0
        count = 0
        for batch_x, batch_y, batch_weight in loader:
            batch_x = batch_x.to(resolved_device)
            batch_y = batch_y.to(resolved_device)
            batch_weight = batch_weight.to(resolved_device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(batch_x)
            loss = (
                nn.functional.binary_cross_entropy_with_logits(
                    logits,
                    batch_y,
                    reduction="none",
                )
                * batch_weight
            ).mean()
            loss.backward()
            optimizer.step()
            total_loss += float(loss.detach().cpu()) * len(batch_x)
            count += len(batch_x)

        validation_scores = _predict(
            model,
            features[validation_indices],
            mean=mean,
            scale=scale,
            device=resolved_device,
            batch_size=int(batch_size),
        )
        validation_ap = float(
            average_precision_score(
                labels[validation_indices],
                validation_scores,
            )
        )
        history.append(
            {
                "epoch": int(epoch),
                "train_loss": float(total_loss / max(count, 1)),
                "validation_average_precision": validation_ap,
            }
        )
        print(
            f"epoch {epoch}: train={history[-1]['train_loss']:.6f} "
            f"AP={validation_ap:.6f}",
            flush=True,
        )
        if validation_ap >= best_ap:
            best_ap = validation_ap
            best_state = {
                key: value.detach().cpu().clone()
                for key, value in model.state_dict().items()
            }

    if best_state is None:
        raise RuntimeError("No linear OSNet checkpoint was produced")
    metadata = {
        "kind": "linear_osnet_conditioner",
        "source_detections": str(source),
        "embedding_dir": str(embedding_root),
        "train_sequences": names,
        "device": resolved_device,
        "input_dim": int(features.shape[1]),
        "geometry_feature_names": list(geometry_names),
        "geometry_profile": str(geometry_profile),
        "target_mode": str(target_mode),
        "appearance_dim": OSNET_DIM,
        "appearance_backbone": "osnet_x0_25_msmt17",
        "appearance_backbone_frozen": True,
        "max_samples_per_sequence": int(max_samples_per_sequence),
        "epochs": int(epochs),
        "batch_size": int(batch_size),
        "learning_rate": float(learning_rate),
        "weight_decay": float(weight_decay),
        "validation_fraction": float(validation_fraction),
        "seed": int(seed),
        "history": history,
        "sequence_stats": sequence_stats,
        "between_vlm_detector_and_tracker": True,
        "single_neural_linear_layer": True,
        "strong_l2_regularization": True,
        "boxes_unchanged": True,
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


def apply_linear_osnet_conditioner(
    *,
    model_path: str | Path,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    device: str = "mps",
    threshold: float = 0.001,
    top_k: int | None = 1000,
    blend_input: float = 0.0,
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
    if metadata.get("kind") != "linear_osnet_conditioner":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    model = LinearOSNetConditioner(int(metadata["input_dim"])).to(
        resolved_device
    )
    model.load_state_dict(payload["state_dict"])
    mean = np.asarray(payload["mean"], dtype=np.float32)
    scale = np.asarray(payload["scale"], dtype=np.float32)
    geometry_names = tuple(metadata["geometry_feature_names"])
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
        selected_parts: list[np.ndarray] = []
        score_parts: list[np.ndarray] = []
        for _frame, indices in sorted(detections.by_frame().items()):
            geometry = _quality_geometry_features(
                detections,
                indices,
                sequence,
                geometry_names,
            )
            features = np.concatenate(
                [
                    geometry,
                    np.asarray(embeddings[indices], dtype=np.float32),
                ],
                axis=1,
            )
            scores = _predict(
                model,
                features,
                mean=mean,
                scale=scale,
                device=resolved_device,
                batch_size=int(batch_size),
            )
            if float(blend_input) > 0:
                scores = (
                    (1.0 - float(blend_input)) * scores
                    + float(blend_input)
                    * detections.calibrated_scores[indices]
                ).astype(np.float32)
            keep = np.flatnonzero(scores >= float(threshold))
            if top_k is not None and len(keep) > int(top_k):
                keep = keep[np.argsort(-scores[keep])[: int(top_k)]]
            if len(keep):
                selected_parts.append(indices[keep].astype(np.int64))
                score_parts.append(scores[keep].astype(np.float32))

        selected = (
            np.concatenate(selected_parts)
            if selected_parts
            else np.zeros((0,), dtype=np.int64)
        )
        scores = (
            np.concatenate(score_parts)
            if score_parts
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
        print(f"{name}: {len(detections)} -> {len(conditioned)}", flush=True)

    write_run_metadata(
        target,
        {
            "kind": "linear_osnet_conditioned",
            "source": str(source),
            "embedding_dir": str(embedding_root),
            "model": str(Path(model_path).expanduser().resolve()),
            "model_metadata": metadata,
            "device": resolved_device,
            "threshold": float(threshold),
            "top_k": None if top_k is None else int(top_k),
            "blend_input": float(blend_input),
            "counts": totals,
            "between_vlm_detector_and_tracker": True,
            "boxes_unchanged": True,
            "no_yolo_inference": True,
        },
    )
    return target
