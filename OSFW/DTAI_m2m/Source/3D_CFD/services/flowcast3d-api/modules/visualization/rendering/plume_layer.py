import itertools
import math

import numpy as np
import pyvista as pv
import vtk

from modules.domain.transport import plume as physics
from modules.domain.transport.pollutants import concentration_label
from modules.visualization.rendering import plume_field
from modules.visualization.rendering.plume_cube import PlumeCube
from modules.visualization.rendering.plume_map import ColumnMap
from modules.visualization.rendering.plume_palette import CONCENTRATION, transfer_functions
from modules.visualization.rendering.plume_section import PlumeSection
from modules.visualization.rendering.plume_shells import PlumeShells


class PlumeLayer:
    """농도 값과 액터를 재사용하며 배출 후 시각으로 확산 진행"""

    def __init__(self, scene, source, eddy=None):
        self.scene, settings = scene, scene.settings
        self.transport = settings.plume.transport
        self.region = scene.plume_region(settings)
        self.frames = physics.forecast(scene.result)
        self.time_step = scene.result.metadata.time_step
        field = scene.fields.field(self.frames[0], *self.region)
        if self.transport == "prediction":
            field = physics.raw_field(field)
        floor = float(scene.result.grid.origin[2])
        walled = field.bounds[0, 2] <= floor + 1e-9
        self.plume = physics.Plume(source, floor if walled else None, transport=self.transport)
        if self.transport == "prediction":
            eddy = np.zeros((*field.valid.shape, 4), dtype=np.float32)
        elif eddy is None:
            eddy = physics.diffusivity(
                (scene.fields.field(frame, *self.region) for frame in self.frames), walled
            )
        self.eddy = eddy
        self.deposit = physics.Deposit(field)
        self.mass = physics.EMISSION * 1e6 / physics.RATE  # 입자 하나의 질량(µg)
        self.range = physics.colour_range(field, self.plume.source, self.deposit)
        self.default_range = self.range
        self.column_map = ColumnMap(scene, self.deposit, self.range)
        self.default_column_range = self.column_map.range
        self.ground = physics.ground_below(self.deposit, self.plume.source) - scene.origin[2]
        self.concentration = np.zeros(self.deposit.fluid.shape, dtype=np.float32)
        self.section = self.cube = self.field = self.shells = None
        spacing = self.deposit.spacing
        self.image = pv.ImageData(
            dimensions=self.deposit.dims,
            spacing=spacing,
            origin=self.deposit.low + spacing / 2 - scene.origin,
        )
        colours, opacity = transfer_functions(self.range, self.default_range)
        prop = vtk.vtkVolumeProperty()
        prop.SetInterpolationTypeToLinear()
        prop.ShadeOff()
        prop.SetColor(colours)
        prop.SetScalarOpacity(opacity)
        prop.SetScalarOpacityUnitDistance(float(spacing.mean()))
        mapper = vtk.vtkSmartVolumeMapper()
        mapper.SetInputData(self.image)
        self.volume = vtk.vtkVolume()
        self.volume.SetMapper(mapper)
        self.volume.SetProperty(prop)
        scene.plotter.renderer.AddVolume(self.volume)
        self.set_ranges(
            settings.plume.color_range or self.default_range,
            settings.plume.column_range or self.default_column_range,
        )

    def set_ranges(self, concentration_range, column_range):
        concentration_range, column_range = tuple(concentration_range), tuple(column_range)
        if concentration_range != self.range:
            self.range = concentration_range
            colours, opacity = transfer_functions(self.range, self.default_range)
            self.volume.GetProperty().SetColor(colours)
            self.volume.GetProperty().SetScalarOpacity(opacity)
        self.scene.plume_lut.SetRange(*self.range)
        self.column_map.range = column_range

    def set_panel_ranges(self, section_range, map_range, cube_range=None, field_range=None):
        section = None if self.section is None else self.section.panel
        panels = ((section, section_range), (self.column_map.panel, map_range), (self.cube, cube_range))
        for panel, fixed in (*panels, (self.field, field_range)):
            if panel is None:
                continue
            if fixed is not None:
                panel.set_range(fixed)
            elif not panel.auto:
                panel.set_range(None)
                panel.reset_range()

    def source_plane(self):
        scene, settings = self.scene, self.scene.settings
        field = physics.raw_field(scene.fields.at(settings.frame + settings.phase, *self.region))
        vector = field.velocity_at(self.plume.source[None])[0, :2]
        if np.linalg.norm(vector) < 1e-8 and field.valid.any():
            vector = field.vectors[field.valid].mean(axis=0)[:2]
        axis = 1 if abs(vector[0]) >= abs(vector[1]) else 0
        sample = scene.result.blend(settings.frame, settings.phase, self.region[0], None, self.region[1])
        return axis, 1 if vector[1 - axis] >= 0 else -1, sample.solid

    def label(self):
        plume = self.scene.settings.plume
        return concentration_label(plume.pollutant, plume.transport).replace("\n", " ")

    def set_section(self, visible):
        if visible and self.section is None:
            axis, _, solid = self.source_plane()
            self.section = PlumeSection(
                self.scene, self.deposit, solid, axis, self.plume.source[axis], self.label()
            )
            self.section.update(self.concentration)
        if self.section is not None:
            self.section.set_label(self.label())
            self.section.show(visible)

    def set_field(self, cloud, look):
        if (cloud or look.visible) and self.field is None:
            fixed = self.scene.settings.plume.field_range
            self.field = plume_field.PlumeField(self.scene, self.deposit, fixed, self.label())
            self.field.update(self.concentration)
        if self.field is None:
            return
        self.field.set_label(self.label())
        self.field.show(cloud, look.visible)
        if look.visible and self.shells is None:
            self.shells = PlumeShells(self.scene, self.field, plume_field.CONCENTRATION)
        if self.shells is not None:
            self.shells.show(look)
            if look.visible:
                self.shells.update()

    def set_cube(self, visible):
        if visible and self.cube is None:
            axis, downwind, solid = self.source_plane()
            position = self.plume.source[axis]
            self.cube = PlumeCube(self.scene, self.deposit, solid, axis, position, downwind, self.label())
            self.cube.update(self.concentration)
        if self.cube is not None:
            self.cube.set_label(self.label())
            self.cube.show(visible)

    @property
    def follows_playback(self):
        return (
            self.transport == "prediction"
            or self.scene.live
            or self.scene.settings.dynamic_wind.enabled
            or self.scene.plume_arrows(self.scene.settings)
            or self.scene.settings.plume.section
            or self.scene.settings.plume.cube
        )

    def schedule(self, clock):
        """반복 재생에서도 연속인 (앞 프레임, 뒤 프레임, 보간 비율)"""
        frames = self.frames
        if len(frames) == 1:
            return frames[0], frames[0], 0.0
        period = 2 * (len(frames) - 1)
        position = clock / self.time_step % period
        if position > len(frames) - 1:
            position = period - position
        index = min(int(position), len(frames) - 2)
        return frames[index], frames[index + 1], position - index

    def run(self, seconds):
        end = self.plume.elapsed + seconds
        while self.plume.elapsed < end - 1e-9:
            clock = self.plume.elapsed
            knot = (math.floor(clock / self.time_step + 1e-9) + 1) * self.time_step
            span = min(end, knot) - clock
            first, second, weight = self.schedule(clock + span / 2)
            fields = self.scene.fields
            field = fields.field(first, *self.region).towards(fields.field(second, *self.region), weight)
            self.plume.advance(field, self.eddy, span)

    def upcoming(self):
        if self.follows_playback:
            return set()
        clock = self.plume.elapsed
        return {frame for k in range(3) for frame in self.schedule(clock + k * self.time_step)[:2]}

    def spin_up(self):
        self.plume.clear()
        if not self.follows_playback:
            self.run(physics.SPINUP)
        self.draw()

    @property
    def panels(self):
        found = [self.column_map.panel]
        if self.section is not None:
            found.append(self.section.panel)
        if self.cube is not None:
            found.append(self.cube)
        if self.field is not None:
            found.append(self.field)
        return found

    def restart(self):
        self.plume.clear()
        for panel in self.panels:
            panel.reset_range()
        self.draw()

    def advance(self, start, end, time_step):
        """프레임 단위 위치 차이를 실제 시간으로 바꿔 확산 진행"""
        if end > start and self.follows_playback:
            self.follow(start, end, time_step)
        elif end > start:
            self.run((end - start) * time_step)
        self.draw()

    def follow(self, start, end, time_step):
        cuts = [start, *range(math.floor(start) + 1, math.ceil(end)), end]
        for before, after in itertools.pairwise(cuts):
            if after > before:
                field = self.scene.fields.at((before + after) / 2, *self.region)
                self.plume.advance(field, self.eddy, (after - before) * time_step)

    def draw(self):
        passes = 0 if self.transport == "prediction" else physics.PASSES
        self.concentration = self.deposit.concentration(self.plume.points, self.mass, passes=passes)
        # 농도 없는 셀은 색 범위 하한 아래로 두어 투명 처리
        floor = self.range[0] / 10
        values = np.log10(np.maximum(self.concentration, floor)).ravel(order="F")
        self.image.point_data.set_array(values, CONCENTRATION)
        self.image.GetPointData().SetActiveScalars(CONCENTRATION)
        self.column_map.update(self.concentration)
        if self.section is not None:
            self.section.update(self.concentration)
        if self.cube is not None:
            self.cube.update(self.concentration)
        if self.field is not None:
            self.field.update(self.concentration)
            if self.shells is not None:
                self.shells.update()

    def concentration_on(self, sample):
        """화살표 셀 중심의 농도이며 벽을 가로지르는 보간은 생략"""
        index = [
            np.clip(np.searchsorted(edge, centre, side="right") - 1, 0, len(edge) - 2)
            for edge, centre in zip(self.deposit.edges, sample.centres)
        ]
        values = self.concentration[np.ix_(*index)].copy()
        for axis, centre in enumerate(sample.centres):
            outside = (centre < self.deposit.low[axis]) | (centre > self.deposit.high[axis])
            pick = [slice(None)] * 3
            pick[axis] = outside
            values[tuple(pick)] = 0
        values[~sample.valid] = 0
        return values

    def close(self):
        for part in (self.section, self.cube, self.shells, self.field):
            if part is not None:
                part.close()
        self.column_map.close()
        self.scene.plotter.renderer.RemoveVolume(self.volume)
