import math

import numpy as np

from modules.visualization.rendering.field_panel import CLEAR, FieldPanel, blur, passes, spread


class ColumnMap:
    """열 적분 농도(µg/m²)를 질량 보존 평활화한 지도 패널"""

    def __init__(self, scene, deposit, concentration_range, label="가상 배출 연직 적분량"):
        self.scene = scene
        self.fluid = np.asarray(deposit.fluid, dtype=bool).copy()
        if self.fluid.ndim != 3 or not all(self.fluid.shape):
            raise ValueError("Concentration map requires a nonempty XYZ fluid mask.")
        if len(deposit.edges) != 3:
            raise ValueError("Concentration map requires XYZ cell edges.")
        edges = [np.asarray(edge, dtype=np.float64).copy() for edge in deposit.edges]
        for axis, edge in enumerate(edges):
            if (
                edge.ndim != 1
                or len(edge) != self.fluid.shape[axis] + 1
                or not np.isfinite(edge).all()
                or not np.all(np.diff(edge) > 0)
            ):
                raise ValueError("Cell edges must match the fluid mask shape and increase strictly.")
        self.dz = np.diff(edges[2])
        self.reference_height = float(self.dz.mean())
        bounds = np.asarray(concentration_range, dtype=np.float64)
        if bounds.shape != (2,) or not np.isfinite(bounds).all() or not 0 < bounds[0] < bounds[1]:
            raise ValueError(
                "Concentration colour range must have positive finite bounds in increasing order."
            )
        bounds = bounds * self.reference_height
        if not np.isfinite(bounds).all() or not (bounds > 0).all():
            raise ValueError("Column integral colour range cannot be represented.")
        low, high = math.floor(math.log10(bounds[0])), math.ceil(math.log10(bounds[1]))
        if low < -300 or high > 300:
            raise ValueError("Column integral colour range exceeds the supported numeric range.")
        self.range = (10.0**low, 10.0**high)
        self.projection_height = float(edges[2][-1] + max(0.001, self.dz.min() * 0.001))
        self.columns = self.fluid.any(axis=2)
        self.passes = passes(edges[:2])
        self.sigma = spread(edges[:2], self.passes)
        self.area = (np.diff(edges[0])[:, None] * np.diff(edges[1])[None, :]).astype(np.float32)
        self.mass = np.zeros(self.fluid.shape[:2], dtype=np.float64)
        self.field = np.zeros(self.fluid.shape[:2], dtype=np.float32)
        corner = np.array([edges[0][0], edges[1][0], self.projection_height]) - scene.origin
        self.panel = FieldPanel(
            scene,
            corner,
            ((1.0, 0.0, 0.0), (0.0, 1.0, 0.0)),
            edges[:2],
            self.columns,
            (0.0, 0.0, -1.0),
            f"{label} (㎍/㎡)",
            None,
            [(~self.columns, CLEAR)],
            translucent=True,
        )
        self.actor = self.panel.actor
        self.lookup = self.panel.lookup
        self.show(False)

    def show(self, visible):
        self.panel.show(visible)

    def update(self, concentration):
        """XYZ 농도(µg/m³)를 실제 셀 높이로 적분"""
        values = np.asarray(concentration)
        if values.shape != self.fluid.shape:
            raise ValueError("Concentration array shape does not match the XYZ fluid mask.")
        fluid = np.where(self.fluid, values, 0.0)
        if not np.isfinite(fluid).all() or (fluid < 0).any():
            raise ValueError("Fluid cell concentrations must be finite and nonnegative.")
        mass = fluid.astype(np.float64, copy=False) @ self.dz
        if not np.isfinite(mass).all():
            raise ValueError("Column integral exceeds the finite numeric range.")
        self.mass = mass
        self.field = blur(mass, self.columns, self.passes, self.area)
        self.panel.update(self.field)

    def close(self):
        self.panel.close()
