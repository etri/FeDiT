#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${1:-${PROJECT_ROOT}/.verification-install.env}"

[[ -f "$CONFIG_FILE" ]] || {
  echo "[FAIL] 설치 설정 파일이 없습니다: $CONFIG_FILE" >&2
  exit 1
}

set -a
# shellcheck disable=SC1090
source "$CONFIG_FILE"
set +a

bool_true() {
  case "${1,,}" in
    1|true|yes|on) return 0 ;;
    *) return 1 ;;
  esac
}

backend_root="${PREDICTION_MANAGER_ROOT:-auto}"
frontend_root="${PREDICTION_MANAGER_FRONTEND_ROOT:-auto}"
[[ "$backend_root" == auto ]] && backend_root="${PROJECT_ROOT}/.."
[[ "$frontend_root" == auto ]] && frontend_root="${PROJECT_ROOT}/../../ml_prediction_manager_v2_frontend"
backend_root="$(readlink -m -- "$backend_root")"
frontend_root="$(readlink -m -- "$frontend_root")"

detected_ip="$(ip -4 route get 1.1.1.1 2>/dev/null \
  | awk '{for (i=1; i<=NF; i++) if ($i=="src") {print $(i+1); exit}}')"
if [[ -z "$detected_ip" ]]; then
  detected_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi

echo "[DIAG] 설정 파일: $CONFIG_FILE"
install_user="${PM_INSTALL_ORIGINAL_USER:-${SUDO_USER:-$(id -un)}}"
install_home="$(getent passwd "$install_user" | cut -d: -f6)"
[[ -n "$install_home" ]] || install_home="$HOME"
install_profile="${INSTALL_PROFILE:-gpu}"
install_work_dir="${INSTALL_WORK_DIR:-auto}"
[[ "$install_work_dir" == auto ]] && install_work_dir="${install_home}/prediction-manager-work"
install_state_root="${INSTALL_STATE_ROOT:-auto}"
[[ "$install_state_root" == auto ]] && install_state_root="${install_work_dir}/.prediction-manager/${install_profile}"
registry_data_dir="${REGISTRY_DATA_DIR:-auto}"
[[ "$registry_data_dir" == auto ]] && registry_data_dir="${install_state_root}/registry"
kubeflow_manifests_dir="${KUBEFLOW_MANIFESTS_DIR:-auto}"
[[ "$kubeflow_manifests_dir" == auto ]] && kubeflow_manifests_dir="${install_state_root}/kubeflow-manifests"
downloads_dir="${DOWNLOADS_DIR:-auto}"
[[ "$downloads_dir" == auto ]] && downloads_dir="${install_state_root}/downloads"
tooling_dir="${TOOLING_DIR:-auto}"
[[ "$tooling_dir" == auto ]] && tooling_dir="${install_state_root}/tooling"
echo "[DIAG] 설치 사용자: ${install_user} (${install_home})"
echo "[DIAG] 사용자 작업 경로: ${install_work_dir}"
echo "[DIAG] 설치 상태/결과: ${install_state_root}"
echo "[DIAG] Kubeflow 다운로드: ${kubeflow_manifests_dir}"
echo "[DIAG] 로컬 Registry 데이터: ${registry_data_dir}"
echo "[DIAG] 설치 다운로드: ${downloads_dir}"
echo "[DIAG] 설치 도구 파일: ${tooling_dir}"
echo "[DIAG] NODE_IP 설정: ${NODE_IP:-auto}"
echo "[DIAG] 현재 PC 감지 IP: ${detected_ip:-감지 실패}"
echo "[DIAG] 백엔드 소스: $backend_root"
echo "[DIAG] 프런트엔드 소스: $frontend_root"

[[ -f "${backend_root}/Dockerfile" ]] || {
  echo "[FAIL] 백엔드 소스 위치가 올바르지 않습니다: $backend_root" >&2
  exit 1
}
[[ -f "${frontend_root}/Dockerfile" ]] || {
  echo "[FAIL] 프런트엔드 소스 위치가 올바르지 않습니다: $frontend_root" >&2
  exit 1
}

state_root="${install_state_root}/state"
if [[ -e "${state_root%/state}" && ! -r "${state_root%/state}" ]]; then
  echo "[DIAG] 단계 상태: root 전용 디렉터리 — sudo 전환 후 SKIP/실행 여부 표시"
else
  for stage in 00-preflight 10-host-dependencies; do
    if [[ -f "${state_root}/${stage}.done" ]]; then
      echo "[DIAG] ${stage}: 이전 실행 완료 — 01 실행 시 SKIP이 정상"
    else
      echo "[DIAG] ${stage}: 이번 실행에서 수행 예정"
    fi
  done
fi

if ! bool_true "${REQUIRE_NVIDIA_GPU:-true}" \
    && ! bool_true "${INSTALL_NVIDIA_TOOLKIT:-true}"; then
  echo "[PASS] CPU 전용 모드: NVIDIA GPU/driver/toolkit 진입 검사 생략"
elif command -v nvidia-smi >/dev/null 2>&1 \
    && gpu_lines="$(nvidia-smi --query-gpu=index --format=csv,noheader 2>/dev/null)"; then
  gpu_count="$(wc -l <<<"$gpu_lines" | tr -d ' ')"
  echo "[DIAG] NVIDIA GPU: ${gpu_count}개 감지"
elif bool_true "${REQUIRE_NVIDIA_GPU:-true}"; then
  echo "[FAIL] nvidia-smi를 실행할 수 없습니다. 드라이버는 이 설치기가 설치하지 않습니다." >&2
  exit 1
else
  echo "[DIAG] NVIDIA GPU: 선택 사항이며 감지되지 않아 생략"
fi

echo "[PASS] 01 설치 진입 진단 완료"
