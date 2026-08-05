import asyncio
import random
import re
import string
import threading
from datetime import datetime, timezone
from typing import Literal

from app.services.postgres_db import connect as _connect

_lock = threading.Lock()
MAX_PER_KEY = 20

_KEY_META = {
    "gpu": ("/monitoring", "section-gpu"),
    "gpu-temp": ("/monitoring", "section-gpu-temp"),
    "system": ("/monitoring", "section-system"),
    "kserve": ("/monitoring", "section-kserve"),
    "kserve-error": ("/monitoring", "section-kserve-error"),
    "kserve-latency": ("/monitoring", "section-kserve-latency"),
    "automl": ("/monitoring", "section-automl"),
    "pvc": ("/monitoring", "section-pvc"),
}


def init_db():
    with _lock, _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS alarms (
                id           TEXT PRIMARY KEY,
                key          TEXT NOT NULL,
                level        TEXT NOT NULL,
                msg          TEXT NOT NULL,
                section_id   TEXT NOT NULL,
                triggered_at TEXT NOT NULL,
                triggered_ts BIGINT NOT NULL,
                resolved_at  TEXT,
                resolved_ts  BIGINT,
                namespace    TEXT
            )
            """
        )
        conn.execute("ALTER TABLE alarms ADD COLUMN IF NOT EXISTS namespace TEXT")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS alarm_user_state (
                user_email   TEXT NOT NULL,
                alarm_id     TEXT NOT NULL,
                dismissed_at TEXT,
                seen_at      TEXT,
                visited_at   TEXT,
                toasted_at   TEXT,
                PRIMARY KEY (user_email, alarm_id)
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_alarms_active "
            "ON alarms(resolved_at, triggered_ts DESC)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_alarms_key_namespace_triggered "
            "ON alarms(key, namespace, triggered_ts DESC)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_alarm_user_state_alarm "
            "ON alarm_user_state(alarm_id)"
        )


def _now_ms() -> int:
    return int(datetime.now(timezone.utc).timestamp() * 1000)


def _fmt_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _rand6() -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=6))  # nosec


def _msg_fingerprint(msg: str) -> str:
    """숫자 값 부분을 제거해 동일 종류의 알람인지 식별하는 키."""
    return re.sub(r"\s*\([\d.,]+[^)]*\)", "", msg).strip()


# 차트 배경 구역 + 알람 임계값의 단일 소스
ZONES = {
    "chart-gpu-util": {"warn": 70, "danger": 85},
    "chart-gpu-mem": {"warn": 80, "danger": 90},
    "chart-cpu": {"warn": 80, "danger": 95},
    "chart-mem": {"warn": 85, "danger": 95},
    "pvc-quota": {"warn": 80, "danger": 90},
}


def eval_alarms(data: dict) -> list[dict]:
    """summary 데이터에서 현재 활성 알람 목록 계산."""
    alarms = []

    def _add(key, level, msg, namespace=None):
        _, section_id = _KEY_META[key]
        alarms.append(
            {
                "key": key,
                "level": level,
                "msg": msg,
                "section_id": section_id,
                "namespace": namespace,
            }
        )

    if data.get("gpu", {}).get("status") == "error" or data.get("system", {}).get("status") == "error":
        _add("gpu", "critical", "모니터링 데이터 수집 실패")

    gpu = data.get("gpu", {})
    if gpu.get("status") == "ok":
        util = gpu.get("util_pct", 0)
        if util > ZONES["chart-gpu-util"]["danger"]:
            _add("gpu", "critical", f"GPU 사용률이 너무 높습니다 ({util}%)")
        elif util > ZONES["chart-gpu-util"]["warn"]:
            _add("gpu", "warning", f"GPU 사용률이 높습니다 ({util}%)")

        mem = gpu.get("mem_pct", 0)
        if mem > ZONES["chart-gpu-mem"]["danger"]:
            _add("gpu", "critical", f"GPU 메모리가 부족합니다 ({mem}%)")
        elif mem > ZONES["chart-gpu-mem"]["warn"]:
            _add("gpu", "warning", f"GPU 메모리 사용량이 높습니다 ({mem}%)")

        temp = gpu.get("temp_c", 0)
        if temp > 85:
            _add("gpu-temp", "critical", f"GPU 온도 과열 ({temp}°C)")

    system = data.get("system", {})
    if system.get("status") == "ok":
        cpu = system.get("cpu_pct", 0)
        if cpu > ZONES["chart-cpu"]["danger"]:
            _add("system", "critical", f"CPU 사용률이 너무 높습니다 ({cpu}%)")
        elif cpu > ZONES["chart-cpu"]["warn"]:
            _add("system", "warning", f"CPU 사용률이 높습니다 ({cpu}%)")

        mem = system.get("mem_pct", 0)
        if mem > ZONES["chart-mem"]["danger"]:
            _add("system", "critical", f"시스템 메모리가 부족합니다 ({mem}%)")
        elif mem > ZONES["chart-mem"]["warn"]:
            _add("system", "warning", f"시스템 메모리 사용량이 높습니다 ({mem}%)")

    kserve = data.get("kserve", {})
    if not kserve.get("error"):
        for ep in kserve.get("endpoints", []):
            if not ep.get("ready"):
                _add("kserve", "warning", f"엔드포인트 비정상: {ep['name']}", namespace=ep.get("namespace"))

    kserve_err = data.get("kserve_error_rate", {})
    if kserve_err.get("status") == "ok":
        for m in kserve_err.get("models", []):
            if m.get("error_rate", 0) > 5:
                _add(
                    "kserve-error",
                    "critical",
                    f"KServe 에러율 높음: {m['name']} ({m['error_rate']:.1f}%)",
                    namespace=m.get("namespace"),
                )

    kserve_lat = data.get("kserve_top5_latency", {})
    if kserve_lat.get("status") == "ok":
        for m in kserve_lat.get("models", []):
            if m.get("latency_ms", 0) > 1000:
                _add(
                    "kserve-latency",
                    "warning",
                    f"응답 지연 감지: {m['name']} ({round(m['latency_ms'])}ms)",
                    namespace=m.get("namespace"),
                )

    automl = data.get("automl", {})
    if not automl.get("error"):
        for job in automl.get("jobs", []):
            if job.get("status") == "FAILED":
                _add("automl", "warning", f"AutoML 작업 실패: {job['name']}", namespace=job.get("namespace"))

    pvc = data.get("pvc", {})
    if pvc.get("status") == "ok":
        for g in pvc.get("groups", []):
            ns = g.get("ns")
            if g.get("phase_counts", {}).get("Lost", 0) > 0:
                _add("pvc", "critical", f"PVC 볼륨 손상 감지: {ns}", namespace=ns)

            quota = g.get("quota") or {}
            pvc_used, pvc_limit = quota.get("pvc_used"), quota.get("pvc_limit")
            if pvc_limit and pvc_used >= pvc_limit:
                _add("pvc", "warning", f"PVC 개수 할당량 도달: {ns} ({pvc_used}/{pvc_limit}개)", namespace=ns)

            st_used, st_limit = quota.get("storage_used_gb"), quota.get("storage_limit_gb")
            if st_limit and st_used / st_limit >= 0.9:
                _add("pvc", "warning", f"PVC 용량 할당량 임박: {ns} ({st_used:.1f}/{st_limit:.0f}GB)", namespace=ns)

            pct = g.get("quota_pct")
            if pct is None:
                continue
            if pct >= ZONES["pvc-quota"]["danger"]:
                _add("pvc", "critical", f"PVC quota 초과 위험: {ns} ({pct}%)", namespace=ns)
            elif pct >= ZONES["pvc-quota"]["warn"]:
                _add("pvc", "warning", f"PVC quota 사용량 높음: {ns} ({pct}%)", namespace=ns)

    return alarms


def update_alarms(data: dict, filter_ns: str | None = None):
    """summary 데이터로 DB 이력 갱신.

    filter_ns가 None이면 관리자 전체 뷰, 값이 있으면 해당 namespace 범위만 해소 판정한다.
    """
    current = eval_alarms(data)
    current_fps = {(a["key"], a.get("namespace"), _msg_fingerprint(a["msg"])): a for a in current}
    now_ms = _now_ms()
    now_str = _fmt_now()

    with _lock, _connect() as conn:
        rows = conn.execute(
            "SELECT id, key, namespace, msg FROM alarms WHERE resolved_at IS NULL"
        ).fetchall()

        active_fps: dict[tuple, str] = {}
        for row in rows:
            fp = (row["key"], row.get("namespace"), _msg_fingerprint(row["msg"]))
            if fp in active_fps:
                conn.execute(
                    "UPDATE alarms SET resolved_at=?, resolved_ts=? WHERE id=?",
                    (now_str, now_ms, row["id"]),
                )
                continue
            active_fps[fp] = row["id"]

        for (key, row_ns, fp), row_id in active_fps.items():
            if key == "automl":
                continue
            if key == "kserve-latency":
                in_scope = row_ns == filter_ns
            else:
                in_scope = (row_ns is None) or (filter_ns is None) or (row_ns == filter_ns)
            if not in_scope:
                continue
            if (key, row_ns, fp) not in current_fps:
                conn.execute(
                    "UPDATE alarms SET resolved_at=?, resolved_ts=? WHERE id=?",
                    (now_str, now_ms, row_id),
                )

        for (key, row_ns, fp), alarm in current_fps.items():
            if (key, row_ns, fp) in active_fps:
                conn.execute(
                    "UPDATE alarms SET msg=?, level=? WHERE id=?",
                    (alarm["msg"], alarm["level"], active_fps[(key, row_ns, fp)]),
                )
            else:
                new_id = f"{alarm['key']}-{now_ms}-{_rand6()}"
                conn.execute(
                    """
                    INSERT INTO alarms
                        (id, key, level, msg, section_id, triggered_at, triggered_ts,
                         resolved_at, resolved_ts, namespace)
                    VALUES (?,?,?,?,?,?,?,NULL,NULL,?)
                    """,
                    (
                        new_id,
                        alarm["key"],
                        alarm["level"],
                        alarm["msg"],
                        alarm["section_id"],
                        now_str,
                        now_ms,
                        alarm.get("namespace"),
                    ),
                )

        all_groups = conn.execute("SELECT DISTINCT key, namespace FROM alarms").fetchall()
        for row in all_groups:
            key = row["key"]
            ns = row.get("namespace")
            if ns is None:
                prune_query = (
                    "SELECT id FROM alarms "
                    "WHERE key=? AND namespace IS NULL "
                    "ORDER BY triggered_ts DESC OFFSET ?"
                )
                params = (key,)
            else:
                prune_query = (
                    "SELECT id FROM alarms "
                    "WHERE key=? AND namespace=? "
                    "ORDER BY triggered_ts DESC OFFSET ?"
                )
                params = (key, ns)
            excess = conn.execute(
                prune_query,
                params + (MAX_PER_KEY,),
            ).fetchall()
            for item in excess:
                conn.execute("DELETE FROM alarm_user_state WHERE alarm_id=?", (item["id"],))
                conn.execute("DELETE FROM alarms WHERE id=?", (item["id"],))


def get_active(filter_ns: str | None = None, user_email: str | None = None) -> list[dict]:
    """현재 활성 알람 반환. user_email 기준으로 숨김/확인 상태를 함께 내려준다."""
    with _lock, _connect() as conn:
        query = """
            SELECT a.id, a.key, a.level, a.msg, a.section_id, a.namespace,
                   s.dismissed_at, s.seen_at, s.visited_at, s.toasted_at
            FROM alarms a
            LEFT JOIN alarm_user_state s
              ON s.alarm_id = a.id AND s.user_email = ?
            WHERE a.resolved_at IS NULL
        """
        params: list = [user_email or ""]
        if filter_ns is not None:
            query += " AND (a.namespace IS NULL OR a.namespace = ?)"
            params.append(filter_ns)
        rows = conn.execute(query, params).fetchall()

    result = []
    for row in rows:
        target_path, _ = _KEY_META.get(row["key"], ("/monitoring", row["section_id"]))
        result.append(
            {
                "id": row["id"],
                "key": row["key"],
                "level": row["level"],
                "msg": row["msg"],
                "targetPath": target_path,
                "sectionId": row["section_id"],
                "namespace": row.get("namespace"),
                "dismissed": row.get("dismissed_at") is not None,
                "seen": row.get("seen_at") is not None,
                "visited": row.get("visited_at") is not None,
                "toasted": row.get("toasted_at") is not None,
            }
        )
    return result


def get_history(limit: int = 500, filter_ns: str | None = None) -> list[dict]:
    """알람 이력 반환."""
    with _lock, _connect() as conn:
        query = """
            SELECT id, key, level, msg, section_id, namespace,
                   triggered_at, triggered_ts, resolved_at, resolved_ts
            FROM alarms
        """
        params: list = []
        if filter_ns is not None:
            query += " WHERE (namespace IS NULL OR namespace = ?)"
            params.append(filter_ns)
        query += " ORDER BY triggered_ts DESC LIMIT ?"
        params.append(limit)
        rows = conn.execute(query, params).fetchall()

    return [
        {
            "id": row["id"],
            "key": row["key"],
            "level": row["level"],
            "msg": row["msg"],
            "section_id": row["section_id"],
            "namespace": row.get("namespace"),
            "triggered_at": row["triggered_at"],
            "triggered_ts": row["triggered_ts"],
            "resolved_at": row["resolved_at"],
            "resolved_ts": row["resolved_ts"],
        }
        for row in rows
    ]


_STATE_QUERIES = {
    "dismiss": """
        INSERT INTO alarm_user_state (user_email, alarm_id, dismissed_at)
        VALUES (?, ?, ?)
        ON CONFLICT (user_email, alarm_id)
        DO UPDATE SET dismissed_at=EXCLUDED.dismissed_at
    """,
    "seen": """
        INSERT INTO alarm_user_state (user_email, alarm_id, seen_at)
        VALUES (?, ?, ?)
        ON CONFLICT (user_email, alarm_id)
        DO UPDATE SET seen_at=EXCLUDED.seen_at
    """,
    "visit": """
        INSERT INTO alarm_user_state (user_email, alarm_id, visited_at)
        VALUES (?, ?, ?)
        ON CONFLICT (user_email, alarm_id)
        DO UPDATE SET visited_at=EXCLUDED.visited_at
    """,
    "toast": """
        INSERT INTO alarm_user_state (user_email, alarm_id, toasted_at)
        VALUES (?, ?, ?)
        ON CONFLICT (user_email, alarm_id)
        DO UPDATE SET toasted_at=EXCLUDED.toasted_at
    """,
}


def set_alarm_state(user_email: str, alarm_ids: list[str], action: Literal["dismiss", "seen", "visit", "toast"]):
    """사용자별 알람 UI 상태 갱신."""
    state_query = _STATE_QUERIES[action]
    now_str = _fmt_now()
    with _lock, _connect() as conn:
        for alarm_id in alarm_ids:
            conn.execute(
                state_query,
                (user_email, alarm_id, now_str),
            )


async def update_alarms_async(data: dict, filter_ns: str | None = None):
    return await asyncio.to_thread(update_alarms, data, filter_ns)


async def get_active_async(filter_ns: str | None = None, user_email: str | None = None) -> list[dict]:
    return await asyncio.to_thread(get_active, filter_ns, user_email)


async def get_history_async(limit: int = 500, filter_ns: str | None = None) -> list[dict]:
    return await asyncio.to_thread(get_history, limit, filter_ns)


async def set_alarm_state_async(user_email: str, alarm_ids: list[str], action: Literal["dismiss", "seen", "visit", "toast"]):
    return await asyncio.to_thread(set_alarm_state, user_email, alarm_ids, action)


init_db()
