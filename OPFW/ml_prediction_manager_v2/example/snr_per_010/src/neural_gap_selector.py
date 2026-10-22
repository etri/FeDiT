from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from scipy.optimize import linear_sum_assignment
from sklearn.metrics import average_precision_score
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from detection_io import load_detections
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
    "gap_log",
    "alpha",
    "edge_proximity",
    "track_length_log",
    "track_density",
    "track_progress",
    "left_score",
    "right_score",
    "endpoint_score_min",
    "endpoint_score_max",
    "velocity_x_per_h",
    "velocity_y_per_h",
    "log_width_velocity",
    "log_height_velocity",
    "endpoint_iou",
    "predicted_aspect_log",
    "left_velocity_error",
    "right_velocity_error",
    "det_best_iou",
    "det_score_at_best_iou",
    "det_max_score_iou010",
    "det_max_score_iou030",
    "det_max_score_iou050",
    "det_overlap_log_iou010",
    "det_overlap_log_iou030",
    "det_overlap_log_iou050",
    "det_best_center_dist_h",
    "det_score_at_best_center",
)


class NeuralGapSelector(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 64) -> None:
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.10),
            nn.Linear(hidden_dim, hidden_dim),
            nn.GELU(),
            nn.Linear(hidden_dim, 1),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return self.network(features).squeeze(1)


def _tracker_root(path: str | Path) -> Path:
    root = Path(path).expanduser().resolve()
    return root / "data" if (root / "data").exists() else root


def _xywh_to_xyxy(boxes: np.ndarray) -> np.ndarray:
    output = boxes.astype(np.float32).copy()
    output[:, 2] += output[:, 0]
    output[:, 3] += output[:, 1]
    return output


def _xyxy_to_xywh(boxes: np.ndarray) -> np.ndarray:
    output = np.asarray(boxes, dtype=np.float32).copy()
    output[:, 2] -= output[:, 0]
    output[:, 3] -= output[:, 1]
    return output


def _box_iou(left: np.ndarray, right: np.ndarray) -> float:
    return float(
        pairwise_iou_xyxy(
            _xywh_to_xyxy(left[None, :]),
            _xywh_to_xyxy(right[None, :]),
        )[0, 0]
    )


def _local_velocity(
    first: np.ndarray,
    second: np.ndarray,
) -> np.ndarray:
    delta_frame = max(float(second[0] - first[0]), 1.0)
    first_center = first[2:4] + 0.5 * first[4:6]
    second_center = second[2:4] + 0.5 * second[4:6]
    normalizer = max(0.5 * float(first[5] + second[5]), 1.0)
    return (second_center - first_center) / (delta_frame * normalizer)


