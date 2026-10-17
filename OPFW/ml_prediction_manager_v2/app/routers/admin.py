from fastapi import APIRouter, Request, HTTPException
import re
from pydantic import BaseModel, EmailStr
from kubernetes import client
from kubernetes.client.rest import ApiException

from app.auth import is_admin, get_user_email, ADMIN_EMAILS
from app.resource_policy import require_tenant_namespace
from app.services import (
    keycloak_service,
    tenant_dashboard_service,
    kubernetes_client,
    tenant_resources,
)

custom_api = kubernetes_client.custom_objects()
core_v1 = kubernetes_client.core_v1()
rbac_api = kubernetes_client.rbac_v1()

router = APIRouter()


class QuotaUpdateRequest(BaseModel):
    cpu: str = "8"
    memory: str = "32Gi"
    gpu: str = "2"
    pvc: str = "5"
    storage: str = "50Gi"


class UserCreateRequest(BaseModel):
    email: EmailStr
    first_name: str = ""
    last_name: str = ""
    password: str
    cpu: str = "4"
    memory: str = "16Gi"
    gpu: str = "1"
    pvc: str = "3"
    storage: str = "50Gi"


class PasswordResetRequest(BaseModel):
    password: str
    temporary: bool = True


class ContributorRequest(BaseModel):
    email: EmailStr
    role: str = "edit"  # edit | view


def _check_admin(request: Request):
    if not is_admin(request):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다")


def _email_to_namespace(email: str) -> str:
    return require_tenant_namespace("kubeflow-" + email.replace("@", "-").replace(".", "-"))


def _quota_used(namespace: str) -> dict:
    used = {"cpu": "0", "memory": "0", "gpu": "0", "pvc": "0", "storage": "0"}
    try:
        quotas = core_v1.list_namespaced_resource_quota(namespace)
        for q in quotas.items:
            u = q.status.used or {}
            used["cpu"] = str(u.get("requests.cpu", "0"))
            used["memory"] = str(u.get("requests.memory", "0"))
            used["gpu"] = str(u.get("requests.nvidia.com/gpu", "0"))
            used["pvc"] = str(u.get("persistentvolumeclaims", "0"))
            used["storage"] = str(u.get("requests.storage", "0"))
    except Exception:  # nosec
        pass
    return used


@router.get("/gpu-info")
async def gpu_info(request: Request):
    """GPU 하드웨어 정보 (모델명, VRAM, time-slicing 슬롯 수)"""
    _check_admin(request)
    from app.services import gpu_service
    return gpu_service.get_gpu_hardware_info()


def _parse_cpu(v: str) -> float:
    s = str(v or "0").strip()
    if s.endswith("m"):
        try:
            return int(s[:-1]) / 1000.0
        except ValueError:
            return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def _parse_memory_bytes(v: str) -> int:
    s = str(v or "0").strip()
    units = {"Ki": 1024, "Mi": 1024**2, "Gi": 1024**3, "Ti": 1024**4,
             "K": 1000, "M": 1000**2, "G": 1000**3, "T": 1000**4}
    for suf, mul in units.items():
        if s.endswith(suf):
            try:
                return int(float(s[:-len(suf)]) * mul)
            except ValueError:
                return 0
    try:
        return int(s)
    except ValueError:
        return 0


_CPU_RE = re.compile(r"^(?:0|[1-9]\d*)(?:\.\d+)?$|^(?:0|[1-9]\d*)m$")
_QUANTITY_RE = re.compile(r"^(?:0|[1-9]\d*)(?:\.\d+)?\s*(Ki|Mi|Gi|Ti|K|M|G|T)$", re.IGNORECASE)
_TENANT_MIN_CPU = 2.0
_TENANT_MIN_MEMORY_BYTES = 4 * 1024**3
_TENANT_MIN_PVC = 2
_TENANT_MIN_STORAGE_BYTES = 25 * 1024**3


def _validate_quota_number(name: str, value: str, *, integer: bool = False) -> str:
    s = str(value or "").strip()
    if not s:
        raise HTTPException(status_code=400, detail=f"{name}: 값이 비어있습니다")
    if integer:
        if not re.fullmatch(r"(?:0|[1-9]\d*)", s):
            raise HTTPException(status_code=400, detail=f"{name}: 0 이상의 정수로 입력해야 합니다")
        return s
    if not _CPU_RE.fullmatch(s):
        raise HTTPException(status_code=400, detail=f"{name}: 0 이상의 숫자 또는 millicore 형식으로 입력해야 합니다. 예: 4, 0.5, 500m")
    return s


