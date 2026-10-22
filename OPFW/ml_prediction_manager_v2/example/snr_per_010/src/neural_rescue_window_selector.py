from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from mot20_io import SequenceInfo, load_gt, write_mot_rows
from neural_rescue_segment_selector import (
    FEATURE_NAMES,
    _indices_by_value,
    _load_rows,
    _minimum_run_mask,
    _tracker_root,
    _xywh_to_xyxy,
    extract_rescue_rows,
)
from neural_vlm_conditioner import _resolve_device
from nms import pairwise_iou_xyxy


SELECTED_FEATURE_NAMES = (
    "track_length_log",
    "track_density",
    "track_score_mean",
    "track_score_median",
    "track_score_max",
    "track_score_std",
    "track_motion_per_h",
    "track_jitter_per_h",
    "row_score",
    "row_score_minus_mean",
    "track_edge_proximity",
    "previous_iou",
    "next_iou",
    "previous_motion_per_h",
    "next_motion_per_h",
    "previous_frame_gap_log",
    "base_max_iou",
    "base_score_at_max_iou",
    "base_overlap_log_iou030",
    "base_overlap_log_iou050",
    "base_center_distance_h",
    "frame_score_rank",
    "frame_max_higher_score_iou",
    "frame_neighbor_log_iou030",
)
AGGREGATIONS = ("mean", "std", "q10", "q50", "q90")
WINDOW_FEATURE_NAMES = tuple(
    f"{aggregation}_{name}"
    for aggregation in AGGREGATIONS
    for name in SELECTED_FEATURE_NAMES
) + (
    "window_row_count_log",
    "window_span_fraction",
    "window_density",
    "window_score_slope",
    "window_base_free_iou010",
    "window_base_free_iou030",
)


class NeuralRescueWindowSelector(nn.Module):
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


@dataclass(frozen=True)
class WindowData:
    features: np.ndarray
    members: tuple[np.ndarray, ...]
    labels: np.ndarray | None
    gains: np.ndarray | None


def _selected_feature_indices() -> np.ndarray:
    by_name = {name: index for index, name in enumerate(FEATURE_NAMES)}
    return np.asarray(
        [by_name[name] for name in SELECTED_FEATURE_NAMES],
        dtype=np.int64,
    )


def _within_sequence_percentiles(features: np.ndarray) -> np.ndarray:
    selected = features[:, _selected_feature_indices()].astype(np.float32)
    if not len(selected):
        return selected
    probabilities = np.linspace(0.0, 1.0, 129, dtype=np.float32)
    quantiles = np.quantile(selected, probabilities, axis=0).astype(np.float32)
    output = np.empty_like(selected)
    for column in range(selected.shape[1]):
        values, unique_indices = np.unique(
            quantiles[:, column], return_index=True
        )
        percentiles = probabilities[unique_indices]
        if len(values) == 1:
            output[:, column] = 0.5
        else:
            output[:, column] = np.interp(
                selected[:, column],
                values,
                percentiles,
            ).astype(np.float32)
    return output


def _window_features(
    rows: np.ndarray,
    normalized: np.ndarray,
    indices: np.ndarray,
    *,
    window_length: int,
) -> np.ndarray:
    values = normalized[indices]
    aggregates = [
        np.mean(values, axis=0),
        np.std(values, axis=0),
        np.quantile(values, 0.10, axis=0),
        np.quantile(values, 0.50, axis=0),
        np.quantile(values, 0.90, axis=0),
    ]
    frames = rows[indices, 0].astype(np.float32)
    span = max(float(frames[-1] - frames[0] + 1.0), 1.0)
    raw_indices = _selected_feature_indices()
    row_score_index = int(np.flatnonzero(
        raw_indices == FEATURE_NAMES.index("row_score")
    )[0])
    base_iou_index = int(np.flatnonzero(
        raw_indices == FEATURE_NAMES.index("base_max_iou")
    )[0])
    centered = frames - float(np.mean(frames))
    denominator = float(np.sum(centered * centered))
    score_slope = (
        float(
            np.sum(
                centered
                * (
                    values[:, row_score_index]
                    - float(np.mean(values[:, row_score_index]))
                )
            )
            / denominator
        )
        if denominator > 1.0e-6
        else 0.0
    )
    raw_base_iou = rows.shape[0] and normalized[indices, base_iou_index]
    extras = np.asarray(
        [
            np.log1p(len(indices)),
            span / max(float(window_length), 1.0),
            len(indices) / span,
            score_slope,
            float(np.mean(raw_base_iou <= 0.10)),
            float(np.mean(raw_base_iou <= 0.30)),
        ],
        dtype=np.float32,
    )
    return np.concatenate([*aggregates, extras]).astype(np.float32)


