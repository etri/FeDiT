from __future__ import annotations

import os
from pathlib import Path

from kubernetes import client, config

KUBERNETES_AVAILABLE = True

try:
    config.load_incluster_config()
except config.ConfigException:
    try:
        config.load_kube_config()
    except config.ConfigException:
        # The UI and read-only health endpoints should still be able to start
        # when this image is run without a Kubernetes cluster. Kubernetes
        # backed operations will fail at their own request boundary instead of
        # preventing the FastAPI process from importing.
        KUBERNETES_AVAILABLE = False
        fallback = client.Configuration()
        fallback.host = os.getenv(
            'KUBERNETES_API_URL',
            'http://127.0.0.1:65535',
        )
        fallback.verify_ssl = False
        client.Configuration.set_default(fallback)

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
