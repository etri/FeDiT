"""Production 모델을 KServe InferenceService로 배포/교체.

모델 이름별로 전용 ISVC 유지 (`prod-{model_name}`).
새 버전 승격 시 동일 PVC에 모델 파일을 덮어쓰고 ISVC rollout.
"""
import asyncio
import datetime
import re
import shutil
import tempfile
import time
from pathlib import Path
from typing import Any

from kubernetes import client

from app.services import registry_model_service as registry
from app.services import kubernetes_client, tenant_resources
from app.resource_policy import require_tenant_namespace


def _k8s_clients() -> tuple[Any, Any]:
    return kubernetes_client.core_v1(), kubernetes_client.custom_objects()


def _safe_name(name: str) -> str:
    """모델 이름을 K8s 리소스 이름으로 안전하게."""
    s = re.sub(r"[^a-z0-9-]", "-", name.lower())
    s = re.sub(r"-+", "-", s).strip("-")
    return f"prod-{s}"[:50]


def _mlflow_uri(namespace: str | None = None) -> str:
    return tenant_resources.mlflow_tracking_uri(namespace)


def _parse_artifact_rel(run_id: str, core_v1, mlflow_namespace: str | None = None) -> str:
    """mlflow artifact_uri에서 쿠버네티스 접근 가능한 상대 경로 추출."""
    # run api 직접 호출
    import httpx
    MLFLOW_URI = _mlflow_uri(mlflow_namespace)
    r = httpx.get(f"{MLFLOW_URI}/api/2.0/mlflow/runs/get", params={"run_id": run_id}, timeout=10)
    r.raise_for_status()
    uri = r.json().get("run", {}).get("info", {}).get("artifact_uri", "")
    # 보통 mlflow-artifacts:/<exp>/<run>/artifacts
    if uri.startswith("mlflow-artifacts:/"):
        return uri.replace("mlflow-artifacts:/", "")
    return uri


def _resolve_model_artifact_uri(run_id: str, mlflow_namespace: str | None = None) -> str:
    """Return a downloadable model URI for legacy run artifacts and MLflow 3 LoggedModels."""
    import httpx
    MLFLOW_URI = _mlflow_uri(mlflow_namespace)
    r = httpx.get(f"{MLFLOW_URI}/api/2.0/mlflow/runs/get", params={"run_id": run_id}, timeout=10)
    r.raise_for_status()
    run = (r.json().get("run") or {})
    for output in ((run.get("outputs") or {}).get("model_outputs") or []):
        model_id = output.get("model_id")
        if model_id:
            return f"models:/{model_id}"
    return f"runs:/{run_id}/model"


