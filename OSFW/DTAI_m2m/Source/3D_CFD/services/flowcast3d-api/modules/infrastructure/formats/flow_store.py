from itertools import pairwise
from pathlib import Path

import numpy as np
import zarr

from modules.domain.errors import StoreError
from modules.domain.schemas import CANONICAL_AXIS_ORDER, FlowMetadata, SpecError
from modules.infrastructure.mongo.storage import open_group, store_exists

SCHEMA = "flowcast.store/1"
DAMAGED = (ValueError, TypeError, AttributeError, KeyError, OSError, zarr.errors.MetadataError)


class StoreReader:
    def __init__(self, path):
        self.path = Path(path)
        try:
            self._open()
        except StoreError:
            raise
        except DAMAGED as error:
            # 저장소 읽기 오류를 StoreError로 통일
            raise StoreError(f"{self.path} is unreadable: {type(error).__name__}: {error}") from None

    def _open(self):
        if not store_exists(self.path):
            raise StoreError(f"{self.path} is not a Zarr v2 group")
        group = open_group(self.path, mode="r")
        self.attrs = group.attrs.asdict()
        if self.attrs.get("schema") != SCHEMA:
            raise StoreError(f"{self.path} is not a {SCHEMA} store")
        try:
            self.metadata = FlowMetadata.parse(self.attrs.get("metadata") or {})
        except SpecError as error:
            raise StoreError(f"{self.path} has invalid metadata: {error.errors}") from None
        if self.metadata.axis_order != CANONICAL_AXIS_ORDER or self.metadata.units:
            raise StoreError(f"{self.path} must keep the canonical axis order and canonical units")

        self.grid = self.metadata.grid
        self.channels = self.metadata.channels
        self.flow = self._array(group, "flow", "float32", (*self.grid.shape, len(self.channels)))
        self.time = self._array(group, "time", "float64", ())
        self.building_mask = self._array(group, "building_mask", "uint8", None)
        if self.building_mask.shape != self.grid.shape:
            raise StoreError(
                f"{self.path}: building_mask must be {self.grid.shape}, got {self.building_mask.shape}"
            )

        # 완료된 이력과 예측 프레임만 신뢰
        # history_frames가 없으면 전체가 실제 자료
        written = min(self.flow.shape[0], self.time.shape[0])
        history = self.attrs.get("history_frames")
        self.n_frames = (
            written
            if history is None
            else min(written, int(history) + int(self.attrs.get("completed_steps", 0)))
        )
        self.history_frames = self.n_frames if history is None else min(int(history), self.n_frames)
        if not np.isfinite(self.times()).all():
            raise StoreError(f"{self.path}: time must be finite")

    def _array(self, group, name, dtype, trailing):
        try:
            array = group[name]
        except KeyError:
            raise StoreError(f"{self.path} has no {name!r} array") from None
        if getattr(array, "dtype", None) != np.dtype(dtype):
            raise StoreError(f"{self.path}: {name} must be a {dtype} array")
        if trailing is not None and array.shape[1:] != trailing:
            raise StoreError(
                f"{self.path}: {name} must be [T, {', '.join(map(str, trailing))}], got {array.shape}"
            )
        return array

    def times(self):
        return self.time[: self.n_frames]

    def kind(self, frame):
        return "history" if frame < self.history_frames else "prediction"

    def cell(self, index, frame=None):
        frames = slice(0, self.n_frames) if frame is None else frame
        return self.flow[(frames, *index)]

    def read(self, frame, region):
        return self.flow[(frame, *region)]

    def blocks(self, lower, upper):
        """[lower, upper)를 x, y 청크 경계로 나눈 영역 생성"""
        if any(stop <= start for start, stop in zip(lower, upper)):
            return
        cuts = []
        for axis in (0, 1):
            size = self.flow.chunks[axis + 1]
            edges = [lower[axis], *range((lower[axis] // size + 1) * size, upper[axis], size), upper[axis]]
            cuts.append([slice(start, stop) for start, stop in pairwise(edges)])
        for x_range in cuts[0]:
            for y_range in cuts[1]:
                yield (x_range, y_range, slice(lower[2], upper[2]))
