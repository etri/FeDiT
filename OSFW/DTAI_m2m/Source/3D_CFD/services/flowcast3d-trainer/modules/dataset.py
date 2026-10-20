from __future__ import annotations

from collections import OrderedDict
import json
import operator
from pathlib import Path
from typing import Any

import numpy as np

try:
    from torch.utils.data import Dataset
except ImportError:
    class Dataset:
        """PyTorch 없는 NumPy 전처리용 기본 클래스"""


_REQUIRED_KEYS = {
    "boundary_type", "bc_values", "bc_mask", "roughness", "conditions",
    "fluid_mask", "valid_mask", "origin", "spacing", "metadata",
}
_TRANSFORM = "neutral_abl_residual_v1"


def _check_array(
    arrays: dict[str, np.ndarray], key: str, shape: tuple[int, ...], dtype: Any
) -> np.ndarray:
    value = arrays[key]
    if value.shape != shape or value.dtype != np.dtype(dtype):
        raise ValueError(f"{key}: expected shape {shape}, dtype {np.dtype(dtype)}; "
                         f"got {value.shape}, {value.dtype}")
    return value


def load_case(path: Path, require_target: bool = True) -> dict[str, Any]:
    """물리 단위 CZYX NPZ를 검증하며 require_target=False이면 정답은 읽지 않음"""
    # NPZ 항목 읽기
    path = Path(path)
    with np.load(path, allow_pickle=False) as archive:
        missing = _REQUIRED_KEYS.difference(archive.files)
        if require_target and "target" not in archive.files:
            missing.add("target")
        if missing:
            raise ValueError(f"{path.name}: missing NPZ keys {sorted(missing)}")
        case = {key: archive[key] for key in archive.files}

    # 배열 규격 검사
    boundary = case["boundary_type"]
    if boundary.ndim != 3 or not all(boundary.shape):
        raise ValueError("boundary_type must have nonempty shape [Z,Y,X]")
    shape = boundary.shape
    _check_array(case, "boundary_type", shape, np.uint8)
    if np.any(boundary > 6):
        raise ValueError("boundary_type codes must be in [0, 6]")
    bc = _check_array(case, "bc_values", (4, *shape), np.float32)
    bc_mask = _check_array(case, "bc_mask", (4, *shape), np.bool_)
    roughness = _check_array(case, "roughness", (1, *shape), np.float32)
    fluid = _check_array(case, "fluid_mask", (1, *shape), np.bool_)
    valid = _check_array(case, "valid_mask", (1, *shape), np.bool_)
    conditions = _check_array(case, "conditions", (11,), np.float32)
    origin = _check_array(case, "origin", (3,), np.float64)
    spacing = _check_array(case, "spacing", (3,), np.float64)

    # 물리 조건과 유효 영역 검사
    for name, value in (("conditions", conditions), ("origin", origin),
                        ("spacing", spacing), ("roughness", roughness)):
        if not np.isfinite(value).all():
            raise ValueError(f"{name} contains nonfinite values")
    if np.any(spacing <= 0) or np.any(roughness < 0):
        raise ValueError("spacing must be positive and roughness nonnegative")
    rho, mu, lx, ly, lz, speed, sine, cosine, zref, z0, displacement = conditions
    if min(rho, mu, lx, ly, lz, speed, z0) <= 0 or zref <= displacement:
        raise ValueError("conditions contain invalid physical parameters")
    if not np.isclose(sine * sine + cosine * cosine, 1, atol=1e-5):
        raise ValueError("wind direction sine/cosine must form a unit vector")
    extent = spacing * np.asarray(shape[::-1])
    if not np.allclose(conditions[2:5], extent, rtol=1e-5, atol=1e-5):
        raise ValueError("conditions Lx/Ly/Lz must match spacing and grid shape")
    if not np.isfinite(bc[bc_mask]).all():
        raise ValueError("prescribed boundary values contain nonfinite values")
    mask = fluid & valid
    if not mask.any():
        raise ValueError("case has no valid fluid cells")
    if "target" in case:
        target = _check_array(case, "target", (4, *shape), np.float32)
        if not np.isfinite(target[:, mask[0]]).all():
            raise ValueError("target contains nonfinite values in valid fluid cells")

    # 메타데이터와 지면 기준 확인
    metadata = case["metadata"]
    if metadata.shape != () or metadata.dtype.kind != "U":
        raise ValueError("metadata must be a Unicode JSON scalar")
    try:
        parsed = json.loads(str(metadata.item()))
    except (ValueError, TypeError) as error:
        raise ValueError("metadata must contain valid JSON") from error
    if not isinstance(parsed, dict):
        raise ValueError("metadata JSON must be an object")
    ground = parsed.get("ground_z", float(origin[2]))
    if not isinstance(ground, (float, int)) or not np.isfinite(ground):
        raise ValueError("metadata ground_z must be finite")
    case["metadata"] = parsed
    return case


