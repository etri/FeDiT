import http.client
import math
import os
import resource
import time
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from pathlib import Path
from tempfile import TemporaryDirectory

import numpy as np
import torch

from modules.domain.coordinates import mesh_matrix
from modules.domain.grids.inflow import CHANNELS, synthetic_flow
from modules.domain.grids.planning import n_spatial_dims, plan_size
from modules.domain.schemas import FlowMetadata, Progress, ResultMetadata
from modules.infrastructure.formats.flow_writer import FlowStore
from modules.infrastructure.formats.voxelization import voxelize
from modules.infrastructure.mongo.storage import materialize_assets, rename_store, store_exists
from modules.infrastructure.triton.client import TritonClient, TritonRequestError
from modules.settings import execution as config
from modules.workers.execution.preprocessing import normalize
from modules.workers.execution.regrid import add_regridded_delta, regrid_frame, regrid_mask
from modules.workers.execution.tiling import blend_weights, tile_layout, window_shape

MODEL = "flowcast3d"

# 연결 오류와 5xx의 재시도 횟수, 지수 백오프 초기 간격(초)
RETRIES, BACKOFF = 5, 2.0
SCRATCH = "scratch"


class Stopped(Exception):
    """should_stop 요청으로 재개 가능한 지점에서 중단됨"""


class _MaskedSource:
    """원본을 수정하지 않고 작업별 마스크 제공"""

    def __init__(self, source, mask, provenance):
        self.source = source
        self.building_mask = mask
        self.attrs = {**dict(source.attrs), "mask_source": provenance}

    def __getattr__(self, name):
        return getattr(self.source, name)


def run_prediction(
    spec, progress=None, should_stop=None, client=None, case=None, job_id=None, tile_concurrency=1
):
    # 원본 저장소와 입력 이력 및 유입 조건을 검증
    began = time.monotonic()
    progress = progress or (lambda update: None)
    should_stop = should_stop or (lambda: False)
    output = str(Path(spec.output))
    if not store_exists(spec.source.flow):
        raise ValueError(f"source store {spec.source.flow} does not exist")
    source = FlowStore.open(spec.source.flow)
    inflow = spec.source.inflow
    if inflow is None and source.n_frames < 1:
        raise ValueError(f"{spec.source.flow} has no frames")
    if inflow is not None and FlowMetadata.parse(source.metadata).channels != list(CHANNELS):
        raise ValueError(f"source.inflow needs a source store with the channels {list(CHANNELS)}")
    # 전처리와 결과의 이력 길이가 같도록 설정 상한 적용
    limits = config.load("preprocessing")
    max_history = limits["max_history_3d" if n_spatial_dims(source.shape) == 3 else "max_history_2d"]
    if spec.history_length > max_history:
        raise ValueError(
            f"history_length {spec.history_length} exceeds the {max_history} frames the preprocessing uses "
            "(max_history_3d / max_history_2d in modules.settings.execution)"
        )
    first = max(0, source.n_frames - spec.history_length)
    history = spec.history_length if inflow is not None else source.n_frames - first
    if spec.normalization == "frozen" and history < 2:
        raise ValueError("frozen normalization needs at least 2 history frames to measure the step size")

    source_grid = FlowMetadata.parse(source.metadata).grid
    shape = source.shape if spec.mode == "tiled" else plan_size(source.shape, spec.max_voxels)
    grid = source_grid if shape == source.shape else source_grid.with_shape(shape)
    prediction = {
        "mode": spec.mode,
        "model": MODEL,
        "history_length": spec.history_length,
        "steps": spec.steps,
        "normalization": spec.normalization,
        "max_voxels": spec.max_voxels,
        "output_grid": spec.output_grid,
    }
    # 다른 바람의 결과를 재개하지 않도록 조건 저장
    if inflow is not None:
        prediction["inflow"] = inflow.model_dump()
    request_shape = shape
    if spec.mode == "tiled":
        request_shape = window = window_shape(shape, spec.tiling.tile, spec.tiling.halo, spec.max_voxels)
        prediction["tiling"] = {
            "tile": list(spec.tiling.tile),
            "halo": list(spec.tiling.halo),
            "window": list(window),
        }
    if math.prod(request_shape) > spec.max_voxels:
        raise ValueError(
            f"max_voxels {spec.max_voxels} is below the smallest request the model takes, {request_shape}"
        )

    # 결과를 변경하기 전에 고정 가중치 경로 확인
    from modules.workers.execution.checkpoint import checkpoint_path

    checkpoint_path()

    # 격자가 같으면 결과 저장소 공유
    two_stores = spec.output_grid == "source" and shape != source.shape
    rollout = output.removesuffix(".zarr") + ".prediction.zarr" if two_stores else output
    if two_stores:
        prediction["rollout_store"] = Path(rollout).name

    # 기존 결과의 실행 조건과 완료 지점을 확인
    finished = _existing(output, prediction)
    if finished is not None and finished.attrs["completed_steps"] >= spec.steps and "run" in finished.attrs:
        return _summary(output)

    # 입력 마스크와 결과 출처를 준비하고 재개할 저장소를 연결
    client = client or TritonClient(config.load("worker", "FLOWCAST")["triton_url"])
    source = _with_mask(source, spec, case)
    attrs = {
        "transform": {
            "source_grid": source_grid.model_dump(mode="json", exclude_none=True),
            "prediction_grid": grid.model_dump(mode="json", exclude_none=True),
        },
        "provenance": _provenance(spec, case, job_id),
    }
    # 복셀화한 메시와 변환을 출처에 기록
    if "mask_source" in source.attrs:
        attrs["transform"]["mesh"] = dict(source.attrs["mask_source"])
    fine = _open_result(output, source, source_grid, first, prediction, attrs, inflow) if two_stores else None
    state = _open_result(rollout, source, grid, first, prediction, attrs, inflow)
    done = (fine or state).attrs["completed_steps"]
    if state.attrs["completed_steps"] < done:
        raise ValueError(f"{rollout} is behind {output}: remove both stores to start over")
    clock = {"setup_s": time.monotonic() - began, "predict_s": 0.0}

    # 완료된 스텝 다음부터 전역 또는 타일 추론을 수행
    progress(Progress(steps_done=done, steps_total=spec.steps))
    if spec.mode == "tiled":
        _rollout_tiled(
            spec, state, window, done, client, progress, should_stop, clock, max(1, tile_concurrency)
        )
    else:
        _rollout_global(spec, state, fine, done, client, progress, should_stop, clock)

    # 임시 타일 상태를 정리하고 이번 실행의 소요 시간을 기록
    clock["total_s"] = time.monotonic() - began
    for store in filter(None, (state, fine)):
        if SCRATCH in store.group:
            del store.group[SCRATCH]
            store.attrs.pop("tile_progress", None)
        # 재개 이후 스텝의 시간만 기록
        store.attrs["run"] = {
            "timings": {key: round(value, 3) for key, value in clock.items()},
            "peak_rss_mb": round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024, 1),
            "resumed_from": done,
        }
    return _summary(output)