def _preflight_model_artifact(
    mlflow_uri: str,
    artifact_uri: str,
    model_format: str,
    local_path: str | None = None,
) -> None:
    tmpdir = tempfile.mkdtemp(prefix="pm-prod-artifact-preflight-")
    try:
        if local_path:
            # AutoML materializes a verified copy in the Prediction Manager
            # model-store PVC. MLflow 3 LoggedModel URIs can lack a legacy
            # artifact listing, so prefer the synchronized copy when present.
            artifact_path = Path(local_path)
        else:
            import mlflow as _mlflow
            _mlflow.set_tracking_uri(mlflow_uri)
            downloaded = _mlflow.artifacts.download_artifacts(
                artifact_uri=artifact_uri, dst_path=tmpdir
            )
            artifact_path = Path(downloaded) if downloaded else None
        if not artifact_path or not artifact_path.exists() or not artifact_path.is_dir():
            raise RuntimeError("MLflow artifact download result is empty")
        files = [path for path in artifact_path.rglob("*") if path.is_file()]
        names = {path.name for path in files}
        if model_format == "mlflow" and "MLmodel" not in names:
            raise RuntimeError("MLflow artifact에 MLmodel 파일이 없습니다")
        if model_format == "onnx" and "model.onnx" not in names:
            raise RuntimeError("ONNX artifact에 model.onnx 파일이 없습니다")
        # MLflow's sklearn flavor stores the serialized estimator as
        # ``model.pkl``.  Directly uploaded sklearn packages use the
        # Prediction Manager convention ``model.joblib``.  Both are valid
        # sources for the MLServer sklearn runtime; the helper below
        # normalizes the former to the latter on the serving PVC.
        if model_format == "sklearn" and not {
            "model.joblib",
            "model.pkl",
            "model.pickle",
        }.intersection(names):
            raise RuntimeError(
                "scikit-learn artifact에 model.joblib, model.pkl 또는 model.pickle 파일이 없습니다"
            )
        if model_format in {"xgboost", "lightgbm"} and "model.bst" not in names:
            raise RuntimeError(f"{model_format} artifact에 model.bst 파일이 없습니다")
        if model_format == "pytorch":
            if not any(path.suffix.lower() == ".mar" for path in files):
                raise RuntimeError("PyTorch artifact에 TorchServe .mar 파일이 없습니다")
            if "config.properties" not in names:
                raise RuntimeError("PyTorch artifact에 TorchServe config.properties 파일이 없습니다")
        if model_format == "tensorflow" and "saved_model.pb" not in names:
            raise RuntimeError("TensorFlow artifact에 saved_model.pb 파일이 없습니다")
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


def _ensure_pvc(core_v1, name: str, namespace: str) -> None:
    try:
        core_v1.read_namespaced_persistent_volume_claim(name, namespace)
        return
    except client.ApiException as e:
        if e.status != 404:
            raise
    body = client.V1PersistentVolumeClaim(
        metadata=client.V1ObjectMeta(name=name, namespace=namespace),
        spec=client.V1PersistentVolumeClaimSpec(
            access_modes=["ReadWriteOnce"],
            resources=client.V1ResourceRequirements(requests={"storage": "1Gi"}),
        ),
    )
    core_v1.create_namespaced_persistent_volume_claim(namespace, body)


def _detect_model_format(
    run_id: str,
    mlflow_namespace: str | None = None,
    tags: dict[str, Any] | None = None,
) -> str:
    """Resolve the KServe model format from upload metadata, then artifact files."""
    tags = tags or {}
    tagged_format = str(tags.get("model.package_format") or "").strip().lower()
    supported = {"mlflow", "onnx", "sklearn", "xgboost", "lightgbm", "pytorch", "tensorflow"}
    if tagged_format in supported:
        return tagged_format

    # AutoML registers MLflow LoggedModels (``models:/m-...``), even when the
    # underlying estimator is scikit-learn.  The registry metadata also keeps
    # the AutoML source URI/job marker.  Prefer the MLflow flavor here so the
    # preflight and helper resolve the LoggedModel's MLmodel manifest instead
    # of misclassifying it as a bare sklearn package when MLflow's artifact-list
    # endpoint does not expose LoggedModel files under the legacy ``model``
    # path.
    if tags.get("automl.model_uri") or tags.get("automl.job_id"):
        return "mlflow"

    import httpx
    MLFLOW = _mlflow_uri(mlflow_namespace)
    try:
        r = httpx.get(
            f"{MLFLOW}/api/2.0/mlflow/artifacts/list",
            params={"run_id": run_id, "path": "model"},
            timeout=10,
        )
        r.raise_for_status()
        files = r.json().get("files", [])
        names = [f.get("path", "").split("/")[-1] for f in files]
        if "MLmodel" in names:
            return "mlflow"
        file_formats = (
            ("onnx", {"model.onnx"}),
            ("sklearn", {"model.joblib"}),
        )
        for model_format, expected in file_formats:
            if expected.intersection(names):
                return model_format
    except Exception as e:
        print(f"[deploy] format detect failed: {e}", flush=True)

    framework = str(tags.get("framework") or "").strip().lower()
    framework_aliases = {
        "scikit-learn": "sklearn",
        "sklearn": "sklearn",
        "xgboost": "xgboost",
        "lightgbm": "lightgbm",
        "pytorch": "pytorch",
        "torch": "pytorch",
        "tensorflow": "tensorflow",
        "keras": "tensorflow",
        "onnx": "onnx",
        "mlflow": "mlflow",
    }
    if framework in framework_aliases:
        return framework_aliases[framework]
    return "mlflow"


