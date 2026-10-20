import json
import os
from pathlib import Path

import numpy as np

from modules.visualization.geometry.citymesh import FEATURE_ANGLE, MIN_FACES

SIDES = (16, 8192)
GUTTER = 2  # 밉맵에서 이웃 조각의 색이 섞이지 않도록 둔 여백(px)
SHELF = 0.85
# 수직축과 45도 이내인 면은 위에서 한 조각으로 투영
TOP = 0.7
DOWNWARD = 5  # 투영 방향 번호는 위 0, 수평 1~4, 아래 5
DOWN = 0.5
TILT = 0.5  # 투영 넓이가 원본의 50%보다 작으면 별도 조각으로 분리
FILL = 0.45
DIVISIONS = 12
ATTEMPTS = 4
# 최근접 면의 법선 불일치에 더할 거리 가중치
PENALTY = 2.0
STEPS = 64
WIDTH = 16
CHUNK = 1 << 17  # 한 번에 굽는 텍셀 수
SPAN = 1 << 22  # 래스터 후보 텍셀 배치 크기
QUALITY = 90
MISSING = (200, 200, 200)


def simplify(points, faces, keep):
    """타일 경계 정점을 보존하며 메시 단순화"""
    import pyvista as pv

    if len(faces) < MIN_FACES or keep >= 1:
        return faces
    mesh = pv.PolyData.from_regular_faces(points, faces)
    mesh.point_data["source"] = np.arange(mesh.n_points)
    with pv.vtk_verbosity("off"):
        reduced = mesh.decimate_pro(
            1.0 - keep, feature_angle=FEATURE_ANGLE, preserve_topology=True, splitting=False,
            boundary_vertex_deletion=False,
        )  # fmt: skip
    if not reduced.n_cells:
        return faces
    return np.asarray(reduced.point_data["source"])[reduced.regular_faces].astype(np.int32)


def face_cross(points, faces):
    """면별 외적 [m, 3]이며 길이는 넓이의 두 배"""
    corner = points[faces]
    return np.cross(corner[:, 1] - corner[:, 0], corner[:, 2] - corner[:, 0])


def basis(normal):
    """법선별 수직 평면의 단위 축 [n, 2, 3]"""
    length = np.linalg.norm(normal, axis=1, keepdims=True)
    unit = np.where(length > 0, normal / np.maximum(length, 1e-300), [0.0, 0.0, 1.0])
    reference = np.eye(3)[np.abs(unit).argmin(axis=1)]
    first = np.cross(unit, reference)
    first /= np.linalg.norm(first, axis=1, keepdims=True)
    return np.stack([first, np.cross(unit, first)], axis=1)


