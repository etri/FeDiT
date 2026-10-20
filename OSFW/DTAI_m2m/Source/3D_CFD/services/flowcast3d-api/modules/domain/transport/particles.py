import copy
import itertools
import math
from collections import OrderedDict
from dataclasses import replace
from functools import cached_property

import numpy as np

from modules.domain.transport.fields import AXES, velocity

LIFETIME = 80  # 정체 영역에 입자가 몰리지 않도록 수명 뒤 재배치
FIELDS = 4  # 입자와 확산이 앞뒤 두 프레임씩 사용
MAX_SUBSTEPS = 16
STALLED = 1e-6  # 정체 판정 풍속(m/s)
COLORS = {False: "#ff7f0e", True: "#e91e63"}  # 단일 프레임의 정지장 가정을 구분하는 색


class Field:
    """속도 [a, b, c, 3](m/s)와 셀 경계이며 고체 및 무효 셀은 속도 0"""

    def __init__(self, sample, channels):
        self.time, self.wind, self.boundary = float(sample.time), None, None
        self.valid = sample.valid
        self.vectors = np.where(self.valid[..., None], velocity(sample.values, channels), 0.0).astype(
            np.float32
        )
        self.edges = sample.edges
        self.low = np.array([centre[0] for centre in sample.centres])
        self.step = np.array(
            [np.diff(centre).mean() if len(centre) > 1 else 1.0 for centre in sample.centres]
        )
        self.bounds = np.array([[edge[0] for edge in self.edges], [edge[-1] for edge in self.edges]])
        self.fastest = float(np.abs(self.vectors).max(initial=0.0))
        self.base_fastest = self.fastest
        # 평탄 색인용 보폭이며 길이 1인 축의 이웃 보폭은 0
        shape = np.array(self.valid.shape)
        self.strides = np.array([shape[1] * shape[2], shape[2], 1])
        self.next = np.where(shape > 1, self.strides, 0)
        # 마지막 블록만 폭이 다르므로 첫 블록 폭으로 색인 계산
        self.width = np.array([edge[1] - edge[0] for edge in self.edges])

    def velocity_at(self, points):
        vectors = self.interpolate(points, self.vectors)[0]
        if self.wind is not None:
            distance, gradient = self.boundary.at(points)
            vectors = self.wind.velocities(points, vectors, self.time, distance, gradient)
            vectors = np.where(self.fluid(points)[:, None], vectors, 0.0)
        return vectors

    def clear_path(self, start, end):
        """고체 통과를 검사하며 도메인 밖 유출은 허용"""
        from modules.domain.transport.boundary import clear_path

        return clear_path(self, start, end)

    def with_wind(self, wind, boundary, time=None):
        effective = copy.copy(self)
        effective.wind, effective.boundary = wind, boundary
        effective.time = self.time if time is None else float(time)
        if wind is not None:
            effective.fastest = wind.speed_bound(self.base_fastest, boundary.gradient_bound)
        return effective

    def interpolate(self, points, *arrays):
        """실제 셀 중심으로 삼선형 보간하며 바깥 반 셀은 가장자리 값 유지"""
        shape = np.array(self.valid.shape)
        position = np.clip((points - self.low) / self.step, 0, shape - 1)
        first = np.minimum(position.astype(np.int64), np.maximum(shape - 2, 0))
        weight = position - first
        base = first[:, 0] * self.strides[0] + first[:, 1] * self.strides[1] + first[:, 2]
        flats = [array.reshape(-1, array.shape[-1]) for array in arrays]
        shares = [(1 - weight[:, axis], weight[:, axis]) for axis in range(3)]
        outs = [np.zeros((len(points), flat.shape[1])) for flat in flats]
        for corner in itertools.product((0, 1), repeat=3):
            share = (shares[0][corner[0]] * shares[1][corner[1]] * shares[2][corner[2]])[:, None]
            index = base + np.dot(corner, self.next)
            for out, flat in zip(outs, flats):
                out += share * np.take(flat, index, axis=0)
        return outs

    def towards(self, other, weight):
        if other is self or weight <= 0:
            return self
        blended = copy.copy(self)
        if self.vectors is not other.vectors:
            blended.vectors = self.vectors + np.float32(weight) * (other.vectors - self.vectors)
        blended.time = self.time + weight * (other.time - self.time)
        blended.fastest = max(self.fastest, other.fastest)
        blended.base_fastest = max(self.base_fastest, other.base_fastest)
        return blended

    def inside(self, points):
        return ((points >= self.bounds[0]) & (points <= self.bounds[1])).all(axis=1)

    def blocks(self, points):
        """점별 블록 번호이며 영역 밖은 가장자리 블록으로 제한"""
        index = np.floor((points - self.bounds[0]) / self.width).astype(np.int64)
        return tuple(np.clip(index, 0, np.array(self.valid.shape) - 1).T)

    def fluid(self, points):
        return self.valid[self.blocks(points)]

    @cached_property
    def tops(self):
        blocked = ~self.valid
        top = blocked.shape[2] - np.argmax(blocked[:, :, ::-1], axis=2)
        return np.where(blocked.any(axis=2), self.edges[2][top], self.edges[2][0])

    def inflow_cells(self):
        faces = {
            (axis, side): (1 - 2 * side) * self.vectors.take(-side, axis=axis)[..., axis].mean()
            for axis in range(3)
            for side in (0, 1)
        }
        axis, side = max(faces, key=faces.get)
        layer = np.zeros(self.valid.shape, dtype=bool)
        layer[tuple(slice(None) if a != axis else -side for a in range(3))] = True
        return np.argwhere(layer & self.valid)


