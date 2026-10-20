"""저장 농도와 일치하는 입자 수송 궤적을 표시 자산으로 준비"""

import hashlib
import inspect
import json
import math
import os
import time
from pathlib import Path

import numpy as np

from modules.domain.transport import plume as physics
from modules.visualization.readers.uniform import Uniform
from modules.visualization.scenes.dispersion import MAX_CELLS, MAX_WIND_FRAMES, WindFields

SCHEMA = "flowcast.particle-paths/1"
FORMAT = "float32-xyz-t-xyz-t-id/1"
MAX_SEGMENTS = 200_000
MAX_PATHS = 128
MAX_SECONDS = 120
MAX_INPUT_BYTES = 512 << 20
# 수송 알고리즘 변경 시 갱신하며 파일 이동은 캐시 세대에 반영하지 않음
IMPLEMENTATION_VERSION = "50071c0c687226bfd8bbc86ca67a017e712c7e444bd80caef20fa977474f0a70"


def _method_version():
    return hashlib.sha256(
        inspect.getsource(physics.Plume).encode()
        + inspect.getsource(physics.Deposit).encode()
        + inspect.getsource(physics.diffusivity).encode()
    ).hexdigest()[:16]


def _check(deadline):
    if time.monotonic() >= deadline:
        raise RuntimeError("Particle trajectory preparation exceeded its time limit.")


