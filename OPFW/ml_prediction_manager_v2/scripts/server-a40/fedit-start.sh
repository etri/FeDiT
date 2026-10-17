#!/usr/bin/env bash
# Start the installed single-node FeDiT platform without changing boot settings.
set -Eeuo pipefail
if (( EUID != 0 )); then exec sudo bash "$0" "$@"; fi
trap 'rc=$?; echo "[FAIL] Service start failed (exit=$rc, line=$LINENO)." >&2; exit "$rc"' ERR
mountpoint -q /data || { echo '[FAIL] /data is not mounted. Mount the data disk before starting.' >&2; exit 1; }
echo '===== Starting container runtimes and Kubernetes ====='
systemctl start containerd.service docker.service
# docker stop preserves a manual stop, especially with unless-stopped.
# Starting the daemon alone does not restore the frontend stopped by fedit-stop.
registry=${FEDIT_REGISTRY_CONTAINER:-pm-verification-registry}
for container in "$registry" fedit-fe; do
  docker container inspect "$container" >/dev/null || {
    echo "[FAIL] Installed Docker container is missing: $container" >&2
    exit 1
  }
  docker start "$container"
done
systemctl start kubelet.service
echo '===== Starting service access ====='
systemctl start prediction-manager-access.service
echo '===== Waiting for Kubernetes API (up to 180 seconds) ====='
export KUBECONFIG=/etc/kubernetes/admin.conf
ready=false
for attempt in $(seq 1 60); do
  if kubectl --request-timeout=3s get --raw=/readyz >/dev/null 2>&1; then ready=true; break; fi
  sleep 3
done
[[ "$ready" == true ]] || { echo '[FAIL] Kubernetes API is not ready. Run: sudo journalctl -u kubelet -n 60 --no-pager'; exit 1; }
kubectl wait --for=condition=Ready nodes --all --timeout=180s
echo '===== Service status ====='
systemctl is-active containerd.service docker.service kubelet.service prediction-manager-access.service
kubectl get pods -A
echo '[PASS] Services started and Kubernetes node is Ready.'
echo 'Application Pods may still be starting; check their READY columns above.'
echo 'FeDiT: http://220.124.222.82:18000/fedit/predictor-creator-tool'
echo 'Prediction Manager: http://220.124.222.82:18000/prediction-manager/docs'
