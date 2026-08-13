#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_ROOT}/.verification-install-cpu.env"
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

"${SCRIPT_ROOT}/scripts/prepare-install-config-cpu.sh" "$CONFIG_FILE"
VERIFY_INSTALL_CONFIG="$CONFIG_FILE" \
  "${SCRIPT_ROOT}/install-verification.sh" --config "$CONFIG_FILE" "${args[@]}"
"${SCRIPT_ROOT}/scripts/check-service-entry.sh" "$CONFIG_FILE"
exec "${SCRIPT_ROOT}/scripts/show-access-urls.sh"
