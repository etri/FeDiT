from __future__ import annotations

import os
import re
import time
from dataclasses import dataclass
from urllib.parse import urlparse

from kubernetes import client
from kubernetes.client.rest import ApiException

from app.auth import ADMIN_EMAILS
from app.config import settings
from app.services import kubernetes_client

apps_v1 = kubernetes_client.apps_v1()
core_v1 = kubernetes_client.core_v1()
custom_api = kubernetes_client.custom_objects()
batch_v1 = kubernetes_client.batch_v1()
rbac_api = kubernetes_client.rbac_v1()

def _registry_host() -> str:
    explicit = os.environ.get("PM_TENANT_IMAGE_REGISTRY", "").strip().rstrip("/")
    if explicit:
        return explicit
    registry_host = os.environ.get("REGISTRY_HOST", "").strip().rstrip("/")
    if registry_host and "registry.example.local" not in registry_host:
        return registry_host
    registry_url = os.environ.get("REGISTRY_URL", "").strip()
    if registry_url:
        parsed = urlparse(registry_url if "://" in registry_url else f"http://{registry_url}")
        if parsed.netloc and "registry.example.local" not in parsed.netloc:
            return parsed.netloc.rstrip("/")
    return registry_host or "registry.example.local:5000"


def _tenant_image(env_name: str, image_name: str, fallback: str | None = None) -> str:
    value = os.environ.get(env_name, "").strip()
    if value and "registry.example.local" not in value and "<" not in value:
        return value
    registry = _registry_host()
    if registry and "registry.example.local" not in registry:
        return f"{registry}/{image_name}"
    return value or fallback or f"{registry}/{image_name}"


MLFLOW_IMAGE = _tenant_image(
    "PM_TENANT_MLFLOW_IMAGE", "mlflow-postgres:v3.11.1-pg"
)
MLFLOW_BACKEND_STORE_SECRET_NAME = os.environ.get(
    "PM_MLFLOW_BACKEND_STORE_SECRET_NAME", "mlflow-postgres-backend"
)
MLFLOW_BACKEND_STORE_SECRET_KEY = os.environ.get(
    "PM_MLFLOW_BACKEND_STORE_SECRET_KEY", "MLFLOW_BACKEND_STORE_URI"
)
PROVISIONER_NAMESPACE = os.environ.get("PM_PROVISIONER_NAMESPACE", "kubeflow")
PROVISIONER_SERVICE_ACCOUNT = os.environ.get(
    "PM_PROVISIONER_SERVICE_ACCOUNT", "prediction-manager-provisioner"
)
PROVISIONER_ROLEBINDING_NAME = os.environ.get(
    "PM_PROVISIONER_ROLEBINDING_NAME", "prediction-manager-provisioner"
)
PROVISIONER_CLUSTER_ROLE = os.environ.get(
    "PM_PROVISIONER_CLUSTER_ROLE", "prediction-manager-tenant-secret-provisioner"
)
PROVISIONER_IMAGE = _tenant_image(
    "PM_PROVISIONER_IMAGE", "prediction-manager-app:20260610-remaining-tc-fixes"
)
PROVISIONER_CONFIG_SECRET_NAME = os.environ.get(
    "PM_PROVISIONER_CONFIG_SECRET_NAME", "prediction-manager-postgres"
)
PROVISIONER_TEMPLATE_KEY = os.environ.get(
    "PM_PROVISIONER_TEMPLATE_KEY", "PM_MLFLOW_BACKEND_STORE_URI_TEMPLATE"
)
RAY_IMAGE = _tenant_image("PM_TENANT_RAY_IMAGE", "ray-mlflow:2.54.1")
NIFI_IMAGE = _tenant_image(
    "PM_TENANT_NIFI_IMAGE", "prediction-manager-nifi-python:1.28.1-pm2"
)
NIFI_RUN_AS_USER = int(os.environ.get("PM_TENANT_NIFI_RUN_AS_USER", "1000"))
NIFI_RUN_AS_GROUP = int(os.environ.get("PM_TENANT_NIFI_RUN_AS_GROUP", "1000"))
NIFI_FS_GROUP = int(os.environ.get("PM_TENANT_NIFI_FS_GROUP", "1000"))
TENANT_STORAGE_CLASS = os.environ.get("PM_TENANT_STORAGE_CLASS", "").strip() or None
MLFLOW_STORAGE_CLASS = os.environ.get("PM_TENANT_MLFLOW_STORAGE_CLASS", "").strip() or TENANT_STORAGE_CLASS
NIFI_STORAGE_CLASS = os.environ.get("PM_TENANT_NIFI_STORAGE_CLASS", "").strip() or TENANT_STORAGE_CLASS
MLFLOW_REQUEST_CPU = os.environ.get("PM_TENANT_MLFLOW_REQUEST_CPU", "500m")
MLFLOW_REQUEST_MEMORY = os.environ.get("PM_TENANT_MLFLOW_REQUEST_MEMORY", "1Gi")
MLFLOW_LIMIT_CPU = os.environ.get("PM_TENANT_MLFLOW_LIMIT_CPU", "2")
MLFLOW_LIMIT_MEMORY = os.environ.get("PM_TENANT_MLFLOW_LIMIT_MEMORY", "4Gi")
NIFI_REQUEST_CPU = os.environ.get("PM_TENANT_NIFI_REQUEST_CPU", "250m")
NIFI_REQUEST_MEMORY = os.environ.get("PM_TENANT_NIFI_REQUEST_MEMORY", "1Gi")
NIFI_LIMIT_CPU = os.environ.get("PM_TENANT_NIFI_LIMIT_CPU", "1")
NIFI_LIMIT_MEMORY = os.environ.get("PM_TENANT_NIFI_LIMIT_MEMORY", "2Gi")
TENANT_PROVISION_TIMEOUT = int(os.environ.get("PM_TENANT_PROVISION_TIMEOUT", "180"))
RAY_CPU_WORKER_ENABLED = os.environ.get("PM_TENANT_RAY_CPU_WORKER_ENABLED", "true").lower() in (
    "1",
    "true",
    "yes",
    "on",
)
RAY_CPU_WORKER_MAX_REPLICAS = int(os.environ.get("PM_TENANT_RAY_CPU_WORKER_MAX_REPLICAS", "1"))
RAY_CPU_WORKER_REQUEST_CPU = os.environ.get("PM_TENANT_RAY_CPU_WORKER_REQUEST_CPU", "1")
RAY_CPU_WORKER_REQUEST_MEMORY = os.environ.get("PM_TENANT_RAY_CPU_WORKER_REQUEST_MEMORY", "1Gi")
RAY_CPU_WORKER_LIMIT_CPU = os.environ.get("PM_TENANT_RAY_CPU_WORKER_LIMIT_CPU", "2")
RAY_CPU_WORKER_LIMIT_MEMORY = os.environ.get("PM_TENANT_RAY_CPU_WORKER_LIMIT_MEMORY", "3Gi")
RAY_HEAD_REQUEST_CPU = os.environ.get("PM_TENANT_RAY_HEAD_REQUEST_CPU", "250m")
RAY_HEAD_REQUEST_MEMORY = os.environ.get("PM_TENANT_RAY_HEAD_REQUEST_MEMORY", "2Gi")
RAY_HEAD_LIMIT_CPU = os.environ.get("PM_TENANT_RAY_HEAD_LIMIT_CPU", "1")
RAY_HEAD_LIMIT_MEMORY = os.environ.get("PM_TENANT_RAY_HEAD_LIMIT_MEMORY", "3Gi")
RAY_AUTOSCALER_REQUEST_CPU = os.environ.get("PM_TENANT_RAY_AUTOSCALER_REQUEST_CPU", "500m")
RAY_AUTOSCALER_REQUEST_MEMORY = os.environ.get("PM_TENANT_RAY_AUTOSCALER_REQUEST_MEMORY", "512Mi")
RAY_AUTOSCALER_LIMIT_CPU = os.environ.get("PM_TENANT_RAY_AUTOSCALER_LIMIT_CPU", "500m")
RAY_AUTOSCALER_LIMIT_MEMORY = os.environ.get("PM_TENANT_RAY_AUTOSCALER_LIMIT_MEMORY", "512Mi")
NIFI_JVM_HEAP_INIT = os.environ.get("PM_TENANT_NIFI_JVM_HEAP_INIT", "512m")
NIFI_JVM_HEAP_MAX = os.environ.get("PM_TENANT_NIFI_JVM_HEAP_MAX", "1g")
RAY_GPU_WORKER_ENABLED = os.environ.get("PM_TENANT_RAY_GPU_WORKER_ENABLED", "true").lower() in (
    "1",
    "true",
    "yes",
    "on",
)
RAY_GPU_WORKER_MAX_REPLICAS = int(os.environ.get("PM_TENANT_RAY_GPU_WORKER_MAX_REPLICAS", "1"))
RAY_GPU_WORKER_REQUEST_CPU = os.environ.get("PM_TENANT_RAY_GPU_WORKER_REQUEST_CPU", "500m")
RAY_GPU_WORKER_REQUEST_MEMORY = os.environ.get("PM_TENANT_RAY_GPU_WORKER_REQUEST_MEMORY", "1Gi")
RAY_GPU_WORKER_REQUEST_GPU = os.environ.get("PM_TENANT_RAY_GPU_WORKER_REQUEST_GPU", "1")
RAY_GPU_WORKER_LIMIT_CPU = os.environ.get("PM_TENANT_RAY_GPU_WORKER_LIMIT_CPU", "2")
RAY_GPU_WORKER_LIMIT_MEMORY = os.environ.get("PM_TENANT_RAY_GPU_WORKER_LIMIT_MEMORY", "4Gi")
RAY_GPU_WORKER_LIMIT_GPU = os.environ.get("PM_TENANT_RAY_GPU_WORKER_LIMIT_GPU", "1")


