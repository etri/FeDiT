from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from scipy.optimize import linear_sum_assignment
from sklearn.metrics import average_precision_score
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from mot20_io import (
    SequenceInfo,
    gt_to_xyxy,
    load_gt,
    read_mot_rows,
    write_mot_rows,
)
from neural_vlm_conditioner import _resolve_device
from nms import pairwise_iou_xyxy


FEATURE_NAMES = (
    "track_length_log",
    "track_span_log",
    "track_density",
    "track_score_mean",
    "track_score_median",
    "track_score_max",
    "track_score_min",
    "track_score_std",
    "track_height_cv",
    "track_area_cv",
    "track_motion_per_h",
    "track_jitter_per_h",
    "row_score",
    "row_score_minus_mean",
    "track_progress",
    "track_edge_proximity",
    "row_aspect_over_median_log",
    "row_height_over_median_log",
    "previous_iou",
    "next_iou",
    "previous_motion_per_h",
    "next_motion_per_h",
    "previous_frame_gap_log",
    "next_frame_gap_log",
    "base_max_iou",
    "base_score_at_max_iou",
    "base_overlap_log_iou010",
    "base_overlap_log_iou030",
    "base_overlap_log_iou050",
    "base_center_distance_h",
    "base_count_log",
    "frame_score_rank",
    "frame_max_higher_score_iou",
    "frame_neighbor_log_iou030",
)


class NeuralRescueSegmentSelector(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 96) -> None:
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
            nn.Linear(hidden_dim, 1),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return self.network(features).squeeze(1)


def _tracker_root(path: str | Path) -> Path:
    root = Path(path).expanduser().resolve()
    return root / "data" if (root / "data").exists() else root


def _load_rows(path: Path) -> np.ndarray:
    return np.asarray(
        [row[:7] for row in read_mot_rows(path)],
        dtype=np.float32,
    ).reshape((-1, 7))


def _xywh_to_xyxy(boxes: np.ndarray) -> np.ndarray:
    output = boxes.astype(np.float32).copy()
    output[:, 2] += output[:, 0]
    output[:, 3] += output[:, 1]
    return output


def _indices_by_value(values: np.ndarray) -> dict[int, np.ndarray]:
    if not len(values):
        return {}
    order = np.argsort(values, kind="stable")
    sorted_values = values[order]
    boundaries = np.flatnonzero(
        np.r_[True, sorted_values[1:] != sorted_values[:-1], True]
    )
    return {
        int(sorted_values[start]): order[start:end]
        for start, end in zip(boundaries[:-1], boundaries[1:], strict=True)
    }


