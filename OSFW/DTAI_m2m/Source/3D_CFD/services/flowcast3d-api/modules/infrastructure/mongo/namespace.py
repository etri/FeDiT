"""MongoDB에 저장하는 논리 경로 규칙"""

import os
import re
from pathlib import Path


def namespace(path: str | Path) -> str:
    return str(Path(path).resolve())


def mongo_result(path: str | Path) -> bool:
    candidate = Path(namespace(path))
    root = Path(
        namespace(os.getenv("FLOWCAST_MONGO_NAMESPACE_ROOT", os.getenv("FLOWCAST_DATA_DIR", "/data")))
    )
    return (
        os.getenv("FLOWCAST_RESULT_STORAGE", "").lower() == "mongodb"
        and candidate.is_relative_to(root)
        and (candidate.name.endswith(".zarr") or candidate.name.endswith(".zarr.partial"))
    )


def prefix_query(prefix: str | Path, field: str = "path") -> dict:
    value = namespace(prefix).rstrip("/")
    return {field: {"$regex": "^" + re.escape(value) + r"(?:/|$)"}}
