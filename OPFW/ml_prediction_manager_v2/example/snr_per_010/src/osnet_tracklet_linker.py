from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np

from mot20_io import SequenceInfo
from nms import pairwise_iou_xyxy
from tracklet_linker import FEATURE_NAMES, Tracklet, pair_features


OSNET_FEATURE_NAMES = FEATURE_NAMES + [
    "reid_all_cosine",
    "reid_end_start_cosine",
    "reid_start_start_cosine",
    "reid_end_end_cosine",
    "first_reid_stability",
    "second_reid_stability",
    "first_reid_match_fraction",
    "second_reid_match_fraction",
    "first_reid_mean_iou",
    "second_reid_mean_iou",
]


@dataclass(slots=True)
class TrackletAppearance:
    mean: np.ndarray
    start: np.ndarray
    end: np.ndarray
    match_fraction: float
    mean_iou: float


def _normalize(vector: np.ndarray) -> np.ndarray:
    value = np.asarray(vector, dtype=np.float32)
    norm = float(np.linalg.norm(value))
    if norm <= 1.0e-8:
        return np.zeros_like(value, dtype=np.float32)
    return (value / norm).astype(np.float32)


def _mean_normalized(vectors: list[np.ndarray], embedding_dim: int) -> np.ndarray:
    if not vectors:
        return np.zeros((embedding_dim,), dtype=np.float32)
    return _normalize(np.mean(np.stack(vectors, axis=0), axis=0))


def _sample_positions(length: int, max_samples: int, endpoint_samples: int) -> list[int]:
    if length <= 0:
        return []
    positions = set(
        np.linspace(0, length - 1, min(length, max(1, max_samples))).round().astype(int).tolist()
    )
    positions.update(range(min(length, max(1, endpoint_samples))))
    positions.update(range(max(0, length - max(1, endpoint_samples)), length))
    return sorted(positions)


def load_osnet_appearances(
    tracklets: list[Tracklet],
    sequence: SequenceInfo,
    *,
    detection_dir: str | Path,
    embedding_dir: str | Path,
    max_samples: int = 12,
    endpoint_samples: int = 3,
    min_match_iou: float = 0.20,
) -> tuple[dict[int, TrackletAppearance], dict]:
    detection_path = Path(detection_dir).expanduser().resolve() / f"{sequence.name}.npz"
    embedding_path = Path(embedding_dir).expanduser().resolve() / f"{sequence.name}.npy"
    with np.load(detection_path) as payload:
        frames = payload["frames"].astype(np.int32, copy=False)
        boxes = payload["boxes"].astype(np.float32, copy=False)
    embeddings = np.load(embedding_path, mmap_mode="r")
    if len(frames) != len(embeddings):
        raise AssertionError(
            f"{sequence.name}: detection/embedding rows differ ({len(frames)} != {len(embeddings)})"
        )
    if len(frames) and np.any(frames[1:] < frames[:-1]):
        raise AssertionError(f"{sequence.name}: source detections must be frame-sorted")

    embedding_dim = int(embeddings.shape[1])
    appearances: dict[int, TrackletAppearance] = {}
    sampled = matched = 0
    matched_ious: list[float] = []
    for track in tracklets:
        positions = _sample_positions(track.length, int(max_samples), int(endpoint_samples))
        all_vectors: list[np.ndarray] = []
        start_vectors: list[np.ndarray] = []
        end_vectors: list[np.ndarray] = []
        track_ious: list[float] = []
        for position in positions:
            sampled += 1
            frame = int(track.frames[position])
            left = int(np.searchsorted(frames, frame, side="left"))
            right = int(np.searchsorted(frames, frame, side="right"))
            if right <= left:
                continue
            box = track.boxes[position]
            track_xyxy = np.asarray(
                [[box[0], box[1], box[0] + box[2], box[1] + box[3]]],
                dtype=np.float32,
            )
            ious = pairwise_iou_xyxy(track_xyxy, boxes[left:right])[0]
            local_index = int(np.argmax(ious))
            best_iou = float(ious[local_index])
            if best_iou < float(min_match_iou):
                continue
            vector = np.asarray(embeddings[left + local_index], dtype=np.float32)
            all_vectors.append(vector)
            if position < int(endpoint_samples):
                start_vectors.append(vector)
            if position >= max(0, track.length - int(endpoint_samples)):
                end_vectors.append(vector)
            track_ious.append(best_iou)
            matched_ious.append(best_iou)
            matched += 1

        mean = _mean_normalized(all_vectors, embedding_dim)
        start = _mean_normalized(start_vectors or all_vectors[:1], embedding_dim)
        end = _mean_normalized(end_vectors or all_vectors[-1:], embedding_dim)
        appearances[int(track.track_id)] = TrackletAppearance(
            mean=mean,
            start=start,
            end=end,
            match_fraction=float(len(all_vectors) / max(len(positions), 1)),
            mean_iou=float(np.mean(track_ious)) if track_ious else 0.0,
        )

    return appearances, {
        "tracklets": len(tracklets),
        "sampled_rows": int(sampled),
        "matched_rows": int(matched),
        "match_fraction": float(matched / max(sampled, 1)),
        "mean_match_iou": float(np.mean(matched_ious)) if matched_ious else 0.0,
    }


def _cosine(first: np.ndarray, second: np.ndarray) -> float:
    if not np.any(first) or not np.any(second):
        return 0.0
    return float(np.clip(np.dot(first, second), -1.0, 1.0))


def osnet_pair_features(
    first: Tracklet,
    second: Tracklet,
    appearances: dict[int, TrackletAppearance],
) -> np.ndarray:
    first_app = appearances[int(first.track_id)]
    second_app = appearances[int(second.track_id)]
    appearance_features = np.asarray(
        [
            _cosine(first_app.mean, second_app.mean),
            _cosine(first_app.end, second_app.start),
            _cosine(first_app.start, second_app.start),
            _cosine(first_app.end, second_app.end),
            _cosine(first_app.start, first_app.end),
            _cosine(second_app.start, second_app.end),
            float(first_app.match_fraction),
            float(second_app.match_fraction),
            float(first_app.mean_iou),
            float(second_app.mean_iou),
        ],
        dtype=np.float32,
    )
    return np.concatenate([pair_features(first, second), appearance_features]).astype(np.float32)
