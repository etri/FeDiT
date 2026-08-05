from __future__ import annotations

from pathlib import Path

from kubernetes import client, config

try:
    config.load_incluster_config()
except config.ConfigException:
    config.load_kube_config()

_BASE_CONFIG = client.Configuration.get_default_copy()


def api_client() -> client.ApiClient:
    """Return a Kubernetes ApiClient with the in-cluster service account token."""
    api = client.ApiClient(_BASE_CONFIG)
    token_path = Path("/var/run/secrets/kubernetes.io/serviceaccount/token")
    try:
        token = token_path.read_text(encoding="utf-8").strip()
    except OSError:
        token = ""  # nosec
    if token:
        api.default_headers["authorization"] = f"Bearer {token}"
    return api


def core_v1() -> client.CoreV1Api:
    return client.CoreV1Api(api_client())


def custom_objects() -> client.CustomObjectsApi:
    return client.CustomObjectsApi(api_client())


def apps_v1() -> client.AppsV1Api:
    return client.AppsV1Api(api_client())


def rbac_v1() -> client.RbacAuthorizationV1Api:
    return client.RbacAuthorizationV1Api(api_client())


def batch_v1() -> client.BatchV1Api:
    return client.BatchV1Api(api_client())
