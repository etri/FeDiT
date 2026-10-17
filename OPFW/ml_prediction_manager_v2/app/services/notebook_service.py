from kubernetes import client
from app.config import settings
from app.services import kubernetes_client
from app.resource_policy import require_tenant_namespace, image_owner

core_v1 = kubernetes_client.core_v1()
custom_api = kubernetes_client.custom_objects()

GROUP = "kubeflow.org"
VERSION = "v1"
PLURAL = "notebooks"


def list_notebooks(namespace: str = None) -> list[dict]:
    ns = require_tenant_namespace(namespace or settings.default_namespace)
    resp = custom_api.list_namespaced_custom_object(GROUP, VERSION, ns, PLURAL)
    results = []
    for nb in resp.get("items", []):
        meta = nb["metadata"]
        annotations = meta.get("annotations", {}) or {}
        spec = nb["spec"]["template"]["spec"]
        container = spec["containers"][0]
        resources = container.get("resources", {})
        limits = resources.get("limits", {})
        requests_r = resources.get("requests", {})
        status = nb.get("status", {})

        state = "Stopped"
        if meta.get("annotations", {}).get("kubeflow-resource-stopped"):
            state = "Stopped"
        elif status.get("readyReplicas", 0) > 0:
            state = "Running"
        elif status.get("containerState", {}).get("waiting"):
            state = "Pending"
        else:
            state = "Pending"

        notebook_type = annotations.get("notebooks.kubeflow.org/server-type", "jupyter")
        ports = container.get("ports") or []
        raw_container_port = (
            annotations.get("prediction-manager.io/container-port")
            or (ports[0].get("containerPort") if ports else 8888)
            or 8888
        )
        try:
            container_port = int(raw_container_port)
        except (TypeError, ValueError):
            container_port = 8888
        base_url = f"{settings.kubeflow_url}/notebook/{ns}/{meta['name']}"
        if notebook_type == "vscode":
            open_url = f"{base_url}/?folder=/home/jovyan"
            open_label = "VSCode"
        elif notebook_type == "rstudio":
            open_url = f"{base_url}/"
            open_label = "RStudio"
        else:
            open_url = f"{base_url}/lab"
            open_label = "Jupyter"

        results.append(
            {
                "name": meta["name"],
                "namespace": ns,
                "image": container["image"],
                "notebook_type": notebook_type,
                "status": state,
                "cpu": requests_r.get("cpu", ""),
                "memory": requests_r.get("memory", ""),
                "gpu": int(limits.get("nvidia.com/gpu", 0)),
                "container_port": container_port,
                "created": meta.get("creationTimestamp", ""),
                "url": open_url,
                "open_label": open_label,
            }
        )
    return results


def _ensure_pvc(ns: str, pvc_name: str, size: str, storage_class: str, access_mode: str, notebook_name: str = ""):
    """PVC 없으면 생성. 있으면 통과."""
    pvc = client.V1PersistentVolumeClaim(
        metadata=client.V1ObjectMeta(name=pvc_name, namespace=ns, labels={
            "app.kubernetes.io/managed-by": "prediction-manager",
            "prediction-manager.io/notebook": notebook_name,
        } if notebook_name else {}),
        spec=client.V1PersistentVolumeClaimSpec(
            access_modes=[access_mode],
            storage_class_name=storage_class or None,
            resources=client.V1VolumeResourceRequirements(
                requests={"storage": size}
            ),
        ),
    )
    try:
        core_v1.create_namespaced_persistent_volume_claim(ns, pvc)
    except client.ApiException as e:
        if e.status != 409:
            raise


def _is_local_registry_image(name: str) -> bool:
    """Local registry 이미지 여부.
    ConfigMap 의 옛 옵션은 모두 제거하고, 사용자 ns 이미지는 동적으로 추가."""
    hosts = {settings.registry_host, "localhost:5000"}
    return any(f"{host}/" in name for host in hosts if host)


