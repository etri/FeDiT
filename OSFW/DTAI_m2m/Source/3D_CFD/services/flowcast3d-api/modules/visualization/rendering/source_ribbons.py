from collections import deque

import numpy as np
import pyvista as pv

from modules.visualization.rendering import flow_paths
from modules.visualization.rendering.layers import PlumeFocus


def source_component(sample, usable, source):
    """배출원과 6방향으로 연결된 유한 농도 영역만 선택"""
    source = np.asarray(source, dtype=np.float64)
    if source.shape != (3,) or not np.isfinite(source).all():
        raise ValueError("source must contain three finite world coordinates")
    connected = np.zeros_like(usable, dtype=bool)
    if any(value < edge[0] or value > edge[-1] for value, edge in zip(source, sample.edges)):
        return connected
    cell = tuple(
        min(int(np.searchsorted(edge, value, side="right") - 1), len(edge) - 2)
        for value, edge in zip(source, sample.edges)
    )
    if not usable[cell]:
        return connected
    # x축 연속 구간으로 방문하여 셀별 Python BFS 생략
    # 이웃 y/z 구간을 확장하므로 6방향 연결과 동일
    pending = deque([cell])
    while pending:
        x, y, z = pending.popleft()
        if connected[x, y, z]:
            continue
        blocked = np.flatnonzero(~usable[:, y, z] | connected[:, y, z])
        cut = int(np.searchsorted(blocked, x))
        left = int(blocked[cut - 1]) + 1 if cut else 0
        right = int(blocked[cut]) if cut < len(blocked) else usable.shape[0]
        connected[left:right, y, z] = True
        for neighbour_y, neighbour_z in ((y - 1, z), (y + 1, z), (y, z - 1), (y, z + 1)):
            if not (0 <= neighbour_y < usable.shape[1] and 0 <= neighbour_z < usable.shape[2]):
                continue
            row = (
                usable[left:right, neighbour_y, neighbour_z]
                & ~connected[left:right, neighbour_y, neighbour_z]
            )
            starts = np.flatnonzero(row & ~np.r_[False, row[:-1]])
            pending.extend((int(left + start), neighbour_y, neighbour_z) for start in starts)
    return connected


def _source_seeds(sample, focus, connected, source, cell, count):
    source = np.asarray(source, dtype=np.float64)
    selected = [source]
    if count == 1:
        return np.asarray(selected)
    # 전체 후보는 분산 선택하되 배출원 근처는 보존
    index = np.column_stack(np.nonzero(connected))
    points = np.column_stack([centres[index[:, axis]] for axis, centres in enumerate(sample.centres)])
    near = np.linalg.norm(points - source, axis=1) <= 3 * cell
    local = np.ravel_multi_index(index[near].T, connected.shape)
    candidates = np.union1d(local, focus.indices(2048, usable=connected))
    index = np.unravel_index(candidates, connected.shape)
    points = np.column_stack([centres[axis] for centres, axis in zip(sample.centres, index)])
    distance = np.sum((points - source) ** 2, axis=1)
    local = distance <= (3 * cell) ** 2
    available = distance > (1e-6 * cell) ** 2
    local_budget = max(1, int(np.ceil(0.75 * count)))
    for rank in range(1, count):
        eligible = available & local if rank < local_budget and (available & local).any() else available
        if not eligible.any():
            break
        picked = int(np.argmax(np.where(eligible, distance, -np.inf)))
        selected.append(points[picked])
        available[picked] = False
        distance = np.minimum(distance, np.sum((points - points[picked]) ** 2, axis=1))
    return np.asarray(selected, dtype=np.float64)