def build_windows(
    rows: np.ndarray,
    row_features: np.ndarray,
    labels: np.ndarray | None,
    *,
    window_length: int = 16,
    window_stride: int = 8,
) -> WindowData:
    normalized = _within_sequence_percentiles(row_features)
    members: list[np.ndarray] = []
    features: list[np.ndarray] = []
    window_labels: list[int] = []
    gains: list[int] = []
    track_ids = rows[:, 1].astype(np.int64)
    for _track_id, track_indices in _indices_by_value(track_ids).items():
        track_indices = track_indices[
            np.argsort(rows[track_indices, 0], kind="stable")
        ]
        frames = rows[track_indices, 0].astype(np.int64)
        first = int(frames[0])
        last = int(frames[-1])
        starts = list(
            range(first, last + 1, max(int(window_stride), 1))
        )
        for start in starts:
            left = int(np.searchsorted(frames, start, side="left"))
            right = int(
                np.searchsorted(
                    frames,
                    start + max(int(window_length), 1),
                    side="left",
                )
            )
            indices = track_indices[left:right]
            if not len(indices):
                continue
            members.append(indices)
            features.append(
                _window_features(
                    rows,
                    normalized,
                    indices,
                    window_length=int(window_length),
                )
            )
            if labels is not None:
                tp = int(np.sum(labels[indices] == 1))
                fp = int(np.sum(labels[indices] == 0))
                gain = tp - fp
                gains.append(gain)
                window_labels.append(int(gain > 0))
    feature_array = (
        np.stack(features).astype(np.float32)
        if features
        else np.zeros((0, len(WINDOW_FEATURE_NAMES)), dtype=np.float32)
    )
    return WindowData(
        features=feature_array,
        members=tuple(members),
        labels=(
            np.asarray(window_labels, dtype=np.float32)
            if labels is not None
            else None
        ),
        gains=(
            np.asarray(gains, dtype=np.int16)
            if labels is not None
            else None
        ),
    )


def _fit_model(
    features: np.ndarray,
    labels: np.ndarray,
    gains: np.ndarray,
    sequence_ids: np.ndarray,
    *,
    device: str,
    hidden_dim: int,
    epochs: int,
    batch_size: int,
    learning_rate: float,
    weight_decay: float,
    seed: int,
) -> dict:
    mean = features.mean(axis=0, dtype=np.float64).astype(np.float32)
    scale = np.maximum(
        features.std(axis=0, dtype=np.float64).astype(np.float32),
        1.0e-4,
    )
    normalized = ((features - mean) / scale).astype(np.float32)
    weights = np.sqrt(np.maximum(np.abs(gains), 1)).astype(np.float32)
    for sequence_id in np.unique(sequence_ids):
        mask = sequence_ids == int(sequence_id)
        weights[mask] *= float(len(labels) / max(int(np.sum(mask)), 1))
    for label in (0, 1):
        mask = labels == label
        if np.any(mask):
            weights[mask] *= float(len(labels) / (2.0 * np.sum(mask)))
    weights /= max(float(np.mean(weights)), 1.0e-6)

    torch.manual_seed(int(seed))
    model = NeuralRescueWindowSelector(
        int(features.shape[1]), int(hidden_dim)
    ).to(device)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=float(learning_rate),
        weight_decay=float(weight_decay),
    )
    loader = DataLoader(
        TensorDataset(
            torch.from_numpy(normalized),
            torch.from_numpy(labels.astype(np.float32)),
            torch.from_numpy(weights),
        ),
        batch_size=int(batch_size),
        shuffle=True,
        generator=torch.Generator().manual_seed(int(seed)),
        num_workers=0,
    )
    history: list[float] = []
    best_loss = float("inf")
    best_state: dict[str, torch.Tensor] | None = None
    for _epoch in range(int(epochs)):
        model.train()
        total = 0.0
        count = 0
        for batch_x, batch_y, batch_weight in loader:
            batch_x = batch_x.to(device)
            batch_y = batch_y.to(device)
            batch_weight = batch_weight.to(device)
            optimizer.zero_grad(set_to_none=True)
            loss = (
                nn.functional.binary_cross_entropy_with_logits(
                    model(batch_x), batch_y, reduction="none"
                )
                * batch_weight
            ).mean()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            optimizer.step()
            total += float(loss.detach().cpu()) * len(batch_x)
            count += len(batch_x)
        epoch_loss = total / max(count, 1)
        history.append(epoch_loss)
        if epoch_loss < best_loss:
            best_loss = epoch_loss
            best_state = {
                key: value.detach().cpu().clone()
                for key, value in model.state_dict().items()
            }
    if best_state is None:
        raise RuntimeError("No rescue window checkpoint was produced")
    return {
        "state_dict": best_state,
        "mean": mean,
        "scale": scale,
        "history": history,
    }