def _track_and_temporal_features(rows: np.ndarray) -> np.ndarray:
    output = np.zeros((len(rows), 24), dtype=np.float32)
    track_ids = rows[:, 1].astype(np.int64)
    for _track_id, indices in _indices_by_value(track_ids).items():
        indices = indices[np.argsort(rows[indices, 0], kind="stable")]
        track = rows[indices]
        frames = track[:, 0]
        boxes = track[:, 2:6]
        scores = track[:, 6]
        heights = np.maximum(boxes[:, 3], 1.0)
        areas = np.maximum(boxes[:, 2] * boxes[:, 3], 1.0)
        centers = boxes[:, :2] + 0.5 * boxes[:, 2:]
        span = max(float(frames[-1] - frames[0] + 1.0), 1.0)
        frame_delta = np.maximum(np.diff(frames), 1.0)
        mean_height = np.maximum(
            0.5 * (heights[:-1] + heights[1:]), 1.0
        )
        velocity = (
            np.linalg.norm(np.diff(centers, axis=0), axis=1)
            / (frame_delta * mean_height)
            if len(track) > 1
            else np.zeros((0,), dtype=np.float32)
        )
        jitter = (
            np.abs(np.diff(velocity))
            if len(velocity) > 1
            else np.zeros((0,), dtype=np.float32)
        )
        aspect = boxes[:, 3] / np.maximum(boxes[:, 2], 1.0)
        global_values = np.asarray(
            [
                np.log1p(len(track)),
                np.log1p(span),
                len(track) / span,
                np.mean(scores),
                np.median(scores),
                np.max(scores),
                np.min(scores),
                np.std(scores),
                np.std(heights) / max(float(np.mean(heights)), 1.0),
                np.std(areas) / max(float(np.mean(areas)), 1.0),
                np.mean(velocity) if len(velocity) else 0.0,
                np.mean(jitter) if len(jitter) else 0.0,
            ],
            dtype=np.float32,
        )
        output[indices, :12] = global_values
        median_aspect = max(float(np.median(aspect)), 1.0e-4)
        median_height = max(float(np.median(heights)), 1.0)
        for position, absolute_index in enumerate(indices):
            previous_iou = next_iou = 0.0
            previous_motion = next_motion = 0.0
            previous_gap = next_gap = 0.0
            current_box = _xywh_to_xyxy(
                rows[absolute_index : absolute_index + 1, 2:6]
            )
            if position > 0:
                previous_index = indices[position - 1]
                previous_box = _xywh_to_xyxy(
                    rows[previous_index : previous_index + 1, 2:6]
                )
                previous_iou = float(
                    pairwise_iou_xyxy(current_box, previous_box)[0, 0]
                )
                delta = max(
                    float(rows[absolute_index, 0] - rows[previous_index, 0]),
                    1.0,
                )
                previous_motion = float(
                    np.linalg.norm(
                        centers[position] - centers[position - 1]
                    )
                    / (delta * max(float(heights[position]), 1.0))
                )
                previous_gap = float(np.log1p(delta - 1.0))
            if position + 1 < len(indices):
                next_index = indices[position + 1]
                next_box = _xywh_to_xyxy(
                    rows[next_index : next_index + 1, 2:6]
                )
                next_iou = float(
                    pairwise_iou_xyxy(current_box, next_box)[0, 0]
                )
                delta = max(
                    float(rows[next_index, 0] - rows[absolute_index, 0]),
                    1.0,
                )
                next_motion = float(
                    np.linalg.norm(
                        centers[position + 1] - centers[position]
                    )
                    / (delta * max(float(heights[position]), 1.0))
                )
                next_gap = float(np.log1p(delta - 1.0))
            progress = float(position / max(len(indices) - 1, 1))
            output[absolute_index, 12:24] = np.asarray(
                [
                    rows[absolute_index, 6],
                    rows[absolute_index, 6] - global_values[3],
                    progress,
                    min(progress, 1.0 - progress),
                    np.log(max(float(aspect[position]), 1.0e-4))
                    - np.log(median_aspect),
                    np.log(max(float(heights[position]), 1.0))
                    - np.log(median_height),
                    previous_iou,
                    next_iou,
                    previous_motion,
                    next_motion,
                    previous_gap,
                    next_gap,
                ],
                dtype=np.float32,
            )
    return output


