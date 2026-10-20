import itertools

import numpy as np


def clear_path(field, start, end):
    """DDA로 선분 전체를 검사하며 도메인 밖은 열린 경계로 취급"""
    start, end = np.broadcast_arrays(np.atleast_2d(start), np.atleast_2d(end))
    start, end = np.asarray(start, dtype=np.float64), np.asarray(end, dtype=np.float64)
    if start.ndim != 2 or start.shape[1] != 3:
        raise ValueError("paths must have shape [n, 3]")
    with np.errstate(over="ignore", invalid="ignore"):
        delta = end - start
    result = np.isfinite(start).all(axis=1) & np.isfinite(end).all(axis=1) & np.isfinite(delta).all(axis=1)
    active = np.flatnonzero(result)
    if not len(active):
        return result
    low = np.array([edge[0] for edge in field.edges])
    high = np.array([edge[-1] for edge in field.edges])
    shape = np.array(field.valid.shape)
    parallel = delta[active] == 0
    misses = (parallel & ((start[active] < low) | (start[active] > high))).any(axis=1)
    with np.errstate(divide="ignore", invalid="ignore"):
        a = (low - start[active]) / delta[active]
        b = (high - start[active]) / delta[active]
    near = np.where(parallel, -np.inf, np.minimum(a, b))
    far = np.where(parallel, np.inf, np.maximum(a, b))
    entered = np.maximum(0.0, near.max(axis=1))
    exited = np.minimum(1.0, far.min(axis=1))
    intersects = ~misses & (entered <= exited)
    selected = active[intersects]
    if not len(selected):
        return result
    exit_time = np.ones(len(start))
    exit_time[selected] = exited[intersects]
    position = np.clip(start[selected] + entered[intersects, None] * delta[selected], low, high)
    cells = np.zeros_like(start, dtype=np.int64)
    for axis, edge in enumerate(field.edges):
        index = np.searchsorted(edge, position[:, axis], side="right") - 1
        at_face = position[:, axis] == edge[np.clip(index, 0, len(edge) - 1)]
        index -= (delta[selected, axis] < 0) & at_face
        cells[selected, axis] = np.clip(index, 0, shape[axis] - 1)
    direction = np.sign(np.where(np.isfinite(delta), delta, 0.0)).astype(np.int64)
    active = selected
    while len(active):
        fluid = field.valid[tuple(cells[active].T)]
        result[active[~fluid]] = False
        active = active[fluid]
        if not len(active):
            break
        crossing = np.full((len(active), 3), np.inf)
        for axis, edge in enumerate(field.edges):
            moving = delta[active, axis] != 0
            face = cells[active, axis] + (direction[active, axis] > 0)
            np.divide(
                edge[face] - start[active, axis], delta[active, axis], out=crossing[:, axis], where=moving
            )
        soonest = crossing.min(axis=1)
        advancing = soonest <= exit_time[active]
        active, crossing, soonest = active[advancing], crossing[advancing], soonest[advancing]
        if not len(active):
            break
        crossed = crossing <= np.nextafter(soonest[:, None], np.inf)
        multiple = crossed.sum(axis=1) > 1
        # 모서리 접촉에만 최대 일곱 이웃 검사
        if multiple.any():
            tied = active[multiple]
            axes = crossed[multiple]
            for subset in itertools.product((0, 1), repeat=3):
                if not any(subset):
                    continue
                subset = np.array(subset, dtype=bool)
                applies = (axes | ~subset).all(axis=1)
                neighbours = cells[tied] + direction[tied] * subset
                inside = ((neighbours >= 0) & (neighbours < shape)).all(axis=1) & applies
                blocked = np.zeros(len(tied), dtype=bool)
                blocked[inside] = ~field.valid[tuple(neighbours[inside].T)]
                result[tied[blocked]] = False
        cells[active] += direction[active] * crossed
        inside = ((cells[active] >= 0) & (cells[active] < shape)).all(axis=1)
        active = active[inside & result[active]]
    return result
