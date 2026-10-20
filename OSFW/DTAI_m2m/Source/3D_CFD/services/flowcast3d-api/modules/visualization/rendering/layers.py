from dataclasses import replace

import numpy as np
import pyvista as pv
from vtkmodules.vtkCommonDataModel import vtkDataSetAttributes

from modules.domain.transport.boundary import clear_path
from modules.domain.transport.fields import velocity
from modules.visualization.readers.adapter import samples, scalar, stride_for

VALUE = "value"
INSET = 0.01  # 고체 면과 단면 사이 간격(셀 크기 비율)
FILLED, SHADE = "filled", "shade"
EXTEND = 2
FACES = [(axis, side) for axis in range(3) for side in (0, -1)]
ARROW = pv.Arrow(tip_length=0.35, tip_radius=0.14, shaft_radius=0.05, tip_resolution=16, shaft_resolution=16)
LENGTH = 0.9  # 이웃 화살표의 겹침을 줄이도록 간격보다 짧게 설정
JITTER = 7  # 프레임마다 같은 위치를 쓰도록 난수 고정
LENGTHS = (0.2, 1.6)
TILT, MAX_TILT = 5.0, 20.0  # 연직 성분 과장 배율과 최대 기울기(도)
WIDTHS = (0.55, 1.0, 1.7)
SQUAT = 2.0  # 짧은 화살표의 길이 대비 굵기 상한
PERCENTILES = (2, 98)  # 드문 극값을 제외할 백분위
VELOCITY = ("speed", "velocity_x", "velocity_y", "velocity_z")


def mask_surface(solid, edges):
    quads = []
    for axis in range(3):
        # 영역 밖은 유체로 간주하여 고체 경계면 생성
        padded = np.pad(solid, [(1, 1) if a == axis else (0, 0) for a in range(3)])
        faces = np.argwhere(np.diff(padded, axis=axis))
        b, c = (a for a in range(3) if a != axis)
        corners = np.empty((len(faces), 4, 3))
        corners[..., axis] = edges[axis][faces[:, axis], None]
        corners[..., b] = edges[b][faces[:, b, None] + [0, 1, 1, 0]]
        corners[..., c] = edges[c][faces[:, c, None] + [0, 0, 1, 1]]
        quads.append(corners)
    corners = np.concatenate(quads)
    if not len(corners):
        return pv.PolyData()
    return pv.PolyData.from_regular_faces(
        corners.reshape(-1, 3).astype(np.float32), np.arange(4 * len(corners)).reshape(-1, 4)
    )


def slice_grid(sample, axis, position, origin):
    """고체 면과 겹치지 않도록 셀 경계 안쪽에 단면 배치"""
    edges = [edge - o for edge, o in zip(sample.edges, origin)]
    low, high = edges[axis][0], edges[axis][-1]
    inset = INSET * (high - low)
    edges[axis] = np.array([np.clip(position - origin[axis], low + inset, high - inset)])
    return pv.RectilinearGrid(*edges)


def corners(shown, axis):
    """주변 유효 셀의 평균을 꼭짓점으로 옮기며 유효 셀이 없으면 NaN"""
    flat = shown.take(0, axis=axis)
    valid = np.isfinite(flat)
    total, count = np.pad(np.where(valid, flat, 0), 1), np.pad(valid, 1).astype(np.float32)
    total = total[:-1, :-1] + total[1:, :-1] + total[:-1, 1:] + total[1:, 1:]
    count = count[:-1, :-1] + count[1:, :-1] + count[:-1, 1:] + count[1:, 1:]
    with np.errstate(invalid="ignore", divide="ignore"):
        out = np.where(count > 0, total / count, np.nan)
    return np.expand_dims(out.astype(np.float32), axis)


def hide(grid, hidden):
    """투명색 대신 ghost 셀로 숨겨 체적 렌더링과 깊이 일치"""
    ghost = np.where(hidden, vtkDataSetAttributes.HIDDENCELL, 0).astype(np.uint8)
    grid.cell_data[vtkDataSetAttributes.GhostArrayName()] = ghost.ravel(order="F")


def paint(grid, sample, axis, channels, quantity):
    shown = scalar(sample.values, channels, quantity).astype(np.float32)
    shown[~sample.valid] = np.nan
    grid.point_data[VALUE] = corners(shown, axis).ravel(order="F")
    hide(grid, ~sample.valid)
    return shown


def face(sample, axis, side):
    """상자 겉면의 한 셀 층이며 최소면은 side=0, 최대면은 -1"""
    layer = slice(0, 1) if side == 0 else slice(-1, None)
    pick = tuple(layer if a == axis else slice(None) for a in range(3))
    bound = slice(0, 2) if side == 0 else slice(-2, None)
    return replace(
        sample,
        values=sample.values[pick],
        solid=sample.solid[pick],
        edges=[edge[bound] if a == axis else edge for a, edge in enumerate(sample.edges)],
        centres=[centre[layer] if a == axis else centre for a, centre in enumerate(sample.centres)],
    )


