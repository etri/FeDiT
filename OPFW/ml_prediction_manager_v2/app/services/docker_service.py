import asyncio
import os
import uuid
import tempfile
import shutil
from pathlib import Path

import docker
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.config import settings
from app.models.image_models import ImageBuildRequest
from app.resource_policy import image_owner

template_dir = Path(__file__).parent.parent / "templates"
jinja_env = Environment(
    loader=FileSystemLoader(str(template_dir)),
    autoescape=select_autoescape(
        enabled_extensions=("html", "xml", "j2"),
        default_for_string=True,
        default=True,
    ),
)

# In-memory build log storage
build_logs: dict[str, dict] = {}

BASE_IMAGE_MAP = {
    "pytorch": "pytorch/pytorch",
    "tensorflow": "tensorflow/tensorflow",
    "cuda": "nvidia/cuda",
    "python": "python",
}


def render_dockerfile(req: ImageBuildRequest) -> str:
    if req.base_image == "custom" and req.custom_from:
        from_line = req.custom_from
    else:
        base = BASE_IMAGE_MAP.get(req.base_image, "python")
        from_line = f"{base}:{req.base_tag}"

    lines = [f"FROM {from_line}", ""]
    lines.append("ENV DEBIAN_FRONTEND=noninteractive")
    lines.append(f"WORKDIR {req.workdir}")
    lines.append("")

    if req.apt_packages:
        pkgs = " ".join(req.apt_packages)
        lines.append(
            f"RUN apt-get update && apt-get install -y --no-install-recommends {pkgs} && rm -rf /var/lib/apt/lists/*"
        )
        lines.append("")

    if req.include_jupyter:
        lines.append("# Kubeflow Notebook compatibility")
        lines.append(
            "RUN useradd -m -s /bin/bash -N -u 1000 -g 100 jovyan || true"
        )
        lines.append("")

    if req.pip_packages:
        pkgs = " ".join(f'"{p}"' if any(c in p for c in '<>=!') else p for p in req.pip_packages)
        lines.append(f"RUN pip install --no-cache-dir {pkgs}")
        lines.append("")

    if req.include_jupyter:
        lines.append(
            "RUN pip install --no-cache-dir jupyterlab>=4.0 notebook ipykernel"
        )
        lines.append("")

    for cmd in req.run_commands:
        lines.append(f"RUN {cmd}")

    if req.include_jupyter:
        lines.append("")
        lines.append(f"RUN chown -R 1000:100 {req.workdir}")
        lines.append("USER 1000")
        lines.append("EXPOSE 8888")
        lines.append(
            'CMD ["/bin/sh", "-c", '
            '"jupyter lab --ip=0.0.0.0 --no-browser --port=8888 '
            "--ServerApp.token='' --ServerApp.password='' "
            "--ServerApp.allow_origin='*' "
            '--ServerApp.base_url=${NB_PREFIX:-/}"]'
        )

    return "\n".join(lines)


async def build_and_push(req: ImageBuildRequest) -> str:
    owner = image_owner(req.image_name)
    if not owner:
        raise ValueError("Only a tenant-owned image can be built")
    build_id = str(uuid.uuid4())
    build_logs[build_id] = {"status": "building", "logs": [], "message": "", "owner_namespace": owner}

    asyncio.get_event_loop().run_in_executor(None, _do_build, build_id, req)
    return build_id


def _do_build(build_id: str, req: ImageBuildRequest):
    tag = f"{settings.registry_host}/{req.image_name}:{req.image_tag}"
    tmpdir = tempfile.mkdtemp()
    try:
        if req.dockerfile_override and req.dockerfile_override.strip():
            dockerfile_content = req.dockerfile_override
        else:
            dockerfile_content = render_dockerfile(req)
        dockerfile_path = Path(tmpdir) / "Dockerfile"
        dockerfile_path.write_text(dockerfile_content)

        build_logs[build_id]["logs"].append(f"=== Dockerfile ===\n{dockerfile_content}\n")
        build_logs[build_id]["logs"].append(f"Building {tag}...\n")

        api_client = docker.APIClient(base_url=settings.docker_socket)
        for chunk in api_client.build(path=tmpdir, tag=tag, rm=True, decode=True):
            if "stream" in chunk:
                build_logs[build_id]["logs"].append(chunk["stream"])
            if "error" in chunk:
                build_logs[build_id]["status"] = "error"
                build_logs[build_id]["message"] = chunk["error"]
                return

        build_logs[build_id]["logs"].append(f"\nPushing {tag}...\n")
        for chunk in api_client.push(tag, stream=True, decode=True):
            if "status" in chunk:
                msg = chunk["status"]
                if "progress" in chunk:
                    msg += f" {chunk['progress']}"
                build_logs[build_id]["logs"].append(msg + "\n")
            if "error" in chunk:
                build_logs[build_id]["status"] = "error"
                build_logs[build_id]["message"] = chunk["error"]
                return

        # The PM Notebook dropdown discovers tenant images dynamically. A user
        # build must not rewrite a platform ConfigMap or restart the shared JWA.

        build_logs[build_id]["status"] = "success"
        build_logs[build_id]["message"] = f"Image {tag} built and pushed successfully"
    except Exception as e:
        build_logs[build_id]["status"] = "error"
        build_logs[build_id]["message"] = str(e)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


