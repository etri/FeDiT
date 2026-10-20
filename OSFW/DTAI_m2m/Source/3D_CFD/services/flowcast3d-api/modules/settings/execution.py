import os

from modules.settings.validation import env_port

_DEFAULTS = {
    "preprocessing": {
        "max_history_3d": 3,
        "max_history_2d": 6,
    },
    "worker": {
        "triton_url": "http://localhost:8000",
        "data_dir": "/data",
        "max_concurrent_jobs": 1,
        "tile_concurrency": 1,
        "retry_delay": 30.0,
    },
}


def load(section, prefix=None):
    """기본값의 자료형으로 환경 변수를 변환하고 독립 복사본 반환"""
    values = dict(_DEFAULTS.get(section, {}))
    for key, default in values.items():
        raw = os.environ.get(f"{prefix or f'FLOWCAST_{section}'}_{key}".upper())
        if raw is None:
            if section == "worker" and key == "triton_url":
                values[key] = os.environ.get("FLOWCAST_MODEL_URL") or (
                    f"http://localhost:{env_port('FLOWCAST_MODEL_HTTP_PORT', 8000)}"
                )
            continue
        values[key] = type(default)(raw)
    return values
