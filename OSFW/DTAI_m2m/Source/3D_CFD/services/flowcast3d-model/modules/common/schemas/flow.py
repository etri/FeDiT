from __future__ import annotations

import json
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

from modules.common.coordinates.units import KINEMATIC_PRESSURE, UNITS, conversion

SCHEMA = "flowcast.flow/1"
CANONICAL_AXIS_ORDER = "TXYZC"
AXES = ("x", "y", "z")
BoundaryName = Literal["wall", "open", "periodic"]
BOUNDARY_CODES = {"wall": 0, "open": 1, "periodic": 2}

# 기존 풍장 자료의 물리량 번호 유지
FIELD_INDICES = {
    "closed_boundary": 0, "open_boundary": 1, "bias_correction": 2, "pressure": 3,
    "velocity_x": 4, "velocity_y": 5, "velocity_z": 6, "zeros_like_density": 7, "speed_of_sound": 8,
    "concentration": 9,
    "D_xx": 10, "D_xy": 11, "D_xz": 12, "D_yx": 13, "D_yy": 14, "D_yz": 15, "D_zx": 16, "D_zy": 17, "D_zz": 18,
    "E_xx": 19, "E_xy": 20, "E_xz": 21, "E_yx": 22, "E_yy": 23, "E_yz": 24, "E_zx": 25, "E_zy": 26, "E_zz": 27,
    "density": 28, "energy": 29, "velocity_r": 30, "velocity_theta": 31, "velocity_phi": 32,
    "momentum_x": 33, "momentum_y": 34, "momentum_z": 35, "pressure_re": 36, "pressure_im": 37, "mask": 38,
    "magnetic_field_x": 39, "magnetic_field_y": 40, "magnetic_field_z": 41, "A": 42, "B": 43, "height": 44,
    "internal_energy": 45, "temperature": 46, "electron_fraction": 47, "entropy": 48,
    "magnetic_field_log_r": 49, "magnetic_field_theta": 50, "magnetic_field_phi": 51, "velocity_log_r": 52,
    "buoyancy": 53, "tracer": 54, "log10_density": 55, "log10_temperature": 56, "c_zz": 57,
    "C_xx": 58, "C_xy": 59, "C_xz": 60, "C_yx": 61, "C_yy": 62, "C_yz": 63, "C_zx": 64, "C_zy": 65, "C_zz": 66,
}  # fmt: skip
# 경계 표시와 마스크용 번호는 유동장 채널에서 제외
RESERVED_CHANNELS = ("closed_boundary", "open_boundary", "bias_correction", "mask")
VECTORS = ("velocity", "momentum", "magnetic_field")
# 3D 사전학습 물리량
TRAINED_3D_CHANNELS = (
    "pressure", "velocity_x", "velocity_y", "velocity_z", "zeros_like_density", "density",
    "magnetic_field_x", "magnetic_field_y", "magnetic_field_z", "log10_density", "log10_temperature",
)  # fmt: skip

ERROR_CODES = (
    "missing", "invalid_value", "shape_mismatch", "unknown_channel", "incomplete_vector",
    "unsupported_unit", "non_finite", "unsupported_grid",
)  # fmt: skip


class SpecError(ValueError):
    def __init__(self, errors):
        self.errors = list(errors)
        super().__init__(json.dumps({"validation_errors": self.errors}, ensure_ascii=False))


def problem(code, field, message):
    return {"code": code, "field": field, "message": message}


class Grid(BaseModel):
    """origin은 최소 모서리, spacing은 축별 셀 간격(m)"""

    model_config = ConfigDict(extra="forbid")

    crs: str | None = None
    origin: tuple[float, float, float]
    spacing: tuple[float, float, float]
    shape: tuple[int, int, int]

    @model_validator(mode="after")
    def _check(self):
        if min(self.spacing) <= 0:
            raise ValueError("spacing must be positive")
        if min(self.shape) < 1:
            raise ValueError("shape must be at least 1 along every axis")
        return self

    @property
    def extent(self):
        return tuple(n * d for n, d in zip(self.shape, self.spacing))

    def with_shape(self, shape):
        spacing = tuple(length / n for length, n in zip(self.extent, shape))
        return Grid(crs=self.crs, origin=self.origin, spacing=spacing, shape=tuple(shape))


