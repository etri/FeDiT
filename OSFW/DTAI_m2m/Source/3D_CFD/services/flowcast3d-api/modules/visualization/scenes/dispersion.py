import hashlib
import inspect
import json
import math
from collections import OrderedDict
from pathlib import Path

import numpy as np

from modules.visualization.readers.uniform import Uniform

MAX_CELLS = 262144
MAX_WIND_FRAMES = 361


def _progress(control, current, total):
    base = Path(control)
    if base.with_suffix(".cancel").exists():
        raise RuntimeError("Dispersion calculation was cancelled.")
    temporary = base.with_suffix(".partial")
    temporary.write_text(json.dumps({"stage": "simulating", "current": current, "total": total}))
    temporary.replace(base.with_suffix(".json"))


class WindFields:
    def __init__(self, reader, grid=None):
        from modules.domain.transport.particles import Field
        from modules.visualization.readers.adapter import Sample

        self.reader, self.Field, self.Sample = reader, Field, Sample
        self.cache = OrderedDict()
        stride = max(1, math.ceil((math.prod(reader.cell_shape) / MAX_CELLS) ** (1 / 3)))
        shape = np.maximum(1, np.ceil(np.asarray(reader.cell_shape) / stride).astype(int))
        while math.prod(shape) > MAX_CELLS:
            stride += 1
            shape = np.maximum(1, np.ceil(np.asarray(reader.cell_shape) / stride).astype(int))
        low, high = np.asarray(reader.bounds)
        if grid is not None:
            shape = np.asarray(grid["dimensions"], dtype=np.int64)
            origin, spacing = (
                np.asarray(grid["origin"], dtype=np.float64),
                np.asarray(grid["spacing"], dtype=np.float64),
            )
            if (
                shape.shape != (3,)
                or origin.shape != (3,)
                or spacing.shape != (3,)
                or np.any(shape < 1)
                or math.prod(shape) > MAX_CELLS
                or np.any(spacing <= 0)
                or not np.isfinite(origin).all()
                or not np.isfinite(spacing).all()
            ):
                raise ValueError("Shared simulation grid is invalid or exceeds the 262144-cell limit.")
            target_high = origin + spacing * shape
            tolerance = np.maximum(reader.spacing, spacing) * 1e-6
            if np.any(origin < low - tolerance) or np.any(target_high > high + tolerance):
                raise ValueError("Wind source does not cover the shared simulation grid.")
            low, high = origin, target_high
        self.edges = [np.linspace(low[axis], high[axis], int(shape[axis]) + 1) for axis in range(3)]
        self.centres = [(axis[:-1] + axis[1:]) / 2 for axis in self.edges]
        self.indices = [
            np.clip(
                np.floor((centres - reader.origin[axis]) / reader.spacing[axis]).astype(int),
                0,
                reader.cell_shape[axis] - 1,
            )
            for axis, centres in enumerate(self.centres)
        ]
        self.stride = stride

    def _take(self, array, frame=None):
        if hasattr(array, "oindex"):
            prefix = () if frame is None else (frame,)
            suffix = () if frame is None else (slice(None),)
            return np.asarray(array.oindex[(*prefix, *self.indices, *suffix)])
        x, y, z = np.ix_(*self.indices)
        return np.asarray(array[x, y, z] if frame is None else array[frame, x, y, z, :])

    def frame(self, index):
        if index not in self.cache:
            values = self._take(self.reader.array, index).astype(np.float32)
            valid = np.isfinite(values).all(axis=-1)
            for attribute, invert in (("building", True), ("fluid", False), ("valid", False)):
                mask = getattr(self.reader, attribute)
                if mask is not None:
                    sample = self._take(mask)
                    valid &= sample == 0 if invert else sample.astype(bool)
            sample = self.Sample(
                frame=index,
                time=float(self.reader.times[index]),
                predicted=True,
                stride=self.stride,
                values=values,
                solid=~valid,
                edges=self.edges,
                centres=self.centres,
            )
            self.cache[index] = self.Field(sample, self.reader.channels)
        self.cache.move_to_end(index)
        while len(self.cache) > 4:
            self.cache.popitem(last=False)
        return self.cache[index]

    def at(self, time):
        times = self.reader.times
        after = int(np.searchsorted(times, time, side="right"))
        before = max(0, min(len(times) - 1, after - 1))
        if after >= len(times) or after == 0:
            return self.frame(before)
        weight = float((time - times[before]) / (times[after] - times[before]))
        return self.frame(before).towards(self.frame(after), weight)


