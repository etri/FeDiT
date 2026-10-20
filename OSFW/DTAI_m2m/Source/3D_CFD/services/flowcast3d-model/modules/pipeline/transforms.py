from __future__ import annotations

from typing import Any

import numpy as np

CHANNELS = ("velocity_x", "velocity_y", "velocity_z", "pressure")
_TRANSFORM = "neutral_abl_residual_v1"



def case_tile(case: dict, start: list[int], window: list[int]) -> tuple[dict, tuple[slice, ...]]:
    """정답을 제외한 CZYX 입력과 원점을 같은 영역으로 자름"""
    shape = case["boundary_type"].shape
    region = tuple(slice(low, min(size, low + width)) for low, size, width in zip(start, shape, window))
    tile = {key: value for key, value in case.items() if key != "target"}
    for key in ("boundary_type", "bc_values", "bc_mask", "roughness", "fluid_mask", "valid_mask"):
        tile[key] = case[key][region if key == "boundary_type" else (slice(None), *region)]
    tile["origin"] = case["origin"] + np.asarray(start[::-1]) * case["spacing"]
    return tile, region


def background_velocity(case: dict[str, Any]) -> np.ndarray:
    shape = case["boundary_type"].shape
    conditions = case["conditions"]
    speed, sine, cosine, zref, z0, displacement = conditions[5:]
    ground = case["metadata"].get("ground_z", float(case["origin"][2]))
    heights = case["origin"][2] + (np.arange(shape[0]) + 0.5) * case["spacing"][2]
    height = np.maximum(heights - ground - displacement, 0)
    profile = speed * np.log1p(height / z0) / np.log1p((zref - displacement) / z0)
    background = np.zeros((3, *shape), dtype=np.float32)
    background[0] = (profile * cosine)[:, None, None]
    background[1] = (profile * sine)[:, None, None]
    return background


def _dimensionless(field: np.ndarray, case: dict[str, Any]) -> np.ndarray:
    speed = float(case["conditions"][5])
    rho = float(case["conditions"][0])
    result = np.asarray(field, dtype=np.float32).copy()
    result[:3] = (result[:3] - background_velocity(case)) / speed
    result[3] /= rho * speed * speed
    return result


def _normalization_arrays(normalization: dict) -> tuple[np.ndarray, ...]:
    if normalization.get("schema_version") != 1 or normalization.get("transform") != _TRANSFORM:
        raise ValueError("unsupported normalization transform")
    values = tuple(np.asarray(normalization.get(key), dtype=np.float32)
                   for key in ("target_mean", "target_std", "condition_mean", "condition_std"))
    for value, size in zip(values, (4, 4, 11, 11)):
        if value.shape != (size,) or not np.isfinite(value).all():
            raise ValueError("normalization contains invalid statistics")
    if np.any(values[1] <= 0) or np.any(values[3] <= 0):
        raise ValueError("normalization standard deviations must be positive")
    scale = normalization.get("roughness_scale", 1.0)
    if not isinstance(scale, (float, int)) or not np.isfinite(scale) or scale <= 0:
        raise ValueError("roughness_scale must be positive")
    return values


def encode_case(case: dict[str, Any], normalization: dict) -> dict[str, np.ndarray]:
    """물리 필드를 16채널 CZYX 입력과 정규화 정답으로 변환"""
    mean, std, condition_mean, condition_std = _normalization_arrays(normalization)
    shape = case["boundary_type"].shape
    one_hot = np.eye(7, dtype=np.float32)[case["boundary_type"]].transpose(3, 0, 1, 2)
    bc = _dimensionless(case["bc_values"], case)
    bc = (bc - mean[:, None, None, None]) / std[:, None, None, None]
    bc = np.where(case["bc_mask"], bc, 0).astype(np.float32)
    mask = case["fluid_mask"] & case["valid_mask"]
    encoded = {
        "spatial": np.concatenate((one_hot, bc, case["bc_mask"].astype(np.float32),
                                   case["roughness"] / normalization.get("roughness_scale", 1.0)), axis=0),
        "conditions": ((case["conditions"] - condition_mean) / condition_std).astype(np.float32),
        "mask": mask,
    }
    if "target" in case:
        target = (_dimensionless(case["target"], case) - mean[:, None, None, None]) / std[:, None, None, None]
        encoded["target"] = np.where(mask, target, 0).astype(np.float32)
    if encoded["spatial"].shape != (16, *shape):
        raise ValueError("encoded spatial input must have 16 channels")
    return encoded


def decode_prediction(prediction: np.ndarray, case: dict[str, Any], normalization: dict) -> np.ndarray:
    """정규화 출력을 속도 m/s와 게이지 압력 Pa로 복원"""
    mean, std, _, _ = _normalization_arrays(normalization)
    prediction = np.asarray(prediction, dtype=np.float32)
    expected_shape = (4, *case["boundary_type"].shape)
    if prediction.shape != expected_shape or not np.isfinite(prediction).all():
        raise ValueError(f"prediction must be finite with shape {expected_shape}")
    physical = prediction * std[:, None, None, None] + mean[:, None, None, None]
    speed = float(case["conditions"][5])
    physical[:3] = physical[:3] * speed + background_velocity(case)
    physical[3] *= float(case["conditions"][0]) * speed * speed
    physical[:, ~case["fluid_mask"][0]] = 0
    return physical.astype(np.float32)


def restore_physical_prediction(prediction, case, normalization):
    """학습 정규화를 역변환한 뒤 지정한 경계값 복원"""
    physical = np.asarray(decode_prediction(prediction, case, normalization), dtype=np.float32).copy()
    mask = np.asarray(case["bc_mask"], dtype=bool)
    physical[mask] = np.asarray(case["bc_values"], dtype=np.float32)[mask]
    return physical
