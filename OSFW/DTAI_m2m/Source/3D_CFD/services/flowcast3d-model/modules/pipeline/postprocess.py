import io
import json
import time

import numpy as np

from ..common.schemas import FlowMetadata
from . import transforms
from .transforms import CHANNELS, case_tile



def _result_metadata(value):
    """이전 입력의 해시 기록을 새 결과에 전달하지 않음"""
    if isinstance(value, dict):
        return {name: _result_metadata(item) for name, item in value.items()
                if not name.endswith("sha256") and "fingerprint" not in name}
    if isinstance(value, list):
        return [_result_metadata(item) for item in value]
    return value


def restore_case(normalized: np.ndarray, details: dict, context: dict) -> np.ndarray:
    """타일을 물리 단위로 복원해 합성하고 경계값과 고체 셀 복구"""
    # 코어 출력과 복원 문맥의 세대 확인
    selection = context["selection"]
    if any(details.get(key) != selection[key] for key in ("checkpoint_signature", "normalization")):
        raise ValueError("Model generation or normalization differs between postprocessing context and core inference.")
    case, starts, window, halo = context["case"], context["starts"], context["window"], context["halo"]
    shape = tuple(case["boundary_type"].shape)
    if normalized.ndim != 5 or normalized.shape[:2] != (len(starts), 4) or not np.isfinite(normalized).all():
        raise ValueError("Postprocessing inputs must be finite normalized N4ZYX outputs for each tile.")

    # 물리 단위 복원과 타일 합성
    output = np.zeros((4, *shape), dtype=np.float32)
    weights = np.zeros(shape, dtype=np.float32)
    for values, start in zip(normalized, starts):
        tile, region = case_tile(case, start, window)
        local = tuple(part.stop - part.start for part in region)
        values = values[(slice(None), *(slice(0, size) for size in local))]
        physical = transforms.restore_physical_prediction(values, tile, selection["normalization"])
        axis_weights = []
        for low, part, size in zip(start, region, shape):
            weight = np.ones(part.stop - part.start, dtype=np.float32)
            ramp = min(halo, len(weight))
            if low:
                weight[:ramp] = (np.arange(ramp) + .5) / ramp
            if part.stop < size:
                weight[-ramp:] = np.minimum(weight[-ramp:], (np.arange(ramp)[::-1] + .5) / ramp)
            axis_weights.append(weight)
        weight = axis_weights[0][:, None, None] * axis_weights[1][None, :, None] * axis_weights[2][None, None, :]
        output[(slice(None), *region)] += physical * weight[None]
        weights[region] += weight

    # 영역 누락 검사와 경계값 복원
    if np.any(weights <= 0):
        raise ValueError("Postprocessing tiles do not cover the entire source grid.")
    output /= weights[None]
    output[case["bc_mask"]] = case["bc_values"][case["bc_mask"]]
    output[:, ~case["fluid_mask"][0]] = 0
    if not np.isfinite(output[:, (case["fluid_mask"] & case["valid_mask"])[0]]).all():
        raise ValueError("Predicted flow contains non-finite values in the valid region.")
    return output


def file_result(prediction: np.ndarray, details: dict, case: dict, request: dict) -> dict:
    metadata = _result_metadata({
        **case["metadata"], **details, "run_id": request["run_id"],
        "channels": ["ux", "uy", "uz", "p"], "units": ["m/s", "m/s", "m/s", "Pa"], "axis_order": "ZYX",
        "input": request["input"], "output_file": request["output_file"],
        "grid_shape": list(prediction.shape[1:]), "elapsed_seconds": time.monotonic() - request["began"],
    })
    buffer = io.BytesIO()
    np.savez_compressed(buffer, prediction=prediction, origin=case["origin"], spacing=case["spacing"],
                        fluid_mask=case["fluid_mask"], valid_mask=case["valid_mask"],
                        metadata=np.asarray(json.dumps(metadata, ensure_ascii=False)))
    return {"data": buffer.getvalue(), "metadata": metadata}


def restore_file(normalized: np.ndarray, details: dict, context: dict) -> tuple[bytes, bytes]:
    prediction = restore_case(normalized, details, context)
    return prediction_payload(file_result(prediction, details, context["case"], context["upload"]))


def field_result(prediction: np.ndarray, details: dict, case: dict, request: dict):
    # 요청 채널과 단위 및 축 순서 복원
    metadata = FlowMetadata.parse(request["metadata"])
    channels = [CHANNELS.index(name) for name in metadata.channels]
    conversions = request["conversions"]
    state = prediction[channels].transpose(3, 2, 1, 0)
    state = (state - conversions[:, 1]) / conversions[:, 0]
    state[request["solid"]] = 0
    next_flow = state[None].transpose(["TXYZC".index(axis) for axis in metadata.axis_order]).copy()

    # 결과 출처 기록
    result = metadata.model_dump(mode="json", by_alias=True, exclude_none=True)
    result.pop("delta_scale", None)
    scale = np.asarray(details["normalization"]["target_std"], dtype=np.float64)
    speed, density = float(case["conditions"][5]), float(case["conditions"][0])
    scale *= np.asarray([speed, speed, speed, density * speed * speed])
    scales = scale[channels].tolist()
    result.update(
        time=metadata.time + metadata.time_step, model="flowcast3d", model_type="steady_neutral_abl_residual",
        checkpoint_epoch=details["epoch"], checkpoint_signature=details["checkpoint_signature"],
        normalization={**details["normalization"], "state_scale": scales, "delta_scale": scales,
                       "delta_scale_source": "steady_checkpoint_target"},
        inference_conditions=_result_metadata(case["metadata"]),
        transform={"request_grid": result["grid"], "model_grid": result["grid"], "tiles": details["tiles"]},
        warnings=["현재 체크포인트는 정상 상태 모델이며 같은 조건의 반복 프레임은 시간 변화 예측이 아닙니다"],
    )
    return next_flow.astype(np.float32), np.asarray(request["mask"], dtype=np.uint8), result


def restore_field(normalized: np.ndarray, details: dict, context: dict):
    return field_result(restore_case(normalized, details, context), details, context["case"], context["field"])


def prediction_payload(result: dict) -> tuple[bytes, bytes]:
    data = result.get("data")
    metadata = result.get("metadata")
    if not isinstance(data, bytes) or not data or not isinstance(metadata, dict):
        raise RuntimeError("Model did not return prediction NPZ bytes and metadata.")
    with np.load(io.BytesIO(data), allow_pickle=False) as archive:
        if "prediction" not in archive.files:
            raise RuntimeError("Prediction NPZ is missing the prediction array.")
    return data, json.dumps(metadata, ensure_ascii=False).encode("utf-8")