async def _run_helper_pod(
    core_v1,
    pod_name: str,
    namespace: str,
    pvc_name: str,
    artifact_uri: str,
    model_format: str,
    mlflow_uri: str,
    source_path: str | None = None,
    source_pvc_name: str = "prediction-manager-model-store",
    source_download_url: str | None = None,
    source_download_email: str | None = None,
    source_download_namespace: str | None = None,
) -> None:
    """MLflow artifact를 PVC로 복사하는 helper Pod 실행 후 완료 대기.

    MLflow 3.x LoggedModels 호환: Python client 의 download_artifacts 가
    legacy({run}/artifacts/model/) 와 신경로({exp}/models/m-*/artifacts/) 양쪽 자동 해석.
    """
    validation = {
        "mlflow": "assert os.path.exists('/target/model/MLmodel'), 'target model is missing MLmodel'",
        "onnx": "assert os.path.exists('/target/model/model.onnx'), 'target model is missing model.onnx'",
        "sklearn": "assert os.path.exists('/target/model/model.joblib'), 'target model is missing model.joblib'",
        "xgboost": "assert os.path.exists('/target/model/model.bst'), 'target model is missing model.bst'",
        "lightgbm": "assert os.path.exists('/target/model/model.bst'), 'target model is missing model.bst'",
        "pytorch": (
            "assert os.path.isdir('/target/model/model-store') and "
            "any(name.endswith('.mar') for name in os.listdir('/target/model/model-store')), "
            "'target model is missing TorchServe .mar'; "
            "assert os.path.exists('/target/model/config/config.properties'), "
            "'target model is missing TorchServe config.properties'"
        ),
        "tensorflow": (
            "assert any(name == 'saved_model.pb' for _, _, files in os.walk('/target/model') "
            "for name in files), 'target model is missing saved_model.pb'"
        ),
    }.get(model_format)
    if not validation:
        raise ValueError(f"지원하지 않는 KServe 모델 형식입니다: {model_format}")

    source_literal = repr(source_path) if source_path else "None"
    download_url_literal = repr(source_download_url) if source_download_url else "None"
    download_email_literal = repr(source_download_email) if source_download_email else "None"
    download_namespace_literal = repr(source_download_namespace) if source_download_namespace else "None"
    script = f"""
set -e
mkdir -p /target/model
chmod 777 /target /target/model

python3 <<'PYEOF'
import os, shutil, mlflow
mlflow.set_tracking_uri('{mlflow_uri}')
source_rel = {source_literal}
download_url = {download_url_literal}
if download_url:
    import shutil as _shutil
    import urllib.request as _urlrequest
    import zipfile as _zipfile
    archive_path = '/tmp/model-repository.zip'
    request = _urlrequest.Request(
        download_url,
        headers={{
            'kubeflow-userid': {download_email_literal} or '',
            'x-pm-namespace': {download_namespace_literal} or '',
        }},
    )
    with _urlrequest.urlopen(request, timeout=120) as response, open(archive_path, 'wb') as output:
        _shutil.copyfileobj(response, output)
    extract_root = '/tmp/model-repository'
    _shutil.rmtree(extract_root, ignore_errors=True)
    os.makedirs(extract_root, exist_ok=True)
    with _zipfile.ZipFile(archive_path) as archive:
        for member in archive.infolist():
            target = os.path.realpath(os.path.join(extract_root, member.filename))
            if not target.startswith(os.path.realpath(extract_root) + os.sep):
                raise RuntimeError('model repository archive contains an unsafe path')
        archive.extractall(extract_root)
    local = extract_root
    print('using synchronized model repository download', download_url)
elif source_rel:
    local = os.path.join('/source', source_rel)
    if not os.path.isdir(local):
        raise RuntimeError(f'model repository source is missing: {{local}}')
    print('using synchronized model repository', local)
else:
    local = mlflow.artifacts.download_artifacts(artifact_uri='{artifact_uri}')
    print('downloaded to', local)
if not local or not os.path.isdir(local):
    raise RuntimeError(f'MLflow artifact download failed: {{local}}')
# 다운로드 검증 후 기존 파일 제거
for name in os.listdir('/target/model'):
    path = os.path.join('/target/model', name)
    if os.path.isdir(path):
        shutil.rmtree(path)
    else:
        os.unlink(path)
for name in os.listdir(local):
    src = os.path.join(local, name)
    dst = os.path.join('/target/model', name)
    if os.path.isfile(src):
        shutil.copy2(src, dst)
    elif os.path.isdir(src):
        shutil.copytree(src, dst, dirs_exist_ok=True)
# MLflow sklearn flavor serializes the estimator as model.pkl, while the
# KServe MLServer sklearn runtime used by this deployment expects
# model.joblib.  Preserve uploaded model.joblib files and normalize only the
# standard MLflow name when necessary.
if '{model_format}' == 'sklearn' and not os.path.exists('/target/model/model.joblib'):
    for legacy_name in ('model.pkl', 'model.pickle'):
        legacy_path = os.path.join('/target/model', legacy_name)
        if os.path.exists(legacy_path):
            shutil.copy2(legacy_path, '/target/model/model.joblib')
            break
{validation}
print('files in /target/model:')
for f in sorted(os.listdir('/target/model')):
    print(' -', f)
PYEOF
ls -la /target/model/
"""
    pod_body = client.V1Pod(
        metadata=client.V1ObjectMeta(
            name=pod_name,
            namespace=namespace,
            annotations={"sidecar.istio.io/inject": "false"},
        ),
        spec=client.V1PodSpec(
            restart_policy="Never",
            security_context=client.V1PodSecurityContext(run_as_user=0, fs_group=0),
            containers=[client.V1Container(
                name="copier",
                image="ghcr.io/mlflow/mlflow:v3.0.0",
                command=["sh", "-c", script],
                security_context=client.V1SecurityContext(run_as_user=0),
                resources=client.V1ResourceRequirements(
                    requests={"cpu": "100m", "memory": "512Mi"},
                    limits={"cpu": "1", "memory": "2Gi"},
                ),
                volume_mounts=[
                    client.V1VolumeMount(name="model-pvc", mount_path="/target"),
                    *([
                        client.V1VolumeMount(
                            name="source-model-store", mount_path="/source", read_only=True
                        )
                    ] if source_path else []),
                ],
            )],
            volumes=[
                client.V1Volume(
                    name="model-pvc",
                    persistent_volume_claim=client.V1PersistentVolumeClaimVolumeSource(
                        claim_name=pvc_name
                    ),
                ),
                *([
                    client.V1Volume(
                        name="source-model-store",
                        persistent_volume_claim=client.V1PersistentVolumeClaimVolumeSource(
                            claim_name=source_pvc_name
                        ),
                    )
                ] if source_path else []),
            ],
        ),
    )
    try:
        core_v1.delete_namespaced_pod(pod_name, namespace)
    except client.ApiException:
        pass
    # 이전 Pod 완전 삭제 대기
    for _ in range(20):
        try:
            core_v1.read_namespaced_pod(pod_name, namespace)
            await asyncio.sleep(1)
        except client.ApiException as e:
            if e.status == 404:
                break
    core_v1.create_namespaced_pod(namespace, pod_body)
    # 완료 대기 (최대 90초). 최종 phase 반환.
    import time as _t
    deadline = _t.time() + 90
    while _t.time() < deadline:
        try:
            p = core_v1.read_namespaced_pod(pod_name, namespace)
            if p.status.phase in ("Succeeded", "Failed"):
                return p.status.phase
        except Exception:  # nosec
            pass
        await asyncio.sleep(2)
    raise RuntimeError("model copy helper pod timeout")


