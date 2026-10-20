from __future__ import annotations

import contextlib
import hashlib
import json
import logging
import math
import os
from pathlib import Path
import re
import signal
import shutil
import subprocess
import tarfile
import tempfile
import time
from typing import BinaryIO
import zipfile

import numpy as np

from .utils import (
    atomic_json, atomic_npz, directory_lock, openfoam_environment,
    update_metrics, validate_generation_conditions,
)


LOGGER = logging.getLogger(__name__)
ZENODO_ZIP_MD5 = "310127f6fc500be67c185f0761413fdf"
KALASATAMA_OBJ_NAME = "Kalasatama_30M_8k_x50.obj"
KALASATAMA_OBJ_SIZE = 5405804500
PATCHES = ("xmin", "xmax", "ymin", "ymax", "ground", "top")
NORMALS = {
    "xmin": (-1, 0, 0), "xmax": (1, 0, 0),
    "ymin": (0, -1, 0), "ymax": (0, 1, 0),
}
SCHEMA_VERSION = 1
WIND_DIRECTION_CONVENTION = "counterclockwise_from_positive_x_towards"
MESH_QUALITY_POLICY = "finite_volume_all_topology_and_explicit_quality_v2"


class SourceNotReadyError(RuntimeError):
    """미완료 또는 손상된 원본 자료"""


def _json(path: Path) -> dict:
    with path.open(encoding="utf-8") as stream:
        return json.load(stream)


def _plain_values(value):
    """과거 무결성 식별자를 무시하고 실제 값만 복사

    Args:
        value: 과거 기록을 포함할 수 있는 JSON 값

    Returns:
        object: 기존 식별자를 제외한 실제 값
    """
    if isinstance(value, dict):
        ignored = {"sha", "sha256", "sha512", "fingerprint", "hash", "digest"}
        return {key: _plain_values(item) for key, item in value.items()
                if not ignored.intersection(str(key).lower().split("_"))}
    if isinstance(value, list):
        return [_plain_values(item) for item in value]
    return value


def _same_file_content(first: Path, second: Path) -> bool:
    """로그 두 파일의 실제 바이트를 직접 비교

    Args:
        first: 비교할 첫 파일
        second: 비교할 둘째 파일

    Returns:
        bool: 일반 파일의 크기와 전체 바이트가 같은지 여부
    """
    if (not first.is_file() or first.is_symlink() or not second.is_file()
            or second.is_symlink() or first.stat().st_size != second.stat().st_size):
        return False
    with first.open("rb") as left, second.open("rb") as right:
        while True:
            block = left.read(1024 * 1024)
            if block != right.read(1024 * 1024):
                return False
            if not block:
                return True


def _stat(path: Path) -> tuple[int, int]:
    stat = path.stat()
    return stat.st_size, stat.st_mtime_ns


def _source_metadata(path: Path) -> tuple[dict, int | None]:
    for directory in path.parents:
        case_file = directory / "case.json"
        if not case_file.is_file():
            continue
        document = _json(case_file)
        mesh = document.get("mesh", {})
        matching = [name for name in mesh.get("files", [])
                    if (directory / name).resolve() == path.resolve()]
        if not matching:
            continue
        result = {
            "up_axis": mesh.get("up_axis"),
            "unit_scale": mesh.get("to_world", {}).get("scale"),
            "rotate_z_deg": mesh.get("to_world", {}).get("rotate_z_deg", 0),
            "translate": mesh.get("to_world", {}).get("translate", [0, 0, 0]),
            "metadata_source": str(case_file),
            "attribution": document.get("attribution", {}),
        }
        expected = None
        cache_file = directory / "mesh_cache" / "index.json"
        if cache_file.is_file():
            for source in _json(cache_file).get("source", []):
                if source.get("file") in matching:
                    expected = int(source["size"])
        return result, expected
    return {}, None


def _discover_source(config: dict) -> Path:
    """명시한 경로나 Kalasatama 원본만 선택하여 예제 형상 대체 방지"""
    root = Path(config["paths"]["source"]).resolve()
    requested = config["generation"].get("source_path")
    if requested:
        path = Path(requested)
        return (root / path).resolve() if not path.is_absolute() else path.resolve()
    if not root.exists():
        raise SourceNotReadyError(f"Source path does not exist yet: {root}.")
    candidates = sorted(root.rglob("*Kalasatama*.zip"))
    candidates += sorted(root.rglob("*Kalasatama*.obj"))
    candidates = [path for path in candidates if path.is_file()
                  and not any(part in {"mesh_cache", "samples"} for part in path.parts)
                  and not path.name.endswith((".part", ".tmp", ".download"))]
    if not candidates:
        raise SourceNotReadyError(f"Kalasatama source ZIP or OBJ is not available yet: {root}.")
    archives = [path for path in candidates if path.suffix.lower() == ".zip"]
    objects = [path for path in candidates if path.suffix.lower() == ".obj"]
    if len(archives) > 1 or (not archives and len(objects) > 1):
        raise ValueError("Multiple source candidates were found. Set generation.source_path explicitly.")
    return (archives or objects)[0]


def _zip_metadata(root: Path, source: Path, member: str) -> dict:
    candidates = set(root.rglob("case.json"))
    candidates.update(directory / "case.json" for directory in source.parents
                      if (directory / "case.json").is_file())
    matches = []
    for case_file in sorted(candidates):
        for name in _json(case_file).get("mesh", {}).get("files", []):
            if Path(name).name == Path(member).name:
                metadata, _ = _source_metadata((case_file.parent / name).resolve())
                if metadata:
                    matches.append(metadata)
    if len(matches) > 1:
        raise ValueError("Multiple axis metadata candidates were found for the source ZIP.")
    return matches[0] if matches else {}


def _verify_source(path: Path, expected_size: int | None = None,
                   expected_md5: str | None = None) -> dict:
    """다운로드가 끝난 ZIP 또는 OBJ인지 크기와 내용으로 검사"""
    if not path.is_file() or path.suffix.lower() not in {".obj", ".zip"}:
        raise SourceNotReadyError(f"A complete OBJ or ZIP file is required: {path}.")
    if expected_size is None and path.name == KALASATAMA_OBJ_NAME:
        expected_size = KALASATAMA_OBJ_SIZE
    before = _stat(path)
    if before[0] == 0 or (expected_size and before[0] != expected_size):
        raise SourceNotReadyError(f"Source file size is incomplete: {before[0]} / {expected_size} bytes.")
    member = None
    if path.suffix.lower() == ".zip":
        try:
            with zipfile.ZipFile(path) as archive:
                objects = [entry for entry in archive.infolist()
                           if entry.filename.lower().endswith(".obj") and not entry.is_dir()]
                if len(objects) != 1:
                    raise ValueError("ZIP must contain exactly one source OBJ.")
                if archive.testzip() is not None:
                    raise SourceNotReadyError("ZIP CRC validation failed.")
                member = objects[0].filename
        except (zipfile.BadZipFile, EOFError, OSError) as error:
            raise SourceNotReadyError(f"ZIP is not complete yet: {path}.") from error
        checksum = hashlib.md5(usedforsecurity=False)
        with path.open("rb") as stream:
            for chunk in iter(lambda: stream.read(8 * 1024 * 1024), b""):
                checksum.update(chunk)
        expected_md5 = expected_md5 or (
            ZENODO_ZIP_MD5 if "Kalasatama" in path.name else None)
        if expected_md5 and checksum.hexdigest() != expected_md5:
            raise SourceNotReadyError("ZIP MD5 does not match the source checksum.")
    else:
        with path.open("rb") as stream:
            head = stream.read(8192).decode("utf-8", errors="strict")
            stream.seek(max(0, before[0] - 8192))
            tail = stream.read().decode("utf-8", errors="strict")
        if not any(line.startswith("v ") for line in head.splitlines()):
            raise SourceNotReadyError("OBJ vertex header is not available yet.")
        last = next((line.strip() for line in reversed(tail.splitlines()) if line.strip()), "")
        fields = last.split()
        if not fields or (fields[0] in {"v", "vn"} and len(fields) < 4) or (
                fields[0] == "vt" and len(fields) < 3) or (
                fields[0] == "f" and len(fields) < 4):
            raise SourceNotReadyError("Final OBJ record is truncated.")
        if fields[0] in {"v", "vn", "vt"}:
            try:
                [float(value) for value in fields[1:]]
            except ValueError as error:
                raise SourceNotReadyError("Final OBJ coordinate is incomplete.") from error
    if before != _stat(path):
        raise SourceNotReadyError("Source file changed during validation.")
    return {"source_path": str(path), "size_bytes": before[0],
            "mtime_ns": before[1], "zip_member": member}


def _wait_for_source(config: dict, run_dir: Path) -> tuple[Path, dict, dict]:
    options = config["generation"]
    deadline = time.monotonic() + float(options.get("source_wait_timeout_s", 86400))
    interval = max(0.01, float(options.get("poll_interval_s", 15)))
    previous = None
    stable = 0
    while True:
        try:
            path = _discover_source(config)
            metadata, expected_size = _source_metadata(path)
            signature = (str(path), _stat(path))
            stable = stable + 1 if signature == previous else 1
            previous = signature
            if stable < int(options.get("stable_checks", options.get("source_stable_polls", 3))):
                raise SourceNotReadyError(f"Source file stability check is pending: {stable}/3.")
            info = _verify_source(path, expected_size, options.get("source_md5"))
            if info["zip_member"]:
                metadata = _zip_metadata(Path(config["paths"]["source"]), path, info["zip_member"])
            return path, metadata, info
        except (SourceNotReadyError, FileNotFoundError, json.JSONDecodeError) as error:
            checking_stability = "Source file stability check is pending" in str(error)
            if (not options.get("wait_for_source", True) and not checking_stability) or time.monotonic() >= deadline:
                raise SourceNotReadyError(str(error)) from error
            LOGGER.info("원본 준비 대기: %s", error)
            update_metrics(run_dir, "generation", {"status": "waiting_for_source", "message": str(error)})
            time.sleep(min(interval, max(0, deadline - time.monotonic())))


def _transform_options(config: dict, metadata: dict) -> dict:
    options = config["generation"]
    specified = options.get("geometry", {})
    if options.get("geometry_confirmed", False):
        specified = {key: options[key] for key in ("unit_scale", "up_axis") if key in options} | specified
    result = dict(metadata)
    result.update({key: value for key, value in specified.items() if value is not None})
    if not metadata and not options.get("geometry_confirmed", False):
        raise ValueError("Axis and unit confirmation is required. Set generation.geometry and use --confirm-geometry.")
    if result.get("up_axis") not in {"y", "z"} or not result.get("unit_scale", 0) > 0:
        raise ValueError("geometry.up_axis must be y/z and geometry.unit_scale must be positive.")
    result.setdefault("rotate_z_deg", 0)
    result.setdefault("translate", [0, 0, 0])
    if len(result["translate"]) != 3 or not np.isfinite(result["translate"]).all():
        raise ValueError("geometry.translate must contain finite XYZ coordinates.")
    result["crs"] = specified.get("crs")
    return result


@contextlib.contextmanager
def _obj_stream(path: Path, member: str | None):
    if member:
        with zipfile.ZipFile(path) as archive, archive.open(member) as stream:
            yield stream
    else:
        with path.open("rb") as stream:
            yield stream


def _convert_obj(stream: BinaryIO, destination: Path, transform: dict) -> dict:
    """정점과 면을 보존하며 미터 단위 Z 상향 OBJ로 변환"""
    scale = float(transform["unit_scale"])
    angle = math.radians(float(transform.get("rotate_z_deg", 0)))
    cosine, sine = math.cos(angle), math.sin(angle)
    tx, ty, tz = transform.get("translate", [0, 0, 0])
    minimum, maximum = [math.inf] * 3, [-math.inf] * 3
    n_vertices = n_faces = 0
    expected = None
    maximum_index = 0
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(".obj.tmp")
    try:
        with temporary.open("w", encoding="ascii") as output:
            output.write("g urbanWall\n")
            for raw in stream:
                if raw.startswith(b"#") and expected is None:
                    match = re.search(rb"(\d+) vertices,\s*(\d+) faces", raw)
                    if match:
                        expected = tuple(map(int, match.groups()))
                if raw.startswith(b"v "):
                    values = raw.split()
                    if len(values) < 4:
                        raise SourceNotReadyError("OBJ vertex record is truncated.")
                    x, y, z = map(float, values[1:4])
                    if transform["up_axis"] == "y":
                        x, y, z = x, -z, y
                    x, y, z = scale * x, scale * y, scale * z
                    point = (cosine * x - sine * y + tx, sine * x + cosine * y + ty, z + tz)
                    if not all(map(math.isfinite, point)):
                        raise ValueError("Source vertices contain non-finite coordinates.")
                    for axis in range(3):
                        minimum[axis] = min(minimum[axis], point[axis])
                        maximum[axis] = max(maximum[axis], point[axis])
                    output.write("v {:.17g} {:.17g} {:.17g}\n".format(*point))
                    n_vertices += 1
                    if n_vertices % 1000000 == 0:
                        LOGGER.info("원본 정점 좌표 변환: %d개", n_vertices)
                elif raw.startswith(b"f "):
                    indices = [int(token.split(b"/")[0]) for token in raw.split()[1:]]
                    if len(indices) < 3 or 0 in indices:
                        raise SourceNotReadyError("OBJ face record is incomplete.")
                    indices = [index if index > 0 else n_vertices + index + 1 for index in indices]
                    if min(indices) < 1 or len(set(indices)) < 3:
                        raise ValueError("Source face vertex index is invalid.")
                    maximum_index = max(maximum_index, max(indices))
                    output.write("f " + " ".join(map(str, indices)) + "\n")
                    n_faces += 1
                    if n_faces % 1000000 == 0:
                        LOGGER.info("원본 면 연결 보존: %d개", n_faces)
        if n_vertices < 4 or n_faces < 4 or maximum_index > n_vertices:
            raise SourceNotReadyError("OBJ vertices or faces are missing.")
        if expected and (n_vertices, n_faces) != expected:
            raise SourceNotReadyError(f"OBJ vertex/face count is incomplete: {(n_vertices, n_faces)} / {expected}.")
        if not all(high > low for low, high in zip(minimum, maximum)):
            raise ValueError("Source geometry has invalid three-dimensional bounds.")
        os.replace(temporary, destination)
    finally:
        temporary.unlink(missing_ok=True)
    return {"bounds_min_xyz": minimum, "bounds_max_xyz": maximum,
            "vertices": n_vertices, "faces": n_faces}


