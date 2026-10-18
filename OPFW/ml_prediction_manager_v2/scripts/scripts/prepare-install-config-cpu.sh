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
INSTALL_OWNER="${PM_INSTALL_ORIGINAL_USER:-${SUDO_USER:-$(id -un)}}"
INSTALL_OWNER_GROUP="$(id -gn "$INSTALL_OWNER")"

prepare_config_directory() {
  local config_dir owner_home user_config_root
  config_dir="$(dirname "$CONFIG_FILE")"
  owner_home="$(getent passwd "$INSTALL_OWNER" | cut -d: -f6)"
  user_config_root="${owner_home}/prediction-manager-work/.prediction-manager"
  if ((EUID == 0)); then
    case "$config_dir" in
      "$user_config_root"|"$user_config_root"/*)
        install -d -m 0700 -o "$INSTALL_OWNER" -g "$INSTALL_OWNER_GROUP" "$user_config_root"
        ;;
    esac
    install -d -m 0700 -o "$INSTALL_OWNER" -g "$INSTALL_OWNER_GROUP" "$config_dir"
  else
    case "$config_dir" in
      "$user_config_root"|"$user_config_root"/*)
        mkdir -p "$user_config_root"
        chmod 700 "$user_config_root"
        ;;
    esac
    mkdir -p "$config_dir"
    chmod 700 "$config_dir"
  fi
}

if [[ ! -f "$EXAMPLE_FILE" ]]; then
  echo "CPU 설치 설정 예시 파일을 찾을 수 없습니다: $EXAMPLE_FILE" >&2
  exit 1
fi

prepare_config_directory

if [[ ! -e "$CONFIG_FILE" ]]; then
  install -m 0600 "$EXAMPLE_FILE" "$CONFIG_FILE"
  if ((EUID == 0)); then
    chown "$INSTALL_OWNER:$INSTALL_OWNER_GROUP" "$CONFIG_FILE"
  fi
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
set_setting INSTALL_PROFILE cpu
set_setting INSTALL_NVIDIA_TOOLKIT false
set_setting VERIFY_DOCKER_GPU false
set_setting AUTO_REBOOT_AFTER_DRIVER false
set_setting GPU_TIME_SLICES 1
set_setting PM_TENANT_RAY_GPU_WORKER_MAX_REPLICAS 0
set_setting RAY_BASE_IMAGE rayproject/ray:2.54.1-py312
set_setting RAY_XGBOOST_PACKAGE xgboost-cpu
set_setting NEXT_START_SCRIPT 02-start-prediction-manager-cpu.sh
set_setting LOW_MEMORY_PROFILE true
set_setting CPU_SWAP_REQUIRED false
set_setting CHECK_MIN_CPU_CORES false

if ((EUID == 0)); then
  chown "$INSTALL_OWNER:$INSTALL_OWNER_GROUP" "$CONFIG_FILE"
fi
chmod 0600 "$CONFIG_FILE"
echo "CPU 전용 설정 준비 완료: NVIDIA 설치/검사 생략, Ray CPU 이미지, 모든 서비스를 유지하는 단일 노드 리소스 프로파일"
