from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

JobState = Literal["queued", "running", "succeeded", "failed", "cancelled"]


class Inflow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # 북쪽(+y) 기준 시계 방향으로 잰 불어오는 풍향(도), +x는 동쪽
    direction: float = Field(ge=0, lt=360)
    speed: float = Field(gt=0, le=30)  # 기준 높이 10 m의 풍속(m/s)


class Source(BaseModel):
    model_config = ConfigDict(extra="forbid")

    flow: str
    mesh: list[str] = []  # 마스크가 없을 때 복셀화할 메시
    # 지정 시 원본 이력 대신 합성 바람 이력 사용
    inflow: Inflow | None = None


class Tiling(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tile: tuple[int, int, int] = (128, 128, 64)
    halo: tuple[int, int, int] = (16, 16, 8)


class Voxelize(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # heightmap은 표면 아래, parity는 닫힌 메시 내부를 고체로 처리
    method: Literal["heightmap", "parity"] = "heightmap"


class JobSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    case_id: str | None = None
    source: Source
    output: str
    steps: int = Field(ge=1)
    history_length: int = Field(default=3, ge=1)
    # global은 전체 격자, tiled는 원본 해상도 타일로 예측
    mode: Literal["global", "tiled"] = "global"
    # 추론 텐서의 셀 수 상한
    max_voxels: int = Field(default=128 * 128 * 128, ge=1)
    output_grid: Literal["prediction", "source"] = "prediction"
    tiling: Tiling = Tiling()
    voxelize: Voxelize = Voxelize()
    # per_step은 매 스텝 재계산, frozen은 실제 이력 통계로 고정
    normalization: Literal["per_step", "frozen"] = "per_step"
    max_attempts: int = Field(default=3, ge=1)


class Progress(BaseModel):
    steps_done: int = 0
    steps_total: int = 0
    tiles_done: int | None = None
    tiles_total: int | None = None
    message: str = ""


class JobStatus(BaseModel):
    job_id: str
    state: JobState
    progress: Progress = Progress()
    attempts: int = 0
    max_attempts: int = 3
    error: str | None = None
    result: dict | None = None
    created_at: float = 0.0
    updated_at: float = 0.0


@dataclass
class Job:
    spec: JobSpec
    status: JobStatus