def _validate_quota_quantity(name: str, value: str) -> str:
    s = str(value or "").strip()
    if not s:
        raise HTTPException(status_code=400, detail=f"{name}: 값이 비어있습니다")
    match = _QUANTITY_RE.fullmatch(s)
    if not match:
        raise HTTPException(status_code=400, detail=f"{name}: 0 이상의 숫자와 단위를 함께 입력해야 합니다. 예: 16Gi, 500Mi")
    return re.sub(r"\s+", "", s)


def _validated_quota(req: QuotaUpdateRequest | UserCreateRequest) -> dict[str, str]:
    quota = {
        "cpu": _validate_quota_number("CPU", req.cpu),
        "memory": _validate_quota_quantity("메모리", req.memory),
        "gpu": _validate_quota_number("GPU", req.gpu, integer=True),
        "pvc": _validate_quota_number("PVC 수", req.pvc, integer=True),
        "storage": _validate_quota_quantity("스토리지", req.storage),
    }
    if tenant_resources.TENANT_RESOURCES_ENABLED:
        if _parse_cpu(quota["cpu"]) < _TENANT_MIN_CPU:
            raise HTTPException(status_code=400, detail="CPU: 사용자별 MLflow/Ray/NiFi 기본 리소스 생성에는 최소 2 core 이상이 필요합니다")
        if _parse_memory_bytes(quota["memory"]) < _TENANT_MIN_MEMORY_BYTES:
            raise HTTPException(status_code=400, detail="메모리: 사용자별 MLflow/Ray/NiFi 기본 리소스 생성에는 최소 4Gi 이상이 필요합니다")
        if int(quota["pvc"]) < _TENANT_MIN_PVC:
            raise HTTPException(status_code=400, detail="PVC 수: 사용자별 MLflow/NiFi 저장소 생성을 위해 최소 2개 이상이 필요합니다")
        if _parse_memory_bytes(quota["storage"]) < _TENANT_MIN_STORAGE_BYTES:
            raise HTTPException(status_code=400, detail="스토리지: MLflow 20Gi와 NiFi 5Gi PVC 생성을 위해 최소 25Gi 이상이 필요합니다")
    return quota


@router.get("/cluster-capacity")
async def cluster_capacity(request: Request):
    """클러스터 총 용량 vs 현재 할당 합계"""
    _check_admin(request)

    # 노드 총 용량
    nodes = core_v1.list_node()
    total_cpu = 0.0
    total_mem = 0
    total_gpu = 0
    total_storage = 0
    for node in nodes.items:
        cap = node.status.capacity or {}
        total_cpu += _parse_cpu(cap.get("cpu", "0"))
        total_mem += _parse_memory_bytes(cap.get("memory", "0"))
        total_gpu += int(cap.get("nvidia.com/gpu", 0))
        total_storage += _parse_memory_bytes(cap.get("ephemeral-storage", "0"))

    # 모든 Profile의 quota 합계 + 실제 사용량 합계
    allocated = {"cpu": 0.0, "memory": 0, "gpu": 0, "pvc": 0, "storage": 0}
    used = {"cpu": 0.0, "memory": 0, "gpu": 0, "pvc": 0, "storage": 0}
    try:
        profiles = custom_api.list_cluster_custom_object("kubeflow.org", "v1", "profiles")
        for p in profiles.get("items", []):
            hard = p.get("spec", {}).get("resourceQuotaSpec", {}).get("hard", {})
            allocated["cpu"] += _parse_cpu(hard.get("requests.cpu", "0"))
            allocated["memory"] += _parse_memory_bytes(hard.get("requests.memory", "0"))
            allocated["gpu"] += int(str(hard.get("requests.nvidia.com/gpu", "0")) or 0)
            allocated["pvc"] += int(str(hard.get("persistentvolumeclaims", "0")) or 0)
            allocated["storage"] += _parse_memory_bytes(hard.get("requests.storage", "0"))

            ns = p["metadata"]["name"]
            u = _quota_used(ns)
            used["cpu"] += _parse_cpu(u.get("cpu", "0"))
            used["memory"] += _parse_memory_bytes(u.get("memory", "0"))
            used["gpu"] += int(str(u.get("gpu", "0")) or 0)
            used["pvc"] += int(str(u.get("pvc", "0")) or 0)
            used["storage"] += _parse_memory_bytes(u.get("storage", "0"))
    except Exception:  # nosec
        pass

    return {
        "total": {
            "cpu": round(total_cpu, 1),
            "memory_gb": round(total_mem / (1024**3), 1),
            "gpu_slots": total_gpu,
            "storage_gb": round(total_storage / (1024**3), 1),
        },
        "allocated": {
            "cpu": round(allocated["cpu"], 1),
            "memory_gb": round(allocated["memory"] / (1024**3), 1),
            "gpu_slots": allocated["gpu"],
            "pvc": allocated["pvc"],
            "storage_gb": round(allocated["storage"] / (1024**3), 1),
        },
        "used": {
            "cpu": round(used["cpu"], 2),
            "memory_gb": round(used["memory"] / (1024**3), 2),
            "gpu_slots": used["gpu"],
            "pvc": used["pvc"],
            "storage_gb": round(used["storage"] / (1024**3), 2),
        },
        "over_committed": {
            "cpu": allocated["cpu"] > total_cpu,
            "memory": allocated["memory"] > total_mem,
            "gpu": allocated["gpu"] > total_gpu,
            "storage": allocated["storage"] > total_storage,
        },
    }