CM_NAME = os.environ.get("PM_JUPYTER_CONFIGMAP_NAME", "").strip()
CM_NAMESPACE = os.environ.get("PM_JUPYTER_CONFIGMAP_NAMESPACE", "kubeflow")
CM_DATA_KEY = os.environ.get("PM_JUPYTER_CONFIGMAP_DATA_KEY", "spawner_ui_config.yaml")
JUPYTER_WEB_APP_DEPLOYMENT = os.environ.get(
    "PM_JUPYTER_WEB_APP_DEPLOYMENT", "jupyter-web-app-deployment"
)


def _get_k8s_clients():
    from app.services import kubernetes_client
    return kubernetes_client.core_v1(), kubernetes_client.apps_v1()


def _restart_jupyter_web_app(apps_v1):
    import datetime
    apps_v1.patch_namespaced_deployment(
        name=JUPYTER_WEB_APP_DEPLOYMENT,
        namespace=CM_NAMESPACE,
        body={
            "spec": {"template": {"metadata": {"annotations": {
                "kubectl.kubernetes.io/restartedAt": datetime.datetime.now().isoformat()
            }}}}
        },
    )


def _read_jupyter_config_map(v1):
    if CM_NAME:
        return v1.read_namespaced_config_map(name=CM_NAME, namespace=CM_NAMESPACE)

    config_maps = v1.list_namespaced_config_map(namespace=CM_NAMESPACE)
    candidates = [
        cm for cm in config_maps.items
        if (cm.data or {}).get(CM_DATA_KEY)
    ]
    candidates.sort(
        key=lambda cm: (
            not cm.metadata.name.startswith("jupyter-web-app-config"),
            cm.metadata.name,
        )
    )
    if not candidates:
        raise RuntimeError(
            f"Kubeflow Notebook ConfigMap with {CM_DATA_KEY} not found in namespace {CM_NAMESPACE}"
        )
    return candidates[0]


def _register_image_to_kubeflow(image_tag: str):
    """빌드된 이미지를 Kubeflow Notebook UI 드롭다운에 자동 등록"""
    try:
        import re
        v1, apps_v1 = _get_k8s_clients()
        cm = _read_jupyter_config_map(v1)
        content = (cm.data or {})[CM_DATA_KEY]

        if image_tag in content:
            return

        pattern = r"(# the list of available container images in the dropdown\n    options:\n)"
        replacement = rf"\g<1>    - {image_tag}\n"
        new_content = re.sub(pattern, replacement, content)

        if new_content != content:
            cm.data[CM_DATA_KEY] = new_content
            v1.replace_namespaced_config_map(name=cm.metadata.name, namespace=CM_NAMESPACE, body=cm)
            _restart_jupyter_web_app(apps_v1)
            print(f"[INFO] Registered {image_tag} to Kubeflow Notebook image list")
    except Exception as e:
        print(f"[WARN] Failed to register image to Kubeflow: {e}")


def unregister_image_from_kubeflow(image_name: str, image_tag: str):
    """삭제된 이미지를 Kubeflow Notebook UI 드롭다운에서 제거"""
    try:
        v1, apps_v1 = _get_k8s_clients()
        cm = _read_jupyter_config_map(v1)
        content = (cm.data or {})[CM_DATA_KEY]

        full_tag = f"{settings.registry_host}/{image_name}:{image_tag}"
        line_to_remove = f"    - {full_tag}\n"

        if line_to_remove in content:
            new_content = content.replace(line_to_remove, "")
            cm.data[CM_DATA_KEY] = new_content
            v1.replace_namespaced_config_map(name=cm.metadata.name, namespace=CM_NAMESPACE, body=cm)
            _restart_jupyter_web_app(apps_v1)
            print(f"[INFO] Unregistered {full_tag} from Kubeflow Notebook image list")
    except Exception as e:
        print(f"[WARN] Failed to unregister image from Kubeflow: {e}")


def get_build_status(build_id: str) -> dict | None:
    return build_logs.get(build_id)
