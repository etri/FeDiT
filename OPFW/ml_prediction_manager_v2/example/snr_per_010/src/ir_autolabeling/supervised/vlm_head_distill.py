from __future__ import annotations

import contextlib
import json
import os
import sys
from contextlib import contextmanager, nullcontext
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterable

import numpy as np
import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset

from ir_autolabeling.data.mot20 import iter_frame_paths, load_mot20_sequences
from ir_autolabeling.detectors.base import RawDetections
from ir_autolabeling.utils.config import ensure_dir
from ir_autolabeling.utils.io import append_jsonl, inspect_jsonl_frame_sequence, iter_jsonl


def _resolve_hf_snapshot_dir(model_id: str) -> str | None:
    if not model_id or "/" not in model_id:
        return None
    expanded = Path(model_id).expanduser()
    if expanded.exists():
        return str(expanded.resolve())
    try:
        from huggingface_hub.constants import HF_HUB_CACHE
    except Exception:
        return None
    namespace, name = model_id.split("/", 1)
    snapshot_root = Path(HF_HUB_CACHE) / f"models--{namespace}--{name}" / "snapshots"
    if not snapshot_root.exists():
        return None
    snapshots = [path for path in snapshot_root.iterdir() if path.is_dir()]
    if not snapshots:
        return None
    snapshots.sort(key=lambda path: path.stat().st_mtime, reverse=True)
    return str(snapshots[0])


def _truthy_env(name: str) -> bool:
    value = os.getenv(name)
    if value is None:
        return False
    return value.strip().lower() not in {"", "0", "false", "no"}


def _is_local_only() -> bool:
    return bool(
        _truthy_env("HF_HUB_OFFLINE")
        or _truthy_env("TRANSFORMERS_OFFLINE")
        or _truthy_env("IR_HF_LOCAL_ONLY")
    )


def _resolve_device(name: str) -> str:
    normalized = str(name or "auto").strip().lower()
    if normalized == "auto":
        if torch.cuda.is_available():
            return "cuda"
        if torch.backends.mps.is_available():
            return "mps"
        return "cpu"
    if normalized == "mps" and not torch.backends.mps.is_available():
        return "cpu"
    return normalized


def _autocast_for(device: str):
    if device == "cuda":
        return torch.autocast(device_type="cuda", dtype=torch.bfloat16)
    return nullcontext()


def _json_default(value: Any) -> Any:
    if isinstance(value, Path):
        return str(value)
    raise TypeError(f"Object of type {type(value)!r} is not JSON serializable")


def _write_json(path: Path, payload: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True, default=_json_default) + "\n", encoding="utf-8")
    return path


def _xyxy_to_cxcywh_normalized(boxes_xyxy: np.ndarray, width: int, height: int) -> np.ndarray:
    if len(boxes_xyxy) == 0:
        return np.zeros((0, 4), dtype=np.float32)
    boxes = boxes_xyxy.astype(np.float32).copy()
    boxes[:, 2] = np.maximum(0.0, boxes[:, 2] - boxes[:, 0])
    boxes[:, 3] = np.maximum(0.0, boxes[:, 3] - boxes[:, 1])
    boxes[:, 0] = (boxes[:, 0] + (boxes[:, 2] * 0.5)) / max(float(width), 1.0)
    boxes[:, 1] = (boxes[:, 1] + (boxes[:, 3] * 0.5)) / max(float(height), 1.0)
    boxes[:, 2] = boxes[:, 2] / max(float(width), 1.0)
    boxes[:, 3] = boxes[:, 3] / max(float(height), 1.0)
    return np.clip(boxes, 0.0, 1.0)


def _normalize_prompt(prompt: str) -> str:
    cleaned = str(prompt or "").strip().lower()
    if not cleaned.endswith("."):
        cleaned += "."
    return cleaned


def _count_parameters(parameters: Iterable[torch.nn.Parameter]) -> int:
    return int(sum(parameter.numel() for parameter in parameters))


@contextmanager
def _prepend_sys_path(path: Path):
    path_str = str(path)
    already_present = path_str in sys.path
    if not already_present:
        sys.path.insert(0, path_str)
    try:
        yield
    finally:
        if not already_present:
            with contextlib.suppress(ValueError):
                sys.path.remove(path_str)


