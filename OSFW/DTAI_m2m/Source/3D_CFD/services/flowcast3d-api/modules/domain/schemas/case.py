from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Attribution(BaseModel):
    """화면과 출력물에 함께 표시할 출처 고지"""

    source: str
    license: str
    url: str | None = None
    changes: str = "none"


class ToWorld(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scale: float = Field(default=1.0, gt=0)
    rotate_z_deg: float = 0.0
    translate: tuple[float, float, float] = (0.0, 0.0, 0.0)


class MeshSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Case 기준 상대 경로, OBJ의 MTL과 텍스처는 같은 폴더 사용
    files: list[str] = Field(min_length=1)
    # y가 위쪽이면 to_world 전에 (x, -z, y)로 회전
    up_axis: Literal["z", "y"] = "z"
    to_world: ToWorld = ToWorld()


class FlowSource(BaseModel):
    source: str  # Case 기준 초기 유동장 상대 경로


class Case(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    schema_name: Literal["flowcast.case/1"] = Field(alias="schema")
    id: str = Field(pattern=r"^[a-z0-9][a-z0-9_-]*$")
    name: str
    synthetic: bool = False
    attribution: Attribution
    mesh: MeshSpec | None = None
    flow: FlowSource | None = None
    # 참조 CFD가 없으면 정확도 지표 생략
    reference: str | None = None
