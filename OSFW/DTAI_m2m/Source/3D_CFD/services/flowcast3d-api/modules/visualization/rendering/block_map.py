import numpy as np

from modules.visualization.rendering.field_panel import GROUND, panel_plane, textured

DENSITY = 8.0  # 텍스처 해상도(px/m)
SUPERSAMPLE = 3
MIN_AREA = 6.0  # 남길 건물 조각의 최소 면적(m²)
TIER = 3
TOLERANCE = 0.75  # 외곽선 단순화 허용 거리(셀)
ROOF_LOW, ROOF_HIGH = (210, 209, 204), (238, 237, 233)
EDGE = (118, 116, 110)
SUN = (0.22, -0.17)  # 높이 1 m당 그림자의 x, y 이동(m)
SHADE = 0.9
SHADOW = 3.0


def neighbours(values):
    padded = np.pad(values, 1, mode="edge")
    return np.stack([padded[:-2, 1:-1], padded[2:, 1:-1], padded[1:-1, :-2], padded[1:-1, 2:]])


def tidy(height, passes=2):
    out = np.asarray(height).copy()
    for _ in range(passes):
        around = np.sort(neighbours(out), axis=0)
        out = np.clip(out, around[1], around[2])
    return out


def components(mask):
    labels = np.where(mask, np.arange(mask.size).reshape(mask.shape), mask.size)
    while True:
        low = labels.copy()
        low[1:] = np.minimum(low[1:], labels[:-1])
        low[:-1] = np.minimum(low[:-1], labels[1:])
        low[:, 1:] = np.minimum(low[:, 1:], labels[:, :-1])
        low[:, :-1] = np.minimum(low[:, :-1], labels[:, 1:])
        low = np.where(mask, low, mask.size)
        if (low == labels).all():
            return np.where(mask, labels, -1)
        labels = low


