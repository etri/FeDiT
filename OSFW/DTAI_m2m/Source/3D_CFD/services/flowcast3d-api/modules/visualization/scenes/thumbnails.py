import io
import math
from pathlib import Path
from zipfile import BadZipFile, ZipFile

import numpy as np

from modules.visualization.scenes.sources import city_source

MAX_PREVIEW_MESH_BYTES = 256 * 1024 * 1024


def _prepared_texture(directory, case, matrix):
    """텍스처 캐시를 준비하고 경로와 파일 및 전체 격자 크기를 검증"""
    from modules.visualization.scenes.textures import (
        MAX_TEXTURE_DIMENSION,
        MAX_TILE_BYTES,
        prepared_city,
        read_jpeg,
        regular_file,
    )

    directory = Path(directory)
    city = prepared_city(directory, case)
    if city is None:
        raise ValueError("Case has no OBJ mesh with textures.")
    tiles = city.tiles(matrix)
    if not isinstance(tiles, list) or not 0 < len(tiles) <= 512:
        raise ValueError("Prepared texture tile count must be between 1 and 512.")

    # 압축 해제 합계와 실제 JPEG 크기를 먼저 확인하여 전체 로드 예산 확보
    total, paths = 0, []
    for tile in tiles:
        name, size = tile["name"], tile["size"]
        if (
            not isinstance(name, str)
            or not name
            or Path(name).name != name
            or "\\" in name
            or name in {".", ".."}
        ):
            raise ValueError("Prepared texture tile name is invalid.")
        if (
            not isinstance(size, (list, tuple))
            or len(size) != 2
            or any(type(value) is not int or not 0 < value <= MAX_TEXTURE_DIMENSION for value in size)
        ):
            raise ValueError("Prepared texture tile size must contain two positive image dimensions.")
        mesh_path = regular_file(city.cache / "lod0" / f"{name}.npz", directory)
        if mesh_path.stat().st_size > MAX_TILE_BYTES:
            raise MemoryError("Prepared texture mesh exceeds the 128 MiB tile limit.")
        with ZipFile(mesh_path) as archive:
            expanded = sum(item.file_size for item in archive.infolist())
        if expanded > MAX_TILE_BYTES:
            raise MemoryError("Prepared texture mesh exceeds the expanded tile limit.")
        total += expanded
        if total > MAX_PREVIEW_MESH_BYTES:
            raise MemoryError("Prepared texture meshes exceed the 256 MiB preview limit.")
        _, actual_size = read_jpeg(mesh_path.with_suffix(".jpg"), directory)
        if tuple(size) != actual_size:
            raise ValueError("Prepared texture tile size does not match the JPEG image.")
        paths.append(mesh_path)

    # 네이티브 메시 생성 전에 배열 형상과 면 색인 검증
    for path in paths:
        with np.load(path, allow_pickle=False) as piece:
            points, faces, tcoords = piece["points"], piece["faces"], piece["tcoords"]
            if (
                points.ndim != 2
                or points.shape[1] != 3
                or points.dtype.kind not in "fiu"
                or not len(points)
                or not np.isfinite(points).all()
                or faces.ndim != 2
                or faces.shape[1] != 3
                or faces.dtype.kind not in "iu"
                or not len(faces)
                or faces.min() < 0
                or faces.max() >= len(points)
                or tcoords.shape != (len(points), 2)
                or tcoords.dtype.kind not in "fiu"
                or not np.isfinite(tcoords).all()
                or np.any(tcoords < -1e-5)
                or np.any(tcoords > 1 + 1e-5)
            ):
                raise ValueError("Prepared texture mesh arrays are invalid.")
    return city


