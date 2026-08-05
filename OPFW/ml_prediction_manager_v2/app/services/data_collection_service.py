from __future__ import annotations

import csv
import hashlib
import hmac
import io
import json
import os
import re
import secrets
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx
import yaml

from app.models.data_collection_models import (
    CollectionDatasetExportRequest,
    ConnectorCreateRequest,
    ConnectorRestOutputRequest,
    ConnectorRestOutputTestRequest,
    ConnectorUpdateRequest,
    DeviceDataIngestRequest,
    DeviceHeartbeatRequest,
    EdgeAgentSpecRequest,
    NifiFlowApplyRequest,
    NifiFlowSyncRequest,
    TwinCreateRequest,
    TwinUpdateRequest,
)
from app.models.dataset_models import DatasetCreateRequest
from app.services import dataset_service, tenant_resources
from app.services.postgres_db import INTEGRITY_ERROR as DB_INTEGRITY_ERROR, connect as _connect


DATASET_STORE_ROOT = Path(os.environ.get("DATASET_STORE_ROOT", "/datasets"))
USE_POSTGRES = True
CONNECTOR_TYPES = {"mqtt", "rest", "kafka", "redis", "custom"}
CONNECTOR_STATUSES = {"draft", "ready", "error", "offline"}
TWIN_STATUSES = {"online", "offline", "warning", "unknown"}
PM_INTERNAL_BASE_URL = os.environ.get("PM_INTERNAL_BASE_URL", "http://prediction-manager.kubeflow.svc.cluster.local").rstrip("/")
DC_OFFLINE_AFTER_SECONDS = int(os.environ.get("DC_OFFLINE_AFTER_SECONDS", "300"))
NIFI_INGEST_SECRET = os.environ.get("PM_NIFI_INGEST_SECRET", "").strip()
_REALTIME_WORKERS: dict[tuple[str, str], dict[str, Any]] = {}
_REALTIME_WORKERS_LOCK = threading.Lock()
_REST_OUTPUT_EXECUTOR = ThreadPoolExecutor(max_workers=4, thread_name_prefix="collection-rest-output")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def nifi_ingest_token(namespace: str) -> str:
    if not NIFI_INGEST_SECRET:
        return ""
    return hmac.new(
        NIFI_INGEST_SECRET.encode(),
        namespace.encode(),
        hashlib.sha256,
    ).hexdigest()


def validate_nifi_ingest_token(namespace: str, token: str) -> bool:
    expected = nifi_ingest_token(namespace)
    return bool(expected and token and hmac.compare_digest(expected, token))


def _json_loads(value: str | None, default: Any) -> Any:
    if not value:
        return default
    try:
        return json.loads(value)
    except Exception:
        return default


def _json_dumps(value: Any) -> str:
    return json.dumps(value or {}, ensure_ascii=False, sort_keys=True)


def _safe_name(value: str, fallback: str) -> str:
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", str(value or "").strip())
    name = re.sub(r"^[._-]+|[._-]+$", "", name)
    return (name or fallback)[:64]


