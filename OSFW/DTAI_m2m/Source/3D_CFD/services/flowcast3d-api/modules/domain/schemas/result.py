from typing import Literal

from pydantic import BaseModel

from modules.domain.coordinates.units import canonical_unit
from modules.domain.schemas.case import Attribution
from modules.domain.schemas.flow import CANONICAL_AXIS_ORDER, FlowMetadata, Grid
from modules.domain.schemas.job import JobState

MODEL = "flowcast3d"
ROLES = {"velocity_x": "u", "velocity_y": "v", "velocity_z": "w", "pressure": "pressure"}


class ChannelInfo(BaseModel):
    name: str
    unit: str | None  # 변환 단위가 없는 채널은 None
    role: Literal["u", "v", "w", "pressure", "other"]


class ResultMetadata(BaseModel):
    job_id: str | None = None
    case_id: str | None = None
    model: str = MODEL
    state: JobState | None = None
    # 등록 시각(UTC epoch 초)
    created_at: float | None = None
    origin: Literal["live", "batch"] | None = None
    store: str
    synthetic: bool = False
    attribution: Attribution | None = None
    grid: Grid
    axis_order: str = CANONICAL_AXIS_ORDER
    channels: list[ChannelInfo]
    # 앞쪽 history_frames개는 실제 이력(초)
    times: list[float]
    time_step: float
    history_frames: int
    completed_steps: int
    # 고체 마스크는 1, 유체 셀의 NaN과 Inf는 무효
    mask: dict = {"array": "building_mask", "solid": 1, "invalid": "non-finite values in fluid cells"}
    transform: dict | None = None
    prediction: dict | None = None

    @classmethod
    def from_store(cls, store, attrs, times, **extra):
        metadata = FlowMetadata.parse(attrs["metadata"])
        history = int(attrs.get("history_frames", len(times)))
        completed = int(attrs.get("completed_steps", 0))
        provenance = {
            key: value for key, value in attrs.get("provenance", {}).items() if key in cls.model_fields
        }
        extra = {**provenance, **extra}
        prediction = attrs.get("prediction") or {}
        extra.setdefault("model", prediction.get("model", MODEL))
        return cls(
            store=str(store),
            grid=metadata.grid,
            channels=[
                ChannelInfo(name=name, unit=canonical_unit(name), role=ROLES.get(name, "other"))
                for name in metadata.channels
            ],
            times=[float(t) for t in times[: history + completed]],
            time_step=metadata.time_step,
            history_frames=history,
            completed_steps=completed,
            transform=attrs.get("transform"),
            prediction=attrs.get("prediction"),
            **extra,
        )
