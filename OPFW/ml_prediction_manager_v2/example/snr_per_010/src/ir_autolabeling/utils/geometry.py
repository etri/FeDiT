from __future__ import annotations

from typing import Iterable

import numpy as np


def clamp_xyxy(boxes: np.ndarray, width: int, height: int) -> np.ndarray:
    clipped = boxes.astype(np.float32).copy()
    clipped[:, 0] = np.clip(clipped[:, 0], 0, width - 1)
    clipped[:, 1] = np.clip(clipped[:, 1], 0, height - 1)
    clipped[:, 2] = np.clip(clipped[:, 2], 0, width - 1)
    clipped[:, 3] = np.clip(clipped[:, 3], 0, height - 1)
    return clipped


def box_area_xyxy(boxes: np.ndarray) -> np.ndarray:
    widths = np.maximum(0.0, boxes[:, 2] - boxes[:, 0])
    heights = np.maximum(0.0, boxes[:, 3] - boxes[:, 1])
    return widths * heights


def height_width_ratio_xyxy(boxes: np.ndarray) -> np.ndarray:
    widths = np.maximum(1e-6, boxes[:, 2] - boxes[:, 0])
    heights = np.maximum(1e-6, boxes[:, 3] - boxes[:, 1])
    return heights / widths


def xyxy_to_tlwh(boxes: np.ndarray) -> np.ndarray:
    converted = boxes.astype(np.float64).copy()
    converted[:, 2] = converted[:, 2] - converted[:, 0]
    converted[:, 3] = converted[:, 3] - converted[:, 1]
    return converted


def pairwise_iou_xyxy(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    if len(a) == 0 or len(b) == 0:
        return np.zeros((len(a), len(b)), dtype=np.float32)
    x1 = np.maximum(a[:, None, 0], b[None, :, 0])
    y1 = np.maximum(a[:, None, 1], b[None, :, 1])
    x2 = np.minimum(a[:, None, 2], b[None, :, 2])
    y2 = np.minimum(a[:, None, 3], b[None, :, 3])
    inter = np.maximum(0.0, x2 - x1) * np.maximum(0.0, y2 - y1)
    area_a = box_area_xyxy(a)[:, None]
    area_b = box_area_xyxy(b)[None, :]
    union = np.maximum(area_a + area_b - inter, 1e-6)
    return inter / union


def nms_xyxy(boxes: np.ndarray, scores: np.ndarray, iou_threshold: float) -> np.ndarray:
    if len(boxes) == 0:
        return np.zeros((0,), dtype=np.int64)
    try:
        import torch
        from torchvision.ops import nms as tv_nms  

        keep = tv_nms(
            torch.as_tensor(boxes, dtype=torch.float32),
            torch.as_tensor(scores, dtype=torch.float32),
            float(iou_threshold),
        )
        return keep.detach().cpu().numpy().astype(np.int64)
    except Exception:
        pass
    order = np.argsort(-scores)
    keep: list[int] = []
    while len(order) > 0:
        current = int(order[0])
        keep.append(current)
        if len(order) == 1:
            break
        rest = order[1:]
        ious = pairwise_iou_xyxy(boxes[current : current + 1], boxes[rest])[0]
        order = rest[ious <= iou_threshold]
    return np.asarray(keep, dtype=np.int64)


def iter_tiles(
    width: int,
    height: int,
    tile_width: int,
    tile_height: int,
    overlap: float,
) -> Iterable[tuple[int, int, int, int]]:
    if tile_width >= width and tile_height >= height:
        yield (0, 0, width, height)
        return
    step_x = max(1, int(tile_width * (1.0 - overlap)))
    step_y = max(1, int(tile_height * (1.0 - overlap)))
    ys = list(range(0, max(height - tile_height, 0) + 1, step_y))
    xs = list(range(0, max(width - tile_width, 0) + 1, step_x))
    if not ys or ys[-1] != max(height - tile_height, 0):
        ys.append(max(height - tile_height, 0))
    if not xs or xs[-1] != max(width - tile_width, 0):
        xs.append(max(width - tile_width, 0))
    seen: set[tuple[int, int, int, int]] = set()
    for top in ys:
        for left in xs:
            tile = (
                int(left),
                int(top),
                int(min(left + tile_width, width)),
                int(min(top + tile_height, height)),
            )
            if tile in seen:
                continue
            seen.add(tile)
            yield tile
