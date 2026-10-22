from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Iterable

import cv2
import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset
from torchvision.models import MobileNet_V3_Small_Weights, mobilenet_v3_small

from detection_io import DetectionSet, load_detections, save_detections, write_run_metadata
from mot20_io import TRAIN_SEQUENCES, SequenceInfo, load_gt
from neural_vlm_conditioner import _resolve_device
from vlm_conditioner import FEATURE_NAMES, _frame_features, _labels_for_frame


BACKBONE_DIM = 576
BACKBONE_NAME = "mobilenet_v3_small_imagenet1k_v1"


class CropConditionerHead(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 192) -> None:
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.15),
            nn.Linear(hidden_dim, 96),
            nn.GELU(),
            nn.Dropout(0.05),
            nn.Linear(96, 1),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return self.network(features).squeeze(1)


def _load_backbone(device: str) -> nn.Module:
    model = mobilenet_v3_small(weights=MobileNet_V3_Small_Weights.DEFAULT)
    backbone = model.features.eval().to(device)
    for parameter in backbone.parameters():
        parameter.requires_grad_(False)
    return backbone


def _crop_tensor(image: np.ndarray, boxes: np.ndarray) -> torch.Tensor:
    crops: list[np.ndarray] = []
    image_h, image_w = image.shape[:2]
    for box in boxes:
        x1 = int(max(0, min(image_w - 1, math.floor(float(box[0])))))
        y1 = int(max(0, min(image_h - 1, math.floor(float(box[1])))))
        x2 = int(max(0, min(image_w, math.ceil(float(box[2])))))
        y2 = int(max(0, min(image_h, math.ceil(float(box[3])))))
        if x2 <= x1 or y2 <= y1:
            crop = np.zeros((128, 64, 3), dtype=np.uint8)
        else:
            crop = cv2.resize(
                image[y1:y2, x1:x2],
                (64, 128),
                interpolation=cv2.INTER_LINEAR,
            )
        crops.append(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
    array = np.stack(crops).astype(np.float32) / 255.0
    array = np.transpose(array, (0, 3, 1, 2))
    tensor = torch.from_numpy(array)
    mean = torch.tensor([0.485, 0.456, 0.406], dtype=torch.float32)[None, :, None, None]
    std = torch.tensor([0.229, 0.224, 0.225], dtype=torch.float32)[None, :, None, None]
    return (tensor - mean) / std


def _extract_crop_embeddings(
    backbone: nn.Module,
    image: np.ndarray,
    boxes: np.ndarray,
    *,
    device: str,
    batch_size: int,
) -> np.ndarray:
    output = np.empty((len(boxes), BACKBONE_DIM), dtype=np.float32)
    with torch.inference_mode():
        for start in range(0, len(boxes), int(batch_size)):
            end = min(start + int(batch_size), len(boxes))
            tensor = _crop_tensor(image, boxes[start:end]).to(device)
            feature_map = backbone(tensor)
            pooled = nn.functional.adaptive_avg_pool2d(feature_map, 1).flatten(1)
            output[start:end] = pooled.cpu().numpy().astype(np.float32)
    return output


def _predict(
    model: CropConditionerHead,
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
            normalized = (features[start:end] - mean) / scale
            tensor = torch.from_numpy(normalized.astype(np.float32, copy=False)).to(device)
            output[start:end] = torch.sigmoid(model(tensor)).cpu().numpy().astype(np.float32)
    return output


def _sample_sequence(
    *,
    detection_path: Path,
    sequence: SequenceInfo,
    backbone: nn.Module,
    device: str,
    min_input_score: float,
    max_samples: int,
    positive_fraction: float,
    crop_batch_size: int,
    rng: np.random.Generator,
) -> tuple[np.ndarray, np.ndarray, dict]:
    detections = load_detections(detection_path)
    valid_gt, ignore_gt = load_gt(sequence.gt_path)
    valid_by_frame = {int(frame): rows for frame, rows in valid_gt.groupby("frame")}
    ignore_by_frame = {int(frame): rows for frame, rows in ignore_gt.groupby("frame")}
    empty_valid = valid_gt.iloc[0:0]
    empty_ignore = ignore_gt.iloc[0:0]
    records: list[tuple[int, int, int]] = []
    matched_gt = 0
    by_frame = {int(frame): indices for frame, indices in detections.by_frame().items()}
    for frame, all_indices in sorted(by_frame.items()):
        indices = all_indices[
            detections.calibrated_scores[all_indices] >= float(min_input_score)
        ]
        if len(indices) == 0:
            continue
        labels, ignored, matched = _labels_for_frame(
            detections=detections,
            indices=indices,
            gt_frame=valid_by_frame.get(frame, empty_valid),
            ignore_frame=ignore_by_frame.get(frame, empty_ignore),
            iou_threshold=0.5,
            ignore_iou_threshold=0.5,
        )
        for local_index in np.flatnonzero(~ignored):
            records.append((int(frame), int(indices[local_index]), int(labels[local_index])))
        matched_gt += int(matched)

    positive = np.asarray([i for i, record in enumerate(records) if record[2] == 1], dtype=np.int64)
    negative = np.asarray([i for i, record in enumerate(records) if record[2] == 0], dtype=np.int64)
    positive_budget = min(len(positive), max(1, int(max_samples * float(positive_fraction))))
    negative_budget = min(len(negative), int(max_samples) - positive_budget)
    selected_positive = (
        rng.choice(positive, size=positive_budget, replace=False)
        if len(positive) > positive_budget
        else positive
    )
    selected_negative = (
        rng.choice(negative, size=negative_budget, replace=False)
        if len(negative) > negative_budget
        else negative
    )
    selected_records = [records[index] for index in np.concatenate([selected_positive, selected_negative])]
    rng.shuffle(selected_records)
    selected_by_frame: dict[int, list[tuple[int, int]]] = {}
    for frame, index, label in selected_records:
        selected_by_frame.setdefault(frame, []).append((index, label))

    features: list[np.ndarray] = []
    labels: list[np.ndarray] = []
    for frame, frame_records in sorted(selected_by_frame.items()):
        indices = np.asarray([record[0] for record in frame_records], dtype=np.int64)
        image_path = sequence.img_dir / f"{frame:06d}{sequence.image_ext}"
        image = cv2.imread(str(image_path))
        if image is None:
            raise FileNotFoundError(f"Could not decode frame: {image_path}")
        crop_embeddings = _extract_crop_embeddings(
            backbone,
            image,
            detections.boxes[indices].astype(np.float32),
            device=device,
            batch_size=int(crop_batch_size),
        )
        geometry = _frame_features(detections, indices, sequence)
        features.append(np.concatenate([geometry, crop_embeddings], axis=1).astype(np.float32))
        labels.append(np.asarray([record[1] for record in frame_records], dtype=np.float32))
    x = np.concatenate(features)
    y = np.concatenate(labels)
    stats = {
        "source_detections": int(len(detections)),
        "candidates_at_score_floor": int(len(records)),
        "samples": int(len(y)),
        "positive": int(np.sum(y == 1)),
        "negative": int(np.sum(y == 0)),
        "matched_gt_at_score_floor": int(matched_gt),
        "valid_gt": int(len(valid_gt)),
        "candidate_recall_at_iou": float(matched_gt / max(len(valid_gt), 1)),
    }
    return x, y, stats


def train_crop_neural_conditioner(
    *,
    detection_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    train_sequences: Iterable[str],
    device: str = "auto",
    min_input_score: float = 0.5,
    max_samples_per_sequence: int = 40_000,
    positive_fraction: float = 0.5,
    crop_batch_size: int = 128,
    epochs: int = 6,
    batch_size: int = 4096,
    learning_rate: float = 8.0e-4,
    weight_decay: float = 1.0e-4,
    validation_fraction: float = 0.15,
    focal_gamma: float = 1.0,
    seed: int = 20260728,
) -> dict:
    names = [str(name) for name in train_sequences]
    resolved_device = _resolve_device(device)
    backbone = _load_backbone(resolved_device)
    sequence_by_name = {sequence.name: sequence for sequence in sequences}
    source = Path(detection_dir).expanduser().resolve()
    rng = np.random.default_rng(int(seed))
    xs: list[np.ndarray] = []
    ys: list[np.ndarray] = []
    sequence_stats: dict[str, dict] = {}
    for name in names:
        x, y, stats = _sample_sequence(
            detection_path=source / f"{name}.npz",
            sequence=sequence_by_name[name],
            backbone=backbone,
            device=resolved_device,
            min_input_score=float(min_input_score),
            max_samples=int(max_samples_per_sequence),
            positive_fraction=float(positive_fraction),
            crop_batch_size=int(crop_batch_size),
            rng=rng,
        )
        xs.append(x)
        ys.append(y)
        sequence_stats[name] = stats
        print(f"{name}: crop samples={len(y)} positive={int(y.sum())}")

    features = np.concatenate(xs).astype(np.float32)
    labels = np.concatenate(ys).astype(np.float32)
    order = rng.permutation(len(labels))
    validation_count = max(1, int(round(len(order) * float(validation_fraction))))
    validation_indices = order[:validation_count]
    train_indices = order[validation_count:]
    mean = features[train_indices].mean(axis=0, dtype=np.float64).astype(np.float32)
    scale = np.maximum(
        features[train_indices].std(axis=0, dtype=np.float64).astype(np.float32),
        1.0e-4,
    )
    train_x = ((features[train_indices] - mean) / scale).astype(np.float32)
    train_y = labels[train_indices]

    torch.manual_seed(int(seed))
    model = CropConditionerHead(features.shape[1]).to(resolved_device)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=float(learning_rate),
        weight_decay=float(weight_decay),
    )
    loader = DataLoader(
        TensorDataset(torch.from_numpy(train_x), torch.from_numpy(train_y)),
        batch_size=int(batch_size),
        shuffle=True,
        num_workers=0,
    )
    best_loss = float("inf")
    best_state: dict[str, torch.Tensor] | None = None
    history: list[dict] = []
    for epoch in range(1, int(epochs) + 1):
        model.train()
        total_loss = 0.0
        count = 0
        for batch_x, batch_y in loader:
            batch_x = batch_x.to(resolved_device)
            batch_y = batch_y.to(resolved_device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(batch_x)
            probabilities = torch.sigmoid(logits)
            bce = nn.functional.binary_cross_entropy_with_logits(logits, batch_y, reduction="none")
            p_t = batch_y * probabilities + (1.0 - batch_y) * (1.0 - probabilities)
            loss = (bce * torch.pow(1.0 - p_t, float(focal_gamma))).mean()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            optimizer.step()
            total_loss += float(loss.detach().cpu()) * len(batch_x)
            count += len(batch_x)

        validation_probabilities = _predict(
            model,
            features[validation_indices],
            mean=mean,
            scale=scale,
            device=resolved_device,
            batch_size=int(batch_size),
        )
        validation_labels = labels[validation_indices]
        validation_loss = -(
            validation_labels * np.log(np.maximum(validation_probabilities, 1.0e-7))
            + (1.0 - validation_labels)
            * np.log(np.maximum(1.0 - validation_probabilities, 1.0e-7))
        ).mean()
        history.append(
            {
                "epoch": int(epoch),
                "train_loss": float(total_loss / max(count, 1)),
                "validation_loss": float(validation_loss),
            }
        )
        print(
            f"epoch {epoch}: train={history[-1]['train_loss']:.6f} "
            f"validation={history[-1]['validation_loss']:.6f}"
        )
        if np.isfinite(validation_loss) and float(validation_loss) <= best_loss:
            best_loss = float(validation_loss)
            best_state = {
                key: value.detach().cpu().clone()
                for key, value in model.state_dict().items()
            }

    if best_state is None:
        raise RuntimeError("No finite crop neural checkpoint was produced")
    metadata = {
        "kind": "crop_neural_conditioner",
        "source_detections": str(source),
        "train_sequences": names,
        "device": resolved_device,
        "input_dim": int(features.shape[1]),
        "hidden_dim": 192,
        "geometry_feature_names": FEATURE_NAMES,
        "backbone": BACKBONE_NAME,
        "backbone_dim": BACKBONE_DIM,
        "backbone_frozen": True,
        "backbone_pretraining": "ImageNet-1K",
        "min_input_score": float(min_input_score),
        "epochs": int(epochs),
        "batch_size": int(batch_size),
        "learning_rate": float(learning_rate),
        "weight_decay": float(weight_decay),
        "validation_fraction": float(validation_fraction),
        "focal_gamma": float(focal_gamma),
        "seed": int(seed),
        "history": history,
        "sequence_stats": sequence_stats,
        "training_samples": {
            "count": int(len(train_indices)),
            "positive": int(np.sum(labels[train_indices] == 1)),
            "negative": int(np.sum(labels[train_indices] == 0)),
            "validation": int(len(validation_indices)),
        },
        "between_vlm_detector_and_tracker": True,
        "uses_crop_appearance": True,
        "boxes_unchanged": True,
        "tracker_unchanged": True,
        "no_detector_finetuning": True,
        "external_pretraining": "ImageNet-1K",
        "no_oracle_ids": True,
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


def apply_crop_neural_conditioner(
    *,
    model_path: str | Path,
    detection_dir: str | Path,
    target_dir: str | Path,
    sequences: Iterable[SequenceInfo],
    sequence_names: Iterable[str],
    device: str = "auto",
    input_score_floor: float = 0.7,
    threshold: float = 0.05,
    blend_input: float = 0.0,
    top_k: int | None = 120,
    crop_batch_size: int = 128,
    head_batch_size: int = 4096,
    overwrite: bool = False,
) -> Path:
    resolved_device = _resolve_device(device)
    payload = torch.load(
        Path(model_path).expanduser().resolve(),
        map_location="cpu",
        weights_only=False,
    )
    metadata = dict(payload["metadata"])
    if metadata.get("kind") != "crop_neural_conditioner":
        raise AssertionError(f"Unexpected model kind: {metadata.get('kind')}")
    backbone = _load_backbone(resolved_device)
    model = CropConditionerHead(
        int(metadata["input_dim"]),
        int(metadata["hidden_dim"]),
    ).to(resolved_device)
    model.load_state_dict(payload["state_dict"])
    mean = np.asarray(payload["mean"], dtype=np.float32)
    scale = np.asarray(payload["scale"], dtype=np.float32)
    source = Path(detection_dir).expanduser().resolve()
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
        selected_indices: list[np.ndarray] = []
        selected_scores: list[np.ndarray] = []
        input_candidates = 0
        for frame, all_indices in sorted(detections.by_frame().items()):
            indices = all_indices[
                detections.calibrated_scores[all_indices] >= float(input_score_floor)
            ]
            if len(indices) == 0:
                continue
            input_candidates += int(len(indices))
            image_path = sequence.img_dir / f"{int(frame):06d}{sequence.image_ext}"
            image = cv2.imread(str(image_path))
            if image is None:
                raise FileNotFoundError(f"Could not decode frame: {image_path}")
            embeddings = _extract_crop_embeddings(
                backbone,
                image,
                detections.boxes[indices].astype(np.float32),
                device=resolved_device,
                batch_size=int(crop_batch_size),
            )
            geometry = _frame_features(detections, indices, sequence)
            features = np.concatenate([geometry, embeddings], axis=1).astype(np.float32)
            scores = _predict(
                model,
                features,
                mean=mean,
                scale=scale,
                device=resolved_device,
                batch_size=int(head_batch_size),
            )
            if float(blend_input) > 0:
                scores = (
                    (1.0 - float(blend_input)) * scores
                    + float(blend_input) * detections.calibrated_scores[indices]
                ).astype(np.float32)
            keep = np.flatnonzero(scores >= float(threshold))
            if top_k is not None and len(keep) > int(top_k):
                keep = keep[np.argsort(-scores[keep])[: int(top_k)]]
            if len(keep):
                selected_indices.append(indices[keep].astype(np.int64))
                selected_scores.append(scores[keep].astype(np.float32))

        selected = (
            np.concatenate(selected_indices)
            if selected_indices
            else np.zeros((0,), dtype=np.int64)
        )
        scores = (
            np.concatenate(selected_scores)
            if selected_scores
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
            "input_candidates": int(input_candidates),
            "conditioned_detections": int(len(conditioned)),
        }
        print(f"{name}: candidates={input_candidates} -> {len(conditioned)}")

    write_run_metadata(
        target,
        {
            "kind": "crop_neural_conditioned",
            "source": str(source),
            "model": str(Path(model_path).expanduser().resolve()),
            "model_metadata": metadata,
            "device": resolved_device,
            "input_score_floor": float(input_score_floor),
            "threshold": float(threshold),
            "blend_input": float(blend_input),
            "top_k": None if top_k is None else int(top_k),
            "counts": totals,
            "between_vlm_detector_and_tracker": True,
            "uses_crop_appearance": True,
            "boxes_unchanged": True,
            "tracker_unchanged": True,
            "no_detector_finetuning": True,
            "external_pretraining": "ImageNet-1K",
            "no_oracle_ids": True,
        },
    )
    return target
