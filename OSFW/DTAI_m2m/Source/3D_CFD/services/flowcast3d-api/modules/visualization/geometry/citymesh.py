import fcntl
import json
import os
import shutil
import tempfile
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass, field
from itertools import pairwise
from multiprocessing import get_context
from pathlib import Path

import numpy as np

from modules.domain.coordinates import apply

SCHEMA = "flowcast.meshcache/3"
BLOCK = 1 << 26  # OBJ 파싱 블록 크기(바이트)
LODS = (1.0, 0.25, 0.06)  # 상세도별 삼각형 비율이며 첫 단계는 원본
TILES = 8
MIN_FACES = 64
# 거친 실사 메시의 목표 면 수를 맞추기 위해 특징 모서리 보존 해제
FEATURE_ANGLE = 180.0
STL_RECORD = np.dtype([("normal", "<f4", 3), ("vertices", "<f4", (3, 3)), ("attribute", "<u2")])
VERTEX, FACE = 1, 2
DISK_MESH_BYTES = 256 << 20
FACE_BATCH = 131_072
MAX_TILE_FACES = 1_000_000
LOCK = "prepare.lock"  # Case별 메시와 텍스처 준비의 공용 잠금 파일
TEXTURED = "textured"


class Cancelled(Exception):
    """끝난 조각이 남아 재실행 시 이어서 진행할 수 있는 준비 중단"""


class MeshNotPrepared(FileNotFoundError):
    """mesh_cache가 없거나 원본 또는 준비 조건과 맞지 않아 prepare-mesh 실행이 필요함"""


@dataclass
class RawMesh:
    vertices: np.ndarray  # float64 [n, 3] 메시 좌표
    faces: np.ndarray  # int32 [k, 3] 정점 번호
    workspace: object = field(default=None, repr=False)


def numbers(data, dtype):
    return np.fromstring(data.tobytes(), dtype=dtype, sep=" ")


def resolve(index, before):
    return np.where(index < 0, before + index, index - 1)


def slow_faces(lines, vertices_before):
    faces = []
    for n, line in enumerate(lines):
        v = resolve(np.array([int(corner.split(b"/")[0]) for corner in line.split()[1:]]), vertices_before[n])
        faces.extend(v[[0, i, i + 1]] for i in range(1, len(v) - 1))
    return np.array(faces).reshape(-1, 3)


def obj_blocks(path, progress=None, should_stop=None):
    """OBJ를 제한된 크기로 읽고 블록별 정점과 면 반환"""
    size = path.stat().st_size
    n_vertices = done = 0
    carry = b""
    with open(path, "rb") as file:
        while True:
            if should_stop and should_stop():
                raise Cancelled()
            block = file.read(BLOCK)
            if not block and not carry:
                break
            block = carry + block
            cut = len(block) if len(block) < BLOCK else block.rfind(b"\n") + 1
            carry, block = block[cut:], block[:cut]
            if len(carry) > (1 << 20):
                raise ValueError(f"{path.name}: OBJ line exceeds 1 MiB")
            if not block.endswith(b"\n"):
                block += b"\n"
            data = np.frombuffer(block, dtype=np.uint8).copy()
            ends = np.flatnonzero(data == 10)
            starts = np.concatenate([[0], ends[:-1] + 1])
            heads = starts.copy()
            while (indented := (data[heads] == 32) | (data[heads] == 9)).any():
                heads[indented] += 1
            first, second = data[heads], data[np.minimum(heads + 1, len(data) - 1)]
            blank = (second == 32) | (second == 9)
            kind = np.zeros(len(starts), dtype=np.uint8)
            kind[(first == ord("v")) & blank] = VERTEX
            kind[(first == ord("f")) & blank] = FACE
            face_lines = np.flatnonzero(kind == FACE)

            byte_kind = np.repeat(kind, ends - starts + 1)
            slashes = (data == ord("/")) & (byte_kind == FACE)
            has_double = bool((slashes[:-1] & slashes[1:]).any())
            data[heads[kind != 0]] = 32
            data[slashes] = 32

            positions = np.empty((0, 3), dtype=np.float64)
            triangles = np.empty((0, 3), dtype=np.int32)
            if (kind == VERTEX).any():
                values = numbers(data[byte_kind == VERTEX], np.float64)
                count = int((kind == VERTEX).sum())
                if len(values) % count or len(values) // count < 3:
                    raise ValueError(f"{path}: vertex lines with a varying number of values")
                positions = values.reshape(count, -1)[:, :3].copy()
                if not np.isfinite(positions).all():
                    raise ValueError(f"{path.name}: vertices must be finite")
            if len(face_lines):
                vertices_before = n_vertices + np.cumsum(kind == VERTEX)[face_lines]
                values = numbers(data[byte_kind == FACE], np.int64)
                # 면 형식이 같은 삼각형에만 빠른 파싱 적용
                per_line = np.add.reduceat(slashes, starts, dtype=np.int32)[face_lines]
                per_corner = 1 + int(per_line[0]) // 3 - has_double
                uniform = per_line[0] in (0, 3, 6) and (per_line == per_line[0]).all()
                if uniform and len(values) == 3 * per_corner * len(face_lines):
                    corners = values.reshape(len(face_lines), 3, per_corner)
                    v = resolve(corners[..., 0], vertices_before[:, None])
                else:
                    v = slow_faces([block[starts[line] : ends[line]] for line in face_lines], vertices_before)
                if v.size and (v.min() < 0 or v.max() > np.iinfo(np.int32).max):
                    raise ValueError(f"{path.name}: a face refers to a vertex that does not exist")
                triangles = v.astype(np.int32)
            n_vertices += int((kind == VERTEX).sum())
            done += len(block)
            if progress:
                progress("parse", min(done, size), size)
            yield positions, triangles


