from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import numpy as np

from ..runtime import weights
from . import codec, inputs, postprocess, preprocess


def prepare_request(document: bytes, payload: bytes,
                    model_version_root: str | Path | None = None) -> dict:
    """업로드와 유동장 요청을 공통 추론 입력 및 복원 문맥으로 변환"""
    # 지원하는 요청 종류와 키를 입력 처리 전에 검사
    request = json.loads(document)
    if not isinstance(request, dict) or request.get("mode") not in ("upload", "field"):
        raise ValueError("REQUEST mode must be field or upload.")
    mode = request["mode"]
    if mode == "upload":
        if set(request) != {"mode", "run_id", "input_file", "output_file"}:
            raise ValueError("Upload REQUEST requires run_id, input_file and output_file.")
        inputs.validate_request_names(request["run_id"], request["input_file"], request["output_file"])

        # 파일 시스템을 거치지 않고 원본 배열과 고정 가중치 준비
        began = time.monotonic()
        checkpoint = weights.checkpoint_path(model_version_root)
        with weights.version_lock(checkpoint.parent):
            selected = {"checkpoint_signature": list(weights.checkpoint_signature(checkpoint))}
            case = inputs.read_case(payload, request["input_file"])
            prepared = preprocess.prepare_case(case, checkpoint)
            preprocess._verify_selection(prepared, selected, checkpoint)
        prepared["context"]["upload"] = {
            "run_id": request["run_id"], "input": request["input_file"],
            "output_file": request["output_file"], "began": began,
        }
    else:
        if set(request) != {"mode", "metadata"} or not isinstance(request["metadata"], dict):
            raise ValueError("Field REQUEST requires a metadata object.")

        # 유동장 배열을 복원하고 요청 단위와 축에 맞춘 입력 구성
        arrays = codec.load_arrays(payload, {"flow", "building_mask"})
        flow, mask = arrays["flow"], arrays["building_mask"]
        if flow.dtype != np.float32 or flow.ndim != 5:
            raise ValueError("flow must be a five-dimensional FP32 array.")
        if mask.dtype != np.uint8 or mask.ndim != 3:
            raise ValueError("building_mask must be a three-dimensional UINT8 array.")
        prepared = preprocess.preprocess_field(flow, mask, request["metadata"], model_version_root)
    prepared["context"]["mode"] = mode
    return prepared


def restore_response(normalized: np.ndarray, details: dict, context: dict) -> tuple[bytes, bytes]:
    """정규화 예측을 요청 종류에 맞는 결과 바이트와 메타데이터로 복원"""
    if context.get("mode") == "upload":
        return postprocess.restore_file(normalized, details, context)
    if context.get("mode") != "field":
        raise ValueError("Postprocessing context mode is invalid.")
    flow, mask, metadata = postprocess.restore_field(normalized, details, context)
    return (codec.dump_arrays(flow_next=flow, building_mask_out=mask),
            json.dumps(metadata, ensure_ascii=False, allow_nan=False).encode("utf-8"))


def predict_case(case: dict[str, Any], checkpoint: Path) -> tuple[np.ndarray, dict[str, Any]]:
    """메모리의 물리 배열을 전처리하고 고정 가중치로 추론 및 복원"""
    from ..runtime.inference import infer_prepared

    prepared = preprocess.prepare_case(case, checkpoint)
    normalized, details = infer_prepared(prepared["spatial"], prepared["conditions"],
                                        prepared["model_spec"], checkpoint)
    return postprocess.restore_case(normalized, details, prepared["context"]), details


def predict_field(flow: np.ndarray, mask: np.ndarray, document: str | bytes | dict):
    """유동장을 전처리하고 추론한 다음 원래 축과 단위로 복원"""
    from ..runtime.inference import infer_prepared

    prepared = preprocess.preprocess_field(flow, mask, document)
    normalized, details = infer_prepared(prepared["spatial"], prepared["conditions"], prepared["model_spec"])
    return postprocess.restore_field(normalized, details, prepared["context"])
