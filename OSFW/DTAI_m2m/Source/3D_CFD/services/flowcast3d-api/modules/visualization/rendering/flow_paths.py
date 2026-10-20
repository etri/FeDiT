import itertools

import numpy as np
import pyvista as pv

from modules.domain.transport.boundary import clear_path
from modules.domain.transport.fields import velocity
from modules.visualization.readers.adapter import scalar
from modules.visualization.rendering.layers import VALUE, volume_indices

MAX_SEEDS = 64
STEPS = 128
MAX_STEPS = 384


def step_budget(sample):
    step = 0.45 * min(float(np.diff(edge).min()) for edge in sample.edges)
    diagonal = np.linalg.norm([edge[-1] - edge[0] for edge in sample.edges])
    return int(np.clip(np.ceil(diagonal / step), STEPS, MAX_STEPS))


class Interpolator:
    """불균일한 마지막 블록까지 실제 셀 중심으로 보간"""

    def __init__(self, sample, channels, support=None):
        self.sample, self.valid, self.edges = sample, sample.valid, sample.edges
        if support is not None:
            support = np.asarray(support, dtype=bool)
            if support.shape != self.valid.shape:
                raise ValueError("support must have the same XYZ shape as sample.valid")
            self.valid = self.valid & support
        # 농도 표시 경계는 벽이 아니므로 바깥 유체 속도도 보간에 사용
        self.vectors = np.where(sample.valid[..., None], velocity(sample.values, channels), 0)
        self.bounds = np.array([[edge[0] for edge in self.edges], [edge[-1] for edge in self.edges]])

    def fluid(self, points):
        index = tuple(
            np.clip(np.searchsorted(edge, points[:, axis], side="right") - 1, 0, len(edge) - 2)
            for axis, edge in enumerate(self.edges)
        )
        return self.valid[index] & ((points >= self.bounds[0]) & (points <= self.bounds[1])).all(axis=1)

    def at(self, points, values):
        first, second, weight = [], [], []
        for axis, centre in enumerate(self.sample.centres):
            if len(centre) == 1:
                first.append(np.zeros(len(points), dtype=np.int64))
                second.append(first[-1])
                weight.append(np.zeros(len(points)))
                continue
            index = np.clip(np.searchsorted(centre, points[:, axis], side="right") - 1, 0, len(centre) - 2)
            first.append(index)
            second.append(index + 1)
            weight.append(
                np.clip((points[:, axis] - centre[index]) / (centre[index + 1] - centre[index]), 0, 1)
            )
        out = np.zeros((len(points), *values.shape[3:]))
        for corner in itertools.product((0, 1), repeat=3):
            picked = tuple(second[axis] if side else first[axis] for axis, side in enumerate(corner))
            share = np.prod(
                [weight[axis] if side else 1 - weight[axis] for axis, side in enumerate(corner)], axis=0
            )
            out += values[picked] * share.reshape((-1, *([1] * (values.ndim - 3))))
        return out


