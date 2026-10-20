import math
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from modules.domain.transport.pollutants import Pollutant

Point = tuple[float, float, float]
# UI와 CLI가 공유하는 발표 보기 이름
PRESETS = ("flow", "plume", "colormap", "iso", "stream", "section", "city", "city3d", "cube")


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Buildings(Strict):
    visible: bool = True
    opacity: float = Field(default=1.0, ge=0, le=1, allow_inf_nan=False)
    geometry: Literal["mesh", "mask"] = "mesh"
    lod: int = Field(default=0, ge=0)
    # 사진 텍스처 캐시는 lod와 무관
    texture: bool = False


class Slice(Strict):
    axis: Literal["x", "y", "z"] = "z"
    position: float  # 단면 위치의 실제 좌표(m)
    visible: bool = True
    raw: bool = False  # 검토 단면은 동적 바람을 더하지 않은 원본 예측 사용
    solids: bool = False
    opacity: float = Field(default=1.0, ge=0, le=1)


class Streamlines(Strict):
    """예측 속도장의 순간 유선이며 city 배치는 건물 주변 씨앗 추가"""

    visible: bool = False
    opacity: float = Field(default=1.0, ge=0, le=1)
    density: int = Field(default=200, ge=1)
    seeding: Literal["inflow", "city"] = "inflow"
    width: float = Field(default=2.0, gt=0, le=12)
    near_buildings: bool = False


class Box(Strict):
    visible: bool = False
    opacity: float = Field(default=1.0, ge=0, le=1)


class Volume(Strict):
    visible: bool = False
    opacity: float = Field(default=0.6, ge=0, le=1)
    # high는 큰 값, low는 작은 값을 강조
    # 경계층의 큰 값이 영역을 덮지 않도록 기본값은 low
    emphasis: Literal["high", "low"] = "low"


class Isosurface(Strict):
    visible: bool = False
    opacity: float = Field(default=1.0, ge=0, le=1)
    # None이면 현재 색 범위 가운데
    value: float | None = Field(default=None, allow_inf_nan=False)


class Shells(Strict):
    visible: bool = False
    count: int = Field(default=3, ge=2, le=4)
    opacity: float = Field(default=0.75, ge=0, le=1)
    levels: tuple[float, ...] | None = None  # 캡처용 고정 등가면 농도(㎍/㎥)

    @field_validator("levels")
    @classmethod
    def rising_levels(cls, value):
        if value is None:
            return value
        if not 2 <= len(value) <= 4 or not all(math.isfinite(number) and number > 0 for number in value):
            raise ValueError("Isosurface concentrations must contain 2 to 4 positive values.")
        if any(value[n] >= value[n + 1] for n in range(len(value) - 1)):
            raise ValueError("Isosurface concentrations must be in increasing order.")
        return value


class Arrows(Strict):
    """수평면은 수평 바람, 전체 3D는 실제 XYZ 방향 표시"""

    visible: bool = False
    mode: Literal["plane", "volume"] = "plane"
    style: Literal["arrows", "ribbons"] = "arrows"  # 배출원 흐름은 입자 대신 연속 곡선으로 표시
    scope: Literal["domain", "plume"] = "plume"
    focus: bool = True
    near_buildings: bool = False  # 평탄 바닥을 제외한 건물 이웃에서만 유선 추적
    seed_points: list[Point] | None = Field(default=None, max_length=64)  # 재현용 세계 좌표 씨앗
    paths: bool = True
    path_width: float = Field(default=3.0, ge=1, le=6, allow_inf_nan=False)
    opacity: float = Field(default=1.0, ge=0, le=1)
    height: float | None = None  # 화살표 z 좌표(m)이며 None이면 보행자 높이
    density: int = Field(default=500, ge=1)
    color: str | None = None  # None은 기본 물리량, __plume__은 가상 농도
    color_range: tuple[float, float] | None = None  # 캡처 구간 전체에 고정할 색 범위
    reference_speed: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    width: str | None = None
    tilt: bool = True

    @field_validator("seed_points")
    @classmethod
    def finite_seeds(cls, value):
        if value is not None and any(not math.isfinite(number) for point in value for number in point):
            raise ValueError("Streamline seed coordinates must be finite.")
        return value

    @field_validator("color_range")
    @classmethod
    def ordered_range(cls, value):
        if value is not None and (not all(math.isfinite(n) for n in value) or value[0] >= value[1]):
            raise ValueError("Colour range bounds must be finite and in increasing order.")
        return value


