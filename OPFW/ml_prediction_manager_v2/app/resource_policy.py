"""Application management must never target platform namespaces or repositories."""
import re
from pathlib import PurePosixPath

from fastapi import HTTPException

PLATFORM_NAMESPACES = frozenset({
    "default", "kubeflow", "kubeflow-system", "istio-system", "auth", "keycloak",
    "cert-manager", "monitoring", "calico-system", "tigera-operator",
    "knative-serving", "knative-eventing", "kserve", "kserve-system",
    "kuberay-operator", "ray-system", "local-path-storage", "metacontroller",
})
_NAMESPACE = re.compile(r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\Z")
_REPOSITORY = re.compile(r"[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*\Z")


def is_tenant_namespace(namespace: str) -> bool:
    return bool(isinstance(namespace, str) and _NAMESPACE.fullmatch(namespace)
                and namespace.startswith("kubeflow-")
                and namespace not in PLATFORM_NAMESPACES
                and not namespace.startswith(("kube-", "istio-", "knative-", "calico-")))


def require_tenant_namespace(namespace: str) -> str:
    if not is_tenant_namespace(namespace):
        raise HTTPException(403, "플랫폼 시스템 영역은 예측매니저에서 관리할 수 없습니다.")
    return namespace


def image_owner(name: str) -> str | None:
    parts = name.split("/")
    if len(parts) != 2:
        return None
    namespace, repository = parts
    if (not namespace.startswith("kubeflow-") or not is_tenant_namespace(namespace)
            or not _REPOSITORY.fullmatch(repository)):
        return None
    return namespace


def require_image_owner(name: str, namespace: str) -> None:
    require_tenant_namespace(namespace)
    if image_owner(name) != namespace:
        raise HTTPException(403, "선택한 사용자 영역의 이미지만 관리할 수 있습니다.")


def validate_user_mount_path(value: str) -> str:
    path = PurePosixPath(value)
    roots = ("/home/jovyan", "/home/rstudio", "/workspace")
    if (len(value) > 256 or not value.startswith("/") or ".." in path.parts
            or str(path) != value or not any(value == root or value.startswith(root + "/") for root in roots)):
        raise ValueError("볼륨은 /home/jovyan, /home/rstudio, /workspace 아래에만 연결할 수 있습니다.")
    return value
