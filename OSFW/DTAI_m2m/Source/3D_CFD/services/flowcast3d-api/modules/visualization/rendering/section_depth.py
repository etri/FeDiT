import numpy as np
import pyvista as pv
import vtk
from matplotlib import colormaps

from modules.visualization.rendering.field_panel import CMAP

HAZE = 36.0  # 대기 감쇠 거리(m)
HAZE_MAX = 0.80
SKY_LOW, SKY_HIGH = (62, 10, 84), (38, 5, 60)
SHELL_LIFT = 1.25
BLOCK = (48, 40, 69)
# 면별 밝기 비(정면, 가로+, 가로-, 위, 아래)
SHADE = (1.0, 0.86, 0.74, 0.94, 0.6)
STEPS = (64, 24)
VEIL = 0.42
FADE = 0.019
CAP = 8
LUMA = (0.299, 0.587, 0.114)  # ITU-R BT.601 밝기 가중치
# 깊이 충돌을 피할 단면 앞 간격(영역 깊이 비율)
LIFT = 1e-5


def veil(count=256):
    steps = np.arange(count, dtype=np.float64) / (count - 1)
    return VEIL + (1 - VEIL) * np.clip(steps / FADE, 0, 1) ** 0.6


def lift(depth):
    return LIFT * float(depth)


def receding(depth):
    depth = np.maximum(np.asarray(depth, dtype=np.float64), 0.0)
    return HAZE_MAX * (1 - np.exp(-depth / HAZE))


def sky(height):
    low, high = (np.asarray(colour, dtype=np.float64) for colour in (SKY_LOW, SKY_HIGH))
    return low + (high - low) * np.clip(np.asarray(height, dtype=np.float64), 0, 1)[:, None]


def luma(colours):
    return np.asarray(colours, dtype=np.float64) @ np.asarray(LUMA)


def cap_luma():
    return float(luma(np.asarray(colormaps[CMAP](CAP / 255), dtype=np.float64)[:3] * 255))


def ceiling():
    low = float(luma(np.asarray(colormaps[CMAP](0.0), dtype=np.float64)[:3] * 255))
    return (cap_luma() - VEIL * low) / (1 - VEIL)


def dim(colours):
    colours = np.asarray(colours, dtype=np.float64)
    return colours * np.minimum(1.0, ceiling() / np.maximum(luma(colours), 1e-9))[:, None]


def faces(solid, edges):
    corners, normals, signs = [], [], []
    for axis in range(3):
        # 영역 밖은 유체로 보고 고체 경계면 생성
        padded = np.pad(np.asarray(solid, dtype=np.int8), [(1, 1) if a == axis else (0, 0) for a in range(3)])
        step = np.diff(padded, axis=axis)
        cells = np.argwhere(step)
        if not len(cells):
            continue
        b, c = (a for a in range(3) if a != axis)
        quad = np.empty((len(cells), 4, 3))
        quad[..., axis] = edges[axis][cells[:, axis], None]
        quad[..., b] = edges[b][cells[:, b, None] + [0, 1, 1, 0]]
        quad[..., c] = edges[c][cells[:, c, None] + [0, 0, 1, 1]]
        corners.append(quad)
        normals.append(np.full(len(cells), axis))
        signs.append(-step[tuple(cells.T)])
    if not corners:
        return np.empty((0, 4, 3)), np.empty(0, dtype=np.int64), np.empty(0, dtype=np.int64)
    return np.concatenate(corners), np.concatenate(normals), np.concatenate(signs)


def quad_mesh(corners):
    points = corners.reshape(-1, 3).astype(np.float32)
    return pv.PolyData.from_regular_faces(points, np.arange(len(points)).reshape(-1, 4))


def wall(corner, first, second, steps):
    first, second = (np.asarray(axis, dtype=np.float64) for axis in (first, second))
    along = np.linspace(0, 1, steps[0] + 1)[:, None] * first
    across = np.linspace(0, 1, steps[1] + 1)[:, None] * second
    points = (np.asarray(corner, dtype=np.float64) + along[:, None, :] + across[None, :, :]).reshape(-1, 3)
    row, column = np.meshgrid(np.arange(steps[0]), np.arange(steps[1]), indexing="ij")
    start = (row * (steps[1] + 1) + column).ravel()
    return points, np.column_stack([start, start + 1, start + steps[1] + 2, start + steps[1] + 1])


def painted_actor(scene, mesh, colours, cell, planes):
    data = mesh.cell_data if cell else mesh.point_data
    data["rgb"] = np.ascontiguousarray(np.clip(dim(colours), 0, 255), dtype=np.uint8)
    mapper = vtk.vtkPolyDataMapper()
    mapper.SetInputData(mesh)
    if cell:
        mapper.SetScalarModeToUseCellData()
    else:
        mapper.SetScalarModeToUsePointData()
    mapper.SetColorModeToDirectScalars()
    mapper.ScalarVisibilityOn()
    for plane in planes:
        mapper.AddClippingPlane(plane)
    actor = pv.Actor(mapper=mapper)
    actor.prop.lighting = False
    actor.SetForceOpaque(True)
    actor.SetPickable(False)
    scene.plotter.add_actor(actor, reset_camera=False, render=False)
    return actor


