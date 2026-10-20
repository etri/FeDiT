from __future__ import annotations

import io
import os
from functools import lru_cache
from pathlib import Path
from typing import BinaryIO

import numpy as np

from . import weights as checkpoints

__all__ = ["infer_prepared", "load_prediction_model", "select_device"]


def select_device(requested: str = "auto"):
    """요청 장치와 CUDA 사용 가능 여부에 따라 추론 장치 선택"""
    import torch

    if requested == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    device = torch.device(requested)
    if device.type == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("Requested CUDA device is unavailable.")
    return device


def load_prediction_model(checkpoint: str | Path | BinaryIO, device):
    """가중치의 모델 설정과 상태를 복원하고 평가 모드로 전환"""
    import torch

    from .model import build_model

    payload = torch.load(checkpoint, map_location="cpu", weights_only=False)
    for key in ("model_state_dict", "model_config", "normalization"):
        if key not in payload:
            raise ValueError(f"Checkpoint is missing a required entry: {key}.")

    model = build_model(payload["model_config"])
    model.load_state_dict(payload["model_state_dict"], strict=True)
    model.to(device).eval()
    return model, payload


@lru_cache(maxsize=2)
def _load_model(checkpoint: str, inode: int, modified_ns: int, size: int, requested_device: str):
    device = select_device(requested_device)
    data = checkpoints.checkpoint_bytes(Path(checkpoint), (inode, modified_ns, size))
    model, payload = load_prediction_model(io.BytesIO(data), device)
    return model, payload, device


def infer_prepared(spatial: np.ndarray, conditions: np.ndarray, model_spec: dict,
                   checkpoint: Path | None = None, requested_device: str | None = None) -> tuple[np.ndarray, dict]:
    """TransUNet3D 가중치로 N16ZYX 공간 입력과 N11 조건을 N4ZYX로 추론"""
    import torch

    # 전처리에서 읽은 가중치와 텐서 규격 검사
    signature = model_spec.get("checkpoint_signature") if isinstance(model_spec, dict) else None
    if (not isinstance(signature, list) or len(signature) != 3
            or any(type(value) is not int for value in signature)):
        raise ValueError("Core request requires the checkpoint signature from preprocessing.")
    if (spatial.dtype != np.float32 or spatial.ndim != 5 or spatial.shape[1] != 16
            or conditions.dtype != np.float32 or conditions.shape != (spatial.shape[0], 11)
            or not spatial.shape[0] or min(spatial.shape[2:]) < 16
            or not np.isfinite(spatial).all() or not np.isfinite(conditions).all()):
        raise ValueError("Core inputs must be finite FP32 N16ZYX spatial tensors and N11 conditions.")

    # 동일한 가중치 복원과 압력 모델 정책 확인
    checkpoint = checkpoint or checkpoints.checkpoint_path()
    with checkpoints.version_lock(checkpoint.parent):
        if checkpoints.checkpoint_signature(checkpoint) != tuple(signature):
            raise ValueError("Checkpoint changed after preprocessing. Please retry the request.")
        model, payload, device = _load_model(
            str(checkpoint.resolve()), *signature,
            requested_device or os.getenv("FLOWCAST_DEVICE", "auto"),
        )
    if payload["model_config"].get("pressure_refinement", False) and spatial.shape[0] != 1:
        raise ValueError("Pressure refinement models require a single full-grid inference.")

    # 타일별 추론
    amp = device.type == "cuda" and os.getenv("FLOWCAST_AMP", "true").lower() == "true"
    predictions = []
    for values, condition in zip(spatial, conditions):
        fields = torch.from_numpy(np.ascontiguousarray(values)).unsqueeze(0).to(device)
        parameters = torch.from_numpy(np.ascontiguousarray(condition)).unsqueeze(0).to(device)
        with torch.inference_mode(), torch.autocast(device_type=device.type, enabled=amp):
            normalized = model(fields, parameters)[0].float().cpu().numpy()
        predictions.append(normalized)
    return np.ascontiguousarray(np.stack(predictions), dtype=np.float32), {
        "model": "flowcast3d", "checkpoint": str(checkpoint.resolve()),
        "model_type": "steady_neutral_abl_residual",
        "checkpoint_signature": signature, "epoch": int(payload.get("epoch", 0)), "device": str(device),
        "tiles": len(predictions), "normalization": payload["normalization"],
        "warnings": ["현재 체크포인트는 정상 상태 모델이며 같은 조건의 반복 프레임은 시간 변화 예측이 아닙니다"],
    }