@router.get("/users")
async def list_users(request: Request):
    """Profile + Keycloak 정보 조인"""
    _check_admin(request)

    profiles = custom_api.list_cluster_custom_object("kubeflow.org", "v1", "profiles")
    profile_by_email = {}
    for p in profiles.get("items", []):
        owner = p.get("spec", {}).get("owner", {}).get("name", "")
        if owner:
            profile_by_email[owner] = p

    try:
        kc_users = keycloak_service.list_users()
    except Exception:
        kc_users = []

    users = []
    seen_emails = set()

    for kc in kc_users:
        email = kc.get("email") or kc.get("username") or ""
        if not email:
            continue
        seen_emails.add(email)
        profile = profile_by_email.get(email)
        ns = profile["metadata"]["name"] if profile else None
        quota_spec = (profile or {}).get("spec", {}).get("resourceQuotaSpec", {}).get("hard", {})
        users.append({
            "email": email,
            "first_name": kc.get("firstName", ""),
            "last_name": kc.get("lastName", ""),
            "enabled": kc.get("enabled", False),
            "namespace": ns,
            "is_admin": email.lower() in ADMIN_EMAILS,
            "quota": {
                "cpu": str(quota_spec.get("requests.cpu", "0")),
                "memory": str(quota_spec.get("requests.memory", "0")),
                "gpu": str(quota_spec.get("requests.nvidia.com/gpu", "0")),
                "pvc": str(quota_spec.get("persistentvolumeclaims", "0")),
                "storage": str(quota_spec.get("requests.storage", "0")),
            },
            "used": _quota_used(ns) if ns else {"cpu": "0", "memory": "0", "gpu": "0", "pvc": "0"},
        })

    # Profile은 있지만 Keycloak에 없는 경우 (orphan)
    for email, profile in profile_by_email.items():
        if email in seen_emails:
            continue
        ns = profile["metadata"]["name"]
        quota_spec = profile.get("spec", {}).get("resourceQuotaSpec", {}).get("hard", {})
        users.append({
            "email": email,
            "first_name": "",
            "last_name": "",
            "enabled": None,
            "namespace": ns,
            "is_admin": email.lower() in ADMIN_EMAILS,
            "orphan": True,
            "quota": {
                "cpu": str(quota_spec.get("requests.cpu", "0")),
                "memory": str(quota_spec.get("requests.memory", "0")),
                "gpu": str(quota_spec.get("requests.nvidia.com/gpu", "0")),
                "pvc": str(quota_spec.get("persistentvolumeclaims", "0")),
                "storage": str(quota_spec.get("requests.storage", "0")),
            },
            "used": _quota_used(ns),
        })

    users.sort(key=lambda u: (not u["is_admin"], u["email"]))
    return users


