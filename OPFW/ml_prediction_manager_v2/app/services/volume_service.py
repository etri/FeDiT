"""User PVC catalogue. Platform/legacy PVCs are never adopted implicitly."""
import os
import re

from fastapi import HTTPException
from kubernetes import client
from kubernetes.client.rest import ApiException

from app.resource_policy import require_tenant_namespace
from app.services import kubernetes_client

core_v1 = kubernetes_client.core_v1()
apps_v1 = kubernetes_client.apps_v1()
batch_v1 = kubernetes_client.batch_v1()
custom_api = kubernetes_client.custom_objects()
PURPOSE = "prediction-manager.io/purpose"
OWNER = "prediction-manager.io/owner-namespace"
MANAGER = "app.kubernetes.io/managed-by"
STORAGE_CLASS = os.environ.get("PM_USER_VOLUME_STORAGE_CLASS", "local-path").strip() or "local-path"
_NAME = re.compile(r"pm-user-[a-z0-9](?:[a-z0-9-]{0,53}[a-z0-9])?\Z")


def volume_name(value: str) -> str:
    name = value if value.startswith("pm-user-") else f"pm-user-{value}"
    if not _NAME.fullmatch(name) or len(name) > 63:
        raise HTTPException(422, "사용자 볼륨 이름은 영문 소문자·숫자·하이픈을 사용하고 63자 이하여야 합니다.")
    return name


def owned(pvc, namespace: str) -> bool:
    labels = pvc.metadata.labels or {}
    return bool(pvc.metadata.namespace == namespace and _NAME.fullmatch(pvc.metadata.name)
                and labels.get(MANAGER) == "prediction-manager"
                and labels.get(PURPOSE) == "user-volume" and labels.get(OWNER) == namespace
                and pvc.spec.storage_class_name == STORAGE_CLASS
                and (pvc.spec.volume_mode or "Filesystem") == "Filesystem"
                and not pvc.spec.selector and not pvc.metadata.deletion_timestamp)


def require_volume(namespace: str, name: str, *, api=None):
    require_tenant_namespace(namespace)
    if volume_name(name) != name:
        raise HTTPException(404, "사용자 볼륨을 찾을 수 없습니다.")
    try:
        pvc = (api or core_v1).read_namespaced_persistent_volume_claim(name, namespace)
    except ApiException as exc:
        if exc.status == 404:
            raise HTTPException(404, "사용자 볼륨을 찾을 수 없습니다.") from exc
        raise
    if not owned(pvc, namespace):
        raise HTTPException(404, "사용자 볼륨을 찾을 수 없습니다.")
    return pvc


def create_volume(namespace: str, name: str, size: str, *, storage_class: str = "",
                  access_mode: str = "ReadWriteOnce", notebook_name: str = "", api=None):
    require_tenant_namespace(namespace)
    name = volume_name(name)
    if (storage_class and storage_class != STORAGE_CLASS) or access_mode != "ReadWriteOnce":
        raise HTTPException(422, "사용자 볼륨은 지정된 저장소와 ReadWriteOnce 방식만 사용할 수 있습니다.")
    if not re.fullmatch(r"[1-9][0-9]*Gi", size) or not 1 <= int(size[:-2]) <= 1024:
        raise HTTPException(422, "볼륨 크기는 1Gi부터 1024Gi까지 지정할 수 있습니다.")
    labels = {MANAGER: "prediction-manager", PURPOSE: "user-volume", OWNER: namespace}
    if notebook_name:
        labels["prediction-manager.io/notebook"] = notebook_name
    body = client.V1PersistentVolumeClaim(
        metadata=client.V1ObjectMeta(name=name, namespace=namespace, labels=labels),
        spec=client.V1PersistentVolumeClaimSpec(
            access_modes=["ReadWriteOnce"], storage_class_name=STORAGE_CLASS,
            volume_mode="Filesystem",
            resources=client.V1VolumeResourceRequirements(requests={"storage": size}),
        ),
    )
    try:
        (api or core_v1).create_namespaced_persistent_volume_claim(namespace, body)
    except ApiException as exc:
        if exc.status == 409:
            raise HTTPException(409, "같은 이름의 볼륨이 있습니다. 기존 사용자 볼륨을 명시적으로 선택하세요.") from exc
        raise
    return name


def _references(value, name: str) -> bool:
    if hasattr(value, "to_dict"):
        value = value.to_dict()
    if isinstance(value, dict):
        for key in ("persistentVolumeClaim", "persistent_volume_claim"):
            claim = value.get(key)
            if claim and (claim.get("claimName") or claim.get("claim_name")) == name:
                return True
        return any(_references(item, name) for item in value.values())
    if isinstance(value, (list, tuple)):
        return any(_references(item, name) for item in value)
    return False


def volume_users(namespace: str, name: str) -> list[str]:
    require_tenant_namespace(namespace)
    users = []
    # Include dormant controllers: a scaled-to-zero workload still owns its data.
    operations = [
        ("Pod", core_v1.list_namespaced_pod),
        ("Deployment", apps_v1.list_namespaced_deployment),
        ("StatefulSet", apps_v1.list_namespaced_stateful_set),
        ("DaemonSet", apps_v1.list_namespaced_daemon_set),
        ("Job", batch_v1.list_namespaced_job),
        ("CronJob", batch_v1.list_namespaced_cron_job),
    ]
    try:
        for kind, operation in operations:
            for item in operation(namespace).items:
                if kind == "Pod" and item.status.phase in {"Succeeded", "Failed"}:
                    continue
                if _references(item, name):
                    users.append(f"{kind}/{item.metadata.name}")
        for group, version, plural, kind in [
            ("kubeflow.org", "v1", "notebooks", "Notebook"),
            ("ray.io", "v1", "rayclusters", "RayCluster"),
        ]:
            try:
                items = custom_api.list_namespaced_custom_object(group, version, namespace, plural).get("items", [])
            except ApiException as exc:
                if exc.status == 404:  # CRD not installed: there can be no objects of this kind.
                    continue
                raise
            users.extend(f"{kind}/{item['metadata']['name']}" for item in items if _references(item, name))
    except ApiException as exc:
        raise HTTPException(503, "볼륨 사용 상태를 확인할 수 없어 삭제를 차단했습니다.") from exc
    return sorted(set(users))


def list_volumes(namespace: str) -> list[dict]:
    require_tenant_namespace(namespace)
    return [{"name": pvc.metadata.name, "namespace": namespace,
             "size": (pvc.spec.resources.requests or {}).get("storage", ""),
             "status": pvc.status.phase if pvc.status else "Pending",
             "storage_class": STORAGE_CLASS, "access_modes": pvc.spec.access_modes}
            for pvc in core_v1.list_namespaced_persistent_volume_claim(namespace).items
            if owned(pvc, namespace)]


def delete_volume(namespace: str, name: str) -> dict:
    pvc = require_volume(namespace, name)
    if not pvc.metadata.uid or not pvc.metadata.resource_version:
        raise HTTPException(409, "볼륨 식별 정보를 확인할 수 없습니다.")
    users = volume_users(namespace, name)
    if users:
        raise HTTPException(409, "연결된 작업을 먼저 해제하세요: " + ", ".join(users))
    core_v1.delete_namespaced_persistent_volume_claim(
        name, namespace, body=client.V1DeleteOptions(preconditions=client.V1Preconditions(
            uid=pvc.metadata.uid, resource_version=pvc.metadata.resource_version)),
    )
    return {"name": name, "namespace": namespace, "status": "deletion-requested"}
