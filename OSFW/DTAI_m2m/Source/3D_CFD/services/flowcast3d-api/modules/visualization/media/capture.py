import io
import json
import math
from numbers import Integral, Real

import numpy as np
import vtk
from PIL import Image, PngImagePlugin

from modules.visualization.rendering import block_map, plume_field, plume_shells, section_depth
from modules.visualization.rendering import plume_palette as playback_plume

MAX_PIXELS = 4096 * 4096


def smoothing_tag(sigma):
    width = float(np.mean(sigma))
    return f"추가 평활화 σ≈{width:.1f} m" if width >= 0.05 else None


def backdrop_metadata(scene, section):
    camera = scene.plotter.camera
    low, high = section.range
    return {
        "purpose": "presentation only, secondary to the measured plane",
        "span_metres": float(section.depth.span),
        "solid_faces": int(section.depth.blocks),
        "veil_opacity": section_depth.VEIL,
        "veil_range_fraction": section_depth.FADE,
        "visible_below_display_value": float(low * (high / low) ** section_depth.FADE),
        "brightness_cap_colour_index": section_depth.CAP,
        "brightness_cap_luma": round(section_depth.cap_luma(), 1),
        "eye_metres": float(np.linalg.norm(np.subtract(camera.position, camera.focal_point))),
        "view_angle_degrees": float(camera.view_angle),
    }


def capture_settings(scene):
    """재현할 수 있도록 카메라와 자동 색 범위를 고정 설정으로 저장"""
    settings = scene.settings.model_copy(deep=True)
    settings.camera = scene.camera()
    settings.overview_bounds = scene.focus_bounds if settings.overview else None
    if settings.particles.visible and settings.particles.style == "flow" and scene.particles is not None:
        settings.particles.color_range = tuple(float(value) for value in scene.particles.speed_range)
    look = settings.arrows
    if look.visible and scene.velocity:
        look.color_range = tuple(float(value) for value in scene.arrow_lut.scalar_range)
        scale = scene.arrow_scale(settings)
        look.reference_speed = look.reference_speed or (
            scale.volume_reference if look.mode == "volume" else scale.reference
        )
    if scene.plume is not None:
        # 재생 이력에 따른 자동 범위도 고정값으로 남겨 색 재현
        settings.plume.map_range = tuple(float(value) for value in scene.plume.column_map.panel.range)
        if scene.plume.section is not None:
            settings.plume.section_range = tuple(float(value) for value in scene.plume.section.range)
        if scene.plume.cube is not None:
            settings.plume.cube_range = tuple(float(value) for value in scene.plume.cube.range)
        if scene.plume.field is not None:
            settings.plume.field_range = tuple(float(value) for value in scene.plume.field.range)
        if scene.plume.shells is not None and scene.plume.shells.levels:
            settings.plume.shells.levels = tuple(float(level) for level in scene.plume.shells.levels)
    if look.visible and look.mode == "volume" and look.paths and not scene.plume_arrows(settings):
        seeds = scene.arrow_seed_points
        if seeds is not None:
            look.seed_points = [tuple(float(coordinate) for coordinate in point) for point in seeds]
    return settings


