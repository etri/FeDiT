import json
import struct
import urllib.error
import urllib.request

import numpy as np

from modules.infrastructure.triton.rpc import dump_arrays, load_arrays

DTYPES = {
    "FP32": np.float32,
    "FP64": np.float64,
    "INT64": np.int64,
    "INT32": np.int32,
    "UINT8": np.uint8,
    "BOOL": np.bool_,
}
NAMES = {np.dtype(dtype): name for name, dtype in DTYPES.items()}
PIPELINE = "flowcast3d_pipeline"


class TritonRequestError(RuntimeError):
    def __init__(self, status, message):
        self.status = status
        self.validation_errors = []
        start = message.find('{"validation_errors"')
        if start >= 0:
            try:
                self.validation_errors = json.loads(message[start:])["validation_errors"]
            except json.JSONDecodeError:
                pass
        super().__init__(f"HTTP {status}: {message}")


def _encode(value):
    if isinstance(value, (str, bytes)):
        text = value.encode() if isinstance(value, str) else value
        return "BYTES", [1], struct.pack("<I", len(text)) + text
    array = np.ascontiguousarray(value)
    return NAMES[array.dtype], list(array.shape), array.tobytes()


def _decode(entry, blob):
    if entry["datatype"] == "BYTES":
        (length,) = struct.unpack_from("<I", blob)
        return blob[4 : 4 + length]
    return np.frombuffer(blob, dtype=DTYPES[entry["datatype"]]).reshape(entry["shape"])


class TritonClient:
    def __init__(self, url="http://localhost:8000", timeout=1800.0):
        self.url = url.rstrip("/")
        self.timeout = timeout

    def ready(self, model=None, timeout=10.0):
        path = f"/v2/models/{model}/ready" if model else "/v2/health/ready"
        try:
            with urllib.request.urlopen(self.url + path, timeout=timeout) as response:
                return response.status == 200
        except (urllib.error.URLError, OSError):
            return False

    def infer(self, model, inputs, outputs):
        """Triton 바이너리 텐서 프로토콜로 추론 요청"""
        # 입력별 바이너리 본문과 텐서 규격 헤더를 구성
        encoded = {name: _encode(value) for name, value in inputs.items()}
        header = json.dumps(
            {
                "inputs": [
                    {
                        "name": name,
                        "datatype": kind,
                        "shape": shape,
                        "parameters": {"binary_data_size": len(blob)},
                    }
                    for name, (kind, shape, blob) in encoded.items()
                ],
                "outputs": [{"name": name, "parameters": {"binary_data": True}} for name in outputs],
            }
        ).encode()

        # 헤더와 바이너리 텐서를 하나의 추론 요청으로 전송
        request = urllib.request.Request(
            f"{self.url}/v2/models/{model}/infer",
            data=header + b"".join(blob for _, _, blob in encoded.values()),
            headers={
                # Triton 26.08의 큰 요청 오류를 피하도록 Content-Type 고정
                "Content-Type": "application/octet-stream",
                "Inference-Header-Content-Length": str(len(header)),
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                header_length = int(response.headers["Inference-Header-Content-Length"])
                body = response.read()
        except urllib.error.HTTPError as error:
            text = error.read().decode(errors="replace")
            try:
                text = json.loads(text)["error"]
            except (json.JSONDecodeError, KeyError):
                pass
            raise TritonRequestError(error.code, text) from None

        # 응답 헤더의 크기에 따라 출력 바이트와 배열을 복원
        result, offset = {}, header_length
        for entry in json.loads(body[:header_length])["outputs"]:
            size = entry["parameters"]["binary_data_size"]
            result[entry["name"]] = _decode(entry, body[offset : offset + size])
            offset += size
        return result

    def predict_next(self, flow, building_mask, metadata, model=PIPELINE):
        # 배열과 메타데이터를 메모리 NPZ로 구성
        if isinstance(metadata, (str, bytes)):
            metadata = json.loads(metadata)
        document = json.dumps({"mode": "field", "metadata": metadata}, allow_nan=False)
        result = self.infer(
            model,
            {
                "REQUEST": document,
                "PAYLOAD": dump_arrays(
                    flow=np.asarray(flow, dtype=np.float32),
                    building_mask=np.asarray(building_mask, dtype=np.uint8),
                ),
            },
            ["RESULT", "METADATA"],
        )

        # 응답에서 다음 프레임 복원
        arrays = load_arrays(result["RESULT"], {"flow_next", "building_mask_out"})
        next_flow, next_mask = arrays["flow_next"], arrays["building_mask_out"]
        if next_flow.dtype != np.float32 or next_flow.ndim != 5:
            raise ValueError("flow_next response must be a five-dimensional FP32 array.")
        if next_mask.dtype != np.uint8 or next_mask.ndim != 3:
            raise ValueError("building_mask_out response must be a three-dimensional UINT8 array.")
        return next_flow, next_mask, json.loads(result["METADATA"])