def heights(levels, ground, area):
    roof = tidy(np.clip(np.asarray(levels, dtype=np.int32) - ground, 0, None))
    # 복셀 지붕이 등고선처럼 보이지 않도록 높이 양자화
    height = -(-roof // TIER) * TIER
    labels = components(height > 0)
    counts = np.bincount(labels[labels >= 0], minlength=labels.size)
    small = (labels >= 0) & (counts[np.maximum(labels, 0)] * area < MIN_AREA)
    return np.where(small, 0, height), np.where(small, 0, roof)


def trace(mask):
    """복셀 기둥 외곽을 따라 닫힌 윤곽선 생성"""
    mask = np.pad(np.asarray(mask, dtype=bool), 1)
    starts, ends = [], []
    for (dx, dy), start, end in (
        ((0, -1), (0, 0), (1, 0)),
        ((1, 0), (1, 0), (1, 1)),
        ((0, 1), (1, 1), (0, 1)),
        ((-1, 0), (0, 1), (0, 0)),
    ):
        inside = mask[1:-1, 1:-1] & ~mask[1 + dx : mask.shape[0] - 1 + dx, 1 + dy : mask.shape[1] - 1 + dy]
        cells = np.argwhere(inside)
        starts.append(cells + start)
        ends.append(cells + end)
    starts, ends = np.concatenate(starts), np.concatenate(ends)
    outgoing = {}
    for index, start in enumerate(map(tuple, starts)):
        outgoing.setdefault(start, []).append(index)
    used = np.zeros(len(starts), dtype=bool)
    loops = []
    for first in range(len(starts)):
        if used[first]:
            continue
        loop, edge = [], first
        while not used[edge]:
            used[edge] = True
            loop.append(starts[edge])
            end = tuple(ends[edge])
            options = [option for option in outgoing[end] if not used[option]]
            if len(options) > 1:
                # 분기에서는 들어온 방향의 왼쪽 우선
                dx, dy = ends[edge] - starts[edge]
                turns = [dx * (ends[o][1] - starts[o][1]) - dy * (ends[o][0] - starts[o][0]) for o in options]
                options = [options[int(np.argmax(turns))]]
            if not options:
                break
            edge = options[0]
        loops.append(np.asarray(loop))
    return loops


def simplify(points, tolerance):
    points = np.asarray(points, dtype=np.float64)
    if len(points) < 4:
        return points
    far = int(np.argmax(np.hypot(*(points - points[0]).T)))
    keep = np.zeros(len(points), dtype=bool)
    keep[[0, far]] = True
    stack = [(0, far), (far, len(points))]
    while stack:
        first, last = stack.pop()
        end = points[last % len(points)]
        if last - first < 2:
            continue
        chord = end - points[first]
        middle = points[first + 1 : last] - points[first]
        length = float(np.hypot(*chord))
        if length > 0:
            distance = np.abs(chord[0] * middle[:, 1] - chord[1] * middle[:, 0]) / length
        else:
            distance = np.hypot(*middle.T)
        worst = int(np.argmax(distance))
        if distance[worst] > tolerance:
            split = first + 1 + worst
            keep[split] = True
            stack += [(first, split), (split, last)]
    kept = points[keep]
    return kept if len(kept) >= 3 else points


def fill(loops, shape):
    """픽셀 중심의 짝홀 규칙으로 다각형 내부 채움"""
    rows, columns = shape
    toggles = np.zeros((rows, columns + 1), dtype=np.int8)
    for loop in loops:
        start, end = loop, np.roll(loop, -1, axis=0)
        low, high = np.minimum(start[:, 1], end[:, 1]), np.maximum(start[:, 1], end[:, 1])
        first = np.clip(np.ceil(low - 0.5), 0, rows).astype(np.int64)
        last = np.clip(np.ceil(high - 0.5), 0, rows).astype(np.int64)
        counts = last - first
        if not counts.sum():
            continue
        edge = np.repeat(np.arange(len(loop)), counts)
        row = np.arange(counts.sum()) - np.repeat(np.cumsum(counts) - counts, counts) + first[edge]
        fraction = (row + 0.5 - start[edge, 1]) / (end[edge, 1] - start[edge, 1])
        x = start[edge, 0] + fraction * (end[edge, 0] - start[edge, 0])
        column = np.clip(np.ceil(x - 0.5), 0, columns).astype(np.int64)
        np.add.at(toggles, (row, column), 1)
    # 짝홀 판정만 하므로 int8 누적 오버플로 허용
    return (np.cumsum(toggles, axis=1, dtype=np.int8)[:, :columns] & 1).astype(bool)


def coverage(mask, scale, size, cell):
    """다각형 범위에서 픽셀별 덮임 비율 계산"""
    loops = [simplify(loop, TOLERANCE) for loop in trace(mask)]
    loops = [
        loop * scale for loop in loops if abs(area(loop)) * cell[0] * cell[1] >= MIN_AREA or area(loop) < 0
    ]
    if not loops:
        return None
    points = np.concatenate(loops)
    low = np.clip(np.floor(points.min(axis=0)).astype(int) - 1, 0, None)
    high = np.minimum(np.ceil(points.max(axis=0)).astype(int) + 1, (size[1], size[0]))
    columns, rows = high - low
    inside = fill([(loop - low) * SUPERSAMPLE for loop in loops], (rows * SUPERSAMPLE, columns * SUPERSAMPLE))
    count = sum(inside[offset::SUPERSAMPLE].astype(np.uint8) for offset in range(SUPERSAMPLE))
    count = sum(count[:, offset::SUPERSAMPLE] for offset in range(SUPERSAMPLE))
    return count.astype(np.float32) / SUPERSAMPLE**2, slice(low[1], high[1]), slice(low[0], high[0])


def area(loop):
    x, y = np.asarray(loop, dtype=np.float64).T
    return 0.5 * float(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))


def raster(height, edges, dz, density=DENSITY):
    cell = [float(np.mean(np.diff(edge))) for edge in edges]
    size = [float(edge[-1] - edge[0]) for edge in edges]
    columns, rows = (max(2, int(np.ceil(side * density))) for side in size)
    scale = (columns / height.shape[0], rows / height.shape[1])
    tiers = np.unique(height[height > 0])
    top = float(tiers.max() * dz) if len(tiers) else 1.0
    colour = np.empty((rows, columns, 3), dtype=np.float32)
    colour[:] = GROUND
    surface = np.zeros((rows, columns), dtype=np.float32)
    outline = None
    for tier in tiers:
        covered = coverage(height >= tier, scale, (rows, columns), cell)
        if covered is None:
            continue
        cover, down, across = covered
        fraction = np.sqrt(tier * dz / top)
        roof = (1 - fraction) * np.asarray(ROOF_LOW) + fraction * np.asarray(ROOF_HIGH)
        colour[down, across] += cover[..., None] * (roof - colour[down, across])
        surface[down, across][cover >= 0.5] = tier * dz
        if outline is None:
            padded = np.pad(cover, 1, mode="edge")
            tall, wide = cover.shape
            inner = np.minimum.reduce(
                [padded[a : a + tall, b : b + wide] for a, b in ((0, 1), (2, 1), (1, 0), (1, 2), (1, 1))]
            )
            outline = np.clip(cover - inner, 0, 1), down, across
    colour *= (1 - (1 - SHADE) * shade(surface, density))[..., None]
    if outline is not None:
        band, down, across = outline
        colour[down, across] += band[..., None] * (np.asarray(EDGE) - colour[down, across])
    pixels = np.empty((rows, columns, 4), dtype=np.uint8)
    pixels[..., :3] = np.clip(colour + 0.5, 0, 255)
    pixels[..., 3] = 255
    return pixels


