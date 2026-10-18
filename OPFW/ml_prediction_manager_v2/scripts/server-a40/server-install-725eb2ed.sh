#!/usr/bin/env bash
# Run as the ordinary SSH login user: bash server-install-725eb2ed.sh
# Diagnostic redirects intentionally write into the login user's report directory.
# shellcheck disable=SC2024
set -Eeuo pipefail
umask 077
PIN=725eb2edeec1b756b45abb809cdc4dc971a890bf
MODE=${1:-install}
[[ "$MODE" == install || "$MODE" == inspect || "$MODE" == test ]] || exit 2
BASE="$HOME/pman-server-725eb2ed"
mkdir -p "$BASE"
RUN="$BASE/results/$(date +%Y%m%d-%H%M%S)-$$"
mkdir -p "$RUN"
exec 3>&1 4>&2
exec > >(tee "$RUN/session.log") 2>&1
LOGGER_PID=$!
STAGE=preflight
GPU_POD=""
GPU_CONTAINER=""
finish() {
  rc=$?
  trap - EXIT
  set +e
  [[ -z "$GPU_POD" ]] || sudo -n timeout 20 env KUBECONFIG=/etc/kubernetes/admin.conf kubectl delete pod "$GPU_POD" --ignore-not-found --wait=false
  [[ -z "$GPU_CONTAINER" ]] || sudo -n timeout 20 docker rm -f "$GPU_CONTAINER"
  printf 'EXIT=%s\nSTAGE=%s\nCOMMIT=%s\nMODE=%s\n' "$rc" "$STAGE" "$PIN" "$MODE" > "$RUN/RESULT.txt"
  if command -v kubectl >/dev/null; then
    sudo -n timeout 20 env KUBECONFIG=/etc/kubernetes/admin.conf kubectl get nodes -o wide > "$RUN/nodes.txt" 2>&1
    sudo -n timeout 20 env KUBECONFIG=/etc/kubernetes/admin.conf kubectl get pods -A -o wide > "$RUN/pods.txt" 2>&1
    sudo -n timeout 20 env KUBECONFIG=/etc/kubernetes/admin.conf kubectl get events -A --sort-by=.lastTimestamp > "$RUN/events.txt" 2>&1
    sudo -n timeout 20 env KUBECONFIG=/etc/kubernetes/admin.conf kubectl get pvc -A > "$RUN/pvc.txt" 2>&1
  fi
  # Close the logger before archiving: the log must not change while tar reads it.
  exec 1>&3 2>&4
  wait "$LOGGER_PID"
  local files=(RESULT.txt session.log) f
  for f in nodes.txt pods.txt events.txt pvc.txt gpu-pod.txt pod-status.json; do
    [[ ! -f "$RUN/$f" ]] || files+=("$f")
  done
  tar -czf "$RUN.tar.gz" -C "$RUN" "${files[@]}" || echo '[WARN] Report archive creation failed; individual report files remain available.'
  echo
  echo '========== COPY BACK TO CODEX =========='
  cat "$RUN/RESULT.txt"
  tail -n 65 "$RUN/session.log"
  echo "REPORT_ARCHIVE=$RUN.tar.gz"
  echo '========== END =========='
  exit "$rc"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
fail() { echo "[BLOCKED] $*"; exit 1; }
if ((EUID == 0)) && ! command -v sudo >/dev/null; then
  sudo() {
    [[ "${1:-}" != -v ]] || return 0
    if [[ "${1:-}" == -n ]]; then shift; fi
    "$@"
  }
fi
sudo -v
echo "USER=$(id -un) DATE=$(date -Is)"
cat /etc/os-release
df -hT / "$HOME" /data 2>/dev/null || true
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINTS || true
free -h || true
ip -4 route || true
command -v nvidia-smi >/dev/null && nvidia-smi || true
for path in /var/lib/docker /var/lib/containerd /var/lib/kubelet /opt/local-path-provisioner; do
  sudo timeout --signal=TERM --kill-after=2s 5s du -shx "$path" 2>/dev/null || \
    echo "[INFO] Optional storage-size scan skipped or timed out: $path (installation continues)"
done
sudo systemctl is-active docker containerd kubelet || true
if command -v docker >/dev/null; then
  sudo docker info --format 'DockerRoot={{.DockerRootDir}}' || true
  sudo docker ps --format '{{.Names}} {{.Status}} {{.Ports}}' || true
  sudo docker network ls || true
  mapfile -t docker_networks < <(sudo docker network ls -q 2>/dev/null || true)
  if ((${#docker_networks[@]})); then
    sudo docker network inspect "${docker_networks[@]}" --format '{{.Name}} {{json .IPAM.Config}}' || true
  fi
fi
[[ "$MODE" != inspect ]] || exit 0
. /etc/os-release
[[ "$ID" == ubuntu && "$VERSION_ID" == 22.04 && "$(uname -m)" == x86_64 ]] || fail 'This release is prepared for Ubuntu 22.04 x86_64.'
command -v nvidia-smi >/dev/null || fail 'NVIDIA driver is missing. Driver installation is not automated.'
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
if [[ $(nproc) -lt 4 ]]; then echo '[WARN] Fewer than 4 CPUs detected; installation continues with the compact profile.'; fi
REPO="$BASE/source"
SCRIPTS="$REPO/OPFW/ml_prediction_manager_v2/scripts"
CONFIG="$BASE/server-install.env"
check_network_routes() {
  python3 - <<'PY'
import ipaddress, json, subprocess
desired=[ipaddress.ip_network(x) for x in ['10.254.250.0/23','10.254.252.0/24','10.254.254.192/28','10.254.254.224/27']]
for route in json.loads(subprocess.check_output(['ip','-j','-4','route'])):
    dest=route.get('dst','default')
    if dest=='default': continue
    network=ipaddress.ip_network(dest,strict=False)
    if any(network.overlaps(n) for n in desired):
        raise SystemExit('Existing route overlaps deployment range: '+dest)
PY
}
prepare_data_storage() {
  # Keep application paths unchanged while backing their contents with /data.
  # No existing directories are deleted. Originals become dated backups.
  sudo env PM_OWNER="$(id -un)" PM_HOME="$HOME" PM_BASE="$BASE" \
    PM_DOCKER_ROOT="$DOCKER_ROOT" PM_CONTAINERD_ROOT="$CONTAINERD_ROOT" bash <<'STORAGE'
set -Eeuo pipefail
mountpoint -q /data || { echo '/data must be an existing mounted data disk.'; exit 1; }
[[ "$(stat -c %d /data)" != "$(stat -c %d /)" ]] || { echo '/data is on the root filesystem.'; exit 1; }
available=$(df -BG --output=avail /data | tail -1 | tr -dc '0-9')
root_free=$(df -BG --output=avail / | tail -1 | tr -dc '0-9')
echo "[STORAGE] available: /data=${available} GiB, /=${root_free} GiB (informational; no size gate)"
if ((available < 200)); then echo '[WARN] /data is below the historical 200 GiB recommendation; continuing.'; fi
if ((root_free < 8)); then echo '[WARN] / is below the 8 GiB recommendation; continuing.'; fi
# Test actual writes instead of rejecting the host on a guessed capacity budget.
for dir in /data /var/tmp "$PM_HOME"; do
  probe=$(mktemp "$dir/.pman-write-probe.XXXXXX")
  if ! dd if=/dev/zero of="$probe" bs=4096 count=1 conv=fsync status=none; then
    rm -f -- "$probe"
    echo "Storage write failed: $dir"
    exit 1
  fi
  rm -f -- "$probe"
done
if ! command -v rsync >/dev/null; then
  DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Retries=3 -o DPkg::Lock::Timeout=120 update
  DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Retries=3 -o DPkg::Lock::Timeout=120 install -y rsync
fi
storage="/data/fedit-pman-$(id -u "$PM_OWNER")"
install -d -m 0755 "$storage"
install -d -m 1777 "$storage/tmp"
stamp="$(date +%Y%m%d-%H%M%S)-$$"
cp -a /etc/fstab "$PM_BASE/fstab.before-$stamp"
docker_active=false; containerd_active=false; socket_active=false
systemctl is-active --quiet docker && docker_active=true
systemctl is-active --quiet containerd && containerd_active=true
systemctl is-active --quiet docker.socket && socket_active=true
restore_services() {
  rc=$?
  trap - EXIT
  restart_rc=0
  if [[ "$containerd_active" == true ]]; then systemctl start containerd || restart_rc=$?; fi
  if [[ "$socket_active" == true ]]; then systemctl start docker.socket || restart_rc=$?; fi
  if [[ "$docker_active" == true ]]; then systemctl start docker || restart_rc=$?; fi
  if ((restart_rc != 0)); then
    echo '[FAIL] Could not restore the previously running container runtime.'
    ((rc != 0)) || rc=$restart_rc
  fi
  exit "$rc"
}
trap restore_services EXIT
systemctl stop docker.service docker.socket containerd.service 2>/dev/null || true
for unit in docker containerd; do
  if systemctl is-active --quiet "$unit"; then echo "Cannot stop $unit"; exit 1; fi
done
bind_data() {
  local dest="$1" name="$2" owner="$3" target="$storage/$2" backup
  [[ "$dest" != *[[:space:]]* ]] || { echo 'Whitespace in path unsupported.'; exit 1; }
  if [[ -d "$dest" && "$(stat -Lc %d "$dest")" == "$(stat -c %d /data)" ]]; then
    echo "[STORAGE] already on /data filesystem, preserving existing layout: $dest"
    return
  fi
  if mountpoint -q "$dest"; then
    [[ -d "$target" && "$(stat -c '%d:%i' "$dest")" == "$(stat -c '%d:%i' "$target")" ]] || { echo "Unexpected mount at $dest"; exit 1; }
    echo "[STORAGE] already configured: $dest -> $target"
    return
  fi
  [[ ! -L "$dest" ]] || { echo "Unexpected symlink: $dest"; exit 1; }
  [[ ! -e "$dest" || -d "$dest" ]] || exit 1
  install -d -m 0755 "$target"
  if [[ -d "$dest" ]]; then
    # Refuse nested mounts rather than copying or moving a live mount tree.
    [[ $(findmnt -rn -o TARGET | awk -v p="$dest/" 'index($0,p)==1 {n++} END {print n+0}') == 0 ]] || { echo "Nested mount below $dest"; exit 1; }
    rsync -aHAXx --numeric-ids "$dest/" "$target/"
    [[ -z "$(rsync -aHAXxnc --numeric-ids --itemize-changes "$dest/" "$target/")" ]] || { echo "Copy verification failed: $dest"; exit 1; }
    backup="$dest.before-pman-$stamp"
    mv -- "$dest" "$backup"
    printf '%s\n' "$backup" >> "$PM_BASE/storage-backups.txt"
  fi
  install -d -m 0755 "$dest"
  chown "$owner" "$target"
  if ! mount --bind "$target" "$dest"; then
    if [[ -n "${backup:-}" ]]; then rmdir "$dest"; mv -- "$backup" "$dest"; fi
    exit 1
  fi
  grep -Fqx "$target $dest none bind,x-systemd.requires-mounts-for=/data 0 0" /etc/fstab || \
    printf '%s %s none bind,x-systemd.requires-mounts-for=/data 0 0\n' "$target" "$dest" >> /etc/fstab
  echo "[STORAGE] $dest -> $target"
}
bind_data /var/lib/docker docker root:root
bind_data /var/lib/containerd containerd root:root
if [[ "$PM_DOCKER_ROOT" != /var/lib/docker ]]; then bind_data "$PM_DOCKER_ROOT" docker-custom root:root; fi
if [[ "$PM_CONTAINERD_ROOT" != /var/lib/containerd ]]; then bind_data "$PM_CONTAINERD_ROOT" containerd-custom root:root; fi
bind_data /var/lib/kubelet kubelet root:root
bind_data /opt/local-path-provisioner pvc root:root
bind_data "$PM_HOME/prediction-manager-work" work "$PM_OWNER:$(id -gn "$PM_OWNER")"
bind_data "$PM_BASE/source" source "$PM_OWNER:$(id -gn "$PM_OWNER")"
# Prevent runtimes from starting against empty root directories if /data fails at boot.
for unit in docker containerd kubelet; do
  install -d "/etc/systemd/system/$unit.service.d"
  printf '[Unit]\nRequiresMountsFor=/var/lib/%s /opt/local-path-provisioner %s/prediction-manager-work %s %s\n' "$unit" "$PM_HOME" "$PM_DOCKER_ROOT" "$PM_CONTAINERD_ROOT" > "/etc/systemd/system/$unit.service.d/90-pman-storage.conf"
done
systemctl daemon-reload
findmnt --verify --tab-file /etc/fstab || echo '[WARN] fstab validation reported an issue; active data mounts are checked separately.'
df -h /data /var/lib/docker /var/lib/containerd /var/lib/kubelet /opt/local-path-provisioner "$PM_HOME/prediction-manager-work"
STORAGE
}
if [[ "$MODE" == install ]]; then
  STAGE=bootstrap-tools
  missing=false
  for tool in git python3 ip mountpoint rsync; do command -v "$tool" >/dev/null || missing=true; done
  if [[ "$missing" == true ]]; then
    sudo env DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Retries=3 -o DPkg::Lock::Timeout=120 update
    sudo env DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Retries=3 -o DPkg::Lock::Timeout=120 install -y git ca-certificates python3 iproute2 util-linux rsync
  fi
  STAGE=network-preflight
  [[ -f "$BASE/installation-started" ]] || check_network_routes
  STAGE=storage-paths
  mapfile -t runtime_roots < <(sudo python3 - <<'PY'
import json,pathlib,re
d=pathlib.Path('/etc/docker/daemon.json')
docker=json.loads(d.read_text()).get('data-root','/var/lib/docker') if d.exists() else '/var/lib/docker'
c=pathlib.Path('/etc/containerd/config.toml')
top=c.read_text().split('[',1)[0] if c.exists() else ''
match=re.search(r'''(?m)^\s*root\s*=\s*["']([^"']+)["']''',top)
containerd=match.group(1) if match else '/var/lib/containerd'
for value in (docker,containerd):
    if not isinstance(value,str) or not value.startswith('/') or any(c.isspace() for c in value):
        raise SystemExit('Invalid runtime data directory: '+str(value))
    print(value)
PY
  )
  ((${#runtime_roots[@]} == 2)) || fail 'Cannot determine Docker/containerd storage paths.'
  DOCKER_ROOT="${runtime_roots[0]}"
  CONTAINERD_ROOT="${runtime_roots[1]}"
  if command -v docker >/dev/null; then
    effective_docker_root=$(sudo docker info --format '{{.DockerRootDir}}' 2>/dev/null || true)
    [[ -z "$effective_docker_root" ]] || DOCKER_ROOT="$effective_docker_root"
  fi
  echo "[STORAGE] runtime roots: Docker=$DOCKER_ROOT containerd=$CONTAINERD_ROOT"
  if [[ -f /etc/kubernetes/admin.conf && ! -f "$BASE/installation-started" ]]; then
    fail 'An existing cluster is present. Inspect it before installing; no reset is performed.'
  fi
  if command -v docker >/dev/null && [[ ! -f "$BASE/installation-started" ]]; then
    [[ -z "$(sudo docker ps -q)" ]] || fail 'Running Docker containers detected; cannot migrate live storage without affecting those workloads.'
  fi
  STAGE=data-storage
  if [[ ! -f "$BASE/storage-ready" ]]; then
    prepare_data_storage
    touch "$BASE/storage-ready"
  fi
  # Verify backing disks on every retry, including after a reboot.
  for path in /var/lib/docker /var/lib/containerd /var/lib/kubelet /opt/local-path-provisioner "$HOME/prediction-manager-work" "$REPO" "$DOCKER_ROOT" "$CONTAINERD_ROOT"; do
    [[ -d "$path" ]] || fail "Data directory missing: $path"
    [[ "$(stat -Lc %d "$path")" == "$(stat -c %d /data)" ]] || fail "Wrong backing filesystem: $path"
  done
  STAGE=source
  if [[ ! -d "$REPO/.git" ]]; then
    if [[ -n "${FEDIT_SOURCE_REPO:-}" ]] && git -C "$FEDIT_SOURCE_REPO" cat-file -e "$PIN^{commit}" 2>/dev/null; then
      echo "[SOURCE] Reusing pinned commit $PIN from $FEDIT_SOURCE_REPO"
      # Copy Git objects without alternates or hardlinks: later maintenance of
      # either checkout must not invalidate the pinned installation source.
      git clone --no-hardlinks --no-checkout "$FEDIT_SOURCE_REPO" "$REPO"
      git -C "$REPO" remote set-url origin https://github.com/etri/FeDiT.git
      git -C "$REPO" checkout --detach "$PIN"
    else
      git clone --single-branch --branch OPFW_development_ETRI_pman https://github.com/etri/FeDiT.git "$REPO"
    fi
  fi
  # The dedicated checkout may contain generated files from an earlier installer.
  # Read the immutable commit via git archive instead of discarding those files.
  if ! git -C "$REPO" cat-file -e "$PIN^{commit}" 2>/dev/null; then
    git -C "$REPO" fetch origin OPFW_development_ETRI_pman
  fi
  if [[ -n "$(git -C "$REPO" status --porcelain)" ]]; then
    echo '[INFO] Existing source changes are preserved; building a fresh copy of the pinned commit.'
  else
  git -C "$REPO" checkout --detach "$PIN"
  fi
  [[ "$(git -C "$REPO" rev-parse "$PIN^{commit}")" == "$PIN" ]] || fail 'Commit mismatch.'
  BUILD_TREE="/data/fedit-pman-$(id -u)/build-source"
  sudo install -d -m 0755 -o "$(id -un)" -g "$(id -gn)" "$BUILD_TREE"
  git -C "$REPO" archive "$PIN" OPFW/ml_prediction_manager_v2 OPFW/ml_prediction_manager_v2_frontend | tar -x -C "$BUILD_TREE"
  SCRIPTS="$BUILD_TREE/OPFW/ml_prediction_manager_v2/scripts"
  # Git preserves executable bits; explicitly normalize shell scripts for transfer safety.
  find "$SCRIPTS" -name '*.sh' -exec chmod u+x {} +
  # Isolate the storage-check adaptation from the pinned Git source.
  RUNTIME="$BUILD_TREE/installer-runtime-$(date +%Y%m%d-%H%M%S)-$$"
  mkdir -p "$RUNTIME"
  cp -a "$SCRIPTS/." "$RUNTIME/"
  mkdir -p "$RUNTIME/server-a40"
  cat > "$RUNTIME/server-a40/refresh-stale-tenant-pods.py" <<'TENANT_REFRESH_PY'
"""Refresh only installer tenant Pods whose effective settings are stale."""
from decimal import Decimal, InvalidOperation
import json
import re
import shlex
import subprocess

NAMESPACE = 'kubeflow-user-example-com'


def owned_by(pod, parent, kind):
    uid = parent.get('metadata', {}).get('uid')
    return bool(uid) and any(
        owner.get('controller') is True and owner.get('kind') == kind
        and owner.get('uid') == uid
        for owner in pod.get('metadata', {}).get('ownerReferences', [])
    )


def stale_pods(statefulset, nifi, raycluster, heads):
    """A fresh/current Pod must keep its ongoing initialization."""
    stale = []
    revision = statefulset.get('status', {}).get('updateRevision')
    actual = nifi.get('metadata', {}).get('labels', {}).get('controller-revision-hash')
    if (revision and actual and revision != actual
            and owned_by(nifi, statefulset, 'StatefulSet')):
        stale.append(nifi)
    desired = raycluster.get('spec', {}).get('headGroupSpec', {}).get('rayStartParams', {}).get('num-cpus')
    if desired is None:
        return stale
    try:
        desired = Decimal(str(desired))
    except InvalidOperation as exc:
        raise ValueError('Invalid desired Ray logical CPU setting') from exc
    if not desired.is_finite() or desired < 0:
        raise ValueError('Invalid desired Ray logical CPU setting')
    for pod in heads:
        if not owned_by(pod, raycluster, 'RayCluster'):
            continue
        containers = [c for c in pod.get('spec', {}).get('containers', []) if c.get('name') == 'ray-head']
        if len(containers) != 1:
            raise ValueError('Cannot identify the existing Ray head container')
        container = containers[0]
        tokens = shlex.split(' '.join(container.get('command', []) + container.get('args', [])))
        values = []
        for index, token in enumerate(tokens):
            if token.startswith('--num-cpus='):
                values.append(token.split('=', 1)[1])
            elif token == '--num-cpus' and index + 1 < len(tokens):
                values.append(tokens[index + 1])
        if len(values) != 1:
            raise ValueError('Cannot verify the existing Ray head logical CPU setting')
        try:
            actual = Decimal(values[0])
        except InvalidOperation as exc:
            raise ValueError('Invalid existing Ray logical CPU setting') from exc
        if not actual.is_finite() or actual < 0:
            raise ValueError('Invalid existing Ray logical CPU setting')
        if actual != desired:
            stale.append(pod)
    return stale


def kubectl(*args, body=None):
    result = subprocess.run(
        ['kubectl', '--request-timeout=30s', *args],
        input=json.dumps(body) if body is not None else None,
        text=True, capture_output=True, timeout=45, check=True,
    )
    return json.loads(result.stdout or '{}')


def refresh():
    get = lambda kind, name: kubectl('-n', NAMESPACE, 'get', kind, name, '--ignore-not-found', '-o', 'json')
    statefulset = get('statefulset', 'nifi')
    nifi = get('pod', 'nifi-0')
    raycluster = get('raycluster', 'pm-ray')
    heads = kubectl('-n', NAMESPACE, 'get', 'pods', '-l',
                    'ray.io/cluster=pm-ray,ray.io/node-type=head', '-o', 'json').get('items', [])
    plan = stale_pods(statefulset, nifi, raycluster, heads)
    for pod in plan:
        meta = pod['metadata']
        name, uid = meta['name'], meta['uid']
        if meta.get('namespace') != NAMESPACE or not re.fullmatch(r'[a-z0-9][a-z0-9.-]*', name):
            raise ValueError('Refusing an unexpected tenant Pod identity')
        options = {'apiVersion': 'v1', 'kind': 'DeleteOptions', 'preconditions': {'uid': uid}}
        kubectl('delete', '--raw', f'/api/v1/namespaces/{NAMESPACE}/pods/{name}', '-f', '-', body=options)
        print(f'[INFO] Refreshing stale tenant Pod {NAMESPACE}/{name}', flush=True)
    if not plan:
        print('[PASS] Current tenant Pods retained; no unnecessary initialization restart', flush=True)


if __name__ == '__main__':
    refresh()
TENANT_REFRESH_PY
  cat > "$RUNTIME/server-a40/ensure-docker-bridge.py" <<'DOCKER_BRIDGE_PY'
"""Restore only this installer's Docker gateway; preserve other addresses/rules."""
import ipaddress
import json
import os
import subprocess

SUBNET = ipaddress.ip_network('10.254.254.192/28')
GATEWAY = '10.254.254.193'


def command(*args):
    return subprocess.check_output(args, text=True, timeout=30)


def ensure_bridge(run=command):
    networks = json.loads(run('docker', 'network', 'inspect', 'bridge'))
    if len(networks) != 1 or networks[0].get('Name') != 'bridge' or networks[0].get('Driver') != 'bridge':
        raise RuntimeError('Cannot identify the local Docker bridge')
    network = networks[0]
    pools = (network.get('IPAM') or {}).get('Config') or []
    owned = [p for p in pools if p.get('Subnet') == str(SUBNET)]
    if not owned:
        print('[SKIP] Docker bridge uses another address profile; left unchanged')
        return False
    interface = (network.get('Options') or {}).get('com.docker.network.bridge.name', 'docker0')
    if len(owned) != 1 or owned[0].get('Gateway') != GATEWAY or interface != 'docker0':
        raise RuntimeError('Unexpected gateway/interface for the installer Docker subnet')
    links = json.loads(run('ip', '-j', '-d', 'link', 'show', 'dev', interface))
    if len(links) != 1 or (links[0].get('linkinfo') or {}).get('info_kind') != 'bridge':
        raise RuntimeError('The Docker interface is not a Linux bridge')

    def present():
        rows = json.loads(run('ip', '-j', '-4', 'address', 'show', 'dev', interface))
        return any(a.get('local') == GATEWAY and a.get('prefixlen') == SUBNET.prefixlen
                   for row in rows for a in row.get('addr_info', []))

    if present():
        print('[PASS] Docker bridge gateway matches its IPAM configuration')
        return False
    # Do not flush the interface or delete existing aliases, networks or rules.
    # Existing containers can still use their previous gateway during migration.
    run('ip', 'address', 'replace', f'{GATEWAY}/{SUBNET.prefixlen}', 'dev', interface)
    if not present():
        raise RuntimeError('Docker bridge gateway repair did not take effect')
    print('[PASS] Restored Docker bridge gateway 10.254.254.193/28; other addresses preserved')
    return True


if __name__ == '__main__':
    if os.geteuid() != 0:
        raise SystemExit('Run this Docker network check with sudo')
    ensure_bridge()
DOCKER_BRIDGE_PY
  python3 - "$RUNTIME/scripts/bootstrap-verification.sh" <<'PY'
import pathlib,sys
p=pathlib.Path(sys.argv[1]); s=p.read_text()
# Keep Docker IPAM and the live bridge gateway consistent after runtime setup.
bridge_function = 'ensure_docker_bridge_gateway() {\n  python3 "${SCRIPT_DIR}/../server-a40/ensure-docker-bridge.py"\n}\n\n'
assert s.count('retry_command() {') == 1
s=s.replace('retry_command() {', bridge_function+'retry_command() {', 1)
bridge_loop = '  for try in $(seq 1 "$attempts"); do\n'
assert s.count(bridge_loop) == 1
s=s.replace(bridge_loop, bridge_loop+'    if [[ "${1:-}" == docker && ( "${2:-}" == build || "${2:-}" == buildx ) ]]; then\n      ensure_docker_bridge_gateway\n    fi\n', 1)
bridge_setup = '  ensure_local_registry\n\n  if bool_true "$VERIFY_DOCKER_GPU"; then'
assert s.count(bridge_setup) == 1
s=s.replace(bridge_setup, '  ensure_docker_bridge_gateway\n'+bridge_setup, 1)
# Renew short-lived Docker Hub tokens and preserve resumable, verified blobs.
api_start=s.index('pull_docker_image_via_registry_api() {')
api_end=s.index('\npull_and_mirror_docker_image() {',api_start)
s=s[:api_start]+r'''pull_docker_image_via_registry_api() {
  # Persist verified/partial blobs across retries; only remove them after load.
  local source="$1" archive cache_key cache
  local registry_name="${source%%/*}"
  if [[ "$source" == */* && ( "$registry_name" == *.* || "$registry_name" == *:* ) && \
      "$registry_name" != docker.io ]]; then
    echo "Registry API fallback supports Docker Hub images only: ${source}" >&2
    return 1
  fi
  cache_key=$(printf '%s' "$source" | sha256sum)
  cache_key=${cache_key%% *}
  [[ "$cache_key" =~ ^[a-f0-9]{64}$ ]] || return 1
  cache="${DOWNLOADS_DIR}/registry-image-cache/$cache_key"
  mkdir -p "$cache"
  archive="$(mktemp "${DOWNLOADS_DIR}/docker-registry-image.XXXXXX.tar")"
  if ! python3 - "$source" "$archive" "$cache" <<'REGISTRY_DOWNLOAD_PY'
import hashlib
import json
import os
import sys
import tarfile
import time
import urllib.error
import urllib.parse
import urllib.request

source, archive, work = sys.argv[1:]
if source.startswith("docker.io/"):
    source = source[len("docker.io/"):]
repo = source.split(":", 1)[0]
if "/" not in repo:
    repo = "library/" + repo
tag = source.rsplit(":", 1)[1] if ":" in source.rsplit("/", 1)[-1] else "latest"
registry = "https://registry-1.docker.io"
scope = urllib.parse.quote(f"repository:{repo}:pull", safe="")
token_url = f"https://auth.docker.io/token?service=registry.docker.io&scope={scope}"
auth = {}
auth_deadline = 0.0

def read_url(url, headers=None, attempts=8):
    last = None
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}), timeout=120) as response:
                return response.read()
        except Exception as exc:
            last = exc
            if isinstance(exc, urllib.error.HTTPError) and exc.code in (401, 403) and headers and "Authorization" in headers:
                headers = {**headers, **registry_auth(force=True)}
            if attempt + 1 < attempts:
                time.sleep(min(5, 1 + attempt))
    raise RuntimeError(f"registry request failed: {url}: {last}")

def registry_auth(force=False):
    global auth_deadline
    if force or time.monotonic() >= auth_deadline:
        payload = json.loads(read_url(token_url))
        auth["Authorization"] = "Bearer " + payload["token"]
        auth_deadline = time.monotonic() + max(1, int(payload.get("expires_in") or 300) - 30)
    return dict(auth)

accept = ", ".join([
    "application/vnd.oci.image.index.v1+json",
    "application/vnd.docker.distribution.manifest.list.v2+json",
    "application/vnd.oci.image.manifest.v1+json",
    "application/vnd.docker.distribution.manifest.v2+json",
])
index = json.loads(read_url(f"{registry}/v2/{repo}/manifests/{tag}", {**registry_auth(), "Accept": accept}))
if "manifests" in index:
    candidates = [item for item in index["manifests"]
                  if item.get("platform", {}).get("os") == "linux"
                  and item.get("platform", {}).get("architecture") == "amd64"]
    if not candidates:
        raise RuntimeError("Docker Hub manifest has no linux/amd64 image")
    index = json.loads(read_url(f"{registry}/v2/{repo}/manifests/{candidates[0]['digest']}", {
        **registry_auth(), "Accept": accept
    }))

os.makedirs(os.path.join(work, "blobs", "sha256"), exist_ok=True)

def blob_hash(path):
    value = hashlib.sha256()
    with open(path, "rb") as downloaded:
        for chunk in iter(lambda: downloaded.read(8 * 1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()

def download_blob(digest, path, size):
    algorithm, separator, expected = digest.partition(":")
    if algorithm != "sha256" or len(expected) != 64 or any(c not in "0123456789abcdef" for c in expected):
        raise RuntimeError("Invalid Registry blob digest")
    size = int(size)
    if size < 0:
        raise RuntimeError("Invalid Registry blob size")
    url = f"{registry}/v2/{repo}/blobs/{digest}"
    for attempt in range(12):
        existing = os.path.getsize(path) if os.path.exists(path) else 0
        if os.path.exists(path) and existing >= size:
            if existing == size and blob_hash(path) == expected:
                print(f"[PASS] Cached Registry blob verified: {digest[:19]}", flush=True)
                return
            open(path, "wb").close()
            existing = 0
        headers = registry_auth()
        if existing:
            headers["Range"] = f"bytes={existing}-"
        try:
            print(f"[INFO] Registry blob {digest[:19]}: {existing}/{size} bytes", flush=True)
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=120) as response:
                if existing and response.status == 200:
                    existing = 0
                    open(path, "wb").close()
                received = existing
                last_progress = time.monotonic()
                with open(path, "ab" if existing else "wb") as output:
                    while True:
                        chunk = response.read(8 * 1024 * 1024)
                        if not chunk:
                            break
                        output.write(chunk)
                        received += len(chunk)
                        if time.monotonic() - last_progress >= 60:
                            print(f"[INFO] Registry blob {digest[:19]}: {received}/{size} bytes", flush=True)
                            last_progress = time.monotonic()
            if os.path.getsize(path) == size and blob_hash(path) == expected:
                print(f"[PASS] Registry blob digest verified: {digest[:19]}", flush=True)
                return
            raise RuntimeError(f"blob size or digest mismatch: {digest}")
        except Exception as exc:
            if isinstance(exc, urllib.error.HTTPError) and exc.code in (401, 403):
                registry_auth(force=True)
            print(f"[WARN] Registry blob retry {attempt + 1}: {digest[:19]}: {exc}", flush=True)
            if attempt == 11:
                raise RuntimeError(f"blob download failed {digest}: {exc}")
            time.sleep(min(8, 1 + attempt))

config_digest = index["config"]["digest"]
config_name = f"blobs/sha256/{config_digest.split(':', 1)[1]}"
download_blob(config_digest, os.path.join(work, config_name), index["config"]["size"])
layer_names = []
for layer in index["layers"]:
    name = f"blobs/sha256/{layer['digest'].split(':', 1)[1]}"
    download_blob(layer["digest"], os.path.join(work, name), layer["size"])
    layer_names.append(name)
with open(os.path.join(work, "manifest.json"), "w", encoding="utf-8") as output:
    json.dump([{"Config": config_name, "RepoTags": [source], "Layers": layer_names}], output)
with tarfile.open(archive, "w") as output:
    for name in ["manifest.json", config_name, *layer_names]:
        output.add(os.path.join(work, name), arcname=name)
REGISTRY_DOWNLOAD_PY
  then
    rm -f -- "$archive"
    return 1
  fi
  if ! docker load --input "$archive" >/dev/null; then
    rm -f -- "$archive"
    return 1
  fi
  rm -f -- "$archive"
  rm -rf -- "$cache"
}
'''+s[api_end:]
old='df -BG --output=avail / |'
assert s.count(old)==1, 'Pinned installer disk check changed'
s=s.replace(old,'df -BG --output=avail /data |')
old_gate='  ((disk >= MIN_DISK_GIB)) || { echo "디스크 부족: ${disk} GiB" >&2; return 1; }'
assert s.count(old_gate)==1, 'Pinned installer capacity gate changed'
new_gate='  if ((disk < MIN_DISK_GIB)); then record WARN "Disk capacity recommendation" "/data ${disk} GiB; historical recommendation ${MIN_DISK_GIB} GiB; continuing without a capacity gate"; fi'
s=s.replace(old_gate,new_gate)
old_helper="if '_mlflow_pip_requirements()' not in text:"
assert s.count(old_helper)==1, 'Pinned MLflow helper patch changed'
s=s.replace(old_helper,"if 'def _mlflow_pip_requirements(' not in text:")
s=s.replace('nvidia/cuda:12.4.1-base-ubuntu22.04','nvidia/cuda:11.8.0-base-ubuntu22.04')
# Keep a progressing clean download alive on slower server connections.
s=s.replace('${IMAGE_PULL_TIMEOUT_SECONDS:=300}', '${IMAGE_PULL_TIMEOUT_SECONDS:=1800}')
s=s.replace('${LARGE_IMAGE_PULL_TIMEOUT_SECONDS:=900}', '${LARGE_IMAGE_PULL_TIMEOUT_SECONDS:=7200}')
s=s.replace('${LARGE_IMAGE_PULL_TIMEOUT_SECONDS:-900}', '${LARGE_IMAGE_PULL_TIMEOUT_SECONDS:-7200}')
s=s.replace('${IMAGE_PULL_TIMEOUT_SECONDS:-300}', '${IMAGE_PULL_TIMEOUT_SECONDS:-1800}')
for expression in ('${3:-}', '$source'):
    old=f'[[ "{expression}" == *seldonio/mlserver* || "{expression}" == *kserve-mlserver* ]]'
    argument='$*' if expression=='${3:-}' else expression
    new=f'[[ "{argument}" == *seldonio/mlserver* || "{argument}" == *kserve-mlserver* || "{argument}" == *ml-pipeline/visualization-server* || "{argument}" == *ml-pipeline/metadata-writer* ]]'
    assert s.count(old)==1, 'Pinned large-image classifier changed'
    s=s.replace(old,new)
large_case='*kserve-mlserver*|*seldonio/mlserver*)'
assert s.count(large_case)==1
s=s.replace(large_case, '*kserve-mlserver*|*seldonio/mlserver*|*ml-pipeline/visualization-server*|*ml-pipeline/metadata-writer*)')
alias_anchor='  local mirror_suffix mirror_image\n'
assert s.count(alias_anchor)==1, 'Pinned image fallback function changed'
s=s.replace(alias_anchor, alias_anchor+'''  # CRI resolves canonical Docker references; a short ctr alias is not enough.
  local first_component="${image%%/*}"
  if [[ "$image" != */* ]]; then
    image="docker.io/library/$image"
  elif [[ "$first_component" != *.* && "$first_component" != *:* && "$first_component" != localhost ]]; then
    image="docker.io/$image"
  fi
  if [[ "$image" == index.docker.io/* ]]; then image="docker.io/${image#index.docker.io/}"; fi
  if [[ "$image" == docker.io/* && "${image#docker.io/}" != */* ]]; then
    image="docker.io/library/${image#docker.io/}"
  fi
''')
prefetch_anchor='  prime_knative_control_plane_images "$kubeflow_bootstrap_manifest"\n'
assert s.count(prefetch_anchor)==1, 'Pinned Kubeflow image ordering changed'
s=s.replace(prefetch_anchor, prefetch_anchor+'  prime_manifest_images "${GENERATED_DIR}/kubeflow.yaml" "Kubeflow full workload"\n')
prefetch_start=s.index('prime_manifest_images() {')
prefetch_end=s.index('\nwait_namespace_workloads()', prefetch_start)
prefetch=s[prefetch_start:prefetch_end]
loop='  for image in "${images[@]:-}"; do'
assert prefetch.count(loop)==1
prefetch=prefetch.replace(loop, '  mapfile -t images < <(printf \'%s\\n\' "${images[@]}" | sort -u)\n'+loop)
prefetch=prefetch.replace('    retry_kubernetes_image_pull "$image"', '    if ! crictl inspecti "$image" >/dev/null 2>&1; then\n      retry_kubernetes_image_pull "$image"\n    fi')
s=s[:prefetch_start]+prefetch+s[prefetch_end:]
# A controller's ProgressDeadlineExceeded response is immediate, not a whole
# 60-second watch. Count actual waiting; retain separate image-repair retries.
wait_start=s.index('wait_rollout_if_exists() {')
wait_end=s.index('\ndownload_verified_kubernetes_manifest()',wait_start)
wait=s[wait_start:wait_end]
wait=wait.replace('local remaining_seconds slice_seconds desired_replicas ready_replicas rollout_output', 'local remaining_seconds slice_seconds desired_replicas ready_replicas rollout_output rollout_started recovery_started recovery_elapsed')
wait=wait.replace('    while ((remaining_seconds > 0)); do', '    while ((remaining_seconds > 0)); do\n      rollout_started=$SECONDS')
wait=wait.replace('remaining_seconds=$((remaining_seconds - 5))', 'remaining_seconds=$((remaining_seconds - (SECONDS - rollout_started)))')
wait=wait.replace('      if recover_image_pull_failures "$namespace"; then', '      recovery_started=$SECONDS\n      if recover_image_pull_failures "$namespace"; then')
wait=wait.replace('      remaining_seconds=$((remaining_seconds - slice_seconds))', '      recovery_elapsed=$((SECONDS - recovery_started))\n      sleep 1\n      remaining_seconds=$((remaining_seconds - (SECONDS - rollout_started - recovery_elapsed)))')
s=s[:wait_start]+wait+s[wait_end:]
dcgm_wait='    wait_rollout_if_exists monitoring daemonset dcgm-exporter 900s'
assert s.count(dcgm_wait)==1, 'Pinned DCGM rollout call changed'
s=s.replace(dcgm_wait, '''    helm get manifest dcgm-exporter --namespace monitoring > "${GENERATED_DIR}/dcgm-exporter.yaml"
    IMAGE_PULL_TIMEOUT_SECONDS="$LARGE_IMAGE_PULL_TIMEOUT_SECONDS" \\
      prime_manifest_images "${GENERATED_DIR}/dcgm-exporter.yaml" "DCGM Exporter"
'''+dcgm_wait)
s=s.replace('curl -kLsS -o /dev/null', 'curl --retry 3 --retry-all-errors --retry-delay 3 -kLsS -o /dev/null')
old_modules='    modprobe overlay\n    modprobe br_netfilter'
assert s.count(old_modules)==1, 'Pinned kernel feature initialization changed'
s=s.replace(old_modules, '    grep -qw overlay /proc/filesystems || modprobe overlay\n    [[ -e /proc/sys/net/bridge/bridge-nf-call-iptables ]] || modprobe br_netfilter')
swap_anchor='    swapoff -a'
assert s.count(swap_anchor)==1, 'Pinned swap initialization changed'
s=s.replace(swap_anchor,'''    if [[ -e /dev/dxg ]] && grep -qi microsoft /proc/sys/kernel/osrelease; then
      awk 'NR>1 {print $1}' /proc/swaps > /run/prediction-manager-wsl-swap-devices
    fi
'''+swap_anchor)
assert s.count('  sysctl --system >/dev/null')==1, 'Pinned sysctl initialization changed'
s=s.replace('  sysctl --system >/dev/null','''  sysctl -p /etc/sysctl.d/99-prediction-manager-verification.conf >/dev/null
  # WSL imports use a private root mount. Kubernetes host-root collectors
  # require propagation; retain the real host filesystem and all collectors.
  if [[ -e /dev/dxg ]] && grep -qi microsoft /proc/sys/kernel/osrelease; then
    cat > /etc/systemd/system/prediction-manager-root-propagation.service <<'MOUNT_UNIT'
[Unit]
Description=Shared root mount for Prediction Manager Kubernetes host mounts
After=local-fs.target
Before=containerd.service docker.service kubelet.service
[Service]
Type=oneshot
ExecStart=/bin/mount --make-rshared /
RemainAfterExit=yes
[Install]
WantedBy=multi-user.target
MOUNT_UNIT
    systemctl daemon-reload
    systemctl enable --now prediction-manager-root-propagation.service >/dev/null
    record WARN "WSL root mount propagation" "Enabled shared propagation before runtimes, including subsequent boots"
  fi''')
gpu_anchor='  local plugin_release=nvidia-device-plugin'
assert s.count(gpu_anchor)==1, 'Pinned GPU plugin installation changed'
gpu_label='''  # A verified GPU may be virtualized without an NVIDIA PCI ID (WSL).
  # Label the current single-node host; the plugin must still discover and
  # advertise real devices, and the final CUDA workload must still pass.
  local gpu_node
  gpu_node="$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')"
  [[ -n "$gpu_node" ]] || { echo "GPU node not found" >&2; return 1; }
  kubectl label node "$gpu_node" nvidia.com/gpu.present=true --overwrite
  local gfd_enabled=true
  if [[ -e /dev/dxg ]] && grep -qi microsoft /proc/sys/kernel/osrelease; then
    gfd_enabled=false
    record WARN "WSL GPU feature discovery" "PCI sysfs is unavailable; use verified host label; real device plugin and CUDA tests remain required"
  fi
'''
s=s.replace(gpu_anchor,gpu_label+gpu_anchor)
assert s.count('--set gfd.enabled=true')==2, 'Pinned GPU feature discovery settings changed'
s=s.replace('--set gfd.enabled=true','--set "gfd.enabled=${gfd_enabled}"')
minio_helper=r'''prepare_pinned_minio_image() {
  local manifest="$1" context="${DOWNLOADS_DIR}/minio-source-image" image="${REGISTRY_HOST}/pm-minio:RELEASE.2023-03-20T20-16-18Z"
  mkdir -p "$context"
  if ! docker image inspect "$image" >/dev/null 2>&1; then
    curl -fL --retry 3 --retry-all-errors --connect-timeout 15 --max-time 300 \
      https://codeload.github.com/minio/minio/tar.gz/a002f2b376e783f5309adc5996afc7769ba357cc \
      -o "$context/source.tar.gz"
    printf '7e40ca12f4bb6b2be7054a2982cf1d4250ad749e25a291ff9e2b9d0b980a415e  %s\n' "$context/source.tar.gz" | sha256sum -c -
    cat > "$context/Dockerfile" <<'MINIO_DOCKERFILE'
FROM golang:1.20.2 AS build
WORKDIR /src
ADD source.tar.gz /src/
WORKDIR /src/minio-a002f2b376e783f5309adc5996afc7769ba357cc
RUN CGO_ENABLED=0 go build -trimpath -ldflags='-s -w -X github.com/minio/minio/cmd.Version=2023-03-20T20:16:18Z -X github.com/minio/minio/cmd.ReleaseTag=RELEASE.2023-03-20T20-16-18Z -X github.com/minio/minio/cmd.CommitID=a002f2b376e783f5309adc5996afc7769ba357cc -X github.com/minio/minio/cmd.ShortCommitID=a002f2b376e7 -X github.com/minio/minio/cmd.CopyrightYear=2023' -o /out/minio .
FROM ubuntu:22.04
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /out/minio /usr/bin/minio
COPY --from=build /src/minio-a002f2b376e783f5309adc5996afc7769ba357cc/LICENSE /licenses/LICENSE
EXPOSE 9000
ENTRYPOINT ["/usr/bin/minio"]
MINIO_DOCKERFILE
    retry_command 3 10 "Pinned upstream MinIO source build" docker buildx build --load --pull -t "$image" "$context"
  fi
  retry_command 3 10 "Pinned MinIO push" docker push "$image"
  docker run --rm "$image" --version | tee "$context/version.txt"
  grep -Fq 'minio version RELEASE.2023-03-20T20-16-18Z' "$context/version.txt"
  python3 - "$manifest" "$image" <<'MINIO_PATCH'
import pathlib,sys,yaml
p=pathlib.Path(sys.argv[1]); docs=list(yaml.safe_load_all(p.read_text()))
def visit(obj):
    if isinstance(obj,dict):
        if obj.get('image') == 'minio/minio:RELEASE.2023-03-20T20-16-18Z':
            obj['image']=sys.argv[2]
            obj['imagePullPolicy']='IfNotPresent'
        for v in obj.values(): visit(v)
    elif isinstance(obj,list):
        for v in obj: visit(v)
for doc in docs: visit(doc)
p.write_text(yaml.safe_dump_all(docs,sort_keys=False,explicit_start=True))
MINIO_PATCH
  record PASS "Pinned MinIO" "Official release source a002f2b376e783f5309adc5996afc7769ba357cc built locally; archive checksum verified"
}

'''
assert s.count('install_kubeflow() {')==1, 'Pinned Kubeflow function changed'
s=s.replace('install_kubeflow() {',minio_helper+'install_kubeflow() {')
minio_anchor='  local kubeflow_bootstrap_manifest="${GENERATED_DIR}/kubeflow-bootstrap.yaml"'
assert s.count(minio_anchor)==1, 'Pinned Kubeflow image preparation changed'
s=s.replace(minio_anchor,'  prepare_pinned_minio_image "${GENERATED_DIR}/kubeflow.yaml"\n'+minio_anchor)
compact_helper=r'''prepare_compact_kubeflow_manifest() {
  bool_true "$LOW_MEMORY_PROFILE_ACTIVE" || return 0
  python3 - "$1" <<'COMPACT_PATCH'
import pathlib,sys,yaml
p=pathlib.Path(sys.argv[1]); docs=list(yaml.safe_load_all(p.read_text()))
for doc in docs:
    if not isinstance(doc,dict) or doc.get('kind') not in ('Deployment','StatefulSet','DaemonSet'): continue
    template=doc.setdefault('spec',{}).setdefault('template',{})
    annotations=template.setdefault('metadata',{}).setdefault('annotations',{})
    annotations['sidecar.istio.io/proxyCPU']='10m'
    annotations['sidecar.istio.io/proxyMemory']='64Mi'
    metadata=doc.get('metadata',{})
    name=metadata.get('name','')
    for container in template.setdefault('spec',{}).get('containers',[]):
        resources=container.setdefault('resources',{})
        resources['requests']={'cpu':'10m','memory':'64Mi'}
        for probe in ('livenessProbe','readinessProbe','startupProbe'):
            if probe in container:
                container[probe].update(timeoutSeconds=10,failureThreshold=12)
        if name=='istiod' and container.get('name')=='discovery':
            resources['requests']={'cpu':'200m','memory':'256Mi'}
        if (name,container.get('name')) in (('kserve-controller-manager','manager'),('net-istio-webhook','webhook'),('kuberay-operator','kuberay-operator')):
            resources['requests']={'cpu':'100m','memory':'256Mi'}
            resources['limits']={'cpu':'1','memory':'768Mi'}
        if name=='kserve-controller-manager' and container.get('name')=='manager':
            container.setdefault('livenessProbe',{})['initialDelaySeconds']=60
            container.setdefault('readinessProbe',{})['initialDelaySeconds']=30
    if doc.get('kind')=='Deployment' and doc['spec'].get('strategy',{}).get('type','RollingUpdate')!='Recreate':
        doc['spec']['strategy']={'type':'RollingUpdate','rollingUpdate':{'maxSurge':0,'maxUnavailable':1}}
p.write_text(yaml.safe_dump_all(docs,sort_keys=False,explicit_start=True))
COMPACT_PATCH
}

'''
s=s.replace('install_kubeflow() {',compact_helper+'install_kubeflow() {')
s=s.replace(minio_anchor,'  prepare_compact_kubeflow_manifest "${GENERATED_DIR}/kubeflow.yaml"\n'+minio_anchor)
wait_anchor='  apply_with_retry "$kubeflow_bootstrap_manifest"\n  wait_rollout_if_exists kubeflow deployment kserve-controller-manager 900s'
assert s.count(wait_anchor)==1, 'Pinned KServe bootstrap wait changed'
s=s.replace(wait_anchor,'  apply_with_retry "$kubeflow_bootstrap_manifest"\n  apply_cpu_single_node_resource_profile\n  wait_rollout_if_exists kubeflow deployment kserve-controller-manager 900s')
profile_start=s.index('apply_cpu_single_node_resource_profile() {')
profile_end=s.index('restore_full_kubeflow_workloads()',profile_start)
profile=s[profile_start:profile_end]
profile=profile.replace('--requests=cpu=25m,memory=64Mi','--requests=cpu=10m,memory=64Mi')
profile=profile.replace('--requests=cpu=250m,memory=256Mi','--requests=cpu=100m,memory=256Mi')
profile=profile.replace('25m CPU / 64Mi memory','10m CPU / 64Mi memory')
s=s[:profile_start]+profile+s[profile_end:]
# Build the frontend while only the small Kubernetes core is running. Keeping
# all Kubeflow workloads live during webpack can exhaust memory on this lab.
image_function=s.index('build_and_push_images() {')
frontend_start=s.index('  if bool_true "$BUILD_FRONTEND_IMAGE"; then',image_function)
frontend_end=s.index('  retry_command 5 10 "Prediction Manager image push"',frontend_start)
frontend_block=s[frontend_start:frontend_end]
assert frontend_block.rstrip().endswith('fi'), 'Pinned frontend build block changed'
s=s[:frontend_start]+'  prepare_frontend_before_platform\n'+s[frontend_end:]
frontend_helper='''prepare_frontend_before_platform() {
  [[ "${PM_FRONTEND_PREBUILT:-false}" != true ]] || return 0
'''+frontend_block+'''  PM_FRONTEND_PREBUILT=true
}

'''
s=s.replace('build_and_push_images() {',frontend_helper+'build_and_push_images() {',1)
platform_stage='run_stage 60-kubeflow "Kubeflow/KFP/KServe/KubeRay" install_kubeflow'
assert s.count(platform_stage)==1, 'Pinned Kubeflow stage changed'
s=s.replace(platform_stage,'run_always "Frontend build before platform services" prepare_frontend_before_platform\n'+platform_stage)
wsl_swap_helper='''configure_wsl_host_swap() {
  [[ -e /dev/dxg ]] && grep -qi microsoft /proc/sys/kernel/osrelease || return 0
  [[ -s /run/prediction-manager-wsl-swap-devices ]] || return 0
  # Kubernetes containers retain NoSwap. Restore the WSL host swap that was
  # active before kubeadm, so standalone Docker verification can page safely.
  python3 - <<'WSL_SWAP_CONFIG'
import pathlib,yaml
p=pathlib.Path('/var/lib/kubelet/config.yaml'); d=yaml.safe_load(p.read_text())
d['failSwapOn']=False
d['memorySwap']={'swapBehavior':'NoSwap'}
d.setdefault('featureGates',{})['NodeSwap']=True
p.write_text(yaml.safe_dump(d,sort_keys=False))
WSL_SWAP_CONFIG
  systemctl restart kubelet
  local swap_device
  while IFS= read -r swap_device; do
    [[ -n "$swap_device" ]] || continue
    if ! awk 'NR>1 {print $1}' /proc/swaps | grep -Fxq "$swap_device"; then
      swapon "$swap_device"
    fi
  done < /run/prediction-manager-wsl-swap-devices
  record WARN "WSL host swap" "Restored existing host swap; Kubernetes workloads remain NoSwap"
}

'''
s=s.replace('install_kubernetes() {',wsl_swap_helper+'install_kubernetes() {',1)
kubernetes_stage='run_stage 30-kubernetes "Kubernetes 단일 노드 구성" install_kubernetes'
assert s.count(kubernetes_stage)==1, 'Pinned Kubernetes stage changed'
s=s.replace(kubernetes_stage,kubernetes_stage+'\nrun_always "WSL host swap with Kubernetes NoSwap" configure_wsl_host_swap')
# Label Studio has a dedicated startup/resource profile. Generic post-tenant
# tuning must not change its Pod template after its successful deployment wait.
label_case='kubeflow-user-example-com/deployment.apps/pm-mlflow|kubeflow-user-example-com/statefulset.apps/nifi)'
assert s.count(label_case)==1, 'Pinned tenant resource exclusions changed'
s=s.replace(label_case,label_case[:-1]+'|kubeflow/deployment.apps/label-studio)')
probe_anchor='    for item in document.get("items", []):\n        containers = []'
assert s.count(probe_anchor)==1, 'Pinned generic probe updater changed'
s=s.replace(probe_anchor,'    for item in document.get("items", []):\n        if (item.get("metadata", {}).get("namespace"), item.get("metadata", {}).get("name")) == ("kubeflow", "label-studio"):\n            continue\n        containers = []')
label_start=s.index('render_label_studio() {')
label_end=s.index('\ndeploy_prediction_manager()',label_start)
label=s[label_start:label_end]
label_anchor='Path(output).write_text(text, encoding="utf-8")'
assert label.count(label_anchor)==1, 'Pinned Label Studio renderer changed'
label_patch='''
import yaml
label_docs=list(yaml.safe_load_all(text))
for label_doc in label_docs:
    if not isinstance(label_doc,dict) or label_doc.get('kind')!='Deployment' or label_doc.get('metadata',{}).get('name')!='label-studio':
        continue
    for label_container in label_doc['spec']['template']['spec']['containers']:
        if label_container.get('name')!='label-studio': continue
        if compact.lower() in {'1','true','yes','on'}:
            label_container['resources']={'requests':{'cpu':'100m','memory':'128Mi'},'limits':{'cpu':'1','memory':'2Gi'}}
        label_container['startupProbe']={'httpGet':{'path':'/health','port':'http'},'timeoutSeconds':10,'periodSeconds':10,'failureThreshold':90}
        for label_probe in ('readinessProbe','livenessProbe'):
            if label_probe in label_container: label_container[label_probe]['timeoutSeconds']=10
text=yaml.safe_dump_all(label_docs,sort_keys=False)
'''
label=label.replace(label_anchor,label_patch+label_anchor)
s=s[:label_start]+label+s[label_end:]
http_start=s.index('wait_for_http_endpoint() {')
http_end=s.index('\nconfigure_host_firewall_ports()',http_start)
s=s[:http_start]+'''wait_for_http_endpoint() {
  local url="$1" name="$2" budget="${SERVICE_HTTP_READY_TIMEOUT_SECONDS:-1200}" code remaining request_limit pause deadline
  [[ "$budget" =~ ^[1-9][0-9]*$ ]] || { echo 'Invalid service HTTP readiness timeout' >&2; return 1; }
  deadline=$((SECONDS + budget))
  while (( SECONDS < deadline )); do
    remaining=$((deadline - SECONDS))
    request_limit=$remaining
    (( request_limit <= 10 )) || request_limit=10
    code="$(curl -sS --connect-timeout 3 --max-time "$request_limit" -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
    if [[ "$code" =~ ^2[0-9][0-9]$ ]]; then
      record PASS "${name} HTTP 준비" "${url} (${code})"
      return 0
    fi
    remaining=$((deadline - SECONDS))
    (( remaining > 0 )) || break
    pause=$remaining
    (( pause <= 2 )) || pause=2
    sleep "$pause"
  done
  echo "${name} HTTP endpoint가 ${budget}초 안에 준비되지 않았습니다: ${url} (last=${code:-000})" >&2
  return 1
}
'''+s[http_end:]
# Keep fresh tenant initialization intact; only an older revision/CPU setting needs a refresh.
tenant_start=s.index('  # StatefulSet의 Pending 이전 revision Pod는')
tenant_end=s.index('  wait_rollout_if_exists kubeflow-user-example-com statefulset nifi 1200s',tenant_start)
old_tenant=s[tenant_start:tenant_end]
assert 'delete pod nifi-0 --wait=false' in old_tenant and 'delete pod -l ray.io/node-type=head' in old_tenant
s=s[:tenant_start]+'  if bool_true "$LOW_MEMORY_PROFILE_ACTIVE"; then\n    python3 "${SCRIPT_DIR}/../server-a40/refresh-stale-tenant-pods.py"\n  fi\n'+s[tenant_end:]
# A 25m CPU share starves Java initialization while the full platform and Ray start.
# Keep the compact memory envelope and all services; reserve only 75m more CPU.
nifi_cpu='    nifi_request_cpu=25m\n    nifi_request_memory=256Mi\n    nifi_limit_cpu=500m\n'
assert s.count(nifi_cpu)==1, 'Pinned compact NiFi CPU settings changed'
s=s.replace(nifi_cpu,'    nifi_request_cpu=100m\n    nifi_request_memory=256Mi\n    nifi_limit_cpu=1\n')
p.write_text(s)
PY
  # The pinned NiFi image uses Debian 11. Its removed security packages remain
  # in Debian's signed official archive; retain package signature verification.
  python3 - "$BUILD_TREE/OPFW/ml_prediction_manager_v2/docker/nifi-python/Dockerfile" <<'PY'
import pathlib,sys
p=pathlib.Path(sys.argv[1]); s=p.read_text()
old='RUN apt-get update '
assert s.count(old)==1, 'Pinned NiFi apt initialization changed'
new="RUN sed -i 's|http://deb.debian.org/debian-security|https://archive.debian.org/debian-security|g' /etc/apt/sources.list && apt-get -o Acquire::Retries=3 update "
p.write_text(s.replace(old,new))
PY
  python3 - "$BUILD_TREE/OPFW/ml_prediction_manager_v2/app/services" <<'PY'
import ast,pathlib,sys
changed=0
for p in pathlib.Path(sys.argv[1]).glob('*.py'):
    s=p.read_text(); edits=[]
    offsets=[0]
    for line in s.splitlines(keepends=True): offsets.append(offsets[-1]+len(line))
    for node in ast.walk(ast.parse(s)):
        if not (isinstance(node,ast.Call) and isinstance(node.func,ast.Attribute)
                and node.func.attr=='V1PersistentVolumeClaimSpec'): continue
        for kw in node.keywords:
            value=kw.value
            if (kw.arg=='resources' and isinstance(value,ast.Call)
                    and isinstance(value.func,ast.Attribute)
                    and value.func.attr=='V1ResourceRequirements'):
                end=offsets[value.func.end_lineno-1]+value.func.end_col_offset
                edits.append((end-len('V1ResourceRequirements'),end))
    for start,end in sorted(edits,reverse=True):
        assert s[start:end]=='V1ResourceRequirements'
        s=s[:start]+'V1VolumeResourceRequirements'+s[end:]
    if edits:
        ast.parse(s); p.write_text(s); changed+=len(edits)
assert changed==5, f'Pinned PVC resource constructors changed: {changed}'
print(f'Kubernetes PVC resource compatibility: {changed} constructors corrected')
PY
  printf 'Acquire::Retries "3";\nDPkg::Lock::Timeout "120";\n' > "$RUNTIME/apt-retry.conf"
  if [[ ! -f "$CONFIG" ]]; then
    cp "$SCRIPTS/verification-install.env.example" "$CONFIG"
    cat "$SCRIPTS/profiles/server-a40.env.example" >> "$CONFIG"
    cat >> "$CONFIG" <<'ENV'
PORTABLE_NETWORK_CONFIG=false
POD_NETWORK_CIDR=10.254.250.0/23
SERVICE_CIDR=10.254.252.0/24
AUTO_REBOOT_AFTER_DRIVER=false
ALLOW_EXISTING_CLUSTER=false
FORCE_REINSTALL=false
ENV
  fi
  {
    echo 'AUTO_DETECT_SOURCE_PATHS=false'
    echo 'CHECK_MIN_CPU_CORES=false'
    echo 'IMAGE_PULL_TIMEOUT_SECONDS=1800'
    echo 'LARGE_IMAGE_PULL_TIMEOUT_SECONDS=7200'
    printf 'PREDICTION_MANAGER_ROOT=%q\n' "$BUILD_TREE/OPFW/ml_prediction_manager_v2"
    printf 'PREDICTION_MANAGER_FRONTEND_ROOT=%q\n' "$BUILD_TREE/OPFW/ml_prediction_manager_v2_frontend"
  } >> "$CONFIG"
  # Update a previously prepared config only before installation has begun.
  if [[ ! -f "$BASE/installation-started" ]]; then
    cat >> "$CONFIG" <<'ENV'
POD_NETWORK_CIDR=10.254.250.0/23
SERVICE_CIDR=10.254.252.0/24
ENV
  else
    (
      # shellcheck disable=SC1090
      source "$CONFIG"
      [[ "$POD_NETWORK_CIDR" == 10.254.250.0/23 && "$SERVICE_CIDR" == 10.254.252.0/24 ]]
    ) || fail 'Existing installation uses another network layout. Do not change cluster CIDRs in place; send the inspection report.'
  fi
  sudo install -d -m 0755 /etc/docker
  if [[ -f /etc/docker/daemon.json ]]; then
    sudo cp -a /etc/docker/daemon.json "$BASE/docker-daemon.before-$(date +%s).json"
  fi
  sudo python3 - <<'PY'
import json, pathlib, os
p=pathlib.Path('/etc/docker/daemon.json')
d=json.loads(p.read_text()) if p.exists() else {}
d['bip']='10.254.254.193/28'
d['default-address-pools']=[{'base':'10.254.254.224/27','size':28}]
t=p.with_suffix('.pman-tmp')
t.write_text(json.dumps(d,indent=2)+'\n')
os.chmod(t,0o644)
t.replace(p)
PY
  touch "$BASE/installation-started"
  STAGE=install
  # Direct entry preserves this reviewed config; 01/02 wrappers regenerate portable values.
  sudo env PM_INSTALL_ORIGINAL_USER="$(id -un)" \
    TMPDIR="/data/fedit-pman-$(id -u)/tmp" \
    DEBIAN_FRONTEND=noninteractive APT_CONFIG="$RUNTIME/apt-retry.conf" \
    bash "$RUNTIME/install-verification.sh" --config "$CONFIG" --resume
fi
STAGE=validation
[[ -f "$CONFIG" ]] || fail 'No installation config found; run install first.'
BACKEND_ROOT=$(
  # shellcheck disable=SC1090
  source "$CONFIG"
  printf '%s\n' "$PREDICTION_MANAGER_ROOT"
)
SCRIPTS="$BACKEND_ROOT/scripts"
[[ -d "$SCRIPTS" ]] || fail 'Installed build source is missing.'
sudo env PM_INSTALL_ORIGINAL_USER="$(id -un)" bash "$SCRIPTS/scripts/check-service-entry.sh" "$CONFIG"
sudo env PM_INSTALL_ORIGINAL_USER="$(id -un)" bash "$SCRIPTS/scripts/show-access-urls.sh"
export KUBECONFIG=/etc/kubernetes/admin.conf
sudo env KUBECONFIG="$KUBECONFIG" kubectl wait --for=condition=Ready nodes --all --timeout=120s
sudo env KUBECONFIG="$KUBECONFIG" kubectl get pods -A -o json > "$RUN/pod-status.json"
python3 - "$RUN/pod-status.json" <<'PY'
import json,sys
pods=json.load(open(sys.argv[1]))['items']
bad=[p['metadata']['namespace']+'/'+p['metadata']['name'] for p in pods if p['status'].get('phase')!='Succeeded' and not any(c['type']=='Ready' and c['status']=='True' for c in p['status'].get('conditions',[]))]
if bad: raise SystemExit('Pods not ready: '+', '.join(bad))
print('ALL_PODS_READY_OR_COMPLETED')
PY
STAGE=gpu-scheduling
GPU_POD="pman-gpu-smoke-$(date +%s)"
sudo env KUBECONFIG="$KUBECONFIG" kubectl apply -f - <<YAML
apiVersion: v1
kind: Pod
metadata:
  name: $GPU_POD
  namespace: default
spec:
  restartPolicy: Never
  tolerations:
    - operator: Exists
      effect: NoSchedule
  containers:
    - name: gpu
      image: nvidia/cuda:11.8.0-base-ubuntu22.04
      command: [nvidia-smi]
      resources:
        limits:
          nvidia.com/gpu: 1
YAML
gpu_ok=false
for _attempt in $(seq 1 90); do
  phase=$(sudo env KUBECONFIG="$KUBECONFIG" kubectl get pod "$GPU_POD" -o jsonpath='{.status.phase}')
  if [[ "$phase" == Succeeded ]]; then gpu_ok=true; break; fi
  [[ "$phase" != Failed ]] || break
  sleep 5
done
sudo env KUBECONFIG="$KUBECONFIG" kubectl logs "$GPU_POD" || true
sudo env KUBECONFIG="$KUBECONFIG" kubectl describe pod "$GPU_POD" > "$RUN/gpu-pod.txt"
sudo env KUBECONFIG="$KUBECONFIG" kubectl delete pod "$GPU_POD" --wait=false
GPU_POD=""
[[ "$gpu_ok" == true ]] || fail 'GPU scheduling/container probe failed.'
STAGE=gpu-training
# Use the actual built image with a read-only source mount; do not install ML packages on the host.
RAY_IMAGE=$(sudo env KUBECONFIG="$KUBECONFIG" kubectl -n kubeflow-user-example-com get raycluster pm-ray -o jsonpath='{.spec.headGroupSpec.template.spec.containers[0].image}')
[[ -n "$RAY_IMAGE" ]] || fail 'Cannot find the deployed Ray image.'
GPU_CONTAINER="pman-training-smoke-$(date +%s)-$$"
sudo timeout 1200 docker run --rm --name "$GPU_CONTAINER" --gpus device=0 --network none --shm-size=512m \
  -e OMP_NUM_THREADS=1 -e PYTHONPATH=/workspace \
  -v "$BACKEND_ROOT:/workspace:ro" \
  --entrypoint python "$RAY_IMAGE" /workspace/scripts/gpu-smoke-test.py --require-gpu --mlflow
GPU_CONTAINER=""
STAGE=complete
echo 'PLATFORM_AND_KUBERNETES_GPU_SMOKE_PASS'
echo 'AutoML end-to-end training, notebook interaction, and external browser access still require separate validation.'
