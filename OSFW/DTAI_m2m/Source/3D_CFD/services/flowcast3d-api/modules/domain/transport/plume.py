import math

import numpy as np

EMISSION = 1.0  # 배출량(g/s)
RATE = 1000.0
CAPACITY = 35_000
KARMAN = 0.41
BLACKADAR = 20.0  # 점근 혼합 거리(m)
SCHMIDT = 0.7
REACH = 30.0  # 벽 거리 탐색 상한(m)
# 급격한 셀별 전단으로 값이 튀지 않도록 확산 상한 설정(m²/s)
EDDY_MAX = 10.0
# 입자별 지수분포로 뽑는 건물 넘기 높이의 평균(m)
CLIMB = 10.0
SPINUP = 8.0  # 첫 화면용 사전 배출 시간(초)
UPWIND = 0.15  # 상류 경계부터 배출원까지의 영역 길이 비율
PASSES = 1
DECADES = 4
CALM = 0.5  # 색 범위 계산에 쓸 풍속 하한(m/s)
MAX_SUBSTEPS = 64


def raw_field(field):
    """원본 속도를 유지하며 표시용 동적 바람만 분리"""
    if field.wind is None:
        return field
    raw = field.with_wind(None, None)
    raw.fastest = raw.base_fastest
    return raw


def smooth(values, valid=None, passes=PASSES):
    """벽을 가로지르지 않고 유체 이웃끼리 질량을 교환하는 평활화"""
    valid = np.ones(values.shape, dtype=bool) if valid is None else valid
    out = np.where(valid, values, 0).astype(np.float32)
    for _ in range(passes):
        for axis in range(3):
            if out.shape[axis] < 2:
                continue
            head = (slice(None),) * axis + (slice(1, None),)
            tail = (slice(None),) * axis + (slice(None, -1),)
            exchange = np.where(valid[head] & valid[tail], 0.25 * (out[head] - out[tail]), 0)
            out[tail] += exchange
            out[head] -= exchange
    return out


def forecast(result):
    history = result.metadata.history_frames
    return list(range(history, result.n_frames)) if history < result.n_frames else list(range(result.n_frames))


def distance(solid, step, floor):
    """축 방향으로 구한 고체 거리(m)이며 대각선 거리는 최대 √3배"""
    out = np.where(solid, 0.0, REACH).astype(np.float32)
    if floor:
        out[:, :, 0] = np.minimum(out[:, :, 0], 0.5 * step[2])
    for _ in range(math.ceil(REACH / min(step))):
        for axis in range(3):
            if out.shape[axis] < 2:
                continue
            head = (slice(None),) * axis + (slice(1, None),)
            tail = (slice(None),) * axis + (slice(None, -1),)
            np.minimum(out[head], out[tail] + np.float32(step[axis]), out=out[head])
            np.minimum(out[tail], out[head] + np.float32(step[axis]), out=out[tail])
    return out


def diffusivity(fields, floor):
    """벽 거리와 속도 전단으로 추정한 난류 확산 계수(m²/s)"""
    total, count = None, 0
    for field in fields:
        if total is None:
            total = field.vectors.copy()
        else:
            total += field.vectors
        count += 1
    total /= count
    mean, step, valid = total, field.step, field.valid
    axes = [axis for axis in range(3) if valid.shape[axis] > 1]

    def derivatives(values):
        if not axes:
            return []
        parts = np.gradient(values, *step[axes], axis=axes)
        return [parts] if len(axes) == 1 else parts

    # 세밀한 격자의 임시 메모리를 제한하도록 float32 사용
    gradient = [[np.zeros(valid.shape, dtype=np.float32) for _ in range(3)] for _ in range(3)]
    for component in range(3):
        for axis, values in zip(axes, derivatives(mean[..., component])):
            gradient[component][axis] = values
    strain = np.sqrt(2 * sum((0.5 * (gradient[i][j] + gradient[j][i])) ** 2 for i in range(3) for j in range(3)))
    reach = KARMAN * distance(~valid, step, floor)
    mixing = reach / (1 + reach / BLACKADAR)
    eddy = np.where(valid, np.minimum(mixing**2 * strain / SCHMIDT, EDDY_MAX), 0.0)
    out = np.zeros((*valid.shape, 4), dtype=np.float32)
    out[..., 0] = eddy
    for axis, values in zip(axes, derivatives(eddy)):
        out[..., 1 + axis] = values
    return out


def settle(field, point):
    """배출원을 가장 가까운 유효 유체 셀로 이동"""
    point = np.clip(np.asarray(point, dtype=np.float64), field.bounds[0], field.bounds[1])
    if field.fluid(point[None])[0] or not field.valid.any():
        return point
    cells = np.argwhere(field.valid)
    centres = np.stack([(edge[cells[:, a]] + edge[cells[:, a] + 1]) / 2 for a, edge in enumerate(field.edges)], axis=1)
    return centres[np.argmin(((centres - point) ** 2).sum(axis=1))]


