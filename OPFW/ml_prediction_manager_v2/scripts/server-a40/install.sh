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
printf '%s  %s\n' 78b2c8ba0182320e5b06def1c2ce46ec4c55836858ab5c6d059d38b7b0c6ac3a "$original" | sha256sum -c -
started=$(date +%s)
if [[ "$mode" == inspect ]]; then exec bash "$original" inspect; fi
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
reply=$(curl --noproxy '*' -sS --connect-timeout 5 --max-time 15 \
  -X POST "http://127.0.0.1:$port/auth/realms/master/protocol/openid-connect/token" \
  -d client_id=admin-cli -d grant_type=password \
  -d username=pman-diagnostic-nonexistent -d password=pman-diagnostic-invalid) || exit "$rc"
python3 -c 'import json,sys; d=json.loads(sys.argv[1]); sys.exit(0 if d.get("error_description")=="HTTPS required" else 1)' "$reply" || exit "$rc"
echo '[RECOVERY] Keycloak requires HTTPS on the NodePort route; resuming through local forwarding.'
bash "$here/resume-keycloak.sh"
}
baseline
if [[ "$mode" == install ]]; then
  bash "$here/update-user-sandbox.sh"
fi
bash "$here/verify-user-sandbox.sh"
echo 'FEDIT_INSTALL_AND_SANDBOX_PASS'