class Fields:
    """입자와 확산이 공유하며 최근 프레임만 유지하는 속도장 캐시"""

    def __init__(self, result, *, boundary_factory=None):
        self.result = result
        self.boundary_factory = boundary_factory
        self.cache = OrderedDict()
        self.wind = self.boundary = self.configuration = None
        self.boundary_cache = OrderedDict()

    def configure(self, settings):
        if settings == self.configuration:
            return
        self.configuration = settings.model_copy(deep=True)
        self.wind = None
        if not settings.enabled:
            return
        from modules.domain.transport.wind import Wind

        # 같은 좌표의 교란을 유지하도록 전체 영역 기준으로 준비
        reference = self.result.sample(0, max_cells=1 << 21)
        if self.boundary is None:
            closed = self.result.boundary_conditions["z"][0] == "wall"
            if self.boundary_factory is None:
                raise ValueError("Dynamic wind requires a boundary factory.")
            self.boundary = self.boundary_factory(reference, self.result.grid.origin[2] if closed else None)
        vectors = velocity(reference.values, self.result.channels)[reference.valid]
        speed = float(np.linalg.norm(vectors, axis=1).mean()) if len(vectors) else 0.0
        self.wind = Wind(settings, self.result.grid.origin, speed)

    def time_at(self, position):
        """프레임 위치를 물리 시각으로 변환하며 단일 프레임도 시간 진행"""
        frame = min(max(math.floor(position), 0), self.result.n_frames - 1)
        if frame + 1 < self.result.n_frames:
            step = self.result.times[frame + 1] - self.result.times[frame]
        else:
            step = self.result.metadata.time_step
        return float(self.result.times[frame] + (position - frame) * step)

    def sample(self, frame, phase, roi=None, plane=None, max_cells=None, time=None):
        sample = self.result.blend(frame, phase, roi, plane, max_cells)
        return self.effective(sample, time)

    def effective(self, sample, time=None):
        if self.wind is None:
            return sample
        when = sample.time if time is None else float(time)
        values = sample.values.copy()
        flat = values.reshape(-1, values.shape[-1])
        valid, solid = sample.valid.ravel(), sample.solid.ravel()
        shape = sample.valid.shape
        key = tuple((len(axis), float(axis[0]), float(axis[-1])) for axis in sample.centres)
        cached = self.boundary_cache.get(key)
        pending = None
        # 경계 캐시는 원본 프레임 LRU와 별도로 64 MiB까지 유지
        limit = 64 << 20
        size = len(flat) * 4 * np.dtype(np.float32).itemsize
        if cached is None and size <= limit:
            while (
                self.boundary_cache
                and sum(value.nbytes for value in self.boundary_cache.values()) + size > limit
            ):
                self.boundary_cache.popitem(last=False)
            pending = np.empty((len(flat), 4), dtype=np.float32)
        if cached is not None:
            self.boundary_cache.move_to_end(key)
        for start in range(0, len(flat), 65_536):
            part = slice(start, min(start + 65_536, len(flat)))
            index = np.unravel_index(np.arange(part.start, part.stop), shape)
            points = np.column_stack([axis[pick] for axis, pick in zip(sample.centres, index)])
            if cached is None:
                distance, gradient = self.boundary.at(points)
                if pending is not None:
                    pending[part, 0], pending[part, 1:] = distance, gradient
                    distance, gradient = pending[part, 0], pending[part, 1:]
            else:
                distance, gradient = cached[part, 0], cached[part, 1:]
            vectors = self.wind.velocities(
                points, velocity(flat[part], self.result.channels), when, distance, gradient
            )
            for axis, name in enumerate(AXES):
                channel = f"velocity_{name}"
                if channel in self.result.channels:
                    column = self.result.channels.index(channel)
                    # 무효 유체의 NaN과 Inf는 유지하여 유효 셀로 바뀌지 않도록 처리
                    flat[part, column] = np.where(
                        valid[part], vectors[:, axis], np.where(solid[part], 0, flat[part, column])
                    )
        if pending is not None:
            self.boundary_cache[key] = pending
        return replace(sample, time=when, values=values)

    def field(self, frame, roi=None, max_cells=None):
        key = (frame, roi, max_cells)
        if key in self.cache:
            self.cache.move_to_end(key)
        else:
            self.cache[key] = Field(self.result.sample(frame, roi, None, max_cells), self.result.channels)
            while len(self.cache) > FIELDS:
                self.cache.popitem(last=False)
        field = self.cache[key]
        return field.with_wind(self.wind, self.boundary) if self.wind is not None else field

    def between(self, first, second, weight, roi=None, max_cells=None, time=None):
        before, after = self.field(first, roi, max_cells), self.field(second, roi, max_cells)
        field = before.towards(after, weight)
        return field.with_wind(self.wind, self.boundary, time) if time is not None else field

    def at(self, position, roi=None, max_cells=None, time=None):
        first = min(max(math.floor(position), 0), self.result.n_frames - 1)
        second = min(first + 1, self.result.n_frames - 1)
        weight = position - first if second != first else 0.0
        return self.between(
            first, second, weight, roi, max_cells, self.time_at(position) if time is None else time
        )

    def pair(self, position, roi=None, max_cells=None):
        """끝 프레임 이후는 같은 필드 두 개와 보간 비율 0 반환"""
        n_frames = self.result.n_frames
        frame = min(math.floor(position), n_frames - 1)
        first = self.field(frame, roi, max_cells)
        if frame + 1 >= n_frames:
            return first, first, 0.0
        return first, self.field(frame + 1, roi, max_cells), position - frame