def upwind(field, height):
    low, high = field.bounds
    wind = field.vectors[field.valid][:, :2].mean(axis=0) if field.valid.any() else np.zeros(2)
    speed = float(np.hypot(*wind))
    heading = wind / speed if speed > 1e-6 else np.array([1.0, 0.0])
    half = min((high[a] - low[a]) / 2 / abs(heading[a]) for a in range(2) if abs(heading[a]) > 1e-6)
    point = (low + high) / 2
    point[:2] -= heading * half * (1 - 2 * UPWIND)
    point[2] = height
    return settle(field, point)


class Plume:

    def __init__(self, source, floor=None, seed=0, transport="dispersion"):
        self.source, self.floor = np.asarray(source, dtype=np.float64), floor
        self.transport = transport
        self.random_seed = seed
        self.clear()

    def clear(self):
        self.random = np.random.default_rng(self.random_seed)
        self.points, self.sides, self.climbs = np.zeros((0, 3)), np.zeros(0), np.zeros(0)
        self.elapsed = self.carry = 0.0

    def advance(self, field, eddy, dt):
        """입자를 나눠 이동하며 얇은 벽도 선분 전체로 검사"""
        if dt <= 0:
            return
        if self.transport == "prediction":
            field = raw_field(field)
        cell = field.step.min()
        if field.wind is not None:
            self._advance_dynamic(field, eddy, dt, cell)
            self.elapsed += dt
            return
        wind = field.fastest * dt / cell
        spread = 0.0 if self.transport == "prediction" else float(eddy[..., 0].max()) * dt / (2 * cell**2)
        substeps = int(np.clip(np.ceil(max(wind, spread)), 1, MAX_SUBSTEPS))
        h = dt / substeps
        for _ in range(substeps):
            self.move(field, eddy, h)
            self.emit(field, h)
        self.elapsed += dt

    def _advance_dynamic(self, field, eddy, dt, cell):
        maximum = float(eddy[..., 0].max())
        diffusive = 2 * cell**2 / maximum if maximum > 0 else math.inf
        remaining = dt
        for index in range(MAX_SUBSTEPS):
            points = np.concatenate([self.points, self.source[None]])
            velocities = field.velocity_at(points)
            fastest = float(np.abs(velocities).max(initial=0.0))
            advective = cell / fastest if fastest > 0 else math.inf
            # 긴 프레임도 최대 걸음 수 안에서 전체 시간 진행
            h = min(remaining, max(min(advective, diffusive), remaining / (MAX_SUBSTEPS - index)))
            self.move(field, eddy, h, velocity=velocities[:-1])
            self.emit(field, h, wind=velocities[-1])
            if h >= remaining:
                break
            remaining -= h

    def move(self, field, eddy, h, velocity=None):
        points = self.points
        if not len(points):
            return
        if self.transport == "prediction":
            field = raw_field(field)
            # 전달된 속도도 표시장일 수 있어 원본에서 재평가
            middle = points + 0.5 * h * field.velocity_at(points)
            clear_middle = field.clear_path(points, middle)
            middle[~clear_middle] = points[~clear_middle]
            moved = points + h * field.velocity_at(middle)
            clear = clear_middle & field.clear_path(points, moved)
            moved[~clear] = points[~clear]
            kept = field.inside(moved)
            self.points, self.sides, self.climbs = moved[kept], self.sides[kept], self.climbs[kept]
            return
        velocity = field.velocity_at(points) if velocity is None else velocity
        mixing = field.interpolate(points, eddy)[0]
        # 중점 적분의 중간 선분도 고체 통과 검사
        middle = points + 0.5 * h * velocity
        blocked_middle = ~field.clear_path(points, middle)
        middle[blocked_middle] = points[blocked_middle]
        velocity = field.velocity_at(middle)
        # 확산이 작은 곳에 입자가 쌓이지 않도록 확산 계수 기울기 반영
        noise = np.sqrt(2 * mixing[:, :1] * h) * self.random.standard_normal(points.shape)
        step = h * (velocity + mixing[:, 1:]) + noise
        moved = points + step
        if self.floor is not None:
            below = moved[:, 2] < self.floor
            moved[below, 2] = 2 * self.floor - moved[below, 2]
        # 무작위 걸음이 얇은 벽을 넘지 않도록 전체 선분 검사
        blocked = ~field.clear_path(points, moved)
        if blocked.any():
            moved[blocked] = self.detour(field, points[blocked], (moved - points)[blocked], blocked)
        kept = field.inside(moved)
        self.points, self.sides, self.climbs = moved[kept], self.sides[kept], self.climbs[kept]

    def detour(self, field, start, step, blocked):
        """고체에 막힌 이동은 높이 한도에 따라 위나 옆으로 우회"""
        sides, climbs = self.sides[blocked], self.climbs[blocked]
        column = field.blocks(start + step)[:2]
        over = field.tops[column] - start[:, 2] <= climbs
        slid = start.copy()
        for axis in (2, 0, 1):
            trial = slid.copy()
            trial[:, axis] += step[:, axis]
            free = field.clear_path(slid, trial)
            slid[free] = trial[free]
        distance = np.hypot(*(start + step - slid)[:, :2].T)
        heading = step[:, :2] / np.maximum(np.hypot(*step[:, :2].T), 1e-12)[:, None]
        aside, up = slid.copy(), slid.copy()
        aside[:, 0] -= sides * heading[:, 1] * distance
        aside[:, 1] += sides * heading[:, 0] * distance
        up[:, 2] += distance
        first, second = np.where(over[:, None], up, aside), np.where(over[:, None], aside, up)
        return np.where(
            field.clear_path(slid, first)[:, None],
            first,
            np.where(field.clear_path(slid, second)[:, None], second, slid),
        )

    def emit(self, field, h, wind=None):
        self.carry += RATE * h
        count = int(self.carry)
        self.carry -= count
        if not count:
            return
        if not field.inside(self.source[None])[0] or not field.fluid(self.source[None])[0]:
            return
        if self.transport == "prediction":
            field = raw_field(field)
            age = ((np.arange(count) + 0.5) / count * h)[:, None]
            new = np.broadcast_to(self.source, (count, 3)).copy()
            middle = new + 0.5 * age * field.velocity_at(self.source[None])
            clear_middle = field.clear_path(new, middle)
            middle[~clear_middle] = new[~clear_middle]
            moved = new + age * field.velocity_at(middle)
            clear = clear_middle & field.clear_path(new, moved)
            new[clear] = moved[clear]
            new = new[field.inside(new)]
            self.points = np.concatenate([self.points, new])[-CAPACITY:]
            self.sides = np.concatenate([self.sides, np.zeros(len(new))])[-CAPACITY:]
            self.climbs = np.concatenate([self.climbs, np.zeros(len(new))])[-CAPACITY:]
            return
        wind = field.velocity_at(self.source[None])[0] if wind is None else wind
        # 한 걸음 안의 배출 시각을 분산해 점 배출원의 줄무늬 방지
        new = np.broadcast_to(self.source, (count, 3)).copy()
        pending = np.arange(count)
        for _ in range(4):
            if not len(pending):
                break
            spread = self.random.random((len(pending), 1)) * h * wind
            spread += (self.random.random((len(pending), 3)) - 0.5) * field.step
            trial = self.source + spread
            free = field.inside(trial) & field.clear_path(np.broadcast_to(self.source, trial.shape), trial)
            new[pending[free]] = trial[free]
            pending = pending[~free]
        # 재배치 실패 시 원래 유체 위치에 두어 배출 질량 보존
        sides = self.random.choice((-1.0, 1.0), len(new))
        climbs = self.random.exponential(CLIMB, len(new))
        self.points = np.concatenate([self.points, new])[-CAPACITY:]
        self.sides = np.concatenate([self.sides, sides])[-CAPACITY:]
        self.climbs = np.concatenate([self.climbs, climbs])[-CAPACITY:]


