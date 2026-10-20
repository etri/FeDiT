import fcntl
import json
import os
import shutil
import time
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from itertools import pairwise
from multiprocessing import get_context
from pathlib import Path

import numpy as np

from modules.domain.coordinates import apply
from modules.visualization.geometry.citymesh import (
    BLOCK,
    FACE,
    LOCK,
    TEXTURED,
    TILES,
    VERTEX,
    Cancelled,
    CityMesh,
    MeshNotPrepared,
    numbers,
    resolve,
    write_json,
)
from modules.visualization.geometry.texturebake import MISSING, SHELF, bake_tile, shelf

SCHEMA = "flowcast.meshtexture/1"
FACES = 2_000_000
# 도시 전체의 텍셀 상한이며 관심 영역 예산의 두 배
TEXELS = 1 << 27
BUDGET = 1 << 26
# RGB 배열과 VTK RGBA 밉맵의 합산 메모리(바이트)
ATLAS_BYTES = BUDGET * 3 + BUDGET * 4 * 4 // 3
ATLAS = 16384  # llvmpipe와 GPU가 지원하는 텍스처 최대 변 길이(px)
MAX_TEXELS = ATLAS**2
HEAD = 1 << 20
MTL_BYTES = 16 << 20
TEXCOORD = 3


def case_file(path, root):
    """Case 내부의 일반 파일 경로 반환"""
    try:
        resolved = path.resolve()
        if resolved.is_relative_to(root.resolve()) and resolved.is_file():
            return resolved
    except (OSError, RuntimeError, ValueError):
        pass
    return None


def mtl_files(obj, root):
    obj = case_file(obj, root)
    if obj is None:
        return []
    with obj.open("rb") as file:
        head = file.read(HEAD)
    names = []
    for line in head.splitlines():
        parts = line.split(maxsplit=1)
        if parts[:1] == [b"mtllib"] and len(parts) > 1:
            name = parts[1].decode(errors="replace").replace("\\", "/")
            # 공백이 포함된 단일 파일을 우선 확인
            names += [name] if case_file(obj.parent / name, root) else name.split()
    names = names or [obj.with_suffix(".mtl").name]
    paths = [case_file(obj.parent / name, root) for name in names if not Path(name).is_absolute()]
    return list(dict.fromkeys(path for path in paths if path is not None))


def map_texture(path, parts, root):
    """Case 밖이거나 없는 텍스처 경로는 None"""
    for start in range(1, len(parts)):
        name = Path(" ".join(parts[start:]).replace("\\", "/"))
        if name.is_absolute():
            continue
        texture = case_file(path.parent / name, root)
        if texture is not None:
            return texture
    return None


def read_mtl(path, root):
    path = case_file(path, root)
    if path is None:
        return {}
    with path.open("rb") as file:
        data = file.read(MTL_BYTES + 1)
    if len(data) > MTL_BYTES:
        return {}
    found, name = {}, None
    for line in data.decode(errors="replace").splitlines():
        parts = line.split()
        if not parts:
            continue
        if parts[0] == "newmtl" and len(parts) > 1:
            name = " ".join(parts[1:])
            found[name] = {"texture": None, "color": MISSING}
        elif name is not None and parts[0] == "Kd" and len(parts) >= 4:
            try:
                found[name]["color"] = tuple(round(255 * min(max(float(v), 0.0), 1.0)) for v in parts[1:4])
            except ValueError:
                pass
        elif name is not None and parts[0] == "map_Kd" and len(parts) > 1:
            found[name]["texture"] = map_texture(path, parts, root)
    return found


def materials(case_dir, case):
    if case.mesh is None:
        return {}
    root = Path(case_dir)
    paths = [root / name for name in case.mesh.files]
    if any(path.suffix.lower() != ".obj" or case_file(path, root) is None for path in paths):
        return {}
    found = {}
    for path in paths:
        for mtl in mtl_files(path, root):
            for name, material in read_mtl(mtl, root).items():
                found.setdefault(name, material)
    return found


def available(case_dir, case):
    return any(material["texture"] is not None for material in materials(case_dir, case).values())


@dataclass
class TexturedMesh:
    vertices: np.ndarray  # float64 [n, 3] 메시 좌표
    uvs: np.ndarray  # float32 [t, 2] UV
    faces: np.ndarray  # int32 [k, 3] 정점 번호
    corners: np.ndarray  # int32 [k, 3] UV 번호이며 없으면 -1
    materials: np.ndarray  # int16 [k] 재질 번호이며 없으면 -1