def capture_metadata(scene):
    """이미지와 함께 출처 및 표시 조건 기록"""
    settings, result = scene.settings, scene.result
    camera = scene.camera().model_dump(mode="json")
    camera.update(
        parallel_projection=bool(scene.plotter.camera.parallel_projection),
        parallel_scale=float(scene.plotter.camera.parallel_scale),
        clipping_range=list(scene.plotter.camera.clipping_range),
        coordinates="world metres",
    )
    output = {
        "schema": "flowcast.capture/1",
        "case": {
            "id": scene.case.id,
            "name": scene.case.name,
            "synthetic": scene.case.synthetic,
            "attribution": scene.case.attribution.model_dump(mode="json") if scene.case.attribution else None,
        },
        "camera": camera,
        "settings": capture_settings(scene).model_dump(mode="json"),
        "render_origin": scene.origin.tolist(),
        "interpretation": {
            "volume_arrows": "Original stored velocity u/v/w, with temporal and spatial interpolation only.",
            "connected_lines": "Instantaneous streamlines of the displayed field; not particle trajectories.",
            "source_connected_flow": "Tubes along instantaneous original-velocity streamlines in source-connected virtual concentration. Width is visual; colour is virtual particle transport, not deep-learning concentration.",
            "flow_particles": "Original-velocity tracers coloured by speed (m/s). Trails show integrated positions; point density is visual, not pollutant concentration.",
            "concentration": "Virtual particle-transport concentration, not a deep-learning concentration prediction.",
            "concentration_field": "Fluid-volume-weighted block means of virtual concentration with mass-conserving smoothing between fluid cells, without crossing solids. Shared by colour-map and iso-surface views; transport is unchanged.",
            "concentration_colour_map": "Maximum-intensity projection of the display concentration on its log colour scale. Opacity follows plume.field.opacity_points; values below the range are hidden.",
            "concentration_shells": "Iso-surfaces of the shared display estimate at plume.shells.levels, with no further smoothing. Each threshold uses its colour-map colour; opacity is visual.",
            "wind_streamlines": "Instantaneous streamlines of displayed velocity; seed placement and building-distance filters are recorded in streamlines. Colour is the displayed quantity; line density is visual.",
            "model_solid_buildings": "Colour-map, iso-surface and streamline views use the prediction solid grid (settings.buildings.geometry = mask).",
            "column_mass": "Virtual concentration integrated vertically as sum(C * dz) in micrograms per square metre, with mass-conserving fluid-column smoothing and bilinear log-space display interpolation.",
            "city_blocks": (
                f"Model-solid map: single-cell pits and spikes removed, minimum area {block_map.MIN_AREA:g} m², "
                f"roof heights rounded up to {block_map.TIER}-cell tiers, outline tolerance {block_map.TOLERANCE:g} cell, "
                f"shadows up to {block_map.SHADOW:g} m. Display only; source picking uses the unrounded roof height."
            ),
            "concentration_section": "Source-intersecting vertical concentration slice (micrograms per cubic metre), with mass-conserving in-plane smoothing and bilinear log-space display interpolation. Solid cells carry no concentration.",
            "section_depth_backdrop": "Presentation-only backdrop behind the section, secondary to the measured plane: clipped solids and box walls. Shown below depth_backdrop.visible_below_display_value, capped by brightness_cap_colour_index; carries no readable concentration. Slice values and colour range are unchanged.",
            "concentration_cube": "Source-section half-box: front is the source slice; other faces use boundary-cell layers. Concentration is in micrograms per cubic metre; full height, face smoothing and a shared log range are retained.",
            "source_marker": "Screen-sized release marker drawn above scene surfaces. The 3D stem marks height; the map pin marks location. Hidden when the cube source face points away; size is visual.",
            "display_range": "Running maximum rounded up to 0.25 decades with a three-decade span; resets on release restart. Below range: lowest colour in cubes, translucent veil in sections, transparent on maps.",
            "pollutant": "Material name only; substance-specific transport properties are not applied.",
            "dynamic_wind": (
                "Optional visual fluctuation is enabled for eligible layers; volume arrows and flow particles use original velocity."
                if settings.dynamic_wind.enabled
                else "Disabled."
            ),
        },
        "result": None,
        "frame": None,
        "grid": None,
        "inflow": None,
        "plume": None,
        "streamlines": None,
        "flow_particles": None,
        "source_connected_flow": None,
    }
    if result is not None:
        metadata = result.metadata
        frame = settings.frame
        following = min(frame + 1, result.n_frames - 1)
        phase = settings.phase if following != frame else 0.0
        output["result"] = {
            "job_id": metadata.job_id,
            "path": str(result.path),
            "synthetic": metadata.synthetic,
            "history_frames": metadata.history_frames,
            "completed_steps": metadata.completed_steps,
            "channels": [channel.model_dump(mode="json") for channel in metadata.channels],
        }
        output["frame"] = {
            "index": frame,
            "phase": phase,
            "next_index": following,
            "kind": "prediction" if result.predicted(frame) else "initial",
            "next_kind": "prediction" if result.predicted(following) else "initial",
            "time_seconds": float(result.times[frame] * (1 - phase) + result.times[following] * phase),
        }
        output["grid"] = result.grid.model_dump(mode="json")
        inflow = result.provenance.get("inflow") or (metadata.prediction or {}).get("inflow")
        if isinstance(inflow, dict):
            output["inflow"] = {
                key: float(inflow[key])
                for key in ("direction", "speed")
                if isinstance(inflow.get(key), Real)
                and not isinstance(inflow[key], bool)
                and math.isfinite(inflow[key])
            } or None
    if scene.plume is not None:
        transport = scene.plume.plume
        output["plume"] = {
            "visible": settings.plume.visible,
            "elapsed_seconds": float(transport.elapsed),
            "source": transport.source.tolist(),
            "transport": transport.transport,
            "pollutant": settings.plume.pollutant,
            "particle_count": len(transport.points),
            "opacity_reference_range": list(scene.plume.default_range),
            "colour_range": list(scene.plume.range),
        }
        if (scene.is_field_view or scene.is_iso_view) and scene.plume.field is not None:
            field = scene.plume.field
            output["plume"]["field"] = {
                "quantity": "virtual_concentration",
                "unit": "µg/m³",
                "colour_map": plume_field.CMAP,
                "grid_cells_grouped": field.step,
                "grid_shape": list(field.valid.shape),
                "smoothing_sigma_metres": [float(value) for value in field.sigma],
                "display_range": list(field.range),
                "display_range_rule": (
                    "running maximum of the display estimate rounded up to a quarter decade, three decades wide, "
                    "reset when the release restarts"
                ),
                "raw_peak": float(np.max(scene.plume.concentration, initial=0.0)),
                "displayed_peak": float(field.peak),
                "blend": "maximum intensity along the view ray",
                "opacity_points": [list(point) for point in playback_plume.RAMPS[plume_field.RAMP]],
                "opacity_unit_distance_cells": plume_field.DENSITY,
            }
        if scene.is_iso_view and scene.plume.shells is not None:
            shells = scene.plume.shells
            drawn = [surface for surface in shells.data if surface.n_cells]
            output["plume"]["shells"] = {
                "quantity": "virtual_concentration",
                "unit": "µg/m³",
                "levels": [float(level) for level in shells.levels],
                "level_rule": (
                    f"innermost shell {plume_shells.TOP:g} decades below the highest displayed cell, then "
                    f"{plume_shells.DROP:g} decade steps outwards, clipped into the displayed colour range"
                ),
                "displayed_peak": float(shells.peak),
                "display_range": list(scene.plume.field.range),
                "innermost_opacity": float(settings.plume.shells.opacity),
                "outer_opacity_factor": plume_shells.FADE,
                "surface_cells": [int(surface.n_cells) for surface in drawn],
                "extra_smoothing": "none",
            }
        if settings.plume.section and scene.plume.section is not None:
            section = scene.plume.section
            output["plume"]["section"] = {
                "axis": "xy"[section.axis],
                "position_world_metres": section.position,
                "cell_index": section.index,
                "quantity": "virtual_concentration",
                "unit": "µg/m³",
                "smoothing_passes": list(section.passes),
                "smoothing_sigma_metres": list(section.sigma),
                "display_range": list(section.range),
                "raw_peak": float(np.max(np.nan_to_num(section.values), where=section.fluid, initial=0.0)),
                "displayed_peak": float(section.field.max()),
            }
            # 단면 뒤 배경은 표시 당시 카메라와 함께 기록
            if scene.is_section_view:
                output["plume"]["section"]["depth_backdrop"] = backdrop_metadata(scene, section)
        if scene.is_cube_view and scene.plume.cube is not None:
            cube = scene.plume.cube
            output["plume"]["cube"] = {
                "front_axis": "xy"[cube.axis],
                "front_position_world_metres": cube.position,
                "front_cell_index": cube.index,
                "box_bounds_world_metres": [
                    [float(edge[0]) for edge in cube.box_edges],
                    [float(edge[-1]) for edge in cube.box_edges],
                ],
                "quantity": "virtual_concentration",
                "unit": "µg/m³",
                "smoothing_sigma_metres": list(cube.sigma),
                "display_range": list(cube.range),
                "displayed_peak": max(float(face.field.max()) for face in cube.faces),
            }
        if settings.plume.footprint:
            column = scene.plume.column_map
            output["plume"]["column_map"] = {
                "quantity": "column_mass",
                "unit": "µg/m²",
                "smoothing_passes": list(column.passes),
                "smoothing_sigma_metres": list(column.sigma),
                "display_range": list(column.panel.range),
                "raw_peak": float(column.mass.max()),
                "displayed_peak": float(column.field.max()),
            }
    if settings.particles.visible and settings.particles.style == "flow" and scene.particles is not None:
        layer = scene.particles
        output["flow_particles"] = {
            "visible": True,
            "particle_count": layer.particles.count,
            "seed": layer.particles.random_seed,
            "seed_position": layer.seed_position,
            "position": layer.position,
            "discontinuities": [list(interval) for interval in layer.discontinuities],
            "discontinuity_meaning": "Frame-position intervals that reseeded visual tracers after a long playback step; trails do not connect across these intervals.",
            "colour_quantity": "speed",
            "colour_unit": "m/s",
            "colour_range": list(layer.speed_range),
            "velocity_source": "original stored u/v/w; no dynamic-wind correction",
            "state": "Captured without advancing or reseeding; replay requires the original seeding position and integration sequence.",
        }
    if settings.streamlines.visible:
        # 순환 가져오기를 피하도록 사용 시점에 가져옴
        from modules.visualization.rendering import scene_support as scene_module

        city = settings.streamlines.seeding == "city"
        output["streamlines"] = {
            "visible": True,
            "seed_cap": settings.streamlines.density,
            "seed_placement": (
                f"{scene_module.STREAM_UPWIND:.0%} on a uniform grid just inside the strongest inflow face, the rest near buildings; "
                "all below the canopy ceiling"
                if city
                else "uniform grid just inside the display-grid face with the strongest mean inflow"
            ),
            "seed_count": int(scene.seeds.n_points) if scene.seeds is not None else 0,
            "seed_reach_metres": scene_module.STREAM_REACH if city else None,
            "canopy_rule": (
                f"{scene_module.STREAM_CANOPY:g} x the 75th-percentile roof height above the grid floor"
                if city
                else None
            ),
            "integration": "both directions from each seed" if city else "forward from each seed",
            "max_length_grid_diagonals": scene_module.STREAM_SPAN if city else 2.0,
            "max_steps": scene_module.STREAM_STEPS if city else None,
            "near_buildings_only": bool(settings.streamlines.near_buildings),
            "kept_within_metres": scene_module.STREAM_NEAR if settings.streamlines.near_buildings else None,
            "line_width_pixels": float(settings.streamlines.width),
            "line_count": int(scene.line_data.n_lines),
            "colour_quantity": settings.quantity,
            "colour_unit": (result.quantities.get(settings.quantity) if result is not None else None),
            "colour_range": list(scene.range),
            "velocity_source": "original stored u/v/w on the display grid; no dynamic-wind correction",
            "geometry": "instantaneous streamlines; not particle trajectories",
        }
    if scene.plume_arrows(settings) and settings.arrows.style == "ribbons":
        diagnostics = scene.source_ribbon_diagnostics
        output["source_connected_flow"] = {
            "visible": True,
            "scope": "source-connected nonzero virtual-concentration region",
            "geometry": "display tubes around instantaneous streamlines; not particle trajectories",
            "line_count": scene.arrow_path_data.n_lines,
            "colour_quantity": "virtual_concentration",
            "colour_unit": "µg/m³",
            "colour_range": list(scene.arrow_lut.scalar_range),
            "velocity_source": "original stored u/v/w; no dynamic-wind correction",
            "tube_width": "rendering choice; not a physical plume width or mass-flow measurement",
            "display_radius_metres": diagnostics.get("display_radius"),
            "concentration_threshold_ug_m3": diagnostics.get("concentration_threshold"),
            "source_connected_cells": diagnostics.get("source_connected_count", 0),
            "excluded_disconnected_cells": diagnostics.get("disconnected_count", 0),
            "excluded_short_or_remote_lines": diagnostics.get("discarded_fragment_count", 0),
            "minimum_path_length_metres": diagnostics.get("minimum_path_length"),
        }
    output["overview"] = {
        "visible": bool(settings.overview),
        "meaning": "City position only: grey model-solid height, red source and focus-region outline. Not concentration.",
        "focus_bounds_world": scene.focus_bounds if settings.overview else None,
    }
    return output