def components(points, faces, label):
    """방향이 같고 정점으로 연결된 면의 성분 번호 [m]"""
    import pyvista as pv
    import vtk

    if not len(faces):
        return np.zeros(0, dtype=np.int64)
    # 방향이 다른 면은 같은 정점에서도 분리
    unique, inverse = np.unique(faces.astype(np.int64) * 8 + label[:, None], return_inverse=True)
    mesh = pv.PolyData.from_regular_faces(points[unique // 8], inverse.reshape(-1, 3))
    mesh.cell_data["face"] = np.arange(len(faces))
    connectivity = vtk.vtkPolyDataConnectivityFilter()
    connectivity.SetInputData(mesh)
    connectivity.SetExtractionModeToAllRegions()
    connectivity.ColorRegionsOn()
    connectivity.Update()
    output = pv.wrap(connectivity.GetOutput())
    group = np.full(len(faces), -1, dtype=np.int64)
    if output.n_cells:
        # VTK 연결 성분은 점 자료이므로 면의 첫 정점 번호 사용
        region = np.asarray(output.point_data["RegionId"])[output.regular_faces[:, 0]]
        group[np.asarray(output.cell_data["face"])] = region
    missing = group < 0  # 연결 필터가 누락한 면은 별도 성분으로 유지
    group[missing] = group.max() + 1 + np.arange(missing.sum())
    return np.unique(group, return_inverse=True)[1]


def planes_of(points, faces, chart, up):
    """UV 조각별 투영 축 [c, 2, 3]"""
    count = int(chart.max()) + 1
    cross = face_cross(points, faces)
    normal = np.stack([np.bincount(chart, weights=cross[:, k], minlength=count) for k in range(3)], axis=1)
    planes = basis(normal)
    corners = points[faces]
    size = np.maximum(np.bincount(chart, minlength=count), 1) * 3
    mean = np.stack(
        [np.bincount(chart, weights=corners[..., k].sum(axis=1), minlength=count) for k in range(3)], 1
    )
    offset = corners - (mean / size[:, None])[chart][:, None]
    a = np.einsum("mkd,md->mk", offset, planes[chart, 0])
    b = np.einsum("mkd,md->mk", offset, planes[chart, 1])
    saa, sbb, sab = (
        np.bincount(chart, weights=w.sum(axis=1), minlength=count) for w in (a * a, b * b, a * b)
    )
    angle = 0.5 * np.arctan2(2 * sab, saa - sbb)[:, None]
    planes = np.stack(
        [np.cos(angle) * planes[:, 0] + np.sin(angle) * planes[:, 1],
         np.cos(angle) * planes[:, 1] - np.sin(angle) * planes[:, 0]],
        axis=1,
    )  # fmt: skip
    planes[0] = np.eye(3)[[(up + 1) % 3, (up + 2) % 3]]
    return planes


def tilted(points, faces, chart, planes):
    cross = face_cross(points, faces)
    facing = np.cross(planes[:, 0], planes[:, 1])[chart]
    return (cross * facing).sum(axis=1) < TILT * np.linalg.norm(cross, axis=1)


def regroup(points, faces, chart, label, chosen, up):
    chart = chart.copy()
    if chosen.any():
        chart[chosen] = chart.max() + 1 + components(points, faces[chosen], label[chosen])
        planes = planes_of(points, faces, chart, up)
        lone = chosen & tilted(points, faces, chart, planes)
        chart[lone] = chart.max() + 1 + np.arange(lone.sum())
    chart = np.unique(np.concatenate([[0], chart]), return_inverse=True)[1][1:]
    return chart, planes_of(points, faces, chart, up)


def charts(points, faces, up):
    """투영 방향과 연결 성분에 따라 면을 UV 조각으로 분할"""
    cross = face_cross(points, faces)
    height = cross[:, up] / np.maximum(np.linalg.norm(cross, axis=1), 1e-300)
    horizontal = np.array([(up + 1) % 3, (up + 2) % 3])
    side = np.abs(cross[:, horizontal]).argmax(axis=1)
    negative = cross[np.arange(len(cross)), horizontal[side]] < 0
    label = np.where(height >= TOP, 0, np.where(height <= -TOP, DOWNWARD, 1 + 2 * side + negative))
    chart = np.zeros(len(faces), dtype=np.int64)
    rest = label != 0
    chart[rest] = 1 + components(points, faces[rest], label[rest])
    planes = planes_of(points, faces, chart, up)
    chart, planes = regroup(points, faces, chart, label, tilted(points, faces, chart, planes), up)
    return chart, planes, label


def divide(flat, chart, planes):
    centre = flat.mean(axis=1)
    edge1, edge2 = flat[:, 1] - flat[:, 0], flat[:, 2] - flat[:, 0]
    area = 0.5 * np.abs(edge1[:, 0] * edge2[:, 1] - edge1[:, 1] * edge2[:, 0])
    for _ in range(DIVISIONS):
        count = len(planes)
        low = np.full((count, 2), np.inf)
        high = np.full((count, 2), -np.inf)
        np.minimum.at(low, chart, flat.min(axis=1))
        np.maximum.at(high, chart, flat.max(axis=1))
        extent = np.maximum(high - low, 0.0)
        filled = np.bincount(chart, weights=area, minlength=count)
        split = (filled < FILL * extent.prod(axis=1)) & (np.bincount(chart, minlength=count) > 1)
        if not split.any():
            break
        axis = extent.argmax(axis=1)[chart]
        rows = np.arange(len(chart))
        move = split[chart] & (centre[rows, axis] > (low + extent / 2)[chart, axis])
        chart = np.where(move, (count + np.cumsum(split) - 1)[chart], chart)
        planes = np.concatenate([planes, planes[split]])
    used, chart = np.unique(np.concatenate([[0], chart]), return_inverse=True)
    return chart[1:], planes[used]


def shelf(size, width, limit=None):
    edge = np.concatenate([[0], np.cumsum(size[:, 0])])
    placed = np.empty((len(size), 2), dtype=np.int64)
    start = y = 0
    while start < len(size):
        if size[start, 0] > width or (limit is not None and y + size[start, 1] > limit):
            break
        stop = max(int(np.searchsorted(edge, edge[start] + width, side="right")) - 1, start + 1)
        placed[start:stop, 0] = edge[start:stop] - edge[start]
        placed[start:stop, 1] = y
        y += int(size[start, 1])
        start = stop
    return placed[:start], start, y


def arrange(size, top):
    width = max(int(size[:, 0].max()), int(np.ceil(np.sqrt(size.prod(axis=1).sum() / SHELF))))
    width = -(-(width + GUTTER) // 16) * 16 - GUTTER
    position = np.zeros_like(size)
    rest = np.arange(1 if top else 0, len(size))
    rest = rest[np.lexsort((-size[rest, 0], -size[rest, 1]))]
    y = 0
    if top:
        low = int(np.searchsorted(-size[rest, 1], -size[0, 1], side="left"))
        placed, count, _ = shelf(size[rest[low:]], width - int(size[0, 0]), int(size[0, 1]))
        position[rest[low : low + count]] = placed + [int(size[0, 0]), 0]
        rest = np.concatenate([rest[:low], rest[low + count :]])
        y = int(size[0, 1])
    placed, count, height = shelf(size[rest], width)
    position[rest] = placed + [0, y]
    return position + GUTTER, (width + GUTTER, -(-(y + height + GUTTER) // 16) * 16)


def pack(flat, chart, scale, top):
    count = int(chart.max()) + 1
    low = np.full((count, 2), np.inf)
    high = np.full((count, 2), -np.inf)
    np.minimum.at(low, chart, flat.min(axis=1))
    np.maximum.at(high, chart, flat.max(axis=1))
    extent = np.maximum(high - low, 0.0)
    while True:
        # 오른쪽과 아래 여백만으로 이웃 조각 간격 확보
        size = np.ceil(extent * scale).astype(np.int64) + GUTTER
        position, shape = arrange(size, top)
        if max(shape) <= SIDES[1]:
            break
        scale *= 0.9
    texel = (flat - low[chart][:, None]) * scale + position[chart][:, None]
    return texel, shape


def barycentric(point, triangle):
    """점 [q, 2]의 무게중심 좌표 [q, 3]이며 퇴화 삼각형은 -1"""
    a, b, c = triangle[:, 0], triangle[:, 1], triangle[:, 2]
    v0, v1, v2 = b - a, c - a, point - a
    denominator = v0[:, 0] * v1[:, 1] - v1[:, 0] * v0[:, 1]
    with np.errstate(divide="ignore", invalid="ignore"):
        beta = (v2[:, 0] * v1[:, 1] - v1[:, 0] * v2[:, 1]) / denominator
        gamma = (v0[:, 0] * v2[:, 1] - v2[:, 0] * v0[:, 1]) / denominator
        weights = np.stack([1.0 - beta - gamma, beta, gamma], axis=-1)
    return np.where(np.isfinite(weights), weights, -1.0)


def raster(texel, shape):
    faces, (columns, rows) = len(texel), shape
    x0 = np.clip(np.ceil(texel[..., 0].min(axis=1) - 0.5), 0, columns).astype(np.int64)
    x1 = np.clip(np.floor(texel[..., 0].max(axis=1) - 0.5), -1, columns - 1).astype(np.int64)
    y0 = np.clip(np.ceil(texel[..., 1].min(axis=1) - 0.5), 0, rows).astype(np.int64)
    y1 = np.clip(np.floor(texel[..., 1].max(axis=1) - 0.5), -1, rows - 1).astype(np.int64)
    width, height = np.maximum(x1 - x0 + 1, 0), np.maximum(y1 - y0 + 1, 0)
    total = np.cumsum(width * height)
    owner = np.full(rows * columns, -1, dtype=np.int32)
    deep = np.zeros(rows * columns, dtype=np.uint16)
    inner_texels, inner_faces = [], []
    start = 0
    while start < faces:
        stop = max(
            int(np.searchsorted(total, (total[start - 1] if start else 0) + SPAN, side="right")), start + 1
        )
        ids = np.arange(start, stop)
        n = (width * height)[ids]
        face = np.repeat(ids, n)
        offset = np.arange(int(n.sum())) - np.repeat(np.cumsum(n) - n, n)
        column = x0[face] + offset % np.maximum(width[face], 1)
        row = y0[face] + offset // np.maximum(width[face], 1)
        weights = barycentric(np.stack([column + 0.5, row + 0.5], axis=-1), texel[face])
        least = weights.min(axis=1)
        index = row * columns + column
        inside = least >= -1e-7
        owner[index[inside]] = face[inside]
        inner = least > 1e-3
        np.add.at(deep, index[inner], 1)
        inner_texels.append(index[inner])
        inner_faces.append(face[inner])
        start = stop
    clash = np.zeros(faces, dtype=bool)
    if inner_texels:
        index, face = np.concatenate(inner_texels), np.concatenate(inner_faces)
        crowded = (deep[index] >= 2) & (owner[index] != face)
        clash[face[crowded]] = True
    return owner, clash


def table(owner, target, n, width):
    """대상 번호를 [n, width]로 모으며 빈칸은 -1"""
    order = np.argsort(owner, kind="stable")
    owner, target = owner[order], target[order]
    rank = np.arange(len(owner)) - np.searchsorted(owner, np.arange(n))[owner]
    keep = rank < width
    result = np.full((n, width), -1, dtype=np.int32)
    result[owner[keep], rank[keep]] = target[keep]
    return result


def row_argmin(rows, columns, values, shape):
    grid = np.full(shape, np.inf)
    grid[rows, columns] = values
    number = np.zeros(shape, dtype=np.int64)
    number[rows, columns] = np.arange(len(rows))
    return number[np.arange(shape[0]), grid.argmin(axis=1)]


def cost(position, normal, target, facing, penalty):
    turn = penalty * (1.0 - np.einsum("qd,qd->q", normal, facing))
    return ((position - target) ** 2).sum(axis=1) + turn * turn


def walk(target, facing, vertex, points, normals, neighbours, penalty):
    best = cost(points[vertex], normals[vertex], target, facing, penalty)
    active = np.arange(len(target))
    for _ in range(STEPS):
        near = neighbours[vertex[active]]
        rows, columns = np.nonzero(near >= 0)
        candidate = near[rows, columns]
        index = active[rows]
        distance = cost(points[candidate], normals[candidate], target[index], facing[index], penalty)
        pick = row_argmin(rows, columns, distance, near.shape)
        closer = distance[pick] < best[active]
        active, pick = active[closer], pick[closer]
        vertex[active] = candidate[pick]
        best[active] = distance[pick]
        if not len(active):
            break
    return vertex


def nearest_on_triangles(point, a, b, c):
    """삼각형 위 최근접점의 무게중심 좌표와 거리 제곱(Ericson 5.1.5)"""

    def dot(u, v):
        return np.einsum("qd,qd->q", u, v)

    ab, ac = b - a, c - a
    d1, d2 = dot(ab, point - a), dot(ac, point - a)
    d3, d4 = dot(ab, point - b), dot(ac, point - b)
    d5, d6 = dot(ab, point - c), dot(ac, point - c)
    va, vb, vc = d3 * d6 - d5 * d4, d5 * d2 - d1 * d6, d1 * d4 - d3 * d2
    with np.errstate(divide="ignore", invalid="ignore"):
        inside = va + vb + vc
        on_ab, on_ac = d1 / (d1 - d3), d2 / (d2 - d6)
        on_bc = (d4 - d3) / ((d4 - d3) + (d5 - d6))
        conditions = [
            (d1 <= 0) & (d2 <= 0),
            (d3 >= 0) & (d4 <= d3),
            (vc <= 0) & (d1 >= 0) & (d3 <= 0),
            (d6 >= 0) & (d5 <= d6),
            (vb <= 0) & (d2 >= 0) & (d6 <= 0),
            (va <= 0) & (d4 - d3 >= 0) & (d5 - d6 >= 0),
        ]
        v = np.select(conditions, [0.0, 1.0, on_ab, 0.0, 0.0, 1.0 - on_bc], vb / inside)
        w = np.select(conditions, [0.0, 0.0, 0.0, 1.0, on_ac, on_bc], vc / inside)
    v, w = (
        np.nan_to_num(v, nan=0.0, posinf=0.0, neginf=0.0),
        np.nan_to_num(w, nan=0.0, posinf=0.0, neginf=0.0),
    )
    weights = np.stack([1.0 - v - w, v, w], axis=-1)
    nearest = weights[:, :1] * a + weights[:, 1:2] * b + weights[:, 2:] * c
    return weights, ((point - nearest) ** 2).sum(axis=1)


SOURCES = {}  # 프로세스별 원본 텍스처 메모리 맵


def unit(vectors):
    length = np.linalg.norm(vectors, axis=-1, keepdims=True)
    return vectors / np.maximum(length, 1e-300)


def bilinear(image, uv):
    """UV [q, 2]의 RGB를 텍스처에서 쌍선형 보간"""
    height, width = image.shape[:2]
    uv = np.where((uv < 0) | (uv > 1), uv % 1.0, uv)
    x = uv[:, 0] * width - 0.5
    y = (1.0 - uv[:, 1]) * height - 0.5
    x0, y0 = np.floor(x), np.floor(y)
    fx, fy = (x - x0)[:, None], (y - y0)[:, None]
    x0, y0 = x0.astype(np.int64), y0.astype(np.int64)
    xs = np.clip([x0, x0 + 1], 0, width - 1)
    ys = np.clip([y0, y0 + 1], 0, height - 1)
    top = image[ys[0], xs[0]] * (1 - fx) + image[ys[0], xs[1]] * fx
    bottom = image[ys[1], xs[0]] * (1 - fx) + image[ys[1], xs[1]] * fx
    return np.clip(np.rint(top * (1 - fy) + bottom * fy), 0, 255).astype(np.uint8)


def sample(uv, material, textures):
    colors = np.empty((len(uv), 3), dtype=np.uint8)
    for kind in np.unique(material):
        chosen = np.flatnonzero(material == kind)
        path, color = textures[kind] if 0 <= kind < len(textures) else (None, MISSING)
        colors[chosen] = color
        if path is None:
            continue
        known = chosen[np.isfinite(uv[chosen]).all(axis=1)]
        if path not in SOURCES:
            SOURCES[path] = np.load(path, mmap_mode="r")
        colors[known] = bilinear(SOURCES[path], uv[known])
    return colors


def fill(image, known):
    """빈 텍셀을 가까운 UV 조각의 색으로 채움"""
    image, known = image.copy(), known.copy()
    for _ in range(2 * GUTTER):
        color = np.pad(image.astype(np.float32) * known[..., None], ((1, 1), (1, 1), (0, 0)))
        weight = np.pad(known.astype(np.float32), 1)
        total = color[:-2, 1:-1] + color[2:, 1:-1] + color[1:-1, :-2] + color[1:-1, 2:]
        count = weight[:-2, 1:-1] + weight[2:, 1:-1] + weight[1:-1, :-2] + weight[1:-1, 2:]
        grow = ~known & (count > 0)
        image[grow] = np.rint(total[grow] / count[grow, None]).astype(np.uint8)
        known |= grow
    colors, weights = [image.astype(np.float32) * known[..., None]], [known.astype(np.float32)]
    while max(colors[-1].shape[:2]) > 1:
        color, weight = colors[-1], weights[-1]
        pad = ((0, color.shape[0] % 2), (0, color.shape[1] % 2))
        color, weight = np.pad(color, (*pad, (0, 0))), np.pad(weight, pad)
        h, w = color.shape[0] // 2, color.shape[1] // 2
        colors.append(color.reshape(h, 2, w, 2, 3).sum(axis=(1, 3)))
        weights.append(weight.reshape(h, 2, w, 2).sum(axis=(1, 3)))
    mean = colors[-1] / np.maximum(weights[-1], 1e-6)[..., None]
    for color, weight in zip(reversed(colors[:-1]), reversed(weights[:-1])):
        up = mean.repeat(2, axis=0).repeat(2, axis=1)[: color.shape[0], : color.shape[1]]
        mean = np.where(weight[..., None] > 0, color / np.maximum(weight, 1e-6)[..., None], up)
    return np.where(known[..., None], image, np.clip(np.rint(mean), 0, 255).astype(np.uint8))


def bake(owner, texel, faces, points, original, textures, shape):
    """단순화한 면의 텍셀 위치에 가장 가까운 원본 면의 색 사용"""
    source, (columns, rows) = original["faces"], shape
    penalty = PENALTY * float(np.median(np.linalg.norm(points[source[:, 1]] - points[source[:, 0]], axis=1)))
    source_cross = face_cross(points, source)
    source_normals = unit(source_cross)
    corner_of = source.ravel()
    normals = unit(
        np.stack([np.bincount(corner_of, np.repeat(source_cross[:, k], 3), len(points)) for k in range(3)], 1)
    )
    facings = unit(face_cross(points, faces))
    incident = table(source.ravel(), np.repeat(np.arange(len(source), dtype=np.int32), 3), len(points), WIDTH)
    edges = np.concatenate([source[:, [0, 1]], source[:, [1, 2]], source[:, [2, 0]]]).astype(np.int64)
    edges = np.unique(np.concatenate([edges, edges[:, ::-1]]) @ np.array([len(points), 1]))
    neighbours = table(edges // len(points), edges % len(points), len(points), WIDTH)
    index = np.flatnonzero(owner >= 0)
    colors = np.zeros((rows * columns, 3), dtype=np.uint8)
    for start in range(0, len(index), CHUNK):
        part = index[start : start + CHUNK]
        face = owner[part]
        centre = np.stack([part % columns + 0.5, part // columns + 0.5], axis=-1)
        weights = np.clip(barycentric(centre, texel[face]), 0.0, None)
        weights /= np.maximum(weights.sum(axis=1, keepdims=True), 1e-12)
        corner = faces[face]
        target = np.einsum("qk,qkd->qd", weights, points[corner])
        facing = facings[face]
        nearest = corner[np.arange(len(part)), weights.argmax(axis=1)]
        vertex = walk(target, facing, nearest, points, normals, neighbours, penalty)
        near = incident[vertex]
        pair, column = np.nonzero(near >= 0)
        candidate = near[pair, column]
        triangle = points[source[candidate]]
        weight, distance = nearest_on_triangles(target[pair], triangle[:, 0], triangle[:, 1], triangle[:, 2])
        turn = penalty * (1.0 - np.einsum("qd,qd->q", source_normals[candidate], facing[pair]))
        pick = row_argmin(pair, column, distance + turn * turn, near.shape)
        chosen = candidate[pick]
        uv = np.einsum("qk,qkd->qd", weight[pick], original["uv"][chosen].astype(np.float64))
        colors[part] = sample(uv, original["material"][chosen], textures)
    known = np.zeros(rows * columns, dtype=bool)
    known[index] = True
    return colors.reshape(rows, columns, 3), known.reshape(rows, columns)


def bake_tile(source, target, textures, keep, density, up):
    from PIL import Image

    with np.load(source) as tile:
        original = {name: tile[name] for name in ("faces", "uv", "material")}
        points = tile["points"].astype(np.float64)
    faces = simplify(points, original["faces"], keep)
    chart, planes, label = charts(points, faces, up)
    for attempt in range(ATTEMPTS):  # 투영이 겹친 면은 분리 후 재배치
        flat = np.einsum("mkd,mad->mka", points[faces], planes[chart])
        flat[label == DOWNWARD] *= DOWN
        chart, planes = divide(flat, chart, planes)
        texel, shape = pack(flat, chart, float(np.sqrt(density)), bool((chart == 0).any()))
        owner, clash = raster(texel, shape)
        if not clash.any() or attempt == ATTEMPTS - 1:  # 계속 겹치는 면은 이웃 텍셀 공유
            break
        chart, planes = regroup(points, faces, chart, label, clash, up)
    colors, known = bake(owner, texel, faces, points, original, textures, shape)
    image = fill(colors, known)

    count = int(chart.max()) + 1
    unique, inverse = np.unique(faces.astype(np.int64) * count + chart[:, None], return_inverse=True)
    tcoords = np.empty((len(unique), 2), dtype=np.float64)
    tcoords[inverse.ravel()] = texel.reshape(-1, 2) / shape
    tcoords[:, 1] = 1.0 - tcoords[:, 1]  # 텍스처 v축의 원점은 아래쪽
    piece = {
        "points": points[unique // count].astype(np.float32),
        "faces": inverse.reshape(-1, 3).astype(np.int32),
        "tcoords": tcoords.astype(np.float32),
    }
    target = Path(target)
    partial = target.with_suffix(".partial.jpg")
    Image.fromarray(image).save(partial, format="JPEG", quality=QUALITY, subsampling=0)
    os.replace(partial, target.with_suffix(".jpg"))
    counts = [len(piece["points"]), len(piece["faces"])]
    partial = target.with_suffix(".partial.npz")
    summary = {"levels": [counts], "size": list(shape), "covered": int(known.sum())}
    np.savez(partial, **piece, counts=np.array(counts, dtype=np.int64), summary=json.dumps(summary))
    os.replace(partial, target)
    return summary
