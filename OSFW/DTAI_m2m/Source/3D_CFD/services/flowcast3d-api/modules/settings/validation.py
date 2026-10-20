"""공개 요청 설정의 공통 검증"""

import os


def validate_public_settings(settings):
    """공개 API의 인증과 처리 한도 검증"""
    if settings.api_key and (
        len(settings.api_key) < 32
        or not settings.api_key.isascii()
        or any(ord(char) < 33 or ord(char) > 126 for char in settings.api_key)
    ):
        raise ValueError(
            "FLOWCAST_API_KEY must contain at least 32 printable ASCII characters without spaces."
        )
    if not 1 <= settings.api_requests_per_minute <= 10000:
        raise ValueError("FLOWCAST_API_REQUESTS_PER_MINUTE must be between 1 and 10000.")
    if not 1 <= settings.api_max_concurrent_requests <= 32:
        raise ValueError("FLOWCAST_API_MAX_CONCURRENT_REQUESTS must be between 1 and 32.")
    for name in ("max_upload_bytes", "max_json_bytes", "max_expanded_npz_bytes", "max_image_bytes"):
        if getattr(settings, name) <= 0:
            raise ValueError(f"{name} must be greater than 0.")


def env_port(name, default, env=None):
    """환경 변수의 포트를 유효한 TCP 포트 번호로 변환"""
    source = os.environ if env is None else env
    try:
        port = int(source.get(name, str(default)))
    except (TypeError, ValueError) as error:
        raise ValueError(f"{name} must be an integer between 1 and 65535.") from error
    if not 1 <= port <= 65535:
        raise ValueError(f"{name} must be an integer between 1 and 65535.")
    return port