def _summary(output):
    store = FlowStore.open(output)
    attrs = store.attrs.asdict()
    result = ResultMetadata.from_store(output, attrs, store.time[:], state="succeeded")
    return {
        "output": output,
        "completed_steps": attrs["completed_steps"],
        "metadata": result.model_dump(mode="json"),
        **attrs["run"],
    }


def _provenance(spec, case, job_id):
    provenance = {"case_id": spec.case_id, "job_id": job_id}
    if case is not None:
        provenance |= {
            "case_id": case.id,
            "synthetic": case.synthetic,
            "attribution": case.attribution.model_dump(mode="json", exclude_none=True),
        }
    if spec.source.inflow is not None:
        provenance["inflow"] = spec.source.inflow.model_dump()
    return {key: value for key, value in provenance.items() if value is not None}


def _with_mask(source, spec, case):
    if not spec.source.mesh:
        if "voxelizing" in source.attrs:
            raise ValueError(
                f"the building mask of {spec.source.flow} is half written: give source.mesh to rebuild it"
            )
        return source
    filled = any(source.building_mask[region].any() for region in source.slabs())
    # 다른 작업의 갱신을 놓치지 않도록 마스크 확인 뒤 재읽기
    source.attrs.refresh()
    if filled and "voxelizing" not in source.attrs:
        return source
    mesh = case.mesh if case is not None else None
    transform = mesh_matrix(mesh.up_axis, **mesh.to_world.model_dump()) if mesh is not None else None
    grid = FlowMetadata.parse(source.metadata).grid
    paths = [Path(path).resolve() for path in spec.source.mesh]
    parent = Path(os.path.commonpath([str(path.parent) for path in paths]))
    with TemporaryDirectory(prefix="flowcast3d-mesh-", dir="/tmp") as temporary:
        try:
            directory = materialize_assets(parent, temporary, paths=[str(path) for path in paths])
        except FileNotFoundError as error:
            raise ValueError(f"mesh asset does not exist: {error}") from error
        local_paths = [str(directory / path.relative_to(parent)) for path in paths]
        for logical, local in zip(paths, local_paths, strict=True):
            if not Path(local).is_file():
                raise ValueError(f"mesh asset {logical} does not exist")
        mask = voxelize(local_paths, grid, spec.voxelize.method, transform=transform)
    provenance = {
        "files": [Path(path).name for path in spec.source.mesh],
        "method": spec.voxelize.method,
        "up_axis": mesh.up_axis if mesh is not None else "z",
        "to_world": mesh.to_world.model_dump(mode="json") if mesh is not None else None,
    }
    return _MaskedSource(source, mask, provenance)


