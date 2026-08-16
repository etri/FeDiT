#!/usr/bin/env bash
set -uo pipefail

# Functional verification for guide.txt section 2.2.9.
# Run this after bootstrap-verification.sh on the Ubuntu host/container that
# owns /etc/kubernetes/admin.conf. Test objects use a fedit-vfy-* prefix and
# are removed before the script exits.

export KUBECONFIG="${KUBECONFIG:-/etc/kubernetes/admin.conf}"
VERIFY_PROFILE="${VERIFY_PROFILE:-gpu}"
case "$VERIFY_PROFILE" in
  cpu|gpu) ;;
  *) echo "VERIFY_PROFILE must be cpu or gpu (received: ${VERIFY_PROFILE})" >&2; exit 2 ;;
esac
# Long-running model downloads or training jobs must not block the verification
# sequence indefinitely.  After this limit, the test records that execution was
# accepted and started, then its cleanup handler removes the test resource.
TEST_ACTION_TIMEOUT_SECONDS="${TEST_ACTION_TIMEOUT_SECONDS:-180}"
PM_URL="${PM_URL:-http://127.0.0.1:18000/prediction-manager}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:18000}"
MLFLOW_URL="${MLFLOW_URL:-http://127.0.0.1:15000}"
NIFI_URL="${NIFI_URL:-http://127.0.0.1:15001}"
RAY_URL="${RAY_URL:-http://127.0.0.1:15002}"
LABEL_STUDIO_URL="${LABEL_STUDIO_URL:-http://127.0.0.1:15003}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://127.0.0.1:19090}"
# KFP is reached through the FeDiT gateway rather than a test-only local
# kubectl port-forward.  This keeps every host listener within the published
# port policy and exercises the same route that a browser uses.
KFP_URL="${KFP_URL:-${FRONTEND_URL}/pipeline}"
TEST_NAMESPACE="${TEST_NAMESPACE:-kubeflow-user-example-com}"
TEST_USER="${TEST_USER:-user@example.com}"
STAMP="$(date +%Y%m%d-%H%M%S)"
PREFIX="fedit-vfy-${STAMP,,}"
K8S_PREFIX="c229-$(date +%H%M%S)"
INSTALL_USER="${PM_INSTALL_ORIGINAL_USER:-${SUDO_USER:-$(id -un)}}"
INSTALL_HOME="$(getent passwd "$INSTALL_USER" | cut -d: -f6)"
[[ -n "$INSTALL_HOME" ]] || INSTALL_HOME="$HOME"
RESULT_ROOT="${RESULT_ROOT:-${INSTALL_HOME}/prediction-manager-work/.prediction-manager/${VERIFY_PROFILE}/functional-2.2.9/${STAMP}}"
REPORT="${RESULT_ROOT}/verification-report-2.2.9-${VERIFY_PROFILE}.md"
LOG_DIR="${RESULT_ROOT}/logs"
RESULT_PARENT="$(dirname "$RESULT_ROOT")"
if ((EUID == 0)); then
  # The verifier is also run with sudo during installation.  Create the
  # reusable parent as the invoking user so a later non-root operator can
  # execute the same functional test and retain its own evidence.
  install -d -m 0755 -o "$INSTALL_USER" -g "$(id -gn "$INSTALL_USER")" "$RESULT_PARENT"
  install -d -m 0755 -o "$INSTALL_USER" -g "$(id -gn "$INSTALL_USER")" "$RESULT_ROOT"
else
  mkdir -p "$RESULT_ROOT"
fi
mkdir -p "$LOG_DIR"

PASS_COUNT=0
FAIL_COUNT=0
DETAIL=""
AUTOML_JOB_ID=""
AUTOML_DATASET_ID=""
AUTOML_MLFLOW_EXPERIMENT=""
LABEL_PROJECT_ID=""
NIFI_GROUP_ID=""
KFP_EXPERIMENT_ID=""
MLFLOW_EXPERIMENT_ID=""
MLFLOW_RUN_ID=""
MLFLOW_MODEL_NAME=""
TB_PVC_CREATED=false
TEST_DATASET_ID=""
DATA_SERVER_PID=""
DATA_SERVER_DIR=""
TMP_WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/${PREFIX}.XXXXXX")"

label_headers=(
  -H "kubeflow-userid: ${TEST_USER}"
  -H "x-auth-request-email: ${TEST_USER}"
  -H "x-auth-request-user: ${TEST_USER}"
)

sanitize_detail() {
  tr '\n\r|' '   ' | sed -E 's/[[:space:]]+/ /g' | cut -c1-360
}

record_pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf '| PASS | %s | %s |\n' "$1" "$2" >> "$REPORT"
  printf '[PASS] %s - %s\n' "$1" "$2"
}

record_fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf '| FAIL | %s | %s |\n' "$1" "$2" >> "$REPORT"
  printf '[FAIL] %s - %s\n' "$1" "$2" >&2
}

run_test() {
  local name="$1" function_name="$2" log_file detail
  log_file="${LOG_DIR}/${function_name}.log"
  DETAIL=""
  if "$function_name" >"$log_file" 2>&1; then
    detail="${DETAIL:-$(tail -n 3 "$log_file" | sanitize_detail)}"
    record_pass "$name" "$detail"
  else
    detail="$(tail -n 12 "$log_file" | sanitize_detail)"
    record_fail "$name" "${detail:-명령 실패; ${log_file} 확인}"
  fi
}

