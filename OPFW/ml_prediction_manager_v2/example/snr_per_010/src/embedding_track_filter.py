from __future__ import annotations

import json
import math
import pickle
from pathlib import Path
from typing import Iterable

import cv2
import numpy as np

from detection_embeddings import crop_hsv_grad_embedding
from mot20_io import SequenceInfo, read_mot_rows, write_mot_rows
from track_filter import assign_track_match_stats
from tracklet_linker import Tracklet, load_tracklets
from vq_conditioner import _embedding_stats, load_model as load_vq_model


FEATURE_NAMES = [
    "length",
    "log_length",
    "span",
    "density",
    "mean_conf",
    "median_conf",
    "max_conf",
    "min_conf",
    "std_conf",
    "mean_h",
    "median_area_log",
    "aspect_median",
    "motion_per_h",
    "jitter_per_h",
    "start_frame_norm",
    "end_frame_norm",
    "vq_code_prob_mean",
    "vq_code_prob_min",
    "vq_code_prob_max",
    "vq_dist_mean",
    "vq_margin_mean",
    "embedding_temporal_consistency",
]


def _basic_features(track: Tracklet, sequence: SequenceInfo) -> np.ndarray:
    boxes = np.asarray(track.boxes, dtype=np.float32)
    scores = np.asarray(track.scores, dtype=np.float32)
    length = max(int(track.length), 1)
    span = max(float(track.end_frame - track.start_frame + 1), 1.0)
    centers = np.column_stack([boxes[:, 0] + boxes[:, 2] * 0.5, boxes[:, 1] + boxes[:, 3] * 0.5])
    heights = np.maximum(boxes[:, 3], 1.0)
    mean_h = float(np.mean(heights))
    if len(centers) >= 2:
        steps = np.linalg.norm(np.diff(centers, axis=0), axis=1)
        motion_per_h = float(np.sum(steps) / max(mean_h * max(len(steps), 1), 1e-6))
        jitter_per_h = float(np.std(steps) / max(mean_h, 1e-6)) if len(steps) >= 2 else 0.0
    else:
        motion_per_h = 0.0
        jitter_per_h = 0.0
    areas = np.maximum(boxes[:, 2] * boxes[:, 3], 1.0)
    aspects = boxes[:, 3] / np.maximum(boxes[:, 2], 1.0)
    return np.asarray(
        [
            float(length),
            math.log1p(float(length)),
            span,
            float(length / span),
            float(np.mean(scores)) if len(scores) else 0.0,
            float(np.median(scores)) if len(scores) else 0.0,
            float(np.max(scores)) if len(scores) else 0.0,
            float(np.min(scores)) if len(scores) else 0.0,
            float(np.std(scores)) if len(scores) else 0.0,
            mean_h,
            float(np.median(np.log(areas))),
            float(np.median(aspects)),
            motion_per_h,
            jitter_per_h,
            float(track.start_frame / max(sequence.seq_length, 1)),
            float(track.end_frame / max(sequence.seq_length, 1)),
        ],
        dtype=np.float32,
    )


def _track_embeddings(track: Tracklet, sequence: SequenceInfo, max_samples: int) -> np.ndarray:
    if track.length == 0:
        return np.zeros((0, 288), dtype=np.float32)
    positions = np.linspace(0, track.length - 1, min(int(max_samples), track.length)).round().astype(int)
    embs = []
    for pos in positions.tolist():
        frame_idx = int(track.frames[pos])
        image_path = sequence.img_dir / f"{frame_idx:06d}{sequence.image_ext}"
        image = cv2.imread(str(image_path))
        x, y, w, h = [float(v) for v in track.boxes[pos].tolist()]
        box = np.asarray([x, y, x + w, y + h], dtype=np.float32)
        embs.append(crop_hsv_grad_embedding(image, box))
    return np.stack(embs, axis=0).astype(np.float32)


