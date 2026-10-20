from __future__ import annotations

import fcntl
import io
import os
from contextlib import contextmanager
from copy import deepcopy
from functools import lru_cache
from pathlib import Path
from typing import Any

DEFAULT_MODEL_VERSION_ROOT = Path(__file__).resolve().parents[2] / "model_repository/flowcast3d/1"


@contextmanager
def version_lock(root: Path):
    """가중치 파일을 읽는 동안 버전 디렉터리의 공유 잠금 유지"""
    descriptor = os.open(root, os.O_RDONLY | os.O_DIRECTORY)
    try:
        fcntl.flock(descriptor, fcntl.LOCK_SH)
        yield
    finally:
        os.close(descriptor)


def checkpoint_signature(path: Path) -> tuple[int, int, int]:
    """가중치 파일의 교체 여부를 확인할 파일 정보 반환"""
    stat = path.stat()
    return stat.st_ino, stat.st_mtime_ns, stat.st_size


def checkpoint_bytes(path: Path, signature: tuple[int, int, int]) -> bytes:
    """읽기 전후 파일이 동일한 가중치 바이트만 반환"""
    if checkpoint_signature(path) != signature:
        raise RuntimeError("Checkpoint changed before reading. Please retry the request.")
    data = path.read_bytes()
    if checkpoint_signature(path) != signature:
        raise RuntimeError("Checkpoint changed while reading. Please retry the request.")
    return data


def checkpoint_path(model_version_root: str | Path | None = None) -> Path:
    """고정된 모델 버전 디렉터리의 TransUNet3D 가중치 경로 반환"""
    root = Path(model_version_root or os.getenv("FLOWCAST_MODEL_VERSION", str(DEFAULT_MODEL_VERSION_ROOT))).resolve()
    checkpoint = root / "model.pt"
    if not checkpoint.resolve().is_relative_to(root):
        raise ValueError("Checkpoint path is outside the model version directory.")
    if not checkpoint.is_file():
        raise FileNotFoundError("Model version directory is missing model.pt.")
    return checkpoint


@lru_cache(maxsize=4)
def _read_preprocessing(checkpoint: str, inode: int, modified_ns: int, size: int) -> dict[str, Any]:
    import torch

    data = checkpoint_bytes(Path(checkpoint), (inode, modified_ns, size))
    payload = torch.load(io.BytesIO(data), map_location="cpu", weights_only=False)
    if not isinstance(payload, dict):
        raise TypeError("Checkpoint must be a dictionary containing the model and normalization.")
    for key in ("model_config", "normalization"):
        if not isinstance(payload.get(key), dict):
            raise TypeError(f"Checkpoint is missing the {key} dictionary.")
    if not isinstance(payload["model_config"].get("pressure_refinement", False), bool):
        raise TypeError("Checkpoint pressure refinement setting must be a boolean.")
    return {"model_config": payload["model_config"], "normalization": payload["normalization"],
            "epoch": int(payload.get("epoch", 0))}


def read_preprocessing(checkpoint: Path) -> dict[str, Any]:
    """가중치 파일에서 모델 설정과 정규화 정보의 독립 사본 반환"""
    with version_lock(checkpoint.parent):
        signature = checkpoint_signature(checkpoint)
        result = _read_preprocessing(str(checkpoint.resolve()), *signature)
        return {**deepcopy(result), "checkpoint_signature": list(signature)}
