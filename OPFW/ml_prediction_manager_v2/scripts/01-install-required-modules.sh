#!/usr/bin/env bash
set -Eeuo pipefail

on_entry_error() {
  local rc=$? line="${BASH_LINENO[0]:-unknown}"
  echo "[FAIL] 01 필수 모듈 설치 진입 실패 (line ${line}, exit ${rc})" >&2
  exit "$rc"
}
trap on_entry_error ERR

SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_ROOT}/.verification-install.env"

has_config=false
for arg in "$@"; do
  [[ "$arg" == "--config" ]] && has_config=true
done

if [[ "$has_config" == true ]]; then
  echo "[INFO] 지정한 설정으로 필수 모듈 설치를 시작합니다."
  exec "${SCRIPT_ROOT}/install-verification.sh" --dependencies-only "$@"
fi

echo "[INFO] 현재 PC용 자동 설정을 준비합니다."
"${SCRIPT_ROOT}/scripts/prepare-install-config.sh" "$CONFIG_FILE"
"${SCRIPT_ROOT}/scripts/diagnose-install-entry.sh" "$CONFIG_FILE"
echo "[INFO] 필수 모듈 설치를 시작합니다."
exec "${SCRIPT_ROOT}/install-verification.sh" \
  --config "$CONFIG_FILE" --dependencies-only "$@"
