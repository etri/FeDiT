from __future__ import annotations

import json
import math
import os
from itertools import product
from pathlib import Path
from typing import Any

import numpy as np

from ..common.schemas import FlowMetadata, SpecError, problem
from ..runtime import weights as checkpoints
from . import transforms
from .transforms import CHANNELS, case_tile



def _starts(size: int, window: int, halo: int) -> list[int]:
    if size <= window:
        return [0]
    stride = window - 2 * halo
    if stride <= 0:
        raise ValueError("Tile size must be greater than twice the halo.")
    starts = list(range(0, size - window + 1, stride))
    if starts[-1] != size - window:
        starts.append(size - window)
    return starts


def prepare_case(case: dict, checkpoint: Path) -> dict:
    """학습 정규화와 원본 좌표를 유지한 타일 입력 및 복원 문맥 생성"""
    # 가중치 설정과 셀 예산 확인
    selection = checkpoints.read_preprocessing(checkpoint)
    shape = tuple(case["boundary_type"].shape)
    budget = int(os.getenv("FLOWCAST_MAX_INFERENCE_VOXELS", "1048576"))
    if budget < 16 ** 3:
        raise ValueError("Inference cell budget must be at least 4096.")
    tokens = math.prod((size + 15) // 16 for size in shape)
    full_grid = min(shape) >= 16 and math.prod(shape) <= budget and tokens <= 512

    # 압력 모델은 전체 좌표를 유지하고 기존 모델만 타일 분할
    if full_grid:
        window = list(shape)
    else:
        if selection["model_config"].get("pressure_refinement", False):
            raise ValueError(
                "Pressure refinement models require full-grid inference to preserve the training coordinate domain: "
                f"grid={shape}, cells={math.prod(shape)}/{budget}, "
                f"bottleneck tokens={tokens}/512, minimum axis={min(shape)}/16."
            )
        window = [max(16, min(size, 64)) for size in shape]
        while math.prod(window) > budget:
            axis = max(range(3), key=lambda index: window[index])
            window[axis] = max(16, window[axis] // 2)
    halo = min(8, (min(window) - 1) // 2)
    starts = [list(start) for start in product(*[_starts(size, width, halo) for size, width in zip(shape, window)])]

    # 타일 정규화와 패딩
    spatial, conditions = [], []
    for start in starts:
        tile, region = case_tile(case, start, window)
        encoded = transforms.encode_case(tile, selection["normalization"])
        local_shape = tuple(part.stop - part.start for part in region)
        padding = ((0, 0), *((0, max(16, size) - size) for size in local_shape))
        spatial.append(np.pad(encoded["spatial"], padding, mode="edge"))
        conditions.append(encoded["conditions"])

    # 고정 모델과 복원 문맥 전달
    model_spec = {"checkpoint_signature": selection["checkpoint_signature"]}
    return {
        "spatial": np.ascontiguousarray(np.stack(spatial), dtype=np.float32),
        "conditions": np.ascontiguousarray(np.stack(conditions), dtype=np.float32),
        "model_spec": model_spec,
        "context": {"case": {key: value for key, value in case.items() if key != "target"},
                    "selection": selection, "starts": starts, "window": window, "halo": halo},
    }


def _verify_selection(prepared: dict, selected: dict, checkpoint: Path) -> None:
    signature = list(checkpoints.checkpoint_signature(checkpoint))
    if signature != selected["checkpoint_signature"]:
        raise ValueError("model.pt changed while preparing the request.")
    if prepared["model_spec"].get("checkpoint_signature") != signature:
        raise ValueError("Checkpoint generation differs between request and preprocessing.")


def infer_conditions(flow: np.ndarray, solid: np.ndarray, metadata: FlowMetadata,
                     physics: dict[str, float], ground_z: float) -> dict[str, float]:
    indices = [metadata.channels.index(name) for name in CHANNELS[:2]]
    heights = metadata.grid.origin[2] + (np.arange(metadata.grid.shape[2]) + .5) * metadata.grid.spacing[2]
    zref, z0 = float(physics.get("zref", 10)), float(physics.get("z0", .1))
    displacement = float(physics.get("displacement", 0))
    level = int(np.argmin(np.abs(heights - ground_z - zref)))
    valid = ~solid[:, :, level]
    if valid.any():
        vector = np.mean(flow[:, :, level, :][valid][:, indices], axis=0)
        height = max(float(heights[level] - ground_z - displacement), 0)
    else:
        valid = ~solid
        vector = np.mean(flow[valid][:, indices], axis=0)
        height = max(float(np.mean(heights) - ground_z - displacement), 0)
    profile = np.log1p(height / z0) / np.log1p((zref - displacement) / z0)
    speed = float(np.linalg.norm(vector)) / max(float(profile), 1e-6)
    if not np.isfinite(speed) or speed <= 1e-6:
        raise ValueError("Static flow fields require an explicit wind direction and positive reference speed.")
    return {"wind_speed_m_s": speed,
            "wind_direction_deg": float(np.degrees(np.arctan2(vector[1], vector[0])) % 360)}


def _canonical(flow: np.ndarray, mask: np.ndarray, metadata: FlowMetadata):
    """요청 축과 단위를 TXYZC 표준 물리 단위로 변환"""
    problems = metadata.array_problems(flow.shape, mask.shape)
    if problems:
        raise SpecError(problems)
    history = flow.transpose([metadata.axis_order.index(axis) for axis in "TXYZC"]).astype(np.float32)
    order = [axis for axis in metadata.axis_order if axis in "XYZ"]
    solid = mask.transpose([order.index(axis) for axis in "XYZ"]) != 0
    if not np.isfinite(history[:, ~solid]).all():
        raise SpecError([problem("non_finite", "flow", "Fluid cell values must be finite.")])
    conversions = np.asarray(metadata.unit_conversions(), dtype=np.float32)
    history = history * conversions[:, 0] + conversions[:, 1]
    history[:, solid] = 0
    return history, solid, conversions


def prepare_field_case(flow: np.ndarray, mask: np.ndarray, metadata: FlowMetadata,
                       options: dict[str, Any], physics: dict[str, float]):
    """TXYZC 도시 격자와 건물 마스크를 CZYX 학습 입력으로 변환"""
    # 축과 단위 표준화
    history, solid, conversions = _canonical(flow, mask, metadata)
    missing = [name for name in CHANNELS[:2] if name not in metadata.channels]
    unsupported = [name for name in metadata.channels if name not in CHANNELS]
    if missing or unsupported:
        raise ValueError(f"Supported training model channels are {list(CHANNELS)}: missing={missing}, unsupported={unsupported}.")

    # 생략한 풍향과 풍속만 추정
    physics = {"rho": 1.225, "mu": 1.81e-5, "zref": 10, "z0": .1, "displacement": 0,
               **physics, **options.get("physics", {})}
    ground = float(options.get("ground_z", metadata.grid.origin[2]))
    if "wind_speed_m_s" not in options or "wind_direction_deg" not in options:
        wind = infer_conditions(history[-1], solid, metadata, physics, ground)
        options = {**wind, **options}
    speed = float(options["wind_speed_m_s"])
    theta = np.radians(float(options["wind_direction_deg"]))
    if not np.isfinite(speed) or speed <= 0 or not np.isfinite(theta):
        raise ValueError("Wind direction must be finite and wind speed must be positive.")

    # 건물과 벽 경계의 속도 구속
    fluid = (~solid).transpose(2, 1, 0)
    boundary = np.where(fluid, 1, 0).astype(np.uint8)
    adjacent = np.zeros_like(fluid)
    for axis in range(3):
        low, high = [slice(None)] * 3, [slice(None)] * 3
        low[axis], high[axis] = slice(None, -1), slice(1, None)
        adjacent[tuple(low)] |= fluid[tuple(high)]
        adjacent[tuple(high)] |= fluid[tuple(low)]
    boundary[~fluid & adjacent] = 3
    z = metadata.grid.origin[2] + (np.arange(fluid.shape[0]) + .5) * metadata.grid.spacing[2]
    boundary[z <= ground] = 2
    bc_mask = np.zeros((4, *fluid.shape), dtype=bool)
    bc_mask[:3, boundary >= 2] = True
    for world_axis, axis_name in enumerate("xyz"):
        array_axis = 2 - world_axis
        for side, kind in enumerate(metadata.boundary_conditions[axis_name]):
            if kind == "wall":
                face = [slice(None)] * 3
                face[array_axis] = 0 if side == 0 else -1
                bc_mask[(slice(0, 3), *face)] = True

    # 물리 조건과 좌표 구성
    conditions = np.asarray([
        physics["rho"], physics["mu"], *metadata.grid.extent, speed,
        np.sin(theta), np.cos(theta), physics["zref"], physics["z0"], physics["displacement"],
    ], dtype=np.float32)
    if min(conditions[[0, 1, 2, 3, 4, 5, 9]]) <= 0 or conditions[8] <= conditions[10]:
        raise ValueError("Atmospheric density, viscosity, domain size or logarithmic wind reference is invalid.")
    case = {
        "boundary_type": boundary, "bc_values": np.zeros((4, *fluid.shape), dtype=np.float32),
        "bc_mask": bc_mask, "roughness": np.full((1, *fluid.shape), physics["z0"], dtype=np.float32),
        "conditions": conditions, "fluid_mask": fluid[None], "valid_mask": fluid[None],
        "origin": np.asarray(metadata.grid.origin, dtype=np.float64),
        "spacing": np.asarray(metadata.grid.spacing, dtype=np.float64),
        "metadata": {"ground_z": ground, "wind_direction_deg": float(options["wind_direction_deg"]),
                     "wind_direction_convention": "counterclockwise_from_positive_x_to_direction",
                     "wind_speed_m_s": speed},
    }
    return case, solid, conversions


def _field_request(flow: np.ndarray, mask: np.ndarray, document: str | bytes | dict,
                   model_version_root: str | Path | None = None):
    raw = json.loads(document) if isinstance(document, (str, bytes)) else dict(document)
    options = raw.pop("inference", {})
    if not isinstance(options, dict) or not isinstance(options.get("physics", {}), dict):
        raise ValueError("metadata.inference and physics must be objects.")
    metadata = FlowMetadata.parse(raw)
    checkpoint = checkpoints.checkpoint_path(model_version_root)
    with checkpoints.version_lock(checkpoint.parent):
        selection = {"checkpoint_signature": list(checkpoints.checkpoint_signature(checkpoint))}
        if (options.get("tiled") is True
                and checkpoints.read_preprocessing(checkpoint)["model_config"].get("pressure_refinement", False)):
            raise ValueError("Pressure refinement models do not support tiled jobs. Use global mode.")
    case, solid, conversions = prepare_field_case(flow, mask, metadata, options, {})
    request = {"metadata": metadata.model_dump(mode="json", by_alias=True, exclude_none=True),
               "solid": solid, "conversions": conversions, "mask": np.asarray(mask, dtype=np.uint8),
               "selection": selection}
    return case, checkpoint, request


def preprocess_field(flow: np.ndarray, mask: np.ndarray, document: str | bytes | dict,
                     model_version_root: str | Path | None = None) -> dict:
    case, checkpoint, request = _field_request(flow, mask, document, model_version_root)
    with checkpoints.version_lock(checkpoint.parent):
        prepared = prepare_case(case, checkpoint)
        _verify_selection(prepared, request["selection"], checkpoint)
    prepared["context"]["field"] = request
    return prepared