def _apply_isvc(
    custom: Any,
    name: str,
    namespace: str,
    pvc_name: str,
    model_name: str,
    version: str,
    model_format: str = "mlflow",
    scale_to_zero: bool = False,
) -> None:
    annotations = {
        "sidecar.istio.io/inject": "false",
        "serving.kserve.io/deploymentMode": "Serverless",
        "prod.model_name": model_name,
        "prod.model_version": version,
        "prod.model_format": model_format,
        "prod.deployed_at": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"),
        "prod.scale_to_zero": "true" if scale_to_zero else "false",
    }
    if scale_to_zero:
        # Knative autoscaler 가 idle pod 회수
        annotations["autoscaling.knative.dev/min-scale"] = "0"
        annotations["autoscaling.knative.dev/scale-to-zero-pod-retention-period"] = "30s"

    predictor = {
        "serviceAccountName": "default-editor",
        "model": {
            "modelFormat": {"name": model_format},
            "protocolVersion": "v1" if model_format == "tensorflow" else "v2",
            "storageUri": f"pvc://{pvc_name}/model",
        },
    }
    if scale_to_zero:
        predictor["minReplicas"] = 0
        predictor["maxReplicas"] = 1

    isvc = {
        "apiVersion": "serving.kserve.io/v1beta1",
        "kind": "InferenceService",
        "metadata": {
            "name": name,
            "namespace": namespace,
            "annotations": annotations,
        },
        "spec": {"predictor": predictor},
    }
    try:
        custom.create_namespaced_custom_object(
            "serving.kserve.io", "v1beta1", namespace, "inferenceservices", isvc
        )
        return
    except client.ApiException as e:
        if e.status != 409:
            raise
    # replace - annotation 갱신으로 rollout 유도
    existing = custom.get_namespaced_custom_object(
        "serving.kserve.io", "v1beta1", namespace, "inferenceservices", name
    )
    isvc["metadata"]["resourceVersion"] = existing["metadata"]["resourceVersion"]
    custom.replace_namespaced_custom_object(
        "serving.kserve.io", "v1beta1", namespace, "inferenceservices", name, isvc
    )