def _shared_user_images(namespace: str | None = None) -> list[str]:
    """현재 작업 영역 이미지에만 Notebook 선택권을 부여한다."""
    import httpx
    from app.services.registry_service import _local_docker_catalogue
    if not namespace:
        return []
    require_tenant_namespace(namespace)
    catalogue = {}
    try:
        with httpx.Client(timeout=5) as c:
            response = c.get(f"{settings.registry_url}/v2/_catalog")
            response.raise_for_status()
            cat = response.json().get("repositories", [])
            for repo in cat:
                if image_owner(repo) != namespace:
                    continue
                tags = c.get(f"{settings.registry_url}/v2/{repo}/tags/list")
                tags.raise_for_status()
                catalogue[repo] = tags.json().get("tags") or []
    except (httpx.HTTPError, ValueError):
        catalogue = _local_docker_catalogue()
    return [f"{settings.registry_host}/{repo}:{tag}"
            for repo, tags in sorted(catalogue.items()) if image_owner(repo) == namespace
            for tag in tags]


def get_spawner_config(user_namespace: str | None = None) -> dict:
    """Kubeflow JWA spawner config (이미지 목록, 기본값 등) 조회.

    kubeflow namespace의 `jupyter-web-app-config*` 이름 패턴 ConfigMap에서
    `spawner_ui_config.yaml` 데이터를 찾고, image options 를 다음과 같이 가공:
      - 시스템 이미지 / orphan 제거
      - 사용자 Registry 이미지는 현재 빌더 호환 유형인 Jupyter에만 자동 추가
      - Kubeflow 공식 base 이미지 (`ghcr.io/kubeflow/...`) 보존
    """
    import yaml
    cfg: dict = {}
    try:
        cms = core_v1.list_namespaced_config_map("kubeflow")
        for cm in cms.items:
            name = cm.metadata.name or ""
            if not name.startswith("jupyter-web-app-config"):
                continue
            data = cm.data or {}
            if "spawner_ui_config.yaml" in data:
                cfg = yaml.safe_load(data["spawner_ui_config.yaml"]).get(
                    "spawnerFormDefaults", {}
                )
                break
    except Exception:  # nosec
        pass

    if cfg:
        for key in ("image", "imageGroupOne", "imageGroupTwo"):
            section = cfg.get(key)
            if not isinstance(section, dict):
                continue
            opts = section.get("options") or []
            # ConfigMap 의 local registry 옛 옵션은 모두 제거 (시스템·다른 ns·orphan 포함)
            # Kubeflow 공식 ghcr.io base 이미지만 보존
            cleaned = [o for o in opts if not _is_local_registry_image(o)]
            if key == "image":
                for u in _shared_user_images(user_namespace):
                    if u not in cleaned:
                        cleaned.append(u)
            section["options"] = cleaned
        return cfg
    # 폴백: 하드코드
    return {
        "image": {"value": "", "options": []},
        "imageGroupOne": {"value": "", "options": []},
        "imageGroupTwo": {"value": "", "options": []},
        "cpu": {"value": "0.5", "limitFactor": "1.2"},
        "memory": {"value": "1.0Gi", "limitFactor": "1.2"},
        "gpus": {"value": {"vendor": "", "vendors": [
            {"limitsKey": "nvidia.com/gpu", "uiName": "NVIDIA"},
            {"limitsKey": "amd.com/gpu", "uiName": "AMD"},
            {"limitsKey": "habana.ai/gaudi", "uiName": "Intel Gaudi"},
        ], "num": "none"}},
        "workspaceVolume": {"value": {
            "mount": "/home/jovyan",
            "newPvc": {
                "metadata": {"name": "{notebook-name}-workspace"},
                "spec": {
                    "resources": {"requests": {"storage": "5Gi"}},
                    "accessModes": ["ReadWriteOnce"],
                },
            },
        }},
        "affinityConfig": {"value": "", "options": []},
        "tolerationGroup": {"value": "", "options": []},
        "shm": {"value": True},
        "configurations": {"value": []},
        "imagePullPolicy": {"value": "IfNotPresent"},
    }


def list_pod_defaults(namespace: str) -> list[dict]:
    """namespace의 PodDefault 목록."""
    require_tenant_namespace(namespace)
    try:
        resp = custom_api.list_namespaced_custom_object(
            "kubeflow.org", "v1alpha1", namespace, "poddefaults"
        )
        return [
            {
                "name": p["metadata"]["name"],
                "description": p.get("spec", {}).get("desc", ""),
            }
            for p in resp.get("items", [])
        ]
    except Exception:
        return []


