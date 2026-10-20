import math
from dataclasses import dataclass
from itertools import pairwise, product

import numpy as np

from modules.domain.grids.planning import TRAINED_SIZES, n_spatial_dims, plan_size
from modules.domain.schemas import AXES


@dataclass(frozen=True)
class Tile:
    window: tuple  # 추론 창의 공간 slice 3개
    core: tuple  # 담당 핵심 영역의 공간 slice 3개
    overlap: tuple  # 축별 양쪽 겹침 셀 수, 영역 경계는 0
    boundary_conditions: dict


def window_shape(shape, tile, halo, max_voxels):
    """tile + 2 * halo를 모델이 받는 격자 크기에 맞춤"""
    if min(tile) < 1 or min(halo) < 0:
        raise ValueError(
            f"tile must be at least 1 and halo at least 0, got tile {tuple(tile)} and halo {tuple(halo)}"
        )
    wanted = tuple(min(n, t + 2 * h) for n, t, h in zip(shape, tile, halo, strict=True))
    planned = plan_size(wanted, max_voxels)
    sizes = TRAINED_SIZES[n_spatial_dims(wanted)]
    return tuple(max((s for s in sizes if s <= min(n, p)), default=min(n, p)) for n, p in zip(shape, planned))


def window_starts(n, window, halo):
    """이웃 창이 2 * halo 이상 겹치도록 시작 셀 배치"""
    if window >= n:
        return [0]
    if window <= 2 * halo:
        raise ValueError(f"halo {halo} leaves no core in a window of {window} cells")
    count = math.ceil((n - 2 * halo) / (window - 2 * halo))
    # 내림 나눗셈으로 최소 겹침 폭 유지
    return [i * (n - window) // (count - 1) for i in range(count)]


def tile_layout(shape, window, halo, boundary_conditions):
    axes = []
    for n, size, h in zip(shape, window, halo, strict=True):
        starts = window_starts(n, size, h)
        overlaps = [0] + [a + size - b for a, b in pairwise(starts)] + [0]
        # 겹침 구간의 가운데를 핵심 경계로 삼아 halo 확보
        edges = [0] + [b + overlap // 2 for b, overlap in zip(starts[1:], overlaps[1:])] + [n]
        axes.append(
            [
                (
                    slice(start, min(start + size, n)),
                    slice(edges[i], edges[i + 1]),
                    (overlaps[i], overlaps[i + 1]),
                )
                for i, start in enumerate(starts)
            ]
        )
    return [
        Tile(
            window=tuple(axis[0] for axis in tile),
            core=tuple(axis[1] for axis in tile),
            overlap=tuple(axis[2] for axis in tile),
            boundary_conditions={
                name: face_conditions(boundary_conditions[name], axis[0], n)
                for name, axis, n in zip(AXES, tile, shape)
            },
        )
        for tile in product(*axes)
    ]


def face_conditions(domain, window, n):
    if (window.start, window.stop) == (0, n):
        return list(domain)
    # 분할 창은 반대편을 읽지 못하므로 periodic도 open으로 처리
    return [
        "open" if inside or side == "periodic" else side
        for side, inside in zip(domain, (window.start > 0, window.stop < n))
    ]


def blend_weights(tile):
    """축별 float32 가중치 (wx, wy, wz)를 반환하며 합산 후 재정규화 필요"""
    weights = []
    for window, (low, high) in zip(tile.window, tile.overlap):
        weight = np.ones(window.stop - window.start, dtype=np.float32)
        weight[:low] = (np.arange(low) + 0.5) / low
        weight[len(weight) - high :] = np.minimum(
            weight[len(weight) - high :], (np.arange(high)[::-1] + 0.5) / high
        )
        weights.append(weight)
    return tuple(weights)