def _safe_case_path(data_dir: Path, filename: str) -> Path:
    if not isinstance(filename, str) or not filename or "\\" in filename:
        raise ValueError("case file must be an NPZ basename")
    if Path(filename).name != filename or Path(filename).suffix != ".npz":
        raise ValueError("case file must be an NPZ basename")
    root = data_dir.resolve()
    path = (root / filename).resolve()
    if path.parent != root:
        raise ValueError("case file resolves outside the dataset directory")
    return path


def _validate_manifest(data_dir: Path, manifest: dict) -> dict:
    if manifest.get("schema_version") != 1:
        raise ValueError("unsupported manifest schema_version")
    shape = manifest.get("grid_shape_zyx")
    if (not isinstance(shape, list) or len(shape) != 3
            or any(type(value) is not int or value <= 0 for value in shape)):
        raise ValueError("manifest grid_shape_zyx must contain three positive integers")
    entries = manifest.get("cases")
    if not isinstance(entries, list) or not entries:
        raise ValueError("manifest must contain cases")
    seen = set()
    for entry in entries:
        if not isinstance(entry, dict):
            raise ValueError("manifest case must be an object")
        filename = entry.get("file")
        path = _safe_case_path(data_dir, filename)
        if filename in seen:
            raise ValueError(f"duplicate manifest case {filename}")
        seen.add(filename)
        if entry.get("split") not in {"train", "val", "test"}:
            raise ValueError(f"{filename}: unsupported split")
        if entry.get("status") != "complete":
            raise ValueError(f"{filename}: case has not completed generation")
        if not path.is_file():
            raise FileNotFoundError(path)
    return manifest


def validate_manifest(path: Path) -> dict:
    path = Path(path)
    if path.is_dir():
        path = path / "manifest.json"
    with path.open(encoding="utf-8") as stream:
        manifest = json.load(stream)
    if not isinstance(manifest, dict):
        raise ValueError("manifest must be an object")
    return _validate_manifest(path.parent, manifest)


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


def fit_normalization(data_dir: Path, manifest: dict) -> dict:
    """학습 분할의 유효 유체 셀만 정규화 통계에 반영"""
    data_dir = Path(data_dir)
    _validate_manifest(data_dir, manifest)
    entries = [entry for entry in manifest["cases"] if entry["split"] == "train"]
    if not entries:
        raise ValueError("normalization requires training cases")
    mean = np.zeros(4, dtype=np.float64)
    m2 = np.zeros(4, dtype=np.float64)
    count = 0
    conditions = []
    for entry in entries:
        case = load_case(_safe_case_path(data_dir, entry["file"]))
        if list(case["boundary_type"].shape) != manifest["grid_shape_zyx"]:
            raise ValueError(f"{entry['file']}: grid shape differs from manifest")
        mask = (case["fluid_mask"] & case["valid_mask"])[0]
        values = _dimensionless(case["target"], case)[:, mask].astype(np.float64)
        local_count = values.shape[1]
        local_mean = values.mean(axis=1)
        local_m2 = np.square(values - local_mean[:, None]).sum(axis=1)
        delta = local_mean - mean
        new_count = count + local_count
        mean += delta * local_count / new_count
        m2 += local_m2 + delta * delta * count * local_count / new_count
        count = new_count
        conditions.append(case["conditions"].astype(np.float64))
    std = np.sqrt(np.maximum(m2 / count, 0))
    std[std < 1e-8] = 1
    condition_array = np.stack(conditions)
    condition_std = condition_array.std(axis=0)
    condition_std[condition_std < 1e-8] = 1
    return {
        "schema_version": 1,
        "transform": _TRANSFORM,
        "target_mean": mean.tolist(),
        "target_std": std.tolist(),
        "condition_mean": condition_array.mean(axis=0).tolist(),
        "condition_std": condition_std.tolist(),
        "roughness_scale": 1.0,
        "valid_training_cells": count,
    }


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
    # 경계 채널 정규화
    mean, std, condition_mean, condition_std = _normalization_arrays(normalization)
    shape = case["boundary_type"].shape
    one_hot = np.eye(7, dtype=np.float32)[case["boundary_type"]].transpose(3, 0, 1, 2)
    bc = _dimensionless(case["bc_values"], case)
    bc = (bc - mean[:, None, None, None]) / std[:, None, None, None]
    bc = np.where(case["bc_mask"], bc, 0).astype(np.float32)

    # 모델 입력 구성
    mask = case["fluid_mask"] & case["valid_mask"]
    encoded = {
        "spatial": np.concatenate((one_hot, bc, case["bc_mask"].astype(np.float32),
                                   case["roughness"] / normalization.get("roughness_scale", 1.0)), axis=0),
        "conditions": ((case["conditions"] - condition_mean) / condition_std).astype(np.float32),
        "mask": mask,
    }

    # 학습 정답 정규화
    if "target" in case:
        target = (_dimensionless(case["target"], case) - mean[:, None, None, None]) / std[:, None, None, None]
        encoded["target"] = np.where(mask, target, 0).astype(np.float32)
    if encoded["spatial"].shape != (16, *shape):
        raise ValueError("encoded spatial input must have 16 channels")
    return encoded


