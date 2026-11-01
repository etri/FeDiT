from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Mapping

import numpy as np
import torch

from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import SequenceInfo
from neural_vlm_conditioner import _resolve_device
from osnet_quality_conditioner import (
    OSNET_DIM,
    QUALITY_GEOMETRY_NAMES,
    OSNetQualityConditioner,
    _load_embeddings,
    _predict,
    _quality_geometry_features,
)


def _install_numpy_pickle_compat() -> None:
    pass
    import sys

    sys.modules.setdefault("numpy._core", np.core)
    sys.modules.setdefault("numpy._core.multiarray", np.core.multiarray)
    sys.modules.setdefault(
        "numpy._core._multiarray_umath",
        np.core._multiarray_umath,
    )


@dataclass(frozen=True)
class _QualityModel:
    path: Path
    model: OSNetQualityConditioner
    mean: np.ndarray
    scale: np.ndarray
    geometry_names: tuple[str, ...]
    metadata: dict


def _load_model(path: str | Path, device: str) -> _QualityModel:
    resolved = Path(path).expanduser().resolve()
    _install_numpy_pickle_compat()
    payload = torch.load(resolved, map_location="cpu", weights_only=False)
    metadata = dict(payload["metadata"])
    if metadata.get("kind") != "osnet_quality_conditioner":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    geometry_names = tuple(
        metadata.get("geometry_feature_names", QUALITY_GEOMETRY_NAMES)
    )
    expected_dim = len(geometry_names) + OSNET_DIM
    if int(metadata["input_dim"]) != expected_dim:
        raise AssertionError(
            f"Model input mismatch for {resolved}: "
            f"{metadata['input_dim']} != {expected_dim}"
        )
    model = OSNetQualityConditioner(
        int(metadata["input_dim"]),
        int(metadata["hidden_dim"]),
    ).to(device)
    model.load_state_dict(payload["state_dict"])
    return _QualityModel(
        path=resolved,
        model=model,
        mean=np.asarray(payload["mean"], dtype=np.float32),
        scale=np.asarray(payload["scale"], dtype=np.float32),
        geometry_names=geometry_names,
        metadata=metadata,
    )


def _predict_chunked(
    loaded: _QualityModel,
    detections: DetectionSet,
    embeddings: np.ndarray,
    sequence: SequenceInfo,
    *,
    device: str,
    batch_size: int,
    chunk_rows: int,
) -> tuple[np.ndarray, np.ndarray]:
    scores = np.empty((len(detections),), dtype=np.float32)
    deltas = np.empty((len(detections), 4), dtype=np.float32)
    pending_indices: list[np.ndarray] = []
    pending_geometry: list[np.ndarray] = []
    pending_count = 0

    def flush() -> None:
        nonlocal pending_count
        if not pending_indices:
            return
        indices = np.concatenate(pending_indices)
        geometry = np.concatenate(pending_geometry, axis=0)
        features = np.concatenate(
            [geometry, np.asarray(embeddings[indices], dtype=np.float32)],
            axis=1,
        )
        part_scores, part_deltas = _predict(
            loaded.model,
            features,
            mean=loaded.mean,
            scale=loaded.scale,
            device=device,
            batch_size=int(batch_size),
        )
        scores[indices] = part_scores
        deltas[indices] = part_deltas
        pending_indices.clear()
        pending_geometry.clear()
        pending_count = 0

    for _, indices in sorted(detections.by_frame().items()):
        if pending_count and pending_count + len(indices) > int(chunk_rows):
            flush()
        pending_indices.append(indices)
        pending_geometry.append(
            _quality_geometry_features(
                detections,
                indices,
                sequence,
                loaded.geometry_names,
            )
        )
        pending_count += len(indices)
    flush()
    return scores, deltas


def _logit_blend(
    primary: np.ndarray,
    adapted: np.ndarray,
    adapted_weight: float,
) -> np.ndarray:
    epsilon = 1.0e-5
    primary_safe = np.clip(primary, epsilon, 1.0 - epsilon)
    adapted_safe = np.clip(adapted, epsilon, 1.0 - epsilon)
    primary_logit = np.log(primary_safe) - np.log1p(-primary_safe)
    adapted_logit = np.log(adapted_safe) - np.log1p(-adapted_safe)
    mixed = (
        (1.0 - float(adapted_weight)) * primary_logit
        + float(adapted_weight) * adapted_logit
    )
    return (1.0 / (1.0 + np.exp(-mixed))).astype(np.float32)