def _fingerprint(reader, deadline):
    """실제 수치 입력 내용으로 재사용 세대를 구분"""
    metadata = {
        "shape": list(reader.array.shape),
        "origin": reader.origin.tolist(),
        "spacing": reader.spacing.tolist(),
        "times": reader.times.tolist(),
        "channels": reader.channels,
        "units": reader.units,
        "association": reader.association,
        "boundaryConditions": reader.boundary_conditions,
        "provenance": reader.provenance,
    }
    digest = hashlib.sha256(json.dumps(metadata, sort_keys=True, allow_nan=False).encode())
    arrays = [
        ("flow", reader.array),
        *(
            (key, getattr(reader, key))
            for key in ("building", "fluid", "valid")
            if getattr(reader, key) is not None
        ),
    ]
    size = sum(math.prod(array.shape) * np.dtype(array.dtype).itemsize for _, array in arrays)
    if size > MAX_INPUT_BYTES:
        raise ValueError("Particle trajectory input exceeds the 512 MiB limit.")
    for name, array in arrays:
        digest.update(name.encode())
        digest.update(np.dtype(array.dtype).str.encode())
        digest.update(json.dumps(list(array.shape)).encode())
        # 논리 Mongo 저장소와 로컬 배열 모두 읽기 전용 작은 블록으로 해시
        for index in range(array.shape[0]):
            _check(deadline)
            if name != "flow":
                digest.update(np.asarray(array[index]).tobytes(order="C"))
                continue
            row_bytes = math.prod(array.shape[2:]) * np.dtype(array.dtype).itemsize
            width = max(1, (4 << 20) // max(1, row_bytes))
            for offset in range(0, array.shape[1], width):
                _check(deadline)
                digest.update(np.asarray(array[index, offset : offset + width]).tobytes(order="C"))
    return digest.hexdigest()


class _MoveField:
    """원본 이동의 유출 마스크를 변경 없이 기록"""

    def __init__(self, field):
        self.field, self.kept, self.positions = field, None, None

    def __getattr__(self, name):
        return getattr(self.field, name)

    def inside(self, points):
        self.positions = points
        self.kept = self.field.inside(points)
        return self.kept


class _RecordedPlume(physics.Plume):
    """원본 난수와 모든 입자를 유지하며 대표 입자의 승인된 이동을 기록"""

    def __init__(self, source, floor, seed, duration, deadline):
        super().__init__(source, floor=floor, seed=seed, transport="dispersion")
        self.identities = np.zeros(0, dtype=np.int64)
        self.next_identity, self.clock, self.duration = 0, 0.0, duration
        self.sample_every = max(1, math.ceil(physics.RATE * duration / MAX_PATHS))
        self.records = np.empty((MAX_SEGMENTS, 9), dtype="<f4")
        self.count, self.deadline = 0, deadline
        self.routes = {}

    def _record(self, identity, route, before, after, bounds):
        if identity % self.sample_every or len(route) < 2:
            return
        route = np.asarray(route, dtype=np.float64)
        lengths = np.linalg.norm(np.diff(route, axis=0), axis=1)
        total = float(lengths.sum())
        if not total:
            return
        fractions = np.concatenate([[0.0], np.cumsum(lengths) / total])
        timestamps = np.minimum(self.duration, before + (after - before) * fractions)
        for index, length in enumerate(lengths):
            if not length:
                continue
            start, end = route[index], route[index + 1]
            first, last = 0.0, 1.0
            delta = end - start
            # 영역을 떠나는 마지막 선분은 실제 경계 교점까지만 표시
            for axis in range(3):
                if abs(delta[axis]) < 1e-15:
                    if start[axis] < bounds[0, axis] or start[axis] > bounds[1, axis]:
                        last = -1.0
                        break
                else:
                    entry, exit_ = sorted(
                        (
                            (bounds[0, axis] - start[axis]) / delta[axis],
                            (bounds[1, axis] - start[axis]) / delta[axis],
                        )
                    )
                    first, last = max(first, entry), min(last, exit_)
            if first > last:
                continue
            if self.count >= MAX_SEGMENTS:
                raise ValueError("Particle trajectories exceed the 200000-segment limit.")
            t0, t1 = timestamps[index : index + 2]
            self.records[self.count] = [
                *(start + first * delta),
                t0 + first * (t1 - t0),
                *(start + last * delta),
                t0 + last * (t1 - t0),
                identity,
            ]
            self.count += 1

    def move(self, field, eddy, h, velocity=None):
        _check(self.deadline)
        if not len(self.points):
            return super().move(field, eddy, h, velocity=velocity)
        previous, identities = self.points.copy(), self.identities.copy()
        self.routes = {}
        proxy = _MoveField(field)
        super().move(proxy, eddy, h, velocity=velocity)
        kept = proxy.kept
        if kept is None or len(kept) != len(identities):
            raise RuntimeError("Particle trajectory identity tracking failed.")
        for old_index in np.flatnonzero(identities % self.sample_every == 0):
            identity = int(identities[old_index])
            route = (
                self.routes[identity]
                if identity in self.routes
                else [previous[old_index], proxy.positions[old_index]]
            )
            self._record(identity, route, self.clock, self.clock + h, field.bounds)
        self.identities = identities[kept]

    def detour(self, field, start, step, blocked):
        moved = super().detour(field, start, step, blocked)
        identities = self.identities[blocked]
        selected = np.flatnonzero(identities % self.sample_every == 0)
        if not len(selected):
            return moved
        sides, climbs = self.sides[blocked][selected], self.climbs[blocked][selected]
        start, step = start[selected], step[selected]
        routes = [[point.copy()] for point in start]
        column = field.blocks(start + step)[:2]
        over = field.tops[column] - start[:, 2] <= climbs
        slid = start.copy()
        for axis in (2, 0, 1):
            trial = slid.copy()
            trial[:, axis] += step[:, axis]
            free = field.clear_path(slid, trial)
            slid[free] = trial[free]
            for index in range(len(selected)):
                if free[index]:
                    routes[index].append(slid[index].copy())
        distance = np.hypot(*(start + step - slid)[:, :2].T)
        heading = step[:, :2] / np.maximum(np.hypot(*step[:, :2].T), 1e-12)[:, None]
        aside, up = slid.copy(), slid.copy()
        aside[:, 0] -= sides * heading[:, 1] * distance
        aside[:, 1] += sides * heading[:, 0] * distance
        up[:, 2] += distance
        first, second = np.where(over[:, None], up, aside), np.where(over[:, None], aside, up)
        endpoints = np.where(
            field.clear_path(slid, first)[:, None],
            first,
            np.where(field.clear_path(slid, second)[:, None], second, slid),
        )
        if not np.array_equal(endpoints, moved[selected]):
            raise RuntimeError("Particle trajectory obstacle route does not match particle transport.")
        for index, selected_index in enumerate(selected):
            routes[index].append(endpoints[index].copy())
            self.routes[int(identities[selected_index])] = routes[index]
        return moved

    def emit(self, field, h, wind=None):
        _check(self.deadline)
        count = int(self.carry + physics.RATE * h)
        emitted = bool(count and field.inside(self.source[None])[0] and field.fluid(self.source[None])[0])
        super().emit(field, h, wind=wind)
        self.clock += h
        if emitted:
            born = np.arange(self.next_identity, self.next_identity + count, dtype=np.int64)
            self.next_identity += count
            self.identities = np.concatenate([self.identities, born])[-physics.CAPACITY :]
            if len(self.identities) != len(self.points):
                raise RuntimeError("Particle trajectory emission tracking failed.")
            retained = min(count, len(self.points))
            for identity, point in zip(self.identities[-retained:], self.points[-retained:]):
                self._record(int(identity), [self.source, point], self.clock, self.clock, field.bounds)


def _validate(reader, wind):
    provenance = reader.provenance
    if not isinstance(provenance, dict) or provenance.get("kind") != "virtual_particle_transport":
        raise ValueError("Particle trajectories require recorded particle-transport provenance.")
    if provenance.get("methodVersion") != _method_version():
        raise ValueError("Particle trajectory method does not match the recorded result.")
    expected = {
        "emissionGramsPerSecond": physics.EMISSION,
        "particleRatePerSecond": physics.RATE,
        "particleCapacity": physics.CAPACITY,
        "smoothingPasses": physics.PASSES,
    }
    if any(provenance.get(key) != value for key, value in expected.items()):
        raise ValueError("Particle trajectory parameters do not match the recorded result.")
    if (
        reader.association != "cell"
        or reader.channels != ["concentration"]
        or reader.units.get("concentration") != "µg/m3"
        or not reader.time_known
        or reader.array.dtype.kind != "f"
        or reader.array.dtype.itemsize != 4
        or not 2 <= len(reader.times) <= 361
        or math.prod(reader.shape) > MAX_CELLS
    ):
        raise ValueError("Particle trajectories require a bounded native concentration grid in µg/m3.")
    duration, step = provenance.get("durationSeconds"), provenance.get("stepSeconds")
    if (
        type(duration) not in {int, float}
        or type(step) not in {int, float}
        or not math.isfinite(duration)
        or not math.isfinite(step)
        or not 1 <= duration <= 3600
        or not 0.1 <= step <= 60
        or math.ceil(duration / step) > 360
    ):
        raise ValueError("Particle trajectory duration or time step is invalid.")
    times = np.append(np.arange(0, duration, step), duration)
    if not np.array_equal(times, reader.times):
        raise ValueError("Particle trajectory times do not match the recorded result.")
    seed, point = provenance.get("seed"), np.asarray(provenance.get("source"), dtype=np.float64)
    if type(seed) is not int or not 0 <= seed < 2**32 or point.shape != (3,) or not np.isfinite(point).all():
        raise ValueError("Particle trajectory seed or source is invalid.")
    grid = provenance.get("grid") or {}
    if (
        grid.get("shape") != list(reader.shape)
        or grid.get("origin") != reader.origin.tolist()
        or grid.get("spacing") != reader.spacing.tolist()
    ):
        raise ValueError("Particle trajectory grid does not match the recorded result.")
    if (
        wind.association != "cell"
        or not wind.coordinates_known
        or not 1 <= len(wind.times) <= MAX_WIND_FRAMES
        or any(
            channel not in wind.channels or wind.units.get(channel) != "m/s"
            for channel in (f"velocity_{axis}" for axis in "xyz")
        )
    ):
        raise ValueError("Particle trajectories require the original uniform wind field in m/s.")
    start = provenance.get("windStartFrame")
    if (
        type(start) is not int
        or not 0 <= start < len(wind.times)
        or provenance.get("windStartTime") != float(wind.times[start])
    ):
        raise ValueError("Particle trajectory wind start does not match the recorded result.")
    floor = wind.origin[2] if wind.boundary_conditions.get("z", [""])[0] == "wall" else None
    if provenance.get("floorReflection") is not (floor is not None):
        raise ValueError("Particle trajectory floor condition does not match the recorded result.")
    return provenance, point, float(duration), start, floor


def _cached(root, key):
    manifest = root / f"{key}.json"
    if manifest.is_symlink() or not manifest.is_file():
        return None
    try:
        if manifest.stat().st_size > 1 << 20:
            return None
        result = json.loads(manifest.read_text())
        asset = result["assets"][0]
        metadata = result["particlePaths"]
        if (
            metadata.get("schema") != SCHEMA
            or metadata.get("verified") is not True
            or metadata.get("verification") != "all-concentration-frames-equal"
            or asset.get("kind") != "trajectories"
            or asset.get("format") != FORMAT
            or asset.get("stride") != 9
            or type(asset.get("count")) is not int
            or not 0 <= asset["count"] <= MAX_SEGMENTS
            or asset["byteLength"] != asset["count"] * 36
        ):
            return None
        name = asset["filename"]
        if name != f"{asset['sha256']}.bin" or len(asset["sha256"]) != 64:
            return None
        path = root / name
        if path.is_symlink() or not path.is_file() or path.parent != root:
            return None
        if (
            path.stat().st_size != asset["byteLength"]
            or asset["count"] > MAX_SEGMENTS
            or hashlib.sha256(path.read_bytes()).hexdigest() != asset["sha256"]
        ):
            return None
        return result
    except (ValueError, TypeError, KeyError, IndexError, OSError):
        return None


def _publish(path, content):
    if path.is_symlink():
        raise ValueError("Particle trajectory cache cannot contain symbolic links.")
    temporary = path.with_suffix(f".{os.getpid()}.partial")
    try:
        temporary.write_bytes(content)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def scene(reader, selection, asset_root, context):
    """모든 원본 농도 프레임을 검증한 수송 궤적만 원자적으로 게시"""
    deadline = time.monotonic() + MAX_SECONDS
    source = reader.source.get("geometrySource")
    if not source:
        raise ValueError("Particle trajectories require the original saved wind source.")
    wind = Uniform(source)
    provenance, point, duration, start, floor = _validate(reader, wind)
    frame = selection.get("frame", 0)
    if type(frame) is not int or not 0 <= frame < len(reader.times):
        raise ValueError("Frame is outside the completed time range.")
    root = Path(asset_root)
    root.mkdir(parents=True, exist_ok=True)
    fingerprint = {"concentration": _fingerprint(reader, deadline), "wind": _fingerprint(wind, deadline)}
    key = hashlib.sha256(
        json.dumps(
            {
                "schema": SCHEMA,
                "context": context,
                "selection": selection,
                "provenance": provenance,
                "inputs": fingerprint,
                "implementation": IMPLEMENTATION_VERSION,
                "maxPaths": MAX_PATHS,
                "maxSegments": MAX_SEGMENTS,
            },
            sort_keys=True,
            allow_nan=False,
        ).encode()
    ).hexdigest()
    cached = _cached(root, key)
    if cached is not None:
        return cached
    grid = provenance["grid"]
    fields = WindFields(
        wind, {"dimensions": grid["shape"], "origin": grid["origin"], "spacing": grid["spacing"]}
    )
    first = fields.frame(start)
    if not first.inside(point[None])[0] or not first.fluid(point[None])[0]:
        raise ValueError("Particle trajectory source is blocked on the recorded grid.")
    eddy = physics.diffusivity(
        (fields.frame(index) for index in range(start, len(wind.times))), floor is not None
    )
    plume = _RecordedPlume(point, floor, provenance["seed"], duration, deadline)
    deposit = physics.Deposit(first)
    mass = physics.EMISSION * 1e6 / physics.RATE
    start_time = provenance["windStartTime"]
    for index, timestamp in enumerate(reader.times):
        _check(deadline)
        if index:
            previous = float(reader.times[index - 1])
            cuts = [
                previous,
                *[
                    float(value - start_time)
                    for value in wind.times
                    if previous < value - start_time < timestamp
                ],
                float(timestamp),
            ]
            for before, after in zip(cuts, cuts[1:]):
                plume.advance(fields.at(start_time + (before + after) / 2), eddy, after - before)
        replayed = deposit.concentration(plume.points, mass, passes=physics.PASSES)
        saved = np.asarray(reader.array[index, ..., 0])
        if replayed.astype(saved.dtype, copy=False).tobytes(order="C") != saved.tobytes(order="C"):
            raise ValueError(f"Particle trajectory replay differs from saved concentration at frame {index}.")
        if reader.building is not None and not np.array_equal(~deposit.fluid, reader.building):
            raise ValueError("Particle trajectory validity mask differs from the recorded result.")
    _check(deadline)
    records = plume.records[: plume.count]
    if not np.isfinite(records).all():
        raise ValueError("Particle trajectories contain invalid values.")
    content = records.tobytes()
    checksum = hashlib.sha256(content).hexdigest()
    values, valid = reader.scalar(frame, reader.region(None), "concentration")
    if not valid.any():
        raise ValueError("Concentration result contains no finite fluid cells.")
    data_range = [float(values[valid].min()), float(values[valid].max())]
    field = {key: value for key, value in reader.field("concentration").items() if key != "sourceName"}
    metadata = {
        key: provenance.get(key)
        for key in ("source", "sourceDatasetId", "sourceResultId", "sourceVersion", "methodVersion", "seed")
    }
    metadata.update(
        schema=SCHEMA,
        datasetId=selection["datasetId"],
        resultId=selection.get("resultId"),
        times=reader.times.tolist(),
        verified=True,
        verification="all-concentration-frames-equal",
        interpretation="Deterministic replay of the recorded particle transport; representative paths.",
        timestampInterpretation="Integration substep endpoints; detour legs use distance-based display "
        "interpolation; emission initialization uses equal endpoint times.",
    )
    result = {
        "origin": reader.bounds[0],
        "bounds": reader.bounds,
        "field": field,
        "range": selection.get("colorRange") or data_range,
        "dataRange": data_range,
        "time": float(reader.times[frame]),
        "particlePaths": metadata,
        "grid": {
            "origin": reader.origin.tolist(),
            "spacing": reader.spacing.tolist(),
            "dimensions": list(reader.shape),
        },
        "warnings": [],
        "assets": [
            {
                "kind": "trajectories",
                "format": FORMAT,
                "stride": 9,
                "count": plume.count,
                "filename": f"{checksum}.bin",
                "sha256": checksum,
                "byteLength": len(content),
            }
        ],
    }
    _publish(root / f"{checksum}.bin", content)
    _publish(root / f"{key}.json", json.dumps(result, allow_nan=False).encode())
    return result
