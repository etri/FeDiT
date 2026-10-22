from __future__ import annotations

from pathlib import Path

import numpy as np

from detection_io import DetectionSet, load_detections, save_detections
from mot20_io import TRAIN_SEQUENCES


def pairwise_iou_xyxy(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    if len(a) == 0 or len(b) == 0:
        return np.zeros((len(a), len(b)), dtype=np.float32)
    x1 = np.maximum(a[:, None, 0], b[None, :, 0])
    y1 = np.maximum(a[:, None, 1], b[None, :, 1])
    x2 = np.minimum(a[:, None, 2], b[None, :, 2])
    y2 = np.minimum(a[:, None, 3], b[None, :, 3])
    inter = np.maximum(0.0, x2 - x1) * np.maximum(0.0, y2 - y1)
    area_a = np.maximum(0.0, a[:, 2] - a[:, 0]) * np.maximum(0.0, a[:, 3] - a[:, 1])
    area_b = np.maximum(0.0, b[:, 2] - b[:, 0]) * np.maximum(0.0, b[:, 3] - b[:, 1])
    union = np.maximum(area_a[:, None] + area_b[None, :] - inter, 1e-9)
    return inter / union


def standard_nms(boxes: np.ndarray, scores: np.ndarray, iou_threshold: float) -> np.ndarray:
    if len(boxes) == 0:
        return np.zeros((0,), dtype=np.int64)
    order = np.argsort(-scores)
    keep: list[int] = []
    while len(order) > 0:
        current = int(order[0])
        keep.append(current)
        if len(order) == 1:
            break
        rest = order[1:]
        ious = pairwise_iou_xyxy(boxes[current : current + 1], boxes[rest])[0]
        order = rest[ious <= float(iou_threshold)]
    return np.asarray(keep, dtype=np.int64)


def soft_nms(
    boxes: np.ndarray,
    scores: np.ndarray,
    *,
    iou_threshold: float = 0.7,
    sigma: float = 0.5,
    method: str = "linear",
    score_threshold: float = 1e-6,
) -> tuple[np.ndarray, np.ndarray]:
    if len(boxes) == 0:
        return np.zeros((0,), dtype=np.int64), scores.copy()
    boxes_work = boxes.astype(np.float32).copy()
    scores_work = scores.astype(np.float32).copy()
    indices = np.arange(len(scores_work), dtype=np.int64)
    keep: list[int] = []
    keep_scores: list[float] = []

    while len(scores_work) > 0:
        best_pos = int(np.argmax(scores_work))
        best_index = int(indices[best_pos])
        best_score = float(scores_work[best_pos])
        if best_score < float(score_threshold):
            break
        keep.append(best_index)
        keep_scores.append(best_score)
        best_box = boxes_work[best_pos : best_pos + 1]
        boxes_work = np.delete(boxes_work, best_pos, axis=0)
        scores_work = np.delete(scores_work, best_pos, axis=0)
        indices = np.delete(indices, best_pos, axis=0)
        if len(scores_work) == 0:
            break
        ious = pairwise_iou_xyxy(best_box, boxes_work)[0]
        if method == "gaussian":
            decay = np.exp(-((ious * ious) / max(float(sigma), 1e-6)))
        else:
            decay = np.where(ious > float(iou_threshold), 1.0 - ious, 1.0)
        scores_work *= decay.astype(np.float32)
    return np.asarray(keep, dtype=np.int64), np.asarray(keep_scores, dtype=np.float32)


def weighted_box_fusion(
    boxes: np.ndarray,
    scores: np.ndarray,
    *,
    iou_threshold: float = 0.85,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    if len(boxes) == 0:
        return boxes.copy(), scores.copy(), np.zeros((0,), dtype=np.int64)
    order = np.argsort(-scores)
    assigned = np.zeros(len(scores), dtype=bool)
    fused_boxes: list[np.ndarray] = []
    fused_scores: list[float] = []
    source_indices: list[int] = []
    iou = pairwise_iou_xyxy(boxes, boxes)
    for anchor in order:
        if assigned[int(anchor)]:
            continue
        cluster = np.flatnonzero((~assigned) & (iou[int(anchor)] >= float(iou_threshold)))
        assigned[cluster] = True
        weights = np.maximum(scores[cluster], 1e-6)
        fused = np.sum(boxes[cluster] * weights[:, None], axis=0) / np.sum(weights)
        fused_boxes.append(fused.astype(np.float32))
        fused_scores.append(float(np.max(scores[cluster])))
        source_indices.append(int(anchor))
    return (
        np.asarray(fused_boxes, dtype=np.float32).reshape((-1, 4)),
        np.asarray(fused_scores, dtype=np.float32),
        np.asarray(source_indices, dtype=np.int64),
    )


def _subset(detections: DetectionSet, indices: np.ndarray, scores_override: np.ndarray | None = None) -> DetectionSet:
    out = DetectionSet(
        frames=detections.frames[indices],
        boxes=detections.boxes[indices],
        raw_scores=detections.raw_scores[indices],
        calibrated_scores=detections.calibrated_scores[indices],
        prompt_ids=detections.prompt_ids[indices],
        tile_ids=detections.tile_ids[indices],
        image_widths=detections.image_widths[indices],
        image_heights=detections.image_heights[indices],
        prompt_texts=detections.prompt_texts[indices],
    )
    if scores_override is not None:
        out.calibrated_scores = scores_override.astype(np.float32)
    return out


def apply_nms_to_set(
    detections: DetectionSet,
    *,
    nms_type: str,
    iou_threshold: float,
    sigma: float = 0.5,
) -> DetectionSet:
    if nms_type in {"none", "off", ""}:
        return detections.copy()
    by_frame = detections.by_frame()
    keep_indices: list[np.ndarray] = []
    score_updates: dict[int, float] = {}
    fused_parts: list[DetectionSet] = []

    for _frame, indices in sorted(by_frame.items()):
        boxes = detections.boxes[indices]
        scores = detections.calibrated_scores[indices]
        if nms_type in {"standard", "nms"}:
            local_keep = standard_nms(boxes, scores, iou_threshold)
            keep_indices.append(indices[local_keep])
        elif nms_type in {"soft_nms", "soft-nms", "soft_nms_linear"}:
            local_keep, new_scores = soft_nms(
                boxes,
                scores,
                iou_threshold=iou_threshold,
                sigma=sigma,
                method="linear",
            )
            absolute = indices[local_keep]
            keep_indices.append(absolute)
            score_updates.update({int(idx): float(score) for idx, score in zip(absolute, new_scores, strict=False)})
        elif nms_type in {"soft_nms_gaussian", "soft-nms-gaussian"}:
            local_keep, new_scores = soft_nms(
                boxes,
                scores,
                iou_threshold=iou_threshold,
                sigma=sigma,
                method="gaussian",
            )
            absolute = indices[local_keep]
            keep_indices.append(absolute)
            score_updates.update({int(idx): float(score) for idx, score in zip(absolute, new_scores, strict=False)})
        elif nms_type in {"wbf", "weighted_box_fusion"}:
            fused_boxes, fused_scores, source_local = weighted_box_fusion(boxes, scores, iou_threshold=iou_threshold)
            source_abs = indices[source_local]
            part = _subset(detections, source_abs)
            part.boxes = fused_boxes
            part.calibrated_scores = fused_scores
            fused_parts.append(part)
        else:
            raise ValueError(f"Unsupported NMS type: {nms_type}")

    if nms_type in {"wbf", "weighted_box_fusion"}:
        if not fused_parts:
            return detections.copy()
        return DetectionSet(
            frames=np.concatenate([p.frames for p in fused_parts]).astype(np.int32),
            boxes=np.concatenate([p.boxes for p in fused_parts]).astype(np.float32),
            raw_scores=np.concatenate([p.raw_scores for p in fused_parts]).astype(np.float32),
            calibrated_scores=np.concatenate([p.calibrated_scores for p in fused_parts]).astype(np.float32),
            prompt_ids=np.concatenate([p.prompt_ids for p in fused_parts]).astype(np.int32),
            tile_ids=np.concatenate([p.tile_ids for p in fused_parts]).astype(np.int32),
            image_widths=np.concatenate([p.image_widths for p in fused_parts]).astype(np.int32),
            image_heights=np.concatenate([p.image_heights for p in fused_parts]).astype(np.int32),
            prompt_texts=np.concatenate([p.prompt_texts for p in fused_parts]),
        )

    if keep_indices:
        keep = np.concatenate(keep_indices).astype(np.int64)
    else:
        keep = np.zeros((0,), dtype=np.int64)
    out = _subset(detections, keep)
    if score_updates:
        out.calibrated_scores = np.asarray(
            [score_updates.get(int(idx), float(detections.calibrated_scores[int(idx)])) for idx in keep],
            dtype=np.float32,
        )
    return out


def apply_nms_to_dir(
    src_dir: str | Path,
    dst_dir: str | Path,
    *,
    nms_type: str,
    iou_threshold: float,
    sigma: float = 0.5,
) -> Path:
    source = Path(src_dir).expanduser().resolve()
    target = Path(dst_dir).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    for seq in TRAIN_SEQUENCES:
        src_path = source / f"{seq}.npz"
        if not src_path.exists():
            raise FileNotFoundError(src_path)
        detections = load_detections(src_path)
        filtered = apply_nms_to_set(
            detections,
            nms_type=nms_type,
            iou_threshold=iou_threshold,
            sigma=sigma,
        )
        save_detections(target / f"{seq}.npz", filtered)
    return target
