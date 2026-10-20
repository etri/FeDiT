import itertools
import json
import logging
import math
import threading
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, replace
from functools import cached_property
from pathlib import Path

import numpy as np

from modules.domain.coordinates import mesh_matrix
from modules.domain.schemas import Case, ResultMetadata
from modules.domain.transport.fields import AXES
from modules.infrastructure.management.client import ApiClient, ApiError, ApiUnreachable
from modules.infrastructure.mongo import connection, storage
from modules.infrastructure.mongo.assets import case_directory, mongo_enabled
from modules.infrastructure.mongo.storage import open_group, store_exists, store_revision
from modules.settings.rendering import path_component

log = logging.getLogger(__name__)
STORE_SCHEMA = "flowcast.store/1"
ROLLOUT = ".prediction.zarr"
SPEED = "speed"
TOLERANCE = 1e-9  # 상자 면 위 셀 중심의 반올림 오차 허용


def samples(n, stride):
    """stride 블록마다 중앙 셀을 선택하고 마지막 블록은 끝 경계에 맞춤"""
    start = min(stride - 1, n - 1) // 2
    count = len(range(start, n, stride))
    # 끝자락을 마지막 블록에 붙여 영역 경계 일치
    return slice(start, None, stride), np.append(np.arange(count) * stride, n)


def stride_for(shape, max_cells):
    if max_cells < 1:
        raise ValueError(f"max_cells must be at least 1, got {max_cells}")
    stride = 1
    while math.prod(len(samples(n, stride)[1]) - 1 for n in shape) > max_cells:
        stride += 1
    return stride


def region_slices(grid, box):
    """셀 중심이 물리 좌표 상자 안에 있는 범위 선택"""
    box = np.asarray(box, dtype=np.float64)
    position = (np.sort(box, axis=0) - grid.origin) / grid.spacing - 0.5
    first = np.clip(np.ceil(position[0] - TOLERANCE), 0, None).astype(int)
    last = np.minimum(np.floor(position[1] + TOLERANCE).astype(int), np.array(grid.shape) - 1)
    if (first > last).any():
        raise ValueError(f"the region {box.tolist()} holds no cell centre of the grid")
    return tuple(slice(int(a), int(b) + 1) for a, b in zip(first, last))