@router.post("/users")
async def create_user(req: UserCreateRequest, request: Request):
    """Keycloak 사용자 + Kubeflow Profile 동시 생성"""
    _check_admin(request)

    email = req.email
    namespace = _email_to_namespace(email)
    quota = _validated_quota(req)

    # 1) Keycloak 사용자 생성
    try:
        keycloak_service.create_user(
            email=email,
            first_name=req.first_name,
            last_name=req.last_name,
            password=req.password,
            temporary=True,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Keycloak 사용자 생성 실패: {e}")

    # 2) Kubeflow Profile 생성 (실패 시 Keycloak 롤백)
    profile = {
        "apiVersion": "kubeflow.org/v1",
        "kind": "Profile",
        "metadata": {"name": namespace},
        "spec": {
            "owner": {"kind": "User", "name": email},
            "resourceQuotaSpec": {
                "hard": {
                    "requests.cpu": quota["cpu"],
                    "requests.memory": quota["memory"],
                    "requests.nvidia.com/gpu": quota["gpu"],
                    "persistentvolumeclaims": quota["pvc"],
                    "requests.storage": quota["storage"],
                }
            },
        },
    }
    try:
        custom_api.create_cluster_custom_object("kubeflow.org", "v1", "profiles", profile)
    except ApiException as e:
        # 롤백
        try:
            keycloak_service.delete_user(email)
        except Exception:  # nosec
            pass
        if e.status == 409:
            raise HTTPException(status_code=409, detail=f"이미 존재하는 namespace: {namespace}")
        raise HTTPException(status_code=500, detail=f"Profile 생성 실패: {e}")

    try:
        tenant_resources = tenant_dashboard_service.ensure_tenant_resources(namespace, email)
    except Exception as e:
        try:
            tenant_dashboard_service.delete_tenant_resources(namespace)
        except Exception:  # nosec
            pass
        try:
            custom_api.delete_cluster_custom_object("kubeflow.org", "v1", "profiles", namespace)
        except Exception:  # nosec
            pass
        try:
            keycloak_service.delete_user(email)
        except Exception:  # nosec
            pass
        raise HTTPException(status_code=500, detail=f"사용자별 MLflow/Ray/NiFi 리소스 생성 실패: {e}")

    return {
        "status": "created",
        "email": email,
        "namespace": namespace,
        "tenant_resources": tenant_resources.resources,
    }


@router.delete("/users/{email}")
async def delete_user(email: str, request: Request):
    """Profile + Keycloak 사용자 동시 삭제 (위험!)"""
    _check_admin(request)

    if email == get_user_email(request):
        raise HTTPException(status_code=400, detail="자기 자신은 삭제할 수 없습니다")
    if email.lower() in ADMIN_EMAILS:
        raise HTTPException(status_code=400, detail="관리자 계정은 삭제할 수 없습니다")

    namespace = _email_to_namespace(email)

    # 1) 사용자별 dashboard 리소스 정리
    try:
        tenant_resources_deleted = tenant_dashboard_service.delete_tenant_resources(namespace)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"사용자별 MLflow/Ray/NiFi 리소스 삭제 실패: {e}")

    # 2) Profile 삭제 (namespace + 남은 namespaced 리소스 삭제됨)
    try:
        custom_api.delete_cluster_custom_object("kubeflow.org", "v1", "profiles", namespace)
        profile_deleted = True
    except ApiException as e:
        if e.status == 404:
            profile_deleted = False
        else:
            raise HTTPException(status_code=500, detail=f"Profile 삭제 실패: {e}")

    # 3) 다른 namespace에 있는 contributor RoleBinding 정리
    contributor_bindings_deleted = []
    try:
        profiles = custom_api.list_cluster_custom_object("kubeflow.org", "v1", "profiles")
        for p in profiles.get("items", []):
            other_ns = p["metadata"]["name"]
            if other_ns == namespace:
                continue
            try:
                bindings = rbac_api.list_namespaced_role_binding(other_ns)
            except ApiException:
                continue
            for b in bindings.items:
                annotations = b.metadata.annotations or {}
                if annotations.get("user") == email:
                    try:
                        rbac_api.delete_namespaced_role_binding(b.metadata.name, other_ns)
                        contributor_bindings_deleted.append(f"{other_ns}/{b.metadata.name}")
                    except ApiException:
                        pass
    except ApiException:
        pass

    # 4) Keycloak 사용자 삭제
    try:
        kc_deleted = keycloak_service.delete_user(email)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Profile은 삭제했으나 Keycloak 삭제 실패: {e}",
        )

    return {
        "status": "deleted",
        "email": email,
        "profile_deleted": profile_deleted,
        "keycloak_deleted": kc_deleted,
        "tenant_resources_deleted": tenant_resources_deleted,
        "contributor_bindings_deleted": contributor_bindings_deleted,
    }


@router.post("/users/{email}/reset-password")
async def reset_password(email: str, req: PasswordResetRequest, request: Request):
    _check_admin(request)
    try:
        keycloak_service.reset_password(email, req.password, temporary=req.temporary)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"비밀번호 재설정 실패: {e}")
    return {"status": "reset", "email": email, "temporary": req.temporary}


