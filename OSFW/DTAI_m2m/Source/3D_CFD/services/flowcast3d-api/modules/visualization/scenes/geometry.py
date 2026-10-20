import json
from pathlib import Path

import numpy as np

from modules.visualization.assets.codecs import bounding_box, cache_key, glb, write_asset
from modules.visualization.readers.uniform import Uniform
from modules.visualization.scenes.sources import city_mesh, scene_origin


def city_geometry(source, reader, selection, asset_root, context):
    from modules.domain.coordinates import apply
    from modules.visualization.geometry.citymesh import load_tile

    origin = scene_origin(reader, source)
    # 비정형 유동장은 원본 표면을 기하 자산으로 사용
    if (
        reader is not None
        and not isinstance(reader, Uniform)
        and not source.get("geometrySource")
        and not any(Path(path).suffix.lower() in {".obj", ".stl"} for path in source.get("paths", []))
    ):
        reader._load(selection.get("frame", 0))
        surface = reader.mesh.extract_surface().triangulate()
        if surface.n_cells > 1_000_000:
            surface = surface.decimate(1 - 1_000_000 / surface.n_cells)
        faces = surface.faces.reshape(-1, 4)[:, 1:]
        name = write_asset(
            asset_root, cache_key([context, "geometry"]), "glb", glb(surface.points - origin, faces)
        )
        return {
            "origin": origin.tolist(),
            "bounds": reader.bounds,
            "time": 0.0,
            "assets": [{"kind": "geometry", "format": "glb", "filename": name}],
            "warnings": [],
        }
    city, matrix = city_mesh(source)
    bounds = city.world_bounds(matrix).tolist()
    from modules.visualization.scenes.textures import prepared_tiles

    textured, warnings = prepared_tiles(source, matrix, origin, selection.get("roi"), asset_root)
    if textured is not None:
        manifest = {
            "asset": {"version": "1.1", "gltfUpAxis": "Z"},
            "geometricError": 0,
            "root": {
                "boundingVolume": bounding_box(textured["bounds"], origin),
                "geometricError": 0,
                "children": textured["children"],
            },
        }
        tileset = write_asset(
            asset_root,
            cache_key([textured["signature"], selection.get("roi"), "textured-tileset"]),
            "json",
            json.dumps(manifest).encode(),
        )
        return {
            "origin": origin.tolist(),
            "bounds": textured["bounds"],
            "time": 0.0,
            "assets": [{"kind": "tiles", "format": "3d-tiles", "filename": tileset}],
            "fallbackAssets": textured["assets"],
            "warnings": warnings,
            "coordinateSystem": "Z_UP",
        }
    chosen = city.tiles(matrix, selection.get("roi"))
    assets, children = [], []
    geometry_key = cache_key(
        {
            "directory": str(city.case_dir),
            "source": city.index.get("source"),
            "schema": city.index.get("schema"),
            "lods": city.index["lods"],
            "matrix": matrix.tolist(),
            "origin": origin.tolist(),
        }
    )
    level = len(city.index["lods"]) - 1
    for tile in chosen:
        world_bounds = city.world_bounds(matrix, tile["bounds"]).tolist()
        branch = None
        for detail in range(level + 1):
            key = cache_key([geometry_key, tile["name"], detail])
            name = f"{key}.glb"
            if not (Path(asset_root) / name).is_file():
                piece = load_tile(city.cache / f"lod{detail}" / f"{tile['name']}.npz")
                points = apply(matrix, np.asarray(piece["points"], dtype=np.float64) + city.anchor) - origin
                write_asset(asset_root, key, "glb", glb(points, piece["faces"]))
            error = (
                0
                if detail == 0
                else float(np.linalg.norm(np.subtract(*world_bounds))) * (1 - city.index["lods"][detail]) / 32
            )
            node = {
                "boundingVolume": bounding_box(world_bounds, origin),
                "geometricError": error,
                "refine": "REPLACE",
                "content": {"uri": f"/app-api/assets/{name}"},
            }
            if branch is not None:
                node["children"] = [branch]
            branch = node
            if detail == level:
                assets.append(
                    {
                        "kind": "geometry",
                        "format": "glb",
                        "filename": name,
                        "tileId": tile["name"],
                        "level": detail,
                        "bounds": world_bounds,
                        "triangles": tile["levels"][detail][1],
                    }
                )
        children.append(branch)
    error = max((child["geometricError"] for child in children), default=0)
    manifest = {
        "asset": {"version": "1.1", "gltfUpAxis": "Z"},
        "geometricError": error,
        "root": {
            "boundingVolume": bounding_box(bounds, origin),
            "geometricError": error,
            "refine": "REPLACE",
            "children": children,
        },
    }
    tileset = write_asset(
        asset_root,
        cache_key([geometry_key, selection.get("roi"), "tileset"]),
        "json",
        json.dumps(manifest).encode(),
    )
    return {
        "origin": origin.tolist(),
        "bounds": bounds,
        "time": 0.0,
        "assets": [{"kind": "tiles", "format": "3d-tiles", "filename": tileset}],
        "fallbackAssets": assets,
        "warnings": warnings,
        "coordinateSystem": "Z_UP",
    }
