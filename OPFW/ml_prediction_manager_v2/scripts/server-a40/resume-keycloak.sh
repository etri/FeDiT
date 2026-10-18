#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
original="${FEDIT_INSTALLER_PATH:-$here/server-install-725eb2ed.sh}"
expected=0f3d34662a544ca936b10613a2ee6597c59f7114ecba5a96f7695d2c439d71e8
printf '%s  %s\n' "$expected" "$original" | sha256sum -c -
sudo -v
run=$(mktemp -d "$HOME/pman-keycloak-resume.XXXXXXXX")
pf_pid=''
cleanup() {
  rc=$?
  trap - EXIT
  touch "$run/stop"
  if [[ -n "$pf_pid" ]]; then
    stopped=false
    for _ in $(seq 1 100); do
      if ! kill -0 "$pf_pid" 2>/dev/null; then stopped=true; break; fi
      sleep 0.1
    done
    if [[ "$stopped" == true ]]; then
      wait "$pf_pid" 2>/dev/null || true
    else
      echo '[WARN] Forwarder did not exit within 10 seconds; inspect port-forward.log.' >&2
      (( rc != 0 )) || rc=1
    fi
  fi
  echo "KEYCLOAK_RESUME_EXIT=$rc"
  echo "KEYCLOAK_RESUME_DIAGNOSTICS=$run"
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
port=$(python3 - <<'PY'
import socket
with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    print(sock.getsockname()[1])
PY
)
sudo -n bash "$here/keycloak-forward.sh" "$run" "$port" \
  </dev/null >"$run/port-forward.log" 2>&1 &
pf_pid=$!
ready=false
for attempt in $(seq 1 60); do
  if grep -q "^Forwarding from 127.0.0.1:$port " "$run/port-forward.log"; then ready=true; break; fi
  if ! kill -0 "$pf_pid" 2>/dev/null; then cat "$run/port-forward.log"; exit 1; fi
  sleep 1
done
[[ "$ready" == true ]] || { cat "$run/port-forward.log"; echo 'Local port forwarding did not become ready'; exit 1; }
url="http://127.0.0.1:$port/auth"
code=$(curl --noproxy '*' -sS --retry 30 --retry-all-errors --retry-delay 2 --retry-max-time 150 --connect-timeout 5 --max-time 20 \
  -o "$run/http-response.json" -w '%{http_code}' -X POST \
  "$url/realms/master/protocol/openid-connect/token" \
  -d client_id=admin-cli -d grant_type=password \
  -d username=pman-diagnostic-nonexistent -d password=pman-diagnostic-invalid)
echo "LOCAL_KEYCLOAK_HTTP=$code"
cat "$run/http-response.json"; echo
[[ "$code" == 401 ]] || { echo 'Expected invalid-credentials HTTP 401; installation was not resumed.'; exit 1; }
python3 - "$original" "$run/server-install-local-keycloak.sh" "$url" <<'PY'
import pathlib, sys
source, target, url = sys.argv[1:]
text = pathlib.Path(source).read_text()
anchor = "p.write_text(s)\nPY\n  # The pinned NiFi image"
assert text.count(anchor) == 1, 'Installer patch anchor mismatch'
old = 'KEYCLOAK_PUBLIC_URL="http://127.0.0.1:${KEYCLOAK_NODE_PORT}/auth"'
new = 'KEYCLOAK_PUBLIC_URL="' + url + '"'
patch = ('keycloak_old=' + repr(old) + '\n'
         'assert s.count(keycloak_old)==1, "Keycloak URL anchor mismatch"\n'
         's=s.replace(keycloak_old,' + repr(new) + ')\n'
         'kc_start=s.index("install_data_services() {")\n'
         'kc_end=s.index("\\ninstall_monitoring_stack() {",kc_start)\n'
         'kc_part=s[kc_start:kc_end]\n'
         'assert kc_part.count("curl -fsS")==5, "Keycloak request count mismatch"\n'
         'kc_part=kc_part.replace("curl -fsS", "curl --noproxy \'*\' --retry 60 --retry-all-errors --retry-delay 2 --retry-max-time 240 --connect-timeout 5 --max-time 20 -fsS")\n'
         's=s[:kc_start]+kc_part+s[kc_end:]\n')
pathlib.Path(target).write_text(text.replace(anchor, patch + anchor))
PY
bash -n "$run/server-install-local-keycloak.sh"
echo 'Resuming installation using local Keycloak forwarding; realm HTTPS policies are unchanged.'
# The endpoint is loopback-only. Keep loopback out of any configured HTTP proxy.
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}127.0.0.1,localhost"
export no_proxy="${no_proxy:+$no_proxy,}127.0.0.1,localhost"
bash "$run/server-install-local-keycloak.sh"
