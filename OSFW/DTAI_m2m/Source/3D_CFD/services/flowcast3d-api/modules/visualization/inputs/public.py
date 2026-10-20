from __future__ import annotations

import json
import math
import os
import re
import shutil
import stat
import tempfile
import zipfile
from pathlib import Path, PurePosixPath

import numpy as np

from modules.domain.grids.initialization import create_grid, make_case, wind_conditions
from modules.domain.grids.voxelize import METHODS
from modules.domain.schemas.geometry import PredictionInputParameters
from modules.infrastructure.formats import mesh as meshio
from modules.infrastructure.formats.prediction import MAX_HEADER_BYTES, canonical_case
from modules.visualization.geometry import citymesh

FILE_SUFFIXES = {".obj", ".stl", ".npz", ".vtk", ".vtp", ".vtu", ".vti", ".vtr", ".vts"}
OPTIONS = {
    "grid_shape",
    "domain_min",
    "domain_max",
    "unit_scale",
    "up_axis",
    "voxelization",
    "mask_key",
    "solid_value",
    "axis_order",
    "origin",
    "spacing",
    "geometry_kind",
}
CHUNK = 131072


def _paths(params):
    """요청 임시 디렉터리의 입력과 출력 경로 확인"""
    if not isinstance(params, dict) or set(params) - {
        "input_path",
        "output_path",
        "input_kind",
        "wind",
        "options",
    }:
        raise ValueError("Public prediction preparation parameters are invalid.")
    root = Path(
        os.environ.get("FLOWCAST_PUBLIC_TEMP_DIR", str(Path(tempfile.gettempdir()) / "flowcast-public"))
    )
    if not root.is_absolute() or ".." in root.parts:
        raise ValueError("FLOWCAST_PUBLIC_TEMP_DIR must be an absolute path.")
    paths = []
    for field in ("input_path", "output_path"):
        value = params.get(field)
        if not isinstance(value, str) or "\x00" in value:
            raise ValueError(f"{field} must be an absolute file path.")
        path = Path(value)
        if not path.is_absolute() or ".." in path.parts:
            raise ValueError(f"{field} must remain inside its request directory.")
        if any(parent.is_symlink() for parent in (path, *path.parents)):
            raise ValueError("Public prediction paths cannot contain symbolic links.")
        paths.append(path)
    source, output = paths
    try:
        relative = source.relative_to(root)
    except ValueError as error:
        raise ValueError("Input file is outside the public temporary directory.") from error
    if len(relative.parts) != 2 or not re.fullmatch(r"request-[A-Za-z0-9_-]+", relative.parts[0]):
        raise ValueError("Input file must belong to one request directory.")
    kind = params.get("input_kind")
    if kind == "json":
        valid_name = source.name == "request.json"
    elif kind == "file":
        valid_name = (
            source.suffix.lower() in FILE_SUFFIXES and source.name == f"source{source.suffix.lower()}"
        )
    else:
        raise ValueError("input_kind must be json or file.")
    if not valid_name or output.parent != source.parent or output.name != "input.npz":
        raise ValueError("Preparation filenames are invalid for this request.")
    if output.exists():
        raise ValueError("Output file already exists.")
    information = source.stat(follow_symlinks=False)
    maximum = int(os.environ.get("FLOWCAST_MAX_UPLOAD_BYTES", 8 * 1024**3))
    if kind == "json":
        maximum = int(os.environ.get("FLOWCAST_MAX_JSON_BYTES", 128 * 1024**2))
    if not stat.S_ISREG(information.st_mode) or not 0 < information.st_size <= maximum:
        raise ValueError(f"Input must be a nonempty regular file of at most {maximum} bytes.")
    return source, output


