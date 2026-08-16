"""AutoML job service — submits Ray Jobs to the cluster and tracks them in-memory."""
import asyncio
import json
import logging
import os
import shutil
import tempfile
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import httpx
from ray.job_submission import JobSubmissionClient

from app.models.automl_models import AutoMLJobRequest
from app.services import kubernetes_client, tenant_resources
from app.services.postgres_db import connect as _connect

logger = logging.getLogger(__name__)


_db_lock = threading.Lock()


def _db_init() -> None:
    with _db_lock:
        conn = _connect()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                submitted_at TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()


def _db_load_all() -> dict:
    try:
        with _db_lock:
            conn = _connect()
            rows = conn.execute("SELECT data FROM jobs").fetchall()
            conn.close()
        out = {}
        for row in rows:
            info = json.loads(row["data"])
            out[info["job_id"]] = info
        return out
    except Exception as e:
        print(f"[automl] DB load failed: {e}", flush=True)
        return {}


def _db_save(info: dict) -> None:
    try:
        with _db_lock:
            conn = _connect()
            conn.execute(
                """
                INSERT INTO jobs (job_id, data, submitted_at)
                VALUES (?, ?, ?)
                ON CONFLICT(job_id) DO UPDATE SET
                    data=excluded.data,
                    submitted_at=excluded.submitted_at
                """,
                (info["job_id"], json.dumps(info), info.get("submitted_at", _now_static())),
            )
            conn.commit()
            conn.close()
    except Exception as e:
        print(f"[automl] DB save failed: {e}", flush=True)


def _db_delete_many(job_ids: list[str]) -> None:
    if not job_ids:
        return
    try:
        with _db_lock:
            conn = _connect()
            conn.executemany("DELETE FROM jobs WHERE job_id = ?", [(job_id,) for job_id in job_ids])
            conn.commit()
            conn.close()
    except Exception as e:
        print(f"[automl] DB delete failed: {e}", flush=True)


def _now_static() -> str:
    return datetime.now(timezone.utc).isoformat()


RAY_DASHBOARD_URL = os.environ.get(
    "RAY_DASHBOARD_URL", "http://ray-optuna-mlflow-cluster-head-svc.ray-system:8265"
)
MLFLOW_URI = os.environ.get("MLFLOW_URI", "http://mlflow-service.ray-system:5000")
MAX_CONCURRENT_PER_NS = int(os.environ.get("AUTOML_MAX_CONCURRENT_PER_NS", "2"))
SCHEDULER_INTERVAL = float(os.environ.get("AUTOML_SCHEDULER_INTERVAL", "5"))

RUNNER_DIR = Path(__file__).resolve().parent.parent / "automl_runner"

_db_init()
_jobs: dict[str, dict] = _db_load_all()
_ray_clients: dict[str, JobSubmissionClient] = {}
_scheduler_task: asyncio.Task | None = None
_next_priority: int = max([j.get("priority", 0) for j in _jobs.values()], default=0)


def _persist(info: dict) -> None:
    """In-memory 저장 + PostgreSQL 저장"""
    _jobs[info["job_id"]] = info
    _db_save(info)


def _mlflow_uri_for_job(info: dict) -> str:
    return info.get("mlflow_uri") or tenant_resources.mlflow_tracking_uri(info.get("namespace")) or MLFLOW_URI


def _compact_text(text: str | None, limit: int = 1600) -> str:
    if not text:
        return ""
    text = str(text).strip()
    return text if len(text) <= limit else text[:limit] + "...(truncated)"


def _parse_cpu_quantity(value) -> float | None:
    if value in (None, ""):
        return None
    text = str(value).strip()
    try:
        if text.endswith("m"):
            return float(text[:-1]) / 1000.0
        return float(text)
    except ValueError:
        return None


def _parse_memory_quantity(value) -> float | None:
    if value in (None, ""):
        return None
    text = str(value).strip()
    units = {
        "Ki": 1024, "Mi": 1024 ** 2, "Gi": 1024 ** 3, "Ti": 1024 ** 4,
        "K": 1000, "M": 1000 ** 2, "G": 1000 ** 3, "T": 1000 ** 4,
    }
    for suffix, factor in units.items():
        if text.endswith(suffix):
            try:
                return float(text[:-len(suffix)]) * factor
            except ValueError:
                return None
    try:
        return float(text)
    except ValueError:
        return None


def _parse_float_quantity(value) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(str(value).strip())
    except ValueError:
        return None


def _fmt_cores(value: float) -> str:
    return f"{value:.2f} core".rstrip("0").rstrip(".")


def _fmt_gib(value: float) -> str:
    return f"{value / 1024 ** 3:.2f} Gi".rstrip("0").rstrip(".")


def _quota_available(quotas, keys: tuple[str, ...], parser) -> float | None:
    available: list[float] = []
    for quota in quotas:
        hard = (quota.status.hard or {}) if quota.status else {}
        used = (quota.status.used or {}) if quota.status else {}
        for key in keys:
            if key not in hard:
                continue
            hard_val = parser(hard.get(key))
            used_val = parser(used.get(key, "0")) or 0
            if hard_val is not None:
                available.append(max(0.0, hard_val - used_val))
            break
    return min(available) if available else None


def _validate_namespace_quota(req: AutoMLJobRequest, namespace: str) -> None:
    try:
        quotas = kubernetes_client.core_v1().list_namespaced_resource_quota(namespace).items
    except Exception as e:
        logger.debug("[automl] quota preflight skipped for %s: %s", namespace, e)
        return
    if not quotas:
        return
    errors: list[str] = []
    req_cpu = float(req.cpu_per_trial or 0)
    req_mem = float(req.memory_per_trial_gb or 0) * 1024 ** 3
    req_gpu = float(req.gpu_per_trial or 0)

    cpu_avail = _quota_available(quotas, ("requests.cpu", "cpu", "limits.cpu"), _parse_cpu_quantity)
    if cpu_avail is not None and req_cpu > cpu_avail:
        errors.append(f"CPU 요청 {_fmt_cores(req_cpu)} > 사용 가능 {_fmt_cores(cpu_avail)}")

    mem_avail = _quota_available(quotas, ("requests.memory", "memory", "limits.memory"), _parse_memory_quantity)
    if mem_avail is not None and req_mem > mem_avail:
        errors.append(f"Memory 요청 {_fmt_gib(req_mem)} > 사용 가능 {_fmt_gib(mem_avail)}")

    gpu_avail = _quota_available(
        quotas,
        ("requests.nvidia.com/gpu", "limits.nvidia.com/gpu", "nvidia.com/gpu"),
        _parse_float_quantity,
    )
    if gpu_avail is not None and req_gpu > gpu_avail:
        errors.append(f"GPU 요청 {req_gpu:g} > 사용 가능 {gpu_avail:g}")

    if errors:
        raise ValueError("namespace quota를 초과합니다: " + "; ".join(errors))