def _header(name: str, kind: str = "dictionary") -> str:
    return ("FoamFile\n{\n    version 2.0;\n    format ascii;\n"
            f"    class {kind};\n    object {name};\n}}\n\n")


def _write(path: Path, body: str, kind: str = "dictionary") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(_header(path.name, kind) + body, encoding="utf-8")


def _vector(values) -> str:
    return "(" + " ".join(f"{float(value):.12g}" for value in values) + ")"


def _domain(geometry: dict, options: dict) -> dict:
    low = np.asarray(geometry["bounds_min_xyz"], dtype=float)
    high = np.asarray(geometry["bounds_max_xyz"], dtype=float)
    height = float(high[2] - low[2])
    buffer = height * float(options.get("buffer_height_multiplier", 15))
    domain_low = low - [buffer, buffer, 0]
    domain_high = high + [buffer, buffer, height * (float(options.get("top_height_multiplier", 5)) - 1)]
    model_high = high.copy()
    model_high[2] = low[2] + height * float(options.get("model_height_multiplier", 1.25))
    shape_xyz = np.asarray(options["grid_shape_zyx"][::-1], dtype=int)
    if (shape_xyz <= 0).any() or (domain_high <= domain_low).any():
        raise ValueError("Grid dimensions and computational domain must be positive.")
    return {"low": domain_low.tolist(), "high": domain_high.tolist(),
            "model_low": low.tolist(), "model_high": model_high.tolist(),
            "spacing": ((model_high - low) / shape_xyz).tolist(), "height": height}


