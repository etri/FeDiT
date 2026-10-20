import unicodedata
from typing import Literal

from pydantic import Field, field_validator

from modules.application.workspace.contracts import RequestModel


class DatasetTitle(RequestModel):
    title: str = Field(min_length=1, max_length=120, strict=True)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value):
        value = value.strip()
        if not value or any(unicodedata.category(character).startswith("C") for character in value):
            raise ValueError("Dataset title must contain visible text without control characters.")
        return value


class ScenarioRetry(RequestModel):
    role: Literal["reference", "model"] | None = None