class FlowMetadata(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    schema_name: Literal["flowcast.flow/1"] = Field(alias="schema")
    grid: Grid
    axis_order: str = CANONICAL_AXIS_ORDER
    channels: list[str] = Field(min_length=1)
    units: dict[str, str] = Field(default_factory=dict)
    density: float | None = Field(default=None, gt=0)
    time_step: float = Field(gt=0)
    time: float = 0.0
    boundary_conditions: dict[Literal["x", "y", "z"], tuple[BoundaryName, BoundaryName]]
    # 생략 시 입력 이력에서 정규화 통계 계산
    state_scale: list[float] | None = None
    delta_scale: list[float] | None = None

    @classmethod
    def parse(cls, document):
        try:
            if isinstance(document, (str, bytes)):
                document = json.loads(document)
            metadata = cls.model_validate(document)
        except json.JSONDecodeError as error:
            raise SpecError([problem("invalid_value", "metadata", f"not valid JSON: {error}")]) from None
        except ValidationError as error:
            raise SpecError(
                problem(
                    "missing" if item["type"] == "missing" else "invalid_value",
                    ".".join(str(part) for part in item["loc"]) or "metadata",
                    item["msg"],
                )
                for item in error.errors()
            ) from None
        problems = metadata.problems()
        if problems:
            raise SpecError(problems)
        return metadata

    def problems(self):
        found = []
        if sorted(self.axis_order) != sorted(CANONICAL_AXIS_ORDER):
            found.append(problem("invalid_value", "axis_order", f"must be a permutation of {CANONICAL_AXIS_ORDER}"))
        for axis in AXES:
            if axis not in self.boundary_conditions:
                found.append(problem("missing", f"boundary_conditions.{axis}", "Field required"))
            elif self.boundary_conditions[axis].count("periodic") == 1:
                found.append(
                    problem("invalid_value", f"boundary_conditions.{axis}", "periodic must be set on both sides")
                )
        if sum(n != 1 for n in self.grid.shape) < 2:
            found.append(problem("unsupported_grid", "grid.shape", "2 or 3 axes must be larger than 1"))

        if len(set(self.channels)) != len(self.channels):
            found.append(problem("invalid_value", "channels", "channel names must be unique"))
        for name in self.channels:
            if name not in FIELD_INDICES or name in RESERVED_CHANNELS:
                found.append(problem("unknown_channel", "channels", f"{name!r} is not a field of the model"))
        for vector in VECTORS:
            present = [axis for axis in AXES if f"{vector}_{axis}" in self.channels]
            needed = [axis for axis, n in zip(AXES, self.grid.shape) if n != 1]
            if present and not set(needed) <= set(present):
                found.append(
                    problem("incomplete_vector", "channels", f"{vector} needs components {needed}, got {present}")
                )

        for name in ("state_scale", "delta_scale"):
            scale = getattr(self, name)
            if scale is not None and (len(scale) != len(self.channels) or min(scale) <= 0):
                found.append(problem("invalid_value", name, "needs one positive value per channel"))

        for name, unit in self.units.items():
            if name not in self.channels:
                found.append(problem("invalid_value", f"units.{name}", "not one of the channels"))
            elif unit not in UNITS.get(name, {}):
                found.append(
                    problem("unsupported_unit", f"units.{name}", f"accepted units: {list(UNITS.get(name, {}))}")
                )
            elif unit == KINEMATIC_PRESSURE and self.density is None:
                found.append(problem("missing", "density", "kinematic pressure (m2/s2) needs density"))
        return found

    def field_indices(self):
        return [FIELD_INDICES[name] for name in self.channels]

    def boundary_codes(self):
        return [
            [2, 2] if n == 1 else [BOUNDARY_CODES[side] for side in self.boundary_conditions[axis]]
            for axis, n in zip(AXES, self.grid.shape)
        ]

    def unit_conversions(self):
        return [conversion(name, self.units.get(name), self.density) for name in self.channels]

    def array_problems(self, flow_shape, mask_shape):
        found = []
        if len(flow_shape) != 5:
            return [problem("shape_mismatch", "flow", f"must have 5 axes ({self.axis_order}), got {tuple(flow_shape)}")]
        size = dict(zip(self.axis_order, flow_shape))
        if size["T"] < 1:
            found.append(problem("shape_mismatch", "flow", "needs at least 1 frame"))
        if size["C"] != len(self.channels):
            found.append(
                problem("shape_mismatch", "flow", f"has {size['C']} channels, metadata names {len(self.channels)}")
            )
        spatial = tuple(size[axis] for axis in "XYZ")
        if spatial != self.grid.shape:
            found.append(
                problem("shape_mismatch", "flow", f"spatial size {spatial} differs from grid.shape {self.grid.shape}")
            )
        grid_size = dict(zip("XYZ", self.grid.shape))
        expected_mask = tuple(grid_size[axis] for axis in self.axis_order if axis in "XYZ")
        if tuple(mask_shape) != expected_mask:
            found.append(
                problem("shape_mismatch", "building_mask", f"must be {expected_mask}, got {tuple(mask_shape)}")
            )
        return found

    def to_json(self):
        return self.model_dump_json(by_alias=True, exclude_none=True)