def _shape(shape):
    """모델 격자의 셀 수와 병목 토큰 예산 확인"""
    if len(shape) != 3 or any(isinstance(n, bool) or not isinstance(n, (int, np.integer)) for n in shape):
        raise ValueError("grid_shape must contain three integers in XYZ order.")
    shape = tuple(int(n) for n in shape)
    if min(shape) < 16 or max(shape) > 4096 or math.prod(shape) > 1048576:
        raise ValueError("Grid requires at least 16 cells per axis and at most 1048576 cells.")
    if math.prod((n + 15) // 16 for n in shape) > 512:
        raise ValueError("Grid bottleneck exceeds 512 tokens. Reduce grid_shape.")
    return shape


def _options(wind, raw):
    """공개 풍향과 형상 옵션을 기존 물리 조건에 결합"""
    if not isinstance(wind, dict) or set(wind) != {"speed", "direction"}:
        raise ValueError("wind must contain speed and direction.")
    if any(isinstance(value, bool) or not isinstance(value, (int, float)) for value in wind.values()):
        raise ValueError("Wind speed and direction must be numbers.")
    if not isinstance(raw, dict) or set(raw) - OPTIONS:
        raise ValueError("options contains unsupported fields.")
    geometry_kind = raw.get("geometry_kind")
    if geometry_kind not in {None, "surface", "solid_volume", "mask"}:
        raise ValueError("geometry_kind must be surface, solid_volume, or mask.")
    result = PredictionInputParameters.model_validate(
        {
            **{key: value for key, value in raw.items() if key != "geometry_kind" and value is not None},
            **wind,
        }
    )
    _shape(result.grid_shape)
    return result


def _vector(value, name, positive=False):
    """격자 좌표의 길이와 유한 실수 여부 확인"""
    array = np.asarray(value)
    if array.shape != (3,) or array.dtype.kind not in "iuf" or not np.isfinite(array).all():
        raise ValueError(f"{name} must contain three finite numbers in XYZ order.")
    if positive and np.any(array <= 0):
        raise ValueError(f"{name} must be positive on every axis.")
    return array.astype(np.float64)


def _mask(raw, order, solid_value):
    """이진 마스크의 축 순서와 값을 메모리 묶음별로 확인"""
    if raw.ndim == 4 and raw.shape[0] == 1:
        raw = raw[0]
    if raw.ndim != 3 or not all(raw.shape) or raw.dtype.kind not in "biuf":
        raise ValueError("Selected mask must be a nonempty three-dimensional binary array.")
    for block in np.nditer(
        raw, flags=["external_loop", "buffered"], op_flags=["readonly"], buffersize=CHUNK, order="K"
    ):
        if not ((block == 0) | (block == 1)).all():
            raise ValueError("Selected mask must contain only 0, 1, or boolean values.")
    return raw.transpose(tuple(order.index(axis) for axis in "XYZ")), solid_value


def _mask_grid(raw, options, origin, spacing, *, order="ZYX", solid_value=1):
    """물리 영역을 보존하며 건물 마스크를 최근접 셀에 배치"""
    if options.unit_scale != 1 or options.up_axis != "z":
        raise ValueError("Mask coordinates must already use metres and axis_order.")
    raw, solid_value = _mask(raw, order, solid_value)
    low = _vector(origin, "origin")
    interval = _vector(spacing, "spacing", positive=True)
    high = low + np.asarray(raw.shape) * interval
    shape = _shape(options.grid_shape if "grid_shape" in options.model_fields_set else raw.shape)
    grid = create_grid(
        options.domain_min if options.domain_min is not None else low,
        options.domain_max if options.domain_max is not None else high,
        shape,
    )
    if np.any(np.asarray(grid.origin) > low) or np.any(np.asarray(grid.origin) + grid.extent < high):
        raise ValueError("Physical domain must contain the complete mask grid.")
    indices, inside = [], []
    for axis in range(3):
        centers = grid.origin[axis] + (np.arange(grid.shape[axis]) + 0.5) * grid.spacing[axis]
        index = np.floor((centers - low[axis]) / interval[axis]).astype(np.int64)
        inside.append((index >= 0) & (index < raw.shape[axis]))
        indices.append(np.clip(index, 0, raw.shape[axis] - 1))
    solid = raw[np.ix_(*indices)] == solid_value
    solid &= inside[0][:, None, None] & inside[1][None, :, None] & inside[2][None, None, :]
    return solid, grid, float(low[2])


def _extract_array(archive, member, directory, expected_shape=None):
    """선택한 NPY 항목만 제한된 묶음으로 풀어 디스크 배열로 연결"""
    limit = int(os.environ.get("FLOWCAST_MAX_EXPANDED_NPZ_BYTES", 32 * 1024**3))
    if not 0 < member.file_size <= limit or member.flag_bits & 1:
        raise ValueError("Selected NPZ array exceeds the expanded size limit or is encrypted.")
    if member.compress_type not in {zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED}:
        raise ValueError("NPZ arrays require stored or deflate compression.")
    with archive.open(member) as stream:
        version = np.lib.format.read_magic(stream)
        if version not in {(1, 0), (2, 0), (3, 0)}:
            raise ValueError("NPY format version is invalid.")
        shape, _, dtype = np.lib.format._read_array_header(stream, version, max_header_size=MAX_HEADER_BYTES)
        if expected_shape is not None and shape != expected_shape:
            raise ValueError(f"{member.filename} must have shape {expected_shape}.")
        if dtype.hasobject or dtype.fields or dtype.subdtype or dtype.kind not in "biuf":
            raise ValueError("Selected NPZ arrays must contain real numeric values.")
        if stream.tell() + math.prod(shape) * dtype.itemsize != member.file_size:
            raise ValueError("NPY header shape does not match its entry size.")
    descriptor, name = tempfile.mkstemp(prefix=".array-", suffix=".npy", dir=directory)
    path = Path(name)
    try:
        with os.fdopen(descriptor, "wb") as output, archive.open(member) as source:
            shutil.copyfileobj(source, output, length=1024 * 1024)
        return path, np.load(path, mmap_mode="r", allow_pickle=False, max_header_size=MAX_HEADER_BYTES)
    except BaseException:
        path.unlink(missing_ok=True)
        raise


def _npz_grid(source, options):
    """저장된 풍장 대신 선택한 형상과 좌표 배열만 NPZ에서 추출"""
    temporary = []
    arrays = {}
    try:
        with zipfile.ZipFile(source) as archive:
            members = archive.infolist()
            if not 0 < len(members) <= 128:
                raise ValueError("NPZ archive must contain between 1 and 128 entries.")
            by_name = {}
            for member in members:
                name = member.filename
                if (
                    PurePosixPath(name).name != name
                    or "\\" in name
                    or "\x00" in name
                    or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,63}\.npy", name)
                    or name in by_name
                    or member.is_dir()
                    or stat.S_ISLNK(member.external_attr >> 16)
                ):
                    raise ValueError("NPZ archive contains an unsafe or duplicate entry.")
                by_name[name] = member
            key = options.mask_key or "building_mask"
            fallback = (
                options.mask_key is None and f"{key}.npy" not in by_name and "fluid_mask.npy" in by_name
            )
            if fallback:
                key = "fluid_mask"
            if f"{key}.npy" not in by_name:
                raise ValueError(f"NPZ geometry mask {key} was not found.")
            wanted = [key]
            for field in ("origin", "spacing"):
                if getattr(options, field) is None:
                    if f"{field}.npy" not in by_name:
                        raise ValueError(f"NPZ geometry requires {field} in the archive or options.")
                    wanted.append(field)
            expanded_limit = int(os.environ.get("FLOWCAST_MAX_EXPANDED_NPZ_BYTES", 32 * 1024**3))
            if sum(by_name[f"{name}.npy"].file_size for name in wanted) > expanded_limit:
                raise ValueError("Selected NPZ arrays exceed the combined expanded size limit.")
            for name in wanted:
                path, arrays[name] = _extract_array(
                    archive,
                    by_name[f"{name}.npy"],
                    source.parent,
                    (3,) if name in {"origin", "spacing"} else None,
                )
                temporary.append(path)
            return _mask_grid(
                arrays[key],
                options,
                options.origin if options.origin is not None else arrays["origin"],
                options.spacing if options.spacing is not None else arrays["spacing"],
                order=options.axis_order or "ZYX",
                solid_value=(0 if fallback else 1) if options.solid_value is None else options.solid_value,
            )
    except (zipfile.BadZipFile, EOFError, UnicodeError) as error:
        raise ValueError("NPZ geometry could not be read safely.") from error
    finally:
        arrays.clear()
        for path in temporary:
            path.unlink(missing_ok=True)