@dataclass
class TenantProvisionResult:
    namespace: str
    owner_email: str
    resources: list[str]


def _external_host() -> str:
    parsed = urlparse(settings.kubeflow_url)
    return parsed.netloc or settings.kubeflow_url.replace("https://", "").replace("http://", "")


def _labels(app: str | None = None) -> dict:
    labels = {"app.kubernetes.io/managed-by": "prediction-manager"}
    if app:
        labels["app"] = app
    return labels


def _label_tenant_namespace(namespace: str) -> str:
    core_v1.patch_namespace(
        namespace,
        {"metadata": {"labels": {"prediction-manager.io/tenant": "true"}}},
    )
    return f"namespace/{namespace}:labeled"


def _owner_annotation(owner_email: str) -> dict:
    return {"prediction-manager.io/owner-email": owner_email}


def _policy_name(namespace: str) -> str:
    name = f"pm-private-dashboards-{namespace}"
    return name[:63].rstrip("-")


def _wait_for_namespace(namespace: str) -> None:
    deadline = time.time() + TENANT_PROVISION_TIMEOUT
    last_error: Exception | None = None
    while time.time() < deadline:
        try:
            ns = core_v1.read_namespace(namespace)
            if not ns.metadata.deletion_timestamp:
                return
            last_error = RuntimeError(f"namespace 삭제 진행 중: {namespace}")
        except ApiException as exc:
            last_error = exc
            if exc.status != 404:
                raise
        time.sleep(2)
    raise RuntimeError(f"namespace 생성 대기 시간 초과: {namespace} ({last_error})")


def _provisioner_job_name(namespace: str) -> str:
    suffix = str(int(time.time()))[-8:]
    base = f"pm-tenant-provision-{namespace}"
    max_base = 63 - len(suffix) - 1
    return f"{base[:max_base].rstrip('-')}-{suffix}"


def _job_logs(namespace: str, job_name: str) -> str:
    try:
        pods = core_v1.list_namespaced_pod(namespace, label_selector=f"job-name={job_name}")
        chunks = []
        for pod in pods.items[:3]:
            try:
                chunks.append(core_v1.read_namespaced_pod_log(pod.metadata.name, namespace, tail_lines=80))
            except Exception:  # nosec
                pass
        return "\n".join(chunks)[-3000:]
    except Exception:
        return ""


def _wait_for_job(namespace: str, job_name: str) -> None:
    deadline = time.time() + TENANT_PROVISION_TIMEOUT
    last_state = "created"
    while time.time() < deadline:
        job = batch_v1.read_namespaced_job(job_name, namespace)
        status = job.status
        if status.succeeded:
            return
        if status.failed:
            logs = _job_logs(namespace, job_name)
            detail = f"tenant provisioner job failed: {job_name}"
            if logs:
                detail += f"\n{logs}"
            raise RuntimeError(detail)
        if status.active:
            last_state = "active"
        time.sleep(2)
    logs = _job_logs(namespace, job_name)
    detail = f"tenant provisioner job timeout: {job_name} state={last_state}"
    if logs:
        detail += f"\n{logs}"
    raise RuntimeError(detail)