async def _wait_for_inference_service_ready(
    core_v1: Any,
    custom: Any,
    name: str,
    namespace: str,
    timeout_seconds: int = 420,
) -> dict[str, Any]:
    """Wait for KServe readiness before changing the model lifecycle stage.

    Creating an InferenceService only means that KServe accepted its manifest.
    The serving revision can still fail later because of image pulls, a bad
    artifact, or an unschedulable workload.  Returning success before Ready
    made the UI label a non-working model as Production.
    """
    deadline = time.monotonic() + timeout_seconds
    last_state = "KServe InferenceService 생성 대기"
    ready_since: float | None = None

    while time.monotonic() < deadline:
        obj = custom.get_namespaced_custom_object(
            "serving.kserve.io", "v1beta1", namespace, "inferenceservices", name
        )
        status = obj.get("status") or {}
        conditions = {item.get("type"): item for item in (status.get("conditions") or [])}
        ready_condition = conditions.get("Ready") or {}
        ready = ready_condition.get("status") == "True"

        reason = ready_condition.get("reason") or "Ready 대기"
        message = ready_condition.get("message") or ""
        last_state = f"{reason}: {message}".strip(": ")

        try:
            pods = core_v1.list_namespaced_pod(
                namespace,
                label_selector=f"serving.kserve.io/inferenceservice={name}",
            ).items
            pod_ready = bool(pods)
            for pod in pods:
                phase = pod.status.phase or "Unknown"
                waiting = []
                for container_status in (pod.status.container_statuses or []):
                    if not container_status.ready or container_status.restart_count:
                        pod_ready = False
                    state = container_status.state.waiting
                    if state:
                        waiting.append(
                            f"{container_status.name}={state.reason or 'Waiting'}"
                        )
                detail = ", ".join(waiting) if waiting else phase
                last_state = f"pod {pod.metadata.name}: {detail}"
            if ready and pod_ready:
                if ready_since is None:
                    ready_since = time.monotonic()
                elif time.monotonic() - ready_since >= 15:
                    return status
            else:
                ready_since = None
        except Exception:
            # A transient API read failure should not hide a deployment that
            # may become ready on the next poll.
            pass

        if not ready:
            ready_since = None

        await asyncio.sleep(3)

    raise RuntimeError(
        f"KServe InferenceService가 {timeout_seconds}초 안에 Ready가 되지 않았습니다. "
        f"현재 상태: {last_state}"
    )