def _write_mesh_case(case: Path, geometry: dict, config: dict) -> dict:
    options = config["generation"]
    snap_smoothing = options.get("snap_smoothing_iterations", 3)
    if isinstance(snap_smoothing, bool) or not isinstance(snap_smoothing, int) or snap_smoothing < 0:
        raise ValueError("snap_smoothing_iterations must be a nonnegative integer.")
    internal_smoothing = options.get("snap_internal_smoothing_iterations", 3)
    if (isinstance(internal_smoothing, bool) or not isinstance(internal_smoothing, int)
            or internal_smoothing < 0):
        raise ValueError("snap_internal_smoothing_iterations must be a nonnegative integer.")
    merge_faces = options.get("merge_patch_faces", False)
    if not isinstance(merge_faces, bool):
        raise ValueError("merge_patch_faces must be a boolean.")
    domain = _domain(geometry, options)
    x0, y0, z0 = domain["low"]
    x1, y1, z1 = domain["high"]
    vertices = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
                (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    faces = ((0, 4, 7, 3), (1, 2, 6, 5), (0, 1, 5, 4), (3, 7, 6, 2), (0, 3, 2, 1), (4, 5, 6, 7))
    cells = options.get("base_cells_xyz", [96, 96, 48])
    if len(cells) != 3 or any(int(value) < 2 for value in cells):
        raise ValueError("base_cells_xyz requires at least 2 cells on each axis.")
    boundary = "\n".join(f"{name} {{ type {'wall' if name == 'ground' else 'patch'}; "
                         f"faces ({_vector(face)}); }}" for name, face in zip(PATCHES, faces))
    _write(case / "system/blockMeshDict", "convertToMeters 1;\nvertices\n(\n" +
           "\n".join(_vector(vertex) for vertex in vertices) + "\n);\nblocks\n(\n"
           f"hex (0 1 2 3 4 5 6 7) {_vector(cells)} simpleGrading (1 1 1)\n);\n"
           f"edges ();\nboundary\n(\n{boundary}\n);\nmergePatchPairs ();\n")
    refinement = options.get("surface_refinement", [2, 3])
    location = np.asarray(domain["low"]) + (np.asarray(domain["high"]) - domain["low"]) * [0.02, 0.02, 0.8]
    quality = """maxNonOrtho 65;
    maxBoundarySkewness 4;
    maxInternalSkewness 4;
    maxConcave 80;
    minVol 1e-13;
    minTetQuality 1e-15;
    minArea -1;
    minTwist 0.02;
    minDeterminant 0.001;
    minFaceWeight 0.02;
    minVolRatio 0.01;
    minTriangleTwist -1;
    nSmoothScale 4;
    errorReduction 0.75;"""
    body = f"""castellatedMesh true;
snap true;
addLayers false;
singleRegionName true;
mergePatchFaces {str(merge_faces).lower()};
geometry
{{
    urban.obj {{ type triSurfaceMesh; name urbanWall; }}
}}
castellatedMeshControls
{{
    maxLocalCells {int(options.get('max_global_cells', 5000000))};
    maxGlobalCells {int(options.get('max_global_cells', 5000000))};
    minRefinementCells 0;
    maxLoadUnbalance 0.1;
    nCellsBetweenLevels 3;
    features ();
    refinementSurfaces
    {{
        urbanWall {{ level {_vector(refinement)}; patchInfo {{ type wall; }} }}
    }}
    resolveFeatureAngle 30;
    refinementRegions {{}}
    locationInMesh {_vector(location)};
    allowFreeStandingZoneFaces true;
}}
snapControls
{{
    nSmoothPatch {snap_smoothing};
    nSmoothInternal {internal_smoothing};
    tolerance 2;
    nSolveIter 30;
    nRelaxIter 5;
    nFeatureSnapIter 10;
    implicitFeatureSnap true;
    explicitFeatureSnap false;
    multiRegionFeatureSnap false;
}}
addLayersControls
{{
    relativeSizes true;
    layers {{}}
    expansionRatio 1;
    finalLayerThickness 0.3;
    minThickness 0.1;
    nGrow 0;
    featureAngle 60;
    nRelaxIter 5;
    nSmoothSurfaceNormals 1;
    nSmoothNormals 3;
    nSmoothThickness 10;
    maxFaceThicknessRatio 0.5;
    maxThicknessToMedialRatio 0.3;
    minMedialAxisAngle 90;
    nBufferCellsNoExtrude 0;
    nLayerIter 50;
}}
meshQualityControls
{{
    {quality}
}}
debug 0;
mergeTolerance 1e-6;
"""
    _write(case / "system/snappyHexMeshDict", body)
    _write(case / "system/meshQualityDict", quality + "\n")
    _write(case / "system/controlDict", "application simpleFoam;\nstartFrom startTime;\nstartTime 0;\n"
           "stopAt endTime;\nendTime 1;\ndeltaT 1;\nwriteControl timeStep;\nwriteInterval 1;\n")
    _write(case / "system/fvSchemes", "ddtSchemes { default steadyState; }\n"
           "gradSchemes { default Gauss linear; }\ndivSchemes { default none; }\n"
           "laplacianSchemes { default Gauss linear corrected; }\n"
           "interpolationSchemes { default linear; }\nsnGradSchemes { default corrected; }\n")
    _write(case / "system/fvSolution", "solvers {}\n")
    return domain


def _run(command: list[str], case: Path, log_name: str) -> float:
    case = case.resolve()
    LOGGER.info("OpenFOAM 실행: %s", " ".join(command))
    start = time.monotonic()
    log = case / log_name
    with log.open("w", encoding="utf-8") as stream:
        process = subprocess.Popen(command + ["-case", str(case)], stdout=stream,
                                   stderr=subprocess.STDOUT, start_new_session=True, cwd=case,
                                   env=openfoam_environment())
        try:
            while True:
                try:
                    return_code = process.wait(timeout=30)
                    break
                except subprocess.TimeoutExpired:
                    LOGGER.info("%s 실행 중: %.1f분 경과, 로그 %s", command[0],
                                (time.monotonic() - start) / 60, log)
        except BaseException:
            with contextlib.suppress(ProcessLookupError):
                os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                with contextlib.suppress(ProcessLookupError):
                    os.killpg(process.pid, signal.SIGKILL)
                process.wait()
            raise
    if return_code:
        with log.open("rb") as stream:
            stream.seek(max(0, log.stat().st_size - 4096))
            tail = stream.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{command[0]} failed ({return_code}). Log: {log}\n{tail}")
    return time.monotonic() - start


def _patch_role(patch: str, direction: tuple[float, float, float]) -> str:
    dot = sum(normal * value for normal, value in zip(NORMALS[patch], direction))
    return "inlet" if dot < -1e-8 else "outlet" if dot > 1e-8 else "side"


def _abl_values(height: float | np.ndarray, speed: float, physics: dict):
    z0, d = physics["z0"], physics["displacement"]
    kappa, cmu = physics["kappa"], physics["Cmu"]
    height = np.maximum(np.asarray(height) - d, z0 * 1e-6)
    ustar = kappa * speed / math.log((physics["zref"] + z0) / z0)
    velocity = ustar / kappa * np.log((height + z0) / z0)
    kinetic = ustar ** 2 / math.sqrt(cmu)
    epsilon = ustar ** 3 / (kappa * (height + z0))
    viscosity = kappa * ustar * (height + z0)
    return velocity, kinetic, epsilon, viscosity


def _flow_numerics(options: dict) -> dict:
    values = {
        "simple_consistent": options.get("simple_consistent", True),
        "pressure_gradient_scheme": options.get("pressure_gradient_scheme", "cellLimited Gauss linear 1"),
        "velocity_gradient_scheme": options.get("velocity_gradient_scheme", "cellLimited Gauss linear 1"),
        "non_orthogonal_scheme": options.get("non_orthogonal_scheme", "limited 0.5"),
        "pressure_relaxation": options.get("pressure_relaxation", 0.3),
        "velocity_relaxation": options.get("velocity_relaxation", 0.7),
        "pressure_relative_tolerance": options.get("pressure_relative_tolerance", 0.05),
    }
    if type(values["simple_consistent"]) is not bool:
        raise ValueError("simple_consistent must be a boolean.")
    for key, allowed in {
        "pressure_gradient_scheme": {"cellLimited Gauss linear 1", "Gauss linear"},
        "velocity_gradient_scheme": {"cellLimited Gauss linear 1", "Gauss linear"},
        "non_orthogonal_scheme": {"limited 0.5", "corrected"},
    }.items():
        if not isinstance(values[key], str) or values[key] not in allowed:
            raise ValueError(f"Numerical scheme is unsupported: {key}.")
    for key in ("pressure_relaxation", "velocity_relaxation", "pressure_relative_tolerance"):
        value = values[key]
        minimum = 0 if key == "pressure_relative_tolerance" else math.nextafter(0.0, 1.0)
        if (type(value) not in {int, float} or not math.isfinite(value)
                or not minimum <= value <= 1):
            raise ValueError(f"Numerical relaxation factor or relative tolerance is invalid: {key}.")
    return values


def _write_flow_case(case: Path, domain: dict, direction_deg: float,
                     speed: float, config: dict) -> dict:
    physics, options = config["physics"], config["generation"]
    numerics = _flow_numerics(options)
    theta = math.radians(direction_deg)
    direction = (math.cos(theta), math.sin(theta), 0)
    roles = {patch: _patch_role(patch, direction) for patch in NORMALS}
    top_height = domain["high"][2] - domain["low"][2]
    top_u, kinetic, top_epsilon, top_nut = _abl_values(top_height, speed, physics)
    _, _, epsilon, nut = _abl_values(physics["zref"], speed, physics)
    abl = (f"flowDir {_vector(direction)}; zDir (0 0 1); Uref {speed:.12g}; "
           f"Zref {physics['zref']:.12g}; z0 uniform {physics['z0']:.12g}; "
           f"d uniform {physics['displacement']:.12g}; kappa {physics['kappa']:.12g}; "
           f"Cmu {physics['Cmu']:.12g}; initABL true;")
    dimensions = {"U": "[0 1 -1 0 0 0 0]", "p": "[0 2 -2 0 0 0 0]",
                  "k": "[0 2 -2 0 0 0 0]", "epsilon": "[0 2 -3 0 0 0 0]",
                  "nut": "[0 2 -1 0 0 0 0]"}
    initial = {"U": _vector(np.asarray(direction) * speed), "p": "0", "k": str(kinetic),
               "epsilon": str(float(epsilon)), "nut": str(float(nut))}
    top = {"U": _vector(np.asarray(direction) * top_u), "p": "0", "k": str(kinetic),
           "epsilon": str(float(top_epsilon)), "nut": str(float(top_nut))}
    for field in dimensions:
        entries = []
        for patch, role in roles.items():
            if field == "p":
                content = "type fixedValue; value uniform 0;" if role == "outlet" else "type zeroGradient;"
            elif field in {"U", "k", "epsilon"} and role in {"inlet", "outlet"}:
                kind = {"U": "Velocity", "k": "K", "epsilon": "Epsilon"}[field]
                content = f"type atmBoundaryLayerInlet{kind}; {abl} value uniform {initial[field]};"
            elif field == "U":
                content = "type slip;"
            else:
                content = "type zeroGradient;"
            entries.append(f"{patch} {{ {content} }}")
        for patch in ("ground", "urbanWall"):
            if field == "U":
                content = "type noSlip;"
            elif field == "p":
                content = "type zeroGradient;"
            elif field == "k":
                content = f"type kqRWallFunction; value uniform {initial[field]};"
            elif field == "epsilon":
                if patch == "ground":
                    content = (f"type atmEpsilonWallFunction; z0 uniform {physics['z0']:.12g}; "
                               f"kappa {physics['kappa']:.12g}; Cmu {physics['Cmu']:.12g}; "
                               f"value uniform {initial[field]};")
                else:
                    content = f"type epsilonWallFunction; value uniform {initial[field]};"
            elif patch == "ground":
                content = (f"type atmNutkWallFunction; z0 uniform {physics['z0']:.12g}; "
                           f"boundNut true; kappa {physics['kappa']:.12g}; Cmu {physics['Cmu']:.12g}; "
                           f"value uniform {initial[field]};")
            else:
                content = f"type nutkWallFunction; value uniform {initial[field]};"
            entries.append(f"{patch} {{ {content} }}")
        if field == "p":
            content = "type zeroGradient;"
        elif field == "nut":
            content = f"type calculated; value uniform {top[field]};"
        else:
            content = f"type fixedValue; value uniform {top[field]};"
        entries.append(f"top {{ {content} }}")
        _write(case / "0" / field, f"dimensions {dimensions[field]};\n"
               f"internalField uniform {initial[field]};\nboundaryField\n{{\n" +
               "\n".join(entries) + "\n}\n", "volVectorField" if field == "U" else "volScalarField")
    _write(case / "constant/transportProperties", "transportModel Newtonian;\n"
           f"nu [0 2 -1 0 0 0 0] {physics['mu'] / physics['rho']:.12g};\n")
    _write(case / "constant/turbulenceProperties", "simulationType RAS;\nRAS\n{\n"
           "RASModel kEpsilon;\nturbulence on;\nprintCoeffs on;\nkEpsilonCoeffs\n{\n"
           f"Cmu {physics['Cmu']:.12g};\nsigmaEps {physics['sigma_epsilon']:.12g};\n}}\n}}\n")
    velocity_gradient = (f"grad(U) {numerics['velocity_gradient_scheme']}; "
                         if numerics['velocity_gradient_scheme'] == "Gauss linear" else "")
    _write(case / "system/fvSchemes", "ddtSchemes { default steadyState; }\n"
           "gradSchemes { default cellLimited Gauss linear 1; "
           f"grad(p) {numerics['pressure_gradient_scheme']}; " + velocity_gradient + "}\n"
           "divSchemes { default none; div(phi,U) bounded Gauss linearUpwindV grad(U); "
           "div(phi,k) bounded Gauss upwind; div(phi,epsilon) bounded Gauss upwind; "
           "div((nuEff*dev2(T(grad(U))))) Gauss linear; }\n"
           f"laplacianSchemes {{ default Gauss linear {numerics['non_orthogonal_scheme']}; }}\n"
           "interpolationSchemes { default linear; }\n"
           f"snGradSchemes {{ default {numerics['non_orthogonal_scheme']}; }}\n"
           "wallDist { method meshWave; }\n")
    _write_solver_dictionaries(case, config)
    _write(case / "system/decomposeParDict", f"numberOfSubdomains {int(options['mpi_ranks'])};\nmethod scotch;\n")
    return {"direction_xyz": list(direction), "patch_roles": roles}


def _write_solver_dictionaries(case: Path, config: dict) -> None:
    """경계와 계산 상태를 보존하고 종료 조건과 SIMPLE 수치 설정만 갱신"""
    options = config["generation"]
    numerics = _flow_numerics(options)
    residuals = options["residuals"]
    _write(case / "system/fvSolution", f"""solvers
{{
    p {{ solver GAMG; tolerance 1e-8; relTol {numerics['pressure_relative_tolerance']}; smoother GaussSeidel; }}
    "(U|k|epsilon)" {{ solver smoothSolver; smoother symGaussSeidel; tolerance 1e-9; relTol 0.1; }}
}}
SIMPLE
{{
    nNonOrthogonalCorrectors 1;
    consistent {str(numerics['simple_consistent']).lower()};
    residualControl {{ p {residuals['p']}; U {residuals['U']}; k {residuals['k']}; epsilon {residuals['epsilon']}; }}
}}
relaxationFactors
{{
    fields {{ p {numerics['pressure_relaxation']}; }}
    equations {{ U {numerics['velocity_relaxation']}; k 0.7; epsilon 0.7; }}
}}
""")
    functions = []
    for patch in PATCHES:
        for prefix, operation in (("flux", "sum"), ("fluxAbs", "sumMag")):
            functions.append(f"""{prefix}_{patch}
{{
    type surfaceFieldValue;
    libs ("libfieldFunctionObjects.so");
    regionType patch;
    name {patch};
    operation {operation};
    fields (phi);
    writeFields false;
    log false;
    executeControl timeStep;
    executeInterval 1;
    writeControl timeStep;
    writeInterval 1;
}}""")
    _write(case / "system/controlDict", f"""application simpleFoam;
startFrom latestTime;
startTime 0;
stopAt endTime;
endTime {int(options['max_iterations'])};
deltaT 1;
writeControl timeStep;
writeInterval {int(options.get('write_interval', 100))};
purgeWrite 2;
writeFormat ascii;
writePrecision 10;
writeCompression off;
timeFormat general;
timePrecision 10;
runTimeModifiable false;
libs ("libatmosphericModels.so");
functions
{{
{chr(10).join(functions)}
}}
""")


# 사례별 복구 정책과 시도 기록 확인
SOLVER_RECOVERY_KEYS = (
    "max_iterations", "velocity_relaxation", "pressure_relaxation",
    "pressure_relative_tolerance",
)


def _solver_policy(config: dict) -> dict:
    options = config["generation"]
    numerics = _flow_numerics(options)
    return {key: options[key] if key == "max_iterations" else numerics[key]
            for key in SOLVER_RECOVERY_KEYS}


def _validate_solver_recoveries(config: dict) -> None:
    policies = config.get("solver_recoveries", {})
    if not isinstance(policies, dict):
        raise ValueError("solver_recoveries must be a dictionary keyed by case file names.")
    base = _solver_policy(config)
    for filename, policy in policies.items():
        if not isinstance(filename, str) or not re.fullmatch(r"wind_\d{3}_speed_\d{2}\.npz", filename):
            raise ValueError("Recovery policy case file name is invalid.")
        if not isinstance(policy, dict) or set(policy) != {"overrides", "evidence"}:
            raise ValueError("Recovery policy must contain only overrides and evidence.")
        overrides, evidence = policy["overrides"], policy["evidence"]
        if not isinstance(overrides, dict) or not overrides or not set(overrides) <= set(SOLVER_RECOVERY_KEYS):
            raise ValueError("Recovery policy can change only the four approved solver numerical settings.")
        if not isinstance(evidence, dict) or not evidence:
            raise ValueError("Recovery policy requires nonempty JSON validation evidence.")
        try:
            json.dumps(evidence, allow_nan=False, sort_keys=True)
        except (TypeError, ValueError) as error:
            raise ValueError("Recovery evidence must contain only finite JSON values.") from error
        for key, value in overrides.items():
            if type(value) not in (int, float) or not math.isfinite(value):
                raise ValueError(f"Recovery numerical setting must be finite: {key}.")
            if key == "max_iterations":
                if type(value) is not int or value < base[key]:
                    raise ValueError("Recovery iteration limit must be an integer at least as large as the base limit.")
            elif key == "pressure_relative_tolerance":
                if not 0 <= value <= base[key]:
                    raise ValueError("Pressure relative tolerance cannot be relaxed beyond the existing value.")
            elif not 0 < value <= 1:
                raise ValueError("Recovery relaxation factor must be greater than 0 and at most 1.")
        if all(value == base[key] for key, value in overrides.items()):
            raise ValueError("Recovery policy must include a change from the base configuration.")


def _effective_case_config(config: dict, filename: str) -> tuple[dict, dict | None]:
    """실제 승인 값으로 사례별 복구 설정을 구성

    Args:
        config: 기본 물리 설정과 승인된 복구 정책
        filename: 대상 NPZ 파일명

    Returns:
        tuple: 실효 설정과 선택적 복구 기록
    """
    _validate_solver_recoveries(config)
    effective = _plain_values(json.loads(json.dumps(config, allow_nan=False)))
    policy = config.get("solver_recoveries", {}).get(filename)
    if policy is None:
        return effective, None
    effective["generation"].update(policy["overrides"])
    recovery = {
        "schema_version": 1, "case_file": filename,
        "overrides": json.loads(json.dumps(policy["overrides"])),
        "effective_solver_policy": _solver_policy(effective),
        "evidence": _plain_values(json.loads(json.dumps(policy["evidence"], allow_nan=False))),
    }
    recovery["attempts"] = []
    return effective, recovery


def _recovery_payload(recovery: dict) -> dict:
    """식별자 없이 복구 정책의 실제 항목을 반환

    Args:
        recovery: 현재 또는 과거 형식의 복구 정책

    Returns:
        dict: 사례와 승인 설정 및 근거의 실제 값
    """
    return {key: _plain_values(recovery[key]) for key in (
        "schema_version", "case_file", "overrides",
        "effective_solver_policy", "evidence",
    )}


def _validate_recovery_record(recovery: dict, base_config: dict, filename: str) -> dict:
    """과거 식별자는 무시하고 복구 정책과 시도별 실제 값을 확인

    Args:
        recovery: 현재 또는 과거 형식의 복구 기록
        base_config: 변경하지 않을 기본 물리 설정
        filename: 대상 NPZ 파일명

    Returns:
        dict: 기록된 승인 값으로 구성한 실효 설정
    """
    try:
        recovery = _plain_values(recovery)
        required = {"schema_version", "case_file", "overrides", "effective_solver_policy", "evidence", "attempts"}
        if not isinstance(recovery, dict) or set(recovery) != required:
            raise ValueError("Recovery record required entries do not match.")
        if (type(recovery["schema_version"]) is not int or recovery["schema_version"] != 1
                or recovery["case_file"] != filename or not isinstance(recovery["attempts"], list)):
            raise ValueError("Recovery record does not match the case.")
        json.dumps(recovery["attempts"], allow_nan=False)
        for number, attempt in enumerate(recovery["attempts"], 1):
            if (not isinstance(attempt, dict) or type(attempt.get("attempt")) is not int
                    or attempt["attempt"] != number
                    or attempt.get("status") not in {"previous_failed", "prepared", "complete", "failed", "interrupted"}):
                raise ValueError("Recovery attempt number or status is invalid.")
            solver_policy = attempt.get("solver_policy")
            if not isinstance(solver_policy, dict) or set(solver_policy) != set(SOLVER_RECOVERY_KEYS):
                raise ValueError("Recovery attempt numerical settings are incomplete.")
            if (type(solver_policy["max_iterations"]) is not int
                    or solver_policy["max_iterations"] < base_config["generation"]["max_iterations"]):
                raise ValueError("Recovery attempt iteration limit is smaller than the base limit.")
            _flow_numerics(dict(base_config["generation"], **solver_policy))
            recorded = attempt.get("recovery_policy")
            if recorded is not None:
                historical = json.loads(json.dumps(base_config, allow_nan=False))
                historical["solver_recoveries"] = {filename: {"overrides": recorded["overrides"], "evidence": recorded["evidence"]}}
                attempt_config, expected = _effective_case_config(historical, filename)
                if (_recovery_payload(recorded) != _recovery_payload(expected)
                        or _solver_policy(attempt_config) != solver_policy):
                    raise ValueError("Recovery attempt policy values do not match.")
            if {"log_file", "log_bytes"} & set(attempt):
                if (attempt.get("log_file") != f"solver_attempts/{number:04d}.log"
                        or type(attempt.get("log_bytes")) is not int or attempt["log_bytes"] <= 0):
                    raise ValueError("Recovery attempt log path or size is invalid.")
        previous = json.loads(json.dumps(base_config, allow_nan=False))
        previous["solver_recoveries"] = {filename: {"overrides": recovery["overrides"], "evidence": recovery["evidence"]}}
        effective, expected = _effective_case_config(previous, filename)
        if _recovery_payload(expected) != _recovery_payload(recovery):
            raise ValueError("Stored numerical settings do not match the recovery policy.")
        return effective
    except (KeyError, TypeError) as error:
        raise ValueError("Stored recovery policy is incomplete.") from error


def _validate_completed_recovery(entry: dict, recovery: dict | None) -> None:
    """완료 사례의 승인 정책 실제 값 변경을 거부

    Args:
        entry: 기존 완료 사례 기록
        recovery: 현재 승인된 선택적 복구 정책
    """
    previous = entry.get("solver_recovery")
    if previous is None and recovery is None:
        return
    if previous is None or recovery is None:
        raise RuntimeError("Recovery policy cannot be added to or removed from a completed case.")
    try:
        if _recovery_payload(previous) != _recovery_payload(recovery):
            raise RuntimeError("Recovery policy cannot be changed for a completed case.")
    except (KeyError, TypeError) as error:
        raise RuntimeError("Completed case recovery policy record is incomplete.") from error


def _discard_completed_case_work(case: Path, manifest: dict, preprocessed: Path,
                                  raw: Path, config: dict) -> bool:
    """실제 조건과 완료 산출물이 일치하는 잔여 작업만 정리

    Args:
        case: 잔여 작업 경로
        manifest: 완료 사례가 포함된 카탈로그
        preprocessed: NPZ 디렉터리
        raw: CFD 아카이브 디렉터리
        config: 실제 물리 조건과 승인 정책

    Returns:
        bool: 검증한 완료 작업을 정리했는지 여부
    """
    marker_path, recovery_path = case / "condition.json", case / "solver_recovery.json"
    if (not case.is_dir() or case.is_symlink() or not marker_path.is_file()
            or marker_path.is_symlink() or recovery_path.is_symlink()
            or (recovery_path.exists() and not recovery_path.is_file())):
        return False
    try:
        marker = _plain_values(_json(marker_path))
        recovery = _plain_values(_json(recovery_path)) if recovery_path.is_file() else None
        direction, speed = marker["wind_direction_deg"], marker["wind_speed_m_s"]
        if any(type(value) not in (int, float) or not math.isfinite(value)
               or value != int(value) for value in (direction, speed)):
            return False
        filename = f"wind_{int(direction):03d}_speed_{int(speed):02d}.npz"
        entry = next((item for item in manifest["cases"] if item["file"] == filename), None)
        if (entry is None or entry.get("status") != "complete"
                or _plain_values(entry.get("solver_recovery")) != recovery
                or marker != {"wind_direction_deg": direction, "wind_speed_m_s": speed}):
            return False
        _validate_case_outputs(entry, manifest, preprocessed, raw, config)
    except (KeyError, TypeError, ValueError, RuntimeError, OSError):
        return False
    shutil.rmtree(case)
    return True


def _checkpoint_time(case: Path, ranks: int) -> float:
    """모든 MPI 프로세스에 공통인 마지막 완결 시각 반환"""
    required = ("U", "p", "nut", "k", "epsilon", "phi")
    directories = [case / f"processor{rank}" for rank in range(ranks)] if ranks > 1 else [case]
    complete = []
    for directory in directories:
        times = set()
        if directory.is_dir():
            for path in directory.iterdir():
                try:
                    value = float(path.name)
                except ValueError:
                    continue
                if (path.is_dir() and value > 0 and math.isfinite(value)
                        and all(_field_complete(path / field) for field in required)):
                    times.add(value)
        complete.append(times)
    common = set.intersection(*complete)
    return max(common) if common else 0.0


def _preserve_solver_log(case: Path, attempt: dict) -> None:
    """실제 바이트 비교로 이전 시도 로그의 덮어쓰기를 방지

    Args:
        case: 현재 CFD 작업 디렉터리
        attempt: 갱신할 시도 기록
    """
    log = case / "simpleFoam.log"
    if not log.is_file():
        return
    relative = f"solver_attempts/{int(attempt['attempt']):04d}.log"
    destination = case / relative
    if destination.exists():
        if not _same_file_content(destination, log):
            raise RuntimeError("Previous recovery attempt log cannot be overwritten with different content.")
    else:
        destination.parent.mkdir(exist_ok=True)
        shutil.copy2(log, destination)
    attempt.update(log_file=relative, log_bytes=log.stat().st_size)


def _prepare_solver_recovery(case: Path, base_config: dict, effective_config: dict,
                              recovery: dict, condition: dict,
                              previous_recovery: dict | None = None) -> dict:
    """실제 정책과 사전을 확인하여 중단된 수치 전환을 이어 처리

    Args:
        case: 현재 CFD 작업 디렉터리
        base_config: 기본 물리 설정
        effective_config: 승인된 실효 설정
        recovery: 적용할 복구 기록
        condition: 풍향과 풍속의 실제 조건
        previous_recovery: 기존 카탈로그의 선택적 복구 기록

    Returns:
        dict: 실제 사전 전환 상태와 시도 기록
    """
    filename = recovery["case_file"]
    recovery = _plain_values(recovery)
    condition = _plain_values(condition)
    previous_recovery = _plain_values(previous_recovery)
    validated = _validate_recovery_record(recovery, base_config, filename)
    if _plain_values(validated["generation"]) != _plain_values(effective_config["generation"]):
        raise RuntimeError("Effective case configuration does not match the recovery record.")
    if _plain_values(_json(case / "condition.json")) != condition:
        raise RuntimeError("Existing simulation wind conditions do not match the recovery case.")
    work_record = (_plain_values(_json(case / "solver_recovery.json"))
                   if (case / "solver_recovery.json").is_file() else None)
    previous = work_record or previous_recovery
    for recorded in (work_record, previous_recovery):
        if recorded is not None:
            _validate_recovery_record(recorded, base_config, filename)
    transition = previous["attempts"][-1].get("dictionary_transition") if previous and previous["attempts"] else None
    pending = isinstance(transition, dict) and transition.get("status") == "pending"
    different_catalog = (work_record is not None and previous_recovery is not None
                         and _recovery_payload(work_record) != _recovery_payload(previous_recovery))
    matches_previous = (different_catalog and isinstance(transition, dict)
        and transition.get("status") in {"pending", "applied"}
        and _plain_values(transition.get("previous_recovery_policy")) == _recovery_payload(previous_recovery)
        and transition.get("previous_solver_policy") == previous_recovery["effective_solver_policy"])
    reconciled = matches_previous and transition["status"] == "applied"
    if different_catalog and not matches_previous:
        raise RuntimeError("Recovery policies differ between the work directory and catalog.")
    if reconciled and _recovery_payload(work_record) != _recovery_payload(recovery):
        raise RuntimeError("Catalog reconciliation requires the approved work directory policy.")
    previous_config = base_config
    if previous is not None:
        if (_recovery_payload(previous) != _recovery_payload(recovery)
                and any(attempt.get("status") == "complete" for attempt in previous["attempts"])):
            raise RuntimeError("Policy cannot be changed for a completed recovery attempt.")
        previous_config = _validate_recovery_record(previous, base_config, filename)
        if pending:
            if _recovery_payload(previous) != _recovery_payload(recovery):
                raise RuntimeError("An incomplete dictionary transition cannot change to another policy.")
            prior = transition.get("previous_recovery_policy")
            if prior is None:
                previous_config = base_config
            elif isinstance(prior, dict):
                previous_config = _validate_recovery_record(dict(prior, attempts=[]), base_config, filename)
            else:
                raise RuntimeError("Previous policy values are missing for the interrupted transition.")
            if transition.get("previous_solver_policy") != _solver_policy(previous_config):
                raise RuntimeError("Previous numerical values do not match the recorded transition.")

    # 실제 이전 사전과 적용 사전을 비교한 뒤 전환을 재개
    with tempfile.TemporaryDirectory(prefix="flowcast3d-solver-policy-") as temporary:
        templates = Path(temporary)
        _write_solver_dictionaries(templates / "previous", previous_config)
        _write_solver_dictionaries(templates / "effective", effective_config)
        for name in ("fvSolution", "controlDict"):
            actual = case / "system" / name
            expected = {(templates / "previous/system" / name).read_bytes()}
            if pending:
                expected.add((templates / "effective/system" / name).read_bytes())
            if not actual.is_file() or actual.read_bytes() not in expected:
                raise RuntimeError(f"Unrecorded solver dictionary change cannot be recovered: {name}.")
        for attempt in previous["attempts"] if previous else []:
            log_name = attempt.get("log_file")
            if log_name is not None:
                if (log_name != f"solver_attempts/{int(attempt['attempt']):04d}.log"
                        or not (case / log_name).is_file() or (case / log_name).is_symlink()
                        or (case / log_name).stat().st_size != attempt["log_bytes"]):
                    raise RuntimeError("Preserved recovery attempt log path or size does not match.")
        result = _plain_values(json.loads(json.dumps(recovery, allow_nan=False)))
        result["attempts"] = _plain_values(json.loads(json.dumps(previous["attempts"] if previous else [])))
        current_log = case / "simpleFoam.log"
        active = result["attempts"][-1] if result["attempts"] else None
        saved = any(attempt.get("log_file") and _same_file_content(case / attempt["log_file"], current_log)
                    for attempt in result["attempts"])
        if current_log.is_file() and not saved:
            if active is None or active.get("log_file") is not None:
                active = {"attempt": len(result["attempts"]) + 1, "status": "previous_failed",
                          "solver_policy": _solver_policy(previous_config)}
                if previous is not None:
                    active["recovery_policy"] = _recovery_payload(previous)
                result["attempts"].append(active)
            else:
                active["status"] = "previous_failed"
            _preserve_solver_log(case, active)
        if (not result["attempts"] or result["attempts"][-1].get("log_file") is not None
                or result["attempts"][-1].get("status") != "prepared"
                or result["attempts"][-1].get("recovery_policy") != _recovery_payload(recovery)):
            result["attempts"].append({
                "attempt": len(result["attempts"]) + 1, "status": "prepared",
                "solver_policy": _solver_policy(effective_config),
                "recovery_policy": _recovery_payload(recovery),
                "start_iteration": _checkpoint_time(case, int(base_config["generation"]["mpi_ranks"])),
            })
        if pending or reconciled:
            dictionary_transition = dict(transition, status="pending")
        else:
            dictionary_transition = {"status": "pending", "previous_solver_policy": _solver_policy(previous_config),
                                     "previous_recovery_policy": _recovery_payload(previous) if previous is not None else None}
        result["attempts"][-1]["dictionary_transition"] = dictionary_transition
        atomic_json(case / "solver_recovery.json", result)
        for name in ("fvSolution", "controlDict"):
            destination = case / "system" / name
            content = (templates / "effective/system" / name).read_bytes()
            if destination.read_bytes() != content:
                pending_path = destination.with_name(destination.name + ".recovery.tmp")
                pending_path.write_bytes(content)
                os.replace(pending_path, destination)
        atomic_json(case / "condition.json", condition)
        result["attempts"][-1]["dictionary_transition"]["status"] = "applied"
        atomic_json(case / "solver_recovery.json", result)
    return result


def _finish_solver_recovery(case: Path, recovery: dict, status: str,
                             *, qc: dict | None = None, error: str | None = None) -> None:
    """최종 실제 품질 값과 시도 로그를 기록

    Args:
        case: 현재 CFD 작업 디렉터리
        recovery: 갱신할 복구 기록
        status: 시도 종료 상태
        qc: 선택적 실제 품질 결과
        error: 선택적 오류 내용
    """
    clean = _plain_values(recovery)
    recovery.clear()
    recovery.update(clean)
    attempt = recovery["attempts"][-1]
    attempt["status"] = status
    if qc is not None:
        attempt["qc"] = json.loads(json.dumps(qc))
    if error is not None:
        attempt["error"] = error
    log = case / "simpleFoam.log"
    saved = any(item.get("log_file") and _same_file_content(case / item["log_file"], log)
                for item in recovery["attempts"][:-1])
    if not saved or attempt.get("solver_started"):
        _preserve_solver_log(case, attempt)
    atomic_json(case / "solver_recovery.json", recovery)


def _check_mesh(log: Path) -> dict:
    text = log.read_text(encoding="utf-8", errors="replace")
    return _mesh_qc(text)


def _mesh_qc(text: str, *, require_quality: bool = False) -> dict:
    cells = re.search(r"\bcells:\s*(\d+)", text)
    if "Mesh OK." not in text or "Failed" in text or "FOAM FATAL" in text:
        raise RuntimeError("OpenFOAM mesh quality validation failed.")
    result = {"mesh_ok": True, "cells": int(cells.group(1)) if cells else None}
    if require_quality:
        checks = re.findall(r"^\s*(?:faces (?:with|on)|non-orthogonality >)[^\n]*:\s*(\d+)\s*$",
                            text, re.MULTILINE)
        if ("Enabling user-defined geometry checks." not in text
                or "Enabling all (cell, face, edge, point) topology checks." not in text
                or "Checking faces in error" not in text
                or not checks or any(int(value) for value in checks)
                or not re.search(r"^End\s*$", text, re.MULTILINE)):
            raise RuntimeError("OpenFOAM user mesh quality check could not be verified.")
        result["mesh_quality_policy"] = MESH_QUALITY_POLICY
    return result


def _extended_mesh_diagnostics(text: str, cells: int) -> dict:
    count = re.search(r"\bcells:\s*(\d+)", text)
    failed = re.search(r"Failed (\d+) mesh checks", text)
    if ("FOAM FATAL" in text or not re.search(r"^End\s*$", text, re.MULTILINE)
            or count is None or int(count.group(1)) != cells):
        raise RuntimeError("Normal completion of OpenFOAM extended mesh diagnostics could not be verified.")
    if "Mesh OK." not in text and failed is None:
        raise RuntimeError("OpenFOAM extended mesh diagnostic results are missing.")
    patterns = {
        "concave_cells": r"Concave cells[^\n]*number of cells:\s*(\d+)",
        "small_determinant_cells": r"Cells with small determinant[^\n]*number of cells:\s*(\d+)",
        "highly_skew_faces": r"(\d+) highly skew faces",
        "concave_faces": r"There are (\d+) faces with concave angles",
        "warped_faces": r"There are (\d+) faces with ratio between projected and actual area",
    }
    result = {"passed": failed is None, "failed_checks": int(failed.group(1)) if failed else 0}
    for name, pattern in patterns.items():
        match = re.search(pattern, text)
        result[name] = int(match.group(1)) if match else 0
    return result


def _validate_mesh(case: Path) -> dict:
    _run(["checkMesh", "-allTopology", "-meshQuality"], case, "checkMesh.log")
    qc = _mesh_qc((case / "checkMesh.log").read_text(encoding="utf-8"), require_quality=True)
    if not qc["cells"]:
        raise RuntimeError("OpenFOAM mesh cell count could not be verified.")
    _run(["checkMesh", "-allGeometry", "-allTopology"], case, "checkMesh.geometry.log")
    qc["extended_geometry"] = _extended_mesh_diagnostics(
        (case / "checkMesh.geometry.log").read_text(encoding="utf-8"), qc["cells"])
    if not qc["extended_geometry"]["passed"]:
        LOGGER.warning("확장 격자 진단 %d개 항목 실패: 유한체적 품질은 통과, 상세 결과는 기록에 보존",
                       qc["extended_geometry"]["failed_checks"])
    return qc


def _surface_qc(log: Path) -> dict:
    text = log.read_text(encoding="utf-8", errors="replace")
    illegal = re.search(r"Surface has (\d+) illegal triangles", text)
    if "FOAM FATAL" in text or "Surface is empty" in text or (illegal and int(illegal.group(1))):
        raise RuntimeError(f"Source surface check failed: {log}.")
    if "Surface has no illegal triangles" not in text and illegal is None:
        raise RuntimeError(f"Source triangle check could not be verified: {log}.")
    open_edges = re.search(r"connected to one face\s*:\s*(\d+)", text, re.IGNORECASE)
    multiple = re.search(r"connected to >2 faces\s*:\s*(\d+)", text, re.IGNORECASE)
    result = {"illegal_triangles": 0, "surface_closed": "Surface is closed." in text,
              "open_edges": int(open_edges.group(1)) if open_edges else 0,
              "nonmanifold_edges": int(multiple.group(1)) if multiple else 0}
    if not result["surface_closed"]:
        LOGGER.warning("원본 표면에 열린 경계가 있습니다: 자동 수정 없이 snappyHexMesh 결과를 검증합니다")
    return result


def _check_snappy_completion(log: Path, max_cells: int) -> dict:
    text = log.read_text(encoding="utf-8", errors="replace")
    patterns = [r"No cells marked for refinement since reached limit",
                r"Stopped refining since reaching my cell\s+limit",
                r"reached (?:the )?(?:maximum|maxGlobalCells|maxCells)[^\n]*cell",
                r"refinement stopped[^\n]*(?:cell|limit)"]
    capped = any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns)
    counts = [int(number) for number in re.findall(r"\bcells:\s*(\d+)", text)]
    counts += [int(number) for number in re.findall(r"cells \(out of (\d+)\)", text)]
    maximum = max(counts, default=0)
    if capped or maximum >= max_cells:
        raise RuntimeError(f"snappyHexMesh refinement did not complete because the cell limit was reached: {max_cells}.")
    if "End" not in text or "FOAM FATAL" in text:
        raise RuntimeError(f"Normal completion of snappyHexMesh could not be verified: {log}.")
    return {"refinement_completed": True, "peak_mesh_cells": maximum}