def read_slabs(array, lead, index):
    """x축 슬랩으로 나눠 읽어 임시 메모리 제한"""
    x = index[0]
    thickness = array.chunks[len(lead)]
    parts = []
    for _, slab in itertools.groupby(range(array.shape[len(lead)])[x], key=lambda cell: cell // thickness):
        cells = list(slab)
        parts.append(array[(*lead, slice(cells[0], cells[-1] + 1, x.step), *index[1:])])
    return np.concatenate(parts)


def scalar(values, channels, quantity):
    if quantity == SPEED:
        total = np.zeros(values.shape[:-1], dtype=np.float32)
        for axis in AXES:
            if f"velocity_{axis}" in channels:
                part = values[..., channels.index(f"velocity_{axis}")]
                total += part * part
        return np.sqrt(total)
    return values[..., channels.index(quantity)]


def case_matrix(case):
    mesh = case.mesh if case else None
    return mesh_matrix(mesh.up_axis, **mesh.to_world.model_dump()) if mesh else np.eye(4)


@dataclass
class Sample:
    """표시용 셀 값 [a, b, c, C]와 마스크이며 단면 축 길이는 1"""

    frame: int
    time: float
    predicted: bool
    stride: int
    values: np.ndarray  # float32 [a, b, c, C]이며 단면 축 길이는 1
    solid: np.ndarray  # bool [a, b, c]
    edges: list  # 축별 블록 경계 [n + 1]
    centres: list  # 축별 셀 중심 [n]

    @cached_property
    def valid(self):
        out = ~self.solid
        for channel in range(self.values.shape[-1]):
            out &= np.isfinite(self.values[..., channel])
        return out

    @property
    def nbytes(self):
        return self.values.nbytes + 2 * self.solid.nbytes


class FrameCache:
    """바이트 상한을 넘는 항목은 저장하지 않는 LRU 캐시"""

    def __init__(self, max_bytes):
        self.max_bytes, self.nbytes = max_bytes, 0
        self.items = OrderedDict()
        self.lock = threading.Lock()

    def get(self, key):
        with self.lock:
            if key in self.items:
                self.items.move_to_end(key)
                return self.items[key]
        return None

    def put(self, key, value):
        with self.lock:
            if key in self.items or value.nbytes > self.max_bytes:
                return
            self.items[key] = value
            self.nbytes += value.nbytes
            while self.nbytes > self.max_bytes:
                _, dropped = self.items.popitem(last=False)
                self.nbytes -= dropped.nbytes


class FlowResult:
    def __init__(self, metadata, case, path, cache, executor, max_cells):
        group = open_group(path, mode="r")
        self.flow, self.mask = group["flow"], group["building_mask"]
        self.metadata, self.case, self.path = metadata, case, Path(path)
        # 표시 이름과 별도로 합성 유입 및 저장 이력의 출처 보존
        self.provenance = dict(group.attrs.get("provenance") or {})
        self.grid = metadata.grid
        self.boundary_conditions = group.attrs["metadata"]["boundary_conditions"]
        if tuple(self.flow.shape[1:4]) != self.grid.shape or self.mask.shape != self.grid.shape:
            raise ValueError(
                f"{path}: grid shape {self.grid.shape} does not match the arrays {self.flow.shape}"
            )
        self.channels = [channel.name for channel in metadata.channels]
        self.times = metadata.times
        self.cache, self.executor, self.max_cells = cache, executor, max_cells
        self.pending = {}
        self.lock = threading.Lock()
        # 첫 poll은 메타데이터를 다시 읽어 직후 기록된 스텝도 반영
        self.stamp = None

    def attrs_stamp(self):
        return store_revision(self.path)

    def poll(self):
        """새 프레임은 읽기 스레드에서 조회"""
        stamp = self.attrs_stamp()
        if stamp is None or stamp == self.stamp:
            return None
        group = open_group(self.path, mode="r")
        attrs = group.attrs.asdict()
        extra = self.metadata.model_dump(
            include={"job_id", "case_id", "state", "synthetic", "attribution", "origin", "created_at"}
        )
        metadata = ResultMetadata.from_store(self.path, attrs, group["time"][:], **extra)
        if (
            metadata.history_frames != self.metadata.history_frames
            or metadata.times[: self.n_frames] != self.times
        ):
            raise ValueError(f"{self.path} was written again from the start")
        return group["flow"], metadata, stamp

    def extend(self, update):
        """조회한 프레임은 이벤트 루프 스레드에서 반영"""
        flow, metadata, stamp = update
        before = self.n_frames
        self.flow = flow
        self.metadata, self.stamp = metadata, stamp
        self.times = metadata.times
        return self.n_frames - before

    @property
    def n_frames(self):
        return len(self.times)

    @property
    def quantities(self):
        units = {channel.name: channel.unit for channel in self.metadata.channels}
        return {SPEED: "m/s", **units} if any(name.startswith("velocity_") for name in units) else units

    def predicted(self, frame):
        return frame >= self.metadata.history_frames

    def select(self, region=None, plane=None, max_cells=None):
        ranges = list(
            region_slices(self.grid, region) if region is not None else map(slice, [0] * 3, self.grid.shape)
        )
        if plane is not None:
            axis, position = plane
            offset = (position - self.grid.origin[axis]) / self.grid.spacing[axis]
            if not -TOLERANCE <= offset <= self.grid.shape[axis] + TOLERANCE:
                raise ValueError(f"slice {AXES[axis]}={position:g} is outside the domain")
            cell = min(max(math.floor(offset), ranges[axis].start), ranges[axis].stop - 1)
            ranges[axis] = slice(cell, cell + 1)
        stride = stride_for([r.stop - r.start for r in ranges], max_cells or self.max_cells)
        index, edges = [], []
        for r in ranges:
            pick, edge = samples(r.stop - r.start, stride)
            index.append(slice(r.start + pick.start, r.stop, stride))
            edges.append(r.start + edge)
        return tuple(index), edges, stride

    def key(self, frame, index):
        return (str(self.path), frame, tuple((pick.start, pick.stop, pick.step) for pick in index))

    def sample(self, frame, region=None, plane=None, max_cells=None):
        if not 0 <= frame < self.n_frames:
            raise IndexError(f"frame {frame} is outside the {self.n_frames} trusted frames")
        selection = self.select(region, plane, max_cells)
        key = self.key(frame, selection[0])
        with self.lock:
            future = self.pending.get(key)
        if future is not None:
            return future.result()
        return self.cache.get(key) or self.load(frame, *selection)

    def blend(self, frame, phase, region=None, plane=None, max_cells=None):
        """다음 프레임과 phase 비율로 보간한 표시 자료"""
        first = self.sample(frame, region, plane, max_cells)
        if phase <= 0 or frame + 1 >= self.n_frames:
            return first
        second = self.sample(frame + 1, region, plane, max_cells)
        return replace(
            first,
            time=first.time + phase * (second.time - first.time),
            predicted=second.predicted if phase >= 0.5 else first.predicted,
            values=first.values + np.float32(phase) * (second.values - first.values),
        )

    def prefetch(self, frame, region=None, plane=None, max_cells=None):
        if not 0 <= frame < self.n_frames:
            return None
        selection = self.select(region, plane, max_cells)
        key = self.key(frame, selection[0])
        with self.lock:
            if key in self.pending or self.cache.get(key) is not None:
                return None
            future = self.pending[key] = self.executor.submit(self.load, frame, *selection)
        future.add_done_callback(lambda _: self.pending.pop(key, None))
        return future

    def load(self, frame, index, edges, stride):
        origin, spacing = self.grid.origin, self.grid.spacing
        sample = Sample(
            frame=frame,
            time=self.times[frame],
            predicted=self.predicted(frame),
            stride=stride,
            values=read_slabs(self.flow, (frame,), index),
            solid=self.solid(index),
            edges=[origin[a] + edge * spacing[a] for a, edge in enumerate(edges)],
            centres=[
                origin[a] + (np.arange(n)[pick] + 0.5) * spacing[a]
                for a, (n, pick) in enumerate(zip(self.grid.shape, index))
            ],
        )
        self.cache.put(self.key(frame, index), sample)
        return sample

    def solid(self, index):
        key = self.key(None, index)
        solid = self.cache.get(key)
        if solid is None:
            solid = read_slabs(self.mask, (), index) != 0
            self.cache.put(key, solid)
        return solid

    def mask_volume(self, region=None, max_cells=None):
        """블록의 고체 비율이 절반 이상이면 고체로 표시"""
        ranges = (
            region_slices(self.grid, region)
            if region is not None
            else tuple(map(slice, [0] * 3, self.grid.shape))
        )
        stride = stride_for([r.stop - r.start for r in ranges], max_cells or self.max_cells)
        edges = [r.start + samples(r.stop - r.start, stride)[1] for r in ranges]
        out = np.zeros([len(e) - 1 for e in edges], dtype=bool)
        step = max(1, self.mask.chunks[0] // stride)
        for first in range(0, out.shape[0], step):
            last = min(first + step, out.shape[0])
            x = edges[0][first : last + 1]
            count = self.mask[x[0] : x[-1], ranges[1], ranges[2]] != 0
            for axis, starts in enumerate(
                (x[:-1] - x[0], edges[1][:-1] - edges[1][0], edges[2][:-1] - edges[2][0])
            ):
                count = np.add.reduceat(count, starts, axis=axis, dtype=np.int32)
            cells = (
                np.diff(x)[:, None, None]
                * np.diff(edges[1])[None, :, None]
                * np.diff(edges[2])[None, None, :]
            )
            out[first:last] = 2 * count >= cells
        return out, [self.grid.origin[a] + edge * self.grid.spacing[a] for a, edge in enumerate(edges)]

    def mask_levels(self):
        nx, ny, nz = self.grid.shape
        levels = np.zeros((nx, ny), dtype=np.int32)
        for first in range(0, nx, self.mask.chunks[0]):
            solid = self.mask[first : first + self.mask.chunks[0]] != 0
            levels[first : first + len(solid)] = np.where(
                solid.any(axis=2), nz - np.argmax(solid[:, :, ::-1], axis=2), 0
            )
        return levels


class DataAdapter:
    def __init__(self, settings, api=None):
        self.settings = settings
        self.api = api if api is not None else ApiClient(settings.api_url)
        self.cache = FrameCache(settings.cache_mb * 2**20)
        self.executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="prefetch")

    def close(self):
        self.executor.shutdown(wait=False, cancel_futures=True)

    def cases(self):
        try:
            return [Case.model_validate(item["case"]) for item in self.api.cases()]
        except (ApiUnreachable, ApiError):
            if mongo_enabled():
                documents = connection.database()["cases"].find({}).sort("_id", 1)
                return [Case.model_validate(document["case"]) for document in documents]
            found = []
            for path in sorted((self.settings.data_dir / "cases").glob("*/case.json")):
                try:
                    found.append(self.case(path.parent.name))
                except (ValueError, OSError) as error:  # 깨진 기술서는 건너뛰고 목록 유지
                    log.warning("skipping case %s: %s", path.parent.name, error)
            return found

    def case(self, case_id):
        path_component("case id", case_id)
        try:
            return Case.model_validate(self.api.case(case_id))
        except (ApiUnreachable, ApiError):
            if mongo_enabled():
                document = storage.get_case(case_id)
                if document is None:
                    raise FileNotFoundError(f"Case description was not found: {case_id}")
                return Case.model_validate(document)
        return Case.model_validate(json.loads((self.settings.case_dir(case_id) / "case.json").read_text()))

    def asset_directory(self, case):
        return case_directory(self.settings, case)

    def results(self, case_id):
        directory = self.settings.case_dir(case_id) / "results"
        try:
            entries = self.api.case_results(case_id)
            return [ResultMetadata.model_validate(entry["result"]) for entry in entries if entry["result"]]
        except (ApiUnreachable, ApiError):
            case, found = self.case(case_id), []
            paths = (
                [Path(path) for path in storage.list_stores(directory)]
                if mongo_enabled()
                else [*sorted(directory.glob("*.zarr")), *sorted((directory / "live").glob("*.zarr"))]
            )
            seen = set()
            for path in paths:
                # output_grid=source의 부가 저장소는 별도 결과에서 제외
                name = path.name.removesuffix(ROLLOUT)
                if path.stem not in seen and (
                    name == path.name or not store_exists(path.with_name(f"{name}.zarr"))
                ):
                    try:
                        found.append(self.store_metadata(case, path, job_id=path.name.removesuffix(".zarr")))
                        seen.add(path.stem)
                    except (ValueError, KeyError, OSError) as error:
                        log.warning("skipping result store %s: %s", path, error)
            return found

    def source_frames(self, case_id):
        case = self.case(case_id)
        if case.flow is None:
            return None
        try:
            group = open_group(self.settings.case_dir(case_id) / case.flow.source, mode="r")
            return min(group["flow"].shape[0], group["time"].shape[0])
        except (KeyError, ValueError, OSError) as error:
            log.warning("cannot count the frames of the flow source of %s: %s", case_id, error)
            return None

    def store_metadata(self, case, path, job_id=None):
        if not store_exists(path):
            raise FileNotFoundError(f"no flow store at {path}")
        group = open_group(path, mode="r")
        if group.attrs.get("schema") != STORE_SCHEMA:
            raise ValueError(f"{path} is not a {STORE_SCHEMA} store")
        provenance = group.attrs.get("provenance") or {}
        metadata = ResultMetadata.from_store(
            path,
            dict(group.attrs),
            group["time"][:],
            job_id=job_id,
            case_id=case.id,
            synthetic=case.synthetic or bool(provenance.get("synthetic")),
            attribution=case.attribution,
        )
        if job_id is not None:
            if metadata.origin is None:
                live = self.settings.case_dir(case.id) / "results" / "live"
                metadata.origin = "live" if Path(path).resolve().is_relative_to(live.resolve()) else "batch"
            if "inflow" not in (metadata.prediction or {}) and isinstance(provenance.get("inflow"), dict):
                metadata.prediction = {**(metadata.prediction or {}), "inflow": provenance["inflow"]}
        return metadata

    def open(self, case_id, job_id=None):
        # 초기 유동장 또는 작업 결과 선택
        case = self.case(case_id)
        if job_id is None:
            if case.flow is None:
                raise FileNotFoundError(f"case {case_id} has no flow store")
            path = self.settings.case_dir(case_id) / case.flow.source
            metadata = self.store_metadata(case, path)
        else:
            path = self.settings.case_dir(case_id) / "results" / f"{path_component('job id', job_id)}.zarr"
            if not store_exists(path):
                live = path.parent / "live" / path.name
                if store_exists(live):
                    path = live

            # API 메타데이터 조회와 저장소 대체 조회
            try:
                metadata = self.api.result(job_id)
                # API 컨테이너 경로가 없으면 Case의 기본 경로 사용
                if store_exists(metadata.store):
                    path = Path(metadata.store)
            except (ApiUnreachable, ApiError):
                metadata = self.store_metadata(case, path, job_id=job_id)
        return FlowResult(metadata, case, path, self.cache, self.executor, self.settings.max_cells)
