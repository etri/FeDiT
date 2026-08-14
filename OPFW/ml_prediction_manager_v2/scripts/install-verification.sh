#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALLER="${PROJECT_ROOT}/scripts/bootstrap-verification.sh"
CALLING_USER="${PM_INSTALL_ORIGINAL_USER:-${SUDO_USER:-$(id -un)}}"
CALLING_HOME="$(getent passwd "$CALLING_USER" | cut -d: -f6)"
[[ -n "$CALLING_HOME" ]] || CALLING_HOME="$HOME"
DEFAULT_CONFIG="${CALLING_HOME}/prediction-manager-work/.prediction-manager/gpu/verification-install.env"
CONFIG_TO_USE="${VERIFY_INSTALL_CONFIG:-$DEFAULT_CONFIG}"
args=("$@")
for ((i = 0; i < ${#args[@]}; i++)); do
  if [[ "${args[$i]}" == "--config" ]]; then
    ((i + 1 < ${#args[@]})) || { echo "--config 뒤에 파일 경로가 필요합니다." >&2; exit 2; }
    CONFIG_TO_USE="${args[$((i + 1))]}"
    [[ "$CONFIG_TO_USE" == /* ]] || CONFIG_TO_USE="${PROJECT_ROOT}/${CONFIG_TO_USE}"
    break
  fi
done

if [[ ! -x "$INSTALLER" ]]; then
  echo "전체 검수 설치기를 찾을 수 없습니다: $INSTALLER" >&2
  exit 1
fi

# Dry-run never changes the host and does not need elevated privileges.
for arg in "$@"; do
  if [[ "$arg" == "--dry-run" || "$arg" == "-h" || "$arg" == "--help" ]]; then
    exec "$INSTALLER" "$@"
  fi
done

if ((EUID == 0)); then
  export PM_INSTALL_ORIGINAL_USER="${PM_INSTALL_ORIGINAL_USER:-${SUDO_USER:-root}}"
  if [[ ! -e "$CONFIG_TO_USE" ]]; then
    PM_INSTALL_ORIGINAL_USER="$PM_INSTALL_ORIGINAL_USER" \
      "${PROJECT_ROOT}/scripts/prepare-install-config.sh" "$CONFIG_TO_USE"
  fi
  export VERIFY_INSTALL_CONFIG="$CONFIG_TO_USE"
  echo "사용할 설치 설정: ${VERIFY_INSTALL_CONFIG}"
  exec "$INSTALLER" "$@"
fi

echo "Ubuntu 시스템 패키지와 Kubernetes를 설치하기 위해 sudo 권한을 사용합니다."
echo "사용할 설치 설정: ${CONFIG_TO_USE}"
exec sudo env \
  PM_INSTALL_ORIGINAL_USER="${CALLING_USER}" \
  VERIFY_INSTALL_CONFIG="${CONFIG_TO_USE}" \
  "$INSTALLER" "$@"