def simulate(params):
    """기존 입자 수송과 질량 침적으로 가상 농도 시계열 생성"""
    from modules.domain.transport import plume as physics

    reader = Uniform(params["source"])
    if (
        reader.association != "cell"
        or not reader.coordinates_known
        or not len(reader.times)
        or any(
            f"velocity_{axis}" not in reader.channels or reader.units.get(f"velocity_{axis}") != "m/s"
            for axis in "xyz"
        )
    ):
        raise ValueError(
            "Dispersion requires a uniform cell velocity field in m/s with confirmed coordinates."
        )
    if len(reader.times) > MAX_WIND_FRAMES:
        raise ValueError("Dispersion wind input exceeds the 361-frame limit.")
    if not reader.time_known and len(reader.times) > 1:
        raise ValueError("Dispersion requires physical time values for multiple wind frames.")
    request = params["selection"]
    start_frame = (
        reader.store.history_frames if reader.store and reader.store.history_frames < len(reader.times) else 0
    )
    start_time = float(reader.times[start_frame])
    point = np.asarray(request["source"], dtype=np.float64)
    if not np.isfinite(point).all() or reader.probe("speed", point, start_frame) is None:
        raise ValueError("Dispersion source must be inside a finite fluid cell.")
    fields = WindFields(reader, params.get("simulationGrid"))
    first = fields.frame(start_frame)
    if not first.inside(point[None])[0] or not first.fluid(point[None])[0]:
        raise ValueError(
            "Dispersion source is blocked on the simulation grid. Choose another fluid location."
        )
    floor = reader.origin[2] if reader.boundary_conditions.get("z", [""])[0] == "wall" else None
    eddy = physics.diffusivity(
        (fields.frame(index) for index in range(start_frame, len(reader.times))), floor is not None
    )
    plume = physics.Plume(point, floor=floor, seed=request.get("seed", 0), transport="dispersion")
    deposit = physics.Deposit(first)
    duration, step = float(request["durationSeconds"]), float(request["stepSeconds"])
    times = np.append(np.arange(0, duration, step), duration)
    if len(times) > 361:
        raise ValueError("Dispersion output exceeds the 361-frame limit.")
    directory = Path(params["directory"])
    directory.mkdir(parents=True, exist_ok=True)
    concentration_path = directory / "concentration.npy"
    array = np.lib.format.open_memmap(
        concentration_path,
        mode="w+",
        dtype=np.float32,
        shape=(len(times), *(int(value) for value in deposit.dims)),
    )
    mass = physics.EMISSION * 1e6 / physics.RATE
    for index, timestamp in enumerate(times):
        _progress(params["control"], index, len(times))
        if index:
            previous = float(times[index - 1])
            # 원본 풍장 시각 경계에서 적분 구간 분할
            cuts = [
                previous,
                *[
                    float(value - start_time)
                    for value in reader.times
                    if previous < value - start_time < timestamp
                ],
                float(timestamp),
            ]
            for before, after in zip(cuts, cuts[1:]):
                plume.advance(fields.at(start_time + (before + after) / 2), eddy, after - before)
        array[index] = deposit.concentration(plume.points, mass, passes=physics.PASSES)
    array.flush()
    del array
    np.save(directory / "building_mask.npy", ~deposit.fluid, allow_pickle=False)
    np.save(directory / "time.npy", times, allow_pickle=False)
    origin, spacing = deposit.low.tolist(), deposit.spacing.tolist()
    version = hashlib.sha256(
        inspect.getsource(physics.Plume).encode()
        + inspect.getsource(physics.Deposit).encode()
        + inspect.getsource(physics.diffusivity).encode()
    ).hexdigest()[:16]
    provenance = {
        "kind": "virtual_particle_transport",
        "method": "existing Plume, Deposit and diffusivity",
        "methodVersion": version,
        "sourceDatasetId": request["datasetId"],
        "sourceResultId": request.get("resultId"),
        "sourceVersion": params["sourceVersion"],
        "emissionGramsPerSecond": physics.EMISSION,
        "particleRatePerSecond": physics.RATE,
        "particleCapacity": physics.CAPACITY,
        "seed": request.get("seed", 0),
        "source": point.tolist(),
        "durationSeconds": duration,
        "stepSeconds": step,
        "grid": {"origin": origin, "spacing": spacing, "shape": deposit.dims.tolist()},
        "windSampling": "nearest source cell on a bounded uniform grid",
        "windStartTime": start_time,
        "windStartFrame": start_frame,
        "windTimeInterpolation": "linear; final frame held after the recorded interval",
        "floorReflection": floor is not None,
        "smoothingPasses": physics.PASSES,
        "note": "Virtual particle-transport concentration, not a model concentration prediction.",
    }
    metadata = {
        "channels": ["concentration"],
        "units": {"concentration": "µg/m3"},
        "grid": {"origin": origin, "spacing": spacing, "crs": reader.crs},
        "provenance": provenance,
    }
    (directory / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, allow_nan=False))
    _progress(params["control"], len(times), len(times))
    source = {
        "kind": "array",
        "paths": [
            str(concentration_path),
            str(directory / "building_mask.npy"),
            str(directory / "time.npy"),
            str(directory / "metadata.json"),
        ],
        "cache": str(directory / ".prepared"),
        "mapping": {
            "array": "concentration",
            "field": "concentration",
            "axisOrder": "TXYZ",
            "unit": "µg/m3",
            "origin": origin,
            "spacing": spacing,
            "coordinateConfirmed": True,
        },
    }
    if (
        params["source"].get("case")
        or params["source"].get("geometrySource")
        or any(Path(path).suffix.lower() in {".obj", ".stl"} for path in params["source"].get("paths", []))
    ):
        source["geometrySource"] = params["source"]
    return source