def _apply_secret_provisioner_binding(namespace: str) -> str:
    body = client.V1RoleBinding(
        metadata=client.V1ObjectMeta(
            name=PROVISIONER_ROLEBINDING_NAME,
            namespace=namespace,
            labels=_labels("tenant-provisioner"),
        ),
        subjects=[
            client.RbacV1Subject(
                kind="ServiceAccount",
                name=PROVISIONER_SERVICE_ACCOUNT,
                namespace=PROVISIONER_NAMESPACE,
            )
        ],
        role_ref=client.V1RoleRef(
            api_group="rbac.authorization.k8s.io",
            kind="ClusterRole",
            name=PROVISIONER_CLUSTER_ROLE,
        ),
    )
    try:
        rbac_api.read_namespaced_role_binding(PROVISIONER_ROLEBINDING_NAME, namespace)
        rbac_api.patch_namespaced_role_binding(PROVISIONER_ROLEBINDING_NAME, namespace, body)
        return f"rolebinding/{PROVISIONER_ROLEBINDING_NAME}:patched"
    except ApiException as exc:
        if exc.status != 404:
            raise
    try:
        rbac_api.create_namespaced_role_binding(namespace, body)
        return f"rolebinding/{PROVISIONER_ROLEBINDING_NAME}:created"
    except ApiException as exc:
        if exc.status != 409:
            raise
        rbac_api.patch_namespaced_role_binding(PROVISIONER_ROLEBINDING_NAME, namespace, body)
        return f"rolebinding/{PROVISIONER_ROLEBINDING_NAME}:patched"


def _run_tenant_provisioner(namespace: str) -> str:
    job_name = _provisioner_job_name(namespace)
    labels = {**_labels("tenant-provisioner"), "prediction-manager.io/target-namespace": namespace}
    job = client.V1Job(
        metadata=client.V1ObjectMeta(name=job_name, namespace=PROVISIONER_NAMESPACE, labels=labels),
        spec=client.V1JobSpec(
            backoff_limit=0,
            ttl_seconds_after_finished=600,
            template=client.V1PodTemplateSpec(
                metadata=client.V1ObjectMeta(
                    labels=labels,
                    annotations={"sidecar.istio.io/inject": "false"},
                ),
                spec=client.V1PodSpec(
                    restart_policy="Never",
                    service_account_name=PROVISIONER_SERVICE_ACCOUNT,
                    containers=[
                        client.V1Container(
                            name="tenant-provisioner",
                            image=PROVISIONER_IMAGE,
                            image_pull_policy="Always",
                            command=["python", "-m", "app.provisioner.tenant_mlflow"],
                            env=[
                                client.V1EnvVar(name="TARGET_NAMESPACE", value=namespace),
                                client.V1EnvVar(name="MLFLOW_SECRET_NAME", value=MLFLOW_BACKEND_STORE_SECRET_NAME),
                                client.V1EnvVar(name="MLFLOW_SECRET_KEY", value=MLFLOW_BACKEND_STORE_SECRET_KEY),
                                client.V1EnvVar(
                                    name="MLFLOW_BACKEND_STORE_URI_TEMPLATE",
                                    value_from=client.V1EnvVarSource(
                                        secret_key_ref=client.V1SecretKeySelector(
                                            name=PROVISIONER_CONFIG_SECRET_NAME,
                                            key=PROVISIONER_TEMPLATE_KEY,
                                        )
                                    ),
                                ),
                            ],
                            resources=client.V1ResourceRequirements(
                                requests={"cpu": "50m", "memory": "128Mi"},
                                limits={"cpu": "250m", "memory": "512Mi"},
                            ),
                        )
                    ],
                ),
            ),
        ),
    )
    batch_v1.create_namespaced_job(PROVISIONER_NAMESPACE, job)
    _wait_for_job(PROVISIONER_NAMESPACE, job_name)
    return f"job/{job_name}:succeeded"


def _apply_service(namespace: str, body: client.V1Service) -> str:
    name = body.metadata.name
    try:
        core_v1.read_namespaced_service(name, namespace)
        core_v1.patch_namespaced_service(name, namespace, body)
        return f"service/{name}:patched"
    except ApiException as exc:
        if exc.status != 404:
            raise
    try:
        core_v1.create_namespaced_service(namespace, body)
        return f"service/{name}:created"
    except ApiException as exc:
        if exc.status != 409:
            raise
        core_v1.patch_namespaced_service(name, namespace, body)
        return f"service/{name}:patched"


def _apply_pvc(namespace: str, body: client.V1PersistentVolumeClaim) -> str:
    name = body.metadata.name
    try:
        core_v1.read_namespaced_persistent_volume_claim(name, namespace)
        return f"pvc/{name}:exists"
    except ApiException as exc:
        if exc.status != 404:
            raise
    try:
        core_v1.create_namespaced_persistent_volume_claim(namespace, body)
        return f"pvc/{name}:created"
    except ApiException as exc:
        if exc.status != 409:
            raise
        return f"pvc/{name}:exists"


def _apply_deployment(namespace: str, body: client.V1Deployment) -> str:
    name = body.metadata.name
    try:
        apps_v1.read_namespaced_deployment(name, namespace)
        apps_v1.patch_namespaced_deployment(name, namespace, body)
        return f"deployment/{name}:patched"
    except ApiException as exc:
        if exc.status != 404:
            raise
    try:
        apps_v1.create_namespaced_deployment(namespace, body)
        return f"deployment/{name}:created"
    except ApiException as exc:
        if exc.status != 409:
            raise
        apps_v1.patch_namespaced_deployment(name, namespace, body)
        return f"deployment/{name}:patched"


def _apply_statefulset(namespace: str, body: client.V1StatefulSet) -> str:
    name = body.metadata.name
    try:
        existing = apps_v1.read_namespaced_stateful_set(name, namespace)
        body.spec.selector = existing.spec.selector
        body.spec.service_name = existing.spec.service_name
        body.spec.volume_claim_templates = existing.spec.volume_claim_templates
        apps_v1.patch_namespaced_stateful_set(name, namespace, body)
        return f"statefulset/{name}:patched"
    except ApiException as exc:
        if exc.status != 404:
            raise
    try:
        apps_v1.create_namespaced_stateful_set(namespace, body)
        return f"statefulset/{name}:created"
    except ApiException as exc:
        if exc.status != 409:
            raise
        apps_v1.patch_namespaced_stateful_set(name, namespace, body)
        return f"statefulset/{name}:patched"


def _apply_custom_object(group: str, version: str, namespace: str, plural: str, body: dict) -> str:
    name = body["metadata"]["name"]
    try:
        custom_api.create_namespaced_custom_object(group, version, namespace, plural, body)
        return f"{plural}/{name}:created"
    except ApiException as exc:
        if exc.status != 409:
            raise
        custom_api.patch_namespaced_custom_object(group, version, namespace, plural, name, body)
        return f"{plural}/{name}:patched"