def _frame_relation_features(
    rescue_rows: np.ndarray,
    base_rows: np.ndarray,
) -> np.ndarray:
    output = np.zeros((len(rescue_rows), 10), dtype=np.float32)
    output[:, 5] = 10.0
    rescue_frames = rescue_rows[:, 0].astype(np.int64)
    base_frames = base_rows[:, 0].astype(np.int64)
    rescue_by_frame = _indices_by_value(rescue_frames)
    base_by_frame = _indices_by_value(base_frames)
    for frame, rescue_indices in rescue_by_frame.items():
        rescue_boxes = _xywh_to_xyxy(rescue_rows[rescue_indices, 2:6])
        rescue_scores = rescue_rows[rescue_indices, 6]
        base_indices = base_by_frame.get(
            int(frame), np.zeros((0,), dtype=np.int64)
        )
        if len(base_indices):
            base_boxes = _xywh_to_xyxy(base_rows[base_indices, 2:6])
            base_scores = base_rows[base_indices, 6]
            iou = pairwise_iou_xyxy(rescue_boxes, base_boxes)
            best = np.argmax(iou, axis=1)
            output[rescue_indices, 0] = iou[
                np.arange(len(rescue_indices)), best
            ]
            output[rescue_indices, 1] = base_scores[best]
            denominator = max(float(np.log1p(len(base_indices))), 1.0)
            for offset, threshold in enumerate((0.10, 0.30, 0.50)):
                output[rescue_indices, 2 + offset] = (
                    np.log1p(np.sum(iou >= threshold, axis=1)) / denominator
                )
            rescue_centers = 0.5 * (
                rescue_boxes[:, :2] + rescue_boxes[:, 2:]
            )
            base_centers = 0.5 * (
                base_boxes[:, :2] + base_boxes[:, 2:]
            )
            heights = np.maximum(
                rescue_boxes[:, 3] - rescue_boxes[:, 1], 1.0
            )
            center_distance = np.linalg.norm(
                rescue_centers[:, None, :] - base_centers[None, :, :],
                axis=2,
            ) / heights[:, None]
            output[rescue_indices, 5] = np.min(center_distance, axis=1)
            output[rescue_indices, 6] = np.log1p(len(base_indices))
        order = np.argsort(-rescue_scores)
        ranks = np.empty((len(order),), dtype=np.float32)
        ranks[order] = np.arange(len(order), dtype=np.float32)
        output[rescue_indices, 7] = 1.0 - ranks / max(len(order) - 1, 1)
        if len(rescue_indices) > 1:
            rescue_iou = pairwise_iou_xyxy(rescue_boxes, rescue_boxes)
            np.fill_diagonal(rescue_iou, 0.0)
            higher = rescue_scores[None, :] > (
                rescue_scores[:, None] + 1.0e-6
            )
            output[rescue_indices, 8] = np.max(
                np.where(higher, rescue_iou, 0.0), axis=1
            )
            output[rescue_indices, 9] = (
                np.log1p(np.sum(rescue_iou >= 0.30, axis=1))
                / max(float(np.log1p(len(rescue_indices) - 1)), 1.0)
            )
    return output


def _utility_labels(
    rescue_rows: np.ndarray,
    base_rows: np.ndarray,
    sequence: SequenceInfo,
    *,
    match_iou: float,
    ignore_iou: float,
) -> np.ndarray:
    labels = np.zeros((len(rescue_rows),), dtype=np.int8)
    valid_gt, ignore_gt = load_gt(sequence.gt_path)
    valid_by_frame = {
        int(frame): rows for frame, rows in valid_gt.groupby("frame")
    }
    ignore_by_frame = {
        int(frame): rows for frame, rows in ignore_gt.groupby("frame")
    }
    rescue_frames = rescue_rows[:, 0].astype(np.int64)
    base_frames = base_rows[:, 0].astype(np.int64)
    rescue_by_frame = _indices_by_value(rescue_frames)
    base_by_frame = _indices_by_value(base_frames)
    for frame, rescue_indices in rescue_by_frame.items():
        rescue_boxes = _xywh_to_xyxy(rescue_rows[rescue_indices, 2:6])
        gt_frame = valid_by_frame.get(int(frame))
        if gt_frame is None or len(gt_frame) == 0:
            ignore_frame = ignore_by_frame.get(int(frame))
            if ignore_frame is not None and len(ignore_frame):
                iou = pairwise_iou_xyxy(
                    rescue_boxes, gt_to_xyxy(ignore_frame)
                )
                labels[
                    rescue_indices[np.max(iou, axis=1) >= float(ignore_iou)]
                ] = -1
            continue
        gt_boxes = gt_to_xyxy(gt_frame).astype(np.float32)
        unmatched = np.ones((len(gt_boxes),), dtype=bool)
        base_indices = base_by_frame.get(
            int(frame), np.zeros((0,), dtype=np.int64)
        )
        if len(base_indices):
            base_iou = pairwise_iou_xyxy(
                gt_boxes, _xywh_to_xyxy(base_rows[base_indices, 2:6])
            )
            gt_rows, base_columns = linear_sum_assignment(1.0 - base_iou)
            accepted = base_iou[gt_rows, base_columns] >= float(match_iou)
            unmatched[gt_rows[accepted]] = False
        available_gt = np.flatnonzero(unmatched)
        matched_rescue = np.zeros((len(rescue_indices),), dtype=bool)
        if len(available_gt):
            rescue_iou = pairwise_iou_xyxy(
                gt_boxes[available_gt], rescue_boxes
            )
            gt_rows, rescue_columns = linear_sum_assignment(1.0 - rescue_iou)
            accepted = rescue_iou[gt_rows, rescue_columns] >= float(match_iou)
            accepted_columns = rescue_columns[accepted]
            labels[rescue_indices[accepted_columns]] = 1
            matched_rescue[accepted_columns] = True
        ignore_frame = ignore_by_frame.get(int(frame))
        if ignore_frame is not None and len(ignore_frame):
            ignore_overlap = pairwise_iou_xyxy(
                rescue_boxes, gt_to_xyxy(ignore_frame).astype(np.float32)
            )
            ignored = np.max(ignore_overlap, axis=1) >= float(ignore_iou)
            labels[rescue_indices[ignored & ~matched_rescue]] = -1
    return labels