def shade(surface, density):
    rows, columns = surface.shape
    coarse = (
        surface[: rows - rows % 2, : columns - columns % 2]
        .reshape(rows // 2, 2, columns // 2, 2)
        .max(axis=(1, 3))
    )
    shadow = np.zeros(coarse.shape, dtype=bool)
    length = float(np.hypot(*SUN))
    direction = np.asarray(SUN) / length
    reach = min(float(coarse.max()) * length, SHADOW)
    for distance in np.arange(1.0, reach * density / 2 + 1.0) * 2 / density:
        dx, dy = (round(-value * distance * density / 2) for value in direction)
        source = np.full_like(coarse, -1.0)
        height, width = coarse.shape
        source[max(0, -dy) : height - max(0, dy), max(0, -dx) : width - max(0, dx)] = coarse[
            max(0, dy) : height - max(0, -dy), max(0, dx) : width - max(0, -dx)
        ]
        shadow |= source - distance / length > coarse + 1e-3
    soft = double(shadow)
    out = np.zeros(surface.shape, dtype=np.float32)
    out[: soft.shape[0], : soft.shape[1]] = soft
    for axis in range(2):
        out = (np.roll(out, 1, axis) + 2 * out + np.roll(out, -1, axis)) / 4
    return out


def double(values):
    out = np.asarray(values, dtype=np.float32)
    for axis in range(2):
        count = out.shape[axis]
        padded = np.concatenate([np.take(out, [0], axis), out, np.take(out, [-1], axis)], axis)
        low = 0.75 * out + 0.25 * np.take(padded, range(count), axis)
        high = 0.75 * out + 0.25 * np.take(padded, range(2, count + 2), axis)
        shape = list(out.shape)
        shape[axis] *= 2
        out = np.stack([low, high], axis=axis + 1).reshape(shape)
    return out


class BlockMap:
    def __init__(self, scene, levels, grid, bounds, plane):
        self.scene, self.bounds = scene, tuple(tuple(float(v) for v in pair) for pair in bounds)
        origin, spacing = (
            np.asarray(grid.origin, dtype=np.float64),
            np.asarray(grid.spacing, dtype=np.float64),
        )
        index = [
            np.clip(
                np.round((np.asarray(pair) - origin[axis]) / spacing[axis]).astype(int), 0, grid.shape[axis]
            )
            for axis, pair in enumerate(self.bounds)
        ]
        self.cells = [slice(int(first), int(last)) for first, last in index]
        self.edges = [
            origin[axis] + np.arange(cells.start, cells.stop + 1) * spacing[axis]
            for axis, cells in enumerate(self.cells)
        ]
        self.origin, self.spacing = origin, spacing
        self.ground = int(np.median(levels))
        self.height, self.roof = heights(
            np.asarray(levels)[tuple(self.cells)], self.ground, float(spacing[0] * spacing[1])
        )
        self.pixels = np.ascontiguousarray(raster(self.height, self.edges, float(spacing[2])))
        corner = np.array([self.edges[0][0], self.edges[1][0], 0.0]) - scene.origin
        corner[2] = plane
        size = [edge[-1] - edge[0] for edge in self.edges]
        mesh = panel_plane(corner, (size[0], 0.0, 0.0), (0.0, size[1], 0.0))
        self.actor, self.image, self.array = textured(scene, mesh, self.pixels, mipmap=True)
        self.actor.SetPickable(False)

    def surface(self, x, y):
        cell = [
            int(np.searchsorted(edge, value, side="right") - 1) for edge, value in zip(self.edges, (x, y))
        ]
        if not all(0 <= index < len(edge) - 1 for index, edge in zip(cell, self.edges)):
            return None
        return float(self.origin[2] + (self.ground + self.roof[cell[0], cell[1]]) * self.spacing[2])

    def show(self, visible):
        self.actor.SetVisibility(visible)

    def close(self):
        self.scene.plotter.remove_actor(self.actor, reset_camera=False, render=False)
