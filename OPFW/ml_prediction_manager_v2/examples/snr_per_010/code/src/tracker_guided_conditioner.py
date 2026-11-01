from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import numpy as np

from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import SequenceInfo, read_mot_rows
from nms import standard_nms


def _tracker_root(path: str | Path) -> Path:
    root = Path(path).expanduser().resolve()
    return root / "data" if (root / "data").exists() else root


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


def apply_tracker_guided_conditioner(
    *,
    detection_dir: str | Path,
    guide_tracker_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    nms_iou: float = 0.6,
    count_multiplier: float = 1.05,
    count_offset: float = 0.0,
    smoothing_radius: int = 2,
    rank_temperature: float = 0.2,
    input_score_blend: float = 0.2,
    min_count: float = 1.0,
    top_k: int | None = 300,
    score_threshold: float = 0.01,
    overwrite: bool = False,
) -> Path:
    source = Path(detection_dir).expanduser().resolve()
    guide_root = _tracker_root(guide_tracker_dir)
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
        guide_counts = np.zeros((int(sequence.seq_length),), dtype=np.float32)
        for row in read_mot_rows(guide_root / f"{name}.txt"):
            frame = int(row[0])
            if 1 <= frame <= int(sequence.seq_length):
                guide_counts[frame - 1] += 1.0
        guide_counts = _smooth_counts(guide_counts, int(smoothing_radius))
        desired_counts = np.maximum(
            float(min_count),
            float(count_multiplier) * guide_counts + float(count_offset),
        )

        selected_parts: list[np.ndarray] = []
        score_parts: list[np.ndarray] = []
        empty = np.zeros((0,), dtype=np.int64)
        for frame in range(1, int(sequence.seq_length) + 1):
            indices = by_frame.get(frame, empty)
            if not len(indices):
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

            desired = float(desired_counts[frame - 1])
            scale = max(float(rank_temperature) * max(desired, 1.0), 1.0)
            ranks = np.arange(len(indices), dtype=np.float32) + 0.5
            rank_scores = 1.0 / (
                1.0
                + np.exp(
                    np.clip((ranks - desired) / scale, -60.0, 60.0)
                )
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
            "guide_count_mean": float(np.mean(guide_counts)),
            "desired_count_mean": float(np.mean(desired_counts)),
        }
        print(
            f"{name}: {len(detections)} -> {len(conditioned)} "
            f"guide={np.mean(guide_counts):.2f} "
            f"desired={np.mean(desired_counts):.2f}",
            flush=True,
        )

    write_run_metadata(
        target,
        {
            "kind": "tracker_guided_neural_score_conditioned",
            "source": str(source),
            "guide_tracker": str(guide_root),
            "nms_iou": float(nms_iou),
            "count_multiplier": float(count_multiplier),
            "count_offset": float(count_offset),
            "smoothing_radius": int(smoothing_radius),
            "rank_temperature": float(rank_temperature),
            "input_score_blend": float(input_score_blend),
            "min_count": float(min_count),
            "top_k": None if top_k is None else int(top_k),
            "score_threshold": float(score_threshold),
            "counts": totals,
            "uses_gt": False,
            "uses_groundingdino_teacher_tracks": True,
            "no_yolo_inference": True,
        },
    )
    return target
