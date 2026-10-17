#!/usr/bin/env bash
# Real API and Kubernetes PVC lifecycle checks; remove only our UUID fixtures.
set -Eeuo pipefail
if (( EUID != 0 )); then exec sudo bash "$0" "$@"; fi
umask 077
here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
export KUBECONFIG=/etc/kubernetes/admin.conf
mkdir -p /data/fedit-sandbox-tests
work=$(mktemp -d /data/fedit-sandbox-tests/run.XXXXXXXX)
exec > >(tee "$work/test.log") 2>&1
finish() {
  rc=$?
  printf 'EXIT=%s\n' "$rc" > "$work/RESULT.txt"
  echo "SANDBOX_TEST_REPORT=$work"
  exit "$rc"
}
trap finish EXIT
python3 "$here/verify-user-sandbox.py" "$work"
