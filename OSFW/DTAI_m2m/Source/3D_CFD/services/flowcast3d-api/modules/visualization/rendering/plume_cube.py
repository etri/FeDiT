import numpy as np
import pyvista as pv

from modules.visualization.rendering.field_panel import DECADES, FieldPanel, auto_range, blur, passes, spread
from modules.visualization.rendering.obstacles import LIFT, flat_actor
from modules.visualization.rendering.plume_section import UNIT

DENSITY = 5.0  # 면 텍스처 해상도(px/m)
EDGE = (150, 160, 182)
EDGE_WIDTH = 1.0


class Face:
    """농도 격자의 셀 값으로 칠하는 상자 면"""

    def __init__(self, scene, axis, plane, outward, pick, edges, fluid, solid, label):
        self.axis, self.plane, self.outward, self.pick = axis, float(plane), outward, pick
        self.fluid = np.asarray(fluid[pick], dtype=bool)
        self.solid = np.asarray(solid[pick], dtype=bool)
        self.edges = edges
        self.passes = passes(edges)
        self.sigma = spread(edges, self.passes)
        self.area = (np.diff(edges[0])[:, None] * np.diff(edges[1])[None, :]).astype(np.float32)
        self.values = np.zeros(self.fluid.shape, dtype=np.float32)
        self.field = np.zeros(self.fluid.shape, dtype=np.float32)
        directions = np.eye(3)
        first, second = (a for a in range(3) if a != axis)
        corner = np.zeros(3)
        corner[axis], corner[first], corner[second] = plane, edges[0][0], edges[1][0]
        normal = directions[axis] * outward
        self.panel = FieldPanel(
            scene, corner - scene.origin, (directions[first], directions[second]), edges, self.fluid, -normal,
            label, None, [], solid=self.solid, density=DENSITY,
        )  # fmt: skip
        self.panel.show(False)

    def measure(self, concentration):
        self.values = np.asarray(concentration[self.pick], dtype=np.float32)
        self.field = blur(np.nan_to_num(self.values), self.fluid, self.passes, self.area)

    def facing(self, camera):
        return bool((camera[self.axis] - self.plane) * self.outward > 0)


