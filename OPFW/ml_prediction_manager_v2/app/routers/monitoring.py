import asyncio
from typing import Literal

from fastapi import APIRouter, Query, Request
from pydantic import BaseModel

from app.auth import get_owner_namespace, get_user_email, get_user_namespace, is_admin
from app.services import alarm_service, monitoring_service

router = APIRouter()
_SUMMARY_TIMEOUT_SECONDS = 25


class AlarmStateRequest(BaseModel):
    alarm_ids: list[str]
    action: Literal["dismiss", "seen", "visit", "toast"]


@router.get("/gpu-trend")
async def gpu_trend(window_minutes: int = 60, step: str = "1m"):
    return await monitoring_service.get_gpu_trend(window_minutes=window_minutes, step=step)


def _unavailable_summary(namespace: str, email: str, admin: bool, is_admin_view: bool) -> dict:
    """Keep the monitoring UI usable when a compact host is temporarily busy."""
    unavailable = {"status": "error"}
    return {
        "namespace": namespace,
        "user_email": email,
        "is_admin": admin,
        "is_admin_view": is_admin_view,
        "partial": True,
        "gpu": {**unavailable, "util_pct": None, "mem_used_gb": None, "mem_total_gb": None,
                "mem_used_mb": None, "mem_total_mb": None, "mem_pct": None, "temp_c": None, "power_w": None},
        "gpu_trend": {**unavailable, "data": []},
        "resource_trends": {**unavailable,
                            "gpu_util": {**unavailable, "data": []},
                            "gpu_mem_used_gb": {**unavailable, "data": []},
                            "cpu_pct": {**unavailable, "data": []},
                            "mem_used_gb": {**unavailable, "data": []}},
        "kserve_rps": {**unavailable, "series": []},
        "kserve_latency_p95": {**unavailable, "series": []},
        "kserve_error_rate": {**unavailable, "models": []},
        "kserve_top5_latency": {**unavailable, "models": []},
        "system": {**unavailable, "cpu_cores": None, "cpu_total_cores": None, "cpu_pct": None,
                   "mem_used_gb": None, "mem_total_gb": None, "mem_pct": None},
        "ray": {**unavailable, "source": "unavailable", "nodes": None, "finished_total": None},
        "ray_trend": {**unavailable, "nodes": [], "jobs": []},
        "ray_cluster_util": {**unavailable, "cpu": [], "mem": [], "disk": []},
        "ray_node_count": {**unavailable, "types": [], "finished_jobs": None},
        "automl": {"error": False, "jobs": []},
        "kserve": {"error": False, "endpoints": []},
        "mlflow": {**unavailable, "experiments": None, "models": None, "runs": None},
        "mlflow_models": {**unavailable, "models": []},
        "mlflow_experiment_runs": {**unavailable, "experiments": []},
        "notebook_resources": {**unavailable, "rows": []},
        "running_notebooks": {**unavailable, "notebooks": []},
        "pvc": {**unavailable, "groups": []},
        "alarms": [],
        "zones": alarm_service.ZONES,
    }


@router.get("/summary")
async def summary(request: Request, ns: str | None = None):
    namespace = get_user_namespace(request)
    admin = is_admin(request)
    is_admin_view = False
    filter_ns = namespace
    email = get_user_email(request)

    tasks = (
        monitoring_service.get_gpu_metrics(),
        monitoring_service.get_system_metrics(namespace),
        monitoring_service.get_ray_status(namespace),
        monitoring_service.get_mlflow_stats(namespace=filter_ns),
        monitoring_service.get_mlflow_model_versions(namespace=filter_ns),
        monitoring_service.get_mlflow_experiment_runs(namespace=filter_ns),
        monitoring_service.get_notebook_resources(namespace=filter_ns),
        monitoring_service.get_running_notebooks(namespace=filter_ns),
        monitoring_service.get_pvc_storage(namespace=filter_ns),
        monitoring_service.get_gpu_trend(window_minutes=60, step="1m"),
        monitoring_service.get_resource_trends(window_minutes=60, step="1m"),
        monitoring_service.get_ray_trend(namespace, window_minutes=60, step="1m"),
        monitoring_service.get_ray_cluster_util_trend(namespace, window_minutes=60, step="1m"),
        monitoring_service.get_ray_node_count_trend(namespace, window_minutes=60, step="1m"),
        monitoring_service.get_kserve_rps(namespace=filter_ns, window_minutes=30, step="1m"),
        monitoring_service.get_kserve_latency_p95(namespace=filter_ns, window_minutes=30, step="1m"),
        monitoring_service.get_kserve_error_rate(namespace=filter_ns),
        monitoring_service.get_kserve_top5_latency(namespace=filter_ns),
    )
    try:
        values = await asyncio.wait_for(asyncio.gather(*tasks), timeout=_SUMMARY_TIMEOUT_SECONDS)
    except (asyncio.TimeoutError, Exception):
        return _unavailable_summary(namespace, email, admin, is_admin_view)

    (gpu, system, ray, mlflow, mlflow_models, mlflow_experiment_runs, notebook_resources,
     running_notebooks, pvc, gpu_trend_data, resource_trends, ray_trend, ray_cluster_util,
     ray_node_count, kserve_rps, kserve_latency_p95, kserve_error_rate,
     kserve_top5_latency) = values
    result = {
        "namespace": namespace, "user_email": email, "is_admin": admin, "is_admin_view": is_admin_view,
        "gpu": gpu, "gpu_trend": gpu_trend_data, "resource_trends": resource_trends,
        "kserve_rps": kserve_rps, "kserve_latency_p95": kserve_latency_p95,
        "kserve_error_rate": kserve_error_rate, "kserve_top5_latency": kserve_top5_latency,
        "system": system, "ray": ray, "ray_trend": ray_trend,
        "ray_cluster_util": ray_cluster_util, "ray_node_count": ray_node_count,
        "automl": monitoring_service.get_automl_jobs(namespace=None if is_admin_view else namespace, is_admin=admin),
        "kserve": monitoring_service.get_kserve_endpoints(namespace=filter_ns),
        "mlflow": mlflow, "mlflow_models": mlflow_models,
        "mlflow_experiment_runs": mlflow_experiment_runs,
        "notebook_resources": notebook_resources, "running_notebooks": running_notebooks, "pvc": pvc,
    }
    try:
        await asyncio.wait_for(alarm_service.update_alarms_async(result, filter_ns), timeout=3)
        result["alarms"] = await asyncio.wait_for(alarm_service.get_active_async(filter_ns, email), timeout=3)
    except (asyncio.TimeoutError, Exception):
        result["alarms"] = []
    result["zones"] = alarm_service.ZONES
    return result


@router.get("/alarms/history")
async def alarm_history(request: Request, limit: int = Query(default=500, ge=1, le=1000)):
    filter_ns = get_user_namespace(request)
    return await alarm_service.get_history_async(limit=limit, filter_ns=filter_ns)


@router.post("/alarms/state")
async def set_alarm_state(req: AlarmStateRequest, request: Request):
    await alarm_service.set_alarm_state_async(get_user_email(request), req.alarm_ids, req.action)
    return {"status": "ok"}
