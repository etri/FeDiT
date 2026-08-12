#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_ROOT}/.verification-install.env"

has_config=false
for arg in "$@"; do
  [[ "$arg" == "--config" ]] && has_config=true
done

if [[ "$has_config" == true ]]; then
  "${SCRIPT_ROOT}/install-verification.sh" "$@"
else
  "${SCRIPT_ROOT}/install-verification.sh" --config "$CONFIG_FILE" "$@"
fi

exec "${SCRIPT_ROOT}/scripts/check-service-entry.sh"