async def _validate_dataset_path(path: str) -> None:
    raw = str(path or "").strip()
    if not raw:
        raise ValueError("데이터셋 경로를 입력하세요.")
    parsed = urlparse(raw)
    if parsed.scheme in {"http", "https"}:
        # A just-created in-cluster Service can be temporarily unreachable
        # while its EndpointSlice/DNS entry is converging.  Retry transport
        # failures a few times, but never hide a deterministic HTTP error
        # such as 401/404 from the user.
        transport_error: Exception | None = None
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
                    resp = await client.request("HEAD", raw)
                    if resp.status_code in (405, 501):
                        async with client.stream("GET", raw, headers={"Range": "bytes=0-0"}) as stream_resp:
                            if stream_resp.status_code >= 400:
                                raise ValueError(f"HTTP {stream_resp.status_code}")
                            async for _ in stream_resp.aiter_bytes():
                                break
                    elif resp.status_code >= 400:
                        raise ValueError(f"HTTP {resp.status_code}")
                return
            except ValueError:
                raise
            except Exception as error:
                transport_error = error
                if attempt < 2:
                    await asyncio.sleep(attempt + 1)
        raise ValueError(
            f"데이터셋 경로에 접근할 수 없습니다. Prediction Manager와 Ray Job이 접근 가능한 URL인지 확인하세요. "
            f"오류 유형: {type(transport_error).__name__}"
        ) from transport_error
    if parsed.scheme and parsed.scheme not in {"file"}:
        raise ValueError("데이터셋 경로는 http/https URL 또는 서버 로컬 파일 경로만 지원합니다.")
    local_path = parsed.path if parsed.scheme == "file" else raw
    if not Path(local_path).exists():
        raise ValueError(f"데이터셋 경로를 찾을 수 없습니다: {raw}")


def _friendly_ray_error_message(error: Exception | str) -> str:
    text = str(error)
    low = text.lower()
    if any(token in low for token in ("insufficient", "no available", "cannot be fulfilled", "resource request", "quota", "exceed", "not enough", "unschedulable", "pending resources")):
        return "Ray 리소스 또는 namespace quota가 부족합니다. CPU/Memory/GPU 요청량을 낮추거나 관리자에게 quota 증설을 요청하세요."
    if "gpu" in low and any(token in low for token in ("not found", "unavailable", "cannot", "not enough")):
        return "GPU 리소스를 할당할 수 없습니다. GPU quota, node capacity, Time-Slicing 설정을 확인하세요."
    return text


def _preflight_mlflow_artifact_download(mlflow_uri: str, artifact_uri: str) -> None:
    tmpdir = tempfile.mkdtemp(prefix="pm-artifact-preflight-")
    try:
        import mlflow as _mlflow
        _mlflow.set_tracking_uri(mlflow_uri)
        local = _mlflow.artifacts.download_artifacts(artifact_uri=artifact_uri, dst_path=tmpdir)
        if not local or not Path(local).exists():
            raise RuntimeError("MLflow artifact download result is empty")
        if Path(local).is_dir() and not (Path(local) / "MLmodel").exists():
            raise RuntimeError("MLflow artifact에 MLmodel 파일이 없습니다")
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


def _resolve_mlflow_model_artifact_uri(mlflow_uri: str, run_id: str) -> str:
    """Return a downloadable MLflow model artifact URI for legacy and MLflow 3 runs."""
    try:
        run_resp = httpx.get(
            f"{mlflow_uri}/api/2.0/mlflow/runs/get",
            params={"run_id": run_id},
            timeout=10,
        )
    except Exception as e:
        raise RuntimeError(f"MLflow run 확인 실패: {e}") from e
    if run_resp.status_code != 200:
        detail = run_resp.text
        try:
            detail = run_resp.json().get("message") or detail
        except Exception:  # nosec
            pass
        raise RuntimeError(
            f"MLflow run을 찾을 수 없습니다: run_id={run_id}, uri={mlflow_uri}, "
            f"status={run_resp.status_code}, detail={_compact_text(detail, 500)}"
        )
    run = (run_resp.json().get("run") or {})
    info = run.get("info") or {}
    if info.get("lifecycle_stage") and info.get("lifecycle_stage") != "active":
        raise RuntimeError(
            f"MLflow run이 삭제된 상태입니다: run_id={run_id}, "
            f"lifecycle_stage={info.get('lifecycle_stage')}. AutoML Job을 다시 실행해 주세요."
        )
    for output in ((run.get("outputs") or {}).get("model_outputs") or []):
        model_id = output.get("model_id")
        if model_id:
            return f"models:/{model_id}"
    try:
        artifacts_resp = httpx.get(
            f"{mlflow_uri}/api/2.0/mlflow/artifacts/list",
            params={"run_id": run_id, "path": "model"},
            timeout=10,
        )
        if artifacts_resp.status_code == 200:
            files = artifacts_resp.json().get("files") or []
            paths = {f.get("path") for f in files}
            if "model/MLmodel" in paths or "model/model.joblib" in paths or "model/model.pkl" in paths:
                return f"runs:/{run_id}/model"
    except Exception as e:
        raise RuntimeError(f"MLflow artifact 확인 실패: {e}") from e
    raise RuntimeError(
        f"MLflow 모델 artifact가 없습니다: run_id={run_id}. "
        "현재 AutoML 결과는 서빙할 수 없으니 AutoML Job을 다시 실행해 주세요."
    )


def _ray_url_for_job(info: dict) -> str:
    return info.get("ray_dashboard_url") or tenant_resources.ray_dashboard_url(info.get("namespace")) or RAY_DASHBOARD_URL


def _client(ray_dashboard_url: str) -> JobSubmissionClient:
    if ray_dashboard_url not in _ray_clients:
        _ray_clients[ray_dashboard_url] = JobSubmissionClient(ray_dashboard_url)
    return _ray_clients[ray_dashboard_url]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _submit_ray_job_sync(ray_dashboard_url: str, runtime_env: dict, entrypoint: str) -> str:
    return _client(ray_dashboard_url).submit_job(entrypoint=entrypoint, runtime_env=runtime_env)


def _get_ray_job_status_sync(ray_dashboard_url: str, submission_id: str) -> dict:
    info = _client(ray_dashboard_url).get_job_info(submission_id)
    return {"status": str(info.status), "message": info.message}


def _get_ray_job_logs_sync(ray_dashboard_url: str, submission_id: str) -> str:
    return _client(ray_dashboard_url).get_job_logs(submission_id)


async def _submit_ray_job(ray_dashboard_url: str, runtime_env: dict, entrypoint: str) -> str:
    return await asyncio.to_thread(_submit_ray_job_sync, ray_dashboard_url, runtime_env, entrypoint)


async def _get_ray_job_status(ray_dashboard_url: str, submission_id: str) -> dict:
    return await asyncio.to_thread(_get_ray_job_status_sync, ray_dashboard_url, submission_id)


async def _get_ray_job_logs(ray_dashboard_url: str, submission_id: str) -> str:
    return await asyncio.to_thread(_get_ray_job_logs_sync, ray_dashboard_url, submission_id)


async def submit(req: AutoMLJobRequest, user_email: str, namespace: str, extra: dict | None = None) -> dict:
    global _next_priority
    await _validate_dataset_path(req.dataset_path)
    _validate_namespace_quota(req, namespace)
    job_id = uuid.uuid4().hex[:10]
    experiment_name = f"automl-{namespace}-{req.name}"
    mlflow_uri = tenant_resources.mlflow_tracking_uri(namespace)
    ray_dashboard_url = tenant_resources.ray_dashboard_url(namespace)

    _next_priority += 1
    info = {
        "job_id": job_id,
        "ray_job_id": None,
        "submitted_by": user_email,
        "namespace": namespace,
        "status": "QUEUED",
        "experiment_name": experiment_name,
        "task": req.task,
        "dataset_path": req.dataset_path,
        "target_column": req.target_column,
        "models": req.models,
        "num_trials": req.num_trials,
        "timeout_minutes": req.timeout_minutes,
        "metric": req.metric,
        "test_size": req.test_size,
        "random_state": req.random_state,
        "cpu_per_trial": req.cpu_per_trial,
        "gpu_per_trial": req.gpu_per_trial,
        "memory_per_trial_gb": req.memory_per_trial_gb,
        "top_n": req.top_n,
        "priority": _next_priority,
        "submitted_at": _now(),
        "mlflow_uri": mlflow_uri,
        "mlflow_public_path": tenant_resources.mlflow_public_path(namespace),
        "ray_dashboard_url": ray_dashboard_url,
        "ray_public_path": tenant_resources.ray_public_path(namespace),
        "started_at": None,
        "finished_at": None,
        "best_run": None,
        "message": None,
    }
    if extra:
        for key, value in extra.items():
            if key not in {"job_id", "ray_job_id", "submitted_by", "namespace", "status", "priority", "submitted_at"}:
                info[key] = value
    _persist(info)
    return info