def embedding_track_features(track: Tracklet, sequence: SequenceInfo, vq_model: dict, max_samples: int = 5) -> np.ndarray:
    basic = _basic_features(track, sequence)
    embs = _track_embeddings(track, sequence, max_samples=max_samples)
    if len(embs) == 0:
        extra = np.zeros((6,), dtype=np.float32)
    else:
        codes, d1, margin = _embedding_stats(embs, vq_model["centroids"])
        code_prob = np.asarray(vq_model["code_prob"], dtype=np.float32)
        probs = code_prob[codes]
        if len(embs) >= 2:
            norm = embs / np.maximum(np.linalg.norm(embs, axis=1, keepdims=True), 1e-8)
            sim = norm @ norm.T
            tri = sim[np.triu_indices(len(embs), k=1)]
            consistency = float(np.mean(tri)) if len(tri) else 1.0
        else:
            consistency = 1.0
        extra = np.asarray(
            [
                float(np.mean(probs)),
                float(np.min(probs)),
                float(np.max(probs)),
                float(np.mean(d1)),
                float(np.mean(margin)),
                consistency,
            ],
            dtype=np.float32,
        )
    return np.concatenate([basic, extra], axis=0).astype(np.float32)


def predict_probability(model: dict, features: np.ndarray) -> np.ndarray:
    estimator = model["estimator"]
    return estimator.predict_proba(np.asarray(features, dtype=np.float32))[:, 1].astype(np.float32)


def save_model(path: str | Path, model: dict) -> Path:
    out = Path(path).expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("wb") as handle:
        pickle.dump(model, handle)
    metadata = dict(model["metadata"])
    out.with_suffix(out.suffix + ".json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=True, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return out


def load_model(path: str | Path) -> dict:
    with Path(path).expanduser().resolve().open("rb") as handle:
        model = pickle.load(handle)
    if model.get("metadata", {}).get("kind") != "embedding_vq_track_filter":
        raise AssertionError(f"Unexpected model kind: {model.get('metadata', {}).get('kind')}")
    return model


def apply_filter(
    *,
    tracker_dir: str | Path,
    output_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    model: dict,
    threshold: float | None = None,
    keep_long_min_len: int = 80,
    keep_long_min_median_conf: float = 0.45,
) -> dict:
    vq_model = load_vq_model(model["metadata"]["vq_model"])
    threshold_value = float(model["metadata"].get("threshold", 0.5) if threshold is None else threshold)
    tracker_root = Path(tracker_dir).expanduser().resolve()
    if (tracker_root / "data").exists():
        tracker_root = tracker_root / "data"
    out_root = Path(output_dir).expanduser().resolve()
    out_root.mkdir(parents=True, exist_ok=True)
    stats = {}
    for sequence in sequences:
        tracklets = load_tracklets(tracker_root, sequence, compute_hist=False)
        if tracklets:
            x = np.stack([embedding_track_features(track, sequence, vq_model, max_samples=int(model["metadata"].get("max_samples", 5))) for track in tracklets], axis=0)
            prob = predict_probability(model, x)
        else:
            prob = np.zeros((0,), dtype=np.float32)
        keep_ids = set()
        for track, p in zip(tracklets, prob, strict=False):
            long_keep = track.length >= int(keep_long_min_len) and float(np.median(track.scores)) >= float(keep_long_min_median_conf)
            if float(p) >= threshold_value or long_keep:
                keep_ids.add(int(track.track_id))
        rows = read_mot_rows(tracker_root / f"{sequence.name}.txt")
        out_rows = [
            (int(row[0]), int(row[1]), float(row[2]), float(row[3]), float(row[4]), float(row[5]), float(row[6]))
            for row in rows
            if int(row[1]) in keep_ids
        ]
        write_mot_rows(out_root / f"{sequence.name}.txt", out_rows)
        stats[sequence.name] = {
            "tracks": int(len(tracklets)),
            "kept_tracks": int(len(keep_ids)),
            "source_rows": int(len(rows)),
            "output_rows": int(len(out_rows)),
            "threshold": float(threshold_value),
        }
    return stats
