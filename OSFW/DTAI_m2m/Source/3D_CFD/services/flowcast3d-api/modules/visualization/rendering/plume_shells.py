import math

import numpy as np
import pyvista as pv
import vtk

TOP = 0.35  # 최댓값과 가장 안쪽 껍질의 농도 차이(자릿수)
DROP = 0.7  # 껍질 사이 농도 간격(자릿수)
FADE = 0.60  # 바깥 껍질별 불투명도 배율
SHELLS = 4


def levels_for(colour_range, peak, count):
    """표시 최댓값 아래에서 색 범위 안의 등가면 농도 선택"""
    low, high = (float(value) for value in colour_range)
    top = min(float(peak), high) * 10**-TOP
    if not top > low or count < 1:
        return []
    bottom = max(low, top * 10 ** (-DROP * (count - 1)))
    return [float(level) for level in np.geomspace(bottom, top, count)]


def level_legend(levels, colours):
    """등가면별 로그 간격과 색을 반영한 이산 범례"""
    logs = [math.log10(level) for level in levels]
    step = float(np.mean(np.diff(logs))) if len(logs) > 1 else DROP
    low, high = logs[0] - step / 2, logs[-1] + step / 2
    table = vtk.vtkLookupTable()
    table.SetNumberOfTableValues(len(levels))
    for index, colour in enumerate(colours):
        table.SetTableValue(index, *colour[:3], 1.0)
    table.SetScaleToLog10()
    table.SetRange(10.0**low, 10.0**high)
    table.Build()
    ticks = vtk.vtkDoubleArray()
    for level in levels:
        ticks.InsertNextValue(level)
    form = "%.3g" if all(1e-3 <= level < 1e5 for level in levels) else "%.1e"
    return table, (ticks, form), (10.0**low, 10.0**high)


class PlumeShells:
    def __init__(self, scene, field, values):
        self.scene, self.field, self.values = scene, field, values
        self.look = None
        self.key = None
        self.levels, self.peak = [], 0.0
        self.legend, self.ticks, self.legend_range = None, None, field.range
        self.data, self.actors = [], []
        for _ in range(SHELLS):  # 껍질 개수 변경 시 액터를 재생성하지 않도록 미리 확보
            surface = pv.PolyData()
            mapper = vtk.vtkDataSetMapper()
            mapper.SetInputData(surface)
            mapper.ScalarVisibilityOff()
            actor = pv.Actor(mapper=mapper)
            actor.prop.lighting = True
            actor.prop.interpolation = "phong"
            actor.prop.ambient = 0.30
            actor.prop.diffuse = 0.70
            actor.prop.specular = 0.15
            actor.prop.specular_power = 20
            actor.visibility = False
            scene.plotter.add_actor(actor, reset_camera=False, render=False)
            self.data.append(surface)
            self.actors.append(actor)

    @property
    def colour_label(self):
        return self.field.colour_label

    def show(self, look):
        self.look = look
        if not look.visible:
            for actor in self.actors:
                actor.visibility = False

    def update(self):
        """표시값 또는 설정이 바뀐 경우에만 등가면 재계산"""
        look = self.look
        if look is None or not look.visible:
            return
        field, grid = self.field, self.field.grid
        key = (field.version, look.count, look.opacity, look.levels)
        if key == self.key:
            return
        self.key = key
        self.peak = field.peak
        self.levels = list(look.levels) if look.levels else levels_for(field.range, self.peak, look.count)
        flat = min(grid.dimensions) < 2  # 한 축에 점이 하나면 vtkFlyingEdges3D 사용 불가
        colours = [field.colour_at(level) for level in self.levels]
        for number, (surface, actor) in enumerate(zip(self.data, self.actors)):
            if flat or number >= len(self.levels):
                surface.copy_from(pv.PolyData())
                actor.visibility = False
                continue
            level = self.levels[number]
            shell = grid.contour(
                [math.log10(level)], scalars=self.values, method="flying_edges", compute_normals=True
            )
            surface.copy_from(shell if shell.n_cells else pv.PolyData())
            actor.visibility = surface.n_cells > 0
            actor.prop.color = colours[number]
            actor.prop.opacity = look.opacity * FADE ** (len(self.levels) - 1 - number)
            actor.SetForceOpaque(actor.prop.opacity >= 1)
        if self.levels:
            self.legend, self.ticks, self.legend_range = level_legend(self.levels, colours)
        else:  # 껍질이 없으면 연속 색 범례 사용
            self.legend, self.ticks, self.legend_range = None, None, field.range

    def close(self):
        for actor in self.actors:
            self.scene.plotter.remove_actor(actor, reset_camera=False, render=False)
        self.data, self.actors = [], []
