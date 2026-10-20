"""시각화 작업 프로세스의 공개 처리 클라이언트"""

import base64
import binascii

from modules.domain.errors import ApiError


class RendererClient:
    def __init__(self, settings, client):
        self.settings = settings
        self.client = client

    def renderer_health(self):
        try:
            response = self.client.get(f"{self.settings.renderer_url}/health", timeout=2)
            return "ok" if response.status_code == 200 else "unavailable"
        except Exception:
            return "unreachable"

    def prepare_public_prediction(self, input_path, output_path, input_kind, wind=None, options=None):
        """요청 파일에서 독립 모델 입력을 준비"""
        return self._public_process(
            {
                "operation": "prepare_public_prediction",
                "params": {
                    "input_path": str(input_path),
                    "output_path": str(output_path),
                    "input_kind": input_kind,
                    **({"wind": wind, "options": options or {}} if input_kind == "file" else {}),
                },
            }
        )

    def render_public_prediction(self, input_path, options):
        """독립 예측 배열을 작업 프로세스에서 렌더링"""
        data = self._public_process(
            {
                "operation": "render_public_prediction",
                "params": {
                    "input_path": str(input_path),
                    "options": options,
                },
            }
        )
        return self.decode_media(data, options)

    def _public_process(self, payload):
        """공개 작업의 용량과 취소 및 제한 시간 오류를 보존"""
        import httpx

        try:
            response = self.client.post(
                f"{self.settings.renderer_url}/process",
                json=payload,
                timeout=self.settings.request_timeout + 30,
            )
        except httpx.TimeoutException as error:
            raise ApiError(504, "Public processing request timed out.") from error
        except Exception as error:
            raise ApiError(503, "Cannot connect to the visualization worker.") from error
        try:
            document = response.json()
        except (TypeError, ValueError):
            raise ApiError(502, "Visualization worker returned invalid JSON.") from None
        if not isinstance(document, dict):
            raise ApiError(502, "Visualization worker response must be a JSON object.")
        if response.status_code != 200:
            status = {400: 422, 404: 422, 409: 409, 413: 413, 503: 503, 504: 504}.get(
                response.status_code, 502
            )
            detail = document.get("detail")
            if not isinstance(detail, str) or not detail or len(detail) > 2048:
                detail = "Visualization worker could not process the request."
            raise ApiError(status, detail)
        return document

    def decode_media(self, data, options):
        """내부 Base64 응답을 검증하고 외부 파일 바이트로 복원"""
        format_name = options.get("format", "png")
        if format_name in {"gif", "mp4"}:
            media_type = {"gif": "image/gif", "mp4": "video/mp4"}[format_name]
            encoded = data.get("data_base64")
            maximum = self.settings.max_image_bytes
            if data.get("media_type") != media_type or not isinstance(encoded, str):
                raise ApiError(502, "Visualization response format does not match the requested format.")
            if len(encoded) > 4 * ((maximum + 2) // 3):
                raise ApiError(502, "Visualization media exceeds the size limit.")
            try:
                output = base64.b64decode(encoded, validate=True)
            except (ValueError, binascii.Error) as error:
                raise ApiError(502, "Visualization media is not valid Base64.") from error
            valid = (
                output.startswith((b"GIF87a", b"GIF89a"))
                if format_name == "gif"
                else len(output) >= 12 and output[4:8] == b"ftyp"
            )
            if len(output) > maximum or not valid:
                raise ApiError(502, "Visualization media format or size is invalid.")
            return output
        encoded = data.get("image_base64")
        maximum = self.settings.max_image_bytes
        if data.get("media_type") != "image/png" or not isinstance(encoded, str):
            raise ApiError(502, "Visualization response is missing a PNG image.")
        if len(encoded) > 4 * ((maximum + 2) // 3):
            raise ApiError(502, "Visualization image exceeds the size limit.")
        try:
            image = base64.b64decode(encoded, validate=True)
        except (ValueError, binascii.Error) as error:
            raise ApiError(502, "Visualization image is not valid Base64.") from error
        if len(image) > maximum or not image.startswith(b"\x89PNG\r\n\x1a\n"):
            raise ApiError(502, "Visualization response is not a PNG image.")
        return image
