import numpy as np
import pyvista as pv
import vtk
from matplotlib import colormaps

from modules.visualization.rendering.field_panel import CMAP, AutoRange, blur, legend_table, passes, spread

CONCENTRATION = "concentration"
# 표시 격자의 셀 수 상한
COARSE = 200_000
# 묶음 격자의 계단을 줄일 평활화 표준편차(m)
BANDWIDTH = 1.6
# 농도 불투명도의 기준 거리(셀 크기 배수)
DENSITY = 0.42
FLOOR = 10
RAMP = "field"


def factor(shape, limit=COARSE):
    """격자 비율을 유지하며 셀 수 상한을 만족하는 묶음 배율"""
    step = 1
    while int(np.prod([-(-n // step) for n in shape])) > limit:
        step += 1
    return step


def group(values, step):
    out = np.asarray(values)
    for axis in range(out.ndim):
        if step > 1 and out.shape[axis] > 1:
            out = np.add.reduceat(out, np.arange(0, out.shape[axis], step), axis=axis)
    return out


class PlumeField:
    """원본 농도를 유지하고 표시용 격자에 부피 가중 평균"""

    def __init__(self, scene, deposit, colour_range=None, label="오염물질 농도"):
        fluid = np.asarray(deposit.fluid, dtype=bool)
        if fluid.ndim != 3:
            raise ValueError("Concentration colour map requires an XYZ fluid mask.")
        self.scene, self.colour_label = scene, label
        self.step = factor(fluid.shape)
        self.volumes = np.asarray(deposit.volumes, dtype=np.float32)
        # 유체 부피로 평균하고 고체만 있는 블록은 제외
        self.space = group(self.volumes * fluid, self.step).astype(np.float32)
        self.valid = self.space > 0
        self.space = np.maximum(self.space, np.float32(1e-12))
        edges = [np.append(edge[:: self.step], edge[-1]) for edge in map(np.asarray, deposit.edges)]
        self.edges = [edge[: n + 1] for edge, n in zip(edges, self.valid.shape)]
        self.passes = passes(self.edges, BANDWIDTH)
        self.sigma = spread(self.edges, self.passes)
        centres = [0.5 * (edge[1:] + edge[:-1]) - scene.origin[a] for a, edge in enumerate(self.edges)]
        spacing = [float(np.diff(centre).mean()) if len(centre) > 1 else 1.0 for centre in centres]
        self.grid = pv.ImageData(
            dimensions=self.valid.shape, spacing=spacing, origin=[float(centre[0]) for centre in centres]
        )
        self.field = np.zeros(self.valid.shape, dtype=np.float32)
        self.peak = 0.0
        self.concentration = np.zeros(fluid.shape, dtype=np.float32)
        self.colours = np.asarray(colormaps[CMAP](np.linspace(0, 1, 256)))[:, :3]
        self.bounds = AutoRange(colour_range)
        self.legend = legend_table(self.colours, self.bounds.range)
        self.volume = self.make_volume(float(np.mean(spacing)))
        self.cloud_on = self.shells_on = False
        self.stale, self.version = True, 0
        self.paint()

    def make_volume(self, spacing):
        prop = vtk.vtkVolumeProperty()
        prop.SetInterpolationTypeToLinear()
        prop.ShadeOff()
        prop.SetScalarOpacityUnitDistance(spacing * DENSITY)
        mapper = vtk.vtkSmartVolumeMapper()
        mapper.SetInputData(self.grid)
        # 앞쪽 저농도가 짙은 중심을 덮지 않도록 최대 투영 사용
        mapper.SetBlendModeToMaximumIntensity()
        volume = vtk.vtkVolume()
        volume.SetMapper(mapper)
        volume.SetProperty(prop)
        volume.SetVisibility(False)
        self.scene.plotter.renderer.AddVolume(volume)
        return volume

    @property
    def range(self):
        return self.bounds.range

    @property
    def auto(self):
        return self.bounds.auto

    def colour_at(self, level):
        low, high = (np.log10(value) for value in self.bounds.range)
        ratio = 0.0 if high <= low else (np.log10(level) - low) / (high - low)
        return tuple(float(value) for value in self.colours[round(float(np.clip(ratio, 0, 1)) * 255)])

    def set_range(self, colour_range):
        if self.bounds.set(colour_range):
            self.paint()

    def reset_range(self):
        self.bounds.reset()

    def set_label(self, colour_label):
        self.colour_label = colour_label

    def shown_bounds(self, threshold=None):
        shown = self.field > (self.bounds.range[0] if threshold is None else threshold)
        if not shown.any():
            return None
        corners = []
        for axis, edge in enumerate(self.edges):
            index = np.flatnonzero(shown.any(axis=tuple(other for other in range(3) if other != axis)))
            corners.append((float(edge[index[0]]), float(edge[index[-1] + 1])))
        return np.array(corners, dtype=np.float64).T - self.scene.origin

    def paint(self):
        # 순환 가져오기를 피하도록 사용 시점에 가져옴
        from modules.visualization.rendering.plume_palette import transfer_functions

        self.legend.SetRange(*self.bounds.range)
        colours, opacity = transfer_functions(self.bounds.range, cmap=CMAP, ramp=RAMP)
        self.volume.GetProperty().SetColor(colours)
        self.volume.GetProperty().SetScalarOpacity(opacity)
        self.stale = True

    def update(self, concentration):
        """농도와 표시 버전을 갱신하여 등가면 재계산 알림"""
        self.concentration = concentration
        self.stale = True
        if self.cloud_on or self.shells_on:
            self.refresh()

    def refresh(self):
        mass = group(np.asarray(self.concentration, dtype=np.float32) * self.volumes, self.step)
        self.field = blur(mass / self.space, self.valid, self.passes, self.space)
        self.peak = float(self.field.max()) if self.field.size else 0.0
        if self.bounds.grow(self.peak):
            self.paint()
        floor = np.float32(self.bounds.range[0] / FLOOR)
        values = np.log10(np.maximum(self.field, floor))
        self.grid.point_data.set_array(values.ravel(order="F"), CONCENTRATION)
        self.grid.GetPointData().SetActiveScalars(CONCENTRATION)
        self.stale, self.version = False, self.version + 1

    def show(self, cloud, shells):
        self.cloud_on, self.shells_on = bool(cloud), bool(shells)
        if (self.cloud_on or self.shells_on) and self.stale:
            self.refresh()
        self.volume.SetVisibility(self.cloud_on)

    def close(self):
        self.scene.plotter.renderer.RemoveVolume(self.volume)