class Particles(Strict):
    visible: bool = False
    style: Literal["tracer", "flow"] = "tracer"
    count: int = Field(default=2000, ge=1)
    seed: int = 0  # 같은 속도장에서 입자 위치를 재현할 난수 시드
    color_range: tuple[float, float] | None = None  # 입자의 고정 풍속 범위(m/s)

    @field_validator("color_range")
    @classmethod
    def speed_range(cls, value):
        if value is not None and (
            not all(math.isfinite(n) for n in value) or value[0] < 0 or value[0] >= value[1]
        ):
            raise ValueError(
                "Particle speed range bounds must be finite, nonnegative, and in increasing order."
            )
        return value


class DynamicWind(Strict):
    """예측장에 추가할 표시용 시간 및 공간 변동"""

    enabled: bool = False
    intensity: float = Field(default=0.12, ge=0, le=0.5, allow_inf_nan=False)
    gust: float = Field(default=0.20, ge=0, le=0.8, allow_inf_nan=False)
    time_scale: float = Field(default=8.0, ge=0.5, le=120, allow_inf_nan=False)  # 변화 시간(s)
    length_scale: float = Field(default=25.0, ge=2, le=500, allow_inf_nan=False)  # 소용돌이 크기(m)
    seed: int = Field(default=0, ge=0)


class Plume(Strict):
    """가상 배출원의 오염물질 표시 설정"""

    visible: bool = False
    cloud: bool = True
    field: bool = False
    shells: Shells = Shells()
    footprint: bool = False  # 연직 적분 농도(㎍/㎡)
    section: bool = False  # 원본 셀 단면 농도(㎍/㎥)
    cube: bool = False
    color_range: tuple[float, float] | None = None
    column_range: tuple[float, float] | None = None
    # None이면 표시 최댓값을 따르는 자동 로그 범위
    section_range: tuple[float, float] | None = None
    map_range: tuple[float, float] | None = None
    cube_range: tuple[float, float] | None = None
    field_range: tuple[float, float] | None = None
    pollutant: Pollutant = "tracer"  # 물질 이름은 표시용이며 물성 계산에는 미적용
    # 배출원 실제 좌표(m)이며 None이면 상류에 자동 배치
    source: Point | None = None
    detail: Literal["standard", "fine"] = "fine"
    transport: Literal["dispersion", "prediction"] = "dispersion"

    @field_validator("color_range", "column_range", "section_range", "map_range", "cube_range", "field_range")
    @classmethod
    def positive_range(cls, value):
        if value is not None and (not all(math.isfinite(n) for n in value) or not 0 < value[0] < value[1]):
            raise ValueError("Colour range bounds must be positive, finite, and in increasing order.")
        return value


class Camera(Strict):
    position: Point
    focal_point: Point
    view_up: Point
    view_angle: float = 30.0
    parallel_projection: bool = False
    parallel_scale: float | None = Field(default=None, gt=0, allow_inf_nan=False)


class SceneSettings(Strict):
    case_id: str
    job_id: str | None = None  # None이면 초기장 사용, 초기장도 없으면 건물만 표시
    frame: int = Field(default=0, ge=0)
    phase: float = Field(default=0.0, ge=0, lt=1)  # 다음 프레임 쪽 보간 비율
    quantity: str = "speed"
    cmap: str = "viridis"
    legends: bool = True
    overview: bool = False  # 이전 설정 파일과 호환하기 위해 유지
    overview_bounds: tuple[Point, Point] | None = None
    outline: bool = True
    review: bool = False
    buildings: Buildings = Buildings()
    slices: list[Slice] = []
    streamlines: Streamlines = Streamlines()
    box: Box = Box()
    volume: Volume = Volume()
    isosurface: Isosurface = Isosurface()
    particles: Particles = Particles()
    plume: Plume = Plume()
    dynamic_wind: DynamicWind = DynamicWind()
    arrows: Arrows = Arrows()
    wind: float | None = None  # 평균 바람 측정 높이(m)이며 None이면 숨김
    # 관심 영역의 물리 좌표 [[x0, y0, z0], [x1, y1, z1]]
    roi: tuple[Point, Point] | None = None
    camera: Camera | None = None
    max_cells: int | None = None  # None이면 환경 변수의 셀 수 상한 사용

    @property
    def reads_volume(self):
        looks = (
            self.streamlines,
            self.particles,
            self.plume,
            self.box,
            self.volume,
            self.isosurface,
        )
        return any(look.visible for look in looks) or (self.arrows.visible and self.arrows.mode == "volume")
