"""예측 NPZ의 제한된 읽기와 물리 배열 계약 검증"""

from __future__ import annotations

import io
import json
import math
import os
import re
import stat
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any

import numpy as np

from modules.domain.schemas.prediction import check_shape

MAX_ARRAY_BYTES = 64 * 1024**2
MAX_EXPANDED_BYTES = 128 * 1024**2
MAX_HEADER_BYTES = 16384
MAX_METADATA_BYTES = 1024**2
MAX_VOXELS = 1048576
REQUIRED = frozenset(
    {
        "boundary_type",
        "bc_values",
        "bc_mask",
        "roughness",
        "conditions",
        "fluid_mask",
        "valid_mask",
        "origin",
        "spacing",
        "metadata",
    }
)


def prediction_size_limit() -> int:
    try:
        maximum = int(os.environ.get("FLOWCAST_MAX_PREDICTION_BYTES", str(128 * 1024 * 1024)))
    except ValueError:
        raise ValueError("FLOWCAST_MAX_PREDICTION_BYTES must be an integer.") from None
    if not 0 < maximum <= 512 * 1024 * 1024:
        raise ValueError("NPZ prediction size limit must be greater than 0 and at most 512 MiB.")
    return maximum


def load_prediction(path: Path | io.BytesIO) -> dict[str, Any]:
    """SI 단위의 ZYX 격자와 유효 마스크를 읽음"""
    with np.load(path, allow_pickle=False) as archive:
        required = {"prediction", "origin", "spacing", "fluid_mask", "valid_mask"}
        if not required.issubset(archive.files):
            raise ValueError("Prediction NPZ is missing required arrays.")
        result = {key: np.array(archive[key], copy=True) for key in required}
        if "metadata" in archive:
            item = archive["metadata"]
            if item.shape != () or item.dtype.kind != "U":
                raise ValueError("Prediction metadata must be a string scalar.")
            result["metadata"] = json.loads(str(item.item()))
        else:
            result["metadata"] = {}
    values = result["prediction"]
    if values.ndim != 4 or values.shape[0] != 4 or values.dtype.kind != "f":
        raise ValueError("Prediction array must have floating-point shape [4,Z,Y,X].")
    shape = values.shape[1:]
    if min(shape) < 1 or np.prod(shape) > 16_777_216:
        raise ValueError("Visualization grid size is outside the allowed range.")
    for name in ("origin", "spacing"):
        array = result[name]
        if array.shape != (3,) or array.dtype.kind != "f" or not np.isfinite(array).all():
            raise ValueError(f"Invalid {name}: expected finite XYZ floating-point coordinates.")
    if np.any(result["spacing"] <= 0):
        raise ValueError("Grid spacing must be positive.")
    for name in ("fluid_mask", "valid_mask"):
        if result[name].shape != (1, *shape) or result[name].dtype != np.bool_:
            raise ValueError(f"Invalid {name}: expected boolean shape [1,Z,Y,X].")
    result["mask"] = result["fluid_mask"][0] & result["valid_mask"][0]
    if not result["mask"].any() or not np.isfinite(values[:, result["mask"]]).all():
        raise ValueError("No valid flow cells are available for visualization.")
    if not isinstance(result["metadata"], dict):
        raise ValueError("Prediction metadata must be an object.")
    if result["metadata"].get("axis_order", "ZYX") != "ZYX":
        raise ValueError("Prediction array axis order must be ZYX.")
    if result["metadata"].get("units", ["m/s", "m/s", "m/s", "Pa"]) != ["m/s", "m/s", "m/s", "Pa"]:
        raise ValueError("Prediction arrays must use SI units.")
    return result


def build_grid(case: dict[str, Any], pv: Any) -> Any:
    """ZYX 셀 값을 XYZ 물리 격자에 배치"""
    nz, ny, nx = case["prediction"].shape[1:]
    grid = pv.ImageData(dimensions=(nx + 1, ny + 1, nz + 1), origin=case["origin"], spacing=case["spacing"])
    grid.cell_data["valid"] = case["mask"].ravel(order="C").astype(np.uint8)
    grid.cell_data["speed"] = np.linalg.norm(case["prediction"][:3].astype(np.float64), axis=0).ravel(
        order="C"
    )
    grid.cell_data["pressure"] = case["prediction"][3].ravel(order="C")
    grid.cell_data["velocity"] = np.moveaxis(case["prediction"][:3], 0, -1).reshape(-1, 3)
    return grid.threshold(0.5, scalars="valid", preference="cell")


