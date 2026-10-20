import json
import math
from numbers import Integral, Real
from pathlib import Path
from tempfile import TemporaryDirectory

import numpy as np
import vtk
from PIL import Image, PngImagePlugin

from modules.domain.transport.fields import AXES, velocity
from modules.infrastructure.mongo.assets import (
    discard_export,
    export_target,
    mongo_enabled,
    persist_outputs,
    read_settings,
)
from modules.infrastructure.mongo.storage import open_group, store_exists
from modules.settings.rendering import RenderSettings as Settings
from modules.visualization.geometry.citymesh import CityMesh, MeshNotPrepared
from modules.visualization.media import encode
from modules.visualization.media.capture import capture_metadata, capture_png, capture_settings
from modules.visualization.readers.adapter import DataAdapter, FlowResult, scalar
from modules.visualization.rendering import layers
from modules.visualization.rendering.scene import Scene
from modules.visualization.rendering.scene_support import PLUME_COLOR, set_font
from modules.visualization.rendering.settings import Plume, SceneSettings

MAX_FRAMES = 120
MAX_PIXELS = 1920 * 1080
MAX_TOTAL_PIXELS = 120_000_000
# GIF는 전체 프레임을 메모리에 두므로 MP4보다 상한을 낮게 설정
FRAME_LIMITS = {"gif": MAX_FRAMES, "mp4": 600}
# MP4 임시 프레임의 디스크 예산과 픽셀당 PNG 용량(바이트)
MAX_TOTAL_BYTES = 2**30
FRAME_BYTES = 1.3


def number(value, label):
    if isinstance(value, bool) or not isinstance(value, Real) or not math.isfinite(value):
        raise ValueError(f"{label} must be a finite number.")
    return float(value)


def frame_limit(kind, size):
    """형식별 메모리와 임시 디스크 예산으로 프레임 상한 계산"""
    pixels = max(1, math.prod(size))
    budget = MAX_TOTAL_PIXELS // pixels if kind == "gif" else int(MAX_TOTAL_BYTES / (pixels * FRAME_BYTES))
    return min(FRAME_LIMITS[kind], budget)


def frame_directory(work_dir):
    if work_dir is not None:
        work_dir.mkdir(parents=True, exist_ok=True)
    return TemporaryDirectory(prefix="flowcast-frames-", dir=work_dir)


def sequence(start, end, step, count, limit=MAX_FRAMES):
    """끝 프레임을 포함한 등간격 위치이며 상한 초과 시 거절"""
    start, end, step = (
        number(value, label) for value, label in ((start, "Start"), (end, "End"), (step, "Step"))
    )
    if not 0 <= start < end <= count - 1 or step <= 0:
        raise ValueError(f"Frame interval must satisfy 0 <= start < end <= {count - 1}, with step > 0.")
    intervals = (end - start) / step
    if not math.isclose(intervals, round(intervals), abs_tol=1e-8, rel_tol=1e-10):
        raise ValueError("End frame must be reachable from the start with equal steps.")
    frames = round(intervals) + 1
    if not 2 <= frames <= limit:
        raise ValueError(f"Movie must contain 2 to {limit} frames.")
    return np.linspace(start, end, frames)


def at(settings, position):
    frame = math.floor(position)
    return settings.model_copy(update={"frame": frame, "phase": float(position - frame)})


def displays_plume(settings):
    plume, arrows = settings.plume, settings.arrows
    return plume.visible and (
        plume.cloud
        or plume.field
        or plume.shells.visible
        or plume.footprint
        or plume.section
        or plume.cube
        or (arrows.visible and (Scene.plume_arrows(settings) or arrows.color == PLUME_COLOR))
    )


def announce(report, stage, done, total):
    if report is not None:
        report(stage, done, total)


