"""공개 예측의 Triton 바이너리 업로드 클라이언트"""

import base64
import binascii
import json
import struct

from modules.domain.errors import ApiError
from modules.infrastructure.filesystem.paths import validate_npz_name, validate_run_id

MAX_UPLOAD_BYTES = 128 * 1024**2


class TritonPredictionClient:
    def __init__(self, settings, client):
        self.settings = settings
        self.client = client
        self.cancel_event = None
        self.cancel_deadline = None

    def _response(self, url, payload=None, *, content=None, headers=None, timeout=None):
        try:
            options = {"timeout": timeout} if timeout is not None else {}
            if content is not None and getattr(self, "cancel_event", None) is not None:
                response = self._cancellable_prediction(url, content, headers)
            else:
                response = (
                    self.client.post(url, json=payload, **options)
                    if content is None
                    else self.client.post(url, content=content, headers=headers, **options)
                )
        except ApiError:
            raise
        except Exception as error:
            raise ApiError(503, "Cannot connect to the model or visualization service.") from error
        if response.status_code != 200:
            status = 422 if response.status_code in {400, 422} else 502
            raise ApiError(status, "Model or visualization service could not process the request.")
        return response

    def _cancellable_prediction(self, url, content, headers):
        """모델 응답을 기다리는 동안 취소된 요청의 소켓 회수"""
        import asyncio
        import contextlib
        import time

        import httpx

        async def send():
            async with httpx.AsyncClient(
                timeout=self.settings.request_timeout, follow_redirects=False, trust_env=False
            ) as client:
                task = asyncio.create_task(client.post(url, content=content, headers=headers))
                try:
                    while not task.done():
                        if self.cancel_event.is_set():
                            raise ApiError(499, "Request was cancelled by the client.")
                        if time.monotonic() >= self.cancel_deadline:
                            raise ApiError(504, "Prediction request timed out.")
                        await asyncio.wait({task}, timeout=0.05)
                    return await task
                finally:
                    if not task.done():
                        task.cancel()
                    with contextlib.suppress(asyncio.CancelledError, Exception):
                        await task

        return asyncio.run(send())

    def predict_payload(self, run_id, payload, output_file, *, input_file="input.npz"):
        """원본 이름을 유지하며 NPZ 바이트를 모델의 업로드 텐서로 전달"""
        # 요청 이름과 바이너리 입력 크기 확인
        validate_run_id(run_id)
        validate_npz_name(input_file)
        validate_npz_name(output_file)
        if not isinstance(payload, bytes):
            raise ApiError(422, "Prediction payload must contain NPZ bytes.")
        if not 0 < len(payload) <= MAX_UPLOAD_BYTES:
            raise ApiError(413, "Input NPZ file size is outside the 128 MiB limit.")

        # 바이너리 텐서 헤더와 본문 구성
        document = json.dumps(
            {"mode": "upload", "run_id": run_id, "input_file": input_file, "output_file": output_file}
        ).encode()
        blocks = [struct.pack("<I", len(value)) + value for value in (document, payload)]
        header = json.dumps(
            {
                "inputs": [
                    {
                        "name": name,
                        "shape": [1],
                        "datatype": "BYTES",
                        "parameters": {"binary_data_size": len(block)},
                    }
                    for name, block in zip(("REQUEST", "PAYLOAD"), blocks)
                ],
                "outputs": [
                    {"name": name, "parameters": {"binary_data": True}} for name in ("RESULT", "METADATA")
                ],
            }
        ).encode()
        response = self._response(
            f"{self.settings.model_url}/v2/models/flowcast3d_pipeline/infer",
            content=header + b"".join(blocks),
            headers={
                "Content-Type": "application/octet-stream",
                "Inference-Header-Content-Length": str(len(header)),
            },
        )
        return self._prediction_result(response, run_id)

    def _prediction_result(self, response, run_id):
        # 응답 크기와 Triton 헤더 검증
        header_size = response.headers.get("Inference-Header-Content-Length")
        body = response.content
        maximum = (
            self.settings.max_prediction_bytes
            if header_size is not None
            else 4 * ((self.settings.max_prediction_bytes + 2) // 3)
        )
        if len(body) > maximum + 2 * 1024 * 1024:
            raise ApiError(502, "Triton prediction exceeds the size limit.")
        try:
            header_size = int(header_size) if header_size is not None else 0
            if header_size < 0 or header_size > len(body):
                raise ValueError("invalid header")
            data = json.loads(body[:header_size]) if header_size else response.json()
        except (TypeError, ValueError) as error:
            raise ApiError(502, "Cannot read Triton prediction response header.") from error
        if not isinstance(data, dict):
            raise ApiError(502, "Triton prediction response must be a JSON object.")

        # 출력 텐서의 바이너리 데이터와 메타데이터 복원
        outputs = data.get("outputs")
        if not isinstance(outputs, list) or len(outputs) != 2:
            raise ApiError(502, "Triton prediction response is missing NPZ output or metadata.")
        decoded = {}
        offset = header_size
        try:
            for entry in outputs:
                name = entry["name"]
                if name not in {"RESULT", "METADATA"} or name in decoded:
                    raise ValueError("unexpected output")
                if entry["datatype"] != "BYTES" or entry["shape"] != [1]:
                    raise ValueError("invalid tensor")
                if header_size:
                    size = entry["parameters"]["binary_data_size"]
                    if not isinstance(size, int) or size < 4 or offset + size > len(body):
                        raise ValueError("invalid binary size")
                    length = struct.unpack_from("<I", body, offset)[0]
                    if length != size - 4:
                        raise ValueError("invalid bytes length")
                    decoded[name] = body[offset + 4 : offset + size]
                    offset += size
                else:
                    values = entry["data"]
                    if len(values) != 1 or not isinstance(values[0], str):
                        raise ValueError("invalid JSON bytes")
                    decoded[name] = (
                        base64.b64decode(values[0], validate=True) if name == "RESULT" else values[0].encode()
                    )
            if header_size and offset != len(body):
                raise ValueError("extra binary data")
            metadata = json.loads(decoded["METADATA"])
        except (KeyError, TypeError, ValueError, struct.error, binascii.Error) as error:
            raise ApiError(502, "Triton prediction NPZ or metadata format is invalid.") from error

        # 요청 실행 정보와 NPZ 형식 검증
        npz = decoded["RESULT"]
        if not isinstance(metadata, dict) or metadata.get("run_id") != run_id:
            raise ApiError(502, "Model training run does not match the request.")
        if not npz.startswith(b"PK\x03\x04") or len(npz) > self.settings.max_prediction_bytes:
            raise ApiError(502, "Triton prediction is not a valid NPZ archive.")
        return npz, metadata
