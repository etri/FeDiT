from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import clip
import numpy as np
import torch
from PIL import Image

from mot20_io import SequenceInfo, read_mot_rows, write_mot_rows
from neural_vlm_conditioner import _resolve_device


POSITIVE_PROMPTS = (
    "a photo of a person",
    "a pedestrian",
    "a human being",
    "a full body person",
    "a partially visible person",
    "a person in a crowd",
)
NEGATIVE_PROMPTS = (
    "an empty background",
    "a street without a person",
    "a vehicle",
    "a sign or an inanimate object",
    "a building or street scene",
    "a false object detection",
)
SCORE_NAMES = (
    "margin_mean",
    "margin_median",
    "margin_min",
    "margin_max",
    "positive_fraction",
    "positive_similarity_mean",
    "negative_similarity_mean",
)


def _tracker_root(path: str | Path) -> Path:
    root = Path(path).expanduser().resolve()
    return root / "data" if (root / "data").exists() else root


def _sample_track_rows(rows: list[list[float]], count: int) -> list[list[float]]:
    ordered = sorted(rows, key=lambda row: int(row[0]))
    if len(ordered) <= int(count):
        return ordered
    positions = np.linspace(0, len(ordered) - 1, int(count))
    indices = np.unique(np.rint(positions).astype(np.int64))
    return [ordered[int(index)] for index in indices]