class ArrowScale:
    """프레임이 추가되어도 줄어들지 않는 화살표 길이와 색 범위"""

    def __init__(self):
        self.frames = set()
        self.lows, self.highs = {}, {}
        self.speeds = []
        self.volume_speeds = []

    def add(self, frame, sample, channels, quantities):
        self.frames.add(frame)
        values = sample.values[sample.valid]
        if not len(values):
            return
        for name in quantities:
            low, high = (float(value) for value in np.percentile(scalar(values, channels, name), PERCENTILES))
            self.lows[name] = min(self.lows.get(name, low), low)
            self.highs[name] = max(self.highs.get(name, high), high)
        vectors = velocity(values, channels).astype(np.float64)
        self.speeds.append(float(np.percentile(np.hypot(*vectors[:, :2].T), 95)))
        self.volume_speeds.append(float(np.percentile(np.linalg.norm(vectors, axis=-1), 95)))

    @property
    def reference(self):
        """프레임별 수평 풍속 P95의 중앙값(m/s)"""
        return max(float(np.median(self.speeds)), 0.1) if self.speeds else 1.0

    @property
    def volume_reference(self):
        """프레임별 3D 풍속 P95의 중앙값(m/s)"""
        return max(float(np.median(self.volume_speeds)), 0.1) if self.volume_speeds else 1.0

    def bounds(self, name, gust=0.0, intensity=0.0):
        low, high = self.lows.get(name, 0.0), self.highs.get(name, 1.0)
        if name in VELOCITY and (gust or intensity):
            ends = [value * factor for value in (low, high) for factor in (1 - 0.55 * gust, 1 + gust)]
            reach = intensity * self.reference
            low, high = min(ends) - reach, max(ends) + reach
            if name == "speed":
                low = max(low, 0.0)
        return low, high

    def range(self, name, gust=0.0, intensity=0.0):
        """0을 가로지르는 값은 0 중심의 대칭 범위 사용"""
        low, high = self.bounds(name, gust, intensity)
        if low < 0 < high:
            reach = max(-low, high)
            return -reach, reach
        return (low, high) if high > low else (low, low + 1.0)

    def diverging(self, name, gust=0.0, intensity=0.0):
        low, high = self.bounds(name, gust, intensity)
        return low < 0 < high


