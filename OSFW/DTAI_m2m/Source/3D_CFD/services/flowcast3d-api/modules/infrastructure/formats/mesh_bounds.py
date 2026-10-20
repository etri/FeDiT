from pathlib import Path

import numpy as np

from modules.domain.coordinates import apply
from modules.domain.errors import MeshError
from modules.infrastructure.mongo.storage import asset_info, open_asset

STL_HEADER = 84  # 설명 80바이트 + 삼각형 수 uint32
STL_RECORD = np.dtype([("normal", "<f4", 3), ("vertices", "<f4", (3, 3)), ("attribute", "<u2")])
CHUNK = 1 << 18  # 한 번에 읽을 정점 또는 삼각형 수


def _open(path):
    if path.resolve().is_relative_to(Path("/tmp")) and path.is_file():
        return open(path, "rb")
    return open_asset(path)


def _size(path):
    if path.resolve().is_relative_to(Path("/tmp")) and path.is_file():
        return path.stat().st_size
    document = asset_info(path)
    if document is None:
        raise FileNotFoundError(str(path))
    return document["size"]


def mesh_bounds(paths, matrix):
    low, high = np.full(3, np.inf), np.full(3, -np.inf)
    for path in map(Path, paths):
        reader = READERS.get(path.suffix.lower())
        if reader is None:
            raise MeshError(f"unsupported mesh format: {path.name}")
        found = False
        for points in reader(path):
            points = apply(matrix, points)
            points = points[np.isfinite(points).all(axis=1)]
            if len(points):
                found = True
                low, high = np.minimum(low, points.min(axis=0)), np.maximum(high, points.max(axis=0))
        if not found:
            raise MeshError(f"{path.name} has no finite vertices")
    return low, high


def _numbers(path, rows):
    """정점의 앞 세 값을 [n, 3] 좌표로 변환"""
    try:
        points = np.array([[float(value) for value in row] for row in rows], dtype=np.float64)
    except ValueError:
        raise MeshError(f"{path.name} has a vertex line that is not three numbers") from None
    if points.ndim != 2 or points.shape[1] != 3:
        raise MeshError(f"{path.name} has a vertex line that is not three numbers")
    return points


def _obj_used(path):
    """면에서 참조하는 정점만 True인 bool 배열 반환"""
    with _open(path) as file:
        total = sum(1 for line in iter(file.readline, b"") if line.startswith((b"v ", b"v\t")))
    used = np.zeros(total, dtype=bool)

    def mark(numbers):
        numbers = np.array(numbers, dtype=np.int64)
        if numbers.min() < 0 or numbers.max() >= total:
            raise MeshError(f"{path.name} has a face pointing at a vertex that does not exist")
        used[numbers] = True

    seen, rows, faces = 0, [], 0
    with _open(path) as file:
        for line in iter(file.readline, b""):
            if line.startswith((b"v ", b"v\t")):
                seen += 1
            elif line.startswith((b"f ", b"f\t")):
                faces += 1
                for corner in line.split()[1:]:
                    try:
                        number = int(corner.split(b"/", 1)[0])
                    except ValueError:
                        raise MeshError(f"{path.name} has a face line that is not vertex numbers") from None
                    rows.append(number - 1 if number > 0 else seen + number)
                if len(rows) >= CHUNK:
                    mark(rows)
                    rows = []
    if rows:
        mark(rows)
    if not faces:
        raise MeshError(f"{path.name} has no faces")
    return used


def _obj_vertices(path):
    used = _obj_used(path)
    rows, start = [], 0
    with _open(path) as file:
        for line in iter(file.readline, b""):
            if line.startswith((b"v ", b"v\t")):
                rows.append(line.split()[1:4])
                if len(rows) == CHUNK:
                    yield _numbers(path, rows)[used[start : start + CHUNK]]
                    start += CHUNK
                    rows = []
    if rows:
        yield _numbers(path, rows)[used[start : start + len(rows)]]


def _stl_vertices(path):
    with _open(path) as file:
        head = file.read(STL_HEADER)
        count = int.from_bytes(head[80:STL_HEADER], "little")
        # solid 헤더도 바이너리일 수 있어 파일 크기로 먼저 판별
        if len(head) == STL_HEADER and _size(path) == STL_HEADER + count * STL_RECORD.itemsize:
            for start in range(0, count, CHUNK):
                raw = file.read(STL_RECORD.itemsize * min(CHUNK, count - start))
                records = np.frombuffer(raw, STL_RECORD)
                yield records["vertices"].astype(np.float64).reshape(-1, 3)
            return
        if not head.lstrip().lower().startswith(b"solid"):
            raise MeshError(f"{path.name} is neither a binary STL of the right size nor an ASCII STL")
        file.seek(0)
        rows = []
        for line in iter(file.readline, b""):
            parts = line.split()
            if parts and parts[0].lower() == b"vertex":
                rows.append(parts[1:4])
                if len(rows) == CHUNK:
                    yield _numbers(path, rows)
                    rows = []
        if rows:
            yield _numbers(path, rows)


READERS = {".obj": _obj_vertices, ".stl": _stl_vertices}