def _profile_owner_email(namespace: str) -> str:
    try:
        profile = custom_api.get_cluster_custom_object("kubeflow.org", "v1", "profiles", namespace)
    except ApiException as e:
        if e.status == 404:
            raise HTTPException(status_code=404, detail=f"존재하지 않는 namespace: {namespace}")
        raise HTTPException(status_code=500, detail=f"Profile 조회 실패: {e}")
    owner = (profile.get("spec") or {}).get("owner") or {}
    email = str(owner.get("name") or "").strip()
    if not email:
        raise HTTPException(status_code=400, detail=f"Profile owner email을 찾을 수 없습니다: {namespace}")
    return email


@router.post("/users/{namespace}/tenant-resources/reconcile")
async def reconcile_tenant_resources(namespace: str, request: Request):
    """기존 사용자 namespace의 MLflow/Ray/NiFi 리소스를 최신 manifest로 재적용."""
    _check_admin(request)
    require_tenant_namespace(namespace)
    owner_email = _profile_owner_email(namespace)
    try:
        result = tenant_dashboard_service.ensure_tenant_resources(namespace, owner_email)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"tenant 리소스 재적용 실패: {e}")
    return {
        "status": "reconciled",
        "namespace": namespace,
        "owner_email": owner_email,
        "resources": result.resources,
    }


@router.get("/users/{namespace}/contributors")
async def list_contributors(namespace: str, request: Request):
    """해당 namespace에 대한 contributor(RoleBinding) 목록"""
    _check_admin(request)
    require_tenant_namespace(namespace)
    result = []
    try:
        bindings = rbac_api.list_namespaced_role_binding(namespace)
    except ApiException as e:
        raise HTTPException(status_code=500, detail=f"RoleBinding 조회 실패: {e}")

    # Keycloak에 실제 존재하는 사용자 이메일 집합
    try:
        kc_users = keycloak_service.list_users()
        existing_emails = {u.get("email", "").lower() for u in kc_users if u.get("email")}
    except Exception:
        existing_emails = None  # 조회 실패 시 orphan 판단 보류

    for b in bindings.items:
        annotations = b.metadata.annotations or {}
        user_anno = annotations.get("user")
        role_anno = annotations.get("role")
        if user_anno and role_anno:
            orphan = False
            if existing_emails is not None and user_anno.lower() not in existing_emails:
                orphan = True
            result.append({
                "email": user_anno,
                "role": role_anno,
                "binding_name": b.metadata.name,
                "orphan": orphan,
            })
    return result


@router.post("/users/{namespace}/contributors")
async def add_contributor(namespace: str, req: ContributorRequest, request: Request):
    """KFAM 호환 RoleBinding 생성 (cross-namespace access 부여)"""
    _check_admin(request)
    require_tenant_namespace(namespace)

    if req.role not in ("edit", "view"):
        raise HTTPException(status_code=400, detail="role은 edit 또는 view여야 합니다")

    profile = None
    try:
        profile = custom_api.get_cluster_custom_object("kubeflow.org", "v1", "profiles", namespace)
    except ApiException as e:
        if e.status == 404:
            raise HTTPException(status_code=404, detail=f"존재하지 않는 namespace: {namespace}")
        raise
    owner_email = profile.get("spec", {}).get("owner", {}).get("name", "")
    if req.email == owner_email:
        raise HTTPException(status_code=400, detail="owner는 이미 모든 권한이 있습니다")

    safe_email = req.email.replace("@", "-").replace(".", "-")
    binding_name = f"user-{safe_email}-clusterrole-{req.role}"
    cluster_role = f"kubeflow-{req.role}"

    body = client.V1RoleBinding(
        api_version="rbac.authorization.k8s.io/v1",
        kind="RoleBinding",
        metadata=client.V1ObjectMeta(
            name=binding_name,
            namespace=namespace,
            annotations={"role": req.role, "user": req.email},
        ),
        role_ref=client.V1RoleRef(
            api_group="rbac.authorization.k8s.io",
            kind="ClusterRole",
            name=cluster_role,
        ),
        subjects=[client.RbacV1Subject(
            api_group="rbac.authorization.k8s.io",
            kind="User",
            name=req.email,
        )],
    )
    try:
        rbac_api.create_namespaced_role_binding(namespace, body)
    except ApiException as e:
        if e.status == 409:
            raise HTTPException(status_code=409, detail="이미 부여된 권한입니다")
        raise HTTPException(status_code=500, detail=f"RoleBinding 생성 실패: {e}")

    return {"status": "created", "namespace": namespace, "email": req.email, "role": req.role}


