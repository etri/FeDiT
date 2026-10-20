import math

import numpy as np

from modules.application.cases import load
from modules.domain.coordinates import canonical_unit, cell_centres, cell_index
from modules.domain.errors import ApiError, StoreError
from modules.domain.grids.comparison import same_grid

VELOCITY = ("velocity_x", "velocity_y", "velocity_z")
SPEED_UNIT = "m/s"
REGION_DEFINITION = "영역 내 유효 유체 셀의 평균 풍속, 최대 풍속과 위치"
COMPARE_DEFINITION = "동일 격자, 시각, 단위의 유효 유체 셀에 대한 채널별 MAE와 RMSE"


def _frame(reader, frame):
    """음수 인덱스는 기록이 끝난 프레임 기준으로 해석"""
    if not -reader.n_frames <= frame < reader.n_frames:
        raise ApiError(
            422, f"frame {frame} is out of range: the result has {reader.n_frames} complete frames"
        )
    return frame % reader.n_frames


def _frame_info(reader, frame):
    return {"frame": frame, "time": float(reader.time[frame]), "kind": reader.kind(frame)}


def _velocity(reader):
    return [reader.channels.index(name) for name in VELOCITY if name in reader.channels]


def _speed(values, velocity):
    # 제곱합 오버플로를 막기 위해 float64 사용
    return np.sqrt(np.square(values[..., velocity], dtype=np.float64).sum(axis=-1))


def _centre(grid, index):
    return [origin + (i + 0.5) * spacing for origin, spacing, i in zip(grid.origin, grid.spacing, index)]


def _units(reader):
    units = {name: canonical_unit(name) for name in reader.channels}
    return units | {"speed": SPEED_UNIT} if _velocity(reader) else units


def _locate(reader, point):
    try:
        index = cell_index(reader.grid, point)
    except OverflowError:
        # 격자 간격으로 나눈 좌표가 오버플로하면 영역 밖으로 처리
        index = None
    if index is None:
        return {
            "point": list(point),
            "valid": False,
            "reason": "outside",
            "cell": None,
            "cell_centre": None,
        }, None
    reason = "solid" if reader.building_mask[index] else None
    located = {"point": list(point), "valid": reason is None, "reason": reason, "cell": list(index)}
    return located | {"cell_centre": _centre(reader.grid, index)}, index


def probe(reader, point, frame):
    frame = _frame(reader, frame)
    body, index = _locate(reader, point)
    values = None
    if body["valid"]:
        values = reader.cell(index, frame)
        if not np.isfinite(values).all():
            body |= {"valid": False, "reason": "non_finite"}
    velocity = _velocity(reader)
    return {
        **_frame_info(reader, frame),
        **body,
        "values": dict(zip(reader.channels, map(float, values))) if body["valid"] else None,
        "speed": float(_speed(values, velocity)) if body["valid"] and velocity else None,
        "units": _units(reader),
    }


def timeseries(reader, point):
    body, index = _locate(reader, point)
    series = None
    if body["valid"]:
        values = reader.cell(index)
        finite = np.isfinite(values).all(axis=1)
        columns = dict(zip(reader.channels, values.T))
        velocity = _velocity(reader)
        if velocity:
            columns = {"speed": _speed(values, velocity)} | columns
        series = {
            name: [float(v) if ok else None for v, ok in zip(column, finite)]
            for name, column in columns.items()
        }
    return {
        **body,
        "history_frames": reader.history_frames,
        "times": [float(time) for time in reader.times()],
        "kind": [reader.kind(frame) for frame in range(reader.n_frames)],
        "series": series,
        "units": _units(reader),
    }


