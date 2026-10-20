import io
import math
import zipfile
from pathlib import Path

import numpy as np

from modules.visualization.scenes.sources import city_source

MAX_TEXTURE_BYTES = 16 * 1024 * 1024
MAX_TEXTURE_PIXELS = 16 * 1024 * 1024
MAX_TEXTURE_DIMENSION = 8192
SCENE_TEXTURE_PIXELS = 24 * 1024 * 1024
MAX_TILE_BYTES = 128 * 1024 * 1024


def regular_file(path, root):
    path, root = Path(path), Path(root).resolve()
    if (
        path.is_symlink()
        or not path.is_file()
        or not path.resolve().is_relative_to(root)
        or any(parent.is_symlink() for parent in path.parents if parent.is_relative_to(root))
    ):
        raise ValueError("Prepared texture files must remain inside the case directory.")
    return path


def read_jpeg(path, root):
    from PIL import Image

    path = regular_file(path, root)
    if path.stat().st_size > MAX_TEXTURE_BYTES:
        raise MemoryError("Prepared texture exceeds the 16 MiB byte limit.")
    with path.open("rb") as stream:
        data = stream.read(MAX_TEXTURE_BYTES + 1)
    if len(data) > MAX_TEXTURE_BYTES:
        raise MemoryError("Prepared texture exceeds the 16 MiB byte limit.")
    try:
        with Image.open(io.BytesIO(data)) as image:
            width, height = image.size
            if image.format != "JPEG" or min(width, height) < 1:
                raise ValueError("Prepared texture must contain a JPEG image.")
            if max(width, height) > MAX_TEXTURE_DIMENSION or width * height > MAX_TEXTURE_PIXELS:
                raise MemoryError("Prepared texture exceeds the image dimension or texel limit.")
            image.verify()
    except Image.DecompressionBombError:
        raise MemoryError("Prepared texture exceeds the image dimension or texel limit.") from None
    return data, (width, height)


def resized_jpeg(data, dimensions, scale):
    if scale >= 1:
        return data
    from PIL import Image

    target = tuple(max(1, int(size * scale)) for size in dimensions)
    with Image.open(io.BytesIO(data)) as image:
        image.draft("RGB", target)
        picture = image.convert("RGB")
    picture = picture.resize(target, Image.Resampling.BOX)
    stream = io.BytesIO()
    picture.save(stream, format="JPEG", quality=85, subsampling=0)
    return stream.getvalue()


def prepared_city(directory, case):
    """원본 텍스처가 있으면 캐시를 준비하고 검증된 도시 반환"""
    from modules.visualization.geometry.citymesh import MeshNotPrepared
    from modules.visualization.geometry.citytexture import TexturedCity, available, prepare

    directory = Path(directory)
    index_path = directory / "mesh_cache" / "textured" / "index.json"

    def read_cache():
        regular_file(index_path, directory)
        if index_path.stat().st_size > 8 * 1024 * 1024:
            raise ValueError("Prepared texture index exceeds the 8 MiB limit.")
        return TexturedCity.open(directory, case)

    if index_path.is_file():
        try:
            return read_cache()
        except MeshNotPrepared:
            pass
    if not available(directory, case):
        return None

    # 준비 전에도 캐시 경로가 Case 밖으로 이어지지 않도록 확인
    for path in (index_path.parent.parent, index_path.parent):
        if path.is_symlink() or not path.resolve().is_relative_to(directory.resolve()):
            raise ValueError("Prepared texture cache must remain inside the case directory.")

    # 최초 준비는 공용 Case 잠금과 단일 작업자로 자원 사용 제한
    prepare(directory, case, workers=1, texels=SCENE_TEXTURE_PIXELS)
    return read_cache()


