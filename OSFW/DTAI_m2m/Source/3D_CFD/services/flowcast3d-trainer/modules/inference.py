from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import numpy as np
import torch

from .dataset import decode_prediction, encode_case, load_case
from .model import build_model
from .utils import atomic_npz, update_metrics


def select_device(requested: str = "auto") -> torch.device:
    if requested == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    device = torch.device(requested)
    if device.type == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("Requested CUDA device is unavailable.")
    return device


def load_prediction_model(
    checkpoint: str | Path, device: torch.device
) -> tuple[torch.nn.Module, dict[str, Any]]:
    checkpoint = Path(checkpoint)
    if not checkpoint.is_file():
        raise FileNotFoundError(f"Model checkpoint is missing: {checkpoint}.")
    payload = torch.load(checkpoint, map_location="cpu", weights_only=False)
    for key in ("model_state_dict", "model_config", "normalization"):
        if key not in payload:
            raise ValueError(f"Checkpoint is missing a required entry: {key}.")

    model = build_model(payload["model_config"])
    model.load_state_dict(payload["model_state_dict"], strict=True)
    model.to(device).eval()
    return model, payload


def restore_physical_prediction(
    prediction: np.ndarray, case: dict[str, Any], normalization: dict[str, Any]
) -> np.ndarray:
    """학습 정규화를 역변환한 뒤 지정한 경계값 복원"""
    physical = np.asarray(
        decode_prediction(prediction, case, normalization), dtype=np.float32
    ).copy()
    boundary_mask = np.asarray(case["bc_mask"], dtype=bool)
    boundary_values = np.asarray(case["bc_values"], dtype=np.float32)
    physical[boundary_mask] = boundary_values[boundary_mask]
    return physical


def predict(
    config: dict[str, Any],
    run_dir: str | Path,
    input_path: str | Path,
    output_path: str | Path | None = None,
    checkpoint: str | Path | None = None,
) -> dict[str, Any]:
    """정답을 읽지 않고 입력 NPZ로 물리 풍장 예측"""
    # 입출력 경로 검사
    started = time.monotonic()
    run_dir = Path(run_dir)
    checkpoint = Path(checkpoint) if checkpoint else run_dir / "best.pt"
    if output_path is None:
        output_path = run_dir / "prediction.npz"
    else:
        output_path = Path(output_path)
        if not output_path.is_absolute():
            output_path = run_dir / output_path
    if output_path.suffix.lower() != ".npz" or output_path.resolve().parent != run_dir.resolve():
        raise ValueError("Prediction output must be an NPZ file directly inside the run directory.")
    input_path = Path(input_path)
    if output_path.resolve() in {input_path.resolve(), checkpoint.resolve()}:
        raise ValueError("Prediction output must not overwrite the inference input or checkpoint.")

    # 모델과 입력 준비
    device = select_device(config.get("training", {}).get("device", "auto"))
    model, payload = load_prediction_model(checkpoint, device)
    case = load_case(input_path, require_target=False)
    encoded = encode_case(case, payload["normalization"])
    spatial = torch.from_numpy(encoded["spatial"]).unsqueeze(0).to(device)
    conditions = torch.from_numpy(encoded["conditions"]).unsqueeze(0).to(device)

    # 추론과 물리 단위 복원
    amp = bool(config.get("training", {}).get("amp", True)) and device.type == "cuda"
    with torch.inference_mode(), torch.autocast(device_type=device.type, enabled=amp):
        normalized = model(spatial, conditions)[0].float().cpu().numpy()
    prediction = restore_physical_prediction(
        normalized, case, payload["normalization"]
    )
    valid_mask = np.asarray(case["fluid_mask"], dtype=bool) & np.asarray(
        case["valid_mask"], dtype=bool
    )
    if not np.isfinite(prediction[:, valid_mask[0]]).all():
        raise ValueError("Predicted flow contains non-finite values in the valid region.")

    # 예측 결과 저장
    metadata = {
        "channels": ["ux", "uy", "uz", "p"],
        "units": ["m/s", "m/s", "m/s", "Pa"],
        "axis_order": "ZYX",
        "checkpoint": str(checkpoint.resolve()),
        "input": str(input_path.resolve()),
        "epoch": int(payload.get("epoch", 0)),
    }
    for key in ("geometry_transform", "ground_z", "wind_direction_deg",
                "wind_direction_convention", "direction_xyz", "wind_speed_m_s"):
        if key in case["metadata"]:
            metadata[key] = case["metadata"][key]
    atomic_npz(
        output_path,
        prediction=prediction,
        origin=np.asarray(case["origin"], dtype=np.float64),
        spacing=np.asarray(case["spacing"], dtype=np.float64),
        fluid_mask=np.asarray(case["fluid_mask"], dtype=bool),
        valid_mask=np.asarray(case["valid_mask"], dtype=bool),
        metadata=np.asarray(json.dumps(metadata, ensure_ascii=False)),
    )
    result = {
        **metadata,
        "output": str(output_path.resolve()),
        "grid_shape": list(prediction.shape[1:]),
        "device": str(device),
        "elapsed_seconds": time.monotonic() - started,
    }
    update_metrics(run_dir, "prediction", result)
    return result