def _transform(options):
    """메시 좌표를 Z 위쪽의 미터 단위로 변환"""
    matrix = np.eye(3, dtype=np.float64)
    if options.up_axis == "y":
        matrix[:] = [[1, 0, 0], [0, 0, -1], [0, 1, 0]]
    return matrix * options.unit_scale


def _mesh_domain(low, high, options):
    """메시 전체를 포함하는 대기 계산 격자 생성"""
    if not np.isfinite(low).all() or not np.isfinite(high).all():
        raise ValueError("Mesh bounds must be finite.")
    ground = float(low[2])
    if ground >= high[2]:
        raise ValueError("Mesh must have positive vertical extent.")
    if options.domain_min is None:
        height = high[2] - ground
        padding = max(2 * height, 5.0)
        top = ground + max(3 * height, options.zref + options.z0)
        dz = (top - ground) / (options.grid_shape[2] - 1)
        low_domain = np.asarray([low[0] - padding, low[1] - padding, ground - dz])
        high_domain = np.asarray([high[0] + padding, high[1] + padding, top])
    else:
        low_domain, high_domain = np.asarray(options.domain_min), np.asarray(options.domain_max)
        if np.any(low_domain > low) or np.any(high_domain < high):
            raise ValueError("Physical domain must contain the complete transformed mesh.")
    return create_grid(low_domain, high_domain, _shape(options.grid_shape)), ground