@dataclass(slots=True)
class ByteTrackTeacherCacheConfig:
    cache_tag: str
    repo_root: str
    exp_file: str
    checkpoint: str
    prompt: str = "teacher:bytetrack_detector"
    canonical_label: str = "person"
    device: str = "auto"
    fp16: bool = False
    fuse: bool = False
    conf_threshold: float | None = None
    nms_threshold: float | None = None
    test_size: list[int] | None = None
    max_frames_per_sequence: int | None = None

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "ByteTrackTeacherCacheConfig":
        field_names = set(cls.__dataclass_fields__.keys())
        filtered = {key: value for key, value in payload.items() if key in field_names}
        return cls(**filtered)


@dataclass(slots=True)
class VLMHeadDistillConfig:
    output_tag: str
    grounding_model_id: str
    prompt: str = "person."
    prompt_token: str = "person"
    device: str = "auto"
    learning_rate: float = 1.0e-5
    weight_decay: float = 0.0
    batch_size: int = 1
    epochs: int = 1
    num_workers: int = 0
    gradient_clip_norm: float | None = 1.0
    max_train_images: int | None = None
    max_val_images: int | None = None
    shuffle: bool = False
    train_bbox_heads: bool = True
    train_encoder_output_projection: bool = True

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "VLMHeadDistillConfig":
        field_names = set(cls.__dataclass_fields__.keys())
        filtered = {key: value for key, value in payload.items() if key in field_names}
        return cls(**filtered)


class _NullTimer:
    def tic(self):
        return None


class _PseudoDetectionDataset(Dataset):
    def __init__(
        self,
        annotations_path: Path,
        *,
        dataset_root: Path,
        prompt_token_index: int,
        max_images: int | None = None,
    ):
        payload = json.loads(annotations_path.read_text(encoding="utf-8"))
        images = list(payload.get("images", []))
        annotations = list(payload.get("annotations", []))
        images.sort(key=lambda item: (int(item.get("video_id", 0)), int(item.get("frame_id", 0)), int(item.get("id", 0))))
        if max_images is not None:
            images = images[: int(max_images)]

        annotations_by_image: dict[int, list[dict[str, Any]]] = {}
        for annotation in annotations:
            image_id = int(annotation["image_id"])
            annotations_by_image.setdefault(image_id, []).append(annotation)

        self.samples: list[dict[str, Any]] = []
        for image_item in images:
            image_id = int(image_item["id"])
            image_path = dataset_root / str(image_item["file_name"])
            frame_annotations = annotations_by_image.get(image_id, [])
            boxes_xyxy: list[list[float]] = []
            for annotation in frame_annotations:
                x, y, w, h = annotation["bbox"]
                boxes_xyxy.append([float(x), float(y), float(x + w), float(y + h)])
            boxes = _xyxy_to_cxcywh_normalized(
                np.asarray(boxes_xyxy, dtype=np.float32) if boxes_xyxy else np.zeros((0, 4), dtype=np.float32),
                width=int(image_item["width"]),
                height=int(image_item["height"]),
            )
            if len(boxes) == 0:
                continue
            class_labels = np.zeros((len(boxes),), dtype=np.int64)
            self.samples.append(
                {
                    "image_path": image_path,
                    "boxes": boxes,
                    "class_labels": class_labels,
                }
            )

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int) -> dict[str, Any]:
        sample = self.samples[index]
        image = Image.open(sample["image_path"]).convert("RGB")
        return {
            "image": image,
            "boxes": torch.as_tensor(sample["boxes"], dtype=torch.float32),
            "class_labels": torch.as_tensor(sample["class_labels"], dtype=torch.int64),
            "image_path": str(sample["image_path"]),
        }


def _collate_distill_batch(batch: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "images": [item["image"] for item in batch],
        "labels": [
            {
                "boxes": item["boxes"],
                "class_labels": item["class_labels"],
            }
            for item in batch
        ],
        "image_paths": [item["image_path"] for item in batch],
    }


def _resolve_prompt_token_index(processor: Any, prompt: str, prompt_token: str) -> int:
    encoded = processor.tokenizer(
        prompt,
        return_offsets_mapping=True,
        add_special_tokens=True,
    )
    prompt_lower = prompt.lower()
    token_lower = str(prompt_token or "").strip().lower()
    fallback_index: int | None = None
    for token_index, offset in enumerate(encoded["offset_mapping"]):
        start, end = int(offset[0]), int(offset[1])
        if end <= start:
            continue
        if fallback_index is None:
            fallback_index = token_index
        piece = prompt_lower[start:end].strip()
        if not piece:
            continue
        if piece == token_lower or piece in token_lower or token_lower in piece:
            return token_index
    if fallback_index is not None:
        return fallback_index
    return 0


