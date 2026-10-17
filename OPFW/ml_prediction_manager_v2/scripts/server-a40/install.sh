#!/usr/bin/env bash
# Verified pinned installation with automatic recovery for the known HTTP 403.
set -Eeuo pipefail
umask 077
here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
mode=${1:-install}
case "$mode" in install|inspect|test) ;; *) echo 'Usage: bash install.sh [install|inspect|test]' >&2; exit 2 ;; esac
mkdir -p "$HOME/pman-server-725eb2ed"
exec 9>"$HOME/pman-server-725eb2ed/control.lock"
flock -n 9 || { echo 'Another server installation or check is running.' >&2; exit 1; }
original="$here/server-install-725eb2ed.sh"
printf '%s  %s\n' 0b550e223c6132796be36c2fae855c07923aa7621042672973f6fec8521de521 "$original" | sha256sum -c -
if [[ "$mode" == inspect ]]; then exec bash "$original" inspect; fi
export FEDIT_SOURCE_REPO
FEDIT_SOURCE_REPO=$(cd -- "$here/../../../.." && pwd)
mkdir -p "$HOME/pman-server-725eb2ed/complete-reports"
report=$(mktemp -d "$HOME/pman-server-725eb2ed/complete-reports/run.XXXXXXXX")
phase=platform
exec 3>&1 4>&2
exec > >(tee "$report/combined.private.log") 2>&1
logger=$!
finish() {
  rc=$?
  trap - EXIT INT TERM
  set +e
  exec 1>&3 2>&4
  closed=false
  for _ in $(seq 1 100); do
    if ! kill -0 "$logger" 2>/dev/null; then closed=true; break; fi
    sleep 0.1
  done
  if [[ "$closed" == true ]]; then wait "$logger" || rc=1;
  else kill "$logger" 2>/dev/null; rc=1; phase=log-cleanup; fi
  # Only these storage-test files are collected; private deployment/configuration
  # backups from update-user-sandbox.sh never enter the handoff archive.
  storage_report=$(sed -n 's/^SANDBOX_TEST_REPORT=//p' "$report/combined.private.log" | tail -1)
  if [[ "$storage_report" =~ ^/data/fedit-sandbox-tests/run\.[A-Za-z0-9]+$ ]]; then
    for name in RESULT.txt test.log api-results.jsonl volume-read-write.log; do
      if sudo -n test -f "$storage_report/$name"; then
        sudo -n cat "$storage_report/$name" > "$report/sandbox-$name"
      fi
    done
  fi
  python3 - "$report/combined.private.log" "$report/session.log" <<'PY'
import pathlib,re,sys
text=pathlib.Path(sys.argv[1]).read_text(encoding='utf-8',errors='replace')
text=re.sub(r'(?<=--token )[a-z0-9]{6}\.[a-z0-9]{16}', '<REDACTED_BOOTSTRAP_TOKEN>', text)
pathlib.Path(sys.argv[2]).write_text(text,encoding='utf-8')
PY
  if (( $? != 0 )); then rc=1; phase=report; fi
  revision=$(git -C "$here/../../../.." rev-parse HEAD 2>/dev/null || echo unknown)
  printf 'EXIT=%s\nSTAGE=%s\nMODE=%s\nSOURCE_COMMIT=%s\n' "$rc" "$phase" "$mode" "$revision" > "$report/RESULT.txt"
  sha256sum "$here/"*.sh "$here/"*.py > "$report/SHA256SUMS"
  files=(RESULT.txt session.log SHA256SUMS)
  for file in "$report/"sandbox-*; do [[ ! -f "$file" ]] || files+=("${file##*/}"); done
  if ! tar -czf "$report.tar.gz" -C "$report" "${files[@]}"; then
    rc=1
    printf 'EXIT=1\nSTAGE=report\n' > "$report/RESULT.txt"
  fi
  echo '===== FEDIT FINAL RESULT ====='
  cat "$report/RESULT.txt"
  echo "FEDIT_REPORT_ARCHIVE=$report.tar.gz"
  exit "$rc"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
started=$(date +%s)
baseline() {
if bash "$original" "$mode"; then return 0; else rc=$?; fi
[[ "$mode" == install ]] || return "$rc"
python3 - "$HOME/pman-server-725eb2ed/results" "$started" <<'PY' || exit "$rc"
import pathlib, sys
results = [p for p in pathlib.Path(sys.argv[1]).glob('*/RESULT.txt') if p.stat().st_mtime >= int(sys.argv[2])]
if not results:
    sys.exit(1)
latest = max(results, key=lambda p: p.stat().st_mtime)
values = dict(line.split('=', 1) for line in latest.read_text().splitlines() if '=' in line)
log = latest.with_name('session.log').read_text(errors='replace')
sys.exit(0 if values.get('STAGE') == 'install' and '[FAIL] PostgreSQL/Keycloak/OIDC' in log else 1)
PY
config="$HOME/pman-server-725eb2ed/server-install.env"
[[ -f "$config" ]] || exit "$rc"
# Only recover the known Keycloak HTTPS rejection. Other errors stay failures.
port=$(bash -c 'source "$1"; printf "%s" "${KEYCLOAK_NODE_PORT:-30081}"' _ "$config")
[[ "$port" =~ ^[0-9]+$ ]] || exit "$rc"
curl --noproxy '*' -sS --retry 10 --retry-all-errors --retry-delay 2 --retry-max-time 120 \
  --connect-timeout 5 --max-time 15 --output "$report/keycloak-probe.private.json" \
  -X POST "http://127.0.0.1:$port/auth/realms/master/protocol/openid-connect/token" \
  -d client_id=admin-cli -d grant_type=password \
  -d username=pman-diagnostic-nonexistent -d password=pman-diagnostic-invalid || exit "$rc"
reply=$(cat "$report/keycloak-probe.private.json")
python3 -c 'import json,sys; d=json.loads(sys.argv[1]); sys.exit(0 if d.get("error_description")=="HTTPS required" else 1)' "$reply" || exit "$rc"
echo '[RECOVERY] Keycloak requires HTTPS on the NodePort route; resuming through local forwarding.'
bash "$here/resume-keycloak.sh"
}
baseline
if [[ "$mode" == install ]]; then
  phase=sandbox-update
  bash "$here/update-user-sandbox.sh"
fi
phase=sandbox-validation
bash "$here/verify-user-sandbox.sh"
phase=complete
echo 'FEDIT_INSTALL_AND_SANDBOX_PASS'
