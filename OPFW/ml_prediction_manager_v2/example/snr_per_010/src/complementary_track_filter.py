from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from scipy.optimize import linear_sum_assignment
from torch import nn

from mot20_io import SequenceInfo, gt_to_xyxy, load_gt, read_mot_rows, write_mot_rows
from nms import pairwise_iou_xyxy
from osnet_track_filter import FEATURE_NAMES as OSNET_FEATURE_NAMES
from osnet_track_filter import osnet_track_features
from tracklet_linker import Tracklet, _tlwh_to_xyxy, load_tracklets


RELATION_FEATURE_NAMES = [
    "base_iou_mean",
    "base_iou_median",
    "base_iou_q90",
    "base_iou_max",
    "base_overlap_fraction_iou010",
    "base_overlap_fraction_iou030",
    "base_overlap_fraction_iou050",
    "base_overlap_fraction_iou070",
    "base_best_score_mean",
    "base_best_score_max",
    "base_center_distance_h_mean",
    "base_center_distance_h_median",
    "base_center_distance_h_min",
    "base_count_log_mean",
    "base_empty_frame_fraction",
    "dominant_base_track_fraction",
    "longest_overlap_run_fraction",
    "endpoint_overlap_mean",
]
FEATURE_NAMES = [*OSNET_FEATURE_NAMES, *RELATION_FEATURE_NAMES]


