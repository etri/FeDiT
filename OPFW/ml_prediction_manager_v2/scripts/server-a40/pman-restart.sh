#!/usr/bin/env bash
# Restart the installed platform using the verified stop/start entry points.
set -Eeuo pipefail
case "${1:-}" in
  -h|--help) echo 'Usage: bash pman-restart.sh'; exit 0 ;;
  '') ;;
  *) echo 'Usage: bash pman-restart.sh' >&2; exit 2 ;;
esac
(( $# <= 1 )) || { echo 'Unexpected arguments.' >&2; exit 2; }
here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# Check both dependencies before stopping a working installation.
for name in pman-stop.sh pman-start.sh; do
  [[ -r "$here/$name" ]] || { echo "[FAIL] Missing sibling script: $here/$name" >&2; exit 1; }
  bash -n "$here/$name"
done
if (( EUID != 0 )); then
  exec sudo env FEDIT_REGISTRY_CONTAINER="${FEDIT_REGISTRY_CONTAINER:-pm-verification-registry}" bash "$0" "$@"
fi
owner=${SUDO_USER:-root}
owner_home=$(getent passwd "$owner" | cut -d: -f6)
[[ -n "$owner_home" && -d "$owner_home/pman-server-725eb2ed" ]] || {
  echo '[FAIL] Installation directory is missing; run as the installation owner.' >&2; exit 1;
}
lock="$owner_home/pman-server-725eb2ed/control.lock"
[[ ! -L "$lock" && ( ! -e "$lock" || -f "$lock" ) ]] || { echo '[FAIL] Invalid control lock file.' >&2; exit 1; }
# A root-created lock must remain writable by the ordinary install.sh owner.
: >> "$lock"
chown "$owner" "$lock"
chmod u+rw "$lock"
exec 9>>"$lock"
flock -n 9 || { echo '[FAIL] Another install, check, restart or uninstall is running.' >&2; exit 1; }
phase=stop
trap 'rc=$?; echo "[FAIL] Restart failed in $phase (exit=$rc)." >&2; exit "$rc"' ERR
trap 'exit 130' INT
trap 'exit 143' TERM
echo '===== Restart: stop ====='
bash "$here/pman-stop.sh"
phase=start
echo '===== Restart: start ====='
bash "$here/pman-start.sh"
echo '[PASS] Platform restarted; Kubernetes node is Ready. Application Pods may still be starting.'
echo 'For the full application and CPU/GPU check: bash install.sh test'
