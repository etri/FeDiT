import math

import numpy as np


def mesh_matrix(up_axis="z", scale=1.0, rotate_z_deg=0.0, translate=(0.0, 0.0, 0.0)):
    """위쪽 축, 배율, z축 회전, 이동 순서의 4x4 행렬 생성"""
    matrix = np.eye(4)
    if up_axis == "y":
        matrix[:3, :3] = [[1, 0, 0], [0, 0, -1], [0, 1, 0]]
    elif up_axis != "z":
        raise ValueError(f"up_axis must be 'z' or 'y', got {up_axis!r}")
    angle = math.radians(rotate_z_deg)
    rotation = np.array(
        [[math.cos(angle), -math.sin(angle), 0], [math.sin(angle), math.cos(angle), 0], [0, 0, 1]]
    )
    matrix[:3, :3] = rotation @ (scale * matrix[:3, :3])
    matrix[:3, 3] = translate
    return matrix


def apply(matrix, points):
    """[..., 3] 좌표에 변환을 적용한 float64 배열 반환"""
    points = np.asarray(points, dtype=np.float64)
    return points @ matrix[:3, :3].T + matrix[:3, 3]


def cell_centres(grid, axis):
    return grid.origin[axis] + (np.arange(grid.shape[axis]) + 0.5) * grid.spacing[axis]


def cell_index(grid, point):
    """셀 번호 (i, j, k)를 반환하며 격자 밖이면 None"""
    index = tuple(math.floor((p - o) / d) for p, o, d in zip(point, grid.origin, grid.spacing))
    return index if all(0 <= i < n for i, n in zip(index, grid.shape)) else None
