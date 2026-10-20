import re
from pathlib import Path

import numpy as np

from modules.domain.coordinates import apply, mesh_matrix
from modules.visualization.geometry import citymesh

GEOMETRY = (".obj", ".stl")
CONVERTED = (".vtk", ".vtp")
ACCEPTED = (*GEOMETRY, *CONVERTED)
UNITS = {"m": 1.0, "cm": 0.01, "mm": 0.001}
# STL float32 좌표 오차가 1 cm를 넘는 크기(m)
# 큰 투영 좌표는 OBJ 텍스트로 보존
FLOAT32_LIMIT = 1e5
STL_CHUNK = 1 << 20  # 한 번에 읽는 STL 삼각형 수
HEAD = 1 << 20
MAX_CASE_ID = 40
CANDIDATES = 99


def file_name(name):
    base = re.split(r"[\\/]", str(name))[-1]
    stem, dot, suffix = base.rpartition(".")
    if not dot or f".{suffix.lower()}" not in ACCEPTED:
        raise ValueError(f"unsupported mesh file: {base!r}")
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", stem).strip("._-")[:80] or "mesh"
    return f"{stem}.{suffix.lower()}"


def slug(text):
    """Case ID에 허용한 문자만 남기며 없으면 빈 문자열 반환"""
    text = re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9_-]+", "-", str(text).lower()))
    return text.strip("-_")[:MAX_CASE_ID].strip("-_")


def case_ids(*texts):
    base = next((part for part in map(slug, texts) if part), "upload")
    yield base
    for number in range(2, CANDIDATES + 2):
        yield f"{base}-{number}"


def to_mesh(source):
    """VTK 표면을 삼각형으로 변환하며 큰 좌표는 OBJ로 보존"""
    import pyvista as pv

    try:
        data = pv.read(source)
    except (ValueError, OSError, RuntimeError, TypeError, KeyError) as error:
        raise ValueError(f"{source.name} is not a readable VTK file: {error}") from None
    if data is None:
        raise ValueError(f"{source.name} is not a readable VTK file")
    # 다중 블록은 표면만 추출하며 VTK 알고리즘을 고정해 경고 방지
    surface = data if isinstance(data, pv.PolyData) else data.extract_surface(algorithm="dataset_surface")
    surface = surface.triangulate()
    faces = surface.regular_faces if surface.n_faces else np.empty((0, 3), dtype=int)
    if not len(faces):
        raise ValueError(f"{source.name} has no surface faces")
    points = np.asarray(surface.points, dtype=np.float64)
    if not np.isfinite(points).all():
        raise ValueError(f"{source.name} has vertices that are not finite numbers")
    if faces.min() < 0 or faces.max() >= len(points):
        raise ValueError(f"{source.name} has faces pointing at vertices that do not exist")
    if np.abs(points).max() > FLOAT32_LIMIT:
        target = source.with_suffix(".obj")
        with open(target, "w") as file:
            file.write(f"# converted from {source.name} by flowcast-viewer\n")
            np.savetxt(file, points, fmt="v %.17g %.17g %.17g")
            np.savetxt(file, faces + 1, fmt="f %d %d %d")
        return target
    target = source.with_suffix(".stl")
    pv.PolyData.from_regular_faces(points, faces).save(target, binary=True)
    return target


def extent(path):
    """면이 참조하는 정점의 범위와 삼각형 수 계산"""
    if path.suffix.lower() == ".stl":
        with open(path, "rb") as file:
            head = file.read(84)
            count = int.from_bytes(head[80:84], "little")
            if len(head) == 84 and path.stat().st_size == 84 + citymesh.STL_RECORD.itemsize * count:
                if not count:
                    raise ValueError(f"{path.name}: no triangles")
                low, high = np.full(3, np.inf), np.full(3, -np.inf)
                for start in range(0, count, STL_CHUNK):
                    records = np.fromfile(file, citymesh.STL_RECORD, min(STL_CHUNK, count - start))
                    corners = records["vertices"].reshape(-1, 3).astype(np.float64)
                    low, high = np.minimum(low, corners.min(axis=0)), np.maximum(high, corners.max(axis=0))
                return low, high, count
    mesh = citymesh.read_meshes([path])
    used = mesh.vertices[np.unique(mesh.faces)]
    return used.min(axis=0), used.max(axis=0), len(mesh.faces)


def check_format(path):
    with open(path, "rb") as file:
        head = file.read(HEAD)
    if path.suffix.lower() == ".obj":
        valid = re.search(rb"^v\s", head, re.MULTILINE) is not None
    else:
        size = 84 + citymesh.STL_RECORD.itemsize * int.from_bytes(head[80:84], "little")
        valid = (len(head) >= 84 and path.stat().st_size == size) or head.lstrip().startswith(b"solid")
    if not valid:
        raise ValueError(f"{path.name} does not look like a {path.suffix.lower()[1:].upper()} mesh")


def prepare_geometry(path, up_axis="z", scale=1.0):
    path = Path(path)
    if path.suffix.lower() in CONVERTED:
        path = to_mesh(path)
    if path.suffix.lower() not in GEOMETRY:
        raise ValueError(f"unsupported mesh file: {path.name}")
    check_format(path)
    try:
        low, high, faces = extent(path)
    except ValueError as error:
        raise ValueError(str(error).replace(str(path), path.name)) from None
    # 축 교환과 배율만 있으므로 상자 꼭짓점 8개로 범위 계산
    corners = np.array(
        [[x, y, z] for x in (low[0], high[0]) for y in (low[1], high[1]) for z in (low[2], high[2])]
    )
    points = apply(mesh_matrix(up_axis, scale=scale), corners)
    if not np.isfinite(points).all():
        raise ValueError(f"{path.name} has vertices that are not finite numbers")
    if np.ptp(points[:, 2]) <= 0:
        raise ValueError(f"{path.name} is flat: the shape has no height along the chosen up axis")
    return path, faces