def _voxelize(chunks, grid, method):
    """삼각형 묶음을 셀 중심 좌표로 변환하여 복셀화"""
    origin, spacing = np.asarray(grid.origin), np.asarray(grid.spacing)
    return METHODS[method](((block - origin) / spacing - 0.5 for block in chunks), grid.shape).astype(bool)


def _resolved_mesh(chunks, grid, ground, method):
    """격자가 고체 형상을 실제로 구분하는지 확인"""
    solid = _voxelize(chunks, grid, method)
    heights = grid.origin[2] + (np.arange(grid.shape[2]) + 0.5) * grid.spacing[2]
    if not solid[:, :, heights > ground].any():
        raise ValueError("Grid does not resolve mesh geometry. Increase grid_shape or adjust domain bounds.")
    return solid, grid, ground


def _stream_mesh(source, options):
    """디스크 OBJ와 스트리밍 STL을 일정한 삼각형 묶음으로 처리"""
    if options.origin is not None or options.spacing is not None or options.mask_key is not None:
        raise ValueError("Mesh coordinates require unit_scale and domain bounds instead of mask options.")
    matrix = _transform(options)
    mesh = None
    try:
        if source.suffix.lower() == ".obj":
            mesh = _obj_mesh(source)

            def chunks():
                for first in range(0, len(mesh.faces), CHUNK):
                    block = mesh.vertices[mesh.faces[first : first + CHUNK]] @ matrix.T
                    if not np.isfinite(block).all():
                        raise ValueError("Mesh triangles contain nonfinite coordinates.")
                    yield block
        else:
            with source.open("rb") as stream:
                header = stream.read(84)
            binary = (
                len(header) == 84 and source.stat().st_size == 84 + int.from_bytes(header[80:], "little") * 50
            )
            if not binary:
                with source.open("rb") as stream:
                    while line := stream.readline(65537):
                        if len(line) > 65536:
                            raise ValueError("STL text lines must not exceed 65536 bytes.")

            def chunks():
                for block in meshio._read_stl(source, CHUNK):
                    block = block @ matrix.T
                    if not np.isfinite(block).all():
                        raise ValueError("Mesh triangles contain nonfinite coordinates.")
                    yield block

        low, high, count = np.full(3, np.inf), np.full(3, -np.inf), 0
        for block in chunks():
            count += len(block)
            low, high = np.minimum(low, block.min(axis=(0, 1))), np.maximum(high, block.max(axis=(0, 1)))
        if not count:
            raise ValueError("Mesh contains no triangles.")
        grid, ground = _mesh_domain(low, high, options)
        return _resolved_mesh(chunks(), grid, ground, options.voxelization)
    finally:
        if mesh is not None and mesh.workspace is not None:
            mesh.workspace.cleanup()


