import math

import numpy as np
import pyvista as pv

from modules.domain.transport.particles import Fields
from modules.visualization.geometry import citytexture
from modules.visualization.readers.adapter import case_matrix
from modules.visualization.rendering import plume_palette
from modules.visualization.rendering.boundary import Boundary
from modules.visualization.rendering.dial import WindDial
from modules.visualization.rendering.scene_annotations import SceneAnnotations
from modules.visualization.rendering.scene_arrows import SceneArrows
from modules.visualization.rendering.scene_buildings import SceneBuildings
from modules.visualization.rendering.scene_camera import SceneCamera
from modules.visualization.rendering.scene_layers import SceneLayers
from modules.visualization.rendering.scene_state import SceneState
from modules.visualization.rendering.scene_support import (
    ARROW_CMAPS,
    BASE_HEIGHT,
    DIRECTION,
    ROOF,
    WIND_COLOR,
    WIND_HEIGHT,
)
from modules.visualization.rendering.source_marker import SourceMarker


class Scene:
    """렌더 자원과 기능별 구성 요소를 조정하는 장면"""

    def __init__(
        self, case, result=None, city=None, settings=None, window_size=(1280, 720), mesh_bytes=None, view=None,
        live=False,
    ):  # fmt: skip
        """렌더 원점을 분리하여 큰 세계 좌표의 정밀도 유지"""
        self.case, self.result, self.city, self.mesh_bytes, self.live = (
            case,
            result,
            city,
            mesh_bytes,
            live,
        )
        self.camera_controller = SceneCamera(self)
        self.state_controller = SceneState(self)
        self.buildings_controller = SceneBuildings(self)
        self.arrows_controller = SceneArrows(self)
        self.layers_controller = SceneLayers(self)
        self.annotations_controller = SceneAnnotations(self)
        self.matrix = case_matrix(case)
        if result is not None:
            self.origin = np.array(result.grid.origin, dtype=np.float64)
            self.extent = np.array(result.grid.extent)
        elif city is not None:
            low, high = city.world_bounds(self.matrix)
            self.origin, self.extent = np.floor(low), high - np.floor(low)
        else:
            raise ValueError("a scene needs a flow result or a prepared city mesh")

        self.scale = window_size[1] / BASE_HEIGHT
        self.plotter = pv.Plotter(off_screen=True, window_size=list(window_size))
        self.plotter.set_background("white")
        self.lut = pv.LookupTable()
        self.lut.nan_color = (1.0, 1.0, 1.0)
        self.lut.nan_opacity = 0.0
        self.range = (0.0, 1.0)
        self.plume_lut = pv.LookupTable(plume_palette.CMAP)
        self.plume_lut.SetScaleToLog10()
        self.building = self.building_mesh = self.building_coarse = None
        self.interacting = False
        # 텍스처 상태는 None이면 미확인, False이면 미준비
        self.has_textures = city is not None and citytexture.available(city.case_dir, case)
        self.textures = None
        self.building_textured = False
        self.preloaded = None
        self.block_map = None
        self.levels = None
        self.slices = []
        self.slice_solids = []
        self.volume = self.seeds = self.particles = self.plume = None
        self.stream_near = None
        self.stream_walls = None
        self.fields = Fields(result, boundary_factory=Boundary) if result is not None else None
        self.flow_time = None
        self.cloud = self.extension = self.cloud_actor = self.iso_level = None
        # 겉면별 (색 격자, 색 액터, 고체 격자, 고체 액터)
        self.box = None
        self.line_data = pv.PolyData()
        self.line_actor = self.flow_actor(self.line_data, cells=False)
        self.line_actor.prop.line_width = 2.0 * self.scale
        self.line_actor.prop.render_lines_as_tubes = True
        self.iso_data = pv.PolyData()
        self.iso_actor = self.flow_actor(self.iso_data, cells=False)
        self.iso_actor.prop.lighting = True
        self.arrow_data = pv.PolyData()
        # 시간 비교를 위해 화살표는 자체 고정 색 범위 사용
        self.arrow_lut, self.arrow_cmap = (
            pv.LookupTable(ARROW_CMAPS[False]),
            ARROW_CMAPS[False],
        )
        self.arrow_actor = self.flow_actor(self.arrow_data, cells=False, lut=self.arrow_lut)
        self.arrow_actor.mapper.SetInterpolateScalarsBeforeMapping(False)
        self.arrow_actor.prop.lighting = True
        self.arrow_path_data = pv.PolyData()
        self.arrow_path_actor = self.flow_actor(self.arrow_path_data, cells=False, lut=self.arrow_lut)
        self.arrow_path_actor.mapper.SetInterpolateScalarsBeforeMapping(False)
        self.arrow_path_actor.prop.render_lines_as_tubes = True
        self.arrow_focus_cache = None
        self.arrow_seed_cache = {}  # 시간 비교 시 튀지 않도록 같은 표시 조건의 유선 씨앗 고정
        self.arrow_seed_points = None
        self.arrow_detail = ""
        self.source_ribbon_diagnostics = {}
        self.arrow_scales = {}
        self.eddy = None
        self.wind = None
        self.dial = WindDial(WIND_COLOR)
        self.plotter.ren_win.AddRenderer(self.dial.renderer)
        self.marker = SourceMarker(self)
        self.footprint = None
        self.bar = self.scalar_bar(self.lut)
        self.plume_bar = self.scalar_bar(self.plume_lut)
        self.arrow_bar = self.scalar_bar(self.arrow_lut)
        self.particle_bar = self.scalar_bar(pv.LookupTable("turbo"))
        self.particle_bar.SetTitle("풍속 (m/s)")
        # 한글 글꼴에 없는 마이크로 기호 대체
        self.plume_bar.SetTitle("오염물질 농도 (㎍/㎥)")
        self.bar_format = self.plume_bar.GetLabelFormat()
        self.plume_bar_keys = {}
        self.panel_bar = self.scalar_bar(pv.LookupTable("viridis"))
        self.panel_bar.SetUseCustomLabels(True)
        self.panel_bar_key = None
        self.plotter.renderer.AddObserver("StartEvent", self.open_box)
        self.plotter.renderer.AddObserver("StartEvent", self.turn_dial)
        self.aspect = window_size[0] / window_size[1]
        self.settings, self.stale, self.pedestrian_height, self.building_top = (
            None,
            False,
            None,
            None,
        )
        self.wind_height = None
        self.focus_bounds = None
        # 지도는 카메라 복원 뒤에도 같은 XY 위치에 정렬
        self.plotter.renderer.AddObserver("StartEvent", self.align_map_camera, 1.0)
        self.plotter.renderer.AddObserver("StartEvent", self.label_panel_bar)
        self.plotter.renderer.AddObserver("StartEvent", self.label_plume_bars)
        try:
            if result is not None:
                levels, spacing = result.mask_levels(), result.grid.spacing[2]
                self.levels = levels
                # 영역 높이 비율 대신 지면 위 두 번째 셀을 보행자 단면으로 사용
                ground = int(np.median(levels))
                layer = min(ground + 1, result.grid.shape[2] - 1)
                self.pedestrian_height = float(self.origin[2] + (layer + 0.5) * spacing)
                self.wind_height = float(
                    min(
                        self.origin[2] + ground * spacing + WIND_HEIGHT,
                        self.origin[2] + self.extent[2] - spacing / 2,
                    )
                )
                if levels.max() > ground:
                    self.footprint = levels > ground
                if levels.max() > ground + 1:
                    top = min(math.ceil(levels.max() * (1 + ROOF)), result.grid.shape[2])
                    self.building_top = float(self.origin[2] + top * spacing)
            settings = settings or self.default_settings()
            region = self.region(settings.roi)
            self.home = self.fit(region)
            if view is not None:
                self.fit(region, *view)
            self.update(settings)
        except BaseException:  # 생성 실패한 장면은 호출자가 닫을 수 없어 여기서 렌더 창 해제
            self.plotter.close()
            raise

    @property
    def velocity(self):
        return self.result is not None and "velocity_x" in self.result.channels

    @property
    def renderers(self):
        return self.plotter.renderer, self.dial.renderer, self.marker.renderer

    @property
    def is_map_view(self):
        return self.settings is not None and self.settings.plume.visible and self.settings.plume.footprint

    @property
    def is_section_view(self):
        plume = None if self.settings is None else self.settings.plume
        return plume is not None and plume.visible and plume.section and not plume.footprint

    @property
    def is_cube_view(self):
        plume = None if self.settings is None else self.settings.plume
        return (
            plume is not None and plume.visible and plume.cube and not plume.section and not plume.footprint
        )

    @property
    def is_field_view(self):
        plume = None if self.settings is None else self.settings.plume
        return plume is not None and plume.visible and plume.field

    @property
    def is_iso_view(self):
        plume = None if self.settings is None else self.settings.plume
        return plume is not None and plume.visible and plume.shells.visible

    @property
    def is_panel_view(self):
        return self.is_map_view or self.is_section_view

    def panel_view(self):
        return self.camera_controller.panel_view()

    def section_eye(self):
        return self.camera_controller.section_eye()

    def align_section_camera(self, direction, up, eye):
        return self.camera_controller.align_section_camera(direction, up, eye)

    def align_map_camera(self, *_):
        return self.camera_controller.align_map_camera(*_)

    def arrow_plane(self, settings):
        return self.arrows_controller.arrow_plane(settings)

    @staticmethod
    def plume_arrows(settings):
        look = settings.arrows
        return look.visible and look.mode == "volume" and look.scope == "plume"

    def arrow_region(self, settings):
        # 좁은 플룸을 놓치지 않도록 화살표 격자를 농도 격자에 정렬
        return self.arrows_controller.arrow_region(settings)

    def arrow_key(self, settings):
        return self.arrows_controller.arrow_key(settings)

    def arrow_sample_plane(self, settings):
        return self.arrows_controller.arrow_sample_plane(settings)

    def measure_arrows(self, settings):
        return self.arrows_controller.measure_arrows(settings)

    def arrow_scale(self, settings):
        return self.arrows_controller.arrow_scale(settings)

    @staticmethod
    def arrow_wind(settings):
        look = settings.dynamic_wind
        return (look.gust, look.intensity) if look.enabled else (0.0, 0.0)

    def arrow_legend(self):
        return self.arrows_controller.arrow_legend()

    def planes(self, settings):
        return self.arrows_controller.planes(settings)

    def covered(self, sample):
        return self.arrows_controller.covered(sample)

    def region(self, roi):
        return self.camera_controller.region(roi)

    def fit(self, bounds, direction=DIRECTION, view_up=(0, 0, 1)):
        return self.camera_controller.fit(bounds, direction, view_up)

    def focus_flow(self, world_points=None):
        return self.camera_controller.focus_flow(world_points)

    def fit_building_flow(self, direction=DIRECTION):
        return self.camera_controller.fit_building_flow(direction)

    def source_section_settings(self):
        return self.state_controller.source_section_settings()

    def presentation_settings(self, mode):
        return self.state_controller.presentation_settings(mode)

    def presentation_mode(self):
        return self.state_controller.presentation_mode()

    def fit_presentation(self, mode):
        return self.camera_controller.fit_presentation(mode)

    def fit_panel(self, bounds, direction, view_up, eye=None):
        return self.camera_controller.fit_panel(bounds, direction, view_up, eye)

    def default_settings(self):
        return self.state_controller.default_settings()

    def flow_actor(self, dataset, cells, lut=None):
        return self.layers_controller.flow_actor(dataset, cells, lut)

    def scalar_bar(self, lut):
        return self.annotations_controller.scalar_bar(lut)

    def check(self, new):
        return self.state_controller.check(new)

    def update(self, new, time=None, defer_plume_arrows=False):
        return self.state_controller.update(new, time, defer_plume_arrows)

    def textured(self, new):
        return self.buildings_controller.textured(new)

    def preload_buildings(self, new):
        return self.buildings_controller.preload_buildings(new)

    def build_buildings(self, new):
        return self.buildings_controller.build_buildings(new)

    def set_interacting(self, active):
        return self.buildings_controller.set_interacting(active)

    def full_detail(self):
        return self.buildings_controller.full_detail()

    def place_marker(self):
        return self.annotations_controller.place_marker()

    def lay_block_map(self, shown):
        return self.buildings_controller.lay_block_map(shown)

    def style_buildings(self, new):
        return self.buildings_controller.style_buildings(new)

    def build_flow(self, new):
        return self.layers_controller.build_flow(new)

    def place_box(self, field):
        return self.layers_controller.place_box(field)

    def open_box(self, *_):
        return self.layers_controller.open_box(*_)

    def drop_box(self):
        return self.layers_controller.drop_box()

    def fill(self, new, defer_plume_arrows=False):
        return self.layers_controller.fill(new, defer_plume_arrows)

    def canopy(self, sample):
        return self.arrows_controller.canopy(sample)

    def stream_seeds(self, look, sample, channels):
        return self.arrows_controller.stream_seeds(look, sample, channels)

    def trace(self, look):
        return self.arrows_controller.trace(look)

    def near_lines(self, lines):
        return self.arrows_controller.near_lines(lines)

    def fill_arrows(self, new):
        return self.arrows_controller.fill_arrows(new)

    def refresh_plume_arrows(self):
        return self.arrows_controller.refresh_plume_arrows()

    def show_wind(self, wind):
        return self.annotations_controller.show_wind(wind)

    def turn_dial(self, *_):
        return self.annotations_controller.turn_dial(*_)

    def pick(self, x, y):
        return self.annotations_controller.pick(x, y)

    def contour(self, new):
        return self.layers_controller.contour(new)

    def redraw_cloud(self, old, new):
        return self.layers_controller.redraw_cloud(old, new)

    def place_cloud(self):
        return self.layers_controller.place_cloud()

    def style_cloud(self, new):
        return self.layers_controller.style_cloud(new)

    def flow_particle_region(self, settings):
        return self.layers_controller.flow_particle_region(settings)

    def place_particles(self, new, reset=False):
        return self.layers_controller.place_particles(new, reset)

    def plume_region(self, settings):
        return self.layers_controller.plume_region(settings)

    def plume_source(self, settings):
        return self.layers_controller.plume_source(settings)

    def place_plume(self, new):
        return self.layers_controller.place_plume(new)

    def style_flow(self, new):
        return self.layers_controller.style_flow(new)

    def annotate(self):
        return self.annotations_controller.annotate()

    def label_panel_bar(self, *_):
        return self.annotations_controller.label_panel_bar(*_)

    def label_plume_bars(self, *_):
        return self.annotations_controller.label_plume_bars(*_)

    def shown_panel(self):
        return self.annotations_controller.shown_panel()

    def prefetch(self, frame):
        return self.state_controller.prefetch(frame)

    def camera(self):
        return self.camera_controller.camera()

    def image(self):
        """렌더링한 RGB 배열 [높이, 너비, 3] 반환"""
        with self.full_detail():
            self.plotter.render()
            return self.plotter.screenshot(return_img=True)

    def close(self):
        self.plotter.close()