class ComplementaryTrackFilter(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 192) -> None:
        super().__init__()
        self.input = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.10),
        )
        self.block = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.15),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
        )
        self.output = nn.Sequential(
            nn.GELU(),
            nn.Linear(hidden_dim, 64),
            nn.GELU(),
            nn.Dropout(0.10),
            nn.Linear(64, 1),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        hidden = self.input(features)
        hidden = hidden + self.block(hidden)
        return self.output(hidden).squeeze(1)


def _tracker_root(path: str | Path) -> Path:
    root = Path(path).expanduser().resolve()
    return root / "data" if (root / "data").exists() else root


def _rows_by_frame(
    rows: list[list[float]],
) -> dict[int, tuple[np.ndarray, np.ndarray, np.ndarray]]:
    grouped: dict[int, list[list[float]]] = defaultdict(list)
    for row in rows:
        grouped[int(row[0])].append(row)
    output: dict[int, tuple[np.ndarray, np.ndarray, np.ndarray]] = {}
    for frame, frame_rows in grouped.items():
        boxes = np.asarray(
            [
                [
                    float(row[2]),
                    float(row[3]),
                    float(row[2] + row[4]),
                    float(row[3] + row[5]),
                ]
                for row in frame_rows
            ],
            dtype=np.float32,
        )
        scores = np.asarray([float(row[6]) for row in frame_rows], dtype=np.float32)
        track_ids = np.asarray([int(row[1]) for row in frame_rows], dtype=np.int64)
        output[int(frame)] = boxes, scores, track_ids
    return output


def _longest_true_run(values: np.ndarray) -> int:
    best = current = 0
    for value in values.astype(bool).tolist():
        if value:
            current += 1
            best = max(best, current)
        else:
            current = 0
    return int(best)


def base_relation_features(
    tracklets: list[Tracklet],
    sequence: SequenceInfo,
    *,
    base_tracker_dir: str | Path,
) -> np.ndarray:
    if not tracklets:
        return np.zeros((0, len(RELATION_FEATURE_NAMES)), dtype=np.float32)
    base_rows = read_mot_rows(
        _tracker_root(base_tracker_dir) / f"{sequence.name}.txt"
    )
    base_by_frame = _rows_by_frame(base_rows)
    output: list[np.ndarray] = []
    for track in tracklets:
        max_ious: list[float] = []
        best_scores: list[float] = []
        center_distances: list[float] = []
        frame_counts: list[float] = []
        best_track_ids: list[int] = []
        empty_frames = 0
        for frame, box_tlwh in zip(track.frames, track.boxes, strict=True):
            base = base_by_frame.get(int(frame))
            if base is None or not len(base[0]):
                max_ious.append(0.0)
                best_scores.append(0.0)
                center_distances.append(4.0)
                frame_counts.append(0.0)
                best_track_ids.append(-1)
                empty_frames += 1
                continue
            base_boxes, base_scores, base_ids = base
            box = _tlwh_to_xyxy(
                np.asarray([box_tlwh], dtype=np.float32)
            )
            iou = pairwise_iou_xyxy(box, base_boxes)[0]
            best = int(np.argmax(iou))
            max_ious.append(float(iou[best]))
            best_scores.append(float(base_scores[best]))
            best_track_ids.append(int(base_ids[best]))
            center = np.asarray(
                [
                    float(box_tlwh[0] + 0.5 * box_tlwh[2]),
                    float(box_tlwh[1] + 0.5 * box_tlwh[3]),
                ],
                dtype=np.float32,
            )
            base_centers = np.column_stack(
                [
                    0.5 * (base_boxes[:, 0] + base_boxes[:, 2]),
                    0.5 * (base_boxes[:, 1] + base_boxes[:, 3]),
                ]
            )
            distance = np.linalg.norm(base_centers - center[None, :], axis=1)
            center_distances.append(
                float(np.min(distance) / max(float(box_tlwh[3]), 1.0))
            )
            frame_counts.append(float(np.log1p(len(base_boxes))))

        ious = np.asarray(max_ious, dtype=np.float32)
        scores = np.asarray(best_scores, dtype=np.float32)
        distances = np.asarray(center_distances, dtype=np.float32)
        counts = np.asarray(frame_counts, dtype=np.float32)
        overlapping_ids = [
            track_id
            for track_id, iou in zip(best_track_ids, ious, strict=True)
            if track_id >= 0 and float(iou) >= 0.10
        ]
        if overlapping_ids:
            _values, frequencies = np.unique(
                np.asarray(overlapping_ids, dtype=np.int64),
                return_counts=True,
            )
            dominant_fraction = float(
                np.max(frequencies) / max(len(track.frames), 1)
            )
        else:
            dominant_fraction = 0.0
        endpoint_count = min(4, len(ious))
        endpoint_values = (
            np.concatenate([ious[:endpoint_count], ious[-endpoint_count:]])
            if endpoint_count
            else np.zeros((0,), dtype=np.float32)
        )
        output.append(
            np.asarray(
                [
                    float(np.mean(ious)),
                    float(np.median(ious)),
                    float(np.quantile(ious, 0.90)),
                    float(np.max(ious)),
                    float(np.mean(ious >= 0.10)),
                    float(np.mean(ious >= 0.30)),
                    float(np.mean(ious >= 0.50)),
                    float(np.mean(ious >= 0.70)),
                    float(np.mean(scores)),
                    float(np.max(scores)),
                    float(np.mean(distances)),
                    float(np.median(distances)),
                    float(np.min(distances)),
                    float(np.mean(counts)),
                    float(empty_frames / max(len(track.frames), 1)),
                    dominant_fraction,
                    float(
                        _longest_true_run(ious >= 0.30)
                        / max(len(track.frames), 1)
                    ),
                    float(np.mean(endpoint_values))
                    if len(endpoint_values)
                    else 0.0,
                ],
                dtype=np.float32,
            )
        )
    return np.stack(output, axis=0).astype(np.float32)


def complementary_features(
    tracklets: list[Tracklet],
    sequence: SequenceInfo,
    *,
    base_tracker_dir: str | Path,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    max_samples: int,
    endpoint_samples: int,
    min_match_iou: float,
) -> tuple[np.ndarray, dict]:
    appearance, appearance_stats = osnet_track_features(
        tracklets,
        sequence,
        detection_dir=detection_dir,
        embedding_dir=embedding_dir,
        max_samples=int(max_samples),
        endpoint_samples=int(endpoint_samples),
        min_match_iou=float(min_match_iou),
    )
    relation = base_relation_features(
        tracklets,
        sequence,
        base_tracker_dir=base_tracker_dir,
    )
    return (
        np.concatenate([appearance, relation], axis=1).astype(np.float32),
        appearance_stats,
    )


def marginal_track_stats(
    tracklets: list[Tracklet],
    sequence: SequenceInfo,
    *,
    base_tracker_dir: str | Path,
    iou_threshold: float = 0.5,
) -> dict[str, np.ndarray]:
    count = len(tracklets)
    true_rows = np.zeros((count,), dtype=np.int32)
    ignored_rows = np.zeros((count,), dtype=np.int32)
    matched_pairs: list[list[tuple[int, int]]] = [[] for _ in tracklets]

    valid_gt, ignore_gt = load_gt(sequence.gt_path)
    valid_by_frame = {
        int(frame): rows for frame, rows in valid_gt.groupby("frame")
    }
    ignore_by_frame = {
        int(frame): rows for frame, rows in ignore_gt.groupby("frame")
    }
    empty_valid = valid_gt.iloc[0:0]
    empty_ignore = ignore_gt.iloc[0:0]
    base_rows = read_mot_rows(
        _tracker_root(base_tracker_dir) / f"{sequence.name}.txt"
    )
    base_by_frame = _rows_by_frame(base_rows)

    rescue_by_frame: dict[int, list[tuple[int, int]]] = defaultdict(list)
    for track_index, track in enumerate(tracklets):
        for local_index, frame in enumerate(track.frames.astype(int).tolist()):
            rescue_by_frame[int(frame)].append((track_index, local_index))

    base_matched_frames: dict[int, set[int]] = defaultdict(set)
    for frame, rescue_rows in rescue_by_frame.items():
        gt_frame = valid_by_frame.get(int(frame), empty_valid)
        gt_boxes = gt_to_xyxy(gt_frame).astype(np.float32)
        gt_ids = gt_frame["id"].to_numpy(dtype=np.int64)
        unmatched_gt = np.ones((len(gt_boxes),), dtype=bool)

        base = base_by_frame.get(int(frame))
        if len(gt_boxes) and base is not None and len(base[0]):
            base_iou = pairwise_iou_xyxy(gt_boxes, base[0])
            rows, cols = linear_sum_assignment(1.0 - base_iou)
            for row, col in zip(rows, cols, strict=False):
                if float(base_iou[row, col]) < float(iou_threshold):
                    continue
                unmatched_gt[int(row)] = False
                base_matched_frames[int(gt_ids[int(row)])].add(int(frame))

        rescue_boxes = _tlwh_to_xyxy(
            np.asarray(
                [
                    tracklets[track_index].boxes[local_index]
                    for track_index, local_index in rescue_rows
                ],
                dtype=np.float32,
            )
        )
        available_gt = np.flatnonzero(unmatched_gt)
        matched_rescue: set[int] = set()
        if len(available_gt) and len(rescue_boxes):
            rescue_iou = pairwise_iou_xyxy(
                gt_boxes[available_gt],
                rescue_boxes,
            )
            rows, cols = linear_sum_assignment(1.0 - rescue_iou)
            for row, col in zip(rows, cols, strict=False):
                if float(rescue_iou[row, col]) < float(iou_threshold):
                    continue
                track_index, _local_index = rescue_rows[int(col)]
                gt_index = int(available_gt[int(row)])
                true_rows[track_index] += 1
                matched_pairs[track_index].append(
                    (int(frame), int(gt_ids[gt_index]))
                )
                matched_rescue.add(int(col))

        ignore_frame = ignore_by_frame.get(int(frame), empty_ignore)
        ignore_boxes = gt_to_xyxy(ignore_frame).astype(np.float32)
        if len(ignore_boxes):
            ignore_iou = pairwise_iou_xyxy(rescue_boxes, ignore_boxes)
            for rescue_index, (track_index, _local_index) in enumerate(
                rescue_rows
            ):
                if rescue_index in matched_rescue:
                    continue
                if float(np.max(ignore_iou[rescue_index])) >= 0.5:
                    ignored_rows[track_index] += 1

    switch_penalty = np.zeros((count,), dtype=np.int32)
    for track_index, pairs in enumerate(matched_pairs):
        if not pairs:
            continue
        ordered = sorted(pairs)
        ids = np.asarray([gt_id for _frame, gt_id in ordered], dtype=np.int64)
        values, frequencies = np.unique(ids, return_counts=True)
        dominant_id = int(values[int(np.argmax(frequencies))])
        dominant_frames = [
            frame for frame, gt_id in ordered if int(gt_id) == dominant_id
        ]
        base_frames = base_matched_frames.get(dominant_id, set())
        if base_frames and dominant_frames:
            start = min(dominant_frames)
            end = max(dominant_frames)
            switch_penalty[track_index] += int(any(f < start for f in base_frames))
            switch_penalty[track_index] += int(any(f > end for f in base_frames))
        switch_penalty[track_index] += int(np.sum(ids[1:] != ids[:-1]))

    lengths = np.asarray([track.length for track in tracklets], dtype=np.int32)
    false_rows = np.maximum(lengths - true_rows - ignored_rows, 0)
    gain = true_rows - false_rows - switch_penalty
    return {
        "length": lengths,
        "true_rows": true_rows,
        "false_rows": false_rows,
        "ignored_rows": ignored_rows,
        "switch_penalty": switch_penalty,
        "gain": gain.astype(np.int32),
    }


def predict_probabilities(
    payload: dict,
    features: np.ndarray,
    *,
    device: str = "cpu",
    batch_size: int = 4096,
) -> np.ndarray:
    metadata = payload["metadata"]
    model = ComplementaryTrackFilter(
        int(metadata["input_dim"]),
        int(metadata["hidden_dim"]),
    ).to(device)
    model.load_state_dict(payload["state_dict"])
    mean = np.asarray(payload["mean"], dtype=np.float32)
    scale = np.asarray(payload["scale"], dtype=np.float32)
    output = np.empty((len(features),), dtype=np.float32)
    model.eval()
    with torch.inference_mode():
        for start in range(0, len(features), int(batch_size)):
            end = min(start + int(batch_size), len(features))
            normalized = (features[start:end] - mean) / scale
            tensor = torch.from_numpy(
                normalized.astype(np.float32, copy=False)
            ).to(device)
            output[start:end] = (
                torch.sigmoid(model(tensor)).cpu().numpy().astype(np.float32)
            )
    return output


def save_model(path: str | Path, payload: dict) -> Path:
    output = Path(path).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    torch.save(payload, output)
    output.with_suffix(output.suffix + ".json").write_text(
        json.dumps(payload["metadata"], indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return output


def load_model(path: str | Path) -> dict:
    payload = torch.load(
        Path(path).expanduser().resolve(),
        map_location="cpu",
        weights_only=False,
    )
    kind = payload.get("metadata", {}).get("kind")
    if kind != "complementary_osnet_track_filter":
        raise AssertionError(f"Unexpected model kind: {kind}")
    return payload


def apply_filter(
    *,
    base_tracker_dir: str | Path,
    rescue_tracker_dir: str | Path,
    output_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    payload: dict,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    device: str = "cpu",
    threshold: float | None = None,
) -> dict[str, dict]:
    metadata = payload["metadata"]
    threshold_value = float(
        metadata["threshold"] if threshold is None else threshold
    )
    base_root = _tracker_root(base_tracker_dir)
    rescue_root = _tracker_root(rescue_tracker_dir)
    target = Path(output_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    result: dict[str, dict] = {}

    for sequence in sequences:
        tracklets = load_tracklets(rescue_root, sequence, compute_hist=False)
        features, appearance_stats = complementary_features(
            tracklets,
            sequence,
            base_tracker_dir=base_root,
            detection_dir=detection_dir,
            embedding_dir=embedding_dir,
            max_samples=int(metadata["max_samples"]),
            endpoint_samples=int(metadata["endpoint_samples"]),
            min_match_iou=float(metadata["min_match_iou"]),
        )
        probabilities = predict_probabilities(
            payload,
            features,
            device=str(device),
        )
        keep_ids = {
            int(track.track_id)
            for track, probability in zip(tracklets, probabilities, strict=True)
            if float(probability) >= threshold_value
        }
        base_rows = read_mot_rows(base_root / f"{sequence.name}.txt")
        rescue_rows = read_mot_rows(rescue_root / f"{sequence.name}.txt")
        id_offset = max([int(row[1]) for row in base_rows], default=0)
        rescue_id_map = {
            old_id: id_offset + index
            for index, old_id in enumerate(sorted(keep_ids), start=1)
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
                int(row[0]),
                int(rescue_id_map[int(row[1])]),
                float(row[2]),
                float(row[3]),
                float(row[4]),
                float(row[5]),
                float(row[6]),
            )
            for row in rescue_rows
            if int(row[1]) in keep_ids
        )
        write_mot_rows(target / f"{sequence.name}.txt", output_rows)
        result[sequence.name] = {
            "base_rows": int(len(base_rows)),
            "rescue_tracks": int(len(tracklets)),
            "kept_tracks": int(len(keep_ids)),
            "added_rows": int(len(output_rows) - len(base_rows)),
            "output_rows": int(len(output_rows)),
            "threshold": threshold_value,
            "probability_min": float(np.min(probabilities))
            if len(probabilities)
            else None,
            "probability_max": float(np.max(probabilities))
            if len(probabilities)
            else None,
            "appearance": appearance_stats,
        }
    return result
