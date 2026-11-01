from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import SequenceInfo, load_gt
from neural_vlm_conditioner import _resolve_device
from nms import standard_nms


SCORE_QUANTILES = np.asarray([0.05, 0.10, 0.25, 0.50, 0.75, 0.90, 0.95])
GEOMETRY_QUANTILES = np.asarray([0.10, 0.50, 0.90])
SCORE_THRESHOLDS = np.asarray(
    [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90]
)
FEATURE_NAMES = (
    [
        "candidate_count_log",
        "score_sum_log",
        "score_sq_sum_log",
        "score_cube_sum_log",
        "score_mean",
        "score_std",
        "score_min",
        "score_max",
    ]
    + [f"score_q{int(value * 100):02d}" for value in SCORE_QUANTILES]
    + [f"count_ge_{int(value * 100):02d}_log" for value in SCORE_THRESHOLDS]
    + ["top10_score_mean", "top50_score_mean", "top100_score_mean"]
    + [f"height_q{int(value * 100):02d}" for value in GEOMETRY_QUANTILES]
    + [f"area_q{int(value * 100):02d}" for value in GEOMETRY_QUANTILES]
    + [f"aspect_q{int(value * 100):02d}" for value in GEOMETRY_QUANTILES]
)


class FrameCountConditioner(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 128) -> None:
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
            nn.Linear(hidden_dim, 64),
            nn.GELU(),
            nn.Linear(64, 1),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        hidden = self.input(features)
        hidden = hidden + self.block(hidden)
        return self.output(hidden).squeeze(1)


def frame_count_features(
    detections: DetectionSet,
    indices: np.ndarray,
    sequence: SequenceInfo,
) -> np.ndarray:
    if len(indices) == 0:
        return np.zeros((len(FEATURE_NAMES),), dtype=np.float32)

    scores = np.clip(
        detections.calibrated_scores[indices].astype(np.float32),
        0.0,
        1.0,
    )
    boxes = detections.boxes[indices].astype(np.float32)
    widths = np.maximum(boxes[:, 2] - boxes[:, 0], 1.0)
    heights = np.maximum(boxes[:, 3] - boxes[:, 1], 1.0)
    height_norm = heights / max(float(sequence.height), 1.0)
    area_norm = (widths * heights) / max(
        float(sequence.width * sequence.height),
        1.0,
    )
    aspect = heights / widths
    descending = np.sort(scores)[::-1]

    values = [
        np.log1p(float(len(indices))),
        np.log1p(float(np.sum(scores))),
        np.log1p(float(np.sum(scores * scores))),
        np.log1p(float(np.sum(scores * scores * scores))),
        float(np.mean(scores)),
        float(np.std(scores)),
        float(np.min(scores)),
        float(np.max(scores)),
        *np.quantile(scores, SCORE_QUANTILES).tolist(),
        *[
            np.log1p(float(np.count_nonzero(scores >= threshold)))
            for threshold in SCORE_THRESHOLDS
        ],
        *[
            float(np.mean(descending[: min(limit, len(descending))]))
            for limit in (10, 50, 100)
        ],
        *np.quantile(height_norm, GEOMETRY_QUANTILES).tolist(),
        *np.quantile(area_norm, GEOMETRY_QUANTILES).tolist(),
        *np.quantile(aspect, GEOMETRY_QUANTILES).tolist(),
    ]
    return np.asarray(values, dtype=np.float32)


def frame_soft_count(
    detections: DetectionSet,
    indices: np.ndarray,
) -> float:
    scores = np.clip(
        detections.calibrated_scores[indices].astype(np.float32),
        0.0,
        1.0,
    )
    return float(np.sum(scores * scores))