cleanup() {
  set +e
  [[ -n "$DATA_SERVER_PID" ]] && kill "$DATA_SERVER_PID" >/dev/null 2>&1
  [[ -n "$DATA_SERVER_DIR" ]] && find "$DATA_SERVER_DIR" -depth -mindepth 1 -delete >/dev/null 2>&1
  [[ -n "$DATA_SERVER_DIR" ]] && rmdir "$DATA_SERVER_DIR" >/dev/null 2>&1
  [[ -n "$TMP_WORK_DIR" ]] && find "$TMP_WORK_DIR" -depth -mindepth 1 -delete >/dev/null 2>&1
  [[ -n "$TMP_WORK_DIR" ]] && rmdir "$TMP_WORK_DIR" >/dev/null 2>&1
  [[ -n "$AUTOML_JOB_ID" ]] && curl -fsS -X DELETE "${PM_URL}/api/automl/jobs/${AUTOML_JOB_ID}" >/dev/null 2>&1
  [[ -n "$AUTOML_DATASET_ID" ]] && curl -fsS -X DELETE "${PM_URL}/api/datasets/${AUTOML_DATASET_ID}" >/dev/null 2>&1
  [[ -n "$TEST_DATASET_ID" ]] && curl -fsS -X DELETE "${PM_URL}/api/datasets/${TEST_DATASET_ID}" >/dev/null 2>&1
  [[ -n "$LABEL_PROJECT_ID" ]] && curl -fsS -X DELETE "${label_headers[@]}" "${LABEL_STUDIO_URL}/api/projects/${LABEL_PROJECT_ID}" >/dev/null 2>&1
  if [[ -n "$NIFI_GROUP_ID" ]]; then
    local revision
    revision="$(curl -fsS "${NIFI_URL}/nifi-api/process-groups/${NIFI_GROUP_ID}" | jq -r '.revision.version // 0' 2>/dev/null)"
    curl -fsS -X DELETE "${NIFI_URL}/nifi-api/process-groups/${NIFI_GROUP_ID}?version=${revision:-0}" >/dev/null 2>&1
  fi
  if [[ -n "$KFP_EXPERIMENT_ID" ]]; then
    curl -fsS -X DELETE -H "kubeflow-userid: ${TEST_USER}" \
      "${KFP_URL}/apis/v2beta1/experiments/${KFP_EXPERIMENT_ID}" >/dev/null 2>&1
  fi
  [[ -n "$MLFLOW_MODEL_NAME" ]] && curl -fsS -X DELETE -H 'Content-Type: application/json' \
    -d "{\"name\":\"${MLFLOW_MODEL_NAME}\"}" "${MLFLOW_URL}/api/2.0/mlflow/registered-models/delete" >/dev/null 2>&1
  [[ -n "$MLFLOW_EXPERIMENT_ID" ]] && curl -fsS -H 'Content-Type: application/json' \
    -d "{\"experiment_id\":\"${MLFLOW_EXPERIMENT_ID}\"}" "${MLFLOW_URL}/api/2.0/mlflow/experiments/delete" >/dev/null 2>&1
  kubectl -n "$TEST_NAMESPACE" delete inferenceservice "${K8S_PREFIX}-isvc" --ignore-not-found --wait=false >/dev/null 2>&1
  kubectl -n "$TEST_NAMESPACE" delete tensorboard "${K8S_PREFIX}-tb" --ignore-not-found --wait=false >/dev/null 2>&1
  if [[ "$TB_PVC_CREATED" == true ]]; then
    kubectl -n "$TEST_NAMESPACE" delete pvc tb-volume --ignore-not-found --wait=false >/dev/null 2>&1
  fi
  kubectl -n "$TEST_NAMESPACE" delete pod "${PREFIX}-pvc" "${PREFIX}-curl" --ignore-not-found --wait=false >/dev/null 2>&1
  kubectl -n "$TEST_NAMESPACE" delete pvc "${PREFIX}-pvc" --ignore-not-found --wait=false >/dev/null 2>&1
  kubectl -n "$TEST_NAMESPACE" delete deployment "${PREFIX}-data" --ignore-not-found --wait=false >/dev/null 2>&1
  kubectl -n "$TEST_NAMESPACE" delete service "${PREFIX}-data" --ignore-not-found --wait=false >/dev/null 2>&1
  kubectl -n "$TEST_NAMESPACE" delete configmap "${PREFIX}-data" --ignore-not-found >/dev/null 2>&1
}
trap cleanup EXIT

cat > "$REPORT" <<EOF
# Prediction Manager guide.txt 2.2.9 ${VERIFY_PROFILE^^} 기능 검증

- 실행 시각: $(date '+%Y-%m-%d %H:%M:%S %Z')
- 대상 namespace: ${TEST_NAMESPACE}
- 시험 prefix: ${PREFIX}
- 정책: GPU 모드는 기존 NVIDIA 드라이버를 재사용하고, CPU 모드는 NVIDIA 드라이버·Container Toolkit을 설치하지 않음
- 장기 실행 한도: ${TEST_ACTION_TIMEOUT_SECONDS}초 (초과 시 실행 시작 확인 후 정리)

| 상태 | 기능 | 증거 |
|---|---|---|
EOF

test_compute_profile() {
  if [[ "$VERIFY_PROFILE" == "cpu" ]]; then
    local runtime
    runtime="$(docker info --format '{{json .Runtimes}}' 2>/dev/null || true)"
    [[ "$runtime" != *'"nvidia"'* ]] || {
      echo "CPU installation unexpectedly enabled the NVIDIA Docker runtime"
      return 1
    }
    kubectl -n "$TEST_NAMESPACE" get raycluster pm-ray >/dev/null || return
    DETAIL="CPU profile; NVIDIA Docker runtime absent; Ray head resource available"
    return 0
  fi

  local physical allocatable driver_packages nested_count model driver vram_gib slices
  physical="$(nvidia-smi --query-gpu=index --format=csv,noheader | wc -l | tr -d ' ')" || return
  ((physical > 0)) || { echo "physical GPU not detected"; return 1; }
  allocatable="$(kubectl get node -o json | jq -r '.items[0].status.allocatable["nvidia.com/gpu"] // "0"')" || return
  ((allocatable >= physical && allocatable % physical == 0)) || {
    echo "allocatable=${allocatable} is not a positive multiple of physical=${physical}"
    return 1
  }
  slices=$((allocatable / physical))
  driver_packages="$(dpkg-query -W -f='${binary:Package} ${Status}\n' 'nvidia-driver-*' 2>/dev/null | grep ' install ok installed$' || true)"
  [[ -z "$driver_packages" ]] || { echo "target contains driver packages: ${driver_packages}"; return 1; }
  # The privileged clean-install lab uses a nested Docker daemon.  Docker's
  # generic --gpus capability negotiation is not available there, but the
  # NVIDIA runtime is.  Selecting it explicitly still requires and verifies
  # the physical host GPU from inside the CUDA container.
  nested_count="$(docker run --rm --runtime=nvidia \
    -e NVIDIA_VISIBLE_DEVICES=all \
    -e NVIDIA_DRIVER_CAPABILITIES=compute,utility \
    nvidia/cuda:12.6.0-base-ubuntu22.04 \
    nvidia-smi --query-gpu=index --format=csv,noheader | wc -l | tr -d ' ')" || return
  [[ "$nested_count" == "$physical" ]] || { echo "nested Docker GPU=${nested_count}, physical=${physical}"; return 1; }
  model="$(nvidia-smi --query-gpu=name --format=csv,noheader | sort -u | paste -sd/ -)"
  driver="$(nvidia-smi --query-gpu=driver_version --format=csv,noheader | head -1)"
  vram_gib="$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | sort -n | head -1 | awk '{printf "%.0f", $1/1024}')"
  DETAIL="${physical}×${model}, min VRAM ${vram_gib} GiB, driver ${driver}, auto slots/GPU=${slices}, allocatable=${allocatable}; target driver package=0"
}

