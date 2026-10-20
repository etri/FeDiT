import hashlib
import json
import re
from typing import Any

ASSET_NAME = re.compile(r"^[a-f0-9]{64}\.(bin|glb|json|csv|png|mp4)$")


def digest(value: Any) -> str:
    """정렬된 유한 JSON 값에서 기존 자산 식별자 계산"""
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    ).hexdigest()


def public_job(record: dict[str, Any]) -> dict[str, Any]:
    """작업 문서에서 Viewer 응답 필드만 추출"""
    fields = {
        "id",
        "name",
        "status",
        "progress",
        "error",
        "createdAt",
        "updatedAt",
        "datasetId",
        "result",
        "cancellable",
    }
    return {key: value for key, value in record.items() if key in fields}
