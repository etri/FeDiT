#!/usr/bin/env bash
set -uo pipefail

# Functional verification for guide.txt section 2.2.9.
# Run this after bootstrap-verification.sh on the Ubuntu host/container that
# owns /etc/kubernetes/admin.conf. Test objects use a codex-229-* prefix and
# are removed before the script exits.

export KUBECONFIG="${KUBECONFIG:-/etc/kubernetes/admin.conf}"
PM_URL="${PM_URL:-http://127.0.0.1:18000}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:18080}"
MLFLOW_URL="${MLFLOW_URL:-http://127.0.0.1:15000}"
NIFI_URL="${NIFI_URL:-http://127.0.0.1:15001}"
RAY_URL="${RAY_URL:-http://127.0.0.1:15002}"
LABEL_STUDIO_URL="${LABEL_STUDIO_URL:-http://127.0.0.1:15003}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://127.0.0.1:19090}"
TEST_NAMESPACE="${TEST_NAMESPACE:-kubeflow-user-example-com}"
TEST_USER="${TEST_USER:-user@example.com}"
STAMP="$(date +%Y%m%d-%H%M%S)"
PREFIX="codex-229-${STAMP,,}"
K8S_PREFIX="c229-$(date +%H%M%S)"
RESULT_ROOT="${RESULT_ROOT:-/opt/prediction-manager-verification/functional-2.2.9/${STAMP}}"
REPORT="${RESULT_ROOT}/verification-report-2.2.9-gpu.md"
LOG_DIR="${RESULT_ROOT}/logs"
mkdir -p "$LOG_DIR"

PASS_COUNT=0
FAIL_COUNT=0
DETAIL=""
KFP_PF_PID=""
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
  [[ -n "$KFP_PF_PID" ]] && kill "$KFP_PF_PID" >/dev/null 2>&1
  [[ -n "$DATA_SERVER_PID" ]] && kill "$DATA_SERVER_PID" >/dev/null 2>&1
  [[ -n "$DATA_SERVER_DIR" ]] && find "$DATA_SERVER_DIR" -depth -mindepth 1 -delete >/dev/null 2>&1
  [[ -n "$DATA_SERVER_DIR" ]] && rmdir "$DATA_SERVER_DIR" >/dev/null 2>&1
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
      "http://127.0.0.1:18888/apis/v2beta1/experiments/${KFP_EXPERIMENT_ID}" >/dev/null 2>&1
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
# Prediction Manager guide.txt 2.2.9 GPU 기능 검증

- 실행 시각: $(date '+%Y-%m-%d %H:%M:%S %Z')
- 대상 namespace: ${TEST_NAMESPACE}
- 시험 prefix: ${PREFIX}
- 정책: 기존 NVIDIA 드라이버 재사용, 드라이버 패키지 설치 금지

| 상태 | 기능 | 증거 |
|---|---|---|
EOF

test_gpu_stack() {
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
  nested_count="$(docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu22.04 \
    nvidia-smi --query-gpu=index --format=csv,noheader | wc -l | tr -d ' ')" || return
  [[ "$nested_count" == "$physical" ]] || { echo "nested Docker GPU=${nested_count}, physical=${physical}"; return 1; }
  model="$(nvidia-smi --query-gpu=name --format=csv,noheader | sort -u | paste -sd/ -)"
  driver="$(nvidia-smi --query-gpu=driver_version --format=csv,noheader | head -1)"
  vram_gib="$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | sort -n | head -1 | awk '{printf "%.0f", $1/1024}')"
  DETAIL="${physical}×${model}, min VRAM ${vram_gib} GiB, driver ${driver}, auto slots/GPU=${slices}, allocatable=${allocatable}; target driver package=0"
}