def _make_id(prefix: str, name: str) -> str:
    return f"{prefix}-{_safe_name(name, prefix)[:36]}-{secrets.token_hex(4)}"


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS digital_twins (
                id TEXT PRIMARY KEY,
                namespace TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'offline',
                last_seen_at TEXT NOT NULL DEFAULT '',
                created_by TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                meta_json TEXT NOT NULL DEFAULT '{}',
                UNIQUE(namespace, name)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS collection_connectors (
                id TEXT PRIMARY KEY,
                namespace TEXT NOT NULL,
                name TEXT NOT NULL,
                connector_type TEXT NOT NULL,
                twin_id TEXT NOT NULL DEFAULT '',
                endpoint_url TEXT NOT NULL DEFAULT '',
                port INTEGER,
                topic TEXT NOT NULL DEFAULT '',
                method TEXT NOT NULL DEFAULT '',
                yaml_config TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'draft',
                last_checked_at TEXT NOT NULL DEFAULT '',
                last_message_at TEXT NOT NULL DEFAULT '',
                created_by TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                meta_json TEXT NOT NULL DEFAULT '{}',
                UNIQUE(namespace, name)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS collection_records (
                id TEXT PRIMARY KEY,
                namespace TEXT NOT NULL,
                device_id TEXT NOT NULL,
                twin_id TEXT NOT NULL DEFAULT '',
                connector_id TEXT NOT NULL DEFAULT '',
                dataset_id TEXT NOT NULL DEFAULT '',
                timestamp TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'sensor',
                file_path TEXT NOT NULL DEFAULT '',
                payload_json TEXT NOT NULL DEFAULT '{}',
                meta_json TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_dc_twins_ns ON digital_twins(namespace)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_dc_connectors_ns ON collection_connectors(namespace)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_dc_connectors_twin ON collection_connectors(namespace, twin_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_dc_records_ns_created ON collection_records(namespace, created_at)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_dc_records_twin ON collection_records(namespace, twin_id)")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS nifi_flow_specs (
                id TEXT PRIMARY KEY,
                namespace TEXT NOT NULL,
                connector_id TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL,
                connector_count INTEGER NOT NULL DEFAULT 0,
                auto_start INTEGER NOT NULL DEFAULT 0,
                spec_json TEXT NOT NULL DEFAULT '{}',
                last_error TEXT NOT NULL DEFAULT '',
                created_by TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute("ALTER TABLE nifi_flow_specs ADD COLUMN IF NOT EXISTS connector_id TEXT NOT NULL DEFAULT ''")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_dc_nifi_specs_ns ON nifi_flow_specs(namespace, updated_at)")
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_dc_nifi_specs_connector "
            "ON nifi_flow_specs(namespace, connector_id, updated_at)"
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_dc_records_device ON collection_records(namespace, device_id)")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS collection_realtime_sessions (
                namespace TEXT NOT NULL,
                connector_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'stopped',
                interval_seconds DOUBLE PRECISION NOT NULL DEFAULT 3,
                selected_attributes_json TEXT NOT NULL DEFAULT '[]',
                started_by TEXT NOT NULL DEFAULT '',
                started_at TEXT NOT NULL DEFAULT '',
                stopped_at TEXT NOT NULL DEFAULT '',
                last_collected_at TEXT NOT NULL DEFAULT '',
                last_error TEXT NOT NULL DEFAULT '',
                collect_count INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL,
                PRIMARY KEY(namespace, connector_id)
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_dc_realtime_status ON collection_realtime_sessions(namespace, status)"
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS collection_rest_outputs (
                namespace TEXT NOT NULL,
                connector_id TEXT NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 0,
                target_url TEXT NOT NULL DEFAULT '',
                method TEXT NOT NULL DEFAULT 'POST',
                headers_json TEXT NOT NULL DEFAULT '{}',
                selected_fields_json TEXT NOT NULL DEFAULT '[]',
                flatten_ngsi_values INTEGER NOT NULL DEFAULT 1,
                include_timestamp INTEGER NOT NULL DEFAULT 1,
                field_mapping_json TEXT NOT NULL DEFAULT '{}',
                static_fields_json TEXT NOT NULL DEFAULT '{}',
                envelope_key TEXT NOT NULL DEFAULT '',
                timeout_seconds DOUBLE PRECISION NOT NULL DEFAULT 10,
                success_count INTEGER NOT NULL DEFAULT 0,
                failure_count INTEGER NOT NULL DEFAULT 0,
                last_status_code INTEGER,
                last_sent_at TEXT NOT NULL DEFAULT '',
                last_error TEXT NOT NULL DEFAULT '',
                created_by TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY(namespace, connector_id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS collection_rest_delivery_logs (
                id TEXT PRIMARY KEY,
                namespace TEXT NOT NULL,
                connector_id TEXT NOT NULL,
                record_id TEXT NOT NULL DEFAULT '',
                target_url TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL,
                status_code INTEGER,
                request_payload_json TEXT NOT NULL DEFAULT '{}',
                response_preview TEXT NOT NULL DEFAULT '',
                error TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_dc_rest_delivery_connector "
            "ON collection_rest_delivery_logs(namespace, connector_id, created_at)"
        )
        conn.commit()


init_db()


def _row_to_twin(row: dict) -> dict:
    keys = set(row.keys())
    return {
        "id": row["id"],
        "namespace": row["namespace"],
        "name": row["name"],
        "description": row["description"],
        "status": row["status"],
        "last_seen_at": row["last_seen_at"],
        "created_by": row["created_by"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "metadata": _json_loads(row["meta_json"], {}),
        "connector_count": row["connector_count"] if "connector_count" in keys else 0,
        "record_count": row["record_count"] if "record_count" in keys else 0,
        "last_record_at": row["last_record_at"] if "last_record_at" in keys else "",
    }


def _row_to_connector(row: dict) -> dict:
    keys = set(row.keys())
    return {
        "id": row["id"],
        "namespace": row["namespace"],
        "name": row["name"],
        "connector_type": row["connector_type"],
        "twin_id": row["twin_id"],
        "twin_name": row["twin_name"] if "twin_name" in keys else "",
        "endpoint_url": row["endpoint_url"],
        "port": row["port"],
        "topic": row["topic"],
        "method": row["method"],
        "yaml_config": row["yaml_config"],
        "status": row["status"],
        "last_checked_at": row["last_checked_at"],
        "last_message_at": row["last_message_at"],
        "created_by": row["created_by"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "metadata": _json_loads(row["meta_json"], {}),
        "record_count": row["record_count"] if "record_count" in keys else 0,
        "last_record_at": row["last_record_at"] if "last_record_at" in keys else "",
    }


def _row_to_record(row: dict) -> dict:
    keys = set(row.keys())
    return {
        "id": row["id"],
        "namespace": row["namespace"],
        "device_id": row["device_id"],
        "twin_id": row["twin_id"],
        "twin_name": row["twin_name"] if "twin_name" in keys else "",
        "connector_id": row["connector_id"],
        "connector_name": row["connector_name"] if "connector_name" in keys else "",
        "dataset_id": row["dataset_id"],
        "timestamp": row["timestamp"],
        "type": row["type"],
        "file_path": row["file_path"],
        "payload": _json_loads(row["payload_json"], {}),
        "meta": _json_loads(row["meta_json"], {}),
        "created_at": row["created_at"],
    }


def _default_rest_output(connector_id: str = "") -> dict:
    return {
        "configured": False,
        "connector_id": connector_id,
        "enabled": False,
        "target_url": "",
        "method": "POST",
        "has_headers": False,
        "selected_fields": [],
        "flatten_ngsi_values": True,
        "include_timestamp": True,
        "field_mapping": {},
        "static_fields": {},
        "envelope_key": "",
        "timeout_seconds": 10.0,
        "success_count": 0,
        "failure_count": 0,
        "last_status_code": None,
        "last_sent_at": "",
        "last_error": "",
        "created_by": "",
        "created_at": "",
        "updated_at": "",
    }


def _row_to_rest_output(row: dict | None, connector_id: str = "") -> dict:
    if row is None:
        return _default_rest_output(connector_id)
    return {
        "configured": True,
        "connector_id": row["connector_id"],
        "enabled": bool(row["enabled"]),
        "target_url": row["target_url"],
        "method": row["method"],
        "has_headers": bool(_json_loads(row["headers_json"], {})),
        "selected_fields": _json_loads(row["selected_fields_json"], []),
        "flatten_ngsi_values": bool(row["flatten_ngsi_values"]),
        "include_timestamp": bool(row["include_timestamp"]),
        "field_mapping": _json_loads(row["field_mapping_json"], {}),
        "static_fields": _json_loads(row["static_fields_json"], {}),
        "envelope_key": row["envelope_key"],
        "timeout_seconds": float(row["timeout_seconds"]),
        "success_count": int(row["success_count"]),
        "failure_count": int(row["failure_count"]),
        "last_status_code": row["last_status_code"],
        "last_sent_at": row["last_sent_at"],
        "last_error": row["last_error"],
        "created_by": row["created_by"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _normalize_rest_output_fields(values: list[str]) -> list[str]:
    fields: list[str] = []
    seen: set[str] = set()
    for raw_value in values or []:
        value = str(raw_value or "").strip()
        if not value or value in seen:
            continue
        if len(value) > 160 or any(char in value for char in ("\r", "\n")):
            raise ValueError("전송 필드명은 160자 이내의 한 줄 문자열이어야 합니다.")
        fields.append(value)
        seen.add(value)
        if len(fields) >= 200:
            break
    return fields


def _clean_rest_output_headers(headers: dict[str, str] | None) -> dict[str, str]:
    cleaned: dict[str, str] = {}
    for raw_name, raw_value in (headers or {}).items():
        name = str(raw_name or "").strip()
        value = str(raw_value or "").strip()
        if not name or any(char in name + value for char in ("\r", "\n")):
            raise ValueError("REST 헤더 이름과 값은 비어 있지 않은 한 줄 문자열이어야 합니다.")
        if name.lower() in {"host", "content-length"}:
            raise ValueError(f"{name} 헤더는 직접 설정할 수 없습니다.")
        cleaned[name] = value
    return cleaned


def _validate_rest_output_url(value: str, enabled: bool = False) -> str:
    target_url = str(value or "").strip()
    if not target_url:
        if enabled:
            raise ValueError("실시간 REST 전송을 사용하려면 전송 URL을 입력해야 합니다.")
        return ""
    parsed = urlparse(target_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("전송 URL은 http:// 또는 https://로 시작해야 합니다.")
    if parsed.username or parsed.password:
        raise ValueError("전송 URL에 사용자 이름이나 비밀번호를 포함할 수 없습니다.")
    return target_url


def _normalize_rest_output_mapping(mapping: dict[str, str]) -> dict[str, str]:
    normalized: dict[str, str] = {}
    for raw_source, raw_target in (mapping or {}).items():
        source = str(raw_source or "").strip()
        target = str(raw_target or "").strip()
        if not source or not target:
            raise ValueError("필드명 변경 규칙에는 원본 필드명과 변경할 필드명이 모두 필요합니다.")
        if max(len(source), len(target)) > 160 or any(char in source + target for char in ("\r", "\n")):
            raise ValueError("필드명 변경 규칙은 160자 이내의 한 줄 문자열이어야 합니다.")
        normalized[source] = target
    return normalized


def _flatten_ngsi_value(value: Any) -> Any:
    if isinstance(value, dict):
        if "value" in value and value.get("type") in {"Property", "GeoProperty", None}:
            return _flatten_ngsi_value(value["value"])
        return {key: _flatten_ngsi_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_flatten_ngsi_value(item) for item in value]
    return value


def transform_record_for_rest(record: dict, config: dict) -> dict:
    payload = dict(record.get("payload") or {})
    if config.get("flatten_ngsi_values", True):
        payload = _flatten_ngsi_value(payload)
    selected_fields = _normalize_rest_output_fields(config.get("selected_fields") or [])
    if selected_fields:
        payload = {field: payload[field] for field in selected_fields if field in payload}
    mapping = _normalize_rest_output_mapping(config.get("field_mapping") or {})
    transformed = {mapping.get(key, key): value for key, value in payload.items()}
    transformed.update(config.get("static_fields") or {})
    if config.get("include_timestamp", True):
        transformed["timestamp"] = record.get("timestamp") or record.get("created_at") or _now()
    envelope_key = str(config.get("envelope_key") or "").strip()
    if envelope_key:
        if len(envelope_key) > 80 or any(char in envelope_key for char in ("\r", "\n")):
            raise ValueError("최상위 묶음 키는 80자 이내의 한 줄 문자열이어야 합니다.")
        return {envelope_key: transformed}
    return transformed


def _fetch_rest_output(conn: Any, namespace: str, connector_id: str) -> dict | None:
    return conn.execute(
        "SELECT * FROM collection_rest_outputs WHERE namespace = ? AND connector_id = ?",
        (namespace, connector_id),
    ).fetchone()


def get_connector_rest_output(namespace: str, connector_id: str) -> dict:
    with _connect() as conn:
        if _fetch_connector(conn, namespace, connector_id) is None:
            raise ValueError("커넥터를 찾을 수 없습니다.")
        row = _fetch_rest_output(conn, namespace, connector_id)
    return _row_to_rest_output(row, connector_id)


def save_connector_rest_output(
    namespace: str,
    connector_id: str,
    created_by: str,
    req: ConnectorRestOutputRequest,
) -> dict:
    now = _now()
    target_url = _validate_rest_output_url(req.target_url, req.enabled)
    selected_fields = _normalize_rest_output_fields(req.selected_fields)
    field_mapping = _normalize_rest_output_mapping(req.field_mapping)
    envelope_key = str(req.envelope_key or "").strip()
    if envelope_key and (len(envelope_key) > 80 or any(char in envelope_key for char in ("\r", "\n"))):
        raise ValueError("최상위 묶음 키는 80자 이내의 한 줄 문자열이어야 합니다.")
    with _connect() as conn:
        if _fetch_connector(conn, namespace, connector_id) is None:
            raise ValueError("커넥터를 찾을 수 없습니다.")
        existing = _fetch_rest_output(conn, namespace, connector_id)
        if req.clear_headers:
            headers = {}
        elif req.headers is None:
            headers = _json_loads(existing["headers_json"], {}) if existing else {}
        else:
            headers = _clean_rest_output_headers(req.headers)
        conn.execute(
            """
            INSERT INTO collection_rest_outputs (
                namespace, connector_id, enabled, target_url, method, headers_json,
                selected_fields_json, flatten_ngsi_values, include_timestamp,
                field_mapping_json, static_fields_json, envelope_key, timeout_seconds,
                success_count, failure_count, last_status_code, last_sent_at, last_error,
                created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, '', '', ?, ?, ?)
            ON CONFLICT(namespace, connector_id) DO UPDATE SET
                enabled = EXCLUDED.enabled,
                target_url = EXCLUDED.target_url,
                method = EXCLUDED.method,
                headers_json = EXCLUDED.headers_json,
                selected_fields_json = EXCLUDED.selected_fields_json,
                flatten_ngsi_values = EXCLUDED.flatten_ngsi_values,
                include_timestamp = EXCLUDED.include_timestamp,
                field_mapping_json = EXCLUDED.field_mapping_json,
                static_fields_json = EXCLUDED.static_fields_json,
                envelope_key = EXCLUDED.envelope_key,
                timeout_seconds = EXCLUDED.timeout_seconds,
                updated_at = EXCLUDED.updated_at
            """,
            (
                namespace,
                connector_id,
                int(req.enabled),
                target_url,
                req.method,
                _json_dumps(headers),
                json.dumps(selected_fields, ensure_ascii=False),
                int(req.flatten_ngsi_values),
                int(req.include_timestamp),
                _json_dumps(field_mapping),
                _json_dumps(req.static_fields),
                envelope_key,
                req.timeout_seconds,
                created_by,
                now,
                now,
            ),
        )
        conn.commit()
    return get_connector_rest_output(namespace, connector_id)


def delete_connector_rest_output(namespace: str, connector_id: str) -> dict:
    with _connect() as conn:
        if _fetch_connector(conn, namespace, connector_id) is None:
            raise ValueError("커넥터를 찾을 수 없습니다.")
        conn.execute(
            "DELETE FROM collection_rest_delivery_logs WHERE namespace = ? AND connector_id = ?",
            (namespace, connector_id),
        )
        conn.execute(
            "DELETE FROM collection_rest_outputs WHERE namespace = ? AND connector_id = ?",
            (namespace, connector_id),
        )
        conn.commit()
    return {"deleted": True, "connector_id": connector_id}


def list_connector_rest_output_logs(namespace: str, connector_id: str, limit: int = 30) -> list[dict]:
    limit = max(1, min(int(limit or 30), 200))
    with _connect() as conn:
        if _fetch_connector(conn, namespace, connector_id) is None:
            raise ValueError("커넥터를 찾을 수 없습니다.")
        rows = conn.execute(
            """
            SELECT * FROM collection_rest_delivery_logs
            WHERE namespace = ? AND connector_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (namespace, connector_id, limit),
        ).fetchall()
    return [
        {
            "id": row["id"],
            "connector_id": row["connector_id"],
            "record_id": row["record_id"],
            "target_url": row["target_url"],
            "status": row["status"],
            "status_code": row["status_code"],
            "request_payload": _json_loads(row["request_payload_json"], {}),
            "response_preview": row["response_preview"],
            "error": row["error"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]


def _rest_output_request_config(
    req: ConnectorRestOutputRequest,
    stored_headers: dict[str, str] | None = None,
) -> dict:
    if req.clear_headers:
        headers = {}
    elif req.headers is None:
        headers = stored_headers or {}
    else:
        headers = _clean_rest_output_headers(req.headers)
    return {
        "enabled": req.enabled,
        "target_url": _validate_rest_output_url(req.target_url, True),
        "method": req.method,
        "headers": headers,
        "selected_fields": _normalize_rest_output_fields(req.selected_fields),
        "flatten_ngsi_values": req.flatten_ngsi_values,
        "include_timestamp": req.include_timestamp,
        "field_mapping": _normalize_rest_output_mapping(req.field_mapping),
        "static_fields": req.static_fields,
        "envelope_key": str(req.envelope_key or "").strip(),
        "timeout_seconds": req.timeout_seconds,
    }


def _send_rest_output(config: dict, body: dict) -> tuple[int, str]:
    with httpx.Client(timeout=config["timeout_seconds"], follow_redirects=True) as client:
        response = client.request(
            config["method"],
            config["target_url"],
            json=body,
            headers=config.get("headers") or {},
        )
        preview = response.text[:500]
        if response.is_error:
            raise ValueError(f"HTTP {response.status_code}: {preview or '응답 본문 없음'}")
        return response.status_code, preview


def test_connector_rest_output(
    namespace: str,
    connector_id: str,
    req: ConnectorRestOutputTestRequest,
) -> dict:
    with _connect() as conn:
        if _fetch_connector(conn, namespace, connector_id) is None:
            raise ValueError("커넥터를 찾을 수 없습니다.")
        stored = _fetch_rest_output(conn, namespace, connector_id)
        stored_headers = _json_loads(stored["headers_json"], {}) if stored else {}
        latest = conn.execute(
            """
            SELECT r.*, '' AS twin_name, '' AS connector_name
            FROM collection_records r
            WHERE r.namespace = ? AND r.connector_id = ?
            ORDER BY r.created_at DESC
            LIMIT 1
            """,
            (namespace, connector_id),
        ).fetchone()
    if req.sample_payload:
        sample_record = {
            "payload": req.sample_payload,
            "timestamp": _now(),
            "created_at": _now(),
        }
    elif latest is not None:
        sample_record = _row_to_record(latest)
    else:
        raise ValueError("전송 테스트에 사용할 최근 수집 레코드가 없습니다.")
    config = _rest_output_request_config(req, stored_headers)
    body = transform_record_for_rest(sample_record, config)
    try:
        status_code, preview = _send_rest_output(config, body)
    except httpx.HTTPError as exc:
        raise ValueError(f"REST API 연결 실패: {exc}") from exc
    return {
        "sent": True,
        "status_code": status_code,
        "response_preview": preview,
        "request_payload": body,
    }


def _record_rest_output_delivery(
    namespace: str,
    connector_id: str,
    record_id: str,
    config: dict,
    body: dict,
) -> None:
    status = "success"
    status_code: int | None = None
    response_preview = ""
    error = ""
    try:
        status_code, response_preview = _send_rest_output(config, body)
    except ValueError as exc:
        status = "failed"
        error = str(exc)[:1000]
    except httpx.HTTPError as exc:
        status = "failed"
        error = f"REST API 연결 실패: {exc}"[:1000]
    except Exception as exc:  # nosec - delivery errors must not stop collection
        status = "failed"
        error = f"{type(exc).__name__}: {exc}"[:1000]
    now = _now()
    with _connect() as conn:
        if _fetch_rest_output(conn, namespace, connector_id) is None:
            return
        conn.execute(
            """
            INSERT INTO collection_rest_delivery_logs (
                id, namespace, connector_id, record_id, target_url, status,
                status_code, request_payload_json, response_preview, error, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                _make_id("delivery", connector_id),
                namespace,
                connector_id,
                record_id,
                config["target_url"],
                status,
                status_code,
                _json_dumps(body),
                response_preview,
                error,
                now,
            ),
        )
        if status == "success":
            conn.execute(
                """
                UPDATE collection_rest_outputs
                SET success_count = success_count + 1, last_status_code = ?,
                    last_sent_at = ?, last_error = '', updated_at = ?
                WHERE namespace = ? AND connector_id = ?
                """,
                (status_code, now, now, namespace, connector_id),
            )
        else:
            conn.execute(
                """
                UPDATE collection_rest_outputs
                SET failure_count = failure_count + 1, last_status_code = ?,
                    last_sent_at = ?, last_error = ?, updated_at = ?
                WHERE namespace = ? AND connector_id = ?
                """,
                (status_code, now, error, now, namespace, connector_id),
            )
        conn.execute(
            """
            DELETE FROM collection_rest_delivery_logs
            WHERE namespace = ? AND connector_id = ? AND id NOT IN (
                SELECT id FROM collection_rest_delivery_logs
                WHERE namespace = ? AND connector_id = ?
                ORDER BY created_at DESC
                LIMIT 200
            )
            """,
            (namespace, connector_id, namespace, connector_id),
        )
        conn.commit()


def queue_rest_output_delivery(record: dict) -> bool:
    namespace = str(record.get("namespace") or "")
    connector_id = str(record.get("connector_id") or "")
    if not namespace or not connector_id:
        return False
    with _connect() as conn:
        row = _fetch_rest_output(conn, namespace, connector_id)
    if row is None or not bool(row["enabled"]):
        return False
    config = {
        **_row_to_rest_output(row, connector_id),
        "headers": _json_loads(row["headers_json"], {}),
    }
    body = transform_record_for_rest(record, config)
    _REST_OUTPUT_EXECUTOR.submit(
        _record_rest_output_delivery,
        namespace,
        connector_id,
        record["id"],
        config,
        body,
    )
    return True


def _fetch_twin(conn: Any, namespace: str, twin_id: str) -> dict | None:
    if not twin_id:
        return None
    return conn.execute(
        "SELECT * FROM digital_twins WHERE namespace = ? AND id = ?",
        (namespace, twin_id),
    ).fetchone()


def _fetch_connector(conn: Any, namespace: str, connector_id: str) -> dict | None:
    if not connector_id:
        return None
    return conn.execute(
        "SELECT * FROM collection_connectors WHERE namespace = ? AND id = ?",
        (namespace, connector_id),
    ).fetchone()


def _require_twin(conn: Any, namespace: str, twin_id: str) -> None:
    if twin_id and _fetch_twin(conn, namespace, twin_id) is None:
        raise ValueError("디지털 트윈을 찾을 수 없습니다.")


def _default_method(connector_type: str, method: str) -> str:
    if method:
        return method.upper()
    return "POST" if connector_type == "rest" else ""


def _validate_custom_yaml_config(yaml_config: str) -> str:
    text = str(yaml_config or "").strip()
    if not text:
        raise ValueError("Custom YAML 커넥터는 YAML 설정이 필요합니다.")
    try:
        parsed = yaml.safe_load(text)
    except yaml.YAMLError as e:
        detail = str(e).splitlines()[0] if str(e) else type(e).__name__
        raise ValueError(f"Custom YAML 형식 오류: {detail}") from e
    if not isinstance(parsed, dict) or not parsed:
        raise ValueError("Custom YAML은 비어 있지 않은 key/value 객체 형식이어야 합니다. 예: connector: ...")
    return text


def _effective_connector_values(existing: dict, data: dict) -> dict:
    return {
        "connector_type": data.get("connector_type", existing["connector_type"]),
        "yaml_config": data.get("yaml_config", existing["yaml_config"]),
    }


def list_twins(namespace: str) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT
                t.*,
                COALESCE(c.connector_count, 0) AS connector_count,
                COALESCE(r.record_count, 0) AS record_count,
                COALESCE(r.last_record_at, '') AS last_record_at
            FROM digital_twins t
            LEFT JOIN (
                SELECT namespace, twin_id, COUNT(*) AS connector_count
                FROM collection_connectors
                GROUP BY namespace, twin_id
            ) c ON c.namespace = t.namespace AND c.twin_id = t.id
            LEFT JOIN (
                SELECT namespace, twin_id, COUNT(*) AS record_count, MAX(created_at) AS last_record_at
                FROM collection_records
                GROUP BY namespace, twin_id
            ) r ON r.namespace = t.namespace AND r.twin_id = t.id
            WHERE t.namespace = ?
            ORDER BY t.updated_at DESC
            """,
            (namespace,),
        ).fetchall()
        return [_row_to_twin(row) for row in rows]


def create_twin(namespace: str, created_by: str, req: TwinCreateRequest) -> dict:
    now = _now()
    twin_id = _make_id("twin", req.name)
    with _connect() as conn:
        try:
            conn.execute(
                """
                INSERT INTO digital_twins (
                    id, namespace, name, description, status, last_seen_at,
                    created_by, created_at, updated_at, meta_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    twin_id,
                    namespace,
                    req.name.strip(),
                    req.description.strip(),
                    req.status,
                    now if req.status == "online" else "",
                    created_by,
                    now,
                    now,
                    _json_dumps(req.metadata),
                ),
            )
            conn.commit()
        except DB_INTEGRITY_ERROR as e:
            raise ValueError("같은 이름의 디지털 트윈이 이미 있습니다.") from e
    return get_twin(namespace, twin_id)


def get_twin(namespace: str, twin_id: str) -> dict:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT
                t.*,
                COALESCE(c.connector_count, 0) AS connector_count,
                COALESCE(r.record_count, 0) AS record_count,
                COALESCE(r.last_record_at, '') AS last_record_at
            FROM digital_twins t
            LEFT JOIN (
                SELECT namespace, twin_id, COUNT(*) AS connector_count
                FROM collection_connectors
                GROUP BY namespace, twin_id
            ) c ON c.namespace = t.namespace AND c.twin_id = t.id
            LEFT JOIN (
                SELECT namespace, twin_id, COUNT(*) AS record_count, MAX(created_at) AS last_record_at
                FROM collection_records
                GROUP BY namespace, twin_id
            ) r ON r.namespace = t.namespace AND r.twin_id = t.id
            WHERE t.namespace = ? AND t.id = ?
            """,
            (namespace, twin_id),
        ).fetchone()
        if row is None:
            raise ValueError("디지털 트윈을 찾을 수 없습니다.")
        return _row_to_twin(row)


def update_twin(namespace: str, twin_id: str, req: TwinUpdateRequest) -> dict:
    data = req.dict(exclude_unset=True)
    with _connect() as conn:
        if _fetch_twin(conn, namespace, twin_id) is None:
            raise ValueError("디지털 트윈을 찾을 수 없습니다.")
        fields: list[str] = []
        params: list[Any] = []
        for key, value in data.items():
            if key == "metadata":
                if value is None:
                    continue
                fields.append("meta_json = ?")
                params.append(_json_dumps(value))
            elif key in {"name", "description", "status"}:
                if value is None:
                    continue
                fields.append(f"{key} = ?")
                params.append(value.strip() if isinstance(value, str) else value)
        if fields:
            fields.append("updated_at = ?")
            params.append(_now())
            params.extend([namespace, twin_id])
            update_sql = "UPDATE digital_twins SET {} WHERE namespace = ? AND id = ?".format(", ".join(fields))  # nosec
            conn.execute(update_sql, params)
            conn.commit()
    return get_twin(namespace, twin_id)


def delete_twin(namespace: str, twin_id: str) -> dict:
    with _connect() as conn:
        row = _fetch_twin(conn, namespace, twin_id)
        if row is None:
            raise ValueError("디지털 트윈을 찾을 수 없습니다.")
        conn.execute(
            "UPDATE collection_connectors SET twin_id = '', updated_at = ? WHERE namespace = ? AND twin_id = ?",
            (_now(), namespace, twin_id),
        )
        conn.execute("DELETE FROM digital_twins WHERE namespace = ? AND id = ?", (namespace, twin_id))
        conn.commit()
    return {"deleted": True, "id": twin_id}


def list_connectors(namespace: str) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT
                c.*,
                COALESCE(t.name, '') AS twin_name,
                COALESCE(r.record_count, 0) AS record_count,
                COALESCE(r.last_record_at, '') AS last_record_at
            FROM collection_connectors c
            LEFT JOIN digital_twins t ON t.namespace = c.namespace AND t.id = c.twin_id
            LEFT JOIN (
                SELECT namespace, connector_id, COUNT(*) AS record_count, MAX(created_at) AS last_record_at
                FROM collection_records
                GROUP BY namespace, connector_id
            ) r ON r.namespace = c.namespace AND r.connector_id = c.id
            WHERE c.namespace = ?
            ORDER BY c.updated_at DESC
            """,
            (namespace,),
        ).fetchall()
        return [_row_to_connector(row) for row in rows]


def create_connector(namespace: str, created_by: str, req: ConnectorCreateRequest) -> dict:
    now = _now()
    connector_type = req.connector_type
    if connector_type not in CONNECTOR_TYPES:
        raise ValueError("지원하지 않는 커넥터 유형입니다.")
    connector_id = _make_id(connector_type, req.name)
    yaml_config = _validate_custom_yaml_config(req.yaml_config) if connector_type == "custom" else req.yaml_config
    with _connect() as conn:
        _require_twin(conn, namespace, req.twin_id)
        try:
            conn.execute(
                """
                INSERT INTO collection_connectors (
                    id, namespace, name, connector_type, twin_id, endpoint_url, port,
                    topic, method, yaml_config, status, last_checked_at, last_message_at,
                    created_by, created_at, updated_at, meta_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    connector_id,
                    namespace,
                    req.name.strip(),
                    connector_type,
                    req.twin_id.strip(),
                    req.endpoint_url.strip(),
                    req.port,
                    req.topic.strip(),
                    _default_method(connector_type, req.method.strip()),
                    yaml_config,
                    req.status or "draft",
                    "",
                    "",
                    created_by,
                    now,
                    now,
                    _json_dumps(req.metadata),
                ),
            )
            conn.commit()
        except DB_INTEGRITY_ERROR as e:
            raise ValueError("같은 이름의 커넥터가 이미 있습니다.") from e
    return get_connector(namespace, connector_id)


def get_connector(namespace: str, connector_id: str) -> dict:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT
                c.*,
                COALESCE(t.name, '') AS twin_name,
                COALESCE(r.record_count, 0) AS record_count,
                COALESCE(r.last_record_at, '') AS last_record_at
            FROM collection_connectors c
            LEFT JOIN digital_twins t ON t.namespace = c.namespace AND t.id = c.twin_id
            LEFT JOIN (
                SELECT namespace, connector_id, COUNT(*) AS record_count, MAX(created_at) AS last_record_at
                FROM collection_records
                GROUP BY namespace, connector_id
            ) r ON r.namespace = c.namespace AND r.connector_id = c.id
            WHERE c.namespace = ? AND c.id = ?
            """,
            (namespace, connector_id),
        ).fetchone()
        if row is None:
            raise ValueError("커넥터를 찾을 수 없습니다.")
        return _row_to_connector(row)


def update_connector(namespace: str, connector_id: str, req: ConnectorUpdateRequest) -> dict:
    data = req.dict(exclude_unset=True)
    with _connect() as conn:
        existing = _fetch_connector(conn, namespace, connector_id)
        if existing is None:
            raise ValueError("커넥터를 찾을 수 없습니다.")
        source_fields = {"connector_type", "twin_id", "endpoint_url", "port", "topic", "method"}
        source_changed = False
        for key in source_fields:
            if key not in data:
                continue
            requested_value = data[key]
            existing_value = existing[key]
            if key == "method":
                requested_value = str(requested_value or "").strip().upper()
                existing_value = str(existing_value or "").strip().upper()
            elif isinstance(requested_value, str):
                requested_value = requested_value.strip()
                existing_value = str(existing_value or "").strip()
            if requested_value != existing_value:
                source_changed = True
                break
        if source_changed:
            metadata = data.get("metadata")
            if metadata is None:
                metadata = _json_loads(existing["meta_json"], {})
            else:
                metadata = dict(metadata)
            metadata.pop("preview", None)
            data["metadata"] = metadata
            data["status"] = "draft"
        effective = _effective_connector_values(existing, data)
        if effective["connector_type"] == "custom":
            validated_yaml = _validate_custom_yaml_config(effective["yaml_config"])
            if "yaml_config" in data:
                data["yaml_config"] = validated_yaml
        if "twin_id" in data and data["twin_id"]:
            _require_twin(conn, namespace, data["twin_id"])
        fields: list[str] = []
        params: list[Any] = []
        for key, value in data.items():
            if key == "metadata":
                if value is None:
                    continue
                fields.append("meta_json = ?")
                params.append(_json_dumps(value))
            elif key == "connector_type":
                if value not in CONNECTOR_TYPES:
                    raise ValueError("지원하지 않는 커넥터 유형입니다.")
                fields.append("connector_type = ?")
                params.append(value)
            elif key == "method":
                fields.append("method = ?")
                params.append(str(value or "").upper())
            elif key in {"name", "twin_id", "endpoint_url", "topic", "yaml_config", "status", "port"}:
                if key == "status" and value not in CONNECTOR_STATUSES:
                    raise ValueError("지원하지 않는 커넥터 상태입니다.")
                fields.append(f"{key} = ?")
                params.append(value.strip() if isinstance(value, str) else value)
        if fields:
            if source_changed:
                fields.append("last_checked_at = ?")
                params.append("")
            fields.append("updated_at = ?")
            params.append(_now())
            params.extend([namespace, connector_id])
            update_sql = "UPDATE collection_connectors SET {} WHERE namespace = ? AND id = ?".format(", ".join(fields))  # nosec
            conn.execute(update_sql, params)
            conn.commit()
    return get_connector(namespace, connector_id)


def delete_connector(namespace: str, connector_id: str) -> dict:
    with _connect() as conn:
        if _fetch_connector(conn, namespace, connector_id) is None:
            raise ValueError("커넥터를 찾을 수 없습니다.")
    stop_realtime_collection(namespace, connector_id, remove_session=True)
    with _connect() as conn:
        conn.execute(
            "DELETE FROM collection_rest_delivery_logs WHERE namespace = ? AND connector_id = ?",
            (namespace, connector_id),
        )
        conn.execute(
            "DELETE FROM collection_rest_outputs WHERE namespace = ? AND connector_id = ?",
            (namespace, connector_id),
        )
        conn.execute(
            "DELETE FROM nifi_flow_specs WHERE namespace = ? AND connector_id = ?",
            (namespace, connector_id),
        )
        conn.execute("DELETE FROM collection_connectors WHERE namespace = ? AND id = ?", (namespace, connector_id))
        conn.commit()
    return {"deleted": True, "id": connector_id}


def _has_port(endpoint: str) -> bool:
    if not endpoint:
        return False
    parsed = urlparse(endpoint if "://" in endpoint else f"//{endpoint}")
    try:
        return parsed.port is not None
    except ValueError:
        return False


def test_connector(namespace: str, connector_id: str) -> dict:
    connector = get_connector(namespace, connector_id)
    connector_type = connector["connector_type"]
    endpoint = connector["endpoint_url"].strip()
    port = connector["port"]
    topic = connector["topic"].strip()
    yaml_config = connector["yaml_config"].strip()
    messages: list[str] = []

    if connector_type in {"mqtt", "kafka", "redis", "rest"} and not endpoint:
        messages.append("URL 또는 호스트를 입력해야 합니다.")
    if connector_type in {"mqtt", "kafka", "redis"} and not port and not _has_port(endpoint):
        messages.append("포트를 입력하거나 URL에 포트를 포함해야 합니다.")
    if connector_type in {"mqtt", "kafka"} and not topic:
        messages.append("MQTT topic 또는 Kafka topic을 입력해야 합니다.")
    if connector_type == "rest" and endpoint and not endpoint.startswith(("http://", "https://")):
        messages.append("REST 커넥터는 http:// 또는 https:// URL을 사용해야 합니다.")
    if connector_type == "custom":
        try:
            _validate_custom_yaml_config(yaml_config)
        except ValueError as e:
            messages.append(str(e))

    status = "error" if messages else "ready"
    now = _now()
    with _connect() as conn:
        conn.execute(
            """
            UPDATE collection_connectors
            SET status = ?, last_checked_at = ?, updated_at = ?
            WHERE namespace = ? AND id = ?
            """,
            (status, now, now, namespace, connector_id),
        )
        conn.commit()

    return {
        "valid": not messages,
        "messages": messages or ["기본 설정 형식을 확인했습니다. REST 커넥터는 샘플 데이터 조회로 실제 endpoint 응답을 확인하세요."],
        "connector": get_connector(namespace, connector_id),
    }


def _rest_connector_collect_url(connector: dict) -> str:
    endpoint = str(connector.get("endpoint_url") or "").strip()
    if not endpoint.startswith(("http://", "https://")):
        raise ValueError("REST 커넥터는 http:// 또는 https:// URL을 사용해야 합니다.")

    parsed = urlparse(endpoint)
    if not parsed.netloc:
        raise ValueError("REST 커넥터 URL 형식이 올바르지 않습니다.")

    port = connector.get("port")
    try:
        has_existing_port = parsed.port is not None
    except ValueError as e:
        raise ValueError("REST 커넥터 URL의 port 형식이 올바르지 않습니다.") from e
    if port and not has_existing_port:
        host = parsed.hostname or ""
        if not host:
            raise ValueError("REST 커넥터 host를 확인할 수 없습니다.")
        if ":" in host and not host.startswith("["):
            host = f"[{host}]"
        parsed = parsed._replace(netloc=f"{host}:{int(port)}")

    url = parsed.geturl().rstrip("/")
    path = str(connector.get("topic") or "").strip()
    if path:
        if path.startswith(("http://", "https://")):
            url = path
        elif path.startswith("/"):
            url = f"{url}{path}"
        else:
            url = f"{url}/{path}"
    return url


def _selected_attribute_names_from_connector(connector: dict) -> list[str]:
    metadata = connector.get("metadata") or {}
    names: list[str] = []
    selected = metadata.get("selected_attributes") or []
    if isinstance(selected, list):
        for item in selected:
            if isinstance(item, str):
                names.append(item)
            elif isinstance(item, dict):
                names.append(str(item.get("name") or item.get("attribute_name") or ""))
    fallback_name = metadata.get("attribute_name")
    if fallback_name:
        names.append(str(fallback_name))
    normalized: list[str] = []
    seen: set[str] = set()
    for name in names:
        clean = str(name or "").strip()
        if not clean or clean.startswith("connector:") or clean in seen:
            continue
        seen.add(clean)
        normalized.append(clean)
    return normalized


def _filter_payload_by_attributes(payload: dict, selected_attributes: list[str] | None) -> tuple[dict, list[str]]:
    names: list[str] = []
    seen: set[str] = set()
    for name in selected_attributes or []:
        clean = str(name or "").strip()
        if not clean or clean.startswith("connector:") or clean in seen:
            continue
        seen.add(clean)
        names.append(clean)
    if not names or not isinstance(payload, dict):
        return payload, []
    return {key: payload[key] for key in names if key in payload}, names


def _response_payload(response: httpx.Response) -> dict:
    content_type = response.headers.get("content-type", "")
    text = response.text
    parsed: Any
    if "json" in content_type.lower() or text.lstrip().startswith(("{", "[")):
        try:
            parsed = response.json()
        except Exception:  # nosec
            parsed = text
    else:
        parsed = text

    if isinstance(parsed, dict):
        return parsed
    if isinstance(parsed, list):
        return {"items": parsed}
    return {"raw": parsed}


def _request_rest_connector(connector: dict) -> tuple[httpx.Response, dict, str, str]:
    if connector.get("connector_type") != "rest":
        raise ValueError("샘플 조회와 즉시 수집은 REST API 커넥터에서만 지원합니다.")
    if not connector.get("twin_id"):
        raise ValueError("REST 데이터를 조회하려면 커넥터에 디지털 트윈을 연결해야 합니다.")

    url = _rest_connector_collect_url(connector)
    method = (connector.get("method") or "GET").strip().upper()
    if method not in {"GET", "POST"}:
        raise ValueError("샘플 조회와 즉시 수집은 REST GET 또는 POST 커넥터에서만 지원합니다.")

    timeout = float(os.environ.get("DC_REST_COLLECT_TIMEOUT", "10"))
    headers = {"Accept": "application/json", "User-Agent": "prediction-manager-data-collector/1.0"}
    request_kwargs: dict[str, Any] = {"headers": headers}
    if method == "POST":
        request_kwargs["json"] = {
            "source": "prediction-manager",
            "connector_id": connector.get("id") or "",
        }

    try:
        with httpx.Client(timeout=timeout, follow_redirects=False) as client:
            response = client.request(method, url, **request_kwargs)
            response.raise_for_status()
    except httpx.HTTPStatusError as e:
        status_code = e.response.status_code if e.response is not None else ""
        raise ValueError(f"REST 커넥터 요청 실패: HTTP {status_code}") from e
    except httpx.RequestError as e:
        raise ValueError(f"REST 커넥터 요청 실패: {e}") from e

    return response, _response_payload(response), url, method


def _rest_preview_attributes(payload: dict) -> list[dict]:
    attributes: list[dict] = []
    for name, value in payload.items():
        if name in {"id", "type", "@context"}:
            continue
        sample = value
        value_type = type(value).__name__
        observed_at = ""
        if isinstance(value, dict):
            value_type = str(value.get("type") or type(value.get("value")).__name__)
            if "value" in value:
                sample = value.get("value")
            observed_at = str(value.get("observedAt") or "")
        attributes.append(
            {
                "name": name,
                "label": name,
                "type": value_type,
                "sample": sample,
                "observed_at": observed_at,
                "source": "preview",
            }
        )
    return attributes


def preview_connector_data(namespace: str, connector_id: str) -> dict:
    connector = get_connector(namespace, connector_id)
    try:
        response, payload, url, method = _request_rest_connector(connector)
    except ValueError:
        now = _now()
        with _connect() as conn:
            conn.execute(
                """
                UPDATE collection_connectors
                SET status = 'error', last_checked_at = ?, updated_at = ?
                WHERE namespace = ? AND id = ?
                """,
                (now, now, namespace, connector_id),
            )
            conn.commit()
        raise

    now = _now()
    attributes = _rest_preview_attributes(payload)
    metadata = dict(connector.get("metadata") or {})
    metadata["preview"] = {
        "previewed_at": now,
        "url": url,
        "method": method,
        "status_code": response.status_code,
        "payload_key_count": len(payload),
        "attributes": attributes,
    }
    with _connect() as conn:
        conn.execute(
            """
            UPDATE collection_connectors
            SET status = 'ready', last_checked_at = ?, updated_at = ?, meta_json = ?
            WHERE namespace = ? AND id = ?
            """,
            (now, now, _json_dumps(metadata), namespace, connector_id),
        )
        conn.commit()
    return {
        "valid": True,
        "method": method,
        "url": url,
        "status_code": response.status_code,
        "previewed_at": now,
        "payload_key_count": len(payload),
        "attributes": attributes,
        "sample_payload": payload,
        "connector": get_connector(namespace, connector_id),
    }


def collect_connector_now(namespace: str, connector_id: str, created_by: str = "", selected_attributes: list[str] | None = None) -> dict:
    connector = get_connector(namespace, connector_id)
    response, payload, url, method = _request_rest_connector(connector)
    requested_attributes = list(selected_attributes or []) or _selected_attribute_names_from_connector(connector)
    filtered_payload, applied_attributes = _filter_payload_by_attributes(payload, requested_attributes)
    record = ingest_device_data(
        namespace,
        connector.get("twin_id") or connector_id,
        DeviceDataIngestRequest(
            twin_id=connector.get("twin_id") or "",
            connector_id=connector_id,
            timestamp=_now(),
            type=f"rest.{method.lower()}",
            payload=filtered_payload,
            meta={
                "ingest_source": "rest_connector_collect",
                "source_url": url,
                "http_method": method,
                "http_status": response.status_code,
                "content_type": response.headers.get("content-type", ""),
                "selected_attributes": applied_attributes,
                "filtered_payload": bool(applied_attributes),
                "source_payload_key_count": len(payload) if isinstance(payload, dict) else 0,
            },
        ),
        created_by,
    )
    return {
        "collected": True,
        "method": method,
        "url": url,
        "status_code": response.status_code,
        "record": record,
        "connector": get_connector(namespace, connector_id),
    }


def _normalize_selected_attributes(selected_attributes: list[str] | None) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for item in selected_attributes or []:
        name = str(item or "").strip()
        if not name or name.startswith("connector:") or name in seen:
            continue
        seen.add(name)
        normalized.append(name)
    return normalized


def _row_to_realtime_session(row: dict | None, namespace: str, connector_id: str) -> dict:
    if row is None:
        return {
            "namespace": namespace,
            "connector_id": connector_id,
            "active": False,
            "status": "stopped",
            "interval_seconds": 3.0,
            "selected_attributes": [],
            "started_by": "",
            "started_at": "",
            "stopped_at": "",
            "last_collected_at": "",
            "last_error": "",
            "collect_count": 0,
            "updated_at": "",
        }
    status = str(row["status"] or "stopped")
    return {
        "namespace": row["namespace"],
        "connector_id": row["connector_id"],
        "active": status == "active",
        "status": status,
        "interval_seconds": float(row["interval_seconds"] or 3.0),
        "selected_attributes": _json_loads(row["selected_attributes_json"], []),
        "started_by": row["started_by"],
        "started_at": row["started_at"],
        "stopped_at": row["stopped_at"],
        "last_collected_at": row["last_collected_at"],
        "last_error": row["last_error"],
        "collect_count": int(row["collect_count"] or 0),
        "updated_at": row["updated_at"],
    }


def get_realtime_collection_status(namespace: str, connector_id: str) -> dict:
    get_connector(namespace, connector_id)
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT * FROM collection_realtime_sessions
            WHERE namespace = ? AND connector_id = ?
            """,
            (namespace, connector_id),
        ).fetchone()
    session = _row_to_realtime_session(row, namespace, connector_id)
    if session["active"]:
        _ensure_realtime_worker(namespace, connector_id)
    return session


def _update_realtime_result(
    namespace: str,
    connector_id: str,
    *,
    collected: bool,
    error: str = "",
) -> None:
    now = _now()
    with _connect() as conn:
        if collected:
            conn.execute(
                """
                UPDATE collection_realtime_sessions
                SET last_collected_at = ?, last_error = '', collect_count = collect_count + 1, updated_at = ?
                WHERE namespace = ? AND connector_id = ? AND status = 'active'
                """,
                (now, now, namespace, connector_id),
            )
        else:
            conn.execute(
                """
                UPDATE collection_realtime_sessions
                SET last_error = ?, updated_at = ?
                WHERE namespace = ? AND connector_id = ? AND status = 'active'
                """,
                (str(error or "")[:1000], now, namespace, connector_id),
            )
        conn.commit()


def _realtime_worker(namespace: str, connector_id: str, stop_event: threading.Event) -> None:
    key = (namespace, connector_id)
    try:
        while not stop_event.is_set():
            with _connect() as conn:
                row = conn.execute(
                    """
                    SELECT * FROM collection_realtime_sessions
                    WHERE namespace = ? AND connector_id = ?
                    """,
                    (namespace, connector_id),
                ).fetchone()
            session = _row_to_realtime_session(row, namespace, connector_id)
            if not session["active"]:
                break
            try:
                collect_connector_now(
                    namespace,
                    connector_id,
                    session["started_by"],
                    selected_attributes=session["selected_attributes"],
                )
                _update_realtime_result(namespace, connector_id, collected=True)
            except Exception as exc:  # keep the session alive for transient source failures
                _update_realtime_result(namespace, connector_id, collected=False, error=str(exc))
            if stop_event.wait(max(1.0, float(session["interval_seconds"]))):
                break
    finally:
        with _REALTIME_WORKERS_LOCK:
            current = _REALTIME_WORKERS.get(key)
            if current and current.get("stop_event") is stop_event:
                _REALTIME_WORKERS.pop(key, None)


def _ensure_realtime_worker(namespace: str, connector_id: str) -> None:
    key = (namespace, connector_id)
    with _REALTIME_WORKERS_LOCK:
        existing = _REALTIME_WORKERS.get(key)
        if existing and existing["thread"].is_alive() and not existing["stop_event"].is_set():
            return
        stop_event = threading.Event()
        thread = threading.Thread(
            target=_realtime_worker,
            args=(namespace, connector_id, stop_event),
            name=f"dc-realtime-{namespace}-{connector_id}",
            daemon=True,
        )
        _REALTIME_WORKERS[key] = {"thread": thread, "stop_event": stop_event}
        thread.start()


def start_realtime_collection(
    namespace: str,
    connector_id: str,
    started_by: str,
    selected_attributes: list[str] | None,
    interval_seconds: float = 3.0,
) -> dict:
    connector = get_connector(namespace, connector_id)
    if connector.get("connector_type") != "rest":
        raise ValueError("서버 반복 수집은 REST API 커넥터에서만 지원합니다.")
    if not connector.get("twin_id"):
        raise ValueError("실시간 수집을 시작하려면 커넥터에 디지털 트윈을 연결해야 합니다.")
    collect_url = _rest_connector_collect_url(connector)
    collect_host = (urlparse(collect_url).hostname or "").lower()
    if collect_host == "example.com" or collect_host.endswith(".example.com"):
        raise ValueError("예시 REST URL로는 실시간 수집을 시작할 수 없습니다. 실제 데이터 소스 URL을 저장하세요.")
    interval = float(interval_seconds or 3.0)
    if interval < 1.0 or interval > 3600.0:
        raise ValueError("수집 간격은 1초 이상 3600초 이하여야 합니다.")
    attributes = _normalize_selected_attributes(selected_attributes)
    if not attributes:
        attributes = _selected_attribute_names_from_connector(connector)
    if not attributes:
        raise ValueError("실시간으로 수집할 데이터 항목을 하나 이상 선택하세요.")

    now = _now()
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO collection_realtime_sessions (
                namespace, connector_id, status, interval_seconds, selected_attributes_json,
                started_by, started_at, stopped_at, last_collected_at, last_error,
                collect_count, updated_at
            ) VALUES (?, ?, 'active', ?, ?, ?, ?, '', '', '', 0, ?)
            ON CONFLICT(namespace, connector_id) DO UPDATE SET
                status = 'active',
                interval_seconds = EXCLUDED.interval_seconds,
                selected_attributes_json = EXCLUDED.selected_attributes_json,
                started_by = EXCLUDED.started_by,
                started_at = EXCLUDED.started_at,
                stopped_at = '',
                last_error = '',
                collect_count = 0,
                updated_at = EXCLUDED.updated_at
            """,
            (
                namespace,
                connector_id,
                interval,
                _json_dumps(attributes),
                started_by,
                now,
                now,
            ),
        )
        conn.commit()
    _ensure_realtime_worker(namespace, connector_id)
    return get_realtime_collection_status(namespace, connector_id)


def stop_realtime_collection(namespace: str, connector_id: str, remove_session: bool = False) -> dict:
    key = (namespace, connector_id)
    with _REALTIME_WORKERS_LOCK:
        worker = _REALTIME_WORKERS.get(key)
        if worker:
            worker["stop_event"].set()

    now = _now()
    with _connect() as conn:
        if remove_session:
            conn.execute(
                "DELETE FROM collection_realtime_sessions WHERE namespace = ? AND connector_id = ?",
                (namespace, connector_id),
            )
        else:
            conn.execute(
                """
                UPDATE collection_realtime_sessions
                SET status = 'stopped', stopped_at = ?, updated_at = ?
                WHERE namespace = ? AND connector_id = ?
                """,
                (now, now, namespace, connector_id),
            )
        conn.commit()
    if remove_session:
        return {"namespace": namespace, "connector_id": connector_id, "active": False, "status": "removed"}
    return get_realtime_collection_status(namespace, connector_id)


def resume_realtime_collections() -> int:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT namespace, connector_id
            FROM collection_realtime_sessions
            WHERE status = 'active'
            """
        ).fetchall()
    for row in rows:
        _ensure_realtime_worker(row["namespace"], row["connector_id"])
    return len(rows)


def shutdown_realtime_collections() -> None:
    with _REALTIME_WORKERS_LOCK:
        workers = list(_REALTIME_WORKERS.values())
    for worker in workers:
        worker["stop_event"].set()
    for worker in workers:
        worker["thread"].join(timeout=2.0)


_RECORD_EXPORT_FIELDS = [
    "id",
    "device_id",
    "twin_id",
    "twin_name",
    "connector_id",
    "connector_name",
    "dataset_id",
    "timestamp",
    "type",
    "file_path",
    "payload_json",
    "meta_json",
    "created_at",
]


def records_to_csv(records: list[dict]) -> str:
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=_RECORD_EXPORT_FIELDS)
    writer.writeheader()
    for record in records:
        writer.writerow({
            "id": record.get("id", ""),
            "device_id": record.get("device_id", ""),
            "twin_id": record.get("twin_id", ""),
            "twin_name": record.get("twin_name", ""),
            "connector_id": record.get("connector_id", ""),
            "connector_name": record.get("connector_name", ""),
            "dataset_id": record.get("dataset_id", ""),
            "timestamp": record.get("timestamp", ""),
            "type": record.get("type", ""),
            "file_path": record.get("file_path", ""),
            "payload_json": json.dumps(record.get("payload") or {}, ensure_ascii=False, sort_keys=True),
            "meta_json": json.dumps(record.get("meta") or {}, ensure_ascii=False, sort_keys=True),
            "created_at": record.get("created_at", ""),
        })
    return output.getvalue()


def records_to_json(records: list[dict]) -> list[dict]:
    rows = []
    for record in records:
        payload = record.get("payload") or {}
        meta = record.get("meta") or {}
        rows.append({
            "id": record.get("id", ""),
            "device_id": record.get("device_id", ""),
            "twin_id": record.get("twin_id", ""),
            "twin_name": record.get("twin_name", ""),
            "connector_id": record.get("connector_id", ""),
            "connector_name": record.get("connector_name", ""),
            "dataset_id": record.get("dataset_id", ""),
            "timestamp": record.get("timestamp", ""),
            "type": record.get("type", ""),
            "file_path": record.get("file_path", ""),
            "payload": payload,
            "meta": meta,
            "payload_json": json.dumps(payload, ensure_ascii=False, sort_keys=True),
            "meta_json": json.dumps(meta, ensure_ascii=False, sort_keys=True),
            "created_at": record.get("created_at", ""),
        })
    return rows


def _normalized_export_attributes(selected_attributes: list[str] | None) -> list[str]:
    attributes: list[str] = []
    seen: set[str] = set()
    for item in selected_attributes or []:
        name = str(item or "").strip()
        if not name or name == "timestamp" or name.startswith("connector:") or name in seen:
            continue
        seen.add(name)
        attributes.append(name)
    return attributes


def _selected_export_value(value: Any) -> Any:
    if isinstance(value, dict) and "value" in value:
        value = value.get("value")
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, sort_keys=True)
    if value is None:
        return ""
    return value


def records_to_selected_rows(records: list[dict], selected_attributes: list[str] | None) -> list[dict]:
    attributes = _normalized_export_attributes(selected_attributes)
    rows: list[dict] = []
    for record in records:
        payload = record.get("payload") or {}
        row = {"timestamp": record.get("timestamp", "")}
        for attribute in attributes:
            row[attribute] = _selected_export_value(payload.get(attribute))
        rows.append(row)
    return rows


def records_to_selected_csv(records: list[dict], selected_attributes: list[str] | None) -> str:
    attributes = _normalized_export_attributes(selected_attributes)
    if not attributes:
        raise ValueError("CSV로 저장할 데이터 항목을 선택하세요.")
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["timestamp", *attributes])
    writer.writeheader()
    writer.writerows(records_to_selected_rows(records, attributes))
    return output.getvalue()


def _find_dataset_by_name(namespace: str, name: str) -> dict | None:
    target = name.strip()
    if not target:
        return None
    for dataset in dataset_service.list_datasets(namespace):
        if dataset.get("name") == target:
            return dataset
    return None


def export_records_to_dataset(namespace: str, user_email: str, req: CollectionDatasetExportRequest) -> dict:
    requested_record_ids = []
    seen_record_ids = set()
    for item in req.record_ids or []:
        record_id = str(item or "").strip()
        if record_id and record_id not in seen_record_ids:
            requested_record_ids.append(record_id)
            seen_record_ids.add(record_id)
        if len(requested_record_ids) >= 500:
            break
    if requested_record_ids:
        records = list_records_by_ids(namespace, requested_record_ids)
        if len(records) != len(requested_record_ids):
            raise ValueError("선택한 수집 레코드 중 일부를 찾을 수 없습니다.")
    else:
        records = list_records(
            namespace,
            twin_id=req.twin_id.strip(),
            device_id=req.device_id.strip(),
            connector_id=req.connector_id.strip(),
            limit=req.limit,
        )
    if not records:
        raise ValueError("데이터셋 버전으로 등록할 수집 레코드가 없습니다.")
    selected_attributes = _normalized_export_attributes(req.selected_attributes)
    if not selected_attributes:
        raise ValueError("데이터셋으로 저장할 데이터 항목을 선택하세요.")

    dataset_id = req.dataset_id.strip()
    dataset = dataset_service.get_dataset(namespace, dataset_id) if dataset_id else None
    created_dataset = False
    if dataset is None:
        dataset_name = req.dataset_name.strip() or "collection-records"
        dataset = _find_dataset_by_name(namespace, dataset_name)
        if dataset is None:
            dataset = dataset_service.create_dataset(
                namespace,
                user_email,
                DatasetCreateRequest(
                    name=dataset_name,
                    description=req.description.strip() or "데이터 수집 레코드에서 생성한 데이터셋",
                    data_type="csv",
                    task="unknown",
                    target_column="",
                ),
            )
            created_dataset = True
    if dataset.get("data_type") != "csv":
        raise ValueError("수집 레코드는 csv 데이터셋에만 버전으로 등록할 수 있습니다.")
    if req.pipeline_ready or req.publish:
        target_column = str(dataset.get("target_column") or "").strip()
        if dataset.get("task") not in {"regression", "classification"} or not target_column:
            raise ValueError(
                "수집 데이터는 데이터셋 카탈로그에서 학습 유형과 target 컬럼을 지정하고 "
                "전처리한 뒤 준비 완료 처리해야 합니다."
            )
        if target_column not in selected_attributes:
            raise ValueError(f"target 컬럼 '{target_column}'을 수집 항목에 포함해 주세요.")

    file_name = req.file_name.strip() or "collection-records.csv"
    if not file_name.lower().endswith(".csv"):
        file_name = f"{file_name}.csv"
    csv_text = records_to_selected_csv(records, selected_attributes)
    filters = {
        "twin_id": req.twin_id.strip(),
        "device_id": req.device_id.strip(),
        "connector_id": req.connector_id.strip(),
        "limit": req.limit,
    }
    metadata = {
        "collection_export": {
            "filters": {k: v for k, v in filters.items() if v not in ("", None)},
            "selected_record_ids": requested_record_ids,
            "record_count": len(records),
            "record_ids": [record.get("id", "") for record in records],
            "selected_attributes": selected_attributes,
            "csv_columns": ["timestamp", *selected_attributes],
            "exported_at": _now(),
            "source": "prediction-manager-data-collection",
        },
        "lineage": {"operation": "collection_records_export"},
    }
    version = dataset_service.create_version_from_bytes(
        namespace,
        dataset["id"],
        user_email,
        file_name=file_name,
        content=csv_text.encode("utf-8"),
        source_kind="collection_export",
        pipeline_ready=req.pipeline_ready,
        notes=req.notes.strip() or "데이터 수집 레코드 CSV export",
        metadata=metadata,
    )
    if req.publish:
        version = dataset_service.publish_version(namespace, dataset["id"], int(version["version"]), user_email)
    return {
        "dataset": dataset_service.get_dataset(namespace, dataset["id"]),
        "version": version,
        "record_count": len(records),
        "created_dataset": created_dataset,
    }




_NIFI_SOURCE_PROCESSORS = {
    "mqtt": {
        "type": "org.apache.nifi.processors.mqtt.ConsumeMQTT",
        "relationships": ["success"],
        "property_map": {
            "Broker URI": "endpoint_url",
            "Topic": "topic",
            "Client ID": "name",
        },
    },
    "rest": {
        "type": "org.apache.nifi.processors.standard.ListenHTTP",
        "relationships": ["success"],
        "property_map": {
            "Base Path": "topic",
            "Listening Port": "port",
        },
    },
    "kafka": {
        "type": "org.apache.nifi.processors.kafka.pubsub.ConsumeKafka_2_6",
        "relationships": ["success"],
        "property_map": {
            "bootstrap.servers": "endpoint_url",
            "topic": "topic",
        },
    },
    "redis": {
        "type": "org.apache.nifi.processors.redis.GetRedis",
        "relationships": ["success"],
        "property_map": {
            "Redis Connection Pool": "endpoint_url",
            "Redis Key": "topic",
        },
    },
    "custom": {
        "type": "custom.yaml.connector",
        "relationships": ["success"],
        "property_map": {},
    },
}


def _connector_remote_url(connector: dict) -> str:
    base = str(connector.get("endpoint_url") or "").strip().rstrip("/")
    path = str(connector.get("topic") or "").strip()
    if not base:
        return path
    parsed = urlparse(base)
    port = connector.get("port")
    if port and parsed.scheme and parsed.netloc and ":" not in parsed.netloc:
        base = f"{parsed.scheme}://{parsed.netloc}:{port}{parsed.path}".rstrip("/")
    if path and not path.startswith("/"):
        path = f"/{path}"
    return f"{base}{path}"


def _nifi_listen_http_base_path(connector: dict) -> str:
    # NiFi ListenHTTP Base Path must not start/end with '/'. Connector topic may
    # contain URL-style paths such as /devices/{id}/data, so normalize it.
    value = str(connector.get("topic") or connector.get("name") or "data").strip()
    value = value.split("?", 1)[0].strip("/")
    value = re.sub(r"[^A-Za-z0-9._~!$&'()*+,;=:@/-]+", "-", value).strip("-/")
    return value or "data"


def _nifi_source_processor_meta(connector: dict) -> dict:
    connector_type = connector.get("connector_type")
    method = str(connector.get("method") or "").strip().upper()
    if connector_type == "rest" and method == "GET":
        return {
            "type": "org.apache.nifi.processors.standard.InvokeHTTP",
            "relationships": ["Response"],
            "auto_terminated_relationships": ["Original", "Failure", "Retry", "No Retry"],
            "scheduling_period": "5 min",
            "property_map": {},
        }
    return _NIFI_SOURCE_PROCESSORS.get(connector_type, _NIFI_SOURCE_PROCESSORS["custom"])


def _nifi_processor_properties(connector: dict) -> dict:
    spec = _nifi_source_processor_meta(connector)
    props = {}
    connector_type = connector.get("connector_type")
    method = str(connector.get("method") or "").strip().upper()

    if connector_type == "rest" and method == "GET":
        props["HTTP Method"] = "GET"
        props["Remote URL"] = _connector_remote_url(connector)
        props["send-message-body"] = "false"
        return props

    for prop_name, connector_key in spec.get("property_map", {}).items():
        value = connector.get(connector_key)
        if value not in (None, ""):
            props[prop_name] = value
    if connector_type == "rest" and "Base Path" in props:
        props["Base Path"] = _nifi_listen_http_base_path(connector)
    if connector.get("port") and connector_type in {"mqtt", "kafka", "redis"}:
        props["Port"] = connector.get("port")
    if connector.get("yaml_config"):
        props["Custom YAML"] = connector.get("yaml_config")
    return props


def _nifi_connector_block(namespace: str, connector: dict) -> dict:
    meta = _nifi_source_processor_meta(connector)
    device_expression = "${device_id:ifEmpty(${filename})}"
    return {
        "connector_id": connector.get("id"),
        "connector_name": connector.get("name"),
        "connector_type": connector.get("connector_type"),
        "twin_id": connector.get("twin_id"),
        "twin_name": connector.get("twin_name", ""),
        "status": connector.get("status"),
        "source_processor": {
            "name": f"{connector.get('name')} input",
            "type": meta["type"],
            "properties": _nifi_processor_properties(connector),
            "relationships": meta["relationships"],
            "auto_terminated_relationships": meta.get("auto_terminated_relationships", []),
            "scheduling_period": meta.get("scheduling_period", ""),
        },
        "normalize_processor": {
            "name": f"{connector.get('name')} normalize metadata",
            "type": "org.apache.nifi.processors.attributes.UpdateAttribute",
            "properties": {
                "device_id": connector.get("twin_id") or device_expression,
                "twin_id": connector.get("twin_id") or "",
                "connector_id": connector.get("id"),
                "connector_type": connector.get("connector_type"),
                "record_type": "sensor",
                "timestamp": "${now():format(\"yyyy-MM-dd'T'HH:mm:ss.SSSX\")}",
            },
        },
        "pm_ingest_processor": {
            "name": f"{connector.get('name')} POST Prediction Manager",
            "type": "org.apache.nifi.processors.standard.InvokeHTTP",
            "properties": {
                "HTTP Method": "POST",
                "Remote URL": f"{PM_INTERNAL_BASE_URL}/api/devices/${{device_id}}/data",
                "Content-Type": "application/json",
                "send-message-body": "true",
                "X-PM-Namespace": namespace,
                "X-PM-Ingest-Token": nifi_ingest_token(namespace),
            },
            "auto_terminated_relationships": ["Original", "Response", "Failure", "Retry", "No Retry"],
        },
        "record_schema": {
            "device_id": "string",
            "dataset_id": "string",
            "timestamp": "string",
            "type": "string",
            "file_path": "string",
            "payload": "object",
            "meta": "object",
        },
    }


def _nifi_request_connector_id(req: NifiFlowSyncRequest | NifiFlowApplyRequest) -> str:
    requested = []
    connector_id = str(getattr(req, "connector_id", "") or "").strip()
    if connector_id:
        requested.append(connector_id)
    requested.extend(
        str(value or "").strip()
        for value in (req.connector_ids or [])
        if str(value or "").strip()
    )
    unique = list(dict.fromkeys(requested))
    if not unique:
        raise ValueError("NiFi flow 작업 대상 커넥터를 선택해 주세요.")
    if len(unique) != 1:
        raise ValueError("NiFi flow spec은 커넥터별로 하나씩 생성해야 합니다.")
    return unique[0]


def generate_nifi_flow_spec(namespace: str, req: NifiFlowSyncRequest | None = None) -> dict:
    req = req or NifiFlowSyncRequest()
    connector_id = _nifi_request_connector_id(req)
    connector = get_connector(namespace, connector_id)
    if not req.include_draft and connector.get("status") != "ready":
        raise ValueError("Ready 상태의 커넥터만 NiFi flow spec으로 생성할 수 있습니다.")

    twins = {twin["id"]: twin for twin in list_twins(namespace)}
    nifi = tenant_resources.nifi_status(namespace)
    block = _nifi_connector_block(namespace, connector)
    twin_id = connector.get("twin_id")
    return {
        "name": f"pm-connector-{_safe_name(connector_id, 'connector')}",
        "namespace": namespace,
        "connector_id": connector_id,
        "connector_name": connector.get("name", ""),
        "generated_at": _now(),
        "deployment_mode": "nifi-connector-flow-spec",
        "nifi": {
            "ready": bool(nifi.ready),
            "provisioned": bool(nifi.provisioned),
            "path": nifi.path,
            "service_url": f"http://nifi.{namespace}.svc.cluster.local:8080/nifi-api",
        },
        "summary": {
            "connector_count": 1,
            "twin_count": 1 if twin_id else 0,
            "auto_start": bool(req.auto_start),
            "include_draft": bool(req.include_draft),
        },
        "twins": [twins[twin_id]] if twin_id and twin_id in twins else [],
        "connectors": [block],
        "common_flow": [
            "source_processor",
            "normalize_processor",
            "pm_ingest_processor",
            "Prediction Manager stores raw payload + metadata in collection_records",
            "User promotes collection_records to dataset catalog version",
        ],
        "notes": [
            "이 spec은 하나의 Prediction Manager 커넥터를 독립 NiFi Process Group으로 변환한 배포 청사진입니다.",
            "실제 processor 생성/시작은 NiFi API 연결 권한과 브로커 endpoint가 준비된 뒤 적용합니다.",
        ],
    }


def sync_nifi_flow_spec(namespace: str, user_email: str, req: NifiFlowSyncRequest) -> dict:
    spec = generate_nifi_flow_spec(namespace, req)
    connector_id = spec["connector_id"]
    nifi_ready = bool(spec.get("nifi", {}).get("ready"))
    status = "ready_to_apply" if nifi_ready else "nifi_pending"
    now = _now()
    with _connect() as conn:
        current = conn.execute(
            """
            SELECT id FROM nifi_flow_specs
            WHERE namespace = ? AND connector_id = ?
            ORDER BY updated_at DESC
            LIMIT 1
            """,
            (namespace, connector_id),
        ).fetchone()
        last_error = "" if nifi_ready else "NiFi가 아직 ready 상태가 아닙니다. spec은 저장되었습니다."
        if current:
            spec_id = current["id"]
            conn.execute(
                """
                UPDATE nifi_flow_specs
                SET status = ?, connector_count = 1, auto_start = ?, spec_json = ?,
                    last_error = ?, created_by = ?, updated_at = ?
                WHERE namespace = ? AND id = ?
                """,
                (
                    status,
                    1 if req.auto_start else 0,
                    json.dumps(spec, ensure_ascii=False, sort_keys=True),
                    last_error,
                    user_email,
                    now,
                    namespace,
                    spec_id,
                ),
            )
        else:
            spec_id = _make_id("nifi-flow", connector_id)
            conn.execute(
                """
                INSERT INTO nifi_flow_specs (
                    id, namespace, connector_id, status, connector_count, auto_start,
                    spec_json, last_error, created_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
                """,
                (
                    spec_id,
                    namespace,
                    connector_id,
                    status,
                    1 if req.auto_start else 0,
                    json.dumps(spec, ensure_ascii=False, sort_keys=True),
                    last_error,
                    user_email,
                    now,
                    now,
                ),
            )
        conn.commit()
    return get_nifi_flow_spec(namespace, spec_id)


def get_nifi_flow_spec(namespace: str, spec_id: str) -> dict:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM nifi_flow_specs WHERE namespace = ? AND id = ?",
            (namespace, spec_id),
        ).fetchone()
    if row is None:
        raise ValueError("NiFi flow spec을 찾을 수 없습니다.")
    spec = _json_loads(row["spec_json"], {})
    keys = set(row.keys())
    connector_id = row["connector_id"] if "connector_id" in keys else ""
    if not connector_id:
        connector_id = str(spec.get("connector_id") or "")
    return {
        "id": row["id"],
        "namespace": row["namespace"],
        "connector_id": connector_id,
        "connector_name": str(spec.get("connector_name") or ""),
        "status": row["status"],
        "connector_count": row["connector_count"],
        "auto_start": bool(row["auto_start"]),
        "spec": spec,
        "last_error": row["last_error"],
        "created_by": row["created_by"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def latest_nifi_flow_spec(namespace: str, connector_id: str = "") -> dict | None:
    with _connect() as conn:
        if connector_id:
            row = conn.execute(
                """
                SELECT id FROM nifi_flow_specs
                WHERE namespace = ? AND connector_id = ?
                ORDER BY updated_at DESC
                LIMIT 1
                """,
                (namespace, connector_id),
            ).fetchone()
        else:
            row = conn.execute(
                "SELECT id FROM nifi_flow_specs WHERE namespace = ? ORDER BY updated_at DESC LIMIT 1",
                (namespace,),
            ).fetchone()
    return get_nifi_flow_spec(namespace, row["id"]) if row else None




def _set_nifi_flow_status(namespace: str, spec_id: str, status: str, last_error: str = "") -> None:
    with _connect() as conn:
        conn.execute(
            """
            UPDATE nifi_flow_specs
            SET status = ?, last_error = ?, updated_at = ?
            WHERE namespace = ? AND id = ?
            """,
            (status, last_error, _now(), namespace, spec_id),
        )
        conn.commit()


def _nifi_api_base(namespace: str) -> str:
    configured = os.environ.get("NIFI_API_BASE_URL", "").strip().rstrip("/")
    if configured:
        return configured
    inst = tenant_resources.nifi_status(namespace)
    return f"{(inst.internal_url or f'http://nifi.{namespace}.svc.cluster.local:8080').rstrip('/')}/nifi-api"


def _nifi_request(client: httpx.Client, method: str, path: str, **kwargs) -> dict:
    resp = client.request(method, path, **kwargs)
    resp.raise_for_status()
    if not resp.content:
        return {}
    return resp.json()


def _nifi_root_group_id(client: httpx.Client) -> str:
    data = _nifi_request(client, "GET", "/flow/process-groups/root")
    pgf = data.get("processGroupFlow") or {}
    return pgf.get("id") or pgf.get("component", {}).get("id") or "root"


def _nifi_group_flow(client: httpx.Client, group_id: str) -> dict:
    data = _nifi_request(client, "GET", f"/flow/process-groups/{group_id}")
    return (data.get("processGroupFlow") or {}).get("flow") or {}


def _nifi_entity_component(entity: dict) -> dict:
    return entity.get("component") or entity


def _nifi_find_by_name(flow: dict, collection: str, name: str) -> dict | None:
    for entity in flow.get(collection, []) or []:
        component = _nifi_entity_component(entity)
        if component.get("name") == name:
            return entity
    return None


def _nifi_ensure_process_group(client: httpx.Client, parent_id: str, name: str) -> str:
    flow = _nifi_group_flow(client, parent_id)
    existing = _nifi_find_by_name(flow, "processGroups", name)
    if existing:
        component = _nifi_entity_component(existing)
        return component.get("id") or existing.get("id")
    try:
        data = _nifi_request(
            client,
            "POST",
            f"/process-groups/{parent_id}/process-groups",
            json={
                "revision": {"version": 0},
                "component": {"name": name, "position": {"x": 120.0, "y": 120.0}},
            },
        )
    except httpx.HTTPStatusError as e:
        if e.response is not None and e.response.status_code == 409:
            flow = _nifi_group_flow(client, parent_id)
            existing = _nifi_find_by_name(flow, "processGroups", name)
            if existing:
                component = _nifi_entity_component(existing)
                return component.get("id") or existing.get("id")
        raise
    component = data.get("component") or data
    return component.get("id") or data.get("id")


def _nifi_create_processor(client: httpx.Client, group_id: str, block: dict, key: str, position: dict) -> dict:
    proc = block[key]
    config = {
        "properties": {k: str(v) for k, v in (proc.get("properties") or {}).items()},
        "autoTerminatedRelationships": proc.get("auto_terminated_relationships") or [],
    }
    if proc.get("scheduling_period"):
        config["schedulingPeriod"] = str(proc["scheduling_period"])
    body = {
        "revision": {"version": 0},
        "component": {
            "type": proc["type"],
            "name": proc["name"],
            "position": position,
            "config": config,
        },
    }
    try:
        return _nifi_request(client, "POST", f"/process-groups/{group_id}/processors", json=body)
    except httpx.HTTPStatusError as e:
        if e.response is not None and e.response.status_code == 409:
            flow = _nifi_group_flow(client, group_id)
            existing = _nifi_find_by_name(flow, "processors", proc["name"])
            if existing:
                return existing
        raise


def _nifi_set_processor_state(client: httpx.Client, processor_entity: dict, state: str) -> dict:
    component = _nifi_entity_component(processor_entity)
    proc_id = component.get("id") or processor_entity.get("id")
    current = _nifi_request(client, "GET", f"/processors/{proc_id}")
    current_component = _nifi_entity_component(current)
    if str(current_component.get("state") or "").upper() == state.upper():
        return current
    rev = current.get("revision") or processor_entity.get("revision") or {"version": 0}
    body = {
        "revision": {"clientId": rev.get("clientId"), "version": rev.get("version", 0)},
        "state": state.upper(),
        "disconnectedNodeAcknowledged": False,
    }
    try:
        return _nifi_request(client, "PUT", f"/processors/{proc_id}/run-status", json=body)
    except httpx.HTTPStatusError as e:
        if e.response is not None and e.response.status_code == 409:
            current = _nifi_request(client, "GET", f"/processors/{proc_id}")
            rev = current.get("revision") or {"version": 0}
            body["revision"] = {"clientId": rev.get("clientId"), "version": rev.get("version", 0)}
            return _nifi_request(client, "PUT", f"/processors/{proc_id}/run-status", json=body)
        raise


def _nifi_ensure_processor(client: httpx.Client, group_id: str, block: dict, key: str, position: dict) -> dict:
    flow = _nifi_group_flow(client, group_id)
    name = block[key]["name"]
    existing = _nifi_find_by_name(flow, "processors", name)
    if not existing:
        return _nifi_create_processor(client, group_id, block, key, position)

    component = _nifi_entity_component(existing)
    proc_id = component["id"]
    was_running = str(component.get("state") or "").upper() == "RUNNING"
    if was_running:
        try:
            existing = _nifi_set_processor_state(client, existing, "STOPPED")
            component = _nifi_entity_component(existing)
        except Exception:  # nosec - updating will fail safely below if NiFi cannot stop it.
            pass

    rev = existing.get("revision") or {"version": 0}
    properties = {k: str(v) for k, v in (block[key].get("properties") or {}).items()}
    existing_properties = (component.get("config") or {}).get("properties") or {}
    # Older generated specs used the display label as a dynamic header. Remove it
    # when updating existing InvokeHTTP processors so NiFi does not send it as an HTTP header.
    if "Send Message Body" in existing_properties and "Send Message Body" not in properties:
        properties["Send Message Body"] = None
    config = {
        "properties": properties,
        "autoTerminatedRelationships": block[key].get("auto_terminated_relationships") or [],
    }
    if block[key].get("scheduling_period"):
        config["schedulingPeriod"] = str(block[key]["scheduling_period"])
    body = {
        "revision": {"clientId": rev.get("clientId"), "version": rev.get("version", 0)},
        "component": {
            "id": proc_id,
            "config": config,
        },
    }

    latest = existing
    try:
        latest = _nifi_request(client, "PUT", f"/processors/{proc_id}", json=body)
    except httpx.HTTPStatusError as e:
        if e.response is not None and e.response.status_code == 409:
            latest = _nifi_request(client, "GET", f"/processors/{proc_id}")
            latest_rev = latest.get("revision") or {"version": 0}
            body["revision"] = {"clientId": latest_rev.get("clientId"), "version": latest_rev.get("version", 0)}
            try:
                latest = _nifi_request(client, "PUT", f"/processors/{proc_id}", json=body)
            except Exception:  # nosec - keep existing flow usable when only revision update failed.
                return latest
        else:
            return existing
    except Exception:
        return existing

    if was_running:
        try:
            return _nifi_set_processor_state(client, latest, "RUNNING")
        except Exception:  # nosec - leave updated processor stopped if restart is blocked.
            return latest
    return latest

def _nifi_ensure_connection(client: httpx.Client, group_id: str, name: str, source_id: str, dest_id: str, relationship: str = "success") -> dict:
    flow = _nifi_group_flow(client, group_id)
    existing = _nifi_find_by_name(flow, "connections", name)
    if existing:
        return existing
    body = {
        "revision": {"version": 0},
        "component": {
            "name": name,
            "source": {"id": source_id, "groupId": group_id, "type": "PROCESSOR"},
            "destination": {"id": dest_id, "groupId": group_id, "type": "PROCESSOR"},
            "selectedRelationships": [relationship],
        },
    }
    try:
        return _nifi_request(client, "POST", f"/process-groups/{group_id}/connections", json=body)
    except httpx.HTTPStatusError as e:
        if e.response is not None and e.response.status_code == 409:
            flow = _nifi_group_flow(client, group_id)
            existing = _nifi_find_by_name(flow, "connections", name)
            if existing:
                return existing
        raise


def _nifi_start_processor(client: httpx.Client, processor_entity: dict) -> dict:
    component = _nifi_entity_component(processor_entity)
    proc_id = component.get("id") or processor_entity.get("id")
    current = _nifi_request(client, "GET", f"/processors/{proc_id}")
    current_component = _nifi_entity_component(current)
    if str(current_component.get("state") or "").upper() == "RUNNING":
        return current
    rev = current.get("revision") or processor_entity.get("revision") or {"version": 0}
    body = {
        "revision": {"clientId": rev.get("clientId"), "version": rev.get("version", 0)},
        "state": "RUNNING",
        "disconnectedNodeAcknowledged": False,
    }
    try:
        return _nifi_request(client, "PUT", f"/processors/{proc_id}/run-status", json=body)
    except httpx.HTTPStatusError as e:
        if e.response is not None and e.response.status_code == 409:
            current = _nifi_request(client, "GET", f"/processors/{proc_id}")
            rev = current.get("revision") or {"version": 0}
            body["revision"] = {"clientId": rev.get("clientId"), "version": rev.get("version", 0)}
            return _nifi_request(client, "PUT", f"/processors/{proc_id}/run-status", json=body)
        raise


def apply_nifi_flow_spec(namespace: str, user_email: str, req: NifiFlowApplyRequest) -> dict:
    if req.spec_id:
        saved = get_nifi_flow_spec(namespace, req.spec_id)
    else:
        connector_id = _nifi_request_connector_id(req)
        saved = sync_nifi_flow_spec(
            namespace,
            user_email,
            NifiFlowSyncRequest(
                connector_id=connector_id,
                include_draft=req.include_draft,
                auto_start=req.auto_start,
            ),
        )
    spec = saved["spec"]
    if req.dry_run:
        return {"applied": False, "dry_run": True, "flow_spec": saved}
    blocks = spec.get("connectors") or []
    if len(blocks) != 1:
        raise ValueError("통합 NiFi flow spec은 적용할 수 없습니다. 커넥터별 Spec을 다시 생성해 주세요.")
    block = blocks[0]

    inst = tenant_resources.nifi_status(namespace)
    if not inst.ready:
        _set_nifi_flow_status(namespace, saved["id"], "nifi_pending", "NiFi 서비스가 ready 상태가 아닙니다.")
        raise ValueError("NiFi 서비스가 ready 상태가 아닙니다.")

    base_url = _nifi_api_base(namespace)
    created: list[dict] = []
    try:
        with httpx.Client(base_url=base_url, timeout=20.0) as client:
            root_id = _nifi_root_group_id(client)
            group_name = spec.get("name") or f"pm-data-collection-{namespace}"
            group_id = _nifi_ensure_process_group(client, root_id, group_name)
            y = 120.0
            src = _nifi_ensure_processor(client, group_id, block, "source_processor", {"x": 120.0, "y": y})
            norm = _nifi_ensure_processor(client, group_id, block, "normalize_processor", {"x": 520.0, "y": y})
            post = _nifi_ensure_processor(client, group_id, block, "pm_ingest_processor", {"x": 920.0, "y": y})
            src_id = _nifi_entity_component(src).get("id") or src.get("id")
            norm_id = _nifi_entity_component(norm).get("id") or norm.get("id")
            post_id = _nifi_entity_component(post).get("id") or post.get("id")
            source_relationships = block.get("source_processor", {}).get("relationships") or ["success"]
            _nifi_ensure_connection(
                client,
                group_id,
                f"{block['connector_name']} source-to-normalize",
                src_id,
                norm_id,
                source_relationships[0],
            )
            _nifi_ensure_connection(client, group_id, f"{block['connector_name']} normalize-to-pm", norm_id, post_id)
            if req.auto_start:
                for entity in (src, norm, post):
                    try:
                        _nifi_start_processor(client, entity)
                    except Exception:  # nosec
                        pass
            created.append({"connector_id": block.get("connector_id"), "processors": [src_id, norm_id, post_id]})
        _set_nifi_flow_status(namespace, saved["id"], "applied", "")
        return {
            "applied": True,
            "status": "applied",
            "flow_spec_id": saved["id"],
            "connector_id": block.get("connector_id"),
            "connector_name": block.get("connector_name"),
            "nifi_api": base_url,
            "process_group": spec.get("name"),
            "connector_count": len(created),
            "processors": created,
        }
    except httpx.HTTPStatusError as e:
        if e.response is not None and e.response.status_code == 409:
            message = "NiFi revision 충돌이 발생했습니다. 이미 생성된 Flow를 새로고침한 뒤 다시 적용해 주세요."
        else:
            message = f"NiFi API 호출 실패: HTTP {e.response.status_code if e.response is not None else '-'}"
        _set_nifi_flow_status(namespace, saved["id"], "apply_error", message)
        raise ValueError(f"NiFi flow 적용 실패: {message}") from e
    except Exception as e:
        _set_nifi_flow_status(namespace, saved["id"], "apply_error", str(e))
        raise ValueError(f"NiFi flow 적용 실패: {e}") from e


def edge_agent_spec(namespace: str, req: EdgeAgentSpecRequest) -> dict:
    connector = get_connector(namespace, req.connector_id) if req.connector_id else {}
    device_id = req.device_id.strip() or connector.get("twin_id") or connector.get("id") or "device-001"
    pm_url = f"{PM_INTERNAL_BASE_URL}/api/devices/{device_id}/data"
    heartbeat_url = f"{PM_INTERNAL_BASE_URL}/api/devices/{device_id}/heartbeat"
    config = {
        "device_id": device_id,
        "connector_id": connector.get("id", ""),
        "twin_id": connector.get("twin_id", ""),
        "connector_type": connector.get("connector_type", "rest"),
        "source": {
            "endpoint_url": connector.get("endpoint_url", ""),
            "port": connector.get("port"),
            "topic_or_path": connector.get("topic", ""),
            "method": connector.get("method", "POST"),
        },
        "prediction_manager": {"data_url": pm_url, "heartbeat_url": heartbeat_url},
        "payload_schema": {
            "timestamp": "ISO-8601 string",
            "type": "sensor",
            "payload": "raw sensor JSON object",
            "meta": {"edge_agent": "string", "sensor_type": "string"},
        },
    }
    python_code = f"""#!/usr/bin/env python3
import json
import time
import urllib.request

DATA_URL = "{pm_url}"
HEARTBEAT_URL = "{heartbeat_url}"
CONNECTOR_ID = "{connector.get('id', '')}"
TWIN_ID = "{connector.get('twin_id', '')}"

def post_json(url, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={{"Content-Type": "application/json"}}, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.read().decode("utf-8")

while True:
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    sample = {{
        "twin_id": TWIN_ID,
        "connector_id": CONNECTOR_ID,
        "timestamp": now,
        "type": "sensor",
        "payload": {{"status": "edge-sample"}},
        "meta": {{"edge_agent": "pm-edge-agent"}},
    }}
    post_json(DATA_URL, sample)
    post_json(HEARTBEAT_URL, {{"twin_id": TWIN_ID, "connector_id": CONNECTOR_ID, "status": "online", "timestamp": now}})
    time.sleep(5)
"""
    curl = (
        f"curl -X POST '{pm_url}' -H 'Content-Type: application/json' "
        f"-d '{{\"twin_id\":\"{connector.get('twin_id', '')}\",\"connector_id\":\"{connector.get('id', '')}\",\"type\":\"sensor\",\"payload\":{{\"status\":\"sample\"}}}}'"
    )
    return {"config": config, "python": python_code, "curl": curl}


def list_records(
    namespace: str,
    twin_id: str = "",
    device_id: str = "",
    connector_id: str = "",
    limit: int = 100,
) -> list[dict]:
    limit = max(1, min(int(limit or 100), 500))
    params: list[Any] = [
        namespace,
        twin_id,
        twin_id,
        device_id,
        device_id,
        connector_id,
        connector_id,
        limit,
    ]
    with _connect() as conn:
        query = """
            SELECT
                r.*,
                COALESCE(t.name, '') AS twin_name,
                COALESCE(c.name, '') AS connector_name
            FROM collection_records r
            LEFT JOIN digital_twins t ON t.namespace = r.namespace AND t.id = r.twin_id
            LEFT JOIN collection_connectors c ON c.namespace = r.namespace AND c.id = r.connector_id
            WHERE r.namespace = ?
              AND (? = '' OR r.twin_id = ?)
              AND (? = '' OR r.device_id = ?)
              AND (? = '' OR r.connector_id = ?)
            ORDER BY r.created_at DESC
            LIMIT ?
            """
        rows = conn.execute(query, params).fetchall()
        return [_row_to_record(row) for row in rows]


def list_records_by_ids(namespace: str, record_ids: list[str]) -> list[dict]:
    ids = []
    seen = set()
    for record_id in record_ids or []:
        value = str(record_id or "").strip()
        if value and value not in seen:
            ids.append(value)
            seen.add(value)
        if len(ids) >= 500:
            break
    if not ids:
        return []
    select_query = """
        SELECT
            r.*,
            COALESCE(t.name, '') AS twin_name,
            COALESCE(c.name, '') AS connector_name
        FROM collection_records r
        LEFT JOIN digital_twins t ON t.namespace = r.namespace AND t.id = r.twin_id
        LEFT JOIN collection_connectors c ON c.namespace = r.namespace AND c.id = r.connector_id
        WHERE r.namespace = ? AND r.id = ANY(?)
        ORDER BY r.created_at DESC
    """
    with _connect() as conn:
        rows = conn.execute(
            select_query,
            [namespace, ids],
        ).fetchall()
    records = [_row_to_record(row) for row in rows]
    found = {record["id"]: record for record in records}
    return [found[record_id] for record_id in ids if record_id in found]


def ingest_device_data(namespace: str, device_id: str, req: DeviceDataIngestRequest, created_by: str = "") -> dict:
    now = _now()
    record_id = _make_id("record", device_id or req.twin_id or "device")
    timestamp = req.timestamp.strip() or now
    connector_id = req.connector_id.strip()
    twin_id = req.twin_id.strip()

    with _connect() as conn:
        connector = _fetch_connector(conn, namespace, connector_id)
        if connector_id and connector is None:
            raise ValueError("커넥터를 찾을 수 없습니다.")
        if connector is not None and not twin_id:
            twin_id = connector["twin_id"]
        if not twin_id and _fetch_twin(conn, namespace, device_id):
            twin_id = device_id
        if twin_id:
            _require_twin(conn, namespace, twin_id)
        conn.execute(
            """
            INSERT INTO collection_records (
                id, namespace, device_id, twin_id, connector_id, dataset_id,
                timestamp, type, file_path, payload_json, meta_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record_id,
                namespace,
                device_id.strip(),
                twin_id,
                connector_id,
                req.dataset_id.strip(),
                timestamp,
                req.type.strip() or "sensor",
                req.file_path.strip(),
                _json_dumps(req.payload),
                _json_dumps({**(req.meta or {}), "created_by": created_by}),
                now,
            ),
        )
        if twin_id:
            conn.execute(
                """
                UPDATE digital_twins
                SET status = 'online', last_seen_at = ?, updated_at = ?
                WHERE namespace = ? AND id = ?
                """,
                (now, now, namespace, twin_id),
            )
        if connector_id:
            conn.execute(
                """
                UPDATE collection_connectors
                SET status = 'ready', last_message_at = ?, updated_at = ?
                WHERE namespace = ? AND id = ?
                """,
                (now, now, namespace, connector_id),
            )
        conn.commit()

    record = get_record(namespace, record_id)
    try:
        queue_rest_output_delivery(record)
    except Exception:  # nosec - outbound delivery must not roll back a collected record
        pass
    return record


def _parse_raw_payload(raw_body: bytes, content_type: str) -> Any:
    text = raw_body.decode("utf-8-sig", errors="replace")
    if "json" in (content_type or "").lower() or text.strip().startswith(("{", "[")):
        try:
            return json.loads(text)
        except Exception:  # nosec
            pass
    return text


def ingest_raw_device_data(
    namespace: str,
    device_id: str,
    raw_body: bytes,
    headers: dict[str, str] | None = None,
    content_type: str = "",
    created_by: str = "",
) -> dict:
    headers = {str(k).lower(): str(v) for k, v in (headers or {}).items()}
    parsed = _parse_raw_payload(raw_body, content_type)
    if isinstance(parsed, dict) and any(key in parsed for key in ("payload", "twin_id", "connector_id", "timestamp")):
        req = DeviceDataIngestRequest(**parsed)
        if not req.payload:
            req.payload = {k: v for k, v in parsed.items() if k not in {"twin_id", "connector_id", "dataset_id", "timestamp", "type", "file_path", "meta"}}
        return ingest_device_data(namespace, device_id, req, created_by)

    req = DeviceDataIngestRequest(
        twin_id=headers.get("x-pm-twin-id", ""),
        connector_id=headers.get("x-pm-connector-id", ""),
        dataset_id=headers.get("x-pm-dataset-id", ""),
        timestamp=headers.get("x-pm-timestamp", ""),
        type=headers.get("x-pm-record-type", "sensor"),
        file_path=headers.get("x-pm-file-path", ""),
        payload=parsed if isinstance(parsed, dict) else {"raw": parsed},
        meta={
            "content_type": content_type,
            "ingest_mode": "raw",
            "headers": {k: v for k, v in headers.items() if k.startswith("x-pm-") or k.startswith("x-nifi-")},
        },
    )
    return ingest_device_data(namespace, device_id, req, created_by)


def heartbeat_device(namespace: str, device_id: str, req: DeviceHeartbeatRequest, created_by: str = "") -> dict:
    now = req.timestamp.strip() or _now()
    status = req.status if req.status in TWIN_STATUSES else "online"
    twin_id = req.twin_id.strip()
    connector_id = req.connector_id.strip()
    with _connect() as conn:
        if not twin_id and _fetch_twin(conn, namespace, device_id):
            twin_id = device_id
        if not twin_id:
            existing = conn.execute(
                "SELECT id FROM digital_twins WHERE namespace = ? AND name = ?",
                (namespace, device_id.strip()),
            ).fetchone()
            if existing:
                twin_id = existing["id"]
            else:
                twin_id = _make_id("twin", device_id or "device")
                conn.execute(
                    """
                    INSERT INTO digital_twins (
                        id, namespace, name, description, status, last_seen_at,
                        created_by, created_at, updated_at, meta_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        twin_id,
                        namespace,
                        device_id.strip() or twin_id,
                        "Edge heartbeat auto-registered",
                        status,
                        now,
                        created_by,
                        now,
                        now,
                        _json_dumps(req.meta),
                    ),
                )
        else:
            _require_twin(conn, namespace, twin_id)
            conn.execute(
                """
                UPDATE digital_twins
                SET status = ?, last_seen_at = ?, updated_at = ?, meta_json = ?
                WHERE namespace = ? AND id = ?
                """,
                (status, now, now, _json_dumps(req.meta), namespace, twin_id),
            )
        if connector_id:
            if _fetch_connector(conn, namespace, connector_id) is None:
                raise ValueError("커넥터를 찾을 수 없습니다.")
            conn.execute(
                """
                UPDATE collection_connectors
                SET status = ?, last_checked_at = ?, last_message_at = ?, updated_at = ?
                WHERE namespace = ? AND id = ?
                """,
                ("ready" if status == "online" else status, now, now, now, namespace, connector_id),
            )
        conn.commit()
    return {"device_id": device_id, "twin": get_twin(namespace, twin_id), "connector_id": connector_id, "status": status}


def refresh_liveness(namespace: str, offline_after_seconds: int = DC_OFFLINE_AFTER_SECONDS) -> dict:
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=max(1, offline_after_seconds))).isoformat()
    with _connect() as conn:
        twin_rows = conn.execute(
            """
            SELECT id FROM digital_twins
            WHERE namespace = ? AND status = 'online' AND last_seen_at != '' AND last_seen_at < ?
            """,
            (namespace, cutoff),
        ).fetchall()
        connector_rows = conn.execute(
            """
            SELECT id FROM collection_connectors
            WHERE namespace = ? AND status = 'ready' AND last_message_at != '' AND last_message_at < ?
            """,
            (namespace, cutoff),
        ).fetchall()
        conn.execute(
            """
            UPDATE digital_twins
            SET status = 'offline', updated_at = ?
            WHERE namespace = ? AND status = 'online' AND last_seen_at != '' AND last_seen_at < ?
            """,
            (_now(), namespace, cutoff),
        )
        conn.execute(
            """
            UPDATE collection_connectors
            SET status = 'offline', updated_at = ?
            WHERE namespace = ? AND status = 'ready' AND last_message_at != '' AND last_message_at < ?
            """,
            (_now(), namespace, cutoff),
        )
        conn.commit()
    return {"offline_after_seconds": offline_after_seconds, "twins_offline": len(twin_rows), "connectors_offline": len(connector_rows)}


def get_record(namespace: str, record_id: str) -> dict:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT
                r.*,
                COALESCE(t.name, '') AS twin_name,
                COALESCE(c.name, '') AS connector_name
            FROM collection_records r
            LEFT JOIN digital_twins t ON t.namespace = r.namespace AND t.id = r.twin_id
            LEFT JOIN collection_connectors c ON c.namespace = r.namespace AND c.id = r.connector_id
            WHERE r.namespace = ? AND r.id = ?
            """,
            (namespace, record_id),
        ).fetchone()
        if row is None:
            raise ValueError("수집 레코드를 찾을 수 없습니다.")
        return _row_to_record(row)


def delete_record(namespace: str, record_id: str) -> dict:
    with _connect() as conn:
        row = conn.execute(
            "SELECT id FROM collection_records WHERE namespace = ? AND id = ?",
            (namespace, record_id),
        ).fetchone()
        if row is None:
            raise ValueError("수집 레코드를 찾을 수 없습니다.")
        conn.execute("DELETE FROM collection_records WHERE namespace = ? AND id = ?", (namespace, record_id))
        conn.commit()
    return {"deleted": True, "id": record_id}


def overview(namespace: str) -> dict:
    liveness = refresh_liveness(namespace)
    twins = list_twins(namespace)
    connectors = list_connectors(namespace)
    with _connect() as conn:
        record_count = conn.execute(
            "SELECT COUNT(*) AS count FROM collection_records WHERE namespace = ?",
            (namespace,),
        ).fetchone()["count"]
        last_record = conn.execute(
            "SELECT MAX(created_at) AS last_record_at FROM collection_records WHERE namespace = ?",
            (namespace,),
        ).fetchone()["last_record_at"]

    type_counts: dict[str, int] = {}
    for connector in connectors:
        type_counts[connector["connector_type"]] = type_counts.get(connector["connector_type"], 0) + 1

    return {
        "namespace": namespace,
        "summary": {
            "twin_count": len(twins),
            "online_twin_count": sum(1 for twin in twins if twin["status"] == "online"),
            "connector_count": len(connectors),
            "ready_connector_count": sum(1 for connector in connectors if connector["status"] == "ready"),
            "record_count": record_count,
            "last_record_at": last_record or "",
            "connector_type_counts": type_counts,
            "liveness": liveness,
        },
        "twins": twins,
        "connectors": connectors,
    }