def read_npz_arrays(data: bytes) -> dict[str, np.ndarray]:
    """압축 항목과 NPY 헤더를 먼저 검사한 뒤 작은 배열만 해제"""
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            members = archive.infolist()
            if not 0 < len(members) <= 32 or sum(item.file_size for item in members) > MAX_EXPANDED_BYTES:
                raise ValueError("NPZ archive exceeds the entry or expanded size limit.")
            names = set()
            for item in members:
                path = PurePosixPath(item.filename)
                if (
                    path.name != item.filename
                    or "\\" in item.filename
                    or "\x00" in item.filename
                    or path.suffix != ".npy"
                    or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,63}\.npy", item.filename)
                    or item.filename in names
                    or item.flag_bits & 1
                    or stat.S_ISLNK(item.external_attr >> 16)
                    or item.is_dir()
                    or item.compress_type not in {zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED}
                    or not 0 < item.file_size <= MAX_ARRAY_BYTES
                    or item.file_size > max(item.compress_size, 1) * 10000
                ):
                    raise ValueError("NPZ archive contains an unsafe or oversized entry.")
                names.add(item.filename)
                with archive.open(item) as stream:
                    prefix = stream.read(8)
                    if (
                        len(prefix) != 8
                        or prefix[:6] != b"\x93NUMPY"
                        or tuple(prefix[6:]) not in {(1, 0), (2, 0), (3, 0)}
                    ):
                        raise ValueError("NPY format version is invalid.")
                    length_bytes = stream.read(2 if prefix[6] == 1 else 4)
                    if len(length_bytes) != (2 if prefix[6] == 1 else 4):
                        raise ValueError("NPY header length is incomplete.")
                    length = int.from_bytes(length_bytes, "little")
                    if not 0 < length <= MAX_HEADER_BYTES:
                        raise ValueError("NPY header size exceeds 16384 bytes.")
                    header = stream.read(length)
                    if len(header) != length:
                        raise ValueError("NPY header is incomplete.")
                    bounded_header = io.BytesIO(prefix + length_bytes + header)
                    version = np.lib.format.read_magic(bounded_header)
                    shape, _, dtype = np.lib.format._read_array_header(
                        bounded_header,
                        version,
                        max_header_size=MAX_HEADER_BYTES,
                    )
                    size = math.prod(shape) * dtype.itemsize
                    if dtype.hasobject or dtype.fields or dtype.subdtype or dtype.kind not in "biufU":
                        raise ValueError("NPZ arrays must contain real numeric values or Unicode metadata.")
                    if size > MAX_ARRAY_BYTES or stream.tell() + size != item.file_size:
                        raise ValueError("NPY header shape does not match the bounded entry size.")
                    if dtype.kind == "U" and (
                        path.stem != "metadata" or shape != () or size > MAX_METADATA_BYTES
                    ):
                        raise ValueError("NPZ metadata must be a bounded Unicode scalar.")
            with np.load(io.BytesIO(data), allow_pickle=False) as loaded:
                arrays = {name: loaded[name] for name in loaded.files}
    except (OSError, EOFError, zipfile.BadZipFile, NotImplementedError, UnicodeError) as error:
        raise ValueError("NPZ archive could not be read safely.") from error
    for key, value in arrays.items():
        if value.dtype.kind in "iuf" and not np.isfinite(value).all():
            raise ValueError(f"{key} contains nonfinite values.")
    return arrays