def _obj_mesh(source):
    """큰 OBJ의 정점과 면을 요청 디렉터리 안의 디스크 배열에 기록"""
    if not citymesh.disk_mesh(source):
        return citymesh.read_obj(source)
    workspace = tempfile.TemporaryDirectory(prefix=".mesh-", dir=source.parent)
    directory = Path(workspace.name)
    counts = np.zeros(2, dtype=np.int64)
    try:
        with (directory / "vertices").open("wb") as vertices, (directory / "faces").open("wb") as faces:
            for points, triangles in citymesh.obj_blocks(source):
                points.tofile(vertices)
                triangles.tofile(faces)
                counts += len(points), len(triangles)
        if not all(counts):
            raise ValueError("OBJ mesh contains no vertices or triangles.")
        mesh = citymesh.RawMesh(
            np.memmap(directory / "vertices", dtype=np.float64, mode="r", shape=(int(counts[0]), 3)),
            np.memmap(directory / "faces", dtype=np.int32, mode="r", shape=(int(counts[1]), 3)),
            workspace,
        )
        for first in range(0, len(mesh.faces), CHUNK):
            block = mesh.faces[first : first + CHUNK]
            if block.min() < 0 or block.max() >= len(mesh.vertices):
                raise ValueError("OBJ face refers to a vertex that does not exist.")
        return mesh
    except BaseException:
        workspace.cleanup()
        raise


def _vtk_header(source):
    """VTK의 외부 참조와 메모리 사용량을 읽기 전에 제한"""
    maximum = int(
        os.environ.get("FLOWCAST_PUBLIC_VTK_BYTES", os.environ.get("FLOWCAST_MAX_UPLOAD_BYTES", 8 * 1024**3))
    )
    if source.stat().st_size > maximum:
        raise MemoryError(f"VTK file exceeds the {maximum}-byte processing limit. Use OBJ, STL, or NPZ.")
    with source.open("rb") as stream:
        header = stream.read(4 * 1024**2).split(b"<AppendedData", 1)[0]
    if b"<!DOCTYPE" in header.upper() or b"<!ENTITY" in header.upper():
        raise ValueError("XML declarations are forbidden in VTK inputs.")
    if re.search(rb"\b(?:Source|file|FileName)\s*=", header, flags=re.IGNORECASE):
        raise ValueError("External VTK file references are not supported.")
    for match in re.finditer(rb'(?:WholeExtent|Extent)\s*=\s*"([0-9\s-]+)"', header):
        extent = [int(value) for value in match.group(1).split()]
        if len(extent) != 6 or any(extent[index + 1] < extent[index] for index in (0, 2, 4)):
            raise ValueError("VTK grid extent is invalid.")
        if math.prod(extent[index + 1] - extent[index] + 1 for index in (0, 2, 4)) > 4000000:
            raise MemoryError("VTK grid exceeds the 4000000-point processing limit.")
    for attribute, limit in ((b"NumberOfPoints", 4000000), (b"NumberOfCells", 2000000)):
        if sum(int(value) for value in re.findall(attribute + rb'\s*=\s*"([0-9]+)"', header)) > limit:
            raise MemoryError("VTK dataset exceeds the processing point or cell limit.")
    if any(int(value) > 64 for value in re.findall(rb'NumberOfComponents\s*=\s*"([0-9]+)"', header)):
        raise MemoryError("VTK field exceeds the 64-component processing limit.")