test_frontend_and_core_api() {
  local code title user frontend_html
  frontend_html="${TMP_WORK_DIR}/frontend.html"
  code="$(curl -sS -o "$frontend_html" -w '%{http_code}' "${FRONTEND_URL}/fedit/predictor-creator-tool")" || return
  [[ "$code" == "200" ]] || { echo "frontend HTTP ${code}"; return 1; }
  grep -qi '<title>' "$frontend_html" || { echo "frontend HTML title missing"; return 1; }
  curl -fsS "${PM_URL}/healthz" | jq -e '.status == "ok"' >/dev/null || return
  user="$(curl -fsS "${PM_URL}/api/user-info")" || return
  jq -e --arg email "$TEST_USER" '.email == $email and .namespace == "kubeflow-user-example-com"' <<<"$user" >/dev/null || return
  local dashboard expected_physical expected_model
  dashboard="$(curl -fsS "${PM_URL}/api/dashboard/summary")" || return
  if [[ "$VERIFY_PROFILE" == "gpu" ]]; then
    expected_physical="$(nvidia-smi --query-gpu=index --format=csv,noheader | wc -l | tr -d ' ')"
    expected_model="$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1 | xargs)"
    jq -e --argjson count "$expected_physical" --arg model "$expected_model" \
      '.my_resource.namespace == "kubeflow-user-example-com" and .image_count >= 5 and .gpu_hardware.model == $model and .gpu_hardware.physical_count == $count' \
      <<<"$dashboard" >/dev/null || return
  else
    jq -e '.my_resource.namespace == "kubeflow-user-example-com" and .image_count >= 5' \
      <<<"$dashboard" >/dev/null || return
  fi
  title="$(sed -n 's:.*<title>\(.*\)</title>.*:\1:p' "$frontend_html" | head -1)"
  DETAIL="FeDiT predictor page HTTP 200 (${title:-HTML}); Prediction Manager health/user/dashboard API 정상"
}

test_dataset_cycle() {
  local name create dataset_id upload version token profile download code source_csv
  name="${PREFIX}-dataset"
  create="$(curl -fsS -H 'Content-Type: application/json' -d \
    "{\"name\":\"${name}\",\"description\":\"2.2.9 functional test\",\"data_type\":\"csv\",\"task\":\"regression\",\"target_column\":\"target\"}" \
    "${PM_URL}/api/datasets")" || return
  dataset_id="$(jq -r '.id' <<<"$create")"
  TEST_DATASET_ID="$dataset_id"
  source_csv="${TMP_WORK_DIR}/dataset.csv"
  printf 'x1,x2,target\n1,2,3\n2,3,5\n3,4,7\n4,5,9\n' > "$source_csv"
  upload="$(curl -fsS -X POST -H 'Content-Type: text/csv' -H 'x-dataset-filename: fedit-vfy.csv' \
    --data-binary @"$source_csv" "${PM_URL}/api/datasets/${dataset_id}/versions")" || return
  version="$(jq -r '.version' <<<"$upload")"
  token="$(jq -r '.download_token' <<<"$upload")"
  profile="$(curl -fsS "${PM_URL}/api/datasets/${dataset_id}/versions/${version}/profile")" || return
  jq -e '.row_count == 4 and .column_count == 3 and .target_column == "target"' <<<"$profile" >/dev/null || return
  download="${TMP_WORK_DIR}/download.csv"
  curl -fsS "${PM_URL}/api/datasets/${dataset_id}/versions/${version}/download?token=${token}" -o "$download" || return
  cmp -s "$source_csv" "$download" || { echo "download differs"; return 1; }
  code="$(curl -sS -o /dev/null -w '%{http_code}' -X DELETE "${PM_URL}/api/datasets/${dataset_id}")"
  [[ "$code" == "200" ]] || { echo "delete HTTP ${code}"; return 1; }
  TEST_DATASET_ID=""
  DETAIL="CSV 생성/upload/profile(row=4,column=3)/download/삭제 순환 통과"
}

test_rest_collection_cycle() {
  local device response record_id listed
  device="${PREFIX}-device"
  response="$(curl -fsS -H 'Content-Type: application/json' \
    -d '{"temperature":24.5,"pressure":101.3,"target":1}' \
    "${PM_URL}/api/devices/${device}/data")" || return
  record_id="$(jq -r '.id' <<<"$response")"
  listed="$(curl -fsS "${PM_URL}/api/data-collection/records?device_id=${device}")" || return
  jq -e --arg id "$record_id" '.records[] | select(.id == $id and .payload.temperature == 24.5)' <<<"$listed" >/dev/null || return
  curl -fsS -X DELETE "${PM_URL}/api/data-collection/records/${record_id}" | jq -e '.deleted == true' >/dev/null || return
  DETAIL="REST sensor record 생성/목록/내용 확인/삭제 통과"
}

