import json
import math
from pathlib import Path

import numpy as np

from modules.visualization.readers.uniform import Uniform, open_numeric


def field_descriptor(reader, name):
    value = reader.field(name)
    return {key: item for key, item in value.items() if key != "sourceName"}


def _chunks(reader, frame, field_id, roi):
    if isinstance(reader, Uniform):
        for block in reader.blocks(reader.region(roi)):
            values, valid = reader.scalar(frame, block, field_id)
            yield values[valid], np.full(int(valid.sum()), reader.cell_volume)
    else:
        _, values, valid, volumes = reader.data(frame, field_id, roi)
        yield values[valid], volumes[valid]


def _exceedance(times, values, threshold):
    if threshold is None:
        return None
    duration = 0.0
    for left, right, a, b in zip(times, times[1:], values, values[1:]):
        if a is None or b is None:
            continue
        width = right - left
        if a > threshold and b > threshold:
            duration += width
        elif (a > threshold) != (b > threshold):
            ratio = (threshold - a) / (b - a)
            duration += width * (ratio if a > threshold else 1 - ratio)
    return float(duration)


def _compare(reader, other, selection, field):
    from modules.domain.schemas.context import source_context

    references = [
        source_context(item.source).get("sourceRef") or {} for item in (reader, other) if item is not None
    ]
    if any(
        item.get("comparisonKind") == "qualitative" or item.get("compatibleConditions") is False
        for item in references
    ):
        return {"available": False, "reason": "Source conditions differ. Comparison is qualitative."}
    if not isinstance(reader, Uniform) or not isinstance(other, Uniform):
        return {"available": False, "reason": "Comparison requires matching uniform grids."}
    if reader.crs != other.crs:
        return {"available": False, "reason": "Coordinate reference systems differ."}
    if (
        reader.cell_shape != other.cell_shape
        or not np.allclose(reader.origin, other.origin, rtol=0, atol=1e-6)
        or not np.allclose(reader.spacing, other.spacing, rtol=1e-9, atol=0)
    ):
        return {"available": False, "reason": "Grid coordinates differ."}
    try:
        other_field = other.field(field["id"])
    except ValueError:
        return {"available": False, "reason": "Comparison field is unavailable."}
    if field["unit"] != other_field["unit"]:
        return {"available": False, "reason": "Field units differ."}
    frame = selection.get("frame", 0)
    match = np.flatnonzero(np.isclose(other.times, reader.times[frame], rtol=0, atol=1e-8))
    if not match.size:
        return {"available": False, "reason": "Physical time values differ."}
    count, absolute, squared = 0, 0.0, 0.0
    for region in reader.blocks(reader.region(selection.get("roi"))):
        left, valid = reader.scalar(frame, region, field["id"])
        right, other_valid = other.scalar(int(match[0]), region, field["id"])
        difference = left[valid & other_valid] - right[valid & other_valid]
        count += len(difference)
        absolute += float(np.abs(difference).sum())
        squared += float(np.square(difference).sum())
    return {
        "available": bool(count),
        "cells": count,
        "mae": absolute / count if count else None,
        "rmse": math.sqrt(squared / count) if count else None,
        **({"reason": "No common finite fluid cells are available."} if not count else {}),
    }


def _reference_data(source):
    """관측 지점과 실제 표본 축을 담은 부속 자료 조회"""
    value = (source.get("metadata") or {}).get("referenceData") or source.get("referenceData")
    if isinstance(value, dict):
        return value
    path = next((Path(name) for name in source.get("paths", []) if Path(name).name == "probes.json"), None)
    if path is None:
        return {}
    if path.stat().st_size > 16 * 1024 * 1024:
        raise ValueError("Reference observations exceed the 16 MiB limit.")
    value = json.loads(path.read_text())
    if not isinstance(value, dict):
        raise ValueError("Reference observations must contain a JSON object.")
    return value