def prepare_ranges(scene, positions, report=None):
    """전체 내보내기 구간에서 공통 색 범위 계산"""
    result, look = scene.result, scene.settings
    if look.arrows.visible:
        scale = scene.arrow_scale(look)
        roi, budget = scene.arrow_region(look)
        for frame in range(math.floor(positions[0]), math.ceil(positions[-1]) + 1):
            if frame not in scale.frames:
                sample = result.sample(frame, roi, scene.arrow_sample_plane(look), budget)
                scale.add(frame, sample, result.channels, result.quantities)
    planes = [(AXES.index(section.axis), section.position) for section in look.slices if section.visible]
    if any(getattr(look, name).visible for name in ("box", "volume", "isosurface", "streamlines")):
        planes = [None]
    low, high = math.inf, -math.inf
    for index, position in enumerate(positions):
        announce(report, "range", index, len(positions))
        frame, phase = int(position), float(position % 1)
        for plane in planes:
            sample = result.blend(frame, phase, look.roi, plane, look.max_cells)
            values = scalar(sample.values, result.channels, look.quantity)[sample.valid]
            values = values[np.isfinite(values)]
            if len(values):
                low, high = min(low, float(values.min())), max(high, float(values.max()))
    announce(report, "range", len(positions), len(positions))
    return (low, high if high > low else low + 1) if math.isfinite(low) else scene.range


def lock_range(scene, limits):
    scene.range = limits
    scene.lut.scalar_range = limits
    if scene.settings.volume.visible:
        layers.shade(scene.cloud, scene.extension.valid, limits, scene.settings.volume.emphasis)
        scene.style_cloud(scene.settings)
    if scene.settings.isosurface.visible:
        scene.contour(scene.settings)


def prepare_particle_range(scene, positions):
    layer, look = scene.particles, scene.settings.particles
    if layer is None or not look.visible or look.style != "flow":
        return None
    roi, budget = scene.flow_particle_region(scene.settings)
    high = layer.speed_range[1]
    for frame in range(math.floor(positions[0]), math.ceil(positions[-1]) + 1):
        sample = scene.result.sample(frame, roi, None, budget)
        speeds = np.linalg.norm(velocity(sample.values, scene.result.channels)[sample.valid], axis=1)
        finite = speeds[np.isfinite(speeds)]
        if len(finite):
            high = max(high, float(finite.max()))
    limits = (0.0, max(high, 1e-6))
    scene.settings.particles.color_range = limits
    layer.set_speed_range(limits)
    return limits


def plume_statistics(scene):
    if scene.plume is None:
        return None
    layer = scene.plume
    concentration = layer.concentration[layer.deposit.fluid]
    column = layer.column_map.mass
    positive = int(np.count_nonzero(concentration > 0))
    positive_columns = int(np.count_nonzero(column > 0))
    above = int(np.count_nonzero(concentration > layer.range[1]))
    above_columns = int(np.count_nonzero(column > layer.column_map.range[1]))
    return {
        "peak_concentration_ug_m3": float(concentration.max()) if concentration.size else 0.0,
        "positive_concentration_cells": positive,
        "concentration_cells_above_range": above,
        "concentration_fraction_above_range_of_positive_cells": above / positive if positive else 0.0,
        "peak_column_mass_ug_m2": float(column.max()) if column.size else 0.0,
        "positive_columns": positive_columns,
        "columns_above_range": above_columns,
        "column_fraction_above_range_of_positive_columns": above_columns / positive_columns
        if positive_columns
        else 0.0,
        "projection_height_m": layer.column_map.projection_height,
        "colour_reference_height_m": layer.column_map.reference_height,
        "projection": "Vertical concentration integral at the domain-top display plane; not ground concentration.",
    }


