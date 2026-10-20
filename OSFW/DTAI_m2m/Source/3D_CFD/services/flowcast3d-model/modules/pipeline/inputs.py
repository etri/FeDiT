from __future__ import annotations

import io
import json
import math
import re
import stat
import zipfile
from pathlib import PurePath
from typing import Any

import numpy as np


RUN_PATTERN = re.compile(r"\d{8}_\d{6}_[0-9a-f]{6}")
MAX_UPLOAD_BYTES = 128 * 1024**2
MAX_UPLOAD_EXPANDED_BYTES = 256 * 1024**2
MAX_UPLOAD_ENTRIES = 32
MAX_UPLOAD_GRID_CELLS = 1024**2
MAX_UPLOAD_HEADER_BYTES = 16 * 1024
UPLOAD_ARRAYS = {
    "boundary_type", "bc_values", "bc_mask", "roughness", "conditions",
    "fluid_mask", "valid_mask", "origin", "spacing", "metadata", "target",
}

_REQUIRED_KEYS = UPLOAD_ARRAYS - {"target"}


def _npz_name(name: str) -> None:
    """경로 구분자 없이 전달된 NPZ 파일명 검사"""
    if not isinstance(name, str) or not name or name in {".", ".."}:
        raise ValueError("File name is invalid.")
    if any(character in name for character in ("/", "\\", "\x00")):
        raise ValueError("File name must not include a path.")
    if PurePath(name).suffix.lower() != ".npz":
        raise ValueError("File name must use the .npz extension.")


def validate_request_names(run_id: str, input_file: str, output_file: str) -> None:
    """파일 경로 없이 요청 식별자와 NPZ 이름 검사"""
    if not isinstance(run_id, str) or not RUN_PATTERN.fullmatch(run_id):
        raise ValueError("Run-ID must use the YYYYMMDD_HHMMSS_hex6 format.")
    _npz_name(input_file)
    _npz_name(output_file)


def _upload_array_header(stream, entry):
    """배열을 할당하기 전에 제한된 NPY 헤더와 실제 길이 검사"""
    version = np.lib.format.read_magic(stream)
    if version not in {(1, 0), (2, 0)}:
        raise ValueError("Upload NPY version must be 1.0 or 2.0.")
    length_size = 2 if version == (1, 0) else 4
    prefix = stream.read(length_size)
    header_size = int.from_bytes(prefix, "little")
    if len(prefix) != length_size or not 0 < header_size <= MAX_UPLOAD_HEADER_BYTES:
        raise ValueError("Upload NPY header exceeds the size limit.")
    header = stream.read(header_size)
    if len(header) != header_size:
        raise ValueError("Upload NPY header is truncated.")
    reader = (np.lib.format.read_array_header_1_0 if version == (1, 0)
              else np.lib.format.read_array_header_2_0)
    shape, _, dtype = reader(io.BytesIO(prefix + header), max_header_size=MAX_UPLOAD_HEADER_BYTES)
    if (dtype.hasobject or dtype.fields is not None or dtype.subdtype is not None
            or dtype.kind not in "biufU" or len(shape) > 5):
        raise ValueError("Upload array dtype or dimensions are unsupported.")
    if any(not isinstance(size, int) or size < 0 for size in shape):
        raise ValueError("Upload array shape is invalid.")
    expected = math.prod(shape) * dtype.itemsize
    if expected > MAX_UPLOAD_EXPANDED_BYTES or entry.file_size != 8 + length_size + header_size + expected:
        raise ValueError("Upload array size does not match its bounded NPY header.")
    return shape, dtype