def _delete_custom_object(group: str, version: str, namespace: str, plural: str, name: str) -> str:
    try:
        custom_api.delete_namespaced_custom_object(group, version, namespace, plural, name)
        return f"{plural}/{name}:deleted"
    except ApiException as exc:
        if exc.status == 404:
            return f"{plural}/{name}:missing"
        raise


def _delete_namespaced(kind: str, namespace: str, name: str) -> str:
    try:
        if kind == "deployment":
            apps_v1.delete_namespaced_deployment(name, namespace)
        elif kind == "statefulset":
            apps_v1.delete_namespaced_stateful_set(name, namespace)
        elif kind == "service":
            core_v1.delete_namespaced_service(name, namespace)
        elif kind == "pvc":
            core_v1.delete_namespaced_persistent_volume_claim(name, namespace)
        elif kind == "rolebinding":
            rbac_api.delete_namespaced_role_binding(name, namespace)
        else:
            raise ValueError(f"unsupported kind: {kind}")
        return f"{kind}/{name}:deleted"
    except ApiException as exc:
        if exc.status == 404:
            return f"{kind}/{name}:missing"
        raise


def _mlflow_pvc(namespace: str, owner_email: str) -> client.V1PersistentVolumeClaim:
    return client.V1PersistentVolumeClaim(
        metadata=client.V1ObjectMeta(
            name="pm-mlflow-data",
            namespace=namespace,
            labels=_labels("pm-mlflow"),
            annotations=_owner_annotation(owner_email),
        ),
        spec=client.V1PersistentVolumeClaimSpec(
            access_modes=["ReadWriteOnce"],
            storage_class_name=MLFLOW_STORAGE_CLASS,
            resources=client.V1ResourceRequirements(requests={"storage": "20Gi"}),
        ),
    )


def _mlflow_deployment(namespace: str, owner_email: str) -> client.V1Deployment:
    labels = _labels("pm-mlflow")
    return client.V1Deployment(
        metadata=client.V1ObjectMeta(
            name="pm-mlflow",
            namespace=namespace,
            labels=labels,
            annotations=_owner_annotation(owner_email),
        ),
        spec=client.V1DeploymentSpec(
            replicas=1,
            selector=client.V1LabelSelector(match_labels={"app": "pm-mlflow"}),
            template=client.V1PodTemplateSpec(
                metadata=client.V1ObjectMeta(
                    labels={"app": "pm-mlflow"},
                    annotations={"sidecar.istio.io/inject": "false"},
                ),
                spec=client.V1PodSpec(
                    containers=[
                        client.V1Container(
                            name="mlflow",
                            image=MLFLOW_IMAGE,
                            command=["sh", "-c"],
                            args=[
                                'test -n "$MLFLOW_BACKEND_STORE_URI" && '
                                "mlflow server "
                                "--host 0.0.0.0 "
                                "--workers 1 "
                                '--backend-store-uri "$MLFLOW_BACKEND_STORE_URI" '
                                "--artifacts-destination file:///mlflow/mlartifacts "
                                "--serve-artifacts "
                                "--allowed-hosts '*' "
                                "--cors-allowed-origins '*'"
                            ],
                            env=[
                                client.V1EnvVar(
                                    name="MLFLOW_BACKEND_STORE_URI",
                                    value_from=client.V1EnvVarSource(
                                        secret_key_ref=client.V1SecretKeySelector(
                                            name=MLFLOW_BACKEND_STORE_SECRET_NAME,
                                            key=MLFLOW_BACKEND_STORE_SECRET_KEY,
                                        )
                                    ),
                                )
                            ],
                            ports=[client.V1ContainerPort(container_port=5000, name="http")],
                            resources=client.V1ResourceRequirements(
                                requests={"cpu": MLFLOW_REQUEST_CPU, "memory": MLFLOW_REQUEST_MEMORY},
                                limits={"cpu": MLFLOW_LIMIT_CPU, "memory": MLFLOW_LIMIT_MEMORY},
                            ),
                            volume_mounts=[
                                client.V1VolumeMount(name="data", mount_path="/mlflow")
                            ],
                        )
                    ],
                    volumes=[
                        client.V1Volume(
                            name="data",
                            persistent_volume_claim=client.V1PersistentVolumeClaimVolumeSource(
                                claim_name="pm-mlflow-data"
                            ),
                        )
                    ],
                ),
            ),
        ),
    )


def _service(namespace: str, name: str, app: str, port: int, target_port: int) -> client.V1Service:
    return client.V1Service(
        metadata=client.V1ObjectMeta(name=name, namespace=namespace, labels=_labels(app)),
        spec=client.V1ServiceSpec(
            selector={"app": app},
            ports=[client.V1ServicePort(name="http", port=port, target_port=target_port)],
        ),
    )


def _simple_virtual_service(
    namespace: str,
    name: str,
    path: str,
    destination_host: str,
    destination_port: int,
) -> dict:
    return {
        "apiVersion": "networking.istio.io/v1",
        "kind": "VirtualService",
        "metadata": {"name": name, "namespace": namespace, "labels": _labels()},
        "spec": {
            "gateways": ["kubeflow/kubeflow-gateway"],
            "hosts": ["*"],
            "http": [
                {
                    "match": [
                        {"uri": {"exact": path}},
                        {"uri": {"prefix": f"{path}/"}},
                    ],
                    "rewrite": {"uri": "/"},
                    "route": [
                        {
                            "destination": {
                                "host": destination_host,
                                "port": {"number": destination_port},
                            }
                        }
                    ],
                }
            ],
        },
    }


