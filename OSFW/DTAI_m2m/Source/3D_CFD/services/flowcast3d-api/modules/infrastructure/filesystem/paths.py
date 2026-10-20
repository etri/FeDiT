"""파일 경로와 업로드 식별자 검증"""

import re
from pathlib import Path

from modules.domain.errors import ApiError


def validate_run_id(value: str) -> str:
    if not re.fullmatch(r"\d{8}_\d{6}_[0-9a-f]{6}", value):
        raise ApiError(422, "Invalid run_id format. Expected YYYYMMDD_HHMMSS_hex6.")
    return value


def validate_npz_name(value: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,119}\.npz", value):
        raise ApiError(
            422, "NPZ file names may contain only letters, digits, underscores, dots, and hyphens."
        )
    return value


def shared_path(root: Path, *parts: str) -> Path:
    """심볼릭 링크를 해석한 뒤 공유 경로 이탈 검사"""
    base = root.resolve()
    candidate = base.joinpath(*parts)
    if candidate.is_symlink():
        raise ApiError(422, "Input and output files cannot be symbolic links.")
    resolved = candidate.resolve()
    try:
        resolved.relative_to(base)
    except ValueError as error:
        raise ApiError(422, "Path is outside the shared directory.") from error
    return resolved


def confine(path, base, root):
    """기준 경로 내부의 논리 경로만 허용"""
    try:
        resolved = (base / path).resolve()
    except ValueError:
        raise ApiError(422, f"path {str(path)!r} is not a valid path") from None
    if not resolved.is_relative_to(root.resolve()):
        raise ApiError(422, f"path {str(path)!r} resolves outside {root}")
    return resolved