test_frontend_and_core_api() {
  local code title user
  code="$(curl -sS -o /tmp/codex-229-frontend.html -w '%{http_code}' "${FRONTEND_URL}/fedit/predictor-creator-tool")" || return
  [[ "$code" == "200" ]] || { echo "frontend HTTP ${code}"; return 1; }
  grep -qi '<title>' /tmp/codex-229-frontend.html || { echo "frontend HTML title missing"; return 1; }
  curl -fsS "${PM_URL}/healthz" | jq -e '.status == "ok"' >/dev/null || return
  user="$(curl -fsS "${PM_URL}/api/user-info")" || return
  jq -e --arg email "$TEST_USER" '.email == $email and .namespace == "kubeflow-user-example-com"' <<<"$user" >/dev/null || return
  local expected_physical expected_model
  expected_physical="$(nvidia-smi --query-gpu=index --format=csv,noheader | wc -l | tr -d ' ')"
  expected_model="$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1 | xargs)"
  curl -fsS "${PM_URL}/api/dashboard/summary" | jq -e \
    --argjson count "$expected_physical" --arg model "$expected_model" \
    '.my_resource.namespace == "kubeflow-user-example-com" and .image_count >= 5 and .gpu_hardware.model == $model and .gpu_hardware.physical_count == $count' \
    >/dev/null || return
  title="$(sed -n 's:.*<title>\(.*\)</title>.*:\1:p' /tmp/codex-229-frontend.html | head -1)"
  DETAIL="FeDiT predictor page HTTP 200 (${title:-HTML}); Prediction Manager health/user/dashboard API 정상"
}

