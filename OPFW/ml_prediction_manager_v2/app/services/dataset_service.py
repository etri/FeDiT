from __future__ import annotations

import csv
import io
import json
import os
import re
import secrets
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote, urlparse

from fastapi.responses import FileResponse, RedirectResponse
import httpx

from app.services import tenant_resources
from app.services.postgres_db import INTEGRITY_ERROR as DB_INTEGRITY_ERROR, connect as _connect

try:
    from PIL import Image, ImageOps, UnidentifiedImageError
except Exception:  # pragma: no cover - handled at runtime with a clear API error.
    Image = None
    ImageOps = None
    UnidentifiedImageError = Exception

DATASET_STORE_ROOT = Path(os.environ.get("DATASET_STORE_ROOT", "/datasets"))
DATASET_INTERNAL_BASE_URL = os.environ.get(
    "DATASET_INTERNAL_BASE_URL",
    "http://prediction-manager.kubeflow.svc.cluster.local",
).rstrip("/")
DATASET_ALLOWED_SOURCE_ROOTS = os.environ.get("DATASET_ALLOWED_SOURCE_ROOTS", "")
MAX_DATASET_UPLOAD_BYTES = int(os.environ.get("DATASET_UPLOAD_MAX_BYTES", str(200 * 1024 * 1024)))
SUPPORTED_UPLOAD_EXTS = {".csv", ".json", ".jsonl", ".parquet", ".jpg", ".jpeg", ".png", ".zip"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png"}
VERSION_STATUSES = {"registered", "ready", "published", "deprecated", "archived"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _json_loads(value: str | None, default: Any) -> Any:
    if not value:
        return default
    try:
        return json.loads(value)
    except Exception:
        return default


def _json_dumps(value: Any) -> str:
    return json.dumps(value or {}, ensure_ascii=False, sort_keys=True)


def _safe_name(value: str, fallback: str = "dataset") -> str:
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", str(value or "").strip())
    name = re.sub(r"^[._-]+|[._-]+$", "", name)
    return (name or fallback)[:80]


def _version_label(version: int | str) -> str:
    value = str(version)
    return value if value.startswith("v") else f"v{value}"


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS datasets (
                id TEXT PRIMARY KEY,
                namespace TEXT NOT NULL,
                name TEXT NOT NULL,
                safe_name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                data_type TEXT NOT NULL DEFAULT 'csv',
                task TEXT NOT NULL DEFAULT 'unknown',
                target_column TEXT NOT NULL DEFAULT '',
                created_by TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(namespace, safe_name)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS dataset_versions (
                dataset_id TEXT NOT NULL,
                namespace TEXT NOT NULL,
                version INTEGER NOT NULL,
                source_kind TEXT NOT NULL,
                source_uri TEXT NOT NULL DEFAULT '',
                file_name TEXT NOT NULL DEFAULT '',
                file_path TEXT NOT NULL DEFAULT '',
                data_type TEXT NOT NULL DEFAULT 'csv',
                size_bytes INTEGER NOT NULL DEFAULT 0,
                row_count INTEGER,
                status TEXT NOT NULL DEFAULT 'registered',
                pipeline_ready INTEGER NOT NULL DEFAULT 0,
                download_token TEXT NOT NULL,
                metadata_json TEXT NOT NULL DEFAULT '{}',
                created_by TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                PRIMARY KEY(dataset_id, version),
                FOREIGN KEY(dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS dataset_pipeline_runs (
                id TEXT PRIMARY KEY,
                dataset_id TEXT NOT NULL,
                namespace TEXT NOT NULL,
                dataset_version INTEGER NOT NULL,
                run_id TEXT NOT NULL,
                run_name TEXT NOT NULL DEFAULT '',
                state TEXT NOT NULL DEFAULT '',
                experiment_id TEXT NOT NULL DEFAULT '',
                experiment_name TEXT NOT NULL DEFAULT '',
                pipeline_id TEXT NOT NULL DEFAULT '',
                pipeline_name TEXT NOT NULL DEFAULT '',
                pipeline_version_id TEXT NOT NULL DEFAULT '',
                pipeline_version_name TEXT NOT NULL DEFAULT '',
                service_account TEXT NOT NULL DEFAULT '',
                ui_url TEXT NOT NULL DEFAULT '',
                params_json TEXT NOT NULL DEFAULT '{}',
                kfp_run_json TEXT NOT NULL DEFAULT '{}',
                created_by TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(namespace, run_id),
                FOREIGN KEY(dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
            )
            """
        )
        conn.commit()


init_db()


def _dataset_root(namespace: str, safe_name: str) -> Path:
    return DATASET_STORE_ROOT / _safe_name(namespace, "namespace") / safe_name


def _version_root(namespace: str, safe_name: str, version: int) -> Path:
    return _dataset_root(namespace, safe_name) / _version_label(version)


def _row_to_dataset(row: dict) -> dict:
    return {
        "id": row["id"],
        "namespace": row["namespace"],
        "name": row["name"],
        "safe_name": row["safe_name"],
        "description": row["description"],
        "data_type": row["data_type"],
        "task": row["task"],
        "target_column": row["target_column"],
        "created_by": row["created_by"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _row_to_version(row: dict, include_token: bool = False) -> dict:
    metadata = _json_loads(row["metadata_json"], {})
    out = {
        "dataset_id": row["dataset_id"],
        "namespace": row["namespace"],
        "version": row["version"],
        "version_label": _version_label(row["version"]),
        "source_kind": row["source_kind"],
        "source_uri": row["source_uri"],
        "file_name": row["file_name"],
        "file_path": row["file_path"],
        "data_type": row["data_type"],
        "size_bytes": row["size_bytes"],
        "row_count": row["row_count"],
        "status": row["status"],
        "pipeline_ready": bool(row["pipeline_ready"]),
        "metadata": metadata,
        "created_by": row["created_by"],
        "created_at": row["created_at"],
    }
    if include_token:
        out["download_token"] = row["download_token"]
    return out


def _row_to_pipeline_run(row: dict) -> dict:
    keys = set(row.keys())
    return {
        "id": row["id"],
        "dataset_id": row["dataset_id"],
        "dataset_name": row["dataset_name"] if "dataset_name" in keys else "",
        "dataset_safe_name": row["dataset_safe_name"] if "dataset_safe_name" in keys else "",
        "dataset_data_type": row["dataset_data_type"] if "dataset_data_type" in keys else "",
        "dataset_task": row["dataset_task"] if "dataset_task" in keys else "",
        "namespace": row["namespace"],
        "dataset_version": row["dataset_version"],
        "run_id": row["run_id"],
        "run_name": row["run_name"],
        "state": row["state"],
        "experiment_id": row["experiment_id"],
        "experiment_name": row["experiment_name"],
        "pipeline_id": row["pipeline_id"],
        "pipeline_name": row["pipeline_name"],
        "pipeline_version_id": row["pipeline_version_id"],
        "pipeline_version_name": row["pipeline_version_name"],
        "service_account": row["service_account"],
        "ui_url": row["ui_url"],
        "params": _json_loads(row["params_json"], {}),
        "kfp_run": _json_loads(row["kfp_run_json"], {}),
        "created_by": row["created_by"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _write_metadata_file(dataset: dict, version: dict, path: Path) -> None:
    payload = {"dataset": dataset, "version": {k: v for k, v in version.items() if k != "download_token"}}
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(_json_dumps(payload), encoding="utf-8")


def _zip_image_count(path: Path) -> int:
    try:
        with zipfile.ZipFile(path) as zf:
            return sum(1 for info in zf.infolist() if not info.is_dir() and Path(info.filename).suffix.lower() in IMAGE_EXTS)
    except Exception:
        return 0


def _parquet_summary(path: Path) -> dict:
    try:
        import pyarrow.parquet as pq

        parquet_file = pq.ParquetFile(path)
        metadata = parquet_file.metadata
        schema = parquet_file.schema_arrow
        columns = list(schema.names or [])
        return {
            "row_count": int(metadata.num_rows) if metadata else None,
            "column_count": len(columns),
            "columns_sample": columns[:20],
        }
    except Exception:
        return {}


def _count_rows_for_file(path: Path, data_type: str) -> int | None:
    try:
        if data_type == "csv":
            with path.open("r", encoding="utf-8-sig", newline="") as f:
                return max(0, sum(1 for _ in csv.DictReader(f)))
        if data_type == "jsonl":
            with path.open("r", encoding="utf-8") as f:
                return sum(1 for line in f if line.strip())
        if data_type == "json":
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, list):
                return len(data)
            if isinstance(data, dict) and isinstance(data.get("data"), list):
                return len(data["data"])
        if data_type == "parquet":
            summary = _parquet_summary(path)
            rows = summary.get("row_count")
            return int(rows) if rows is not None else None
        if data_type == "image":
            ext = path.suffix.lower()
            if ext == ".zip":
                return _zip_image_count(path)
            if ext in IMAGE_EXTS:
                return 1
    except Exception:
        return None
    return None


def _infer_data_type(file_name: str, fallback: str) -> str:
    ext = Path(file_name or "").suffix.lower()
    if ext == ".csv":
        return "csv"
    if ext == ".json":
        return "json"
    if ext == ".jsonl":
        return "jsonl"
    if ext == ".parquet":
        return "parquet"
    if ext in IMAGE_EXTS:
        return "image"
    if ext == ".zip" and fallback == "image":
        return "image"
    return fallback or "csv"



def _allowed_source_roots() -> list[Path]:
    roots = [DATASET_STORE_ROOT]
    for raw in DATASET_ALLOWED_SOURCE_ROOTS.split(","):
        raw = raw.strip()
        if raw:
            roots.append(Path(raw))

    out = []
    for root in roots:
        try:
            out.append(root.resolve(strict=False))
        except OSError:
            continue
    return out


def _is_allowed_source_path(path: Path) -> bool:
    resolved = path.resolve(strict=False)
    for root in _allowed_source_roots():
        if resolved == root or root in resolved.parents:
            return True
    return False


def _local_source_path(source_uri: str) -> Path | None:
    text = str(source_uri or "").strip()
    if not text or text.startswith(("http://", "https://")):
        return None

    parsed = urlparse(text)
    if parsed.scheme and parsed.scheme != "file":
        return None

    raw_path = unquote(parsed.path) if parsed.scheme == "file" else text
    path = Path(raw_path)
    if not path.is_absolute():
        return None

    resolved = path.resolve(strict=False)
    if not _is_allowed_source_path(resolved):
        raise ValueError("로컬 source_uri는 허용된 데이터 저장소 하위 경로만 등록할 수 있습니다")
    if resolved.exists() and not resolved.is_file():
        raise ValueError("로컬 source_uri는 파일 경로여야 합니다")
    return resolved

def _image_metadata(path: Path) -> dict:
    if Image is None:
        return {}
    try:
        with Image.open(path) as img:
            return {"width": img.width, "height": img.height, "format": img.format, "mode": img.mode}
    except Exception:
        return {}


def _uploaded_file_summary(path: Path, data_type: str) -> dict:
    if data_type == "parquet":
        summary = _parquet_summary(path)
        return {"parquet": summary} if summary else {}
    if data_type != "image":
        return {}
    if path.suffix.lower() == ".zip":
        return {"image_count": _zip_image_count(path), "archive": True}
    if path.suffix.lower() in IMAGE_EXTS:
        meta = _image_metadata(path)
        meta.update({"image_count": 1, "archive": False})
        return meta
    return {}


def list_datasets(namespace: str) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM datasets WHERE namespace=? ORDER BY updated_at DESC, name ASC",
            (namespace,),
        ).fetchall()
        out = []
        for row in rows:
            ds = _row_to_dataset(row)
            version_rows = conn.execute(
                "SELECT * FROM dataset_versions WHERE dataset_id=? ORDER BY version DESC",
                (ds["id"],),
            ).fetchall()
            versions = [_row_to_version(v) for v in version_rows]
            ds["latest_version"] = versions[0] if versions else None
            ds["version_count"] = len(versions)
            out.append(ds)
        return out


def create_dataset(namespace: str, user_email: str, payload) -> dict:
    safe = _safe_name(payload.name)
    dataset_id = f"ds-{secrets.token_hex(5)}"
    now = _now()
    try:
        with _connect() as conn:
            conn.execute(
                """
                INSERT INTO datasets(id, namespace, name, safe_name, description, data_type, task, target_column, created_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    dataset_id,
                    namespace,
                    payload.name.strip(),
                    safe,
                    payload.description or "",
                    payload.data_type,
                    payload.task,
                    payload.target_column or "",
                    user_email,
                    now,
                    now,
                ),
            )
            conn.commit()
    except DB_INTEGRITY_ERROR as e:
        raise ValueError(f"이미 같은 이름의 데이터셋이 있습니다: {payload.name}") from e
    _dataset_root(namespace, safe).mkdir(parents=True, exist_ok=True)
    return get_dataset(namespace, dataset_id)


def update_dataset_training_config(
    namespace: str,
    dataset_id: str,
    *,
    task: str | None = None,
    target_column: str | None = None,
) -> dict:
    updates = []
    params: list[Any] = []
    if task is not None:
        if task not in {"regression", "classification", "labeling", "unknown"}:
            raise ValueError(f"지원하지 않는 학습 유형입니다: {task}")
        updates.append("task=?")
        params.append(task)
    if target_column is not None:
        updates.append("target_column=?")
        params.append(str(target_column).strip())
    if not updates:
        return get_dataset(namespace, dataset_id)
    updates.append("updated_at=?")
    params.append(_now())
    params.extend([dataset_id, namespace])
    with _connect() as conn:
        changed = conn.execute(
            f"UPDATE datasets SET {', '.join(updates)} WHERE id=? AND namespace=?",
            tuple(params),
        ).rowcount
        conn.commit()
    if not changed:
        raise ValueError("dataset not found")
    return get_dataset(namespace, dataset_id)


def get_dataset(namespace: str, dataset_id: str) -> dict:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM datasets WHERE id=? AND namespace=?",
            (dataset_id, namespace),
        ).fetchone()
        if not row:
            raise ValueError("dataset not found")
        ds = _row_to_dataset(row)
        versions = conn.execute(
            "SELECT * FROM dataset_versions WHERE dataset_id=? ORDER BY version DESC",
            (dataset_id,),
        ).fetchall()
        ds["versions"] = [_row_to_version(v, include_token=True) for v in versions]
        run_rows = conn.execute(
            "SELECT * FROM dataset_pipeline_runs WHERE dataset_id=? AND namespace=? ORDER BY created_at DESC",
            (dataset_id, namespace),
        ).fetchall()
        ds["pipeline_runs"] = [_row_to_pipeline_run(r) for r in run_rows]
        return ds


def delete_dataset(namespace: str, dataset_id: str, user_email: str = "") -> dict:
    ds = get_dataset(namespace, dataset_id)
    root = _dataset_root(namespace, ds["safe_name"])
    version_count = len(ds.get("versions", []))
    with _connect() as conn:
        conn.execute(
            "DELETE FROM dataset_pipeline_runs WHERE dataset_id=? AND namespace=?",
            (dataset_id, namespace),
        )
        conn.execute(
            "DELETE FROM dataset_versions WHERE dataset_id=? AND namespace=?",
            (dataset_id, namespace),
        )
        deleted = conn.execute(
            "DELETE FROM datasets WHERE id=? AND namespace=?",
            (dataset_id, namespace),
        ).rowcount
        conn.commit()
    if not deleted:
        raise ValueError("dataset not found")
    if root.exists():
        resolved_root = root.resolve()
        resolved_store = DATASET_STORE_ROOT.resolve()
        if resolved_root == resolved_store or resolved_store not in resolved_root.parents:
            raise ValueError("dataset storage path is not safe to delete")
        shutil.rmtree(resolved_root)
    return {
        "deleted": True,
        "dataset_id": dataset_id,
        "name": ds["name"],
        "namespace": namespace,
        "version_count": version_count,
        "deleted_by": user_email,
    }


def delete_version(namespace: str, dataset_id: str, version: int, user_email: str = "") -> dict:
    ds = get_dataset(namespace, dataset_id)
    version_root = _version_root(namespace, ds["safe_name"], version)
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM dataset_versions WHERE dataset_id=? AND namespace=? AND version=?",
            (dataset_id, namespace, version),
        ).fetchone()
        if not row:
            raise ValueError("dataset version not found")
        ver = _row_to_version(row, include_token=False)
        conn.execute(
            "DELETE FROM dataset_pipeline_runs WHERE dataset_id=? AND namespace=? AND dataset_version=?",
            (dataset_id, namespace, version),
        )
        deleted = conn.execute(
            "DELETE FROM dataset_versions WHERE dataset_id=? AND namespace=? AND version=?",
            (dataset_id, namespace, version),
        ).rowcount
        conn.execute("UPDATE datasets SET updated_at=? WHERE id=? AND namespace=?", (_now(), dataset_id, namespace))
        conn.commit()
    if not deleted:
        raise ValueError("dataset version not found")
    if version_root.exists():
        resolved_root = version_root.resolve()
        resolved_store = DATASET_STORE_ROOT.resolve()
        if resolved_root == resolved_store or resolved_store not in resolved_root.parents:
            raise ValueError("dataset version storage path is not safe to delete")
        shutil.rmtree(resolved_root)
    return {
        "deleted": True,
        "dataset_id": dataset_id,
        "version": version,
        "version_label": _version_label(version),
        "file_name": ver.get("file_name") or "",
        "namespace": namespace,
        "deleted_by": user_email,
    }


def _next_version(conn: Any, dataset_id: str) -> int:
    row = conn.execute(
        "SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM dataset_versions WHERE dataset_id=?",
        (dataset_id,),
    ).fetchone()
    return int(row["next_version"])


def _insert_version(
    conn: Any,
    dataset: dict,
    namespace: str,
    user_email: str,
    *,
    source_kind: str,
    source_uri: str,
    file_name: str,
    file_path: str,
    data_type: str,
    size_bytes: int,
    row_count: int | None,
    pipeline_ready: bool,
    metadata: dict,
    status: str = "registered",
) -> dict:
    version = _next_version(conn, dataset["id"])
    now = _now()
    token = secrets.token_urlsafe(24)
    metadata = dict(metadata or {})
    metadata.setdefault("target_column", dataset.get("target_column", ""))
    lineage = metadata.setdefault("lineage", {})
    if isinstance(lineage, dict):
        lineage.setdefault("parent_versions", [])
        lineage.setdefault("operation", source_kind or "raw")
        lineage.setdefault("source_kind", source_kind or "")
        if source_uri:
            lineage.setdefault("source_uri", source_uri)
        elif file_name:
            lineage.setdefault("source_file", file_name)
    if status not in VERSION_STATUSES:
        raise ValueError(f"지원하지 않는 version status입니다: {status}")
    conn.execute(
        """
        INSERT INTO dataset_versions(dataset_id, namespace, version, source_kind, source_uri, file_name, file_path, data_type, size_bytes, row_count, status, pipeline_ready, download_token, metadata_json, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            dataset["id"],
            namespace,
            version,
            source_kind,
            source_uri or "",
            file_name or "",
            file_path or "",
            data_type,
            int(size_bytes or 0),
            row_count,
            status,
            1 if pipeline_ready else 0,
            token,
            _json_dumps(metadata),
            user_email,
            now,
        ),
    )
    conn.execute("UPDATE datasets SET updated_at=? WHERE id=?", (now, dataset["id"]))
    row = conn.execute(
        "SELECT * FROM dataset_versions WHERE dataset_id=? AND version=?",
        (dataset["id"], version),
    ).fetchone()
    return _row_to_version(row, include_token=True)


def create_version_from_bytes(
    namespace: str,
    dataset_id: str,
    user_email: str,
    *,
    file_name: str,
    content: bytes,
    source_kind: str = "raw",
    pipeline_ready: bool = False,
    notes: str = "",
    metadata: dict | None = None,
) -> dict:
    if len(content) > MAX_DATASET_UPLOAD_BYTES:
        raise ValueError(f"업로드 파일이 너무 큽니다. 최대 {MAX_DATASET_UPLOAD_BYTES} bytes")
    ext = Path(file_name or "").suffix.lower()
    if ext not in SUPPORTED_UPLOAD_EXTS:
        raise ValueError("업로드는 CSV/JSON/JSONL/Parquet/JPEG/PNG/ZIP만 지원합니다")
    ds = get_dataset(namespace, dataset_id)
    if ext == ".zip" and ds.get("data_type") != "image":
        raise ValueError("ZIP 업로드는 image 데이터셋에서만 지원합니다")
    data_type = _infer_data_type(file_name, ds["data_type"])
    if data_type == "image" and ext not in IMAGE_EXTS | {".zip"}:
        raise ValueError("image 데이터셋 업로드는 JPEG/PNG/ZIP만 지원합니다")
    with _connect() as conn:
        version = _next_version(conn, dataset_id)
        root = _version_root(namespace, ds["safe_name"], version)
        staging = root.with_name(root.name + f".tmp-{secrets.token_hex(4)}")
        if staging.exists():
            shutil.rmtree(staging)
        staging.mkdir(parents=True, exist_ok=False)
        safe_file = _safe_name(file_name, f"data{ext or '.csv'}")
        data_path = staging / safe_file
        data_path.write_bytes(content)
        row_count = _count_rows_for_file(data_path, data_type)
        meta = dict(metadata or {})
        meta.update({"notes": notes or "", "storage": "pvc", "original_file_name": file_name})
        meta.update(_uploaded_file_summary(data_path, data_type))
        if root.exists():
            shutil.rmtree(root)
        staging.rename(root)
        final_path = root / safe_file
        version_info = _insert_version(
            conn,
            ds,
            namespace,
            user_email,
            source_kind=source_kind,
            source_uri="",
            file_name=safe_file,
            file_path=str(final_path),
            data_type=data_type,
            size_bytes=final_path.stat().st_size,
            row_count=row_count,
            pipeline_ready=pipeline_ready,
            metadata=meta,
        )
        _write_metadata_file(ds, version_info, root / "metadata.json")
        conn.commit()
        return version_info


def create_version_from_uri(namespace: str, dataset_id: str, user_email: str, payload) -> dict:
    ds = get_dataset(namespace, dataset_id)
    file_name = payload.file_name or Path(payload.source_uri.rstrip("/")).name or "external-dataset"
    data_type = _infer_data_type(file_name, ds["data_type"])
    local_path = _local_source_path(payload.source_uri)
    size_bytes = local_path.stat().st_size if local_path and local_path.exists() else 0
    row_count = _count_rows_for_file(local_path, data_type) if local_path and local_path.exists() else None
    metadata = dict(payload.metadata or {})
    metadata.update({
        "notes": payload.notes or "",
        "storage": "local_path" if local_path else "external",
        "original_source_uri": payload.source_uri,
    })
    if local_path:
        metadata["local_path"] = str(local_path)
        metadata["local_path_exists"] = local_path.exists()
    with _connect() as conn:
        version_info = _insert_version(
            conn,
            ds,
            namespace,
            user_email,
            source_kind=payload.source_kind,
            source_uri=payload.source_uri,
            file_name=file_name,
            file_path=str(local_path) if local_path else "",
            data_type=data_type,
            size_bytes=size_bytes,
            row_count=row_count,
            pipeline_ready=payload.pipeline_ready,
            metadata=metadata,
        )
        root = _version_root(namespace, ds["safe_name"], int(version_info["version"]))
        _write_metadata_file(ds, version_info, root / "metadata.json")
        conn.commit()
        return version_info


def _get_dataset_and_version_by_token(dataset_id: str, version: int, token: str) -> tuple[dict, dict]:
    with _connect() as conn:
        ds_row = conn.execute("SELECT * FROM datasets WHERE id=?", (dataset_id,)).fetchone()
        ver_row = conn.execute(
            "SELECT * FROM dataset_versions WHERE dataset_id=? AND version=?",
            (dataset_id, int(version)),
        ).fetchone()
        if not ds_row or not ver_row:
            raise ValueError("dataset version not found")
        if not token or token != ver_row["download_token"]:
            raise PermissionError("invalid dataset download token")
        return _row_to_dataset(ds_row), _row_to_version(ver_row, include_token=True)


def download_response(dataset_id: str, version: int, token: str):
    _ds, ver = _get_dataset_and_version_by_token(dataset_id, version, token)
    file_path = ver.get("file_path") or ""
    if file_path and Path(file_path).exists():
        return FileResponse(path=file_path, filename=ver.get("file_name") or Path(file_path).name)
    source_uri = ver.get("source_uri") or ""
    if source_uri.startswith(("http://", "https://")):
        return RedirectResponse(source_uri, status_code=307)
    local_path = _local_source_path(source_uri)
    if local_path and local_path.exists():
        return FileResponse(path=str(local_path), filename=ver.get("file_name") or local_path.name)
    raise FileNotFoundError("dataset file is not available for download")


def _clean_column(value: str) -> str:
    cleaned = re.sub(r"[^0-9A-Za-z가-힣_]+", "_", str(value or "").strip())
    cleaned = re.sub(r"_+", "_", cleaned).strip("_").lower()
    return cleaned or "column"


def _unique_columns(columns: list[str]) -> list[str]:
    seen: dict[str, int] = {}
    out = []
    for col in columns:
        base = _clean_column(col)
        count = seen.get(base, 0)
        seen[base] = count + 1
        out.append(base if count == 0 else f"{base}_{count + 1}")
    return out


def _load_csv_version(ver: dict) -> tuple[list[str], list[dict[str, str]]]:
    path = ver.get("file_path") or ""
    if not path or not Path(path).exists():
        raise ValueError(f"CSV file not found for version v{ver.get('version')}")
    csv_path = Path(path)
    extra_fields_key = "__pm_extra_fields__"
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f, restkey=extra_fields_key, restval="")
        fieldnames = list(reader.fieldnames or [])
        if not fieldnames:
            raise ValueError("CSV 형식 오류: 헤더 행이 없습니다")
        blank_headers = [str(idx + 1) for idx, name in enumerate(fieldnames) if not str(name or "").strip()]
        if blank_headers:
            raise ValueError(f"CSV 형식 오류: 빈 컬럼명이 있습니다. 헤더 {', '.join(blank_headers)}번째 컬럼을 확인하세요")
        rows: list[dict[str, str]] = []
        for row_number, row in enumerate(reader, start=2):
            extra_values = row.pop(extra_fields_key, None)
            if extra_values:
                raise ValueError(
                    f"CSV 형식 오류: {csv_path.name} {row_number}행에 헤더보다 많은 값이 있습니다. "
                    "쉼표 구분 또는 따옴표 닫힘을 확인하세요"
                )
            rows.append(dict(row))
        return fieldnames, rows


def _flatten_payload_value(value: Any) -> str:
    if isinstance(value, dict) and "value" in value:
        value = value.get("value")
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, sort_keys=True)
    return str(value)


def _expand_collection_payload_rows(
    columns: list[str],
    rows: list[dict[str, str]],
) -> tuple[list[str], list[dict[str, str]], bool]:
    if "payload_json" not in columns:
        return columns, rows, False

    payload_columns: list[str] = []
    decoded_payloads: list[dict[str, Any]] = []
    for row in rows:
        raw = row.get("payload_json") or ""
        try:
            payload = json.loads(raw) if raw else {}
        except (TypeError, json.JSONDecodeError):
            payload = {}
        if not isinstance(payload, dict):
            payload = {}
        decoded_payloads.append(payload)
        for key in payload:
            name = str(key or "").strip()
            if not name or name in {"id", "type", "@context"} or name in payload_columns:
                continue
            payload_columns.append(name)

    base_columns = [name for name in ("timestamp", "device_id", "twin_id") if name in columns]
    expanded_columns = [*base_columns, *payload_columns]
    expanded_rows = []
    for row, payload in zip(rows, decoded_payloads):
        expanded = {name: row.get(name, "") for name in base_columns}
        for name in payload_columns:
            expanded[name] = _flatten_payload_value(payload.get(name))
        expanded_rows.append(expanded)
    return expanded_columns, expanded_rows, True


def _drop_duplicate_rows(
    rows: list[dict[str, str]],
    columns: list[str],
) -> tuple[list[dict[str, str]], int]:
    seen: set[tuple[str, ...]] = set()
    unique_rows = []
    for row in rows:
        fingerprint = tuple(str(row.get(column, "")) for column in columns)
        if fingerprint in seen:
            continue
        seen.add(fingerprint)
        unique_rows.append(row)
    return unique_rows, len(rows) - len(unique_rows)


def _percentile(sorted_values: list[float], fraction: float) -> float:
    if not sorted_values:
        return 0.0
    position = (len(sorted_values) - 1) * fraction
    lower = int(position)
    upper = min(lower + 1, len(sorted_values) - 1)
    weight = position - lower
    return sorted_values[lower] * (1 - weight) + sorted_values[upper] * weight


def _remove_outlier_rows(
    rows: list[dict[str, str]],
    numeric_columns: set[str],
) -> tuple[list[dict[str, str]], int]:
    bounds: dict[str, tuple[float, float]] = {}
    for column in numeric_columns:
        values = sorted(
            float(row[column])
            for row in rows
            if row.get(column) not in (None, "") and _is_float(row.get(column))
        )
        if len(values) < 4:
            continue
        q1 = _percentile(values, 0.25)
        q3 = _percentile(values, 0.75)
        iqr = q3 - q1
        if iqr <= 0:
            continue
        bounds[column] = (q1 - 1.5 * iqr, q3 + 1.5 * iqr)
    if not bounds:
        return rows, 0

    kept = []
    for row in rows:
        is_outlier = False
        for column, (lower, upper) in bounds.items():
            value = row.get(column)
            if value in (None, "") or not _is_float(value):
                continue
            number = float(value)
            if number < lower or number > upper:
                is_outlier = True
                break
        if not is_outlier:
            kept.append(row)
    return kept, len(rows) - len(kept)


def inspect_csv_version(namespace: str, dataset_id: str, version: int) -> dict:
    ds = get_dataset(namespace, dataset_id)
    ver = next((item for item in ds.get("versions", []) if int(item["version"]) == int(version)), None)
    if not ver:
        raise ValueError("dataset version not found")
    if ver.get("data_type") != "csv":
        raise ValueError("CSV 버전만 전처리 분석을 지원합니다")
    original_columns, original_rows = _load_csv_version(ver)
    columns, rows, payload_expanded = _expand_collection_payload_rows(original_columns, original_rows)
    column_profiles = []
    for column in columns:
        values = [row.get(column, "") for row in rows]
        present = [value for value in values if value not in (None, "")]
        numeric = bool(present) and all(_is_float(value) for value in present)
        samples = []
        for value in present:
            text = str(value)
            if text not in samples:
                samples.append(text)
            if len(samples) >= 3:
                break
        column_profiles.append({
            "name": column,
            "type": "numeric" if numeric else "text",
            "missing_count": len(values) - len(present),
            "sample_values": samples,
        })
    _, duplicate_count = _drop_duplicate_rows(rows, columns)
    return {
        "dataset_id": dataset_id,
        "version": int(version),
        "file_name": ver.get("file_name") or "",
        "row_count": len(rows),
        "column_count": len(columns),
        "columns": column_profiles,
        "original_columns": original_columns,
        "payload_json_detected": "payload_json" in original_columns,
        "payload_json_expanded": payload_expanded,
        "duplicate_count": duplicate_count,
        "task": ds.get("task") or "unknown",
        "target_column": (ver.get("metadata") or {}).get("target_column") or ds.get("target_column") or "",
    }


def _is_float(value: Any) -> bool:
    if value is None or value == "":
        return False
    try:
        float(value)
        return True
    except Exception:
        return False


def _numeric_columns(rows: list[dict[str, str]], columns: list[str], target_column: str = "") -> set[str]:
    nums = set()
    for col in columns:
        if col == target_column:
            continue
        values = [r.get(col, "") for r in rows if r.get(col, "") not in (None, "")]
        if values and all(_is_float(v) for v in values):
            nums.add(col)
    return nums


def _format_column_sample(columns: list[str], limit: int = 12) -> str:
    sample = columns[:limit]
    suffix = " ..." if len(columns) > limit else ""
    return ", ".join(sample) + suffix


def _validate_target_values(
    *,
    ds: dict,
    rows: list[dict[str, str]],
    columns: list[str],
    target_column: str,
    require_target: bool,
) -> None:
    if not target_column:
        if require_target:
            raise ValueError("target column이 비어 있습니다. 데이터셋 생성 화면에서 학습 대상 컬럼명을 입력하세요")
        return
    if target_column not in columns:
        available = _format_column_sample(columns)
        raise ValueError(f"target column을 찾을 수 없습니다: {target_column}. 사용 가능한 컬럼: {available}")
    empty_rows = [idx for idx, row in enumerate(rows, start=2) if row.get(target_column) in (None, "")]
    if empty_rows:
        preview = ", ".join(str(idx) for idx in empty_rows[:5])
        suffix = " ..." if len(empty_rows) > 5 else ""
        raise ValueError(f"target column '{target_column}'에 빈 값이 있습니다. 행: {preview}{suffix}")
    if ds.get("task") == "regression":
        invalid_rows = [
            idx for idx, row in enumerate(rows, start=2)
            if not _is_float(row.get(target_column))
        ]
        if invalid_rows:
            preview = ", ".join(str(idx) for idx in invalid_rows[:5])
            suffix = " ..." if len(invalid_rows) > 5 else ""
            raise ValueError(f"회귀 데이터셋의 target column '{target_column}'에는 숫자 값만 사용할 수 있습니다. 행: {preview}{suffix}")


def _validate_pipeline_target(ds: dict, ver: dict, target_column: str) -> None:
    if ds.get("task") not in {"regression", "classification"}:
        raise ValueError("학습 유형을 회귀 또는 분류로 지정한 뒤 준비 완료 처리하세요")
    if ver.get("data_type") != "csv":
        if not target_column:
            raise ValueError("target column이 비어 있습니다. 파이프라인 입력 생성 전에 target column을 지정하세요")
        return
    columns, rows = _load_csv_version(ver)
    _validate_target_values(
        ds=ds,
        rows=rows,
        columns=columns,
        target_column=target_column,
        require_target=True,
    )


def preprocess_version(namespace: str, dataset_id: str, version: int, user_email: str, req) -> dict:
    ds = get_dataset(namespace, dataset_id)
    version_numbers = req.source_versions or [int(version)]
    existing = {int(v["version"]): v for v in ds.get("versions", [])}
    all_rows: list[dict[str, str]] = []
    columns: list[str] = []
    source_versions: list[int] = []
    expanded_payload_versions: list[int] = []
    for vnum in version_numbers:
        ver = existing.get(int(vnum))
        if not ver:
            raise ValueError(f"version not found: v{vnum}")
        if ver.get("data_type") != "csv":
            raise ValueError("CSV 전처리는 CSV 버전만 지원합니다")
        fieldnames, rows = _load_csv_version(ver)
        if req.expand_payload_json:
            fieldnames, rows, expanded = _expand_collection_payload_rows(fieldnames, rows)
            if expanded:
                expanded_payload_versions.append(int(vnum))
        if not columns:
            columns = fieldnames
        elif fieldnames != columns:
            for col in fieldnames:
                if col not in columns:
                    columns.append(col)
        all_rows.extend(rows)
        source_versions.append(int(vnum))
    if not columns:
        raise ValueError("CSV 컬럼이 없습니다")
    if req.clean_columns:
        new_columns = _unique_columns(columns)
        mapping = dict(zip(columns, new_columns))
        all_rows = [{mapping.get(k, k): v for k, v in row.items()} for row in all_rows]
        columns = new_columns
    requested_target = ds.get("target_column") or ""
    if req.target_column is not None:
        requested_target = str(req.target_column).strip()
    target_column = requested_target
    cleaned_target = _clean_column(target_column) if req.clean_columns and target_column else target_column
    effective_task = req.task or ds.get("task") or "unknown"
    effective_ds = dict(ds)
    effective_ds["task"] = effective_task
    effective_ds["target_column"] = cleaned_target
    if req.pipeline_ready and effective_task not in {"regression", "classification"}:
        raise ValueError("학습에 사용하려면 학습 유형을 회귀 또는 분류로 선택하세요")
    _validate_target_values(
        ds=effective_ds,
        rows=all_rows,
        columns=columns,
        target_column=cleaned_target,
        require_target=bool(req.pipeline_ready),
    )
    input_row_count = len(all_rows)
    duplicate_rows_removed = 0
    if req.drop_duplicates:
        all_rows, duplicate_rows_removed = _drop_duplicate_rows(all_rows, columns)
    numeric = _numeric_columns(all_rows, columns, cleaned_target)
    if req.fill_missing:
        for row in all_rows:
            for col in columns:
                val = row.get(col)
                if val not in (None, ""):
                    continue
                row[col] = "0" if col in numeric else "unknown"
    outlier_rows_removed = 0
    if req.remove_outliers:
        all_rows, outlier_rows_removed = _remove_outlier_rows(all_rows, numeric)
    if req.normalize_numeric:
        for col in numeric:
            vals = [float(row.get(col) or 0) for row in all_rows]
            if not vals:
                continue
            lo, hi = min(vals), max(vals)
            span = hi - lo
            for row in all_rows:
                val = float(row.get(col) or 0)
                row[col] = "0" if span == 0 else f"{(val - lo) / span:.10g}"
    if req.sample_rows:
        all_rows = all_rows[: int(req.sample_rows)]
    output_name = req.output_name or "preprocessed.csv"
    if not output_name.lower().endswith(".csv"):
        output_name += ".csv"
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=columns)
    writer.writeheader()
    writer.writerows(all_rows)
    meta = {
        "preprocess": {
            "source_versions": source_versions,
            "input_row_count": input_row_count,
            "output_row_count": len(all_rows),
            "clean_columns": bool(req.clean_columns),
            "fill_missing": bool(req.fill_missing),
            "expand_payload_json": bool(req.expand_payload_json),
            "expanded_payload_versions": expanded_payload_versions,
            "drop_duplicates": bool(req.drop_duplicates),
            "duplicate_rows_removed": duplicate_rows_removed,
            "normalize_numeric": bool(req.normalize_numeric),
            "remove_outliers": bool(req.remove_outliers),
            "outlier_rows_removed": outlier_rows_removed,
            "sample_rows": req.sample_rows,
            "row_count": len(all_rows),
            "columns": columns,
            "numeric_columns": sorted(numeric),
        },
        "lineage": {"parent_versions": source_versions, "operation": "csv_preprocess"},
        "target_column": cleaned_target,
        "task": effective_task,
        "notes": req.notes or "",
    }
    version_info = create_version_from_bytes(
        namespace,
        dataset_id,
        user_email,
        file_name=output_name,
        content=buffer.getvalue().encode("utf-8"),
        source_kind="preprocessed",
        pipeline_ready=bool(req.pipeline_ready),
        notes=req.notes or "",
        metadata=meta,
    )
    if req.task is not None or req.target_column is not None:
        update_dataset_training_config(
            namespace,
            dataset_id,
            task=effective_task,
            target_column=cleaned_target,
        )
    return version_info


def _find_version(ds: dict, version: int) -> dict:
    ver = next((v for v in ds.get("versions", []) if int(v["version"]) == int(version)), None)
    if not ver:
        raise ValueError("dataset version not found")
    return ver


def _image_payloads_from_version(ver: dict) -> list[tuple[str, bytes]]:
    file_path = ver.get("file_path") or ""
    if not file_path or not Path(file_path).exists():
        raise ValueError("이미지 파일이 저장소에 없습니다")
    path = Path(file_path)
    ext = path.suffix.lower()
    if ext in IMAGE_EXTS:
        return [(path.name, path.read_bytes())]
    if ext != ".zip":
        raise ValueError("이미지 표준화는 JPEG/PNG 파일 또는 이미지 ZIP만 지원합니다")
    out = []
    with zipfile.ZipFile(path) as zf:
        for info in zf.infolist():
            if info.is_dir() or Path(info.filename).suffix.lower() not in IMAGE_EXTS:
                continue
            out.append((info.filename, zf.read(info)))
    return out


def _parse_color(value: str) -> tuple[int, int, int]:
    text = (value or "#ffffff").strip()
    if re.match(r"^#[0-9A-Fa-f]{6}$", text):
        return tuple(int(text[i:i + 2], 16) for i in (1, 3, 5))
    if re.match(r"^[0-9]{1,3},[0-9]{1,3},[0-9]{1,3}$", text):
        parts = [max(0, min(255, int(p))) for p in text.split(",")]
        return parts[0], parts[1], parts[2]
    return 255, 255, 255


def _standardized_name(name: str, index: int, ext: str) -> str:
    stem = _safe_name(Path(name).stem, f"image-{index}")
    return f"images/{index:05d}-{stem}{ext}"


def standardize_image_version(namespace: str, dataset_id: str, version: int, user_email: str, req) -> dict:
    if Image is None or ImageOps is None:
        raise ValueError("이미지 표준화에는 Pillow 패키지가 필요합니다")
    ds = get_dataset(namespace, dataset_id)
    ver = _find_version(ds, version)
    if ver.get("data_type") != "image":
        raise ValueError("이미지 표준화는 image 데이터셋 버전만 지원합니다")
    payloads = _image_payloads_from_version(ver)
    if not payloads:
        raise ValueError("표준화할 JPEG/PNG 이미지가 없습니다")
    target_format = (req.target_format or "jpeg").lower()
    pil_format = "JPEG" if target_format == "jpeg" else "PNG"
    out_ext = ".jpg" if target_format == "jpeg" else ".png"
    output_name = req.output_name or "standardized-images.zip"
    if not output_name.lower().endswith(".zip"):
        output_name += ".zip"
    bg = _parse_color(req.background_color)
    ds_root = _dataset_root(namespace, ds["safe_name"])
    with _connect() as conn:
        new_version = _next_version(conn, dataset_id)
        root = _version_root(namespace, ds["safe_name"], new_version)
        staging = root.with_name(root.name + f".tmp-{secrets.token_hex(4)}")
        if staging.exists():
            shutil.rmtree(staging)
        staging.mkdir(parents=True, exist_ok=False)
        zip_name = _safe_name(output_name, "standardized-images.zip")
        zip_path = staging / zip_name
        manifest_path = staging / "manifest.csv"
        rows = []
        failures = []
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for idx, (source_name, content) in enumerate(payloads, start=1):
                try:
                    with Image.open(io.BytesIO(content)) as opened:
                        img = ImageOps.exif_transpose(opened)
                        original = {"width": img.width, "height": img.height, "format": img.format, "mode": img.mode}
                        if req.keep_aspect_ratio:
                            bound = (req.max_width or img.width, req.max_height or img.height)
                            img = img.copy()
                            img.thumbnail(bound)
                        else:
                            img = img.resize((req.max_width or img.width, req.max_height or img.height))
                        if pil_format == "JPEG":
                            canvas = Image.new("RGB", img.size, bg)
                            if img.mode in ("RGBA", "LA"):
                                canvas.paste(img, mask=img.getchannel("A"))
                            else:
                                canvas.paste(img.convert("RGB"))
                            img = canvas
                        elif img.mode not in ("RGB", "RGBA"):
                            img = img.convert("RGBA")
                        out_name = _standardized_name(source_name, idx, out_ext)
                        buf = io.BytesIO()
                        save_kwargs = {"format": pil_format}
                        if pil_format == "JPEG":
                            save_kwargs.update({"quality": int(req.quality), "optimize": True})
                        img.save(buf, **save_kwargs)
                        zf.writestr(out_name, buf.getvalue())
                        rows.append({
                            "source_file": source_name,
                            "file_name": out_name,
                            "width": img.width,
                            "height": img.height,
                            "format": pil_format.lower(),
                            "original_width": original["width"],
                            "original_height": original["height"],
                            "original_format": original.get("format") or "",
                        })
                except (UnidentifiedImageError, OSError, ValueError) as e:
                    failures.append({"source_file": source_name, "error": str(e)})
        if not rows:
            shutil.rmtree(staging)
            raise ValueError("표준화에 성공한 이미지가 없습니다")
        with manifest_path.open("w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=["source_file", "file_name", "width", "height", "format", "original_width", "original_height", "original_format"],
            )
            writer.writeheader()
            writer.writerows(rows)
        if root.exists():
            shutil.rmtree(root)
        staging.rename(root)
        final_zip = root / zip_name
        final_manifest = root / "manifest.csv"
        rel_manifest = str(final_manifest.relative_to(ds_root)) if final_manifest.exists() else "manifest.csv"
        meta = {
            "notes": req.notes or "",
            "storage": "pvc",
            "image_count": len(rows),
            "failed_image_count": len(failures),
            "failed_images": failures[:50],
            "manifest_path": str(final_manifest),
            "manifest_relative_path": rel_manifest,
            "standardize": {
                "target_format": target_format,
                "max_width": req.max_width,
                "max_height": req.max_height,
                "keep_aspect_ratio": bool(req.keep_aspect_ratio),
                "background_color": req.background_color,
                "quality": req.quality,
            },
            "lineage": {"parent_versions": [int(version)], "operation": "image_standardize"},
        }
        version_info = _insert_version(
            conn,
            ds,
            namespace,
            user_email,
            source_kind="image_standardized",
            source_uri="",
            file_name=zip_name,
            file_path=str(final_zip),
            data_type="image",
            size_bytes=final_zip.stat().st_size,
            row_count=len(rows),
            pipeline_ready=bool(req.pipeline_ready),
            metadata=meta,
        )
        _write_metadata_file(ds, version_info, root / "metadata.json")
        conn.commit()
        return version_info


def _read_label_studio_export(file_name: str, content: bytes) -> Any:
    ext = Path(file_name or "").suffix.lower()
    text = content.decode("utf-8-sig")
    if ext == ".jsonl":
        return [json.loads(line) for line in text.splitlines() if line.strip()]
    data = json.loads(text)
    return data


def _flatten_label_value(value: Any) -> list[str]:
    labels = []
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        for item in value:
            labels.extend(_flatten_label_value(item))
        return labels
    if isinstance(value, dict):
        for key in ("choices", "labels", "rectanglelabels", "polygonlabels", "brushlabels", "keypointlabels", "taxonomy", "text"):
            if key in value:
                labels.extend(_flatten_label_value(value.get(key)))
    return [str(v) for v in labels if str(v)]


def _extract_task_image(data: dict) -> str:
    task_data = data.get("data") if isinstance(data.get("data"), dict) else {}
    for key in ("image", "Image", "img", "url", "path"):
        if task_data.get(key):
            return str(task_data[key])
    for key, value in task_data.items():
        if isinstance(value, str) and any(token in value.lower() for token in (".jpg", ".jpeg", ".png", "http://", "https://")):
            return value
    return ""


def _label_studio_rows(payload: Any) -> tuple[list[dict], dict]:
    if isinstance(payload, dict) and isinstance(payload.get("images"), list) and isinstance(payload.get("annotations"), list):
        categories = {c.get("id"): c.get("name") for c in payload.get("categories", []) if isinstance(c, dict)}
        by_image: dict[Any, list[dict]] = {}
        for ann in payload.get("annotations", []):
            if isinstance(ann, dict):
                by_image.setdefault(ann.get("image_id"), []).append(ann)
        rows = []
        labels = set()
        for image in payload.get("images", []):
            if not isinstance(image, dict):
                continue
            anns = by_image.get(image.get("id"), [])
            image_labels = sorted({str(categories.get(a.get("category_id"), a.get("category_id"))) for a in anns if a.get("category_id") is not None})
            labels.update(image_labels)
            rows.append({
                "task_id": image.get("id", ""),
                "image": image.get("file_name", ""),
                "labels": ";".join(image_labels),
                "annotation_count": len(anns),
                "prediction_count": 0,
                "raw_annotation": json.dumps(anns, ensure_ascii=False),
            })
        return rows, {"format": "coco", "labels": sorted(labels)}

    tasks = payload if isinstance(payload, list) else payload.get("tasks", []) if isinstance(payload, dict) else []
    rows = []
    all_labels = set()
    for idx, task in enumerate(tasks, start=1):
        if not isinstance(task, dict):
            continue
        annotations = task.get("annotations") or task.get("completions") or []
        predictions = task.get("predictions") or []
        labels = []
        for ann in annotations:
            if not isinstance(ann, dict):
                continue
            for result in ann.get("result", []) or []:
                if isinstance(result, dict):
                    labels.extend(_flatten_label_value(result.get("value")))
        cleaned = sorted({str(label) for label in labels if str(label)})
        all_labels.update(cleaned)
        rows.append({
            "task_id": task.get("id", idx),
            "image": _extract_task_image(task),
            "labels": ";".join(cleaned),
            "annotation_count": len(annotations),
            "prediction_count": len(predictions),
            "raw_annotation": json.dumps(annotations, ensure_ascii=False),
        })
    return rows, {"format": "label_studio_tasks", "labels": sorted(all_labels)}


def create_label_studio_export_version(
    namespace: str,
    dataset_id: str,
    source_version: int,
    user_email: str,
    *,
    file_name: str,
    content: bytes,
    output_name: str = "label-studio-export.csv",
    pipeline_ready: bool = True,
    notes: str = "",
) -> dict:
    if len(content) > MAX_DATASET_UPLOAD_BYTES:
        raise ValueError(f"업로드 파일이 너무 큽니다. 최대 {MAX_DATASET_UPLOAD_BYTES} bytes")
    ext = Path(file_name or "").suffix.lower()
    if ext not in {".json", ".jsonl"}:
        raise ValueError("Label Studio export는 JSON 또는 JSONL만 지원합니다")
    ds = get_dataset(namespace, dataset_id)
    _find_version(ds, source_version)
    payload = _read_label_studio_export(file_name, content)
    rows, summary = _label_studio_rows(payload)
    if not rows:
        raise ValueError("Label Studio export에서 task를 찾지 못했습니다")
    output_name = output_name or "label-studio-export.csv"
    if not output_name.lower().endswith(".csv"):
        output_name += ".csv"
    with _connect() as conn:
        new_version = _next_version(conn, dataset_id)
        root = _version_root(namespace, ds["safe_name"], new_version)
        staging = root.with_name(root.name + f".tmp-{secrets.token_hex(4)}")
        if staging.exists():
            shutil.rmtree(staging)
        staging.mkdir(parents=True, exist_ok=False)
        raw_name = _safe_name(file_name, "label-studio-export.json")
        csv_name = _safe_name(output_name, "label-studio-export.csv")
        raw_path = staging / raw_name
        csv_path = staging / csv_name
        raw_path.write_bytes(content)
        with csv_path.open("w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["task_id", "image", "labels", "annotation_count", "prediction_count", "raw_annotation"])
            writer.writeheader()
            writer.writerows(rows)
        if root.exists():
            shutil.rmtree(root)
        staging.rename(root)
        final_csv = root / csv_name
        final_raw = root / raw_name
        meta = {
            "notes": notes or "",
            "storage": "pvc",
            "raw_export_file": str(final_raw),
            "label_studio": {
                "format": summary.get("format"),
                "labels": summary.get("labels", []),
                "task_count": len(rows),
                "annotated_task_count": sum(1 for row in rows if int(row.get("annotation_count") or 0) > 0),
            },
            "lineage": {"parent_versions": [int(source_version)], "operation": "label_studio_export"},
        }
        version_info = _insert_version(
            conn,
            ds,
            namespace,
            user_email,
            source_kind="labeling_export",
            source_uri="",
            file_name=csv_name,
            file_path=str(final_csv),
            data_type="csv",
            size_bytes=final_csv.stat().st_size,
            row_count=len(rows),
            pipeline_ready=bool(pipeline_ready),
            metadata=meta,
            status="ready" if pipeline_ready else "registered",
        )
        _write_metadata_file(ds, version_info, root / "metadata.json")
        conn.commit()
        return version_info




def _default_label_config(use_image: bool, data_key: str) -> str:
    if use_image:
        key = data_key or "image"
        return (
            '<View>\n'
            f'  <Image name="image" value="${key}"/>\n'
            '  <Choices name="label" toName="image">\n'
            '    <Choice value="normal"/>\n'
            '    <Choice value="defect"/>\n'
            '  </Choices>\n'
            '</View>'
        )
    return (
        '<View>\n'
        '  <Text name="record" value="$record"/>\n'
        '  <Choices name="label" toName="record">\n'
        '    <Choice value="normal"/>\n'
        '    <Choice value="defect"/>\n'
        '  </Choices>\n'
        '</View>'
    )


def _json_or_text(value: str) -> Any:
    try:
        return json.loads(value)
    except Exception:
        return value


def _label_studio_tasks_from_version(version: dict, *, data_key: str, file_path_column: str, limit: int) -> tuple[list[dict], bool]:
    path = Path(version.get("file_path") or "")
    if not path.exists() or not path.is_file():
        raise ValueError("Label Studio 작업으로 변환할 버전 파일을 찾을 수 없습니다")

    tasks: list[dict] = []
    use_image = False
    data_type = version.get("data_type")
    suffix = path.suffix.lower()

    if data_type == "csv" or suffix == ".csv":
        with path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=1):
                if len(tasks) >= limit:
                    break
                file_value = str(row.get(file_path_column) or row.get("image") or row.get("file") or row.get("url") or "").strip()
                payload = _json_or_text(str(row.get("payload_json") or row.get("payload") or "")) if (row.get("payload_json") or row.get("payload")) else {}
                meta = _json_or_text(str(row.get("meta_json") or row.get("meta") or "")) if (row.get("meta_json") or row.get("meta")) else {}
                record = {
                    "device_id": row.get("device_id", ""),
                    "timestamp": row.get("timestamp", ""),
                    "type": row.get("type", ""),
                    "payload": payload,
                    "meta": meta,
                }
                data = {"record": json.dumps(record, ensure_ascii=False, sort_keys=True)}
                if file_value:
                    data[data_key or "image"] = file_value
                    use_image = True
                tasks.append({"id": row.get("id") or idx, "data": data, "meta": {"source_row": row}})
        return tasks, use_image

    if suffix == ".jsonl":
        with path.open("r", encoding="utf-8-sig") as f:
            items = [json.loads(line) for line in f if line.strip()]
    elif suffix == ".json":
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
        items = payload.get("tasks", payload) if isinstance(payload, dict) else payload
    else:
        raise ValueError("Label Studio 작업 생성은 CSV/JSON/JSONL 버전을 지원합니다")

    for idx, item in enumerate(items or [], start=1):
        if len(tasks) >= limit:
            break
        if not isinstance(item, dict):
            item = {"value": item}
        data = item.get("data") if isinstance(item.get("data"), dict) else dict(item)
        has_image = bool(data.get(data_key or "image") or data.get("image") or data.get("file_path"))
        use_image = use_image or has_image
        tasks.append({"id": item.get("id", idx), "data": data, "meta": {"source_item": item}})
    return tasks, use_image


def _try_create_label_studio_remote(manifest: dict, create_remote: bool, user_email: str = "") -> dict:
    if not create_remote:
        return {"attempted": False, "created": False, "reason": "remote creation disabled"}

    base_url = os.environ.get("LABEL_STUDIO_URL", "http://label-studio.kubeflow.svc.cluster.local").rstrip("/")
    token = os.environ.get("LABEL_STUDIO_API_TOKEN", "").strip()
    headers = {"Accept": "application/json"}
    auth_mode = "token" if token else "kubeflow_header"
    if token:
        headers["Authorization"] = f"Token {token}"
    elif user_email:
        # The bundled Label Studio manifest installs Kubeflow header SSO middleware.
        # Use the same headers that the Kubeflow gateway sends so projects are created
        # in the current user's organization when an API token is not configured.
        headers.update({
            "Kubeflow-Userid": user_email,
            "X-Auth-Request-Email": user_email,
            "X-Auth-Request-User": user_email,
        })
    else:
        return {"attempted": True, "created": False, "reason": "Label Studio 인증 정보가 없습니다."}

    try:
        with httpx.Client(timeout=20.0, headers=headers, follow_redirects=True) as client:
            project_resp = client.post(
                f"{base_url}/api/projects",
                json={
                    "title": manifest["project"]["title"],
                    "label_config": manifest["project"]["label_config"],
                },
            )
            project_resp.raise_for_status()
            project = project_resp.json()
            project_id = project.get("id")
            if not project_id:
                raise ValueError("Label Studio project id를 응답에서 찾을 수 없습니다.")
            import_resp = client.post(f"{base_url}/api/projects/{project_id}/import", json=manifest["tasks"])
            import_resp.raise_for_status()
        return {
            "attempted": True,
            "created": True,
            "project_id": project_id,
            "url": f"{base_url}/projects/{project_id}",
            "auth_mode": auth_mode,
            "task_count": len(manifest.get("tasks") or []),
        }
    except Exception as e:
        return {
            "attempted": True,
            "created": False,
            "reason": str(e),
            "url": base_url,
            "auth_mode": auth_mode,
        }


def create_label_studio_project_version(
    namespace: str,
    dataset_id: str,
    source_version: int,
    user_email: str,
    req,
) -> dict:
    ds = get_dataset(namespace, dataset_id)
    version = _find_version(ds, source_version)
    output_name = req.output_name or "label-studio-project.json"
    if not output_name.lower().endswith(".json"):
        output_name += ".json"
    tasks, use_image = _label_studio_tasks_from_version(
        version,
        data_key=req.data_key or "image",
        file_path_column=req.file_path_column or "file_path",
        limit=int(req.task_limit or 500),
    )
    if not tasks:
        raise ValueError("Label Studio 작업으로 변환할 row가 없습니다")
    project_title = req.project_name.strip() or f"{ds['name']} {version['version_label']} labeling"
    label_config = req.label_config.strip() or _default_label_config(use_image, req.data_key or "image")
    manifest = {
        "project": {
            "title": project_title,
            "label_config": label_config,
            "source_dataset_id": dataset_id,
            "source_dataset_name": ds["name"],
            "source_version": int(source_version),
            "namespace": namespace,
        },
        "tasks": tasks,
    }
    remote = _try_create_label_studio_remote(manifest, bool(req.create_remote), user_email)
    metadata = {
        "notes": req.notes or "",
        "storage": "pvc",
        "label_studio_project": {
            "project_name": project_title,
            "task_count": len(tasks),
            "uses_image": use_image,
            "remote": remote,
        },
        "lineage": {"parent_versions": [int(source_version)], "operation": "label_studio_project_manifest"},
    }
    return create_version_from_bytes(
        namespace,
        dataset_id,
        user_email,
        file_name=output_name,
        content=json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8"),
        source_kind="labeling_project",
        pipeline_ready=False,
        notes=req.notes or "Label Studio project manifest",
        metadata=metadata,
    )


def update_version(namespace: str, dataset_id: str, version: int, user_email: str, req) -> dict:
    ds = get_dataset(namespace, dataset_id)
    ver = _find_version(ds, version)
    metadata = dict(ver.get("metadata") or {})
    if req.target_column is not None:
        metadata["target_column"] = req.target_column
    if req.notes is not None:
        metadata["notes"] = req.notes
    if req.metadata:
        metadata.update(req.metadata)
    status = req.status or ver.get("status") or "registered"
    if status not in VERSION_STATUSES:
        raise ValueError(f"지원하지 않는 version status입니다: {status}")
    pipeline_ready = ver.get("pipeline_ready", False) if req.pipeline_ready is None else bool(req.pipeline_ready)
    if status == "published":
        pipeline_ready = True
        metadata["published_at"] = _now()
        metadata["published_by"] = user_email
    with _connect() as conn:
        conn.execute(
            """
            UPDATE dataset_versions
            SET status=?, pipeline_ready=?, metadata_json=?
            WHERE dataset_id=? AND version=? AND namespace=?
            """,
            (status, 1 if pipeline_ready else 0, _json_dumps(metadata), dataset_id, int(version), namespace),
        )
        conn.execute("UPDATE datasets SET updated_at=? WHERE id=?", (_now(), dataset_id))
        row = conn.execute(
            "SELECT * FROM dataset_versions WHERE dataset_id=? AND version=? AND namespace=?",
            (dataset_id, int(version), namespace),
        ).fetchone()
        if not row:
            raise ValueError("dataset version not found")
        version_info = _row_to_version(row)
        root = _version_root(namespace, ds["safe_name"], int(version))
        _write_metadata_file(ds, version_info, root / "metadata.json")
        conn.commit()
        return version_info


def publish_version(namespace: str, dataset_id: str, version: int, user_email: str) -> dict:
    ds = get_dataset(namespace, dataset_id)
    ver = _find_version(ds, version)
    target_column = (ver.get("metadata") or {}).get("target_column") or ds.get("target_column") or ""
    _validate_pipeline_target(ds, ver, target_column)

    class _Req:
        status = "published"
        pipeline_ready = True
        target_column = None
        notes = None
        metadata = {}

    return update_version(namespace, dataset_id, version, user_email, _Req())


def list_pipeline_runs(namespace: str, dataset_id: str) -> list[dict]:
    get_dataset(namespace, dataset_id)
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT r.*, d.name AS dataset_name, d.safe_name AS dataset_safe_name,
                   d.data_type AS dataset_data_type, d.task AS dataset_task
            FROM dataset_pipeline_runs r
            LEFT JOIN datasets d ON d.id = r.dataset_id AND d.namespace = r.namespace
            WHERE r.dataset_id=? AND r.namespace=?
            ORDER BY r.created_at DESC
            """,
            (dataset_id, namespace),
        ).fetchall()
        return [_row_to_pipeline_run(r) for r in rows]


def list_all_pipeline_runs(namespace: str, limit: int = 100) -> list[dict]:
    bounded_limit = max(1, min(int(limit or 100), 500))
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT r.*, d.name AS dataset_name, d.safe_name AS dataset_safe_name,
                   d.data_type AS dataset_data_type, d.task AS dataset_task
            FROM dataset_pipeline_runs r
            LEFT JOIN datasets d ON d.id = r.dataset_id AND d.namespace = r.namespace
            WHERE r.namespace=?
            ORDER BY r.created_at DESC
            LIMIT ?
            """,
            (namespace, bounded_limit),
        ).fetchall()
        return [_row_to_pipeline_run(r) for r in rows]


def get_pipeline_run(namespace: str, run_id: str) -> dict:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT r.*, d.name AS dataset_name, d.safe_name AS dataset_safe_name,
                   d.data_type AS dataset_data_type, d.task AS dataset_task
            FROM dataset_pipeline_runs r
            LEFT JOIN datasets d ON d.id = r.dataset_id AND d.namespace = r.namespace
            WHERE r.namespace=? AND r.run_id=?
            """,
            (namespace, run_id),
        ).fetchone()
        if not row:
            raise ValueError("pipeline run not found")
        return _row_to_pipeline_run(row)


def record_pipeline_run(namespace: str, dataset_id: str, user_email: str, req) -> dict:
    ds = get_dataset(namespace, dataset_id)
    _find_version(ds, int(req.dataset_version))
    run_id = str(req.run_id or "").strip()
    if not run_id:
        raise ValueError("run_id is required")
    now = _now()
    record_id = f"dpr-{secrets.token_hex(5)}"
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO dataset_pipeline_runs(
                id, dataset_id, namespace, dataset_version, run_id, run_name, state,
                experiment_id, experiment_name, pipeline_id, pipeline_name,
                pipeline_version_id, pipeline_version_name, service_account, ui_url,
                params_json, kfp_run_json, created_by, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(namespace, run_id) DO UPDATE SET
                dataset_id=excluded.dataset_id,
                dataset_version=excluded.dataset_version,
                run_name=excluded.run_name,
                state=excluded.state,
                experiment_id=excluded.experiment_id,
                experiment_name=excluded.experiment_name,
                pipeline_id=excluded.pipeline_id,
                pipeline_name=excluded.pipeline_name,
                pipeline_version_id=excluded.pipeline_version_id,
                pipeline_version_name=excluded.pipeline_version_name,
                service_account=excluded.service_account,
                ui_url=excluded.ui_url,
                params_json=excluded.params_json,
                kfp_run_json=excluded.kfp_run_json,
                updated_at=excluded.updated_at
            """,
            (
                record_id,
                dataset_id,
                namespace,
                int(req.dataset_version),
                run_id,
                req.run_name or run_id,
                req.state or "",
                req.experiment_id or "",
                req.experiment_name or "",
                req.pipeline_id or "",
                req.pipeline_name or "",
                req.pipeline_version_id or "",
                req.pipeline_version_name or "",
                req.service_account or "",
                req.ui_url or "",
                _json_dumps(req.params or {}),
                _json_dumps(req.kfp_run or {}),
                user_email,
                now,
                now,
            ),
        )
        conn.execute("UPDATE datasets SET updated_at=? WHERE id=?", (now, dataset_id))
        row = conn.execute(
            "SELECT * FROM dataset_pipeline_runs WHERE namespace=? AND run_id=?",
            (namespace, run_id),
        ).fetchone()
        conn.commit()
        return _row_to_pipeline_run(row)


def update_pipeline_run_status(namespace: str, dataset_id: str, run_id: str, req) -> dict:
    state = str(req.state or "").strip()
    now = _now()
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM dataset_pipeline_runs WHERE dataset_id=? AND namespace=? AND run_id=?",
            (dataset_id, namespace, run_id),
        ).fetchone()
        if not row:
            raise ValueError("pipeline run not found")
        conn.execute(
            """
            UPDATE dataset_pipeline_runs
            SET state=?, kfp_run_json=?, updated_at=?
            WHERE dataset_id=? AND namespace=? AND run_id=?
            """,
            (state or row["state"], _json_dumps(req.kfp_run or {}), now, dataset_id, namespace, run_id),
        )
        updated = conn.execute(
            "SELECT * FROM dataset_pipeline_runs WHERE dataset_id=? AND namespace=? AND run_id=?",
            (dataset_id, namespace, run_id),
        ).fetchone()
        conn.commit()
        return _row_to_pipeline_run(updated)


def update_any_pipeline_run_status(namespace: str, run_id: str, req) -> dict:
    existing = get_pipeline_run(namespace, run_id)
    return update_pipeline_run_status(namespace, existing["dataset_id"], run_id, req)


def build_pipeline_inputs(namespace: str, dataset_id: str, version: int, req) -> dict:
    ds = get_dataset(namespace, dataset_id)
    ver = _find_version(ds, version)
    if not ver.get("pipeline_ready"):
        raise ValueError("파이프라인 준비 완료가 아닌 버전입니다. 먼저 '준비 완료'를 실행해 주세요.")
    token = _get_download_token(dataset_id, int(version))
    dataset_url = (
        f"{DATASET_INTERNAL_BASE_URL}/api/datasets/{quote(dataset_id)}/versions/{int(version)}/download"
        f"?token={quote(token)}"
    )
    target_column = req.target_column or (ver.get("metadata") or {}).get("target_column") or ds.get("target_column") or ""
    _validate_pipeline_target(ds, ver, target_column)
    registered_name = req.registered_name or ds.get("safe_name") or ds.get("name")
    mlflow_uri = tenant_resources.mlflow_tracking_uri(namespace)
    params = {
        "dataset_url": dataset_url,
        "target_column": target_column,
        "threshold": req.threshold,
        "max_attempts": req.max_attempts,
        "registered_name": registered_name,
        "namespace": namespace,
        "mlflow_uri": mlflow_uri,
    }
    return {
        "dataset": {"id": ds["id"], "name": ds["name"], "version": int(version)},
        "pipeline": {
            "name": "weekly-retrain",
            "dsl_file": "examples/weekly_retrain_pipeline.py",
            "yaml_file": "examples/weekly_retrain_pipeline.yaml",
            "upload_method": "Kubeflow Pipelines UI에서 Upload pipeline -> Upload a file 사용",
        },
        "params": params,
        "copy_text": "\n".join(f"{k}: {v}" for k, v in params.items()),
    }


def _get_download_token(dataset_id: str, version: int) -> str:
    with _connect() as conn:
        row = conn.execute(
            "SELECT download_token FROM dataset_versions WHERE dataset_id=? AND version=?",
            (dataset_id, int(version)),
        ).fetchone()
        if not row:
            raise ValueError("dataset version not found")
        return row["download_token"]
