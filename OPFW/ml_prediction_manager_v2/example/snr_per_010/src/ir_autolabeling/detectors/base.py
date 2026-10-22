from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import numpy as np

from ir_autolabeling.utils.geometry import (
    box_area_xyxy,
    clamp_xyxy,
    height_width_ratio_xyxy,
    nms_xyxy,
)


@dataclass(slots=True)
class RawDetections:
    frame_idx: int
    image_path: str
    image_height: int
    image_width: int
    prompt: str
    grounding_boxes: list[list[float]]
    scores: list[float]
    labels: list[str]
    prompt_support_counts: list[int] | None = None
    sam_boxes: list[list[float]] | None = None
    mask_areas: list[float] | None = None

    def to_json_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_json_dict(cls, payload: dict[str, Any]) -> "RawDetections":
        return cls(**payload)

    def _select_boxes(self, box_source: str) -> np.ndarray:
        grounding = np.asarray(self.grounding_boxes, dtype=np.float32)
        if self.sam_boxes is None:
            return grounding
        sam = np.asarray(self.sam_boxes, dtype=np.float32)
        if box_source == "grounding":
            return grounding
        if box_source == "sam":
            return sam
        if box_source == "union":
            x1 = np.minimum(grounding[:, 0], sam[:, 0])
            y1 = np.minimum(grounding[:, 1], sam[:, 1])
            x2 = np.maximum(grounding[:, 2], sam[:, 2])
            y2 = np.maximum(grounding[:, 3], sam[:, 3])
            return np.stack([x1, y1, x2, y2], axis=1)
        raise ValueError(f"Unsupported box_source: {box_source}")

    def to_tracker_detections(
        self,
        *,
        box_source: str,
        score_threshold: float,
        nms_iou_threshold: float,
        min_box_area: float,
        min_height: float,
        min_width: float,
        min_height_width_ratio: float,
        max_height_width_ratio: float,
        top_k: int | None,
        rescue_score_threshold: float | None = None,
        rescue_max_area: float | None = None,
        rescue_min_height: float | None = None,
        rescue_min_width: float | None = None,
        rescue_min_height_width_ratio: float | None = None,
        upper_zone_y_limit: float | None = None,
        upper_zone_score_threshold: float | None = None,
        upper_zone_min_box_area: float | None = None,
        upper_zone_min_height: float | None = None,
        upper_zone_min_width: float | None = None,
        upper_zone_min_height_width_ratio: float | None = None,
        min_prompt_votes: int | None = None,
        prompt_support_weight: float | None = None,
        aspect_ratio_target: float | None = None,
        aspect_ratio_tolerance: float | None = None,
        aspect_ratio_score_bonus: float | None = None,
        aspect_ratio_score_penalty: float | None = None,
        mask_fill_target: float | None = None,
        mask_fill_tolerance: float | None = None,
        mask_fill_score_bonus: float | None = None,
        mask_fill_score_penalty: float | None = None,
        small_box_area_threshold: float | None = None,
        small_box_score_bonus: float | None = None,
        upper_zone_small_box_bonus: float | None = None,
        gs_iou_min: float | None = None,
        gs_iou_weight: float | None = None,
        score_power: float | None = None,
        score_bias: float | None = None,
    ) -> np.ndarray:
        if not self.grounding_boxes:
            return np.zeros((0, 6), dtype=np.float32)
        boxes = self._select_boxes(box_source)
        scores = np.asarray(self.scores, dtype=np.float32)
        support_counts = np.asarray(
            self.prompt_support_counts if self.prompt_support_counts is not None else [1] * len(scores),
            dtype=np.float32,
        )
        boxes = clamp_xyxy(boxes, self.image_width, self.image_height)

        widths = np.maximum(0.0, boxes[:, 2] - boxes[:, 0])
        heights = np.maximum(0.0, boxes[:, 3] - boxes[:, 1])
        ratios = height_width_ratio_xyxy(boxes)
        areas = box_area_xyxy(boxes)
        y_centers = 0.5 * (boxes[:, 1] + boxes[:, 3])
        calibrated_scores = scores.copy()

        mask_fill: np.ndarray | None = None
        mask_fill_valid: np.ndarray | None = None
        if self.mask_areas is not None and self.sam_boxes is not None:
            try:
                mask_areas = np.asarray(self.mask_areas, dtype=np.float32)
                
                
                
                mask_fill = mask_areas / np.maximum(areas, 1e-6)
                mask_fill = np.clip(mask_fill, 0.0, 1.0)
                mask_fill_valid = mask_areas > 0.0
            except Exception:
                mask_fill = None
                mask_fill_valid = None

        grounding_sam_iou: np.ndarray | None = None
        if self.sam_boxes is not None:
            try:
                grounding = np.asarray(self.grounding_boxes, dtype=np.float32)
                sam = np.asarray(self.sam_boxes, dtype=np.float32)
                grounding = clamp_xyxy(grounding, self.image_width, self.image_height)
                sam = clamp_xyxy(sam, self.image_width, self.image_height)
                x1 = np.maximum(grounding[:, 0], sam[:, 0])
                y1 = np.maximum(grounding[:, 1], sam[:, 1])
                x2 = np.minimum(grounding[:, 2], sam[:, 2])
                y2 = np.minimum(grounding[:, 3], sam[:, 3])
                inter = np.maximum(0.0, x2 - x1) * np.maximum(0.0, y2 - y1)
                area_g = box_area_xyxy(grounding)
                area_s = box_area_xyxy(sam)
                union = np.maximum(area_g + area_s - inter, 1e-6)
                grounding_sam_iou = inter / union
                grounding_sam_iou = np.clip(grounding_sam_iou, 0.0, 1.0)
            except Exception:
                grounding_sam_iou = None

        if min_prompt_votes is not None and int(min_prompt_votes) > 1:
            calibrated_scores = np.where(support_counts >= float(min_prompt_votes), calibrated_scores, -1.0)

        if prompt_support_weight is not None and float(prompt_support_weight) != 0.0:
            calibrated_scores += np.maximum(0.0, support_counts - 1.0) * float(prompt_support_weight)

        if (
            grounding_sam_iou is not None
            and gs_iou_min is not None
            and 0.0 < float(gs_iou_min) <= 1.0
        ):
            calibrated_scores = np.where(grounding_sam_iou >= float(gs_iou_min), calibrated_scores, -1.0)

        if (
            grounding_sam_iou is not None
            and gs_iou_weight is not None
            and float(gs_iou_weight) != 0.0
        ):
            calibrated_scores += grounding_sam_iou * float(gs_iou_weight)

        if (
            aspect_ratio_target is not None
            and float(aspect_ratio_target) > 0.0
            and aspect_ratio_tolerance is not None
            and float(aspect_ratio_tolerance) > 0.0
            and (
                (aspect_ratio_score_bonus is not None and float(aspect_ratio_score_bonus) != 0.0)
                or (aspect_ratio_score_penalty is not None and float(aspect_ratio_score_penalty) != 0.0)
            )
        ):
            log_distance = np.abs(np.log(np.maximum(ratios, 1e-6) / float(aspect_ratio_target)))
            ratio_closeness = np.maximum(0.0, 1.0 - (log_distance / float(aspect_ratio_tolerance)))
            if aspect_ratio_score_bonus is not None and float(aspect_ratio_score_bonus) != 0.0:
                calibrated_scores += ratio_closeness * float(aspect_ratio_score_bonus)
            if aspect_ratio_score_penalty is not None and float(aspect_ratio_score_penalty) != 0.0:
                ratio_penalty = np.minimum(1.0, log_distance / float(aspect_ratio_tolerance))
                calibrated_scores -= ratio_penalty * float(abs(float(aspect_ratio_score_penalty)))

        if (
            mask_fill is not None
            and mask_fill_valid is not None
            and mask_fill_target is not None
            and 0.0 < float(mask_fill_target) <= 1.0
            and mask_fill_tolerance is not None
            and float(mask_fill_tolerance) > 0.0
            and (
                (mask_fill_score_bonus is not None and float(mask_fill_score_bonus) != 0.0)
                or (mask_fill_score_penalty is not None and float(mask_fill_score_penalty) != 0.0)
            )
        ):
            mask_distance = np.abs(mask_fill - float(mask_fill_target))
            mask_closeness = np.maximum(0.0, 1.0 - (mask_distance / float(mask_fill_tolerance)))
            if mask_fill_score_bonus is not None and float(mask_fill_score_bonus) != 0.0:
                calibrated_scores += mask_fill_valid.astype(np.float32) * mask_closeness * float(mask_fill_score_bonus)
            if mask_fill_score_penalty is not None and float(mask_fill_score_penalty) != 0.0:
                mask_penalty = np.minimum(1.0, mask_distance / float(mask_fill_tolerance))
                calibrated_scores -= (
                    mask_fill_valid.astype(np.float32) * mask_penalty * float(abs(float(mask_fill_score_penalty)))
                )

        if (
            small_box_area_threshold is not None
            and float(small_box_area_threshold) > 0.0
            and small_box_score_bonus is not None
            and float(small_box_score_bonus) != 0.0
        ):
            small_mask = areas <= float(small_box_area_threshold)
            calibrated_scores += small_mask.astype(np.float32) * float(small_box_score_bonus)

        if (
            upper_zone_small_box_bonus is not None
            and float(upper_zone_small_box_bonus) != 0.0
            and upper_zone_y_limit is not None
            and float(upper_zone_y_limit) > 0.0
            and small_box_area_threshold is not None
            and float(small_box_area_threshold) > 0.0
        ):
            upper_small_mask = (y_centers <= float(upper_zone_y_limit)) & (areas <= float(small_box_area_threshold))
            calibrated_scores += upper_small_mask.astype(np.float32) * float(upper_zone_small_box_bonus)

        
        
        
        
        
        
        
        calibrated_scores = np.maximum(calibrated_scores, -1.0)

        
        
        
        
        positive_mask = calibrated_scores >= 0.0
        if np.any(positive_mask):
            remapped_scores = np.clip(calibrated_scores[positive_mask], 0.0, 1.0)
            if score_power is not None and float(score_power) > 0.0 and float(score_power) != 1.0:
                remapped_scores = np.power(remapped_scores, float(score_power))
            if score_bias is not None and float(score_bias) != 0.0:
                remapped_scores = remapped_scores + float(score_bias)
            calibrated_scores[positive_mask] = remapped_scores

        geometry_keep = heights >= float(min_height)
        geometry_keep &= widths >= float(min_width)
        geometry_keep &= ratios >= float(min_height_width_ratio)
        geometry_keep &= ratios <= float(max_height_width_ratio)

        keep = calibrated_scores >= float(score_threshold)
        keep &= areas >= float(min_box_area)
        keep &= geometry_keep

        if rescue_score_threshold is not None and rescue_max_area is not None and float(rescue_max_area) > 0.0:
            rescue_keep = calibrated_scores >= float(rescue_score_threshold)
            rescue_keep &= areas < float(min_box_area)
            rescue_keep &= areas <= float(rescue_max_area)
            rescue_keep &= heights >= float(min_height if rescue_min_height is None else rescue_min_height)
            rescue_keep &= widths >= float(min_width if rescue_min_width is None else rescue_min_width)
            rescue_keep &= ratios >= float(
                min_height_width_ratio if rescue_min_height_width_ratio is None else rescue_min_height_width_ratio
            )
            rescue_keep &= ratios <= float(max_height_width_ratio)
            keep |= rescue_keep

        if upper_zone_y_limit is not None and float(upper_zone_y_limit) > 0.0:
            upper_zone_score_floor = score_threshold if upper_zone_score_threshold is None else upper_zone_score_threshold
            upper_zone_area_floor = min_box_area if upper_zone_min_box_area is None else upper_zone_min_box_area
            upper_zone_height_floor = min_height if upper_zone_min_height is None else upper_zone_min_height
            upper_zone_width_floor = min_width if upper_zone_min_width is None else upper_zone_min_width
            upper_zone_ratio_floor = (
                min_height_width_ratio if upper_zone_min_height_width_ratio is None else upper_zone_min_height_width_ratio
            )
            upper_keep = y_centers <= float(upper_zone_y_limit)
            upper_keep &= calibrated_scores >= float(upper_zone_score_floor)
            upper_keep &= areas >= float(upper_zone_area_floor)
            upper_keep &= heights >= float(upper_zone_height_floor)
            upper_keep &= widths >= float(upper_zone_width_floor)
            upper_keep &= ratios >= float(upper_zone_ratio_floor)
            upper_keep &= ratios <= float(max_height_width_ratio)
            keep |= upper_keep

        boxes = boxes[keep]
        scores = calibrated_scores[keep]
        if len(boxes) == 0:
            return np.zeros((0, 6), dtype=np.float32)

        keep_idx = nms_xyxy(boxes, scores, float(nms_iou_threshold))
        boxes = boxes[keep_idx]
        scores = scores[keep_idx]

        if top_k is not None and len(scores) > top_k:
            order = np.argsort(-scores)[:top_k]
            boxes = boxes[order]
            scores = scores[order]

        
        classes = np.zeros((len(boxes), 1), dtype=np.float32)
        
        scores = np.clip(scores, 0.0, 1.0)
        scores_col = scores[:, None]
        return np.concatenate([boxes.astype(np.float32), scores_col.astype(np.float32), classes], axis=1)