def _validate_urban_patch(case: Path) -> dict:
    boundary = (case / "constant/polyMesh/boundary").read_text(encoding="utf-8")
    match = re.search(r"\burbanWall\s*\{([^}]+)\}", boundary)
    if not match or not re.search(r"\btype\s+wall\s*;", match.group(1)):
        raise RuntimeError("CFD mesh is missing the source city urbanWall boundary.")
    faces = re.search(r"\bnFaces\s+(\d+)\s*;", match.group(1))
    if not faces or int(faces.group(1)) == 0:
        raise RuntimeError("Urban wall boundary has zero faces.")
    return {"urban_wall_faces": int(faces.group(1))}


def _solver_qc(log: Path, residuals: dict, *,
               velocity_components: tuple[str, ...] = ("Ux", "Uy", "Uz")) -> dict:
    if not velocity_components or not set(velocity_components) <= {"Ux", "Uy", "Uz"}:
        raise ValueError("Velocity validation requires at least one of Ux, Uy or Uz.")
    values = {}
    iteration = 0
    announced = False
    expression = re.compile(r"Solving for (Ux|Uy|Uz|U|p|k|epsilon), Initial residual = ([^,\s]+)")
    with log.open(encoding="utf-8", errors="replace") as stream:
        for line in stream:
            match_time = re.match(r"Time = ([0-9.eE+-]+)", line)
            if match_time:
                iteration = float(match_time.group(1))
                values = {}
            match = expression.search(line)
            if match:
                name, raw = match.groups()
                value = float(raw)
                if not math.isfinite(value):
                    raise RuntimeError("CFD residuals contain NaN or infinity.")
                values[name] = max(values.get(name, 0), value)
            announced |= "SIMPLE solution converged" in line
            floating_exception = "Floating point exception" in line and not re.match(
                r"^(?:sigFpe|trapFpe)\s*:\s*Floating point exception trapping enabled\b", line
            )
            if "FOAM FATAL" in line or floating_exception:
                raise RuntimeError(f"CFD execution error was recorded: {log}.")
    velocity = max(values.get(name, math.inf) for name in velocity_components)
    if "U" in values and set(velocity_components) == {"Ux", "Uy", "Uz"}:
        velocity = values["U"]
    initial = {"U": velocity, **{name: values.get(name, math.inf) for name in ("p", "k", "epsilon")}}
    passed = all(initial[name] <= threshold for name, threshold in residuals.items())
    if not passed:
        raise RuntimeError(f"CFD initial residuals did not converge: {initial}, criteria: {residuals}.")
    excluded = {name: values.get(name, math.inf) for name in ("Ux", "Uy", "Uz")
                if name not in velocity_components}
    if not all(math.isfinite(value) for value in excluded.values()):
        raise RuntimeError("Initial residuals for excluded velocity components could not be verified.")
    return {"converged": True, "convergence_announced": announced,
            "iterations": iteration, "initial_residuals": initial,
            "checked_velocity_components": list(velocity_components),
            "excluded_velocity_component_initial_residuals": excluded}


