"""요청에 포함된 예측 배열만으로 공개 시각화 생성"""

from __future__ import annotations

import base64
import io
import os
import re
import tempfile
from pathlib import Path

import numpy as np

from modules.infrastructure.formats.prediction import build_grid, load_prediction, prediction_size_limit
from modules.visualization.media.public import CONTENT_TYPES, MAX_MEDIA_BYTES, media_options, orbit_media


def prediction_path(value):
    """공개 요청 전용 임시 디렉터리의 예측 파일만 허용"""
    if not isinstance(value, str) or not value or "\x00" in value:
        raise ValueError("Prediction input_path must be an absolute temporary file path.")
    root = Path(
        os.environ.get("FLOWCAST_PUBLIC_TEMP_DIR", str(Path(tempfile.gettempdir()) / "flowcast-public"))
    )
    path = Path(value)
    parent = path.parent
    if (
        not root.is_absolute()
        or ".." in root.parts
        or not path.is_absolute()
        or ".." in path.parts
        or path.name not in {"prediction.npz", "result.npz"}
        or parent.parent != root
        or re.fullmatch(r"request-[A-Za-z0-9_-]+", parent.name) is None
        or any(item.is_symlink() for item in (path, *path.parents))
        or parent.resolve().parent != root.resolve()
    ):
        raise ValueError("Prediction input_path must belong to a public request temporary directory.")
    if not path.is_file():
        raise FileNotFoundError("Prediction temporary file was not found.")
    if not 0 < path.stat().st_size <= prediction_size_limit():
        raise ValueError("Prediction temporary file size is outside the allowed range.")
    return path


def validate_options(request, case):
    """독립 시각화의 물리 좌표와 출력 옵션 검증"""
    allowed = {
        "field",
        "representation",
        "axis",
        "position",
        "width",
        "height",
        "include_mesh",
        "format",
        "fps",
        "frames",
        "animation",
    }
    if not isinstance(request, dict) or set(request) - allowed:
        raise ValueError("Visualization options contain an unsupported field.")
    options = {
        "field": request.get("field", "speed"),
        "representation": request.get("representation", "slice"),
        "axis": request.get("axis", "z"),
        "width": request.get("width", 1280),
        "height": request.get("height", 720),
        "include_mesh": request.get("include_mesh", True),
        **media_options(request),
    }
    if options["field"] not in ("speed", "pressure"):
        raise ValueError("Field must be speed or pressure.")
    if options["representation"] not in ("slice", "streamlines"):
        raise ValueError("Representation must be slice or streamlines.")
    if options["representation"] == "streamlines" and options["field"] != "speed":
        raise ValueError("Streamlines require a velocity field.")
    if options["axis"] not in ("x", "y", "z"):
        raise ValueError("Axis must be x, y, or z.")
    for name, minimum, maximum in (("width", 320, 1920), ("height", 256, 1080)):
        if type(options[name]) is not int or not minimum <= options[name] <= maximum:
            raise ValueError(f"{name} must be an integer from {minimum} to {maximum}.")
    if type(options["include_mesh"]) is not bool:
        raise ValueError("include_mesh must be a boolean.")

    # 격자의 최소 모서리와 셀 간격으로 실제 영역 계산
    options["bounds_min"] = case["origin"]
    options["bounds_max"] = case["origin"] + np.asarray(case["prediction"].shape[:0:-1]) * case["spacing"]
    axis = "xyz".index(options["axis"])
    position = request.get("position")
    if position is None:
        position = float((options["bounds_min"][axis] + options["bounds_max"][axis]) / 2)
    if isinstance(position, bool) or not isinstance(position, (int, float)) or not np.isfinite(position):
        raise ValueError("Position must be a finite physical coordinate in metres.")
    if not options["bounds_min"][axis] < position < options["bounds_max"][axis]:
        raise ValueError("Slice position must be inside the prediction domain.")
    options["position"] = float(position)
    return options


def building_surface(case, pv):
    """예측 격자의 고체 셀에서 외부 형상 없이 건물 표면 생성"""
    solid = ~case["fluid_mask"][0]
    if not solid.any():
        return None
    nz, ny, nx = solid.shape
    grid = pv.ImageData(dimensions=(nx + 1, ny + 1, nz + 1), origin=case["origin"], spacing=case["spacing"])
    grid.cell_data["solid"] = solid.ravel(order="C").astype(np.uint8)
    return grid.threshold(0.5, scalars="solid", preference="cell").extract_surface(
        algorithm="dataset_surface"
    )