def disk_mesh(path):
    return path.stat().st_size >= int(os.environ.get("FLOWCAST_RENDER_DISK_MESH_BYTES", DISK_MESH_BYTES))


def read_obj(path, progress=None, should_stop=None):
    """큰 OBJ는 임시 파일에 배열을 기록하여 메모리 사용 제한"""
    if disk_mesh(path):
        workspace = tempfile.TemporaryDirectory(prefix="flowcast-mesh-")
        root = Path(workspace.name)
        counts = np.zeros(2, dtype=np.int64)
        try:
            with (root / "vertices").open("wb") as vertices, (root / "faces").open("wb") as faces:
                for points, triangles in obj_blocks(path, progress, should_stop):
                    points.tofile(vertices)
                    triangles.tofile(faces)
                    counts += (len(points), len(triangles))
            if not counts[0] or not counts[1]:
                raise ValueError(f"{path.name}: no faces")
            mesh = RawMesh(
                np.memmap(root / "vertices", dtype=np.float64, mode="r", shape=(int(counts[0]), 3)),
                np.memmap(root / "faces", dtype=np.int32, mode="r", shape=(int(counts[1]), 3)),
                workspace,
            )
        except BaseException:
            workspace.cleanup()
            raise
    else:
        blocks = list(obj_blocks(path, progress, should_stop))
        mesh = RawMesh(
            np.concatenate([np.empty((0, 3)), *[p for p, _ in blocks]]),
            np.concatenate([np.empty((0, 3), dtype=np.int32), *[f for _, f in blocks]]),
        )
    if not len(mesh.faces):
        raise ValueError(f"{path.name}: no faces")
    for first in range(0, len(mesh.faces), FACE_BATCH):
        faces = mesh.faces[first : first + FACE_BATCH]
        if faces.min() < 0 or faces.max() >= len(mesh.vertices):
            raise ValueError(f"{path.name}: a face refers to a vertex that does not exist")
    return mesh