def _value_at_time(path: Path, final_time: float) -> float | None:
    value = None
    with path.open(encoding="utf-8") as stream:
        for line in stream:
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            fields = line.split()
            output_time = float(fields[0])
            if math.isclose(output_time, final_time, rel_tol=0, abs_tol=1e-6):
                value = float(fields[1])
                if not math.isfinite(value):
                    raise RuntimeError(f"Final flux contains non-finite values: {path}.")
    return value


def _flux_qc(case: Path, tolerance: float, final_time: float) -> dict:
    signed, magnitudes = {}, {}
    for patch in PATCHES:
        for prefix, destination in (("flux", signed), ("fluxAbs", magnitudes)):
            files = list((case / "postProcessing" / f"{prefix}_{patch}").glob("*/surfaceFieldValue*.dat"))
            if not files:
                raise RuntimeError(f"Flux output is missing for {patch}.")
            rows = []
            for path in files:
                start_time = float(path.parent.name)
                if start_time > final_time:
                    continue
                value = _value_at_time(path, final_time)
                if value is not None:
                    rows.append((path.stat().st_mtime_ns, value))
            if not rows:
                raise RuntimeError("Flux output time does not match the final CFD time.")
            newest = max(row[0] for row in rows)
            latest_values = {value for modified, value in rows if modified == newest}
            if len(latest_values) != 1:
                raise RuntimeError(f"Final flux outputs conflict for {patch}.")
            value = latest_values.pop()
            if prefix == "fluxAbs" and value < 0:
                raise RuntimeError(f"Absolute flux is negative for {patch}.")
            destination[patch] = value
    denominator = sum(magnitudes.values()) * 0.5
    if denominator <= 0:
        raise RuntimeError("CFD results cannot be validated because external flux is zero.")
    imbalance = abs(sum(signed.values())) / denominator
    if imbalance > tolerance:
        raise RuntimeError(f"Flux imbalance {imbalance:.3%} exceeds the tolerance {tolerance:.3%}.")
    return {"flux_imbalance": imbalance, "boundary_flux_m3_s": signed}


def _latest_time(case: Path) -> Path:
    candidates = []
    for path in case.iterdir():
        if path.is_dir():
            try:
                value = float(path.name)
            except ValueError:
                continue
            if value > 0 and all((path / name).is_file() for name in ("U", "p", "nut", "k", "epsilon", "phi")):
                candidates.append((value, path))
    if not candidates:
        raise RuntimeError(f"No final time contains the required CFD fields: {case}.")
    return max(candidates, key=lambda item: item[0])[1]


def _read_mesh(case: Path, final_time: float):
    try:
        import pyvista as pv
    except ImportError as error:
        raise RuntimeError("OpenFOAM result conversion requires pyvista and vtk.") from error
    marker = case / "case.foam"
    marker.touch()
    reader = pv.OpenFOAMReader(str(marker))
    reader.skip_zero_time = False
    reader.cell_to_point_creation = False
    if hasattr(reader.reader, "SetDecomposePolyhedra"):
        reader.decompose_polyhedra = False
    reader.disable_all_patch_arrays()
    reader.enable_patch_array("internalMesh")
    reader.set_active_time_value(final_time)
    mesh = reader.read()["internalMesh"]
    if isinstance(mesh, pv.MultiBlock):
        mesh = mesh.combine()
    owner = case / "constant/polyMesh/owner"
    with owner.open("rb") as stream:
        header = stream.read(8192).decode(errors="replace")
    count = re.search(r"nCells:\s*(\d+)", header)
    if count and mesh.n_cells != int(count.group(1)):
        raise RuntimeError("VTK internal cell count does not match the OpenFOAM cell count.")
    for name in ("U", "p", "nut", "k", "epsilon"):
        if name not in mesh.cell_data or not np.isfinite(mesh.cell_data[name]).all():
            raise RuntimeError(f"Final CFD field {name} is missing or contains non-finite values.")
        if name in {"nut", "k", "epsilon"} and (mesh.cell_data[name] < 0).any():
            raise RuntimeError(f"Final CFD field {name} contains negative values.")
    return mesh


def _initialize_abl(case: Path, domain: dict, direction_deg: float,
                    speed: float, config: dict) -> None:
    mesh = _read_mesh(case, 0)
    centres = np.asarray(mesh.cell_centers().points, dtype=np.float64)
    height = centres[:, 2] - domain["low"][2]
    velocity, kinetic, epsilon, viscosity = _abl_values(height, speed, config["physics"])
    theta = math.radians(direction_deg)
    direction = np.asarray([math.cos(theta), math.sin(theta), 0])
    arrays = {"U": velocity[:, None] * direction,
              "k": np.full(len(centres), kinetic), "epsilon": epsilon, "nut": viscosity}
    for name, array in arrays.items():
        path = case / "0" / name
        text = path.read_text(encoding="utf-8")
        before, after = re.split(r"internalField\s+uniform\s+[^;]+;", text, maxsplit=1)
        field_type = "vector" if name == "U" else "scalar"
        temporary = path.with_suffix(".tmp")
        with temporary.open("w", encoding="utf-8") as stream:
            stream.write(before + f"internalField nonuniform List<{field_type}>\n{len(array)}\n(\n")
            if name == "U":
                for value in array:
                    stream.write(_vector(value) + "\n")
            else:
                for value in array:
                    stream.write(f"{float(value):.12g}\n")
            stream.write(");" + after)
        os.replace(temporary, path)


def _prepare_mesh_decomposition(case: Path, ranks: int) -> None:
    if ranks <= 1:
        return
    names = ("points", "faces", "owner", "neighbour", "boundary", "pointProcAddressing",
             "faceProcAddressing", "cellProcAddressing", "boundaryProcAddressing")
    required = [case / f"processor{rank}/constant/polyMesh" / name
                for rank in range(ranks) for name in names]
    if all(path.is_file() and path.stat().st_size > 0 for path in required):
        return
    _write(case / "system/decomposeParDict", f"numberOfSubdomains {ranks};\nmethod scotch;\n")
    _run(["decomposePar", "-force", "-no-fields"], case, "decomposePar.log")
    if not all(path.is_file() and path.stat().st_size > 0 for path in required):
        raise RuntimeError(f"MPI shared mesh decomposition is incomplete: {case}.")


def _solve(case: Path, config: dict, shared_mesh: Path | None = None, *,
           velocity_components: tuple[str, ...] = ("Ux", "Uy", "Uz")) -> tuple[Path, dict, float]:
    ranks = int(config["generation"]["mpi_ranks"])
    recovery = config.get("_solver_recovery")
    latest = _checkpoint_time(case, ranks)
    if latest >= int(config["generation"]["max_iterations"]):
        raise RuntimeError("Checkpoint has reached the iteration limit of the current numerical policy. Existing logs are preserved until an approved policy is available.")
    if ranks > 1:
        if shared_mesh:
            prepared = (case / "decomposition.ready").is_file() and all(
                _field_complete(case / f"processor{rank}/0/{name}")
                for rank in range(ranks) for name in ("U", "p", "nut", "k", "epsilon"))
            if not prepared:
                if recovery is not None and _checkpoint_time(case, ranks) > 0:
                    raise RuntimeError("Existing MPI decomposition state cannot be recreated for a recovery checkpoint.")
                for rank in range(ranks):
                    processor = case / f"processor{rank}"
                    if processor.exists():
                        shutil.rmtree(processor)
                    origin = shared_mesh / f"processor{rank}/constant"
                    shutil.copytree(origin, processor / "constant")
                _run(["decomposePar", "-fields", "-time", "0"], case, "decomposePar.log")
                atomic_json(case / "decomposition.ready", {"ranks": ranks, "status": "complete"})
        else:
            if recovery is not None and _checkpoint_time(case, ranks) > 0:
                raise RuntimeError("Recovery checkpoint must resume with the existing shared mesh decomposition.")
            _run(["decomposePar", "-force"], case, "decomposePar.log")
        _align_processor_times(case, ranks)
        if recovery is not None:
            recovery["attempts"][-1]["solver_started"] = True
            atomic_json(case / "solver_recovery.json", recovery)
        seconds = _run(["mpirun", "-np", str(ranks), "simpleFoam", "-parallel"], case, "simpleFoam.log")
        _run(["reconstructPar", "-latestTime"], case, "reconstructPar.log")
    else:
        if recovery is not None:
            recovery["attempts"][-1]["solver_started"] = True
            atomic_json(case / "solver_recovery.json", recovery)
        seconds = _run(["simpleFoam"], case, "simpleFoam.log")
    qc = _solver_qc(case / "simpleFoam.log", config["generation"]["residuals"],
                    velocity_components=velocity_components)
    if recovery is not None:
        text = (case / "simpleFoam.log").read_text(errors="replace")
        if not qc["convergence_announced"] or not re.search(r"^\s*End\s*$", text, re.MULTILINE):
            raise RuntimeError("Recovery cases require strict residual convergence, a SIMPLE convergence notice and normal End termination.")
    final = _latest_time(case)
    if not math.isclose(qc["iterations"], float(final.name), abs_tol=1e-6):
        raise RuntimeError("Final residual time does not match the stored final CFD time.")
    qc.update(_flux_qc(case, config["generation"]["flux_tolerance"], float(final.name)))
    return final, qc, seconds


def _align_processor_times(case: Path, ranks: int) -> None:
    """모든 MPI 프로세스를 마지막 공통 완결 시각으로 맞춤"""
    directories = [case / f"processor{rank}" for rank in range(ranks)]
    complete = []
    required = ("U", "p", "k", "epsilon", "nut", "phi")
    for directory in directories:
        times = set()
        for path in directory.iterdir():
            try:
                value = float(path.name)
            except ValueError:
                continue
            if path.is_dir() and value > 0 and all(_field_complete(path / field) for field in required):
                times.add(value)
        complete.append(times)
    common = set.intersection(*complete)
    latest = max(common) if common else 0
    for directory in directories:
        for path in directory.iterdir():
            try:
                value = float(path.name)
            except ValueError:
                continue
            if path.is_dir() and value > latest:
                shutil.rmtree(path)


def _field_complete(path: Path) -> bool:
    """ASCII 필드의 마지막 경계 블록까지 기록되었는지 검사"""
    if not path.is_file() or path.stat().st_size < 20:
        return False
    with path.open("rb") as stream:
        stream.seek(max(0, path.stat().st_size - 8192))
        text = stream.read().decode(errors="replace")
    text = re.sub(r"//[^\n]*", "", text)
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    return text.rstrip().endswith("}")


