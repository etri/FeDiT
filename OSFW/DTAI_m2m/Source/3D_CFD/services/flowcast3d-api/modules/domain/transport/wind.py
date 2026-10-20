import math
from functools import lru_cache

import numpy as np


class Wind:
    """전체 결과의 고정 원점과 기준 풍속을 공유하는 표시용 바람"""

    def __init__(self, settings, origin, reference_speed):
        self.enabled = bool(settings.enabled)
        self.intensity = max(0.0, float(settings.intensity))
        self.gust = float(np.clip(settings.gust, 0.0, 1.0))
        self.time_scale = float(settings.time_scale)
        self.length_scale = float(settings.length_scale)
        self.reference_speed = max(0.0, float(reference_speed))
        self.origin = np.asarray(origin, dtype=np.float64).copy()
        parameters = [self.intensity, self.gust, self.time_scale, self.length_scale, self.reference_speed]
        if not np.isfinite(parameters).all() or self.time_scale <= 0 or self.length_scale <= 0:
            raise ValueError("dynamic wind requires finite values and positive time/length scales")
        if self.origin.shape != (3,) or not np.isfinite(self.origin).all():
            raise ValueError("dynamic wind origin must contain three finite coordinates")
        self.seed = int(settings.seed) & ((1 << 64) - 1)
        random = np.random.default_rng(self.seed)

        wave = random.normal(size=(9, 3))
        wave /= np.linalg.norm(wave, axis=1)[:, None]
        direction = random.normal(size=(9, 3))
        direction -= (direction * wave).sum(axis=1)[:, None] * wave
        direction /= np.linalg.norm(direction, axis=1)[:, None]
        octave = np.repeat([1.0, 2.0, 4.0], 3)
        magnitude = 2 * np.pi * octave / self.length_scale
        self.wave = wave * magnitude[:, None]
        weights = octave ** (-1 / 3)
        weights *= self.intensity * self.reference_speed / np.sqrt(0.5 * np.square(weights).sum())
        self.potential = direction * (weights / magnitude)[:, None]
        self.curl = -np.cross(self.wave, self.potential)
        self.phase = random.uniform(0, 2 * np.pi, len(wave))
        self.frequency = random.uniform(0.5, 1.5, len(wave)) * np.sqrt(octave) / self.time_scale
        self.frequency *= random.choice([-1, 1], len(wave))
        self.wall_width = 0.2 * self.length_scale
        self._weights = weights
        self._magnitude = magnitude
        self._knot = lru_cache(maxsize=128)(self._ou_knot)

    def _uniform(self, indices, stream=0):
        """호출 순서와 무관한 열린 구간 (0, 1)의 난수"""
        values = np.asarray(indices, dtype=np.int64).view(np.uint64)
        # SplitMix64의 uint64 오버플로는 의도한 나머지 연산
        with np.errstate(over="ignore"):
            values = (
                values + np.uint64(self.seed) + np.uint64((stream * 0xD1342543DE82EF95) & ((1 << 64) - 1))
            )
            values = values + np.uint64(0x9E3779B97F4A7C15)
            values = (values ^ (values >> np.uint64(30))) * np.uint64(0xBF58476D1CE4E5B9)
            values = (values ^ (values >> np.uint64(27))) * np.uint64(0x94D049BB133111EB)
            values = values ^ (values >> np.uint64(31))
        return ((values >> np.uint64(11)).astype(np.float64) + 0.5) / 2**53

    def _ou_knot(self, tick):
        lag = np.arange(48)
        indices = tick - lag
        normal = np.sqrt(-2 * np.log(self._uniform(indices, 1))) * np.cos(
            2 * np.pi * self._uniform(indices, 2)
        )
        rho = math.exp(-0.25)
        weights = rho**lag
        return float(np.dot(normal, weights) / np.sqrt(np.square(weights).sum()))

    def gain(self, time):
        """양수 풍속 배율 [1 - 0.55 * gust, 1 + gust]의 표시용 OU 근사"""
        if not self.enabled or self.gust == 0:
            return 1.0
        time = float(time)
        if not math.isfinite(time):
            raise ValueError("dynamic wind time must be finite")
        position = 4 * time / self.time_scale
        tick = math.floor(position)
        fraction = position - tick
        blend = fraction * fraction * (3 - 2 * fraction)
        noise = (1 - blend) * self._knot(tick) + blend * self._knot(tick + 1)

        cycle = time / (6 * self.time_scale)
        event = math.floor(cycle)
        phase = cycle - event
        centre = 0.35 + 0.3 * float(self._uniform(event, 3))
        half_width = 0.12 + 0.06 * float(self._uniform(event, 4))
        offset = (phase - centre) / half_width
        pulse = 0.5 * (1 + math.cos(math.pi * offset)) if abs(offset) < 1 else 0.0
        pulse *= 0.6 + 0.4 * float(self._uniform(event, 5))
        return 1 + self.gust * (0.55 * math.tanh(noise) + 0.45 * pulse)

    def speed_bound(self, speed, wall_gradient_bound=1.0):
        """입자 적분에 쓸 속력 및 성분의 보수적 상한(m/s)"""
        if not self.enabled:
            return float(speed)
        # quintic smoothstep의 최대 도함수는 1.875
        boundary = 1.875 * max(0.0, wall_gradient_bound) / (self.wall_width * self._magnitude)
        return (1 + self.gust) * float(speed) + float(np.sum(self._weights * (1 + boundary)))

    def velocities(self, points, velocity, time, wall_distance=None, wall_gradient=None):
        """세계 좌표 [..., 3]의 속도 보정이며 원본 배열은 유지"""
        original = np.asarray(velocity)
        if not self.enabled:
            return original.copy()
        positions = np.asarray(points, dtype=np.float64)
        if positions.shape != original.shape or positions.shape[-1:] != (3,):
            raise ValueError("dynamic wind points and velocities must have matching [..., 3] shapes")
        time = float(time)
        if not math.isfinite(time):
            raise ValueError("dynamic wind time must be finite")
        dtype = np.result_type(original.dtype, np.float32)
        result = original.astype(dtype, copy=True) * self.gain(time)
        if self.intensity == 0 or self.reference_speed == 0 or not original.size:
            return result
        positions = (positions - self.origin).reshape(-1, 3)
        residual = np.zeros_like(positions)
        potential = (
            np.zeros_like(positions) if wall_distance is not None and wall_gradient is not None else None
        )
        for wave, curl, vector, phase, frequency in zip(
            self.wave, self.curl, self.potential, self.phase, self.frequency
        ):
            angle = positions[:, 0] * wave[0] + positions[:, 1] * wave[1] + positions[:, 2] * wave[2]
            angle += phase + frequency * time
            residual += np.sin(angle)[:, None] * curl
            if potential is not None:
                potential += np.cos(angle)[:, None] * vector
        if wall_distance is not None:
            distance = np.broadcast_to(wall_distance, original.shape[:-1]).reshape(-1)
            fraction = np.clip(distance / self.wall_width, 0.0, 1.0)
            fade = fraction**3 * (10 + fraction * (-15 + 6 * fraction))
            residual *= fade[:, None]
            if potential is not None:
                gradient = np.broadcast_to(wall_gradient, original.shape).reshape(-1, 3)
                derivative = 30 * fraction**2 * (1 - fraction) ** 2 / self.wall_width
                residual += np.cross(derivative[:, None] * gradient, potential)
        result += residual.reshape(original.shape).astype(dtype, copy=False)
        return result