def _existing(path, prediction):
    if not store_exists(path):
        return None
    try:
        store = FlowStore.open(path, mode="r+")
    except ValueError:
        store = None
    if store is None or "prediction" not in store.attrs:
        raise ValueError(f"{path} exists and is not a prediction result store")
    recorded = store.attrs["prediction"]
    if any(recorded.get(key) != value for key, value in prediction.items() if key != "steps"):
        raise ValueError(f"{path} was written with different settings: {recorded}")
    return store


def _open_result(path, source, grid, first, prediction, attrs, inflow=None):
    store = _existing(path, prediction)
    if store is not None:
        store.truncate(store.attrs["history_frames"] + store.attrs["completed_steps"])
        store.attrs["prediction"] = {**store.attrs["prediction"], **prediction}
        # 재개 중에는 이전 완료 표시 제거
        store.attrs.pop("run", None)
        return store

    metadata = source.metadata
    metadata["grid"] = grid.model_dump(mode="json", exclude_none=True)
    history = source.n_frames - first if inflow is None else prediction["history_length"]
    metadata["time"] = float(source.time[-1]) if inflow is None else (history - 1) * metadata["time_step"]
    for name in ("state_scale", "delta_scale"):
        metadata.pop(name, None)
    # 이력 복사를 마친 뒤 공개하며 중단된 .partial은 다음 실행에서 교체
    partial = path + ".partial"
    store = FlowStore.create(partial, metadata, overwrite=True)
    regrid_mask(source, store)
    if inflow is None:
        for index in range(first, source.n_frames):
            regrid_frame(source, index, store, store.add_frame(float(source.time[index])))
    else:
        _write_inflow_history(store, grid, inflow, history, metadata["time_step"])
    store.attrs.update(
        prediction=prediction,
        history_frames=history,
        completed_steps=0,
        normalization=[],
        coverage=[],
        **attrs,
    )
    rename_store(partial, path)
    return FlowStore.open(path, mode="r+")


def _write_inflow_history(store, grid, inflow, frames, time_step):
    for step in range(frames):
        frame = store.add_frame(step * time_step)
        for region in store.slabs():
            fluid = store.building_mask[region] == 0
            flow = synthetic_flow(grid, region[0], step * time_step, inflow.direction, inflow.speed)
            store.write_region(frame, flow * fluid[..., None], region)


def _rollout_global(spec, state, fine, done, client, progress, should_stop, clock):
    history = state.attrs["history_frames"]
    metadata = state.metadata
    mask = state.building_mask[:]
    frozen = _frozen_scales(state, history) if spec.normalization == "frozen" else {}
    inference = _inference_options(spec, state)
    for step in range(done, spec.steps):
        if should_stop():
            raise Stopped
        last = history + step - 1
        # 예측만 끝난 스텝은 재추론하지 않고 원본 격자로 복원
        if state.attrs["completed_steps"] <= step:
            flow = state.read_region(slice(max(0, last + 1 - spec.history_length), last + 1))
            request = metadata | frozen | {"time": float(state.time[last]), "inference": inference}
            flow_next, _, metadata_next = _predict_next(client, flow, mask, request, should_stop, clock)
            _record_model(state, metadata_next)
            frame = state.add_frame(request["time"] + metadata["time_step"])
            state.write_region(frame, flow_next[0])
            _commit(state, frame, step, metadata_next["normalization"])
        if fine is not None:
            fine.attrs["prediction"] = dict(state.attrs["prediction"])
            frame = fine.add_frame(float(state.time[last + 1]))
            add_regridded_delta(state, history - 1, last + 1, fine, history - 1, frame)
            _commit(fine, frame, step, state.attrs["normalization"][step])
        progress(Progress(steps_done=step + 1, steps_total=spec.steps))