def _validate_abl(work: Path, geometry: dict, config: dict) -> dict:
    case = work / "abl"
    if case.exists():
        shutil.rmtree(case)
    case.mkdir()
    options = json.loads(json.dumps(config))
    options["generation"]["max_iterations"] = min(
        int(options["generation"]["max_iterations"]),
        int(options["generation"].get("abl_max_iterations", 500)),
    )
    if options["generation"]["max_iterations"] <= 0:
        raise ValueError("Empty-domain ABL maximum iteration count must be positive.")
    options["generation"]["write_interval"] = math.gcd(
        int(options["generation"].get("write_interval", 100)),
        options["generation"]["max_iterations"],
    )
    validation_domain = _domain(geometry, options["generation"])
    extent = np.asarray(validation_domain["high"]) - validation_domain["low"]
    if not np.isfinite(extent).all() or (extent <= 0).any():
        raise ValueError("Empty-domain ABL computational domain must have finite positive bounds.")
    horizontal_spacing = float(extent[2]) / 48 * 4
    options["generation"]["base_cells_xyz"] = [
        max(24, math.ceil(float(width) / horizontal_spacing)) for width in extent[:2]
    ] + [48]
    domain = _write_mesh_case(case, geometry, options)
    speed = float(config["generation"]["wind_speeds_m_s"][0])
    if not math.isfinite(speed) or speed <= 0:
        raise ValueError("Empty-domain ABL reference wind speed must be finite and positive.")
    _write_flow_case(case, domain, 0, speed, options)
    _run(["blockMesh"], case, "blockMesh.log")
    _run(["checkMesh", "-allGeometry", "-allTopology"], case, "checkMesh.log")
    _check_mesh(case / "checkMesh.log")
    _initialize_abl(case, domain, 0, speed, options)
    # 0에 가까운 횡속도는 잔차 대신 실제 풍속 비율로 검증
    final, qc, seconds = _solve(case, options, velocity_components=("Ux", "Uz"))
    mesh = _read_mesh(case, float(final.name))
    height = np.asarray(mesh.cell_centers().points)[:, 2] - domain["low"][2]
    expected, _, _, _ = _abl_values(height, speed, config["physics"])
    reference = np.column_stack([expected, np.zeros_like(expected), np.zeros_like(expected)])
    predicted = np.asarray(mesh.cell_data["U"])
    if not np.isfinite(predicted).all() or not np.isfinite(reference).all():
        raise RuntimeError("Empty-domain ABL velocity field contains NaN or infinity.")
    spanwise_relative = float(np.max(np.abs(predicted[:, 1]))) / speed
    spanwise_tolerance = float(config["generation"]["residuals"]["U"])
    if spanwise_relative > spanwise_tolerance:
        raise RuntimeError(f"Empty-domain ABL crossflow velocity ratio exceeds the tolerance: "
                           f"{spanwise_relative:.6g} > {spanwise_tolerance:.6g}")
    relative = math.sqrt(float(np.sum((predicted - reference) ** 2) / np.sum(reference ** 2)))
    if not math.isfinite(relative) or relative > float(config["generation"].get("abl_relative_tolerance", 0.05)):
        raise RuntimeError(f"Empty-domain ABL velocity profile error exceeds the tolerance: {relative:.3%}.")
    result = {"velocity_relative_rmse": relative, "solver_seconds": seconds,
              "spanwise_velocity_max_relative": spanwise_relative,
              "spanwise_velocity_relative_tolerance": spanwise_tolerance,
              "max_iterations": options["generation"]["max_iterations"], **qc}
    shutil.rmtree(case)
    return result


def _grid_points(domain: dict, shape_zyx: list[int]) -> np.ndarray:
    origin, spacing = np.asarray(domain["model_low"]), np.asarray(domain["spacing"])
    z, y, x = np.meshgrid(np.arange(shape_zyx[0]), np.arange(shape_zyx[1]),
                         np.arange(shape_zyx[2]), indexing="ij")
    indices = np.stack([x, y, z], axis=-1).reshape(-1, 3)
    return origin + (indices + 0.5) * spacing


def _adjacent(mask: np.ndarray) -> np.ndarray:
    result = np.zeros_like(mask, dtype=bool)
    for axis in range(3):
        low, high = [slice(None)] * 3, [slice(None)] * 3
        low[axis], high[axis] = slice(None, -1), slice(1, None)
        result[tuple(low)] |= mask[tuple(high)]
        result[tuple(high)] |= mask[tuple(low)]
    return result


def _export(case: Path, final: Path, domain: dict, direction: float, speed: float,
            config: dict, destination: Path, geometry: dict, qc: dict) -> dict:
    """CFD 셀 위치를 격자로 매핑하고 정답 누출 없는 NPZ 저장"""
    shape = config["generation"]["grid_shape_zyx"]
    mesh = _read_mesh(case, float(final.name))
    points = _grid_points(domain, shape)
    cells = np.asarray(mesh.find_containing_cell(points), dtype=np.int64)
    fluid = (cells >= 0).reshape(shape)
    if not fluid.any() or fluid.all():
        raise RuntimeError("CFD mesh is missing urban solid cells or external fluid cells.")
    target = np.zeros((4, *shape), dtype=np.float32)
    inside = cells >= 0
    target_flat = target.reshape(4, -1)
    target_flat[:3, inside] = np.asarray(mesh.cell_data["U"])[cells[inside]].T
    target_flat[3, inside] = np.asarray(mesh.cell_data["p"])[cells[inside]] * config["physics"]["rho"]
    valid = fluid & np.isfinite(target).all(axis=0)
    boundary = np.where(fluid, 1, 0).astype(np.uint8)
    wall = ~fluid & _adjacent(fluid)
    boundary[wall] = 3
    ground_cells = points[:, 2].reshape(shape) <= domain["low"][2]
    boundary[ground_cells] = 2
    bc_values = np.zeros((4, *shape), dtype=np.float32)
    bc_mask = np.zeros((4, *shape), dtype=bool)
    bc_mask[:3, boundary >= 2] = True
    roughness = np.full((1, *shape), config["physics"]["z0"], dtype=np.float32)
    physics = config["physics"]
    extent = np.asarray(domain["model_high"]) - domain["model_low"]
    theta = math.radians(direction)
    conditions = np.asarray([physics["rho"], physics["mu"], *extent, speed,
                             math.sin(theta), math.cos(theta), physics["zref"],
                             physics["z0"], physics["displacement"]], dtype=np.float32)
    metadata = {"schema_version": SCHEMA_VERSION, "axis_order": "CZYX",
                "coordinate_order": "XYZ", "units": {"U": "m/s", "p": "Pa"},
                "pressure_reference": "OpenFOAM outlet p=0", "target_source": "OpenFOAM simpleFoam",
                "wind_direction_deg": direction,
                "wind_direction_convention": WIND_DIRECTION_CONVENTION,
                "direction_xyz": [math.cos(theta), math.sin(theta), 0],
                "geometry_transform": geometry.get("transform"),
                "wind_speed_m_s": speed, "ground_z": domain["low"][2],
                "cfd_domain_min_xyz": domain["low"], "cfd_domain_max_xyz": domain["high"],
                "qc": qc}
    if config.get("_solver_recovery") is not None:
        metadata["solver_recovery"] = json.loads(json.dumps(config["_solver_recovery"]))
    atomic_npz(destination, boundary_type=boundary, bc_values=bc_values, bc_mask=bc_mask,
               roughness=roughness, conditions=conditions, target=target,
               fluid_mask=fluid[None], valid_mask=valid[None],
               origin=np.asarray(domain["model_low"], dtype=np.float64),
               spacing=np.asarray(domain["spacing"], dtype=np.float64),
               metadata=np.asarray(json.dumps(metadata, ensure_ascii=False)))
    return {"wind_direction_convention": metadata["wind_direction_convention"],
            "direction_xyz": metadata["direction_xyz"],
            "valid_fluid_cells": int(valid.sum()), "solid_cells": int((~fluid).sum())}


def _archive(path: Path, root: Path, names: list[str]) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    try:
        with tarfile.open(temporary, "w:gz", compresslevel=1) as archive:
            for name in names:
                source = root / name
                if not source.exists():
                    raise RuntimeError(f"CFD artifact to preserve is missing: {source}.")
                archive.add(source, arcname=name, recursive=True)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def _unarchive_mesh(path: Path, destination: Path) -> None:
    with tarfile.open(path, "r:gz") as archive:
        for member in archive.getmembers():
            if member.name.startswith("constant/polyMesh/"):
                resolved = (destination / member.name).resolve()
                if destination.resolve() not in resolved.parents or member.issym() or member.islnk():
                    raise RuntimeError("Shared mesh archive contains unsafe paths.")
                archive.extract(member, destination, filter="data")






def _case_split(direction: float, speed: float, options: dict) -> str:
    if ("validation_wind_directions_deg" in options
            or "test_wind_directions_deg" in options):
        if direction in options.get("validation_wind_directions_deg", []):
            return "val"
        if direction in options.get("test_wind_directions_deg", []):
            return "test"
        return "train"
    return "val" if (direction, speed) == (72, 8) else "test" if (direction, speed) == (216, 8) else "train"


def _archive_members(archive: tarfile.TarFile) -> dict:
    """아카이브의 실제 경로와 일반 파일 형식을 확인

    Args:
        archive: 검사할 CFD 아카이브

    Returns:
        dict: 중복이나 특수 경로가 없는 멤버 목록
    """
    result = {}
    for member in archive.getmembers():
        name = member.name.rstrip("/")
        if (not name or Path(name).is_absolute() or ".." in Path(name).parts
                or name in result or not (member.isfile() or member.isdir())):
            raise RuntimeError("CFD archive contains duplicate or unsafe paths.")
        result[name] = member
    return result


def _archive_bytes(archive: tarfile.TarFile, members: dict, name: str) -> bytes:
    """검사한 아카이브의 일반 파일만 직접 읽음

    Args:
        archive: 검사할 CFD 아카이브
        members: 안전성을 확인한 멤버 목록
        name: 읽을 실제 상대 경로

    Returns:
        bytes: 요청한 파일의 실제 바이트
    """
    member = members.get(name)
    if member is None or not member.isfile() or member.size <= 0:
        raise RuntimeError(f"CFD archive file is missing or empty: {name}.")
    with archive.extractfile(member) as stream:
        return stream.read()


def _validate_flow_values(read_bytes, domain: dict, direction: float,
                          speed: float, config: dict, *, solver: bool = True) -> None:
    """실제 물성 및 경계와 수치 사전을 현재 설정과 직접 비교

    Args:
        read_bytes: 실제 사례의 상대 경로를 읽는 함수
        domain: 실제 격자 영역
        direction: 풍향
        speed: 풍속
        config: 검증할 물리 설정과 수치 정책
        solver: 종료 조건과 실효 솔버 사전도 비교할지 여부
    """
    with tempfile.TemporaryDirectory(prefix="flowcast3d-case-values-") as temporary:
        template = Path(temporary)
        _write_flow_case(template, domain, direction, speed, config)
        names = ["constant/transportProperties", "constant/turbulenceProperties",
                 "system/fvSchemes", "system/decomposeParDict"]
        if solver:
            names.extend(["system/fvSolution", "system/controlDict"])
        for name in names:
            if read_bytes(name) != (template / name).read_bytes():
                raise RuntimeError(f"Actual CFD settings do not match the configured values: {name}.")
        for field in ("U", "p", "k", "epsilon", "nut"):
            name = "0/" + field
            actual = read_bytes(name).split(b"boundaryField", 1)
            expected = (template / name).read_bytes().split(b"boundaryField", 1)
            if len(actual) != 2 or actual[1] != expected[1]:
                raise RuntimeError(f"Actual atmospheric boundary values differ: {name}.")


def _validate_mesh_archive(path: Path, geometry: dict, config: dict) -> dict:
    """공통 격자의 실제 형상 기록과 사전 및 품질 결과를 확인

    Args:
        path: 보관한 공통 격자 아카이브
        geometry: 현재 원본과 변환 조건
        config: 실제 격자 설정

    Returns:
        dict: 보관된 실제 격자 품질 결과
    """
    if not path.is_file() or path.is_symlink():
        raise RuntimeError("Shared mesh archive must be a regular file.")
    with tarfile.open(path, "r:gz") as archive:
        members = _archive_members(archive)
        archived = _plain_values(json.loads(_archive_bytes(archive, members, "geometry.json")))
        if archived != _plain_values(geometry):
            raise RuntimeError("Shared mesh geometry values differ from the current source record.")
        for name in ("points", "faces", "owner", "neighbour", "boundary"):
            member = members.get("constant/polyMesh/" + name)
            if member is None or not member.isfile() or member.size <= 0:
                raise RuntimeError("Shared mesh finite volume files are incomplete.")
        with tempfile.TemporaryDirectory(prefix="flowcast3d-mesh-values-") as temporary:
            template = Path(temporary)
            _write_mesh_case(template, geometry, config)
            for expected in (template / "system").iterdir():
                if _archive_bytes(archive, members, "system/" + expected.name) != expected.read_bytes():
                    raise RuntimeError(f"Shared mesh dictionary differs from current settings: {expected.name}.")
        qc = _mesh_qc(_archive_bytes(archive, members, "checkMesh.log").decode(errors="replace"), require_quality=True)
        qc["extended_geometry"] = _extended_mesh_diagnostics(
            _archive_bytes(archive, members, "checkMesh.geometry.log").decode(errors="replace"), qc["cells"])
        return qc


