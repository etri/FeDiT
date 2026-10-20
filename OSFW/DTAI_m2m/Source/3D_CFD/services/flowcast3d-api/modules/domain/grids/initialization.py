"""물리 조건과 건물 마스크의 모델 초기 입력 구성"""

import json
import math

import numpy as np

from modules.domain.grids.inflow import flow_direction
from modules.domain.schemas.flow import Grid
from modules.domain.schemas.geometry import PredictionInputParameters


def create_grid(low, high, shape) -> Grid:
    """물리 영역 크기를 보존하는 XYZ 셀 격자 구성"""
    low, high = np.asarray(low, dtype=np.float64), np.asarray(high, dtype=np.float64)
    if not np.isfinite(low).all() or not np.isfinite(high).all() or np.any(high <= low):
        raise ValueError("Physical domain bounds must be finite and increasing.")
    spacing = (high - low) / np.asarray(shape)
    if not np.isfinite(spacing).all() or np.any(spacing <= 0):
        raise ValueError("Physical grid spacing must be finite and positive.")
    return Grid(origin=tuple(low), spacing=tuple(spacing), shape=tuple(shape))


def wind_conditions(options: PredictionInputParameters) -> tuple[float, float]:
    """기존 API의 FROM 풍향을 모델의 수평 이동 방향으로 변환"""
    if options.speed is None or options.direction is None:
        raise ValueError("speed and direction are required for mesh and mask inputs.")
    dx, dy = flow_direction(options.direction)
    return float(options.speed), math.atan2(dy, dx) % (2 * math.pi)


def make_case(solid_xyz, grid, ground, options, provenance):
    """학습 자료와 같은 벽 경계 및 대기 로그 유입 조건 구성"""
    speed, theta = wind_conditions(options)
    if not grid.origin[2] <= ground < grid.origin[2] + grid.extent[2]:
        raise ValueError("ground_z must lie inside the physical domain.")
    solid = solid_xyz.transpose(2, 1, 0).copy()
    heights = grid.origin[2] + (np.arange(solid.shape[0]) + 0.5) * grid.spacing[2]
    ground_cells = np.broadcast_to((heights <= ground)[:, None, None], solid.shape)
    solid |= ground_cells
    fluid = ~solid
    if not fluid.any() or not (solid & ~ground_cells).any():
        raise ValueError("Grid must resolve both uploaded solid geometry and fluid cells.")
    adjacent = np.zeros_like(fluid)
    for axis in range(3):
        low, high = [slice(None)] * 3, [slice(None)] * 3
        low[axis], high[axis] = slice(None, -1), slice(1, None)
        adjacent[tuple(low)] |= fluid[tuple(high)]
        adjacent[tuple(high)] |= fluid[tuple(low)]
    boundary = np.where(fluid, 1, 0).astype(np.uint8)
    boundary[solid & adjacent] = 3
    boundary[ground_cells] = 2
    bc_values = np.zeros((4, *solid.shape), dtype=np.float32)
    bc_mask = np.zeros_like(bc_values, dtype=bool)
    bc_mask[:3, boundary >= 2] = True
    metadata = {
        "schema_version": 1,
        "axis_order": "CZYX",
        "coordinate_order": "XYZ",
        "units": {"U": "m/s", "p": "Pa"},
        "ground_z": ground,
        "wind_speed_m_s": speed,
        "wind_direction_deg": math.degrees(theta),
        "wind_direction_convention": "counterclockwise_from_positive_x_towards",
        "direction_xyz": [math.cos(theta), math.sin(theta), 0],
        "provenance": provenance,
    }
    case = {
        "boundary_type": boundary,
        "bc_values": bc_values,
        "bc_mask": bc_mask,
        "roughness": np.full((1, *solid.shape), options.z0, dtype=np.float32),
        "conditions": np.asarray(
            [
                options.rho,
                options.mu,
                *grid.extent,
                speed,
                math.sin(theta),
                math.cos(theta),
                options.zref,
                options.z0,
                options.displacement,
            ],
            dtype=np.float32,
        ),
        "fluid_mask": fluid[None],
        "valid_mask": fluid[None].copy(),
        "origin": np.asarray(grid.origin, dtype=np.float64),
        "spacing": np.asarray(grid.spacing, dtype=np.float64),
        "metadata": np.asarray(json.dumps(metadata, ensure_ascii=False, allow_nan=False)),
    }
    return case, metadata