test_pvc_cycle() {
  kubectl -n "$TEST_NAMESPACE" apply -f - <<EOF || return
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${PREFIX}-pvc
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 64Mi
---
apiVersion: v1
kind: Pod
metadata:
  name: ${PREFIX}-pvc
  annotations:
    # The probe only checks local-path PVC I/O.  Avoid injecting an Istio
    # sidecar so teardown is deterministic on a compact single-node host.
    sidecar.istio.io/inject: "false"
spec:
  restartPolicy: Never
  containers:
  - name: probe
    image: busybox:1.36
    command: [sh, -c, 'echo fedit-vfy-pvc-ok > /data/probe.txt; sleep 900']
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: ${PREFIX}-pvc
EOF
  kubectl -n "$TEST_NAMESPACE" wait --for=condition=Ready "pod/${PREFIX}-pvc" --timeout=180s || return
  [[ "$(kubectl -n "$TEST_NAMESPACE" exec "${PREFIX}-pvc" -- cat /data/probe.txt)" == "fedit-vfy-pvc-ok" ]] || return 1
  # The API accepts the deletion immediately, but the local-path helper and
  # kubelet may take longer to remove the backing directory.  Do not turn
  # that asynchronous housekeeping into a false functional-test timeout.
  kubectl -n "$TEST_NAMESPACE" delete pod "${PREFIX}-pvc" --wait=false >/dev/null || return
  kubectl -n "$TEST_NAMESPACE" delete pvc "${PREFIX}-pvc" --wait=false >/dev/null || return
  DETAIL="local-path PVC bind/write/read/delete 요청 통과"
}

test_nifi_cycle() {
  local diagnostics root create revision
  diagnostics="$(curl -fsS "${NIFI_URL}/nifi-api/system-diagnostics")" || return
  jq -e '.systemDiagnostics.aggregateSnapshot.versionInfo.niFiVersion == "1.28.1"' <<<"$diagnostics" >/dev/null || return
  root="$(curl -fsS "${NIFI_URL}/nifi-api/process-groups/root" | jq -r '.id')" || return
  create="$(curl -fsS -H 'Content-Type: application/json' -d \
    "{\"revision\":{\"version\":0},\"component\":{\"name\":\"${PREFIX}-flow\",\"position\":{\"x\":10,\"y\":10}}}" \
    "${NIFI_URL}/nifi-api/process-groups/${root}/process-groups")" || return
  NIFI_GROUP_ID="$(jq -r '.id' <<<"$create")"
  curl -fsS "${NIFI_URL}/nifi-api/process-groups/${NIFI_GROUP_ID}" | jq -e --arg n "${PREFIX}-flow" '.component.name == $n' >/dev/null || return
  revision="$(jq -r '.revision.version' <<<"$create")"
  curl -fsS -X DELETE "${NIFI_URL}/nifi-api/process-groups/${NIFI_GROUP_ID}?version=${revision}" >/dev/null || return
  NIFI_GROUP_ID=""
  curl -fsS "${PM_URL}/api/nifi/status" | jq -e '.ready == true and .provisioned == true' >/dev/null || return
  DETAIL="NiFi 1.28.1 diagnostics + process group 생성/조회/삭제; PM NiFi 상태 ready"
}

test_label_studio_cycle() {
  local whoami project code
  whoami="$(curl -fsS "${label_headers[@]}" "${LABEL_STUDIO_URL}/api/current-user/whoami")" || return
  jq -e --arg email "$TEST_USER" '.email == $email' <<<"$whoami" >/dev/null || return
  project="$(curl -fsS "${label_headers[@]}" -H 'Content-Type: application/json' -d \
    "{\"title\":\"${PREFIX}-label\",\"label_config\":\"<View><Header value=\\\"2.2.9 GPU test\\\"/></View>\"}" \
    "${LABEL_STUDIO_URL}/api/projects")" || return
  LABEL_PROJECT_ID="$(jq -r '.id' <<<"$project")"
  curl -fsS "${label_headers[@]}" "${LABEL_STUDIO_URL}/api/projects/${LABEL_PROJECT_ID}" \
    | jq -e --arg title "${PREFIX}-label" '.title == $title' >/dev/null || return
  code="$(curl -sS -o /dev/null -w '%{http_code}' -X DELETE "${label_headers[@]}" \
    "${LABEL_STUDIO_URL}/api/projects/${LABEL_PROJECT_ID}")"
  [[ "$code" == "204" ]] || { echo "delete HTTP ${code}"; return 1; }
  LABEL_PROJECT_ID=""
  DETAIL="Kubeflow SSO 사용자 매핑 + Label Studio project 생성/조회/삭제 통과"
}

test_kfp_cycle() {
  for _ in $(seq 1 30); do curl -fsS -H "kubeflow-userid: ${TEST_USER}" \
    "${KFP_URL}/apis/v2beta1/healthz" >/dev/null && break; sleep 1; done
  local health experiment listed code
  health="$(curl -fsS -H "kubeflow-userid: ${TEST_USER}" "${KFP_URL}/apis/v2beta1/healthz")" || return
  # KFP 2.3.0 has used both the older tag_name/multi_user response shape and
  # the current apiServerTagName/apiServerMultiUser shape.  Accept either
  # documented shape, while still requiring the expected API version and
  # multi-user mode rather than merely treating HTTP 200 as a pass.
  jq -e '((.tag_name // .apiServerTagName) == "2.3.0") and ((.multi_user // .apiServerMultiUser) == true)' \
    <<<"$health" >/dev/null || return
  experiment="$(curl -fsS -H "kubeflow-userid: ${TEST_USER}" -H 'Content-Type: application/json' -d \
    "{\"display_name\":\"${PREFIX}-kfp\",\"namespace\":\"${TEST_NAMESPACE}\"}" \
    "${KFP_URL}/apis/v2beta1/experiments")" || return
  KFP_EXPERIMENT_ID="$(jq -r '.experiment_id' <<<"$experiment")"
  listed="$(curl -fsS -H "kubeflow-userid: ${TEST_USER}" \
    "${KFP_URL}/apis/v2beta1/experiments?namespace=${TEST_NAMESPACE}")" || return
  jq -e --arg id "$KFP_EXPERIMENT_ID" '.experiments[] | select(.experiment_id == $id)' <<<"$listed" >/dev/null || return
  code="$(curl -sS -o /dev/null -w '%{http_code}' -X DELETE -H "kubeflow-userid: ${TEST_USER}" \
    "${KFP_URL}/apis/v2beta1/experiments/${KFP_EXPERIMENT_ID}")"
  [[ "$code" =~ ^20[0-9]$ ]] || { echo "KFP delete HTTP ${code}"; return 1; }
  KFP_EXPERIMENT_ID=""
  DETAIL="KFP 2.3.0 multi-user health + experiment 생성/목록/삭제 통과"
}