def read_stl(path, progress=None, should_stop=None):
    """STL 삼각형을 읽으며 원본 좌표 보존"""
    with open(path, "rb") as file:
        header = file.read(84)
        count = int.from_bytes(header[80:84], "little")
        if disk_mesh(path) and len(header) == 84 and path.stat().st_size == 84 + STL_RECORD.itemsize * count:
            workspace = tempfile.TemporaryDirectory(prefix="flowcast-stl-")
            root = Path(workspace.name)
            vertices = np.memmap(root / "vertices", dtype=np.float64, mode="w+", shape=(3 * count, 3))
            faces = np.memmap(root / "faces", dtype=np.int32, mode="w+", shape=(count, 3))
            for first in range(0, count, FACE_BATCH):
                if should_stop and should_stop():
                    raise Cancelled()
                size = min(FACE_BATCH, count - first)
                points = np.fromfile(file, dtype=STL_RECORD, count=size)["vertices"].reshape(-1, 3)
                if len(points) != 3 * size or not np.isfinite(points).all():
                    raise ValueError(f"{path.name}: invalid STL vertices")
                vertices[3 * first : 3 * (first + size)] = points
                faces[first : first + size] = np.arange(3 * first, 3 * (first + size)).reshape(-1, 3)
            vertices.flush()
            faces.flush()
            return RawMesh(vertices, faces, workspace)
        # solid로 시작하는 이진 STL도 있어 크기와 삼각형 수로 판별
        if len(header) == 84 and path.stat().st_size == 84 + STL_RECORD.itemsize * count:
            corners = np.fromfile(file, dtype=STL_RECORD, count=count)["vertices"].astype(np.float64)
        else:
            file.seek(0)
            rows = [line.split()[1:4] for line in file if line.lstrip().startswith(b"vertex")]
            corners = np.array(rows, dtype=np.float64).reshape(-1, 3, 3)
    if not len(corners):
        raise ValueError(f"{path}: no triangles")
    vertices, inverse = np.unique(corners.reshape(-1, 3), axis=0, return_inverse=True)
    return RawMesh(vertices=vertices, faces=inverse.reshape(-1, 3).astype(np.int32))


def read_meshes(paths, progress=None, should_stop=None):
    meshes = []
    for path in paths:
        reader = {".obj": read_obj, ".stl": read_stl}.get(path.suffix.lower())
        if reader is None:
            raise ValueError(f"unsupported mesh format: {path}")
        meshes.append(reader(path, progress, should_stop))
    if len(meshes) == 1:
        return meshes[0]
    offsets = np.cumsum([0] + [len(mesh.vertices) for mesh in meshes])
    if any(mesh.workspace is not None for mesh in meshes):
        workspace = tempfile.TemporaryDirectory(prefix="flowcast-mesh-bundle-")
        root = Path(workspace.name)
        vertices = np.memmap(root / "vertices", dtype=np.float64, mode="w+", shape=(int(offsets[-1]), 3))
        faces = np.memmap(
            root / "faces", dtype=np.int32, mode="w+", shape=(sum(len(m.faces) for m in meshes), 3)
        )
        face_offset = 0
        for mesh, offset in zip(meshes, offsets):
            for first in range(0, len(mesh.vertices), FACE_BATCH):
                vertices[offset + first : offset + first + len(mesh.vertices[first : first + FACE_BATCH])] = (
                    mesh.vertices[first : first + FACE_BATCH]
                )
            for first in range(0, len(mesh.faces), FACE_BATCH):
                block = mesh.faces[first : first + FACE_BATCH]
                faces[face_offset + first : face_offset + first + len(block)] = block + offset
            face_offset += len(mesh.faces)
        vertices.flush()
        faces.flush()
        return RawMesh(vertices, faces, workspace)
    return RawMesh(
        vertices=np.concatenate([mesh.vertices for mesh in meshes]),
        faces=np.concatenate([mesh.faces + offset for mesh, offset in zip(meshes, offsets)]),
    )


def save_tile(path, piece):
    counts = [len(piece["points"]), len(piece["faces"])]
    partial = path.with_suffix(".partial.npz")
    np.savez(partial, points=piece["points"], faces=piece["faces"], counts=np.array(counts, dtype=np.int64))
    os.replace(partial, path)
    return counts


def load_tile(path):
    with np.load(path) as tile:
        return {"points": tile["points"], "faces": tile["faces"]}