def prepare_plume_ranges(scene, positions, release, time_step, report=None):
    """확산을 미리 진행해 모든 프레임의 농도 색 범위 고정"""
    if scene.plume is None:
        return None
    layer = scene.plume
    original = {"concentration": list(layer.range), "column_mass": list(layer.column_map.range)}
    layer.restart()
    previous, peak, column_peak = release, 0.0, 0.0
    occupied_low = layer.plume.source.copy()
    occupied_high = layer.plume.source.copy()
    for index, position in enumerate(positions):
        announce(report, "release", index, len(positions))
        layer.follow(previous, position, time_step)
        layer.draw()
        stats = plume_statistics(scene)
        peak = max(peak, stats["peak_concentration_ug_m3"])
        column_peak = max(column_peak, stats["peak_column_mass_ug_m2"])
        if len(layer.plume.points):
            occupied_low = np.minimum(occupied_low, layer.plume.points.min(axis=0))
            occupied_high = np.maximum(occupied_high, layer.plume.points.max(axis=0))
        previous = position

    def expand(bounds, maximum):
        return bounds[0], max(bounds[1], 10.0 ** math.ceil(math.log10(maximum))) if maximum > 0 else bounds[1]

    concentration_range = expand(layer.range, peak)
    column_range = expand(layer.column_map.range, column_peak)
    scene.settings.plume.color_range = concentration_range
    scene.settings.plume.column_range = column_range
    layer.set_ranges(concentration_range, column_range)
    # 전체 구간에서 같은 농도가 같은 색으로 표시되도록 범위 고정
    scene.settings.plume.map_range = tuple(layer.column_map.panel.range)
    scene.settings.plume.section_range = tuple(layer.section.range) if layer.section is not None else None
    scene.settings.plume.cube_range = tuple(layer.cube.range) if layer.cube is not None else None
    scene.settings.plume.field_range = tuple(layer.field.range) if layer.field is not None else None
    layer.set_panel_ranges(
        scene.settings.plume.section_range,
        scene.settings.plume.map_range,
        scene.settings.plume.cube_range,
        scene.settings.plume.field_range,
    )
    layer.restart()
    announce(report, "release", len(positions), len(positions))
    return {
        "advection_passes": 2,
        "policy": "Precompute every displayed time, expand upper bounds to powers of ten, then reset and replay.",
        "peak_concentration_ug_m3": peak,
        "peak_column_mass_ug_m2": column_peak,
        "original_ranges": original,
        "fixed_ranges": {"concentration": list(concentration_range), "column_mass": list(column_range)},
        "fixed_panel_ranges": {
            "column_mass": list(layer.column_map.panel.range),
            "concentration_section": list(layer.section.range) if layer.section is not None else None,
            "concentration_cube": list(layer.cube.range) if layer.cube is not None else None,
            "concentration_field": list(layer.field.range) if layer.field is not None else None,
        },
        "occupied_bounds_world_metres": [occupied_low.tolist(), occupied_high.tolist()],
    }


def playback_caption(scene, interval, duration, height):
    actor = vtk.vtkTextActor()
    if scene.settings.particles.visible and scene.settings.particles.style == "flow":
        meaning = "원본 속도 추적 입자 · 색: 풍속 (m/s)"
    elif scene.plume_arrows(scene.settings) and scene.settings.arrows.style == "ribbons":
        meaning = "오염원 연결 순간 유선 · 색: 가상 배출 농도"
    else:
        meaning = "원본 속도 순간 유선" if scene.plume is None else "원본 속도 이류 · 농도는 가상 배출량"
    actor.SetInput(
        f"시간 간격 {interval:g} s  ·  재생 {1000 / duration:g} fps / {interval * 1000 / duration:g}배속  ·  {meaning}"
    )
    actor.GetPositionCoordinate().SetCoordinateSystemToNormalizedViewport()
    actor.GetPositionCoordinate().SetValue(0.03, 0.875)
    prop = actor.GetTextProperty()
    prop.SetFontSize(max(9, round(11 * height / 720)))
    prop.SetColor(0.30, 0.37, 0.46)
    prop.SetVerticalJustificationToTop()
    prop.SetBackgroundColor(1, 1, 1)
    prop.SetBackgroundOpacity(0.92)
    set_font(prop)
    scene.plotter.renderer.AddViewProp(actor)
    return actor


