from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from detection_embeddings import load_embedding_file
from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import TRAIN_SEQUENCES, SequenceInfo
from nms import standard_nms
from vlm_conditioner import _frame_features, threshold_from_training_labels
from vq_conditioner import _collect


class EmbeddingMLP(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 128) -> None:
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.GELU(),
            nn.Dropout(0.10),
            nn.Linear(hidden_dim, 32),
            nn.GELU(),
            nn.Linear(32, 1),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return self.network(features).squeeze(1)


def _resolve_device(name: str) -> str:
    normalized = str(name or "auto").strip().lower()
    if normalized == "auto":
        if torch.cuda.is_available():
            return "cuda"
        if torch.backends.mps.is_available():
            return "mps"
        return "cpu"
    if normalized == "mps" and not torch.backends.mps.is_available():
        raise RuntimeError("MPS was requested but is not available")
    return normalized


def _predict_array(
    model: EmbeddingMLP,
    features: np.ndarray,
    *,
    mean: np.ndarray,
    scale: np.ndarray,
    device: str,
    batch_size: int,
) -> np.ndarray:
    model.eval()
    output = np.empty((len(features),), dtype=np.float32)
    with torch.inference_mode():
        for start in range(0, len(features), int(batch_size)):
            end = min(start + int(batch_size), len(features))
            normalized = (features[start:end] - mean) / scale
            tensor = torch.from_numpy(normalized.astype(np.float32, copy=False)).to(device)
            output[start:end] = torch.sigmoid(model(tensor)).cpu().numpy().astype(np.float32)
    return output