def _iter_trainable_prefixes(cfg: VLMHeadDistillConfig) -> list[str]:
    prefixes: list[str] = []
    if bool(cfg.train_bbox_heads):
        prefixes.extend(
            [
                "bbox_embed.",
                "model.decoder.bbox_embed.",
                "model.encoder_output_bbox_embed.",
            ]
        )
    if bool(cfg.train_encoder_output_projection):
        prefixes.extend(
            [
                "model.enc_output.",
                "model.enc_output_norm.",
            ]
        )
    deduped: list[str] = []
    for prefix in prefixes:
        if prefix not in deduped:
            deduped.append(prefix)
    return deduped


def _freeze_model_for_head_training(model: torch.nn.Module, trainable_prefixes: list[str]) -> list[str]:
    for parameter in model.parameters():
        parameter.requires_grad_(False)
    opened_names: list[str] = []
    for name, parameter in model.named_parameters():
        if any(name.startswith(prefix) for prefix in trainable_prefixes):
            parameter.requires_grad_(True)
            opened_names.append(name)
    return opened_names


def _select_head_state_dict(model: torch.nn.Module, trainable_prefixes: list[str]) -> dict[str, torch.Tensor]:
    state_dict = model.state_dict()
    selected: dict[str, torch.Tensor] = {}
    for key, value in state_dict.items():
        if any(key.startswith(prefix) for prefix in trainable_prefixes):
            selected[key] = value.detach().cpu()
    return selected


def _move_batch_encoding_to_device(batch_encoding: Any, device: str) -> Any:
    return batch_encoding.to(device)


def _run_epoch(
    *,
    model: Any,
    processor: Any,
    loader: DataLoader,
    prompt: str,
    device: str,
    optimizer: torch.optim.Optimizer | None,
    gradient_clip_norm: float | None,
) -> dict[str, Any]:
    is_train = optimizer is not None
    model.train(mode=is_train)
    total_loss = 0.0
    num_batches = 0
    num_images = 0
    skipped_batches = 0

    for batch in loader:
        inputs = processor(
            images=batch["images"],
            text=[prompt for _ in batch["images"]],
            return_tensors="pt",
            padding=True,
        )
        inputs = _move_batch_encoding_to_device(inputs, device)
        labels = [
            {
                "class_labels": item["class_labels"].to(device),
                "boxes": item["boxes"].to(device),
            }
            for item in batch["labels"]
        ]
        if is_train:
            optimizer.zero_grad(set_to_none=True)
        with torch.set_grad_enabled(is_train):
            with _autocast_for(device):
                outputs = model(**inputs, labels=labels)
                loss = outputs.loss
            if not torch.isfinite(loss):
                skipped_batches += 1
                if is_train and optimizer is not None:
                    optimizer.zero_grad(set_to_none=True)
                continue
            if is_train:
                loss.backward()
                if gradient_clip_norm is not None and float(gradient_clip_norm) > 0.0:
                    torch.nn.utils.clip_grad_norm_(
                        [parameter for parameter in model.parameters() if parameter.requires_grad],
                        float(gradient_clip_norm),
                    )
                optimizer.step()
        total_loss += float(loss.detach().cpu())
        num_batches += 1
        num_images += len(batch["images"])

    return {
        "loss": float(total_loss / max(num_batches, 1)) if num_batches > 0 else float("inf"),
        "num_batches": int(num_batches),
        "num_images": int(num_images),
        "num_skipped_batches": int(skipped_batches),
    }


