import math

import numpy as np
import pyvista as pv
import vtk
from matplotlib import colormaps
from vtkmodules.util import numpy_support

from modules.visualization.rendering.obstacles import FILL, LIFT, Obstacles

CMAP = "viridis"
DENSITY = 6.0  # 텍스처 해상도(px/m)
DECADES = 3
# 최댓값을 촘촘히 감싸도록 색 범위 상한을 1/4자리 단위로 증가
STEPS = 4
# 투명 경계의 어두운 번짐을 막도록 최저 색의 알파만 0으로 설정
CLEAR = (68, 1, 84, 0)
GROUND = (184, 183, 179)
# 표시용 가우스 평활화 표준편차(m)
BANDWIDTH = 1.5
OPACITY = 0.88
FADE = 0.33


def blur(values, valid, passes, area=None):
    """유효 이웃끼리만 값을 교환하며 값과 면적의 곱 보존"""
    valid = np.asarray(valid, dtype=bool)
    out = np.where(valid, values, 0).astype(np.float32)
    area = None if area is None else np.asarray(area, dtype=np.float32)
    for axis, count in enumerate(passes):
        if out.shape[axis] < 2 or not count:
            continue
        head = (slice(None),) * axis + (slice(1, None),)
        tail = (slice(None),) * axis + (slice(None, -1),)
        link = np.float32(0.25) * (valid[head] & valid[tail])
        if area is None:
            into_tail = into_head = link
        else:
            shared = link * np.minimum(area[head], area[tail])
            into_tail, into_head = shared / area[tail], shared / area[head]
        for _ in range(count):
            difference = out[head] - out[tail]
            out[tail] += into_tail * difference
            out[head] -= into_head * difference
    return out


def passes(edges, bandwidth=BANDWIDTH):
    """분산이 bandwidth²(m²)에 가까워지는 축별 교환 횟수"""
    return tuple(round(2 * (bandwidth / float(np.mean(np.diff(edge)))) ** 2) for edge in edges)


def spread(edges, counts):
    return tuple(float(np.mean(np.diff(edge))) * math.sqrt(count / 2) for edge, count in zip(edges, counts))


def resampler(edges, count):
    """셀 중심을 픽셀 중심으로 보간하며 양 끝 반 셀은 가장자리 값 유지"""
    edges = np.asarray(edges, dtype=np.float64)
    centres = 0.5 * (edges[1:] + edges[:-1])
    pixels = edges[0] + (np.arange(count) + 0.5) * (edges[-1] - edges[0]) / count
    cells = np.clip(np.searchsorted(edges, pixels, side="right") - 1, 0, len(centres) - 1)
    position = np.interp(pixels, centres, np.arange(len(centres), dtype=np.float64))
    low = np.floor(position).astype(np.int64)
    high = np.minimum(low + 1, len(centres) - 1)
    fraction = position - low
    matrix = np.zeros((count, len(centres)), dtype=np.float32)
    rows = np.arange(count)
    np.add.at(matrix, (rows, low), 1 - fraction)
    np.add.at(matrix, (rows, high), fraction)
    return matrix, cells


def auto_range(peak):
    top = 10.0 ** (math.ceil(STEPS * math.log10(peak) - 1e-9) / STEPS)
    return top / 10**DECADES, top


class AutoRange:
    """관측 최댓값에 맞춰 넓어지기만 하는 로그 색 범위"""

    def __init__(self, fixed=None):
        self.range = (1.0, 10.0**DECADES)
        self.auto, self.provisional = True, True
        self.set(fixed)

    def set(self, fixed):
        self.auto = fixed is None
        if fixed is None:
            return False
        fixed = (float(fixed[0]), float(fixed[1]))
        if fixed == self.range:
            return False
        self.range = fixed
        return True

    def reset(self):
        if self.auto:
            self.provisional = True

    def grow(self, peak):
        peak = float(peak)
        if not self.auto or not peak > 0 or not (self.provisional or peak > self.range[1]):
            return False
        self.provisional = False
        grown = auto_range(peak)
        if grown == self.range:
            return False
        self.range = grown
        return True