async def _submit_to_ray(info: dict) -> None:
    mlflow_uri = _mlflow_uri_for_job(info)
    ray_dashboard_url = _ray_url_for_job(info)
    cfg = {
        "job_id": info["job_id"],
        "experiment_name": info["experiment_name"],
        "task": info["task"],
        "dataset_path": info["dataset_path"],
        "target_column": info["target_column"],
        "models": info["models"],
        "num_trials": info["num_trials"],
        "test_size": info.get("test_size", 0.2),
        "random_state": info.get("random_state", 42),
        "metric": info.get("metric", "auto"),
        "timeout_minutes": info.get("timeout_minutes", 60),
        "cpu_per_trial": info.get("cpu_per_trial", 1.0),
        "gpu_per_trial": info.get("gpu_per_trial", 0.0),
        "memory_per_trial_gb": info.get("memory_per_trial_gb", 2.0),
        "top_n": info.get("top_n", 3),
        "submitted_by": info.get("submitted_by", ""),
        "namespace": info.get("namespace", ""),
        "mlflow_uri": mlflow_uri,
    }
    needs_torch = any(m in ("mlp", "tabnet") for m in info.get("models", []))
    # 서빙 런타임(MLServer 1.7.1, sklearn 1.7.0)과 minor 일치 유지
    # 1.8 은 MLServer 업그레이드 전까지 금지
    pip_list = [
        "mlflow>=3.0", "optuna",
        "scikit-learn>=1.7,<1.8",
        "xgboost", "lightgbm", "pandas", "pyarrow",
    ]
    if needs_torch:
        pip_list += ["torch", "pytorch-tabnet"]
    runtime_env = {
        "working_dir": str(RUNNER_DIR),
        "pip": pip_list,
        "env_vars": {"MLFLOW_TRACKING_URI": mlflow_uri},
    }
    entrypoint = f"python job.py --config '{json.dumps(cfg)}'"
    try:
        submission_id = await _submit_ray_job(ray_dashboard_url, runtime_env, entrypoint)
        info["ray_job_id"] = submission_id
        info["status"] = "PENDING"
        info["started_at"] = _now()
    except Exception as e:
        info["status"] = "FAILED"
        info["finished_at"] = _now()
        info["message"] = "Ray submit 실패: " + _friendly_ray_error_message(e)
    _persist(info)


def _ns_running_count(namespace: str) -> int:
    return sum(
        1 for j in _jobs.values()
        if j["namespace"] == namespace and j["status"] in ("PENDING", "RUNNING")
    )


def _queued_ordered() -> list[dict]:
    return sorted(
        [j for j in _jobs.values() if j["status"] == "QUEUED"],
        key=lambda j: (j["priority"], j["submitted_at"]),
    )


_MAX_SUBMIT_RETRY = int(os.environ.get("AUTOML_MAX_SUBMIT_RETRY", "5"))


async def _scheduler_loop() -> None:
    while True:
        try:
            # 1) PENDING/RUNNING 인 job 들의 Ray status 동기화 — 안 하면 _ns_running_count 가
            #    낡은 카운트로 새 job 못 picking up
            for j in list(_jobs.values()):
                if j.get("ray_job_id") and j["status"] in ("PENDING", "RUNNING"):
                    try:
                        await refresh_status(j["job_id"])
                    except Exception as e:
                        logger.debug(f"[automl scheduler] refresh {j['job_id']} failed: {e}")

            # 2) QUEUED job 들 Ray 에 제출
            for job in _queued_ordered():
                if _ns_running_count(job["namespace"]) >= MAX_CONCURRENT_PER_NS:
                    continue
                try:
                    await _submit_to_ray(job)
                except Exception as e:
                    # job 단위 실패는 루프 전체를 멈추지 않음
                    retry = int(job.get("submit_retry_count", 0)) + 1
                    job["submit_retry_count"] = retry
                    logger.error(
                        f"[automl scheduler] submit job_id={job['job_id']} "
                        f"ns={job.get('namespace')} retry={retry}/{_MAX_SUBMIT_RETRY}: "
                        f"{type(e).__name__}: {e}",
                        exc_info=True,
                    )
                    if retry >= _MAX_SUBMIT_RETRY:
                        job["status"] = "FAILED"
                        job["finished_at"] = _now()
                        job["message"] = (
                            f"Ray 제출 {retry}회 연속 실패. 마지막 에러: "
                            + _friendly_ray_error_message(e)
                        )
                        logger.error(
                            f"[automl scheduler] job_id={job['job_id']} "
                            f"FAILED after {retry} retries"
                        )
                    _persist(job)
        except Exception as e:
            # 루프 자체 예외 (deserialization 등) — 다음 tick에 재시도
            logger.exception(
                f"[automl scheduler] loop iteration error: {type(e).__name__}: {e}"
            )
        await asyncio.sleep(SCHEDULER_INTERVAL)


def start_scheduler() -> None:
    global _scheduler_task
    if _scheduler_task is None or _scheduler_task.done():
        _scheduler_task = asyncio.create_task(_scheduler_loop())


def queue_position(job_id: str) -> int | None:
    job = _jobs.get(job_id)
    if not job or job["status"] != "QUEUED":
        return None
    ordered = _queued_ordered()
    for idx, j in enumerate(ordered):
        if j["namespace"] == job["namespace"] and j["job_id"] == job_id:
            # position 기준: 같은 namespace 내에서만 의미
            same_ns_queue = [x for x in ordered if x["namespace"] == job["namespace"]]
            for i, s in enumerate(same_ns_queue):
                if s["job_id"] == job_id:
                    return i + 1 + _ns_running_count(job["namespace"])
    return None


def cancel(job_id: str, requester_email: str, is_admin_user: bool) -> bool:
    job = _jobs.get(job_id)
    if not job:
        return False
    if not is_admin_user and job["submitted_by"] != requester_email:
        return False
    if job["status"] != "QUEUED":
        return False
    job["status"] = "CANCELED"
    job["finished_at"] = _now()
    job["message"] = f"{requester_email}에 의해 취소됨"
    _persist(job)
    return True


def list_available_notebooks(namespaces: list[str]) -> list[dict]:
    """주어진 namespaces에서 실행 중인 Kubeflow Notebook 목록."""
    core_v1 = kubernetes_client.core_v1()

    out = []
    for ns in namespaces:
        try:
            items = core_v1.list_namespaced_pod(ns).items
        except Exception:  # nosec
            continue
        for p in items:
            labels = p.metadata.labels or {}
            nb_name = labels.get("notebook-name")
            if not nb_name:
                continue
            if p.status.phase != "Running":
                continue
            all_ready = all(c.ready for c in (p.status.container_statuses or []))
            if not all_ready:
                continue
            out.append({
                "namespace": ns,
                "notebook_name": nb_name,
                "pod_name": p.metadata.name,
            })
    return out


