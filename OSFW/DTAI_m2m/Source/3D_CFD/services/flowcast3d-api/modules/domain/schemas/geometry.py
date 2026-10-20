"""형상으로부터 모델 입력을 구성하는 물리 옵션"""

import math
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictInt, model_validator

MAX_VOXELS = 1048576
Vector = tuple[float, float, float]
GridSize = Annotated[StrictInt, Field(ge=16, le=4096)]


class PredictionInputParameters(BaseModel):
    """물리 좌표와 명시적 형상 마스크로 모델 입력을 준비하는 옵션"""

    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    speed: float | None = Field(default=None, gt=0, le=100)
    direction: float | None = Field(default=None, ge=0, lt=360)
    grid_shape: tuple[GridSize, GridSize, GridSize] = (64, 64, 64)
    domain_min: Vector | None = None
    domain_max: Vector | None = None
    unit_scale: float = Field(default=1.0, gt=0, le=1e6)
    up_axis: Literal["z", "y"] = "z"
    voxelization: Literal["heightmap", "parity"] = "heightmap"
    rho: float = Field(default=1.225, gt=0)
    mu: float = Field(default=1.81e-5, gt=0)
    zref: float = Field(default=10.0, gt=0)
    z0: float = Field(default=0.1, gt=0)
    displacement: float = Field(default=0.0, ge=0)
    ground_z: float | None = None
    mask_key: str | None = Field(default=None, pattern=r"^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$")
    solid_value: Annotated[StrictInt, Field(ge=0, le=1)] | None = None
    axis_order: Literal["XYZ", "XZY", "YXZ", "YZX", "ZXY", "ZYX"] | None = None
    origin: Vector | None = None
    spacing: Vector | None = None

    @model_validator(mode="after")
    def _physical_options(self):
        """격자 예산과 대기 경계 조건의 물리 범위 확인"""
        if math.prod(self.grid_shape) > MAX_VOXELS:
            raise ValueError("grid_shape exceeds 1048576 voxels.")
        if self.zref <= self.displacement:
            raise ValueError("zref must be greater than displacement.")
        if (self.domain_min is None) != (self.domain_max is None):
            raise ValueError("domain_min and domain_max must be supplied together.")
        if self.domain_min is not None and any(
            low >= high for low, high in zip(self.domain_min, self.domain_max)
        ):
            raise ValueError("domain_max must exceed domain_min on every axis.")
        if self.spacing is not None and min(self.spacing) <= 0:
            raise ValueError("spacing must be positive on every axis.")
        return self
