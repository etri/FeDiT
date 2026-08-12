import os
import time

import httpx

from app.services import kubernetes_client

core_v1 = kubernetes_client.core_v1()


# GPU hardware changes rarely. Cache the Prometheus/DCGM lookup so opening the
# dashboard does not add a query fan-out on every refresh.
_GPU_INFO_CACHE: dict = {"data": None, "ts": 0.0}
_GPU_INFO_TTL = 300


def _dcgm_results(query: str) -> list[dict]:
    prometheus_url = os.environ.get(
        "PROMETHEUS_URL",
        "http://kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090",
    ).rstrip("/")
    response = httpx.get(
        f"{prometheus_url}/api/v1/query",
        params={"query": query},
        timeout=5,
    )
    response.raise_for_status()
    payload = response.json()
    if payload.get("status") != "success":
        return []
    return (payload.get("data") or {}).get("result") or []


def get_gpu_hardware_info() -> dict:
    """Return physical GPU facts and Kubernetes time-sliced capacity.

    Application containers do not need an NVIDIA utility package. Physical
    model, driver, count and framebuffer size come from the already installed
    DCGM Exporter, while allocatable slots come from the Kubernetes node.
    """
    now = time.time()
    if _GPU_INFO_CACHE["data"] and now - _GPU_INFO_CACHE["ts"] < _GPU_INFO_TTL:
        return _GPU_INFO_CACHE["data"]

    info = {
        "model": os.environ.get("GPU_MODEL", "Unknown GPU"),
        "driver_version": os.environ.get("GPU_DRIVER_VERSION", ""),
        "vram_gb": int(os.environ.get("GPU_VRAM_GB", "0")),
        "physical_count": int(os.environ.get("GPU_PHYSICAL_COUNT", "0")),
        "time_slicing_slots": 0,
        "vram_shared_note": "Time-slicing: 각 물리 GPU의 슬롯은 동일한 GPU 메모리를 공유",
    }

    try:
        nodes = core_v1.list_node()
        info["time_slicing_slots"] = sum(
            int((node.status.capacity or {}).get("nvidia.com/gpu", 0))
            for node in nodes.items
        )
    except Exception:  # nosec - dashboard must still render during API outages
        pass

    try:
        free_results = _dcgm_results("DCGM_FI_DEV_FB_FREE")
        used_results = _dcgm_results("DCGM_FI_DEV_FB_USED")
        if not free_results:
            free_results = _dcgm_results("DCGM_FI_DEV_GPU_UTIL")

        devices: dict[str, dict] = {}
        for result in free_results:
            metric = result.get("metric") or {}
            device_id = metric.get("UUID") or metric.get("gpu") or metric.get("device")
            if not device_id:
                continue
            devices[str(device_id)] = {
                "model": metric.get("modelName") or info["model"],
                "driver": metric.get("DCGM_FI_DRIVER_VERSION") or "",
                "free_mib": float((result.get("value") or [0, 0])[1]),
                "used_mib": 0.0,
            }
        for result in used_results:
            metric = result.get("metric") or {}
            device_id = metric.get("UUID") or metric.get("gpu") or metric.get("device")
            if device_id is not None and str(device_id) in devices:
                devices[str(device_id)]["used_mib"] = float(
                    (result.get("value") or [0, 0])[1]
                )

        if devices:
            models = sorted({device["model"] for device in devices.values()})
            drivers = sorted({device["driver"] for device in devices.values() if device["driver"]})
            info["model"] = " / ".join(models)
            info["driver_version"] = " / ".join(drivers)
            info["physical_count"] = len(devices)
            totals = [
                device["free_mib"] + device["used_mib"]
                for device in devices.values()
                if device["free_mib"] or device["used_mib"]
            ]
            if totals:
                info["vram_gb"] = int(
                    round(min(totals) / 1024)
                )
    except Exception:  # nosec - node capacity remains useful without monitoring
        pass

    _GPU_INFO_CACHE["data"] = info
    _GPU_INFO_CACHE["ts"] = now
    return info


def get_gpu_status(namespace: str = None) -> dict:
    """Cluster GPU status for administrators."""
    nodes = core_v1.list_node()
    total_gpu = sum(
        int((node.status.capacity or {}).get("nvidia.com/gpu", 0))
        for node in nodes.items
    )

    pods = core_v1.list_pod_for_all_namespaces()
    used_gpu = 0
    for pod in pods.items:
        if pod.status.phase not in ("Running", "Pending"):
            continue
        for container in pod.spec.containers:
            resources = container.resources
            if resources and resources.limits and "nvidia.com/gpu" in resources.limits:
                used_gpu += int(resources.limits["nvidia.com/gpu"])

    return {
        "total": total_gpu,
        "used": used_gpu,
        "available": max(0, total_gpu - used_gpu),
        "hardware": get_gpu_hardware_info(),
    }


def get_user_gpu_status(namespace: str) -> dict:
    """Namespace GPU quota and current usage."""
    try:
        quotas = core_v1.list_namespaced_resource_quota(namespace)
        quota_gpu = 0
        used_gpu = 0
        for quota in quotas.items:
            hard = quota.status.hard or {}
            used = quota.status.used or {}
            quota_gpu = int(hard.get("requests.nvidia.com/gpu", 0))
            used_gpu = int(used.get("requests.nvidia.com/gpu", 0))
    except Exception:
        quota_gpu = 0
        used_gpu = 0

    return {
        "total": quota_gpu,
        "used": used_gpu,
        "available": max(0, quota_gpu - used_gpu),
        "hardware": get_gpu_hardware_info(),
    }
