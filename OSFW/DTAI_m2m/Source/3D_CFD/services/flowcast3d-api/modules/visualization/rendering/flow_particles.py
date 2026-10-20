import itertools
import math
from collections import OrderedDict
from functools import cached_property

import numpy as np
import pyvista as pv
import vtk

from modules.domain.transport.boundary import clear_path
from modules.visualization.rendering.flow_paths import Interpolator
from modules.visualization.rendering.layers import FlowFocus

HISTORY = 7
MAX_STEP_SECONDS = 0.15
SEED_HISTORY_SECONDS = 0.25
MAX_CONTINUOUS_SECONDS = 1.0
LIFETIME_SECONDS = 40.0
VALUE = "flow_speed"


class RawField:
    """실제 셀 중심과 경계로 보간하는 읽기 전용 원본 프레임"""

    def __init__(self, sample, channels):
        self.sample, self.channels = sample, channels
        self.interpolator = Interpolator(sample, channels)
        self.valid, self.edges = sample.valid, sample.edges
        self.vectors, self.bounds = self.interpolator.vectors, self.interpolator.bounds
        self.step = min(float(np.diff(edge).min()) for edge in self.edges)
        self.maximum_speed = float(np.linalg.norm(self.vectors, axis=-1).max(initial=0.0))
        shape = self.valid.shape
        self.strides = np.array([shape[1] * shape[2], shape[2], 1])
        self.next = np.where(np.asarray(shape) > 1, self.strides, 0)

    def velocity_at(self, points, other=None, blend=0.0):
        first, weights = [], []
        for axis, centres in enumerate(self.sample.centres):
            if len(centres) == 1:
                first.append(np.zeros(len(points), dtype=np.int64))
                weights.append(np.zeros(len(points)))
                continue
            index = np.clip(np.searchsorted(centres, points[:, axis], side="right") - 1, 0, len(centres) - 2)
            first.append(index)
            weights.append(
                np.clip((points[:, axis] - centres[index]) / (centres[index + 1] - centres[index]), 0, 1)
            )
        base = first[0] * self.strides[0] + first[1] * self.strides[1] + first[2]
        shares = [(1 - weight, weight) for weight in weights]
        before = self.vectors.reshape(-1, 3)
        after = (
            other.vectors.reshape(-1, 3) if other is not None and other is not self and blend != 0 else None
        )
        output = np.zeros((len(points), 3), dtype=np.float64)
        for corner in itertools.product((0, 1), repeat=3):
            weight = shares[0][corner[0]] * shares[1][corner[1]] * shares[2][corner[2]]
            index = base + np.dot(corner, self.next)
            values = np.take(before, index, axis=0)
            if after is not None:
                values = values + blend * (np.take(after, index, axis=0) - values)
            output += weight[:, None] * values
        return output

    def clear_path(self, start, end):
        first, last = self.blocks(start), self.blocks(end)
        same = np.equal(np.asarray(first), np.asarray(last)).all(axis=0)
        inside = ((start >= self.bounds[0]) & (start <= self.bounds[1])).all(axis=1)
        inside &= ((end >= self.bounds[0]) & (end <= self.bounds[1])).all(axis=1)
        simple = same & inside
        result = np.zeros(len(start), dtype=bool)
        result[simple] = self.valid[tuple(axis[simple] for axis in first)]
        remaining = ~simple
        if remaining.any():
            result[remaining] = clear_path(self, start[remaining], end[remaining])
        return result

    def blocks(self, points):
        return tuple(
            np.clip(np.searchsorted(edge, points[:, axis], side="right") - 1, 0, len(edge) - 2)
            for axis, edge in enumerate(self.edges)
        )

    def fluid(self, points):
        return self.interpolator.fluid(points)

    @cached_property
    def focus(self):
        return FlowFocus(self.sample, self.channels)

    @cached_property
    def candidates(self):
        focus = self.focus
        return (
            np.flatnonzero(focus.usable & focus.building_region & (focus.important | focus.interesting)),
            np.flatnonzero(focus.usable & focus.building_region),
            np.flatnonzero(focus.usable),
        )