def _vtk_grid(source, options, raw_options):
    """VTK 표면과 명시적인 고체 마스크만 형상으로 처리"""
    import pyvista as pv

    _vtk_header(source)
    reader = pv.get_reader(source)
    key = options.mask_key or "building_mask"
    for association in ("point", "cell"):
        disable = getattr(reader, f"disable_all_{association}_arrays", None)
        if disable is not None:
            disable()
            names = getattr(reader, f"{association}_array_names", [])
            selected = (
                key
                if key in names
                else "fluid_mask"
                if options.mask_key is None and "fluid_mask" in names
                else None
            )
            if selected:
                getattr(reader, f"enable_{association}_array")(selected)
    mesh = reader.read()
    if isinstance(mesh, pv.MultiBlock) or not mesh.n_cells:
        raise ValueError("VTK input must contain one nonempty dataset.")
    if mesh.n_points > 4000000 or mesh.n_cells > 2000000:
        raise MemoryError("VTK dataset exceeds the processing point or cell limit.")
    if not np.isfinite(np.asarray(mesh.points)).all():
        raise ValueError("VTK points must contain finite coordinates.")
    association = next((name for name in ("cell", "point") if key in getattr(mesh, f"{name}_data")), None)
    fallback = association is None and options.mask_key is None
    if fallback:
        key = "fluid_mask"
        association = next((name for name in ("cell", "point") if key in getattr(mesh, f"{name}_data")), None)
    solid_value = options.solid_value if options.solid_value is not None else 0 if fallback else 1
    if association is not None:
        values = np.asarray(getattr(mesh, f"{association}_data")[key])
        if values.ndim != 1 or values.dtype.kind not in "biuf" or not ((values == 0) | (values == 1)).all():
            raise ValueError("VTK geometry mask must contain scalar binary values.")
        if isinstance(mesh, pv.ImageData):
            dimensions = np.asarray(mesh.dimensions) - (1 if association == "cell" else 0)
            if not np.allclose(mesh.direction_matrix, np.eye(3)):
                raise ValueError("VTK ImageData masks require an axis-aligned grid.")
            spacing = np.asarray(mesh.spacing)
            origin = np.asarray(mesh.origin) + np.asarray(mesh.extent[::2]) * spacing
            if association == "point":
                origin -= spacing / 2
            return _mask_grid(
                values.reshape(tuple(dimensions), order="F"),
                options,
                options.origin if options.origin is not None else origin,
                options.spacing if options.spacing is not None else spacing,
                order="XYZ",
                solid_value=solid_value,
            )
        selected = values == solid_value
        if association == "point":
            temporary = mesh.copy(deep=False)
            temporary.point_data["__public_solid"] = selected.astype(np.float32)
            mesh = temporary.point_data_to_cell_data()
            selected = np.asarray(mesh.cell_data["__public_solid"]) == 1
        mesh = mesh.extract_cells(selected)
        if not mesh.n_cells:
            raise ValueError("VTK geometry mask contains no solid cells.")
    elif raw_options.get("geometry_kind") == "mask":
        raise ValueError("VTK geometry_kind=mask requires an explicit binary geometry mask.")
    elif not isinstance(mesh, pv.PolyData) and raw_options.get("geometry_kind") != "solid_volume":
        raise ValueError("VTK volume requires a binary geometry mask or geometry_kind=solid_volume.")
    if options.mask_key is not None and association is None:
        raise ValueError(f"VTK geometry mask {options.mask_key} was not found.")
    surface = mesh.extract_surface(algorithm="dataset_surface").triangulate()
    faces = surface.faces.reshape(-1, 4)
    if not len(faces) or not (faces[:, 0] == 3).all():
        raise ValueError("VTK geometry contains no triangular surface.")
    matrix = _transform(options)

    def chunks():
        for first in range(0, len(faces), CHUNK):
            yield surface.points[faces[first : first + CHUNK, 1:]] @ matrix.T

    low, high = np.full(3, np.inf), np.full(3, -np.inf)
    for block in chunks():
        low, high = np.minimum(low, block.min(axis=(0, 1))), np.maximum(high, block.max(axis=(0, 1)))
    grid, ground = _mesh_domain(low, high, options)
    return _resolved_mesh(chunks(), grid, ground, options.voxelization)


def _public_case(solid_xyz, grid, ground, options, provenance):
    """빈 건물 마스크에도 기존 정상 유입 조건을 적용"""
    heights = grid.origin[2] + (np.arange(grid.shape[2]) + 0.5) * grid.spacing[2]
    if np.any(solid_xyz[:, :, heights > ground]):
        return make_case(solid_xyz, grid, ground, options, provenance)
    if not grid.origin[2] <= ground < grid.origin[2] + grid.extent[2]:
        raise ValueError("Ground must lie inside the physical domain.")
    shape = grid.shape[::-1]
    solid = np.broadcast_to((heights <= ground)[:, None, None], shape).copy()
    fluid = ~solid
    if not fluid.any():
        raise ValueError("Grid must contain valid fluid cells.")
    speed, theta = wind_conditions(options)
    boundary = np.where(fluid, 1, 2).astype(np.uint8)
    bc_values = np.zeros((4, *shape), dtype=np.float32)
    bc_mask = np.zeros_like(bc_values, dtype=bool)
    bc_mask[:3, solid] = True
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
        "roughness": np.full((1, *shape), options.z0, dtype=np.float32),
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
        "metadata": np.asarray(json.dumps(metadata, allow_nan=False)),
    }
    return case, metadata