def nonvolume_samples(reader, frame, field_id, roi=None):
    """면과 관측점의 원본 표본을 체적 가중치 없이 순회"""
    if isinstance(reader, Uniform):
        region = tuple(slice(0, size) for size in reader.shape)
        for block in reader.blocks(region):
            values = reader._point_values(frame, block, field_id)
            axes = [
                reader.origin[axis] + np.arange(item.start, item.stop) * reader.spacing[axis]
                for axis, item in enumerate(block)
            ]
            points = np.stack(np.meshgrid(*axes, indexing="ij"), axis=-1)
            valid = np.isfinite(values)
            for mask, excluded in ((reader.building, True), (reader.fluid, False), (reader.valid, False)):
                if mask is not None:
                    valid &= np.asarray(mask[block]) == 0 if excluded else np.asarray(mask[block]) != 0
            if roi:
                valid &= ((points >= roi[0]) & (points <= roi[1])).all(axis=-1)
            yield points[valid], values[valid]
        return
    reader._load(frame)
    field = reader.field(field_id)
    data = reader.mesh.point_data if field["association"] == "point" else reader.mesh.cell_data
    values = np.asarray(data[field["sourceName"]], dtype=np.float64)
    if values.ndim > 1:
        values = np.linalg.norm(values, axis=-1)
    points = np.asarray(
        reader.mesh.points if field["association"] == "point" else reader.mesh.cell_centers().points
    )
    valid = np.isfinite(values) & np.isfinite(points).all(axis=-1)
    for name, excluded in (
        ("vtkGhostType", True),
        ("building_mask", True),
        ("fluid_mask", False),
        ("valid_mask", False),
    ):
        if name in data:
            valid &= np.asarray(data[name]) == 0 if excluded else np.asarray(data[name]) != 0
    if roi:
        valid &= ((points >= roi[0]) & (points <= roi[1])).all(axis=-1)
    yield points[valid], values[valid]


def _nonvolume_analysis(reader, source, selection):
    """실측 표본과 시계열을 체적 통계와 분리하여 반환"""
    field, frame = field_descriptor(reader, selection.get("fieldId")), selection.get("frame", 0)
    if not 0 <= frame < len(reader.times):
        raise ValueError("Frame is outside the completed time range.")
    samples = [values for _, values in nonvolume_samples(reader, frame, field["id"], selection.get("roi"))]
    values = np.concatenate(samples) if samples else np.asarray([])
    reference = _reference_data(source)
    observed = [item for item in reference.get("series", []) if item.get("field") == field["id"]]
    probes, series, used = [], [], set()
    for probe in selection.get("probes", [])[:5]:
        if isinstance(reader, Uniform):
            value = reader.probe(field["id"], probe["point"], frame)
        else:
            chunks = list(nonvolume_samples(reader, frame, field["id"]))
            points, data = (
                np.concatenate([item[0] for item in chunks]),
                np.concatenate([item[1] for item in chunks]),
            )
            distance = np.linalg.norm(points - np.asarray(probe["point"]), axis=1)
            index = int(np.argmin(distance)) if len(distance) else None
            value = float(data[index]) if index is not None and distance[index] <= 1e-6 else None
        probes.append({**probe, "value": value})
        identifiers = {
            probe["id"],
            *[
                item["id"]
                for item in reference.get("points", [])
                if np.allclose(item["position"], probe["point"], rtol=0, atol=1e-5)
            ],
        }
        station = next((item for item in observed if item["id"] in identifiers), None)
        if station is not None:
            series.append({**station, "id": probe["id"], "sourceId": station["id"]})
            used.add(station["id"])
        elif isinstance(reader, Uniform):
            series.append(
                {
                    "id": probe["id"],
                    "times": reader.times.tolist(),
                    "values": [
                        reader.probe(field["id"], probe["point"], index) for index in range(len(reader.times))
                    ],
                    "timeUnit": "s" if reader.time_known else "frame",
                }
            )
    series.extend(dict(item) for item in observed if item["id"] not in used)
    series = series[:5]
    for item in series:
        item.setdefault("timeUnit", "s")
        available = [
            (index, value) for index, value in enumerate(item.get("values", [])) if value is not None
        ]
        peak_index, peak = max(available, key=lambda pair: pair[1]) if available else (None, None)
        item.update(
            maximum=peak,
            maxTime=item["times"][peak_index] if peak_index is not None and item["timeUnit"] == "s" else None,
            exceedanceDuration=None,
        )
    counts, edges = (
        np.histogram(values, bins=selection.get("bins", 12))
        if values.size
        else (np.zeros(12), np.linspace(0, 1, 13))
    )
    return {
        "field": field,
        "time": float(reader.times[frame]),
        "analysisKind": reader.analysis_kind,
        "probes": probes,
        "timeseries": series,
        "referenceData": reference,
        "validVolume": None,
        "thresholdVolume": None,
        "histogram": {
            "edges": edges.tolist(),
            "volumes": [],
            "counts": counts.tolist(),
            "percentages": (counts / values.size * 100).tolist() if values.size else counts.tolist(),
        },
        "statistics": {
            "minimum": float(values.min()) if values.size else None,
            "maximum": float(values.max()) if values.size else None,
            "mean": float(values.mean()) if values.size else None,
            "cells": int(values.size),
        },
        "method": {
            "methodVersion": "flowcast.workspace-samples/1",
            "field": "original samples",
            "mean": "sample arithmetic mean",
            "timeUnit": "s" if reader.time_known else "frame",
        },
        "warnings": reader.warning,
    }