def cache_bytetrack_teacher_detections(
    project_cfg: dict[str, Any],
    *,
    overwrite: bool = False,
    max_frames_override: int | None = None,
    max_new_frames_override: int | None = None,
) -> dict[str, Any]:
    teacher_cfg = ByteTrackTeacherCacheConfig.from_dict(project_cfg["vlm_head_distillation"]["teacher_detector"])
    artifact_root = Path(project_cfg["paths"]["artifact_root"]).expanduser().resolve()
    cache_dir = ensure_dir(artifact_root / "detections" / teacher_cfg.cache_tag)
    repo_root = Path(teacher_cfg.repo_root).expanduser().resolve()
    exp_file = Path(teacher_cfg.exp_file).expanduser().resolve()
    checkpoint = Path(teacher_cfg.checkpoint).expanduser().resolve()
    if not repo_root.exists():
        raise FileNotFoundError(f"ByteTrack repo root not found: {repo_root}")
    if not exp_file.exists():
        raise FileNotFoundError(f"ByteTrack exp file not found: {exp_file}")
    if not checkpoint.exists():
        raise FileNotFoundError(f"ByteTrack checkpoint not found: {checkpoint}")

    device = _resolve_device(teacher_cfg.device)
    with _prepend_sys_path(repo_root):
        from tools.demo_track import Predictor
        from yolox.exp import get_exp
        from yolox.utils import fuse_model

        exp = get_exp(str(exp_file), None)
        if teacher_cfg.conf_threshold is not None:
            exp.test_conf = float(teacher_cfg.conf_threshold)
        if teacher_cfg.nms_threshold is not None:
            exp.nmsthre = float(teacher_cfg.nms_threshold)
        if teacher_cfg.test_size is not None and len(teacher_cfg.test_size) == 2:
            exp.test_size = (int(teacher_cfg.test_size[0]), int(teacher_cfg.test_size[1]))

        model = exp.get_model()
        map_location = torch.device(device if device != "cuda" else "cpu")
        checkpoint_payload = torch.load(str(checkpoint), map_location=map_location)
        model.load_state_dict(checkpoint_payload["model"])
        model.to(device)
        model.eval()
        if bool(teacher_cfg.fuse):
            model = fuse_model(model)
        predictor = Predictor(
            model=model,
            exp=exp,
            device=torch.device(device),
            fp16=bool(teacher_cfg.fp16 and device == "cuda"),
        )

        sequences = load_mot20_sequences(
            project_cfg["paths"]["dataset_root"],
            split=project_cfg["dataset"]["split"],
            sequence_names=project_cfg["dataset"].get("sequences"),
        )
        written: list[str] = []
        per_sequence: dict[str, dict[str, int]] = {}
        for sequence in sequences:
            cache_path = cache_dir / f"{sequence.name}.jsonl"
            existing_frames = 0
            existing_boxes = 0
            last_frame_idx = 0
            if cache_path.exists() and not overwrite:
                stats = inspect_jsonl_frame_sequence(cache_path, frame_key="frame_idx")
                if not stats.is_valid:
                    raise RuntimeError(
                        f"Invalid teacher cache sequence (duplicates or non-increasing frame_idx): {cache_path}"
                    )
                existing_frames = int(stats.unique_frame_count)
                last_frame_idx = int(stats.last_frame_idx or 0)
                for payload in iter_jsonl(cache_path):
                    scores = payload.get("scores") or []
                    existing_boxes += int(len(scores))
            elif cache_path.exists() and overwrite:
                cache_path.unlink()

            max_frames = max_frames_override
            if max_frames is None:
                max_frames = teacher_cfg.max_frames_per_sequence
            if max_frames is None:
                max_frames = project_cfg["dataset"].get("max_frames_per_sequence")
            frame_stride = int(project_cfg["dataset"].get("frame_stride", 1) or 1)
            frame_count = existing_frames
            box_count = existing_boxes
            max_new_frames = max_new_frames_override
            appended = 0

            if max_frames is not None and frame_count >= int(max_frames):
                written.append(str(cache_path))
                per_sequence[sequence.name] = {
                    "frames": int(frame_count),
                    "boxes": int(box_count),
                    "appended_frames": 0,
                    "appended_boxes": 0,
                    "skipped_existing_frames": int(existing_frames),
                }
                continue

            if max_new_frames is not None and int(max_new_frames) <= 0:
                written.append(str(cache_path))
                per_sequence[sequence.name] = {
                    "frames": int(frame_count),
                    "boxes": int(box_count),
                    "appended_frames": 0,
                    "appended_boxes": 0,
                    "skipped_existing_frames": int(existing_frames),
                }
                continue

            appended_boxes = 0
            for frame_idx, frame_path in iter_frame_paths(
                sequence,
                frame_stride=frame_stride,
                max_frames=max_frames,
            ):
                if last_frame_idx and int(frame_idx) <= last_frame_idx:
                    continue
                outputs, img_info = predictor.inference(str(frame_path), timer=_NullTimer())
                boxes = np.zeros((0, 4), dtype=np.float32)
                scores = np.zeros((0,), dtype=np.float32)
                if outputs and outputs[0] is not None and len(outputs[0]) > 0:
                    output_tensor = outputs[0].detach().cpu()
                    output_array = output_tensor.numpy().astype(np.float32)
                    boxes = output_array[:, :4]
                    if output_array.shape[1] == 5:
                        scores = output_array[:, 4]
                    else:
                        scores = output_array[:, 4] * output_array[:, 5]
                    scale = min(exp.test_size[0] / float(img_info["height"]), exp.test_size[1] / float(img_info["width"]))
                    boxes = boxes / max(float(scale), 1e-6)
                raw = RawDetections(
                    frame_idx=int(frame_idx),
                    image_path=str(frame_path),
                    image_height=int(sequence.height),
                    image_width=int(sequence.width),
                    prompt=str(teacher_cfg.prompt),
                    grounding_boxes=boxes.astype(float).tolist(),
                    scores=np.clip(scores.astype(np.float32), 0.0, 1.0).astype(float).tolist(),
                    labels=[teacher_cfg.canonical_label for _ in range(len(scores))],
                    prompt_support_counts=[1 for _ in range(len(scores))],
                    sam_boxes=None,
                    mask_areas=None,
                )
                append_jsonl(cache_path, raw.to_json_dict())
                frame_count += 1
                appended += 1
                boxes_now = int(len(scores))
                appended_boxes += boxes_now
                box_count += boxes_now
                if max_new_frames is not None and appended >= int(max_new_frames):
                    break
            written.append(str(cache_path))
            per_sequence[sequence.name] = {
                "frames": int(frame_count),
                "boxes": int(box_count),
                "appended_frames": int(appended),
                "appended_boxes": int(appended_boxes),
                "skipped_existing_frames": int(existing_frames),
            }

    summary_payload = {
        "cache_tag": teacher_cfg.cache_tag,
        "device": device,
        "exp_file": str(exp_file),
        "checkpoint": str(checkpoint),
        "cache_paths": written,
        "per_sequence": per_sequence,
        "config": {key: value for key, value in asdict(teacher_cfg).items()},
    }
    _write_json(cache_dir / "teacher_cache_summary.json", summary_payload)
    return summary_payload


