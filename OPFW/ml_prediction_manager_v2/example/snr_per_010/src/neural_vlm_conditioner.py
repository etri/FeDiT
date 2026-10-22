from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import TRAIN_SEQUENCES, SequenceInfo
from nms import standard_nms
from vlm_conditioner import (
    FEATURE_NAMES,
    _frame_features,
    collect_labeled_samples,
    threshold_from_training_labels,
)

ROBUST_FEATURE_NAMES = (
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
GEOMETRY_FEATURE_NAMES = (
    *ROBUST_FEATURE_NAMES,
    "frame_detection_count_log",
    "w_norm",
    "h_norm",
    "area_norm_log",
    "border_min_norm",
)


def _feature_names(profile: str) -> tuple[str, ...]:
    if str(profile) == "full":
        return tuple(FEATURE_NAMES)
    if str(profile) == "robust":
        return ROBUST_FEATURE_NAMES
    if str(profile) == "geometry":
        return GEOMETRY_FEATURE_NAMES
    raise ValueError(f"Unknown neural VLM feature profile: {profile}")


def _select_features(features: np.ndarray, names: Iterable[str]) -> np.ndarray:
    indices = [FEATURE_NAMES.index(str(name)) for name in names]
    return features[:, indices].astype(np.float32, copy=False)


class NeuralVLMConditioner(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 128) -> None:
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.10),
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