def create_notebook_file(job_id: str, run_id: str, rank: int, model_id: str, namespace: str, target_namespace: str | None = None, target_notebook: str | None = None) -> dict:
    """사용자 namespace에서 실행 중인 첫 번째 Notebook의 PVC에 .ipynb 파일을 생성.
    - 가장 최근 Notebook Pod 찾기
    - exec으로 /home/jovyan/automl_<jobid>_<model>.ipynb 생성
    """
    from kubernetes.stream import stream
    core_v1 = kubernetes_client.core_v1()

    # 실행 중인 노트북 파드 검색 (notebook-name 라벨 기반)
    def _find_notebook_pods(ns: str) -> list:
        try:
            items = core_v1.list_namespaced_pod(ns).items
        except Exception:
            return []
        result = []
        for p in items:
            labels = p.metadata.labels or {}
            if "notebook-name" not in labels:
                continue
            if p.status.phase != "Running":
                continue
            all_ready = all(c.ready for c in (p.status.container_statuses or []))
            if all_ready:
                result.append(p)
        return result

    job_info = _jobs.get(job_id)
    mlflow_uri = _mlflow_uri_for_job(job_info or {"namespace": namespace})
    model_artifact_uri = _resolve_mlflow_model_artifact_uri(mlflow_uri, run_id)

    # 사용자가 target을 명시했으면 그걸 사용
    if target_namespace and target_notebook:
        candidates = _find_notebook_pods(target_namespace)
        matched = [p for p in candidates if (p.metadata.labels or {}).get("notebook-name") == target_notebook]
        if not matched:
            raise RuntimeError(f"선택한 노트북 '{target_namespace}/{target_notebook}'이 실행 중이 아닙니다.")
        target_pod = matched[0]
        namespace = target_namespace
    else:
        # 자동 검색: 요청자 namespace → Job namespace
        running = _find_notebook_pods(namespace)
        searched_ns = [namespace]
        if not running and job_info and job_info.get("namespace") and job_info["namespace"] != namespace:
            searched_ns.append(job_info["namespace"])
            running = _find_notebook_pods(job_info["namespace"])
            if running:
                namespace = job_info["namespace"]
        if not running:
            raise RuntimeError(f"실행 중인 노트북이 없습니다. Kubeflow Notebook을 먼저 시작해주세요. (검색한 namespace: {', '.join(searched_ns)})")
        target_pod = running[0]
    pod_name = target_pod.metadata.name
    nb_name = target_pod.metadata.labels.get("notebook-name", pod_name)
    container = nb_name  # notebook container 이름은 notebook name과 동일

    notebook_json = {
        "cells": [
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "# AutoML 결과 탐색\n",
                    f"- **Job ID**: `{job_id}`\n",
                    f"- **Model**: `{model_id}` (rank {rank})\n",
                    f"- **MLflow Run ID**: `{run_id}`\n",
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "import mlflow, os, joblib, json\n",
                    f"mlflow.set_tracking_uri('{mlflow_uri}')\n",
                    f"model_artifact_uri = '{model_artifact_uri}'\n",
                    "local_dir = mlflow.artifacts.download_artifacts(artifact_uri=model_artifact_uri)\n",
                    "joblib_path = os.path.join(local_dir, 'model.joblib')\n",
                    "if os.path.exists(joblib_path):\n",
                    "    model = joblib.load(joblib_path)\n",
                    "else:\n",
                    "    model = mlflow.pyfunc.load_model(model_artifact_uri)\n",
                    "with open(os.path.join(local_dir, 'features.json')) as f:\n",
                    "    feats = json.load(f)\n",
                    "print('Features:', feats['columns'])\n",
                    "print('Target:', feats['target'])\n",
                    "model\n",
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": ["## 예측 예시\n\n`your_data.csv`를 실제 데이터로 교체하세요."]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "# import pandas as pd\n",
                    "# df = pd.read_csv('your_data.csv')\n",
                    "# preds = model.predict(df[feats['columns']].fillna(0))\n",
                    "# preds[:10]\n",
                ]
            },
        ],
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python", "version": "3.10"}
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }

    filename = f"automl_{job_id}_{model_id}_rank{rank}.ipynb"
    filepath = f"/home/jovyan/{filename}"
    content_b64 = json.dumps(notebook_json).encode("utf-8")
    import base64
    encoded = base64.b64encode(content_b64).decode()

    cmd = ["sh", "-c", f"echo {encoded} | base64 -d > {filepath} && chown 1000:100 {filepath} 2>/dev/null || true && echo OK"]
    try:
        stream(
            core_v1.connect_get_namespaced_pod_exec,
            pod_name, namespace,
            container=container,
            command=cmd,
            stderr=True, stdin=False, stdout=True, tty=False,
        )
    except Exception as e:
        raise RuntimeError(f"노트북에 파일 생성 실패: {e}")

    return {
        "notebook_pod": pod_name,
        "notebook_name": nb_name,
        "file_path": filepath,
        "open_url": f"/notebook/{namespace}/{nb_name}/lab/tree/{filename}",
    }