def panel_plane(origin, first, second):
    source = vtk.vtkPlaneSource()
    source.SetOrigin(*origin)
    source.SetPoint1(*(np.asarray(origin) + first))
    source.SetPoint2(*(np.asarray(origin) + second))
    source.Update()
    return pv.wrap(source.GetOutput())


def textured(scene, mesh, pixels, mipmap, translucent=False):
    if not pixels.flags.c_contiguous:
        raise ValueError("Texture array must be contiguous for in-place updates.")
    image = vtk.vtkImageData()
    image.SetDimensions(pixels.shape[1], pixels.shape[0], 1)
    array = numpy_support.numpy_to_vtk(pixels.reshape(-1, 4), deep=False)
    image.GetPointData().SetScalars(array)
    texture = vtk.vtkTexture()
    texture.SetInputData(image)
    texture.InterpolateOn()
    # 반복 텍스처의 반대쪽 색이 경계에 섞이지 않도록 반복 해제
    texture.RepeatOff()
    texture.EdgeClampOn()
    texture.SetColorModeToDirectScalars()
    if mipmap:
        texture.MipmapOn()
    mapper = vtk.vtkDataSetMapper()
    mapper.SetInputData(mesh)
    mapper.ScalarVisibilityOff()
    actor = pv.Actor(mapper=mapper)
    actor.SetTexture(texture)
    actor.prop.color = "white"
    actor.prop.lighting = False
    if translucent:
        actor.SetForceTranslucent(True)
    else:
        actor.SetForceOpaque(True)
    scene.plotter.add_actor(actor, reset_camera=False, render=False)
    return actor, image, array


def packed(colour):
    return np.frombuffer(bytes((*colour, 255)[:4]), dtype=np.uint32)[0]


def ramp(count=256):
    return OPACITY * np.clip(np.linspace(0, 1, count) / FADE, 0, 1) ** 0.8


def legend_table(colours, colour_range):
    table = vtk.vtkLookupTable()
    table.SetNumberOfTableValues(len(colours))
    for index, colour in enumerate(colours):
        table.SetTableValue(index, *colour[:3], 1.0)
    table.SetScaleToLog10()
    table.SetRange(*colour_range)
    table.Build()
    return table


def decade_labels(colour_range):
    values = vtk.vtkDoubleArray()
    low, high = (math.log10(value) for value in colour_range)
    powers = list(range(math.ceil(low - 1e-9), math.floor(high + 1e-9) + 1))
    for value in [10.0**power for power in powers] or list(colour_range):
        values.InsertNextValue(value)
    return values, "%g" if all(-3 <= power <= 5 for power in powers or [low, high]) else "%.0e"


