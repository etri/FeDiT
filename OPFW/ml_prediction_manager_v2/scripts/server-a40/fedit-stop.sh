#!/usr/bin/env bash
# Stop the installed single-node platform without deleting data or changing boot settings.
set -uo pipefail
if (( EUID != 0 )); then exec sudo bash "$0" "$@"; fi
failed=0
echo '===== Stopping access, installation resume, and Kubernetes reconciliation ====='
for unit in prediction-manager-access.service prediction-manager-verification-resume.service kubelet.service; do
  if systemctl cat "$unit" >/dev/null 2>&1; then
    systemctl stop "$unit" || failed=1
  fi
done
echo '===== Stopping Kubernetes containers ====='
endpoint=unix:///run/containerd/containerd.sock
if systemctl is-active --quiet containerd.service; then
  if command -v crictl >/dev/null; then
    if ids=$(crictl --runtime-endpoint "$endpoint" ps -q); then
      while read -r id; do
        [[ -z "$id" ]] || crictl --runtime-endpoint "$endpoint" stop "$id" || failed=1
      done <<< "$ids"
    else
      failed=1
    fi
  else
    echo '[WARN] crictl is unavailable; Kubernetes containers could not be explicitly stopped.'
    failed=1
  fi
fi
echo '===== Stopping ALL Docker containers on this server ====='
if systemctl is-active --quiet docker.service; then
  if ids=$(docker ps -q); then
    while read -r id; do
      [[ -z "$id" ]] || docker stop --time 20 "$id" || failed=1
    done <<< "$ids"
  else
    failed=1
  fi
fi
systemctl stop docker.socket docker.service containerd.service || failed=1
echo '===== Service status ====='
for unit in prediction-manager-access.service kubelet.service docker.service docker.socket containerd.service; do
  state=$(systemctl is-active "$unit" 2>/dev/null || true)
  echo "$unit: $state"
  case "$state" in inactive|failed|unknown) ;; *) failed=1 ;; esac
done
if (( failed )); then
  echo '[FAIL] One or more stop operations failed. Send the output for review.' >&2
  exit 1
fi
echo '[PASS] Platform stopped. Data and boot settings are preserved.'
