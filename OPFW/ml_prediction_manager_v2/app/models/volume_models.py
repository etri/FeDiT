from pydantic import BaseModel, ConfigDict, Field


class VolumeCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(pattern=r"^[a-z0-9](?:[a-z0-9-]{0,45}[a-z0-9])?$", max_length=47)
    size_gib: int = Field(default=10, ge=1, le=1024, strict=True)
