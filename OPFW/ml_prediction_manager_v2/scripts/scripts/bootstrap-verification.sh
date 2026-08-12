#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

on_initialization_error() {
  local rc=$? line="${BASH_LINENO[0]:-unknown}"
  echo "[FAIL] 설치기 초기화 실패 (line ${line}, exit ${rc})" >&2
  echo "설정 파일과 FeDiT 소스 위치를 확인하세요." >&2
  exit "$rc"
}
trap on_initialization_error ERR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${VERIFY_INSTALL_CONFIG:-${PROJECT_ROOT}/.verification-install.env}"
DRY_RUN=false
RESUME=false
VALIDATE_ONLY=false
DEPENDENCIES_ONLY=false
CURRENT_STAGE="initialization"
FORWARD_PIDS=()
REPORT_FINISHED=false

usage() {
  cat <<'EOF'
사용법:
  ./install-verification.sh [옵션]

옵션:
  --config FILE  기본 .verification-install.env 대신 지정 파일 사용
  --dry-run      호스트를 변경하지 않고 소스와 설치 계획만 검증
  --resume       중단된 설치를 완료된 단계 이후부터 재개
  --validate-only 이미 설치된 환경의 최종 상태만 다시 검증
  --dependencies-only 서비스 실행 전 필수 모듈만 설치하고 종료
  -h, --help     도움말

기본 실행은 Ubuntu 22.04 단일 서버에 Kubernetes, Kubeflow 및 Prediction
Manager 전체 검수 환경을 구성합니다. 기존 Kubernetes 클러스터는 기본적으로
수정하지 않습니다.
EOF
}