def split(mesh, up_axis, tiles, directory, progress=None, should_stop=None):
    """면 중심을 기준으로 공간 타일에 배정"""
    if mesh.workspace is not None:
        return split_disk(mesh, up_axis, tiles, directory, progress, should_stop)
    horizontal = [0, 2] if up_axis == "y" else [0, 1]
    # 드문 먼 정점은 타일 범위에서 빼고 가장자리 타일에 배정
    low, high = np.percentile(mesh.vertices, [0.1, 99.9], axis=0)
    size = max((high - low)[horizontal].max() / tiles, 1e-9)
    counts = np.maximum(np.ceil((high - low)[horizontal] / size), 1).astype(np.int64)
    anchor = np.median(mesh.vertices, axis=0)

    tile_of_face = np.empty(len(mesh.faces), dtype=np.int64)
    flat = mesh.vertices[:, horizontal]
    for first in range(0, len(mesh.faces), 1 << 22):
        centre = flat[mesh.faces[first : first + (1 << 22)]].mean(axis=1)
        cell = np.clip(np.floor((centre - low[horizontal]) / size).astype(np.int64), 0, counts - 1)
        tile_of_face[first : first + (1 << 22)] = cell[:, 0] * counts[1] + cell[:, 1]
    order = np.argsort(tile_of_face, kind="stable")
    boundaries = np.flatnonzero(np.diff(tile_of_face[order], prepend=-1, append=-1))

    directory.mkdir(parents=True, exist_ok=True)
    found = []
    for begin, end in pairwise(boundaries):
        if should_stop and should_stop():
            raise Cancelled()
        chosen = order[begin:end]
        tile = int(tile_of_face[chosen[0]])
        used, inverse = np.unique(mesh.faces[chosen], return_inverse=True)
        positions = mesh.vertices[used]
        name = f"tile_{tile // counts[1]:03d}_{tile % counts[1]:03d}"
        piece = {
            "points": (positions - anchor).astype(np.float32),
            "faces": inverse.reshape(-1, 3).astype(np.int32),
        }
        bounds = [positions.min(axis=0).tolist(), positions.max(axis=0).tolist()]
        found.append(
            {"name": name, "bounds": bounds, "levels": [save_tile(directory / f"{name}.npz", piece)]}
        )
        if progress:
            progress("split", int(end), len(order))
    actual_low = np.min([tile["bounds"][0] for tile in found], axis=0)
    actual_high = np.max([tile["bounds"][1] for tile in found], axis=0)
    return {"anchor": anchor.tolist(), "bounds": [actual_low.tolist(), actual_high.tolist()], "tiles": found}


