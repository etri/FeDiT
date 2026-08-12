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

state_root="${INSTALL_STATE_ROOT:-/opt/prediction-manager-verification}/state"
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

if command -v nvidia-smi >/dev/null 2>&1 \
    && gpu_lines="$(nvidia-smi --query-gpu=index --format=csv,noheader 2>/dev/null)"; then
  gpu_count="$(wc -l <<<"$gpu_lines" | tr -d ' ')"
  echo "[DIAG] NVIDIA GPU: ${gpu_count}개 감지"
else
  echo "[FAIL] nvidia-smi를 실행할 수 없습니다. 드라이버는 이 설치기가 설치하지 않습니다." >&2
  exit 1
fi

echo "[PASS] 01 설치 진입 진단 완료"
