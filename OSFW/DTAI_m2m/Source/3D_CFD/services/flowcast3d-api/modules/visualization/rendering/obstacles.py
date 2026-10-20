import numpy as np
import pyvista as pv
import vtk

FILL = (54, 46, 78)
LINE = (132, 122, 160)
LINE_WIDTH = 1.0
LIFT = 0.02  # 면의 깊이 충돌 방지 간격(m)이며 윤곽은 두 배
# 끝점 픽셀이 패널 밖으로 나가지 않도록 당길 거리(px)
TRIM = 0.6


def rectangles(mask):
    mask = np.asarray(mask, dtype=bool)
    done, running = [], {}
    for row in range(mask.shape[1] + 1):
        line = mask[:, row] if row < mask.shape[1] else np.zeros(mask.shape[0], dtype=bool)
        change = np.flatnonzero(np.diff(np.r_[0, line.astype(np.int8), 0]))
        runs = set(zip(change[::2].tolist(), change[1::2].tolist()))
        for run in list(running):
            if run not in runs:
                done.append((*run, running.pop(run), row))
        for run in runs:
            running.setdefault(run, row)
    return np.array(done, dtype=np.int64).reshape(-1, 4)


def outline(mask):
    mask = np.asarray(mask, dtype=bool)
    segments = []
    for axis in range(2):
        cells = mask if axis == 0 else mask.T
        cut = cells[1:] != cells[:-1]
        for index, line in enumerate(cut, start=1):
            change = np.flatnonzero(np.diff(np.r_[0, line.astype(np.int8), 0]))
            for start, end in zip(change[::2], change[1::2]):
                segments.append((index, start, index, end) if axis == 0 else (start, index, end, index))
    return np.array(segments, dtype=np.int64).reshape(-1, 4)


def inward(lines, shape, axes):
    """윤곽 끝을 안쪽으로 당겨 패널 밖 픽셀 침범 방지"""
    first, second = (np.asarray(axis, dtype=np.float64) for axis in axes)
    lines = np.asarray(lines, dtype=np.int64).reshape(-1, 4)
    upright = lines[:, 0] == lines[:, 2]
    start = np.where(upright, lines[:, 1] == 0, lines[:, 0] == 0)
    end = np.where(upright, lines[:, 3] == shape[1], lines[:, 2] == shape[0])
    along = np.where(upright[:, None], second, first)
    return np.stack([along * start[:, None], -along * end[:, None]], axis=1).reshape(-1, 3)


def polygons(corner, axes, edges, boxes, lift):
    u = np.asarray(edges[0], dtype=np.float64) - edges[0][0]
    v = np.asarray(edges[1], dtype=np.float64) - edges[1][0]
    first, second = (np.asarray(axis, dtype=np.float64) for axis in axes)
    corners = [
        (boxes[:, 0], boxes[:, 2]),
        (boxes[:, 1], boxes[:, 2]),
        (boxes[:, 1], boxes[:, 3]),
        (boxes[:, 0], boxes[:, 3]),
    ]
    points = np.stack([u[i][:, None] * first + v[j][:, None] * second for i, j in corners], axis=1).reshape(
        -1, 3
    )
    start = np.arange(len(boxes))[:, None] * 4
    triangles = np.hstack([start + [0, 1, 2], start + [0, 2, 3]]).reshape(-1, 3)
    faces = np.column_stack([np.full(len(triangles), 3), triangles]).ravel()
    return pv.PolyData(points + corner + lift, faces)


def segments(corner, axes, edges, lines, lift):
    u = np.asarray(edges[0], dtype=np.float64) - edges[0][0]
    v = np.asarray(edges[1], dtype=np.float64) - edges[1][0]
    first, second = (np.asarray(axis, dtype=np.float64) for axis in axes)
    ends = [u[lines[:, 0]][:, None] * first + v[lines[:, 1]][:, None] * second]
    ends.append(u[lines[:, 2]][:, None] * first + v[lines[:, 3]][:, None] * second)
    points = np.stack(ends, axis=1).reshape(-1, 3)
    cells = np.column_stack([np.full(len(lines), 2), np.arange(2 * len(lines)).reshape(-1, 2)]).ravel()
    return pv.PolyData(points + corner + lift, lines=cells)


def flat_actor(scene, mesh, colour, width=None):
    mapper = vtk.vtkPolyDataMapper()
    mapper.SetInputData(mesh)
    mapper.ScalarVisibilityOff()
    actor = pv.Actor(mapper=mapper)
    actor.prop.color = tuple(value / 255 for value in colour)
    actor.prop.lighting = False
    if width is not None:
        actor.prop.line_width = width
    actor.SetForceOpaque(True)
    actor.SetPickable(False)
    scene.plotter.add_actor(actor, reset_camera=False, render=False)
    return actor


class Obstacles:
    """실제 단면과 교차한 모델 고체만 표시"""

    def __init__(self, scene, corner, axes, edges, mask, facing, lift=LIFT):
        self.scene = scene
        mask = np.asarray(mask, dtype=bool)
        corner, facing = np.asarray(corner, dtype=np.float64), np.asarray(facing, dtype=np.float64)
        self.boxes, self.lines = rectangles(mask), outline(mask)
        self.actors, self.pixel, self.observer, self.line = [], None, None, None
        if len(self.boxes):
            fill = polygons(corner, axes, edges, self.boxes, facing * lift)
            self.actors.append(flat_actor(scene, fill, FILL))
        if len(self.lines):
            self.line = segments(corner, axes, edges, self.lines, facing * 2 * lift)
            self.ends = np.asarray(self.line.points, dtype=np.float64).copy()
            self.inward = inward(self.lines, mask.shape, axes)
            size = [edge[-1] - edge[0] for edge in edges]
            self.centre = corner + sum(
                np.asarray(axis, dtype=np.float64) * side / 2 for axis, side in zip(axes, size)
            )
            # 짧은 선분이 뒤집히지 않도록 셀 크기의 1/4 이하로 제한
            self.limit = 0.25 * min(float(np.diff(edge).min()) for edge in edges)
            self.line_actor = flat_actor(scene, self.line, LINE, LINE_WIDTH * scene.scale)
            self.actors.append(self.line_actor)
            self.observer = scene.plotter.renderer.AddObserver("StartEvent", self.trim)
        self.show(False)

    def trim(self, *_):
        if not self.line_actor.GetVisibility():
            return
        renderer = self.scene.plotter.renderer
        camera = renderer.GetActiveCamera()
        if camera.GetParallelProjection():
            span = 2 * camera.GetParallelScale()
        else:
            depth = (self.centre - np.asarray(camera.GetPosition())) @ np.asarray(
                camera.GetDirectionOfProjection()
            )
            span = 2 * max(depth, 1e-6) * np.tan(np.radians(camera.GetViewAngle()) / 2)
        pixel = span / max(renderer.GetSize()[1], 1)
        if self.pixel is not None and abs(pixel - self.pixel) <= 1e-3 * self.pixel:
            return
        self.pixel = pixel
        self.line.points = self.ends + self.inward * min(TRIM * pixel, self.limit)

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