test_dataset_cycle() {
  local name create dataset_id upload version token profile download code
  name="${PREFIX}-dataset"
  create="$(curl -fsS -H 'Content-Type: application/json' -d \
    "{\"name\":\"${name}\",\"description\":\"2.2.9 functional test\",\"data_type\":\"csv\",\"task\":\"regression\",\"target_column\":\"target\"}" \
    "${PM_URL}/api/datasets")" || return
  dataset_id="$(jq -r '.id' <<<"$create")"
  TEST_DATASET_ID="$dataset_id"
  printf 'x1,x2,target\n1,2,3\n2,3,5\n3,4,7\n4,5,9\n' > /tmp/codex-229-dataset.csv
  upload="$(curl -fsS -X POST -H 'Content-Type: text/csv' -H 'x-dataset-filename: codex-229.csv' \
    --data-binary @/tmp/codex-229-dataset.csv "${PM_URL}/api/datasets/${dataset_id}/versions")" || return
  version="$(jq -r '.version' <<<"$upload")"
  token="$(jq -r '.download_token' <<<"$upload")"
  profile="$(curl -fsS "${PM_URL}/api/datasets/${dataset_id}/versions/${version}/profile")" || return
  jq -e '.row_count == 4 and .column_count == 3 and .target_column == "target"' <<<"$profile" >/dev/null || return
  download="/tmp/codex-229-download.csv"
  curl -fsS "${PM_URL}/api/datasets/${dataset_id}/versions/${version}/download?token=${token}" -o "$download" || return
  cmp -s /tmp/codex-229-dataset.csv "$download" || { echo "download differs"; return 1; }
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
spec:
  restartPolicy: Never
  containers:
  - name: probe
    image: busybox:1.36
    command: [sh, -c, 'echo codex-229-pvc-ok > /data/probe.txt; sleep 900']
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: ${PREFIX}-pvc
EOF
  kubectl -n "$TEST_NAMESPACE" wait --for=condition=Ready "pod/${PREFIX}-pvc" --timeout=180s || return
  [[ "$(kubectl -n "$TEST_NAMESPACE" exec "${PREFIX}-pvc" -- cat /data/probe.txt)" == "codex-229-pvc-ok" ]] || return 1
  kubectl -n "$TEST_NAMESPACE" delete pod "${PREFIX}-pvc" --wait=true >/dev/null || return
  kubectl -n "$TEST_NAMESPACE" delete pvc "${PREFIX}-pvc" --wait=true >/dev/null || return
  DETAIL="local-path PVC bind/write/read/delete 통과"
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
  kubectl -n kubeflow port-forward svc/ml-pipeline 18888:8888 >"${LOG_DIR}/kfp-port-forward.log" 2>&1 &
  KFP_PF_PID=$!
  for _ in $(seq 1 30); do curl -fsS -H "kubeflow-userid: ${TEST_USER}" \
    http://127.0.0.1:18888/apis/v2beta1/healthz >/dev/null && break; sleep 1; done
  local health experiment listed code
  health="$(curl -fsS -H "kubeflow-userid: ${TEST_USER}" http://127.0.0.1:18888/apis/v2beta1/healthz)" || return
  jq -e '.tag_name == "2.3.0" and .multi_user == true' <<<"$health" >/dev/null || return
  experiment="$(curl -fsS -H "kubeflow-userid: ${TEST_USER}" -H 'Content-Type: application/json' -d \
    "{\"display_name\":\"${PREFIX}-kfp\",\"namespace\":\"${TEST_NAMESPACE}\"}" \
    http://127.0.0.1:18888/apis/v2beta1/experiments)" || return
  KFP_EXPERIMENT_ID="$(jq -r '.experiment_id' <<<"$experiment")"
  listed="$(curl -fsS -H "kubeflow-userid: ${TEST_USER}" \
    "http://127.0.0.1:18888/apis/v2beta1/experiments?namespace=${TEST_NAMESPACE}")" || return
  jq -e --arg id "$KFP_EXPERIMENT_ID" '.experiments[] | select(.experiment_id == $id)' <<<"$listed" >/dev/null || return
  code="$(curl -sS -o /dev/null -w '%{http_code}' -X DELETE -H "kubeflow-userid: ${TEST_USER}" \
    "http://127.0.0.1:18888/apis/v2beta1/experiments/${KFP_EXPERIMENT_ID}")"
  [[ "$code" =~ ^20[0-9]$ ]] || { echo "KFP delete HTTP ${code}"; return 1; }
  KFP_EXPERIMENT_ID=""
  DETAIL="KFP 2.3.0 multi-user health + experiment 생성/목록/삭제 통과"
}

test_mlflow_cycle() {
  local name experiment run metric
  name="${PREFIX}-mlflow"
  experiment="$(curl -fsS -H 'Content-Type: application/json' -d "{\"name\":\"${name}\"}" \
    "${MLFLOW_URL}/api/2.0/mlflow/experiments/create")" || return
  MLFLOW_EXPERIMENT_ID="$(jq -r '.experiment_id' <<<"$experiment")"
  run="$(curl -fsS -H 'Content-Type: application/json' -d \
    "{\"experiment_id\":\"${MLFLOW_EXPERIMENT_ID}\",\"run_name\":\"codex-229-run\"}" \
    "${MLFLOW_URL}/api/2.0/mlflow/runs/create")" || return
  MLFLOW_RUN_ID="$(jq -r '.run.info.run_id' <<<"$run")"
  curl -fsS -H 'Content-Type: application/json' -d \
    "{\"run_id\":\"${MLFLOW_RUN_ID}\",\"key\":\"accuracy\",\"value\":0.99,\"timestamp\":$(date +%s000),\"step\":1}" \
    "${MLFLOW_URL}/api/2.0/mlflow/runs/log-metric" >/dev/null || return
  metric="$(curl -fsS "${MLFLOW_URL}/api/2.0/mlflow/runs/get?run_id=${MLFLOW_RUN_ID}")" || return
  jq -e '.run.data.metrics[] | select(.key == "accuracy" and .value == 0.99)' <<<"$metric" >/dev/null || return
  MLFLOW_MODEL_NAME="${name}-model"
  curl -fsS -H 'Content-Type: application/json' -d "{\"name\":\"${MLFLOW_MODEL_NAME}\"}" \
    "${MLFLOW_URL}/api/2.0/mlflow/registered-models/create" \
    | jq -e --arg name "$MLFLOW_MODEL_NAME" '.registered_model.name == $name' >/dev/null || return
  curl -fsS -X DELETE -H 'Content-Type: application/json' -d "{\"name\":\"${MLFLOW_MODEL_NAME}\"}" \
    "${MLFLOW_URL}/api/2.0/mlflow/registered-models/delete" >/dev/null || return
  MLFLOW_MODEL_NAME=""
  curl -fsS -H 'Content-Type: application/json' -d \
    "{\"run_id\":\"${MLFLOW_RUN_ID}\",\"status\":\"FINISHED\",\"end_time\":$(date +%s000)}" \
    "${MLFLOW_URL}/api/2.0/mlflow/runs/update" >/dev/null || return
  curl -fsS -H 'Content-Type: application/json' -d "{\"experiment_id\":\"${MLFLOW_EXPERIMENT_ID}\"}" \
    "${MLFLOW_URL}/api/2.0/mlflow/experiments/delete" >/dev/null || return
  MLFLOW_EXPERIMENT_ID=""
  DETAIL="MLflow experiment/run/metric(accuracy=0.99) + Model Registry 생성/삭제 통과"
}

test_ray_gpu_job() {
  local submission code encoded entrypoint payload status logs visible
  submission="${PREFIX}-ray-gpu"
  code=$'import ctypes,json,os,ray\nray.init(address="auto")\n@ray.remote(num_gpus=1)\ndef probe():\n    lib=ctypes.CDLL("libcuda.so.1")\n    rc=lib.cuInit(0)\n    count=ctypes.c_int()\n    rc2=lib.cuDeviceGetCount(ctypes.byref(count))\n    return {"cuda_visible_devices":os.environ.get("CUDA_VISIBLE_DEVICES"),"cuInit":rc,"cuDeviceGetCount":rc2,"device_count":count.value}\nprint("CUDA_PROBE="+json.dumps(ray.get(probe.remote()),sort_keys=True))'
  encoded="$(printf '%s' "$code" | base64 -w0)"
  entrypoint="python -c \"import base64;exec(base64.b64decode('${encoded}'))\""
  payload="$(jq -nc --arg id "$submission" --arg entry "$entrypoint" '{submission_id:$id,entrypoint:$entry}')"
  curl -fsS -H 'Content-Type: application/json' -d "$payload" "${RAY_URL}/api/jobs/" >/dev/null || return
  status=""
  for _ in $(seq 1 90); do
    status="$(curl -fsS "${RAY_URL}/api/jobs/${submission}" | jq -r '.status')" || return
    [[ "$status" =~ ^(SUCCEEDED|FAILED|STOPPED)$ ]] && break
    sleep 5
  done
  [[ "$status" == "SUCCEEDED" ]] || { curl -fsS "${RAY_URL}/api/jobs/${submission}/logs"; echo "Ray status=${status}"; return 1; }
  logs="$(curl -fsS "${RAY_URL}/api/jobs/${submission}/logs" | jq -r '.logs')" || return
  grep -q 'CUDA_PROBE=' <<<"$logs" || { echo "$logs"; return 1; }
  grep -q '"cuInit": 0' <<<"$logs" || { echo "$logs"; return 1; }
  grep -Eq '"device_count": [1-9]' <<<"$logs" || { echo "$logs"; return 1; }
  visible="$(sed -n 's/.*"cuda_visible_devices": "\([^"]*\)".*/\1/p' <<<"$logs" | tail -1)"
  DETAIL="Ray Job SUCCEEDED; GPU worker CUDA Driver API cuInit=0, device_count>=1, CUDA_VISIBLE_DEVICES=${visible:-set}"
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
  logspath: /tmp/codex-229-empty-logs
EOF
  kubectl -n "$TEST_NAMESPACE" wait --for=condition=Available "deployment/${K8S_PREFIX}-tb" --timeout=300s || return
  kubectl -n "$TEST_NAMESPACE" get service "${K8S_PREFIX}-tb" >/dev/null || return
  local pod code
  pod="$(kubectl -n "$TEST_NAMESPACE" get pods -l tensorboard-name="${K8S_PREFIX}-tb" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
  [[ -n "$pod" ]] || pod="$(kubectl -n "$TEST_NAMESPACE" get pods -o name | grep "${K8S_PREFIX}-tb" | head -1 | cut -d/ -f2)"
  [[ -n "$pod" ]] || { echo "TensorBoard pod missing"; return 1; }
  code="$(kubectl -n "$TEST_NAMESPACE" exec "$pod" -c tensorboard -- python -c \
    'import urllib.request; print(urllib.request.urlopen("http://127.0.0.1:6006/",timeout=5).status)' 2>/dev/null || true)"
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
  kubectl -n "$TEST_NAMESPACE" wait --for=condition=Ready "inferenceservice/${K8S_PREFIX}-isvc" --timeout=600s || {
    kubectl -n "$TEST_NAMESPACE" describe inferenceservice "${K8S_PREFIX}-isvc"
    kubectl -n "$TEST_NAMESPACE" get pods -o wide
    return 1
  }
  local service response
  service="$(kubectl -n "$TEST_NAMESPACE" get service -l "serving.kserve.io/inferenceservice=${K8S_PREFIX}-isvc" \
    -o jsonpath='{.items[0].metadata.name}')"
  [[ -n "$service" ]] || { echo "KServe service missing"; return 1; }
  kubectl -n "$TEST_NAMESPACE" run "${PREFIX}-curl" --restart=Never --image=curlimages/curl:8.12.1 \
    --command -- sleep 900 >/dev/null || return
  kubectl -n "$TEST_NAMESPACE" wait --for=condition=Ready "pod/${PREFIX}-curl" --timeout=180s || return
  response="$(kubectl -n "$TEST_NAMESPACE" exec "${PREFIX}-curl" -- curl -fsS \
    -H 'Content-Type: application/json' -d '{"instances":[[6.8,2.8,4.8,1.4]]}' \
    "http://${service}/v1/models/${K8S_PREFIX}-isvc:predict")" || return
  jq -e '(.predictions | length) >= 1' <<<"$response" >/dev/null || { echo "$response"; return 1; }
  kubectl -n "$TEST_NAMESPACE" delete inferenceservice "${K8S_PREFIX}-isvc" --wait=false >/dev/null || return
  kubectl -n "$TEST_NAMESPACE" delete pod "${PREFIX}-curl" --wait=false >/dev/null || return
  DETAIL="KServe RawDeployment sklearn model Ready + v1 inference + 정리 통과"
}

test_automl_gpu_cycle() {
  DATA_SERVER_DIR="$(mktemp -d /tmp/codex-229-automl.XXXXXX)"
  printf 'x1,x2,target\n' > "${DATA_SERVER_DIR}/data.csv"
  for n in $(seq 1 40); do printf '%s,%s,%s\n' "$n" "$((n + 1))" "$((2 * n + 1))" >> "${DATA_SERVER_DIR}/data.csv"; done
  local dataset_url request response status logs node_ip data_port
  node_ip="$(kubectl get node -o json | jq -r '.items[0].status.addresses[] | select(.type == "InternalIP") | .address' | head -1)"
  [[ -n "$node_ip" ]] || { echo "node InternalIP missing"; return 1; }
  data_port=18088
  while ss -ltn | awk '{print $4}' | grep -qE "[:.]${data_port}$"; do data_port=$((data_port + 1)); done
  python3 -m http.server "$data_port" --bind 0.0.0.0 --directory "$DATA_SERVER_DIR" >"${LOG_DIR}/automl-data-server.log" 2>&1 &
  DATA_SERVER_PID=$!
  for _ in $(seq 1 20); do curl -fsS "http://127.0.0.1:${data_port}/data.csv" >/dev/null && break; sleep 1; done
  dataset_url="http://${node_ip}:${data_port}/data.csv"
  request="$(jq -nc --arg name "${PREFIX}-automl" --arg path "$dataset_url" \
    '{name:$name,task:"regression",dataset_path:$path,target_column:"target",models:["rf"],num_trials:1,timeout_minutes:10,metric:"rmse",test_size:0.2,random_state:42,cpu_per_trial:0.25,gpu_per_trial:0.25,memory_per_trial_gb:0.5,top_n:1}')"
  response="$(curl -sS -H 'Content-Type: application/json' -d "$request" "${PM_URL}/api/automl/jobs")" || return
  jq -e '.job_id and (.status == "QUEUED" or .status == "PENDING")' <<<"$response" >/dev/null || {
    echo "AutoML submit rejected: ${response}"
    return 1
  }
  AUTOML_JOB_ID="$(jq -r '.job_id' <<<"$response")"
  status=""
  for _ in $(seq 1 120); do
    response="$(curl -fsS "${PM_URL}/api/automl/jobs/${AUTOML_JOB_ID}")" || return
    status="$(jq -r '.status' <<<"$response")"
    [[ "$status" =~ ^(SUCCEEDED|FAILED|CANCELLED|STOPPED)$ ]] && break
    sleep 5
  done
  if [[ "$status" != "SUCCEEDED" ]]; then
    logs="$(curl -fsS "${PM_URL}/api/automl/jobs/${AUTOML_JOB_ID}/logs" 2>/dev/null || true)"
    echo "AutoML status=${status} response=${response} logs=${logs}"
    return 1
  fi
  jq -e '.best_run != null' <<<"$response" >/dev/null || { echo "$response"; return 1; }
  AUTOML_MLFLOW_EXPERIMENT="$(jq -r '.experiment_name' <<<"$response")"
  curl -fsS -X DELETE "${PM_URL}/api/automl/jobs/${AUTOML_JOB_ID}" | jq -e '.deleted == true' >/dev/null || return
  AUTOML_JOB_ID=""
  DETAIL="GPU quota 0.25 AutoML RF trial SUCCEEDED; best_run 생성; Job 삭제 통과"
}

test_monitoring() {
  local ready up gpu samples physical
  ready="$(curl -sS -o /dev/null -w '%{http_code}' "${PROMETHEUS_URL}/-/ready")" || return
  [[ "$ready" == "200" ]] || { echo "Prometheus ready HTTP ${ready}"; return 1; }
  up="$(curl -fsSG "${PROMETHEUS_URL}/api/v1/query" --data-urlencode 'query=sum(up)')" || return
  jq -e '.status == "success" and (.data.result | length) > 0' <<<"$up" >/dev/null || return
  gpu="$(curl -fsSG "${PROMETHEUS_URL}/api/v1/query" --data-urlencode 'query=count(DCGM_FI_DEV_GPU_UTIL)')" || return
  samples="$(jq -r '.data.result[0].value[1] // "0"' <<<"$gpu")"
  physical="$(nvidia-smi --query-gpu=index --format=csv,noheader | wc -l | tr -d ' ')"
  awk -v n="$samples" -v p="$physical" 'BEGIN {exit !(n >= p)}' || { echo "DCGM samples=${samples}, physical=${physical}"; return 1; }
  curl -fsS "${PM_URL}/api/monitoring/summary" | jq -e '.namespace == "kubeflow-user-example-com"' >/dev/null || return
  DETAIL="Prometheus ready/PromQL 정상; DCGM GPU metric series=${samples}; PM monitoring API 정상"
}

run_test "GPU/Container Toolkit/Time-Slicing" test_gpu_stack
run_test "FeDiT·Prediction Manager 기본 화면/API" test_frontend_and_core_api
run_test "Dataset upload/profile/download/delete" test_dataset_cycle
run_test "REST data collection" test_rest_collection_cycle
run_test "PVC write/read/delete" test_pvc_cycle
run_test "NiFi flow" test_nifi_cycle
run_test "Label Studio project" test_label_studio_cycle
run_test "Kubeflow Pipelines" test_kfp_cycle
run_test "MLflow experiment/run/model registry" test_mlflow_cycle
run_test "Ray GPU job" test_ray_gpu_job
run_test "TensorBoard" test_tensorboard_cycle
run_test "KServe endpoint/inference" test_kserve_cycle
run_test "AutoML GPU trial" test_automl_gpu_cycle
run_test "MLOps Prometheus/DCGM" test_monitoring

cat >> "$REPORT" <<EOF

## 결과

- PASS: ${PASS_COUNT}
- FAIL: ${FAIL_COUNT}
- 판정: $([[ "$FAIL_COUNT" -eq 0 ]] && echo '**통과**' || echo '**실패**')
- 상세 로그: ${LOG_DIR}
EOF

printf '\n보고서: %s\nPASS=%s FAIL=%s\n' "$REPORT" "$PASS_COUNT" "$FAIL_COUNT"
[[ "$FAIL_COUNT" -eq 0 ]]