def train_embedding_mlp_conditioner(
    *,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    device: str = "auto",
    max_samples_per_sequence: int = 160_000,
    negative_ratio: float = 12.0,
    min_recall: float = 0.92,
    epochs: int = 8,
    batch_size: int = 2048,
    learning_rate: float = 8.0e-4,
    weight_decay: float = 1.0e-4,
    validation_fraction: float = 0.15,
    seed: int = 20260728,
) -> dict:
    names = [str(value) for value in train_sequences]
    geom, embeddings, labels, sample_weight, stats = _collect(
        detection_dir=Path(detection_dir).expanduser().resolve(),
        embedding_dir=Path(embedding_dir).expanduser().resolve(),
        sequences=sequences,
        sequence_names=names,
        max_samples_per_sequence=int(max_samples_per_sequence),
        negative_ratio=float(negative_ratio),
        seed=int(seed),
    )
    features = np.concatenate([geom, embeddings], axis=1).astype(np.float32)
    rng = np.random.default_rng(int(seed))
    indices = rng.permutation(len(labels))
    val_count = max(1, int(round(len(indices) * float(validation_fraction))))
    val_indices = indices[:val_count]
    train_indices = indices[val_count:]
    if len(train_indices) == 0:
        raise RuntimeError("Training split is empty")

    mean = features[train_indices].mean(axis=0, dtype=np.float64).astype(np.float32)
    scale = features[train_indices].std(axis=0, dtype=np.float64).astype(np.float32)
    scale = np.maximum(scale, 1.0e-4)
    train_x = ((features[train_indices] - mean) / scale).astype(np.float32)
    train_y = labels[train_indices].astype(np.float32)
    train_w = sample_weight[train_indices].astype(np.float32)
    train_w /= max(float(train_w.mean()), 1.0e-6)

    resolved_device = _resolve_device(device)
    torch.manual_seed(int(seed))
    model = EmbeddingMLP(features.shape[1]).to(resolved_device)
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

    history: list[dict[str, float | int]] = []
    best_loss = float("inf")
    best_state: dict[str, torch.Tensor] | None = None
    for epoch in range(1, int(epochs) + 1):
        model.train()
        loss_sum = 0.0
        sample_count = 0
        for batch_x, batch_y, batch_w in loader:
            batch_x = batch_x.to(resolved_device)
            batch_y = batch_y.to(resolved_device)
            batch_w = batch_w.to(resolved_device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(batch_x)
            per_sample = nn.functional.binary_cross_entropy_with_logits(logits, batch_y, reduction="none")
            loss = (per_sample * batch_w).mean()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            optimizer.step()
            loss_sum += float(loss.detach().cpu()) * len(batch_x)
            sample_count += len(batch_x)

        val_prob = _predict_array(
            model,
            features[val_indices],
            mean=mean,
            scale=scale,
            device=resolved_device,
            batch_size=int(batch_size),
        )
        val_y = labels[val_indices].astype(np.float32)
        val_w = sample_weight[val_indices].astype(np.float32)
        val_loss_values = -(
            val_y * np.log(np.maximum(val_prob, 1.0e-7))
            + (1.0 - val_y) * np.log(np.maximum(1.0 - val_prob, 1.0e-7))
        )
        val_loss = float(np.average(val_loss_values, weights=val_w))
        history.append(
            {
                "epoch": int(epoch),
                "train_loss": float(loss_sum / max(sample_count, 1)),
                "val_loss": val_loss,
            }
        )
        if np.isfinite(val_loss) and val_loss <= best_loss:
            best_loss = val_loss
            best_state = {key: value.detach().cpu().clone() for key, value in model.state_dict().items()}

    if best_state is None:
        raise RuntimeError("No finite MLP checkpoint was produced")
    model.load_state_dict(best_state)
    val_prob = _predict_array(
        model,
        features[val_indices],
        mean=mean,
        scale=scale,
        device=resolved_device,
        batch_size=int(batch_size),
    )
    threshold, threshold_stats = threshold_from_training_labels(
        labels[val_indices],
        val_prob,
        sample_weight[val_indices],
        min_recall=float(min_recall),
        fp_weight=1.0,
        fn_weight=1.0,
    )
    metadata = {
        "kind": "embedding_mlp_conditioner",
        "source_detections": str(Path(detection_dir).expanduser().resolve()),
        "source_embeddings": str(Path(embedding_dir).expanduser().resolve()),
        "train_sequences": names,
        "device": resolved_device,
        "input_dim": int(features.shape[1]),
        "hidden_dim": 128,
        "threshold": float(threshold),
        "threshold_stats": threshold_stats,
        "training_samples": {
            "count": int(len(train_indices)),
            "positive": int(np.sum(labels[train_indices] == 1)),
            "negative": int(np.sum(labels[train_indices] == 0)),
            "validation": int(len(val_indices)),
        },
        "sequence_stats": stats,
        "epochs": int(epochs),
        "batch_size": int(batch_size),
        "learning_rate": float(learning_rate),
        "weight_decay": float(weight_decay),
        "validation_fraction": float(validation_fraction),
        "seed": int(seed),
        "history": history,
        "between_vlm_detector_and_tracker": True,
        "boxes_unchanged": True,
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
        json.dumps(payload["metadata"], indent=2, ensure_ascii=True, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return output


def load_model(path: str | Path, *, device: str = "auto") -> tuple[EmbeddingMLP, dict, str]:
    resolved_device = _resolve_device(device)
    payload = torch.load(Path(path).expanduser().resolve(), map_location="cpu", weights_only=False)
    metadata = dict(payload["metadata"])
    if metadata.get("kind") != "embedding_mlp_conditioner":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    model = EmbeddingMLP(int(metadata["input_dim"]), int(metadata["hidden_dim"]))
    model.load_state_dict(payload["state_dict"])
    model.to(resolved_device)
    return model, payload, resolved_device


def apply_embedding_mlp_conditioner(
    *,
    model_path: str | Path,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str] | None = None,
    device: str = "auto",
    threshold: float | None = None,
    blend_raw: float = 0.0,
    score_floor: float = 0.0,
    top_k: int | None = 900,
    nms_iou: float | None = 0.85,
    batch_size: int = 16384,
    overwrite: bool = False,
) -> Path:
    model, payload, resolved_device = load_model(model_path, device=device)
    metadata = dict(payload["metadata"])
    mean = np.asarray(payload["mean"], dtype=np.float32)
    scale = np.asarray(payload["scale"], dtype=np.float32)
    names = [str(value) for value in (sequence_names or TRAIN_SEQUENCES)]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be conditioned: {unknown}")
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    detection_root = Path(detection_dir).expanduser().resolve()
    embedding_root = Path(embedding_dir).expanduser().resolve()
    output_root = Path(target_dir).expanduser().resolve()
    output_root.mkdir(parents=True, exist_ok=True)
    threshold_value = float(metadata["threshold"] if threshold is None else threshold)
    totals: dict[str, dict] = {}

    for name in names:
        output_path = output_root / f"{name}.npz"
        if output_path.exists() and not overwrite:
            continue
        sequence = sequence_by_name[name]
        detections = load_detections(detection_root / f"{name}.npz")
        embeddings, extracted = load_embedding_file(embedding_root / f"{name}.npz")
        if len(embeddings) != len(detections):
            raise ValueError(f"Embedding/detection count mismatch for {name}: {len(embeddings)} != {len(detections)}")

        selected_indices: list[np.ndarray] = []
        selected_scores: list[np.ndarray] = []
        pending: list[tuple[np.ndarray, np.ndarray]] = []
        pending_count = 0
        kept_before_nms = 0

        def flush() -> None:
            nonlocal pending_count, kept_before_nms
            if not pending:
                return
            batch_features = np.concatenate([features for _, features in pending], axis=0)
            probabilities = _predict_array(
                model,
                batch_features,
                mean=mean,
                scale=scale,
                device=resolved_device,
                batch_size=int(batch_size),
            )
            offset = 0
            for frame_indices, frame_features in pending:
                end = offset + len(frame_features)
                frame_prob = probabilities[offset:end]
                offset = end
                if float(blend_raw) > 0:
                    raw = detections.calibrated_scores[frame_indices].astype(np.float32)
                    frame_prob = (1.0 - float(blend_raw)) * frame_prob + float(blend_raw) * raw
                frame_prob = np.clip(frame_prob, 0.0, 1.0).astype(np.float32)
                keep = (frame_prob >= threshold_value) & (
                    detections.raw_scores[frame_indices] >= float(score_floor)
                )
                kept_indices = frame_indices[keep]
                kept_scores = frame_prob[keep]
                kept_before_nms += int(len(kept_indices))
                if len(kept_indices) and nms_iou is not None and float(nms_iou) < 1.0:
                    local_keep = standard_nms(detections.boxes[kept_indices], kept_scores, float(nms_iou))
                    kept_indices = kept_indices[local_keep]
                    kept_scores = kept_scores[local_keep]
                if top_k is not None and len(kept_indices) > int(top_k):
                    order = np.argsort(-kept_scores)[: int(top_k)]
                    kept_indices = kept_indices[order]
                    kept_scores = kept_scores[order]
                if len(kept_indices):
                    selected_indices.append(kept_indices.astype(np.int64))
                    selected_scores.append(kept_scores.astype(np.float32))
            pending.clear()
            pending_count = 0

        for _, frame_indices in sorted(detections.by_frame().items()):
            frame_indices = frame_indices[extracted[frame_indices]]
            if len(frame_indices) == 0:
                continue
            geom = _frame_features(detections, frame_indices, sequence)
            features = np.concatenate([geom, embeddings[frame_indices]], axis=1).astype(np.float32)
            pending.append((frame_indices, features))
            pending_count += len(frame_indices)
            if pending_count >= int(batch_size):
                flush()
        flush()

        keep_indices = np.concatenate(selected_indices) if selected_indices else np.zeros((0,), dtype=np.int64)
        keep_scores = np.concatenate(selected_scores) if selected_scores else np.zeros((0,), dtype=np.float32)
        output = DetectionSet(
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
        save_detections(output_path, output)
        totals[name] = {
            "source_detections": int(len(detections)),
            "embedded_detections": int(extracted.sum()),
            "kept_before_nms": int(kept_before_nms),
            "kept_after_nms_topk": int(len(output)),
        }

    write_run_metadata(
        output_root,
        {
            "kind": "embedding_mlp_conditioned",
            "source": str(detection_root),
            "embeddings": str(embedding_root),
            "model": str(Path(model_path).expanduser().resolve()),
            "model_metadata": metadata,
            "device": resolved_device,
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
    return output_root
