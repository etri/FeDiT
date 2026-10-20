import copy
import operator

from modules.domain.schemas import CANONICAL_AXIS_ORDER, FlowMetadata
from modules.infrastructure.mongo.storage import open_group

SCHEMA = "flowcast.store/1"
DEFAULT_CHUNK = (64, 64, 64)


class FlowStore:
    def __init__(self, group):
        self.group = group
        self.flow = group["flow"]
        self.time = group["time"]
        self.building_mask = group["building_mask"]

    @classmethod
    def create(cls, path, metadata, chunk=DEFAULT_CHUNK, overwrite=False):
        parsed = FlowMetadata.parse(metadata)
        if parsed.axis_order != CANONICAL_AXIS_ORDER or parsed.units:
            raise ValueError("a store keeps the canonical axis order and canonical units")
        shape, n_channels = parsed.grid.shape, len(parsed.channels)
        chunk = tuple(min(c, n) for c, n in zip(chunk, shape, strict=True))
        group = open_group(path, mode="w" if overwrite else "w-")
        group.create_dataset(
            "flow", shape=(0, *shape, n_channels), chunks=(1, *chunk, n_channels), dtype="float32"
        )
        group.create_dataset("time", shape=(0,), chunks=(1024,), dtype="float64")
        group.create_dataset("building_mask", shape=shape, chunks=chunk, dtype="uint8", fill_value=0)
        group.attrs.update(
            schema=SCHEMA, metadata=parsed.model_dump(mode="json", by_alias=True, exclude_none=True)
        )
        return cls(group)

    @classmethod
    def open(cls, path, mode="r"):
        group = open_group(path, mode=mode)
        if group.attrs.get("schema") != SCHEMA:
            raise ValueError(f"{path} is not a {SCHEMA} store")
        return cls(group)

    @property
    def attrs(self):
        return self.group.attrs

    @property
    def metadata(self):
        # 호출자의 수정이 attrs 캐시에 반영되지 않도록 복사
        return copy.deepcopy(self.group.attrs["metadata"])

    @property
    def shape(self):
        return tuple(self.flow.shape[1:4])

    @property
    def n_frames(self):
        return self.flow.shape[0]

    def add_frame(self, time):
        index = self.n_frames
        self.flow.resize(index + 1, *self.flow.shape[1:])
        self.time.resize(index + 1)
        self.time[index] = time
        return index

    def truncate(self, n_frames):
        """재개 시 끝까지 기록하지 못한 프레임 제거"""
        self.flow.resize(n_frames, *self.flow.shape[1:])
        self.time.resize(n_frames)

    def read_region(self, frames, region=None):
        region = region or (slice(None),) * 3
        if not isinstance(frames, slice):
            # slice의 조용한 범위 초과를 막기 위해 먼저 검사
            frame = operator.index(frames)
            if not -self.n_frames <= frame < self.n_frames:
                raise IndexError(f"frame {frame} is out of range for a store with {self.n_frames} frames")
            frame %= self.n_frames
            frames = slice(frame, frame + 1)
        return self.flow[(frames, *region)]

    def write_region(self, frame, values, region=None):
        region = region or (slice(None),) * 3
        self.flow[(frame, *region)] = values

    def slabs(self, thickness=None):
        thickness = thickness or self.flow.chunks[1]
        for start in range(0, self.shape[0], thickness):
            yield (slice(start, min(start + thickness, self.shape[0])), slice(None), slice(None))
