import math

import numpy as np
import pyvista as pv
import vtk
from matplotlib import colormaps
from matplotlib.colors import ListedColormap

# 흰 배경에서도 저농도가 보이도록 색표의 밝은 끝 제외
CMAP = ListedColormap(colormaps["magma_r"](np.linspace(0.20, 0.96, 256)), name="flowcast_concentration")
OPACITY = 0.96
CONCENTRATION = "concentration"
# 로그 색 범위 비율과 불투명도의 제어점
RAMPS = {
    "soft": ((0.0, 0.0), (0.08, 0.18), (0.35, 0.55), (0.65, 0.85), (1.0, OPACITY)),
    "field": ((0.0, 0.0), (0.08, 0.12), (0.35, 0.55), (0.70, 0.90), (1.0, 1.0)),
}


def transfer_functions(concentration_range, opacity_range=None, cmap=CMAP, ramp="soft"):
    if ramp not in RAMPS:
        raise ValueError(f"unknown opacity ramp {ramp!r}; choose one of {sorted(RAMPS)}")
    low, high = (math.log10(value) for value in concentration_range)
    lut, colours = pv.LookupTable(cmap), vtk.vtkColorTransferFunction()
    count = lut.GetNumberOfTableValues()
    for n in range(count):
        colours.AddRGBPoint(low + (high - low) * n / (count - 1), *lut.GetTableValue(n)[:3])
    low, high = (math.log10(value) for value in (opacity_range or concentration_range))
    opacity = vtk.vtkPiecewiseFunction()
    for fraction, alpha in RAMPS[ramp]:
        opacity.AddPoint(low + fraction * (high - low), alpha)
    return colours, opacity