def _ray_cluster(namespace: str, owner_email: str) -> dict:
    spec = {
        "rayVersion": "2.54.1",
        "enableInTreeAutoscaling": True,
        "autoscalerOptions": {
            "upscalingMode": "Default",
            "idleTimeoutSeconds": 60,
            # The NVIDIA container runtime may be the node default in GPU
            # installations.  The KubeRay-injected autoscaler is CPU-only;
            # explicitly hide GPU devices so its container does not trigger
            # CDI/MIG probing while the GPU worker remains opt-in.
            "env": [{"name": "NVIDIA_VISIBLE_DEVICES", "value": ""}],
            "resources": {
                "requests": {
                    "cpu": RAY_AUTOSCALER_REQUEST_CPU,
                    "memory": RAY_AUTOSCALER_REQUEST_MEMORY,
                },
                "limits": {
                    "cpu": RAY_AUTOSCALER_LIMIT_CPU,
                    "memory": RAY_AUTOSCALER_LIMIT_MEMORY,
                },
            },
        },
        "headGroupSpec": {
            # A Ray Job driver does not consume a worker CPU, so reserve one
            # logical CPU on the head as a guaranteed fallback.  The previous
            # fixed value of 0 made every CPU trial infeasible on a compact
            # single-node installation when a worker pod was still pending.
            "rayStartParams": {"dashboard-host": "0.0.0.0", "num-cpus": "1"},  # nosec
            "template": {
                "metadata": {"annotations": {"sidecar.istio.io/inject": "false"}},
                "spec": {
                    "containers": [
                        {
                            "name": "ray-head",
                            "image": RAY_IMAGE,
                            "imagePullPolicy": "Always",
                            "ports": [
                                {"containerPort": 6379, "name": "gcs-server"},
                                {"containerPort": 8265, "name": "dashboard"},
                                {"containerPort": 10001, "name": "client"},
                            ],
                            "env": [
                                {
                                    "name": "RAY_PROMETHEUS_HOST",
                                    "value": "http://kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090",
                                },
                                {"name": "RAY_PROMETHEUS_NAME", "value": "Prometheus"},
                                {"name": "NVIDIA_VISIBLE_DEVICES", "value": ""},
                            ],
                            "resources": {
                                # The request is separately configurable from the limit so a
                                # complete single-node CPU stack can be scheduled on a small host
                                # without constraining the Ray process on a larger host.
                                "requests": {
                                    "cpu": RAY_HEAD_REQUEST_CPU,
                                    "memory": RAY_HEAD_REQUEST_MEMORY,
                                },
                                "limits": {
                                    "cpu": RAY_HEAD_LIMIT_CPU,
                                    "memory": RAY_HEAD_LIMIT_MEMORY,
                                },
                            },
                        }
                    ]
                },
            },
        },
    }
    worker_group_specs = []
    if RAY_CPU_WORKER_ENABLED and RAY_CPU_WORKER_MAX_REPLICAS > 0:
        worker_group_specs.append(
            {
                "groupName": "cpu",
                "replicas": 0,
                "minReplicas": 0,
                "maxReplicas": RAY_CPU_WORKER_MAX_REPLICAS,
                "rayStartParams": {},
                "template": {
                    "metadata": {"annotations": {"sidecar.istio.io/inject": "false"}},
                    "spec": {
                        "containers": [
                            {
                                "name": "ray-worker",
                                "image": RAY_IMAGE,
                                "imagePullPolicy": "Always",
                                "env": [
                                    {
                                        "name": "RAY_PROMETHEUS_HOST",
                                        "value": "http://kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090",
                                    },
                                    {"name": "RAY_PROMETHEUS_NAME", "value": "Prometheus"},
                                    {"name": "NVIDIA_VISIBLE_DEVICES", "value": ""},
                                ],
                                "resources": {
                                    "requests": {
                                        "cpu": RAY_CPU_WORKER_REQUEST_CPU,
                                        "memory": RAY_CPU_WORKER_REQUEST_MEMORY,
                                    },
                                    "limits": {
                                        "cpu": RAY_CPU_WORKER_LIMIT_CPU,
                                        "memory": RAY_CPU_WORKER_LIMIT_MEMORY,
                                    },
                                },
                            }
                        ]
                    },
                },
            }
        )
    if RAY_GPU_WORKER_ENABLED and RAY_GPU_WORKER_MAX_REPLICAS > 0:
        worker_group_specs.append(
            {
                "groupName": "gpu",
                "replicas": 0,
                "minReplicas": 0,
                "maxReplicas": RAY_GPU_WORKER_MAX_REPLICAS,
                "rayStartParams": {},
                "template": {
                    "metadata": {"annotations": {"sidecar.istio.io/inject": "false"}},
                    "spec": {
                        "containers": [
                            {
                                "name": "ray-worker",
                                "image": RAY_IMAGE,
                                "imagePullPolicy": "Always",
                                "env": [
                                    {
                                        "name": "RAY_PROMETHEUS_HOST",
                                        "value": "http://kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090",
                                    },
                                    {"name": "RAY_PROMETHEUS_NAME", "value": "Prometheus"},
                                ],
                                "resources": {
                                    "requests": {
                                        "cpu": RAY_GPU_WORKER_REQUEST_CPU,
                                        "memory": RAY_GPU_WORKER_REQUEST_MEMORY,
                                        "nvidia.com/gpu": RAY_GPU_WORKER_REQUEST_GPU,
                                    },
                                    "limits": {
                                        "cpu": RAY_GPU_WORKER_LIMIT_CPU,
                                        "memory": RAY_GPU_WORKER_LIMIT_MEMORY,
                                        "nvidia.com/gpu": RAY_GPU_WORKER_LIMIT_GPU,
                                    },
                                },
                            }
                        ]
                    },
                },
            }
        )
    # Ray 2.54's KubeRay autoscaler reads this field unconditionally.  Keep
    # the field present even in compact CPU mode, where an empty list avoids
    # scheduling an additional worker while retaining a healthy Ray head and
    # dashboard for small hosts.
    spec["workerGroupSpecs"] = worker_group_specs
    return {
        "apiVersion": "ray.io/v1",
        "kind": "RayCluster",
        "metadata": {
            "name": "pm-ray",
            "namespace": namespace,
            "labels": _labels(),
            "annotations": _owner_annotation(owner_email),
        },
        "spec": spec,
    }