class FlowParticles:
    """RK2 위치와 최대 HISTORY개의 실제 과거 위치 보관"""

    def __init__(self, count, seed=0):
        self.count, self.random_seed = int(count), int(seed)
        self.random = np.random.default_rng(seed)
        self.points = self.tails = np.zeros((0, 3), dtype=np.float64)
        self.history = np.zeros((HISTORY, 0, 3), dtype=np.float64)
        self.history_speed = np.zeros((HISTORY, 0), dtype=np.float32)
        self.age, self.active = np.zeros(0), np.zeros(0, dtype=bool)

    def place(self, field, which):
        if not len(which):
            return
        turning, building, context = field.candidates
        self.active[which] = bool(len(context))
        if not len(context):
            self.points[which] = field.bounds.mean(axis=0)
            self.history[:, which] = self.points[which]
            self.history_speed[:, which] = 0.0
            self.age[which] = 0.0
            return
        turning = turning if len(turning) else building if len(building) else context
        building = building if len(building) else context
        # 난수는 배치에만 사용하며 속도와 방향은 원본 유지
        groups = self.random.random(len(which))
        chosen = np.empty(len(which), dtype=np.int64)
        for mask, candidates in (
            (groups < 0.2, turning),
            ((groups >= 0.2) & (groups < 0.9), building),
            (groups >= 0.9, context),
        ):
            chosen[mask] = candidates[self.random.integers(len(candidates), size=int(mask.sum()))]
        cells = np.column_stack(np.unravel_index(chosen, field.valid.shape))
        low = np.column_stack([edge[cells[:, axis]] for axis, edge in enumerate(field.edges)])
        high = np.column_stack([edge[cells[:, axis] + 1] for axis, edge in enumerate(field.edges)])
        self.points[which] = low + self.random.random((len(which), 3)) * (high - low)
        self.history[:, which] = self.points[which]
        speed = np.linalg.norm(field.velocity_at(self.points[which]), axis=1)
        self.history_speed[:, which] = speed
        self.age[which] = 0.0

    def seed(self, field):
        self.random = np.random.default_rng(self.random_seed)
        self.points = np.zeros((self.count, 3), dtype=np.float64)
        self.history = np.zeros((HISTORY, self.count, 3), dtype=np.float64)
        self.history_speed = np.zeros((HISTORY, self.count), dtype=np.float32)
        self.age, self.active = np.zeros(self.count), np.zeros(self.count, dtype=bool)
        self.place(field, np.arange(self.count))
        self.age = self.random.uniform(0.0, LIFETIME_SECONDS, self.count)
        self.tails = self.history[0].copy()

    def advance(self, before, after, dt, weights=(0.0, 1.0)):
        """반걸음과 그려질 선분 모두 고체 통과 검사"""
        if dt <= 0:
            return
        if len(self.points) != self.count:
            self.seed(before)
        if not self.active.any() and not len(after.candidates[2]):
            return
        maximum = max(before.maximum_speed, after.maximum_speed, 1e-12)
        maximum_step = min(MAX_STEP_SECONDS, 0.6 * min(before.step, after.step) / maximum)
        steps = max(1, int(np.ceil(dt / maximum_step)))
        h = dt / steps
        changing_mask = after is not before and not np.array_equal(before.valid, after.valid)

        def velocity(points, fraction):
            weight = weights[0] + fraction * (weights[1] - weights[0])
            return before.velocity_at(points, after, weight)

        for step in range(steps):
            points = self.points
            half = points + 0.5 * h * velocity(points, step / steps)
            vectors = velocity(half, (step + 0.5) / steps)
            moved = points + h * vectors
            allowed = (
                before.fluid(half)
                & after.fluid(moved)
                & before.clear_path(points, half)
                & before.clear_path(points, moved)
            )
            if changing_mask:
                allowed &= after.clear_path(points, half) & after.clear_path(points, moved)
            current_speed = np.linalg.norm(velocity(moved, (step + 1) / steps), axis=1)
            eligible = after.focus.usable[after.blocks(moved)]
            self.age += h
            lost = (
                ~allowed
                | ~eligible
                | ~self.active
                | ~np.isfinite(current_speed)
                | (current_speed < 1e-8)
                | (self.age >= LIFETIME_SECONDS)
            )
            self.points = moved
            self.history[:-1] = self.history[1:]
            self.history[-1] = moved
            self.history_speed[:-1] = self.history_speed[1:]
            self.history_speed[-1] = current_speed
            self.place(after, np.flatnonzero(lost))
        self.tails = self.history[0].copy()