class PlumeCube:
    """배출원 단면 뒤쪽 절반 상자에 농도 표시"""

    def __init__(self, scene, deposit, solid, axis, position, downwind, label="오염물질 농도"):
        if axis not in (0, 1):
            raise ValueError("Concentration cube front face must be perpendicular to the x or y axis.")
        solid = np.asarray(solid, dtype=bool)
        if solid.shape != deposit.fluid.shape:
            raise ValueError("Solid mask shape does not match the concentration grid.")
        self.scene, self.axis, self.position = scene, axis, float(position)
        self.shape = deposit.fluid.shape
        across = 1 - axis
        directions = np.eye(3)
        # 단면과 같은 방향에서 보며 상자는 뒤쪽 절반만 사용
        self.facing = directions[axis] * (-1 if axis == 1 else 1)
        behind = -int(self.facing[axis])
        self.downwind = directions[across] * (1 if downwind >= 0 else -1)
        edges = [np.asarray(edge, dtype=np.float64) for edge in deposit.edges]
        index = int(
            np.clip(np.searchsorted(edges[axis], position, side="right") - 1, 0, self.shape[axis] - 1)
        )
        self.index = index
        if behind > 0:
            cells = slice(index, self.shape[axis])
            cut = np.r_[position, edges[axis][index + 1 :]]
        else:
            cells = slice(0, index + 1)
            cut = np.r_[edges[axis][: index + 1], position]
        # 위로 나간 농도를 숨기지 않도록 상자 높이는 관심 영역 유지
        box = [edges[0], edges[1], edges[2]]
        box[axis] = cut
        self.box_edges = box
        label = f"{label} ({UNIT})"
        fluid = deposit.fluid
        whole = [slice(None)] * 3

        def layer(normal, number, keep_cut=True):
            pick = list(whole)
            pick[normal] = number
            if keep_cut and normal != axis:
                pick[axis] = cells
            return tuple(pick)

        def plane_edges(normal):
            return [box[a] for a in range(3) if a != normal]

        back = self.shape[axis] - 1 if behind > 0 else 0
        self.faces = [
            Face(scene, axis, position, -behind, layer(axis, index), plane_edges(axis), fluid, solid, label),
            Face(scene, axis, cut[-1] if behind > 0 else cut[0], behind, layer(axis, back), plane_edges(axis),
                 fluid, solid, label),
        ]  # fmt: skip
        for normal in (across, 2):
            for end, sign in ((0, -1), (self.shape[normal] - 1, 1)):
                plane = edges[normal][0] if sign < 0 else edges[normal][-1]
                self.faces.append(
                    Face(
                        scene,
                        normal,
                        plane,
                        sign,
                        layer(normal, end),
                        plane_edges(normal),
                        fluid,
                        solid,
                        label,
                    )
                )
        low = np.array([edge[0] for edge in box]) - scene.origin
        high = np.array([edge[-1] for edge in box]) - scene.origin
        self.bounds = np.ravel([low, high], order="F")
        # 깊이 충돌을 막도록 모서리를 면 바깥에 배치
        outline = pv.Box(bounds=self.bounds + np.tile([-LIFT, LIFT], 3)).extract_all_edges()
        self.edge_actor = flat_actor(scene, outline, EDGE, EDGE_WIDTH * scene.scale)
        self.range = None
        self.auto, self.provisional = True, True
        self.visible = False
        self.pending = None
        self.set_range(None)
        self.show(False)
        self.observer = scene.plotter.renderer.AddObserver("StartEvent", self.orient)

    @property
    def front(self):
        return self.faces[0]

    @property
    def sigma(self):
        return self.front.sigma

    @property
    def lookup(self):
        return self.front.panel.lookup

    @property
    def legend(self):
        return self.front.panel.legend

    @property
    def colour_label(self):
        return self.front.panel.colour_label

    def set_label(self, label):
        for face in self.faces:
            face.panel.set_label(f"{label} ({UNIT})")

    def set_range(self, colour_range):
        self.auto = colour_range is None
        if self.auto:
            peak = max(float(face.field.max()) for face in self.faces)
            colour_range = auto_range(peak) if peak > 0 else self.range or (1.0, 10.0**DECADES)
        self.range = (float(colour_range[0]), float(colour_range[1]))
        for face in self.faces:
            face.panel.set_range(self.range)

    def reset_range(self):
        if self.auto:
            self.provisional = True

    def update(self, concentration):
        values = np.asarray(concentration)
        if values.shape != self.shape:
            raise ValueError("Concentration array shape does not match the cube grid.")
        if not self.visible:
            self.pending = values
            return
        self.pending = None
        for face in self.faces:
            face.measure(values)
        peak = max(float(face.field.max()) for face in self.faces)
        if self.auto and peak > 0 and (self.provisional or peak > self.range[1]):
            self.provisional = False
            self.set_range(None)
        for face in self.faces:
            face.panel.update(face.field)

    def orient(self, *_):
        if not self.visible:
            return
        camera = np.asarray(self.scene.plotter.camera.position) + self.scene.origin
        for face in self.faces:
            shown = face.facing(camera)
            if bool(face.panel.actor.GetVisibility()) != shown:
                face.panel.show(shown)

    def show(self, visible):
        self.visible = visible
        self.edge_actor.SetVisibility(visible)
        if not visible:
            for face in self.faces:
                face.panel.show(False)
            return
        if self.pending is not None:
            self.update(self.pending)
        self.orient()

    def close(self):
        self.scene.plotter.renderer.RemoveObserver(self.observer)
        for face in self.faces:
            face.panel.close()
        self.scene.plotter.remove_actor(self.edge_actor, reset_camera=False, render=False)