def region(reader, box, frame):
    frame = _frame(reader, frame)
    velocity = _velocity(reader)
    if not velocity:
        raise ApiError(422, "the result has no velocity channels")
    low, high = np.minimum(*box), np.maximum(*box)
    bounds = []
    for axis in range(3):
        centres = cell_centres(reader.grid, axis)
        inside = np.nonzero((centres >= low[axis]) & (centres <= high[axis]))[0]
        bounds.append((int(inside[0]), int(inside[-1]) + 1) if inside.size else (0, 0))
    lower, upper = zip(*bounds)

    cells = solid = 0
    total, peak, peak_cell = 0.0, -math.inf, None
    for block in reader.blocks(lower, upper):
        values = reader.read(frame, block)
        fluid = reader.building_mask[block] == 0
        valid = fluid & np.isfinite(values).all(axis=-1)
        speed = np.where(valid, _speed(values, velocity), -math.inf)
        cells += int(valid.sum())
        solid += int(fluid.size - fluid.sum())
        total += float(speed[valid].sum())
        if speed.max() > peak:
            offset = np.unravel_index(int(speed.argmax()), speed.shape)
            peak = float(speed.max())
            peak_cell = [int(axis.start + i) for axis, i in zip(block, offset)]

    in_box = math.prod(stop - start for start, stop in bounds)
    return {
        **_frame_info(reader, frame),
        "box": [low.tolist(), high.tolist()],
        "cell_range": [list(lower), list(upper)],
        "cells": cells,
        "excluded": {"solid": solid, "non_finite": in_box - solid - cells},
        "mean_speed": total / cells if cells else None,
        "max_speed": peak if cells else None,
        "max_location": {"cell": peak_cell, "point": _centre(reader.grid, peak_cell)} if cells else None,
        "unit": SPEED_UNIT,
        "definition": REGION_DEFINITION,
    }


def open_reference(cases, case_id):
    """참조를 열 수 없으면 (None, 이유) 반환"""
    case = load(cases, case_id)
    if not case.reference:
        return None, "the case has no reference store"
    directory = cases.path(case.id)
    try:
        return cases.stores.read(cases.confine(case.reference, directory, directory)), None
    except StoreError as error:
        return None, f"the reference store is not readable: {error}"


def compare(reader, reference, frame, reason=None):
    """격자나 시각이 맞지 않으면 지표 없이 이유 반환"""
    frame = _frame(reader, frame)
    body = {**_frame_info(reader, frame), "available": False, "reason": reason, "metrics": None}
    if reference is None:
        return body
    if not same_grid(reader.grid, reference.grid):
        return body | {"reason": "the reference grid differs from the result grid"}
    tolerance = 1e-6 * reader.metadata.time_step
    matches = np.nonzero(np.isclose(reference.times(), body["time"], rtol=0.0, atol=tolerance))[0]
    channels = [name for name in reader.channels if name in reference.channels]
    if not matches.size:
        return body | {"reason": f"the reference has no frame at time {body['time']} s"}
    if not channels:
        return body | {"reason": "the reference shares no channel with the result"}

    ours = [reader.channels.index(name) for name in channels]
    theirs = [reference.channels.index(name) for name in channels]
    cells, absolute, squared = 0, np.zeros(len(channels)), np.zeros(len(channels))
    for block in reader.blocks((0, 0, 0), reader.grid.shape):
        predicted = reader.read(frame, block)[..., ours]
        expected = reference.read(int(matches[0]), block)[..., theirs]
        valid = (reader.building_mask[block] == 0) & (reference.building_mask[block] == 0)
        valid &= np.isfinite(predicted).all(axis=-1) & np.isfinite(expected).all(axis=-1)
        error = predicted[valid].astype(np.float64) - expected[valid]
        cells += len(error)
        absolute += np.abs(error).sum(axis=0)
        squared += np.square(error).sum(axis=0)
    if not cells:
        return body | {"reason": "the result and the reference share no valid fluid cell"}

    return body | {
        "available": True,
        "reference": str(reference.path),
        "reference_frame": int(matches[0]),
        "cells": cells,
        "excluded": math.prod(reader.grid.shape) - cells,
        "metrics": {
            name: {"mae": float(mae), "rmse": float(rmse), "unit": canonical_unit(name)}
            for name, mae, rmse in zip(channels, absolute / cells, np.sqrt(squared / cells))
        },
        "definition": COMPARE_DEFINITION,
    }
