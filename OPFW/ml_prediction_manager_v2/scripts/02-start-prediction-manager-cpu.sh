#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CALLING_USER="${PM_INSTALL_ORIGINAL_USER:-${SUDO_USER:-$(id -un)}}"
CALLING_HOME="$(getent passwd "$CALLING_USER" | cut -d: -f6)"
[[ -n "$CALLING_HOME" ]] || { echo "설치 사용자 홈 디렉터리를 찾을 수 없습니다: ${CALLING_USER}" >&2; exit 1; }
CONFIG_FILE="${CALLING_HOME}/prediction-manager-work/.prediction-manager/cpu/verification-install.env"
args=("$@")

for ((i = 0; i < ${#args[@]}; i++)); do
  if [[ "${args[$i]}" == "--config" ]]; then
    ((i + 1 < ${#args[@]})) || { echo "--config 뒤에 파일 경로가 필요합니다." >&2; exit 2; }
    CONFIG_FILE="${args[$((i + 1))]}"
    [[ "$CONFIG_FILE" == /* ]] || CONFIG_FILE="${SCRIPT_ROOT}/${CONFIG_FILE}"
    unset 'args[i]' 'args[i+1]'
    args=("${args[@]}")
    break
  fi
done

echo "[INFO] 설치 사용자: ${CALLING_USER} (${CALLING_HOME})"
PM_INSTALL_ORIGINAL_USER="$CALLING_USER" \
  "${SCRIPT_ROOT}/scripts/prepare-install-config-cpu.sh" "$CONFIG_FILE"
VERIFY_INSTALL_CONFIG="$CONFIG_FILE" \
  "${SCRIPT_ROOT}/install-verification.sh" --config "$CONFIG_FILE" "${args[@]}"
"${SCRIPT_ROOT}/scripts/check-service-entry.sh" "$CONFIG_FILE"
exec "${SCRIPT_ROOT}/scripts/show-access-urls.sh"