def train_vlm_detection_head(project_cfg: dict[str, Any]) -> dict[str, Any]:
    from transformers import AutoModelForZeroShotObjectDetection, AutoProcessor

    train_cfg = VLMHeadDistillConfig.from_dict(project_cfg["vlm_head_distillation"]["student"])
    artifact_root = Path(project_cfg["paths"]["artifact_root"]).expanduser().resolve()
    pseudo_root = artifact_root / "supervised" / train_cfg.output_tag
    train_annotations = pseudo_root / "annotations" / "train.json"
    val_annotations = pseudo_root / "annotations" / "val.json"
    if not train_annotations.exists():
        raise FileNotFoundError(f"Pseudo-label train annotations not found: {train_annotations}")
    if not val_annotations.exists():
        raise FileNotFoundError(f"Pseudo-label val annotations not found: {val_annotations}")

    device = _resolve_device(train_cfg.device)
    prompt = _normalize_prompt(train_cfg.prompt)
    local_only = _is_local_only()
    grounding_snapshot = _resolve_hf_snapshot_dir(train_cfg.grounding_model_id)
    processor_sources = [source for source in [grounding_snapshot, train_cfg.grounding_model_id] if source]
    processor = None
    last_processor_exc: Exception | None = None
    for source in processor_sources:
        try:
            processor = AutoProcessor.from_pretrained(
                source,
                local_files_only=bool(local_only or source == grounding_snapshot),
            )
            last_processor_exc = None
            break
        except Exception as exc:
            last_processor_exc = exc
            continue
    if processor is None:
        raise last_processor_exc  
    prompt_token_index = _resolve_prompt_token_index(processor, prompt, train_cfg.prompt_token)

    train_dataset = _PseudoDetectionDataset(
        train_annotations,
        dataset_root=pseudo_root,
        prompt_token_index=prompt_token_index,
        max_images=train_cfg.max_train_images,
    )
    val_dataset = _PseudoDetectionDataset(
        val_annotations,
        dataset_root=pseudo_root,
        prompt_token_index=prompt_token_index,
        max_images=train_cfg.max_val_images,
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=max(1, int(train_cfg.batch_size)),
        shuffle=bool(train_cfg.shuffle),
        num_workers=max(0, int(train_cfg.num_workers)),
        collate_fn=_collate_distill_batch,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=max(1, int(train_cfg.batch_size)),
        shuffle=False,
        num_workers=max(0, int(train_cfg.num_workers)),
        collate_fn=_collate_distill_batch,
    )

    model = AutoModelForZeroShotObjectDetection.from_pretrained(
        grounding_snapshot or train_cfg.grounding_model_id,
        local_files_only=bool(local_only or grounding_snapshot is not None),
    ).to(device)
    trainable_prefixes = _iter_trainable_prefixes(train_cfg)
    opened_names = _freeze_model_for_head_training(model, trainable_prefixes)
    trainable_parameters = [parameter for parameter in model.parameters() if parameter.requires_grad]
    if not trainable_parameters:
        raise RuntimeError("No trainable parameters were selected for VLM head distillation.")

    optimizer = torch.optim.AdamW(
        trainable_parameters,
        lr=float(train_cfg.learning_rate),
        weight_decay=float(train_cfg.weight_decay),
    )

    history: list[dict[str, Any]] = []
    best_val_loss = float("inf")
    best_state: dict[str, torch.Tensor] | None = None
    checkpoint_path = pseudo_root / "vlm_head_student.pt"
    for epoch in range(1, int(train_cfg.epochs) + 1):
        train_metrics = _run_epoch(
            model=model,
            processor=processor,
            loader=train_loader,
            prompt=prompt,
            device=device,
            optimizer=optimizer,
            gradient_clip_norm=train_cfg.gradient_clip_norm,
        )
        with torch.no_grad():
            val_metrics = _run_epoch(
                model=model,
                processor=processor,
                loader=val_loader,
                prompt=prompt,
                device=device,
                optimizer=None,
                gradient_clip_norm=None,
            )
        epoch_payload = {
            "epoch": int(epoch),
            "train": train_metrics,
            "val": val_metrics,
        }
        history.append(epoch_payload)
        _write_json(
            pseudo_root / "vlm_head_student_progress.json",
            {
                "checkpoint_path": str(checkpoint_path),
                "current_epoch": int(epoch),
                "total_epochs": int(train_cfg.epochs),
                "history": history,
                "dataset_sizes": {
                    "train_images": len(train_dataset),
                    "val_images": len(val_dataset),
                },
            },
        )
        if np.isfinite(float(val_metrics["loss"])) and float(val_metrics["loss"]) <= float(best_val_loss):
            best_val_loss = float(val_metrics["loss"])
            best_state = _select_head_state_dict(model, trainable_prefixes)

    if best_state is None:
        best_state = _select_head_state_dict(model, trainable_prefixes)

    checkpoint_payload = {
        "state_dict": best_state,
        "grounding_model_id": train_cfg.grounding_model_id,
        "prompt": prompt,
        "prompt_token": train_cfg.prompt_token,
        "prompt_token_index": int(prompt_token_index),
        "trainable_prefixes": trainable_prefixes,
        "trainable_parameter_names": opened_names,
        "config": {key: value for key, value in asdict(train_cfg).items()},
    }
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(checkpoint_payload, checkpoint_path)

    summary_payload = {
        "pseudo_dataset_root": str(pseudo_root),
        "train_annotations": str(train_annotations),
        "val_annotations": str(val_annotations),
        "device": device,
        "prompt": prompt,
        "prompt_token_index": int(prompt_token_index),
        "trainable_prefixes": trainable_prefixes,
        "trainable_parameter_names": opened_names,
        "trainable_parameter_count": _count_parameters(trainable_parameters),
        "history": history,
        "checkpoint_path": str(checkpoint_path),
        "dataset_sizes": {
            "train_images": len(train_dataset),
            "val_images": len(val_dataset),
        },
        "config": {key: value for key, value in asdict(train_cfg).items()},
    }
    _write_json(pseudo_root / "vlm_head_student_summary.json", summary_payload)
    return summary_payload
