from __future__ import annotations

from contextlib import nullcontext
from dataclasses import dataclass
import os
from pathlib import Path
import logging
from typing import Any

import numpy as np
import torch
from PIL import Image
from transformers import AutoModelForZeroShotObjectDetection, AutoProcessor

from ir_autolabeling.detectors.base import RawDetections
from ir_autolabeling.utils.geometry import iter_tiles, nms_xyxy, pairwise_iou_xyxy


def _resolve_hf_snapshot_dir(model_id: str) -> str | None:
    if not model_id or "/" not in model_id:
        return None
    if Path(model_id).expanduser().exists():
        return str(Path(model_id).expanduser().resolve())
    try:
        from huggingface_hub.constants import HF_HUB_CACHE
    except Exception:
        return None
    namespace, name = model_id.split("/", 1)
    snapshot_root = Path(HF_HUB_CACHE) / f"models--{namespace}--{name}" / "snapshots"
    if not snapshot_root.exists():
        return None
    snapshots = [p for p in snapshot_root.iterdir() if p.is_dir()]
    if not snapshots:
        return None
    snapshots.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return str(snapshots[0])


def _normalize_prompt(prompt: str) -> str:
    cleaned = prompt.strip().lower()
    if not cleaned.endswith("."):
        cleaned += "."
    return cleaned


def _normalize_prompt_list(primary_prompt: str, prompt_variants: list[str] | None) -> list[str]:
    prompts = [_normalize_prompt(primary_prompt)]
    for variant in prompt_variants or []:
        normalized = _normalize_prompt(variant)
        if normalized not in prompts:
            prompts.append(normalized)
    return prompts


def _build_combined_prompt(prompts: list[str]) -> str:
    return " ".join(prompt.strip() for prompt in prompts).strip()