def _validate_case_outputs(item: dict, manifest: dict, preprocessed: Path,
                            raw: Path, config: dict) -> None:
    """완료 NPZ의 실제 배열과 물리 조건 및 CFD 기록을 직접 확인

    Args:
        item: 완료된 사례의 카탈로그 기록
        manifest: 형상과 격자를 포함한 카탈로그
        preprocessed: NPZ 디렉터리
        raw: CFD 아카이브 디렉터리
        config: 현재 물리 설정과 승인된 수치 정책
    """
    from .dataset import load_case

    name = item["file"]
    archived_name = item.get("raw_archive")
    if (not isinstance(name, str) or Path(name).name != name or not name.endswith(".npz")
            or archived_name != name.replace(".npz", ".tar.gz")):
        raise RuntimeError("Completed case paths do not match its actual wind conditions.")
    output, archived = preprocessed / name, raw / archived_name
    if (not output.is_file() or output.is_symlink() or not archived.is_file() or archived.is_symlink()):
        raise RuntimeError("Completed case requires regular NPZ and CFD archive files.")
    direction, speed = item["wind_direction_deg"], item["wind_speed_m_s"]
    if name != f"wind_{int(direction):03d}_speed_{int(speed):02d}.npz":
        raise RuntimeError("Completed case file name differs from wind conditions.")
    effective, recovery = _effective_case_config(config, name)
    _validate_completed_recovery(item, recovery)
    case = load_case(output)
    shape = effective["generation"]["grid_shape_zyx"]
    if list(case["boundary_type"].shape) != shape or case["target"].shape != (4, *shape):
        raise RuntimeError("Completed NPZ array shape differs from the output grid.")
    geometry = manifest["geometry"]
    domain = _domain(geometry, effective["generation"])
    physics = effective["physics"]
    angle = math.radians(direction)
    extent = np.asarray(domain["model_high"]) - domain["model_low"]
    conditions = np.asarray([physics["rho"], physics["mu"], *extent, speed,
        math.sin(angle), math.cos(angle), physics["zref"], physics["z0"], physics["displacement"]], dtype=np.float32)
    if (not np.array_equal(case["conditions"], conditions)
            or not np.array_equal(case["origin"], domain["model_low"])
            or not np.array_equal(case["spacing"], domain["spacing"])
            or not np.all(case["roughness"] == np.float32(physics["z0"]))):
        raise RuntimeError("NPZ physical conditions or grid coordinates differ from current values.")
    if (not np.isfinite(case["target"]).all()
            or not np.array_equal(case["valid_mask"], case["fluid_mask"] & np.isfinite(case["target"]).all(axis=0)[None])
            or np.any(case["target"][:, ~case["fluid_mask"][0]] != 0)
            or int(case["valid_mask"].sum()) != item["valid_fluid_cells"]
            or int((~case["fluid_mask"]).sum()) != item["solid_cells"]):
        raise RuntimeError("NPZ target validity or recorded fluid and solid cell counts differ.")
    metadata = _plain_values(case["metadata"])
    if (metadata.get("wind_direction_deg") != direction or metadata.get("wind_speed_m_s") != speed
            or metadata.get("geometry_transform") != geometry.get("transform")
            or metadata.get("wind_direction_convention") != WIND_DIRECTION_CONVENTION
            or metadata.get("qc") != item.get("qc")
            or metadata.get("solver_recovery") != _plain_values(item.get("solver_recovery"))):
        raise RuntimeError("NPZ case metadata differs from actual catalog values.")
    if (metadata.get("schema_version") != SCHEMA_VERSION or metadata.get("axis_order") != "CZYX"
            or metadata.get("coordinate_order") != "XYZ"
            or metadata.get("units") != {"U": "m/s", "p": "Pa"}
            or metadata.get("target_source") != "OpenFOAM simpleFoam"
            or not np.allclose(metadata.get("direction_xyz"), [math.cos(angle), math.sin(angle), 0], rtol=0, atol=1e-15)):
        raise RuntimeError("NPZ units, coordinate conventions or wind direction differ.")
    with tarfile.open(archived, "r:gz") as archive:
        members = _archive_members(archive)

        def read(relative):
            return _archive_bytes(archive, members, relative)

        if any(name.startswith("processor") or name.startswith("constant/polyMesh") for name in members):
            raise RuntimeError("Case archive contains intermediate MPI files or a different mesh.")
        qc = json.loads(read("qc.json"))
        if qc != item.get("qc"):
            raise RuntimeError("Actual archived QC differs from NPZ and catalog values.")
        _validate_flow_values(read, domain, direction, speed, effective)
        log_bytes = read("simpleFoam.log")
        text = log_bytes.decode("utf-8", errors="replace")
        times = re.findall(r"^Time = ([0-9.eE+-]+)\s*$", text, re.M)
        announced = re.findall(r"SIMPLE solution converged in ([0-9.eE+-]+) iterations", text)
        if (not times or not announced or not re.search(r"^End\s*$", text, re.M)
                or float(times[-1]) != float(announced[-1]) or float(times[-1]) != qc["iterations"]):
            raise RuntimeError("Actual solver log lacks matching strict convergence and normal completion.")
        stages = list(re.finditer(r"^Time = ([0-9.eE+-]+)\s*$", text, re.M))
        notices = list(re.finditer(r"SIMPLE solution converged in ([0-9.eE+-]+) iterations", text))
        endings = list(re.finditer(r"^End\s*$", text, re.M))
        if (not re.search(r"\bVersion:\s*(?:v)?2606\b", text)
                or not stages[-1].start() < notices[-1].start() < endings[-1].start()):
            raise RuntimeError("Actual solver version or convergence and completion order differs.")
        with tempfile.TemporaryDirectory(prefix="flowcast3d-completed-log-") as temporary:
            log = Path(temporary) / "simpleFoam.log"
            log.write_bytes(log_bytes)
            parsed = _solver_qc(log, effective["generation"]["residuals"])
        if not parsed["convergence_announced"] or any(qc.get(key) != value for key, value in parsed.items()):
            raise RuntimeError("Actual strict solver residuals differ from recorded QC.")
        imbalance = qc.get("flux_imbalance")
        if (type(imbalance) not in (int, float) or not math.isfinite(imbalance)
                or not 0 <= imbalance <= effective["generation"]["flux_tolerance"]):
            raise RuntimeError("Recorded boundary flux imbalance exceeds the strict limit.")
        signed = qc.get("boundary_flux_m3_s", {})
        if set(signed) != set(PATCHES) or not all(math.isfinite(value) for value in signed.values()):
            raise RuntimeError("Recorded actual boundary flux values are incomplete or nonfinite.")
        final = times[-1]
        for field in ("U", "p", "nut", "k", "epsilon", "phi"):
            member = members.get(final + "/" + field)
            if member is None or not member.isfile() or member.size <= 0:
                raise RuntimeError("Completed CFD native field files are incomplete.")
        archived_recovery = (_plain_values(json.loads(read("solver_recovery.json")))
                             if "solver_recovery.json" in members else None)
        if archived_recovery != _plain_values(item.get("solver_recovery")):
            raise RuntimeError("Archived recovery values differ from NPZ and catalog values.")
        if archived_recovery is not None:
            _validate_recovery_record(archived_recovery, config, name)
            for attempt in archived_recovery["attempts"]:
                relative = attempt.get("log_file")
                if relative is not None and len(read(relative)) != attempt["log_bytes"]:
                    raise RuntimeError("Archived attempt log size differs from the preserved record.")
            last = archived_recovery["attempts"][-1]
            if last["status"] != "complete" or read(last["log_file"]) != log_bytes:
                raise RuntimeError("Completed attempt log differs from the actual final solver log.")


def _validate_completed_cases(manifest: dict, preprocessed: Path, raw: Path, config: dict) -> None:
    """기존 완료 사례와 격자를 실제 경로와 물리 값으로 확인

    Args:
        manifest: 현재 또는 과거 카탈로그
        preprocessed: NPZ 디렉터리
        raw: CFD 아카이브 디렉터리
        config: 실제 물리 설정과 승인된 수치 정책
    """
    names = set()
    for item in manifest["cases"]:
        name = item["file"]
        if Path(name).name != name or not name.endswith(".npz") or name in names:
            raise RuntimeError("Existing dataset manifest contains unsafe or duplicate file names.")
        names.add(name)
        if item.get("status") == "complete":
            _validate_case_outputs(item, manifest, preprocessed, raw, config)
    _validate_mesh_archive(raw / "mesh.tar.gz", manifest["geometry"], config)


def _validate_collection_source(manifest: dict, source: Path, source_info: dict,
                                transform: dict) -> None:
    """원본의 실제 경로와 크기 및 변환 조건을 확인

    Args:
        manifest: 보존한 카탈로그
        source: 현재 원본 경로
        source_info: 현재 검사한 원본 파일 정보
        transform: 실제 좌표 변환 조건
    """
    geometry = manifest.get("geometry", {})
    for key in ("source_path", "size_bytes", "mtime_ns", "zip_member"):
        if geometry.get(key) != source_info.get(key):
            raise RuntimeError(f"Preserved source geometry value differs: {key}.")
    if geometry.get("transform") != transform:
        raise RuntimeError("Preserved source coordinate transform has changed.")
    if _stat(source) != (source_info["size_bytes"], source_info["mtime_ns"]):
        raise RuntimeError("Source file size or modification time changed during validation.")


def _validate_seed_manifest(manifest: dict, config: dict, source: Path,
                            source_info: dict, transform: dict, expected_names: set[str],
                            preprocessed: Path, raw: Path) -> None:
    """초기 자료의 실제 조건과 산출물을 확인하고 확장 가능성을 검사

    Args:
        manifest: 초기 카탈로그
        config: 현재 수집의 실제 물리 설정
        source: 실제 원본 경로
        source_info: 원본 파일 정보
        transform: 실제 좌표 변환 조건
        expected_names: 확장 후 허용할 사례 파일명
        preprocessed: NPZ 디렉터리
        raw: CFD 아카이브 디렉터리
    """
    if (manifest.get("schema_version") != SCHEMA_VERSION
            or manifest.get("generation", {}).get("status") != "complete"
            or not manifest.get("cases")
            or any(item.get("status") != "complete" for item in manifest["cases"])):
        raise RuntimeError("Only a completed seed dataset manifest can be extended.")
    names = {item["file"] for item in manifest["cases"]}
    if not names <= expected_names:
        raise RuntimeError("Extended conditions cannot exclude existing dataset conditions.")
    for item in manifest["cases"]:
        expected = f"wind_{int(item['wind_direction_deg']):03d}_speed_{int(item['wind_speed_m_s']):02d}.npz"
        if item["file"] != expected:
            raise RuntimeError("Seed dataset file names do not match atmospheric conditions.")
    _validate_collection_source(manifest, source, source_info, transform)
    _validate_completed_cases(manifest, preprocessed, raw, config)


def _require_openfoam(config: dict) -> None:
    environment = openfoam_environment()
    commands = ["surfaceCheck", "blockMesh", "snappyHexMesh", "checkMesh", "simpleFoam"]
    if int(config["generation"]["mpi_ranks"]) > 1:
        commands += ["mpirun", "decomposePar", "reconstructPar"]
    missing = [command for command in commands
               if shutil.which(command, path=environment.get("PATH", "")) is None]
    if missing:
        raise RuntimeError("OpenFOAM container environment is required. Missing commands: " + ", ".join(missing))
    version = environment.get("WM_PROJECT_VERSION", "")
    if version not in {"v2606", "2606"}:
        raise RuntimeError(f"OpenFOAM v2606 is required. Current version: {version}.")


def _defaults(config: dict) -> dict:
    config = json.loads(json.dumps(config))
    for key in ("data", "source"):
        config["paths"][key] = str(Path(config["paths"][key]).resolve())
    config.setdefault("generation", {})
    options = config["generation"]
    for key, value in {
        "wind_directions_deg": [0, 72, 144, 216, 288], "wind_speeds_m_s": [3, 8],
        "grid_shape_zyx": [64, 128, 128], "mpi_ranks": 4, "max_iterations": 5000,
        "residuals": {"p": 1e-4, "U": 1e-5, "k": 1e-5, "epsilon": 1e-5},
        "flux_tolerance": 0.01,
    }.items():
        options.setdefault(key, value)
    options.update(_flow_numerics(options))
    physics = config.setdefault("physics", {})
    for key, value in {"rho": 1.225, "mu": 1.81e-5, "zref": 10.0, "z0": 0.1,
                       "displacement": 0.0, "kappa": 0.4, "Cmu": 0.09,
                       "sigma_epsilon": 1.11}.items():
        physics.setdefault(key, value)
    if not all(physics[name] > 0 for name in ("rho", "mu", "zref", "z0", "kappa", "Cmu")):
        raise ValueError("Atmospheric conditions and material properties must be positive.")
    if physics["displacement"] != 0:
        raise ValueError("Initial neutral atmosphere cases only support displacement=0.")
    validate_generation_conditions(options)
    _validate_solver_recoveries(config)
    return config


