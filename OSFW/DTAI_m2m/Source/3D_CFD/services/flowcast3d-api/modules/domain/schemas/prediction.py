"""독립 공개 API의 좌표와 배열 계약"""

import math
from typing import Annotated, Any, Literal

import numpy as np
from pydantic import BaseModel, ConfigDict, Field, model_validator

SCHEMA = "flowcast.prediction/1"
CONTENT_TYPES = {"png": "image/png", "gif": "image/gif", "mp4": "video/mp4"}
MAX_CELLS = 1_048_576
Finite = Annotated[float, Field(strict=True, allow_inf_nan=False)]
Vector = tuple[Finite, Finite, Finite]
Dimension = Annotated[int, Field(strict=True, ge=16, le=4096)]
Shape = tuple[Dimension, Dimension, Dimension]
UNITS = {"coordinates": "m", "velocity": "m/s", "pressure": "Pa"}


class RequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


def check_shape(shape):
    """현재 모델이 전체 격자로 처리할 수 있는 크기 확인"""
    if len(shape) != 3 or min(shape) < 16 or math.prod(shape) > MAX_CELLS:
        raise ValueError("Grid requires at least 16 cells per axis and at most 1048576 cells.")
    if math.prod((size + 15) // 16 for size in shape) > 512:
        raise ValueError("Grid exceeds the 512-token model limit.")


class Wind(RequestModel):
    speed: Finite = Field(gt=0, le=100)
    direction: Finite = Field(ge=0, lt=360)


class InputGrid(RequestModel):
    origin: Vector
    spacing: Vector

    @model_validator(mode="after")
    def positive_spacing(self):
        if min(self.spacing) <= 0:
            raise ValueError("Grid spacing must be positive on every axis.")
        return self


class ResultGrid(InputGrid):
    shape: Shape

    @model_validator(mode="after")
    def supported_shape(self):
        check_shape(self.shape)
        return self


class GeometryOptions(RequestModel):
    grid_shape: Shape | None = None
    domain_min: Vector | None = None
    domain_max: Vector | None = None
    unit_scale: Finite = Field(default=1.0, gt=0, le=1e6)
    up_axis: Literal["z", "y"] = "z"
    voxelization: Literal["heightmap", "parity"] = "heightmap"
    geometry_kind: Literal["surface", "solid_volume", "mask"] | None = None
    mask_key: str | None = Field(default=None, pattern=r"^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$")
    solid_value: Annotated[int, Field(strict=True, ge=0, le=1)] = 1
    axis_order: Literal["XYZ", "XZY", "YXZ", "YZX", "ZXY", "ZYX"] = "ZYX"
    origin: Vector | None = None
    spacing: Vector | None = None

    @model_validator(mode="after")
    def physical_options(self):
        if self.grid_shape is not None:
            check_shape(self.grid_shape)
        if (self.domain_min is None) != (self.domain_max is None):
            raise ValueError("domain_min and domain_max must be supplied together.")
        if self.domain_min is not None and any(a >= b for a, b in zip(self.domain_min, self.domain_max)):
            raise ValueError("domain_max must exceed domain_min on every axis.")
        if self.spacing is not None and min(self.spacing) <= 0:
            raise ValueError("spacing must be positive on every axis.")
        return self


def numeric_array(value, name, shape=None):
    """형상과 유한 실수를 확인하고 외부 배열 복원"""
    try:
        array = np.asarray(value, dtype=object)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be a rectangular numeric array.") from None
    if shape is not None and array.shape != tuple(shape):
        raise ValueError(f"{name} must be a numeric array with shape {shape}.")
    maximum = float(np.finfo(np.float32).max)
    for item in array.flat:
        if isinstance(item, (bool, np.bool_)) or not isinstance(item, (int, float, np.integer, np.floating)):
            raise ValueError(f"{name} must contain real numbers.")
        if abs(item) > maximum:
            raise ValueError(f"{name} must fit in float32.")
        if not math.isfinite(item):
            raise ValueError(f"{name} must contain finite values.")
    return np.asarray(array, dtype=np.float32)


def boolean_array(value, name, shape):
    """결과 마스크의 불리언 자료형과 공간 형상 확인"""
    try:
        array = np.asarray(value, dtype=object)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be a rectangular boolean array.") from None
    if array.shape != tuple(shape) or any(not isinstance(item, (bool, np.bool_)) for item in array.flat):
        raise ValueError(f"{name} must be a boolean array with shape {tuple(shape)}.")
    return np.asarray(array, dtype=np.bool_)


class PredictRequest(RequestModel):
    building_mask: list[Any]
    grid: InputGrid
    wind: Wind
    options: GeometryOptions = Field(default_factory=GeometryOptions)

    @model_validator(mode="after")
    def geometry_array(self):
        try:
            mask = np.asarray(self.building_mask, dtype=object)
        except (TypeError, ValueError):
            raise ValueError("building_mask must be a rectangular three-dimensional binary array.") from None
        if (
            mask.ndim != 3
            or not all(mask.shape)
            or any(
                not isinstance(item, (bool, int, float, np.bool_, np.integer, np.floating))
                or item not in (0, 1)
                for item in mask.flat
            )
        ):
            raise ValueError("building_mask must be a nonempty three-dimensional binary array.")
        check_shape(self.options.grid_shape or mask.shape)
        return self


class PredictionResult(RequestModel):
    schema_name: Literal["flowcast.prediction/1"] = Field(alias="schema")
    grid: ResultGrid
    axis_order: Literal["ZYX"]
    velocity: list[Any]
    pressure: list[Any]
    building_mask: list[Any]
    valid_mask: list[Any]
    wind: Wind
    units: dict[str, str]

    @model_validator(mode="after")
    def prediction_arrays(self):
        shape = self.grid.shape[::-1]
        velocity = numeric_array(self.velocity, "velocity", (*shape, 3))
        pressure = numeric_array(self.pressure, "pressure", shape)
        solid = boolean_array(self.building_mask, "building_mask", shape)
        valid = boolean_array(self.valid_mask, "valid_mask", shape)
        if self.units != UNITS:
            raise ValueError("Prediction units must be coordinates:m, velocity:m/s, pressure:Pa.")
        if (valid & solid).any() or not valid.any():
            raise ValueError("valid_mask must identify at least one fluid cell and exclude solid cells.")
        if np.any(velocity[solid] != 0) or np.any(pressure[solid] != 0):
            raise ValueError("Velocity and pressure must be zero in solid cells.")
        return self


class VisualizeRequest(RequestModel):
    prediction: PredictionResult
    format: Literal["png", "gif", "mp4"] = "png"
    field: Literal["speed", "pressure"] = "speed"
    representation: Literal["slice", "streamlines"] = "slice"
    axis: Literal["x", "y", "z"] = "z"
    position: Finite | None = None
    width: Annotated[int, Field(strict=True, ge=320, le=1920)] = 1280
    height: Annotated[int, Field(strict=True, ge=256, le=1080)] = 720
    include_mesh: bool = True
    fps: Annotated[int, Field(strict=True, ge=1, le=30)] = 12
    frames: Annotated[int, Field(strict=True, ge=2, le=120)] = 24
    animation: Literal["orbit"] = "orbit"

    @model_validator(mode="after")
    def supported_representation(self):
        if self.field == "pressure" and self.representation == "streamlines":
            raise ValueError("Only slice visualization is supported for pressure.")
        if self.format == "mp4" and (self.width % 2 or self.height % 2):
            raise ValueError("MP4 dimensions must be even.")
        if self.format != "png" and self.width * self.height * self.frames > 96_000_000:
            raise ValueError("Animation exceeds the 96-million-pixel frame budget.")
        if self.position is not None:
            axis = "xyz".index(self.axis)
            grid = self.prediction.grid
            if (
                not grid.origin[axis]
                < self.position
                < grid.origin[axis] + grid.spacing[axis] * grid.shape[axis]
            ):
                raise ValueError("Slice position must be inside the prediction domain.")
        return self
