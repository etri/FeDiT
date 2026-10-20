import glob
import os
from array import array
from itertools import pairwise

import numpy as np

STL_HEADER = 84  # 설명 80바이트 + 삼각형 수 uint32
STL_RECORD = np.dtype([("normal", "<f4", 3), ("vertices", "<f4", (3, 3)), ("attribute", "<u2")])


def mesh_files(paths):
    if isinstance(paths, (str, os.PathLike)):
        paths = [paths]
    files = []
    for item in map(str, paths):
        # 글롭 문자가 포함돼도 실제 경로가 있으면 우선 사용
        found = [item] if os.path.exists(item) else sorted(glob.glob(item, recursive=True))
        if not found:
            raise FileNotFoundError(f"no mesh file matches {item}")
        files += found
    return files


def iter_triangles(paths, chunk=200_000, transform=None):
    if transform is not None:
        transform = np.asarray(transform, dtype=np.float64)
    for path in mesh_files(paths):
        extension = os.path.splitext(path)[1].lower()
        if extension not in (".obj", ".stl"):
            raise ValueError(f"unsupported mesh format: {path}")
        count = 0
        for triangles in (_read_obj if extension == ".obj" else _read_stl)(path, chunk):
            if transform is not None:
                triangles = (triangles.reshape(-1, 3) @ transform[:3, :3].T + transform[:3, 3]).reshape(
                    -1, 3, 3
                )
            triangles = triangles[np.isfinite(triangles).all(axis=(1, 2))]
            count += len(triangles)
            if len(triangles):
                yield triangles
        if not count:
            raise ValueError(f"{path}: no triangles")


def mesh_bounds(paths, chunk=200_000, transform=None):
    low, high = np.full(3, np.inf), np.full(3, -np.inf)
    for triangles in iter_triangles(paths, chunk, transform):
        low = np.minimum(low, triangles.min(axis=(0, 1)))
        high = np.maximum(high, triangles.max(axis=(0, 1)))
    return low, high


def _read_stl(path, chunk):
    with open(path, "rb") as file:
        head = file.read(STL_HEADER)
    count = int.from_bytes(head[80:], "little")
    # solid 헤더도 바이너리일 수 있어 파일 크기로 먼저 판별
    if len(head) == STL_HEADER and os.path.getsize(path) == STL_HEADER + count * STL_RECORD.itemsize:
        return _read_binary_stl(path, count, chunk)
    if head.lstrip().lower().startswith(b"solid"):
        return _read_ascii_stl(path, chunk)
    # 손상된 바이너리 STL을 텍스트로 읽어 메모리가 늘지 않도록 거절
    raise ValueError(
        f"{path}: the size of this binary STL does not match its triangle count (truncated file?)"
    )


def _read_binary_stl(path, count, chunk):
    with open(path, "rb") as file:
        file.seek(STL_HEADER)
        for start in range(0, count, chunk):
            records = np.fromfile(file, STL_RECORD, min(chunk, count - start))
            yield records["vertices"].astype(np.float64)


def _read_ascii_stl(path, chunk):
    values = array("d")
    with open(path, encoding="ascii", errors="replace") as file:
        for line in file:
            parts = line.split()
            if parts and parts[0].lower() == "vertex":
                values.extend(map(float, parts[1:4]))
                if len(values) == chunk * 9:
                    yield np.array(values).reshape(-1, 3, 3)
                    values = array("d")
    if len(values) % 9:
        raise ValueError(f"{path}: the number of vertex lines is not a multiple of 3")
    if values:
        yield np.array(values).reshape(-1, 3, 3)


def _read_obj(path, chunk):
    # 임의 정점 참조를 위해 꼭짓점만 메모리에 모으고 면은 스트리밍
    values = array("d")
    with open(path, encoding="utf-8", errors="replace") as file:
        for line in file:
            if line.startswith(("v ", "v\t")):
                values.extend(map(float, line.split()[1:4]))
    vertices = np.array(values).reshape(-1, 3)
    del values

    corners = array("q")
    seen = 0  # 음수 정점 번호의 기준
    with open(path, encoding="utf-8", errors="replace") as file:
        for line in file:
            if line.startswith(("v ", "v\t")):
                seen += 1
            elif line.startswith(("f ", "f\t")):
                # 정점 번호만 읽고 다각형은 부채꼴로 삼각 분할
                face = [int(token.split("/")[0]) for token in line.split()[1:]]
                if 0 in face:
                    raise ValueError(f"{path}: face index 0 (OBJ indices start at 1)")
                face = [index - 1 if index > 0 else seen + index for index in face]
                for second, third in pairwise(face[1:]):
                    corners.extend((face[0], second, third))
                while len(corners) >= chunk * 3:
                    yield _gather(path, vertices, corners[: chunk * 3])
                    del corners[: chunk * 3]
    if corners:
        yield _gather(path, vertices, corners)


def _gather(path, vertices, corners):
    index = np.array(corners).reshape(-1, 3)
    if index.size and (index.min() < 0 or index.max() >= len(vertices)):
        raise ValueError(f"{path}: a face refers to a vertex that does not exist")
    return vertices[index]