def analysis(source, selection, other_source=None):
    reader = open_numeric(source)
    if reader is None:
        raise ValueError("Dataset contains no analyzable field.")
    if not reader.volumetric:
        return _nonvolume_analysis(reader, source, selection)
    if isinstance(reader, Uniform) and not reader.coordinates_known:
        raise ValueError("Volume analysis requires confirmed origin and spacing in metres.")
    field = field_descriptor(reader, selection.get("fieldId"))
    frame = selection.get("frame", 0)
    if not 0 <= frame < len(reader.times):
        raise ValueError("Frame is outside the completed time range.")
    threshold, bins = selection.get("threshold"), selection.get("bins", 12)
    minimum, maximum, volume, weighted, threshold_volume = math.inf, -math.inf, 0.0, 0.0, 0.0
    cells = 0
    for values, volumes in _chunks(reader, frame, field["id"], selection.get("roi")):
        if not len(values):
            continue
        minimum = min(minimum, float(values.min()))
        maximum = max(maximum, float(values.max()))
        volume += float(volumes.sum())
        weighted += float(np.dot(values, volumes))
        cells += len(values)
        if threshold is not None:
            threshold_volume += float(volumes[values > threshold].sum())
    if cells:
        edges = np.linspace(
            minimum, maximum if maximum > minimum else minimum + max(1, abs(minimum)) * 1e-6, bins + 1
        )
        histogram = np.zeros(bins, dtype=np.float64)
        for values, volumes in _chunks(reader, frame, field["id"], selection.get("roi")):
            histogram += np.histogram(values, bins=edges, weights=volumes)[0]
    else:
        edges, histogram = np.linspace(0, 1, bins + 1), np.zeros(bins)
    probes, series = [], []
    first = reader.store.history_frames if isinstance(reader, Uniform) and reader.store is not None else 0
    if source.get("resultRole") != "model_wind":
        first = 0
    visible_times = reader.times[first:]
    for probe in selection.get("probes", []):
        value = reader.probe(field["id"], probe["point"], frame)
        probes.append({**probe, "value": value})
        values = [
            reader.probe(field["id"], probe["point"], index) for index in range(first, len(reader.times))
        ]
        available = [(index, value) for index, value in enumerate(values) if value is not None]
        peak_index, peak = max(available, key=lambda item: item[1]) if available else (None, None)
        series.append(
            {
                "id": probe["id"],
                "times": visible_times.tolist(),
                "values": values,
                "maximum": peak,
                "maxTime": float(visible_times[peak_index]) if peak_index is not None else None,
                "exceedanceDuration": _exceedance(visible_times, values, threshold)
                if reader.time_known
                else None,
            }
        )
    result = {
        "field": field,
        "time": float(reader.times[frame]),
        "probes": probes,
        "timeseries": series,
        "analysisKind": "volume",
        "histogram": {
            "edges": edges.tolist(),
            "volumes": histogram.tolist(),
            "percentages": (histogram / volume * 100).tolist() if volume else [0.0] * bins,
        },
        "validVolume": volume,
        "thresholdVolume": threshold_volume if threshold is not None else None,
        "statistics": {
            "minimum": minimum if cells else None,
            "maximum": maximum if cells else None,
            "mean": weighted / volume if volume else None,
            "cells": cells,
        },
        "method": {
            "methodVersion": "flowcast.workspace-analysis/1",
            "roi": "cell centre inclusion",
            "field": "original cells",
            "mean": "volume weighted",
            "pointData": "cell vertex mean",
            "probe": ("trilinear point interpolation" if reader.association == "point" else "containing cell")
            if isinstance(reader, Uniform)
            else "VTK cell or point interpolation",
            "threshold": "strictly greater",
            "duration": "piecewise linear, missing intervals excluded",
            "excluded": ["solid", "non-finite", "duplicate ghost cells"],
            "timeUnit": "s" if reader.time_known else "frame",
        },
        "warnings": reader.warning,
    }
    if other_source is not None:
        result["comparison"] = _compare(reader, open_numeric(other_source), selection, field)
    return result
