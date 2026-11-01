from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from torch import nn

from mot20_io import SequenceInfo, read_mot_rows, write_mot_rows
from osnet_tracklet_linker import load_osnet_appearances
from track_filter import track_features
from tracklet_linker import Tracklet, load_tracklets


OSNET_DIM = 512
SUMMARY_FEATURE_NAMES = [
    "log_length",
    "log_span",
    "density",
    "mean_conf",
    "median_conf",
    "max_conf",
    "min_conf",
    "std_conf",
    "aspect_median",
    "motion_per_h",
    "jitter_per_h",
    "height_cv",
    "area_cv",
    "appearance_start_end_cosine",
    "appearance_match_fraction",
    "appearance_mean_iou",
    "length_percentile",
    "mean_conf_percentile",
    "median_conf_percentile",
    "height_percentile",
]
FEATURE_NAMES = SUMMARY_FEATURE_NAMES + [
    f"osnet_mean_{index:03d}" for index in range(OSNET_DIM)
]


def _percentile_rank(values: np.ndarray) -> np.ndarray:
    if len(values) <= 1:
        return np.ones((len(values),), dtype=np.float32)
    order = np.argsort(values, kind="stable")
    ranks = np.empty((len(values),), dtype=np.float32)
    ranks[order] = np.arange(len(values), dtype=np.float32)
    return ranks / float(len(values) - 1)


def _cosine(first: np.ndarray, second: np.ndarray) -> float:
    if not np.any(first) or not np.any(second):
        return 0.0
    return float(np.clip(np.dot(first, second), -1.0, 1.0))


def _variation(values: np.ndarray) -> float:
    mean = float(np.mean(values)) if len(values) else 0.0
    if mean <= 1.0e-6:
        return 0.0
    return float(np.std(values) / mean)


def osnet_track_features(
    tracklets: list[Tracklet],
    sequence: SequenceInfo,
    *,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    max_samples: int = 16,
    endpoint_samples: int = 4,
    min_match_iou: float = 0.20,
) -> tuple[np.ndarray, dict]:
    if not tracklets:
        return np.zeros((0, len(FEATURE_NAMES)), dtype=np.float32), {
            "tracklets": 0,
            "sampled_rows": 0,
            "matched_rows": 0,
            "match_fraction": 0.0,
            "mean_match_iou": 0.0,
        }

    appearances, appearance_stats = load_osnet_appearances(
        tracklets,
        sequence,
        detection_dir=detection_dir,
        embedding_dir=embedding_dir,
        max_samples=int(max_samples),
        endpoint_samples=int(endpoint_samples),
        min_match_iou=float(min_match_iou),
    )
    basic = np.stack(
        [track_features(track, sequence) for track in tracklets],
        axis=0,
    ).astype(np.float32)
    lengths = basic[:, 0]
    mean_conf = basic[:, 4]
    median_conf = basic[:, 5]
    mean_height = basic[:, 9]
    relative = np.column_stack(
        [
            _percentile_rank(lengths),
            _percentile_rank(mean_conf),
            _percentile_rank(median_conf),
            _percentile_rank(mean_height),
        ]
    ).astype(np.float32)

    rows: list[np.ndarray] = []
    for index, track in enumerate(tracklets):
        boxes = np.asarray(track.boxes, dtype=np.float32)
        heights = np.maximum(boxes[:, 3], 1.0)
        areas = np.maximum(boxes[:, 2] * boxes[:, 3], 1.0)
        appearance = appearances[int(track.track_id)]
        summary = np.asarray(
            [
                basic[index, 1],
                np.log1p(max(float(basic[index, 2]), 0.0)),
                basic[index, 3],
                basic[index, 4],
                basic[index, 5],
                basic[index, 6],
                basic[index, 7],
                basic[index, 8],
                basic[index, 11],
                basic[index, 12],
                basic[index, 13],
                _variation(heights),
                _variation(areas),
                _cosine(appearance.start, appearance.end),
                appearance.match_fraction,
                appearance.mean_iou,
                *relative[index].tolist(),
            ],
            dtype=np.float32,
        )
        rows.append(
            np.concatenate([summary, appearance.mean]).astype(np.float32)
        )
    return np.stack(rows, axis=0), appearance_stats


class OSNetTrackFilter(nn.Module):
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


def predict_probabilities(
    payload: dict,
    features: np.ndarray,
    *,
    device: str = "cpu",
    batch_size: int = 4096,
) -> np.ndarray:
    metadata = payload["metadata"]
    model = OSNetTrackFilter(
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
    if payload.get("metadata", {}).get("kind") != "osnet_neural_track_filter":
        raise AssertionError(
            f"Unexpected model kind: {payload.get('metadata', {}).get('kind')}"
        )
    return payload


def apply_filter(
    *,
    tracker_dir: str | Path,
    output_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    payload: dict,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    device: str = "cpu",
    threshold: float | None = None,
    keep_long_min_len: int = 0,
    keep_long_min_median_conf: float = 1.1,
    max_track_fraction: float | None = None,
) -> dict[str, dict]:
    metadata = payload["metadata"]
    threshold_value = float(
        metadata["threshold"] if threshold is None else threshold
    )
    tracker_root = Path(tracker_dir).expanduser().resolve()
    if (tracker_root / "data").exists():
        tracker_root = tracker_root / "data"
    target = Path(output_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    result: dict[str, dict] = {}

    for sequence in sequences:
        tracklets = load_tracklets(tracker_root, sequence, compute_hist=False)
        features, appearance_stats = osnet_track_features(
            tracklets,
            sequence,
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
        keep_indices: list[int] = []
        for index, (track, probability) in enumerate(
            zip(tracklets, probabilities, strict=False)
        ):
            long_keep = (
                int(keep_long_min_len) > 0
                and track.length >= int(keep_long_min_len)
                and float(np.median(track.scores))
                >= float(keep_long_min_median_conf)
            )
            if float(probability) >= threshold_value or long_keep:
                keep_indices.append(index)
        if (
            max_track_fraction is not None
            and 0.0 < float(max_track_fraction) < 1.0
        ):
            cap = max(
                1,
                int(round(len(tracklets) * float(max_track_fraction))),
            )
            if len(keep_indices) > cap:
                ranked = sorted(
                    keep_indices,
                    key=lambda index: float(probabilities[index]),
                    reverse=True,
                )
                keep_indices = ranked[:cap]
        keep_ids = {
            int(tracklets[index].track_id) for index in keep_indices
        }

        rows = read_mot_rows(tracker_root / f"{sequence.name}.txt")
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
            for row in rows
            if int(row[1]) in keep_ids
        ]
        write_mot_rows(target / f"{sequence.name}.txt", output_rows)
        result[sequence.name] = {
            "tracks": int(len(tracklets)),
            "kept_tracks": int(len(keep_ids)),
            "source_rows": int(len(rows)),
            "output_rows": int(len(output_rows)),
            "threshold": threshold_value,
            "max_track_fraction": max_track_fraction,
            "appearance": appearance_stats,
        }
    return result