def list_pvcs(namespace: str) -> list[dict]:
    """namespace의 PVC 목록 반환 (기존 볼륨 선택용)."""
    require_tenant_namespace(namespace)
    try:
        resp = core_v1.list_namespaced_persistent_volume_claim(namespace)
    except client.ApiException:
        return []
    return [
        {
            "name": p.metadata.name,
            "size": (p.spec.resources.requests or {}).get("storage", "")
            if p.spec.resources else "",
            "access_modes": p.spec.access_modes or [],
            "storage_class": p.spec.storage_class_name or "",
            "status": p.status.phase,
        }
        for p in resp.items
    ]


def create_notebook(
    name: str,
    image: str,
    cpu_request: str = "2",
    cpu_limit: str = "4",
    memory_request: str = "4Gi",
    memory_limit: str = "8Gi",
    gpu_count: int = 0,
    gpu_vendor: str = "nvidia.com/gpu",
    workspace_source: str = "new",
    workspace_name: str = "",
    workspace_size: str = "10Gi",
    workspace_storage_class: str = "",
    workspace_access_mode: str = "ReadWriteOnce",
    workspace_mount_path: str = "/home/jovyan",
    data_volumes: list[dict] | None = None,
    enable_shared_memory: bool = True,
    env_vars: list[dict] | None = None,
    notebook_type: str = "jupyter",
    image_pull_policy: str = "IfNotPresent",
    container_port: int = 8888,
    affinity_config: str = "",
    toleration_group: str = "",
    pod_defaults: list[str] | None = None,
    namespace: str = None,
    creator: str = "user@example.com",
) -> dict:
    ns = require_tenant_namespace(namespace or settings.default_namespace)
    if not 1 <= container_port <= 65535:
        raise ValueError("container_port는 1~65535 사이여야 합니다.")
    data_volumes = data_volumes or []
    env_vars = env_vars or []
    pod_defaults = pod_defaults or []

    volumes: list[dict] = []
    volume_mounts: list[dict] = []

    # Workspace volume
    if workspace_source != "none":
        if workspace_source == "new":
            ws_pvc_name = workspace_name or f"{name}-workspace"
            _ensure_pvc(ns, ws_pvc_name, workspace_size,
                        workspace_storage_class, workspace_access_mode, notebook_name=name)
        else:  # existing
            ws_pvc_name = workspace_name
            if not ws_pvc_name:
                raise ValueError("workspace_source=existing 에는 workspace_name 필수")
        volumes.append({
            "name": "workspace",
            "persistentVolumeClaim": {"claimName": ws_pvc_name},
        })
        volume_mounts.append({
            "name": "workspace",
            "mountPath": workspace_mount_path,
        })

    # Data volumes
    for i, dv in enumerate(data_volumes):
        src = dv.get("source", "new")
        mount = dv.get("mount_path") or f"/home/jovyan/data{i+1}"
        if src == "new":
            dv_name = dv.get("name") or f"{name}-data{i+1}"
            _ensure_pvc(ns, dv_name, dv.get("size", "5Gi"),
                        dv.get("storage_class", ""),
                        dv.get("access_mode", "ReadWriteOnce"))
        else:
            dv_name = dv.get("name")
            if not dv_name:
                raise ValueError(f"data_volume #{i+1}: existing 에는 name 필수")
        vol_key = f"data-{i+1}"
        volumes.append({
            "name": vol_key,
            "persistentVolumeClaim": {"claimName": dv_name},
        })
        volume_mounts.append({
            "name": vol_key,
            "mountPath": mount,
        })

    # Shared memory
    if enable_shared_memory:
        volumes.append({"name": "dshm", "emptyDir": {"medium": "Memory"}})
        volume_mounts.append({"name": "dshm", "mountPath": "/dev/shm"})  # nosec

    # Env vars
    env_list = [{"name": e["name"], "value": e.get("value", "")}
                for e in env_vars if e.get("name")]

    # Resource limits
    resource_limits = {"cpu": cpu_limit, "memory": memory_limit}
    if gpu_count > 0:
        resource_limits[gpu_vendor or "nvidia.com/gpu"] = str(gpu_count)

    # 노트북 라벨: PodDefault 매칭용
    labels = {"app": name}
    for pd in pod_defaults:
        if pd:
            labels[pd] = "true"

    annotations = {
        "notebooks.kubeflow.org/creator": creator,
        "notebooks.kubeflow.org/server-type": notebook_type,
        "prediction-manager.io/container-port": str(container_port),
    }
    # VSCode/RStudio 용 path rewrite
    if notebook_type in ("vscode", "rstudio"):
        annotations["notebooks.kubeflow.org/http-rewrite-uri"] = "/"
    if notebook_type == "rstudio":
        annotations["notebooks.kubeflow.org/http-headers-request-set"] = (
            '{"X-RStudio-Root-Path":"/notebook/' + ns + "/" + name + '/"}'
        )

    pod_spec = {
        "serviceAccountName": "default-editor",
        "containers": [
            {
                "name": name,
                "image": image,
                "imagePullPolicy": image_pull_policy,
                "resources": {
                    "requests": {
                        "cpu": cpu_request,
                        "memory": memory_request,
                    },
                    "limits": resource_limits,
                },
                "env": env_list,
                "ports": [
                    {
                        "name": "notebook-port",
                        "containerPort": container_port,
                        "protocol": "TCP",
                    }
                ],
                "volumeMounts": volume_mounts,
            }
        ],
        "volumes": volumes,
    }

    # Affinity / Tolerations — JWA config에서 해당 그룹 조회해 적용
    if affinity_config or toleration_group:
        cfg = get_spawner_config()
        if affinity_config:
            opts = cfg.get("affinityConfig", {}).get("options", []) or []
            for o in opts:
                if o.get("configKey") == affinity_config and o.get("affinity"):
                    pod_spec["affinity"] = o["affinity"]
                    break
        if toleration_group:
            opts = cfg.get("tolerationGroup", {}).get("options", []) or []
            for o in opts:
                if o.get("groupKey") == toleration_group and o.get("tolerations"):
                    pod_spec["tolerations"] = o["tolerations"]
                    break

    pod_spec_labels = labels.copy()
    notebook_body = {
        "apiVersion": "kubeflow.org/v1",
        "kind": "Notebook",
        "metadata": {
            "name": name,
            "namespace": ns,
            "labels": labels,
            "annotations": annotations,
        },
        "spec": {
            "template": {
                "metadata": {"labels": pod_spec_labels},
                "spec": pod_spec,
            }
        },
    }

    return custom_api.create_namespaced_custom_object(
        GROUP, VERSION, ns, PLURAL, notebook_body
    )