def canonical_case(arrays: dict[str, np.ndarray]) -> dict:
    """모델의 물리 단위 CZYX 입력 계약과 같은 형상 및 조건 검증"""
    if not REQUIRED <= arrays.keys() or arrays.keys() - REQUIRED - {"target"}:
        raise ValueError("Canonical NPZ keys are missing or unsupported.")
    for key, value in arrays.items():
        if value.dtype.kind in "iuf" and not np.isfinite(value).all():
            raise ValueError(f"{key} contains nonfinite values.")
    boundary = arrays["boundary_type"]
    shape = boundary.shape
    if boundary.ndim != 3 or min(shape) < 16 or math.prod(shape) > MAX_VOXELS:
        raise ValueError("Canonical grid requires at least 16 cells per axis and at most 1048576 voxels.")
    expected = {
        "boundary_type": (shape, np.uint8),
        "bc_values": ((4, *shape), np.float32),
        "bc_mask": ((4, *shape), np.bool_),
        "roughness": ((1, *shape), np.float32),
        "fluid_mask": ((1, *shape), np.bool_),
        "valid_mask": ((1, *shape), np.bool_),
        "conditions": ((11,), np.float32),
        "origin": ((3,), np.float64),
        "spacing": ((3,), np.float64),
    }
    if "target" in arrays:
        expected["target"] = ((4, *shape), np.float32)
    for key, (required_shape, dtype) in expected.items():
        if arrays[key].shape != required_shape or arrays[key].dtype != np.dtype(dtype):
            raise ValueError(f"{key} must have shape {required_shape} and dtype {np.dtype(dtype)}.")
    if np.any(boundary > 6) or np.any(arrays["roughness"] < 0) or np.any(arrays["spacing"] <= 0):
        raise ValueError("Boundary codes, roughness, or grid spacing are invalid.")
    conditions = arrays["conditions"]
    rho, mu, lx, ly, lz, speed, sine, cosine, zref, z0, displacement = conditions
    if min(rho, mu, lx, ly, lz, speed, z0) <= 0 or zref <= displacement:
        raise ValueError("Canonical physical conditions are invalid.")
    if not np.isclose(sine * sine + cosine * cosine, 1, atol=1e-5):
        raise ValueError("Wind direction sine and cosine must form a unit vector.")
    extent = arrays["spacing"] * np.asarray(shape[::-1])
    if not np.allclose(conditions[2:5], extent, rtol=1e-5, atol=1e-5):
        raise ValueError("Physical domain size must match the grid extent.")
    if not (arrays["fluid_mask"] & arrays["valid_mask"]).any():
        raise ValueError("Canonical input has no valid fluid cells.")
    raw = arrays["metadata"]
    if raw.shape != () or raw.dtype.kind != "U" or raw.nbytes > MAX_METADATA_BYTES:
        raise ValueError("metadata must be a bounded Unicode JSON scalar.")
    try:
        metadata = json.loads(str(raw.item()))
        json.dumps(metadata, allow_nan=False)
    except (ValueError, TypeError) as error:
        raise ValueError("metadata must contain valid JSON.") from error
    if not isinstance(metadata, dict):
        raise ValueError("metadata JSON must be an object.")
    if metadata.get("axis_order", "CZYX") != "CZYX" or metadata.get("coordinate_order", "XYZ") != "XYZ":
        raise ValueError("Canonical metadata must use CZYX arrays and XYZ coordinates.")
    if "units" in metadata and metadata["units"] != {"U": "m/s", "p": "Pa"}:
        raise ValueError("Canonical metadata units must be U:m/s and p:Pa.")
    ground = metadata.get("ground_z", float(arrays["origin"][2]))
    if isinstance(ground, bool) or not isinstance(ground, (int, float)) or not math.isfinite(ground):
        raise ValueError("metadata ground_z must be finite.")
    return metadata


def prediction_arrays(payload):
    """모델 NPZ를 제한된 크기로 읽고 공통 결과에 필요한 배열 검증"""
    arrays = read_npz_arrays(payload)
    required = {"prediction", "origin", "spacing", "fluid_mask", "valid_mask", "metadata"}
    if set(arrays) != required:
        raise ValueError("Prediction NPZ has missing or unsupported arrays.")
    values = arrays["prediction"]
    if values.dtype != np.float32 or values.ndim != 4 or values.shape[0] != 4:
        raise ValueError("Prediction must be float32 with shape [4,Z,Y,X].")
    shape = values.shape[1:]
    check_shape(shape)
    for key in ("origin", "spacing"):
        if arrays[key].shape != (3,) or arrays[key].dtype != np.float64:
            raise ValueError(f"{key} must be float64 XYZ coordinates.")
    if np.any(arrays["spacing"] <= 0):
        raise ValueError("spacing must be positive.")
    for key in ("fluid_mask", "valid_mask"):
        if arrays[key].shape != (1, *shape) or arrays[key].dtype != np.bool_:
            raise ValueError(f"{key} must be a boolean array with shape [1,Z,Y,X].")
    if not (arrays["fluid_mask"] & arrays["valid_mask"]).any():
        raise ValueError("Prediction has no valid fluid cells.")
    raw = arrays["metadata"]
    if raw.shape != () or raw.dtype.kind != "U":
        raise ValueError("Prediction metadata must be a Unicode scalar.")
    metadata = json.loads(raw.item())
    if (
        not isinstance(metadata, dict)
        or metadata.get("axis_order") != "ZYX"
        or metadata.get("units") != ["m/s", "m/s", "m/s", "Pa"]
    ):
        raise ValueError("Prediction metadata must describe ZYX arrays in SI units.")
    return arrays