def extract_rescue_rows(
    *,
    base_tracker_dir: str | Path,
    rescue_tracker_dir: str | Path,
    sequence: SequenceInfo,
    with_labels: bool,
    match_iou: float = 0.1,
    ignore_iou: float = 0.5,
) -> tuple[np.ndarray, np.ndarray, np.ndarray | None]:
    base_rows = _load_rows(
        _tracker_root(base_tracker_dir) / f"{sequence.name}.txt"
    )
    rescue_rows = _load_rows(
        _tracker_root(rescue_tracker_dir) / f"{sequence.name}.txt"
    )
    features = np.concatenate(
        [
            _track_and_temporal_features(rescue_rows),
            _frame_relation_features(rescue_rows, base_rows),
        ],
        axis=1,
    ).astype(np.float32)
    labels = (
        _utility_labels(
            rescue_rows,
            base_rows,
            sequence,
            match_iou=float(match_iou),
            ignore_iou=float(ignore_iou),
        )
        if with_labels
        else None
    )
    return rescue_rows, features, labels


def _predict(
    model: NeuralRescueSegmentSelector,
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
            tensor = torch.from_numpy(
                ((features[start:end] - mean) / scale).astype(np.float32)
            ).to(device)
            output[start:end] = torch.sigmoid(model(tensor)).cpu().numpy()
    return output


def _select_threshold(
    labels: np.ndarray,
    scores: np.ndarray,
    sequence_ids: np.ndarray,
    gt_counts: dict[int, int],
) -> dict:
    candidates = np.unique(
        np.quantile(scores, np.linspace(0.0, 1.0, 301))
    )
    best_objective = None
    best_stats = None
    for threshold in candidates:
        selected = scores >= float(threshold)
        sequence_delta: list[float] = []
        for sequence_id, gt_count in sorted(gt_counts.items()):
            mask = selected & (sequence_ids == int(sequence_id))
            tp = int(np.sum(labels[mask] == 1))
            fp = int(np.sum(labels[mask] == 0))
            sequence_delta.append((tp - fp) / max(gt_count, 1))
        tp = int(np.sum(labels[selected] == 1))
        fp = int(np.sum(labels[selected] == 0))
        precision = float(tp / max(tp + fp, 1))
        objective = (
            float(np.mean(sequence_delta)),
            float(np.min(sequence_delta)),
            precision,
            float(threshold),
        )
        if best_objective is None or objective > best_objective:
            best_objective = objective
            best_stats = {
                "threshold": float(threshold),
                "estimated_macro_mota_delta": float(
                    100.0 * np.mean(sequence_delta)
                ),
                "estimated_sequence_mota_delta": [
                    float(100.0 * value) for value in sequence_delta
                ],
                "tp": tp,
                "fp": fp,
                "estimated_gain": tp - fp,
                "precision": precision,
                "selected_rows": int(np.sum(selected)),
            }
    assert best_stats is not None
    return best_stats


def train_neural_rescue_segment_selector(
    *,
    base_tracker_dir: str | Path,
    rescue_tracker_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    device: str = "mps",
    match_iou: float = 0.1,
    ignore_iou: float = 0.5,
    hidden_dim: int = 96,
    epochs: int = 25,
    batch_size: int = 8192,
    learning_rate: float = 0.001,
    weight_decay: float = 0.003,
    validation_fraction: float = 0.20,
    seed: int = 20260740,
) -> dict:
    names = [str(value) for value in train_sequences]
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    rng = np.random.default_rng(int(seed))
    train_x: list[np.ndarray] = []
    train_y: list[np.ndarray] = []
    validation_x: list[np.ndarray] = []
    validation_y: list[np.ndarray] = []
    validation_sequence_ids: list[np.ndarray] = []
    gt_counts: dict[int, int] = {}
    stats: dict[str, dict] = {}
    for sequence_id, name in enumerate(names):
        rows, features, labels = extract_rescue_rows(
            base_tracker_dir=base_tracker_dir,
            rescue_tracker_dir=rescue_tracker_dir,
            sequence=sequence_by_name[name],
            with_labels=True,
            match_iou=float(match_iou),
            ignore_iou=float(ignore_iou),
        )
        assert labels is not None
        valid = labels >= 0
        rows = rows[valid]
        features = features[valid]
        labels = labels[valid].astype(np.float32)
        track_ids = rows[:, 1].astype(np.int64)
        unique_tracks = np.unique(track_ids)
        validation_count = max(
            1, int(round(len(unique_tracks) * float(validation_fraction)))
        )
        validation_tracks = set(
            int(value)
            for value in rng.choice(
                unique_tracks, size=validation_count, replace=False
            )
        )
        validation_mask = np.asarray(
            [int(track_id) in validation_tracks for track_id in track_ids],
            dtype=bool,
        )
        train_x.append(features[~validation_mask])
        train_y.append(labels[~validation_mask])
        validation_x.append(features[validation_mask])
        validation_y.append(labels[validation_mask])
        validation_sequence_ids.append(
            np.full(
                (int(np.sum(validation_mask)),),
                sequence_id,
                dtype=np.int16,
            )
        )
        valid_gt, _ignore = load_gt(sequence_by_name[name].gt_path)
        gt_counts[sequence_id] = int(len(valid_gt))
        stats[name] = {
            "rows": int(len(labels)),
            "positive_rows": int(np.sum(labels == 1)),
            "negative_rows": int(np.sum(labels == 0)),
            "tracks": int(len(unique_tracks)),
            "validation_tracks": int(validation_count),
        }
        print(
            f"{name}: rows={len(labels)} positive={stats[name]['positive_rows']} "
            f"tracks={len(unique_tracks)}",
            flush=True,
        )
    x_train = np.concatenate(train_x).astype(np.float32)
    y_train = np.concatenate(train_y).astype(np.float32)
    x_validation = np.concatenate(validation_x).astype(np.float32)
    y_validation = np.concatenate(validation_y).astype(np.float32)
    validation_ids = np.concatenate(validation_sequence_ids)
    mean = x_train.mean(axis=0, dtype=np.float64).astype(np.float32)
    scale = np.maximum(
        x_train.std(axis=0, dtype=np.float64).astype(np.float32), 1.0e-4
    )
    normalized = ((x_train - mean) / scale).astype(np.float32)
    positive = max(int(np.sum(y_train == 1)), 1)
    negative = max(int(np.sum(y_train == 0)), 1)
    weights = np.where(
        y_train == 1,
        len(y_train) / (2.0 * positive),
        len(y_train) / (2.0 * negative),
    ).astype(np.float32)
    resolved_device = _resolve_device(device)
    torch.manual_seed(int(seed))
    model = NeuralRescueSegmentSelector(
        len(FEATURE_NAMES), int(hidden_dim)
    ).to(resolved_device)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=float(learning_rate),
        weight_decay=float(weight_decay),
    )
    loader = DataLoader(
        TensorDataset(
            torch.from_numpy(normalized),
            torch.from_numpy(y_train),
            torch.from_numpy(weights),
        ),
        batch_size=int(batch_size),
        shuffle=True,
        generator=torch.Generator().manual_seed(int(seed)),
        num_workers=0,
    )
    best_ap = -1.0
    best_state = None
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
            loss = (
                nn.functional.binary_cross_entropy_with_logits(
                    model(batch_x), batch_y, reduction="none"
                )
                * batch_weight
            ).mean()
            loss.backward()
            optimizer.step()
            total_loss += float(loss.detach().cpu()) * len(batch_x)
            count += len(batch_x)
        validation_scores = _predict(
            model,
            x_validation,
            mean=mean,
            scale=scale,
            device=resolved_device,
            batch_size=int(batch_size),
        )
        ap = float(average_precision_score(y_validation, validation_scores))
        history.append(
            {
                "epoch": epoch,
                "train_loss": total_loss / max(count, 1),
                "validation_average_precision": ap,
            }
        )
        print(
            f"epoch {epoch}: loss={history[-1]['train_loss']:.6f} "
            f"AP={ap:.6f}",
            flush=True,
        )
        if ap >= best_ap:
            best_ap = ap
            best_state = {
                key: value.detach().cpu().clone()
                for key, value in model.state_dict().items()
            }
    if best_state is None:
        raise RuntimeError("No neural rescue segment checkpoint was produced")
    model.load_state_dict(best_state)
    validation_scores = _predict(
        model,
        x_validation,
        mean=mean,
        scale=scale,
        device=resolved_device,
        batch_size=int(batch_size),
    )
    threshold_selection = _select_threshold(
        y_validation,
        validation_scores,
        validation_ids,
        gt_counts,
    )
    metadata = {
        "kind": "neural_rescue_segment_selector",
        "base_tracker_dir": str(_tracker_root(base_tracker_dir)),
        "rescue_tracker_dir": str(_tracker_root(rescue_tracker_dir)),
        "train_sequences": names,
        "feature_names": list(FEATURE_NAMES),
        "input_dim": len(FEATURE_NAMES),
        "hidden_dim": int(hidden_dim),
        "device": resolved_device,
        "match_iou": float(match_iou),
        "ignore_iou": float(ignore_iou),
        "epochs": int(epochs),
        "batch_size": int(batch_size),
        "learning_rate": float(learning_rate),
        "weight_decay": float(weight_decay),
        "validation_fraction": float(validation_fraction),
        "seed": int(seed),
        "history": history,
        "sequence_stats": stats,
        "threshold_selection": threshold_selection,
        "no_heldout_gt": True,
        "no_yolo_inference": True,
        "learned_complementary_postprocess": True,
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


def _minimum_run_mask(
    rows: np.ndarray,
    selected: np.ndarray,
    min_run: int,
) -> np.ndarray:
    if int(min_run) <= 1:
        return selected
    output = np.zeros_like(selected)
    track_ids = rows[:, 1].astype(np.int64)
    for track_id in np.unique(track_ids[selected]):
        indices = np.flatnonzero(
            (track_ids == int(track_id)) & selected
        )
        indices = indices[np.argsort(rows[indices, 0], kind="stable")]
        if not len(indices):
            continue
        run_start = 0
        for position in range(1, len(indices) + 1):
            ended = (
                position == len(indices)
                or int(rows[indices[position], 0])
                != int(rows[indices[position - 1], 0]) + 1
            )
            if ended:
                run = indices[run_start:position]
                if len(run) >= int(min_run):
                    output[run] = True
                run_start = position
    return output


def apply_neural_rescue_segment_selector(
    *,
    model_path: str | Path,
    base_tracker_dir: str | Path,
    rescue_tracker_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    device: str = "mps",
    threshold: float | None = None,
    batch_size: int = 8192,
    min_run: int = 2,
    nms_iou: float = 0.7,
    max_row_fraction: float | None = None,
    overwrite: bool = False,
) -> Path:
    payload = torch.load(
        Path(model_path).expanduser().resolve(),
        map_location="cpu",
        weights_only=False,
    )
    metadata = dict(payload["metadata"])
    if metadata.get("kind") != "neural_rescue_segment_selector":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    resolved_device = _resolve_device(device)
    model = NeuralRescueSegmentSelector(
        int(metadata["input_dim"]), int(metadata["hidden_dim"])
    ).to(resolved_device)
    model.load_state_dict(payload["state_dict"])
    selected_threshold = (
        float(threshold)
        if threshold is not None
        else float(metadata["threshold_selection"]["threshold"])
    )
    base_root = _tracker_root(base_tracker_dir)
    rescue_root = _tracker_root(rescue_tracker_dir)
    target = Path(target_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    output_stats: dict[str, dict] = {}
    for name in [str(value) for value in sequence_names]:
        output_path = target / f"{name}.txt"
        if output_path.exists() and not overwrite:
            continue
        base_rows = _load_rows(base_root / f"{name}.txt")
        rescue_rows, features, _labels = extract_rescue_rows(
            base_tracker_dir=base_root,
            rescue_tracker_dir=rescue_root,
            sequence=sequence_by_name[name],
            with_labels=False,
            match_iou=float(metadata["match_iou"]),
            ignore_iou=float(metadata["ignore_iou"]),
        )
        scores = _predict(
            model,
            features,
            mean=np.asarray(payload["mean"], dtype=np.float32),
            scale=np.asarray(payload["scale"], dtype=np.float32),
            device=resolved_device,
            batch_size=int(batch_size),
        )
        selected = scores >= selected_threshold
        if (
            max_row_fraction is not None
            and float(max_row_fraction) > 0.0
        ):
            cap = max(
                1,
                int(round(len(scores) * float(max_row_fraction))),
            )
            selected_indices = np.flatnonzero(selected)
            if len(selected_indices) > cap:
                keep_indices = selected_indices[
                    np.argsort(-scores[selected_indices])[:cap]
                ]
                selected[:] = False
                selected[keep_indices] = True
        selected = _minimum_run_mask(rescue_rows, selected, int(min_run))
        keep: list[int] = []
        frames = rescue_rows[:, 0].astype(np.int64)
        for frame in np.unique(frames[selected]):
            indices = np.flatnonzero((frames == int(frame)) & selected)
            indices = indices[np.argsort(-scores[indices])]
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
        keep = sorted(keep, key=lambda index: (rescue_rows[index, 0], rescue_rows[index, 1]))
        base_max_id = max(
            [int(value) for value in base_rows[:, 1].tolist()], default=0
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
                float(scores[index]),
            )
            for index in keep
        )
        write_mot_rows(output_path, output_rows)
        output_stats[name] = {
            "base_rows": int(len(base_rows)),
            "rescue_rows": int(len(rescue_rows)),
            "threshold_rows": int(np.sum(scores >= selected_threshold)),
            "added_rows": int(len(keep)),
            "added_tracks": int(len(kept_track_ids)),
            "output_rows": int(len(output_rows)),
        }
        print(
            f"{name}: {len(base_rows)} + {len(keep)} "
            f"tracks={len(kept_track_ids)}",
            flush=True,
        )
    (target / "neural_rescue_segment_metadata.json").write_text(
        json.dumps(
            {
                "kind": "neural_rescue_segment_tracks",
                "base_tracker": str(base_root),
                "rescue_tracker": str(rescue_root),
                "model": str(Path(model_path).expanduser().resolve()),
                "model_metadata": metadata,
                "device": resolved_device,
                "threshold": selected_threshold,
                "min_run": int(min_run),
                "nms_iou": float(nms_iou),
                "max_row_fraction": max_row_fraction,
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