def slow_faces(lines, vertices_before, uvs_before):
    faces, corners, counts = [], [], []
    for n, line in enumerate(lines):
        parts = [corner.split(b"/") for corner in line.split()[1:]]
        v = resolve(np.array([int(part[0]) for part in parts]), vertices_before[n])
        t = np.array([int(part[1]) if len(part) > 1 and part[1] else 0 for part in parts])
        t = np.where(t == 0, -1, resolve(t, uvs_before[n]))
        fan = [[0, i, i + 1] for i in range(1, len(v) - 1)]
        faces.extend(v[f] for f in fan)
        corners.extend(t[f] for f in fan)
        counts.append(len(fan))
    return np.array(faces).reshape(-1, 3), np.array(corners).reshape(-1, 3), np.array(counts, dtype=np.int64)


def read_obj(path, names, progress=None, should_stop=None):
    """OBJ 정점, UV와 면을 블록 단위로 읽음"""
    size = path.stat().st_size
    vertices, uvs, faces, corners, groups = [], [], [], [], []
    n_vertices = n_uvs = done = 0
    material = -1
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
            if not block.endswith(b"\n"):
                block += b"\n"
            data = np.frombuffer(block, dtype=np.uint8).copy()
            ends = np.flatnonzero(data == 10)
            starts = np.concatenate([[0], ends[:-1] + 1])
            heads = starts.copy()
            while (indented := (data[heads] == 32) | (data[heads] == 9)).any():
                heads[indented] += 1
            first, second, third = (data[np.minimum(heads + k, len(data) - 1)] for k in range(3))
            kind = np.zeros(len(starts), dtype=np.uint8)
            kind[(first == ord("v")) & ((second == 32) | (second == 9))] = VERTEX
            kind[(first == ord("v")) & (second == ord("t")) & ((third == 32) | (third == 9))] = TEXCOORD
            kind[(first == ord("f")) & ((second == 32) | (second == 9))] = FACE
            switches, chosen = [], []
            for line in np.flatnonzero(first == ord("u")):
                parts = block[heads[line] : ends[line]].split(maxsplit=1)
                if parts and parts[0] == b"usemtl":
                    name = parts[1].strip().decode(errors="replace") if len(parts) > 1 else ""
                    switches.append(line)
                    chosen.append(names.setdefault(name, len(names)))
            face_lines = np.flatnonzero(kind == FACE)

            byte_kind = np.repeat(kind, ends - starts + 1)
            slashes = (data == ord("/")) & (byte_kind == FACE)
            has_double = bool((slashes[:-1] & slashes[1:]).any())
            data[heads[kind != 0]] = 32
            data[heads[kind == TEXCOORD] + 1] = 32
            data[slashes] = 32

            count = int((kind == VERTEX).sum())
            if count:
                values = numbers(data[byte_kind == VERTEX], np.float64)
                if len(values) % count or len(values) // count < 3:
                    raise ValueError(f"{path}: vertex lines with a varying number of values")
                vertices.append(values.reshape(count, -1)[:, :3].copy())
            count_uvs = int((kind == TEXCOORD).sum())
            if count_uvs:
                values = numbers(data[byte_kind == TEXCOORD], np.float64)
                if len(values) % count_uvs == 0 and len(values) // count_uvs >= 2:
                    uvs.append(values.reshape(count_uvs, -1)[:, :2].astype(np.float32))
                else:
                    rows = [block[starts[n] : ends[n]].split()[1:3] for n in np.flatnonzero(kind == TEXCOORD)]
                    uvs.append(
                        np.array(
                            [[float(v) for v in row] + [0.0] * (2 - len(row)) for row in rows], np.float32
                        )
                    )
            if len(face_lines):
                vertices_before = n_vertices + np.cumsum(kind == VERTEX)[face_lines]
                uvs_before = n_uvs + np.cumsum(kind == TEXCOORD)[face_lines]
                position = np.searchsorted(np.asarray(switches, dtype=np.int64), face_lines, side="right") - 1
                line_material = np.where(
                    position >= 0, np.asarray([*chosen, 0], dtype=np.int16)[position], material
                )
                values = numbers(data[byte_kind == FACE], np.int64)
                # 면 형식이 같은 삼각형일 때만 빠른 파싱 사용
                per_line = np.add.reduceat(slashes, starts, dtype=np.int32)[face_lines]
                per_corner = 1 + int(per_line[0]) // 3 - has_double
                uniform = per_line[0] in (0, 3, 6) and (per_line == per_line[0]).all()
                if uniform and len(values) == 3 * per_corner * len(face_lines):
                    corner = values.reshape(len(face_lines), 3, per_corner)
                    v = resolve(corner[..., 0], vertices_before[:, None])
                    # v//vn의 둘째 번호는 UV가 아닌 법선
                    if per_line[0] in (3, 6) and not has_double:
                        t = resolve(corner[..., 1], uvs_before[:, None])
                    else:
                        t = np.full_like(v, -1)
                    m = line_material
                else:
                    lines = [block[starts[line] : ends[line]] for line in face_lines]
                    v, t, triangles = slow_faces(lines, vertices_before, uvs_before)
                    m = np.repeat(line_material, triangles)
                faces.append(v.astype(np.int32))
                corners.append(t.astype(np.int32))
                groups.append(np.asarray(m, dtype=np.int16))
            if chosen:
                material = chosen[-1]
            n_vertices += int((kind == VERTEX).sum())
            n_uvs += count_uvs
            done += len(block)
            if progress:
                progress("parse", min(done, size), size)

    mesh = TexturedMesh(
        vertices=np.concatenate([np.empty((0, 3)), *vertices]),
        uvs=np.concatenate([np.empty((0, 2), dtype=np.float32), *uvs]),
        faces=np.concatenate([np.empty((0, 3), dtype=np.int32), *faces]),
        corners=np.concatenate([np.empty((0, 3), dtype=np.int32), *corners]),
        materials=np.concatenate([np.empty(0, dtype=np.int16), *groups]),
    )
    if not len(mesh.faces):
        raise ValueError(f"{path}: no faces")
    if mesh.faces.min() < 0 or mesh.faces.max() >= len(mesh.vertices):
        raise ValueError(f"{path}: a face refers to a vertex that does not exist")
    if mesh.corners.min() < -1 or mesh.corners.max() >= len(mesh.uvs):
        raise ValueError(f"{path}: a face refers to a texture coordinate that does not exist")
    return mesh