def prepare_public_prediction(params: dict) -> dict:
    """독립 요청의 형상과 풍향을 모델 전용 NPZ로 준비

    Args:
        params: 요청 임시 경로와 입력 종류 및 파일의 wind와 options

    Returns:
        준비한 입력 파일명과 실제 격자 및 풍향 메타데이터
    """
    source, output = _paths(params)
    before = source.stat()
    raw_options = params.get("options", {})
    wind = params.get("wind")
    if params["input_kind"] == "json":
        try:
            document = json.loads(source.read_text(encoding="utf-8"))
        except (ValueError, UnicodeError, RecursionError) as error:
            raise ValueError("Prediction request must contain valid JSON.") from error
        if not isinstance(document, dict) or set(document) - {"building_mask", "grid", "wind", "options"}:
            raise ValueError("JSON prediction contains unsupported fields.")
        wind, raw_options = document.get("wind"), document.get("options", {})
        options = _options(wind, raw_options)
        coordinates = document.get("grid")
        if not isinstance(coordinates, dict) or set(coordinates) != {"origin", "spacing"}:
            raise ValueError("grid must contain origin and spacing in XYZ order.")
        try:
            raw = np.asarray(document.get("building_mask"), dtype=object)
        except ValueError as error:
            raise ValueError("building_mask must be a rectangular three-dimensional binary array.") from error
        if raw.ndim != 3:
            raise ValueError("building_mask must be a rectangular three-dimensional binary array.")
        if any(type(value) not in (bool, int, float) or value not in (0, 1) for value in raw.flat):
            raise ValueError("building_mask must contain only 0, 1, or boolean values.")
        raw = raw.astype(np.uint8)
        solid, grid, ground = _mask_grid(raw, options, coordinates["origin"], coordinates["spacing"])
        suffix = "json"
    else:
        options = _options(wind, raw_options)
        suffix = source.suffix.lower()[1:]
        if suffix == "npz":
            solid, grid, ground = _npz_grid(source, options)
        elif suffix in {"obj", "stl"}:
            if raw_options.get("geometry_kind") == "mask":
                raise ValueError("OBJ and STL inputs require surface geometry.")
            solid, grid, ground = _stream_mesh(source, options)
        else:
            solid, grid, ground = _vtk_grid(source, options, raw_options)

    # 기존 경계 조건을 적용하고 작은 메타데이터만 호출 프로세스로 반환
    provenance = {"source_format": suffix}
    case, input_metadata = _public_case(solid, grid, ground, options, provenance)
    canonical_case(case)
    actual = {
        "grid_shape": list(grid.shape),
        "origin": list(grid.origin),
        "spacing": list(grid.spacing),
        "domain_min": list(grid.origin),
        "domain_max": (np.asarray(grid.origin) + grid.extent).tolist(),
        "ground_z": ground,
        "wind": wind,
        "direction_convention": "meteorological_from_north_clockwise",
    }
    descriptor, name = tempfile.mkstemp(prefix=".prepared-", suffix=".npz", dir=output.parent)
    temporary = Path(name)
    try:
        with os.fdopen(descriptor, "wb") as stream:
            np.savez_compressed(stream, **case)
            stream.flush()
            os.fsync(stream.fileno())
        after = source.stat()
        if (before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns) != (
            after.st_ino,
            after.st_size,
            after.st_mtime_ns,
            after.st_ctime_ns,
        ):
            raise ValueError("Input file changed during prediction preparation.")
        _paths(params)
        os.link(temporary, output, follow_symlinks=False)
    finally:
        temporary.unlink(missing_ok=True)
    return {
        "input_file": output.name,
        "metadata": {
            **provenance,
            "parameters": actual,
            "input_metadata": input_metadata,
        },
    }
