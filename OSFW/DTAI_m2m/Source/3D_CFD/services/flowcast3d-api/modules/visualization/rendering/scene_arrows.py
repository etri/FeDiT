from copy import copy

import numpy as np
import pyvista as pv

from modules.domain.transport.fields import velocity
from modules.domain.transport.pollutants import concentration_label
from modules.visualization.rendering import flow_paths, layers, plume_palette
from modules.visualization.rendering.scene_support import (
    ARROW_CMAPS,
    LABELS,
    PLUME_COLOR,
    STREAM_CANOPY,
    STREAM_NEAR,
    STREAM_REACH,
    STREAM_SPAN,
    STREAM_STEPS,
    STREAM_UPWIND,
)


class SceneArrows:
    """장면의 벡터와 유선 표시 관리"""

    def __init__(self, scene):
        self.scene = scene

    def arrow_plane(self, settings):
        scene = self.scene
        height = settings.arrows.height
        return 2, scene.pedestrian_height if height is None else height

    def arrow_region(self, settings):
        # 좁은 플룸을 놓치지 않도록 화살표 격자를 농도 격자에 정렬
        scene = self.scene
        return (
            scene.plume_region(settings)
            if scene.plume_arrows(settings)
            else (settings.roi, settings.max_cells)
        )

    def arrow_key(self, settings):
        """같은 셀 층 안의 높이 변화는 화살표 범위 캐시 공유"""
        scene = self.scene
        if settings.arrows.mode == "volume":
            return *scene.arrow_region(settings), "volume"
        grid, height = scene.result.grid, scene.arrow_plane(settings)[1]
        layer = int(np.clip((height - grid.origin[2]) // grid.spacing[2], 0, grid.shape[2] - 1))
        return settings.roi, settings.max_cells, layer

    def arrow_sample_plane(self, settings):
        scene = self.scene
        return None if settings.arrows.mode == "volume" else scene.arrow_plane(settings)

    def measure_arrows(self, settings):
        """장면 상태를 바꾸지 않아 읽기 스레드에서 호출 가능"""
        scene = self.scene
        scale, result = layers.ArrowScale(), scene.result
        roi, budget = scene.arrow_region(settings)
        frames = [settings.frame] if settings.arrows.mode == "volume" else range(result.n_frames)
        for frame in frames:
            sample = result.blend(frame, 0.0, roi, scene.arrow_sample_plane(settings), budget)
            scale.add(frame, sample, result.channels, result.quantities)
        return scale

    def arrow_scale(self, settings):
        scene = self.scene
        key = scene.arrow_key(settings)
        if key not in scene.arrow_scales:
            scene.arrow_scales[key] = scene.measure_arrows(settings)
        return scene.arrow_scales[key]

    def arrow_legend(self):
        scene = self.scene
        settings = scene.settings
        scale = (
            scene.arrow_scales.get(scene.arrow_key(settings))
            if settings is not None and scene.velocity
            else None
        )
        if scale is None or not settings.arrows.visible:
            return ""
        look, units = settings.arrows, scene.result.quantities
        reference = look.reference_speed or (
            scale.volume_reference if look.mode == "volume" else scale.reference
        )
        if scene.plume_arrows(settings):
            concentration = concentration_label(settings.plume.pollutant, settings.plume.transport).replace(
                "\n", " "
            )
            if settings.plume.pollutant == "tracer" and settings.plume.transport == "dispersion":
                concentration = "가상 오염물질 농도"
            if look.style == "ribbons":
                return f"연속 곡선: 원본 예측 유선 · 색: {concentration}"
            connection = " · 연결선: 현재 예측 유선" if look.paths else ""
            return f"방향·길이: 원본 예측 바람 · 색·굵기: {concentration}{connection}"
        if look.mode == "volume":
            parts = (
                ["연결선: 현재 예측 유선 · 화살표 방향·길이: 원본 예측 바람"]
                if look.paths
                else [f"방향: 3D 속도 · 길이: 풍속 (화살표 간격만큼 = {reference / layers.LENGTH:.1f} m/s)"]
            )
        else:
            parts = [f"길이: 수평 풍속 (화살표 간격만큼 = {reference / layers.LENGTH:.1f} m/s)"]
        if look.width:
            wind = (0.0, 0.0) if look.mode == "volume" else scene.arrow_wind(settings)
            low, high = scale.range(look.width, *wind)
            unit = f" {units[look.width]}" if units[look.width] else ""
            parts.append(f"굵기: {LABELS.get(look.width, look.width)} 3단계 ({low:.3g} ~ {high:.3g}{unit})")
        if look.mode == "plane" and look.tilt and "velocity_z" in scene.result.channels:
            parts.append(f"기울기: 연직 바람 {layers.TILT:g}배")
        return " · ".join(parts)

    def planes(self, settings):
        scene = self.scene
        found = [scene.arrow_plane(settings)] if settings.arrows.mode == "plane" else []
        if settings.wind is not None:
            found.append((2, settings.wind))
        return found

    def covered(self, sample):
        scene = self.scene
        if scene.footprint is None:
            return None
        grid = scene.result.grid
        index = [
            np.clip(((centre - o) / d).astype(np.int64), 0, n - 1)
            for centre, o, d, n in zip(sample.centres[:2], grid.origin, grid.spacing, grid.shape)
        ]
        return scene.footprint[np.ix_(*index)]

    def canopy(self, sample):
        scene = self.scene
        solid = np.asarray(sample.solid, dtype=bool)
        centres = np.asarray(sample.centres[2]) - scene.origin[2]
        floor, top = float(centres[0]), float(centres[-1])
        occupied = solid.any(axis=2)
        if not occupied.any() or len(centres) < 2:
            return floor + 0.5 * (top - floor)
        tops = np.where(solid, np.arange(solid.shape[2])[None, None, :], 0).max(axis=2)[occupied]
        roof = float(centres[int(np.percentile(tops, 75))])
        return min(top, floor + STREAM_CANOPY * (roof - floor))

    def stream_seeds(self, look, sample, channels):
        scene = self.scene
        vectors = np.where(sample.valid[..., None], velocity(sample.values, channels), 0)
        scene.stream_near = None
        if look.seeding != "city":
            return layers.inflow_seeds(scene.volume, vectors, look.density)
        solid = np.asarray(sample.solid, dtype=bool)
        scene.stream_near = layers.near_solid(solid, sample.edges, STREAM_NEAR)
        ceiling = scene.canopy(sample)
        face = layers.inflow_seeds(
            scene.volume, vectors, max(1, round(look.density * STREAM_UPWIND)), ceiling
        )
        turn = layers.turned(vectors, np.asarray(sample.valid, dtype=bool) & ~solid)
        city = layers.city_seeds(
            scene.volume, sample, look.density - face.n_points, ceiling, STREAM_REACH, turn
        )
        if not city.n_points:
            return face
        return pv.PolyData(np.vstack((face.points, city.points)).astype(np.float32))

    def trace(self, look):
        scene = self.scene
        city = look.seeding == "city"
        lines = layers.streamlines(
            scene.volume,
            scene.seeds,
            both=city,
            reach=STREAM_SPAN if city else 2.0,
            steps=STREAM_STEPS if city else None,
            quick=city,
        )
        return scene.near_lines(lines) if look.near_buildings else lines

    def near_lines(self, lines):
        """건물 주변 유선만 남기며 전부 제외되면 원본 유지"""
        scene = self.scene
        if not lines.n_lines or scene.stream_near is None:
            return lines
        near = scene.stream_near
        cells = np.rint(
            (lines.points - np.array(scene.volume.origin)) / np.array(scene.volume.spacing)
        ).astype(int)
        close = near[tuple(np.clip(cells, 0, np.array(near.shape) - 1).T)]
        connectivity, drop, cursor, number = np.asarray(lines.lines), [], 0, 0
        while cursor < len(connectivity):
            size = int(connectivity[cursor])
            if not close[connectivity[cursor + 1 : cursor + 1 + size]].any():
                drop.append(number)
            cursor += size + 1
            number += 1
        return lines.remove_cells(drop) if 0 < len(drop) < number else lines

    def fill_arrows(self, new):
        scene = self.scene
        result, look, glyphs = scene.result, new.arrows, pv.PolyData()
        paths, focus = pv.PolyData(), None
        plume_scope = scene.plume_arrows(new)
        scene.arrow_detail = ""
        scene.source_ribbon_diagnostics = {}
        if not look.visible:
            scene.arrow_focus_cache = None
        if look.visible:
            plane = scene.arrow_sample_plane(new)
            roi, budget = scene.arrow_region(new)
            # 전체 3D는 동적 교란 없이 원본 예측만 표시
            sample = (
                result.blend(new.frame, new.phase, roi, plane, budget)
                if look.mode == "volume"
                else scene.fields.sample(new.frame, new.phase, new.roi, plane, new.max_cells, scene.flow_time)
            )
            if (
                look.mode == "volume"
                and not plume_scope
                and (look.focus or look.paths or look.near_buildings)
            ):
                key = (new.frame, new.phase, new.roi, new.max_cells)
                if scene.arrow_focus_cache is None or scene.arrow_focus_cache[0] != key:
                    scene.arrow_focus_cache = (
                        key,
                        layers.FlowFocus(sample, result.channels),
                    )
                focus = scene.arrow_focus_cache[1]
            else:
                scene.arrow_focus_cache = None
            scale = scene.arrow_scale(new)
            if new.frame not in scale.frames:
                raw = result.blend(new.frame, 0.0, roi, plane, budget)
                scale.add(new.frame, raw, result.channels, result.quantities)
            color = PLUME_COLOR if plume_scope else look.color or new.quantity
            wind = (0.0, 0.0) if look.mode == "volume" else scene.arrow_wind(new)
            width = (look.width, scale.range(look.width, *wind)) if look.width and not plume_scope else None
            reference = look.reference_speed or (
                scale.volume_reference if look.mode == "volume" else scale.reference
            )
            concentrations = None
            scene.arrow_lut.SetScaleToLinear()
            if color == PLUME_COLOR:
                concentrations = (
                    scene.plume.concentration_on(sample)
                    if scene.plume is not None and new.plume.visible
                    else np.zeros(sample.valid.shape, dtype=np.float32)
                )
                cmap = plume_palette.CMAP
                color_range = scene.plume.range if scene.plume is not None else (1.0, 10_000.0)
            else:
                cmap = ARROW_CMAPS[scale.diverging(color, *wind)]
                color_range = look.color_range or scale.range(color, *wind)
            if look.mode == "volume":
                if plume_scope:
                    # 같은 프레임에서도 농도는 이동하므로 프레임 키로 캐시하지 않음
                    focus = layers.PlumeFocus(sample, result.channels, concentrations)
                support = (
                    focus.usable if plume_scope else (focus.building_region if look.near_buildings else None)
                )
                # 건물 이웃은 씨앗 선택에만 쓰며 유선의 물리 경계로 사용하지 않음
                trace_support = support if plume_scope else None
                if plume_scope and look.style == "ribbons":
                    from modules.visualization.rendering.source_ribbons import build

                    source = scene.plume.plume.source if scene.plume is not None else scene.plume_source(new)
                    paths, glyphs, scene.source_ribbon_diagnostics = build(
                        sample,
                        result.channels,
                        concentrations,
                        source,
                        scene.origin,
                        max_seeds=min(32, max(8, int(np.sqrt(look.density)))),
                    )
                    scene.arrow_seed_points = None
                elif look.paths:
                    seed_key = (
                        roi,
                        budget,
                        look.density,
                        look.focus,
                        look.near_buildings,
                    )
                    seeds = None if plume_scope else scene.arrow_seed_cache.get(seed_key)
                    if not plume_scope and look.seed_points is not None:
                        seeds = np.asarray(look.seed_points, dtype=float).reshape(-1, 3)
                    if seeds is None or not len(seeds):
                        seeds = flow_paths.seeds(
                            sample,
                            focus if plume_scope or look.focus else None,
                            look.density,
                            count=min(
                                40 if look.near_buildings and not plume_scope else flow_paths.MAX_SEEDS,
                                max(8, int(np.sqrt(look.density))),
                            ),
                            support=support,
                        )
                        if not plume_scope:
                            if len(scene.arrow_seed_cache) >= 8:
                                scene.arrow_seed_cache.pop(next(iter(scene.arrow_seed_cache)))
                            scene.arrow_seed_cache[seed_key] = seeds
                    scene.arrow_seed_points = None if plume_scope else seeds.copy()
                    paths = flow_paths.trace(
                        sample,
                        result.channels,
                        seeds,
                        scene.origin,
                        color,
                        1e-8 if plume_scope or not look.focus else focus.diagnostics["preserve_floor"],
                        color_values=concentrations,
                        support=trace_support,
                        width_quantity=width[0] if width and width[0] != PLUME_COLOR else None,
                        steps=48 if look.near_buildings and not plume_scope else None,
                    )
                    if paths.n_lines:
                        cell = min(float(np.diff(edge).min()) for edge in sample.edges)
                        paths = flow_paths.distinct(paths, separation=0.6 * cell)
                        spacing = (
                            focus.spacing_size
                            if plume_scope
                            else layers.stride_for(sample.valid.shape, look.density) * cell
                        )
                        if look.near_buildings and not plume_scope:
                            spacing = min(spacing, 4 * cell)
                        glyphs = layers.path_arrows(
                            paths,
                            look.density,
                            reference,
                            spacing,
                            flow_paths.Interpolator(sample, result.channels, support=trace_support),
                            scene.origin,
                            width_range=width[1] if width else None,
                            concentration=plume_scope,
                            width_scale=1.7
                            if look.near_buildings and not plume_scope and width is None
                            else 1.0,
                        )
                if not paths.n_lines and look.style != "ribbons":
                    glyph_focus = focus if plume_scope or look.focus or look.near_buildings else None
                    if look.near_buildings and not plume_scope:
                        glyph_focus = copy(focus)
                        glyph_focus.usable = focus.usable & support
                        glyph_focus._selection = None
                    glyphs = layers.volume_arrows(
                        sample,
                        result.channels,
                        color,
                        look.density,
                        reference,
                        scene.origin,
                        width=width,
                        color_values=concentrations,
                        focus=glyph_focus,
                    )
                scene.arrow_detail = f"원본 속도장 · 화살표 {glyphs.n_points // layers.ARROW.n_points:,}개"
                if plume_scope and look.style == "ribbons":
                    scene.arrow_detail = (
                        f"배출원 연속 흐름 · 연결 곡선 {paths.n_lines}개"
                        if paths.n_lines
                        else "배출원에서 확산이 시작되면 연결 흐름이 표시됩니다."
                    )
                elif plume_scope:
                    stats = focus.diagnostics
                    scene.arrow_detail = (
                        f"오염물질 주변 · 화살표 {glyphs.n_points // layers.ARROW.n_points:,}개"
                        f" · 미량 농도 {stats['concentration_threshold']:.2g} ㎍/㎥ 미만 제외"
                        if glyphs.n_points
                        else "아직 표시할 오염 흐름이 없습니다. 재생하면 배출원을 따라 화살표가 나타납니다."
                    )
                elif look.focus:
                    stats = focus.diagnostics
                    scene.arrow_detail += (
                        f" · 미약 기준 {stats['speed_floor']:.2f} m/s"
                        f" · 유체 셀 {stats['filtered_count'] / max(stats['valid_count'], 1):.1%} 제외"
                        f" · 건물 주변 방향 변화는 {stats['preserve_floor']:.2f} m/s부터 보존"
                    )
                if look.paths and look.style != "ribbons":
                    scene.arrow_detail += f" · 연결 흐름선 {paths.n_lines}개"
            else:
                glyphs = layers.arrows(
                    sample,
                    result.channels,
                    color,
                    look.density,
                    reference,
                    scene.origin,
                    covered=scene.covered(sample),
                    width=width,
                    tilt=layers.TILT if look.tilt else 0.0,
                    color_values=concentrations,
                )
            if cmap != scene.arrow_cmap:
                scene.arrow_lut.apply_cmap(cmap, n_values=256)
                scene.arrow_cmap = cmap
            scene.arrow_lut.scalar_range = color_range
            if color == PLUME_COLOR:
                scene.arrow_lut.SetScaleToLog10()
                for data in (glyphs, paths):
                    if not data.n_points:
                        continue
                    # 실제 농도는 유지하고 색 전용 값만 보정해 0을 배경색으로 표시
                    data.point_data["arrow_colour"] = np.maximum(
                        data.point_data[layers.VALUE], color_range[0] / 10
                    )
            for actor in (scene.arrow_actor, scene.arrow_path_actor):
                actor.mapper.SelectColorArray("arrow_colour" if color == PLUME_COLOR else layers.VALUE)
            scene.arrow_lut.below_range_color = (
                "#38bdf8" if color == PLUME_COLOR and not plume_scope else None
            )
        scene.arrow_data.copy_from(glyphs)
        scene.arrow_path_data.copy_from(paths)
        scene.arrow_path_actor.visibility = bool(
            look.visible and look.mode == "volume" and look.paths and paths.n_lines
        )

    def refresh_plume_arrows(self):
        scene = self.scene
        if (
            scene.velocity
            and scene.settings.arrows.visible
            and (scene.settings.arrows.color == PLUME_COLOR or scene.plume_arrows(scene.settings))
        ):
            scene.fill_arrows(scene.settings)
            scene.annotate()