def decode_prediction(prediction: np.ndarray, case: dict[str, Any], normalization: dict) -> np.ndarray:
    """정규화 출력을 속도 m/s와 게이지 압력 Pa로 복원"""
    # 모델 출력 검사
    mean, std, _, _ = _normalization_arrays(normalization)
    prediction = np.asarray(prediction, dtype=np.float32)
    expected_shape = (4, *case["boundary_type"].shape)
    if prediction.shape != expected_shape or not np.isfinite(prediction).all():
        raise ValueError(f"prediction must be finite with shape {expected_shape}")

    # ABL 배경과 물리 단위 복원
    physical = prediction * std[:, None, None, None] + mean[:, None, None, None]
    speed = float(case["conditions"][5])
    physical[:3] = physical[:3] * speed + background_velocity(case)
    physical[3] *= float(case["conditions"][0]) * speed * speed
    physical[:, ~case["fluid_mask"][0]] = 0
    return physical.astype(np.float32)


class FlowDataset(Dataset):
    def __init__(self, data_dir: Path, manifest: dict, split: str,
                 normalization: dict, require_target: bool = True, cache_size: int = 8):
        self.data_dir = Path(data_dir)
        if split not in {"train", "val", "test"}:
            raise ValueError("split must be train, val or test")
        if isinstance(cache_size, bool) or not isinstance(cache_size, int) or cache_size < 0:
            raise ValueError("cache_size must be a nonnegative integer")
        _validate_manifest(self.data_dir, manifest)
        _normalization_arrays(normalization)
        self.entries = [entry for entry in manifest["cases"] if entry["split"] == split]
        if not self.entries:
            raise ValueError(f"manifest has no {split} cases")
        self.files = [entry["file"] for entry in self.entries]
        self.grid_shape = tuple(manifest["grid_shape_zyx"])
        self.normalization = normalization
        self.require_target = require_target

        # 원본과 정규화 캐시의 공통 사례 수 제한
        self.cache_size = cache_size
        self._case_cache: dict[int, dict[str, Any]] = {}
        self._encoded_cache: dict[int, dict[str, np.ndarray]] = {}
        self._cache_order: OrderedDict[int, None] = OrderedDict()

    def __len__(self) -> int:
        return len(self.entries)

    def _touch_cache(self, index: int) -> None:
        """최근 사용 순서를 갱신하고 초과 사례의 두 캐시를 함께 제거"""
        self._cache_order[index] = None
        self._cache_order.move_to_end(index)
        while len(self._cache_order) > self.cache_size:
            expired, _ = self._cache_order.popitem(last=False)
            self._case_cache.pop(expired, None)
            self._encoded_cache.pop(expired, None)

    def case(self, index: int) -> dict[str, Any]:
        """사례를 읽기 전용 배열로 조회하고 최근 사례만 캐시"""
        index = operator.index(index)
        if index < 0:
            index += len(self)
        if index < 0 or index >= len(self):
            raise IndexError("dataset index out of range")
        if index in self._case_cache:
            self._touch_cache(index)
            return self._case_cache[index]
        case = load_case(_safe_case_path(self.data_dir, self.files[index]), self.require_target)
        if case["boundary_type"].shape != self.grid_shape:
            raise ValueError(f"{self.files[index]}: grid shape differs from manifest")
        for value in case.values():
            if isinstance(value, np.ndarray):
                value.setflags(write=False)
        if self.cache_size:
            self._case_cache[index] = case
            self._touch_cache(index)
        return case

    def encoded_case(self, index: int) -> dict[str, np.ndarray]:
        """정규화 결과를 조회하고 최근 사례만 원본과 함께 캐시"""
        index = operator.index(index)
        if index < 0:
            index += len(self)
        if index < 0 or index >= len(self):
            raise IndexError("dataset index out of range")
        if index in self._encoded_cache:
            self._touch_cache(index)
            return self._encoded_cache[index]
        values = encode_case(self.case(index), self.normalization)
        encoded = {key: np.ascontiguousarray(value) for key, value in values.items()}
        if self.cache_size:
            self._encoded_cache[index] = encoded
            self._touch_cache(index)
        return encoded

    def __getitem__(self, index: int) -> dict[str, Any]:
        import torch

        values = self.encoded_case(index)
        item = {key: torch.from_numpy(value) for key, value in values.items()}
        item["index"] = index
        item["case_file"] = self.files[index]
        return item