def split_disk(mesh, up_axis, tiles, directory, progress=None, should_stop=None):
    """면을 타일별 파일에 분배하고 제한된 면 수씩 상세도 준비"""
    horizontal = [0, 2] if up_axis == "y" else [0, 1]
    sample = mesh.vertices[:: max(1, len(mesh.vertices) // 250_000)]
    low, high = np.percentile(sample, [0.1, 99.9], axis=0)
    anchor = np.median(sample, axis=0)
    size = max((high - low)[horizontal].max() / tiles, 1e-9)
    counts = np.maximum(np.ceil((high - low)[horizontal] / size), 1).astype(np.int64)
    directory.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="partition-", dir=directory.parent) as work:
        work = Path(work)
        paths = {}
        for first in range(0, len(mesh.faces), FACE_BATCH):
            if should_stop and should_stop():
                raise Cancelled()
            triangles = mesh.faces[first : first + FACE_BATCH]
            centre = mesh.vertices[triangles].mean(axis=1)[:, horizontal]
            cell = np.clip(np.floor((centre - low[horizontal]) / size).astype(np.int64), 0, counts - 1)
            groups = cell[:, 0] * counts[1] + cell[:, 1]
            for group in np.unique(groups):
                path = paths.setdefault(int(group), work / str(group))
                with path.open("ab") as output:
                    triangles[groups == group].tofile(output)
            if progress:
                progress("partition", min(first + FACE_BATCH, len(mesh.faces)), len(mesh.faces))
        found = []
        bounds = [np.full(3, np.inf), np.full(3, -np.inf)]
        for group, path in sorted(paths.items()):
            count = path.stat().st_size // 12
            faces = np.memmap(path, dtype=np.int32, mode="r", shape=(count, 3))
            for first in range(0, count, MAX_TILE_FACES):
                if should_stop and should_stop():
                    raise Cancelled()
                used, inverse = np.unique(faces[first : first + MAX_TILE_FACES], return_inverse=True)
                positions = mesh.vertices[used]
                name = f"tile_{group // counts[1]:03d}_{group % counts[1]:03d}"
                if count > MAX_TILE_FACES:
                    name += f"_part_{first // MAX_TILE_FACES:04d}"
                box = [positions.min(axis=0), positions.max(axis=0)]
                bounds = [np.minimum(bounds[0], box[0]), np.maximum(bounds[1], box[1])]
                piece = {
                    "points": (positions - anchor).astype(np.float32),
                    "faces": inverse.reshape(-1, 3).astype(np.int32),
                }
                found.append(
                    {
                        "name": name,
                        "bounds": [b.tolist() for b in box],
                        "levels": [save_tile(directory / f"{name}.npz", piece)],
                    }
                )
                if progress:
                    progress("split", len(found), len(paths))
        return {"anchor": anchor.tolist(), "bounds": [b.tolist() for b in bounds], "tiles": found}


def decimate(piece, keep):
    import pyvista as pv

    if len(piece["faces"]) < MIN_FACES:
        return piece
    mesh = pv.PolyData.from_regular_faces(piece["points"], piece["faces"])
    mesh.point_data["source"] = np.arange(mesh.n_points)
    with pv.vtk_verbosity("off"):
        reduced = mesh.decimate_pro(
            1.0 - keep,
            feature_angle=FEATURE_ANGLE,
            preserve_topology=True,
            splitting=False,
            boundary_vertex_deletion=False,
        )
    if not reduced.n_cells:
        return piece
    source = np.asarray(reduced.point_data["source"])
    return {"points": piece["points"][source], "faces": reduced.regular_faces.astype(np.int32)}


def decimate_tile(source, target, keep):
    return save_tile(Path(target), decimate(load_tile(source), keep))


def plan_of(case_dir, case, lods, tiles):
    files = []
    for name in case.mesh.files:
        stat = (case_dir / name).stat()
        files.append({"file": name, "size": stat.st_size, "mtime_ns": stat.st_mtime_ns})
    return {
        "schema": SCHEMA,
        "source": files,
        "up_axis": case.mesh.up_axis,
        "lods": list(lods),
        "tiles_per_axis": tiles,
    }


def write_json(path, document):
    partial = path.with_suffix(".partial")
    partial.write_text(json.dumps(document, indent=1))
    os.replace(partial, path)


def prepare(case_dir, case, lods=LODS, tiles=TILES, workers=4, progress=None, should_stop=None):
    """Case 잠금을 잡고 상세도별 메시 캐시 준비"""
    case_dir = Path(case_dir)
    if case.mesh is None:
        raise ValueError(f"case {case.id} has no mesh")
    cache = case_dir / "mesh_cache"
    cache.mkdir(exist_ok=True)
    plan = plan_of(case_dir, case, lods, tiles)
    # 동시 준비의 임시 파일 충돌을 막도록 flock 사용
    with open(cache / LOCK, "w") as lock:
        while True:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except BlockingIOError:
                if should_stop and should_stop():
                    raise Cancelled() from None
                if progress:
                    progress("waiting", 0, 1)
                time.sleep(0.5)
        return build(case_dir, cache, case, plan, workers, progress, should_stop)


def build(case_dir, cache, case, plan, workers, progress, should_stop):
    if not (cache / "plan.json").is_file() or json.loads((cache / "plan.json").read_text()) != plan:
        for entry in cache.iterdir():
            if entry.name not in (LOCK, TEXTURED):
                shutil.rmtree(entry) if entry.is_dir() else entry.unlink()
        write_json(cache / "plan.json", plan)
    started = time.monotonic()

    if (cache / "split.json").is_file():
        layout = json.loads((cache / "split.json").read_text())
    else:
        shutil.rmtree(cache / "lod0", ignore_errors=True)
        mesh = read_meshes([case_dir / name for name in case.mesh.files], progress, should_stop)
        parsed = time.monotonic()
        layout = split(mesh, case.mesh.up_axis, plan["tiles_per_axis"], cache / "lod0", progress, should_stop)
        layout["source_counts"] = {"vertices": len(mesh.vertices), "faces": len(mesh.faces)}
        del mesh
        layout["timings"] = {"parse_s": parsed - started, "split_s": time.monotonic() - parsed}
        write_json(cache / "split.json", layout)

    jobs = []
    for level, keep in enumerate(plan["lods"][1:], start=1):
        (cache / f"lod{level}").mkdir(exist_ok=True)
        for tile in layout["tiles"]:
            source, target = (
                cache / "lod0" / f"{tile['name']}.npz",
                cache / f"lod{level}" / f"{tile['name']}.npz",
            )
            tile["levels"].append(None)
            if target.is_file():
                with np.load(target) as done:
                    tile["levels"][level] = done["counts"].tolist()
            else:
                jobs.append(((tile, level), (str(source), str(target), keep)))

    before = time.monotonic()
    # 부모의 VTK와 스레드 상태를 물려받지 않도록 spawn 사용
    with ProcessPoolExecutor(max_workers=workers, mp_context=get_context("spawn")) as pool:
        futures = {pool.submit(decimate_tile, *arguments): slot for slot, arguments in jobs}
        for done, future in enumerate(as_completed(futures), start=1):
            if should_stop and should_stop():
                pool.shutdown(wait=True, cancel_futures=True)
                raise Cancelled()
            tile, level = futures[future]
            tile["levels"][level] = future.result()
            if progress:
                progress("lod", done, len(jobs))
    # 새 작업이 없던 재실행은 이전 시간 기록 유지
    previous = (
        json.loads((cache / "index.json").read_text())["timings"] if (cache / "index.json").is_file() else {}
    )
    layout["timings"] = {
        **previous,
        **layout["timings"],
        **({"lod_s": time.monotonic() - before} if jobs else {}),
    }

    index = {**plan, **layout}
    write_json(cache / "index.json", index)
    return index


class CityMesh:
    def __init__(self, case_dir, index):
        self.case_dir, self.cache, self.index = Path(case_dir), Path(case_dir) / "mesh_cache", index
        self.anchor = np.array(index["anchor"])

    @classmethod
    def open(cls, case_dir, case):
        path = Path(case_dir) / "mesh_cache" / "index.json"
        if not path.is_file():
            raise MeshNotPrepared(f"{path} does not exist: run `python main.py prepare-mesh {case_dir}`")
        index = json.loads(path.read_text())
        plan = plan_of(Path(case_dir), case, index.get("lods", ()), index.get("tiles_per_axis"))
        if any(index.get(name) != value for name, value in plan.items()):
            raise MeshNotPrepared(
                f"{path} was made from other files or by an older version: "
                f"run `python main.py prepare-mesh {case_dir}`"
            )
        return cls(case_dir, index)

    @property
    def faces(self):
        return [
            sum(tile["levels"][level][1] for tile in self.index["tiles"])
            for level in range(len(self.index["lods"]))
        ]

    def world_bounds(self, matrix, bounds=None):
        bounds = self.index["bounds"] if bounds is None else bounds
        corners = np.array([[bounds[(i >> a) & 1][a] for a in range(3)] for i in range(8)], dtype=np.float64)
        moved = apply(matrix, corners)
        return np.array([moved.min(axis=0), moved.max(axis=0)])

    def tiles(self, matrix, region=None):
        if region is None:
            return self.index["tiles"]
        low, high = np.sort(np.asarray(region, dtype=np.float64), axis=0)
        found = []
        for tile in self.index["tiles"]:
            box = self.world_bounds(matrix, tile["bounds"])
            if (box[1] >= low).all() and (box[0] <= high).all():
                found.append(tile)
        return found

    def footprint(self, matrix, region=None, lod=0):
        return sum(
            2 * (20 * points + 32 * faces)
            for points, faces in (t["levels"][lod] for t in self.tiles(matrix, region))
        )

    def load(self, matrix, origin, region=None, lod=0, max_bytes=None):
        """관심 영역과 겹치는 타일만 병합"""
        import pyvista as pv

        needed = self.footprint(matrix, region, lod)
        if max_bytes is not None and needed > max_bytes:
            raise MemoryError(
                f"the building geometry at detail level {lod} needs about {needed >> 20} MB, more than the budget of "
                f"{max_bytes >> 20} MB: choose a coarser level or a smaller region"
            )
        pieces = [
            load_tile(self.cache / f"lod{lod}" / f"{tile['name']}.npz") for tile in self.tiles(matrix, region)
        ]
        if not pieces:
            return pv.PolyData()
        offsets = np.cumsum([0] + [len(piece["points"]) for piece in pieces])
        points = np.concatenate([piece["points"] for piece in pieces]).astype(np.float64) + self.anchor
        return pv.PolyData.from_regular_faces(
            (apply(matrix, points) - np.asarray(origin, dtype=np.float64)).astype(np.float32),
            np.concatenate([piece["faces"] + offset for piece, offset in zip(pieces, offsets)]),
        )
