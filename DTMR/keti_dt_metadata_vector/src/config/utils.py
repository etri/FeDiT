from datetime import datetime
from zoneinfo import ZoneInfo
import json, os

DEFAULT_TZ_NAME = os.getenv("DEFAULT_TZ_NAME", "Asia/Seoul")

DEFAULT_TZ = ZoneInfo(DEFAULT_TZ_NAME)
# 기본 타임존 (환경변수 없으면 Asia/Seoul)


def now_iso_local() -> str:
    """기본 타임존 기준 현재시각 ISO (예: 2025-09-17T21:34:56+09:00)"""
    return datetime.now(DEFAULT_TZ).replace(microsecond=0).isoformat()


def to_local_iso(dt_str_or_dt) -> str:
    """
    입력(ISO 문자열 / datetime)을 기본 타임존 기준 ISO로 정규화.
    - tz 포함 입력: 기본 타임존으로 변환
    - tz 없는 입력: 기본 타임존 로컬로 해석
    """
    if isinstance(dt_str_or_dt, datetime):
        dt = dt_str_or_dt
    else:
        s = str(dt_str_or_dt).replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=DEFAULT_TZ)
    return dt.astimezone(DEFAULT_TZ).replace(microsecond=0).isoformat()


def safe_json_loads(text):
    try:
        return json.loads(text)
    except Exception:
        return {}