def _nifi_statefulset(namespace: str, owner_email: str) -> client.V1StatefulSet:
    host = _external_host()
    path = f"/nifi/{namespace}"
    labels = _labels("pm-user-nifi")
    labels.update(
        {
            "app.kubernetes.io/name": "nifi",
            "prediction-manager.io/owner-namespace": namespace,
        }
    )
    patch_conf = f"""
set -e
mkdir -p /pvc/conf
if [ ! -f /pvc/conf/nifi.properties ]; then
  cp -a /opt/nifi/nifi-current/conf/. /pvc/conf/
fi
P=/pvc/conf/nifi.properties
sed -i 's|^nifi.web.https.port=.*|nifi.web.https.port=|' "$P"
sed -i 's|^nifi.web.https.host=.*|nifi.web.https.host=|' "$P"
sed -i 's|^nifi.web.http.host=.*|nifi.web.http.host=0.0.0.0|' "$P"
sed -i 's|^nifi.web.http.port=.*|nifi.web.http.port=8080|' "$P"
sed -i 's|^nifi.web.proxy.host=.*|nifi.web.proxy.host={host}|' "$P"
sed -i 's|^nifi.web.proxy.context.path=.*|nifi.web.proxy.context.path={path}|' "$P"
sed -i 's|^nifi.sensitive.props.key=.*|nifi.sensitive.props.key=changeMePleaseChangeMePleaseChangeMe|' "$P"
sed -i 's|^nifi.security.user.authorizer=.*|nifi.security.user.authorizer=|' "$P"
sed -i 's|^nifi.security.user.login.identity.provider=.*|nifi.security.user.login.identity.provider=|' "$P"
sed -i 's|^nifi.remote.input.secure=.*|nifi.remote.input.secure=false|' "$P"
sed -i 's|^nifi.remote.input.host=.*|nifi.remote.input.host=|' "$P"
sed -i 's|^nifi.remote.input.socket.port=.*|nifi.remote.input.socket.port=|' "$P"
sed -i 's|^nifi.cluster.protocol.is.secure=.*|nifi.cluster.protocol.is.secure=false|' "$P"
"""
    permission_conf = f"""
set -e
mkdir -p /pvc/conf /pvc/database /pvc/flowfile /pvc/content /pvc/provenance /pvc/pm-models /pvc/pm-scripts
chown -R {NIFI_RUN_AS_USER}:{NIFI_RUN_AS_GROUP} /pvc || true
chmod -R ug+rwX /pvc || true
if [ ! -w /pvc ]; then
  echo "NiFi PVC is not writable. Check NFS export permissions, root_squash, fsGroup, or StorageClass mount permissions." >&2
  ls -ldn /pvc >&2 || true
  exit 1
fi
"""
    return client.V1StatefulSet(
        metadata=client.V1ObjectMeta(
            name="nifi",
            namespace=namespace,
            labels=labels,
            annotations=_owner_annotation(owner_email),
        ),
        spec=client.V1StatefulSetSpec(
            service_name="nifi",
            replicas=1,
            selector=client.V1LabelSelector(match_labels={"app": "pm-user-nifi"}),
            template=client.V1PodTemplateSpec(
                metadata=client.V1ObjectMeta(
                    labels=labels,
                    annotations={"sidecar.istio.io/inject": "false", **_owner_annotation(owner_email)},
                ),
                spec=client.V1PodSpec(
                    security_context=client.V1PodSecurityContext(
                        run_as_user=NIFI_RUN_AS_USER,
                        run_as_group=NIFI_RUN_AS_GROUP,
                        fs_group=NIFI_FS_GROUP,
                        fs_group_change_policy="OnRootMismatch",
                    ),
                    init_containers=[
                        client.V1Container(
                            name="init-permissions",
                            image=NIFI_IMAGE,
                            command=["sh", "-c"],
                            args=[permission_conf],
                            security_context=client.V1SecurityContext(run_as_user=0, run_as_group=0),
                            resources=client.V1ResourceRequirements(
                                requests={"cpu": "25m", "memory": "128Mi"},
                                limits={"cpu": "100m", "memory": "256Mi"},
                            ),
                            volume_mounts=[client.V1VolumeMount(name="data", mount_path="/pvc")],
                        ),
                        client.V1Container(
                            name="init-conf",
                            image=NIFI_IMAGE,
                            command=["sh", "-c"],
                            args=[patch_conf],
                            security_context=client.V1SecurityContext(
                                run_as_user=NIFI_RUN_AS_USER,
                                run_as_group=NIFI_RUN_AS_GROUP,
                            ),
                            resources=client.V1ResourceRequirements(
                                requests={"cpu": "50m", "memory": "256Mi"},
                                limits={"cpu": "250m", "memory": "512Mi"},
                            ),
                            volume_mounts=[client.V1VolumeMount(name="data", mount_path="/pvc")],
                        ),
                    ],
                    containers=[
                        client.V1Container(
                            name="nifi",
                            image=NIFI_IMAGE,
                            security_context=client.V1SecurityContext(
                                run_as_user=NIFI_RUN_AS_USER,
                                run_as_group=NIFI_RUN_AS_GROUP,
                            ),
                            ports=[client.V1ContainerPort(container_port=8080, name="http")],
                            env=[
                                client.V1EnvVar(name="NIFI_WEB_HTTP_PORT", value="8080"),
                                client.V1EnvVar(name="NIFI_WEB_HTTP_HOST", value="0.0.0.0"),
                                client.V1EnvVar(name="NIFI_WEB_PROXY_HOST", value=host),
                                client.V1EnvVar(name="NIFI_WEB_PROXY_CONTEXT_PATH", value=path),
                                client.V1EnvVar(name="NIFI_JVM_HEAP_INIT", value=NIFI_JVM_HEAP_INIT),
                                client.V1EnvVar(name="NIFI_JVM_HEAP_MAX", value=NIFI_JVM_HEAP_MAX),
                            ],
                            resources=client.V1ResourceRequirements(
                                requests={"cpu": NIFI_REQUEST_CPU, "memory": NIFI_REQUEST_MEMORY},
                                limits={"cpu": NIFI_LIMIT_CPU, "memory": NIFI_LIMIT_MEMORY},
                            ),
                            startup_probe=client.V1Probe(
                                http_get=client.V1HTTPGetAction(path="/nifi/", port=8080),
                                initial_delay_seconds=60,
                                period_seconds=10,
                                failure_threshold=60,
                            ),
                            volume_mounts=[
                                client.V1VolumeMount(
                                    name="data",
                                    mount_path="/opt/nifi/nifi-current/conf",
                                    sub_path="conf",
                                ),
                                client.V1VolumeMount(
                                    name="data",
                                    mount_path="/opt/nifi/nifi-current/database_repository",
                                    sub_path="database",
                                ),
                                client.V1VolumeMount(
                                    name="data",
                                    mount_path="/opt/nifi/nifi-current/flowfile_repository",
                                    sub_path="flowfile",
                                ),
                                client.V1VolumeMount(
                                    name="data",
                                    mount_path="/opt/nifi/nifi-current/content_repository",
                                    sub_path="content",
                                ),
                                client.V1VolumeMount(
                                    name="data",
                                    mount_path="/opt/nifi/nifi-current/provenance_repository",
                                    sub_path="provenance",
                                ),
                                client.V1VolumeMount(
                                    name="data",
                                    mount_path="/opt/pm/models",
                                    sub_path="pm-models",
                                ),
                                client.V1VolumeMount(
                                    name="data",
                                    mount_path="/opt/pm/user-scripts",
                                    sub_path="pm-scripts",
                                ),
                            ],
                        )
                    ],
                ),
            ),
            volume_claim_templates=[
                client.V1PersistentVolumeClaim(
                    metadata=client.V1ObjectMeta(name="data"),
                    spec=client.V1PersistentVolumeClaimSpec(
                        access_modes=["ReadWriteOnce"],
                        storage_class_name=NIFI_STORAGE_CLASS,
                        resources=client.V1ResourceRequirements(requests={"storage": "5Gi"}),
                    ),
                )
            ],
        ),
    )


