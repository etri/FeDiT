from __future__ import annotations

import os
from pathlib import Path


def checkpoint_path(model_version_root: str | Path | None = None) -> Path:
    """현재 모델 버전의 고정 가중치 경로 반환"""
    default = (
        os.getenv("FLOWCAST_MODEL_VERSION_DIR")
        or os.getenv("FLOWCAST_MODEL_VERSION")
        or "/workspace/model-version"
    )
    root = Path(model_version_root or default).resolve()
    checkpoint = root / "model.pt"
    if not checkpoint.resolve().is_relative_to(root):
        raise ValueError("Weight path is outside the model version directory: model.pt.")
    if not checkpoint.is_file():
        raise FileNotFoundError("Model version is missing model.pt.")
    return checkpoint