class FlowParticleLayer:
    def __init__(self, scene, count, seed=0):
        self.scene, self.particles = scene, FlowParticles(count, seed)
        self.region = scene.flow_particle_region(scene.settings)
        self.cache = OrderedDict()
        self.position = self.seed_position = None
        self.discontinuities = []
        self.speed_range, self.fixed_range = (0.0, 1e-6), None
        self.lut = pv.LookupTable("turbo")
        self.lut.scalar_range = self.speed_range
        self.data = pv.PolyData(np.zeros((count, 3), dtype=np.float32))
        self.data.point_data[VALUE] = np.zeros(count, dtype=np.float32)
        self.data.point_data["rgba"] = np.zeros((count, 4), dtype=np.uint8)
        lines = np.column_stack(
            [np.full(count, HISTORY), np.arange(count * HISTORY, dtype=np.int64).reshape(count, HISTORY)]
        ).ravel()
        self.trail_data = pv.PolyData(np.zeros((count * HISTORY, 3), dtype=np.float32), lines=lines)
        self.trail_data.point_data[VALUE] = np.zeros(count * HISTORY, dtype=np.float32)
        self.trail_data.point_data["rgba"] = np.zeros((count * HISTORY, 4), dtype=np.uint8)
        self.actor, self.trail_actor = self._actor(self.data), self._actor(self.trail_data)
        self.actors = (self.actor, self.trail_actor)
        self.actor.prop.point_size = 1.55 * scene.scale
        self.actor.prop.render_points_as_spheres = True
        self.trail_actor.prop.line_width = max(1.0, 0.9 * scene.scale)
        self.actor.prop.lighting = self.trail_actor.prop.lighting = False
        self.set_speed_range(getattr(scene.settings.particles, "color_range", None))
        for actor in self.actors:
            scene.plotter.add_actor(actor, reset_camera=False, render=False)

    def _actor(self, data):
        mapper = vtk.vtkPolyDataMapper()
        mapper.SetInputData(data)
        mapper.SetScalarModeToUsePointFieldData()
        mapper.SelectColorArray("rgba")
        mapper.SetColorModeToDirectScalars()
        mapper.ScalarVisibilityOn()
        mapper.SetLookupTable(self.lut)
        mapper.SetUseLookupTableScalarRange(True)
        return pv.Actor(mapper=mapper)

    def _field(self, frame):
        frame = min(max(int(frame), 0), self.scene.result.n_frames - 1)
        if frame not in self.cache:
            roi, budget = self.region
            sample = self.scene.result.sample(frame, roi, None, budget)
            self.cache[frame] = RawField(sample, self.scene.result.channels)
            while len(self.cache) > 2:
                self.cache.popitem(last=False)
        else:
            self.cache.move_to_end(frame)
        field = self.cache[frame]
        if self.fixed_range is None:
            self.speed_range = (0.0, max(self.speed_range[1], field.maximum_speed, 1e-6))
            self.lut.scalar_range = self.speed_range
        return field

    def pair(self, position):
        first = min(max(math.floor(position), 0), self.scene.result.n_frames - 1)
        second = min(first + 1, self.scene.result.n_frames - 1)
        return self._field(first), self._field(second), position - first if second != first else 0.0

    def set_speed_range(self, limits):
        previous = self.speed_range
        if limits is not None:
            limits = tuple(float(value) for value in limits)
            if len(limits) != 2 or not np.isfinite(limits).all() or limits[0] >= limits[1]:
                raise ValueError("flow speed range must contain two finite increasing values")
            self.speed_range = limits
        self.fixed_range = limits
        if limits is None:
            self.speed_range = (
                0.0,
                max([self.speed_range[1], *[f.maximum_speed for f in self.cache.values()]]),
            )
        self.lut.scalar_range = self.speed_range
        if len(self.particles.points) and self.speed_range != previous:
            self.draw()

    def _time(self, position, time_step):
        result = self.scene.result
        first = min(max(math.floor(position), 0), result.n_frames - 1)
        step = result.times[first + 1] - result.times[first] if first + 1 < result.n_frames else time_step
        return float(result.times[first] + (position - first) * step)

    def _position(self, time, time_step):
        result = self.scene.result
        first = int(np.clip(np.searchsorted(result.times, time, side="right") - 1, 0, result.n_frames - 1))
        step = result.times[first + 1] - result.times[first] if first + 1 < result.n_frames else time_step
        return first + (time - result.times[first]) / step

    def seed(self, position, time_step):
        """실제 과거 0.25초까지 사용하며 같은 시각의 위치는 재현"""
        position = max(float(position), 0.0)
        earliest = float(self.scene.result.times[0])
        latest = float(self.scene.result.times[-1])
        target_time = self._time(position, time_step)
        start_time = max(earliest, target_time - SEED_HISTORY_SECONDS)
        # 단일 프레임과 마지막 프레임 이후에는 과거 궤적 생성 금지
        start = self._position(start_time, time_step) if target_time <= latest else position
        self.seed_position = self.position = start
        self.particles.seed(self.pair(start)[0])
        if position > start:
            self.advance(start, position, time_step)
        else:
            self.refresh(position)

    def advance(self, start, end, time_step):
        """프레임 경계마다 실제 시각 간격으로 적분"""
        if end < start:
            self.seed(end, time_step)
            return
        if self._time(end, time_step) - self._time(start, time_step) > MAX_CONTINUOUS_SECONDS:
            # 원격 렌더 지연을 긴 적분으로 따라잡지 않고 현재 시각에 재배치
            # 재배치 전후는 선으로 잇지 않음
            self.discontinuities.append((float(start), float(end)))
            self.seed(end, time_step)
            return
        if self.position is None or not math.isclose(self.position, start, abs_tol=1e-8):
            self.seed(start, time_step)
        cuts = [start, *range(math.floor(start) + 1, math.ceil(end)), end]
        for before, after in itertools.pairwise(cuts):
            if after <= before:
                continue
            first, second, phase = self.pair(before)
            span = after - before
            dt = self._time(after, time_step) - self._time(before, time_step)
            self.particles.advance(first, second, dt, (phase, phase + span))
        self.refresh(end)

    def refresh(self, position):
        self.position = float(position)
        if not len(self.particles.points):
            return
        first, second, weight = self.pair(position)
        vectors = first.velocity_at(self.particles.points, second, weight)
        self.particles.history_speed[-1] = np.linalg.norm(vectors, axis=1)
        self.draw()

    def _rgba(self, speeds, alpha):
        low, high = self.speed_range
        indices = np.clip((speeds - low) / (high - low) * (self.lut.n_values - 1), 0, self.lut.n_values - 1)
        rgba = np.asarray(self.lut.values)[indices.astype(np.int64)].copy()
        rgba[..., 3] = np.asarray(alpha, dtype=np.uint8)
        return rgba

    def draw(self):
        particles = self.particles
        self.data.points = (particles.points - self.scene.origin).astype(np.float32)
        self.data.point_data[VALUE] = particles.history_speed[-1]
        self.data.point_data["rgba"] = self._rgba(particles.history_speed[-1], 225 * particles.active)
        self.trail_data.points = (
            particles.history.transpose(1, 0, 2).reshape(-1, 3) - self.scene.origin
        ).astype(np.float32)
        speeds = particles.history_speed.T
        self.trail_data.point_data[VALUE] = speeds.ravel()
        fade = np.linspace(0, 90, HISTORY)[None, :] * particles.active[:, None]
        self.trail_data.point_data["rgba"] = self._rgba(speeds, fade).reshape(-1, 4)

    def close(self):
        for actor in self.actors:
            self.scene.plotter.remove_actor(actor, reset_camera=False, render=False)
        self.cache.clear()