async def deploy_to_kserve(
    job_id: str, run_id: str, rank: int, model_id: str, namespace: str,
    serving_name: str | None = None,
) -> dict:
    """Top-N 모델을 KServe InferenceService로 배포.
    - MLflow artifact를 PVC에 복사하는 helper Pod 생성
    - InferenceService 생성 (sklearn runtime, v2 protocol)
    - serving_name 이 주어지면 ISVC 이름으로 사용, 없으면 automl-{jobid}-{model}-r{rank} 자동 생성
    """
    from kubernetes import client
    import re as _re
    core_v1 = kubernetes_client.core_v1()
    custom = kubernetes_client.custom_objects()
    job_info = _jobs.get(job_id) or {"namespace": namespace}
    mlflow_uri = _mlflow_uri_for_job(job_info)

    def _compact(text: str | None, limit: int = 1600) -> str:
        return _compact_text(text, limit)

    def _read_helper_logs() -> str:
        try:
            return _compact(core_v1.read_namespaced_pod_log(helper_name, namespace, container="copier"))
        except Exception as e:
            return f"helper log 조회 실패: {e}"

    def _delete_helper() -> None:
        try:
            core_v1.delete_namespaced_pod(helper_name, namespace, grace_period_seconds=0)
        except Exception:  # nosec
            pass

    def _delete_pvc() -> None:
        try:
            core_v1.delete_namespaced_persistent_volume_claim(pvc_name, namespace)
        except Exception:  # nosec
            pass

    def _delete_isvc() -> None:
        try:
            custom.delete_namespaced_custom_object(
                "serving.kserve.io", "v1beta1", namespace, "inferenceservices", isvc_name
            )
        except Exception:  # nosec
            pass

    def _container_state_summary(container_status) -> str:
        if not container_status:
            return "kserve-container 상태 없음"
        state = container_status.state
        if state and state.waiting:
            return f"waiting={state.waiting.reason or ''} restarts={container_status.restart_count}"
        if state and state.terminated:
            return (
                f"terminated={state.terminated.reason or ''} "
                f"exit_code={state.terminated.exit_code} restarts={container_status.restart_count}"
            )
        if state and state.running:
            return f"running ready={container_status.ready} restarts={container_status.restart_count}"
        return f"ready={container_status.ready} restarts={container_status.restart_count}"

    def _read_pod_logs(pod_name: str) -> str:
        try:
            return _compact(core_v1.read_namespaced_pod_log(pod_name, namespace, container="kserve-container"))
        except Exception as e:
            return f"predictor log 조회 실패: {e}"

    async def _wait_for_predictor_ready(timeout_seconds: int = 180) -> None:
        import time as _t
        deadline = _t.time() + timeout_seconds
        last_state = "predictor pod 생성 대기"
        while _t.time() < deadline:
            try:
                pods = core_v1.list_namespaced_pod(
                    namespace,
                    label_selector=f"serving.kserve.io/inferenceservice={isvc_name}",
                ).items
            except Exception as e:
                last_state = f"predictor pod 조회 실패: {e}"
                pods = []
            for pod in pods:
                statuses = pod.status.container_statuses or []
                kserve_status = next((s for s in statuses if s.name == "kserve-container"), None)
                pod_ready = any(
                    c.type == "Ready" and c.status == "True"
                    for c in (pod.status.conditions or [])
                )
                state_summary = _container_state_summary(kserve_status)
                last_state = f"{pod.metadata.name}: phase={pod.status.phase}, {state_summary}"
                if kserve_status and kserve_status.ready and pod_ready:
                    return
                waiting_reason = None
                if kserve_status and kserve_status.state and kserve_status.state.waiting:
                    waiting_reason = kserve_status.state.waiting.reason
                if waiting_reason in {
                    "CrashLoopBackOff",
                    "ImagePullBackOff",
                    "ErrImagePull",
                    "CreateContainerConfigError",
                }:
                    logs = _read_pod_logs(pod.metadata.name)
                    raise RuntimeError(f"KServe predictor가 Ready 되지 않았습니다: {last_state}. logs={logs}")
            await asyncio.sleep(3)
        raise RuntimeError(f"KServe predictor Ready 대기 timeout: {last_state}")

    short_id = job_id[:8].lower()
    if serving_name:
        # K8s DNS-1123 label: lowercase alphanumeric + hyphens, must start with letter, max 50
        sanitized = _re.sub(r"[^a-z0-9-]", "-", serving_name.lower())
        sanitized = _re.sub(r"-+", "-", sanitized).strip("-")
        if not sanitized or not sanitized[0].isalpha():
            sanitized = f"s-{sanitized}" if sanitized else f"automl-{short_id}"
        isvc_name = sanitized[:50].rstrip("-")
    else:
        isvc_name = f"automl-{short_id}-{model_id}-r{rank}".lower().replace("_", "-")[:50]
    pvc_name = f"{isvc_name}-pvc"[:60]
    helper_name = f"{isvc_name}-copy"[:63]

    # 배포 전 MLflow run/model 구조와 실제 artifact 다운로드를 먼저 확인한다.
    # 실패하면 PVC/ISVC를 만들지 않아 누락 artifact가 볼륨을 남기지 않는다.
    model_artifact_uri = _resolve_mlflow_model_artifact_uri(mlflow_uri, run_id)
    _preflight_mlflow_artifact_download(mlflow_uri, model_artifact_uri)

    # 1) PVC 생성
    created_pvc = False
    pvc_body = client.V1PersistentVolumeClaim(
        metadata=client.V1ObjectMeta(name=pvc_name, namespace=namespace),
        spec=client.V1PersistentVolumeClaimSpec(
            access_modes=["ReadWriteOnce"],
            resources=client.V1ResourceRequirements(requests={"storage": "1Gi"}),
        ),
    )
    try:
        core_v1.create_namespaced_persistent_volume_claim(namespace, pvc_body)
        created_pvc = True
    except client.ApiException as e:
        if e.status != 409:
            raise

    # 2) Helper Pod로 MLflow artifact를 PVC에 복사
    # MLflow 3.x LoggedModels 호환 — MLflow image 사용 (mlflow Python client 사전 설치됨)
    script = f"""
set -e
mkdir -p /target/model
python3 <<'PYEOF'
import os, shutil, mlflow
mlflow.set_tracking_uri('{mlflow_uri}')
# MLflow 2 legacy 는 runs:/..., MLflow 3 LoggedModel 은 models:/... 사용
local = mlflow.artifacts.download_artifacts(artifact_uri='{model_artifact_uri}')
print('downloaded to', local)
if not local or not os.path.isdir(local):
    raise RuntimeError(f'MLflow artifact download failed: {{local}}')
if not os.path.exists(os.path.join(local, 'MLmodel')):
    raise RuntimeError('MLflow artifact is missing MLmodel')
# 다운로드 검증 후 기존 파일 제거
for name in os.listdir('/target/model'):
    path = os.path.join('/target/model', name)
    if os.path.isdir(path):
        shutil.rmtree(path)
    else:
        os.unlink(path)
# /target/model 로 옮기기
for name in os.listdir(local):
    src = os.path.join(local, name)
    dst = os.path.join('/target/model', name)
    if os.path.isfile(src):
        shutil.copy2(src, dst)
    elif os.path.isdir(src):
        shutil.copytree(src, dst, dirs_exist_ok=True)
print('files in /target/model:')
for f in sorted(os.listdir('/target/model')):
    print(' -', f)

# legacy: model.pkl 없고 model.joblib 있으면 링크
if not os.path.exists('/target/model/model.pkl') and os.path.exists('/target/model/model.joblib'):
    shutil.copy2('/target/model/model.joblib', '/target/model/model.pkl')
PYEOF
ls -la /target/model
sleep 5
"""
    pod_body = client.V1Pod(
        metadata=client.V1ObjectMeta(
            name=helper_name,
            namespace=namespace,
            annotations={"sidecar.istio.io/inject": "false"},
        ),
        spec=client.V1PodSpec(
            restart_policy="Never",
            security_context=client.V1PodSecurityContext(run_as_user=0, fs_group=0),
            containers=[client.V1Container(
                name="copier",
                image="ghcr.io/mlflow/mlflow:v3.0.0",
                command=["sh", "-c"],
                args=["chmod 777 /target; " + script],
                security_context=client.V1SecurityContext(run_as_user=0),
                resources=client.V1ResourceRequirements(
                    requests={"cpu": "100m", "memory": "512Mi"},
                    limits={"cpu": "1", "memory": "2Gi"},
                ),
                volume_mounts=[client.V1VolumeMount(name="model-pvc", mount_path="/target")],
            )],
            volumes=[client.V1Volume(
                name="model-pvc",
                persistent_volume_claim=client.V1PersistentVolumeClaimVolumeSource(claim_name=pvc_name),
            )],
        ),
    )
    try:
        core_v1.delete_namespaced_pod(helper_name, namespace)
    except client.ApiException:
        pass
    for _ in range(20):
        try:
            core_v1.read_namespaced_pod(helper_name, namespace)
            await asyncio.sleep(1)
        except client.ApiException as e:
            if e.status == 404:
                break
    try:
        core_v1.create_namespaced_pod(namespace, pod_body)
    except Exception:
        if created_pvc:
            _delete_pvc()
        raise

    # 3) copy 완료 대기 (최대 90초). 실패하면 ISVC를 만들지 않는다.
    import time as _t
    helper_phase = None
    deadline = _t.time() + 90
    while _t.time() < deadline:
        try:
            p = core_v1.read_namespaced_pod(helper_name, namespace)
            if p.status.phase in ("Succeeded", "Failed"):
                helper_phase = p.status.phase
                break
        except Exception:  # nosec
            pass
        await asyncio.sleep(2)
    if helper_phase != "Succeeded":
        logs = _read_helper_logs()
        _delete_helper()
        if created_pvc:
            _delete_pvc()
        raise RuntimeError(
            f"모델 artifact 복사 실패: helper pod phase={helper_phase or 'Timeout'}. "
            f"logs={logs}"
        )

    # 4) InferenceService 생성 (실험용 — scale-to-zero 강제)
    isvc = {
        "apiVersion": "serving.kserve.io/v1beta1",
        "kind": "InferenceService",
        "metadata": {
            "name": isvc_name,
            "namespace": namespace,
            "annotations": {
                "sidecar.istio.io/inject": "false",
                "serving.kserve.io/deploymentMode": "Serverless",
                "automl.job_id": job_id,
                "automl.model_id": model_id,
                "automl.rank": str(rank),
                "autoscaling.knative.dev/min-scale": "0",
                "autoscaling.knative.dev/scale-to-zero-pod-retention-period": "30s",
            },
        },
        "spec": {
            "predictor": {
                "serviceAccountName": "default-editor",
                "minReplicas": 0,
                "maxReplicas": 1,
                "model": {
                    "modelFormat": {"name": "mlflow"},
                    "protocolVersion": "v2",
                    "storageUri": f"pvc://{pvc_name}/model",
                },
            }
        },
    }
    isvc_existed = False
    try:
        custom.get_namespaced_custom_object(
            "serving.kserve.io", "v1beta1", namespace, "inferenceservices", isvc_name
        )
        isvc_existed = True
    except client.ApiException as e:
        if e.status != 404:
            raise
    try:
        custom.create_namespaced_custom_object(
            group="serving.kserve.io",
            version="v1beta1",
            namespace=namespace,
            plural="inferenceservices",
            body=isvc,
        )
    except client.ApiException as e:
        if e.status == 409:
            # 이미 있으면 replace
            try:
                existing = custom.get_namespaced_custom_object(
                    "serving.kserve.io", "v1beta1", namespace, "inferenceservices", isvc_name
                )
                isvc["metadata"]["resourceVersion"] = existing["metadata"]["resourceVersion"]
                custom.replace_namespaced_custom_object(
                    "serving.kserve.io", "v1beta1", namespace, "inferenceservices", isvc_name, isvc
                )
            except Exception:
                _delete_helper()
                if created_pvc:
                    _delete_pvc()
                raise
        else:
            _delete_helper()
            if created_pvc:
                _delete_pvc()
            raise
    except Exception:
        _delete_helper()
        if created_pvc:
            _delete_pvc()
        raise

    # 5) Helper Pod 정리
    _delete_helper()

    try:
        await _wait_for_predictor_ready()
    except Exception:
        if not isvc_existed:
            _delete_isvc()
            if created_pvc:
                _delete_pvc()
        raise

    return {
        "isvc_name": isvc_name,
        "isvc_url": f"http://{isvc_name}.{namespace}.svc.cluster.local",
        "namespace": namespace,
        "pvc_name": pvc_name,
    }


