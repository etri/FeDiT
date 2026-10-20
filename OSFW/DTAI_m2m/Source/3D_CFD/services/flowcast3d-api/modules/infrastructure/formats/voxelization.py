"""메시 파일의 삼각형을 순수 복셀 계산에 전달"""

import numpy as np

from modules.domain.grids.voxelize import METHODS
from modules.infrastructure.formats.mesh import iter_triangles


def voxelize(paths, grid, method="heightmap", chunk=200_000, transform=None):
    """고체가 1인 [X, Y, Z] 마스크 생성"""
    if method not in METHODS:
        raise ValueError(f"unknown voxelization method {method!r}, expected one of {sorted(METHODS)}")
    return METHODS[method](cell_coordinates(paths, grid, chunk, transform), grid.shape)


def cell_coordinates(paths, grid, chunk, transform=None):
    origin, spacing = np.array(grid.origin), np.array(grid.spacing)
    for triangles in iter_triangles(paths, chunk, transform):
        # 큰 좌표의 자릿수 손실을 막기 위해 float64에서 원점 차감
        yield (triangles - origin) / spacing - 0.5
