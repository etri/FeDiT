"""외부 저장소에 의존하지 않는 공개 API 설정"""

import os
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit

from modules.settings.validation import env_port, validate_public_settings


@dataclass(frozen=True)
class PublicSettings:
    model_url: str = "http://flowcast3d-model:8000"
    viewer_url: str = "http://127.0.0.1:8081"
    request_timeout: float = 7200.0
    max_prediction_bytes: int = 128 * 1024 * 1024
    max_image_bytes: int = 20 * 1024 * 1024
    api_key: str = field(default="", repr=False)
    api_requests_per_minute: int = 30
    api_max_concurrent_requests: int = 1
    max_upload_bytes: int = 8 * 1024 * 1024 * 1024
    max_json_bytes: int = 128 * 1024 * 1024
    max_expanded_npz_bytes: int = 32 * 1024 * 1024 * 1024
    public_temp_dir: Path = field(default_factory=lambda: Path(tempfile.gettempdir()) / "flowcast-public")

    @property
    def renderer_url(self):
        """기존 설정 이름과 내부 렌더 주소 호환"""
        return self.viewer_url

    def __post_init__(self):
        validate_public_settings(self)
        if not 0 < self.request_timeout <= 86400:
            raise ValueError("FLOWCAST_REQUEST_TIMEOUT must be greater than 0 and at most 86400.")
        if not 0 < self.max_prediction_bytes <= 512 * 1024 * 1024:
            raise ValueError("Prediction size limit must be greater than 0 and at most 512 MiB.")
        for url in (self.model_url, self.viewer_url):
            parsed = urlsplit(url)
            if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username:
                raise ValueError("Model and viewer URLs must be HTTP or HTTPS addresses.")

    @classmethod
    def from_env(cls):
        """데이터 저장소와 모델 파일 경로 없이 공개 서버 설정 구성"""
        return cls(
            model_url=(
                os.environ.get("FLOWCAST_MODEL_URL")
                or f"http://flowcast3d-model:{env_port('FLOWCAST_MODEL_HTTP_PORT', 8000)}"
            ).rstrip("/"),
            viewer_url=(
                os.environ.get("FLOWCAST_RENDERER_URL")
                or os.environ.get("FLOWCAST_VIEWER_URL")
                or f"http://127.0.0.1:{env_port('FLOWCAST_RENDERER_PORT', 8081)}"
            ).rstrip("/"),
            request_timeout=float(os.environ.get("FLOWCAST_REQUEST_TIMEOUT", "7200")),
            max_prediction_bytes=int(os.environ.get("FLOWCAST_MAX_PREDICTION_BYTES", str(128 * 1024 * 1024))),
            max_image_bytes=int(os.environ.get("FLOWCAST_MAX_IMAGE_BYTES", str(20 * 1024 * 1024))),
            api_key=os.environ.get("FLOWCAST_API_KEY", ""),
            api_requests_per_minute=int(os.environ.get("FLOWCAST_API_REQUESTS_PER_MINUTE", "30")),
            api_max_concurrent_requests=int(os.environ.get("FLOWCAST_API_MAX_CONCURRENT_REQUESTS", "1")),
            max_upload_bytes=int(os.environ.get("FLOWCAST_MAX_UPLOAD_BYTES", str(8 * 1024 * 1024 * 1024))),
            max_json_bytes=int(os.environ.get("FLOWCAST_MAX_JSON_BYTES", str(128 * 1024 * 1024))),
            max_expanded_npz_bytes=int(os.environ.get("FLOWCAST_MAX_EXPANDED_NPZ_BYTES", str(32 * 1024**3))),
            public_temp_dir=Path(
                os.environ.get(
                    "FLOWCAST_PUBLIC_TEMP_DIR", str(Path(tempfile.gettempdir()) / "flowcast-public")
                )
            ),
        )