def _square_crop(
    image: Image.Image,
    row: list[float],
    context: float,
) -> Image.Image:
    image_width, image_height = image.size
    x, y, width, height = [float(value) for value in row[2:6]]
    x1 = max(0, int(np.floor(x - float(context) * width)))
    y1 = max(0, int(np.floor(y - float(context) * height)))
    x2 = min(
        image_width,
        int(np.ceil(x + width + float(context) * width)),
    )
    y2 = min(
        image_height,
        int(np.ceil(y + height + float(context) * height)),
    )
    if x2 <= x1 or y2 <= y1:
        return Image.new("RGB", (32, 32), (124, 116, 104))
    crop = image.crop((x1, y1, x2, y2))
    side = max(crop.size)
    canvas = Image.new("RGB", (side, side), (124, 116, 104))
    canvas.paste(
        crop,
        ((side - crop.width) // 2, (side - crop.height) // 2),
    )
    return canvas


def cache_clip_track_scores(
    *,
    tracker_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    device: str = "mps",
    model_name: str = "ViT-B/32",
    samples_per_track: int = 5,
    crop_context: float = 0.10,
    batch_size: int = 64,
    overwrite: bool = False,
) -> Path:
    if int(samples_per_track) <= 0:
        raise ValueError("samples_per_track must be positive")
    source = _tracker_root(tracker_dir)
    target = Path(target_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    resolved_device = _resolve_device(device)
    model, preprocess = clip.load(
        str(model_name),
        device=resolved_device,
        jit=False,
    )
    model.eval()
    positive_tokens = clip.tokenize(list(POSITIVE_PROMPTS)).to(resolved_device)
    negative_tokens = clip.tokenize(list(NEGATIVE_PROMPTS)).to(resolved_device)
    with torch.inference_mode():
        positive_text = model.encode_text(positive_tokens).float()
        negative_text = model.encode_text(negative_tokens).float()
        positive_text /= positive_text.norm(dim=1, keepdim=True)
        negative_text /= negative_text.norm(dim=1, keepdim=True)

    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    totals: dict[str, dict] = {}
    for name in [str(value) for value in sequence_names]:
        output_path = target / f"{name}.npz"
        if output_path.exists() and not overwrite:
            continue
        sequence = sequence_by_name[name]
        rows = [row[:7] for row in read_mot_rows(source / f"{name}.txt")]
        by_track: dict[int, list[list[float]]] = {}
        for row in rows:
            by_track.setdefault(int(row[1]), []).append(row)

        sampled: list[tuple[int, list[float]]] = []
        track_ids = np.asarray(sorted(by_track), dtype=np.int64)
        lengths = np.asarray(
            [len(by_track[int(track_id)]) for track_id in track_ids],
            dtype=np.int64,
        )
        spans = np.asarray(
            [
                max(
                    int(max(row[0] for row in by_track[int(track_id)]))
                    - int(min(row[0] for row in by_track[int(track_id)]))
                    + 1,
                    1,
                )
                for track_id in track_ids
            ],
            dtype=np.int64,
        )
        mean_track_scores = np.asarray(
            [
                np.mean([row[6] for row in by_track[int(track_id)]])
                for track_id in track_ids
            ],
            dtype=np.float32,
        )
        for track_index, track_id in enumerate(track_ids):
            for row in _sample_track_rows(
                by_track[int(track_id)],
                int(samples_per_track),
            ):
                sampled.append((track_index, row))

        margins = np.empty((len(sampled),), dtype=np.float32)
        positive_similarities = np.empty((len(sampled),), dtype=np.float32)
        negative_similarities = np.empty((len(sampled),), dtype=np.float32)
        by_frame: dict[int, list[int]] = {}
        for sample_index, (_track_index, row) in enumerate(sampled):
            by_frame.setdefault(int(row[0]), []).append(sample_index)

        pending_indices: list[int] = []
        pending_crops: list[torch.Tensor] = []

        def flush() -> None:
            if not pending_indices:
                return
            tensor = torch.stack(pending_crops).to(resolved_device)
            with torch.inference_mode():
                image_features = model.encode_image(tensor).float()
                image_features /= image_features.norm(dim=1, keepdim=True)
                positive = image_features @ positive_text.T
                negative = image_features @ negative_text.T
                positive_max = positive.max(dim=1).values
                negative_max = negative.max(dim=1).values
            indices = np.asarray(pending_indices, dtype=np.int64)
            positive_values = positive_max.cpu().numpy().astype(np.float32)
            negative_values = negative_max.cpu().numpy().astype(np.float32)
            positive_similarities[indices] = positive_values
            negative_similarities[indices] = negative_values
            margins[indices] = positive_values - negative_values
            pending_indices.clear()
            pending_crops.clear()

        for frame, sample_indices in sorted(by_frame.items()):
            image_path = (
                sequence.img_dir
                / f"{int(frame):06d}{sequence.image_ext}"
            )
            with Image.open(image_path) as loaded:
                image = loaded.convert("RGB")
                for sample_index in sample_indices:
                    _track_index, row = sampled[sample_index]
                    pending_indices.append(sample_index)
                    pending_crops.append(
                        preprocess(
                            _square_crop(image, row, float(crop_context))
                        )
                    )
                    if len(pending_indices) >= int(batch_size):
                        flush()
        flush()

        scores = np.zeros(
            (len(track_ids), len(SCORE_NAMES)),
            dtype=np.float32,
        )
        sample_track_indices = np.asarray(
            [track_index for track_index, _row in sampled],
            dtype=np.int64,
        )
        for track_index in range(len(track_ids)):
            indices = np.flatnonzero(sample_track_indices == track_index)
            values = margins[indices]
            positive_values = positive_similarities[indices]
            negative_values = negative_similarities[indices]
            scores[track_index] = np.asarray(
                [
                    np.mean(values),
                    np.median(values),
                    np.min(values),
                    np.max(values),
                    np.mean(values > 0.0),
                    np.mean(positive_values),
                    np.mean(negative_values),
                ],
                dtype=np.float32,
            )
        np.savez_compressed(
            output_path,
            track_ids=track_ids,
            lengths=lengths,
            spans=spans,
            mean_track_scores=mean_track_scores,
            scores=scores,
            score_names=np.asarray(SCORE_NAMES),
        )
        totals[name] = {
            "tracks": int(len(track_ids)),
            "rows": int(len(rows)),
            "sampled_crops": int(len(sampled)),
        }
        print(
            f"{name}: tracks={len(track_ids)} crops={len(sampled)}",
            flush=True,
        )

    (target / "metadata.json").write_text(
        json.dumps(
            {
                "kind": "clip_semantic_track_scores",
                "source_tracker": str(source),
                "model_name": str(model_name),
                "device": resolved_device,
                "samples_per_track": int(samples_per_track),
                "crop_context": float(crop_context),
                "positive_prompts": list(POSITIVE_PROMPTS),
                "negative_prompts": list(NEGATIVE_PROMPTS),
                "score_names": list(SCORE_NAMES),
                "counts": totals,
                "uses_gt": False,
                "no_yolo_inference": True,
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    return target


def apply_clip_track_filter(
    *,
    tracker_dir: str | Path,
    score_cache_dir: str | Path,
    target_dir: str | Path,
    sequence_names: Iterable[str],
    score_name: str = "margin_median",
    threshold: float = 0.0,
    protect_length: int = 0,
    protect_density: float = 0.0,
    overwrite: bool = False,
) -> Path:
    source = _tracker_root(tracker_dir)
    cache = Path(score_cache_dir).expanduser().resolve()
    target = Path(target_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    stats: dict[str, dict] = {}
    for name in [str(value) for value in sequence_names]:
        output_path = target / f"{name}.txt"
        if output_path.exists() and not overwrite:
            continue
        payload = np.load(cache / f"{name}.npz")
        score_names = [str(value) for value in payload["score_names"]]
        if str(score_name) not in score_names:
            raise ValueError(f"Unknown CLIP track score: {score_name}")
        score_index = score_names.index(str(score_name))
        track_ids = payload["track_ids"].astype(np.int64)
        lengths = payload["lengths"].astype(np.int64)
        spans = payload["spans"].astype(np.int64)
        values = payload["scores"][:, score_index].astype(np.float32)
        density = lengths / np.maximum(spans, 1)
        keep = values >= float(threshold)
        if int(protect_length) > 0:
            keep |= lengths >= int(protect_length)
        if float(protect_density) > 0:
            keep |= density >= float(protect_density)
        kept_ids = set(track_ids[keep].tolist())
        rows = [row[:7] for row in read_mot_rows(source / f"{name}.txt")]
        kept_rows = [row for row in rows if int(row[1]) in kept_ids]
        write_mot_rows(output_path, kept_rows)
        stats[name] = {
            "source_tracks": int(len(track_ids)),
            "kept_tracks": int(np.sum(keep)),
            "source_rows": int(len(rows)),
            "kept_rows": int(len(kept_rows)),
        }
        print(
            f"{name}: tracks={len(track_ids)} -> {int(np.sum(keep))} "
            f"rows={len(rows)} -> {len(kept_rows)}",
            flush=True,
        )
    (target / "clip_semantic_track_filter_metadata.json").write_text(
        json.dumps(
            {
                "kind": "clip_semantic_track_filtered",
                "source_tracker": str(source),
                "score_cache": str(cache),
                "score_name": str(score_name),
                "threshold": float(threshold),
                "protect_length": int(protect_length),
                "protect_density": float(protect_density),
                "stats": stats,
                "uses_gt": False,
                "no_yolo_inference": True,
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    return target
