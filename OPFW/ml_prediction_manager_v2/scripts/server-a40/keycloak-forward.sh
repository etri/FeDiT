#!/usr/bin/env bash
# Run under sudo: own kubectl directly so shutdown never waits on a sudo child.
set -uo pipefail
run=$1
port=$2
child=''
cleanup() {
  trap - EXIT INT TERM
  if [[ -n "$child" ]]; then
    kill -TERM "$child" 2>/dev/null || true
    for _ in $(seq 1 30); do
      kill -0 "$child" 2>/dev/null || break
      sleep 0.1
    done
    kill -KILL "$child" 2>/dev/null || true
    wait "$child" 2>/dev/null || true
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
while [[ ! -f "$run/stop" ]]; do
  echo "FORWARD_CONNECT $(date -Is) port=$port"
  KUBECONFIG=/etc/kubernetes/admin.conf kubectl -n keycloak \
    port-forward --address=127.0.0.1 service/keycloak "$port:8080" &
  child=$!
  while kill -0 "$child" 2>/dev/null; do
    [[ ! -f "$run/stop" ]] || exit 0
    sleep 0.2
  done
  wait "$child" || true
  child=''
  [[ ! -f "$run/stop" ]] || break
  sleep 1
done
