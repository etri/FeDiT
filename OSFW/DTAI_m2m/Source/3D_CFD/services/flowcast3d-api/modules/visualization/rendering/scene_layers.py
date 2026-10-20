import math

import numpy as np
import pyvista as pv
import vtk

from modules.domain.transport import plume
from modules.domain.transport.fields import AXES
from modules.visualization.rendering import layers, plume_layer
from modules.visualization.rendering.particle_layer import ParticleLayer
from modules.visualization.rendering.scene_support import (
    BUILDING_COLOR,
    OPACITY_DISTANCE,
    PLUME_COLOR,
    STREAM_WALL,
    wind_of,
)


class SceneLayers:
    """장면의 유동장과 입자 레이어 관리"""

    def __init__(self, scene):
        self.scene = scene

    def flow_actor(self, dataset, cells, lut=None):
        scene = self.scene
        mapper = vtk.vtkDataSetMapper()
        mapper.SetInputData(dataset)
        mapper.SetLookupTable(scene.lut if lut is None else lut)
        mapper.SetUseLookupTableScalarRange(True)
        mapper.SetScalarModeToUseCellFieldData() if cells else mapper.SetScalarModeToUsePointFieldData()
        mapper.SelectColorArray(layers.VALUE)
        # RGB가 아닌 스칼라 값을 보간하여 중간색 보존
        mapper.SetInterpolateScalarsBeforeMapping(not cells)
        actor = pv.Actor(mapper=mapper)
        actor.prop.lighting = False
        scene.plotter.add_actor(actor, reset_camera=False, render=False)
        return actor

    def build_flow(self, new):
        scene = self.scene
        for _, _, actor in scene.slices:
            scene.plotter.remove_actor(actor, reset_camera=False, render=False)
        for _, actor in scene.slice_solids:
            scene.plotter.remove_actor(actor, reset_camera=False, render=False)
        scene.slices = []
        scene.slice_solids = []
        for setting in new.slices:
            axis = AXES.index(setting.axis)
            sample = scene.result.sample(new.frame, new.roi, (axis, setting.position), new.max_cells)
            grid = layers.slice_grid(sample, axis, setting.position, scene.origin)
            scene.slices.append((setting, grid, scene.flow_actor(grid, cells=False)))
            cover = pv.RectilinearGrid(grid.x, grid.y, grid.z)
            mapper = vtk.vtkDataSetMapper()
            mapper.SetInputData(cover)
            mapper.ScalarVisibilityOff()
            actor = pv.Actor(mapper=mapper)
            actor.prop.color, actor.prop.lighting = "#cbd5e1", False
            actor.SetForceOpaque(True)
            scene.plotter.add_actor(actor, reset_camera=False, render=False)
            scene.slice_solids.append((cover, actor))

    def place_box(self, field):
        scene = self.scene
        scene.drop_box()
        scene.box = []
        for axis, side in layers.FACES:
            face = layers.face(field, axis, side)
            grid = layers.slice_grid(face, axis, face.edges[axis][side], scene.origin)
            cover = pv.RectilinearGrid(grid.x, grid.y, grid.z)
            mapper = vtk.vtkDataSetMapper()
            mapper.SetInputData(cover)
            mapper.ScalarVisibilityOff()
            actor = pv.Actor(mapper=mapper)
            actor.prop.color, actor.prop.lighting = BUILDING_COLOR, False
            scene.plotter.add_actor(actor, reset_camera=False, render=False)
            scene.box.append((grid, scene.flow_actor(grid, cells=False), cover, actor))

    def open_box(self, *_):
        scene = self.scene
        settings = scene.settings
        if not scene.box or settings is None:
            return
        camera = np.array(scene.plotter.camera.position)
        opened = settings.buildings.visible
        for (axis, side), (grid, colour, _, cover) in zip(layers.FACES, scene.box):
            outward = 1 if side == -1 else -1
            facing = (camera[axis] - grid.bounds[2 * axis]) * outward > 0
            ground = (
                scene.city is not None
                and axis == 2
                and side == 0
                and grid.bounds[4] < scene.result.grid.spacing[2]
            )
            colour.visibility = cover.visibility = settings.box.visible and not (
                opened and (facing or ground)
            )

    def drop_box(self):
        scene = self.scene
        for _, actor, _, cover in scene.box or ():
            scene.plotter.remove_actor(actor, reset_camera=False, render=False)
            scene.plotter.remove_actor(cover, reset_camera=False, render=False)
        scene.box = None

    def fill(self, new, defer_plume_arrows=False):
        scene = self.scene
        result, shown = scene.result, []
        for (setting, grid, _), (cover, _) in zip(scene.slices, scene.slice_solids):
            axis = AXES.index(setting.axis)
            sample = (
                result.blend(
                    new.frame,
                    new.phase,
                    new.roi,
                    (axis, setting.position),
                    new.max_cells,
                )
                if setting.raw
                else scene.fields.sample(
                    new.frame,
                    new.phase,
                    new.roi,
                    (axis, setting.position),
                    new.max_cells,
                    scene.flow_time,
                )
            )
            shown.append(layers.paint(grid, sample, axis, result.channels, new.quantity))
            layers.hide(cover, ~np.asarray(sample.solid, dtype=bool))
        cloud = new.volume.visible or new.isosurface.visible
        full = new.streamlines.visible or cloud
        if new.streamlines.visible or new.box.visible or cloud:
            # 겉면만 보일 때 내부 셀 전체의 동적 바람 계산 생략
            field = (
                scene.fields.sample(new.frame, new.phase, new.roi, None, new.max_cells, scene.flow_time)
                if full
                else result.blend(new.frame, new.phase, new.roi, None, new.max_cells)
            )
        if new.streamlines.visible:
            if scene.volume is None:
                scene.volume = layers.volume_grid(field, scene.origin)
            if scene.seeds is None:
                # 임의 프레임에서 시작해도 같은 씨앗 위치를 쓰도록 첫 프레임 사용
                first = result.sample(0, new.roi, None, new.max_cells)
                scene.seeds = scene.stream_seeds(new.streamlines, first, result.channels)
            if new.streamlines.seeding == "city":
                if scene.stream_walls is None or not np.array_equal(scene.stream_walls.valid, field.valid):
                    scene.stream_walls = layers.Extension(field.valid, layers=STREAM_WALL)
            else:
                scene.stream_walls = None
            shown.append(
                layers.fill_volume(scene.volume, field, result.channels, new.quantity, scene.stream_walls)
            )
        if new.box.visible:
            if scene.box is None:
                scene.place_box(field)
            for (axis, side), (grid, _, cover, _) in zip(layers.FACES, scene.box):
                face = layers.face(field, axis, side)
                if not full:
                    face = scene.fields.effective(face, scene.flow_time)
                shown.append(layers.paint(grid, face, axis, result.channels, new.quantity))
                layers.hide(cover, face.valid)
        if cloud:
            if scene.cloud is None:
                scene.cloud = layers.volume_grid(field, scene.origin)
            # 마스크는 고정이므로 무효 셀 배치가 바뀔 때만 이웃 색인 재계산
            if scene.extension is None or not np.array_equal(scene.extension.valid, field.valid):
                scene.extension = layers.Extension(field.valid)
            shown.append(
                layers.fill_cloud(scene.cloud, field, result.channels, new.quantity, scene.extension)
            )

        if scene.velocity:
            if not (defer_plume_arrows and (new.arrows.color == PLUME_COLOR or scene.plume_arrows(new))):
                scene.fill_arrows(new)
            if new.wind is None:
                scene.show_wind(None)
            else:
                wind = scene.fields.sample(
                    new.frame,
                    new.phase,
                    new.roi,
                    (2, new.wind),
                    new.max_cells,
                    scene.flow_time,
                )
                scene.show_wind(wind_of(wind, result.channels))

        finite = np.concatenate([np.empty(0), *(values[np.isfinite(values)].ravel() for values in shown)])
        if finite.size:
            low, high = float(finite.min()), float(finite.max())
            scene.range = (low, high if high > low else low + 1.0)
        scene.lut.scalar_range = scene.range
        if new.volume.visible:
            layers.shade(scene.cloud, field.valid, scene.range, new.volume.emphasis)
            scene.place_cloud()
        scene.contour(new)
        scene.line_data.copy_from(scene.trace(new.streamlines) if new.streamlines.visible else pv.PolyData())

    def contour(self, new):
        scene = self.scene
        look, surface = new.isosurface, pv.PolyData()
        scene.iso_level = None
        if look.visible:
            low, high = scene.range
            digits = max(0, 3 - math.floor(math.log10(high - low))) if high > low else 6
            scene.iso_level = look.value if look.value is not None else round((low + high) / 2, digits)
            surface = layers.isosurface(scene.cloud, scene.iso_level, scene.extension.valid)
        scene.iso_data.copy_from(surface)

    def redraw_cloud(self, old, new):
        scene = self.scene
        if new.volume.visible and new.volume.emphasis != old.volume.emphasis:
            layers.shade(scene.cloud, scene.extension.valid, scene.range, new.volume.emphasis)
        if new.isosurface.visible and new.isosurface.value != old.isosurface.value:
            scene.contour(new)

    def place_cloud(self):
        scene = self.scene
        if scene.cloud_actor is None:
            # 마우스 회전 중에만 표본 간격을 넓혀 CPU 부하 제한
            mapper = vtk.vtkSmartVolumeMapper()
            prop = vtk.vtkVolumeProperty()
            prop.IndependentComponentsOff()
            prop.SetInterpolationTypeToLinear()
            prop.ShadeOff()
            prop.SetScalarOpacityUnitDistance(OPACITY_DISTANCE * float(np.linalg.norm(scene.extent)))
            scene.cloud_actor = vtk.vtkVolume()
            scene.cloud_actor.SetMapper(mapper)
            scene.cloud_actor.SetProperty(prop)
            scene.plotter.renderer.AddVolume(scene.cloud_actor)
        mapper = scene.cloud_actor.GetMapper()
        if mapper.GetInput() is not scene.cloud:
            mapper.SetInputData(scene.cloud)

    def style_cloud(self, new):
        scene = self.scene
        if scene.cloud_actor is None:
            return
        look = new.volume
        scene.cloud_actor.SetVisibility(look.visible)
        prop = scene.cloud_actor.GetProperty()
        low, high = scene.range
        colors = vtk.vtkColorTransferFunction()
        count = scene.lut.GetNumberOfTableValues()
        for n in range(count):
            colors.AddRGBPoint(low + (high - low) * n / (count - 1), *scene.lut.GetTableValue(n)[:3])
        opacity = vtk.vtkPiecewiseFunction()
        opacity.AddPoint(0.0, 0.0)
        opacity.AddPoint(1.0, look.opacity)
        prop.SetColor(colors)
        prop.SetScalarOpacity(opacity)

    def flow_particle_region(self, settings):
        scene = self.scene
        budget = settings.max_cells or max(
            scene.result.max_cells, min(math.prod(scene.result.grid.shape), 1 << 21)
        )
        return settings.roi, budget

    def place_particles(self, new, reset=False):
        """새 입자만 현재 위치에 배치하며 이동은 외부 advance가 담당"""
        scene = self.scene
        look, layer = new.particles, scene.particles
        if layer is None and not look.visible:
            return
        layer_type = ParticleLayer
        if look.style == "flow":
            from modules.visualization.rendering.flow_particles import FlowParticleLayer

            layer_type = FlowParticleLayer
        kept = (
            isinstance(layer, layer_type)
            and not reset
            and (layer.particles.count, layer.particles.random_seed) == (look.count, look.seed)
        )
        if layer is not None and not (look.visible and kept):
            layer.close()
            scene.particles = layer = None
        if look.visible and layer is None:
            scene.particles = layer = layer_type(scene, look.count, look.seed)
            position = new.frame + new.phase
            if new.dynamic_wind.enabled and scene.result.n_frames == 1:
                position = (scene.flow_time - scene.result.times[0]) / scene.result.metadata.time_step
            scene.particles.seed(position, scene.result.metadata.time_step)
        if look.visible and look.style == "flow":
            layer.set_speed_range(look.color_range)

    def plume_region(self, settings):
        """표시 해상도와 별도로 원본 골목을 보존하는 확산 격자 선택"""
        scene = self.scene
        initial = settings.max_cells or scene.result.max_cells
        budget = initial
        if settings.plume.detail == "fine":
            budget = max(budget, min(int(np.prod(scene.result.grid.shape)), 1 << 21))
        else:
            budget = min(budget, 250_000)
        return settings.roi, settings.max_cells if budget == initial else budget

    def plume_source(self, settings):
        scene = self.scene
        field = scene.fields.field(plume.forecast(scene.result)[0], *scene.plume_region(settings))
        if settings.plume.source is None:
            return plume.upwind(field, scene.pedestrian_height)
        return plume.settle(field, settings.plume.source)

    def place_plume(self, new):
        """배출원과 영역이 바뀌면 초기화하며 이후 이동은 외부 advance가 담당"""
        scene = self.scene
        layer = scene.plume
        source = scene.plume_source(new) if new.plume.visible else None
        kept = (
            layer is not None and source is not None
            and np.array_equal(layer.plume.source, source) and layer.region == scene.plume_region(new)
            and layer.transport == new.plume.transport
        )  # fmt: skip
        region = scene.plume_region(new)
        eddy = (
            scene.eddy[1]
            if new.plume.transport == "dispersion" and scene.eddy is not None and scene.eddy[0] == region
            else None
        )
        if layer is not None and not kept:
            layer.close()
            scene.plume = layer = None
        if source is not None and layer is None:
            scene.plume = plume_layer.PlumeLayer(scene, source, eddy)
            if new.plume.transport == "dispersion":
                scene.eddy = (region, scene.plume.eddy)
            scene.plume.spin_up()
            scene.plume_lut.SetRange(*scene.plume.range)

    def style_flow(self, new):
        scene = self.scene
        scene.slices = [(setting, grid, actor) for setting, (_, grid, actor) in zip(new.slices, scene.slices)]
        # 투명 NaN 색 때문에 단면이 체적에 덮이지 않도록 불투명 분류
        for setting, _, actor in scene.slices:
            actor.visibility, actor.prop.opacity = setting.visible, setting.opacity
            actor.SetForceOpaque(setting.opacity >= 1)
        for setting, (_, actor) in zip(new.slices, scene.slice_solids):
            actor.visibility = setting.visible and setting.solids
        box = [actor for _, colour, _, cover in scene.box or () for actor in (colour, cover)]
        styled = [
            (scene.line_actor, new.streamlines),
            (scene.iso_actor, new.isosurface),
            (scene.arrow_actor, new.arrows),
        ]
        for actor, look in [*styled, *((actor, new.box) for actor in box)]:
            actor.visibility, actor.prop.opacity = look.visible, look.opacity
            actor.SetForceOpaque(look.opacity >= 1)
        scene.line_actor.prop.line_width = new.streamlines.width * scene.scale
        scene.arrow_actor.prop.lighting = new.arrows.style == "ribbons" or not scene.plume_arrows(new)
        scene.arrow_actor.prop.interpolation = "phong"
        scene.arrow_actor.prop.ambient = 0.28
        scene.arrow_actor.prop.diffuse = 0.72
        scene.arrow_actor.prop.specular = 0.18
        scene.arrow_actor.prop.specular_power = 24
        scene.arrow_path_actor.visibility = (
            new.arrows.visible
            and new.arrows.mode == "volume"
            and new.arrows.paths
            and new.arrows.style != "ribbons"
            and scene.arrow_path_data.n_lines > 0
        )
        scene.arrow_path_actor.prop.lighting = False
        local_paths = (
            new.arrows.mode == "volume" and new.arrows.near_buildings and not scene.plume_arrows(new)
        )
        scene.arrow_path_actor.prop.opacity = new.arrows.opacity * (0.42 if local_paths else 1.0)
        scene.arrow_path_actor.prop.line_width = new.arrows.path_width * scene.scale
        scene.arrow_path_actor.SetForceOpaque(scene.arrow_path_actor.prop.opacity >= 1)
        scene.style_cloud(new)