def read_meshes(paths, names, progress=None, should_stop=None):
    meshes = [read_obj(path, names, progress, should_stop) for path in paths]
    if len(meshes) == 1:
        return meshes[0]
    vertex_offsets = np.cumsum([0] + [len(mesh.vertices) for mesh in meshes])
    uv_offsets = np.cumsum([0] + [len(mesh.uvs) for mesh in meshes])
    return TexturedMesh(
        vertices=np.concatenate([mesh.vertices for mesh in meshes]),
        uvs=np.concatenate([mesh.uvs for mesh in meshes]),
        faces=np.concatenate([mesh.faces + offset for mesh, offset in zip(meshes, vertex_offsets)]),
        corners=np.concatenate(
            [
                np.where(mesh.corners >= 0, mesh.corners + offset, -1)
                for mesh, offset in zip(meshes, uv_offsets)
            ]
        ).astype(np.int32),
        materials=np.concatenate([mesh.materials for mesh in meshes]),
    )


def split(mesh, up_axis, tiles, directory, progress=None, should_stop=None):
    horizontal = [0, 2] if up_axis == "y" else [0, 1]
    low, high = np.percentile(mesh.vertices, [0.1, 99.9], axis=0)
    size = max((high - low)[horizontal].max() / tiles, 1e-9)
    counts = np.maximum(np.ceil((high - low)[horizontal] / size), 1).astype(np.int64)
    anchor = np.median(mesh.vertices, axis=0)

    tile_of_face = np.empty(len(mesh.faces), dtype=np.int64)
    flat, area = mesh.vertices[:, horizontal], 0.0
    for first in range(0, len(mesh.faces), 1 << 22):
        part = mesh.faces[first : first + (1 << 22)]
        centre = flat[part].mean(axis=1)
        cell = np.clip(np.floor((centre - low[horizontal]) / size).astype(np.int64), 0, counts - 1)
        tile_of_face[first : first + (1 << 22)] = cell[:, 0] * counts[1] + cell[:, 1]
        corner = mesh.vertices[part]
        area += (
            0.5
            * np.linalg.norm(np.cross(corner[:, 1] - corner[:, 0], corner[:, 2] - corner[:, 0]), axis=1).sum()
        )
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
        corners = mesh.corners[chosen]
        uv = np.full((len(chosen), 3, 2), np.nan, dtype=np.float32)
        if len(mesh.uvs):
            uv = np.where((corners >= 0)[..., None], mesh.uvs[np.maximum(corners, 0)], np.nan).astype(
                np.float32
            )
        name = f"tile_{tile // counts[1]:03d}_{tile % counts[1]:03d}"
        partial = directory / f"{name}.partial.npz"
        np.savez(
            partial,
            points=(positions - anchor).astype(np.float32),
            faces=inverse.reshape(-1, 3).astype(np.int32),
            uv=uv,
            material=mesh.materials[chosen],
        )
        os.replace(partial, directory / f"{name}.npz")
        bounds = [positions.min(axis=0).tolist(), positions.max(axis=0).tolist()]
        found.append({"name": name, "bounds": bounds})
        if progress:
            progress("split", int(end), len(order))
    return {
        "anchor": anchor.tolist(),
        "bounds": [low.tolist(), high.tolist()],
        "area": float(area),
        "tiles": found,
    }