def arrows(
    sample,
    channels,
    quantity,
    density,
    reference_speed,
    origin,
    covered=None,
    width=None,
    tilt=0.0,
    color_values=None,
):
    """수평 풍속은 길이, 연직 성분은 tilt 배율로 표시"""
    shape = sample.solid.shape[:2]
    thin = stride_for(shape, density)
    values = sample.values[:, :, 0]
    vectors = velocity(values, channels)
    usable = sample.valid[:, :, 0] & (vectors[..., :2] != 0).any(axis=-1)
    if color_values is not None:
        color_values = np.asarray(color_values)
        if color_values.shape != sample.solid.shape:
            raise ValueError("color_values must have the same XYZ shape as sample.valid")
        color_values = color_values[:, :, 0]
        usable &= np.isfinite(color_values)
    if covered is not None:
        usable &= ~covered
    # 블록마다 고정 난수가 가장 작은 유효 셀 선택
    counts = [len(samples(n, thin)[1]) - 1 for n in shape]
    rows, columns = (np.minimum(np.arange(n) // thin, count - 1) for n, count in zip(shape, counts))
    block = (rows[:, None] * counts[1] + columns[None, :]).ravel()
    key = np.where(usable, np.random.default_rng(JITTER).random(shape), np.inf).ravel()
    order = np.lexsort((key, block))
    first = order[np.r_[True, np.diff(block[order]) != 0]]
    first = first[np.isfinite(key[first])]
    if not len(first):  # PyVista는 빈 점 자료를 받지 못하므로 빈 PolyData 반환
        return pv.PolyData()
    i, j = np.unravel_index(first, shape)
    tails = np.column_stack(
        [sample.centres[0][i], sample.centres[1][j], np.full(len(i), sample.centres[2][0])]
    )
    cell = min((np.diff(centre).min() for centre in sample.centres[:2] if len(centre) > 1), default=1.0)
    size = LENGTH * thin * cell

    moving = vectors[i, j].astype(np.float64)
    speed = np.hypot(moving[:, 0], moving[:, 1])
    heading = moving[:, :2] / speed[:, None]
    pitch = np.clip(np.arctan2(tilt * moving[:, 2], speed), -np.radians(MAX_TILT), np.radians(MAX_TILT))
    ahead = np.column_stack([heading * np.cos(pitch)[:, None], np.sin(pitch)])
    side = np.column_stack([-heading[:, 1], heading[:, 0], np.zeros(len(i))])
    up = np.cross(ahead, side)
    lengths = np.clip(speed / reference_speed, *LENGTHS) * size
    widths = np.full(len(i), size)
    colours = scalar(values[i, j], channels, quantity) if color_values is None else color_values[i, j]
    if width is not None:
        name, (low, high) = width
        width_values = (
            colours if color_values is not None and name == quantity else scalar(values[i, j], channels, name)
        )
        step = np.digitize(width_values, [low + (high - low) / 3, low + 2 * (high - low) / 3])
        widths *= np.asarray(WIDTHS)[step]
    widths = np.minimum(widths, SQUAT * lengths)
    shape_points = ARROW.points.astype(np.float64)
    points = (
        (tails - np.asarray(origin))[:, None, :]
        + shape_points[None, :, 0:1] * (lengths[:, None] * ahead)[:, None, :]
        + shape_points[None, :, 1:2] * (widths[:, None] * side)[:, None, :]
        + shape_points[None, :, 2:3] * (widths[:, None] * up)[:, None, :]
    )
    glyphs = pv.PolyData(points.reshape(-1, 3).astype(np.float32), faces=instance_faces(len(i)))
    glyphs.point_data[VALUE] = np.repeat(colours.astype(np.float32), ARROW.n_points)
    return glyphs


def volume_indices(usable, density, priority=None):
    shape = usable.shape
    thin = stride_for(shape, density)
    if not usable.any():
        return np.empty(0, dtype=np.int64)
    counts = [len(samples(n, thin)[1]) - 1 for n in shape]
    axes = [np.minimum(np.arange(n) // thin, count - 1) for n, count in zip(shape, counts)]
    block = ((axes[0][:, None, None] * counts[1] + axes[1][None, :, None]) * counts[2] + axes[2]).ravel()
    key = np.random.default_rng(JITTER).random(shape)
    if priority is not None:
        key -= priority
    key[~usable] = np.inf
    key = key.ravel()
    best = np.full(np.prod(counts), np.inf)
    np.minimum.at(best, block, key)
    candidates = np.flatnonzero(np.isfinite(key) & (key == best[block]))
    selected = np.full(len(best), key.size, dtype=np.int64)
    np.minimum.at(selected, block[candidates], candidates)
    return selected[selected < key.size]


class FlowFocus:
    """원본 속도를 유지하며 건물 주변 방향 전환과 역류를 우선 선택"""

    def __init__(self, sample, channels):
        self.vectors = velocity(sample.values, channels)
        self.speed = np.hypot(np.hypot(self.vectors[..., 0], self.vectors[..., 1]), self.vectors[..., 2])
        valid = sample.valid & np.isfinite(self.speed)
        reference = float(np.percentile(self.speed[valid], 95)) if valid.any() else 0.0
        floor, preserve = max(0.03, reference * 0.08), max(0.01, reference * 0.015)
        solid = sample.solid & ~np.all(sample.solid, axis=(0, 1))[None, None, :]
        # 바닥만 있는 층은 건물 이웃에서 제외
        # 높이가 한 셀인 영역은 위쪽 연결을 알 수 없어 원본 고체 유지
        if solid.shape[2] > 1:
            solid[:, :, 0] &= sample.solid[:, :, 1]
        near = solid.copy()
        for _ in range(2):
            previous = near.copy()
            for axis in range(3):
                low, high = [slice(None)] * 3, [slice(None)] * 3
                low[axis], high[axis] = slice(None, -1), slice(1, None)
                near[tuple(low)] |= previous[tuple(high)]
                near[tuple(high)] |= previous[tuple(low)]
        self.near_solid = near & valid
        region = solid.copy()
        # 축별 최소 한 셀의 직육면체 이웃이며 유클리드 거리는 아님
        for axis, edge in enumerate(sample.edges):
            count = max(1, int(np.ceil(10.0 / float(np.median(np.diff(edge))))))
            count = min(count, region.shape[axis] - 1)
            for _ in range(count):
                previous = region.copy()
                low, high = [slice(None)] * 3, [slice(None)] * 3
                low[axis], high[axis] = slice(None, -1), slice(1, None)
                region[tuple(low)] |= previous[tuple(high)]
                region[tuple(high)] |= previous[tuple(low)]
        self.building_region = region & valid
        moving = valid & (self.speed >= preserve)
        reference_cells = valid & ~self.near_solid & (self.speed >= floor)
        if not reference_cells.any():
            reference_cells = moving
        main_values = self.vectors[reference_cells]
        main = np.median(main_values, axis=0).astype(np.float64) if len(main_values) else np.zeros(3)
        main /= max(np.linalg.norm(main), 1e-12)
        unit = np.zeros_like(self.vectors, dtype=np.float32)
        np.divide(self.vectors, self.speed[..., None], out=unit, where=moving[..., None])
        cosine = np.clip(np.einsum("...i,i->...", unit, main), -1, 1)
        departure = np.maximum(np.sqrt(np.maximum(0, 1 - cosine**2)), -cosine) if np.linalg.norm(main) else 0
        self.interest = np.where(moving, departure, 0).astype(np.float32)
        self.important = np.zeros_like(valid)
        selected = np.argwhere(self.near_solid & (self.speed >= preserve))
        if len(selected):
            index = tuple(selected.T)
            directions = self.vectors[index].astype(np.float64) / self.speed[index][:, None]
            reverse = directions @ main < -0.2
            vertical = np.abs(directions[:, 2]) >= 0.25
            # 상쇄된 이웃 평균은 방향 비교에서 제외
            summed, counts = np.zeros_like(directions), np.zeros(len(selected), dtype=np.int8)
            for axis in range(3):
                for step in (-1, 1):
                    neighbour = selected.copy()
                    neighbour[:, axis] += step
                    inside = (neighbour[:, axis] >= 0) & (neighbour[:, axis] < valid.shape[axis])
                    rows = np.flatnonzero(inside)
                    cells = tuple(neighbour[inside].T)
                    keep = valid[cells] & (self.speed[cells] >= preserve)
                    rows = rows[keep]
                    cells = tuple(neighbour[rows].T)
                    summed[rows] += self.vectors[cells] / self.speed[cells][:, None]
                    counts[rows] += 1
            magnitude = np.linalg.norm(summed, axis=-1)
            cosine = np.sum(directions * summed, axis=-1) / np.maximum(magnitude, 1e-12)
            turning = (counts >= 2) & (magnitude >= 0.5 * counts) & (cosine < np.cos(np.pi / 4))
            self.important[index] = reverse | vertical | turning
            # 이웃별 방향 차이도 반영하여 전단과 부드러운 회전 보존
            disagreement = np.maximum(0, 1 - np.sum(directions * summed, axis=-1) / np.maximum(counts, 1))
            self.interest[index] += (0.35 * np.sqrt(2 * disagreement)).astype(np.float32)
        self.usable = valid & ((self.speed >= floor) | self.important)
        self.interest[~self.usable] = 0
        self.interesting = self.usable & (self.interest >= 0.2)
        # 같은 블록에서는 난수보다 방향 변화 우선
        bands = np.minimum((4 * self.interest).astype(np.uint8), 7)
        self.priority = 16 * self.near_solid.astype(np.uint8) + 8 * self.important.astype(np.uint8) + bands
        self.diagnostics = {
            "reference_speed": reference,
            "speed_floor": floor,
            "preserve_floor": preserve,
            "valid_count": int(valid.sum()),
            "retained_count": int(self.usable.sum()),
            "important_count": int(self.important.sum()),
            "filtered_count": int(valid.sum() - self.usable.sum()),
            "near_solid_count": int(self.near_solid.sum()),
            "building_region_count": int(self.building_region.sum()),
            "interesting_count": int(self.interesting.sum()),
            "candidate_count": 0,
            "selected_count": 0,
            "spatially_thinned_count": 0,
        }
        self._selection = None

    def indices(self, density, usable=None):
        """같은 밀도와 입력은 난수 상태와 무관하게 같은 XYZ 셀 선택"""
        standard = usable is None or np.array_equal(usable, self.usable)
        if standard and self._selection is not None and self._selection[0] == density:
            return self._selection[1]
        candidates = volume_indices(self.usable if standard else self.usable & usable, density, self.priority)
        if len(candidates):
            thin = stride_for(self.usable.shape, density)
            counts = [len(samples(n, thin)[1]) - 1 for n in self.usable.shape]
            cells = np.column_stack(np.unravel_index(candidates, self.usable.shape))
            blocks = np.minimum(cells // thin, np.asarray(counts) - 1)
            keep = self.near_solid.ravel()[candidates] | ((blocks @ np.array([1, 2, 1])) % 3 == 0)
            # 좁은 격자에서도 축별 양 끝 흐름 보존
            for axis in range(3):
                for edge in (blocks[:, axis].min(), blocks[:, axis].max()):
                    rows = np.flatnonzero(blocks[:, axis] == edge)
                    if not keep[rows].any():
                        keep[rows[0]] = True
            indices = candidates[keep]
        else:
            indices = candidates
        indices.flags.writeable = False
        if standard:
            self._selection = density, indices
            self.diagnostics.update(
                candidate_count=len(candidates),
                selected_count=len(indices),
                spatially_thinned_count=len(candidates) - len(indices),
            )
        return indices


def _plume_spread(candidates, shape, count):
    if len(candidates) <= count:
        return candidates
    if not count:
        return candidates[:0]
    cells = np.column_stack(np.unravel_index(candidates, shape))
    local = cells - cells.min(axis=0)
    bits = int(local.max()).bit_length()
    coordinates = local.astype(np.uint64) >> max(bits - 21, 0)
    key = np.zeros(len(candidates), dtype=np.uint64)
    for bit in range(min(bits, 21)):
        for axis in range(3):
            key |= ((coordinates[:, axis] >> bit) & 1) << (3 * bit + axis)
    order = np.argsort(key, kind="stable")
    if count == 1:
        return candidates[order[len(order) // 2 : len(order) // 2 + 1]]
    # 드문 저농도 꼬리가 빠지지 않도록 공간 양 끝 우선 보존
    anchors = []
    for axis in np.argsort(-np.ptp(cells, axis=0), kind="stable"):
        for row in (np.argmin(cells[:, axis]), np.argmax(cells[:, axis])):
            if row not in anchors and len(anchors) < count:
                anchors.append(row)
    order = order[~np.isin(order, anchors)]
    remaining = count - len(anchors)
    ranks = ((np.arange(remaining) + 0.5) * len(order) / max(remaining, 1)).astype(int)
    return candidates[np.r_[anchors, order[ranks]]]


class PlumeFocus:
    """유한 농도가 있는 유체 셀을 로그 농도 구간별로 분산 선택"""

    def __init__(self, sample, channels, concentration, source=None, threshold=None):
        self._sample, self._channels, self._flow_focus = sample, channels, None
        self.concentration = np.asarray(concentration)
        if self.concentration.shape != sample.solid.shape:
            raise ValueError("concentration must have the same XYZ shape as sample.valid")
        if threshold is not None and (not np.isfinite(threshold) or threshold < 0):
            raise ValueError("threshold must be finite and nonnegative")
        self.source = source
        self.vectors = velocity(sample.values, channels)
        self.speed = np.hypot(np.hypot(self.vectors[..., 0], self.vectors[..., 1]), self.vectors[..., 2])
        positive = sample.valid & np.isfinite(self.concentration) & (self.concentration > 0)
        above_noise = positive & (self.concentration > 1e-12)
        reference = float(np.percentile(self.concentration[above_noise], 95)) if above_noise.any() else 0.0
        self.threshold = max(1e-12, reference * 1e-3) if threshold is None else float(threshold)
        self.usable = (
            positive & (self.concentration >= self.threshold) & np.isfinite(self.speed) & (self.speed > 1e-8)
        )
        self.strength = np.zeros(sample.solid.shape, dtype=np.float32)
        self._bands = np.zeros(sample.solid.shape, dtype=np.uint8)
        if self.usable.any():
            values = np.log(self.concentration[self.usable].astype(np.float64))
            low, high = (
                float(values.min()),
                float(np.log(max(reference, float(self.concentration[self.usable].min())))),
            )
            scaled = np.clip((values - low) / (high - low), 0.0, 1.0) if high > low else np.ones(len(values))
            self.strength[self.usable] = scaled
            self._bands[self.usable] = np.minimum((3 * scaled).astype(np.uint8), 2)
        self._cell = float(
            min((np.diff(axis).min() for axis in sample.centres if len(axis) > 1), default=1.0)
        )
        self.spacing_size = self._cell
        self.diagnostics = {
            "concentration_threshold": self.threshold,
            "reference_concentration": reference,
            "positive_count": int(positive.sum()),
            "retained_count": int(self.usable.sum()),
            "candidate_count": int(self.usable.sum()),
            "selected_count": 0,
            "concentration_band_counts": [0, 0, 0],
        }
        self._selection = None

    @property
    def flow_focus(self):
        if self._flow_focus is None:
            self._flow_focus = FlowFocus(self._sample, self._channels)
        return self._flow_focus

    def indices(self, density, usable=None):
        """농도 구간별 최대 density개 선택하며 같은 예산은 캐시"""
        if density < 1:
            raise ValueError("density must be at least 1")
        standard = usable is None or np.array_equal(usable, self.usable)
        if standard and self._selection is not None and self._selection[0] == density:
            self.spacing_size = self._selection[2]
            return self._selection[1]
        candidates = np.flatnonzero(self.usable if standard else self.usable & usable)
        bands = self._bands.ravel()[candidates]
        counts = np.bincount(bands, minlength=3)
        quotas = np.zeros(3, dtype=int)
        remaining = min(int(density), len(candidates))
        # 로그 구간별 예산을 배분하고 남는 수량은 재분배
        while remaining:
            active = [band for band in (0, 2, 1) if quotas[band] < counts[band]]
            share = max(remaining // len(active), 1)
            for band in active:
                take = min(share, int(counts[band] - quotas[band]), remaining)
                quotas[band] += take
                remaining -= take
        parts = [
            _plume_spread(candidates[bands == band], self.usable.shape, int(quota))
            for band, quota in enumerate(quotas)
        ]
        indices = np.sort(np.concatenate(parts))
        indices.flags.writeable = False
        # 농도 영역이 커져도 화살표 길이가 바뀌지 않도록 격자 기준 사용
        self.spacing_size = self._cell * min(3.0, max(1.0, (self.usable.size / density) ** (1 / 3)))
        if standard:
            self._selection = density, indices, self.spacing_size
            self.diagnostics.update(
                selected_count=len(indices),
                concentration_band_counts=quotas.tolist(),
            )
        return indices


def volume_arrows(
    sample, channels, quantity, density, reference_speed, origin, width=None, color_values=None, focus=None
):
    """원본 XYZ 방향과 3D 풍속을 사용하며 color_values는 XYZ 외부 색상값"""
    if not np.isfinite(reference_speed) or reference_speed <= 0:
        raise ValueError("reference_speed must be finite and positive")
    shape = sample.solid.shape
    if color_values is not None:
        color_values = np.asarray(color_values)
        if color_values.shape != shape:
            raise ValueError("color_values must have the same XYZ shape as sample.valid")
    if not np.prod(shape):
        return pv.PolyData()
    thin = stride_for(shape, density)
    vectors = velocity(sample.values, channels)
    usable = sample.valid & (vectors != 0).any(axis=-1)
    if focus is not None:
        if focus.usable.shape != shape:
            raise ValueError("focus must have the same XYZ shape as sample.valid")
        usable &= focus.usable
    if color_values is not None:
        usable &= np.isfinite(color_values)
    if not usable.any():
        return pv.PolyData()
    first = volume_indices(usable, density) if focus is None else focus.indices(density, usable)
    index = np.unravel_index(first, shape)
    tails = np.column_stack(
        [np.asarray(centre, dtype=np.float64)[i] for centre, i in zip(sample.centres, index)]
    )
    cell = min((np.diff(centre).min() for centre in sample.centres if len(centre) > 1), default=1.0)
    size = LENGTH * getattr(focus, "spacing_size", thin * cell)
    moving = vectors[index].astype(np.float64)
    speed = np.linalg.norm(moving, axis=-1)
    ahead = moving / speed[:, None]
    # 연직 바람에서도 퇴화하지 않는 직교 기저 구성
    axis = np.eye(3)[np.argmin(np.abs(ahead), axis=-1)]
    side = np.cross(axis, ahead)
    side /= np.linalg.norm(side, axis=-1)[:, None]
    up = np.cross(ahead, side)
    lengths = np.clip(speed / reference_speed, *LENGTHS) * size
    widths = np.full(len(first), size)
    colours = (
        scalar(sample.values[index], channels, quantity) if color_values is None else color_values[index]
    )
    if width is not None:
        name, (low, high) = width
        values = (
            colours
            if color_values is not None and name == quantity
            else scalar(sample.values[index], channels, name)
        )
        step = np.digitize(values, [low + (high - low) / 3, low + 2 * (high - low) / 3])
        widths *= np.asarray(WIDTHS)[step]
    strength = getattr(focus, "strength", None)
    if strength is not None:
        widths *= 0.65 + 0.85 * strength[index]
    widths = np.minimum(widths, SQUAT * lengths)
    shape_points = ARROW.points.astype(np.float64)
    points = (
        (tails - np.asarray(origin, dtype=np.float64))[:, None, :]
        + shape_points[None, :, 0:1] * (lengths[:, None] * ahead)[:, None, :]
        + shape_points[None, :, 1:2] * (widths[:, None] * side)[:, None, :]
        + shape_points[None, :, 2:3] * (widths[:, None] * up)[:, None, :]
    )
    glyphs = pv.PolyData(points.reshape(-1, 3).astype(np.float32), faces=instance_faces(len(first)))
    glyphs.point_data[VALUE] = np.repeat(colours.astype(np.float32), ARROW.n_points)
    return glyphs


def path_arrows(
    paths,
    density,
    reference_speed,
    spacing_size,
    field,
    origin,
    width_range=None,
    concentration=False,
    *,
    width_scale=1.0,
):
    """유선의 호 길이에 화살표를 배치하고 벽을 가로지르는 몸통은 축소"""
    if not np.isfinite(width_scale) or width_scale <= 0:
        raise ValueError("width_scale must be positive and finite")
    if not paths.n_lines:
        return pv.PolyData()
    if density < 1 or reference_speed <= 0 or spacing_size <= 0:
        raise ValueError("density, reference_speed and spacing_size must be positive")
    gap, size = 1.5 * spacing_size, LENGTH * spacing_size
    curves, available = [], 0
    offset = 0
    while offset < len(paths.lines):
        count = paths.lines[offset]
        index = paths.lines[offset + 1 : offset + count + 1]
        offset += count + 1
        points = paths.points[index].astype(np.float64)
        distance = np.r_[0.0, np.cumsum(np.linalg.norm(np.diff(points, axis=0), axis=1))]
        keep = np.r_[True, np.diff(distance) > 1e-8]
        index, points, distance = index[keep], points[keep], distance[keep]
        if len(index) < 2:
            continue
        starts = np.arange(min(0.25 * gap, distance[-1] * 0.15), distance[-1] - 1e-8, gap)
        curves.append((index, points, distance, starts))
        available += len(starts)
    if not available:
        return pv.PolyData()
    # 한 유선이 예산을 독점하지 않도록 전체 후보에서 선택
    selected = np.zeros(available, dtype=bool)
    selected[np.linspace(0, available - 1, min(density, available), dtype=int)] = True
    shape = ARROW.points.astype(np.float64)
    rings = np.unique(np.round(shape[:, 0], 7))
    colours = np.asarray(paths.point_data[VALUE])
    vectors = np.asarray(paths.point_data["velocity"])
    width_values = paths.point_data.get("width", colours)
    positive = colours[np.isfinite(colours) & (colours > 0)]
    log_low, log_high = (np.log(positive.min()), np.log(positive.max())) if len(positive) else (0.0, 0.0)
    meshes, painted, offset = [], [], 0
    for index, points, distance, starts in curves:
        use = selected[offset : offset + len(starts)]
        offset += len(starts)
        starts = starts[use]
        if not len(starts):
            continue
        speed = np.linalg.norm(vectors[index], axis=1)
        lengths = np.clip(np.interp(starts, distance, speed) / reference_speed, *LENGTHS) * size
        lengths = np.minimum(lengths, np.minimum(0.95 * gap, distance[-1] - starts))
        # 곡선 몸통이 벽을 가로지르는 경우에만 길이 축소
        for _ in range(16):
            along_rings = starts[:, None] + rings[None, :] * lengths[:, None]
            centres = np.stack(
                [np.interp(along_rings, distance, points[:, axis]) for axis in range(3)], axis=-1
            )
            world = centres + np.asarray(origin, dtype=np.float64)
            allowed = clear_path(field, world[:, :-1].reshape(-1, 3), world[:, 1:].reshape(-1, 3))
            allowed = allowed.reshape(len(starts), -1).all(axis=1)
            if allowed.all():
                break
            lengths[~allowed] *= 0.5
        starts, lengths = starts[allowed], lengths[allowed]
        if not len(starts):
            continue
        widths = np.full(len(starts), size)
        if width_range is not None:
            low, high = width_range
            values = np.interp(starts, distance, width_values[index])
            band = np.digitize(values, [low + (high - low) / 3, low + 2 * (high - low) / 3])
            widths *= np.asarray(WIDTHS)[band]
        if concentration:
            values = np.log(np.maximum(np.interp(starts, distance, colours[index]), 1e-30))
            strength = np.clip((values - log_low) / (log_high - log_low), 0, 1) if log_high > log_low else 1.0
            widths *= 0.65 + 0.85 * strength
        elif width_range is None:
            widths *= width_scale
        widths = np.minimum(widths, SQUAT * lengths)
        along = starts[:, None] + shape[None, :, 0] * lengths[:, None]
        centre = np.stack([np.interp(along, distance, points[:, axis]) for axis in range(3)], axis=-1)
        segment = np.clip(np.searchsorted(distance, along, side="right") - 1, 0, len(distance) - 2)
        ahead = points[segment + 1] - points[segment]
        ahead /= np.linalg.norm(ahead, axis=-1)[..., None]
        axis = np.eye(3)[np.argmin(np.abs(ahead[:, 0]), axis=-1)][:, None, :]
        side = np.cross(axis, ahead)
        flat = np.linalg.norm(side, axis=-1) < 1e-8
        if flat.any():
            side[flat] = np.cross(np.eye(3)[np.argmin(np.abs(ahead[flat]), axis=-1)], ahead[flat])
        side /= np.linalg.norm(side, axis=-1)[..., None]
        up = np.cross(ahead, side)
        mesh = centre + widths[:, None, None] * (shape[None, :, 1:2] * side + shape[None, :, 2:3] * up)
        meshes.append(mesh.reshape(-1, 3))
        painted.append(np.interp(along, distance, colours[index]).ravel())
    if not meshes:
        return pv.PolyData()
    points = np.concatenate(meshes).astype(np.float32)
    glyphs = pv.PolyData(points, faces=instance_faces(len(points) // ARROW.n_points))
    glyphs.point_data[VALUE] = np.concatenate(painted).astype(np.float32)
    # 중심선과 값은 유지하며 표면 법선만 계산
    glyphs.compute_normals(
        cell_normals=False,
        point_normals=True,
        split_vertices=False,
        consistent_normals=False,
        auto_orient_normals=False,
        inplace=True,
    )
    return glyphs


def instance_faces(count):
    faces = np.asarray(ARROW.faces)
    index = np.ones(len(faces), dtype=bool)
    position = 0
    while position < len(faces):
        index[position] = False
        position += faces[position] + 1
    shift = np.arange(count)[:, None] * ARROW.n_points * index[None, :]
    return (faces[None, :] + shift).ravel()


def volume_grid(sample, origin):
    centres = [centre - o for centre, o in zip(sample.centres, origin)]
    spacing = [np.diff(centre).mean() if len(centre) > 1 else 1.0 for centre in centres]
    return pv.ImageData(
        dimensions=sample.solid.shape, spacing=spacing, origin=[centre[0] for centre in centres]
    )


def fill_volume(grid, sample, channels, quantity, extension=None):
    """벽 옆 보간을 위해 고체 이웃만 확장하며 반환값은 유효 셀 값"""
    valid = sample.valid
    shown = scalar(sample.values, channels, quantity)
    vectors = velocity(sample.values, channels)
    # 무효 속도는 0으로 두어 유선 종료 및 NaN 확산 방지
    vectors[~valid] = 0
    if extension is None:
        grid.point_data[VALUE] = np.where(valid, shown, 0).ravel(order="F")
    else:
        vectors = np.stack([extension(vectors[..., axis]) for axis in range(3)], axis=-1)
        # 확장층 밖의 고체는 0으로 유지하여 건물 관통 방지
        if len(extension.rest):
            flat = vectors.reshape(-1, 3)
            flat[extension.rest] = 0.0
            vectors = flat.reshape(vectors.shape)
        grid.point_data[VALUE] = extension(shown).ravel(order="F")
    grid.point_data["velocity"] = vectors.transpose(2, 1, 0, 3).reshape(-1, 3)
    return shown[valid]


class Extension:
    """가짜 등가면을 막도록 무효 점을 이웃 유효 값으로 채움"""

    def __init__(self, valid, layers=EXTEND):
        self.valid = valid
        index = np.arange(valid.size).reshape(valid.shape)
        known = valid.copy()
        shifts = ((slice(None, -1), slice(1, None)), (slice(1, None), slice(None, -1)))
        self.steps = []  # 층별 (점, 이웃별 대상점, 이웃점, 이웃 수)
        for _ in range(layers):
            targets, sources = [], []
            for axis in range(3):
                for near, far in shifts:
                    here = tuple(near if a == axis else slice(None) for a in range(3))
                    there = tuple(far if a == axis else slice(None) for a in range(3))
                    pair = ~known[here] & known[there]
                    targets.append(index[here][pair])
                    sources.append(index[there][pair])
            points, position = np.unique(np.concatenate(targets), return_inverse=True)
            if not len(points):
                break
            self.steps.append((points, position, np.concatenate(sources), np.bincount(position)))
            known.flat[points] = True
        self.rest = np.flatnonzero(~known)

    def __call__(self, values):
        """무효 점을 채운 float32 배열 [a, b, c] 반환"""
        out = np.where(self.valid, values, 0).astype(np.float32).ravel()
        for points, position, sources, count in self.steps:
            out[points] = np.bincount(position, weights=out[sources]) / count
        if len(self.rest):
            out[self.rest] = out[self.valid.ravel()].mean() if self.valid.any() else 0.0
        return out.reshape(self.valid.shape)


def fill_cloud(grid, sample, channels, quantity, extension):
    """체적 표시값을 갱신하며 반환값은 유효 셀 값"""
    shown = scalar(sample.values, channels, quantity)
    grid.point_data[FILLED] = extension(shown).ravel(order="F")
    return shown[sample.valid]


def shade(grid, valid, value_range, emphasis):
    """값과 불투명도 가중치의 2성분 배열 설정"""
    low, high = value_range
    filled = grid.point_data[FILLED]
    ratio = np.clip((filled - low) / (high - low), 0, 1)
    weight = (ratio if emphasis == "high" else 1 - ratio) ** 4 * valid.ravel(order="F")
    pair = np.column_stack([filled, weight]).astype(np.float32)
    grid.point_data.set_array(pair, SHADE)
    grid.GetPointData().SetActiveScalars(SHADE)


def isosurface(grid, value, valid):
    # 한 축에 점이 하나면 vtkFlyingEdges3D 사용 불가
    if min(grid.dimensions) < 2:
        return pv.PolyData()
    surface = grid.contour([value], scalars=FILLED, compute_normals=True, method="flying_edges")
    if not surface.n_cells:
        return pv.PolyData()
    nearest = np.rint((surface.points - np.array(grid.origin)) / np.array(grid.spacing)).astype(int)
    fluid = valid[tuple(np.clip(nearest, 0, np.array(valid.shape) - 1).T)]
    outside = ~fluid[surface.regular_faces].any(axis=1)
    if outside.all():
        return pv.PolyData()
    if outside.any():
        surface = surface.remove_cells(np.flatnonzero(outside))
    surface.point_data[VALUE] = np.full(surface.n_points, value, dtype=np.float32)
    return surface


def inflow_face(vectors):
    """최대 유입면의 (축, 면)이며 면은 최소=0, 최대=1"""
    inflow = {
        (a, side): (1 - 2 * side) * np.nan_to_num(vectors.take(-side, axis=a)[..., a]).mean()
        for a in range(3)
        for side in (0, 1)
    }
    return max(inflow, key=inflow.get)


def inflow_seeds(grid, vectors, count, ceiling=None):
    axis, side = inflow_face(vectors)
    low, high = np.array(grid.bounds).reshape(3, 2).T
    if ceiling is not None and axis != 2:
        high = high.copy()
        high[2] = float(np.clip(ceiling, low[2] + 1e-6, high[2]))
    length = np.maximum(high - low, 1e-9)
    a, b = (i for i in range(3) if i != axis)
    n_a = int(np.clip(round(np.sqrt(count * length[a] / length[b])), 1, count))
    counts = {a: n_a, b: max(1, count // n_a)}
    # 유입면 위 씨앗의 즉시 유출을 막도록 조금 안쪽에 배치
    inset = 0.01 * grid.spacing[axis] * (1 - 2 * side)
    lines = [
        np.array([(low, high)[side][i] + inset])
        if i == axis
        else np.linspace(low[i], high[i], counts[i] + 2)[1:-1]
        for i in range(3)
    ]
    return pv.PolyData(
        np.stack(np.meshgrid(*lines, indexing="ij"), axis=-1).reshape(-1, 3).astype(np.float32)
    )


def near_solid(solid, edges, reach):
    """각 축 reach(m)만큼 확장한 직육면체 이웃이며 최소 한 셀 유지"""
    region = np.asarray(solid, dtype=bool).copy()
    for axis, edge in enumerate(edges):
        steps = max(1, int(np.ceil(reach / float(np.median(np.diff(edge))))))
        for _ in range(min(steps, region.shape[axis] - 1)):
            previous = region.copy()
            low, high = [slice(None)] * 3, [slice(None)] * 3
            low[axis], high[axis] = slice(None, -1), slice(1, None)
            region[tuple(low)] |= previous[tuple(high)]
            region[tuple(high)] |= previous[tuple(low)]
    return region


def turned(vectors, valid):
    """주흐름과의 방향 차이 [0, 1]이며 1은 정반대"""
    flat = np.nan_to_num(vectors[..., :2])
    main = flat[valid].mean(axis=0) if valid.any() else np.zeros(2)
    size = float(np.hypot(*main))
    if size < 1e-9:
        return np.zeros(valid.shape, dtype=np.float32)
    main = main / size
    speed = np.maximum(np.linalg.norm(flat, axis=-1), 1e-9)
    cosine = np.clip((flat * main).sum(axis=-1) / speed, -1, 1)
    return np.where(valid, (1 - cosine) / 2, 0).astype(np.float32)


def city_seeds(grid, sample, count, ceiling, reach, priority=None):
    valid = np.asarray(sample.valid, dtype=bool)
    heights = np.array(grid.origin)[2] + np.arange(grid.dimensions[2]) * grid.spacing[2]
    under = valid & (heights <= ceiling)[None, None, :]
    usable = under & near_solid(np.asarray(sample.solid, dtype=bool), sample.edges, reach) & ~sample.solid
    if not usable.any():
        usable = under
    if not usable.any():
        return pv.PolyData()
    if priority is not None and usable.sum() > 2 * count:
        keen = usable & (priority >= np.median(priority[usable]))
        usable = keen if keen.sum() >= count else usable
    chosen = _plume_spread(np.flatnonzero(usable.ravel()), usable.shape, count)
    cells = np.column_stack(np.unravel_index(chosen, usable.shape))
    return pv.PolyData((np.array(grid.origin) + cells * np.array(grid.spacing)).astype(np.float32))


def streamlines(grid, seeds, both=False, reach=2.0, steps=None, quick=False):
    """quick이면 셀 한 칸 보폭의 RK2를 쓰고 소용돌이도는 생략"""
    extra = {} if steps is None else {"max_steps": steps}
    if quick:
        extra.update(
            integrator_type=2,
            step_unit="cl",
            initial_step_length=1.0,
            min_step_length=1.0,
            max_step_length=1.0,
            compute_vorticity=False,
        )
    return grid.streamlines_from_source(
        seeds,
        vectors="velocity",
        integration_direction="both" if both else "forward",
        max_length=reach * grid.length,
        terminal_speed=1e-4,
        **extra,
    )