def apply_osnet_quality_ensemble(
    *,
    primary_model_path: str | Path,
    adapted_model_paths: Mapping[str, str | Path],
    detection_dir: str | Path,
    embedding_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    adapted_weight: float,
    delta_adapted_weight: float | None = None,
    device: str = "auto",
    threshold: float = 0.001,
    top_k: int | None = 1000,
    blend_input: float = 0.0,
    box_delta_scale: float = 1.0,
    batch_size: int = 4096,
    chunk_rows: int = 65536,
    overwrite: bool = False,
) -> Path:
    if not 0.0 <= float(adapted_weight) <= 1.0:
        raise ValueError("adapted_weight must be in [0, 1]")
    delta_weight = (
        float(adapted_weight)
        if delta_adapted_weight is None
        else float(delta_adapted_weight)
    )
    if not 0.0 <= delta_weight <= 1.0:
        raise ValueError("delta_adapted_weight must be in [0, 1]")

    resolved_device = _resolve_device(device)
    primary = _load_model(primary_model_path, resolved_device)
    adapted_cache: dict[Path, _QualityModel] = {}
    source = Path(detection_dir).expanduser().resolve()
    embedding_root = Path(embedding_dir).expanduser().resolve()
    target = Path(target_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    totals: dict[str, dict] = {}
    adapted_metadata: dict[str, dict] = {}

    for name in [str(value) for value in sequence_names]:
        output_path = target / f"{name}.npz"
        if output_path.exists() and not overwrite:
            continue
        if name not in adapted_model_paths:
            raise KeyError(f"No adapted model was supplied for {name}")
        adapted_path = Path(adapted_model_paths[name]).expanduser().resolve()
        adapted = adapted_cache.get(adapted_path)
        if adapted is None:
            adapted = _load_model(adapted_path, resolved_device)
            adapted_cache[adapted_path] = adapted
        adapted_metadata[name] = {
            "path": str(adapted.path),
            "metadata": adapted.metadata,
        }

        sequence = sequence_by_name[name]
        detections = load_detections(source / f"{name}.npz")
        embeddings = _load_embeddings(embedding_root, name, len(detections))
        primary_scores, primary_deltas = _predict_chunked(
            primary,
            detections,
            embeddings,
            sequence,
            device=resolved_device,
            batch_size=int(batch_size),
            chunk_rows=int(chunk_rows),
        )
        adapted_scores, adapted_deltas = _predict_chunked(
            adapted,
            detections,
            embeddings,
            sequence,
            device=resolved_device,
            batch_size=int(batch_size),
            chunk_rows=int(chunk_rows),
        )
        scores = _logit_blend(
            primary_scores,
            adapted_scores,
            float(adapted_weight),
        )
        if float(blend_input) > 0:
            scores = (
                (1.0 - float(blend_input)) * scores
                + float(blend_input) * detections.calibrated_scores
            ).astype(np.float32)
        deltas = (
            (1.0 - delta_weight) * primary_deltas
            + delta_weight * adapted_deltas
        ).astype(np.float32)

        boxes = detections.boxes.astype(np.float32).copy()
        if float(box_delta_scale) != 0.0:
            widths = np.maximum(boxes[:, 2] - boxes[:, 0], 1.0)
            heights = np.maximum(boxes[:, 3] - boxes[:, 1], 1.0)
            factors = np.column_stack(
                [widths, heights, widths, heights]
            ).astype(np.float32)
            boxes += float(box_delta_scale) * deltas * factors
            boxes[:, [0, 2]] = np.clip(
                boxes[:, [0, 2]], 0, float(sequence.width)
            )
            boxes[:, [1, 3]] = np.clip(
                boxes[:, [1, 3]], 0, float(sequence.height)
            )

        selected_indices: list[np.ndarray] = []
        selected_scores: list[np.ndarray] = []
        for _, indices in sorted(detections.by_frame().items()):
            keep = indices[scores[indices] >= float(threshold)]
            if top_k is not None and len(keep) > int(top_k):
                keep = keep[np.argsort(-scores[keep])[: int(top_k)]]
            valid = (boxes[keep, 2] > boxes[keep, 0] + 1.0) & (
                boxes[keep, 3] > boxes[keep, 1] + 1.0
            )
            if np.any(valid):
                selected_indices.append(keep[valid].astype(np.int64))
                selected_scores.append(scores[keep][valid].astype(np.float32))
        selected = (
            np.concatenate(selected_indices)
            if selected_indices
            else np.zeros((0,), dtype=np.int64)
        )
        selected_quality = (
            np.concatenate(selected_scores)
            if selected_scores
            else np.zeros((0,), dtype=np.float32)
        )
        conditioned = DetectionSet(
            frames=detections.frames[selected],
            boxes=boxes[selected],
            raw_scores=detections.raw_scores[selected],
            calibrated_scores=selected_quality,
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
            "primary_score_mean": float(np.mean(primary_scores)),
            "adapted_score_mean": float(np.mean(adapted_scores)),
            "ensemble_score_mean": float(np.mean(scores)),
        }
        print(f"{name}: {len(detections)} -> {len(conditioned)}")

    write_run_metadata(
        target,
        {
            "kind": "osnet_quality_logit_ensemble",
            "source": str(source),
            "embedding_dir": str(embedding_root),
            "primary_model": str(primary.path),
            "primary_model_metadata": primary.metadata,
            "adapted_models": adapted_metadata,
            "adapted_weight": float(adapted_weight),
            "delta_adapted_weight": float(delta_weight),
            "device": resolved_device,
            "threshold": float(threshold),
            "top_k": None if top_k is None else int(top_k),
            "blend_input": float(blend_input),
            "box_delta_scale": float(box_delta_scale),
            "batch_size": int(batch_size),
            "chunk_rows": int(chunk_rows),
            "counts": totals,
            "between_vlm_detector_and_tracker": True,
            "boxes_start_from_groundingdino": True,
            "tracker_unchanged": True,
            "no_detector_finetuning": True,
            "no_yolo_inference": True,
            "no_oracle_ids": True,
            "uses_heldout_ground_truth": False,
        },
    )
    return target
