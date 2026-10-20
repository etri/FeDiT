import numpy as np

# 임시 배열 크기를 제한할 (삼각형, 기둥) 묶음 크기
CANDIDATES = 1 << 18


def heightmap(chunks, shape):
    nx, ny, nz = shape
    surface = np.full(nx * ny, -np.inf)
    for q in chunks:
        for column, height in column_hits(q, shape):
            np.maximum.at(surface, column, height)
    # 셀 중심이 표면 이하면 고체
    levels = np.clip(np.floor(surface) + 1, 0, nz)
    return (np.arange(nz) < levels[:, None]).view(np.uint8).reshape(nx, ny, nz)


def parity(chunks, shape):
    nx, ny, nz = shape
    mask = np.zeros(nx * ny * nz, dtype=np.uint8)
    for q in chunks:
        for column, height in column_hits(q, shape):
            # 시작 층만 표시하고 누적으로 내부 판별
            level = np.clip(np.floor(height) + 1, 0, nz).astype(np.int64)
            below_top = level < nz
            np.bitwise_xor.at(mask, (column * nz + level)[below_top], 1)
    mask = mask.reshape(nx, ny, nz)
    return np.bitwise_xor.accumulate(mask, axis=2, out=mask)


METHODS = {"heightmap": heightmap, "parity": parity}


def projected_area(q):
    ab, ac = q[:, 1, :2] - q[:, 0, :2], q[:, 2, :2] - q[:, 0, :2]
    return ab[:, 0] * ac[:, 1] - ab[:, 1] * ac[:, 0]


def column_hits(q, shape):
    nx, ny = shape[:2]
    xy = q[..., :2]
    orient = np.sign(projected_area(q))
    low = np.clip(np.ceil(xy.min(axis=1)), 0, (nx, ny)).astype(np.int64)
    high = np.clip(np.floor(xy.max(axis=1)), -1, (nx - 1, ny - 1)).astype(np.int64)
    span = np.clip(high - low + 1, 0, None)
    count = span[:, 0] * span[:, 1] * (orient != 0)
    active = np.flatnonzero(count)
    if not len(active):
        return

    u, v = xy[:, (1, 2, 0)], xy[:, (2, 0, 1)]
    swap = (u[..., 0] > v[..., 0]) | ((u[..., 0] == v[..., 0]) & (u[..., 1] > v[..., 1]))
    start = np.where(swap[..., None], v, u)
    direction = np.where(swap[..., None], u - v, v - u)
    sign = np.where(swap, -1.0, 1.0)
    side = sign * orient[:, None]  # +1이면 삼각형이 정렬한 변의 왼쪽에 있음

    count = count[active]
    total = np.cumsum(count)
    for first in range(0, int(total[-1]), CANDIDATES):
        flat = np.arange(first, min(first + CANDIDATES, int(total[-1])))
        owner = np.searchsorted(total, flat, side="right")
        local = flat - (total[owner] - count[owner])
        t = active[owner]
        i = low[t, 0] + local // span[t, 1]
        j = low[t, 1] + local % span[t, 1]
        edge = direction[t, :, 0] * (j[:, None] - start[t, :, 1]) - direction[t, :, 1] * (
            i[:, None] - start[t, :, 0]
        )
        inside = ((edge * side[t] > 0) | ((edge == 0) & (side[t] > 0))).all(axis=1) & edge.any(axis=1)
        t, edge = t[inside], (edge * sign[t])[inside]
        # 평지붕의 반올림 오차를 막기 위해 기준 높이에 높이 차만 보간
        z = q[t, :, 2]
        rise = edge[:, 1] * (z[:, 1] - z[:, 0]) + edge[:, 2] * (z[:, 2] - z[:, 0])
        yield i[inside] * ny + j[inside], z[:, 0] + rise / edge.sum(axis=1)