def decode_texture(source, target, factor):
    from PIL import Image

    Image.MAX_IMAGE_PIXELS = MAX_TEXELS
    with Image.open(source) as image:
        size = (max(1, image.width // factor), max(1, image.height // factor))
        image.draft("RGB", size)
        picture = image.convert("RGB")
    if picture.size != size:
        picture = picture.resize(size, Image.Resampling.BOX)
    partial = Path(target).with_suffix(".partial.npy")
    np.save(partial, np.asarray(picture))
    os.replace(partial, target)


def plan_of(case_dir, case, found, faces, texels, tiles):
    def stamp(path, name):
        stat = path.stat()
        return {"file": name, "size": stat.st_size, "mtime_ns": stat.st_mtime_ns}

    case_dir = Path(case_dir)
    textures = sorted({material["texture"] for material in found.values() if material["texture"] is not None})
    return {
        "schema": SCHEMA,
        "source": [stamp(case_dir / name, name) for name in case.mesh.files],
        "textures": [stamp(path, os.path.relpath(path, case_dir)) for path in textures],
        "up_axis": case.mesh.up_axis,
        "faces": faces,
        "texels": texels,
        "tiles_per_axis": tiles,
    }


def prepare(
    case_dir, case, workers=4, progress=None, should_stop=None, faces=FACES, texels=TEXELS, tiles=TILES
):
    """Case 잠금을 잡고 텍스처 캐시 준비"""
    case_dir = Path(case_dir)
    found = materials(case_dir, case)
    if not any(material["texture"] is not None for material in found.values()):
        raise ValueError(f"case {case.id} has no OBJ mesh with textures (map_Kd)")
    cache = case_dir / "mesh_cache" / TEXTURED
    cache.mkdir(parents=True, exist_ok=True)
    plan = plan_of(case_dir, case, found, faces, texels, tiles)
    # 동시 준비의 덮어쓰기를 막도록 Case 잠금 공유
    with open(cache.parent / LOCK, "w") as lock:
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
        return build(case_dir, cache, case, plan, found, workers, progress, should_stop)


def run(pool, jobs, stage, progress, should_stop):
    futures = {pool.submit(function, *arguments): slot for slot, (function, arguments) in jobs.items()}
    results = {}
    for done, future in enumerate(as_completed(futures), start=1):
        if should_stop and should_stop():
            pool.shutdown(wait=True, cancel_futures=True)
            raise Cancelled()
        results[futures[future]] = future.result()
        if progress:
            progress(stage, done, len(jobs))
    return results


def build(case_dir, cache, case, plan, found, workers, progress, should_stop):
    from PIL import Image

    if not (cache / "plan.json").is_file() or json.loads((cache / "plan.json").read_text()) != plan:
        for entry in cache.iterdir():
            shutil.rmtree(entry) if entry.is_dir() else entry.unlink()
        write_json(cache / "plan.json", plan)
    if (cache / "index.json").is_file():
        return json.loads((cache / "index.json").read_text())
    started = time.monotonic()

    if (cache / "split.json").is_file():
        layout = json.loads((cache / "split.json").read_text())
    else:
        shutil.rmtree(cache / "src", ignore_errors=True)
        names = {name: number for number, name in enumerate(found)}
        mesh = read_meshes([case_dir / name for name in case.mesh.files], names, progress, should_stop)
        parsed = time.monotonic()
        layout = split(mesh, case.mesh.up_axis, plan["tiles_per_axis"], cache / "src", progress, should_stop)
        layout["materials"] = list(names)
        layout["source_counts"] = {
            "vertices": len(mesh.vertices),
            "uvs": len(mesh.uvs),
            "faces": len(mesh.faces),
        }
        del mesh
        layout["timings"] = {"parse_s": parsed - started, "split_s": time.monotonic() - parsed}
        write_json(cache / "split.json", layout)

    paths = sorted({material["texture"] for material in found.values() if material["texture"] is not None})
    source_texels = 0
    for path in paths:
        with Image.open(path) as image:
            source_texels += image.width * image.height
    # 빈 공간을 고려해 굽는 텍셀 수를 원본의 네 배로 제한
    texels = min(plan["texels"], 4 * source_texels)
    factor = 2 ** max(0, round(np.log2(np.sqrt(source_texels / texels))))
    (cache / "sources").mkdir(exist_ok=True)
    decoded = {path: cache / "sources" / f"{number:04d}.npy" for number, path in enumerate(paths)}
    textures = []
    for name in layout["materials"]:
        material = found.get(name, {"texture": None, "color": MISSING})
        texture = material["texture"]
        textures.append((str(decoded[texture]) if texture is not None else None, tuple(material["color"])))

    before = time.monotonic()
    density = texels / max(layout["area"], 1e-12)
    keep = min(1.0, plan["faces"] / layout["source_counts"]["faces"])
    up = 1 if case.mesh.up_axis == "y" else 2
    # 부모의 VTK와 스레드 상태를 물려받지 않도록 spawn 사용
    with ProcessPoolExecutor(max_workers=workers, mp_context=get_context("spawn")) as pool:
        jobs = {path: (decode_texture, (str(path), str(target), factor)) for path, target in decoded.items()}
        run(pool, {path: job for path, job in jobs.items() if not decoded[path].is_file()}, "textures", progress,
            should_stop)  # fmt: skip
        decoding = time.monotonic()
        (cache / "lod0").mkdir(exist_ok=True)
        jobs = {}
        for tile in layout["tiles"]:
            source, target = cache / "src" / f"{tile['name']}.npz", cache / "lod0" / f"{tile['name']}.npz"
            if target.is_file() and target.with_suffix(".jpg").is_file():
                with np.load(target) as done:
                    tile.update(json.loads(str(done["summary"])))
            else:
                arguments = (str(source), str(target), textures, keep, density, up)
                jobs[tile["name"]] = (bake_tile, arguments)
        baked = run(pool, jobs, "bake", progress, should_stop)
    for tile in layout["tiles"]:
        tile.update(baked.get(tile["name"], {}))
    layout["timings"] = {
        **layout["timings"],
        "textures_s": decoding - before,
        "bake_s": time.monotonic() - decoding,
        "texture_factor": factor,
    }
    layout["texture_texels"] = sum(tile["size"][0] * tile["size"][1] for tile in layout["tiles"])
    layout["covered_texels"] = sum(tile["covered"] for tile in layout["tiles"])
    index = {**plan, **layout, "keep": keep, "lods": [keep]}
    write_json(cache / "index.json", index)
    # 캐시 완료 후 재실행에 불필요한 조각과 계획 삭제
    for name in ("src", "sources"):
        shutil.rmtree(cache / name, ignore_errors=True)
    (cache / "split.json").unlink()
    return index


class TexturedCity(CityMesh):
    def __init__(self, case_dir, index):
        super().__init__(case_dir, index)
        self.cache = self.case_dir / "mesh_cache" / TEXTURED

    @classmethod
    def open(cls, case_dir, case):
        path = Path(case_dir) / "mesh_cache" / TEXTURED / "index.json"
        if not path.is_file():
            raise MeshNotPrepared(
                f"{path} does not exist: run `python main.py prepare-mesh --textures {case_dir}`"
            )
        index = json.loads(path.read_text())
        found = materials(case_dir, case)
        plan = plan_of(
            case_dir, case, found, index.get("faces"), index.get("texels"), index.get("tiles_per_axis")
        )
        if any(index.get(name) != value for name, value in plan.items()):
            raise MeshNotPrepared(
                f"{path} was made from other files or by an older version: "
                f"run `python main.py prepare-mesh --textures {case_dir}`"
            )
        return cls(case_dir, index)

    def load_textured(self, matrix, origin, region=None, budget=BUDGET):
        """관심 영역 타일을 메시와 텍스처 한 장으로 병합"""
        import pyvista as pv
        from PIL import Image

        tiles = self.tiles(matrix, region)
        if not tiles:
            return pv.PolyData(), None
        sizes = np.array([tile["size"] for tile in tiles], dtype=np.float64)
        scale = min(1.0, float(np.sqrt(budget / sizes.prod(axis=1).sum())))
        while True:
            # 밉맵 경계가 맞도록 텍스처 크기를 16의 배수로 제한
            scaled = np.maximum(16, (sizes * scale) // 16 * 16).astype(np.int64)
            width = max(int(scaled[:, 0].max()), int(np.sqrt(scaled.prod(axis=1).sum() / SHELF)))
            width = min(ATLAS, -(-width // 16) * 16)
            order = np.lexsort((-scaled[:, 0], -scaled[:, 1]))
            placed, count, height = shelf(scaled[order], width)
            if count == len(tiles) and height <= ATLAS and width * height <= budget:
                break
            scale *= 0.95
        position = np.empty_like(placed)
        position[order] = placed
        image = np.zeros((height, width, 3), dtype=np.uint8)

        def read(number):
            (x, y), (w, h) = position[number], scaled[number]
            with Image.open(self.cache / "lod0" / f"{tiles[number]['name']}.jpg") as picture:
                picture.draft("RGB", (int(w), int(h)))
                picture = picture.convert("RGB")
            if picture.size != (w, h):
                picture = picture.resize((int(w), int(h)), Image.Resampling.BOX)
            image[y : y + h, x : x + w] = np.asarray(picture)

        with ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(read, range(len(tiles))))

        pieces = []
        for number, tile in enumerate(tiles):
            with np.load(self.cache / "lod0" / f"{tile['name']}.npz") as piece:
                (x, y), (w, h) = position[number], scaled[number]
                tcoords = piece["tcoords"].astype(np.float64)
                u = (x + tcoords[:, 0] * w) / width
                v = 1.0 - (y + (1.0 - tcoords[:, 1]) * h) / height
                pieces.append((piece["points"], piece["faces"], np.stack([u, v], axis=1).astype(np.float32)))
        offsets = np.cumsum([0] + [len(points) for points, _, _ in pieces])
        points = np.concatenate([points for points, _, _ in pieces]).astype(np.float64) + self.anchor
        mesh = pv.PolyData.from_regular_faces(
            (apply(matrix, points) - np.asarray(origin, dtype=np.float64)).astype(np.float32),
            np.concatenate([faces + offset for (_, faces, _), offset in zip(pieces, offsets)]),
        )
        mesh.active_texture_coordinates = np.concatenate([tcoords for _, _, tcoords in pieces])
        return mesh, image


def leftovers(case_dir):
    """중단된 준비 작업의 중간 파일 크기(바이트)"""
    cache = Path(case_dir) / "mesh_cache" / TEXTURED
    total = 0
    for name in ("src", "sources"):
        for path in (cache / name).rglob("*"):
            if path.is_file():
                total += path.stat().st_size
    return total


def discard(case_dir):
    """다른 세션이 준비 중이면 중간 파일을 삭제하지 않음"""
    cache = Path(case_dir) / "mesh_cache" / TEXTURED
    lock = Path(case_dir) / "mesh_cache" / LOCK
    if not lock.is_file():
        return 0
    with lock.open("r") as handle:
        try:
            # 다른 세션이 준비 중이면 중간 파일 삭제 금지
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return 0
        freed = leftovers(case_dir)
        for name in ("src", "sources"):
            shutil.rmtree(cache / name, ignore_errors=True)
        (cache / "split.json").unlink(missing_ok=True)
    return freed


def prepared(case_dir, case):
    try:
        TexturedCity.open(case_dir, case)
    except (MeshNotPrepared, OSError, ValueError):
        return False
    return True