def display_grid(case, options, pv):
    """유효 유체 셀에서 단면 또는 유선 생성"""
    grid = build_grid(case, pv)
    center = (options["bounds_min"] + options["bounds_max"]) / 2
    axis = "xyz".index(options["axis"])
    center[axis] = options["position"]
    if options["representation"] == "slice":
        return grid.slice(normal=np.eye(3)[axis], origin=center)
    points = grid.cell_centers().points
    seeds = points[np.abs(points[:, axis] - options["position"]) <= case["spacing"][axis]]
    if not seeds.size:
        raise ValueError("No flow cells are available to seed streamlines on this slice.")
    seeds = seeds[np.linspace(0, len(seeds) - 1, min(128, len(seeds)), dtype=int)]
    return grid.cell_data_to_point_data().streamlines_from_source(
        pv.PolyData(seeds),
        vectors="velocity",
        integration_direction="both",
        max_length=float(np.linalg.norm(options["bounds_max"] - options["bounds_min"]) * 2),
        initial_step_length=0.5,
        max_steps=2000,
        terminal_speed=1e-8,
        interpolator_type="cell",
    )


def render_public_prediction(params, *, workspace=None):
    """독립 예측 파일을 읽어 PNG 또는 카메라 회전 영상 반환"""
    if not isinstance(params, dict) or set(params) - {"input_path", "options"}:
        raise ValueError("Public rendering parameters contain an unsupported field.")
    case = load_prediction(prediction_path(params.get("input_path")))
    case["prediction"][:, ~case["mask"]] = 0
    options = validate_options(params.get("options", {}), case)
    try:
        import pyvista as pv
        from PIL import Image
    except ImportError as error:
        raise RuntimeError("PyVista visualization dependencies are not installed.") from error

    # 요청 배열에서만 유동장과 건물 레이어 구성
    display = display_grid(case, options, pv)
    if not display.n_cells:
        raise ValueError("No flow data is available for the requested settings.")
    buildings = building_surface(case, pv) if options["include_mesh"] else None
    plotter = pv.Plotter(off_screen=True, window_size=(options["width"], options["height"]))
    unit = "m/s" if options["field"] == "speed" else "Pa"
    try:
        plotter.set_background("#f5f7fa")
        plotter.add_mesh(
            display,
            scalars=options["field"],
            cmap="viridis",
            lighting=False,
            scalar_bar_args={"title": f"{options['field']} [{unit}]"},
            line_width=2,
            render_lines_as_tubes=options["representation"] == "streamlines",
        )
        if buildings is not None:
            plotter.add_mesh(buildings, color="#969da5", smooth_shading=False)
        if (
            options["format"] == "png"
            and options["representation"] == "slice"
            and not options["include_mesh"]
        ):
            {"x": plotter.view_yz, "y": plotter.view_xz, "z": plotter.view_xy}[options["axis"]]()
            plotter.enable_parallel_projection()
        else:
            plotter.view_isometric()
        plotter.add_axes()
        plotter.show_bounds(
            grid="back", location="outer", all_edges=True, xtitle="X [m]", ytitle="Y [m]", ztitle="Z [m]"
        )
        plotter.reset_camera()

        # 기존 영상 인코더와 부모 소유 작업 디렉터리 재사용
        if options["format"] == "png":
            output = io.BytesIO()
            with Image.fromarray(plotter.screenshot(return_img=True)) as picture:
                picture.save(output, format="PNG")
            payload = output.getvalue()
        else:
            payload = orbit_media(plotter, options, workspace=workspace)
    finally:
        plotter.close()
    if len(payload) > MAX_MEDIA_BYTES:
        raise ValueError("Visualization output exceeds the 20 MiB limit. Reduce image dimensions.")
    return {
        "image_base64" if options["format"] == "png" else "data_base64": base64.b64encode(payload).decode(
            "ascii"
        ),
        "media_type": CONTENT_TYPES[options["format"]],
        "metadata": {
            "field": options["field"],
            "units": unit,
            "representation": options["representation"],
            "axis": options["axis"],
            "position": options["position"],
            "dimensions": list(case["prediction"].shape[1:]),
            "axis_order": "ZYX",
            "origin": case["origin"].tolist(),
            "spacing": case["spacing"].tolist(),
            "origin_convention": "minimum_corner",
            "valid_cells": int(case["mask"].sum()),
            "geometry": "building_mask" if buildings is not None else None,
            **(
                {
                    "animation": "orbit",
                    "static_prediction": True,
                    "frames": options["frames"],
                    "fps": options["fps"],
                }
                if options["format"] != "png"
                else {}
            ),
        },
    }
