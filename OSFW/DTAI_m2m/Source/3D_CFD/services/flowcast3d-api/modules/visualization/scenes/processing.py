from pathlib import Path

from modules.visualization.readers.uniform import open_numeric
from modules.visualization.scenes.analysis import analysis
from modules.visualization.scenes.fields import scene
from modules.visualization.scenes.sources import city_mesh


def inspect(source, asset_root):
    reader = open_numeric(source) if source.get("path") or source.get("paths") else None
    if reader is not None:
        result = reader.descriptor()
        result["capabilities"]["geometry"] |= bool(
            source.get("case", {}).get("mesh") or source.get("geometrySource")
        ) or any(Path(path).suffix.lower() in {".obj", ".stl"} for path in source.get("paths", []))
        return result
    city, matrix = city_mesh(source)
    return {
        "fields": [],
        "times": [],
        "bounds": city.world_bounds(matrix).tolist(),
        "gridKind": "geometry",
        "capabilities": {
            "geometry": True,
            "flow": False,
            "concentration": False,
            "timeseries": False,
            "predict": False,
        },
        "validation": [],
        "geometry": {"levels": len(city.index["lods"]), "tiles": len(city.index["tiles"])},
    }


def process(operation, params):
    """작업 프로세스에서 자료 검사와 표시용 자산 및 원본 집계 수행"""
    root = Path(params["assetRoot"])
    root.mkdir(parents=True, exist_ok=True)
    source = params["source"]
    if operation == "inspect":
        return inspect(source, root)
    if operation == "scene":
        return scene(source, params["selection"], root, params["contextKey"])
    if operation == "analysis":
        return analysis(source, params["selection"], params.get("compareSource"))
    if operation == "thumbnail":
        from modules.visualization.scenes.thumbnails import render

        return render(source, root, params["contextKey"])
    if operation == "dispersion":
        from modules.visualization.scenes.dispersion import simulate

        return simulate(params)
    raise ValueError("Workspace operation is unsupported.")