def _predict_windows(
    payload: dict,
    features: np.ndarray,
    *,
    device: str,
    batch_size: int,
) -> np.ndarray:
    metadata = payload["metadata"]
    model = NeuralRescueWindowSelector(
        int(metadata["input_dim"]), int(metadata["hidden_dim"])
    ).to(device)
    model.load_state_dict(payload["state_dict"])
    mean = np.asarray(payload["mean"], dtype=np.float32)
    scale = np.asarray(payload["scale"], dtype=np.float32)
    output = np.empty((len(features),), dtype=np.float32)
    model.eval()
    with torch.inference_mode():
        for start in range(0, len(features), int(batch_size)):
            end = min(start + int(batch_size), len(features))
            tensor = torch.from_numpy(
                ((features[start:end] - mean) / scale).astype(np.float32)
            ).to(device)
            output[start:end] = (
                torch.sigmoid(model(tensor)).cpu().numpy().astype(np.float32)
            )
    return output


def _window_to_row_scores(
    row_count: int,
    members: tuple[np.ndarray, ...],
    window_scores: np.ndarray,
) -> np.ndarray:
    output = np.zeros((row_count,), dtype=np.float32)
    counts = np.zeros((row_count,), dtype=np.float32)
    for indices, score in zip(members, window_scores, strict=True):
        output[indices] += float(score)
        counts[indices] += 1.0
    valid = counts > 0
    output[valid] /= counts[valid]
    return output


def _select_oof_threshold(
    labels_by_sequence: list[np.ndarray],
    scores_by_sequence: list[np.ndarray],
    eligible_by_sequence: list[np.ndarray],
    gt_counts: list[int],
) -> dict:
    pooled_scores = np.concatenate(scores_by_sequence)
    candidates = np.unique(
        np.quantile(pooled_scores, np.linspace(0.0, 1.0, 401))
    )
    candidates = np.r_[candidates, np.nextafter(np.max(pooled_scores), np.inf)]
    best_key = None
    best_stats = None
    for threshold in candidates:
        deltas: list[float] = []
        total_tp = total_fp = total_selected = 0
        sequence_stats: list[dict] = []
        for labels, scores, eligible, gt_count in zip(
            labels_by_sequence,
            scores_by_sequence,
            eligible_by_sequence,
            gt_counts,
            strict=True,
        ):
            selected = eligible & (scores >= float(threshold))
            tp = int(np.sum(labels[selected] == 1))
            fp = int(np.sum(labels[selected] == 0))
            delta = float((tp - fp) / max(gt_count, 1))
            deltas.append(delta)
            total_tp += tp
            total_fp += fp
            total_selected += int(np.sum(selected))
            sequence_stats.append(
                {
                    "tp": tp,
                    "fp": fp,
                    "selected_rows": int(np.sum(selected)),
                    "estimated_mota_delta": 100.0 * delta,
                }
            )
        precision = float(total_tp / max(total_tp + total_fp, 1))
        key = (
            float(np.min(deltas)),
            float(np.mean(deltas)),
            precision,
            -float(total_selected),
        )
        if best_key is None or key > best_key:
            best_key = key
            best_stats = {
                "threshold": float(threshold),
                "estimated_worst_mota_delta": float(100.0 * np.min(deltas)),
                "estimated_macro_mota_delta": float(100.0 * np.mean(deltas)),
                "tp": total_tp,
                "fp": total_fp,
                "selected_rows": total_selected,
                "precision": precision,
                "sequence_stats": sequence_stats,
            }
    assert best_stats is not None
    return best_stats