def caption_actors(scene, height):
    from modules.visualization.rendering.scene_support import set_font

    meta = capture_metadata(scene)
    mode = scene.presentation_mode()
    title = scene.case.name.partition(" (")[0]
    title += "  /  " + {
        "flow": "3D 유동장",
        "plume": "오염물질 흐름",
        "colormap": "오염물질 농도 컬러맵",
        "iso": "오염물질 농도 등가면",
        "stream": "바람 유선",
        "section": "오염물질 확산 단면",
        "city": "도시 오염물질 분포",
        "city3d": "도시 3D 배출 분포",
        "cube": "오염물질 입체 확산",
    }.get(mode, "유동 분석")
    frame = meta["frame"]
    details = []
    if frame is not None:
        kind = "AI 예측" if frame["kind"] == "prediction" else "입력 이력"
        if frame["phase"] > 0 and frame["kind"] != frame["next_kind"]:
            kind = "입력/AI 예측 보간"
        details = [kind, f"t = {frame['time_seconds']:.2f} s"]
        if meta["result"]["synthetic"]:
            details.append("합성 초기장 기반")
    if mode in ("city", "city3d"):
        details.append("연직 적분량 · 지면 농도 아님" if mode == "city" else "3D 가상 배출 농도")
        details.append(
            "원본 속도 이류" if scene.settings.plume.transport == "prediction" else "가상 난류 확산 포함"
        )
        if meta["plume"] is not None:
            details.append(f"배출 {meta['plume']['elapsed_seconds']:.1f} s")
        if mode == "city" and scene.plume is not None:
            details.append(smoothing_tag(scene.plume.column_map.sigma))
    elif mode in ("colormap", "iso"):
        details.append("3D 가상 배출 농도 (㎍/㎥)" + (" · 시선 방향 최댓값" if mode == "colormap" else ""))
        details.append(
            "원본 속도 이류" if scene.settings.plume.transport == "prediction" else "가상 난류 확산 포함"
        )
        if mode == "iso" and scene.plume is not None and scene.plume.shells is not None:
            levels = scene.plume.shells.levels
            shown = " / ".join(f"{level:.3g}" for level in levels)
            details.append(f"등가면 {shown}" if levels else "등가면 없음")
        if meta["plume"] is not None:
            details.append(f"배출 {meta['plume']['elapsed_seconds']:.1f} s")
        if scene.plume is not None and scene.plume.field is not None:
            details.append(smoothing_tag(scene.plume.field.sigma))
    elif mode == "stream":
        details.append("원본 속도 순간 유선 · 색: 풍속 (m/s)")
        details.append(f"유선 {scene.line_data.n_lines}개")
    elif scene.plume_arrows(scene.settings):
        details.append("가상 배출 농도 · 원본 속도 순간 유선")
        if meta["plume"] is not None:
            details.append(f"배출 {meta['plume']['elapsed_seconds']:.1f} s")
    elif mode == "cube" and scene.plume is not None and scene.plume.cube is not None:
        cube = scene.plume.cube
        details.append(f"배출원 {'xy'[cube.axis]} = {cube.position:.2f} m 절단 상자 · 가상 농도 (㎍/㎥)")
        details.append(f"배출 {meta['plume']['elapsed_seconds']:.1f} s")
        details.append(smoothing_tag(cube.sigma))
    elif mode == "section":
        section = scene.plume.section
        details.append(f"{'xy'[section.axis]} = {section.position:.2f} m · 가상 농도 (㎍/㎥)")
        details.append(f"뒤쪽 {section.depth.span:.0f} m는 거리로 흐린 연출용 격자 영역 배경")
        details.append(f"배출 {meta['plume']['elapsed_seconds']:.1f} s")
        details.append(smoothing_tag(section.sigma))
    elif meta["flow_particles"] is not None:
        details.append("원본 속도 추적 입자 · 색: 풍속 (m/s)")
    elif scene.settings.arrows.mode == "volume" and scene.settings.arrows.visible:
        details.append("원본 속도 유선")
    look = scene.settings.buildings
    if look.visible and look.geometry == "mask":
        details.append("건물: 예측 고체 격자")
    actors = []
    for text, y, size, colour in (
        (title, 0.955, 20, (0.08, 0.14, 0.23)),
        ("  ·  ".join(detail for detail in details if detail), 0.915, 12, (0.30, 0.37, 0.46)),
    ):
        actor = vtk.vtkTextActor()
        actor.SetInput(text)
        actor.GetPositionCoordinate().SetCoordinateSystemToNormalizedViewport()
        actor.GetPositionCoordinate().SetValue(0.03, y)
        prop = actor.GetTextProperty()
        prop.SetFontSize(max(10, round(size * height / 720)))
        prop.SetColor(*colour)
        prop.SetVerticalJustificationToTop()
        prop.SetBackgroundColor(1, 1, 1)
        prop.SetBackgroundOpacity(0.92)
        set_font(prop)
        scene.plotter.renderer.AddViewProp(actor)
        actors.append(actor)
    return actors