@router.delete("/users/{namespace}/contributors/{email}")
async def remove_contributor(namespace: str, email: str, request: Request):
    _check_admin(request)
    require_tenant_namespace(namespace)

    bindings = rbac_api.list_namespaced_role_binding(namespace)
    deleted = []
    for b in bindings.items:
        annotations = b.metadata.annotations or {}
        if annotations.get("user") == email:
            try:
                rbac_api.delete_namespaced_role_binding(b.metadata.name, namespace)
                deleted.append(b.metadata.name)
            except ApiException as e:
                raise HTTPException(status_code=500, detail=f"삭제 실패: {e}")

    if not deleted:
        raise HTTPException(status_code=404, detail=f"{email}의 RoleBinding이 없습니다")

    return {"status": "deleted", "deleted": deleted}


@router.put("/users/{namespace}/quota")
async def update_quota(namespace: str, req: QuotaUpdateRequest, request: Request):
    """사용자의 할당량 변경"""
    _check_admin(request)
    require_tenant_namespace(namespace)
    quota = _validated_quota(req)
    profile = custom_api.get_cluster_custom_object(
        "kubeflow.org", "v1", "profiles", namespace
    )
    profile["spec"]["resourceQuotaSpec"] = {
        "hard": {
            "requests.cpu": quota["cpu"],
            "requests.memory": quota["memory"],
            "requests.nvidia.com/gpu": quota["gpu"],
            "persistentvolumeclaims": quota["pvc"],
            "requests.storage": quota["storage"],
        }
    }
    custom_api.replace_cluster_custom_object(
        "kubeflow.org", "v1", "profiles", namespace, profile
    )
    return {"status": "updated", "namespace": namespace}


# ============================================================
# MLflow Retention / 디스크 정리
# ============================================================


def _mlflow_targets() -> list[dict]:
    """Return running MLflow pods managed by Prediction Manager.

    The system now provisions one tenant MLflow per Profile namespace. The
    legacy ray-system MLflow is kept as a compatibility target when it exists.
    """
    targets: list[dict] = []
    seen: set[tuple[str, str]] = set()

    if tenant_resources.TENANT_RESOURCES_ENABLED:
        for namespace in tenant_resources.known_profile_namespaces():
            try:
                ref = tenant_resources.find_mlflow_pod(core_v1, namespace)
            except Exception:  # nosec - namespace may be terminating
                ref = None
            if not ref:
                continue
            pod_ns, pod_name = ref
            key = (pod_ns, pod_name)
            if key in seen:
                continue
            seen.add(key)
            targets.append({
                "name": namespace,
                "scope": "tenant",
                "namespace": namespace,
                "pod_namespace": pod_ns,
                "pod_name": pod_name,
                "base_url": tenant_resources.mlflow_tracking_uri(namespace),
            })

    try:
        pods = core_v1.list_namespaced_pod("ray-system", label_selector="app=mlflow")
        for pod in pods.items:
            if pod.status.phase != "Running":
                continue
            key = ("ray-system", pod.metadata.name)
            if key in seen:
                continue
            seen.add(key)
            import os as _os
            targets.append({
                "name": "ray-system",
                "scope": "legacy",
                "namespace": None,
                "pod_namespace": "ray-system",
                "pod_name": pod.metadata.name,
                "base_url": _os.environ.get(
                    "MLFLOW_URI", "http://mlflow-service.ray-system:5000"
                ),
            })
    except Exception:  # nosec - legacy MLflow is optional
        pass

    return targets


def _exec_mlflow_pod(target: dict, command: str) -> str:
    from kubernetes.stream import stream

    return stream(
        core_v1.connect_get_namespaced_pod_exec,
        target["pod_name"],
        target["pod_namespace"],
        command=["sh", "-c", command],
        stderr=True,
        stdin=False,
        stdout=True,
        tty=False,
    )


def _parse_gc_output(out: str) -> dict:
    exit_match = re.search(r"PM_GC_EXIT_CODE=(\d+)", out)
    deleted = [int(v) for v in re.findall(r"PM_DELETED_RUNS=(\d+)", out)]
    artifact = [int(v) for v in re.findall(r"PM_ARTIFACT_BYTES=(\d+)", out)]
    return {
        "exit_code": int(exit_match.group(1)) if exit_match else None,
        "deleted_runs_before": deleted[0] if deleted else None,
        "deleted_runs_after": deleted[-1] if deleted else None,
        "artifact_bytes_before": artifact[0] if artifact else None,
        "artifact_bytes_after": artifact[-1] if artifact else None,
    }


