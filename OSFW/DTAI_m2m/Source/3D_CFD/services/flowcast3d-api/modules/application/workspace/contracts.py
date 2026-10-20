import math
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class RequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Mapping(RequestModel):
    array: str | None = None
    field: str = "scalar"
    unit: str = ""
    axisOrder: Literal["XYZ", "TXYZ", "XYZC", "TXYZC", "CZYX"] | None = None
    channels: list[str] | None = Field(default=None, max_length=64)
    origin: tuple[float, float, float] = (0.0, 0.0, 0.0)
    spacing: tuple[float, float, float] = (1.0, 1.0, 1.0)
    times: list[float] | None = Field(default=None, max_length=10000)
    association: Literal["cell", "point"] = "cell"
    upAxis: Literal["z", "y"] = "z"
    scale: float = Field(default=1.0, gt=0, le=1e9)

    @model_validator(mode="after")
    def validate_mapping(self):
        if min(self.spacing) <= 0 or not all(math.isfinite(v) for v in (*self.origin, *self.spacing)):
            raise ValueError("Origin and spacing must be finite and spacing must be positive.")
        if self.times is not None and any(b <= a for a, b in zip(self.times, self.times[1:])):
            raise ValueError("Time values must increase strictly.")
        if self.channels is not None and len(set(self.channels)) != len(self.channels):
            raise ValueError("Channel names must be unique.")
        return self


class Register(RequestModel):
    name: str = Field(min_length=1, max_length=120)
    uploadIds: list[str] = Field(min_length=1, max_length=512)
    mapping: Mapping = Field(default_factory=Mapping)


class Probe(RequestModel):
    id: str = Field(min_length=1, max_length=64)
    point: tuple[float, float, float]


class Selection(RequestModel):
    datasetId: str = Field(min_length=1, max_length=128)
    resultId: str | None = Field(default=None, max_length=128)
    fieldId: str | None = Field(default=None, max_length=128)
    frame: int = Field(default=0, ge=0, le=10000)
    roi: tuple[tuple[float, float, float], tuple[float, float, float]] | None = None

    @model_validator(mode="after")
    def validate_roi(self):
        if self.roi and any(a >= b for a, b in zip(*self.roi)):
            raise ValueError("ROI maximum must exceed its minimum on every axis.")
        return self


class SceneRequest(Selection):
    mode: Literal["points", "surface", "slice", "iso", "volume", "geometry", "vectors", "streamlines"] = (
        "slice"
    )
    axis: Literal["x", "y", "z"] = "z"
    position: float | None = None
    threshold: float | None = None
    maxCells: int = Field(default=100000, ge=64, le=262144)
    colorRange: tuple[float, float] | None = None

    @model_validator(mode="after")
    def validate_color_range(self):
        if self.colorRange and self.colorRange[0] >= self.colorRange[1]:
            raise ValueError("Color range maximum must exceed its minimum.")
        return self


class AnalysisRequest(Selection):
    probes: list[Probe] = Field(default_factory=list, max_length=5)
    threshold: float | None = None
    bins: int = Field(default=12, ge=1, le=64)
    compareDatasetId: str | None = Field(default=None, max_length=128)
    compareResultId: str | None = Field(default=None, max_length=128)


class PredictRequest(RequestModel):
    datasetId: str = Field(min_length=1, max_length=128)
    direction: float = Field(ge=0, lt=360)
    speed: float = Field(gt=0, le=100)
    steps: int = Field(default=60, ge=1, le=600)
    replaces: str | None = None


class ServerRegister(RequestModel):
    name: str = Field(min_length=1, max_length=120)
    sourceIds: list[str] = Field(min_length=1, max_length=512)
    mapping: Mapping = Field(default_factory=Mapping)


class DispersionRequest(RequestModel):
    datasetId: str = Field(min_length=1, max_length=128)
    resultId: str | None = Field(default=None, max_length=128)
    source: tuple[float, float, float]
    durationSeconds: float = Field(ge=1, le=3600)
    stepSeconds: float = Field(ge=0.1, le=60)
    seed: int = Field(default=0, ge=0, le=2**32 - 1)

    @model_validator(mode="after")
    def validate_duration(self):
        if math.ceil(self.durationSeconds / self.stepSeconds) > 360:
            raise ValueError("Dispersion output must contain at most 361 frames.")
        return self


class DispersionScenarioRequest(DispersionRequest):
    referenceResultId: str | None = Field(default=None, min_length=1, max_length=128)
    direction: float = Field(ge=0, lt=360)
    speed: float = Field(gt=0, le=30)

    @model_validator(mode="after")
    def validate_scenario(self):
        if self.resultId is not None:
            raise ValueError("Scenario reference wind must use referenceResultId.")
        return self