class Particles:
    def __init__(self, count, seed=0):
        self.count, self.random_seed = count, seed
        self.random = np.random.default_rng(seed)
        self.points = self.tails = np.zeros((0, 3))
        self.age = np.zeros(0)

    def place(self, field, which, cells=None):
        if not len(which):
            return
        cells = np.argwhere(field.valid) if cells is None or not len(cells) else cells
        if not len(cells):
            return
        chosen = cells[self.random.integers(len(cells), size=len(which))]
        low = np.stack([edge[chosen[:, a]] for a, edge in enumerate(field.edges)], axis=1)
        high = np.stack([edge[chosen[:, a] + 1] for a, edge in enumerate(field.edges)], axis=1)
        self.points[which] = self.tails[which] = low + self.random.random((len(which), 3)) * (high - low)
        self.age[which] = 0

    def seed(self, field):
        self.random = np.random.default_rng(self.random_seed)
        self.points, self.tails = np.zeros((self.count, 3)), np.zeros((self.count, 3))
        self.age = np.zeros(self.count)
        self.place(field, np.arange(self.count))
        self.age = self.random.integers(LIFETIME, size=self.count).astype(np.float64)

    def advance(self, before, after, dt, frames=1.0, weights=(0.0, 1.0)):
        if len(self.points) != self.count:
            self.seed(before)
        fastest = max(before.fastest, after.fastest)
        # 건물 관통을 막도록 블록 한 칸 이하의 서브스텝으로 분할
        substeps = int(np.clip(np.ceil(fastest * dt / before.step.min()), 1, MAX_SUBSTEPS))
        h = dt / substeps

        def flow(points, fraction):
            if before is after:
                return before.velocity_at(points)
            ratio = weights[0] + fraction * (weights[1] - weights[0])
            if before.wind is not None:
                # RK 단계의 시간 보간은 입자 위치에서만 계산
                raw = before.interpolate(points, before.vectors)[0]
                if before.vectors is not after.vectors:
                    raw += ratio * (after.interpolate(points, after.vectors)[0] - raw)
                distance, gradient = before.boundary.at(points)
                vectors = before.wind.velocities(
                    points, raw, before.time + ratio * (after.time - before.time), distance, gradient
                )
                return np.where(before.fluid(points)[:, None], vectors, 0.0)
            return (1 - ratio) * before.velocity_at(points) + ratio * after.velocity_at(points)

        self.tails = self.points.copy()
        points = self.points
        for step in range(substeps):
            middle = points + 0.5 * h * flow(points, step / substeps)
            last = flow(middle, (step + 0.5) / substeps)
            moved = points + h * last
            # 양 끝이 유체여도 얇은 벽을 지날 수 있어 선분 전체 확인
            clear = before.clear_path(points, moved)
            points = np.where(clear[:, None], moved, points)
        self.points = points
        self.age += frames

        left = ~after.inside(points)
        # 영역 유출은 유입면, 무효 위치는 전체 유체 영역에 재배치
        if left.any():
            self.place(after, np.flatnonzero(left), after.inflow_cells())
        lost = ~left & (
            ~after.fluid(points) | (np.linalg.norm(last, axis=1) < STALLED) | (self.age > LIFETIME)
        )
        self.place(after, np.flatnonzero(lost))