def delete_notebook(name: str, namespace: str = None):
    ns = require_tenant_namespace(namespace or settings.default_namespace)
    custom_api.delete_namespaced_custom_object(GROUP, VERSION, ns, PLURAL, name)
    try:
        pvc = core_v1.read_namespaced_persistent_volume_claim(f"{name}-workspace", ns)
        labels = pvc.metadata.labels or {}
        if (labels.get("app.kubernetes.io/managed-by") == "prediction-manager"
                and labels.get("prediction-manager.io/notebook") == name):
            core_v1.delete_namespaced_persistent_volume_claim(f"{name}-workspace", ns)
    except client.ApiException:
        pass


def stop_notebook(name: str, namespace: str = None):
    ns = require_tenant_namespace(namespace or settings.default_namespace)
    patch = {
        "metadata": {
            "annotations": {"kubeflow-resource-stopped": "true"}
        }
    }
    custom_api.patch_namespaced_custom_object(GROUP, VERSION, ns, PLURAL, name, patch)


def start_notebook(name: str, namespace: str = None):
    ns = require_tenant_namespace(namespace or settings.default_namespace)
    patch = {
        "metadata": {
            "annotations": {"kubeflow-resource-stopped": None}
        }
    }
    custom_api.patch_namespaced_custom_object(GROUP, VERSION, ns, PLURAL, name, patch)