async def deploy_production(
    model_name: str,
    version: str,
    target_namespace: str,
    scale_to_zero: bool = False,
    mlflow_namespace: str | None = None,
    stage_after_deploy: bool = False,
    artifact_download_email: str | None = None,
) -> dict:
    """
    1) MLflow Stage → Production (기존 Production은 Archived)
    2) PVC 확인/생성
    3) Helper Pod으로 모델 파일 교체
    4) InferenceService 생성/교체
    """
    require_tenant_namespace(target_namespace)
    if mlflow_namespace:
        require_tenant_namespace(mlflow_namespace)
    version_info = registry.get_version_info(model_name, version, namespace=mlflow_namespace)
    run_id = version_info.get("run_id")
    if not run_id:
        raise ValueError(f"version {version}에 run_id가 없습니다")

    # Stage 변경은 artifact 검증과 KServe 적용이 성공한 뒤 수행한다.
    core_v1, custom = _k8s_clients()
    isvc_name = _safe_name(model_name)
    pvc_name = f"{isvc_name}-pvc"[:60]
    helper_name = f"{isvc_name}-copy"[:63]

    # 2) 모델 포맷 감지 및 artifact 사전 검증. 실패하면 PVC/ISVC를 만들지 않는다.
    model_format = _detect_model_format(
        run_id,
        mlflow_namespace=mlflow_namespace,
        tags=version_info.get("tags") or {},
    )
    artifact_uri = _resolve_model_artifact_uri(run_id, mlflow_namespace=mlflow_namespace)
    # AutoML synchronizes every registered model into the shared model-store
    # PVC before exposing it in the registry. MLflow 3 LoggedModel output URIs
    # are not always downloadable through the legacy artifact endpoint, so
    # prefer the synchronized PVC copy and keep MLflow as a fallback.
    repository = version_info.get("repository") or {}
    repository_path_text = repository.get("path")
    repository_source_path: str | None = None
    if repository_path_text:
        try:
            repository_root = Path(repository.get("root") or "/models").resolve()
            repository_path = Path(repository_path_text).resolve()
            repository_source_path = str(repository_path.relative_to(repository_root))
            if not repository_path.is_dir():
                repository_source_path = None
        except (OSError, ValueError):
            repository_source_path = None
    _preflight_model_artifact(
        _mlflow_uri(mlflow_namespace),
        artifact_uri,
        model_format,
        local_path=repository_path_text if repository_source_path else None,
    )
    repository_download_url: str | None = None
    if repository_source_path and artifact_download_email:
        from urllib.parse import quote

        owner_namespace = mlflow_namespace or target_namespace
        repository_download_url = (
            "http://prediction-manager.kubeflow.svc.cluster.local"
            "/api/models/"
            f"{quote(model_name, safe='')}/versions/{quote(str(version), safe='')}/download"
            f"?ns={quote(owner_namespace, safe='')}"
        )
    # The model-store PVC belongs to the Prediction Manager namespace. A
    # tenant helper Pod cannot mount a PVC from another namespace, so use the
    # authenticated internal download endpoint for cross-namespace copies.
    if target_namespace != "kubeflow":
        repository_source_path = None

    # 3) PVC
    _ensure_pvc(core_v1, pvc_name, target_namespace)

    # 4) 모델 파일 복사 (기존 파일 덮어쓰기)
    helper_phase = await _run_helper_pod(
        core_v1,
        helper_name,
        target_namespace,
        pvc_name,
        artifact_uri,
        model_format,
        _mlflow_uri(mlflow_namespace),
        source_path=repository_source_path,
        source_download_url=repository_download_url,
        source_download_email=artifact_download_email,
        source_download_namespace=mlflow_namespace or target_namespace,
    )
    if helper_phase != "Succeeded":
        try:
            logs = core_v1.read_namespaced_pod_log(helper_name, target_namespace, container="copier")
            logs = logs.strip()
            if len(logs) > 1600:
                logs = logs[:1600] + "...(truncated)"
        except Exception as e:
            logs = f"helper log 조회 실패: {e}"
        raise RuntimeError(f"모델 artifact 복사 실패: helper pod phase={helper_phase}. logs={logs}")

    # 5) InferenceService: package metadata에 맞는 KServe runtime을 선택한다.
    try:
        _apply_isvc(
            custom, isvc_name, target_namespace, pvc_name, model_name, version,
            model_format, scale_to_zero=scale_to_zero,
        )
    except Exception:
        try:
            core_v1.delete_namespaced_pod(helper_name, target_namespace, grace_period_seconds=0)
        except client.ApiException:
            pass
        raise

    # A model becomes Production only when its actual KServe serving revision
    # is Ready.  This keeps a failed image pull or startup error visible to
    # the user instead of recording a false successful deployment.
    await _wait_for_inference_service_ready(core_v1, custom, isvc_name, target_namespace)

    registry.set_stage(
        model_name, version, "Production", archive_existing=True, namespace=mlflow_namespace
    )

    # 6) Helper Pod 정리: Succeeded 만 삭제, Failed 는 디버깅용으로 보존
    if helper_phase == "Succeeded":
        try:
            core_v1.delete_namespaced_pod(helper_name, target_namespace, grace_period_seconds=0)
        except client.ApiException:
            pass

    return {
        "isvc_name": isvc_name,
        "isvc_url": f"http://{isvc_name}.{target_namespace}.svc.cluster.local",
        "namespace": target_namespace,
        "pvc_name": pvc_name,
        "model_name": model_name,
        "version": version,
        "model_format": model_format,
        "scale_to_zero": scale_to_zero,
        "repository": version_info.get("repository"),
    }