def _predict(
    model: NeuralVLMConditioner,
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


def train_neural_vlm_conditioner(
    *,
    detection_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    device: str = "auto",
    max_samples_per_sequence: int = 300_000,
    negative_ratio: float = 12.0,
    min_recall: float = 0.95,
    epochs: int = 8,
    batch_size: int = 4096,
    learning_rate: float = 8.0e-4,
    weight_decay: float = 1.0e-4,
    validation_fraction: float = 0.15,
    focal_gamma: float = 1.5,
    feature_profile: str = "full",
    seed: int = 20260728,
) -> dict:
    names = [str(value) for value in train_sequences]
    samples = collect_labeled_samples(
        detection_dir=detection_dir,
        sequences=sequences,
        sequence_names=names,
        max_samples_per_sequence=int(max_samples_per_sequence),
        negative_ratio=float(negative_ratio),
        iou_threshold=0.5,
        ignore_iou_threshold=0.5,
        seed=int(seed),
    )
    selected_feature_names = _feature_names(feature_profile)
    features = _select_features(samples.x, selected_feature_names)
    labels = samples.y.astype(np.float32)
    weights = samples.sample_weight.astype(np.float32)
    rng = np.random.default_rng(int(seed))
    indices = rng.permutation(len(labels))
    validation_count = max(1, int(round(len(indices) * float(validation_fraction))))
    validation_indices = indices[:validation_count]
    train_indices = indices[validation_count:]
    if len(train_indices) == 0:
        raise RuntimeError("Training split is empty")

    mean = features[train_indices].mean(axis=0, dtype=np.float64).astype(np.float32)
    scale = features[train_indices].std(axis=0, dtype=np.float64).astype(np.float32)
    scale = np.maximum(scale, 1.0e-4)
    train_x = ((features[train_indices] - mean) / scale).astype(np.float32)
    train_y = labels[train_indices]
    train_w = weights[train_indices]
    train_w /= max(float(train_w.mean()), 1.0e-6)

    resolved_device = _resolve_device(device)
    torch.manual_seed(int(seed))
    model = NeuralVLMConditioner(features.shape[1]).to(resolved_device)
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
            probabilities = torch.sigmoid(logits)
            bce = nn.functional.binary_cross_entropy_with_logits(
                logits,
                batch_y,
                reduction="none",
            )
            p_t = batch_y * probabilities + (1.0 - batch_y) * (1.0 - probabilities)
            loss = (bce * torch.pow(1.0 - p_t, float(focal_gamma)) * batch_w).mean()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            optimizer.step()
            loss_sum += float(loss.detach().cpu()) * len(batch_x)
            sample_count += len(batch_x)

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
        validation_loss_value = float(
            np.average(validation_loss, weights=validation_weights)
        )
        history.append(
            {
                "epoch": epoch,
                "train_loss": float(loss_sum / max(sample_count, 1)),
                "validation_loss": validation_loss_value,
            }
        )
        if np.isfinite(validation_loss_value) and validation_loss_value <= best_loss:
            best_loss = validation_loss_value
            best_state = {
                key: value.detach().cpu().clone()
                for key, value in model.state_dict().items()
            }

    if best_state is None:
        raise RuntimeError("No finite neural conditioner checkpoint was produced")
    model.load_state_dict(best_state)
    validation_probabilities = _predict(
        model,
        features[validation_indices],
        mean=mean,
        scale=scale,
        device=resolved_device,
        batch_size=int(batch_size),
    )
    threshold, threshold_stats = threshold_from_training_labels(
        labels[validation_indices],
        validation_probabilities,
        weights[validation_indices],
        min_recall=float(min_recall),
        fp_weight=1.0,
        fn_weight=1.0,
    )
    metadata = {
        "kind": "neural_vlm_conditioner",
        "source_detections": str(Path(detection_dir).expanduser().resolve()),
        "train_sequences": names,
        "device": resolved_device,
        "input_dim": int(features.shape[1]),
        "hidden_dim": 128,
        "feature_names": list(selected_feature_names),
        "feature_profile": str(feature_profile),
        "threshold": float(threshold),
        "threshold_stats": threshold_stats,
        "training_samples": {
            "count": int(len(train_indices)),
            "positive": int(np.sum(labels[train_indices] == 1)),
            "negative": int(np.sum(labels[train_indices] == 0)),
            "validation": int(len(validation_indices)),
        },
        "sequence_stats": samples.stats,
        "epochs": int(epochs),
        "batch_size": int(batch_size),
        "learning_rate": float(learning_rate),
        "weight_decay": float(weight_decay),
        "validation_fraction": float(validation_fraction),
        "focal_gamma": float(focal_gamma),
        "seed": int(seed),
        "history": history,
        "between_vlm_detector_and_tracker": True,
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


def load_model(
    path: str | Path,
    *,
    device: str = "auto",
) -> tuple[NeuralVLMConditioner, dict, str]:
    resolved_device = _resolve_device(device)
    payload = torch.load(
        Path(path).expanduser().resolve(),
        map_location="cpu",
        weights_only=False,
    )
    metadata = dict(payload["metadata"])
    if metadata.get("kind") != "neural_vlm_conditioner":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    model = NeuralVLMConditioner(
        int(metadata["input_dim"]),
        int(metadata["hidden_dim"]),
    )
    model.load_state_dict(payload["state_dict"])
    model.to(resolved_device)
    return model, payload, resolved_device


def apply_neural_vlm_conditioner(
    *,
    model_path: str | Path,
    detection_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str] | None = None,
    device: str = "auto",
    threshold: float | None = None,
    blend_raw: float = 0.0,
    score_floor: float = 0.0,
    top_k: int | None = 700,
    nms_iou: float | None = 0.85,
    batch_size: int = 65536,
    overwrite: bool = False,
) -> Path:
    model, payload, resolved_device = load_model(model_path, device=device)
    metadata = dict(payload["metadata"])
    mean = np.asarray(payload["mean"], dtype=np.float32)
    scale = np.asarray(payload["scale"], dtype=np.float32)
    feature_names = tuple(metadata.get("feature_names", FEATURE_NAMES))
    names = [str(value) for value in (sequence_names or TRAIN_SEQUENCES)]
    unknown = sorted(set(names) - set(TRAIN_SEQUENCES))
    if unknown:
        raise AssertionError(f"Only MOT20 train sequences may be conditioned: {unknown}")
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    source = Path(detection_dir).expanduser().resolve()
    target = Path(target_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    threshold_value = float(
        metadata["threshold"] if threshold is None else threshold
    )
    totals: dict[str, dict] = {}

    for name in names:
        output_path = target / f"{name}.npz"
        if output_path.exists() and not overwrite:
            continue
        sequence = sequence_by_name[name]
        detections = load_detections(source / f"{name}.npz")
        selected_indices: list[np.ndarray] = []
        selected_scores: list[np.ndarray] = []
        pending: list[tuple[np.ndarray, np.ndarray]] = []
        pending_count = 0
        kept_before_nms = 0

        def flush() -> None:
            nonlocal pending_count, kept_before_nms
            if not pending:
                return
            batch_features = np.concatenate(
                [features for _, features in pending],
                axis=0,
            )
            probabilities = _predict(
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
                frame_probabilities = probabilities[offset:end]
                offset = end
                if float(blend_raw) > 0:
                    raw = detections.calibrated_scores[frame_indices].astype(np.float32)
                    frame_probabilities = (
                        (1.0 - float(blend_raw)) * frame_probabilities
                        + float(blend_raw) * raw
                    )
                frame_probabilities = np.clip(
                    frame_probabilities,
                    0.0,
                    1.0,
                ).astype(np.float32)
                keep = (frame_probabilities >= threshold_value) & (
                    detections.raw_scores[frame_indices] >= float(score_floor)
                )
                kept_indices = frame_indices[keep]
                kept_scores = frame_probabilities[keep]
                kept_before_nms += int(len(kept_indices))
                if len(kept_indices) and nms_iou is not None and float(nms_iou) < 1.0:
                    local_keep = standard_nms(
                        detections.boxes[kept_indices],
                        kept_scores,
                        float(nms_iou),
                    )
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
            features = _select_features(
                _frame_features(detections, frame_indices, sequence),
                feature_names,
            )
            pending.append((frame_indices, features))
            pending_count += len(frame_indices)
            if pending_count >= int(batch_size):
                flush()
        flush()

        keep_indices = (
            np.concatenate(selected_indices)
            if selected_indices
            else np.zeros((0,), dtype=np.int64)
        )
        keep_scores = (
            np.concatenate(selected_scores)
            if selected_scores
            else np.zeros((0,), dtype=np.float32)
        )
        conditioned = DetectionSet(
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
        save_detections(output_path, conditioned)
        totals[name] = {
            "source_detections": int(len(detections)),
            "kept_before_nms": int(kept_before_nms),
            "kept_after_nms_topk": int(len(conditioned)),
        }
        print(
            f"{name}: {len(detections)} -> {len(conditioned)} "
            f"(before NMS {kept_before_nms})"
        )

    write_run_metadata(
        target,
        {
            "kind": "neural_vlm_conditioned",
            "source": str(source),
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
            "tracker_unchanged": True,
            "no_detector_finetuning": True,
            "no_external_dataset": True,
            "no_oracle_ids": True,
        },
    )
    return target
