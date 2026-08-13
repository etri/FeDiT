#!/usr/bin/env bash
set -Eeuo pipefail

on_config_error() {
  local rc=$? line="${BASH_LINENO[0]:-unknown}"
  echo "[FAIL] CPU 전용 설치 설정 생성 실패 (line ${line}, exit ${rc})" >&2
  exit "$rc"
}
trap on_config_error ERR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${1:-${PROJECT_ROOT}/.verification-install-cpu.env}"
EXAMPLE_FILE="${PROJECT_ROOT}/verification-install-cpu.env.example"

if [[ ! -f "$EXAMPLE_FILE" ]]; then
  echo "CPU 설치 설정 예시 파일을 찾을 수 없습니다: $EXAMPLE_FILE" >&2
  exit 1
fi

if [[ ! -e "$CONFIG_FILE" ]]; then
  install -m 0600 "$EXAMPLE_FILE" "$CONFIG_FILE"
  echo "CPU 전용 설치 설정을 생성했습니다: $CONFIG_FILE"
fi

[[ -f "$CONFIG_FILE" ]] || {
  echo "CPU 설치 설정이 일반 파일이 아닙니다: $CONFIG_FILE" >&2
  exit 1
}

# Keep paths and addresses portable even when a config was copied from another
# machine, then force every GPU-related switch back to the CPU-safe values.
"${SCRIPT_DIR}/prepare-install-config.sh" "$CONFIG_FILE"

set_setting() {
  local name="$1" value="$2" temp_file
  temp_file="$(mktemp "${CONFIG_FILE}.tmp.XXXXXX")"
  awk -v name="$name" -v value="$value" '
    BEGIN { replaced = 0 }
    $0 ~ "^[[:space:]]*" name "[[:space:]]*=" {
      if (!replaced) {
        print name "=" value
        replaced = 1
      }
      next
    }
    { print }
    END { if (!replaced) print name "=" value }
  ' "$CONFIG_FILE" > "$temp_file"
  chmod --reference="$CONFIG_FILE" "$temp_file" 2>/dev/null || chmod 0600 "$temp_file"
  mv -f "$temp_file" "$CONFIG_FILE"
}

set_setting REQUIRE_NVIDIA_GPU false
set_setting INSTALL_NVIDIA_TOOLKIT false
set_setting VERIFY_DOCKER_GPU false
set_setting AUTO_REBOOT_AFTER_DRIVER false
set_setting GPU_TIME_SLICES 1
set_setting PM_TENANT_RAY_GPU_WORKER_MAX_REPLICAS 0
set_setting RAY_BASE_IMAGE rayproject/ray:2.54.1-py312
set_setting NEXT_START_SCRIPT 02-start-prediction-manager-cpu.sh
set_setting LOW_MEMORY_PROFILE auto
set_setting LOW_MEMORY_THRESHOLD_GIB 16

chmod 0600 "$CONFIG_FILE"
echo "CPU 전용 설정 준비 완료: NVIDIA 설치/검사 생략, Ray CPU 이미지, 16 GiB 미만 저메모리 자동 조정"