def _nifi_virtual_service(namespace: str) -> dict:
    path = f"/nifi/{namespace}"
    host = _external_host()
    # 접속 환경에 따라 IP:NodePort, DNS, 포트포워딩 host가 달라질 수 있으므로
    # referer 검증은 host를 고정하지 않고 NiFi tenant path 기준으로 제한한다.
    referer = rf"https?://[^/]+{re.escape(path)}(/.*)?"
    path_re = re.escape(path)
    headers = {
        "request": {
            "set": {
                "X-ProxyContextPath": path,
                "X-ProxyHost": host,
                "X-ProxyScheme": "https",
            },
            "remove": ["authorization", "x-forwarded-access-token"],
        }
    }
    return {
        "apiVersion": "networking.istio.io/v1",
        "kind": "VirtualService",
        "metadata": {"name": "pm-nifi-dashboard", "namespace": namespace, "labels": _labels()},
        "spec": {
            "gateways": ["kubeflow/kubeflow-gateway"],
            "hosts": ["*"],
            "http": [
                {
                    "match": [{"uri": {"regex": rf"^{path_re}/nifi-api(/.*)?$"}}],
                    "rewrite": {
                        "uriRegexRewrite": {
                            "match": rf"^{path_re}/nifi-api(/.*)?$",
                            "rewrite": "/nifi-api\\1",
                        }
                    },
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [{"uri": {"regex": r"^/(?:nifi/)?nifi-api(/.*)?$"}, "headers": {"referer": {"regex": referer}}}],
                    "rewrite": {
                        "uriRegexRewrite": {
                            "match": r"^/(?:nifi/)?nifi-api(/.*)?$",
                            "rewrite": "/nifi-api\\1",
                        }
                    },
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [{"uri": {"regex": rf"^{path_re}/nifi-docs(/.*)?$"}}],
                    "rewrite": {
                        "uriRegexRewrite": {
                            "match": rf"^{path_re}/nifi-docs(/.*)?$",
                            "rewrite": "/nifi-docs\\1",
                        }
                    },
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [{"uri": {"regex": r"^/(?:nifi/)?nifi-docs(/.*)?$"}, "headers": {"referer": {"regex": referer}}}],
                    "rewrite": {
                        "uriRegexRewrite": {
                            "match": r"^/(?:nifi/)?nifi-docs(/.*)?$",
                            "rewrite": "/nifi-docs\\1",
                        }
                    },
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [{"uri": {"regex": rf"^{path_re}/(assets|css|js|fonts|images|views)/(.*)$"}}],
                    "rewrite": {
                        "uriRegexRewrite": {
                            "match": rf"^{path_re}/(assets|css|js|fonts|images|views)/(.*)$",
                            "rewrite": "/nifi/\\1/\\2",
                        }
                    },
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [{"uri": {"regex": r"^/(?:nifi/)?(assets|css|js|fonts|images|views)/(.*)$"}, "headers": {"referer": {"regex": referer}}}],
                    "rewrite": {
                        "uriRegexRewrite": {
                            "match": r"^/(?:nifi/)?(assets|css|js|fonts|images|views)/(.*)$",
                            "rewrite": "/nifi/\\1/\\2",
                        }
                    },
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": f"{path}/nifi-api"}},
                        {"uri": {"prefix": f"{path}/nifi-api/"}},
                        {"uri": {"exact": "/nifi-api"}, "headers": {"referer": {"regex": referer}}},
                        {"uri": {"prefix": "/nifi-api/"}, "headers": {"referer": {"regex": referer}}},
                        {"uri": {"exact": "/nifi/nifi-api"}, "headers": {"referer": {"regex": referer}}},
                        {"uri": {"prefix": "/nifi/nifi-api/"}, "headers": {"referer": {"regex": referer}}},
                    ],
                    "rewrite": {"uri": "/nifi-api/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": f"{path}/nifi-docs"}},
                        {"uri": {"prefix": f"{path}/nifi-docs/"}},
                        {"uri": {"exact": "/nifi-docs"}, "headers": {"referer": {"regex": referer}}},
                        {"uri": {"prefix": "/nifi-docs/"}, "headers": {"referer": {"regex": referer}}},
                        {"uri": {"exact": "/nifi/nifi-docs"}, "headers": {"referer": {"regex": referer}}},
                        {"uri": {"prefix": "/nifi/nifi-docs/"}, "headers": {"referer": {"regex": referer}}},
                    ],
                    "rewrite": {"uri": "/nifi-docs/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": "/assets"}, "headers": {"referer": {"regex": referer}}},
                        {"uri": {"prefix": "/assets/"}, "headers": {"referer": {"regex": referer}}},
                    ],
                    "rewrite": {"uri": "/nifi/assets/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": "/js"}, "headers": {"referer": {"regex": referer}}},
                        {"uri": {"prefix": "/js/"}, "headers": {"referer": {"regex": referer}}},
                    ],
                    "rewrite": {"uri": "/nifi/js/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": "/css"}, "headers": {"referer": {"regex": referer}}},
                        {"uri": {"prefix": "/css/"}, "headers": {"referer": {"regex": referer}}},
                    ],
                    "rewrite": {"uri": "/nifi/css/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": "/fonts"}, "headers": {"referer": {"regex": referer}}},
                        {"uri": {"prefix": "/fonts/"}, "headers": {"referer": {"regex": referer}}},
                    ],
                    "rewrite": {"uri": "/nifi/fonts/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": "/images"}, "headers": {"referer": {"regex": referer}}},
                        {"uri": {"prefix": "/images/"}, "headers": {"referer": {"regex": referer}}},
                    ],
                    "rewrite": {"uri": "/nifi/images/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": "/favicon.ico"}, "headers": {"referer": {"regex": referer}}},
                    ],
                    "rewrite": {"uri": "/nifi/favicon.ico"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": f"{path}/assets"}},
                        {"uri": {"prefix": f"{path}/assets/"}},
                    ],
                    "rewrite": {"uri": "/nifi/assets/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": f"{path}/js"}},
                        {"uri": {"prefix": f"{path}/js/"}},
                    ],
                    "rewrite": {"uri": "/nifi/js/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": f"{path}/css"}},
                        {"uri": {"prefix": f"{path}/css/"}},
                    ],
                    "rewrite": {"uri": "/nifi/css/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": f"{path}/fonts"}},
                        {"uri": {"prefix": f"{path}/fonts/"}},
                    ],
                    "rewrite": {"uri": "/nifi/fonts/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": f"{path}/images"}},
                        {"uri": {"prefix": f"{path}/images/"}},
                    ],
                    "rewrite": {"uri": "/nifi/images/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": f"{path}/favicon.ico"}},
                    ],
                    "rewrite": {"uri": "/nifi/favicon.ico"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": "/nifi"}, "headers": {"referer": {"regex": referer}}},
                        {"uri": {"prefix": "/nifi/"}, "headers": {"referer": {"regex": referer}}},
                    ],
                    "rewrite": {"uri": "/nifi/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
                {
                    "match": [
                        {"uri": {"exact": path}},
                        {"uri": {"prefix": f"{path}/"}},
                    ],
                    "rewrite": {"uri": "/nifi/"},
                    "headers": headers,
                    "route": [{"destination": {"host": f"nifi.{namespace}.svc.cluster.local", "port": {"number": 8080}}}],
                },
            ],
        },
    }