test_mlflow_cycle() {
  local name experiment run metric
  name="${PREFIX}-mlflow"
  # MLflow has one HTTP worker in the compact CPU profile.  A cancellation
  # caused by a too-short client timeout leaves a real DB transaction queued,
  # so use one bounded, 60-second request rather than repeatedly submitting
  # the same non-idempotent operation.  HTTP/API failures still fail tests.
  experiment="$(curl -fsS --connect-timeout 5 --max-time 60 -H 'Content-Type: application/json' -d "{\"name\":\"${name}\"}" \
    "${MLFLOW_URL}/api/2.0/mlflow/experiments/create")" || return
  MLFLOW_EXPERIMENT_ID="$(jq -r '.experiment_id' <<<"$experiment")"
  run="$(curl -fsS --connect-timeout 5 --max-time 60 -H 'Content-Type: application/json' -d \
    "{\"experiment_id\":\"${MLFLOW_EXPERIMENT_ID}\",\"run_name\":\"fedit-vfy-run\"}" \
    "${MLFLOW_URL}/api/2.0/mlflow/runs/create")" || return
  MLFLOW_RUN_ID="$(jq -r '.run.info.run_id' <<<"$run")"
  curl -fsS --connect-timeout 5 --max-time 60 -H 'Content-Type: application/json' -d \
    "{\"run_id\":\"${MLFLOW_RUN_ID}\",\"key\":\"accuracy\",\"value\":0.99,\"timestamp\":$(date +%s000),\"step\":1}" \
    "${MLFLOW_URL}/api/2.0/mlflow/runs/log-metric" >/dev/null || return
  metric="$(curl -fsS --connect-timeout 5 --max-time 60 "${MLFLOW_URL}/api/2.0/mlflow/runs/get?run_id=${MLFLOW_RUN_ID}")" || return
  jq -e '.run.data.metrics[] | select(.key == "accuracy" and .value == 0.99)' <<<"$metric" >/dev/null || return
  MLFLOW_MODEL_NAME="${name}-model"
  curl -fsS --connect-timeout 5 --max-time 60 -H 'Content-Type: application/json' -d "{\"name\":\"${MLFLOW_MODEL_NAME}\"}" \
    "${MLFLOW_URL}/api/2.0/mlflow/registered-models/create" \
    | jq -e --arg name "$MLFLOW_MODEL_NAME" '.registered_model.name == $name' >/dev/null || return
  curl -fsS --connect-timeout 5 --max-time 60 -X DELETE -H 'Content-Type: application/json' -d "{\"name\":\"${MLFLOW_MODEL_NAME}\"}" \
    "${MLFLOW_URL}/api/2.0/mlflow/registered-models/delete" >/dev/null || return
  MLFLOW_MODEL_NAME=""
  curl -fsS --connect-timeout 5 --max-time 60 -H 'Content-Type: application/json' -d \
    "{\"run_id\":\"${MLFLOW_RUN_ID}\",\"status\":\"FINISHED\",\"end_time\":$(date +%s000)}" \
    "${MLFLOW_URL}/api/2.0/mlflow/runs/update" >/dev/null || return
  curl -fsS --connect-timeout 5 --max-time 60 -H 'Content-Type: application/json' -d "{\"experiment_id\":\"${MLFLOW_EXPERIMENT_ID}\"}" \
    "${MLFLOW_URL}/api/2.0/mlflow/experiments/delete" >/dev/null || return
  MLFLOW_EXPERIMENT_ID=""
  DETAIL="MLflow experiment/run/metric(accuracy=0.99) + Model Registry 생성/삭제 통과"
}