def visible_lookups(scene):
    tables = []

    def visible(actor):
        return actor is not None and bool(actor.GetVisibility())

    if any(visible(actor) for actor in (scene.arrow_actor, scene.arrow_path_actor, scene.arrow_bar)):
        tables.append(scene.arrow_lut)
    if (
        scene.particles is not None
        and scene.settings.particles.style == "flow"
        and (visible(scene.particles.actor) or visible(scene.particles.trail_actor))
    ):
        tables.append(scene.particles.lut)
    scalar_actors = [scene.bar, scene.line_actor, scene.iso_actor, scene.cloud_actor]
    scalar_actors.extend(section[2] for section in scene.slices)
    scalar_actors.extend(face[1] for face in scene.box or ())
    if any(visible(actor) for actor in scalar_actors):
        tables.append(scene.lut)
    if scene.plume is not None:
        section = scene.plume.section
        if visible(scene.plume.volume):
            tables.append(scene.plume_lut)
        if section is not None and visible(section.actor):
            tables.append(section.panel.lookup)
        if scene.plume.cube is not None and scene.plume.cube.visible:
            tables.append(scene.plume.cube.lookup)
        if scene.plume.field is not None and visible(scene.plume.field.volume):
            tables.append(scene.plume.field.legend)
        if scene.plume.shells is not None and scene.plume.shells.legend is not None and scene.is_iso_view:
            tables.append(scene.plume.shells.legend)
        if visible(scene.plume.column_map.actor):
            tables.append(scene.plume.column_map.lookup)
        if visible(scene.plume_bar):
            tables.append(scene.plume_bar.GetLookupTable())
    return tables


def scientific_palette(lookups, count=128):
    tables, seen = [], set()
    for lookup in lookups:
        colours = np.asarray(
            [lookup.GetTableValue(index)[:3] for index in range(lookup.GetNumberOfTableValues())]
        )
        if not len(colours):
            continue
        colours = np.rint(255 * colours).astype(np.uint8)
        signature = colours.tobytes()
        if signature not in seen:
            tables.append(colours)
            seen.add(signature)
    if not tables:
        return np.empty((0, 3), dtype=np.uint8)
    selected = []
    for index, colours in enumerate(tables):
        quota = count // len(tables) + (index < count % len(tables))
        if quota:
            selected.append(colours[np.rint(np.linspace(0, len(colours) - 1, quota)).astype(int)])
    return np.concatenate(selected)