def _rollout_tiled(spec, state, window, done, client, progress, should_stop, clock, concurrency):
    history = state.attrs["history_frames"]
    base = state.metadata
    metadata = FlowMetadata.parse(base)
    inference = _inference_options(spec, state)
    tiles = tile_layout(state.shape, window, spec.tiling.halo, metadata.boundary_conditions)
    # 초기 이력의 타일별 정규화 통계를 실행 동안 재사용
    frozen = {}
    n_channels = len(metadata.channels)
    chunks = tuple(min(size, chunk) for size, chunk in zip(window, state.flow.chunks[1:4]))
    scratch = state.group.require_dataset(
        f"{SCRATCH}/tiles",
        shape=(len(tiles), *window, n_channels),
        chunks=(1, *chunks, n_channels),
        dtype="float32",
    )

    def predict_tile(index, last):
        tile = tiles[index]
        origin = [
            o + s.start * d for o, s, d in zip(metadata.grid.origin, tile.window, metadata.grid.spacing)
        ]
        request = base | {
            "grid": base["grid"] | {"origin": origin, "shape": list(window)},
            "boundary_conditions": tile.boundary_conditions,
            "time": float(state.time[last]),
            "inference": inference,
        }
        if spec.normalization == "frozen":
            if index not in frozen:
                frozen[index] = _frozen_scales(state, history, tile.window)
            request |= frozen[index]
        flow = state.read_region(slice(max(0, last + 1 - spec.history_length), last + 1), tile.window)
        mask = state.building_mask[tile.window]
        # 동시 요청은 호출 측에서 묶음 경과 시간으로 측정
        flow_next, _, metadata_next = _predict_next(
            client, flow, mask, request, should_stop, {"predict_s": 0.0}
        )
        return flow_next[0], int((~np.isfinite(flow_next[0][mask == 0])).sum()), metadata_next

    # 같은 스텝의 타일을 묶어 동시 추론
    # 재개를 위해 완료 기록은 타일 순서 유지
    with ThreadPoolExecutor(concurrency) as pool:
        for step in range(done, spec.steps):
            last = history + step - 1
            resumed = state.attrs.get("tile_progress", {})
            if resumed.get("step") != step:
                resumed = {"done": 0, "normalization": None}
            ranges = resumed["normalization"]
            for start in range(resumed["done"], len(tiles), concurrency):
                if should_stop():
                    raise Stopped
                batch = range(start, min(start + concurrency, len(tiles)))
                began = time.monotonic()
                results = list(pool.map(partial(predict_tile, last=last), batch))
                clock["predict_s"] += time.monotonic() - began
                for index, (tile_next, broken, metadata_next) in zip(batch, results):
                    # 무효 예측은 완료로 기록하기 전에 중단
                    if broken:
                        raise RuntimeError(
                            f"step {step + 1} tile {index + 1}: {broken} values in fluid cells are not finite"
                        )
                    scratch[index] = tile_next
                    _record_model(state, metadata_next)
                    ranges = _widen(ranges, metadata_next["normalization"])
                    # scratch 기록을 마친 타일만 완료 처리
                    state.attrs["tile_progress"] = {"step": step, "done": index + 1, "normalization": ranges}
                    progress(
                        Progress(
                            steps_done=step,
                            steps_total=spec.steps,
                            tiles_done=index + 1,
                            tiles_total=len(tiles),
                        )
                    )
            frame = state.add_frame(float(state.time[last]) + metadata.time_step)
            _blend(state, frame, scratch, tiles)
            _commit(state, frame, step, ranges)
            progress(
                Progress(
                    steps_done=step + 1, steps_total=spec.steps, tiles_done=len(tiles), tiles_total=len(tiles)
                )
            )


