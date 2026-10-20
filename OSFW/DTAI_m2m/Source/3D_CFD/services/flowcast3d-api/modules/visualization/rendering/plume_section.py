import numpy as np

from modules.visualization.rendering.field_panel import FieldPanel, blur, passes, spread
from modules.visualization.rendering.section_depth import SectionDepth, veil

UNIT = "㎍/㎥"  # VTK 한글 글꼴에 없는 마이크로 기호 대체


class PlumeSection:
    """배출원을 지나는 원본 셀 단면의 농도 표시"""

    def __init__(self, scene, deposit, solid, axis, position, label="오염물질 농도"):
        if axis not in (0, 1):
            raise ValueError("Vertical concentration slice axis must be x or y.")
        self.scene, self.axis, self.position = scene, axis, float(position)
        self.shape = deposit.fluid.shape
        self.index = int(
            np.clip(np.searchsorted(deposit.edges[axis], position, side="right") - 1, 0, self.shape[axis] - 1)
        )
        self.fluid = np.take(deposit.fluid, self.index, axis=axis).copy()
        solid = np.asarray(solid, dtype=bool)
        if solid.shape != self.shape:
            raise ValueError("Solid mask shape does not match the concentration grid.")
        self.solid = np.take(solid, self.index, axis=axis)
        self.values = np.zeros(self.fluid.shape, dtype=np.float32)
        self.field = np.zeros(self.fluid.shape, dtype=np.float32)
        across = 1 - axis
        self.passes = passes((deposit.edges[across], deposit.edges[2]))
        self.sigma = spread((deposit.edges[across], deposit.edges[2]), self.passes)
        self.area = (np.diff(deposit.edges[across])[:, None] * np.diff(deposit.edges[2])[None, :]).astype(
            np.float32
        )
        corner = np.zeros(3)
        corner[axis] = position
        corner[across], corner[2] = deposit.edges[across][0], deposit.edges[2][0]
        directions = np.eye(3)
        # 가로 좌표가 오른쪽으로 증가하는 방향에서 단면 표시
        self.facing = directions[axis] * (-1 if axis == 1 else 1)
        back = -self.facing
        self.depth = SectionDepth(scene, deposit, solid, axis, position, self.facing)
        self.panel = FieldPanel(
            scene,
            corner - scene.origin,
            (directions[across], directions[2]),
            (deposit.edges[across], deposit.edges[2]),
            self.fluid,
            back,
            f"{label} ({UNIT})",
            None,
            [],
            solid=self.solid,
            alpha=veil(),
            lift=self.depth.lift,
        )
        self.actor = self.panel.actor
        self.show(False)

    def update(self, concentration):
        values = np.asarray(concentration)
        if values.shape != self.shape:
            raise ValueError("Concentration array shape does not match the slice grid.")
        self.values = np.take(values, self.index, axis=self.axis).astype(np.float32)
        self.field = blur(np.nan_to_num(self.values), self.fluid, self.passes, self.area)
        self.panel.update(self.field)

    def set_label(self, label):
        self.panel.set_label(f"{label} ({UNIT})")

    @property
    def range(self):
        return self.panel.range

    def show(self, visible):
        self.panel.show(visible)
        self.depth.show(visible)

    def close(self):
        self.depth.close()
        self.panel.close()