def city_geometry(source, plotter):
    """준비된 텍스처를 우선 사용하여 공간 형상과 화면 맞춤용 좌표 반환"""
    import pyvista as pv

    from modules.domain.coordinates import apply
    from modules.visualization.geometry.citymesh import MeshNotPrepared, load_tile
    from modules.visualization.scenes.sources import city_mesh

    # 최초 요청에서 텍스처를 준비하고 이후에는 캐시 재사용
    directory, case, matrix = city_source(source)
    try:
        textured = _prepared_texture(directory, case, matrix)
        origin = textured.world_bounds(matrix).mean(axis=0)
        mesh, image = textured.load_textured(matrix, origin, budget=4 << 20)
        if mesh.n_points and image is not None:
            texture = pv.Texture(image)
            texture.interpolate, texture.mipmap = True, True
            plotter.add_mesh(
                mesh, texture=texture, show_scalar_bar=False, smooth_shading=False, ambient=0.65, diffuse=0.35
            )
            return [mesh.points]
    except (
        MeshNotPrepared,
        OSError,
        ValueError,
        EOFError,
        KeyError,
        TypeError,
        AttributeError,
        IndexError,
        BadZipFile,
        MemoryError,
    ):
        mesh = image = texture = None

    # 텍스처가 없는 공간은 기존 회색 형상 경로로 표시
    city, matrix = city_mesh(source)
    origin = city.world_bounds(matrix).mean(axis=0)
    level = len(city.index["lods"]) - 1
    tiles = city.tiles(matrix)
    per_tile = max(1, 400000 // max(1, len(tiles)))
    points_for_fit = []
    for tile in tiles:
        piece = load_tile(city.cache / f"lod{level}" / f"{tile['name']}.npz")
        faces = piece["faces"][:: max(1, math.ceil(len(piece["faces"]) / per_tile))]
        if not faces.size:
            continue
        indices, inverse = np.unique(faces, return_inverse=True)
        points = apply(matrix, np.asarray(piece["points"][indices], dtype=np.float64) + city.anchor) - origin
        cells = np.column_stack([np.full(len(faces), 3), inverse.reshape(-1, 3)])
        mesh = pv.PolyData(points, cells)
        plotter.add_mesh(
            mesh,
            scalars=points[:, 2],
            cmap="bone",
            show_scalar_bar=False,
            smooth_shading=False,
            ambient=0.45,
            diffuse=0.55,
        )
        points_for_fit.append(points)
    return points_for_fit


def _flow(source, plotter, asset_root, context):
    """원본 유동장과 화면 맞춤용 유효 좌표 반환"""
    import pyvista as pv

    from modules.visualization.scenes.fields import scene

    preview = scene(source, {"mode": "points", "frame": 0, "maxCells": 16000}, asset_root, context)
    points_for_fit = []
    for asset in preview["assets"]:
        if asset["kind"] == "points":
            packed = np.fromfile(asset_root / asset["filename"], dtype="<f4").reshape(-1, 4)
            packed = packed[np.isfinite(packed).all(axis=1)]
            if not len(packed):
                continue
            plotter.add_mesh(
                pv.PolyData(packed[:, :3]),
                scalars=packed[:, 3],
                cmap="viridis",
                show_scalar_bar=False,
                point_size=3,
                render_points_as_spheres=False,
            )
            points_for_fit.append(packed[:, :3])
    return points_for_fit


def _fit_camera(plotter, points_for_fit):
    """실제 좌표의 카메라 평면 투영으로 잘림 없이 미리보기 화면 맞춤"""
    camera = plotter.camera
    position = np.asarray(camera.position, dtype=np.float64)
    focal = np.asarray(camera.focal_point, dtype=np.float64)
    direction = focal - position
    direction /= np.linalg.norm(direction)
    right = np.cross(direction, np.asarray(camera.up, dtype=np.float64))
    right /= np.linalg.norm(right)
    up = np.cross(right, direction)
    basis = np.column_stack([right, up, direction])

    # 실제 점을 나누어 투영하여 빈 상자 모서리에 의한 과도한 여백 방지
    lower = np.full(3, np.inf)
    upper = np.full(3, -np.inf)
    for points in points_for_fit:
        for start in range(0, len(points), 65536):
            chunk = np.asarray(points[start : start + 65536], dtype=np.float64)
            chunk = chunk[np.isfinite(chunk).all(axis=1)]
            if not len(chunk):
                continue
            projected = chunk @ basis
            lower = np.minimum(lower, projected.min(axis=0))
            upper = np.maximum(upper, projected.max(axis=0))
    if not np.isfinite(lower).all() or not np.isfinite(upper).all():
        raise ValueError("Dataset has no finite points for preview framing.")

    # 제한 축의 양쪽에 9퍼센트 여백을 확보하고 깊이 잘림 범위 갱신
    width, height = plotter.window_size
    extent = upper - lower
    half_height = max(extent[1] / 2, extent[0] * height / (2 * width), 1e-6)
    scale = half_height / 0.82
    center = basis @ ((lower + upper) / 2)
    distance = max(float(np.linalg.norm(focal - position)), float(extent[2]) + 2 * scale)
    camera.focal_point = center
    camera.position = center - direction * distance
    camera.parallel_scale = scale
    plotter.reset_camera_clipping_range()


def render(source, asset_root, context):
    """카드용 원본 형상 또는 유동장 이미지를 작업 프로세스에서 생성"""
    import pyvista as pv
    from PIL import Image

    from modules.visualization.assets.codecs import write_asset

    plotter = pv.Plotter(off_screen=True, window_size=(640, 480))
    try:
        plotter.set_background("#e8eff7", top="#f8fafc")
        geometry = bool(source.get("case", {}).get("mesh") or source.get("geometrySource")) or any(
            name.lower().endswith((".obj", ".stl")) for name in source.get("paths", [])
        )
        if geometry:
            points_for_fit = city_geometry(source, plotter)
        else:
            points_for_fit = _flow(source, plotter, asset_root, context)
        if not plotter.actors:
            raise ValueError("Dataset has no visible geometry or finite flow cells.")
        plotter.view_isometric()
        plotter.enable_parallel_projection()
        plotter.reset_camera()
        _fit_camera(plotter, points_for_fit)
        image = plotter.screenshot(return_img=True)
        output = io.BytesIO()
        Image.fromarray(image).save(output, format="PNG", optimize=True)
        return {"filename": write_asset(asset_root, context, "png", output.getvalue())}
    finally:
        plotter.close()