def _authorization_policy(namespace: str, owner_email: str) -> dict:
    host = _external_host()
    nifi_path = f"/nifi/{namespace}"
    allowed = sorted({owner_email, *ADMIN_EMAILS})
    return {
        "apiVersion": "security.istio.io/v1",
        "kind": "AuthorizationPolicy",
        "metadata": {
            "name": _policy_name(namespace),
            "namespace": "istio-system",
            "labels": {
                "app.kubernetes.io/managed-by": "prediction-manager",
                "prediction-manager.io/owner-namespace": namespace,
            },
            "annotations": _owner_annotation(owner_email),
        },
        "spec": {
            "selector": {"matchLabels": {"app": "istio-ingressgateway", "istio": "ingressgateway"}},
            "action": "DENY",
            "rules": [
                {
                    "to": [
                        {
                            "operation": {
                                "paths": [
                                    f"/mlflow/{namespace}",
                                    f"/mlflow/{namespace}/*",
                                    f"/ray/{namespace}",
                                    f"/ray/{namespace}/*",
                                    nifi_path,
                                    f"{nifi_path}/*",
                                ]
                            }
                        }
                    ],
                    "when": [
                        {"key": "request.headers[kubeflow-userid]", "notValues": allowed},
                        {"key": "request.headers[x-auth-request-email]", "notValues": allowed},
                    ],
                },
                {
                    "to": [
                        {
                            "operation": {
                                "paths": [
                                    "/nifi-api",
                                    "/nifi-api/*",
                                    "/nifi/nifi-api",
                                    "/nifi/nifi-api/*",
                                    "/nifi-docs",
                                    "/nifi-docs/*",
                                    "/nifi/nifi-docs",
                                    "/nifi/nifi-docs/*",
                                    "/nifi",
                                    "/nifi/*",
                                    "/assets",
                                    "/assets/*",
                                    "/js",
                                    "/js/*",
                                    "/css",
                                    "/css/*",
                                    "/fonts",
                                    "/fonts/*",
                                    "/images",
                                    "/images/*",
                                    "/views",
                                    "/views/*",
                                    "/favicon.ico",
                                ]
                            }
                        }
                    ],
                    "when": [
                        {
                            "key": "request.headers[referer]",
                            "values": [f"https://{host}{nifi_path}", f"https://{host}{nifi_path}/*"],
                        },
                        {"key": "request.headers[kubeflow-userid]", "notValues": allowed},
                        {"key": "request.headers[x-auth-request-email]", "notValues": allowed},
                    ],
                },
            ],
        },
    }


def ensure_tenant_resources(namespace: str, owner_email: str) -> TenantProvisionResult:
    _wait_for_namespace(namespace)
    resources = [
        _label_tenant_namespace(namespace),
        _apply_secret_provisioner_binding(namespace),
        _run_tenant_provisioner(namespace),
        _apply_pvc(namespace, _mlflow_pvc(namespace, owner_email)),
        _apply_deployment(namespace, _mlflow_deployment(namespace, owner_email)),
        _apply_service(namespace, _service(namespace, "pm-mlflow", "pm-mlflow", 5000, 5000)),
        _apply_custom_object(
            "networking.istio.io",
            "v1",
            namespace,
            "virtualservices",
            _simple_virtual_service(
                namespace,
                "pm-mlflow-dashboard",
                f"/mlflow/{namespace}",
                f"pm-mlflow.{namespace}.svc.cluster.local",
                5000,
            ),
        ),
        _apply_custom_object("ray.io", "v1", namespace, "rayclusters", _ray_cluster(namespace, owner_email)),
        _apply_custom_object(
            "networking.istio.io",
            "v1",
            namespace,
            "virtualservices",
            _simple_virtual_service(
                namespace,
                "pm-ray-dashboard",
                f"/ray/{namespace}",
                f"pm-ray-head-svc.{namespace}.svc.cluster.local",
                8265,
            ),
        ),
        _apply_service(namespace, _service(namespace, "nifi", "pm-user-nifi", 8080, 8080)),
        _apply_statefulset(namespace, _nifi_statefulset(namespace, owner_email)),
        _apply_custom_object(
            "networking.istio.io",
            "v1",
            namespace,
            "virtualservices",
            _nifi_virtual_service(namespace),
        ),
        _apply_custom_object(
            "security.istio.io",
            "v1",
            "istio-system",
            "authorizationpolicies",
            _authorization_policy(namespace, owner_email),
        ),
    ]
    return TenantProvisionResult(namespace=namespace, owner_email=owner_email, resources=resources)


def delete_tenant_resources(namespace: str) -> list[str]:
    results: list[str] = []
    for group, version, ns, plural, name in [
        ("security.istio.io", "v1", "istio-system", "authorizationpolicies", _policy_name(namespace)),
        ("security.istio.io", "v1", "istio-system", "authorizationpolicies", f"pm-private-dashboards-{namespace}"),
        ("security.istio.io", "v1", "istio-system", "authorizationpolicies", f"nifi-owner-{namespace}"[:63].rstrip("-")),
        ("networking.istio.io", "v1", namespace, "virtualservices", "pm-nifi-dashboard"),
        ("networking.istio.io", "v1", namespace, "virtualservices", "pm-ray-dashboard"),
        ("networking.istio.io", "v1", namespace, "virtualservices", "pm-mlflow-dashboard"),
        ("ray.io", "v1", namespace, "rayclusters", "pm-ray"),
    ]:
        result = _delete_custom_object(group, version, ns, plural, name)
        if result not in results:
            results.append(result)

    for kind, name in [
        ("statefulset", "nifi"),
        ("deployment", "pm-mlflow"),
        ("service", "nifi"),
        ("service", "pm-mlflow"),
        ("service", "pm-ray-head-svc"),
        ("rolebinding", PROVISIONER_ROLEBINDING_NAME),
        ("pvc", "data-nifi-0"),
        ("pvc", "pm-mlflow-data"),
    ]:
        results.append(_delete_namespaced(kind, namespace, name))
    return results