def train_neural_rescue_window_selector(
    *,
    base_tracker_dir: str | Path,
    rescue_tracker_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    device: str = "mps",
    match_iou: float = 0.1,
    ignore_iou: float = 0.5,
    window_length: int = 16,
    window_stride: int = 8,
    base_duplicate_iou: float = 0.30,
    hidden_dim: int = 128,
    epochs: int = 14,
    batch_size: int = 4096,
    learning_rate: float = 8.0e-4,
    weight_decay: float = 3.0e-3,
    seed: int = 20260850,
) -> dict:
    names = [str(value) for value in train_sequences]
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    resolved_device = _resolve_device(device)
    rows_parts: list[np.ndarray] = []
    row_features_parts: list[np.ndarray] = []
    row_labels_parts: list[np.ndarray] = []
    windows: list[WindowData] = []
    gt_counts: list[int] = []
    stats: dict[str, dict] = {}
    for name in names:
        rows, row_features, labels = extract_rescue_rows(
            base_tracker_dir=base_tracker_dir,
            rescue_tracker_dir=rescue_tracker_dir,
            sequence=sequence_by_name[name],
            with_labels=True,
            match_iou=float(match_iou),
            ignore_iou=float(ignore_iou),
        )
        assert labels is not None
        window_data = build_windows(
            rows,
            row_features,
            labels,
            window_length=int(window_length),
            window_stride=int(window_stride),
        )
        valid_gt, _ignore = load_gt(sequence_by_name[name].gt_path)
        rows_parts.append(rows)
        row_features_parts.append(row_features)
        row_labels_parts.append(labels)
        windows.append(window_data)
        gt_counts.append(int(len(valid_gt)))
        assert window_data.labels is not None
        stats[name] = {
            "rows": int(len(rows)),
            "positive_rows": int(np.sum(labels == 1)),
            "windows": int(len(window_data.features)),
            "positive_windows": int(np.sum(window_data.labels == 1)),
        }
        print(
            f"{name}: rows={len(rows)} windows={len(window_data.features)} "
            f"positive_windows={stats[name]['positive_windows']}",
            flush=True,
        )

    oof_row_scores: list[np.ndarray] = []
    oof_history: dict[str, list[float]] = {}
    for validation_id, validation_name in enumerate(names):
        train_features = np.concatenate(
            [
                window.features
                for index, window in enumerate(windows)
                if index != validation_id
            ]
        ).astype(np.float32)
        train_labels = np.concatenate(
            [
                window.labels
                for index, window in enumerate(windows)
                if index != validation_id
            ]
        ).astype(np.float32)
        train_gains = np.concatenate(
            [
                window.gains
                for index, window in enumerate(windows)
                if index != validation_id
            ]
        ).astype(np.int16)
        train_ids = np.concatenate(
            [
                np.full(
                    (len(window.features),),
                    index,
                    dtype=np.int16,
                )
                for index, window in enumerate(windows)
                if index != validation_id
            ]
        )
        inner = _fit_model(
            train_features,
            train_labels,
            train_gains,
            train_ids,
            device=resolved_device,
            hidden_dim=int(hidden_dim),
            epochs=int(epochs),
            batch_size=int(batch_size),
            learning_rate=float(learning_rate),
            weight_decay=float(weight_decay),
            seed=int(seed + validation_id + 1),
        )
        inner["metadata"] = {
            "input_dim": len(WINDOW_FEATURE_NAMES),
            "hidden_dim": int(hidden_dim),
        }
        window_scores = _predict_windows(
            inner,
            windows[validation_id].features,
            device=resolved_device,
            batch_size=int(batch_size),
        )
        oof_row_scores.append(
            _window_to_row_scores(
                len(rows_parts[validation_id]),
                windows[validation_id].members,
                window_scores,
            )
        )
        oof_history[validation_name] = inner["history"]
        print(
            f"inner holdout {validation_name}: "
            f"windows={len(window_scores)} score_mean={np.mean(window_scores):.4f}",
            flush=True,
        )

    base_iou_index = FEATURE_NAMES.index("base_max_iou")
    eligible = [
        row_features[:, base_iou_index] < float(base_duplicate_iou)
        for row_features in row_features_parts
    ]
    threshold_selection = _select_oof_threshold(
        row_labels_parts,
        oof_row_scores,
        eligible,
        gt_counts,
    )
    final_features = np.concatenate(
        [window.features for window in windows]
    ).astype(np.float32)
    final_labels = np.concatenate(
        [window.labels for window in windows]
    ).astype(np.float32)
    final_gains = np.concatenate(
        [window.gains for window in windows]
    ).astype(np.int16)
    final_ids = np.concatenate(
        [
            np.full((len(window.features),), index, dtype=np.int16)
            for index, window in enumerate(windows)
        ]
    )
    final = _fit_model(
        final_features,
        final_labels,
        final_gains,
        final_ids,
        device=resolved_device,
        hidden_dim=int(hidden_dim),
        epochs=int(epochs),
        batch_size=int(batch_size),
        learning_rate=float(learning_rate),
        weight_decay=float(weight_decay),
        seed=int(seed),
    )
    metadata = {
        "kind": "neural_rescue_window_selector",
        "base_tracker_dir": str(_tracker_root(base_tracker_dir)),
        "rescue_tracker_dir": str(_tracker_root(rescue_tracker_dir)),
        "train_sequences": names,
        "selected_feature_names": list(SELECTED_FEATURE_NAMES),
        "window_feature_names": list(WINDOW_FEATURE_NAMES),
        "input_dim": len(WINDOW_FEATURE_NAMES),
        "hidden_dim": int(hidden_dim),
        "match_iou": float(match_iou),
        "ignore_iou": float(ignore_iou),
        "window_length": int(window_length),
        "window_stride": int(window_stride),
        "base_duplicate_iou": float(base_duplicate_iou),
        "epochs": int(epochs),
        "batch_size": int(batch_size),
        "learning_rate": float(learning_rate),
        "weight_decay": float(weight_decay),
        "seed": int(seed),
        "device": resolved_device,
        "sequence_stats": stats,
        "oof_history": oof_history,
        "final_history": final["history"],
        "threshold_selection": threshold_selection,
        "threshold_source": "inner_sequence_loso_oof_worst_then_macro",
        "within_sequence_percentile_calibration": True,
        "no_heldout_gt": True,
        "no_yolo_inference": True,
        "learned_complementary_postprocess": True,
    }
    return {
        "state_dict": final["state_dict"],
        "mean": final["mean"],
        "scale": final["scale"],
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


def apply_neural_rescue_window_selector(
    *,
    model_path: str | Path,
    base_tracker_dir: str | Path,
    rescue_tracker_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    device: str = "mps",
    threshold: float | None = None,
    batch_size: int = 4096,
    min_run: int = 2,
    nms_iou: float = 0.70,
    overwrite: bool = False,
) -> Path:
    payload = torch.load(
        Path(model_path).expanduser().resolve(),
        map_location="cpu",
        weights_only=False,
    )
    metadata = dict(payload["metadata"])
    if metadata.get("kind") != "neural_rescue_window_selector":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    selected_threshold = (
        float(threshold)
        if threshold is not None
        else float(metadata["threshold_selection"]["threshold"])
    )
    resolved_device = _resolve_device(device)
    base_root = _tracker_root(base_tracker_dir)
    rescue_root = _tracker_root(rescue_tracker_dir)
    target = Path(target_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    output_stats: dict[str, dict] = {}
    base_iou_index = FEATURE_NAMES.index("base_max_iou")

    for name in [str(value) for value in sequence_names]:
        output_path = target / f"{name}.txt"
        if output_path.exists() and not overwrite:
            continue
        base_rows = _load_rows(base_root / f"{name}.txt")
        rescue_rows, row_features, _labels = extract_rescue_rows(
            base_tracker_dir=base_root,
            rescue_tracker_dir=rescue_root,
            sequence=sequence_by_name[name],
            with_labels=False,
            match_iou=float(metadata["match_iou"]),
            ignore_iou=float(metadata["ignore_iou"]),
        )
        windows = build_windows(
            rescue_rows,
            row_features,
            None,
            window_length=int(metadata["window_length"]),
            window_stride=int(metadata["window_stride"]),
        )
        window_scores = _predict_windows(
            payload,
            windows.features,
            device=resolved_device,
            batch_size=int(batch_size),
        )
        row_scores = _window_to_row_scores(
            len(rescue_rows), windows.members, window_scores
        )
        selected = (
            (row_scores >= selected_threshold)
            & (
                row_features[:, base_iou_index]
                < float(metadata["base_duplicate_iou"])
            )
        )
        selected = _minimum_run_mask(
            rescue_rows, selected, int(min_run)
        )

        keep: list[int] = []
        frames = rescue_rows[:, 0].astype(np.int64)
        for frame in np.unique(frames[selected]):
            indices = np.flatnonzero((frames == int(frame)) & selected)
            indices = indices[np.argsort(-row_scores[indices])]
            frame_keep: list[int] = []
            for index in indices:
                if frame_keep:
                    iou = pairwise_iou_xyxy(
                        _xywh_to_xyxy(rescue_rows[index : index + 1, 2:6]),
                        _xywh_to_xyxy(rescue_rows[frame_keep, 2:6]),
                    )
                    if float(np.max(iou)) >= float(nms_iou):
                        continue
                frame_keep.append(int(index))
            keep.extend(frame_keep)
        keep = sorted(
            keep,
            key=lambda index: (
                rescue_rows[index, 0],
                rescue_rows[index, 1],
            ),
        )
        base_max_id = max(
            [int(value) for value in base_rows[:, 1].tolist()],
            default=0,
        )
        kept_track_ids = sorted(
            set(int(rescue_rows[index, 1]) for index in keep)
        )
        id_map = {
            track_id: base_max_id + position
            for position, track_id in enumerate(kept_track_ids, start=1)
        }
        output_rows = [
            (
                int(row[0]),
                int(row[1]),
                float(row[2]),
                float(row[3]),
                float(row[4]),
                float(row[5]),
                float(row[6]),
            )
            for row in base_rows
        ]
        output_rows.extend(
            (
                int(rescue_rows[index, 0]),
                int(id_map[int(rescue_rows[index, 1])]),
                float(rescue_rows[index, 2]),
                float(rescue_rows[index, 3]),
                float(rescue_rows[index, 4]),
                float(rescue_rows[index, 5]),
                float(row_scores[index]),
            )
            for index in keep
        )
        write_mot_rows(output_path, output_rows)
        output_stats[name] = {
            "base_rows": int(len(base_rows)),
            "rescue_rows": int(len(rescue_rows)),
            "windows": int(len(windows.features)),
            "threshold_rows": int(
                np.sum(row_scores >= selected_threshold)
            ),
            "added_rows": int(len(keep)),
            "added_tracks": int(len(kept_track_ids)),
            "output_rows": int(len(output_rows)),
        }
        print(
            f"{name}: {len(base_rows)} + {len(keep)} "
            f"tracks={len(kept_track_ids)}",
            flush=True,
        )

    (target / "neural_rescue_window_metadata.json").write_text(
        json.dumps(
            {
                "kind": "neural_rescue_window_tracks",
                "base_tracker": str(base_root),
                "rescue_tracker": str(rescue_root),
                "model": str(Path(model_path).expanduser().resolve()),
                "model_metadata": metadata,
                "device": resolved_device,
                "threshold": selected_threshold,
                "min_run": int(min_run),
                "nms_iou": float(nms_iou),
                "stats": output_stats,
                "no_heldout_gt": True,
                "no_yolo_inference": True,
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    return target
