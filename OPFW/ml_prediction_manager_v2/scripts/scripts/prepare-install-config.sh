#!/usr/bin/env bash
set -Eeuo pipefail

on_config_error() {
  local rc=$? line="${BASH_LINENO[0]:-unknown}"
  echo "[FAIL] 이동 가능한 설치 설정 생성 실패 (line ${line}, exit ${rc})" >&2
  exit "$rc"
}
trap on_config_error ERR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${1:-${PROJECT_ROOT}/.verification-install.env}"
EXAMPLE_FILE="${PROJECT_ROOT}/verification-install.env.example"

# The entry scripts are normally launched with sudo by a non-root user. Keep
# configuration in that user's home directory and retain ownership after each
# rewrite so subsequent sudo and non-sudo inspection both work.
INSTALL_OWNER="${PM_INSTALL_ORIGINAL_USER:-${SUDO_USER:-$(id -un)}}"
INSTALL_OWNER_HOME="$(getent passwd "$INSTALL_OWNER" | cut -d: -f6)"
[[ -n "$INSTALL_OWNER_HOME" ]] || {
  echo "설치 사용자 홈 디렉터리를 찾을 수 없습니다: ${INSTALL_OWNER}" >&2
  exit 1
}
INSTALL_OWNER_GROUP="$(id -gn "$INSTALL_OWNER")"

prepare_config_directory() {
  local config_dir user_config_root
  config_dir="$(dirname "$CONFIG_FILE")"
  user_config_root="${INSTALL_OWNER_HOME}/prediction-manager-work/.prediction-manager"
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

ensure_config_owner() {
  if ((EUID == 0)); then
    chown "$INSTALL_OWNER:$INSTALL_OWNER_GROUP" "$CONFIG_FILE"
  fi
  chmod 600 "$CONFIG_FILE"
}

if [[ ! -f "$EXAMPLE_FILE" ]]; then
  echo "설치 설정 예시 파일을 찾을 수 없습니다: $EXAMPLE_FILE" >&2
  exit 1
fi

prepare_config_directory

if [[ ! -e "$CONFIG_FILE" ]]; then
  install -m 0600 "$EXAMPLE_FILE" "$CONFIG_FILE"
  ensure_config_owner
  echo "이동 가능한 설치 설정을 생성했습니다: $CONFIG_FILE"
fi

[[ -f "$CONFIG_FILE" ]] || {
  echo "설치 설정이 일반 파일이 아닙니다: $CONFIG_FILE" >&2
  exit 1
}

read_setting() {
  local name="$1"
  awk -F= -v name="$name" '
    $0 ~ "^[[:space:]]*" name "[[:space:]]*=" {
      sub(/^[^=]*=/, "")
      gsub(/^[[:space:]\047\042]+|[[:space:]\047\042]+$/, "")
      print
      exit
    }
  ' "$CONFIG_FILE"
}

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
    END {
      if (!replaced) print name "=" value
    }
  ' "$CONFIG_FILE" > "$temp_file"
  chmod --reference="$CONFIG_FILE" "$temp_file" 2>/dev/null || chmod 0600 "$temp_file"
  if ((EUID == 0)); then
    chown "$INSTALL_OWNER:$INSTALL_OWNER_GROUP" "$temp_file"
  fi
  mv -f "$temp_file" "$CONFIG_FILE"
}

# Previous verification runs wrote addresses and absolute source paths from the
# machine used to build the delivery. Portable mode replaces those derived
# values every time the default entry scripts run. Set either switch to false
# only when an administrator intentionally manages static values.
portable_network="$(read_setting PORTABLE_NETWORK_CONFIG)"
auto_source_paths="$(read_setting AUTO_DETECT_SOURCE_PATHS)"
portable_user_home="$(read_setting PORTABLE_USER_HOME_CONFIG)"

if [[ "${portable_network:-true}" != "false" ]]; then
  set_setting PORTABLE_NETWORK_CONFIG true
  set_setting NODE_IP auto
  set_setting CONTAINER_DNS_SERVERS auto
  set_setting LABEL_STUDIO_PUBLIC_URL auto
fi

if [[ "${auto_source_paths:-true}" != "false" ]]; then
  set_setting AUTO_DETECT_SOURCE_PATHS true
  set_setting PREDICTION_MANAGER_ROOT auto
  set_setting PREDICTION_MANAGER_FRONTEND_ROOT auto
fi

# Older deliveries used /opt for state, logs and the Kubeflow source clone.
# Refresh the default configuration on every run so a copied config cannot
# accidentally recreate a root-only installation layout on another PC.
if [[ "${portable_user_home:-true}" != "false" ]]; then
  set_setting PORTABLE_USER_HOME_CONFIG true
  set_setting INSTALL_WORK_DIR auto
  set_setting INSTALL_STATE_ROOT auto
  set_setting REGISTRY_DATA_DIR auto
  set_setting KUBEFLOW_MANIFESTS_DIR auto
  set_setting DOWNLOADS_DIR auto
  set_setting TOOLING_DIR auto
fi

ensure_config_owner
echo "설치 설정 준비 완료: 사용자=${INSTALL_OWNER}, NODE_IP=auto, DNS=auto, 소스 경로=auto"