def _inference_options(spec, state):
    """반복 스텝의 대기 조건을 첫 이력의 값으로 고정"""
    from modules.domain.grids.inflow import flow_direction, infer_conditions

    if "model_conditions" in state.attrs:
        options = {
            name: value
            for name, value in state.attrs["model_conditions"].items()
            if name not in {"run_id", "checkpoint_signature"} and not name.endswith("sha256")
        }
        options["tiled"] = spec.mode == "tiled"
        state.attrs["model_conditions"] = options
        return options
    metadata = FlowMetadata.parse(state.metadata)
    options = {"ground_z": float(metadata.grid.origin[2]), "tiled": spec.mode == "tiled"}
    if spec.source.inflow is not None:
        dx, dy = flow_direction(spec.source.inflow.direction)
        options.update(
            wind_speed_m_s=float(spec.source.inflow.speed),
            wind_direction_deg=float(np.degrees(np.arctan2(dy, dx)) % 360),
        )
    else:
        first = state.read_region(state.attrs["history_frames"] - 1)[0]
        options.update(
            infer_conditions(
                first,
                state.building_mask[:] != 0,
                metadata,
                {"zref": 10, "z0": 0.1, "displacement": 0},
                options["ground_z"],
            )
        )
    state.attrs["model_conditions"] = options
    return options


def _record_model(store, metadata):
    names = ("model", "model_type", "checkpoint_epoch", "warnings", "inference_conditions")
    previous = {
        name: value
        for name, value in store.attrs["prediction"].items()
        if name != "run_id" and not name.endswith("sha256")
    }
    store.attrs["prediction"] = {**previous, **{name: metadata[name] for name in names if name in metadata}}


def _blend(state, frame, scratch, tiles):
    weights = [blend_weights(tile) for tile in tiles]
    for region in state.slabs():
        low, high = region[0].start, region[0].stop
        value = np.zeros((high - low, *state.shape[1:], scratch.shape[-1]), dtype=np.float32)
        total = np.zeros(value.shape[:3], dtype=np.float32)
        for index, (tile, (wx, wy, wz)) in enumerate(zip(tiles, weights)):
            x, y, z = tile.window
            a, b = max(low, x.start), min(high, x.stop)
            if a >= b:
                continue
            weight = wx[a - x.start : b - x.start, None, None] * wy[None, :, None] * wz[None, None, :]
            value[a - low : b - low, y, z] += weight[..., None] * scratch[index, a - x.start : b - x.start]
            total[a - low : b - low, y, z] += weight
        # 미포함 셀은 NaN으로 남겨 _commit에서 검출
        with np.errstate(invalid="ignore"):
            value /= total[..., None]
        value[state.building_mask[region] == 1] = 0.0
        state.write_region(frame, value, region)


def _commit(store, frame, step, normalization):
    """유체 셀의 유한성을 확인한 뒤 완료 스텝 갱신"""
    cells = written = 0
    for region in store.slabs():
        fluid = store.building_mask[region] == 0
        cells += int(fluid.sum())
        written += int((np.isfinite(store.read_region(frame, region)[0]).all(axis=-1) & fluid).sum())
    if written < cells:
        raise RuntimeError(
            f"step {step + 1}: {cells - written} of {cells} fluid cells were not written or are not finite"
        )
    store.attrs.update(
        completed_steps=step + 1,
        normalization=store.attrs["normalization"][:step] + [normalization],
        coverage=store.attrs["coverage"][:step]
        + [{"cells": cells, "written": written, "missing": cells - written}],
    )


def _frozen_scales(store, history, region=None):
    real = torch.from_numpy(store.read_region(slice(0, history), region))
    return {
        "state_scale": normalize.state_scale(real).tolist(),
        "delta_scale": normalize.delta_scale(real).tolist(),
    }


def _widen(ranges, normalization):
    names = ("state_scale", "delta_scale")
    ranges = ranges or {name: {"min": normalization[name], "max": normalization[name]} for name in names}
    return {
        name: {
            "min": [min(pair) for pair in zip(ranges[name]["min"], normalization[name])],
            "max": [max(pair) for pair in zip(ranges[name]["max"], normalization[name])],
        }
        for name in names
    }


def _predict_next(client, flow, mask, metadata, should_stop, clock):
    for attempt in range(RETRIES + 1):
        began = time.monotonic()
        try:
            return client.predict_next(flow, mask, metadata)
        except TritonRequestError as error:
            # 4xx 입력 오류는 검증 내용을 유지해 즉시 전파
            if error.status < 500 or attempt == RETRIES:
                raise
        except (OSError, http.client.HTTPException):
            if attempt == RETRIES:
                raise
        finally:
            clock["predict_s"] += time.monotonic() - began
        wake = time.monotonic() + BACKOFF * 2**attempt
        while time.monotonic() < wake:
            if should_stop():
                raise Stopped
            time.sleep(min(1.0, max(0.0, wake - time.monotonic())))