def _build_gap_candidates(
    rows: np.ndarray,
    *,
    min_track_length: int,
    max_gap: int,
    max_endpoint_extension: int = 0,
    sequence_length: int | None = None,
    image_width: int | None = None,
    image_height: int | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    candidate_rows: list[np.ndarray] = []
    base_features: list[np.ndarray] = []
    for track_id in np.unique(rows[:, 1].astype(np.int64)):
        track = rows[rows[:, 1].astype(np.int64) == int(track_id)]
        track = track[np.argsort(track[:, 0], kind="stable")]
        if len(track) <= int(min_track_length):
            continue
        span = max(float(track[-1, 0] - track[0, 0] + 1.0), 1.0)
        density = float(len(track) / span)
        for index in range(1, len(track)):
            left = track[index - 1]
            right = track[index]
            missing = int(right[0] - left[0] - 1)
            if missing <= 0 or missing > int(max_gap):
                continue
            endpoint_delta = max(float(right[0] - left[0]), 1.0)
            left_box = left[2:6]
            right_box = right[2:6]
            left_center = left_box[:2] + 0.5 * left_box[2:]
            right_center = right_box[:2] + 0.5 * right_box[2:]
            mean_height = max(0.5 * float(left_box[3] + right_box[3]), 1.0)
            gap_velocity = (right_center - left_center) / (
                endpoint_delta * mean_height
            )
            previous_velocity = (
                _local_velocity(track[index - 2], left)
                if index >= 2
                else gap_velocity
            )
            next_velocity = (
                _local_velocity(right, track[index + 1])
                if index + 1 < len(track)
                else gap_velocity
            )
            for step in range(1, missing + 1):
                alpha = float(step / endpoint_delta)
                box = (1.0 - alpha) * left_box + alpha * right_box
                if box[2] <= 0 or box[3] <= 0:
                    continue
                row = np.asarray(
                    [
                        left[0] + step,
                        track_id,
                        box[0],
                        box[1],
                        box[2],
                        box[3],
                        min(float(left[6]), float(right[6])),
                    ],
                    dtype=np.float32,
                )
                candidate_rows.append(row)
                base_features.append(
                    np.asarray(
                        [
                            np.log1p(missing),
                            alpha,
                            min(alpha, 1.0 - alpha),
                            np.log1p(len(track)),
                            density,
                            float(index / max(len(track) - 1, 1)),
                            float(left[6]),
                            float(right[6]),
                            min(float(left[6]), float(right[6])),
                            max(float(left[6]), float(right[6])),
                            gap_velocity[0],
                            gap_velocity[1],
                            np.log(max(float(right_box[2]), 1.0))
                            / endpoint_delta
                            - np.log(max(float(left_box[2]), 1.0))
                            / endpoint_delta,
                            np.log(max(float(right_box[3]), 1.0))
                            / endpoint_delta
                            - np.log(max(float(left_box[3]), 1.0))
                            / endpoint_delta,
                            _box_iou(left_box, right_box),
                            np.log(max(float(box[3] / max(box[2], 1.0)), 1.0e-4)),
                            float(np.linalg.norm(previous_velocity - gap_velocity)),
                            float(np.linalg.norm(next_velocity - gap_velocity)),
                        ],
                        dtype=np.float32,
                    )
                )

        if int(max_endpoint_extension) <= 0:
            continue
        if sequence_length is None or image_width is None or image_height is None:
            raise ValueError(
                "Sequence dimensions are required for endpoint candidates"
            )

        for direction in (-1, 1):
            if direction < 0:
                endpoint = track[0]
                neighbor = track[1]
                earlier = endpoint
                later = neighbor
                progress = 0.0
                alpha = 0.0
            else:
                endpoint = track[-1]
                neighbor = track[-2]
                earlier = neighbor
                later = endpoint
                progress = 1.0
                alpha = 1.0

            frame_delta = max(float(later[0] - earlier[0]), 1.0)
            earlier_box = earlier[2:6]
            later_box = later[2:6]
            endpoint_box = endpoint[2:6]
            box_velocity = (later_box - earlier_box) / frame_delta
            earlier_center = earlier_box[:2] + 0.5 * earlier_box[2:]
            later_center = later_box[:2] + 0.5 * later_box[2:]
            mean_height = max(
                0.5 * float(earlier_box[3] + later_box[3]),
                1.0,
            )
            center_velocity = (
                (later_center - earlier_center) / frame_delta / mean_height
            )
            width_velocity = (
                np.log(max(float(later_box[2]), 1.0))
                - np.log(max(float(earlier_box[2]), 1.0))
            ) / frame_delta
            height_velocity = (
                np.log(max(float(later_box[3]), 1.0))
                - np.log(max(float(earlier_box[3]), 1.0))
            ) / frame_delta
            endpoint_iou = _box_iou(earlier_box, later_box)
            endpoint_score = float(endpoint[6])
            neighbor_score = float(neighbor[6])

            for step in range(1, int(max_endpoint_extension) + 1):
                frame = int(endpoint[0]) + int(direction) * step
                if frame < 1 or frame > int(sequence_length):
                    break
                box = endpoint_box + float(direction * step) * box_velocity
                xyxy = _xywh_to_xyxy(box[None, :])[0]
                xyxy[[0, 2]] = np.clip(
                    xyxy[[0, 2]], 0.0, float(image_width)
                )
                xyxy[[1, 3]] = np.clip(
                    xyxy[[1, 3]], 0.0, float(image_height)
                )
                box = _xyxy_to_xywh(xyxy[None, :])[0]
                if box[2] <= 1.0 or box[3] <= 1.0:
                    break
                candidate_rows.append(
                    np.asarray(
                        [
                            frame,
                            track_id,
                            box[0],
                            box[1],
                            box[2],
                            box[3],
                            min(endpoint_score, neighbor_score),
                        ],
                        dtype=np.float32,
                    )
                )
                base_features.append(
                    np.asarray(
                        [
                            np.log1p(step),
                            alpha,
                            1.0 / float(step + 1),
                            np.log1p(len(track)),
                            density,
                            progress,
                            (
                                endpoint_score
                                if direction < 0
                                else neighbor_score
                            ),
                            (
                                neighbor_score
                                if direction < 0
                                else endpoint_score
                            ),
                            min(endpoint_score, neighbor_score),
                            max(endpoint_score, neighbor_score),
                            center_velocity[0],
                            center_velocity[1],
                            width_velocity,
                            height_velocity,
                            endpoint_iou,
                            np.log(
                                max(
                                    float(box[3] / max(box[2], 1.0)),
                                    1.0e-4,
                                )
                            ),
                            0.0,
                            0.0,
                        ],
                        dtype=np.float32,
                    )
                )
    if not candidate_rows:
        return (
            np.zeros((0, 7), dtype=np.float32),
            np.zeros((0, 18), dtype=np.float32),
        )
    return np.vstack(candidate_rows), np.vstack(base_features)


def _detection_support(
    candidate_rows: np.ndarray,
    detection_path: Path,
) -> np.ndarray:
    detections = load_detections(detection_path)
    by_frame = detections.by_frame()
    support = np.zeros((len(candidate_rows), 10), dtype=np.float32)
    support[:, 8] = 10.0
    candidate_frames = candidate_rows[:, 0].astype(np.int64)
    for frame in np.unique(candidate_frames):
        candidate_indices = np.flatnonzero(candidate_frames == int(frame))
        detection_indices = by_frame.get(
            int(frame), np.zeros((0,), dtype=np.int64)
        )
        if not len(detection_indices):
            continue
        candidate_boxes = _xywh_to_xyxy(candidate_rows[candidate_indices, 2:6])
        detection_boxes = detections.boxes[detection_indices].astype(np.float32)
        detection_scores = detections.calibrated_scores[
            detection_indices
        ].astype(np.float32)
        iou = pairwise_iou_xyxy(candidate_boxes, detection_boxes)
        best_iou_index = np.argmax(iou, axis=1)
        support[candidate_indices, 0] = iou[
            np.arange(len(candidate_indices)), best_iou_index
        ]
        support[candidate_indices, 1] = detection_scores[best_iou_index]
        denominator = max(float(np.log1p(len(detection_indices))), 1.0)
        for offset, threshold in enumerate((0.10, 0.30, 0.50)):
            overlap = iou >= float(threshold)
            support[candidate_indices, 2 + offset] = np.max(
                np.where(overlap, detection_scores[None, :], 0.0),
                axis=1,
            )
            support[candidate_indices, 5 + offset] = (
                np.log1p(np.sum(overlap, axis=1)) / denominator
            )
        candidate_centers = 0.5 * (
            candidate_boxes[:, :2] + candidate_boxes[:, 2:]
        )
        detection_centers = 0.5 * (
            detection_boxes[:, :2] + detection_boxes[:, 2:]
        )
        candidate_heights = np.maximum(
            candidate_boxes[:, 3] - candidate_boxes[:, 1], 1.0
        )
        center_distance = np.linalg.norm(
            candidate_centers[:, None, :] - detection_centers[None, :, :],
            axis=2,
        ) / candidate_heights[:, None]
        best_center_index = np.argmin(center_distance, axis=1)
        support[candidate_indices, 8] = center_distance[
            np.arange(len(candidate_indices)), best_center_index
        ]
        support[candidate_indices, 9] = detection_scores[best_center_index]
    return support


def _utility_labels(
    base_rows: np.ndarray,
    candidate_rows: np.ndarray,
    sequence: SequenceInfo,
    *,
    match_iou: float,
) -> np.ndarray:
    valid_gt, ignore_gt = load_gt(sequence.gt_path)
    valid_by_frame = {
        int(frame): rows for frame, rows in valid_gt.groupby("frame")
    }
    ignore_by_frame = {
        int(frame): rows for frame, rows in ignore_gt.groupby("frame")
    }
    base_frames = base_rows[:, 0].astype(np.int64)
    candidate_frames = candidate_rows[:, 0].astype(np.int64)
    labels = np.zeros((len(candidate_rows),), dtype=np.int8)
    for frame in np.unique(candidate_frames):
        candidate_indices = np.flatnonzero(candidate_frames == int(frame))
        gt_frame = valid_by_frame.get(int(frame))
        if gt_frame is None or len(gt_frame) == 0:
            ignore_frame = ignore_by_frame.get(int(frame))
            if ignore_frame is not None and len(ignore_frame):
                ignore_iou = pairwise_iou_xyxy(
                    _xywh_to_xyxy(candidate_rows[candidate_indices, 2:6]),
                    gt_to_xyxy(ignore_frame),
                )
                labels[candidate_indices[np.max(ignore_iou, axis=1) >= match_iou]] = -1
            continue
        gt_boxes = gt_to_xyxy(gt_frame).astype(np.float32)
        covered = np.zeros((len(gt_boxes),), dtype=bool)
        base_indices = np.flatnonzero(base_frames == int(frame))
        if len(base_indices):
            base_iou = pairwise_iou_xyxy(
                gt_boxes,
                _xywh_to_xyxy(base_rows[base_indices, 2:6]),
            )
            gt_rows, tracker_columns = linear_sum_assignment(1.0 - base_iou)
            covered[gt_rows[base_iou[gt_rows, tracker_columns] >= match_iou]] = True
        uncovered_indices = np.flatnonzero(~covered)
        candidate_boxes = _xywh_to_xyxy(candidate_rows[candidate_indices, 2:6])
        if len(uncovered_indices):
            utility_iou = pairwise_iou_xyxy(
                gt_boxes[uncovered_indices], candidate_boxes
            )
            gt_rows, candidate_columns = linear_sum_assignment(1.0 - utility_iou)
            accepted = utility_iou[gt_rows, candidate_columns] >= match_iou
            labels[candidate_indices[candidate_columns[accepted]]] = 1
        ignore_frame = ignore_by_frame.get(int(frame))
        if ignore_frame is not None and len(ignore_frame):
            ignore_iou = pairwise_iou_xyxy(
                candidate_boxes,
                gt_to_xyxy(ignore_frame).astype(np.float32),
            )
            ignored = np.max(ignore_iou, axis=1) >= match_iou
            local_negative = labels[candidate_indices] == 0
            labels[candidate_indices[ignored & local_negative]] = -1
    return labels


def extract_gap_samples(
    *,
    tracker_dir: str | Path,
    detection_dir: str | Path,
    sequence: SequenceInfo,
    min_track_length: int,
    max_gap: int,
    max_endpoint_extension: int = 0,
    with_labels: bool,
    match_iou: float = 0.1,
) -> tuple[np.ndarray, np.ndarray, np.ndarray | None]:
    tracker_root = _tracker_root(tracker_dir)
    rows = np.asarray(
        [row[:7] for row in read_mot_rows(tracker_root / f"{sequence.name}.txt")],
        dtype=np.float32,
    ).reshape((-1, 7))
    candidate_rows, base_features = _build_gap_candidates(
        rows,
        min_track_length=int(min_track_length),
        max_gap=int(max_gap),
        max_endpoint_extension=int(max_endpoint_extension),
        sequence_length=int(sequence.seq_length),
        image_width=int(sequence.width),
        image_height=int(sequence.height),
    )
    if not len(candidate_rows):
        return (
            candidate_rows,
            np.zeros((0, len(FEATURE_NAMES)), dtype=np.float32),
            np.zeros((0,), dtype=np.int8) if with_labels else None,
        )
    support = _detection_support(
        candidate_rows,
        Path(detection_dir).expanduser().resolve() / f"{sequence.name}.npz",
    )
    features = np.concatenate([base_features, support], axis=1).astype(
        np.float32
    )
    labels = (
        _utility_labels(
            rows,
            candidate_rows,
            sequence,
            match_iou=float(match_iou),
        )
        if with_labels
        else None
    )
    return candidate_rows, features, labels


def _predict(
    model: NeuralGapSelector,
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


def _select_threshold(labels: np.ndarray, scores: np.ndarray) -> dict:
    best = {
        "threshold": 1.0,
        "tp": 0,
        "fp": 0,
        "estimated_gain": 0,
        "precision": 1.0,
    }
    for threshold in np.unique(
        np.quantile(scores, np.linspace(0.0, 1.0, 401))
    ):
        selected = scores >= float(threshold)
        tp = int(np.sum(labels[selected] == 1))
        fp = int(np.sum(labels[selected] == 0))
        gain = tp - fp
        precision = float(tp / max(tp + fp, 1))
        candidate = (gain, precision, tp, float(threshold))
        incumbent = (
            int(best["estimated_gain"]),
            float(best["precision"]),
            int(best["tp"]),
            float(best["threshold"]),
        )
        if candidate > incumbent:
            best = {
                "threshold": float(threshold),
                "tp": tp,
                "fp": fp,
                "estimated_gain": gain,
                "precision": precision,
            }
    return best


def train_neural_gap_selector(
    *,
    tracker_dir: str | Path,
    detection_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    device: str = "mps",
    min_track_length: int = 5,
    max_gap: int = 20,
    max_endpoint_extension: int = 0,
    match_iou: float = 0.1,
    hidden_dim: int = 64,
    epochs: int = 30,
    batch_size: int = 4096,
    learning_rate: float = 0.001,
    weight_decay: float = 0.002,
    validation_fraction: float = 0.20,
    seed: int = 20260734,
) -> dict:
    names = [str(value) for value in train_sequences]
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    feature_parts: list[np.ndarray] = []
    label_parts: list[np.ndarray] = []
    group_parts: list[np.ndarray] = []
    stats: dict[str, dict] = {}
    for sequence_id, name in enumerate(names):
        _rows, features, labels = extract_gap_samples(
            tracker_dir=tracker_dir,
            detection_dir=detection_dir,
            sequence=sequence_by_name[name],
            min_track_length=int(min_track_length),
            max_gap=int(max_gap),
            max_endpoint_extension=int(max_endpoint_extension),
            with_labels=True,
            match_iou=float(match_iou),
        )
        assert labels is not None
        keep = labels >= 0
        features = features[keep]
        labels = labels[keep].astype(np.float32)
        feature_parts.append(features)
        label_parts.append(labels)
        group_parts.append(
            np.full((len(labels),), sequence_id, dtype=np.int16)
        )
        stats[name] = {
            "samples": int(len(labels)),
            "positive": int(np.sum(labels == 1)),
            "negative": int(np.sum(labels == 0)),
        }
        print(
            f"{name}: gaps={len(labels)} positive={stats[name]['positive']}",
            flush=True,
        )
    features = np.concatenate(feature_parts).astype(np.float32)
    labels = np.concatenate(label_parts).astype(np.float32)
    groups = np.concatenate(group_parts)
    rng = np.random.default_rng(int(seed))
    validation_mask = np.zeros((len(labels),), dtype=bool)
    for sequence_id in np.unique(groups):
        indices = np.flatnonzero(groups == sequence_id)
        validation_count = max(
            1, int(round(len(indices) * float(validation_fraction)))
        )
        validation_mask[
            rng.choice(indices, size=validation_count, replace=False)
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
    weights = np.where(
        train_labels == 1,
        len(train_labels) / (2.0 * positive),
        len(train_labels) / (2.0 * negative),
    ).astype(np.float32)
    resolved_device = _resolve_device(device)
    torch.manual_seed(int(seed))
    model = NeuralGapSelector(len(FEATURE_NAMES), int(hidden_dim)).to(
        resolved_device
    )
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=float(learning_rate),
        weight_decay=float(weight_decay),
    )
    loader = DataLoader(
        TensorDataset(
            torch.from_numpy(normalized[train_indices]),
            torch.from_numpy(train_labels),
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
        scores = _predict(
            model,
            features[validation_indices],
            mean=mean,
            scale=scale,
            device=resolved_device,
            batch_size=int(batch_size),
        )
        ap = float(
            average_precision_score(labels[validation_indices], scores)
        )
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
        raise RuntimeError("No neural gap selector checkpoint was produced")
    model.load_state_dict(best_state)
    validation_scores = _predict(
        model,
        features[validation_indices],
        mean=mean,
        scale=scale,
        device=resolved_device,
        batch_size=int(batch_size),
    )
    threshold_selection = _select_threshold(
        labels[validation_indices], validation_scores
    )
    metadata = {
        "kind": "neural_gap_selector",
        "tracker_dir": str(_tracker_root(tracker_dir)),
        "detection_dir": str(
            Path(detection_dir).expanduser().resolve()
        ),
        "train_sequences": names,
        "feature_names": list(FEATURE_NAMES),
        "input_dim": len(FEATURE_NAMES),
        "hidden_dim": int(hidden_dim),
        "device": resolved_device,
        "min_track_length": int(min_track_length),
        "max_gap": int(max_gap),
        "max_endpoint_extension": int(max_endpoint_extension),
        "match_iou": float(match_iou),
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
        "uses_groundingdino_support": True,
        "learned_postprocess": True,
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


def apply_neural_gap_selector(
    *,
    model_path: str | Path,
    tracker_dir: str | Path,
    detection_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    device: str = "mps",
    threshold: float | None = None,
    batch_size: int = 4096,
    duplicate_iou: float = 0.5,
    snap_iou: float = 0.0,
    max_added_fraction: float | None = None,
    overwrite: bool = False,
) -> Path:
    payload = torch.load(
        Path(model_path).expanduser().resolve(),
        map_location="cpu",
        weights_only=False,
    )
    metadata = dict(payload["metadata"])
    if metadata.get("kind") != "neural_gap_selector":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    resolved_device = _resolve_device(device)
    model = NeuralGapSelector(
        int(metadata["input_dim"]), int(metadata["hidden_dim"])
    ).to(resolved_device)
    model.load_state_dict(payload["state_dict"])
    selected_threshold = (
        float(threshold)
        if threshold is not None
        else float(metadata["threshold_selection"]["threshold"])
    )
    if max_added_fraction is not None and float(max_added_fraction) < 0.0:
        raise ValueError("max_added_fraction must be non-negative")
    source_root = _tracker_root(tracker_dir)
    target = Path(target_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    stats: dict[str, dict] = {}
    for name in [str(value) for value in sequence_names]:
        output_path = target / f"{name}.txt"
        if output_path.exists() and not overwrite:
            continue
        base_rows_list = [
            row[:7] for row in read_mot_rows(source_root / f"{name}.txt")
        ]
        base_rows = np.asarray(base_rows_list, dtype=np.float32).reshape(
            (-1, 7)
        )
        candidate_rows, features, _labels = extract_gap_samples(
            tracker_dir=source_root,
            detection_dir=detection_dir,
            sequence=sequence_by_name[name],
            min_track_length=int(metadata["min_track_length"]),
            max_gap=int(metadata["max_gap"]),
            max_endpoint_extension=int(
                metadata.get("max_endpoint_extension", 0)
            ),
            with_labels=False,
            match_iou=float(metadata["match_iou"]),
        )
        support_detections = (
            load_detections(
                Path(detection_dir).expanduser().resolve() / f"{name}.npz"
            )
            if float(snap_iou) > 0.0
            else None
        )
        support_by_frame = (
            support_detections.by_frame()
            if support_detections is not None
            else {}
        )
        scores = _predict(
            model,
            features,
            mean=np.asarray(payload["mean"], dtype=np.float32),
            scale=np.asarray(payload["scale"], dtype=np.float32),
            device=resolved_device,
            batch_size=int(batch_size),
        )
        proposed = np.flatnonzero(scores >= selected_threshold)
        base_frames = base_rows[:, 0].astype(np.int64)
        accepted: list[int] = []
        accepted_by_frame: dict[int, list[int]] = {}
        accepted_limit = (
            None
            if max_added_fraction is None
            else int(np.floor(len(base_rows) * float(max_added_fraction)))
        )
        for index in proposed[np.argsort(-scores[proposed])]:
            if accepted_limit is not None and len(accepted) >= accepted_limit:
                break
            frame = int(candidate_rows[index, 0])
            box = _xywh_to_xyxy(candidate_rows[index : index + 1, 2:6])
            if support_detections is not None:
                support_indices = support_by_frame.get(
                    frame, np.zeros((0,), dtype=np.int64)
                )
                if len(support_indices):
                    support_iou = pairwise_iou_xyxy(
                        box,
                        support_detections.boxes[support_indices].astype(
                            np.float32
                        ),
                    )[0]
                    best_support = int(np.argmax(support_iou))
                    if float(support_iou[best_support]) >= float(snap_iou):
                        snapped = support_detections.boxes[
                            support_indices[best_support] : support_indices[
                                best_support
                            ]
                            + 1
                        ].astype(np.float32)
                        candidate_rows[index, 2:6] = _xyxy_to_xywh(
                            snapped
                        )[0]
                        box = snapped
            existing_indices = np.flatnonzero(base_frames == frame)
            if len(existing_indices):
                existing_iou = pairwise_iou_xyxy(
                    box, _xywh_to_xyxy(base_rows[existing_indices, 2:6])
                )
                if float(np.max(existing_iou)) >= float(duplicate_iou):
                    continue
            frame_accepted = accepted_by_frame.setdefault(frame, [])
            if frame_accepted:
                accepted_iou = pairwise_iou_xyxy(
                    box,
                    _xywh_to_xyxy(candidate_rows[frame_accepted, 2:6]),
                )
                if float(np.max(accepted_iou)) >= float(duplicate_iou):
                    continue
            accepted.append(int(index))
            frame_accepted.append(int(index))
        additions = candidate_rows[accepted]
        merged = (
            np.vstack([base_rows, additions])
            if len(additions)
            else base_rows.copy()
        )
        order = np.lexsort((merged[:, 1], merged[:, 0]))
        merged = merged[order]
        write_mot_rows(
            output_path,
            [
                (
                    int(row[0]),
                    int(row[1]),
                    float(row[2]),
                    float(row[3]),
                    float(row[4]),
                    float(row[5]),
                    float(row[6]),
                )
                for row in merged
            ],
        )
        stats[name] = {
            "base_rows": int(len(base_rows)),
            "candidate_rows": int(len(candidate_rows)),
            "threshold_proposals": int(len(proposed)),
            "accepted_limit": accepted_limit,
            "accepted_rows": int(len(additions)),
            "output_rows": int(len(merged)),
        }
        print(
            f"{name}: {len(base_rows)} + {len(additions)} "
            f"(proposed={len(proposed)})",
            flush=True,
        )
    (target / "neural_gap_selector_metadata.json").write_text(
        json.dumps(
            {
                "kind": "neural_gap_selected_tracks",
                "source_tracker": str(source_root),
                "detection_dir": str(
                    Path(detection_dir).expanduser().resolve()
                ),
                "model": str(Path(model_path).expanduser().resolve()),
                "model_metadata": metadata,
                "device": resolved_device,
                "threshold": selected_threshold,
                "duplicate_iou": float(duplicate_iou),
                "snap_iou": float(snap_iou),
                "max_added_fraction": (
                    None
                    if max_added_fraction is None
                    else float(max_added_fraction)
                ),
                "stats": stats,
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