_MLFLOW_COUNT_SCRIPT = r"""
python3 - <<'PODPY'
import json
import urllib.parse
import urllib.request

base = 'http://localhost:5000'


def _json(resp):
    data = resp.read()
    return json.loads(data.decode() or '{}')


def get(path, params):
    url = base + path + '?' + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=10) as resp:
        return _json(resp)


def post(path, payload):
    req = urllib.request.Request(
        base + path,
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return _json(resp)

try:
    experiments = get('/api/2.0/mlflow/experiments/search', {
        'max_results': 1000,
        'view_type': 'ALL',
    }).get('experiments', [])
    count = 0
    for exp in experiments:
        token = None
        while True:
            payload = {
                'experiment_ids': [str(exp['experiment_id'])],
                'run_view_type': 'DELETED_ONLY',
                'max_results': 1000,
            }
            if token:
                payload['page_token'] = token
            data = post('/api/2.0/mlflow/runs/search', payload)
            count += len(data.get('runs', []))
            token = data.get('next_page_token')
            if not token:
                break
    print(f'PM_DELETED_RUNS={count}')
except Exception as exc:
    print(f'PM_DELETED_RUNS_ERROR={type(exc).__name__}: {exc}')
PODPY
"""


def _mlflow_stats(base_url: str) -> dict:
    import httpx

    stats = {
        "experiments_active": 0,
        "experiments_deleted": 0,
        "runs_active": 0,
        "runs_deleted": 0,
        "registered_models": 0,
    }
    with httpx.Client(timeout=15) as client:
        resp = client.get(
            f"{base_url}/api/2.0/mlflow/experiments/search",
            params={"max_results": 1000, "view_type": "ALL"},
        )
        if resp.status_code != 200:
            return stats
        experiments = resp.json().get("experiments", [])
        for exp in experiments:
            if exp.get("lifecycle_stage") == "active":
                stats["experiments_active"] += 1
            else:
                stats["experiments_deleted"] += 1

            token = None
            while True:
                payload = {
                    "experiment_ids": [str(exp.get("experiment_id"))],
                    "run_view_type": "ALL",
                    "max_results": 1000,
                }
                if token:
                    payload["page_token"] = token
                runs = client.post(
                    f"{base_url}/api/2.0/mlflow/runs/search",
                    json=payload,
                )
                if runs.status_code != 200:
                    break
                data = runs.json()
                for run in data.get("runs", []):
                    if run.get("info", {}).get("lifecycle_stage") == "active":
                        stats["runs_active"] += 1
                    else:
                        stats["runs_deleted"] += 1
                token = data.get("next_page_token")
                if not token:
                    break

        models = client.get(
            f"{base_url}/api/2.0/mlflow/registered-models/search",
            params={"max_results": 1000},
        )
        if models.status_code == 200:
            stats["registered_models"] = len(models.json().get("registered_models", []))
    return stats


@router.get("/mlflow/usage")
async def mlflow_usage(request: Request):
    """MLflow PVC 사용량 + run/artifact 통계 조회."""
    _check_admin(request)

    targets = _mlflow_targets()
    if not targets:
        raise HTTPException(status_code=503, detail="MLflow pod 없음")

    totals = {
        "total_bytes": 0,
        "used_bytes": 0,
        "available_bytes": 0,
        "artifact_bytes": 0,
        "db_bytes": 0,
        "experiments_active": 0,
        "experiments_deleted": 0,
        "runs_active": 0,
        "runs_deleted": 0,
        "registered_models": 0,
    }
    target_rows = []

    for target in targets:
        row = {
            "name": target["name"],
            "scope": target["scope"],
            "pod_namespace": target["pod_namespace"],
            "pod_name": target["pod_name"],
        }
        try:
            out = _exec_mlflow_pod(
                target,
                "df -B1 /mlflow | awk 'NR==2{print \"PM_DF=\"$2\" \"$3\" \"$4}'; "
                "du -sb /mlflow/mlartifacts 2>/dev/null | awk '{print \"PM_ARTIFACT_BYTES=\"$1}' || echo PM_ARTIFACT_BYTES=0",
            )
            df_match = re.search(r"PM_DF=(\d+) (\d+) (\d+)", out)
            artifact_match = re.search(r"PM_ARTIFACT_BYTES=(\d+)", out)
            row["total_bytes"] = int(df_match.group(1)) if df_match else 0
            row["used_bytes"] = int(df_match.group(2)) if df_match else 0
            row["available_bytes"] = int(df_match.group(3)) if df_match else 0
            row["artifact_bytes"] = int(artifact_match.group(1)) if artifact_match else 0
            row["db_bytes"] = 0
        except Exception as exc:
            row["error"] = f"exec 실패: {type(exc).__name__}"
            row.update({
                "total_bytes": 0,
                "used_bytes": 0,
                "available_bytes": 0,
                "artifact_bytes": 0,
                "db_bytes": 0,
            })

        try:
            row.update(_mlflow_stats(target["base_url"]))
        except Exception as exc:  # nosec - display partial usage if API fails
            row["stats_error"] = type(exc).__name__
            row.update({
                "experiments_active": 0,
                "experiments_deleted": 0,
                "runs_active": 0,
                "runs_deleted": 0,
                "registered_models": 0,
            })

        for key in totals:
            totals[key] += int(row.get(key) or 0)
        target_rows.append(row)

    return {
        **totals,
        "used_pct": round(totals["used_bytes"] / totals["total_bytes"] * 100, 1)
        if totals["total_bytes"] else 0,
        "targets": target_rows,
    }