def _continuous_source_paths(paths, source, cell):
    """배출원 근처를 통과하는 충분히 긴 원본 유선만 선택"""
    rows, lengths, nearby, offset = [], [], [], 0
    source = np.asarray(source, dtype=np.float64)
    while offset < len(paths.lines):
        count = int(paths.lines[offset])
        indices = paths.lines[offset + 1 : offset + count + 1]
        points = np.asarray(paths.points[indices], dtype=np.float64)
        delta = np.diff(points, axis=0)
        length2 = np.sum(delta * delta, axis=1)
        projection = np.clip(
            np.sum((source - points[:-1]) * delta, axis=1) / np.maximum(length2, 1e-20), 0, 1
        )
        distance = np.linalg.norm(points[:-1] + projection[:, None] * delta - source, axis=1)
        rows.append(indices)
        lengths.append(float(np.sqrt(length2).sum()))
        nearby.append(bool(np.any(distance <= 3 * cell)))
        offset += count + 1
    lengths, nearby = np.asarray(lengths), np.asarray(nearby, dtype=bool)
    longest = float(lengths[nearby].max()) if nearby.any() else 0.0
    minimum_length = max(3 * cell, min(6 * cell, 0.2 * longest))
    retained = np.flatnonzero(nearby & (lengths >= minimum_length))
    if len(retained) == paths.n_lines:
        return paths, minimum_length
    if not len(retained):
        return pv.PolyData(), minimum_length
    picked = np.concatenate([rows[line] for line in retained])
    lines, offset = [], 0
    for line in retained:
        count = len(rows[line])
        lines.append(np.r_[count, np.arange(offset, offset + count)])
        offset += count
    result = pv.PolyData(paths.points[picked], lines=np.concatenate(lines))
    for name, values in paths.point_data.items():
        result.point_data[name] = values[picked]
    for name, values in paths.cell_data.items():
        result.cell_data[name] = values[retained]
    for name, values in paths.field_data.items():
        result.field_data[name] = values
    return result, minimum_length


def build(sample, channels, concentrations, source, origin, max_seeds=32):
    if not isinstance(max_seeds, (int, np.integer)) or not 0 <= max_seeds <= flow_paths.MAX_SEEDS:
        raise ValueError(f"max_seeds must be an integer between 0 and {flow_paths.MAX_SEEDS}")
    origin = np.asarray(origin, dtype=np.float64)
    if origin.shape != (3,) or not np.isfinite(origin).all():
        raise ValueError("origin must contain three finite world coordinates")
    focus = PlumeFocus(sample, channels, concentrations, source=source)
    connected = source_component(sample, focus.usable, source)
    cell = min(float(np.diff(edge).min()) for edge in sample.edges)
    diagnostics = dict(
        focus.diagnostics,
        source_connected_count=int(connected.sum()),
        disconnected_count=int((focus.usable & ~connected).sum()),
        seed_count=0,
        line_count=0,
        discarded_fragment_count=0,
        minimum_path_length=3 * cell,
        display_radius=0.14 * cell,
    )
    if not max_seeds or not connected.any():
        return pv.PolyData(), pv.PolyData(), diagnostics
    seeds = _source_seeds(sample, focus, connected, source, cell, max_seeds)
    paths = flow_paths.trace(
        sample,
        channels,
        seeds,
        origin,
        "concentration",
        1e-8,
        color_values=concentrations,
        support=connected,
    )
    diagnostics["seed_count"] = len(seeds)
    if not paths.n_lines:
        return paths, pv.PolyData(), diagnostics
    traced_count = paths.n_lines
    paths, diagnostics["minimum_path_length"] = _continuous_source_paths(
        paths, np.asarray(source) - origin, cell
    )
    diagnostics["discarded_fragment_count"] = traced_count - paths.n_lines
    if not paths.n_lines:
        return paths, pv.PolyData(), diagnostics
    paths = flow_paths.distinct(paths, separation=0.6 * cell)
    diagnostics["line_count"] = paths.n_lines
    surface = paths.tube(radius=diagnostics["display_radius"], n_sides=8, capping=True, radius_factor=1)
    return paths, surface, diagnostics