args=("$@")
for ((i = 0; i < ${#args[@]}; i++)); do
  if [[ "${args[$i]}" == "--config" ]]; then
    ((i + 1 < ${#args[@]})) || { echo "--config 뒤에 파일 경로가 필요합니다." >&2; exit 2; }
    CONFIG_FILE="${args[$((i + 1))]}"
  fi
done
if [[ "$CONFIG_FILE" != /* ]]; then
  CONFIG_FILE="${PROJECT_ROOT}/${CONFIG_FILE}"
fi

if [[ -f "$CONFIG_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
  set +a
fi

: "${ALLOW_EXISTING_CLUSTER:=false}"
: "${ALLOW_UNSUPPORTED_HOST:=false}"
: "${FORCE_REINSTALL:=false}"
: "${AUTO_DETECT_SOURCE_PATHS:=true}"
: "${PREDICTION_MANAGER_ROOT:=auto}"
: "${PREDICTION_MANAGER_FRONTEND_ROOT:=auto}"
: "${INSTALL_FRONTEND:=false}"
: "${BUILD_FRONTEND_IMAGE:=false}"
: "${FRONTEND_IMAGE_TAG:=union-twin-fe:verification}"
: "${NODE_MAJOR_VERSION:=18}"
: "${PROJECTS_ONLY:=false}"
: "${BUILD_AUXILIARY_IMAGES:=true}"
: "${MIN_CPU_CORES:=4}"
: "${MIN_MEMORY_GIB:=28}"
: "${MIN_DISK_GIB:=200}"
: "${REQUIRE_NVIDIA_GPU:=true}"
: "${INSTALL_NVIDIA_TOOLKIT:=true}"
: "${NODE_IP:=auto}"
: "${POD_NETWORK_CIDR:=10.244.0.0/16}"
: "${SERVICE_CIDR:=10.96.0.0/12}"
: "${KUBEFLOW_NODE_PORT:=30080}"
: "${KEYCLOAK_NODE_PORT:=30081}"
: "${REGISTRY_PORT:=5000}"
: "${OPEN_HOST_FIREWALL_PORTS:=true}"
: "${KUBERNETES_VERSION:=1.30.14}"
: "${CALICO_VERSION:=v3.30.2}"
: "${LOCAL_PATH_PROVISIONER_VERSION:=v0.0.31}"
: "${METRICS_SERVER_VERSION:=v0.7.2}"
: "${KUSTOMIZE_VERSION:=v5.2.1}"
: "${HELM_VERSION:=v3.15.4}"
: "${KUBEFLOW_VERSION:=v1.9.1}"
: "${NVIDIA_DEVICE_PLUGIN_VERSION:=0.16.2}"
: "${KUBE_PROMETHEUS_STACK_VERSION:=61.7.1}"
: "${DCGM_EXPORTER_VERSION:=3.3.1}"
: "${GPU_TIME_SLICES:=auto}"
: "${GPU_TIME_SLICE_TARGET_VRAM_GIB:=12}"
: "${GPU_TIME_SLICES_MIN:=1}"
: "${GPU_TIME_SLICES_MAX:=8}"
: "${PM_TENANT_RAY_GPU_WORKER_MAX_REPLICAS:=auto}"
: "${AUTO_REBOOT_AFTER_DRIVER:=true}"
: "${VERIFY_DOCKER_GPU:=true}"
: "${VERIFICATION_ADMIN_EMAIL:=user@example.com}"
: "${VERIFICATION_ADMIN_PASSWORD:=auto}"
: "${KEYCLOAK_ADMIN_USER:=admin}"
: "${KEYCLOAK_ADMIN_PASSWORD:=auto}"
: "${POSTGRES_USER:=pm_admin}"
: "${POSTGRES_PASSWORD:=auto}"
: "${KEYCLOAK_DEX_CLIENT_SECRET:=auto}"
: "${PM_NIFI_INGEST_SECRET:=auto}"
: "${STORAGE_CLASS:=local-path}"
: "${REGISTRY_CONTAINER_NAME:=pm-verification-registry}"
: "${INSTALL_STATE_ROOT:=/opt/prediction-manager-verification}"
: "${REGISTRY_DATA_DIR:=${INSTALL_STATE_ROOT}/registry}"
: "${KUBEFLOW_MANIFESTS_DIR:=${INSTALL_STATE_ROOT}/kubeflow-manifests}"
: "${PM_IMAGE_TAG:=prediction-manager-app:verification}"
: "${MLFLOW_IMAGE_TAG:=mlflow-postgres:v3.11.1-pg}"
: "${RAY_IMAGE_TAG:=ray-mlflow:2.54.1}"
: "${NIFI_IMAGE_TAG:=prediction-manager-nifi-python:1.28.1-pm2}"
: "${LABEL_STUDIO_IMAGE_TAG:=label-studio:1.18.0}"
: "${RAY_BASE_IMAGE:=rayproject/ray:2.54.1-py312-gpu}"
: "${INSTALL_MONITORING:=true}"
: "${INSTALL_LABEL_STUDIO:=true}"
: "${PROVISION_DEFAULT_TENANT:=true}"
: "${ENABLE_DOCKER_SOCKET:=true}"
: "${WAIT_ALL_KUBEFLOW_WORKLOADS:=true}"
: "${LABEL_STUDIO_PUBLIC_URL:=auto}"
: "${PM_HEALTHCHECK_PORT:=18000}"
: "${PROMETHEUS_HEALTHCHECK_PORT:=19090}"
: "${CONTAINER_MODE:=auto}"
: "${PORTABLE_NETWORK_CONFIG:=true}"
: "${CONTAINER_DNS_SERVERS:=auto}"
: "${NEXT_START_SCRIPT:=02-start-prediction-manager.sh}"

if [[ "$CONTAINER_MODE" == "auto" ]]; then
  if [[ -f /.dockerenv ]] && [[ "$(ps -p 1 -o comm= 2>/dev/null || true)" != "systemd" ]]; then
    CONTAINER_MODE=true
  else
    CONTAINER_MODE=false
  fi
fi

canonicalize_path() {
  # GNU readlink -m also returns a useful absolute path when the target does
  # not exist, so validation can print the missing file instead of exiting
  # silently during initialization.
  readlink -m -- "$1"
}

if [[ "$PREDICTION_MANAGER_ROOT" == "auto" ]]; then
  PREDICTION_MANAGER_ROOT="${PROJECT_ROOT}/.."
fi
if [[ "$PREDICTION_MANAGER_FRONTEND_ROOT" == "auto" ]]; then
  PREDICTION_MANAGER_FRONTEND_ROOT="${PROJECT_ROOT}/../../ml_prediction_manager_v2_frontend"
fi
PREDICTION_MANAGER_ROOT="$(canonicalize_path "$PREDICTION_MANAGER_ROOT")"
if [[ -n "$PREDICTION_MANAGER_FRONTEND_ROOT" ]]; then
  PREDICTION_MANAGER_FRONTEND_ROOT="$(canonicalize_path "$PREDICTION_MANAGER_FRONTEND_ROOT")"
fi
export CONTAINER_MODE

for ((i = 0; i < ${#args[@]}; i++)); do
  case "${args[$i]}" in
    --config) i=$((i + 1)) ;;
    --dry-run) DRY_RUN=true ;;
    --resume) RESUME=true ;;
    --validate-only) VALIDATE_ONLY=true ;;
    --dependencies-only) DEPENDENCIES_ONLY=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "알 수 없는 옵션: ${args[$i]}" >&2; usage >&2; exit 2 ;;
  esac
done

bool_true() {
  case "${1,,}" in
    1|true|yes|on) return 0 ;;
    *) return 1 ;;
  esac
}

gpu_stack_enabled() {
  bool_true "$REQUIRE_NVIDIA_GPU" || bool_true "$INSTALL_NVIDIA_TOOLKIT"
}

detect_gpu_hardware() {
  GPU_PHYSICAL_COUNT=0
  GPU_MODEL=""
  GPU_DRIVER_VERSION=""
  GPU_VRAM_GIB=0
  GPU_EXPECTED_RESOURCES=0

  command -v nvidia-smi >/dev/null 2>&1 || return 1
  local line index model driver memory_mib
  local min_memory_mib=0
  local -a models=()
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    IFS=',' read -r index model driver memory_mib <<<"$line"
    index="$(xargs <<<"$index")"
    model="$(xargs <<<"$model")"
    driver="$(xargs <<<"$driver")"
    memory_mib="$(xargs <<<"$memory_mib")"
    [[ "$index" =~ ^[0-9]+$ && "$memory_mib" =~ ^[0-9]+$ ]] || continue
    GPU_PHYSICAL_COUNT=$((GPU_PHYSICAL_COUNT + 1))
    models+=("$model")
    GPU_DRIVER_VERSION="${GPU_DRIVER_VERSION:-$driver}"
    if ((min_memory_mib == 0 || memory_mib < min_memory_mib)); then
      min_memory_mib="$memory_mib"
    fi
  done < <(nvidia-smi --query-gpu=index,name,driver_version,memory.total --format=csv,noheader,nounits)
  ((GPU_PHYSICAL_COUNT > 0)) || return 1

  GPU_MODEL="$(printf '%s\n' "${models[@]}" | sort -u \
    | awk 'BEGIN {first=1} {if (!first) printf " / "; printf "%s", $0; first=0} END {print ""}')"
  GPU_VRAM_GIB=$(((min_memory_mib + 512) / 1024))

  [[ "$GPU_TIME_SLICES_MIN" =~ ^[0-9]+$ && "$GPU_TIME_SLICES_MAX" =~ ^[0-9]+$ ]] \
    && ((GPU_TIME_SLICES_MIN >= 1 && GPU_TIME_SLICES_MAX >= GPU_TIME_SLICES_MIN)) || {
      echo "GPU_TIME_SLICES_MIN/MAX 범위가 올바르지 않습니다." >&2
      return 1
    }

  if [[ "$GPU_TIME_SLICES" == "auto" ]]; then
    [[ "$GPU_TIME_SLICE_TARGET_VRAM_GIB" =~ ^[0-9]+$ ]] && ((GPU_TIME_SLICE_TARGET_VRAM_GIB > 0)) || {
      echo "GPU_TIME_SLICE_TARGET_VRAM_GIB는 1 이상의 정수여야 합니다." >&2
      return 1
    }
    # Use rounded GiB so a marketed 48 GiB device that reports slightly below
    # 49152 MiB does not unexpectedly fall from four slots to three.
    GPU_TIME_SLICES=$((GPU_VRAM_GIB / GPU_TIME_SLICE_TARGET_VRAM_GIB))
    ((GPU_TIME_SLICES < GPU_TIME_SLICES_MIN)) && GPU_TIME_SLICES="$GPU_TIME_SLICES_MIN"
    ((GPU_TIME_SLICES > GPU_TIME_SLICES_MAX)) && GPU_TIME_SLICES="$GPU_TIME_SLICES_MAX"
  fi
  [[ "$GPU_TIME_SLICES" =~ ^[0-9]+$ ]] && ((GPU_TIME_SLICES >= 1)) || {
    echo "GPU_TIME_SLICES는 auto 또는 1 이상의 정수여야 합니다." >&2
    return 1
  }
  GPU_EXPECTED_RESOURCES=$((GPU_PHYSICAL_COUNT * GPU_TIME_SLICES))

  if [[ "$PM_TENANT_RAY_GPU_WORKER_MAX_REPLICAS" == "auto" ]]; then
    # One concurrent GPU worker per physical device is the safe default. Users
    # can explicitly raise this to consume additional time-sliced slots.
    PM_TENANT_RAY_GPU_WORKER_MAX_REPLICAS="$GPU_PHYSICAL_COUNT"
  fi
  [[ "$PM_TENANT_RAY_GPU_WORKER_MAX_REPLICAS" =~ ^[0-9]+$ ]] || {
    echo "PM_TENANT_RAY_GPU_WORKER_MAX_REPLICAS는 auto 또는 0 이상의 정수여야 합니다." >&2
    return 1
  }
  export GPU_PHYSICAL_COUNT GPU_MODEL GPU_DRIVER_VERSION GPU_VRAM_GIB
  export GPU_TIME_SLICES GPU_EXPECTED_RESOURCES PM_TENANT_RAY_GPU_WORKER_MAX_REPLICAS
}

systemd_available() {
  command -v systemctl >/dev/null 2>&1 &&
    [[ "$(ps -p 1 -o comm= 2>/dev/null || true)" == "systemd" ]]
}

service_state_dir() {
  printf '%s\n' "${INSTALL_STATE_ROOT}/services"
}

start_container_daemon() {
  local name="$1" log_file="$2"
  shift 2
  local state_dir pid_file pid
  state_dir="$(service_state_dir)"
  mkdir -p "$state_dir"
  pid_file="${state_dir}/${name}.pid"
  if [[ -s "$pid_file" ]]; then
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" >/dev/null 2>&1; then
      return 0
    fi
  fi
  nohup bash -c 'umask 022; exec "$@"' _ "$@" >>"$log_file" 2>&1 &
  pid=$!
  printf '%s\n' "$pid" > "$pid_file"
  sleep 2
  kill -0 "$pid" >/dev/null 2>&1 || {
    tail -n 100 "$log_file" >&2 || true
    return 1
  }
}

start_container_kubelet() {
  local state_dir runner pid_file pid
  state_dir="$(service_state_dir)"
  mkdir -p "$state_dir"
  runner="${state_dir}/kubelet-runner.sh"
  pid_file="${state_dir}/kubelet.pid"
  if [[ -s "$pid_file" ]]; then
    pid="$(cat "$pid_file")"
    kill -0 "$pid" >/dev/null 2>&1 && return 0
  fi
  cat > "$runner" <<'EOF_KUBELET_RUNNER'
#!/usr/bin/env bash
set -u
umask 022
while true; do
  if [[ -s /var/lib/kubelet/config.yaml ]]; then
    KUBELET_KUBEADM_ARGS=""
    [[ -f /var/lib/kubelet/kubeadm-flags.env ]] && source /var/lib/kubelet/kubeadm-flags.env
    /usr/bin/kubelet \
      --bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf \
      --kubeconfig=/etc/kubernetes/kubelet.conf \
      --config=/var/lib/kubelet/config.yaml \
      --fail-swap-on=false \
      ${KUBELET_KUBEADM_ARGS:-} ${KUBELET_EXTRA_ARGS:-}
  else
    sleep 2
  fi
  sleep 3
done
EOF_KUBELET_RUNNER
  chmod 755 "$runner"
  nohup "$runner" >>"${state_dir}/kubelet.log" 2>&1 &
  pid=$!
  printf '%s\n' "$pid" > "$pid_file"
  sleep 2
  kill -0 "$pid" >/dev/null 2>&1
}

resolve_node_ip() {
  if [[ "$NODE_IP" != "auto" ]]; then
    printf '%s\n' "$NODE_IP"
    return
  fi
  local detected
  detected="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}')"
  if [[ -z "$detected" ]]; then
    detected="$(hostname -I 2>/dev/null | awk '{print $1}')"
  fi
  [[ -n "$detected" ]] || { echo "NODE_IP를 자동 탐지할 수 없습니다." >&2; return 1; }
  printf '%s\n' "$detected"
}

resolve_container_dns_servers() {
  if [[ "$CONTAINER_DNS_SERVERS" != "auto" ]]; then
    printf '%s\n' "$CONTAINER_DNS_SERVERS"
    return
  fi

  local resolv_file resolver detected=""
  for resolv_file in /etc/resolv.conf /run/systemd/resolve/resolv.conf; do
    [[ -r "$resolv_file" ]] || continue
    while read -r resolver; do
      case "$resolver" in
        ""|127.*|0.0.0.0|::1) continue ;;
      esac
      detected+="${detected:+ }${resolver}"
    done < <(awk '$1 == "nameserver" {print $2}' "$resolv_file")
  done

  # Docker commonly publishes only 127.0.0.11 inside a container. That
  # loopback address cannot be used from Kubernetes Pod namespaces.
  [[ -n "$detected" ]] || detected="1.1.1.1 8.8.8.8"
  printf '%s\n' "$detected"
}

if [[ "$DRY_RUN" == true ]]; then
  RESULT_ROOT="${PROJECT_ROOT}/verification-install-results"
else
  ((EUID == 0)) || { echo "전체 설치는 root 권한이 필요합니다. install-verification.sh를 실행하세요." >&2; exit 1; }
  RESULT_ROOT="${INSTALL_STATE_ROOT}/results"
fi

timestamp="$(date +%Y%m%d-%H%M%S)"
RESULT_DIR="${RESULT_ROOT}/${timestamp}"
LOG_FILE="${RESULT_DIR}/install.log"
REPORT_FILE="${RESULT_DIR}/verification-report.md"
mkdir -p "$RESULT_DIR"
touch "$LOG_FILE" "$REPORT_FILE"
chmod 600 "$LOG_FILE" "$REPORT_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

pass_count=0
warn_count=0
skip_count=0
fail_count=0

record() {
  local status="$1" item="$2" detail="${3:-}" safe_detail
  safe_detail="${detail//|/\\|}"
  case "$status" in
    PASS) ((pass_count += 1)) ;;
    WARN) ((warn_count += 1)) ;;
    SKIP) ((skip_count += 1)) ;;
    FAIL) ((fail_count += 1)) ;;
  esac
  printf '[%s] %s%s\n' "$status" "$item" "${detail:+ - $detail}"
  printf '| %s | %s | %s |\n' "$status" "$item" "$safe_detail" >> "$REPORT_FILE"
}

finish_report() {
  local result="통과"
  [[ "$REPORT_FINISHED" == true ]] && return 0
  REPORT_FINISHED=true
  if ((fail_count > 0)); then
    result="실패"
  elif ((warn_count > 0 || skip_count > 0)); then
    result="통과(확인 사항 있음)"
  fi
  {
    printf '\n## 최종 결과\n\n'
    printf -- '- 판정: **%s**\n' "$result"
    printf -- '- 통과: %d\n' "$pass_count"
    printf -- '- 경고: %d\n' "$warn_count"
    printf -- '- 건너뜀: %d\n' "$skip_count"
    printf -- '- 실패: %d\n' "$fail_count"
    # shellcheck disable=SC2016
    printf -- '- 로그: `%s`\n' "$LOG_FILE"
  } >> "$REPORT_FILE"
  printf '\n최종 판정: %s\n보고서: %s\n로그: %s\n' "$result" "$REPORT_FILE" "$LOG_FILE"
}

cleanup() {
  local pid
  for pid in "${FORWARD_PIDS[@]:-}"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
}

on_error() {
  local rc=$? line="${BASH_LINENO[0]:-unknown}"
  trap - ERR
  record FAIL "$CURRENT_STAGE" "line ${line}, exit ${rc}"
  finish_report
  echo "재실행하면 완료된 단계는 건너뛰고 실패 단계부터 계속합니다." >&2
  exit "$rc"
}

trap cleanup EXIT
trap on_error ERR

cat > "$REPORT_FILE" <<EOF
# Prediction Manager 전체 검수 설치 결과

- 실행 시각: $(date '+%Y-%m-%d %H:%M:%S %Z')
- 설치기 경로: $PROJECT_ROOT
- 백엔드 소스 경로: $PREDICTION_MANAGER_ROOT
- 프런트엔드 소스 경로: ${PREDICTION_MANAGER_FRONTEND_ROOT:-미사용}
- 컨테이너 호환 모드: $CONTAINER_MODE
- 설정 파일: $CONFIG_FILE
- dry-run: $DRY_RUN
- resume: $RESUME

> 이 프로파일은 Ubuntu 22.04 단일 서버 검수용이다. 운영 배포에서는 인증서,
> 도메인, 외부 Registry, 공유 StorageClass와 보안 정책을 별도로 확정해야 한다.

## 단계별 결과

| 상태 | 항목 | 상세 |
|---|---|---|
EOF

required_installer_files=(
  install-verification.sh
  verification-install.env.example
  scripts/render-manifests.sh
  scripts/bootstrap-verification.sh
  scripts/prepare-install-config.sh
  scripts/diagnose-install-entry.sh
  scripts/show-access-urls.sh
  k8s/deployment.yaml.template
  k8s/verification/kubeflow-kustomization.yaml
  k8s/verification/postgres-keycloak.yaml.template
  k8s/verification/monitoring-values.yaml
  k8s/verification/nvidia-time-slicing.yaml
  docker/ray-mlflow/Dockerfile
)

required_backend_files=(
  Dockerfile
  requirements.txt
  app/main.py
  app/services/kubernetes_client.py
  static/index.html
  .env.example
  k8s/rbac.yaml
  k8s/service.yaml
  k8s/virtualservice.yaml
  k8s/model-store-pvc.yaml
  k8s/dataset-store-pvc.yaml
  k8s/optional/label-studio.yaml
  k8s/optional/docker-socket-patch.yaml
  docker/mlflow-postgres.Dockerfile
  docker/nifi-python/Dockerfile
)

validate_source() {
  local file
  for file in "${required_installer_files[@]}"; do
    [[ -f "${PROJECT_ROOT}/${file}" ]] || { echo "필수 파일 누락: $file" >&2; return 1; }
  done
  for file in "${required_backend_files[@]}"; do
    [[ -f "${PREDICTION_MANAGER_ROOT}/${file}" ]] || {
      echo "Prediction Manager 필수 파일 누락: ${PREDICTION_MANAGER_ROOT}/${file}" >&2
      return 1
    }
  done
  if bool_true "$INSTALL_FRONTEND" || bool_true "$BUILD_FRONTEND_IMAGE"; then
    [[ -n "$PREDICTION_MANAGER_FRONTEND_ROOT" ]] || {
      echo "PREDICTION_MANAGER_FRONTEND_ROOT가 필요합니다." >&2
      return 1
    }
    for file in Dockerfile package.json package-lock.json nginx.conf env.sh; do
      [[ -f "${PREDICTION_MANAGER_FRONTEND_ROOT}/${file}" ]] || {
        echo "프런트엔드 필수 파일 누락: ${PREDICTION_MANAGER_FRONTEND_ROOT}/${file}" >&2
        return 1
      }
    done
  fi
  if grep -RqsE --include='*.py' --include='*.js' --include='*.html' '^(<<<<<<< .+|=======|>>>>>>> .+)$' \
    "${PREDICTION_MANAGER_ROOT}/app" "${PREDICTION_MANAGER_ROOT}/static"; then
    echo "해결되지 않은 Git 병합 충돌 표식이 있습니다." >&2
    return 1
  fi
  record PASS "전달 소스" "설치기 ${#required_installer_files[@]}개, 백엔드 ${#required_backend_files[@]}개"
}

validate_ports() {
  local port
  for port in "$KUBEFLOW_NODE_PORT" "$KEYCLOAK_NODE_PORT"; do
    ((port >= 30000 && port <= 32767)) || { echo "NodePort 범위를 벗어났습니다: $port" >&2; return 1; }
  done
  [[ "$KUBEFLOW_NODE_PORT" != "$KEYCLOAK_NODE_PORT" ]] || { echo "Kubeflow와 Keycloak NodePort가 같습니다." >&2; return 1; }
  ((REGISTRY_PORT >= 1024 && REGISTRY_PORT <= 65535)) || { echo "Registry port가 올바르지 않습니다." >&2; return 1; }
  for port in "$PM_HEALTHCHECK_PORT" "$PROMETHEUS_HEALTHCHECK_PORT"; do
    ((port >= 1024 && port <= 65535)) || { echo "검증용 port가 올바르지 않습니다: $port" >&2; return 1; }
  done
  [[ "$PM_HEALTHCHECK_PORT" != "$PROMETHEUS_HEALTHCHECK_PORT" ]] || {
    echo "Prediction Manager와 Prometheus 검증용 port가 같습니다." >&2
    return 1
  }
  record PASS "포트 설정" "Kubeflow ${KUBEFLOW_NODE_PORT}, Keycloak ${KEYCLOAK_NODE_PORT}, Registry ${REGISTRY_PORT}"
}

validate_network_cidrs() {
  python3 - "$NODE_IP" "$POD_NETWORK_CIDR" "$SERVICE_CIDR" <<'PY'
import ipaddress
import sys

node_ip = ipaddress.ip_address(sys.argv[1])
pod_cidr = ipaddress.ip_network(sys.argv[2], strict=False)
service_cidr = ipaddress.ip_network(sys.argv[3], strict=False)
if pod_cidr.overlaps(service_cidr):
    raise SystemExit(f"Pod CIDR와 Service CIDR가 겹칩니다: {pod_cidr}, {service_cidr}")
if node_ip in pod_cidr or node_ip in service_cidr:
    raise SystemExit(f"Node IP {node_ip}가 cluster CIDR와 겹칩니다")
PY
  record PASS "클러스터 네트워크" "node ${NODE_IP}, pod ${POD_NETWORK_CIDR}, service ${SERVICE_CIDR}"
}

dry_run() {
  CURRENT_STAGE="dry-run"
  validate_source
  validate_ports
  if gpu_stack_enabled; then
    if nvidia-smi >/dev/null 2>&1; then
      detect_gpu_hardware
      record PASS "GPU 자동 설정" "${GPU_PHYSICAL_COUNT}x ${GPU_MODEL}, 최소 VRAM ${GPU_VRAM_GIB} GiB, GPU당 슬롯 ${GPU_TIME_SLICES}, Ray GPU worker max ${PM_TENANT_RAY_GPU_WORKER_MAX_REPLICAS}"
    elif bool_true "$REQUIRE_NVIDIA_GPU"; then
      echo "NVIDIA GPU가 필수이지만 nvidia-smi가 동작하지 않습니다." >&2
      return 1
    else
      record WARN "GPU 자동 설정" "GPU가 없어 생략"
    fi
  else
    record SKIP "GPU 자동 설정" "CPU 전용 모드"
  fi
  bash -n "${PROJECT_ROOT}/install-verification.sh" "${PROJECT_ROOT}/scripts/bootstrap-verification.sh"
  record PASS "Shell 구문" "entrypoint와 전체 설치기"
  if command -v envsubst >/dev/null 2>&1; then
    local temp_dir
    temp_dir="$(mktemp -d)"
    POSTGRES_USER=pm_admin POSTGRES_PASSWORD=dryrun STORAGE_CLASS=local-path \
      KEYCLOAK_ADMIN_USER=admin KEYCLOAK_ADMIN_PASSWORD=dryrun \
      KEYCLOAK_DEX_CLIENT_SECRET=dryrun VERIFICATION_ADMIN_EMAIL=user@example.com \
      VERIFICATION_ADMIN_PASSWORD=dryrun KUBEFLOW_URL=http://127.0.0.1:30080 \
      KEYCLOAK_NODE_PORT=30081 envsubst \
      < "${PROJECT_ROOT}/k8s/verification/postgres-keycloak.yaml.template" \
      > "${temp_dir}/platform.yaml"
    if bool_true "$INSTALL_NVIDIA_TOOLKIT"; then
      GPU_TIME_SLICES=4 envsubst \
        < "${PROJECT_ROOT}/k8s/verification/nvidia-time-slicing.yaml" \
        > "${temp_dir}/time-slicing.yaml"
    fi
    # shellcheck disable=SC2016
    local unresolved_marker='${'
    grep -qF "$unresolved_marker" "${temp_dir}/platform.yaml" && {
      echo "렌더링되지 않은 변수가 있습니다." >&2
      return 1
    }
    if bool_true "$INSTALL_NVIDIA_TOOLKIT"; then
      record PASS "검수 Manifest 렌더링" "PostgreSQL/Keycloak/GPU"
    else
      record PASS "검수 Manifest 렌더링" "PostgreSQL/Keycloak (CPU 모드)"
    fi
  else
    record WARN "검수 Manifest 렌더링" "envsubst 미설치로 생략; 실제 실행에서 설치됨"
  fi
  cat <<EOF

전체 검수 설치 계획
1. Ubuntu 22.04 사전 점검 및 의존성 설치
2. Docker/containerd, 로컬 Registry 구성
3. Kubernetes 서비스 관리 방식 확인 (systemd 또는 컨테이너 호환 모드)
4. Kubernetes 단일 노드, Calico, local-path, Metrics Server 구성
5. GPU 구성은 명시적으로 요청된 경우에만 확인
6. Kubeflow ${KUBEFLOW_VERSION}, KFP, KServe, TensorBoard, KubeRay 구성
7. PostgreSQL, Keycloak/OIDC, Prometheus 구성
8. Prediction Manager/프런트엔드/MLflow/Ray/NiFi/Label Studio 이미지 빌드·Push
9. Prediction Manager와 필수 연동 서비스 배포
10. 기본 tenant MLflow/Ray/NiFi 생성 및 HTTP/DB/하드웨어 최종 검증
EOF
  record PASS "전체 설치 계획" "10개 단계"
  finish_report
}

if [[ "$DRY_RUN" == true ]]; then
  dry_run
  exit 0
fi

STATE_DIR="${INSTALL_STATE_ROOT}/state"
GENERATED_DIR="${INSTALL_STATE_ROOT}/generated"
SECRETS_FILE="${INSTALL_STATE_ROOT}/secrets.env"
mkdir -p "$STATE_DIR" "$GENERATED_DIR" "$REGISTRY_DATA_DIR"
chmod 700 "$INSTALL_STATE_ROOT" "$STATE_DIR" "$GENERATED_DIR" "$REGISTRY_DATA_DIR"
if [[ "$RESUME" == true ]]; then
  systemctl disable prediction-manager-verification-resume.service >/dev/null 2>&1 || true
fi

ORIGINAL_USER="${PM_INSTALL_ORIGINAL_USER:-${SUDO_USER:-root}}"
ORIGINAL_HOME="$(getent passwd "$ORIGINAL_USER" | cut -d: -f6)"
[[ -n "$ORIGINAL_HOME" ]] || ORIGINAL_HOME="/root"

NODE_IP="$(resolve_node_ip)"
CONTAINER_DNS_SERVERS="$(resolve_container_dns_servers)"
if bool_true "$CONTAINER_MODE"; then
  # Docker-in-Docker의 기존 daemon은 시작 후 daemon.json을 안전하게 다시
  # 읽을 수 없다. loopback Registry는 Docker가 기본적으로 HTTP를 허용하며,
  # Kubernetes의 containerd도 같은 네트워크 namespace에서 접근할 수 있다.
  REGISTRY_HOST="127.0.0.1:${REGISTRY_PORT}"
else
  REGISTRY_HOST="${NODE_IP}:${REGISTRY_PORT}"
fi
REGISTRY_URL="http://${REGISTRY_HOST}"
if bool_true "$CONTAINER_MODE"; then
  # Image pulls are resolved by the node's containerd, where loopback is
  # correct. Application pods have their own network namespace and must use
  # the outer container's node IP to reach the same published Registry port.
  REGISTRY_POD_URL="http://${NODE_IP}:${REGISTRY_PORT}"
else
  REGISTRY_POD_URL="$REGISTRY_URL"
fi
KUBEFLOW_URL="http://${NODE_IP}:${KUBEFLOW_NODE_PORT}"
KEYCLOAK_PUBLIC_URL="http://${NODE_IP}:${KEYCLOAK_NODE_PORT}/auth"
if [[ "$LABEL_STUDIO_PUBLIC_URL" == "auto" ]]; then
  LABEL_STUDIO_PUBLIC_URL="http://${NODE_IP}:18080/label-studio"
fi
export NODE_IP REGISTRY_HOST REGISTRY_URL REGISTRY_POD_URL KUBEFLOW_URL KEYCLOAK_PUBLIC_URL
export CONTAINER_DNS_SERVERS
export KUBECONFIG=/etc/kubernetes/admin.conf
if gpu_stack_enabled && nvidia-smi >/dev/null 2>&1; then
  detect_gpu_hardware
fi

stage_done() {
  [[ -f "${STATE_DIR}/$1.done" ]] && ! bool_true "$FORCE_REINSTALL"
}

run_stage() {
  local id="$1" label="$2" function_name="$3"
  CURRENT_STAGE="$label"
  if stage_done "$id"; then
    record SKIP "$label" "이전 실행에서 완료됨"
    return
  fi
  echo
  echo "===== $label ====="
  "$function_name"
  touch "${STATE_DIR}/${id}.done"
  record PASS "$label" "완료"
}

run_always() {
  local label="$1" function_name="$2"
  CURRENT_STAGE="$label"
  echo
  echo "===== $label ====="
  "$function_name"
  record PASS "$label" "완료"
}

schedule_resume_after_reboot() {
  local unit=/etc/systemd/system/prediction-manager-verification-resume.service
  cat > "$unit" <<EOF
[Unit]
Description=Resume Prediction Manager verification installation
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment=PM_INSTALL_ORIGINAL_USER=${ORIGINAL_USER}
Environment=VERIFY_INSTALL_CONFIG=${CONFIG_FILE}
WorkingDirectory=${PROJECT_ROOT}
ExecStart=/bin/bash ${PROJECT_ROOT}/scripts/bootstrap-verification.sh --resume
StandardOutput=append:/var/log/prediction-manager-verification-install.log
StandardError=append:/var/log/prediction-manager-verification-install.log

[Install]
WantedBy=multi-user.target
EOF
  chmod 644 "$unit"
  systemctl daemon-reload
  systemctl enable prediction-manager-verification-resume.service
}

install_kustomize() {
  local asset="kustomize_${KUSTOMIZE_VERSION}_linux_amd64.tar.gz" temp_dir
  temp_dir="$(mktemp -d)"
  curl -fsSLo "${temp_dir}/${asset}" "https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2F${KUSTOMIZE_VERSION}/${asset}"
  curl -fsSLo "${temp_dir}/checksums.txt" "https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2F${KUSTOMIZE_VERSION}/checksums.txt"
  (cd "$temp_dir" && grep " ${asset}$" checksums.txt | sha256sum -c -)
  tar -xzf "${temp_dir}/${asset}" -C "$temp_dir"
  install -m 0755 "${temp_dir}/kustomize" /usr/local/bin/kustomize
}

install_helm() {
  local asset="helm-${HELM_VERSION}-linux-amd64.tar.gz" temp_dir
  temp_dir="$(mktemp -d)"
  curl -fsSLo "${temp_dir}/${asset}" "https://get.helm.sh/${asset}"
  curl -fsSLo "${temp_dir}/${asset}.sha256sum" "https://get.helm.sh/${asset}.sha256sum"
  (cd "$temp_dir" && sha256sum -c "${asset}.sha256sum")
  tar -xzf "${temp_dir}/${asset}" -C "$temp_dir"
  install -m 0755 "${temp_dir}/linux-amd64/helm" /usr/local/bin/helm
}

preflight() {
  validate_source
  validate_ports
  # shellcheck disable=SC1091
  source /etc/os-release
  if [[ "${ID:-}" != "ubuntu" || "${VERSION_ID:-}" != "22.04" ]]; then
    if bool_true "$ALLOW_UNSUPPORTED_HOST"; then
      record WARN "운영체제" "${PRETTY_NAME:-unknown}; 검수 기준은 Ubuntu 22.04"
    else
      echo "Ubuntu 22.04가 아닙니다: ${PRETTY_NAME:-unknown}" >&2
      return 1
    fi
  else
    record PASS "운영체제" "$PRETTY_NAME"
  fi
  [[ "$(uname -m)" == "x86_64" ]] || { echo "x86_64 서버만 지원합니다." >&2; return 1; }
  local cpu memory disk
  cpu="$(nproc)"
  memory="$(( $(awk '/MemTotal/ {print $2}' /proc/meminfo) / 1024 / 1024 ))"
  disk="$(df -BG --output=avail / | tail -1 | tr -dc '0-9')"
  ((cpu >= MIN_CPU_CORES)) || { echo "CPU 부족: ${cpu} core" >&2; return 1; }
  ((memory >= MIN_MEMORY_GIB)) || { echo "메모리 부족: ${memory} GiB" >&2; return 1; }
  ((disk >= MIN_DISK_GIB)) || { echo "디스크 부족: ${disk} GiB" >&2; return 1; }
  record PASS "서버 사양" "CPU ${cpu}, Memory ${memory} GiB, Disk ${disk} GiB"
  curl -fsSI --max-time 15 https://github.com/ >/dev/null
  curl -fsSI --max-time 15 https://registry.k8s.io/v2/ >/dev/null
  record PASS "인터넷 연결" "GitHub와 registry.k8s.io"
}

host_dependencies() {
  export DEBIAN_FRONTEND=noninteractive
  # A previous interrupted run may have created the public key under umask
  # 077. Repair it before the first apt update so the _apt user can read it.
  chmod 0644 /etc/apt/keyrings/kubernetes-apt-keyring.gpg 2>/dev/null || true
  apt-get update
  apt-get install -y \
    apt-transport-https ca-certificates chrony conntrack curl docker.io containerd \
    docker-buildx ebtables ethtool gettext-base git gnupg gpg iproute2 iptables \
    jq kmod lsb-release openssl pciutils python3 python3-yaml socat \
    software-properties-common unzip util-linux xz-utils
  if systemd_available; then
    systemctl enable --now chrony containerd docker
  else
    docker info >/dev/null
    record PASS "컨테이너 Docker daemon" "기존 Docker-in-Docker daemon 사용"
  fi
  if [[ "$ORIGINAL_USER" != "root" ]]; then
    usermod -aG docker "$ORIGINAL_USER"
  fi

  install -d -m 0755 /etc/apt/keyrings
  local kubernetes_minor="${KUBERNETES_VERSION%.*}"
  curl -fsSL "https://pkgs.k8s.io/core:/stable:/v${kubernetes_minor}/deb/Release.key" \
    | gpg --dearmor --yes -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
  chmod 0644 /etc/apt/keyrings/kubernetes-apt-keyring.gpg
  echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v${kubernetes_minor}/deb/ /" \
    > /etc/apt/sources.list.d/kubernetes.list
  apt-get update
  local package_version
  package_version="$(apt-cache madison kubeadm | awk -v v="${KUBERNETES_VERSION}-" '$3 ~ ("^" v) {print $3; exit}')"
  [[ -n "$package_version" ]] || { echo "Kubernetes ${KUBERNETES_VERSION} 패키지를 찾을 수 없습니다." >&2; return 1; }
  apt-get install -y \
    "kubelet=${package_version}" "kubeadm=${package_version}" "kubectl=${package_version}"
  apt-mark hold kubelet kubeadm kubectl
  if systemd_available; then
    systemctl enable kubelet
  fi

  install_kustomize
  install_helm

  if gpu_stack_enabled; then
    if nvidia-smi >/dev/null 2>&1; then
      detect_gpu_hardware
      record PASS "GPU 자동 탐지" "${GPU_PHYSICAL_COUNT}x ${GPU_MODEL}, 최소 VRAM ${GPU_VRAM_GIB} GiB, driver ${GPU_DRIVER_VERSION}, GPU당 슬롯 ${GPU_TIME_SLICES}"
    elif bool_true "$REQUIRE_NVIDIA_GPU"; then
      echo "NVIDIA GPU가 필수이지만 nvidia-smi가 동작하지 않습니다. driver는 설치 전에 별도로 준비하세요." >&2
      return 1
    else
      record WARN "NVIDIA GPU" "GPU가 없어 생략"
    fi
  else
    record SKIP "NVIDIA GPU/driver" "CPU 전용 구성; 탐지나 변경하지 않음"
  fi
}

ensure_local_registry() {
  if docker inspect "$REGISTRY_CONTAINER_NAME" >/dev/null 2>&1; then
    if ! docker start "$REGISTRY_CONTAINER_NAME" >/dev/null 2>&1; then
      record WARN "로컬 Registry" "이전 비정상 종료 컨테이너를 재생성"
      docker rm -f "$REGISTRY_CONTAINER_NAME" >/dev/null 2>&1 || true
    fi
  fi
  if ! docker inspect "$REGISTRY_CONTAINER_NAME" >/dev/null 2>&1; then
    docker run -d --restart=always --name "$REGISTRY_CONTAINER_NAME" \
      -p "${REGISTRY_PORT}:5000" -v "${REGISTRY_DATA_DIR}:/var/lib/registry" \
      registry:2.8.3 >/dev/null
  fi
  for _ in $(seq 1 30); do
    curl -fsS "${REGISTRY_URL}/v2/" >/dev/null 2>&1 && return 0
    sleep 2
  done
  curl -fsS "${REGISTRY_URL}/v2/" >/dev/null
}

configure_runtime() {
  validate_network_cidrs
  if bool_true "$CONTAINER_MODE"; then
    # privileged container가 보는 swap은 Docker host의 swap일 수 있으므로
    # host 상태를 바꾸지 않고 kubelet의 failSwapOn=false로 처리한다.
    record PASS "컨테이너 swap 보호" "host swap을 변경하지 않음"
  else
    swapoff -a
    sed -ri '/^[^#].*\sswap\s/s/^/#/' /etc/fstab
  fi
  cat > /etc/modules-load.d/k8s.conf <<'EOF'
overlay
br_netfilter
EOF
  if bool_true "$CONTAINER_MODE"; then
    grep -qw overlay /proc/filesystems || {
      echo "Docker host 커널에 overlayfs가 활성화되어 있지 않습니다." >&2
      return 1
    }
    [[ -e /proc/sys/net/bridge/bridge-nf-call-iptables ]] || {
      echo "Docker host에서 br_netfilter를 먼저 로드해야 합니다: sudo modprobe br_netfilter" >&2
      return 1
    }
  else
    modprobe overlay
    modprobe br_netfilter
  fi
  cat > /etc/sysctl.d/99-prediction-manager-verification.conf <<'EOF'
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
fs.inotify.max_user_instances = 8192
fs.inotify.max_user_watches = 2097152
EOF
  sysctl --system >/dev/null

  install -d -m 0755 /etc/docker
  python3 - "$REGISTRY_HOST" <<'PY'
import json
import os
import sys

path = "/etc/docker/daemon.json"
registry = sys.argv[1]
try:
    with open(path, encoding="utf-8") as handle:
        data = json.load(handle)
except (FileNotFoundError, json.JSONDecodeError):
    data = {}
registries = list(data.get("insecure-registries") or [])
if registry not in registries:
    registries.append(registry)
data["insecure-registries"] = registries
container_mode = os.environ.get("CONTAINER_MODE", "false").lower() in {"1", "true", "yes", "on"}
data.setdefault("exec-opts", ["native.cgroupdriver=cgroupfs" if container_mode else "native.cgroupdriver=systemd"])
temp = f"{path}.tmp"
with open(temp, "w", encoding="utf-8") as handle:
    json.dump(data, handle, indent=2)
    handle.write("\n")
os.replace(temp, path)
PY

  install -d -m 0755 /etc/containerd
  if [[ ! -s /etc/containerd/config.toml ]]; then
    containerd config default > /etc/containerd/config.toml
  fi
  python3 - <<'PY'
import os
from pathlib import Path

path = Path("/etc/containerd/config.toml")
text = path.read_text(encoding="utf-8")
container_mode = os.environ.get("CONTAINER_MODE", "false").lower() in {"1", "true", "yes", "on"}
if container_mode:
    text = text.replace("SystemdCgroup = true", "SystemdCgroup = false")
else:
    text = text.replace("SystemdCgroup = false", "SystemdCgroup = true")
text = text.replace('config_path = ""', 'config_path = "/etc/containerd/certs.d"')
registry_header = '[plugins."io.containerd.grpc.v1.cri".registry]'
if 'config_path = "/etc/containerd/certs.d"' not in text and registry_header in text:
    text = text.replace(registry_header, registry_header + '\n      config_path = "/etc/containerd/certs.d"', 1)
path.write_text(text, encoding="utf-8")
PY
  install -d -m 0755 "/etc/containerd/certs.d/${REGISTRY_HOST}"
  cat > "/etc/containerd/certs.d/${REGISTRY_HOST}/hosts.toml" <<EOF
server = "http://${REGISTRY_HOST}"

[host."http://${REGISTRY_HOST}"]
  capabilities = ["pull", "resolve", "push"]
  skip_verify = true
EOF

  if bool_true "$INSTALL_NVIDIA_TOOLKIT"; then
    curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
      | gpg --dearmor --yes -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
    curl -fsSL https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
      | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#' \
      > /etc/apt/sources.list.d/nvidia-container-toolkit.list
    apt-get update
    apt-get install -y "nvidia-container-toolkit"
    nvidia-ctk runtime configure --runtime=docker
    nvidia-ctk runtime configure --runtime=containerd --set-as-default
  else
    record SKIP "NVIDIA Container Toolkit" "INSTALL_NVIDIA_TOOLKIT=false"
  fi

  if systemd_available; then
    systemctl restart containerd docker
  else
    export CONTAINER_MODE
    start_container_daemon containerd "$(service_state_dir)/containerd.log" \
      /usr/bin/containerd --config /etc/containerd/config.toml
    for _ in $(seq 1 60); do
      ctr --address /run/containerd/containerd.sock version >/dev/null 2>&1 && break
      sleep 1
    done
    ctr --address /run/containerd/containerd.sock version >/dev/null
    start_container_kubelet
    record PASS "컨테이너 서비스" "containerd와 kubelet 호환 supervisor 시작"
  fi

  ensure_local_registry

  if bool_true "$VERIFY_DOCKER_GPU"; then
    docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi >/dev/null
  fi
}

install_kubernetes() {
  if bool_true "$CONTAINER_MODE"; then
    mount --make-rshared /
    record PASS "컨테이너 mount propagation" "/ 재귀 shared 구성"
    export CONTAINER_MODE
    start_container_daemon containerd "$(service_state_dir)/containerd.log" \
      /usr/bin/containerd --config /etc/containerd/config.toml
    for _ in $(seq 1 60); do
      ctr --address /run/containerd/containerd.sock version >/dev/null 2>&1 && break
      sleep 1
    done
    ctr --address /run/containerd/containerd.sock version >/dev/null
    ensure_local_registry
  fi
  if [[ -f /etc/kubernetes/admin.conf ]]; then
    if [[ ! -f "${STATE_DIR}/cluster-owned" ]] && ! bool_true "$ALLOW_EXISTING_CLUSTER"; then
      echo "기존 Kubernetes 클러스터가 감지되어 중단합니다. ALLOW_EXISTING_CLUSTER=true가 필요합니다." >&2
      return 1
    fi
  else
    if bool_true "$CONTAINER_MODE"; then
      local container_resolv_file resolver
      container_resolv_file="${GENERATED_DIR}/container-resolv.conf"
      : > "$container_resolv_file"
      for resolver in $CONTAINER_DNS_SERVERS; do
        printf 'nameserver %s\n' "$resolver" >> "$container_resolv_file"
      done
      printf 'options ndots:5\n' >> "$container_resolv_file"
      cat > "${GENERATED_DIR}/kubeadm-config.yaml" <<EOF
apiVersion: kubeadm.k8s.io/v1beta3
kind: InitConfiguration
nodeRegistration:
  criSocket: unix:///run/containerd/containerd.sock
  ignorePreflightErrors:
    - Swap
    - SystemVerification
---
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
kubernetesVersion: v${KUBERNETES_VERSION}
controlPlaneEndpoint: ${NODE_IP}:6443
apiServer:
  certSANs:
    - ${NODE_IP}
networking:
  podSubnet: ${POD_NETWORK_CIDR}
  serviceSubnet: ${SERVICE_CIDR}
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: cgroupfs
failSwapOn: false
resolvConf: ${container_resolv_file}
EOF
      start_container_kubelet
      kubeadm init --config "${GENERATED_DIR}/kubeadm-config.yaml"
    else
      kubeadm init \
        --kubernetes-version "v${KUBERNETES_VERSION}" \
        --apiserver-advertise-address "$NODE_IP" \
        --pod-network-cidr "$POD_NETWORK_CIDR" \
        --service-cidr "$SERVICE_CIDR"
    fi
    touch "${STATE_DIR}/cluster-owned"
  fi
  local original_group
  original_group="$(id -gn "$ORIGINAL_USER")"
  install -d -m 0700 "${ORIGINAL_HOME}/.kube"
  install -m 0600 /etc/kubernetes/admin.conf "${ORIGINAL_HOME}/.kube/config"
  chown -R "$ORIGINAL_USER:$original_group" "${ORIGINAL_HOME}/.kube"
  if bool_true "$CONTAINER_MODE"; then
    kubectl -n kube-system get configmap kube-proxy -o json \
      | jq '.data["config.conf"] |= gsub("maxPerCore: null"; "maxPerCore: 0")
            | del(.metadata.creationTimestamp, .metadata.resourceVersion, .metadata.uid,
                  .metadata.managedFields)' \
      | kubectl apply -f - >/dev/null
    kubectl -n kube-system delete pod -l k8s-app=kube-proxy \
      --ignore-not-found=true >/dev/null
    record PASS "컨테이너 kube-proxy" "읽기 전용 conntrack sysctl 변경 비활성화"
  fi
  kubectl taint nodes --all node-role.kubernetes.io/control-plane- >/dev/null 2>&1 || true
  kubectl taint nodes --all node-role.kubernetes.io/master- >/dev/null 2>&1 || true
}

wait_rollout_if_exists() {
  local namespace="$1" kind="$2" name="$3" timeout="${4:-1200s}"
  if kubectl -n "$namespace" get "$kind/$name" >/dev/null 2>&1; then
    kubectl -n "$namespace" rollout status "$kind/$name" --timeout="$timeout"
  fi
}

install_cluster_addons() {
  kubectl apply -f "https://raw.githubusercontent.com/projectcalico/calico/${CALICO_VERSION}/manifests/calico.yaml"
  wait_rollout_if_exists kube-system daemonset calico-node 600s
  kubectl wait --for=condition=Ready nodes --all --timeout=600s

  kubectl apply -f "https://raw.githubusercontent.com/rancher/local-path-provisioner/${LOCAL_PATH_PROVISIONER_VERSION}/deploy/local-path-storage.yaml"
  kubectl annotate storageclass local-path storageclass.kubernetes.io/is-default-class=true --overwrite
  wait_rollout_if_exists local-path-storage deployment local-path-provisioner 600s

  kubectl apply -f "https://github.com/kubernetes-sigs/metrics-server/releases/download/${METRICS_SERVER_VERSION}/components.yaml"
  kubectl -n kube-system patch deployment metrics-server --type strategic -p '
spec:
  template:
    spec:
      containers:
        - name: metrics-server
          args:
            - --cert-dir=/tmp
            - --secure-port=10250
            - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
            - --kubelet-use-node-status-port
            - --metric-resolution=15s
            - --kubelet-insecure-tls
'
  wait_rollout_if_exists kube-system deployment metrics-server 600s
}

install_gpu_plugin() {
  if ! bool_true "$INSTALL_NVIDIA_TOOLKIT"; then
    record SKIP "GPU Device Plugin" "CPU 전용 구성"
    return
  fi
  if ! nvidia-smi >/dev/null 2>&1; then
    if bool_true "$REQUIRE_NVIDIA_GPU"; then
      echo "nvidia-smi가 동작하지 않습니다." >&2
      return 1
    fi
    record WARN "GPU Device Plugin" "GPU가 없어 생략"
    return
  fi
  detect_gpu_hardware
  export GPU_TIME_SLICES
  envsubst < "${PROJECT_ROOT}/k8s/verification/nvidia-time-slicing.yaml" \
    > "${GENERATED_DIR}/nvidia-time-slicing.yaml"
  helm repo add nvdp https://nvidia.github.io/k8s-device-plugin >/dev/null 2>&1 || true
  helm repo update nvdp
  local plugin_release=nvidia-device-plugin
  helm upgrade --install "$plugin_release" nvdp/nvidia-device-plugin \
    --namespace nvidia-device-plugin --create-namespace \
    --version "$NVIDIA_DEVICE_PLUGIN_VERSION" \
    --set-file config.map.time-slicing="${GENERATED_DIR}/nvidia-time-slicing.yaml" \
    --set config.default=time-slicing \
    --set gfd.enabled=true
  wait_rollout_if_exists nvidia-device-plugin daemonset nvidia-device-plugin 600s
  local advertised=0
  for _ in $(seq 1 60); do
    advertised="$(kubectl get nodes -o json | jq -r '[.items[].status.allocatable["nvidia.com/gpu"] // "0" | tonumber] | add')"
    ((advertised >= GPU_EXPECTED_RESOURCES)) && break
    sleep 5
  done
  ((advertised >= GPU_EXPECTED_RESOURCES)) || { echo "Time-Slicing GPU ${GPU_EXPECTED_RESOURCES}개가 노출되지 않았습니다: ${advertised}" >&2; return 1; }
  record PASS "GPU Time-Slicing" "물리 ${GPU_PHYSICAL_COUNT}개 x 슬롯 ${GPU_TIME_SLICES} = nvidia.com/gpu ${advertised}; 메모리 격리 없음"
}

apply_with_retry() {
  local manifest="$1" attempts="${2:-30}" delay="${3:-20}" attempt
  for attempt in $(seq 1 "$attempts"); do
    if kubectl apply --server-side --force-conflicts -f "$manifest"; then
      return 0
    fi
    echo "Manifest 적용 재시도 ${attempt}/${attempts}: ${manifest}"
    sleep "$delay"
  done
  return 1
}

wait_namespace_workloads() {
  local namespace="$1" resource name
  local -a deployments=() statefulsets=()
  mapfile -t deployments < <(kubectl -n "$namespace" get deployment -o name 2>/dev/null || true)
  for resource in "${deployments[@]:-}"; do
    [[ -n "$resource" ]] || continue
    name="${resource#deployment.apps/}"
    wait_rollout_if_exists "$namespace" deployment "$name" 1200s
  done
  mapfile -t statefulsets < <(kubectl -n "$namespace" get statefulset -o name 2>/dev/null || true)
  for resource in "${statefulsets[@]:-}"; do
    [[ -n "$resource" ]] || continue
    name="${resource#statefulset.apps/}"
    wait_rollout_if_exists "$namespace" statefulset "$name" 1200s
  done
}

wait_resource_exists() {
  local namespace="$1" kind="$2" name="$3" attempts="${4:-120}" delay="${5:-5}"
  local _
  for _ in $(seq 1 "$attempts"); do
    kubectl -n "$namespace" get "$kind/$name" >/dev/null 2>&1 && return 0
    sleep "$delay"
  done
  echo "리소스 생성 대기 시간 초과: ${namespace}/${kind}/${name}" >&2
  return 1
}

apply_low_resource_default_state() {
  # 저자원 Kubeflow 기본 상태: 설치 객체와 핵심 ingress/auth만 유지하고,
  # Prediction Manager 이외의 무거운 workload는 기능 시험 때 순차 기동한다.
  local resource
  for resource in $(kubectl -n kubeflow get deployment -o name 2>/dev/null || true); do
    case "$resource" in
      deployment.apps/minio|deployment.apps/kuberay-operator|deployment.apps/prediction-manager) continue ;;
    esac
    kubectl -n kubeflow scale "$resource" --replicas=0
  done
  kubectl -n kubeflow get statefulset -o name 2>/dev/null \
    | grep -Ev '^statefulset.apps/(pm-postgresql)$' \
    | xargs -r kubectl -n kubeflow scale --replicas=0
  kubectl -n istio-system scale deployment \
    cluster-local-gateway istio-ingressgateway istiod --replicas=1
  kubectl -n oauth2-proxy scale deployment/oauth2-proxy --replicas=1
  kubectl -n knative-serving get deployment -o name 2>/dev/null \
    | xargs -r kubectl -n knative-serving scale --replicas=0
  record PASS "저자원 Kubeflow 기본 상태" "필수 ingress/auth와 설치 객체 유지"
}

install_kubeflow() {
  if [[ ! -d "${KUBEFLOW_MANIFESTS_DIR}/.git" ]]; then
    git clone --depth 1 --branch "$KUBEFLOW_VERSION" \
      https://github.com/kubeflow/manifests.git "$KUBEFLOW_MANIFESTS_DIR"
  fi
  mkdir -p "${KUBEFLOW_MANIFESTS_DIR}/example-verification"
  install -m 0644 "${PROJECT_ROOT}/k8s/verification/kubeflow-kustomization.yaml" \
    "${KUBEFLOW_MANIFESTS_DIR}/example-verification/kustomization.yaml"
  kustomize build "${KUBEFLOW_MANIFESTS_DIR}/example-verification" \
    > "${GENERATED_DIR}/kubeflow.yaml"
  python3 - "${GENERATED_DIR}/kubeflow.yaml" <<'PY'
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
text = re.sub(
    r"(?m)^(\s*image:\s*)(?:gcr\.io/ml-pipeline/minio|minio/minio):[^\s]+$",
    r"\1minio/minio:RELEASE.2023-03-20T20-16-18Z",
    text,
)
text = text.replace(
    "gcr.io/kubebuilder/kube-rbac-proxy:",
    "registry.k8s.io/kubebuilder/kube-rbac-proxy:",
)
text = text.replace(
    "gcr.io/ml-pipeline/frontend:2.3.0",
    "ghcr.io/kubeflow/kfp-frontend:2.4.1",
)
path.write_text(text, encoding="utf-8")
PY
  apply_with_retry "${GENERATED_DIR}/kubeflow.yaml"

  kubectl -n kubeflow set env deployment/kubeflow-pipelines-profile-controller \
    FRONTEND_IMAGE=ghcr.io/kubeflow/kfp-frontend FRONTEND_TAG=2.4.1
  if kubectl -n kubeflow-user-example-com get deployment/ml-pipeline-ui-artifact \
      >/dev/null 2>&1; then
    kubectl -n kubeflow-user-example-com set image deployment/ml-pipeline-ui-artifact \
      ml-pipeline-ui-artifact=ghcr.io/kubeflow/kfp-frontend:2.4.1
  fi

  kustomize build "${KUBEFLOW_MANIFESTS_DIR}/contrib/ray/kuberay-operator/overlays/kubeflow" \
    > "${GENERATED_DIR}/kuberay.yaml"
  apply_with_retry "${GENERATED_DIR}/kuberay.yaml" 10 15

  local crd
  for crd in profiles.kubeflow.org notebooks.kubeflow.org \
    inferenceservices.serving.kserve.io rayclusters.ray.io \
    virtualservices.networking.istio.io authorizationpolicies.security.istio.io; do
    kubectl wait --for=condition=Established "crd/${crd}" --timeout=600s
  done
  for _ in $(seq 1 120); do
    kubectl get namespace kubeflow-user-example-com >/dev/null 2>&1 && break
    sleep 5
  done
  kubectl get namespace kubeflow-user-example-com >/dev/null

  kubectl -n istio-system patch service istio-ingressgateway --type strategic -p "
spec:
  type: NodePort
  ports:
    - name: http2
      port: 80
      nodePort: ${KUBEFLOW_NODE_PORT}
"

  if bool_true "$WAIT_ALL_KUBEFLOW_WORKLOADS"; then
    wait_rollout_if_exists cert-manager deployment cert-manager 900s
    wait_rollout_if_exists istio-system deployment istiod 900s
    wait_rollout_if_exists istio-system deployment istio-ingressgateway 900s
    wait_rollout_if_exists auth deployment dex 900s
    wait_rollout_if_exists kubeflow deployment centraldashboard 1200s
    wait_rollout_if_exists kubeflow deployment profiles-deployment 1200s
    wait_rollout_if_exists kubeflow deployment notebook-controller-deployment 1200s
    wait_rollout_if_exists kubeflow deployment jupyter-web-app-deployment 1200s
    wait_rollout_if_exists kubeflow deployment kuberay-operator 1200s
    local namespace
    for namespace in cert-manager istio-system auth knative-serving kubeflow kserve; do
      if kubectl get namespace "$namespace" >/dev/null 2>&1; then
        wait_namespace_workloads "$namespace"
      fi
    done
  else
    apply_low_resource_default_state
  fi
}

secret_value() {
  local current="$1" bytes="${2:-24}"
  if [[ -z "$current" || "$current" == "auto" ]]; then
    openssl rand -hex "$bytes"
  else
    printf '%s\n' "$current"
  fi
}

load_or_create_secrets() {
  if [[ -f "$SECRETS_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$SECRETS_FILE"
    set +a
    return
  fi
  VERIFICATION_ADMIN_PASSWORD="$(secret_value "$VERIFICATION_ADMIN_PASSWORD" 12)"
  KEYCLOAK_ADMIN_PASSWORD="$(secret_value "$KEYCLOAK_ADMIN_PASSWORD" 16)"
  POSTGRES_PASSWORD="$(secret_value "$POSTGRES_PASSWORD" 16)"
  KEYCLOAK_DEX_CLIENT_SECRET="$(secret_value "$KEYCLOAK_DEX_CLIENT_SECRET" 16)"
  PM_NIFI_INGEST_SECRET="$(secret_value "$PM_NIFI_INGEST_SECRET" 32)"
  {
    printf 'VERIFICATION_ADMIN_PASSWORD=%q\n' "$VERIFICATION_ADMIN_PASSWORD"
    printf 'KEYCLOAK_ADMIN_PASSWORD=%q\n' "$KEYCLOAK_ADMIN_PASSWORD"
    printf 'POSTGRES_PASSWORD=%q\n' "$POSTGRES_PASSWORD"
    printf 'KEYCLOAK_DEX_CLIENT_SECRET=%q\n' "$KEYCLOAK_DEX_CLIENT_SECRET"
    printf 'PM_NIFI_INGEST_SECRET=%q\n' "$PM_NIFI_INGEST_SECRET"
  } > "$SECRETS_FILE"
  chmod 600 "$SECRETS_FILE"
}

patch_dex_for_keycloak() {
  local source_file="${GENERATED_DIR}/dex-config.yaml"
  kubectl -n auth get configmap dex -o jsonpath='{.data.config\.yaml}' > "$source_file"
  python3 - "$source_file" "${KEYCLOAK_PUBLIC_URL}/realms/kubeflow" \
    "$KEYCLOAK_DEX_CLIENT_SECRET" "${KUBEFLOW_URL}/dex/callback" <<'PY'
import sys
from pathlib import Path

import yaml

path = Path(sys.argv[1])
issuer, secret, redirect = sys.argv[2:]
config = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
connectors = [item for item in (config.get("connectors") or []) if item.get("id") != "keycloak"]
connectors.append(
    {
        "type": "oidc",
        "id": "keycloak",
        "name": "Keycloak",
        "config": {
            "issuer": issuer,
            "clientID": "kubeflow-dex",
            "clientSecret": secret,
            "redirectURI": redirect,
            "insecureEnableGroups": True,
        },
    }
)
config["connectors"] = connectors
path.write_text(yaml.safe_dump(config, sort_keys=False), encoding="utf-8")
PY
  local patch_json
  patch_json="$(jq -Rs '{data: {"config.yaml": .}}' "$source_file")"
  kubectl -n auth patch configmap dex --type merge -p "$patch_json" >/dev/null
  kubectl -n auth rollout restart deployment dex
  wait_rollout_if_exists auth deployment dex 600s
}

install_data_services() {
  load_or_create_secrets
  export POSTGRES_USER POSTGRES_PASSWORD STORAGE_CLASS KEYCLOAK_ADMIN_USER
  export KEYCLOAK_ADMIN_PASSWORD KEYCLOAK_DEX_CLIENT_SECRET
  export VERIFICATION_ADMIN_EMAIL VERIFICATION_ADMIN_PASSWORD KUBEFLOW_URL KEYCLOAK_NODE_PORT
  envsubst < "${PROJECT_ROOT}/k8s/verification/postgres-keycloak.yaml.template" \
    > "${GENERATED_DIR}/postgres-keycloak.yaml"
  kubectl apply -f "${GENERATED_DIR}/postgres-keycloak.yaml"
  wait_rollout_if_exists kubeflow statefulset pm-postgresql 900s
  wait_rollout_if_exists keycloak deployment keycloak 900s

  kubectl -n kubeflow create secret generic prediction-manager-postgres \
    --from-literal=PREDICTION_MANAGER_DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pm-postgresql.kubeflow.svc.cluster.local:5432/prediction_manager" \
    --from-literal=PM_MLFLOW_BACKEND_STORE_URI_TEMPLATE="postgresql+psycopg2://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pm-postgresql.kubeflow.svc.cluster.local:5432/mlflow_{namespace_db}" \
    --from-literal=PM_NIFI_INGEST_SECRET="$PM_NIFI_INGEST_SECRET" \
    --dry-run=client -o yaml | kubectl apply -f -
  kubectl -n kubeflow create secret generic keycloak-admin \
    --from-literal=url="http://keycloak.keycloak.svc.cluster.local:8080/auth" \
    --from-literal=realm=kubeflow \
    --from-literal=username="$KEYCLOAK_ADMIN_USER" \
    --from-literal=password="$KEYCLOAK_ADMIN_PASSWORD" \
    --dry-run=client -o yaml | kubectl apply -f -
  kubectl -n kubeflow create secret generic label-studio-postgres \
    --from-literal=DJANGO_DB=postgresql \
    --from-literal=POSTGRE_USER="$POSTGRES_USER" \
    --from-literal=POSTGRE_PASSWORD="$POSTGRES_PASSWORD" \
    --from-literal=POSTGRE_NAME=label_studio \
    --from-literal=POSTGRE_HOST=pm-postgresql.kubeflow.svc.cluster.local \
    --from-literal=POSTGRE_PORT=5432 \
    --dry-run=client -o yaml | kubectl apply -f -

  local keycloak_admin_token keycloak_user_id keycloak_user_patch
  keycloak_admin_token="$(curl -fsS -X POST \
    "${KEYCLOAK_PUBLIC_URL}/realms/master/protocol/openid-connect/token" \
    -d client_id=admin-cli -d grant_type=password \
    -d username="$KEYCLOAK_ADMIN_USER" -d password="$KEYCLOAK_ADMIN_PASSWORD" \
    | jq -r '.access_token // empty')"
  [[ -n "$keycloak_admin_token" ]] || { echo "Keycloak 관리 토큰 발급 실패" >&2; return 1; }
  keycloak_user_id="$(curl -fsS -G \
    -H "Authorization: Bearer ${keycloak_admin_token}" \
    --data-urlencode "username=${VERIFICATION_ADMIN_EMAIL}" \
    --data-urlencode exact=true \
    "${KEYCLOAK_PUBLIC_URL}/admin/realms/kubeflow/users" \
    | jq -r '.[0].id // empty')"
  [[ -n "$keycloak_user_id" ]] || { echo "Keycloak 검수 사용자를 찾지 못했습니다." >&2; return 1; }
  keycloak_user_patch="$(jq -n --arg username "$VERIFICATION_ADMIN_EMAIL" \
    '{username: $username, email: $username, firstName: "Verification",
      lastName: "Admin", enabled: true, emailVerified: true, requiredActions: []}')"
  curl -fsS -X PUT -H "Authorization: Bearer ${keycloak_admin_token}" \
    -H 'Content-Type: application/json' -d "$keycloak_user_patch" \
    "${KEYCLOAK_PUBLIC_URL}/admin/realms/kubeflow/users/${keycloak_user_id}"

  patch_dex_for_keycloak
  curl -fsS --retry 20 --retry-delay 5 \
    "${KEYCLOAK_PUBLIC_URL}/realms/kubeflow/.well-known/openid-configuration" >/dev/null
  local token
  token="$(curl -fsS -X POST "${KEYCLOAK_PUBLIC_URL}/realms/kubeflow/protocol/openid-connect/token" \
    -d client_id=kubeflow-dex -d client_secret="$KEYCLOAK_DEX_CLIENT_SECRET" \
    -d grant_type=password -d username="$VERIFICATION_ADMIN_EMAIL" \
    -d password="$VERIFICATION_ADMIN_PASSWORD" | jq -r '.access_token // empty')"
  [[ -n "$token" ]] || { echo "Keycloak 검수 사용자 토큰 발급 실패" >&2; return 1; }
  record PASS "Keycloak OIDC" "Kubeflow Dex connector와 검수 사용자 토큰"
}

install_monitoring_stack() {
  if ! bool_true "$INSTALL_MONITORING"; then
    record SKIP "Prometheus/DCGM" "INSTALL_MONITORING=false"
    return
  fi
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts >/dev/null 2>&1 || true
  if bool_true "$INSTALL_NVIDIA_TOOLKIT"; then
    helm repo add nvidia-dcgm https://nvidia.github.io/dcgm-exporter/helm-charts >/dev/null 2>&1 || true
    helm repo update prometheus-community nvidia-dcgm
  else
    helm repo update prometheus-community
  fi
  helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
    --namespace monitoring --create-namespace \
    --version "$KUBE_PROMETHEUS_STACK_VERSION" \
    --values "${PROJECT_ROOT}/k8s/verification/monitoring-values.yaml"
  wait_rollout_if_exists monitoring deployment kube-prometheus-stack-operator 900s
  wait_resource_exists monitoring statefulset prometheus-kube-prometheus-stack-prometheus 120 5
  wait_rollout_if_exists monitoring statefulset prometheus-kube-prometheus-stack-prometheus 900s
  if bool_true "$INSTALL_NVIDIA_TOOLKIT"; then
    helm upgrade --install dcgm-exporter nvidia-dcgm/dcgm-exporter \
      --namespace monitoring --version "$DCGM_EXPORTER_VERSION" \
      --set serviceMonitor.enabled=true \
      --set 'arguments[0]=-f' \
      --set 'arguments[1]=/etc/dcgm-exporter/default-counters.csv'
    wait_rollout_if_exists monitoring daemonset dcgm-exporter 900s
  else
    record SKIP "DCGM Exporter" "CPU 전용 구성"
  fi
  if kubectl -n monitoring get deployment -l app.kubernetes.io/name=grafana -o name | grep -q .; then
    echo "검수 프로파일에는 Grafana가 생성되면 안 됩니다." >&2
    return 1
  fi
}

install_node_runtime() {
  if command -v node >/dev/null 2>&1 &&
    [[ "$(node -p 'process.versions.node.split(`.`)[0]')" == "$NODE_MAJOR_VERSION" ]]; then
    return
  fi
  local temp_dir asset base_url archive checksum
  temp_dir="$(mktemp -d)"
  base_url="https://nodejs.org/dist/latest-v${NODE_MAJOR_VERSION}.x"
  asset="$(curl -fsSL "${base_url}/" \
    | grep -oE "node-v${NODE_MAJOR_VERSION}[^\"]+-linux-x64.tar.xz" \
    | head -n 1)"
  [[ -n "$asset" ]] || { echo "Node.js ${NODE_MAJOR_VERSION} linux-x64 asset을 찾지 못했습니다." >&2; return 1; }
  curl -fsSLo "${temp_dir}/${asset}" "${base_url}/${asset}"
  curl -fsSLo "${temp_dir}/SHASUMS256.txt" "${base_url}/SHASUMS256.txt"
  checksum="$(grep " ${asset}$" "${temp_dir}/SHASUMS256.txt")"
  [[ -n "$checksum" ]] || { echo "Node.js checksum을 찾지 못했습니다: $asset" >&2; return 1; }
  (cd "$temp_dir" && printf '%s\n' "$checksum" | sha256sum -c -)
  tar -xJf "${temp_dir}/${asset}" -C /opt
  ln -sfn "/opt/${asset%.tar.xz}" "/opt/node-v${NODE_MAJOR_VERSION}"
  ln -sfn "/opt/node-v${NODE_MAJOR_VERSION}/bin/node" /usr/local/bin/node
  ln -sfn "/opt/node-v${NODE_MAJOR_VERSION}/bin/npm" /usr/local/bin/npm
  ln -sfn "/opt/node-v${NODE_MAJOR_VERSION}/bin/npx" /usr/local/bin/npx
  node --version
  npm --version
}

build_and_push_images() {
  export DOCKER_BUILDKIT=1
  ensure_local_registry
  local pm_image="${REGISTRY_HOST}/${PM_IMAGE_TAG}"
  local mlflow_image="${REGISTRY_HOST}/${MLFLOW_IMAGE_TAG}"
  local ray_image="${REGISTRY_HOST}/${RAY_IMAGE_TAG}"
  local nifi_image="${REGISTRY_HOST}/${NIFI_IMAGE_TAG}"
  local label_image="${REGISTRY_HOST}/${LABEL_STUDIO_IMAGE_TAG}"
  docker buildx version
  docker buildx build --load --pull -t "$pm_image" "$PREDICTION_MANAGER_ROOT"
  if bool_true "$BUILD_AUXILIARY_IMAGES"; then
    docker buildx build --load --pull \
      -f "${PREDICTION_MANAGER_ROOT}/docker/mlflow-postgres.Dockerfile" \
      -t "$mlflow_image" "$PREDICTION_MANAGER_ROOT"
    docker buildx build --load --pull --build-arg "RAY_BASE_IMAGE=${RAY_BASE_IMAGE}" \
      -t "$ray_image" "${PROJECT_ROOT}/docker/ray-mlflow"
    docker buildx build --load --pull -t "$nifi_image" \
      "${PREDICTION_MANAGER_ROOT}/docker/nifi-python"
    docker pull heartexlabs/label-studio:1.18.0
    docker tag heartexlabs/label-studio:1.18.0 "$label_image"
  fi
  if bool_true "$BUILD_FRONTEND_IMAGE"; then
    install_node_runtime
    (
      cd "$PREDICTION_MANAGER_FRONTEND_ROOT"
      HUSKY=0 npm ci
      CI=false npm run build
    )
    local frontend_image="${REGISTRY_HOST}/${FRONTEND_IMAGE_TAG}"
    docker buildx build --load --pull -t "$frontend_image" \
      "$PREDICTION_MANAGER_FRONTEND_ROOT"
    docker push "$frontend_image"
  fi
  docker push "$pm_image"
  if bool_true "$BUILD_AUXILIARY_IMAGES"; then
    docker push "$mlflow_image"
    docker push "$ray_image"
    docker push "$nifi_image"
    docker push "$label_image"
  fi
  docker run --rm --entrypoint python "$pm_image" -m compileall -q /app/app
  docker run --rm --entrypoint python "$pm_image" -c \
    'import fastapi, kubernetes, mlflow, ray, sqlalchemy, uvicorn; print("imports: ok")'
}

write_prediction_manager_env() {
  local ray_gpu_worker_enabled=false
  if bool_true "$INSTALL_NVIDIA_TOOLKIT" && nvidia-smi >/dev/null 2>&1; then
    ray_gpu_worker_enabled=true
    detect_gpu_hardware
  fi
  cat > "${GENERATED_DIR}/prediction-manager.env" <<EOF
REGISTRY_HOST=${REGISTRY_HOST}
REGISTRY_URL=${REGISTRY_POD_URL}
PM_IMAGE_TAG=${PM_IMAGE_TAG}
MLFLOW_IMAGE_TAG=${MLFLOW_IMAGE_TAG}
DEFAULT_NAMESPACE=kubeflow-user-example-com
KUBEFLOW_URL=${KUBEFLOW_URL}
PROMETHEUS_URL=http://kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090
DATASET_INTERNAL_BASE_URL=http://istio-ingressgateway.istio-system.svc.cluster.local/prediction-manager
FEEDBACK_DATASET_INTERNAL_BASE_URL=http://istio-ingressgateway.istio-system.svc.cluster.local/prediction-manager
LABEL_STUDIO_URL=http://label-studio.kubeflow.svc.cluster.local
LABEL_STUDIO_API_TOKEN=
ADMIN_EMAILS=${VERIFICATION_ADMIN_EMAIL}
ALLOW_UNAUTHENTICATED=true
DEV_USER_EMAIL=${VERIFICATION_ADMIN_EMAIL}
PM_TENANT_IMAGE_REGISTRY=${REGISTRY_HOST}
PM_TENANT_MLFLOW_IMAGE=${REGISTRY_HOST}/${MLFLOW_IMAGE_TAG}
PM_TENANT_RAY_IMAGE=${REGISTRY_HOST}/${RAY_IMAGE_TAG}
PM_TENANT_RAY_CPU_WORKER_ENABLED=true
PM_TENANT_RAY_CPU_WORKER_MAX_REPLICAS=1
PM_TENANT_RAY_CPU_WORKER_REQUEST_CPU=500m
PM_TENANT_RAY_CPU_WORKER_REQUEST_MEMORY=1Gi
PM_TENANT_RAY_CPU_WORKER_LIMIT_CPU=1
PM_TENANT_RAY_CPU_WORKER_LIMIT_MEMORY=2Gi
PM_TENANT_RAY_GPU_WORKER_ENABLED=${ray_gpu_worker_enabled}
PM_TENANT_RAY_GPU_WORKER_MAX_REPLICAS=${PM_TENANT_RAY_GPU_WORKER_MAX_REPLICAS}
PM_TENANT_RAY_GPU_WORKER_REQUEST_CPU=250m
PM_TENANT_RAY_GPU_WORKER_REQUEST_MEMORY=1Gi
PM_TENANT_RAY_GPU_WORKER_REQUEST_GPU=1
PM_TENANT_RAY_GPU_WORKER_LIMIT_CPU=1
PM_TENANT_RAY_GPU_WORKER_LIMIT_MEMORY=3Gi
PM_TENANT_RAY_GPU_WORKER_LIMIT_GPU=1
PM_TENANT_NIFI_IMAGE=${REGISTRY_HOST}/${NIFI_IMAGE_TAG}
PM_TENANT_NIFI_RUN_AS_USER=1000
PM_TENANT_NIFI_RUN_AS_GROUP=1000
PM_TENANT_NIFI_FS_GROUP=1000
PM_PROVISIONER_IMAGE=${REGISTRY_HOST}/${PM_IMAGE_TAG}
PM_TENANT_STORAGE_CLASS=${STORAGE_CLASS}
PM_TENANT_MLFLOW_STORAGE_CLASS=${STORAGE_CLASS}
PM_TENANT_NIFI_STORAGE_CLASS=${STORAGE_CLASS}
PM_JUPYTER_CONFIGMAP_NAME=
PM_JUPYTER_CONFIGMAP_NAMESPACE=kubeflow
PM_JUPYTER_WEB_APP_DEPLOYMENT=jupyter-web-app-deployment
MODEL_STORE_ROOT=/models
MODEL_STORE_BACKEND=pvc
DATASET_STORE_ROOT=/datasets
DOCKER_SOCKET=unix:///var/run/docker.sock
GPU_MODEL=${GPU_MODEL:-Unknown GPU}
GPU_VRAM_GB=${GPU_VRAM_GIB:-0}
GPU_PHYSICAL_COUNT=${GPU_PHYSICAL_COUNT:-0}
GPU_DRIVER_VERSION=${GPU_DRIVER_VERSION:-}
EOF
  chmod 600 "${GENERATED_DIR}/prediction-manager.env"
}

render_label_studio() {
  python3 - "${PREDICTION_MANAGER_ROOT}/k8s/optional/label-studio.yaml" \
    "${GENERATED_DIR}/label-studio.yaml" "${REGISTRY_HOST}/${LABEL_STUDIO_IMAGE_TAG}" \
    "$KUBEFLOW_URL" "$LABEL_STUDIO_PUBLIC_URL" "$VERIFICATION_ADMIN_EMAIL" <<'PY'
import sys
from pathlib import Path

source, output, image, base_url, label_public_url, admin_email = sys.argv[1:]
text = Path(source).read_text(encoding="utf-8")
text = text.replace("registry.example.local:5000/label-studio:latest", image)
text = text.replace("https://kubeflow.example.local/label-studio", label_public_url)
text = text.replace("https://kubeflow.example.local", base_url)
text = text.replace('value: "1"\n            - name: LOGOUT_REDIRECT_URL', 'value: "0"\n            - name: LOGOUT_REDIRECT_URL')
text = text.replace("x-forwarded-proto: https", "x-forwarded-proto: http")
text = text.replace("admin@example.com", admin_email)
Path(output).write_text(text, encoding="utf-8")
PY
}

deploy_prediction_manager() {
  load_or_create_secrets
  write_prediction_manager_env
  "${PROJECT_ROOT}/scripts/render-manifests.sh" "${GENERATED_DIR}/prediction-manager.env"
  kubectl apply -f "${PREDICTION_MANAGER_ROOT}/k8s/rbac.yaml"
  kubectl apply -f "${PREDICTION_MANAGER_ROOT}/k8s/model-store-pvc.yaml"
  kubectl apply -f "${PREDICTION_MANAGER_ROOT}/k8s/dataset-store-pvc.yaml"
  kubectl apply -f "${PREDICTION_MANAGER_ROOT}/k8s/service.yaml"
  kubectl apply -f "${PREDICTION_MANAGER_ROOT}/k8s/virtualservice.yaml"
  kubectl apply -f "${PREDICTION_MANAGER_ROOT}/k8s/networkpolicy.yaml"
  kubectl apply -f "${PROJECT_ROOT}/k8s/deployment.yaml"
  if bool_true "$ENABLE_DOCKER_SOCKET"; then
    [[ -S /var/run/docker.sock ]] || { echo "/var/run/docker.sock이 없습니다." >&2; return 1; }
    kubectl -n kubeflow patch deployment prediction-manager --type strategic \
      --patch-file "${PREDICTION_MANAGER_ROOT}/k8s/optional/docker-socket-patch.yaml"
  fi
  wait_rollout_if_exists kubeflow deployment prediction-manager 1200s

  if bool_true "$INSTALL_LABEL_STUDIO"; then
    render_label_studio
    kubectl apply -f "${GENERATED_DIR}/label-studio.yaml"
    wait_rollout_if_exists kubeflow deployment label-studio 1200s
  else
    record SKIP "Label Studio" "INSTALL_LABEL_STUDIO=false"
  fi
}

start_port_forward() {
  local namespace="$1" service="$2" mapping="$3" log_name="$4"
  kubectl -n "$namespace" port-forward "service/${service}" "$mapping" \
    > "${RESULT_DIR}/${log_name}.log" 2>&1 &
  local pid=$!
  FORWARD_PIDS+=("$pid")
  sleep 2
  kill -0 "$pid" 2>/dev/null || { cat "${RESULT_DIR}/${log_name}.log" >&2; return 1; }
}

provision_tenant_resources() {
  if ! bool_true "$PROVISION_DEFAULT_TENANT"; then
    record SKIP "기본 tenant 리소스" "PROVISION_DEFAULT_TENANT=false"
    return
  fi
  start_port_forward kubeflow prediction-manager "${PM_HEALTHCHECK_PORT}:80" pm-port-forward
  curl -fsS --retry 30 --retry-delay 2 "http://127.0.0.1:${PM_HEALTHCHECK_PORT}/" >/dev/null
  curl -fsS -X POST \
    -H "kubeflow-userid: ${VERIFICATION_ADMIN_EMAIL}" \
    "http://127.0.0.1:${PM_HEALTHCHECK_PORT}/api/admin/users/kubeflow-user-example-com/tenant-resources/reconcile" \
    > "${RESULT_DIR}/tenant-reconcile.json"
  jq -e '.status == "reconciled"' "${RESULT_DIR}/tenant-reconcile.json" >/dev/null
  wait_rollout_if_exists kubeflow-user-example-com deployment pm-mlflow 1200s
  wait_rollout_if_exists kubeflow-user-example-com statefulset nifi 1200s
  for _ in $(seq 1 120); do
    if kubectl -n kubeflow-user-example-com get pod -l ray.io/node-type=head \
      -o json | jq -e 'any(.items[]?; any(.status.conditions[]?; .type == "Ready" and .status == "True"))' >/dev/null; then
      break
    fi
    sleep 5
  done
  kubectl -n kubeflow-user-example-com get pod -l ray.io/node-type=head \
    -o json | jq -e 'any(.items[]?; any(.status.conditions[]?; .type == "Ready" and .status == "True"))' >/dev/null
}

wait_for_access_port() {
  local port="$1" name="$2" attempt localhost_ready node_ready
  for attempt in $(seq 1 60); do
    localhost_ready=false
    node_ready=false
    (exec 9<>"/dev/tcp/127.0.0.1/${port}") 2>/dev/null && localhost_ready=true
    (exec 9<>"/dev/tcp/${NODE_IP}/${port}") 2>/dev/null && node_ready=true
    if [[ "$localhost_ready" == true && "$node_ready" == true ]]; then
      record PASS "${name} 포트" "127.0.0.1/${NODE_IP}:${port} listening"
      return 0
    fi
    sleep 2
  done
  echo "${name} 포트가 120초 안에 열리지 않았습니다: ${port}" >&2
  return 1
}

configure_host_firewall_ports() {
  bool_true "$CONTAINER_MODE" && {
    record SKIP "호스트 방화벽" "컨테이너 외부 Docker 호스트에서 관리"
    return 0
  }
  bool_true "$OPEN_HOST_FIREWALL_PORTS" || {
    record SKIP "호스트 방화벽" "OPEN_HOST_FIREWALL_PORTS=false"
    return 0
  }

  local port
  local -a ports=(15000 15001 15002 15003 18000 18080 19090 30080 30081)
  if command -v ufw >/dev/null 2>&1 \
      && LC_ALL=C ufw status 2>/dev/null | grep -q '^Status: active'; then
    for port in "${ports[@]}"; do
      ufw allow "${port}/tcp" comment 'Prediction Manager verification' >/dev/null
    done
    record PASS "호스트 UFW 포트" "${ports[*]}"
    return 0
  fi

  if command -v firewall-cmd >/dev/null 2>&1 \
      && systemctl is-active --quiet firewalld; then
    for port in "${ports[@]}"; do
      firewall-cmd --permanent --add-port="${port}/tcp" >/dev/null
    done
    firewall-cmd --reload >/dev/null
    record PASS "호스트 firewalld 포트" "${ports[*]}"
    return 0
  fi

  record PASS "호스트 방화벽" "활성 UFW/firewalld 없음; 서비스 리스닝 사용"
}

configure_service_access() {
  local service_dir runner pid_file old_pid frontend_image access_unit
  service_dir="$(service_state_dir)"
  runner="${service_dir}/port-forwards.sh"
  pid_file="${service_dir}/port-forwards.pid"
  mkdir -p "$service_dir"

  if bool_true "$BUILD_FRONTEND_IMAGE"; then
    frontend_image="${REGISTRY_HOST}/${FRONTEND_IMAGE_TAG}"
    docker rm -f fedit-fe >/dev/null 2>&1 || true
    docker run -d --restart=unless-stopped --name fedit-fe -p 0.0.0.0:18080:80 \
      --add-host=host.docker.internal:host-gateway \
      -e NDXPRO_ENV_PREDICTION_MANAGER_URL=/prediction-manager/ \
      -e NDXPRO_ENV_KUBEFLOW_URL=http://__BROWSER_HOST__:30080 \
      -e NDXPRO_ENV_MLFLOW_URL=http://__BROWSER_HOST__:15000 \
      -e NDXPRO_ENV_RAY_URL=http://__BROWSER_HOST__:15002 \
      -e NDXPRO_ENV_NIFI_URL=http://__BROWSER_HOST__:15001/nifi/ \
      -v "${PREDICTION_MANAGER_FRONTEND_ROOT}/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
      "$frontend_image" >/dev/null
    record PASS "FeDiT 프런트엔드 실행" "http://${NODE_IP}:18080"
  fi

  cleanup
  FORWARD_PIDS=()
  cat > "$runner" <<'EOF_PORT_FORWARD_RUNNER'
#!/usr/bin/env bash
set -u
umask 022
export KUBECONFIG=/etc/kubernetes/admin.conf
state_dir=/opt/prediction-manager-verification/services/port-forward-pids
mkdir -p "$state_dir"
exec 8>/opt/prediction-manager-verification/services/port-forwards.lock
flock -n 8 || exit 0
specs=(
  'kubeflow|prediction-manager|18000:80|pm'
  'monitoring|kube-prometheus-stack-prometheus|19090:9090|prometheus'
  'kubeflow-user-example-com|pm-mlflow|15000:5000|mlflow'
  'kubeflow-user-example-com|nifi|15001:8080|nifi'
  'kubeflow-user-example-com|pm-ray-head-svc|15002:8265|ray'
  'kubeflow|label-studio|15003:80|label-studio'
)
cleanup_children() {
  local file pid
  for file in "$state_dir"/*.pid; do
    [[ -e "$file" ]] || continue
    pid="$(cat "$file" 2>/dev/null || true)"
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
  done
}
shutdown_runner() {
  trap - EXIT INT TERM
  cleanup_children
  exit 0
}
trap cleanup_children EXIT
trap shutdown_runner INT TERM
while true; do
  for spec in "${specs[@]}"; do
    IFS='|' read -r namespace service mapping name <<<"$spec"
    pid_file="${state_dir}/${name}.pid"
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      continue
    fi
    kubectl -n "$namespace" get "service/$service" >/dev/null 2>&1 || continue
    kubectl -n "$namespace" port-forward --address=0.0.0.0 \
      "service/$service" "$mapping" \
      >>"/opt/prediction-manager-verification/services/${name}-forward.log" 2>&1 8>&- &
    printf '%s\n' "$!" >"$pid_file"
  done
  sleep 3
done
EOF_PORT_FORWARD_RUNNER
  # The runner template stays literal so its runtime variables are not
  # expanded while generating it. Replace only the state directory with this
  # installation profile's configured location.
  sed -i "s#/opt/prediction-manager-verification/services#${service_dir}#g" "$runner"
  chmod 755 "$runner"

  # Stop every runner left by an older install or container restart. Relying
  # on one pid file allows duplicate runners to race and briefly close ports.
  if systemd_available && systemctl list-unit-files prediction-manager-access.service \
      >/dev/null 2>&1; then
    systemctl stop prediction-manager-access.service >/dev/null 2>&1 || true
  fi
  while read -r old_pid; do
    [[ -n "$old_pid" ]] && kill "$old_pid" 2>/dev/null || true
  done < <(pgrep -f "^(/bin/)?bash ${runner}$" 2>/dev/null || true)
  if [[ -s "$pid_file" ]]; then
    old_pid="$(cat "$pid_file")"
    kill "$old_pid" 2>/dev/null || true
  fi
  sleep 1
  # Legacy runners handled TERM without exiting. Force-stop only survivors;
  # this occurs before the replacement runner is started.
  while read -r old_pid; do
    [[ -n "$old_pid" ]] && kill -KILL "$old_pid" 2>/dev/null || true
  done < <(pgrep -f "^(/bin/)?bash ${runner}$" 2>/dev/null || true)
  # Also remove orphaned kubectl port-forwards whose parent runner was killed.
  # They otherwise keep both the TCP ports and an inherited lock descriptor.
  while read -r old_pid; do
    [[ -n "$old_pid" ]] && kill "$old_pid" 2>/dev/null || true
  done < <(pgrep -f '^kubectl -n .+ port-forward( --address=0\.0\.0\.0)? service/(prediction-manager|kube-prometheus-stack-prometheus|pm-mlflow|nifi|pm-ray-head-svc|label-studio) ' 2>/dev/null || true)
  sleep 1
  while read -r old_pid; do
    [[ -n "$old_pid" ]] && kill -KILL "$old_pid" 2>/dev/null || true
  done < <(pgrep -f '^kubectl -n .+ port-forward( --address=0\.0\.0\.0)? service/(prediction-manager|kube-prometheus-stack-prometheus|pm-mlflow|nifi|pm-ray-head-svc|label-studio) ' 2>/dev/null || true)

  if systemd_available; then
    access_unit=/etc/systemd/system/prediction-manager-access.service
    cat > "$access_unit" <<EOF_ACCESS_UNIT
[Unit]
Description=Prediction Manager host access port forwards
After=network-online.target docker.service containerd.service kubelet.service
Wants=network-online.target

[Service]
Type=simple
ExecStart=${runner}
Restart=always
RestartSec=5
KillMode=control-group

[Install]
WantedBy=multi-user.target
EOF_ACCESS_UNIT
    chmod 0644 "$access_unit"
    systemctl daemon-reload
    systemctl enable prediction-manager-access.service >/dev/null
    systemctl restart prediction-manager-access.service
    record PASS "호스트 포트포워딩 서비스" "systemd 자동 시작"
  else
    nohup setsid "$runner" </dev/null >>"${service_dir}/port-forwards.log" 2>&1 &
    printf '%s\n' "$!" > "$pid_file"
    record PASS "컨테이너 포트포워딩 프로세스" "entrypoint 재시작 연동"
  fi

  configure_host_firewall_ports
  wait_for_access_port 18000 "Prediction Manager"
  if bool_true "$PROVISION_DEFAULT_TENANT"; then
    wait_for_access_port 15000 "MLflow"
    wait_for_access_port 15001 "NiFi"
    wait_for_access_port 15002 "Ray Dashboard"
  fi
  bool_true "$INSTALL_LABEL_STUDIO" && wait_for_access_port 15003 "Label Studio"
  bool_true "$INSTALL_MONITORING" && wait_for_access_port 19090 "Prometheus"
  bool_true "$BUILD_FRONTEND_IMAGE" && wait_for_access_port 18080 "FeDiT"
  record PASS "서비스 접근 포트" "15000-15003, 18000, 18080, 19090"
}

final_validation() {
  kubectl wait --for=condition=Ready nodes --all --timeout=300s
  kubectl get storageclass "$STORAGE_CLASS" >/dev/null
  kubectl get crd profiles.kubeflow.org notebooks.kubeflow.org \
    inferenceservices.serving.kserve.io rayclusters.ray.io >/dev/null
  kubectl -n kubeflow get service ml-pipeline prediction-manager >/dev/null
  kubectl -n kubeflow get deployment prediction-manager >/dev/null
  kubectl -n kubeflow get pvc prediction-manager-model-store prediction-manager-dataset-store >/dev/null
  kubectl -n kubeflow exec statefulset/pm-postgresql -- \
    env PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d prediction_manager \
    -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" \
    > "${RESULT_DIR}/prediction-manager-table-count.txt"
  local table_count
  table_count="$(tr -dc '0-9' < "${RESULT_DIR}/prediction-manager-table-count.txt")"
  ((table_count > 0)) || { echo "Prediction Manager DB 테이블이 생성되지 않았습니다." >&2; return 1; }
  record PASS "PostgreSQL schema" "prediction_manager public table ${table_count}개"

  if ! printf '%s\n' "${FORWARD_PIDS[@]:-}" | grep -q .; then
    start_port_forward kubeflow prediction-manager "${PM_HEALTHCHECK_PORT}:80" pm-port-forward-final
  fi
  curl -fsS "http://127.0.0.1:${PM_HEALTHCHECK_PORT}/healthz" \
    > "${RESULT_DIR}/prediction-manager-healthz.json"
  jq -e '.status == "ok"' "${RESULT_DIR}/prediction-manager-healthz.json" >/dev/null
  curl -fsS "http://127.0.0.1:${PM_HEALTHCHECK_PORT}/api/user-info" \
    > "${RESULT_DIR}/user-info.json"
  jq -e --arg email "$VERIFICATION_ADMIN_EMAIL" \
    '.email == $email and .is_admin == true and .namespace == "kubeflow-user-example-com"' \
    "${RESULT_DIR}/user-info.json" >/dev/null
  record PASS "Prediction Manager HTTP/API" "관리자와 namespace 확인"

  if bool_true "$INSTALL_MONITORING"; then
    start_port_forward monitoring kube-prometheus-stack-prometheus \
      "${PROMETHEUS_HEALTHCHECK_PORT}:9090" prometheus-port-forward
    curl -fsS --retry 20 --retry-delay 2 \
      "http://127.0.0.1:${PROMETHEUS_HEALTHCHECK_PORT}/-/ready" >/dev/null
    curl -fsSG "http://127.0.0.1:${PROMETHEUS_HEALTHCHECK_PORT}/api/v1/query" \
      --data-urlencode 'query=up' | jq -e '.status == "success"' >/dev/null
    record PASS "Prometheus" "ready 및 PromQL query"
  fi

  curl -fsS "${REGISTRY_URL}/v2/_catalog" > "${RESULT_DIR}/registry-catalog.json"
  jq -e '.repositories | length >= 5' "${RESULT_DIR}/registry-catalog.json" >/dev/null
  record PASS "로컬 Registry" "프로젝트 이미지 5종 이상"
  if bool_true "$BUILD_FRONTEND_IMAGE"; then
    jq -e --arg image "${FRONTEND_IMAGE_TAG%:*}" \
      '.repositories | index($image) != null' "${RESULT_DIR}/registry-catalog.json" >/dev/null
    record PASS "FeDiT 프런트엔드 이미지" "$FRONTEND_IMAGE_TAG"
  fi

  local gateway_status gateway_body="${RESULT_DIR}/kubeflow-gateway.html"
  gateway_status="$(curl -sS -o "$gateway_body" -w '%{http_code}' --max-time 10 "${KUBEFLOW_URL}/")"
  if [[ "$gateway_status" == "403" ]]; then
    # Kubeflow oauth2-proxy can return its Sign In page with HTTP 403 before a
    # session exists. Treat only that identifiable authentication response as
    # healthy; an arbitrary 403 from Istio must still fail verification.
    grep -Eqi '<title>[[:space:]]*Sign In[[:space:]]*</title>|/oauth2/(start|sign_in)' "$gateway_body" || {
      echo "Kubeflow gateway HTTP 403 without the expected Sign In page" >&2
      return 1
    }
  elif [[ ! "$gateway_status" =~ ^(200|302|303)$ ]]; then
    echo "Kubeflow gateway HTTP ${gateway_status}" >&2
    return 1
  fi
  record PASS "Kubeflow Gateway" "${KUBEFLOW_URL} HTTP ${gateway_status}"

  if bool_true "$PROVISION_DEFAULT_TENANT"; then
    kubectl -n kubeflow-user-example-com get deployment pm-mlflow >/dev/null
    kubectl -n kubeflow-user-example-com get statefulset nifi >/dev/null
    kubectl -n kubeflow-user-example-com get raycluster pm-ray >/dev/null
    record PASS "tenant 서비스" "MLflow, Ray, NiFi"
  fi

  local not_ready
  not_ready="$(kubectl get pods -A -o json | jq -r '[.items[] | select(.status.phase != "Succeeded") | select(.status.phase != "Running" or (any(.status.conditions[]?; .type == "Ready" and .status == "True") | not))] | length')"
  if ((not_ready > 0)); then
    kubectl get pods -A | tee "${RESULT_DIR}/pods.txt"
    record WARN "전체 Pod 상태" "Ready가 아닌 Pod ${not_ready}개; pods.txt 확인"
  else
    record PASS "전체 Pod 상태" "모두 Running/Ready 또는 Succeeded"
  fi

  cat > "${RESULT_DIR}/verification-credentials.txt" <<EOF
검수용 주소 및 계정

Kubeflow: ${KUBEFLOW_URL}
Prediction Manager: ${KUBEFLOW_URL}/prediction-manager/
Keycloak: ${KEYCLOAK_PUBLIC_URL}/admin/
검수 관리자 이메일: ${VERIFICATION_ADMIN_EMAIL}
검수 관리자 비밀번호: ${VERIFICATION_ADMIN_PASSWORD}
Keycloak 관리 계정: ${KEYCLOAK_ADMIN_USER}
Keycloak 관리 비밀번호: ${KEYCLOAK_ADMIN_PASSWORD}

이 값은 검수 전용입니다. 운영 배포에서 재사용하지 마세요.
EOF
  chmod 600 "${RESULT_DIR}/verification-credentials.txt"
  kubectl get nodes -o wide > "${RESULT_DIR}/nodes.txt"
  kubectl get pods -A > "${RESULT_DIR}/pods-final.txt"
  kubectl get pvc -A > "${RESULT_DIR}/pvc.txt"
  docker images --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.Size}}' \
    | grep -F "$REGISTRY_HOST" > "${RESULT_DIR}/images.txt" || true
}

if bool_true "$VALIDATE_ONLY"; then
  run_always "최종 기능 검증" final_validation
  run_always "서비스 접근 포트 구성" configure_service_access
  finish_report
  exit 0
fi

run_stage 00-preflight "사전 점검" preflight
if gpu_stack_enabled; then
  host_dependency_label="호스트 의존성 및 기존 NVIDIA driver 확인"
else
  host_dependency_label="호스트 의존성 (CPU 전용)"
fi
run_stage 10-host-dependencies "$host_dependency_label" host_dependencies

if bool_true "$DEPENDENCIES_ONLY"; then
  if gpu_stack_enabled; then
    dependency_mode_summary="NVIDIA driver는 변경하지 않음"
  else
    dependency_mode_summary="CPU 전용; NVIDIA 패키지를 설치하지 않음"
  fi
  record PASS "필수 모듈 일괄 설치" "서비스 실행 전 준비 완료; ${dependency_mode_summary}"
  finish_report
  echo
  echo "서비스 실행 전 필수 모듈 설치가 완료되었습니다."
  if gpu_stack_enabled; then
    echo "- NVIDIA driver: 기존 driver 확인만 수행(설치/업데이트 없음)"
    echo "- GPU 자동 탐지: ${GPU_PHYSICAL_COUNT:-0}개, ${GPU_MODEL:-미탐지}"
  else
    echo "- 실행 모드: CPU 전용"
    echo "- NVIDIA driver/toolkit/device plugin/DCGM: 설치 및 검사 생략"
  fi
  echo "- 다음 단계: ./${NEXT_START_SCRIPT}"
  echo "- 설치 보고서: ${REPORT_FILE}"
  exit 0
fi

run_stage 20-runtime "Docker/containerd/Registry 구성" configure_runtime
run_stage 30-kubernetes "Kubernetes 단일 노드 구성" install_kubernetes
run_stage 40-addons "Calico/StorageClass/Metrics Server" install_cluster_addons
if bool_true "$INSTALL_NVIDIA_TOOLKIT"; then
  gpu_stage_label="GPU Device Plugin과 Time-Slicing"
else
  gpu_stage_label="GPU 구성 생략 (CPU 전용)"
fi
run_stage 50-gpu "$gpu_stage_label" install_gpu_plugin
run_stage 60-kubeflow "Kubeflow/KFP/KServe/KubeRay" install_kubeflow
run_stage 70-data-services "PostgreSQL/Keycloak/OIDC" install_data_services
if bool_true "$INSTALL_NVIDIA_TOOLKIT"; then
  monitoring_stage_label="Prometheus/DCGM 모니터링"
else
  monitoring_stage_label="Prometheus 모니터링 (CPU 전용)"
fi
run_stage 80-monitoring "$monitoring_stage_label" install_monitoring_stack
run_always "프로젝트 이미지 빌드 및 Push" build_and_push_images
run_always "Prediction Manager/Label Studio 배포" deploy_prediction_manager
run_always "기본 tenant MLflow/Ray/NiFi 구성" provision_tenant_resources
run_always "최종 기능 검증" final_validation
run_always "서비스 접근 포트 구성" configure_service_access

systemctl disable prediction-manager-verification-resume.service >/dev/null 2>&1 || true
record PASS "자동 재개 서비스" "설치 완료 후 비활성화"
finish_report

cat <<EOF

전체 검수 환경 설치가 완료되었습니다.
- Kubeflow: ${KUBEFLOW_URL}
- Prediction Manager: ${KUBEFLOW_URL}/prediction-manager/
- 검수 계정: ${VERIFICATION_ADMIN_EMAIL}
- 비밀번호/상세 결과: ${RESULT_DIR}/verification-credentials.txt
- 검수 보고서: ${REPORT_FILE}

검수용 초기 비밀번호와 HTTP/NodePort 구성은 운영에 사용하지 마세요.
EOF