class MLflowGCRequest(BaseModel):
    older_than_days: int = 30


@router.post("/mlflow/gc")
async def mlflow_gc(req: MLflowGCRequest, request: Request):
    """MLflow GC 수동 실행. 지정 일수 이상 지난 deleted run 영구 제거."""
    _check_admin(request)

    targets = _mlflow_targets()
    if not targets:
        raise HTTPException(status_code=503, detail="MLflow pod 없음")

    days = max(0, int(req.older_than_days))
    results = []
    summary_lines = []

    for target in targets:
        cmd = f"""
set +e
echo '---before---'
du -sb /mlflow/mlartifacts 2>/dev/null | awk '{{print "PM_ARTIFACT_BYTES=" $1}}' || echo PM_ARTIFACT_BYTES=0
{_MLFLOW_COUNT_SCRIPT}
export MLFLOW_TRACKING_URI=http://localhost:5000
backend_store_uri="${{MLFLOW_BACKEND_STORE_URI:?MLFLOW_BACKEND_STORE_URI is required}}"
gc_output=$(mlflow gc --backend-store-uri "$backend_store_uri" --artifacts-destination file:///mlflow/mlartifacts --older-than {days}d 2>&1)
rc=$?
printf '%s\n' "$gc_output" | tail -100
echo "PM_GC_EXIT_CODE=$rc"
echo '---after---'
du -sb /mlflow/mlartifacts 2>/dev/null | awk '{{print "PM_ARTIFACT_BYTES=" $1}}' || echo PM_ARTIFACT_BYTES=0
{_MLFLOW_COUNT_SCRIPT}
exit 0
"""
        try:
            out = _exec_mlflow_pod(target, cmd)
            parsed = _parse_gc_output(out)
            failed = parsed["exit_code"] != 0
            warning = None
            if (
                days == 0
                and parsed["exit_code"] == 0
                and (parsed["deleted_runs_before"] or 0) > 0
                and (parsed["deleted_runs_after"] or 0) > 0
            ):
                warning = "0일 즉시 정리 후에도 deleted run이 남아 있습니다"
            result = {
                "name": target["name"],
                "scope": target["scope"],
                "pod_namespace": target["pod_namespace"],
                "pod_name": target["pod_name"],
                "status": "failed" if failed else "ok",
                "warning": warning,
                "output": out[-4000:],
                **parsed,
            }
        except Exception as exc:
            result = {
                "name": target["name"],
                "scope": target["scope"],
                "pod_namespace": target["pod_namespace"],
                "pod_name": target["pod_name"],
                "status": "failed",
                "error": f"exec 실패: {type(exc).__name__}: {exc}",
            }

        before = result.get("deleted_runs_before")
        after = result.get("deleted_runs_after")
        removed = None if before is None or after is None else max(0, before - after)
        line = (
            f"[{result['name']}] {result['status']} "
            f"deleted_runs {before if before is not None else '?'} -> {after if after is not None else '?'}"
        )
        if removed is not None:
            line += f" (removed {removed})"
        if result.get("warning"):
            line += f" / warning: {result['warning']}"
        if result.get("error"):
            line += f" / error: {result['error']}"
        summary_lines.append(line)
        results.append(result)

    failed_count = len([r for r in results if r.get("status") != "ok"])
    warning_count = len([r for r in results if r.get("warning")])
    status = "ok" if failed_count == 0 and warning_count == 0 else "partial_failed"

    return {
        "status": status,
        "older_than_days": days,
        "targets": results,
        "output": "\n".join(summary_lines),
    }