def delete(job_id: str, requester_email: str, is_admin_user: bool, delete_mlflow: bool = True) -> dict:
    """Archive a finished Job and clean disposable runtime resources.

    The AutoML job record remains in PostgreSQL so users can inspect its final
    state from the archived view. Runtime-serving resources and temporary
    MLflow artifacts may be cleaned to avoid resource drift.
    """
    job = _jobs.get(job_id)
    if not job:
        return {"deleted": False, "reason": "job_not_found"}
    if not is_admin_user and job["submitted_by"] != requester_email:
        return {"deleted": False, "reason": "forbidden"}
    if job["status"] in ("QUEUED", "PENDING", "RUNNING"):
        raise ValueError("실행 중인 Job은 먼저 중지/취소해야 합니다")

    namespace = job.get("namespace") or ""
    mlflow_uri = _mlflow_uri_for_job(job)
    result = {
        "deleted": True,
        "archived": True,
        "job_id": job_id,
        "isvc_deleted": [],
        "pvc_deleted": [],
        "helper_pods_deleted": [],
        "runs_deleted": 0,
        "artifacts_purged": 0,
        "experiment_deleted": False,
    }

    # ---- K8s 리소스 정리 (ISVC, PVC, helper pod) ----
    if namespace:
        try:
            core_v1 = kubernetes_client.core_v1()
            custom_api = kubernetes_client.custom_objects()

            # ISVC: annotation 이 이 job_id 인 것만 정리
            try:
                isvcs = custom_api.list_namespaced_custom_object(
                    "serving.kserve.io", "v1beta1", namespace, "inferenceservices"
                )
                for isvc in isvcs.get("items", []):
                    annos = isvc.get("metadata", {}).get("annotations", {}) or {}
                    if annos.get("automl.job_id") != job_id:
                        continue
                    isvc_name = isvc["metadata"]["name"]
                    try:
                        custom_api.delete_namespaced_custom_object(
                            "serving.kserve.io", "v1beta1", namespace, "inferenceservices", isvc_name
                        )
                        result["isvc_deleted"].append(f"{namespace}/{isvc_name}")
                    except Exception:  # nosec
                        pass
                    pvc_candidate = f"{isvc_name}-pvc"[:60]
                    try:
                        core_v1.delete_namespaced_persistent_volume_claim(pvc_candidate, namespace)
                        result["pvc_deleted"].append(f"{namespace}/{pvc_candidate}")
                    except Exception:  # nosec
                        pass
            except Exception as e:
                print(f"[automl-delete] isvc cleanup failed: {e}", flush=True)

            # Helper pod: 이 job 의 ISVC copy pod 들 (Succeeded/Failed 다)
            try:
                pods = core_v1.list_namespaced_pod(namespace)
                for p in pods.items:
                    n = p.metadata.name
                    # automl-<job_id_short>-<model>-r<rank>-copy
                    if n.startswith(f"automl-{job_id[:8].lower()}-") and n.endswith("-copy"):
                        try:
                            core_v1.delete_namespaced_pod(n, namespace, grace_period_seconds=0)
                            result["helper_pods_deleted"].append(f"{namespace}/{n}")
                        except Exception:  # nosec
                            pass
            except Exception as e:
                print(f"[automl-delete] helper pod cleanup failed: {e}", flush=True)
        except Exception as e:
            print(f"[automl-delete] k8s cleanup init failed: {e}", flush=True)

    # ---- MLflow Experiment + Run hard delete ----
    exp_id = None
    run_ids_to_purge: list[str] = []
    artifact_paths: list[str] = []
    if delete_mlflow and job.get("experiment_name"):
        try:
            import httpx
            r = httpx.get(
                f"{mlflow_uri}/api/2.0/mlflow/experiments/get-by-name",
                params={"experiment_name": job["experiment_name"]},
                timeout=10,
            )
            if r.status_code == 200:
                exp_id = (r.json().get("experiment") or {}).get("experiment_id")
        except Exception as e:
            print(f"[automl-delete] experiment lookup failed: {e}", flush=True)

    if exp_id:
        # 이 experiment 의 모든 active run 조회
        try:
            import httpx
            sr = httpx.post(
                f"{mlflow_uri}/api/2.0/mlflow/runs/search",
                json={"experiment_ids": [exp_id], "max_results": 1000, "run_view_type": "ALL"},
                timeout=15,
            )
            if sr.status_code == 200:
                for run in sr.json().get("runs", []):
                    info = run.get("info") or {}
                    rid = info.get("run_id")
                    uri = info.get("artifact_uri") or ""
                    if rid:
                        run_ids_to_purge.append(rid)
                    if uri.startswith("mlflow-artifacts:/"):
                        artifact_paths.append(uri.replace("mlflow-artifacts:/", ""))
        except Exception as e:
            print(f"[automl-delete] run search failed: {e}", flush=True)

        # Experiment 삭제 (Experiment 삭제하면 run 도 cascade soft delete)
        try:
            import httpx
            httpx.post(
                f"{mlflow_uri}/api/2.0/mlflow/experiments/delete",
                json={"experiment_id": exp_id},
                timeout=10,
            )
            result["experiment_deleted"] = True
        except Exception as e:
            print(f"[automl-delete] experiment delete failed: {e}", flush=True)

    # ---- Artifact 파일 실제 제거 + mlflow gc ----
    if run_ids_to_purge or artifact_paths or exp_id:
        try:
            from kubernetes.stream import stream
            core_v1 = kubernetes_client.core_v1()
            mlflow_ref = tenant_resources.find_mlflow_pod(core_v1, namespace)
            if mlflow_ref:
                mlflow_ns, mlflow_pod = mlflow_ref
                # artifact 파일 제거 (경로 traversal 방지)
                for rel in artifact_paths:
                    if ".." in rel or rel.startswith("/"):
                        continue
                    try:
                        stream(
                            core_v1.connect_get_namespaced_pod_exec,
                            mlflow_pod, mlflow_ns,
                            command=["sh", "-c", f"rm -rf /mlflow/mlartifacts/{rel}"],
                            stderr=True, stdin=False, stdout=True, tty=False,
                        )
                        result["artifacts_purged"] += 1
                    except Exception:  # nosec
                        pass
                # Experiment 디렉토리 통째로 제거 (experiment_id 기준)
                if exp_id:
                    try:
                        stream(
                            core_v1.connect_get_namespaced_pod_exec,
                            mlflow_pod, mlflow_ns,
                            command=["sh", "-c", f"rm -rf /mlflow/mlartifacts/{exp_id}"],
                            stderr=True, stdin=False, stdout=True, tty=False,
                        )
                    except Exception:  # nosec
                        pass
                # mlflow gc — DB tombstone 영구 제거
                try:
                    run_args = " ".join(run_ids_to_purge) if run_ids_to_purge else ""
                    cmd = (
                        "mlflow gc "
                        '--backend-store-uri "$MLFLOW_BACKEND_STORE_URI" '
                        "--artifacts-destination file:///mlflow/mlartifacts "
                        "--older-than 0d0h0m0s"
                    )
                    if run_args:
                        cmd += f" --run-ids {run_args}"
                    cmd += " || true"
                    stream(
                        core_v1.connect_get_namespaced_pod_exec,
                        mlflow_pod, mlflow_ns,
                        command=["sh", "-c", cmd],
                        stderr=True, stdin=False, stdout=True, tty=False,
                    )
                    result["runs_deleted"] = len(run_ids_to_purge)
                except Exception as e:
                    print(f"[automl-delete] mlflow gc failed: {e}", flush=True)
        except Exception as e:
            print(f"[automl-delete] artifact purge init failed: {e}", flush=True)

    # ---- PostgreSQL + in-memory 이력 보존 ----
    job["status"] = "DELETED"
    job["deleted_at"] = _now()
    job["finished_at"] = job.get("finished_at") or job["deleted_at"]
    job["message"] = "보관 완료: 기본 목록에서는 숨기고 보관됨 필터에서 로그 확인용 이력을 유지합니다."
    job["cleanup_result"] = result
    _persist(job)
    return result


