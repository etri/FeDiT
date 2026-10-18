#!/usr/bin/env bash
# Remove this installer's single-node cluster; preserve data and runtime packages.
set -Eeuo pipefail
umask 077
usage() {
  cat <<'HELP'
Usage: bash pman-uninstall.sh [--dry-run] [--owner USER]

Run as the account that ran install.sh (sudo is requested once).
--dry-run     Show the removal plan without stopping or changing anything.
--owner USER  Installation owner, required when invoking directly as root.

Removes the whole installed single-node Kubernetes cluster, its containers,
fedit-fe and the configured Registry container, and the installer's systemd units.
Disables runtime autostart. Before reset, saves a private cold backup of etcd,
cluster credentials, installation state and configuration. Retains PVC contents,
Registry data, Docker/containerd images, /data mounts, packages and NVIDIA driver.
Retained PVC files are NOT automatically attached to a newly installed cluster.
After uninstall, pman-start.sh/pman-restart.sh cannot restore the removed cluster.
HELP
}
dry_run=false
owner=${SUDO_USER:-${USER:-}}
while (( $# )); do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --dry-run) dry_run=true; shift ;;
    --owner) (( $# >= 2 )) || { usage >&2; exit 2; }; owner=$2; shift 2 ;;
    *) usage >&2; exit 2 ;;
  esac
done
[[ -n "$owner" && "$owner" != root && "$owner" != -* ]] || {
  echo '[FAIL] Run as the installation account, or supply --owner USER.' >&2; exit 2;
}
here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
[[ -r "$here/pman-stop.sh" ]] || { echo '[FAIL] Missing sibling pman-stop.sh.' >&2; exit 1; }
bash -n "$here/pman-stop.sh"
if (( EUID != 0 )); then
  args=(--owner "$owner")
  [[ "$dry_run" != true ]] || args+=(--dry-run)
  exec sudo env FEDIT_REGISTRY_CONTAINER="${FEDIT_REGISTRY_CONTAINER:-}" bash "$0" "${args[@]}"
fi
owner_entry=$(getent passwd "$owner")
owner_uid=$(cut -d: -f3 <<<"$owner_entry")
owner_home=$(cut -d: -f6 <<<"$owner_entry")
[[ "$owner_uid" =~ ^[0-9]+$ && "$owner_uid" != 0 && "$owner_home" == /* && "$owner_home" != / ]] || {
  echo '[FAIL] Invalid installation account.' >&2; exit 1;
}
base="$owner_home/pman-server-725eb2ed"
state="$owner_home/prediction-manager-work/.prediction-manager/gpu/state"
config="$base/server-install.env"
registry=${FEDIT_REGISTRY_CONTAINER:-}
if [[ -z "$registry" && -f "$config" ]]; then
  # Read one literal setting; never execute a user-owned configuration as root.
  registry=$(python3 - "$config" <<'PY'
import pathlib, shlex, sys
values = []
for line in pathlib.Path(sys.argv[1]).read_text().splitlines():
    if line.startswith('REGISTRY_CONTAINER_NAME='):
        words = shlex.split(line.split('=', 1)[1], comments=True)
        if len(words) != 1:
            raise SystemExit('Invalid REGISTRY_CONTAINER_NAME in installation config')
        values.append(words[0])
print(values[-1] if values else 'pm-verification-registry')
PY
  )
fi
registry=${registry:-pm-verification-registry}
[[ "$registry" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ && "$registry" != fedit-fe ]] || {
  echo '[FAIL] Invalid Registry container name.' >&2; exit 1;
}
echo "Installation owner: $owner"
echo "Remove cluster: /etc/kubernetes and /var/lib/etcd (cold backup first)"
echo "Remove Docker containers: fedit-fe, $registry"
echo 'Remove units: prediction-manager-access, prediction-manager-verification-resume, prediction-manager-root-propagation'
echo 'Disable autostart: kubelet, docker, docker.socket, containerd'
echo "Preserve data: /data/fedit-pman-$owner_uid, /opt/local-path-provisioner, $owner_home/prediction-manager-work"
echo 'Preserve packages, images, NVIDIA driver, network settings and /data bind mounts.'
if [[ "$dry_run" == true ]]; then echo '[PASS] Dry run only; no changes made.'; exit 0; fi
[[ -d "$base" && -f "$base/installation-started" ]] || {
  echo '[FAIL] No installation marker for this account; nothing removed.' >&2; exit 1;
}
lock="$base/control.lock"
[[ ! -L "$lock" && ( ! -e "$lock" || -f "$lock" ) ]] || { echo '[FAIL] Invalid control lock file.' >&2; exit 1; }
: >> "$lock"
chown "$owner" "$lock"
chmod u+rw "$lock"
exec 9>>"$lock"
flock -n 9 || { echo '[FAIL] Another install, check, restart or uninstall is running.' >&2; exit 1; }
if [[ -f "$base/uninstalled" && ! -e /etc/kubernetes/admin.conf && ! -d "$state" ]]; then
  echo '[PASS] This installation was already uninstalled. Retained data is unchanged.'; exit 0;
fi
[[ -f "$state/cluster-owned" ]] || {
  echo '[FAIL] Cluster ownership marker is missing; nothing removed.' >&2; exit 1;
}
mountpoint -q /data || { echo '[FAIL] Mount the installation data disk at /data first.' >&2; exit 1; }
if [[ -f /etc/kubernetes/manifests/kube-apiserver.yaml ]] &&
    ! grep -Fq -- '--service-cluster-ip-range=10.254.252.0/24' /etc/kubernetes/manifests/kube-apiserver.yaml; then
  echo '[FAIL] The active cluster does not match this installation network; nothing removed.' >&2; exit 1;
fi
for tool in kubeadm crictl docker systemctl tar timeout python3; do
  command -v "$tool" >/dev/null || { echo "[FAIL] Required tool missing: $tool" >&2; exit 1; }
done
report=$(mktemp -d "$base/uninstall.XXXXXXXX")
chmod 700 "$report"
echo "UNINSTALL_REPORT=$report"
uninstall_platform() {
  set -Eeuo pipefail
  phase=stop
  cleanup() {
    local rc=$?
    trap - EXIT
    set +e
    # Even an interrupted reset must not leave the removed service auto-starting.
    if ! systemctl stop docker.socket docker.service containerd.service; then
      (( rc != 0 )) || { rc=1; phase=runtime-stop; }
    fi
    for unit in docker.socket docker.service containerd.service kubelet.service; do
      status=$(systemctl is-active "$unit" 2>/dev/null || true)
      case "$status" in inactive|failed|unknown) ;; *) rc=1; phase=runtime-stop ;; esac
    done
    if (( rc != 0 )); then echo "[FAIL] Uninstall failed in $phase (exit=$rc). Backup/report: $report" >&2; fi
    printf 'EXIT=%s\nSTAGE=%s\n' "$rc" "$phase" > "$report/RESULT.txt"
    exit "$rc"
  }
  trap cleanup EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
  bash "$here/pman-stop.sh"
  phase=backup
  # Both kubelet and all CRI containers are stopped: this is a cold etcd copy.
  paths=()
  for path in /etc/kubernetes /var/lib/etcd /etc/cni/net.d /etc/docker/daemon.json \
    /etc/containerd/config.toml /etc/fstab /var/lib/kubelet/config.yaml \
    /var/lib/kubelet/kubeadm-flags.env /var/lib/kubelet/pki \
    "$config" "$state" "$owner_home/.kube/config" \
    "${state%/state}/secrets.env" "${state%/state}/generated" "${state%/state}/services" \
    /etc/systemd/system/prediction-manager-access.service \
    /etc/systemd/system/prediction-manager-verification-resume.service \
    /etc/systemd/system/prediction-manager-root-propagation.service; do
    [[ ! -e "$path" ]] || paths+=("${path#/}")
  done
  tar --acls --xattrs -cpf "$report/cluster-backup.private.tar" -C / "${paths[@]}"
  tar -tf "$report/cluster-backup.private.tar" > "$report/backup-files.private.txt"
  sha256sum "$report/cluster-backup.private.tar" > "$report/backup.sha256"
  kubeconfig_matches=false
  if [[ -f /etc/kubernetes/admin.conf && -f "$owner_home/.kube/config" ]] && \
      cmp -s /etc/kubernetes/admin.conf "$owner_home/.kube/config"; then kubeconfig_matches=true; fi
  phase=disable-autostart
  for unit in prediction-manager-access.service prediction-manager-verification-resume.service \
    prediction-manager-root-propagation.service kubelet.service docker.service docker.socket containerd.service; do
    if systemctl cat "$unit" >/dev/null 2>&1; then systemctl disable "$unit"; fi
  done
  phase=remove-containers
  systemctl start containerd.service docker.service
  # Listing must succeed: a daemon error must not masquerade as a missing container.
  docker container ls -a --format '{{.Names}}' > "$report/docker-names.txt"
  for container in fedit-fe "$registry"; do
    if grep -Fqx -- "$container" "$report/docker-names.txt"; then docker rm -f -- "$container"; fi
  done
  phase=cluster-reset
  timeout --signal=TERM --kill-after=15s 300s kubeadm reset -f \
    --cri-socket unix:///run/containerd/containerd.sock --kubeconfig /dev/null
  [[ ! -e /etc/kubernetes/admin.conf && ! -e /etc/kubernetes/manifests/kube-apiserver.yaml ]] || {
    echo '[FAIL] Kubernetes configuration still exists after reset.' >&2; exit 1;
  }
  # kubeadm logs some cleanup errors as warnings, so verify the actual outcomes.
  [[ -z "$(find /var/lib/etcd -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]] || {
    echo '[FAIL] etcd data was not cleared by kubeadm reset.' >&2; exit 1;
  }
  crictl --runtime-endpoint unix:///run/containerd/containerd.sock pods -q > "$report/remaining-pods.txt"
  [[ ! -s "$report/remaining-pods.txt" ]] || {
    echo '[FAIL] CRI Pod sandboxes remain after reset.' >&2; exit 1;
  }
  phase=remove-units
  for unit in prediction-manager-access.service prediction-manager-verification-resume.service \
    prediction-manager-root-propagation.service; do
    if systemctl cat "$unit" >/dev/null 2>&1; then systemctl stop "$unit"; fi
    rm -f -- "/etc/systemd/system/$unit"
  done
  systemctl daemon-reload
  if [[ "$kubeconfig_matches" == true ]]; then rm -f -- "$owner_home/.kube/config"; fi
  # Save completion flags, so a future install cannot skip the removed cluster.
  # Keep installation-started: it also identifies the existing network/storage layout.
  mv -- "$state" "$report/previous-install-state"
  touch "$base/uninstalled"
  phase=complete
}
set +e
( uninstall_platform ) 2>&1 | tee "$report/uninstall.log"
statuses=("${PIPESTATUS[@]}")
rc=${statuses[0]}
if (( statuses[1] != 0 )); then rc=1; printf 'EXIT=1\nSTAGE=log\n' > "$report/RESULT.txt"; fi
cat "$report/RESULT.txt"
if (( rc == 0 )); then
  echo '[PASS] Platform uninstalled. PVC files, Registry data and images are retained.'
  echo 'The old cluster cannot be started with pman-start.sh; reinstall with bash install.sh.'
  echo 'Retained PVC files need an explicit restore; a new cluster does not attach them automatically.'
fi
echo "UNINSTALL_REPORT=$report"
echo 'The private backup contains credentials. Do not send it in chat.'
exit "$rc"
