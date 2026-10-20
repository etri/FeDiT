"""관리 API의 저장소와 서비스 설정"""

import os
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import quote, urlsplit

from modules.settings.validation import env_port, validate_public_settings


@dataclass(frozen=True)
class ManagementSettings:
    data_dir: Path
    mongo_uri: str
    mongo_database: str = "flowcast3d"
    model_url: str = "http://flowcast3d-model:8000"
    viewer_url: str = "http://127.0.0.1:8081"
    request_timeout: float = 300.0
    max_image_bytes: int = 20 * 1024 * 1024
    case_data_dir: Path | None = None
    model_version_dir: Path = Path("/workspace/model-version")
    max_prediction_bytes: int = 128 * 1024 * 1024
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
        # 인증 키와 공개 요청 한도 검증
        validate_public_settings(self)

    @classmethod
    def from_env(cls):
        # MongoDB 연결 정보와 요청 제한 검증
        user = os.environ.get("MONGO_USER", "flowcast3d")
        password = os.environ.get("MONGO_PASSWORD", "")
        uri = os.environ.get("FLOWCAST_MONGO_URI", "")
        if not uri:
            if not password:
                raise ValueError("MONGO_PASSWORD or FLOWCAST_MONGO_URI is required.")
            credentials = f"{quote(user, safe='')}:{quote(password, safe='')}"
            port = env_port("FLOWCAST_DB_PORT", 27017)
            uri = f"mongodb://{credentials}@flowcast3d-db:{port}/?authSource=admin"
        if not uri.startswith(("mongodb://", "mongodb+srv://")):
            raise ValueError("FLOWCAST_MONGO_URI must be a MongoDB connection URI.")
        timeout = float(os.environ.get("FLOWCAST_REQUEST_TIMEOUT", "300"))
        if not 0 < timeout <= 86400:
            raise ValueError("FLOWCAST_REQUEST_TIMEOUT must be greater than 0 and at most 86400.")

        # 서비스 주소와 저장소 경로 구성
        settings = cls(
            data_dir=Path(os.environ.get("FLOWCAST_DATA", "/workspace/data")),
            mongo_uri=uri,
            mongo_database=os.environ.get("FLOWCAST_MONGO_DATABASE", "flowcast3d"),
            model_url=(
                os.environ.get("FLOWCAST_MODEL_URL")
                or f"http://flowcast3d-model:{env_port('FLOWCAST_MODEL_HTTP_PORT', 8000)}"
            ).rstrip("/"),
            viewer_url=(
                os.environ.get("FLOWCAST_RENDERER_URL")
                or os.environ.get("FLOWCAST_VIEWER_URL")
                or f"http://127.0.0.1:{env_port('FLOWCAST_RENDERER_PORT', 8081)}"
            ).rstrip("/"),
            request_timeout=timeout,
            case_data_dir=Path(os.environ.get("FLOWCAST_DATA_DIR", "/data")),
            model_version_dir=Path(os.environ.get("FLOWCAST_MODEL_VERSION_DIR", "/workspace/model-version")),
            max_prediction_bytes=int(os.environ.get("FLOWCAST_MAX_PREDICTION_BYTES", str(128 * 1024 * 1024))),
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

        # 서비스 주소 형식과 저장 한도 검증
        for url in (settings.model_url, settings.viewer_url):
            parsed = urlsplit(url)
            if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username:
                raise ValueError("Model and viewer URLs must be HTTP or HTTPS addresses.")
        if not settings.mongo_database or any(char in settings.mongo_database for char in '/\\ ."$'):
            raise ValueError("MongoDB database name is invalid.")
        if not 0 < settings.max_prediction_bytes <= 512 * 1024 * 1024:
            raise ValueError("NPZ prediction size limit must be greater than 0 and at most 512 MiB.")
        return settings