def _sequence_arrays(
    detection_path: Path,
    sequence: SequenceInfo,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    detections = load_detections(detection_path)
    by_frame = detections.by_frame()
    valid_gt, _ = load_gt(sequence.gt_path)
    gt_counts = valid_gt.groupby("frame").size().to_dict()
    empty = np.zeros((0,), dtype=np.int64)
    features = np.stack(
        [
            frame_count_features(
                detections,
                by_frame.get(frame, empty),
                sequence,
            )
            for frame in range(1, int(sequence.seq_length) + 1)
        ]
    ).astype(np.float32)
    targets = np.asarray(
        [gt_counts.get(frame, 0) for frame in range(1, int(sequence.seq_length) + 1)],
        dtype=np.float32,
    )
    soft_counts = np.asarray(
        [
            frame_soft_count(
                detections,
                by_frame.get(frame, empty),
            )
            for frame in range(1, int(sequence.seq_length) + 1)
        ],
        dtype=np.float32,
    )
    return features, targets, soft_counts


def _predict_log_counts(
    model: FrameCountConditioner,
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
            output[start:end] = model(tensor).cpu().numpy().astype(np.float32)
    return output


def train_frame_count_conditioner(
    *,
    detection_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    device: str = "auto",
    hidden_dim: int = 128,
    epochs: int = 80,
    batch_size: int = 512,
    learning_rate: float = 8.0e-4,
    weight_decay: float = 1.0e-3,
    validation_fraction: float = 0.15,
    target_mode: str = "residual",
    seed: int = 20260730,
) -> dict:
    source = Path(detection_dir).expanduser().resolve()
    names = [str(value) for value in train_sequences]
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    rng = np.random.default_rng(int(seed))

    feature_parts: list[np.ndarray] = []
    target_parts: list[np.ndarray] = []
    soft_count_parts: list[np.ndarray] = []
    sequence_parts: list[np.ndarray] = []
    sequence_stats: dict[str, dict] = {}
    for sequence_id, name in enumerate(names):
        features, targets, soft_counts = _sequence_arrays(
            source / f"{name}.npz",
            sequence_by_name[name],
        )
        feature_parts.append(features)
        target_parts.append(targets)
        soft_count_parts.append(soft_counts)
        sequence_parts.append(
            np.full((len(targets),), sequence_id, dtype=np.int64)
        )
        sequence_stats[name] = {
            "frames": int(len(targets)),
            "gt_count_mean": float(np.mean(targets)),
            "gt_count_min": float(np.min(targets)),
            "gt_count_max": float(np.max(targets)),
            "soft_count_mean": float(np.mean(soft_counts)),
        }

    features = np.concatenate(feature_parts).astype(np.float32)
    targets = np.concatenate(target_parts).astype(np.float32)
    soft_counts = np.concatenate(soft_count_parts).astype(np.float32)
    sequence_ids = np.concatenate(sequence_parts)
    validation_mask = np.zeros((len(targets),), dtype=bool)
    for sequence_id in np.unique(sequence_ids):
        indices = np.flatnonzero(sequence_ids == sequence_id)
        count = max(1, int(round(len(indices) * float(validation_fraction))))
        validation_mask[rng.choice(indices, size=count, replace=False)] = True
    train_indices = np.flatnonzero(~validation_mask)
    validation_indices = np.flatnonzero(validation_mask)

    mean = features[train_indices].mean(axis=0, dtype=np.float64).astype(np.float32)
    scale = np.maximum(
        features[train_indices].std(axis=0, dtype=np.float64).astype(np.float32),
        1.0e-4,
    )
    normalized = ((features - mean) / scale).astype(np.float32)
    if str(target_mode) == "absolute":
        training_targets = np.log1p(targets).astype(np.float32)
        metadata_target_mode = "absolute_log_count"
    elif str(target_mode) == "residual":
        training_targets = (
            np.log1p(targets) - np.log1p(soft_counts)
        ).astype(np.float32)
        metadata_target_mode = "log_count_residual_to_score_squared_sum"
    else:
        raise ValueError(f"Unsupported frame-count target mode: {target_mode}")
    weights = np.ones((len(targets),), dtype=np.float32)
    for sequence_id in np.unique(sequence_ids):
        indices = np.flatnonzero(sequence_ids == sequence_id)
        weights[indices] *= float(len(targets) / max(len(indices), 1))
    weights /= max(float(np.mean(weights[train_indices])), 1.0e-6)

    resolved_device = _resolve_device(device)
    torch.manual_seed(int(seed))
    model = FrameCountConditioner(
        int(features.shape[1]),
        hidden_dim=int(hidden_dim),
    ).to(resolved_device)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=float(learning_rate),
        weight_decay=float(weight_decay),
    )
    loader = DataLoader(
        TensorDataset(
            torch.from_numpy(normalized[train_indices]),
            torch.from_numpy(training_targets[train_indices]),
            torch.from_numpy(weights[train_indices]),
        ),
        batch_size=int(batch_size),
        shuffle=True,
        generator=torch.Generator().manual_seed(int(seed)),
        num_workers=0,
    )

    best_loss = float("inf")
    best_state: dict[str, torch.Tensor] | None = None
    history: list[dict] = []
    stale = 0
    for epoch in range(1, int(epochs) + 1):
        model.train()
        total_loss = 0.0
        total_count = 0
        for batch_x, batch_y, batch_w in loader:
            batch_x = batch_x.to(resolved_device)
            batch_y = batch_y.to(resolved_device)
            batch_w = batch_w.to(resolved_device)
            optimizer.zero_grad(set_to_none=True)
            prediction = model(batch_x)
            loss = (
                nn.functional.smooth_l1_loss(
                    prediction,
                    batch_y,
                    reduction="none",
                    beta=0.10,
                )
                * batch_w
            ).mean()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            optimizer.step()
            total_loss += float(loss.detach().cpu()) * len(batch_x)
            total_count += len(batch_x)

        validation_prediction = _predict_log_counts(
            model,
            features[validation_indices],
            mean=mean,
            scale=scale,
            device=resolved_device,
            batch_size=int(batch_size),
        )
        validation_error = np.abs(
            validation_prediction - training_targets[validation_indices]
        )
        validation_loss = float(
            np.average(validation_error, weights=weights[validation_indices])
        )
        history.append(
            {
                "epoch": int(epoch),
                "train_loss": float(total_loss / max(total_count, 1)),
                "validation_target_mae": validation_loss,
            }
        )
        print(
            f"epoch {epoch}: train={history[-1]['train_loss']:.6f} "
            f"validation_target_mae={validation_loss:.6f}"
        )
        if np.isfinite(validation_loss) and validation_loss < best_loss - 1.0e-5:
            best_loss = validation_loss
            best_state = {
                key: value.detach().cpu().clone()
                for key, value in model.state_dict().items()
            }
            stale = 0
        else:
            stale += 1
        if stale >= 12:
            break

    if best_state is None:
        raise RuntimeError("No finite frame-count checkpoint was produced")
    model.load_state_dict(best_state)
    fitted_output = _predict_log_counts(
        model,
        features,
        mean=mean,
        scale=scale,
        device=resolved_device,
        batch_size=int(batch_size),
    )
    if str(target_mode) == "absolute":
        fitted_counts = np.maximum(np.expm1(fitted_output), 0.0)
    else:
        fitted_counts = np.maximum(
            np.exp(np.log1p(soft_counts) + fitted_output) - 1.0,
            0.0,
        )
    for sequence_id, name in enumerate(names):
        indices = np.flatnonzero(sequence_ids == sequence_id)
        sequence_stats[name]["fitted_count_mae"] = float(
            np.mean(np.abs(fitted_counts[indices] - targets[indices]))
        )
        sequence_stats[name]["fitted_count_bias"] = float(
            np.mean(fitted_counts[indices] - targets[indices])
        )

    metadata = {
        "kind": "frame_count_conditioner",
        "source_detections": str(source),
        "train_sequences": names,
        "device": resolved_device,
        "input_dim": int(features.shape[1]),
        "hidden_dim": int(hidden_dim),
        "feature_names": FEATURE_NAMES,
        "target_mode": metadata_target_mode,
        "soft_count_sequence_mean_range": [
            float(
                min(stats["soft_count_mean"] for stats in sequence_stats.values())
            ),
            float(
                max(stats["soft_count_mean"] for stats in sequence_stats.values())
            ),
        ],
        "epochs": int(epochs),
        "batch_size": int(batch_size),
        "learning_rate": float(learning_rate),
        "weight_decay": float(weight_decay),
        "validation_fraction": float(validation_fraction),
        "seed": int(seed),
        "history": history,
        "sequence_stats": sequence_stats,
        "between_detector_and_tracker": True,
        "predicts_frame_person_count": True,
        "no_heldout_gt": True,
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


def _smooth_counts(values: np.ndarray, radius: int) -> np.ndarray:
    if int(radius) <= 0:
        return values
    output = np.empty_like(values)
    for index in range(len(values)):
        start = max(0, index - int(radius))
        end = min(len(values), index + int(radius) + 1)
        output[index] = np.median(values[start:end])
    return output


def _logit(values: np.ndarray) -> np.ndarray:
    clipped = np.clip(values, 1.0e-5, 1.0 - 1.0e-5)
    return np.log(clipped) - np.log1p(-clipped)


def _features_for_model(
    features: np.ndarray,
    metadata: dict,
) -> np.ndarray:
    model_feature_names = metadata.get("feature_names")
    if not model_feature_names:
        return features
    current_indices = {name: index for index, name in enumerate(FEATURE_NAMES)}
    missing = [
        str(name)
        for name in model_feature_names
        if str(name) not in current_indices
    ]
    if missing:
        raise AssertionError(f"Frame-count model uses unknown features: {missing}")
    indices = np.asarray(
        [current_indices[str(name)] for name in model_feature_names],
        dtype=np.int64,
    )
    return features[:, indices]


def apply_frame_count_conditioner(
    *,
    model_path: str | Path,
    detection_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    device: str = "auto",
    nms_iou: float = 0.60,
    target_multiplier: float = 1.0,
    rank_temperature: float = 0.20,
    input_score_blend: float = 0.20,
    smoothing_radius: int = 2,
    min_predicted_count: float = 1.0,
    residual_clip: float = 0.15,
    fallback_model_path: str | Path | None = None,
    ood_mean_margin: float = 0.0,
    top_k: int | None = 300,
    score_threshold: float = 0.01,
    batch_size: int = 1024,
    overwrite: bool = False,
) -> Path:
    resolved_device = _resolve_device(device)
    resolved_model = Path(model_path).expanduser().resolve()
    payload = torch.load(resolved_model, map_location="cpu", weights_only=False)
    metadata = dict(payload["metadata"])
    if metadata.get("kind") != "frame_count_conditioner":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    model = FrameCountConditioner(
        int(metadata["input_dim"]),
        hidden_dim=int(metadata["hidden_dim"]),
    ).to(resolved_device)
    model.load_state_dict(payload["state_dict"])
    mean = np.asarray(payload["mean"], dtype=np.float32)
    scale = np.asarray(payload["scale"], dtype=np.float32)
    fallback_model: FrameCountConditioner | None = None
    fallback_payload: dict | None = None
    fallback_metadata: dict | None = None
    if fallback_model_path is not None:
        fallback_payload = torch.load(
            Path(fallback_model_path).expanduser().resolve(),
            map_location="cpu",
            weights_only=False,
        )
        fallback_metadata = dict(fallback_payload["metadata"])
        if fallback_metadata.get("kind") != "frame_count_conditioner":
            raise AssertionError(
                f"Unexpected fallback model kind: {fallback_metadata.get('kind')}"
            )
        fallback_model = FrameCountConditioner(
            int(fallback_metadata["input_dim"]),
            hidden_dim=int(fallback_metadata["hidden_dim"]),
        ).to(resolved_device)
        fallback_model.load_state_dict(fallback_payload["state_dict"])
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
        by_frame = detections.by_frame()
        empty = np.zeros((0,), dtype=np.int64)
        features = np.stack(
            [
                frame_count_features(
                    detections,
                    by_frame.get(frame, empty),
                    sequence,
                )
                for frame in range(1, int(sequence.seq_length) + 1)
            ]
        ).astype(np.float32)
        soft_counts = np.asarray(
            [
                frame_soft_count(
                    detections,
                    by_frame.get(frame, empty),
                )
                for frame in range(1, int(sequence.seq_length) + 1)
            ],
            dtype=np.float32,
        )
        primary_output = _predict_log_counts(
            model,
            _features_for_model(features, metadata),
            mean=mean,
            scale=scale,
            device=resolved_device,
            batch_size=int(batch_size),
        )
        primary_mode = str(metadata.get("target_mode", "absolute_log_count"))
        if primary_mode == "absolute_log_count":
            primary_counts = np.maximum(np.expm1(primary_output), 0.0)
        elif primary_mode == "log_count_residual_to_score_squared_sum":
            primary_residual = primary_output
            if float(residual_clip) > 0:
                primary_residual = np.clip(
                    primary_residual,
                    -float(residual_clip),
                    float(residual_clip),
                )
            primary_counts = np.maximum(
                np.exp(np.log1p(soft_counts) + primary_residual) - 1.0,
                0.0,
            )
        else:
            raise AssertionError(f"Unexpected target mode: {primary_mode}")

        selected_count_mode = "primary"
        predicted = primary_counts
        if (
            fallback_model is not None
            and fallback_payload is not None
            and fallback_metadata is not None
        ):
            count_range = metadata.get("soft_count_sequence_mean_range")
            if count_range is None:
                count_range = fallback_metadata.get(
                    "soft_count_sequence_mean_range"
                )
            if count_range is None:
                sequence_stats = fallback_metadata.get("sequence_stats") or {}
                soft_means = [
                    float(stats["soft_count_mean"])
                    for stats in sequence_stats.values()
                    if stats.get("soft_count_mean") is not None
                ]
                if soft_means:
                    count_range = [min(soft_means), max(soft_means)]
            if count_range is None:
                raise AssertionError(
                    "Hybrid frame-count calibration needs a training "
                    "soft-count mean range"
                )
            lower, upper = [
                float(value)
                for value in count_range
            ]
            sequence_soft_mean = float(np.mean(soft_counts))
            margin = max(float(ood_mean_margin), 0.0)
            is_ood = (
                sequence_soft_mean < lower * (1.0 - margin)
                or sequence_soft_mean > upper * (1.0 + margin)
            )
            if is_ood:
                fallback_output = _predict_log_counts(
                    fallback_model,
                    _features_for_model(features, fallback_metadata),
                    mean=np.asarray(fallback_payload["mean"], dtype=np.float32),
                    scale=np.asarray(fallback_payload["scale"], dtype=np.float32),
                    device=resolved_device,
                    batch_size=int(batch_size),
                )
                fallback_mode = str(fallback_metadata["target_mode"])
                if fallback_mode == "absolute_log_count":
                    predicted = np.maximum(np.expm1(fallback_output), 0.0)
                elif fallback_mode == "log_count_residual_to_score_squared_sum":
                    if float(residual_clip) > 0:
                        fallback_output = np.clip(
                            fallback_output,
                            -float(residual_clip),
                            float(residual_clip),
                        )
                    predicted = np.maximum(
                        np.exp(np.log1p(soft_counts) + fallback_output) - 1.0,
                        0.0,
                    )
                else:
                    raise AssertionError(
                        f"Unexpected fallback target mode: {fallback_mode}"
                    )
                selected_count_mode = "fallback"
        predicted = np.maximum(predicted, float(min_predicted_count))
        predicted = _smooth_counts(predicted, int(smoothing_radius))

        selected_parts: list[np.ndarray] = []
        score_parts: list[np.ndarray] = []
        for frame in range(1, int(sequence.seq_length) + 1):
            indices = by_frame.get(frame, empty)
            if len(indices) == 0:
                continue
            input_scores = np.clip(
                detections.calibrated_scores[indices].astype(np.float32),
                0.0,
                1.0,
            )
            keep = standard_nms(
                detections.boxes[indices],
                input_scores,
                float(nms_iou),
            )
            indices = indices[keep]
            input_scores = input_scores[keep]
            order = np.argsort(-input_scores)
            indices = indices[order]
            input_scores = input_scores[order]
            if top_k is not None and len(indices) > int(top_k):
                indices = indices[: int(top_k)]
                input_scores = input_scores[: int(top_k)]

            desired = max(
                float(min_predicted_count),
                float(target_multiplier) * float(predicted[frame - 1]),
            )
            scale_value = max(
                float(rank_temperature) * max(float(predicted[frame - 1]), 1.0),
                1.0,
            )
            ranks = np.arange(len(indices), dtype=np.float32) + 0.5
            rank_scores = 1.0 / (
                1.0 + np.exp(np.clip((ranks - desired) / scale_value, -60.0, 60.0))
            )
            blend = float(np.clip(input_score_blend, 0.0, 1.0))
            scores = 1.0 / (
                1.0
                + np.exp(
                    -(
                        (1.0 - blend) * _logit(rank_scores)
                        + blend * _logit(input_scores)
                    )
                )
            )
            valid = scores >= float(score_threshold)
            if np.any(valid):
                selected_parts.append(indices[valid].astype(np.int64))
                score_parts.append(scores[valid].astype(np.float32))

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
            "predicted_count_mean": float(np.mean(predicted)),
            "predicted_count_min": float(np.min(predicted)),
            "predicted_count_max": float(np.max(predicted)),
            "soft_count_mean": float(np.mean(soft_counts)),
            "selected_count_mode": selected_count_mode,
        }
        print(
            f"{name}: {len(detections)} -> {len(conditioned)} "
            f"predicted_count={np.mean(predicted):.2f}/frame"
        )

    write_run_metadata(
        target,
        {
            "kind": "frame_count_conditioned",
            "source": str(source),
            "model": str(resolved_model),
            "fallback_model": (
                str(Path(fallback_model_path).expanduser().resolve())
                if fallback_model_path is not None
                else None
            ),
            "model_metadata": metadata,
            "device": resolved_device,
            "nms_iou": float(nms_iou),
            "target_multiplier": float(target_multiplier),
            "rank_temperature": float(rank_temperature),
            "input_score_blend": float(input_score_blend),
            "smoothing_radius": int(smoothing_radius),
            "min_predicted_count": float(min_predicted_count),
            "residual_clip": float(residual_clip),
            "ood_mean_margin": float(ood_mean_margin),
            "top_k": None if top_k is None else int(top_k),
            "score_threshold": float(score_threshold),
            "counts": totals,
            "between_detector_and_tracker": True,
            "predicts_frame_person_count": True,
            "tracker_unchanged": True,
            "no_heldout_gt": True,
            "no_oracle_ids": True,
        },
    )
    return target