def undeploy_production(model_name: str, namespace: str) -> dict:
    """해당 모델의 Production ISVC 제거. 모델 파일 PVC도 함께 삭제."""
    require_tenant_namespace(namespace)
    core_v1, custom = _k8s_clients()
    isvc_name = _safe_name(model_name)
    pvc_name = f"{isvc_name}-pvc"[:60]  # deploy_production 의 pvc 이름 규칙과 일치
    deleted_isvc = False
    deleted_pvc = False
    try:
        custom.delete_namespaced_custom_object(
            "serving.kserve.io", "v1beta1", namespace, "inferenceservices", isvc_name
        )
        deleted_isvc = True
    except client.ApiException as e:
        if e.status != 404:
            raise
    try:
        core_v1.delete_namespaced_persistent_volume_claim(pvc_name, namespace)
        deleted_pvc = True
    except client.ApiException as e:
        if e.status != 404:
            raise
    return {
        "isvc_deleted": deleted_isvc,
        "pvc_deleted": deleted_pvc,
        "isvc_name": isvc_name,
        "pvc_name": pvc_name,
    }


def get_production_status(model_name: str, namespace: str) -> dict | None:
    """해당 모델의 Production ISVC 상태 조회."""
    core_v1, custom = _k8s_clients()
    isvc_name = _safe_name(model_name)
    try:
        obj = custom.get_namespaced_custom_object(
            "serving.kserve.io", "v1beta1", namespace, "inferenceservices", isvc_name
        )
    except client.ApiException as e:
        if e.status == 404:
            return None
        raise
    status = obj.get("status", {}) or {}
    conds = {c.get("type"): c for c in (status.get("conditions") or [])}
    ready = conds.get("Ready", {}).get("status") == "True"
    annos = (obj.get("metadata", {}).get("annotations") or {})
    return {
        "isvc_name": isvc_name,
        "namespace": namespace,
        "url": status.get("url") or f"http://{isvc_name}.{namespace}.svc.cluster.local",
        "ready": ready,
        "deployed_version": annos.get("prod.model_version"),
        "model_format": annos.get("prod.model_format") or "mlflow",
        "deployed_at": annos.get("prod.deployed_at"),
        "scale_to_zero": annos.get("prod.scale_to_zero") == "true",
    }