def shared_palette(paths, lookups=()):
    width, height, columns = 128, 80, 10
    sheet = Image.new("RGB", (columns * width, math.ceil(len(paths) / columns) * height), "white")
    rendered_samples = []
    for index, path in enumerate(paths):
        with Image.open(path) as image:
            rgb = image.convert("RGB")
            thumb = rgb.resize((width, height), Image.Resampling.BOX)
            sheet.paste(thumb, ((index % columns) * width, (index // columns) * height))
            pixels = np.asarray(rgb).reshape(-1, 3)
            chromatic = np.flatnonzero(np.ptp(pixels, axis=1) >= 12)
            if len(chromatic):
                selected = chromatic[np.linspace(0, len(chromatic) - 1, min(4096, len(chromatic)), dtype=int)]
                rendered_samples.append(pixels[selected].copy())
    scientific = scientific_palette(lookups)
    rendered = np.empty((0, 3), dtype=np.uint8)
    if rendered_samples:
        swatch = Image.fromarray(np.concatenate(rendered_samples)[None, :, :])
        quantized = swatch.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        used = [entry for _, entry in sorted(quantized.getcolors(), reverse=True)]
        rendered = np.asarray(quantized.getpalette(), dtype=np.uint8).reshape(-1, 3)[used]
    count = 256 - len(scientific) - len(rendered)
    background = sheet.quantize(colors=count, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    colours = np.asarray(background.getpalette(), dtype=np.uint8).reshape(-1, 3)[:count]
    if len(colours) < count:
        colours = np.pad(colours, ((0, count - len(colours)), (0, 0)))
    palette = Image.new("P", (1, 1))
    palette.putpalette(np.concatenate([scientific, rendered, colours]).ravel().tolist())
    return palette


def render_animation(args, progress=None):
    """저장한 장면으로 동영상과 마지막 PNG, 재현용 JSON 생성"""
    size = (args.width, args.height)
    if any(isinstance(n, bool) or not isinstance(n, Integral) or not 1 <= n <= 4096 for n in size):
        raise ValueError("Movie dimensions must be integers from 1 to 4096.")
    if math.prod(size) > MAX_PIXELS:
        raise ValueError("Movie frame exceeds the 1920x1080-pixel limit.")
    fps = number(args.fps, "Playback FPS")
    if not 1 <= fps <= 30:
        raise ValueError("Playback FPS must be from 1 to 30.")
    output = Path(args.output).expanduser().resolve()
    kind = output.suffix.lower().lstrip(".")
    if kind not in encode.FORMATS:
        raise ValueError("Output file must use the .mp4 or .gif extension.")
    if kind == "mp4" and any(n % 2 for n in size):
        raise ValueError(encode.ODD_SIZE.format(width=size[0], height=size[1]))
    config = Settings.from_env()
    # GIF 시간 간격은 10 ms 단위로 반올림
    duration = max(10, round(100 / fps) * 10) if kind == "gif" else 1000 / fps
    encoder = None if kind == "gif" else encode.encoder(config.ffmpeg)
    work_dir = Path(args.work_dir).expanduser().resolve() if getattr(args, "work_dir", None) else None
    if mongo_enabled() and work_dir is not None and not work_dir.is_relative_to(Path("/tmp")):
        raise ValueError("Movie work directory must be under /tmp.")
    saved = (
        SceneSettings.model_validate_json(read_settings(args.settings_file)) if args.settings_file else None
    )
    if saved is not None:
        if saved.case_id != args.case_id:
            raise ValueError("Saved scene settings do not match the requested case.")
        raw_particle_view = (
            saved.particles.visible
            and saved.particles.style == "flow"
            and not displays_plume(saved)
            and not (saved.arrows.visible and saved.arrows.mode != "volume")
            and not any(
                getattr(saved, name).visible for name in ("box", "volume", "isosurface", "streamlines")
            )
            and not any(section.visible and not section.raw for section in saved.slices)
        )
        if not raw_particle_view and (saved.dynamic_wind.enabled or saved.plume.transport != "prediction"):
            raise ValueError(
                "Movie export requires original predictions. Disable dynamic wind and use prediction-only transport."
            )
    output = export_target(output)
    adapter, scene = DataAdapter(config), None
    images = []
    try:
        case = adapter.case(args.case_id)
        logical_dir = adapter.settings.case_dir(case.id)
        source = (logical_dir / case.flow.source).resolve() if case.flow else None
        path = Path(args.result).expanduser().resolve() if args.result else source
        if path is None or not store_exists(path):
            raise ValueError("A flow store is required. Use the initial input or specify --result.")
        if path in output.parents:
            raise ValueError("Output file must be outside the source store.")
        group = open_group(path, mode="r")
        provenance = group.attrs.get("provenance") or {}
        if provenance.get("case_id") not in (None, case.id):
            raise ValueError("Result store does not match the requested case.")
        job = None if path == source else provenance.get("job_id") or path.name.removesuffix(".zarr")
        meta = adapter.store_metadata(case, path, job_id=job)
        result = FlowResult(meta, case, path, adapter.cache, adapter.executor, adapter.settings.max_cells)
        if saved is not None and saved.job_id != meta.job_id:
            raise ValueError("Saved scene settings do not match the selected result job.")
        start = args.frame_start
        if start is None:
            start = (
                saved.frame + saved.phase if saved else (meta.history_frames if meta.completed_steps else 0)
            )
        end = result.n_frames - 1 if args.frame_end is None else args.frame_end
        limit = frame_limit(kind, size)
        if limit < 2:
            raise ValueError("Movie resolution exceeds the export budget. Reduce the resolution.")
        positions = sequence(start, end, args.frame_step, result.n_frames, limit)
        times = np.asarray(result.times, dtype=float)
        if not np.isfinite(times).all() or not np.allclose(
            np.diff(times), meta.time_step, rtol=1e-7, atol=1e-8
        ):
            raise ValueError("Advection requires equally spaced source times matching time_step.")
        release = (
            max(0, min(meta.history_frames - 1, positions[0]))
            if args.release_start is None
            else number(args.release_start, "Release start")
        )
        if not 0 <= release <= positions[0]:
            raise ValueError("Release start must be between 0 and the movie start frame.")
        initial = saved or SceneSettings(
            case_id=case.id, job_id=meta.job_id, plume=Plume(transport="prediction")
        )
        initial = at(initial, positions[0])
        try:
            directory = adapter.asset_directory(case) if case.mesh else logical_dir
            city = CityMesh.open(directory, case) if case.mesh else None
        except MeshNotPrepared:
            city = None
        scene = Scene(
            case, result, city, initial, size, mesh_bytes=adapter.settings.mesh_mb * 2**20, live=True
        )
        if saved is None:
            base = at(scene.default_settings(), positions[0])
            base.plume.transport = "prediction"
            base.dynamic_wind.enabled = False
            scene.update(base)
            scene.update(scene.presentation_settings(args.preset))
        limits = prepare_ranges(scene, positions, progress)
        particle_range = prepare_particle_range(scene, positions)
        animate_plume = scene.plume is not None and (particle_range is None or displays_plume(scene.settings))
        concentration_prepass = (
            prepare_plume_ranges(scene, positions, release, meta.time_step, progress)
            if animate_plume
            else None
        )
        if saved is None or saved.camera is None:
            mode = args.preset if saved is None else scene.presentation_mode()
            if concentration_prepass is not None and mode in ("plume", "city3d"):
                scene.focus_flow(world_points=concentration_prepass["occupied_bounds_world_metres"])
            else:
                scene.fit_presentation(mode)
        fixed_camera = scene.plotter.camera.copy()
        base = scene.settings.model_copy(deep=True)
        playback_caption(scene, args.frame_step * meta.time_step, duration, size[1])
        if animate_plume:
            scene.plume.restart()
        if particle_range is not None:
            scene.particles.seed(float(positions[0]), meta.time_step)
        previous = release
        frames, png_paths = [], []
        with frame_directory(work_dir) as temporary:
            for index, position in enumerate(positions):
                announce(progress, "frames", index, len(positions))
                scene.update(at(base, position))
                if animate_plume:
                    scene.plume.follow(previous, position, meta.time_step)
                    scene.plume.draw()
                    scene.refresh_plume_arrows()
                if scene.particles is not None and index:
                    scene.particles.advance(previous, position, meta.time_step)
                if index == 0 and scene.velocity and scene.settings.arrows.visible:
                    scene.fill_arrows(scene.settings)
                lock_range(scene, limits)
                scene.plotter.camera.DeepCopy(fixed_camera)
                record = capture_metadata(scene)
                record["animation_index"] = index
                record["colour_ranges"] = {
                    "scalar": list(scene.lut.scalar_range),
                    "arrows": list(scene.arrow_lut.scalar_range),
                    "plume": list(scene.plume.range) if scene.plume is not None else None,
                    "column_mass": list(scene.plume.column_map.range) if scene.plume is not None else None,
                    "column_map_panel": list(scene.plume.column_map.panel.range)
                    if scene.plume is not None
                    else None,
                    "section_panel": list(scene.plume.section.range)
                    if scene.plume is not None and scene.plume.section is not None
                    else None,
                    "flow_particles": list(particle_range) if particle_range is not None else None,
                }
                record["concentration_statistics"] = plume_statistics(scene)
                frames.append(record)
                target = Path(temporary) / f"{index:03d}.png"
                target.write_bytes(capture_png(scene, scale=1, caption=True))
                png_paths.append(target)
                previous = position
            announce(progress, "encode", 0, 1)
            lookups = visible_lookups(scene) if kind == "gif" else []
            palette = shared_palette(png_paths, lookups) if kind == "gif" else None
            if palette is not None:
                for path in png_paths:
                    with Image.open(path) as image:
                        images.append(
                            image.convert("RGB").quantize(palette=palette, dither=Image.Dither.NONE)
                        )
            animation = {
                "format": kind,
                "frame_positions": positions.tolist(),
                "data_time_seconds": [record["frame"]["time_seconds"] for record in frames],
                "physical_step_seconds": float(args.frame_step * meta.time_step),
                "release_start": float(release) if animate_plume else None,
                "particle_seed_position": frames[0]["flow_particles"]["seed_position"]
                if particle_range is not None
                else None,
                "particle_discontinuities": frames[-1]["flow_particles"]["discontinuities"]
                if particle_range is not None
                else None,
                "requested_fps": fps,
                "playback_fps": 1000 / duration,
                "frame_duration_ms": duration,
                "playback_duration_seconds": len(positions) * duration / 1000,
                "physical_seconds_per_playback_second": args.frame_step * meta.time_step * 1000 / duration,
                "camera": "fixed",
                "palette": (
                    (
                        "shared 256-colour palette: 128 visible scientific LUT slots, up to 64 chromatic colours (4096 samples/frame), remainder all-frame median-cut scene colours; no dithering"
                        if lookups
                        else "shared 256-colour palette: up to 64 chromatic colours (4096 samples/frame), remainder all-frame median-cut scene colours; no dithering"
                    )
                    if kind == "gif"
                    else None
                ),
                "encoding": None
                if kind == "gif"
                else {
                    "codec": "libx264",
                    "pixel_format": "yuv420p",
                    "crf": encode.CRF,
                    "preset": encode.PRESET,
                    "encoder": str(encoder),
                    "policy": "Constant-quality H.264 from the same captioned RGB frames as the GIF path; no colour quantisation.",
                },
                "scalar_range": list(limits),
                "arrow_range": list(scene.arrow_lut.scalar_range),
                "particle_speed_range": list(particle_range) if particle_range is not None else None,
                "plume_range": list(scene.plume.range) if scene.plume is not None else None,
                "column_mass_range": list(scene.plume.column_map.range) if scene.plume is not None else None,
                "concentration_prepass": concentration_prepass,
                "preset": args.preset if saved is None else None,
                "settings_file": str(Path(args.settings_file).expanduser().resolve())
                if args.settings_file
                else None,
                "frames": frames,
            }
            final_settings = capture_settings(scene)
            recorded = frames[-1] | {"schema": "flowcast.animation/1", "animation": animation}
            recorded["settings"] = final_settings.model_dump(mode="json")
            recorded["image"] = {"width": int(size[0]), "height": int(size[1]), "dpi": 300}
            paths = {
                "animation": output,
                "image": output.with_suffix(".png"),
                "settings": output.with_suffix(".scene.json"),
                "metadata": output.with_suffix(".metadata.json"),
            }
            output.parent.mkdir(parents=True, exist_ok=True)
            comment = json.dumps({key: value for key, value in animation.items() if key != "frames"})
            if kind == "gif":
                images[0].save(
                    output,
                    format="GIF",
                    save_all=True,
                    append_images=images[1:],
                    duration=duration,
                    loop=0,
                    disposal=2,
                    optimize=False,
                    palette=palette.getpalette(),
                    comment=comment.encode(),
                )
            else:
                encode.write_mp4(png_paths, output, 1000 / duration, comment=comment, path=encoder)
            with Image.open(png_paths[-1]) as image:
                info = PngImagePlugin.PngInfo()
                info.add_text("flowcast", json.dumps(recorded, ensure_ascii=False, allow_nan=False))
                image.save(paths["image"], format="PNG", pnginfo=info, dpi=(300, 300))
            paths["settings"].write_text(final_settings.model_dump_json(indent=2) + "\n", encoding="utf-8")
            paths["metadata"].write_text(
                json.dumps(recorded, ensure_ascii=False, allow_nan=False, indent=2) + "\n", encoding="utf-8"
            )
            announce(progress, "encode", 1, 1)
        return persist_outputs(paths, case.id)
    finally:
        for image in images:
            image.close()
        if scene is not None:
            scene.close()
        adapter.close()
        discard_export(output)