def promote(job_id: str, requester_email: str, is_admin_user: bool) -> bool:
    if not is_admin_user:
        return False
    job = _jobs.get(job_id)
    if not job or job["status"] != "QUEUED":
        return False
    current_min = min((j["priority"] for j in _jobs.values() if j["status"] == "QUEUED"), default=0)
    job["priority"] = current_min - 1
    job["message"] = f"관리자 {requester_email}가 우선순위 상향"
    _persist(job)
    return True


def _terminal_status(status: str | None) -> bool:
    return str(status or "").upper() in {"SUCCEEDED", "FAILED", "STOPPED", "CANCELED", "DELETED"}


def _feedback_ids_set(values) -> set[int]:
    out: set[int] = set()
    for value in values or []:
        try:
            out.add(int(value))
        except (TypeError, ValueError):
            continue
    return out


def _feedback_job_summary(job: dict) -> dict:
    return {
        "job_id": job.get("job_id"),
        "experiment_name": job.get("experiment_name"),
        "status": job.get("status"),
        "submitted_at": job.get("submitted_at"),
        "finished_at": job.get("finished_at"),
        "source": job.get("source"),
        "source_model": job.get("source_model"),
        "source_version": job.get("source_version"),
        "feedback_export_id": job.get("feedback_export_id"),
        "source_feedback_ids": job.get("source_feedback_ids") or [],
        "feedback_dataset_stale": bool(job.get("feedback_dataset_stale") or job.get("stale")),
        "stale_reason": job.get("stale_reason"),
        "stale_at": job.get("stale_at"),
        "stale_feedback_ids": job.get("stale_feedback_ids") or [],
        "can_delete": _terminal_status(job.get("status")),
    }


def feedback_jobs_for_model(model_name: str, stale_only: bool = False) -> list[dict]:
    rows = []
    for job in _jobs.values():
        if job.get("source") != "feedback" or job.get("source_model") != model_name:
            continue
        if stale_only and not (job.get("feedback_dataset_stale") or job.get("stale")):
            continue
        rows.append(_feedback_job_summary(job))
    return sorted(rows, key=lambda j: j.get("submitted_at") or "", reverse=True)


def mark_feedback_jobs_stale(
    model_name: str,
    *,
    feedback_ids: list[int] | None = None,
    export_ids: list[str] | None = None,
    stale_by: str = "",
    force_all: bool = False,
) -> list[dict]:
    deleted_ids = _feedback_ids_set(feedback_ids)
    export_set = {str(v) for v in (export_ids or []) if str(v or "").strip()}
    touched = []
    for job in list(_jobs.values()):
        if job.get("source") != "feedback" or job.get("source_model") != model_name:
            continue
        source_ids = _feedback_ids_set(job.get("source_feedback_ids") or [])
        matched_ids = sorted(source_ids & deleted_ids)
        export_match = bool(job.get("feedback_export_id") and job.get("feedback_export_id") in export_set)
        if not (matched_ids or export_match or force_all):
            continue
        existing = _feedback_ids_set(job.get("stale_feedback_ids") or [])
        job["feedback_dataset_stale"] = True
        job["stale"] = True
        job["stale_reason"] = "feedback_deleted"
        job["stale_feedback_ids"] = sorted(existing | set(matched_ids) | (deleted_ids if force_all else set()))
        job["stale_at"] = _now()
        job["stale_by"] = stale_by
        _persist(job)
        touched.append(_feedback_job_summary(job))
    return sorted(touched, key=lambda j: j.get("submitted_at") or "", reverse=True)


def list_jobs(
    namespace: str | None = None,
    is_admin: bool = False,
    *,
    view: str = "active",
) -> list[dict]:
    """List AutoML jobs.

    Deleted jobs are kept as archived audit records so their logs can still be
    inspected. The default view hides them from the day-to-day job list.
    """
    normalized_view = str(view or "active").lower()
    if is_admin:
        rows = list(_jobs.values())
    else:
        rows = [j for j in _jobs.values() if j["namespace"] == namespace]

    if normalized_view in {"archived", "deleted"}:
        rows = [j for j in rows if str(j.get("status") or "").upper() == "DELETED"]
    elif normalized_view in {"all", "전체"}:
        pass
    else:
        rows = [j for j in rows if str(j.get("status") or "").upper() != "DELETED"]

    return sorted(rows, key=lambda j: j["submitted_at"], reverse=True)