def _generate_unlocked(config: dict, run_dir: Path) -> dict:
    """실제 조건과 품질 값을 확인하며 CFD 생성과 재개를 수행

    Args:
        config: 수집 물리 설정과 승인된 복구 정책
        run_dir: 현재 실행 결과 디렉터리

    Returns:
        dict: 완료 상태와 실제 수집 통계
    """
    # 설정과 해석 도구 확인
    config = _defaults(config)
    _require_openfoam(config)
    update_metrics(run_dir, "environment", {"openfoam": openfoam_environment()["WM_PROJECT_VERSION"]})
    started = time.monotonic()
    run_dir = Path(run_dir)
    raw = Path(config["paths"]["data"]) / "raw"
    preprocessed = Path(config["paths"]["data"]) / "preprocessed"
    raw.mkdir(parents=True, exist_ok=True)
    preprocessed.mkdir(parents=True, exist_ok=True)
    manifest_name = config["generation"].get("manifest_name", "manifest.json")
    seed_name = config["generation"].get("seed_manifest_name")
    manifest_path = preprocessed / manifest_name
    target_existed = manifest_path.exists()

    # 실제 원본과 변환 및 수집 조건 확인
    source, metadata, source_info = _wait_for_source(config, run_dir)
    transform = _transform_options(config, metadata)
    collection = manifest_name != "manifest.json" or seed_name is not None
    expected_names = {f"wind_{int(direction):03d}_speed_{int(speed):02d}.npz"
                      for direction in config["generation"]["wind_directions_deg"]
                      for speed in config["generation"]["wind_speeds_m_s"]}
    if not set(config.get("solver_recoveries", {})) <= expected_names:
        raise ValueError("Recovery policy case is not included in the current collection conditions.")
    source_verified = False

    # 수집 카탈로그 복원
    if not manifest_path.exists() and seed_name:
        seed_path = preprocessed / seed_name
        seed_bytes = seed_path.read_bytes()
        seed = json.loads(seed_bytes)
        _validate_seed_manifest(seed, config, source, source_info, transform,
                                expected_names, preprocessed, raw)
        source_verified = True
        manifest = _plain_values(json.loads(seed_bytes))
        manifest["generation"].update(status="preparing", seed_manifest_name=seed_name)
    else:
        manifest = _plain_values(_json(manifest_path)) if manifest_path.exists() else {
            "schema_version": SCHEMA_VERSION, "grid_shape_zyx": config["generation"]["grid_shape_zyx"],
            "wind_direction_convention": WIND_DIRECTION_CONVENTION,
            "cases": [], "generation": {"status": "preparing"},
        }

    # 원본과 물리 설정의 재개 호환성 확인
    if manifest.get("geometry") and not source_verified:
        _validate_collection_source(manifest, source, source_info, transform)
    if manifest["cases"] and not source_verified:
        _validate_completed_cases(manifest, preprocessed, raw, config)
    if collection:
        if manifest.get("grid_shape_zyx") != config["generation"]["grid_shape_zyx"]:
            raise RuntimeError("Output grid configuration differs from the existing dataset.")
        if not {item["file"] for item in manifest["cases"]} <= expected_names:
            raise RuntimeError("Extended conditions cannot exclude existing dataset conditions.")
        for item in manifest["cases"]:
            expected = f"wind_{int(item['wind_direction_deg']):03d}_speed_{int(item['wind_speed_m_s']):02d}.npz"
            if item["file"] != expected:
                raise RuntimeError("Dataset file names do not match atmospheric conditions.")
            if (target_existed and item["split"] != _case_split(
                    item["wind_direction_deg"], item["wind_speed_m_s"], config["generation"])):
                raise RuntimeError("Dataset splits in the existing catalog cannot be changed.")
        preserved_seed = manifest["generation"].get("seed_manifest_name")
        if preserved_seed:
            if Path(preserved_seed).name != preserved_seed or not preserved_seed.endswith(".json"):
                raise RuntimeError("Preserved seed dataset manifest path is invalid.")
            seed_path = preprocessed / preserved_seed
            seed = _plain_values(_json(seed_path))
            _validate_seed_manifest(seed, config, source, source_info, transform,
                                    expected_names, preprocessed, raw)
            if seed_name and seed_name != preserved_seed:
                raise RuntimeError("Seed dataset manifest has changed for resume.")

    # 완료 결과의 복구 정책 확인
    for entry in manifest["cases"]:
        if entry.get("status") == "complete":
            _, recovery = _effective_case_config(config, entry["file"])
            _validate_completed_recovery(entry, recovery)

    # 완료 조건의 무결성 확인 후 재사용
    if (manifest["generation"].get("status") == "complete"
            and (not collection or {item["file"] for item in manifest["cases"]} == expected_names)):
        records = {item["file"]: item for item in manifest["cases"]}
        if records.keys() != expected_names:
            raise RuntimeError("Completed dataset manifest does not match the generation conditions.")
        if any(item["status"] != "complete" for item in records.values()):
            raise RuntimeError("Completed dataset manifest contains incomplete conditions.")
        if collection:
            work = raw / "work"
            if work.exists() or work.is_symlink():
                if not work.is_dir() or work.is_symlink():
                    raise RuntimeError("Unknown work path cannot be cleaned up for a completed collection.")
                if any(path.name not in {"mesh", "case"} or not path.is_dir() or path.is_symlink()
                       for path in work.iterdir()):
                    raise RuntimeError("Unknown work contents cannot be cleaned up for a completed collection.")
                case = work / "case"
                if case.exists() and not _discard_completed_case_work(
                        case, manifest, preprocessed, raw, config):
                    raise RuntimeError("Work case for the completed collection does not match the verified completion record.")
                shutil.rmtree(work)
        update_metrics(run_dir, "generation", dict(manifest["generation"], cached=True))
        return dict(manifest["generation"], cached=True)
    if collection:
        for item in manifest["cases"]:
            item["split"] = _case_split(item["wind_direction_deg"], item["wind_speed_m_s"],
                                        config["generation"])
        generation = manifest["generation"]
        generation.update(status="preparing",
                          total=len(expected_names),
                          completed=sum(item["status"] == "complete" for item in manifest["cases"]))
        generation["error"] = None
        atomic_json(manifest_path, manifest)
        update_metrics(run_dir, "generation", generation)

    # 형상 변환과 공통 격자 준비
    work = raw / "work"
    work.mkdir(exist_ok=True)
    mesh_case = work / "mesh"
    mesh_archive = raw / "mesh.tar.gz"
    geometry = manifest.get("geometry")
    if not geometry:
        signature = _stat(source)
        with _obj_stream(source, source_info["zip_member"]) as stream:
            geometry = _convert_obj(stream, mesh_case / "constant/triSurface/urban.obj", transform)
        if signature != _stat(source):
            raise SourceNotReadyError("Source file changed during OBJ conversion.")
        geometry.update(source_info)
        geometry["transform"] = transform
        geometry["source_preserved"] = True
        geometry["surface_simplified"] = False
        manifest["geometry"] = geometry
        atomic_json(manifest_path, manifest)
    domain = _domain(geometry, config["generation"])
    if config["generation"].get("validate_abl", True) and not manifest["generation"].get("abl_validation"):
        manifest["generation"]["abl_validation"] = _validate_abl(work, geometry, config)
        atomic_json(manifest_path, manifest)
    if not mesh_archive.exists():
        surface = mesh_case / "constant/triSurface/urban.obj"
        if not surface.exists():
            with _obj_stream(source, source_info["zip_member"]) as stream:
                reconstructed = _convert_obj(stream, surface, transform)
            if any(reconstructed[key] != geometry[key] for key in
                   ("bounds_min_xyz", "bounds_max_xyz", "vertices", "faces")):
                raise RuntimeError("Actual source geometry bounds or topology counts have changed.")
        _write_mesh_case(mesh_case, geometry, config)
        _run(["surfaceCheck", str(surface)], mesh_case, "surfaceCheck.log")
        surface_qc = _surface_qc(mesh_case / "surfaceCheck.log")
        _run(["blockMesh"], mesh_case, "blockMesh.log")
        _run(["snappyHexMesh", "-overwrite"], mesh_case, "snappyHexMesh.log")
        refinement_qc = _check_snappy_completion(mesh_case / "snappyHexMesh.log",
                                               int(config["generation"].get("max_global_cells", 5000000)))
        mesh_qc = _validate_mesh(mesh_case)
        mesh_qc.update(_validate_urban_patch(mesh_case))
        mesh_qc.update(refinement_qc)
        atomic_json(mesh_case / "geometry.json", geometry)
        _archive(mesh_archive, mesh_case, ["constant/polyMesh", "system", "geometry.json",
                                         "surfaceCheck.log", "blockMesh.log", "snappyHexMesh.log", "checkMesh.log",
                                         "checkMesh.geometry.log"])
        manifest["generation"].update(mesh_qc)
        manifest["generation"]["surface_validation"] = surface_qc
        atomic_json(manifest_path, manifest)
    else:
        qc = _validate_mesh_archive(mesh_archive, geometry, config)
        if manifest["generation"].get("cells", qc["cells"]) != qc["cells"]:
            raise RuntimeError("Actual mesh cell count differs from the catalog.")
        manifest["generation"].update(qc)
        atomic_json(manifest_path, manifest)
    if not (mesh_case / "constant/polyMesh").exists():
        _unarchive_mesh(mesh_archive, mesh_case)
        _write_mesh_case(mesh_case, geometry, config)
    _validate_urban_patch(mesh_case)
    _prepare_mesh_decomposition(mesh_case, int(config["generation"]["mpi_ranks"]))

    # 완료 사례 보존과 중단 사례 준비
    for direction in config["generation"]["wind_directions_deg"]:
        for speed in config["generation"]["wind_speeds_m_s"]:
            name = f"wind_{int(direction):03d}_speed_{int(speed):02d}"
            output = preprocessed / f"{name}.npz"
            archived = raw / f"{name}.tar.gz"
            effective_config, recovery = _effective_case_config(config, output.name)
            existing = next((item for item in manifest["cases"] if item["file"] == output.name), None)
            if not existing and (output.exists() or archived.exists()):
                raise RuntimeError(f"Existing dataset file outside the catalog cannot be overwritten: {name}.")
            if existing and existing.get("status") == "complete":
                continue
            case = work / "case"
            if case.is_symlink() or (case.exists() and not case.is_dir()):
                raise RuntimeError("CFD work case must be a regular directory.")
            if case.exists():
                _discard_completed_case_work(case, manifest, preprocessed, raw, config)
            condition = {"wind_direction_deg": direction, "wind_speed_m_s": speed}
            marker = _plain_values(_json(case / "condition.json")) if (case / "condition.json").is_file() else None
            resumable = marker == condition
            if recovery is not None and marker is not None:
                if {key: marker.get(key) for key in condition} != condition:
                    raise RuntimeError("Recovery work directory does not match the existing case.")
                resumable = True
            if recovery is None and (case / "solver_recovery.json").exists():
                raise RuntimeError("Approved policy cannot be removed from an active recovery case.")
            if case.exists() and not resumable:
                shutil.rmtree(case)
            if not resumable:
                case.mkdir()
                (case / "constant").mkdir()
                shutil.copytree(mesh_case / "constant/polyMesh", case / "constant/polyMesh")
                _write_flow_case(case, domain, direction, speed, config)
                _initialize_abl(case, domain, direction, speed, config)
                atomic_json(case / "condition.json", condition)
            _validate_flow_values(lambda relative: (case / relative).read_bytes(),
                                  domain, direction, speed, config, solver=False)
            if recovery is not None:
                recovery = _prepare_solver_recovery(case, config, effective_config, recovery, condition,
                    previous_recovery=existing.get("solver_recovery") if existing else None)
                effective_config["_solver_recovery"] = recovery
            record = {"file": output.name, "wind_direction_deg": direction, "wind_speed_m_s": speed,
                      "split": _case_split(direction, speed, config["generation"]), "status": "simulating"}
            if recovery is not None:
                record["solver_recovery"] = recovery
            if existing:
                manifest["cases"].remove(existing)
            manifest["cases"].append(record)
            manifest["generation"]["status"] = "simulating"
            atomic_json(manifest_path, manifest)
            case_start = time.monotonic()
            try:
                # CFD 해석과 결과 보관
                final, qc, solver_seconds = _solve(case, effective_config, mesh_case)
                if recovery is not None:
                    text = (case / "simpleFoam.log").read_text(errors="replace")
                    if (not qc.get("convergence_announced")
                            or not re.search(r"^\s*End\s*$", text, re.MULTILINE)):
                        raise RuntimeError("SIMPLE convergence notice and normal End termination could not be verified for the recovery case.")
                    _finish_solver_recovery(case, recovery, "complete", qc=qc)
                export = _export(case, final, domain, direction, speed, effective_config, output, geometry, qc)
                atomic_json(case / "qc.json", qc)
                archive_names = ["0", "system", "constant/transportProperties",
                                 "constant/turbulenceProperties", final.name, "simpleFoam.log", "qc.json"]
                if recovery is not None:
                    archive_names.extend(["solver_recovery.json", "solver_attempts"])
                _archive(archived, case, archive_names)
                record.update(export)
                record.update(status="complete", solver_seconds=solver_seconds,
                              total_seconds=time.monotonic() - case_start,
                              raw_archive=archived.name, qc=qc)

                # 카탈로그와 실행 이력 갱신
                completed = [item for item in manifest["cases"] if item["status"] == "complete"]
                average = sum(item["total_seconds"] for item in completed) / len(completed)
                total = len(config["generation"]["wind_directions_deg"]) * len(config["generation"]["wind_speeds_m_s"])
                elapsed = time.monotonic() - started
                generation_estimate = elapsed + (total - len(completed)) * average
                estimate = generation_estimate + 5 * 3600
                target_seconds = float(config.get("budget", {}).get("target_hours", 24)) * 3600
                manifest["generation"].update(status="simulating", completed=len(completed),
                                              total=total,
                                              elapsed_seconds=elapsed,
                                              estimated_generation_seconds=generation_estimate,
                                              estimated_pipeline_seconds=estimate,
                                              target_seconds=target_seconds,
                                              estimated_within_target=estimate <= target_seconds,
                                              budget_policy="quality_first")
                manifest["generation"]["error"] = None
                atomic_json(manifest_path, manifest)
                update_metrics(run_dir, "generation", manifest["generation"])
                LOGGER.info("CFD %d/%d 완료, 예상 총 실행 %.1f시간", len(completed), total, estimate / 3600)
                shutil.rmtree(case)
            except Exception as error:
                if recovery is not None:
                    _finish_solver_recovery(case, recovery, "failed", error=str(error))
                record.update(status="failed", error=str(error))
                manifest["generation"].update(status="failed", error=str(error))
                atomic_json(manifest_path, manifest)
                update_metrics(run_dir, "generation", manifest["generation"])
                raise
            except KeyboardInterrupt as error:
                if recovery is not None:
                    _finish_solver_recovery(case, recovery, "interrupted", error=str(error))
                    record.update(status="interrupted", error="Recovery execution was interrupted.")
                    manifest["generation"].update(status="interrupted", error=record["error"])
                    atomic_json(manifest_path, manifest)
                    update_metrics(run_dir, "generation", manifest["generation"])
                raise

    # 완료 상태 저장과 임시 작업 정리
    manifest["generation"].update(status="complete", total=len(expected_names),
                                  completed=sum(item["status"] == "complete" for item in manifest["cases"]),
                                  elapsed_seconds=time.monotonic() - started)
    manifest["generation"]["error"] = None
    atomic_json(manifest_path, manifest)
    update_metrics(run_dir, "generation", manifest["generation"])
    shutil.rmtree(work)
    return manifest["generation"]


def generate(config: dict, run_dir: Path) -> dict:
    """공유 데이터 디렉터리를 잠그고 CFD 생성 또는 재개"""
    raw = Path(config["paths"]["data"]) / "raw"
    raw.mkdir(parents=True, exist_ok=True)
    with directory_lock(raw):
        return _generate_unlocked(config, run_dir)