def seeds(sample, focus, density, count=MAX_SEEDS, support=None):
    """건물 주변과 방향 전환을 우선하며 같은 입력의 위치는 고정"""
    if support is not None:
        support = np.asarray(support, dtype=bool)
        if support.shape != sample.valid.shape:
            raise ValueError("support must have the same XYZ shape as sample.valid")
    usable = sample.valid if support is None else sample.valid & support
    candidates = volume_indices(usable, density) if focus is None else focus.indices(density, usable=support)
    count = min(max(int(count), 0), MAX_SEEDS, len(candidates))
    if not count:
        return np.empty((0, 3), dtype=np.float64)
    index = np.unravel_index(candidates, sample.valid.shape)
    points = np.column_stack([centre[axis] for centre, axis in zip(sample.centres, index)])
    if count == len(points):
        return points
    features = getattr(focus, "flow_focus", focus)
    near = getattr(features, "near_solid", None)
    near = np.zeros(len(points), dtype=bool) if near is None else near.ravel()[candidates]
    interest = getattr(features, "interest", None)
    interest = np.zeros(len(points)) if interest is None else interest.ravel()[candidates]
    interesting = interest >= 0.2
    context = ~interesting & ~near
    reserve = min(int(context.sum()), max(1, count // 8))
    preferred = min(int(interesting.sum()), count - reserve, max(1, int(np.ceil(0.7 * count))))
    neighbouring = min(int((near & ~interesting).sum()), count - reserve - preferred)
    selected, available = [], np.ones(len(points), dtype=bool)
    distance = np.full(len(points), np.inf)
    centre_distance = np.sum((points - points.mean(axis=0)) ** 2, axis=1)
    for rank in range(count):
        if rank < preferred:
            eligible = available & interesting
        elif rank < preferred + neighbouring:
            eligible = available & near & ~interesting
        else:
            eligible = available & context if (available & context).any() else available
        score = distance if selected else centre_distance
        # 관심도는 위치 선택에만 적용하며 원본 벡터는 유지
        if rank < preferred:
            score = score * (1 + interest)
        picked = int(np.argmax(np.where(eligible, score, -np.inf)))
        selected.append(picked)
        available[picked] = False
        distance = np.minimum(distance, np.sum((points - points[picked]) ** 2, axis=1))
    return points[selected]


def trace(
    sample,
    channels,
    positions,
    origin,
    quantity,
    speed_floor,
    color_values=None,
    steps=None,
    support=None,
    width_quantity=None,
):
    """현재 시각의 원본 속도를 양방향 RK2로 적분하며 고체 선분은 제외"""
    if not len(positions):
        return pv.PolyData()
    field = Interpolator(sample, channels, support=support)
    positions = np.asarray(positions, dtype=np.float64)
    positions = positions[field.fluid(positions)]
    if not len(positions):
        return pv.PolyData()
    step = 0.45 * min(float(np.diff(edge).min()) for edge in sample.edges)
    budget = step_budget(sample) if steps is None else min(max(int(steps), 0), MAX_STEPS)
    tracks, closed = [], np.zeros(len(positions), dtype=bool)
    for direction in (-1, 1):
        paths = [[point.copy()] for point in positions]
        active = np.flatnonzero(~closed)
        current = positions[active].copy()
        for _ in range(budget):
            vectors = field.at(current, field.vectors)
            speeds = np.linalg.norm(vectors, axis=1)
            moving = speeds >= max(speed_floor, 1e-8)
            active, current, vectors, speeds = (
                active[moving],
                current[moving],
                vectors[moving],
                speeds[moving],
            )
            if not len(active):
                break
            half = current + direction * 0.5 * step * vectors / speeds[:, None]
            allowed = field.fluid(half) & clear_path(field, current, half)
            active, current, half = active[allowed], current[allowed], half[allowed]
            if not len(active):
                break
            vectors = field.at(half, field.vectors)
            speeds = np.linalg.norm(vectors, axis=1)
            moving = speeds >= max(speed_floor, 1e-8)
            active, current, vectors, speeds = (
                active[moving],
                current[moving],
                vectors[moving],
                speeds[moving],
            )
            if not len(active):
                break
            following = current + direction * step * vectors / speeds[:, None]
            allowed = field.fluid(following) & clear_path(field, current, following)
            active, following = active[allowed], following[allowed]
            continuing = np.ones(len(active), dtype=bool)
            for index, point in zip(active, following):
                paths[index].append(point.copy())
            for row, index in enumerate(active):
                earlier = np.asarray(paths[index][:-5])
                # 폐곡선은 한 바퀴에서 종료
                if len(earlier) and np.any(np.linalg.norm(earlier - following[row], axis=1) < 0.3 * step):
                    closed[index], continuing[row] = True, False
            active, current = active[continuing], following[continuing]
            if not len(active):
                break
        tracks.append(paths)
    paths = [np.asarray([*back[:0:-1], *ahead]) for back, ahead in zip(*tracks)]
    paths = [path for path in paths if len(path) >= 3]
    if not paths:
        return pv.PolyData()
    points = np.concatenate(paths)
    lines, offset = [], 0
    for path in paths:
        lines.append(np.r_[len(path), np.arange(offset, offset + len(path))])
        offset += len(path)
    data = pv.PolyData(
        (points - np.asarray(origin, dtype=np.float64)).astype(np.float32), lines=np.concatenate(lines)
    )
    values = scalar(sample.values, channels, quantity) if color_values is None else color_values
    values = np.where(sample.valid, values, 0)
    data.point_data[VALUE] = field.at(points, values).astype(np.float32)
    data.point_data["velocity"] = field.at(points, field.vectors).astype(np.float32)
    if width_quantity is not None:
        widths = np.where(sample.valid, scalar(sample.values, channels, width_quantity), 0)
        data.point_data["width"] = field.at(points, widths).astype(np.float32)
    return data


def distinct(paths, separation):
    """전 구간이 겹치는 유선만 제외하며 새 분기와 반대 흐름은 보존"""
    if not np.isfinite(separation) or separation <= 0:
        raise ValueError("separation must be finite and positive")
    if paths.n_lines < 2:
        return paths
    indices, offset = [], 0
    while offset < len(paths.lines):
        count = paths.lines[offset]
        indices.append(paths.lines[offset + 1 : offset + count + 1])
        offset += count + 1
    points = np.asarray(paths.points, dtype=np.float64)
    vectors = np.asarray(paths.point_data["velocity"], dtype=np.float64)
    directions = vectors / np.maximum(np.linalg.norm(vectors, axis=1, keepdims=True), 1e-12)
    lengths = [np.linalg.norm(np.diff(points[index], axis=0), axis=1).sum() for index in indices]
    order = np.argsort(-np.asarray(lengths), kind="stable")
    offsets = np.asarray(list(itertools.product((-1, 0, 1), repeat=3)))
    cosine, distance2 = np.cos(np.deg2rad(20.0)), separation**2
    occupied, retained = {}, []
    for line in order:
        index = indices[line]
        cells = np.floor(points[index] / separation).astype(np.int64)
        keys, groups = np.unique(cells, axis=0, return_inverse=True)
        duplicate = True
        for group, key in enumerate(keys):
            neighbours = [occupied[tuple(cell)] for cell in key + offsets if tuple(cell) in occupied]
            if not neighbours:
                duplicate = False
                break
            rows = index[groups == group]
            nearby = np.concatenate(neighbours)
            close = np.sum((points[rows, None] - nearby[None, :, :3]) ** 2, axis=-1) <= distance2
            aligned = directions[rows] @ nearby[:, 3:].T >= cosine
            if not (close & aligned).any(axis=1).all():
                duplicate = False
                break
        if duplicate:
            continue
        retained.append(int(line))
        for group, key in enumerate(keys):
            rows = index[groups == group]
            values = np.column_stack([points[rows], directions[rows]])
            key = tuple(key)
            occupied[key] = np.concatenate([occupied[key], values]) if key in occupied else values
    if len(retained) == len(indices):
        return paths
    retained.sort()
    picked = np.concatenate([indices[line] for line in retained])
    lines, offset = [], 0
    for line in retained:
        count = len(indices[line])
        lines.append(np.r_[count, np.arange(offset, offset + count)])
        offset += count
    result = pv.PolyData(paths.points[picked], lines=np.concatenate(lines))
    for name, values in paths.point_data.items():
        result.point_data[name] = values[picked]
    for name, values in paths.cell_data.items():
        result.cell_data[name] = values[retained]
    for name, values in paths.field_data.items():
        result.field_data[name] = values
    return result
