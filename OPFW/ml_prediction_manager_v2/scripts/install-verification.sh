#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALLER="${PROJECT_ROOT}/scripts/bootstrap-verification.sh"

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
  echo "사용할 설치 설정: ${VERIFY_INSTALL_CONFIG:-${PROJECT_ROOT}/.verification-install.env}"
  exec "$INSTALLER" "$@"
fi

echo "Ubuntu 시스템 패키지와 Kubernetes를 설치하기 위해 sudo 권한을 사용합니다."
echo "사용할 설치 설정: ${VERIFY_INSTALL_CONFIG:-${PROJECT_ROOT}/.verification-install.env}"
CALLING_USER="${USER:-$(id -un)}"
exec sudo env \
  PM_INSTALL_ORIGINAL_USER="${CALLING_USER}" \
  VERIFY_INSTALL_CONFIG="${VERIFY_INSTALL_CONFIG:-${PROJECT_ROOT}/.verification-install.env}" \
  "$INSTALLER" "$@"