def purge_archived_jobs(
    namespace: str | None = None,
    is_admin: bool = False,
    *,
    scope: str = "current",
) -> dict:
    """Permanently remove archived AutoML job records from memory and DB.

    The normal delete action archives a job as DELETED so logs can still be
    inspected. This function is an admin cleanup path for removing those audit
    rows when the archived list becomes too noisy. Runtime resources and MLflow
    artifacts are already cleaned during the archive step.
    """
    if not is_admin:
        raise PermissionError("관리자만 보관 이력을 영구 삭제할 수 있습니다")

    normalized_scope = str(scope or "current").lower()
    rows = []
    for job in list(_jobs.values()):
        if str(job.get("status") or "").upper() != "DELETED":
            continue
        if normalized_scope != "all" and namespace and job.get("namespace") != namespace:
            continue
        rows.append(job)

    job_ids = [str(job["job_id"]) for job in rows if job.get("job_id")]
    _db_delete_many(job_ids)
    for job_id in job_ids:
        _jobs.pop(job_id, None)

    return {
        "purged": len(job_ids),
        "job_ids": job_ids,
        "scope": "all" if normalized_scope == "all" else "current",
        "namespace": None if normalized_scope == "all" else namespace,
    }


def get(job_id: str) -> dict | None:
    return _jobs.get(job_id)


async def refresh_status(job_id: str) -> dict | None:
    info = _jobs.get(job_id)
    if not info or not info.get("ray_job_id"):
        return info
    if info["status"] in ("SUCCEEDED", "FAILED", "STOPPED", "CANCELED", "DELETED"):
        return info
    try:
        ray_dashboard_url = _ray_url_for_job(info)
        status = await _get_ray_job_status(ray_dashboard_url, info["ray_job_id"])
        info["status"] = status.get("status", info["status"])
        if status.get("status") in ("SUCCEEDED", "FAILED", "STOPPED"):
            info["finished_at"] = _now()
            info["message"] = _friendly_ray_error_message(status.get("message") or "")
            # parse RESULT_JSON from logs
            try:
                logs = await _get_ray_job_logs(ray_dashboard_url, info["ray_job_id"])
                for line in logs.splitlines():
                    if RESULT_MARKER in line:
                        info["best_run"] = json.loads(line.split(RESULT_MARKER, 1)[1])
            except Exception:  # nosec
                pass
            if status.get("status") in ("SUCCEEDED", "FAILED") and not (info.get("best_run") or {}).get("best"):
                info["status"] = "FAILED"
                info["message"] = _best_failure_message(info.get("best_run"))
            _persist(info)
    except Exception as e:
        info["message"] = f"status refresh 실패: {e}"
        _persist(info)
    return info


PROGRESS_MARKER = "[AutoML] PROGRESS="
RESULT_MARKER = "[AutoML] RESULT_JSON="


def _best_failure_message(best_run: dict | None) -> str:
    base = "유효한 best 모델이 생성되지 않았습니다."
    if not isinstance(best_run, dict):
        return base + " 데이터셋 경로, target 컬럼, feature 타입 또는 trial 오류 로그를 확인하세요."
    errors = []
    for row in best_run.get("per_model") or []:
        if row.get("best_metric") is not None:
            continue
        err = str(row.get("error") or "").strip()
        if err:
            errors.append(f"{row.get('model_id') or 'model'}: {err}")
    if errors:
        return base + " 실패 원인: " + "; ".join(errors[:3])
    return base + " 데이터셋 경로, target 컬럼, feature 타입 또는 trial 오류 로그를 확인하세요."


async def stream_logs(job_id: str):
    """SSE event generator — log / progress / status 분리"""
    info = _jobs.get(job_id)
    if not info:
        yield f"data: {json.dumps({'error': 'job not found'})}\n\n"
        return

    if str(info.get("status") or "").upper() == "DELETED":
        yield f"data: {json.dumps({'status': 'DELETED', 'message': info.get('message'), 'best': info.get('best_run')})}\n\n"
        return

    # QUEUED 상태면 Ray submit 될 때까지 대기
    while info["status"] == "QUEUED":
        pos = queue_position(job_id)
        yield f"data: {json.dumps({'queued': True, 'queue_position': pos})}\n\n"
        await asyncio.sleep(2)
        if info["status"] in ("CANCELED", "FAILED"):
            yield f"data: {json.dumps({'status': info['status'], 'message': info.get('message')})}\n\n"
            return

    if not info.get("ray_job_id"):
        yield f"data: {json.dumps({'error': 'ray job not available'})}\n\n"
        return

    submission_id = info["ray_job_id"]
    ray_dashboard_url = _ray_url_for_job(info)
    last_len = 0
    while True:
        try:
            logs = await _get_ray_job_logs(ray_dashboard_url, submission_id)
            if len(logs) > last_len:
                chunk = logs[last_len:]
                last_len = len(logs)
                # PROGRESS / RESULT 마커는 별도 이벤트, 일반 로그는 한번에 묶어 1개 이벤트로 전송
                # (라인별 SSE 이벤트는 수천 라인에서 브라우저 DOM 업데이트 폭주로 렉 발생)
                plain_lines: list[str] = []
                for line in chunk.splitlines():
                    if PROGRESS_MARKER in line:
                        try:
                            payload = json.loads(line.split(PROGRESS_MARKER, 1)[1])
                            yield f"data: {json.dumps({'progress': payload})}\n\n"
                        except Exception:  # nosec
                            pass
                        continue
                    if RESULT_MARKER in line:
                        try:
                            info["best_run"] = json.loads(line.split(RESULT_MARKER, 1)[1])
                        except Exception:  # nosec
                            pass
                        continue
                    plain_lines.append(line)
                if plain_lines:
                    plain_log = "\n".join(plain_lines)
                    yield f"data: {json.dumps({'log': plain_log})}\n\n"

            if str(info.get("status") or "").upper() == "DELETED":
                yield f"data: {json.dumps({'status': 'DELETED', 'message': info.get('message'), 'best': info.get('best_run')})}\n\n"
                return
            status_info = await _get_ray_job_status(ray_dashboard_url, submission_id)
            status = status_info.get("status")
            if str(info.get("status") or "").upper() == "DELETED":
                yield f"data: {json.dumps({'status': 'DELETED', 'message': info.get('message'), 'best': info.get('best_run')})}\n\n"
                return
            info["status"] = status
            if status in ("SUCCEEDED", "FAILED", "STOPPED"):
                info["finished_at"] = _now()
                info["message"] = _friendly_ray_error_message(status_info.get("message") or "")
                if status in ("SUCCEEDED", "FAILED") and not (info.get("best_run") or {}).get("best"):
                    info["status"] = "FAILED"
                    info["message"] = _best_failure_message(info.get("best_run"))
                    status = "FAILED"
                _persist(info)
                yield f"data: {json.dumps({'status': status, 'message': info.get('message'), 'best': info.get('best_run')})}\n\n"
                return
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return
        await asyncio.sleep(2)


async def stop(job_id: str) -> bool:
    info = _jobs.get(job_id)
    if not info or not info.get("ray_job_id"):
        return False
    if info["status"] in ("SUCCEEDED", "FAILED", "STOPPED"):
        return False
    ray_dashboard_url = _ray_url_for_job(info)
    async with httpx.AsyncClient(timeout=15) as c:
        resp = await c.post(f"{ray_dashboard_url}/api/jobs/{info['ray_job_id']}/stop")
        ok = resp.status_code in (200, 204)
    if ok:
        info["status"] = "STOPPED"
        info["finished_at"] = _now()
        _persist(info)
    return ok