def prepared_tiles(source, matrix, origin, roi, asset_root):
    """UV 메시를 준비하고 텍스처를 타일별 예산으로 축소"""
    from modules.domain.coordinates import apply
    from modules.visualization.assets.codecs import bounding_box, cache_key, glb, write_asset
    from modules.visualization.geometry.citymesh import MeshNotPrepared

    directory, case, _ = city_source(source)
    try:
        city = prepared_city(directory, case)
        if city is None:
            return None, []
        tiles = city.tiles(matrix, roi)
        if len(tiles) > 512:
            raise MemoryError("Prepared texture tile count exceeds the 512-tile limit.")
        plans, texels = [], 0
        for tile in tiles:
            name = tile["name"]
            if not isinstance(name, str) or Path(name).name != name or "\\" in name:
                raise ValueError("Prepared texture tile name is invalid.")
            mesh_path = regular_file(city.cache / "lod0" / f"{name}.npz", directory)
            image_path = regular_file(mesh_path.with_suffix(".jpg"), directory)
            if mesh_path.stat().st_size > MAX_TILE_BYTES:
                raise MemoryError("Prepared texture mesh exceeds the 128 MiB tile limit.")
            with zipfile.ZipFile(mesh_path) as archive:
                if sum(item.file_size for item in archive.infolist()) > MAX_TILE_BYTES:
                    raise MemoryError("Prepared texture mesh exceeds the expanded tile limit.")
            _, size = read_jpeg(image_path, directory)
            texels += size[0] * size[1]
            plans.append((tile, mesh_path, image_path, size))
        if not plans:
            return None, []
        scale = min(1.0, math.sqrt(SCENE_TEXTURE_PIXELS / max(1, texels)))
        children, assets = [], []
        signature = cache_key(
            {
                "directory": str(directory),
                "source": city.index.get("source"),
                "textures": city.index.get("textures"),
                "matrix": matrix.tolist(),
                "origin": origin.tolist(),
                "scale": scale,
                "version": "embedded-jpeg/1",
            }
        )
        for tile, mesh_path, image_path, size in plans:
            stamp = [
                mesh_path.stat().st_mtime_ns,
                mesh_path.stat().st_size,
                image_path.stat().st_mtime_ns,
                image_path.stat().st_size,
            ]
            key = cache_key([signature, tile["name"], stamp])
            name = f"{key}.glb"
            if not (Path(asset_root) / name).is_file():
                with np.load(mesh_path, allow_pickle=False) as piece:
                    points, faces, tcoords = piece["points"], piece["faces"], piece["tcoords"]
                    if (
                        faces.dtype.kind not in "iu"
                        or points.nbytes + faces.nbytes + tcoords.nbytes > MAX_TILE_BYTES
                    ):
                        raise ValueError("Prepared texture mesh arrays are invalid.")
                    if np.any(tcoords < -1e-5) or np.any(tcoords > 1 + 1e-5):
                        raise ValueError("Prepared texture UV coordinates are outside the atlas.")
                    vertices = apply(matrix, points.astype(np.float64) + city.anchor) - origin
                    jpeg, _ = read_jpeg(image_path, directory)
                    jpeg = resized_jpeg(jpeg, size, scale)
                    write_asset(asset_root, key, "glb", glb(vertices, faces, tcoords=tcoords, jpeg=jpeg))
            bounds = city.world_bounds(matrix, tile["bounds"]).tolist()
            children.append(
                {
                    "boundingVolume": bounding_box(bounds, origin),
                    "geometricError": 0,
                    "content": {"uri": f"/app-api/assets/{name}"},
                }
            )
            assets.append(
                {
                    "kind": "geometry",
                    "format": "glb",
                    "filename": name,
                    "tileId": tile["name"],
                    "textured": True,
                    "bounds": bounds,
                }
            )
        warning = ["Prepared textures are reduced to the scene texture budget."] if scale < 1 else []
        return {
            "children": children,
            "assets": assets,
            "signature": signature,
            "bounds": city.world_bounds(matrix).tolist(),
        }, warning
    except (OSError, ValueError, KeyError, TypeError, MemoryError, MeshNotPrepared, zipfile.BadZipFile):
        return None, [
            "Prepared textures are unavailable or exceed resource limits. Untextured geometry is displayed."
        ]