test_ray_job() {
  local submission code encoded entrypoint payload status logs visible elapsed
  submission="${PREFIX}-ray-${VERIFY_PROFILE}"
  if [[ "$VERIFY_PROFILE" == "gpu" ]]; then
    code=$'import ctypes,json,os,ray\nray.init(address="auto")\n@ray.remote(num_gpus=1)\ndef probe():\n    lib=ctypes.CDLL("libcuda.so.1")\n    rc=lib.cuInit(0)\n    count=ctypes.c_int()\n    rc2=lib.cuDeviceGetCount(ctypes.byref(count))\n    return {"cuda_visible_devices":os.environ.get("CUDA_VISIBLE_DEVICES"),"cuInit":rc,"cuDeviceGetCount":rc2,"device_count":count.value}\nprint("CUDA_PROBE="+json.dumps(ray.get(probe.remote()),sort_keys=True))'
  else
    code=$'import json,ray\nray.init(address="auto")\n@ray.remote\ndef probe(): return {"cpu_ray": "ok"}\nprint("CPU_RAY_PROBE="+json.dumps(ray.get(probe.remote()),sort_keys=True))'
  fi
  encoded="$(printf '%s' "$code" | base64 -w0)"
  entrypoint="python -c \"import base64;exec(base64.b64decode('${encoded}'))\""
  payload="$(jq -nc --arg id "$submission" --arg entry "$entrypoint" '{submission_id:$id,entrypoint:$entry}')"
  curl -fsS -H 'Content-Type: application/json' -d "$payload" "${RAY_URL}/api/jobs/" >/dev/null || return
  status=""
  elapsed=0
  while ((elapsed < TEST_ACTION_TIMEOUT_SECONDS)); do
    status="$(curl -fsS "${RAY_URL}/api/jobs/${submission}" | jq -r '.status')" || return
    [[ "$status" =~ ^(SUCCEEDED|FAILED|STOPPED)$ ]] && break
    sleep 5
    elapsed=$((elapsed + 5))
  done
  if [[ ! "$status" =~ ^(SUCCEEDED|FAILED|STOPPED)$ ]]; then
    curl -fsS -X DELETE "${RAY_URL}/api/jobs/${submission}" >/dev/null 2>&1 || true
    DETAIL="Ray ${VERIFY_PROFILE} job accepted and remained RUNNING for ${TEST_ACTION_TIMEOUT_SECONDS}s; stopped by time-limit policy"
    return 0
  fi
  [[ "$status" == "SUCCEEDED" ]] || { curl -fsS "${RAY_URL}/api/jobs/${submission}/logs"; echo "Ray status=${status}"; return 1; }
  logs="$(curl -fsS "${RAY_URL}/api/jobs/${submission}/logs" | jq -r '.logs')" || return
  if [[ "$VERIFY_PROFILE" == "gpu" ]]; then
    grep -q 'CUDA_PROBE=' <<<"$logs" || { echo "$logs"; return 1; }
    grep -q '"cuInit": 0' <<<"$logs" || { echo "$logs"; return 1; }
    grep -Eq '"device_count": [1-9]' <<<"$logs" || { echo "$logs"; return 1; }
    visible="$(sed -n 's/.*"cuda_visible_devices": "\([^"]*\)".*/\1/p' <<<"$logs" | tail -1)"
    DETAIL="Ray GPU job SUCCEEDED; CUDA Driver API cuInit=0, device_count>=1, CUDA_VISIBLE_DEVICES=${visible:-set}"
  else
    grep -q 'CPU_RAY_PROBE=' <<<"$logs" || { echo "$logs"; return 1; }
    DETAIL="Ray CPU job SUCCEEDED; remote CPU task result confirmed"
  fi
}

test_tensorboard_cycle() {
  if ! kubectl -n "$TEST_NAMESPACE" get pvc tb-volume >/dev/null 2>&1; then
    kubectl -n "$TEST_NAMESPACE" apply -f - <<EOF || return
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: tb-volume
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 128Mi
EOF
    TB_PVC_CREATED=true
  fi
  kubectl -n "$TEST_NAMESPACE" apply -f - <<EOF || return
apiVersion: tensorboard.kubeflow.org/v1alpha1
kind: Tensorboard
metadata:
  name: ${K8S_PREFIX}-tb
spec:
  logspath: /tmp/fedit-vfy-empty-logs
EOF
  # The TensorBoard controller reconciles the CR asynchronously.  `kubectl
  # wait deployment/...` returns NotFound immediately if it races the first
  # reconciliation, which used to be incorrectly recorded as a successful
  # accepted request.  Wait for the generated Deployment to exist first, then
  # require it to become Available and finally check the real HTTP UI below.
  local deployment_ready=false wait_attempts wait_sleep_seconds
  wait_attempts=$((TEST_ACTION_TIMEOUT_SECONDS / 2))
  ((wait_attempts > 0)) || wait_attempts=1
  for _ in $(seq 1 "$wait_attempts"); do
    if kubectl -n "$TEST_NAMESPACE" get "deployment/${K8S_PREFIX}-tb" >/dev/null 2>&1; then
      deployment_ready=true
      break
    fi
    sleep 2
  done
  [[ "$deployment_ready" == true ]] || {
    echo "TensorBoard controller did not create deployment/${K8S_PREFIX}-tb within ${TEST_ACTION_TIMEOUT_SECONDS}s"
    return 1
  }
  kubectl -n "$TEST_NAMESPACE" wait --for=condition=Available "deployment/${K8S_PREFIX}-tb" \
    --timeout="${TEST_ACTION_TIMEOUT_SECONDS}s" || return
  kubectl -n "$TEST_NAMESPACE" get service "${K8S_PREFIX}-tb" >/dev/null || return
  local pod code attempt
  pod="$(kubectl -n "$TEST_NAMESPACE" get pods -l tensorboard-name="${K8S_PREFIX}-tb" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
  [[ -n "$pod" ]] || pod="$(kubectl -n "$TEST_NAMESPACE" get pods -o name | grep "${K8S_PREFIX}-tb" | head -1 | cut -d/ -f2)"
  [[ -n "$pod" ]] || { echo "TensorBoard pod missing"; return 1; }
  # The controller's Deployment Available condition can precede TensorBoard's
  # own initial data-server start by a few seconds on small-memory systems.
  # Confirm the actual HTTP UI with a bounded retry instead of treating that
  # harmless startup window as a functional failure.
  code=""
  for attempt in $(seq 1 30); do
    code="$(kubectl -n "$TEST_NAMESPACE" exec "$pod" -c tensorboard -- python -c \
      'import urllib.request; print(urllib.request.urlopen("http://127.0.0.1:6006/",timeout=5).status)' 2>/dev/null || true)"
    [[ "$code" == *200* ]] && break
    sleep 2
  done
  [[ "$code" == *200* ]] || { echo "TensorBoard localhost status=${code}"; return 1; }
  kubectl -n "$TEST_NAMESPACE" delete tensorboard "${K8S_PREFIX}-tb" --wait=false >/dev/null || return
  if [[ "$TB_PVC_CREATED" == true ]]; then
    kubectl -n "$TEST_NAMESPACE" delete pvc tb-volume --wait=false >/dev/null || return
    TB_PVC_CREATED=false
  fi
  DETAIL="Tensorboard CR/controller/deployment/service 생성, UI HTTP 200, 삭제 통과"
}

test_kserve_cycle() {
  kubectl -n "$TEST_NAMESPACE" apply -f - <<EOF || return
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: ${K8S_PREFIX}-isvc
  annotations:
    serving.kserve.io/deploymentMode: RawDeployment
spec:
  predictor:
    model:
      modelFormat:
        name: sklearn
      storageUri: gs://kfserving-examples/models/sklearn/1.0/model
      resources:
        requests:
          cpu: 100m
          memory: 256Mi
        limits:
          cpu: "1"
          memory: 1Gi
EOF
  kubectl -n "$TEST_NAMESPACE" wait --for=condition=Ready "inferenceservice/${K8S_PREFIX}-isvc" \
    --timeout="${TEST_ACTION_TIMEOUT_SECONDS}s" || return
  local service response
  service="$(kubectl -n "$TEST_NAMESPACE" get service -l "serving.kserve.io/inferenceservice=${K8S_PREFIX}-isvc" \
    -o jsonpath='{.items[0].metadata.name}')"
  [[ -n "$service" ]] || { echo "KServe service missing"; return 1; }
  # The tenant AuthorizationPolicy permits authenticated mesh workloads in the
  # same namespace.  Do not suppress Istio injection here: a sidecar-less Pod
  # is intentionally rejected by that policy and produces a false 403 failure.
  kubectl -n "$TEST_NAMESPACE" run "${PREFIX}-curl" --restart=Never --image=curlimages/curl:8.12.1 \
    --command -- sleep 900 >/dev/null || return
  kubectl -n "$TEST_NAMESPACE" wait --for=condition=Ready "pod/${PREFIX}-curl" --timeout=180s || return
  response="$(kubectl -n "$TEST_NAMESPACE" exec "${PREFIX}-curl" -c "${PREFIX}-curl" -- curl -fsS \
    -H 'Content-Type: application/json' -d '{"instances":[[6.8,2.8,4.8,1.4]]}' \
    "http://${service}/v1/models/${K8S_PREFIX}-isvc:predict")" || return
  jq -e '(.predictions | length) >= 1' <<<"$response" >/dev/null || { echo "$response"; return 1; }
  kubectl -n "$TEST_NAMESPACE" delete inferenceservice "${K8S_PREFIX}-isvc" --wait=false >/dev/null || return
  kubectl -n "$TEST_NAMESPACE" delete pod "${PREFIX}-curl" --wait=false >/dev/null || return
  DETAIL="KServe RawDeployment sklearn model Ready + v1 inference + 정리 통과"
}

test_automl_cycle() {
  DATA_SERVER_DIR="$(mktemp -d /tmp/fedit-vfy-automl.XXXXXX)"
  printf 'x1,x2,target\n' > "${DATA_SERVER_DIR}/data.csv"
  for n in $(seq 1 40); do printf '%s,%s,%s\n' "$n" "$((n + 1))" "$((2 * n + 1))" >> "${DATA_SERVER_DIR}/data.csv"; done
  local dataset_url request response status logs elapsed gpu_per_trial data_image pm_pod preflight_code attempt job_attempt
  # Do not use a host port for test data.  Ray workers run in Kubernetes and a
  # temporary in-cluster service works on hosts, nested test systems, CPU and
  # GPU installs alike without consuming a public TCP port.
  data_image="$(kubectl -n kubeflow get deployment prediction-manager \
    -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || true)"
  [[ -n "$data_image" ]] || { echo "Prediction Manager image not found"; return 1; }
  kubectl -n "$TEST_NAMESPACE" create configmap "${PREFIX}-data" \
    --from-file=data.csv="${DATA_SERVER_DIR}/data.csv" >/dev/null || return
  kubectl -n "$TEST_NAMESPACE" apply -f - <<EOF || return
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${PREFIX}-data
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${PREFIX}-data
  template:
    metadata:
      labels:
        app: ${PREFIX}-data
      # Prediction Manager itself is intentionally not mesh-injected.  This
      # disposable, cluster-internal CSV fixture mirrors an ordinary HTTP
      # dataset endpoint without introducing an unauthenticated mesh hop.
      annotations:
        sidecar.istio.io/inject: "false"
    spec:
      containers:
      - name: data
        image: ${data_image}
        command: ["python", "-m", "http.server", "8080", "--bind", "0.0.0.0", "--directory", "/data"]
        ports:
        - containerPort: 8080
        # Deployment Available must mean that the HTTP server, not merely the
        # Python process, is accepting the AutoML preflight request.
        readinessProbe:
          tcpSocket:
            port: 8080
          initialDelaySeconds: 1
          periodSeconds: 1
          failureThreshold: 20
        volumeMounts:
        - name: data
          mountPath: /data
          readOnly: true
      volumes:
      - name: data
        configMap:
          name: ${PREFIX}-data
---
apiVersion: v1
kind: Service
metadata:
  name: ${PREFIX}-data
spec:
  selector:
    app: ${PREFIX}-data
  ports:
  - port: 8080
    targetPort: 8080
EOF
  kubectl -n "$TEST_NAMESPACE" wait --for=condition=Available "deployment/${PREFIX}-data" --timeout=120s || return
  dataset_url="http://${PREFIX}-data.${TEST_NAMESPACE}.svc.cluster.local:8080/data.csv"
  # Endpoint publication through kube-proxy can lag the Deployment readiness
  # transition briefly.  Warm and verify the precise path from the API Pod;
  # this is the same network path used by AutoML's URL validator.
  pm_pod="$(kubectl -n kubeflow get pods -l app=prediction-manager \
    -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
  [[ -n "$pm_pod" ]] || { echo "Prediction Manager pod missing"; return 1; }
  preflight_code=""
  for attempt in $(seq 1 15); do
    preflight_code="$(kubectl -n kubeflow exec "$pm_pod" -- curl -sS --connect-timeout 3 --max-time 5 \
      -o /dev/null -w '%{http_code}' "$dataset_url" 2>/dev/null || true)"
    [[ "$preflight_code" == "200" ]] && break
    sleep 2
  done
  [[ "$preflight_code" == "200" ]] || { echo "AutoML data preflight HTTP ${preflight_code:-unreachable}"; return 1; }
  if [[ "$VERIFY_PROFILE" == "gpu" ]]; then gpu_per_trial=0.25; else gpu_per_trial=0; fi
  request="$(jq -nc --arg name "${PREFIX}-automl" --arg path "$dataset_url" --argjson gpu "$gpu_per_trial" \
    '{name:$name,task:"regression",dataset_path:$path,target_column:"target",models:["rf"],num_trials:1,timeout_minutes:10,metric:"rmse",test_size:0.2,random_state:42,cpu_per_trial:0.25,gpu_per_trial:$gpu,memory_per_trial_gb:0.5,top_n:1}')"
  # Ray's supervisor can be replaced once while a recently recovered head Pod
  # reconciles its previous sandbox.  Only that explicit system error receives
  # one clean resubmission; model, data, quota and API failures still fail at
  # the first occurrence.
  status=""
  for job_attempt in 1 2; do
    response=""
    for attempt in $(seq 1 5); do
      response="$(curl -sS --connect-timeout 5 --max-time 20 -H 'Content-Type: application/json' -d "$request" "${PM_URL}/api/automl/jobs")" || return
      jq -e '.job_id and (.status == "QUEUED" or .status == "PENDING")' <<<"$response" >/dev/null && break
      # A just-created ClusterIP can be visible to the API Pod a moment before
      # its first client-side connection succeeds.  Retry only that transient
      # condition; validation and quota errors remain immediate failures.
      [[ "$response" == *'오류 유형: ConnectError'* ]] || break
      sleep 2
    done
    jq -e '.job_id and (.status == "QUEUED" or .status == "PENDING")' <<<"$response" >/dev/null || {
      echo "AutoML submit rejected: ${response}"
      return 1
    }
    AUTOML_JOB_ID="$(jq -r '.job_id' <<<"$response")"
    elapsed=0
    while ((elapsed < TEST_ACTION_TIMEOUT_SECONDS)); do
      response="$(curl -fsS "${PM_URL}/api/automl/jobs/${AUTOML_JOB_ID}")" || return
      status="$(jq -r '.status' <<<"$response")"
      [[ "$status" =~ ^(SUCCEEDED|FAILED|CANCELLED|STOPPED)$ ]] && break
      sleep 5
      elapsed=$((elapsed + 5))
    done
    [[ "$status" != "FAILED" ]] && break
    logs="$(curl -fsS "${PM_URL}/api/automl/jobs/${AUTOML_JOB_ID}/logs" 2>/dev/null || true)"
    if (( job_attempt < 2 )) && [[ "${response} ${logs}" == *'JOB_SUPERVISOR_ACTOR_DIED'* || "${response} ${logs}" == *'connection error code 2'* ]]; then
      echo "AutoML Ray supervisor transient failure; deleting and retrying once"
      curl -fsS -X DELETE "${PM_URL}/api/automl/jobs/${AUTOML_JOB_ID}" | jq -e '.deleted == true' >/dev/null || return
      AUTOML_JOB_ID=""
      sleep 5
      continue
    fi
    break
  done
  if [[ ! "$status" =~ ^(SUCCEEDED|FAILED|CANCELLED|STOPPED)$ ]]; then
    echo "AutoML did not finish within ${TEST_ACTION_TIMEOUT_SECONDS}s (last status=${status:-unknown})"
    return 1
  fi
  if [[ "$status" != "SUCCEEDED" ]]; then
    logs="$(curl -fsS "${PM_URL}/api/automl/jobs/${AUTOML_JOB_ID}/logs" 2>/dev/null || true)"
    echo "AutoML status=${status} response=${response} logs=${logs}"
    return 1
  fi
  jq -e '.best_run != null' <<<"$response" >/dev/null || { echo "$response"; return 1; }
  AUTOML_MLFLOW_EXPERIMENT="$(jq -r '.experiment_name' <<<"$response")"
  curl -fsS -X DELETE "${PM_URL}/api/automl/jobs/${AUTOML_JOB_ID}" | jq -e '.deleted == true' >/dev/null || return
  AUTOML_JOB_ID=""
  DETAIL="${VERIFY_PROFILE^^} AutoML RF trial SUCCEEDED; best_run 생성; Job 삭제 통과"
}

test_monitoring() {
  local ready up gpu samples physical prometheus_url cluster_ip
  prometheus_url="$PROMETHEUS_URL"
  ready="$(curl -sS --connect-timeout 3 --max-time 10 -o /dev/null -w '%{http_code}' "${prometheus_url}/-/ready" || true)"
  if [[ "$ready" != "200" ]]; then
    # A bootstrapping host can finish the services before its retained local
    # port-forward is available.  The ClusterIP path is internal to Kubernetes
    # and avoids opening or relying on any additional public port.
    cluster_ip="$(kubectl -n monitoring get service kube-prometheus-stack-prometheus \
      -o jsonpath='{.spec.clusterIP}' 2>/dev/null || true)"
    [[ -n "$cluster_ip" ]] || { echo "Prometheus service ClusterIP missing"; return 1; }
    prometheus_url="http://${cluster_ip}:9090"
    ready="$(curl -sS --connect-timeout 3 --max-time 10 -o /dev/null -w '%{http_code}' "${prometheus_url}/-/ready" || true)"
  fi
  [[ "$ready" == "200" ]] || { echo "Prometheus ready HTTP ${ready}"; return 1; }
  up="$(curl -fsSG --connect-timeout 3 --max-time 15 "${prometheus_url}/api/v1/query" --data-urlencode 'query=sum(up)')" || return
  jq -e '.status == "success" and (.data.result | length) > 0' <<<"$up" >/dev/null || return
  if [[ "$VERIFY_PROFILE" == "gpu" ]]; then
    gpu="$(curl -fsSG --connect-timeout 3 --max-time 15 "${prometheus_url}/api/v1/query" --data-urlencode 'query=count(DCGM_FI_DEV_GPU_UTIL)')" || return
    samples="$(jq -r '.data.result[0].value[1] // "0"' <<<"$gpu")"
    physical="$(nvidia-smi --query-gpu=index --format=csv,noheader | wc -l | tr -d ' ')"
    awk -v n="$samples" -v p="$physical" 'BEGIN {exit !(n >= p)}' || { echo "DCGM samples=${samples}, physical=${physical}"; return 1; }
  fi
  curl -fsS --connect-timeout 5 --max-time 35 "${PM_URL}/api/monitoring/summary" | jq -e '.namespace == "kubeflow-user-example-com"' >/dev/null || return
  if [[ "$VERIFY_PROFILE" == "gpu" ]]; then
    DETAIL="Prometheus ready/PromQL 정상; DCGM GPU metric series=${samples}; PM monitoring API 정상"
  else
    DETAIL="Prometheus ready/PromQL 정상; CPU profile monitoring API 정상"
  fi
}

run_test "${VERIFY_PROFILE^^} compute profile" test_compute_profile
run_test "FeDiT·Prediction Manager 기본 화면/API" test_frontend_and_core_api
run_test "Dataset upload/profile/download/delete" test_dataset_cycle
run_test "REST data collection" test_rest_collection_cycle
run_test "PVC write/read/delete" test_pvc_cycle
run_test "NiFi flow" test_nifi_cycle
run_test "Label Studio project" test_label_studio_cycle
run_test "Kubeflow Pipelines" test_kfp_cycle
run_test "MLflow experiment/run/model registry" test_mlflow_cycle
run_test "Ray ${VERIFY_PROFILE^^} job" test_ray_job
run_test "TensorBoard" test_tensorboard_cycle
run_test "KServe endpoint/inference" test_kserve_cycle
run_test "AutoML ${VERIFY_PROFILE^^} trial" test_automl_cycle
run_test "MLOps Prometheus${VERIFY_PROFILE:+/}${VERIFY_PROFILE^^}" test_monitoring

cat >> "$REPORT" <<EOF

## 결과

- PASS: ${PASS_COUNT}
- FAIL: ${FAIL_COUNT}
- 판정: $([[ "$FAIL_COUNT" -eq 0 ]] && echo '**통과**' || echo '**실패**')
- 상세 로그: ${LOG_DIR}
EOF

printf '\n보고서: %s\nPASS=%s FAIL=%s\n' "$REPORT" "$PASS_COUNT" "$FAIL_COUNT"
[[ "$FAIL_COUNT" -eq 0 ]]
