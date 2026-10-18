#!/usr/bin/env bash
set -Eeuo pipefail

on_entry_error() {
  local rc=$? line="${BASH_LINENO[0]:-unknown}"
  echo "[FAIL] CPU 필수 모듈 설치 진입 실패 (line ${line}, exit ${rc})" >&2
  exit "$rc"
}
trap on_entry_error ERR

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
echo "[INFO] CPU 전용 설치 설정을 준비합니다."
PM_INSTALL_ORIGINAL_USER="$CALLING_USER" \
  "${SCRIPT_ROOT}/scripts/prepare-install-config-cpu.sh" "$CONFIG_FILE"
"${SCRIPT_ROOT}/scripts/diagnose-install-entry.sh" "$CONFIG_FILE"
echo "[INFO] CPU 전용 필수 모듈 설치를 시작합니다."
VERIFY_INSTALL_CONFIG="$CONFIG_FILE" exec "${SCRIPT_ROOT}/install-verification.sh" \
  --config "$CONFIG_FILE" --dependencies-only "${args[@]}"