def capture_png(scene, plotter=None, scale=2, caption=False):
    if isinstance(scale, bool) or not isinstance(scale, Integral) or not 1 <= scale <= 3:
        raise ValueError("Capture scale must be an integer from 1 to 3.")
    plotter = scene.plotter if plotter is None else plotter
    if plotter.render_window is None:
        raise ValueError("Render window is closed and cannot be captured.")
    size = tuple(plotter.window_size)
    if len(size) != 2 or any(side <= 0 for side in size):
        raise ValueError("Render window dimensions must be positive for capture.")
    if math.prod(size) * scale**2 > MAX_PIXELS:
        raise ValueError("Capture exceeds the 16-megapixel limit. Reduce the window size or capture scale.")
    renderers = list(plotter.render_window.GetRenderers())
    if scene.plotter.renderer not in renderers:
        raise ValueError("Capture window must contain the current scene renderer.")
    cameras, visibility = [], []
    for renderer in renderers:
        camera = renderer.GetActiveCamera()
        saved = camera.NewInstance()
        saved.DeepCopy(camera)
        cameras.append((camera, saved))
        visibility.extend((prop, prop.GetVisibility()) for prop in renderer.GetViewProps())
    image_scale, transparent = plotter.image_scale, plotter.image_transparent_background
    added = []
    try:
        if caption:
            added = caption_actors(scene, size[1])
        with scene.full_detail():
            plotter.render()
            pixels = plotter.screenshot(return_img=True, scale=int(scale), transparent_background=False)
        metadata = capture_metadata(scene)
        metadata["image"] = {"width": int(pixels.shape[1]), "height": int(pixels.shape[0]), "dpi": 300}
        info = PngImagePlugin.PngInfo()
        info.add_text("flowcast", json.dumps(metadata, ensure_ascii=False, allow_nan=False))
        buffer = io.BytesIO()
        Image.fromarray(pixels).save(buffer, format="PNG", pnginfo=info, dpi=(300, 300))
        return buffer.getvalue()
    finally:
        for actor in added:
            scene.plotter.renderer.RemoveViewProp(actor)
        if tuple(plotter.window_size) != size:
            plotter.window_size = size
        plotter.image_scale, plotter.image_transparent_background = image_scale, transparent
        for camera, saved in cameras:
            camera.DeepCopy(saved)
        for prop, visible in visibility:
            prop.SetVisibility(visible)