class SectionDepth:
    """단면 뒤의 깊이감 표시이며 농도와 측정면은 유지"""

    def __init__(self, scene, deposit, solid, axis, position, facing):
        self.scene, self.axis = scene, axis
        self.sign = 1 if facing[axis] > 0 else -1
        edges = [
            np.asarray(edge, dtype=np.float64) - origin for edge, origin in zip(deposit.edges, scene.origin)
        ]
        self.plane = float(position) - scene.origin[axis]
        self.lift = lift(edges[axis][-1] - edges[axis][0])
        cut = int(
            np.clip(np.searchsorted(edges[axis], self.plane, side="right") - 1, 0, len(edges[axis]) - 2)
        )
        # 잘린 셀은 단면 뒤쪽만 표시
        keep = slice(cut, None) if self.sign < 0 else slice(None, cut + 1)
        cutter = (
            np.r_[self.plane, edges[axis][cut + 1 :]]
            if self.sign < 0
            else np.r_[edges[axis][: cut + 1], self.plane]
        )
        behind = [cutter if a == axis else edge for a, edge in enumerate(edges)]
        self.span = float(abs(behind[axis][-1 if self.sign < 0 else 0] - self.plane))
        self.low = np.array([edge[0] for edge in behind], dtype=np.float64)
        self.size = np.array([edge[-1] - edge[0] for edge in behind], dtype=np.float64)
        self.planes = [vtk.vtkPlane() for _ in range(4)]
        self.border = self.borders()
        mask = np.asarray(solid, dtype=bool)[(slice(None),) * axis + (keep,)]
        self.actors, self.blocks = [self.shell()], 0
        if mask.any():
            self.actors.append(self.solids(mask, behind))
        self.clip()
        self.observer = scene.plotter.renderer.AddObserver("StartEvent", self.clip)
        self.show(False)

    def depth(self, coordinate):
        return (np.asarray(coordinate, dtype=np.float64) - self.plane) * -self.sign

    def height(self, coordinate):
        return np.clip(
            (np.asarray(coordinate, dtype=np.float64) - self.low[2]) / max(self.size[2], 1e-9), 0, 1
        )

    def borders(self):
        others = [a for a in range(3) if a != self.axis]
        corner = self.low.copy()
        corner[self.axis] = self.plane
        edges = []
        for near, far in zip(others, others[::-1]):
            inward, along = (np.eye(3)[a] for a in (near, far))
            for offset, side in ((np.zeros(3), inward), (inward * self.size[near], -inward)):
                edges.append((corner + offset, along, side))
        return edges

    def clip(self, *_):
        """단면 앞의 고체를 제외하고 뒤쪽 부분만 유지"""
        if not self.actors or not self.actors[0].GetVisibility():
            return
        eye = np.asarray(self.scene.plotter.camera.position, dtype=np.float64)
        for plane, (point, along, inward) in zip(self.planes, self.border):
            normal = np.cross(along, point - eye)
            length = float(np.linalg.norm(normal))
            normal = normal / length if length > 1e-9 else inward
            plane.SetOrigin(*point)
            plane.SetNormal(*(normal if normal @ inward >= 0 else -normal))

    def shell(self):
        depth = np.eye(3)[self.axis] * self.size[self.axis]
        others = [a for a in range(3) if a != self.axis]
        panels = []
        for near, far in zip(others, others[::-1]):
            side, span = (np.eye(3)[a] * self.size[a] for a in (near, far))
            for offset in (np.zeros(3), side):
                panels.append(wall(self.low + offset, depth, span, STEPS))
        first, second = (np.eye(3)[a] * self.size[a] for a in others)
        panels.append(wall(self.low + (np.zeros(3) if self.sign > 0 else depth), first, second, STEPS))
        grids, quads, start = [], [], 0
        for grid, face in panels:
            grids.append(grid)
            quads.append(face + start)
            start += len(grid)
        points = np.concatenate(grids)
        mesh = pv.PolyData.from_regular_faces(points.astype(np.float32), np.concatenate(quads))
        return painted_actor(self.scene, mesh, self.shade(points), cell=False, planes=self.planes)

    def shade(self, points):
        lifted = SHELL_LIFT + (1 - SHELL_LIFT) * receding(self.depth(points[:, self.axis]))
        return sky(self.height(points[:, 2])) * lifted[:, None]

    def solids(self, mask, edges):
        corners, normals, signs = faces(mask, edges)
        centres = corners.mean(axis=1)
        depth = self.depth(centres[:, self.axis])
        # 가려지는 뒷면과 단면 도형 뒤의 면은 제외
        keep = ((normals != self.axis) | (signs == self.sign)) & ~((normals == self.axis) & (depth <= 1e-9))
        corners, normals, signs = corners[keep], normals[keep], signs[keep]
        centres, depth = centres[keep], depth[keep]
        self.blocks = len(corners)
        side = np.where(signs > 0, SHADE[1], SHADE[2])
        upright = np.where(signs > 0, SHADE[3], SHADE[4])
        shade = np.where(normals == self.axis, SHADE[0], np.where(normals == 2, upright, side))
        ratio = receding(depth)[:, None]
        block = np.asarray(BLOCK, dtype=np.float64) * shade[:, None]
        colours = block * (1 - ratio) + sky(self.height(centres[:, 2])) * ratio
        return painted_actor(self.scene, quad_mesh(corners), colours, cell=True, planes=self.planes)

    def show(self, visible):
        for actor in self.actors:
            actor.SetVisibility(visible)

    def close(self):
        if self.observer is not None:
            self.scene.plotter.renderer.RemoveObserver(self.observer)
            self.observer = None
        for actor in self.actors:
            self.scene.plotter.remove_actor(actor, reset_camera=False, render=False)
        self.actors = []