def _fuse_prompt_support(
    boxes: np.ndarray,
    scores: np.ndarray,
    prompt_ids: np.ndarray,
    *,
    iou_threshold: float,
    support_boost: float,
    min_votes: int,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    if len(scores) <= 1:
        return boxes, scores, np.ones((len(scores),), dtype=np.int32)

    iou_matrix = pairwise_iou_xyxy(boxes, boxes)
    order = np.argsort(-scores)
    assigned = np.zeros(len(scores), dtype=bool)
    fused_boxes: list[np.ndarray] = []
    fused_scores: list[float] = []
    fused_support_counts: list[int] = []

    for anchor in order:
        if assigned[int(anchor)]:
            continue
        cluster_mask = (~assigned) & (iou_matrix[int(anchor)] >= float(iou_threshold))
        cluster_idx = np.flatnonzero(cluster_mask)
        assigned[cluster_idx] = True
        cluster_prompt_ids = np.unique(prompt_ids[cluster_idx])
        support_count = int(len(cluster_prompt_ids))
        if support_count < int(min_votes):
            continue
        cluster_scores = scores[cluster_idx]
        weight_sum = float(np.maximum(cluster_scores, 1e-6).sum())
        weighted_box = np.sum(boxes[cluster_idx] * cluster_scores[:, None], axis=0) / max(weight_sum, 1e-6)
        representative_score = float(np.max(cluster_scores))
        fused_boxes.append(weighted_box.astype(np.float32))
        boosted_score = representative_score + float(max(0, support_count - 1)) * float(support_boost)
        fused_scores.append(min(1.0, boosted_score))
        fused_support_counts.append(support_count)

    if not fused_boxes:
        return (
            np.zeros((0, 4), dtype=np.float32),
            np.zeros((0,), dtype=np.float32),
            np.zeros((0,), dtype=np.int32),
        )
    return (
        np.stack(fused_boxes).astype(np.float32),
        np.asarray(fused_scores, dtype=np.float32),
        np.asarray(fused_support_counts, dtype=np.int32),
    )


_MPS_USABLE: bool | None = None


def _is_mps_usable() -> bool:
    pass

    global _MPS_USABLE
    if _MPS_USABLE is not None:
        return _MPS_USABLE
    if not torch.backends.mps.is_available():
        _MPS_USABLE = False
        return _MPS_USABLE
    try:
        _ = torch.zeros(1).to("mps")
    except Exception:
        _MPS_USABLE = False
    else:
        _MPS_USABLE = True
    return _MPS_USABLE


def _resolve_device(name: str) -> str:
    if name == "auto":
        if torch.cuda.is_available():
            return "cuda"
        if _is_mps_usable():
            return "mps"
        return "cpu"
    if name == "mps" and not _is_mps_usable():
        return "cpu"
    return name


def _autocast_for(device: str):
    if device == "cuda":
        return torch.autocast(device_type="cuda", dtype=torch.bfloat16)
    return nullcontext()


def _normalize_sahi_shift_amounts(
    shift_amount_list: list[list[int]] | list[int] | None,
    num_images: int,
) -> list[list[int]]:
    if shift_amount_list is None:
        return [[0, 0] for _ in range(num_images)]
    if len(shift_amount_list) == 2 and all(isinstance(value, (int, float)) for value in shift_amount_list):
        shift = [int(shift_amount_list[0]), int(shift_amount_list[1])]
        return [shift for _ in range(num_images)]
    return [[int(values[0]), int(values[1])] for values in shift_amount_list]  


def _normalize_sahi_full_shapes(
    full_shape_list: list[list[int]] | list[int] | None,
    num_images: int,
) -> list[list[int] | None]:
    if full_shape_list is None:
        return [None for _ in range(num_images)]
    if len(full_shape_list) == 2 and all(isinstance(value, (int, float)) for value in full_shape_list):
        shape = [int(full_shape_list[0]), int(full_shape_list[1])]
        return [shape for _ in range(num_images)]
    return [
        None if values is None else [int(values[0]), int(values[1])]
        for values in full_shape_list  
    ]


class _GroundingDinoSahiDetectionModel:
    def __init__(self, detector: "GroundedSam2Detector"):
        from sahi.models.base import DetectionModel

        class _Adapter(DetectionModel):
            def __init__(self, outer: "GroundedSam2Detector"):
                self.outer = outer
                self._original_predictions: list[dict[str, Any]] | None = None
                self._object_prediction_list_per_image = None
                super().__init__(
                    model=outer.grounding_model,
                    load_at_init=False,
                    device=outer.grounding_device,
                    confidence_threshold=outer.config.grounding_box_threshold,
                    category_mapping={1: outer.config.canonical_label},
                )
                self.set_model(outer.grounding_model)

            def load_model(self):
                self.outer._load_models()
                self.set_model(self.outer.grounding_model)

            def set_model(self, model: Any, **kwargs):
                self.model = model
                self.category_mapping = {1: self.outer.config.canonical_label}

            def perform_inference(self, image: list[np.ndarray] | np.ndarray):
                image_list = image if isinstance(image, list) else [image]
                predictions: list[dict[str, Any]] = []
                pil_images = [Image.fromarray(np.asarray(current_image).astype(np.uint8)) for current_image in image_list]
                batch_results = self.outer._run_grounding_batch(pil_images)
                for current_image, (boxes, scores, labels, support_counts) in zip(image_list, batch_results, strict=False):
                    predictions.append(
                        {
                            "boxes": boxes,
                            "scores": scores,
                            "labels": labels,
                            "support_counts": support_counts,
                            "shape": list(np.asarray(current_image).shape[:2]),
                        }
                    )
                self._original_predictions = predictions

            def _create_object_prediction_list_from_original_predictions(
                self,
                shift_amount_list: list[list[int]] | list[int] | None = [[0, 0]],
                full_shape_list: list[list[int]] | list[int] | None = None,
            ):
                from sahi.prediction import ObjectPrediction

                if self._original_predictions is None:
                    raise RuntimeError("SAHI adapter inference must run before converting predictions.")

                predictions = self._original_predictions
                shifts = _normalize_sahi_shift_amounts(shift_amount_list, len(predictions))
                full_shapes = _normalize_sahi_full_shapes(full_shape_list, len(predictions))

                object_prediction_list_per_image: list[list[ObjectPrediction]] = []
                for image_index, payload in enumerate(predictions):
                    object_prediction_list: list[ObjectPrediction] = []
                    image_height, image_width = payload["shape"]
                    shift_amount = shifts[image_index]
                    full_shape = full_shapes[image_index]
                    support_counts = payload.get("support_counts")
                    if support_counts is None:
                        support_counts = np.ones((len(payload["scores"]),), dtype=np.int32)
                    else:
                        support_counts = np.asarray(support_counts, dtype=np.int32)
                    canonical_label = str(self.outer.config.canonical_label)
                    for box, score, support_count in zip(
                        payload["boxes"], payload["scores"], support_counts, strict=False
                    ):
                        x1 = max(0.0, min(float(box[0]), float(image_width)))
                        y1 = max(0.0, min(float(box[1]), float(image_height)))
                        x2 = max(0.0, min(float(box[2]), float(image_width)))
                        y2 = max(0.0, min(float(box[3]), float(image_height)))
                        try:
                            votes = int(support_count)
                        except Exception:
                            votes = 1
                        category_name = f"{canonical_label}__votes{votes}"
                        object_prediction_list.append(
                            ObjectPrediction(
                                bbox=[x1, y1, x2, y2],
                                category_id=1,
                                category_name=category_name,
                                score=float(score),
                                shift_amount=shift_amount,
                                full_shape=full_shape,
                            )
                        )
                    object_prediction_list_per_image.append(object_prediction_list)
                self._object_prediction_list_per_image = object_prediction_list_per_image

        self.adapter = _Adapter(detector)


@dataclass(slots=True)
class GroundedSam2Config:
    prompt: str
    grounding_model_id: str
    sam2_model_id: str
    head_checkpoint_path: str | None = None
    prompt_variants: list[str] | None = None
    canonical_label: str = "person"
    prompt_strategy: str = "combined"
    grounding_device: str = "auto"
    sam2_device: str = "auto"
    grounding_box_threshold: float = 0.05
    grounding_text_threshold: float = 0.05
    use_slice_inference: bool = True
    slice_backend: str = "native"
    slice_width: int = 960
    slice_height: int = 960
    slice_overlap: float = 0.20
    slice_ensemble: list[dict[str, Any]] | None = None
    detector_max_detections: int = 500
    pre_nms_iou: float = 0.85
    slice_fusion_iou: float = 0.85
    prompt_fusion_iou: float = 0.90
    prompt_support_boost: float = 0.0
    prompt_min_votes: int = 1
    sam2_max_refinement_boxes: int | None = 400
    sam2_refinement_batch_size: int | None = 64
    sahi_perform_standard_pred: bool = True
    sahi_postprocess_type: str = "GREEDYNMM"
    sahi_postprocess_match_metric: str = "IOS"
    sahi_postprocess_match_threshold: float = 0.50
    sahi_auto_slice_resolution: bool = False
    sahi_batch_size: int | None = None

    @classmethod
    def from_dict(cls, payload: dict) -> "GroundedSam2Config":
        field_names = set(cls.__dataclass_fields__.keys())
        filtered = {key: value for key, value in payload.items() if key in field_names}
        return cls(**filtered)


class GroundedSam2Detector:
    def __init__(self, config: GroundedSam2Config):
        self.config = config
        prompt_list = _normalize_prompt_list(config.prompt, config.prompt_variants)
        if config.prompt_strategy == "combined":
            self.prompts = [_build_combined_prompt(prompt_list)]
        else:
            self.prompts = prompt_list
        self.prompt = " | ".join(self.prompts)
        self.grounding_device = _resolve_device(config.grounding_device)
        self.sam2_device = _resolve_device(config.sam2_device)
        self.processor = None
        self.grounding_model = None
        self.sam_predictor = None
        self.sahi_detection_model = None

    def _iter_slice_settings(self) -> list[tuple[int, int, float]]:
        ensemble = self.config.slice_ensemble or []
        if not ensemble:
            return [
                (
                    int(self.config.slice_width),
                    int(self.config.slice_height),
                    float(self.config.slice_overlap),
                )
            ]
        settings: list[tuple[int, int, float]] = []
        for item in ensemble:
            try:
                width = int(item.get("slice_width", self.config.slice_width))
                height = int(item.get("slice_height", self.config.slice_height))
                overlap = float(item.get("slice_overlap", self.config.slice_overlap))
            except Exception:
                continue
            settings.append((width, height, overlap))
        if not settings:
            settings.append(
                (
                    int(self.config.slice_width),
                    int(self.config.slice_height),
                    float(self.config.slice_overlap),
                )
            )
        return settings

    @staticmethod
    def _truthy_env(name: str) -> bool:
        value = os.getenv(name)
        if value is None:
            return False
        return value.strip().lower() not in {"", "0", "false", "no"}

    def _is_local_only(self) -> bool:
        return bool(
            self._truthy_env("HF_HUB_OFFLINE")
            or self._truthy_env("TRANSFORMERS_OFFLINE")
            or self._truthy_env("IR_HF_LOCAL_ONLY")
        )

    def _load_grounding(self) -> None:
        local_only = self._is_local_only()
        grounding_snapshot = _resolve_hf_snapshot_dir(self.config.grounding_model_id)
        if self.processor is None:
            processor_sources = [grounding_snapshot, self.config.grounding_model_id]
            last_exc: Exception | None = None
            for source in [s for s in processor_sources if s]:
                try:
                    processor_kwargs = {
                        "local_files_only": bool(local_only or source == grounding_snapshot),
                    }
                    try:
                        
                        
                        self.processor = AutoProcessor.from_pretrained(
                            source,
                            use_fast=True,
                            **processor_kwargs,
                        )
                    except TypeError:
                        self.processor = AutoProcessor.from_pretrained(
                            source,
                            **processor_kwargs,
                        )
                    last_exc = None
                    break
                except Exception as exc:
                    last_exc = exc
                    continue
            if self.processor is None:
                raise last_exc  
        if self.grounding_model is None:
            try:
                self.grounding_model = AutoModelForZeroShotObjectDetection.from_pretrained(
                    grounding_snapshot or self.config.grounding_model_id,
                    local_files_only=bool(local_only or grounding_snapshot is not None),
                ).to(self.grounding_device)
            except Exception as exc:
                logging.warning(
                    "Grounding DINO failed on device %s, falling back to cpu: %s",
                    self.grounding_device,
                    repr(exc),
                )
                self.grounding_device = "cpu"
                try:
                    self.grounding_model = AutoModelForZeroShotObjectDetection.from_pretrained(
                        grounding_snapshot or self.config.grounding_model_id,
                        local_files_only=bool(local_only or grounding_snapshot is not None),
                    ).to(self.grounding_device)
                except Exception as exc2:
                    if not local_only:
                        logging.warning(
                            "Grounding DINO download failed; retrying with local_files_only=True: %s",
                            repr(exc2),
                        )
                        local_only = True
                        self.grounding_model = AutoModelForZeroShotObjectDetection.from_pretrained(
                            grounding_snapshot or self.config.grounding_model_id,
                            local_files_only=True,
                        ).to(self.grounding_device)
                    else:
                        raise
            self.grounding_model.eval()
            self._load_grounding_head_checkpoint()

    def _load_grounding_head_checkpoint(self) -> None:
        if self.grounding_model is None:
            return
        checkpoint_path = self.config.head_checkpoint_path
        if not checkpoint_path:
            return
        path = Path(checkpoint_path).expanduser().resolve()
        if not path.exists():
            logging.warning("Grounding DINO head checkpoint not found, skipping: %s", str(path))
            return
        payload = torch.load(str(path), map_location="cpu")
        state_dict = payload.get("state_dict", payload)
        incompatible = self.grounding_model.load_state_dict(state_dict, strict=False)
        logging.info(
            "Loaded Grounding DINO distilled head from %s (missing=%d unexpected=%d)",
            str(path),
            len(getattr(incompatible, "missing_keys", [])),
            len(getattr(incompatible, "unexpected_keys", [])),
        )

    def _load_sam2(self) -> None:
        refinement_limit = self.config.sam2_max_refinement_boxes
        needs_sam2 = refinement_limit is None or int(refinement_limit) > 0
        if not needs_sam2:
            return
        if self.sam_predictor is not None:
            return

        local_only = self._is_local_only()
        try:
            from sam2.sam2_image_predictor import SAM2ImagePredictor
        except ModuleNotFoundError as exc:
            logging.warning(
                "SAM2 package is not installed; disabling SAM refinement (sam2_max_refinement_boxes=0): %s",
                repr(exc),
            )
            self.config.sam2_max_refinement_boxes = 0
            return

        try:
            self.sam_predictor = SAM2ImagePredictor.from_pretrained(
                self.config.sam2_model_id,
                device=self.sam2_device,
                local_files_only=local_only,
            )
        except Exception as exc:
            logging.warning(
                "SAM2 failed on device %s, falling back to cpu: %s",
                self.sam2_device,
                repr(exc),
            )
            self.sam2_device = "cpu"
            try:
                self.sam_predictor = SAM2ImagePredictor.from_pretrained(
                    self.config.sam2_model_id,
                    device=self.sam2_device,
                    local_files_only=local_only,
                )
            except Exception as exc2:
                if not local_only:
                    logging.warning(
                        "SAM2 download failed; retrying with local_files_only=True: %s",
                        repr(exc2),
                    )
                    self.sam_predictor = SAM2ImagePredictor.from_pretrained(
                        self.config.sam2_model_id,
                        device=self.sam2_device,
                        local_files_only=True,
                    )
                else:
                    raise

    def _load_models(self) -> None:
        self._load_grounding()
        self._load_sam2()
        if self.sahi_detection_model is None and self.config.slice_backend == "sahi":
            try:
                self.sahi_detection_model = _GroundingDinoSahiDetectionModel(self).adapter
            except Exception as exc:
                raise RuntimeError(
                    "slice_backend='sahi' but SAHI detector adapter initialization failed. "
                    "Install the 'sahi' dependency (recommended) or set slice_backend='native' in the config. "
                    f"Error={repr(exc)}"
                ) from exc

    def refine_boxes(
        self,
        image_rgb: np.ndarray,
        boxes: np.ndarray,
        scores: np.ndarray,
        *,
        refinement_limit: int | None = None,
        initial_sam_boxes: np.ndarray | None = None,
    ) -> tuple[np.ndarray, np.ndarray]:
        limit = refinement_limit if refinement_limit is not None else self.config.sam2_max_refinement_boxes
        if limit is not None and int(limit) <= 0:
            sam_boxes_array = (
                initial_sam_boxes.astype(np.float32).copy()
                if initial_sam_boxes is not None
                else boxes.astype(np.float32).copy()
            )
            mask_areas_array = np.zeros((len(boxes),), dtype=np.float32)
            return sam_boxes_array, mask_areas_array

        if len(boxes) == 0:
            return np.zeros((0, 4), dtype=np.float32), np.zeros((0,), dtype=np.float32)

        self._load_sam2()
        if self.sam_predictor is None:
            sam_boxes_array = (
                initial_sam_boxes.astype(np.float32).copy()
                if initial_sam_boxes is not None
                else boxes.astype(np.float32).copy()
            )
            mask_areas_array = np.zeros((len(boxes),), dtype=np.float32)
            return sam_boxes_array, mask_areas_array

        refine_indices = np.arange(len(boxes), dtype=np.int32)
        refine_boxes = boxes
        if limit is not None and len(boxes) > int(limit):
            refine_indices = np.argsort(-scores)[: int(limit)].astype(np.int32)
            refine_boxes = boxes[refine_indices]

        sam_boxes_array = (
            initial_sam_boxes.astype(np.float32).copy()
            if initial_sam_boxes is not None
            else boxes.astype(np.float32).copy()
        )
        mask_areas_array = np.zeros((len(boxes),), dtype=np.float32)

        self.sam_predictor.set_image(image_rgb)
        batch_size = self.config.sam2_refinement_batch_size
        if batch_size is None or int(batch_size) <= 0:
            batch_size = len(refine_boxes)
        batch_size = max(1, int(batch_size))

        for start in range(0, len(refine_boxes), batch_size):
            end = min(len(refine_boxes), start + batch_size)
            batch_boxes = refine_boxes[start:end]
            batch_indices = refine_indices[start:end]
            masks, _, _ = self.sam_predictor.predict(
                point_coords=None,
                point_labels=None,
                box=batch_boxes,
                multimask_output=False,
            )
            if masks.ndim == 4:
                masks = masks.squeeze(1)

            for local_index, (mask, fallback_box) in enumerate(zip(masks.astype(bool), batch_boxes)):
                target_index = int(batch_indices[local_index])
                ys, xs = np.where(mask)
                if len(xs) == 0 or len(ys) == 0:
                    sam_boxes_array[target_index] = fallback_box.astype(np.float32)
                    continue
                sam_boxes_array[target_index] = np.asarray(
                    [
                        float(xs.min()),
                        float(ys.min()),
                        float(xs.max()),
                        float(ys.max()),
                    ],
                    dtype=np.float32,
                )
                mask_areas_array[target_index] = float(mask.sum())

        return sam_boxes_array, mask_areas_array

    def _run_grounding_with_prompt(
        self,
        image: Image.Image,
        prompt: str,
    ) -> tuple[np.ndarray, np.ndarray, list[str]]:
        assert self.processor is not None
        assert self.grounding_model is not None
        inputs = self.processor(images=image, text=prompt, return_tensors="pt").to(self.grounding_device)
        with torch.inference_mode():
            with _autocast_for(self.grounding_device):
                outputs = self.grounding_model(**inputs)
        try:
            processed = self.processor.post_process_grounded_object_detection(
                outputs,
                inputs.input_ids,
                box_threshold=self.config.grounding_box_threshold,
                text_threshold=self.config.grounding_text_threshold,
                target_sizes=[image.size[::-1]],
            )
        except TypeError:
            processed = self.processor.post_process_grounded_object_detection(
                outputs,
                inputs.input_ids,
                threshold=self.config.grounding_box_threshold,
                text_threshold=self.config.grounding_text_threshold,
                target_sizes=[image.size[::-1]],
            )
        if not processed or len(processed[0]["boxes"]) == 0:
            return (
                np.zeros((0, 4), dtype=np.float32),
                np.zeros((0,), dtype=np.float32),
                [],
            )
        boxes = processed[0]["boxes"].detach().cpu().numpy().astype(np.float32)
        scores = processed[0]["scores"].detach().cpu().numpy().astype(np.float32)
        labels = list(processed[0]["labels"])
        return boxes, scores, labels

    def _run_grounding(self, image: Image.Image) -> tuple[np.ndarray, np.ndarray, list[str], np.ndarray]:
        if len(self.prompts) == 1:
            boxes, scores, _ = self._run_grounding_with_prompt(image, self.prompts[0])
            if len(boxes) == 0:
                return (
                    np.zeros((0, 4), dtype=np.float32),
                    np.zeros((0,), dtype=np.float32),
                    [],
                    np.zeros((0,), dtype=np.int32),
                )
            labels = [self.config.canonical_label for _ in range(len(scores))]
            return boxes, scores, labels, np.ones((len(scores),), dtype=np.int32)

        all_boxes: list[np.ndarray] = []
        all_scores: list[np.ndarray] = []
        all_prompt_ids: list[np.ndarray] = []
        try:
            assert self.processor is not None
            assert self.grounding_model is not None

            inputs = self.processor(
                images=[image for _ in self.prompts],
                text=list(self.prompts),
                return_tensors="pt",
                padding=True,
            ).to(self.grounding_device)
            with torch.inference_mode():
                with _autocast_for(self.grounding_device):
                    outputs = self.grounding_model(**inputs)

            target_sizes = [image.size[::-1] for _ in self.prompts]
            try:
                processed = self.processor.post_process_grounded_object_detection(
                    outputs,
                    inputs.input_ids,
                    box_threshold=self.config.grounding_box_threshold,
                    text_threshold=self.config.grounding_text_threshold,
                    target_sizes=target_sizes,
                )
            except TypeError:
                processed = self.processor.post_process_grounded_object_detection(
                    outputs,
                    inputs.input_ids,
                    threshold=self.config.grounding_box_threshold,
                    text_threshold=self.config.grounding_text_threshold,
                    target_sizes=target_sizes,
                )
            if processed:
                for prompt_idx, entry in enumerate(processed):
                    if len(entry.get("boxes", [])) == 0:
                        continue
                    prompt_boxes = entry["boxes"].detach().cpu().numpy().astype(np.float32)
                    prompt_scores = entry["scores"].detach().cpu().numpy().astype(np.float32)
                    all_boxes.append(prompt_boxes)
                    all_scores.append(prompt_scores)
                    all_prompt_ids.append(np.full((len(prompt_scores),), prompt_idx, dtype=np.int32))
        except Exception:
            for prompt_idx, prompt in enumerate(self.prompts):
                boxes, scores, _ = self._run_grounding_with_prompt(image, prompt)
                if len(boxes) == 0:
                    continue
                all_boxes.append(boxes)
                all_scores.append(scores)
                all_prompt_ids.append(np.full((len(scores),), prompt_idx, dtype=np.int32))

        if not all_boxes:
            return (
                np.zeros((0, 4), dtype=np.float32),
                np.zeros((0,), dtype=np.float32),
                [],
                np.zeros((0,), dtype=np.int32),
            )

        boxes = np.concatenate(all_boxes, axis=0)
        scores = np.concatenate(all_scores, axis=0)
        prompt_ids = np.concatenate(all_prompt_ids, axis=0)
        if len(scores) > 1:
            boxes, scores, support_counts = _fuse_prompt_support(
                boxes,
                scores,
                prompt_ids,
                iou_threshold=self.config.prompt_fusion_iou,
                support_boost=self.config.prompt_support_boost,
                min_votes=self.config.prompt_min_votes,
            )
        else:
            support_counts = np.ones((len(scores),), dtype=np.int32)
        labels = [self.config.canonical_label for _ in range(len(scores))]
        return boxes, scores, labels, support_counts

    def _run_grounding_batch(
        self,
        images: list[Image.Image],
    ) -> list[tuple[np.ndarray, np.ndarray, list[str], np.ndarray]]:
        if not images:
            return []

        if len(images) == 1:
            boxes, scores, labels, support_counts = self._run_grounding(images[0])
            return [(boxes, scores, labels, support_counts)]

        assert self.processor is not None
        assert self.grounding_model is not None

        try:
            if len(self.prompts) == 1:
                prompt = self.prompts[0]
                target_sizes = [image.size[::-1] for image in images]

                
                
                
                
                
                
                
                try:
                    input_list = [
                        self.processor(images=image, text=prompt, return_tensors="pt") for image in images
                    ]
                    keys = set(input_list[0].keys())
                    for current in input_list[1:]:
                        keys &= set(current.keys())
                    batched: dict[str, Any] = {}
                    for key in sorted(keys):
                        values = [current[key] for current in input_list]
                        if not values or not torch.is_tensor(values[0]):
                            continue
                        batched[key] = torch.cat(values, dim=0)
                    batched = {k: v.to(self.grounding_device) for k, v in batched.items()}
                    input_ids = batched.get("input_ids")
                    if input_ids is None:
                        raise RuntimeError("processor did not return input_ids")
                    with torch.inference_mode():
                        with _autocast_for(self.grounding_device):
                            outputs = self.grounding_model(**batched)
                except Exception:
                    inputs = self.processor(
                        images=images,
                        text=[prompt for _ in images],
                        return_tensors="pt",
                        padding=True,
                    ).to(self.grounding_device)
                    input_ids = inputs.input_ids
                    with torch.inference_mode():
                        with _autocast_for(self.grounding_device):
                            outputs = self.grounding_model(**inputs)

                try:
                    processed = self.processor.post_process_grounded_object_detection(
                        outputs,
                        input_ids,
                        box_threshold=self.config.grounding_box_threshold,
                        text_threshold=self.config.grounding_text_threshold,
                        target_sizes=target_sizes,
                    )
                except TypeError:
                    processed = self.processor.post_process_grounded_object_detection(
                        outputs,
                        input_ids,
                        threshold=self.config.grounding_box_threshold,
                        text_threshold=self.config.grounding_text_threshold,
                        target_sizes=target_sizes,
                    )
                results: list[tuple[np.ndarray, np.ndarray, list[str], np.ndarray]] = []
                for entry in processed or []:
                    if not entry or len(entry.get("boxes", [])) == 0:
                        results.append(
                            (
                                np.zeros((0, 4), dtype=np.float32),
                                np.zeros((0,), dtype=np.float32),
                                [],
                                np.zeros((0,), dtype=np.int32),
                            )
                        )
                        continue
                    boxes = entry["boxes"].detach().cpu().numpy().astype(np.float32)
                    scores = entry["scores"].detach().cpu().numpy().astype(np.float32)
                    labels = [self.config.canonical_label for _ in range(len(scores))]
                    support_counts = np.ones((len(scores),), dtype=np.int32)
                    results.append((boxes, scores, labels, support_counts))
                while len(results) < len(images):
                    results.append(
                        (
                            np.zeros((0, 4), dtype=np.float32),
                            np.zeros((0,), dtype=np.float32),
                            [],
                            np.zeros((0,), dtype=np.int32),
                        )
                    )
                return results

            
            
            flat_images: list[Image.Image] = []
            flat_text: list[str] = []
            flat_image_ids: list[int] = []
            flat_prompt_ids: list[int] = []
            for image_id, image in enumerate(images):
                for prompt_id, prompt in enumerate(self.prompts):
                    flat_images.append(image)
                    flat_text.append(prompt)
                    flat_image_ids.append(image_id)
                    flat_prompt_ids.append(prompt_id)

            all_boxes: list[list[np.ndarray]] = [[] for _ in images]
            all_scores: list[list[np.ndarray]] = [[] for _ in images]
            all_prompt_ids: list[list[np.ndarray]] = [[] for _ in images]

            
            max_batch = 32
            offset = 0
            while offset < len(flat_images):
                chunk_images = flat_images[offset : offset + max_batch]
                chunk_text = flat_text[offset : offset + max_batch]
                chunk_image_ids = flat_image_ids[offset : offset + max_batch]
                chunk_prompt_ids = flat_prompt_ids[offset : offset + max_batch]
                offset += max_batch

                inputs = self.processor(
                    images=chunk_images,
                    text=chunk_text,
                    return_tensors="pt",
                    padding=True,
                ).to(self.grounding_device)
                with torch.inference_mode():
                    with _autocast_for(self.grounding_device):
                        outputs = self.grounding_model(**inputs)
                target_sizes = [image.size[::-1] for image in chunk_images]
                try:
                    processed = self.processor.post_process_grounded_object_detection(
                        outputs,
                        inputs.input_ids,
                        box_threshold=self.config.grounding_box_threshold,
                        text_threshold=self.config.grounding_text_threshold,
                        target_sizes=target_sizes,
                    )
                except TypeError:
                    processed = self.processor.post_process_grounded_object_detection(
                        outputs,
                        inputs.input_ids,
                        threshold=self.config.grounding_box_threshold,
                        text_threshold=self.config.grounding_text_threshold,
                        target_sizes=target_sizes,
                    )

                for local_idx, entry in enumerate(processed or []):
                    if not entry or len(entry.get("boxes", [])) == 0:
                        continue
                    image_id = int(chunk_image_ids[local_idx])
                    prompt_id = int(chunk_prompt_ids[local_idx])
                    prompt_boxes = entry["boxes"].detach().cpu().numpy().astype(np.float32)
                    prompt_scores = entry["scores"].detach().cpu().numpy().astype(np.float32)
                    all_boxes[image_id].append(prompt_boxes)
                    all_scores[image_id].append(prompt_scores)
                    all_prompt_ids[image_id].append(np.full((len(prompt_scores),), prompt_id, dtype=np.int32))

            results: list[tuple[np.ndarray, np.ndarray, list[str], np.ndarray]] = []
            for image_id in range(len(images)):
                if not all_boxes[image_id]:
                    results.append(
                        (
                            np.zeros((0, 4), dtype=np.float32),
                            np.zeros((0,), dtype=np.float32),
                            [],
                            np.zeros((0,), dtype=np.int32),
                        )
                    )
                    continue

                boxes = np.concatenate(all_boxes[image_id], axis=0)
                scores = np.concatenate(all_scores[image_id], axis=0)
                prompt_ids = np.concatenate(all_prompt_ids[image_id], axis=0)
                if len(scores) > 1:
                    boxes, scores, support_counts = _fuse_prompt_support(
                        boxes,
                        scores,
                        prompt_ids,
                        iou_threshold=self.config.prompt_fusion_iou,
                        support_boost=self.config.prompt_support_boost,
                        min_votes=self.config.prompt_min_votes,
                    )
                else:
                    support_counts = np.ones((len(scores),), dtype=np.int32)
                labels = [self.config.canonical_label for _ in range(len(scores))]
                results.append((boxes, scores, labels, support_counts))
            return results
        except Exception:
            return [self._run_grounding(image) for image in images]

    def _predict_boxes_single(
        self,
        image: Image.Image,
        *,
        slice_width: int,
        slice_height: int,
        slice_overlap: float,
    ) -> tuple[np.ndarray, np.ndarray, list[str], np.ndarray]:
        if not self.config.use_slice_inference:
            return self._run_grounding(image)
        if self.config.slice_backend == "sahi":
            return self._predict_boxes_sahi(
                image,
                slice_width=slice_width,
                slice_height=slice_height,
                slice_overlap=slice_overlap,
            )

        width, height = image.size
        tiles: list[tuple[int, int, int, int]] = list(
            iter_tiles(
                width,
                height,
                slice_width,
                slice_height,
                slice_overlap,
            )
        )
        if not tiles:
            return (
                np.zeros((0, 4), dtype=np.float32),
                np.zeros((0,), dtype=np.float32),
                [],
                np.zeros((0,), dtype=np.int32),
            )

        all_boxes: list[np.ndarray] = []
        all_scores: list[np.ndarray] = []
        all_labels: list[str] = []
        all_support_counts: list[np.ndarray] = []

        
        
        batch_size = 4
        if self.grounding_device == "cpu":
            batch_size = 8
        elif self.grounding_device in {"cuda", "mps"}:
            batch_size = 16
        batch_size = max(1, min(int(batch_size), len(tiles)))
        for start in range(0, len(tiles), batch_size):
            chunk = tiles[start : start + batch_size]
            chunk_images = [image.crop((l, t, r, b)) for (l, t, r, b) in chunk]
            chunk_results = self._run_grounding_batch(chunk_images)
            for (left, top, _, _), (boxes, scores, labels, support_counts) in zip(chunk, chunk_results, strict=False):
                if len(boxes) == 0:
                    continue
                boxes[:, [0, 2]] += left
                boxes[:, [1, 3]] += top
                all_boxes.append(boxes)
                all_scores.append(scores)
                all_labels.extend(labels)
                all_support_counts.append(support_counts)

        if not all_boxes:
            return (
                np.zeros((0, 4), dtype=np.float32),
                np.zeros((0,), dtype=np.float32),
                [],
                np.zeros((0,), dtype=np.int32),
            )

        boxes = np.concatenate(all_boxes, axis=0)
        scores = np.concatenate(all_scores, axis=0)
        support_counts = np.concatenate(all_support_counts, axis=0)
        keep = nms_xyxy(boxes, scores, self.config.pre_nms_iou)
        boxes = boxes[keep]
        scores = scores[keep]
        labels = [all_labels[int(i)] for i in keep]
        support_counts = support_counts[keep]

        if len(scores) > self.config.detector_max_detections:
            order = np.argsort(-scores)[: self.config.detector_max_detections]
            boxes = boxes[order]
            scores = scores[order]
            labels = [labels[int(i)] for i in order]
            support_counts = support_counts[order]

        return boxes, scores, labels, support_counts

    def _predict_boxes(self, image: Image.Image) -> tuple[np.ndarray, np.ndarray, list[str], np.ndarray]:
        settings = self._iter_slice_settings()
        if len(settings) == 1:
            slice_width, slice_height, slice_overlap = settings[0]
            return self._predict_boxes_single(
                image,
                slice_width=slice_width,
                slice_height=slice_height,
                slice_overlap=slice_overlap,
            )

        all_boxes: list[np.ndarray] = []
        all_scores: list[np.ndarray] = []
        all_labels: list[str] = []
        all_support_counts: list[np.ndarray] = []

        for slice_width, slice_height, slice_overlap in settings:
            boxes, scores, labels, support_counts = self._predict_boxes_single(
                image,
                slice_width=slice_width,
                slice_height=slice_height,
                slice_overlap=slice_overlap,
            )
            if len(boxes) == 0:
                continue
            all_boxes.append(boxes)
            all_scores.append(scores)
            all_labels.extend(labels)
            all_support_counts.append(support_counts)

        if not all_boxes:
            return (
                np.zeros((0, 4), dtype=np.float32),
                np.zeros((0,), dtype=np.float32),
                [],
                np.zeros((0,), dtype=np.int32),
            )

        boxes = np.concatenate(all_boxes, axis=0)
        scores = np.concatenate(all_scores, axis=0)
        support_counts = np.concatenate(all_support_counts, axis=0)
        keep = nms_xyxy(boxes, scores, float(self.config.slice_fusion_iou))
        boxes = boxes[keep]
        scores = scores[keep]
        labels = [all_labels[int(index)] for index in keep]
        support_counts = support_counts[keep]

        if len(scores) > self.config.detector_max_detections:
            order = np.argsort(-scores)[: self.config.detector_max_detections]
            boxes = boxes[order]
            scores = scores[order]
            labels = [labels[int(index)] for index in order]
            support_counts = support_counts[order]

        return boxes, scores, labels, support_counts

    def _predict_boxes_sahi(
        self,
        image: Image.Image,
        *,
        slice_width: int,
        slice_height: int,
        slice_overlap: float,
    ) -> tuple[np.ndarray, np.ndarray, list[str], np.ndarray]:
        pass

        assert self.sahi_detection_model is not None
        image_np = np.asarray(image).astype(np.uint8)

        try:
            from sahi.predict import POSTPROCESS_NAME_TO_CLASS
            from sahi.slicing import slice_image

            slice_image_result = slice_image(
                image=image_np,
                slice_height=int(slice_height),
                slice_width=int(slice_width),
                overlap_height_ratio=float(slice_overlap),
                overlap_width_ratio=float(slice_overlap),
                auto_slice_resolution=bool(self.config.sahi_auto_slice_resolution),
            )
            num_slices = len(slice_image_result)
            if num_slices <= 0:
                return (
                    np.zeros((0, 4), dtype=np.float32),
                    np.zeros((0,), dtype=np.float32),
                    [],
                    np.zeros((0,), dtype=np.int32),
                )

            postprocess_type = str(self.config.sahi_postprocess_type or "GREEDYNMM").upper()
            if postprocess_type not in POSTPROCESS_NAME_TO_CLASS:
                raise ValueError(
                    f"postprocess_type should be one of {list(POSTPROCESS_NAME_TO_CLASS.keys())} "
                    f"but given as {postprocess_type}"
                )
            postprocess_constructor = POSTPROCESS_NAME_TO_CLASS[postprocess_type]
            postprocess = postprocess_constructor(
                match_threshold=float(self.config.sahi_postprocess_match_threshold),
                match_metric=str(self.config.sahi_postprocess_match_metric),
                class_agnostic=True,
            )

            full_shape = [
                int(slice_image_result.original_image_height),
                int(slice_image_result.original_image_width),
            ]
            object_prediction_list = []

            batch_size: int | None = None
            try:
                batch_size = int(self.config.sahi_batch_size) if self.config.sahi_batch_size is not None else None
            except Exception:
                batch_size = None
            if batch_size is None or batch_size <= 0:
                batch_size = 2
                if self.grounding_device in {"cuda", "mps"}:
                    batch_size = 8
            batch_size = max(1, min(int(batch_size), num_slices))

            for start in range(0, num_slices, batch_size):
                end = min(num_slices, start + batch_size)
                slice_images_all = [np.ascontiguousarray(arr) for arr in slice_image_result.images[start:end]]
                shift_amounts_all = slice_image_result.starting_pixels[start:end]

                sub_batch_size = len(slice_images_all)
                sub_start = 0
                while sub_start < len(slice_images_all):
                    current = min(sub_batch_size, len(slice_images_all) - sub_start)
                    slice_images = slice_images_all[sub_start : sub_start + current]
                    shift_amounts = shift_amounts_all[sub_start : sub_start + current]
                    try:
                        self.sahi_detection_model.perform_inference(slice_images)
                        self.sahi_detection_model.convert_original_predictions(
                            shift_amount=shift_amounts,
                            full_shape=[full_shape for _ in range(len(slice_images))],
                        )
                    except Exception:
                        if sub_batch_size <= 1:
                            raise
                        sub_batch_size = max(1, sub_batch_size // 2)
                        continue

                    for per_image in self.sahi_detection_model.object_prediction_list_per_image:
                        for object_prediction in per_image:
                            if object_prediction:
                                object_prediction_list.append(object_prediction.get_shifted_object_prediction())
                    sub_start += current

            if num_slices > 1 and bool(self.config.sahi_perform_standard_pred):
                self.sahi_detection_model.perform_inference(np.ascontiguousarray(image_np))
                self.sahi_detection_model.convert_original_predictions(
                    shift_amount=[[0, 0]],
                    full_shape=[full_shape],
                )
                object_prediction_list.extend(self.sahi_detection_model.object_prediction_list)

            if len(object_prediction_list) > 1:
                object_prediction_list = postprocess(object_prediction_list)

        except Exception:
            
            from sahi.predict import get_sliced_prediction

            prediction = get_sliced_prediction(
                image_np,
                detection_model=self.sahi_detection_model,
                slice_height=int(slice_height),
                slice_width=int(slice_width),
                overlap_height_ratio=float(slice_overlap),
                overlap_width_ratio=float(slice_overlap),
                perform_standard_pred=self.config.sahi_perform_standard_pred,
                postprocess_type=self.config.sahi_postprocess_type,
                postprocess_match_metric=self.config.sahi_postprocess_match_metric,
                postprocess_match_threshold=self.config.sahi_postprocess_match_threshold,
                postprocess_class_agnostic=True,
                verbose=0,
                auto_slice_resolution=self.config.sahi_auto_slice_resolution,
            )
            object_prediction_list = prediction.object_prediction_list

        if not object_prediction_list:
            return (
                np.zeros((0, 4), dtype=np.float32),
                np.zeros((0,), dtype=np.float32),
                [],
                np.zeros((0,), dtype=np.int32),
            )

        boxes: list[list[float]] = []
        scores: list[float] = []
        labels: list[str] = []
        support_counts: list[int] = []
        for object_prediction in object_prediction_list:
            raw_label = str(object_prediction.category.name)
            label = raw_label
            votes = 1
            if "__votes" in raw_label:
                prefix, suffix = raw_label.split("__votes", 1)
                if prefix.strip():
                    label = prefix
                try:
                    votes = int(suffix)
                except Exception:
                    votes = 1
            boxes.append(
                [
                    float(object_prediction.bbox.minx),
                    float(object_prediction.bbox.miny),
                    float(object_prediction.bbox.maxx),
                    float(object_prediction.bbox.maxy),
                ]
            )
            scores.append(float(object_prediction.score.value))
            labels.append(label)
            support_counts.append(votes)

        boxes_array = np.asarray(boxes, dtype=np.float32)
        scores_array = np.asarray(scores, dtype=np.float32)
        support_counts = np.asarray(support_counts, dtype=np.int32)
        keep = nms_xyxy(boxes_array, scores_array, self.config.pre_nms_iou)
        boxes_array = boxes_array[keep]
        scores_array = scores_array[keep]
        labels = [labels[int(index)] for index in keep]
        support_counts = support_counts[keep]

        if len(scores_array) > self.config.detector_max_detections:
            order = np.argsort(-scores_array)[: self.config.detector_max_detections]
            boxes_array = boxes_array[order]
            scores_array = scores_array[order]
            labels = [labels[int(index)] for index in order]
            support_counts = support_counts[order]

        return boxes_array, scores_array, labels, support_counts

    def detect(self, image_path: str | Path, frame_idx: int) -> RawDetections:
        self._load_models()
        image = Image.open(image_path).convert("RGB")
        boxes, scores, labels, prompt_support_counts = self._predict_boxes(image)

        sam_boxes: list[list[float]] | None = None
        mask_areas: list[float] | None = None
        if len(boxes) > 0:
            refinement_limit = self.config.sam2_max_refinement_boxes
            if refinement_limit is None or refinement_limit > 0:
                image_rgb = np.asarray(image)
                assert self.sam_predictor is not None
                refine_indices = np.arange(len(boxes), dtype=np.int32)
                refine_boxes = boxes
                if refinement_limit is not None and len(boxes) > refinement_limit:
                    refine_indices = np.argsort(-scores)[:refinement_limit].astype(np.int32)
                    refine_boxes = boxes[refine_indices]

                
                sam_boxes_array = boxes.astype(np.float32).copy()
                mask_areas_array = np.zeros((len(boxes),), dtype=np.float32)

                self.sam_predictor.set_image(image_rgb)
                batch_size = self.config.sam2_refinement_batch_size
                if batch_size is None or int(batch_size) <= 0:
                    batch_size = len(refine_boxes)
                batch_size = max(1, int(batch_size))

                for start in range(0, len(refine_boxes), batch_size):
                    end = min(len(refine_boxes), start + batch_size)
                    batch_boxes = refine_boxes[start:end]
                    batch_indices = refine_indices[start:end]
                    masks, _, _ = self.sam_predictor.predict(
                        point_coords=None,
                        point_labels=None,
                        box=batch_boxes,
                        multimask_output=False,
                    )
                    if masks.ndim == 4:
                        masks = masks.squeeze(1)

                    for local_index, (mask, fallback_box) in enumerate(zip(masks.astype(bool), batch_boxes)):
                        target_index = int(batch_indices[local_index])
                        ys, xs = np.where(mask)
                        if len(xs) == 0 or len(ys) == 0:
                            sam_boxes_array[target_index] = fallback_box.astype(np.float32)
                            continue
                        sam_boxes_array[target_index] = np.asarray(
                            [
                                float(xs.min()),
                                float(ys.min()),
                                float(xs.max()),
                                float(ys.max()),
                            ],
                            dtype=np.float32,
                        )
                        mask_areas_array[target_index] = float(mask.sum())

                sam_boxes = sam_boxes_array.astype(float).tolist()
                mask_areas = mask_areas_array.astype(float).tolist()

        return RawDetections(
            frame_idx=frame_idx,
            image_path=str(Path(image_path).expanduser().resolve()),
            image_height=image.height,
            image_width=image.width,
            prompt=self.prompt,
            grounding_boxes=boxes.astype(float).tolist(),
            scores=scores.astype(float).tolist(),
            labels=labels,
            prompt_support_counts=prompt_support_counts.astype(int).tolist(),
            sam_boxes=sam_boxes,
            mask_areas=mask_areas,
        )

    def detect_batch(
        self,
        image_paths: list[str | Path],
        frame_indices: list[int],
    ) -> list[RawDetections]:
        if len(image_paths) != len(frame_indices):
            raise ValueError("image_paths and frame_indices must have the same length")
        if not image_paths:
            return []
        refinement_limit = self.config.sam2_max_refinement_boxes
        if self.config.use_slice_inference or refinement_limit is None or int(refinement_limit) > 0:
            return [self.detect(path, frame_idx) for path, frame_idx in zip(image_paths, frame_indices, strict=True)]

        self._load_models()
        images = [Image.open(path).convert("RGB") for path in image_paths]
        predictions = self._run_grounding_batch(images)
        results: list[RawDetections] = []
        for path, frame_idx, image, prediction in zip(
            image_paths,
            frame_indices,
            images,
            predictions,
            strict=True,
        ):
            boxes, scores, labels, prompt_support_counts = prediction
            results.append(
                RawDetections(
                    frame_idx=int(frame_idx),
                    image_path=str(Path(path).expanduser().resolve()),
                    image_height=int(image.height),
                    image_width=int(image.width),
                    prompt=self.prompt,
                    grounding_boxes=boxes.astype(float).tolist(),
                    scores=scores.astype(float).tolist(),
                    labels=labels,
                    prompt_support_counts=prompt_support_counts.astype(int).tolist(),
                    sam_boxes=None,
                    mask_areas=None,
                )
            )
        return results