class Deposit:

    def __init__(self, field):
        low, high = field.bounds
        self.low = low
        self.high = high
        self.edges = field.edges
        self.dims = np.array(field.valid.shape, dtype=np.int64)
        self.spacing = (high - low) / self.dims
        self.size = int(np.prod(self.dims))
        self.fluid = field.valid
        widths = [np.diff(edge).astype(np.float32) for edge in self.edges]
        self.volumes = widths[0][:, None, None] * widths[1][None, :, None] * widths[2][None, None, :]

    def cells(self, points):
        index = [
            np.clip(np.searchsorted(edge, points[:, a], side="right") - 1, 0, self.dims[a] - 1)
            for a, edge in enumerate(self.edges)
        ]
        return np.ravel_multi_index(index, self.dims)

    def concentration(self, points, mass, passes=PASSES):
        """입자 질량(µg)을 유체 셀 부피로 나눈 float32 농도 [x, y, z]"""
        inside = ((points >= self.low) & (points <= self.high)).all(axis=1)
        cells = self.cells(points[inside])
        cells = cells[self.fluid.ravel()[cells]]
        count = np.bincount(cells, minlength=self.size).reshape(self.dims)
        deposited = smooth(count * np.float32(mass), self.fluid, passes=passes)
        return deposited / self.volumes


def colour_range(field, source, deposit):
    wind = max(float(np.linalg.norm(field.velocity_at(source[None])[0])), CALM)
    peak = EMISSION * 1e6 / (wind * np.prod(deposit.spacing) ** (2 / 3))
    top = 10.0 ** math.ceil(math.log10(peak))
    return top / 10**DECADES, top


def ground_below(deposit, point):
    index = [
        int(np.clip(np.searchsorted(edge, point[a], side="right") - 1, 0, deposit.dims[a] - 1))
        for a, edge in enumerate(deposit.edges)
    ]
    blocked = np.flatnonzero(~deposit.fluid[index[0], index[1], : index[2]])
    return float(deposit.edges[2][blocked[-1] + 1] if len(blocked) else deposit.edges[2][0])
