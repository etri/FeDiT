import itertools
import json
import math
import shutil
import zipfile
from pathlib import Path, PurePosixPath

import numpy as np

from modules.domain.schemas.context import source_context

MAX_ARRAY_BYTES = 32 * 1024**3
MAX_ARCHIVE_BYTES = 64 * 1024**3
BLOCK_CELLS = 131072


def _array(path):
    array = np.load(path, mmap_mode="r", allow_pickle=False, max_header_size=65536)
    if array.dtype.hasobject or array.nbytes > MAX_ARRAY_BYTES:
        raise ValueError("Array dtype or size is unsupported.")
    if array.dtype.kind not in "biufUS":
        raise ValueError("Array must contain real numeric or metadata values.")
    return array


def unpack_npz(path, directory):
    """NPZ 항목을 검사한 뒤 디스크에 순차 해제"""
    path, directory = Path(path), Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    fingerprint = f"{path.stat().st_size}:{path.stat().st_mtime_ns}"
    marker = directory / ".complete"
    with zipfile.ZipFile(path) as archive:
        entries = archive.infolist()
        if not 0 < len(entries) <= 128 or sum(item.file_size for item in entries) > MAX_ARCHIVE_BYTES:
            raise ValueError("NPZ archive exceeds the array count or expanded size limit.")
        names = set()
        for item in entries:
            member = PurePosixPath(item.filename)
            if (
                member.name != item.filename
                or "\\" in item.filename
                or member.suffix != ".npy"
                or item.file_size > MAX_ARRAY_BYTES
                or item.flag_bits & 1
                or item.filename in names
                or item.file_size > max(1, item.compress_size) * 10000
            ):
                raise ValueError("NPZ archive contains an unsafe or oversized entry.")
            names.add(item.filename)
        if not marker.is_file() or marker.read_text() != fingerprint:
            for item in entries:
                target = directory / item.filename
                temporary = target.with_suffix(".partial")
                with archive.open(item) as source, temporary.open("wb") as output:
                    shutil.copyfileobj(source, output, length=1024 * 1024)
                temporary.replace(target)
                _array(target)
            marker.write_text(fingerprint)
    return {Path(item.filename).stem: directory / item.filename for item in entries}


def _scalar_json(path):
    if path.stat().st_size > 1024 * 1024:
        raise ValueError("Array metadata exceeds the 1 MiB limit.")
    value = _array(path)
    if value.shape != () or value.dtype.kind not in "US":
        raise ValueError("Array metadata must be a JSON string scalar.")
    result = json.loads(str(value.item()))
    if not isinstance(result, dict):
        raise ValueError("Array metadata must contain a JSON object.")
    return result


def fields(channels, units=None, association="cell"):
    units = units or {}
    result = [
        {
            "id": name,
            "label": name.replace("_", " "),
            "unit": units.get(name, ""),
            "association": association,
            "components": 1,
        }
        for name in channels
    ]
    velocity_units = {units.get(f"velocity_{axis}", "") for axis in "xyz"}
    if all(f"velocity_{axis}" in channels for axis in "xyz") and len(velocity_units) == 1:
        result.insert(
            0,
            {
                "id": "speed",
                "label": "Speed",
                "unit": velocity_units.pop(),
                "association": association,
                "components": 1,
            },
        )
    return result