def _validate_upload_npz(payload):
    """공개 업로드의 압축 해제 크기와 모델 배열 헤더를 할당 전에 검증"""
    if not isinstance(payload, bytes) or not 0 < len(payload) <= MAX_UPLOAD_BYTES:
        raise ValueError("Upload PAYLOAD must contain NPZ bytes within the 128 MiB limit.")
    try:
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            entries = archive.infolist()
            if (not 0 < len(entries) <= MAX_UPLOAD_ENTRIES
                    or sum(entry.file_size for entry in entries) > MAX_UPLOAD_EXPANDED_BYTES):
                raise ValueError("Upload NPZ exceeds the entry count or expanded size limit.")
            headers = {}
            for entry in entries:
                name = entry.filename
                kind = stat.S_IFMT(entry.external_attr >> 16)
                if ("/" in name or "\\" in name or not name.endswith(".npy")
                        or name[:-4] not in UPLOAD_ARRAYS or name[:-4] in headers
                        or entry.flag_bits & 1 or kind not in {0, stat.S_IFREG}
                        or entry.compress_type not in {zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED}):
                    raise ValueError("Upload NPZ contains an unsafe or unsupported entry.")
                with archive.open(entry) as stream:
                    headers[name[:-4]] = _upload_array_header(stream, entry)

            # 주 격자와 각 모델 배열의 크기 및 자료형을 함께 확인
            if not _REQUIRED_KEYS <= headers.keys():
                raise ValueError("Upload NPZ is missing required model arrays.")
            shape, dtype = headers["boundary_type"]
            if (len(shape) != 3 or not all(shape) or math.prod(shape) > MAX_UPLOAD_GRID_CELLS
                    or dtype != np.dtype(np.uint8)):
                raise ValueError("Upload grid must contain at most 1048576 uint8 ZYX cells.")
            expected = {
                "bc_values": ((4, *shape), np.float32), "bc_mask": ((4, *shape), np.bool_),
                "roughness": ((1, *shape), np.float32), "fluid_mask": ((1, *shape), np.bool_),
                "valid_mask": ((1, *shape), np.bool_), "conditions": ((11,), np.float32),
                "origin": ((3,), np.float64), "spacing": ((3,), np.float64),
                "target": ((4, *shape), np.float32),
            }
            for name, (expected_shape, expected_dtype) in expected.items():
                if name in headers and headers[name] != (expected_shape, np.dtype(expected_dtype)):
                    raise ValueError(f"Upload array {name} has an invalid shape or dtype.")
            metadata_shape, metadata_dtype = headers["metadata"]
            if metadata_shape != () or metadata_dtype.kind != "U" or metadata_dtype.itemsize > 1024**2:
                raise ValueError("Upload metadata must be a bounded Unicode JSON scalar.")
    except (OSError, EOFError, RuntimeError, NotImplementedError, zipfile.BadZipFile, OverflowError) as error:
        raise ValueError("Upload PAYLOAD is not valid bounded NPZ data.") from error


def _check_array(
    arrays: dict[str, np.ndarray], key: str, shape: tuple[int, ...], dtype: Any
) -> np.ndarray:
    value = arrays[key]
    if value.shape != shape or value.dtype != np.dtype(dtype):
        raise ValueError(f"{key}: expected shape {shape}, dtype {np.dtype(dtype)}; "
                         f"got {value.shape}, {value.dtype}")
    return value


def read_case(payload: bytes, input_file: str) -> dict[str, Any]:
    """헤더 검증을 통과한 NPZ 바이트에서 추론 입력 배열만 복원"""
    # 압축과 배열 헤더를 배열 할당 전에 검사
    _npz_name(input_file)
    _validate_upload_npz(payload)

    # 원본 배열을 메모리에서 읽고 정답 배열은 제외
    try:
        with np.load(io.BytesIO(payload), allow_pickle=False) as archive:
            missing = _REQUIRED_KEYS.difference(archive.files)
            if missing:
                raise ValueError(f"{input_file}: missing NPZ keys {sorted(missing)}")
            case = {key: archive[key] for key in archive.files if key != "target"}
    except (OSError, EOFError, RuntimeError, NotImplementedError, zipfile.BadZipFile, OverflowError) as error:
        raise ValueError("Upload PAYLOAD is not valid NPZ data.") from error

    # 격자 배열과 물리 조건 검사
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
    # 메타데이터 JSON과 지면 높이 검사
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
