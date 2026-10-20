import numpy as np
import pyvista as pv

from modules.domain.transport.fields import AXES
from modules.visualization.geometry import citytexture
from modules.visualization.readers.adapter import region_slices
from modules.visualization.rendering import flow_paths
from modules.visualization.rendering.scene_support import (
    ARROW_COLORS,
    FIGURES,
    FLOWS,
    PLUME_COLOR,
    SPEED_CMAP,
    STREAM_BUILDINGS,
    STREAM_SEEDS,
    STREAM_WIDTH,
    drawn,
)
from modules.visualization.rendering.settings import (
    PRESETS,
    Arrows,
    Box,
    Plume,
    SceneSettings,
    Slice,
    Streamlines,
)


class SceneState:
    """장면의 설정 검증과 상태 전이 관리"""

    def __init__(self, scene):
        self.scene = scene

    def source_section_settings(self):
        """배출원 바람에 더 평행한 원본 x/y 격자 단면 선택"""
        scene = self.scene
        new = scene.settings.model_copy(deep=True)
        source = np.asarray(scene.plume_source(new))
        roi, budget = scene.plume_region(new)
        sample = scene.result.blend(new.frame, new.phase, roi, None, budget)
        field = flow_paths.Interpolator(sample, scene.result.channels)
        vector = field.at(source[None, :], field.vectors)[0, :2]
        if np.linalg.norm(vector) < 1e-8 and sample.valid.any():
            vector = field.vectors[sample.valid].mean(axis=0)[:2]
        axis = 1 if abs(vector[0]) >= abs(vector[1]) else 0
        new.slices = [
            Slice(
                axis=AXES[axis],
                position=float(source[axis]),
                opacity=0.7,
                raw=True,
                solids=True,
            )
        ]
        new.quantity, new.cmap = "speed", "turbo"
        new.box.visible = new.volume.visible = new.isosurface.visible = False
        return new

    def presentation_settings(self, mode):
        scene = self.scene
        if mode not in PRESETS:
            raise ValueError(f"unknown view {mode!r}")
        new = scene.settings.model_copy(deep=True)
        new.outline = False
        new.overview = False
        new.buildings.visible, new.buildings.opacity = mode not in ("section", "cube"), 0.45
        if mode in FIGURES:
            new.buildings.geometry = "mask"
        new.plume.cloud = False
        new.plume.footprint = False
        new.plume.section = mode == "section"
        new.plume.cube = mode == "cube"
        new.plume.field = mode == "colormap"
        new.plume.shells.visible = mode == "iso"
        for name in ("box", "volume", "isosurface", "streamlines", "particles"):
            getattr(new, name).visible = False
        if mode == "stream":
            new.slices = []
            new.arrows.visible = False
            new.buildings.opacity = STREAM_BUILDINGS
            new.streamlines = Streamlines(
                visible=True,
                opacity=1.0,
                density=STREAM_SEEDS,
                seeding="city",
                width=STREAM_WIDTH,
                near_buildings=True,
            )
            new.cmap = SPEED_CMAP
            if scene.result is not None and "speed" in scene.result.quantities:
                new.quantity = "speed"
        elif mode in ("colormap", "iso"):
            new.slices = []
            new.arrows.visible = False
            new.plume.visible = True
            new.plume.shells.levels = None
            new.buildings.opacity = 1.0
        elif mode in ("section", "cube"):
            new.arrows.visible = False
            new.slices = []
            new.plume.visible = True
        elif mode in ("city", "city3d"):
            new.slices = []
            new.arrows.visible = False
            new.plume.visible = True
            new.plume.footprint = mode == "city"
            new.plume.cloud = mode == "city3d"
            new.buildings.opacity = 1.0 if mode == "city" else 0.55
        else:
            new.slices = []
            new.arrows = new.arrows.model_copy(
                update={
                    "visible": True,
                    "mode": "volume",
                    "style": "arrows",
                    "scope": "plume" if mode == "plume" else "domain",
                    "focus": True,
                    "near_buildings": False,
                    "paths": True,
                    "path_width": 3.0,
                    "density": 600 if mode == "plume" else 3000,
                    "color": PLUME_COLOR if mode == "plume" else "speed",
                    "color_range": None,
                    "reference_speed": None,
                    "seed_points": None,
                    "width": None,
                    "opacity": 1.0,
                }
            )
            if mode == "plume":
                new.plume.visible = True
                new.plume.cloud = True
                new.buildings.opacity = 0.65
                new.arrows.path_width = 2.0
        return new

    def presentation_mode(self):
        scene = self.scene
        settings = scene.settings
        if any(getattr(settings, name).visible for name in ("box", "volume", "isosurface", "particles")):
            return "custom"
        if settings.streamlines.visible:
            plume = settings.plume
            drawn_plume = plume.visible and (
                plume.cloud
                or plume.field
                or plume.footprint
                or plume.section
                or plume.cube
                or plume.shells.visible
            )
            clean = not settings.slices and not settings.arrows.visible and not drawn_plume
            return "stream" if clean and settings.cmap == SPEED_CMAP else "custom"
        if (
            settings.plume.visible
            and settings.plume.section
            and not settings.slices
            and not settings.arrows.visible
        ):
            return "section"
        if not settings.slices and not settings.arrows.visible and settings.plume.visible:
            if settings.plume.shells.visible:
                return "iso"
            if settings.plume.field:
                return "colormap"
            if settings.plume.footprint:
                return "city"
            if settings.plume.cube:
                return "cube"
            if settings.plume.cloud:
                return "city3d"
        if settings.slices or not settings.arrows.visible or settings.arrows.mode != "volume":
            return "custom"
        if scene.plume_arrows(settings):
            return "custom" if settings.arrows.style == "ribbons" else "plume"
        if settings.arrows.near_buildings:
            return "custom"
        return "flow" if settings.arrows.color == "speed" else "custom"

    def default_settings(self):
        scene = self.scene
        settings = SceneSettings(
            case_id=scene.case.id,
            job_id=scene.result.metadata.job_id if scene.result else None,
        )
        if scene.result is not None:
            settings.quantity = next(iter(scene.result.quantities))
            settings.box, settings.plume = Box(visible=True), Plume(visible=True)
            if scene.velocity:
                color = next(
                    name for name in (*ARROW_COLORS, settings.quantity) if name in scene.result.quantities
                )
                settings.arrows = Arrows(visible=True, height=scene.pedestrian_height, color=color)
                settings.wind = scene.wind_height
            if scene.building_top is not None:
                low, high = scene.origin.tolist(), (scene.origin + scene.extent).tolist()
                settings.roi = (tuple(low), (high[0], high[1], scene.building_top))
        if scene.city is not None:
            faces = scene.city.faces
            settings.buildings.lod = next(
                (n for n, count in enumerate(faces) if count <= 3_000_000),
                len(faces) - 1,
            )
        return settings

    def check(self, new):
        """장면 변경 전에 설정과 메모리 예산 검증"""
        scene = self.scene
        if scene.result is not None:
            if not 0 <= new.frame < scene.result.n_frames:
                raise ValueError(
                    f"frame {new.frame} is outside the {scene.result.n_frames} frames of the result"
                )
            names = list(scene.result.quantities)
            if new.quantity not in names:
                raise ValueError(f"unknown quantity {new.quantity!r}; choose one of {names}")
            for part, name in (
                ("colour", new.arrows.color),
                ("width", new.arrows.width),
            ):
                if part == "colour" and name == PLUME_COLOR:
                    continue
                if name is not None and name not in names:
                    raise ValueError(f"unknown arrow {part} quantity {name!r}; choose one of {names}")
            planes = [
                None,
                *((AXES.index(setting.axis), setting.position) for setting in new.slices),
            ]
            for plane in planes + (scene.planes(new) if scene.velocity else []):
                scene.result.select(new.roi, plane, new.max_cells)
        if new.buildings.geometry == "mask" and scene.result is None:
            raise ValueError("Prediction grid geometry requires a flow result.")
        if (
            new.buildings.texture
            and new.buildings.geometry == "mesh"
            and scene.city is not None
            and not scene.has_textures
        ):
            raise ValueError("Case city mesh has no photo textures.")
        if scene.city is not None and new.buildings.geometry == "mesh":
            look, levels = new.buildings, len(scene.city.faces)
            if look.lod >= levels:
                raise ValueError(f"detail level {look.lod} does not exist; the mesh cache has {levels}")
            if scene.textured(new):
                detail = "photo textures"
                needed = scene.textures.footprint(scene.matrix, new.roi) + citytexture.ATLAS_BYTES
            else:
                detail = f"detail level {look.lod}"
                needed = scene.city.footprint(scene.matrix, new.roi, look.lod)
            if scene.mesh_bytes is not None and needed > scene.mesh_bytes:
                raise MemoryError(
                    f"the buildings with {detail} need about {needed >> 20} MB, more than the budget of "
                    f"{scene.mesh_bytes >> 20} MB: choose a smaller region"
                )

    def update(self, new, time=None, defer_plume_arrows=False):
        scene = self.scene
        old, new = scene.settings, new.model_copy(deep=True)
        new.overview, new.overview_bounds = False, None
        scene.check(new)
        rebuild = old is None or scene.stale
        previous_time = scene.flow_time
        if scene.fields is not None:
            scene.flow_time = scene.fields.time_at(new.frame + new.phase) if time is None else float(time)
            scene.fields.configure(new.dynamic_wind)

        def changed(*names):
            return rebuild or any(getattr(old, name) != getattr(new, name) for name in names)

        if changed("cmap"):
            scene.lut.apply_cmap(new.cmap, n_values=256)
        # 자료 읽기 실패 후 다음 갱신에서 재생성하도록 stale 설정
        scene.stale = True

        # 도시 형상과 텍스처 갱신
        buildings_rebuilt = (
            changed("roi")
            or old.buildings.lod != new.buildings.lod
            or old.buildings.geometry != new.buildings.geometry
            or (changed("max_cells") and (scene.city is None or new.buildings.geometry == "mask"))
            or scene.building_textured != scene.textured(new)
        )
        if buildings_rebuilt:
            scene.build_buildings(new)
        if buildings_rebuilt or changed("roi", "buildings", "particles", "plume"):
            scene.style_buildings(new)

        # 단면과 재사용 격자 갱신
        if scene.result is not None:
            planes = [(s.axis, s.position, s.raw) for s in new.slices]
            rebuilt = changed("roi", "max_cells") or planes != [
                (s.axis, s.position, s.raw) for s in old.slices
            ]
            if rebuilt:
                scene.build_flow(new)
            if changed("roi", "max_cells"):
                scene.drop_box()
                scene.volume = scene.seeds = scene.cloud = scene.extension = None
                scene.stream_near = scene.stream_walls = None
            stream = ("density", "seeding")
            if old is not None and any(
                getattr(old.streamlines, k) != getattr(new.streamlines, k) for k in stream
            ):
                scene.seeds = None
            refill = changed("frame", "phase", "quantity", "wind", "dynamic_wind")
            refill |= new.dynamic_wind.enabled and previous_time != scene.flow_time
            if (
                rebuilt
                or refill
                or any(drawn(getattr(old, name)) != drawn(getattr(new, name)) for name in FLOWS)
            ):
                scene.fill(new, defer_plume_arrows=defer_plume_arrows)
            else:
                scene.redraw_cloud(old, new)
            scene.style_flow(new)

        # 관심 영역과 카메라 적용
        if changed("roi") and scene.result is not None:
            grid = scene.result.grid
            cells = region_slices(grid, new.roi) if new.roi is not None else [slice(0, n) for n in grid.shape]
            edges = [(cell.start * d, cell.stop * d) for cell, d in zip(cells, grid.spacing)]
            scene.plotter.add_mesh(
                pv.Box(bounds=np.ravel(edges)), style="wireframe", color="black", line_width=scene.scale,
                name="outline", reset_camera=False, render=False,
            )  # fmt: skip
        outline = scene.plotter.renderer.actors.get("outline")
        if outline is not None:
            outline.visibility = new.outline
        if new.camera is not None and changed("camera"):
            camera = scene.plotter.camera
            camera.position = tuple(np.array(new.camera.position) - scene.origin)
            camera.focal_point = tuple(np.array(new.camera.focal_point) - scene.origin)
            camera.up = new.camera.view_up
            camera.view_angle = new.camera.view_angle
            camera.parallel_projection = new.camera.parallel_projection
            if new.camera.parallel_scale is not None:
                camera.parallel_scale = new.camera.parallel_scale
            scene.plotter.renderer.reset_camera_clipping_range()

        # 설정 확정 후 입자와 확산 갱신
        scene.settings = new
        if scene.result is not None and changed("particles", "roi", "max_cells"):
            scene.place_particles(new, reset=changed("roi", "max_cells"))
        if scene.result is not None and changed("dynamic_wind") and scene.plume is not None:
            scene.plume.close()
            scene.plume = None
        if scene.result is not None and changed("plume", "roi", "max_cells", "dynamic_wind"):
            scene.place_plume(new)
            scene.refresh_plume_arrows()
        if scene.plume is not None:
            scene.plume.set_ranges(
                new.plume.color_range or scene.plume.default_range,
                new.plume.column_range or scene.plume.default_column_range,
            )
            scene.plume.volume.SetVisibility(new.plume.cloud)
            scene.plume.set_field(new.plume.field, new.plume.shells)
            scene.plume.column_map.show(new.plume.footprint)
            scene.plume.set_section(new.plume.section)
            scene.plume.set_cube(scene.is_cube_view)
            scene.plume.set_panel_ranges(
                new.plume.section_range, new.plume.map_range, new.plume.cube_range, new.plume.field_range
            )

        # 배출원과 범례 갱신
        scene.place_marker()
        scene.lay_block_map(scene.is_map_view and scene.plume is not None)
        scene.plotter.renderer.SetUseFXAA(scene.is_cube_view)
        if old is not None and old.legends != new.legends and new.camera is None and scene.is_panel_view:
            scene.fit_presentation("city" if scene.is_map_view else "section")
        scene.align_map_camera()
        scene.stale = False
        scene.annotate()

    def prefetch(self, frame):
        scene = self.scene
        if scene.result is None:
            return
        settings = scene.settings
        for setting in settings.slices:
            scene.result.prefetch(
                frame,
                settings.roi,
                (AXES.index(setting.axis), setting.position),
                settings.max_cells,
            )
        if settings.reads_volume:
            scene.result.prefetch(frame, settings.roi, None, settings.max_cells)
        for plane in scene.planes(settings) if scene.velocity else ():
            scene.result.prefetch(frame, settings.roi, plane, settings.max_cells)
        if scene.plume_arrows(settings):
            roi, budget = scene.arrow_region(settings)
            scene.result.prefetch(frame, roi, None, budget)
        if settings.particles.visible and settings.particles.style == "flow":
            roi, budget = scene.flow_particle_region(settings)
            scene.result.prefetch(frame, roi, None, budget)
        for upcoming in scene.plume.upcoming() if scene.plume is not None else ():
            roi, budget = scene.plume_region(settings)
            scene.result.prefetch(upcoming, roi, None, budget)