class FieldPanel:
    """유효 셀만 보간하는 농도 텍스처 패널"""

    def __init__(
        self, scene, corner, axes, edges, valid, back, colour_label, colour_range, cells, translucent=False,
        solid=None, density=DENSITY, alpha=None, lift=LIFT,
    ):  # fmt: skip
        self.scene = scene
        self.corner = np.asarray(corner, dtype=np.float64)
        self.axes = [np.asarray(axis, dtype=np.float64) for axis in axes]
        self.edges = [np.asarray(edge, dtype=np.float64) for edge in edges]
        self.back = np.asarray(back, dtype=np.float64)
        self.colour_label, self.translucent = colour_label, translucent
        self.size = [float(edge[-1] - edge[0]) for edge in self.edges]
        columns, rows = (max(2, math.ceil(side * density)) for side in self.size)
        self.across, cells_u = resampler(self.edges[0], columns)
        self.up, cells_v = resampler(self.edges[1], rows)
        self.valid = np.asarray(valid, dtype=bool)
        # 마스크 보간 분모는 유효 셀 배치마다 한 번만 계산
        self.weight = np.maximum(self.up @ self.valid.T.astype(np.float32) @ self.across.T, 1e-6)
        lut = np.asarray(colormaps[CMAP](np.linspace(0, 1, 256)))
        lut[:, 3] = ramp() if translucent else 1.0
        if alpha is not None:
            lut[:, 3] = np.asarray(alpha, dtype=np.float64)
        colours = [packed(colour) for colour in (lut * 255 + 0.5).astype(np.uint8)]
        # 유효 이웃이 없는 픽셀은 최저 색 사용
        self.overrides = [(np.flatnonzero(self.weight <= 1e-6), 0)]
        cells = list(cells) + ([] if solid is None else [(solid, FILL)])
        for mask, colour in cells:
            part = np.asarray(mask, dtype=bool)[np.ix_(cells_u, cells_v)].T
            if part.any():
                colours.append(packed(colour))
                self.overrides.append((np.flatnonzero(part), len(colours) - 1))
        self.lut = np.array(colours, dtype=np.uint32)
        # 반투명 범례도 패널과 같은 지면 색에 합성
        legend = (
            lut[:, :3] * lut[:, 3:] + (1 - lut[:, 3:]) * np.asarray(GROUND) / 255
            if translucent
            else lut[:, :3]
        )
        self.legend = legend_table(legend, (1.0, 10.0**DECADES))
        self.lookup = pv.LookupTable(cmap=CMAP)
        self.lookup.SetScaleToLog10()
        self.pixels = np.zeros((rows, columns, 4), dtype=np.uint8)
        self.packed = self.pixels.view(np.uint32).reshape(rows, columns)
        self.index = np.zeros((rows, columns), dtype=np.uint16)
        mesh = panel_plane(self.corner, self.axes[0] * self.size[0], self.axes[1] * self.size[1])
        self.actor, self.image, self.array = textured(
            scene, mesh, self.pixels, mipmap=False, translucent=translucent or alpha is not None
        )
        self.obstacles = None
        if solid is not None and np.asarray(solid).any():
            self.obstacles = Obstacles(scene, self.corner, self.axes, self.edges, solid, -self.back, lift)
        points = np.asarray(mesh.points)
        self.bounds = np.ravel([points.min(axis=0), points.max(axis=0)], order="F")
        self.range = None
        self.field = np.zeros(self.valid.shape, dtype=np.float32)
        self.provisional = colour_range is None
        self.set_range(colour_range)

    def set_range(self, colour_range):
        """None이면 자동 범위이며 첫 최댓값부터 다시 계산"""
        self.auto = colour_range is None
        if self.auto:
            peak = float(self.field.max())
            colour_range = auto_range(peak) if peak > 0 else self.range or (1.0, 10.0**DECADES)
        colour_range = (float(colour_range[0]), float(colour_range[1]))
        if colour_range == self.range:
            return
        self.range = colour_range
        self.lookup.scalar_range = colour_range
        self.legend.SetRange(*colour_range)
        low, high = (math.log10(value) for value in colour_range)
        self.floor = np.float32(10.0 ** (low - 1))
        self.gain = (np.float32(255.0 / (high - low)) / self.weight).astype(np.float32)
        self.offset = np.float32(0.5 - low * 255.0 / (high - low))
        self.stale = True

    def reset_range(self):
        if self.auto:
            self.provisional = True

    def set_label(self, colour_label):
        self.colour_label = colour_label

    def update(self, values):
        self.field = np.asarray(values, dtype=np.float32)
        peak = float(self.field.max()) if self.field.size else 0.0
        if self.auto and peak > 0 and (self.provisional or peak > self.range[1]):
            self.provisional = False
            self.set_range(None)
        self.stale = True
        if self.actor.GetVisibility():
            self.paint()

    def paint(self):
        logs = np.log10(np.maximum(self.field, self.floor))
        logs *= self.valid
        index = self.up @ logs.T @ self.across.T
        index *= self.gain
        index += self.offset
        np.clip(index, 0, 255, out=index)
        np.copyto(self.index, index, casting="unsafe")
        flat = self.index.reshape(-1)
        for pixels, colour in self.overrides:
            flat[pixels] = colour
        np.take(self.lut, self.index, out=self.packed)
        self.array.Modified()
        self.image.Modified()
        self.stale = False

    @property
    def actors(self):
        return [self.actor, *(self.obstacles.actors if self.obstacles is not None else ())]

    def show(self, visible):
        for actor in self.actors:
            actor.SetVisibility(visible)
        if visible and self.stale:
            self.paint()

    def close(self):
        if self.obstacles is not None:
            self.obstacles.close()
            self.obstacles = None
        self.scene.plotter.remove_actor(self.actor, reset_camera=False, render=False)