class Uniform:
    def __init__(self, source):
        self.source = source
        self.store = None
        self.association = "cell"
        self.warning = []
        self.time_known = True
        self.coordinates_known = True
        self.crs = None
        self.provenance = None
        self.boundary_conditions = {}
        self.fluid = self.valid = self.building = None
        if source["kind"] == "zarr":
            from modules.domain.coordinates.units import canonical_unit
            from modules.infrastructure.formats.flow_store import StoreReader

            self.store = StoreReader(source["path"])
            self.crs = self.store.grid.crs
            self.array = self.store.flow
            self.building = self.store.building_mask
            self.origin = np.asarray(self.store.grid.origin, dtype=np.float64)
            self.spacing = np.asarray(self.store.grid.spacing, dtype=np.float64)
            self.channels = self.store.channels
            self.units = {name: canonical_unit(name) or "" for name in self.channels}
            self.times = np.asarray(self.store.times(), dtype=np.float64)
            self.provenance = self.store.attrs.get("provenance")
            self.boundary_conditions = self.store.metadata.boundary_conditions
        else:
            self._external(source)
        self.shape = tuple(int(size) for size in self.array.shape[1:4])
        self.cell_shape = tuple(max(1, size - int(self.association == "point")) for size in self.shape)
        self.volumetric = self.association != "point" or min(self.shape) > 1
        self.bounds = [
            self.origin.tolist(),
            (
                self.origin
                + np.asarray(
                    self.cell_shape
                    if self.association == "cell"
                    else np.maximum(0, np.asarray(self.shape) - 1)
                )
                * self.spacing
            ).tolist(),
        ]
        if self.array.shape[-1] != len(self.channels) or min(self.shape) < 1:
            raise ValueError("Channel count or grid shape does not match the array.")
        if not self.times.size == self.array.shape[0] and not self.store:
            raise ValueError("Time count does not match the array.")
        if (
            not np.isfinite(self.origin).all()
            or not np.isfinite(self.spacing).all()
            or np.min(self.spacing) <= 0
            or not np.isfinite(self.times).all()
            or (len(self.times) > 1 and np.any(np.diff(self.times) <= 0))
        ):
            raise ValueError("Grid coordinates or time values are invalid.")
        if len(self.times) > 10000:
            raise ValueError("Dataset exceeds the 10000-frame limit.")
        self.field_info = fields(self.channels, self.units, self.association)
        self.analysis_kind = "volume" if self.volumetric else "surface"
        self.support_modes = ["points", "surface", "slice", *(["iso", "volume"] if self.volumetric else [])]
        if all(f"velocity_{axis}" in self.channels for axis in "xyz"):
            self.support_modes.extend(["vectors", "streamlines"])
        for field in self.field_info:
            field.update(analysisKind=self.analysis_kind, supportModes=self.support_modes)

    def _external(self, source):
        mapping = source.get("mapping") or {}
        candidates = [Path(name) for name in source["paths"] if Path(name).suffix.lower() in {".npy", ".npz"}]
        if not candidates:
            raise ValueError("Dataset has no numeric array.")
        path = candidates[0]
        entries = (
            unpack_npz(path, Path(source.get("cache", path.with_suffix(""))) / "arrays")
            if path.suffix.lower() == ".npz"
            else {
                "array": path,
                **{
                    candidate.stem: candidate
                    for candidate in candidates
                    if candidate.suffix.lower() == ".npy"
                },
            }
        )
        metadata = _scalar_json(entries["metadata"]) if "metadata" in entries else {}
        json_metadata = next(
            (Path(name) for name in source["paths"] if Path(name).name == "metadata.json"), None
        )
        if json_metadata is not None:
            if json_metadata.stat().st_size > 1024 * 1024:
                raise ValueError("Array metadata exceeds the 1 MiB limit.")
            metadata = json.loads(json_metadata.read_text())
            if not isinstance(metadata, dict):
                raise ValueError("Array metadata must contain a JSON object.")
        self.provenance = metadata.get("provenance")
        self.boundary_conditions = (
            metadata.get("boundary_conditions")
            or (source.get("metadata") or {}).get("boundary_conditions")
            or {}
        )
        prediction = (
            "prediction" in entries and {"origin", "spacing", "fluid_mask", "valid_mask"} <= entries.keys()
        )
        name = mapping.get("array") or next(
            (key for key in ("prediction", "flow", "concentration", "values", "array") if key in entries),
            None,
        )
        if not name:
            name = next(
                (
                    key
                    for key in entries
                    if key
                    not in {
                        "metadata",
                        "times",
                        "time",
                        "origin",
                        "spacing",
                        "building_mask",
                        "fluid_mask",
                        "valid_mask",
                    }
                ),
                None,
            )
        if name not in entries:
            raise ValueError("Mapped array was not found.")
        values = _array(entries[name])
        if values.dtype.kind not in "iuf" or not 3 <= values.ndim <= 5:
            raise ValueError("Field array must have three to five numeric dimensions.")
        if prediction:
            if values.ndim != 4 or values.shape[0] != 4 or values.dtype.kind != "f":
                raise ValueError("Prediction array must have floating-point shape [4,Z,Y,X].")
            if metadata.get("axis_order", "ZYX") != "ZYX":
                raise ValueError("Prediction array axis order must be ZYX.")
            if metadata.get("origin_convention", "minimum_corner") != "minimum_corner":
                raise ValueError("Prediction origin must identify the minimum cell corner.")
            if metadata.get("units", ["m/s", "m/s", "m/s", "Pa"]) != ["m/s", "m/s", "m/s", "Pa"]:
                raise ValueError("Prediction arrays must use SI units.")
            for key in ("origin", "spacing"):
                coordinate = _array(entries[key])
                if coordinate.shape != (3,) or coordinate.dtype.kind != "f":
                    raise ValueError(
                        "Prediction origin and spacing must contain three floating-point coordinates."
                    )
        order = (
            "CZYX"
            if prediction
            else mapping.get("axisOrder")
            or metadata.get("axisOrder")
            or metadata.get("axis_order")
            or {3: "XYZ", 4: "TXYZ", 5: "TXYZC"}[values.ndim]
        )
        if (
            not isinstance(order, str)
            or len(order) != values.ndim
            or len(set(order)) != len(order)
            or not set(order) <= set("TXYZC")
            or not set("XYZ") <= set(order)
        ):
            raise ValueError("Axis order does not match the array dimensions.")
        spatial_order = "".join(axis for axis in order if axis in "XYZ")
        for axis in "TXYZC":
            if axis not in order:
                values = np.expand_dims(values, -1)
                order += axis
        self.array = values.transpose(tuple(order.index(axis) for axis in "TXYZC"))
        channels = metadata.get("channels")
        channel_units = {}
        if channels and isinstance(channels[0], dict):
            channel_units = {item["name"]: item.get("unit", "") for item in channels}
            channels = [item["name"] for item in channels]
        mapped_field = mapping.get("field", "scalar")
        if mapped_field == "scalar" and name == "concentration":
            mapped_field = "concentration"
        self.channels = (
            ["velocity_x", "velocity_y", "velocity_z", "pressure"]
            if prediction
            else mapping.get("channels")
            or channels
            or [
                mapped_field if self.array.shape[-1] == 1 else f"channel_{index}"
                for index in range(self.array.shape[-1])
            ]
        )
        if not all(isinstance(channel, str) and 0 < len(channel) <= 128 for channel in self.channels):
            raise ValueError("Channel names are invalid.")
        if len(set(self.channels)) != len(self.channels):
            raise ValueError("Channel names must be unique.")
        self.association = mapping.get("association", metadata.get("association", "cell"))
        if self.association not in {"cell", "point"}:
            raise ValueError("Array association must be cell or point.")
        self.units = channel_units
        if isinstance(metadata.get("units"), dict):
            self.units.update(metadata["units"])
        if prediction:
            self.units = dict(zip(self.channels, ["m/s", "m/s", "m/s", "Pa"]))
        elif mapping.get("unit"):
            self.units.update({key: mapping["unit"] for key in self.channels})
        grid = metadata.get("grid") or {}
        self.crs = grid.get("crs")
        legacy_defaults = (
            mapping.get("coordinateConfirmed") is False and {"origin", "spacing"} <= mapping.keys()
        )
        coordinates = {}
        for key, default in (("origin", [0, 0, 0]), ("spacing", [1, 1, 1])):
            value = _array(entries[key]) if key in entries else grid.get(key, metadata.get(key))
            if not prediction and key in mapping and not legacy_defaults:
                value = mapping[key]
            coordinates[key] = value
            setattr(self, key, np.asarray(default if value is None else value, dtype=np.float64))
        self.coordinates_known = all(value is not None for value in coordinates.values())
        if not self.coordinates_known:
            self.warning.append(
                "Grid coordinates use index defaults. Confirm origin and spacing in metres before volume analysis."
            )
        if self.origin.shape != (3,) or self.spacing.shape != (3,):
            raise ValueError("Grid origin and spacing must contain three coordinates.")
        time_key = "times" if "times" in entries else "time" if "time" in entries else None
        if time_key:
            self.times = np.asarray(_array(entries[time_key]), dtype=np.float64).reshape(-1)
        elif mapping.get("times") is not None:
            self.times = np.asarray(mapping["times"], dtype=np.float64)
        elif metadata.get("times") is not None:
            self.times = np.asarray(metadata["times"], dtype=np.float64)
        elif metadata.get("time_step"):
            self.times = float(metadata.get("time", 0)) + np.arange(self.array.shape[0]) * float(
                metadata["time_step"]
            )
        else:
            self.times = np.arange(self.array.shape[0], dtype=np.float64)
            self.time_known = self.array.shape[0] == 1
            if not self.time_known:
                self.warning.append("Physical time is missing. Map time values to enable time analysis.")
        for attribute, key in (
            ("building", "building_mask"),
            ("fluid", "fluid_mask"),
            ("valid", "valid_mask"),
        ):
            if key not in entries:
                continue
            mask = _array(entries[key])
            if mask.dtype.kind not in "biu":
                raise ValueError("Mask arrays must contain boolean or integer values.")
            if prediction:
                if mask.ndim != 4 or mask.shape[0] != 1 or mask.dtype != np.bool_:
                    raise ValueError("Prediction mask shape is invalid.")
                mask = mask[0].transpose(2, 1, 0)
            elif mask.ndim == 3:
                mask = mask.transpose(tuple(spatial_order.index(axis) for axis in "XYZ"))
            if mask.shape != self.array.shape[1:4]:
                raise ValueError("Mask shape does not match the grid.")
            setattr(self, attribute, mask)

    def descriptor(self):
        reference = (
            self.volumetric
            and self.association == "cell"
            and self.coordinates_known
            and all(self.units.get(f"velocity_{axis}") == "m/s" for axis in "xyz")
        )
        return {
            "fields": self.field_info,
            "times": self.times.tolist(),
            "bounds": self.bounds,
            "gridKind": "uniform",
            "grid": {
                "origin": self.origin.tolist(),
                "spacing": self.spacing.tolist(),
                "dimensions": list(self.shape),
                "association": self.association,
            },
            "capabilities": {
                "geometry": False,
                "flow": bool(len(self.times)),
                "concentration": "concentration" in self.channels,
                "timeseries": self.time_known and len(self.times) > 1,
                "predict": False,
                "volumetric": self.volumetric,
            },
            "validation": [{"level": "warning", "message": message} for message in self.warning],
            "timeUnit": "s" if self.time_known else "frame",
            "coordinateUnit": "m" if self.coordinates_known else "index",
            "provenance": self.provenance,
            "analysisKind": self.analysis_kind,
            "initialFrame": self.store.history_frames
            if self.store and self.store.history_frames < len(self.times)
            else 0,
            "supportModes": self.support_modes,
            "scenarioModes": ["reference"] if reference else [],
            **source_context(self.source),
        }

    def field(self, name):
        field_id = name or self.field_info[0]["id"]
        match = next((field for field in self.field_info if field["id"] == field_id), None)
        if match is None:
            raise ValueError("Requested field is unavailable.")
        return match

    def _point_values(self, frame, region, field_id):
        if not 0 <= frame < len(self.times):
            raise ValueError("Frame is outside the completed time range.")
        if field_id == "speed":
            indices = [self.channels.index(f"velocity_{axis}") for axis in "xyz"]
            data = np.asarray(self.array[(frame, *region)], dtype=np.float64)[..., indices]
            return np.sqrt(np.square(data).sum(axis=-1))
        return np.asarray(self.array[(frame, *region, self.channels.index(field_id))], dtype=np.float64)

    def scalar(self, frame, region, field_id):
        if self.association == "cell":
            values = self._point_values(frame, region, field_id)
            valid = np.isfinite(values)
            if self.building is not None:
                valid &= np.asarray(self.building[region]) == 0
            if self.fluid is not None:
                valid &= np.asarray(self.fluid[region], dtype=bool)
            if self.valid is not None:
                valid &= np.asarray(self.valid[region], dtype=bool)
            if self.store is not None:
                valid &= np.isfinite(np.asarray(self.array[(frame, *region)])).all(axis=-1)
            return values, valid
        # PointData는 셀 정점의 평균으로 체적 집계
        values, valid, count = None, None, 0
        axes = [[0, 1] if size > 1 else [0] for size in self.shape]
        for offsets in itertools.product(*axes):
            shifted = tuple(
                slice(item.start + offset, item.stop + offset, item.step)
                for item, offset in zip(region, offsets)
            )
            sample = self._point_values(frame, shifted, field_id)
            finite = np.isfinite(sample)
            values = np.where(finite, sample, 0) if values is None else values + np.where(finite, sample, 0)
            valid = finite if valid is None else valid & finite
            count += 1
        return values / count, valid

    def region(self, roi=None):
        low, high = (np.asarray(row, dtype=np.float64) for row in (roi or self.bounds))
        ranges = []
        for axis in range(3):
            if self.association == "point" and self.shape[axis] == 1:
                included = low[axis] <= self.origin[axis] <= high[axis]
                ranges.append(slice(0, int(included)))
                continue
            start = max(0, math.ceil((low[axis] - self.origin[axis]) / self.spacing[axis] - 0.5 - 1e-10))
            stop = min(
                self.cell_shape[axis],
                math.floor((high[axis] - self.origin[axis]) / self.spacing[axis] - 0.5 + 1e-10) + 1,
            )
            ranges.append(slice(start, max(start, stop)))
        return tuple(ranges)

    def blocks(self, region):
        # 고정 크기 블록으로 원본 셀을 순회
        sizes = [max(0, item.stop - item.start) for item in region]
        side = min(64, max(1, int((BLOCK_CELLS / max(1, len(self.channels))) ** (1 / 3))))
        chunk = [min(size or 1, side) for size in sizes]
        for starts in itertools.product(
            *(range(item.start, item.stop, step) for item, step in zip(region, chunk))
        ):
            yield tuple(
                slice(start, min(start + step, item.stop)) for start, step, item in zip(starts, chunk, region)
            )

    def centres(self, region):
        axes = [
            self.origin[index]
            + (
                np.arange(item.start, item.stop, item.step or 1)
                + (0 if self.association == "point" and self.shape[index] == 1 else 0.5)
            )
            * self.spacing[index]
            for index, item in enumerate(region)
        ]
        return np.stack(np.meshgrid(*axes, indexing="ij"), axis=-1)

    def probe(self, field_id, point, frame):
        point = np.asarray(point, dtype=np.float64)
        if self.association == "point":
            position = (point - self.origin) / self.spacing
            if np.any(position < 0) or np.any(position > np.asarray(self.shape) - 1):
                return None
            first = np.minimum(np.floor(position).astype(int), np.maximum(0, np.asarray(self.shape) - 2))
            fraction = position - first
            value = 0.0
            for offsets in itertools.product(*([0, 1] if size > 1 else [0] for size in self.shape)):
                weight = math.prod(
                    fraction[axis] if offset else 1 - fraction[axis] for axis, offset in enumerate(offsets)
                )
                if weight <= 1e-15:
                    continue
                index = tuple(int(start + offset) for start, offset in zip(first, offsets))
                sample = self._point_values(frame, index, field_id)
                if not np.isfinite(sample):
                    return None
                for mask, invert in ((self.building, True), (self.fluid, False), (self.valid, False)):
                    if mask is not None and (bool(mask[index]) if invert else not bool(mask[index])):
                        return None
                value += float(sample) * weight
            return value
        index = np.floor((point - self.origin) / self.spacing).astype(np.int64)
        if np.any(index < 0) or np.any(index >= self.cell_shape):
            return None
        region = tuple(slice(int(value), int(value) + 1) for value in index)
        values, valid = self.scalar(frame, region, field_id)
        return float(values[0, 0, 0]) if valid[0, 0, 0] else None

    @property
    def cell_volume(self):
        return float(np.prod(self.spacing))


def open_numeric(source):
    if source["kind"] == "zarr":
        return Uniform(source)
    suffixes = {Path(path).suffix.lower() for path in source.get("paths", [])}
    if suffixes & {".npy", ".npz"}:
        return Uniform(source)
    if suffixes & {".vtk", ".vti", ".vtu", ".vtp", ".vtr", ".vts", ".pvd", ".vtm"}:
        from modules.visualization.readers.vtk import VTKReader

        return VTKReader(source)
    return None