def test_production(
    model_name: str,
    namespace: str,
    payload: dict[str, Any],
    timeout_seconds: float = 60,
) -> dict:
    """Send a test inference request to the model's Production KServe endpoint.

    Knative may scale a Production endpoint to zero.  The first request can
    therefore receive KServe's transient ``model is not ready yet`` response
    while the revision is starting.  Retry only that documented cold-start
    condition within the caller's requested timeout; payload and model errors
    are returned immediately so the UI remains an accurate diagnostic tool.
    """
    import httpx

    status = get_production_status(model_name, namespace)
    if status is None:
        raise ValueError("운영 배포된 KServe InferenceService가 없습니다")
    isvc_name = status["isvc_name"]
    service_url = f"http://{isvc_name}.{namespace}.svc.cluster.local"
    if status.get("model_format") == "tensorflow":
        url = f"{service_url}/v1/models/{isvc_name}:predict"
    else:
        url = f"{service_url}/v2/models/{isvc_name}/infer"
    started = time.monotonic()
    deadline = started + max(float(timeout_seconds), 1.0)
    resp = None
    while True:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise RuntimeError("KServe 테스트 요청 timeout")
        try:
            # The total deadline remains authoritative across all cold-start
            # retries, while a healthy but genuinely slow inference still
            # receives the full timeout selected in the UI.
            resp = httpx.post(url, json=payload, timeout=remaining)
        except httpx.TimeoutException as e:
            raise RuntimeError("KServe 테스트 요청 timeout") from e
        except httpx.RequestError as e:
            raise RuntimeError(f"KServe 테스트 요청 실패: {e}") from e

        transient_body = resp.text.lower()
        cold_start = (
            resp.status_code in {400, 404, 503}
            and "not ready yet" in transient_body
        )
        if not cold_start:
            break
        if time.monotonic() >= deadline:
            break
        time.sleep(min(2.0, max(0.0, deadline - time.monotonic())))

    assert resp is not None
    elapsed_ms = int((time.monotonic() - started) * 1000)
    content_type = resp.headers.get("content-type", "")
    response_json: Any | None = None
    response_text = ""
    if "json" in content_type.lower():
        try:
            response_json = resp.json()
        except Exception:
            response_text = resp.text
    else:
        response_text = resp.text
    if response_text and len(response_text) > 12000:
        response_text = response_text[:12000] + "...(truncated)"
    return {
        "ok": 200 <= resp.status_code < 300,
        "status_code": resp.status_code,
        "elapsed_ms": elapsed_ms,
        "request_url": url,
        "namespace": namespace,
        "isvc_name": isvc_name,
        "deployed_version": status.get("deployed_version"),
        "ready": status.get("ready"),
        "response": response_json,
        "response_text": response_text,
        "content_type": content_type,
    }
