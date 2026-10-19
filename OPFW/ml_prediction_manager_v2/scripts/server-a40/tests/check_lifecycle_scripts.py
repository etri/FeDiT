"""Executable Bash regression tests with fake service/CRI commands and real files.

The root re-exec is bypassed and absolute system paths are redirected into each
temporary fixture. These are NOT a real Kubernetes installation/removal test.
"""
from pathlib import Path
from contextlib import redirect_stdout
import io
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BASH = r'C:/Program Files/Git/bin/bash.exe' if os.name == 'nt' else shutil.which('bash')


# Git Bash starts a native process for each mocked command. The additional CNI
# stop/remove/restart checks exceed 50s there; Linux keeps the original budget.
def shell(text, timeout=150 if os.name == 'nt' else 50):
    p = subprocess.run([BASH, '-s'], input=text, text=True, encoding='utf-8',
                       capture_output=True, timeout=timeout)
    assert p.returncode == 0, p.stdout + p.stderr
    return p.stdout


def without_reexec(text):
    start = text.index('if (( EUID != 0 )); then')
    end = text.index('\nfi\n', start) + len('\nfi\n')
    return text[:start] + text[end:]


def check_restart():
    source = without_reexec((ROOT / 'pman-restart.sh').read_text(encoding='utf-8'))
    output = shell(r'''set -Eeuo pipefail
test_root=$(mktemp -d)
trap 'rm -rf -- "$test_root"' EXIT
export TEST_ROOT="$test_root" USER=pmtest SUDO_USER=pmtest
mkdir -p "$test_root/scripts" "$test_root/bin" "$test_root/home/pman-server-725eb2ed"
export PATH="$test_root/bin:$PATH"
cat > "$test_root/bin/getent" <<'MOCK'
#!/usr/bin/env bash
echo "pmtest:x:1000:1000::${TEST_ROOT}/home:/bin/bash"
MOCK
cat > "$test_root/bin/flock" <<'MOCK'
#!/usr/bin/env bash
exit "${LOCK_FAIL:-0}"
MOCK
printf '#!/usr/bin/env bash\nexit 0\n' > "$test_root/bin/chown"
cat > "$test_root/scripts/pman-stop.sh" <<'MOCK'
echo stop >> "$TEST_ROOT/events"
exit "${STOP_FAIL:-0}"
MOCK
cat > "$test_root/scripts/pman-start.sh" <<'MOCK'
echo "start:${FEDIT_REGISTRY_CONTAINER:-missing}" >> "$TEST_ROOT/events"
exit "${START_FAIL:-0}"
MOCK
chmod +x "$test_root/bin/"*
cat > "$test_root/scripts/pman-restart.sh" <<'RESTART_SCRIPT'
''' + source + r'''
RESTART_SCRIPT
export FEDIT_REGISTRY_CONTAINER=custom-registry
bash "$test_root/scripts/pman-restart.sh" > "$test_root/log"
[[ "$(cat "$test_root/events")" == $'stop\nstart:custom-registry' ]]
grep -Fq '[PASS]' "$test_root/log"
for pair in STOP_FAIL:17 START_FAIL:23 LOCK_FAIL:1; do
  rm -f "$test_root/events"
  variable=${pair%:*}; expected=${pair#*:}
  rc=0
  env "$variable=$expected" bash "$test_root/scripts/pman-restart.sh" > "$test_root/log" 2>&1 || rc=$?
  [[ "$rc" == "$expected" ]]
  ! grep -Fq '[PASS]' "$test_root/log"
  if [[ "$variable" == STOP_FAIL ]]; then [[ "$(cat "$test_root/events")" == stop ]]; fi
  if [[ "$variable" == LOCK_FAIL ]]; then [[ ! -e "$test_root/events" ]]; fi
done
rm -f "$test_root/scripts/pman-start.sh" "$test_root/events"
rc=0
bash "$test_root/scripts/pman-restart.sh" > "$test_root/log" 2>&1 || rc=$?
[[ "$rc" == 1 && ! -e "$test_root/events" ]]
echo 'PASS restart order, custom Registry, stop/start exit codes, lock and dependency preflight'
''')
    print(output.strip())


def check_uninstall():
    source = without_reexec((ROOT / 'pman-uninstall.sh').read_text(encoding='utf-8'))
    # The real tar/mv/rm/cmp/grep run only on files under the fixture's temp root.
    for prefix in ('/etc/', '/var/lib/', '/opt/', '/data'):
        source = source.replace(prefix, '${TEST_ROOT}' + prefix)
    setup = r'''set -Eeuo pipefail
test_root=$(mktemp -d)
trap 'rm -rf -- "$test_root"' EXIT
export TEST_ROOT="$test_root" USER=pmtest SUDO_USER=pmtest FEDIT_REGISTRY_CONTAINER=custom-registry
mkdir -p "$test_root/"{scripts,bin,etc/kubernetes/manifests,etc/systemd/system,var/lib/etcd,opt/local-path-provisioner,data}
mkdir -p "$test_root/home/pman-server-725eb2ed" "$test_root/home/.kube"
mkdir -p "$test_root/etc/cni/net.d" "$test_root/opt/cni/bin" "$test_root/var/lib/cni"
echo '{"type":"calico"}' > "$test_root/etc/cni/net.d/10-calico.conflist"
echo retain-ipam-cache > "$test_root/var/lib/cni/cache"
printf '#!/usr/bin/env bash\nexit 0\n' > "$test_root/opt/cni/bin/loopback"
chmod +x "$test_root/opt/cni/bin/loopback"
state="$test_root/home/prediction-manager-work/.prediction-manager/gpu/state"
mkdir -p "$state" "${state%/state}/registry"
touch "$state/cluster-owned" "$state/00-preflight.done" "$test_root/home/pman-server-725eb2ed/installation-started"
echo 'cluster credentials fixture' > "$test_root/etc/kubernetes/admin.conf"
cp "$test_root/etc/kubernetes/admin.conf" "$test_root/home/.kube/config"
echo '--service-cluster-ip-range=10.254.252.0/24' > "$test_root/etc/kubernetes/manifests/kube-apiserver.yaml"
echo 'etcd cold fixture' > "$test_root/var/lib/etcd/retained.db"
echo retain-pvc > "$test_root/opt/local-path-provisioner/pvc.txt"
echo retain-registry > "${state%/state}/registry/data.txt"
echo retain-unrelated > "$test_root/data/unrelated.txt"
printf 'fedit-fe\ncustom-registry\nunrelated-container\n' > "$test_root/docker-names"
echo cri-pod > "$test_root/cri-pods"
export PATH="$test_root/bin:$PATH"
cat > "$test_root/bin/getent" <<'MOCK'
#!/usr/bin/env bash
echo "pmtest:x:1000:1000::${TEST_ROOT}/home:/bin/bash"
MOCK
cat > "$test_root/bin/mountpoint" <<'MOCK'
#!/usr/bin/env bash
exit 0
MOCK
cat > "$test_root/bin/flock" <<'MOCK'
#!/usr/bin/env bash
exit "${LOCK_FAIL:-0}"
MOCK
printf '#!/usr/bin/env bash\nexit 0\n' > "$test_root/bin/chown"
cat > "$test_root/bin/systemctl" <<'MOCK'
#!/usr/bin/env bash
echo "systemctl $*" >> "$TEST_ROOT/events"
case "$1" in
  is-active) echo inactive; exit 3 ;;
  disable) [[ "${FAIL_PHASE:-}" != disable ]] || exit 19 ;;
  stop) [[ "${FAIL_PHASE:-}" != cleanup || "$*" != 'stop docker.socket docker.service containerd.service' ]] || exit 29 ;;
  restart)
    [[ "${FAIL_PHASE:-}" != cni-restart ]] || exit 39
    grep -Fq pman-offline-reset "$TEST_ROOT/etc/cni/net.d/00-pman-reset.conflist"
    touch "$TEST_ROOT/offline-cni-loaded" ;;
esac
MOCK
cat > "$test_root/bin/docker" <<'MOCK'
#!/usr/bin/env bash
echo "docker $*" >> "$TEST_ROOT/events"
if [[ "$1 $2 $3" == 'container ls -a' ]]; then
  [[ "${FAIL_PHASE:-}" != docker-list ]] || exit 21
  cat "$TEST_ROOT/docker-names"
elif [[ "$1" == rm ]]; then
  grep -Fvx "${!#}" "$TEST_ROOT/docker-names" > "$TEST_ROOT/docker-next"
  mv "$TEST_ROOT/docker-next" "$TEST_ROOT/docker-names"
fi
MOCK
cat > "$test_root/bin/crictl" <<'MOCK'
#!/usr/bin/env bash
echo "crictl $*" >> "$TEST_ROOT/events"
case "$*" in
  *' pods -q') cat "$TEST_ROOT/cri-pods" ;;
  *' stopp '*)
    if [[ ! -f "$TEST_ROOT/offline-cni-loaded" || "${FAIL_PHASE:-}" == cni-delete ]]; then
      echo 'plugin type="calico" failed (delete): error getting ClusterInformation: connect: connection refused' >&2
      exit 41
    fi ;;
  *' rmp '*) [[ "${FAIL_PHASE:-}" == cri-remains ]] || : > "$TEST_ROOT/cri-pods" ;;
  *) exit 97 ;;
esac
MOCK
cat > "$test_root/bin/kubeadm" <<'MOCK'
#!/usr/bin/env bash
echo "kubeadm $*" >> "$TEST_ROOT/events"
[[ "${FAIL_PHASE:-}" != reset ]] || exit 27
if [[ "${FAIL_PHASE:-}" != reset-warning ]]; then
  rm -f "$TEST_ROOT/etc/kubernetes/admin.conf" "$TEST_ROOT/etc/kubernetes/manifests/kube-apiserver.yaml" "$TEST_ROOT/var/lib/etcd/retained.db"
fi
[[ "${FAIL_PHASE:-}" == cri-remains ]] || : > "$TEST_ROOT/cri-pods"
MOCK
cat > "$test_root/bin/timeout" <<'MOCK'
#!/usr/bin/env bash
shift 3
exec "$@"
MOCK
cat > "$test_root/scripts/pman-stop.sh" <<'MOCK'
echo stop >> "$TEST_ROOT/events"
exit "${STOP_FAIL:-0}"
MOCK
real_tar=$(command -v tar)
export REAL_TAR="$real_tar"
cat > "$test_root/bin/tar" <<'MOCK'
#!/usr/bin/env bash
[[ "${FAIL_PHASE:-}" != backup ]] || exit 18
exec "$REAL_TAR" "$@"
MOCK
chmod +x "$test_root/bin/"*
cat > "$test_root/scripts/pman-uninstall.sh" <<'UNINSTALL_SCRIPT'
''' + source + r'''
UNINSTALL_SCRIPT
'''
    scenarios = {
        'dry-run': r'''
bash "$test_root/scripts/pman-uninstall.sh" --dry-run > "$test_root/log"
[[ ! -f "$test_root/events" && -f "$state/cluster-owned" ]]
[[ ! -f "$test_root/home/pman-server-725eb2ed/control.lock" ]]
''',
        'ownership': r'''
rm "$state/cluster-owned"
rc=0
bash "$test_root/scripts/pman-uninstall.sh" > "$test_root/log" 2>&1 || rc=$?
[[ "$rc" == 1 && ! -f "$test_root/events" ]]
''',
        'foreign-cluster': r'''
echo '--service-cluster-ip-range=192.168.1.0/24' > "$test_root/etc/kubernetes/manifests/kube-apiserver.yaml"
rc=0
bash "$test_root/scripts/pman-uninstall.sh" > "$test_root/log" 2>&1 || rc=$?
[[ "$rc" == 1 && ! -f "$test_root/events" ]]
''',
        'locked': r'''
rc=0
LOCK_FAIL=1 bash "$test_root/scripts/pman-uninstall.sh" > "$test_root/log" 2>&1 || rc=$?
[[ "$rc" == 1 && ! -f "$test_root/events" ]]
''',
        'foreign-kubeconfig': r'''
echo foreign-context > "$test_root/home/.kube/config"
bash "$test_root/scripts/pman-uninstall.sh" > "$test_root/log" 2>&1
[[ $(cat "$test_root/home/.kube/config") == foreign-context ]]
''',
        'success': r'''
bash "$test_root/scripts/pman-uninstall.sh" > "$test_root/log" 2>&1
grep -Fxq 'EXIT=0' "$test_root/log"
grep -Fxq 'STAGE=complete' "$test_root/log"
[[ ! -d "$state" && ! -e "$test_root/home/.kube/config" ]]
[[ "$(cat "$test_root/docker-names")" == unrelated-container ]]
report=$(sed -n 's/^UNINSTALL_REPORT=//p' "$test_root/log" | head -1)
tar -tf "$report/cluster-backup.private.tar" | grep -Fq 'var/lib/etcd/retained.db'
[[ -f "$report/previous-install-state/cluster-owned" ]]
[[ -f "$report/retired-cni-config/10-calico.conflist" && -f "$report/retired-cni-cache/cache" ]]
[[ ! -e "$test_root/etc/cni/net.d/00-pman-reset.conflist" && ! -e "$test_root/var/lib/cni" ]]
[[ ! -s "$test_root/cri-pods" ]]
sha256sum -c "$report/backup.sha256"
before=$(wc -l < "$test_root/events")
bash "$test_root/scripts/pman-uninstall.sh" > "$test_root/log" 2>&1
grep -Fq 'already uninstalled' "$test_root/log"
[[ "$(wc -l < "$test_root/events")" == "$before" ]]
''',
        'resume-after-calico-reset-failure': r'''
# Exact user state: API credentials/manifest/etcd are gone; sandbox and Calico remain.
rm "$test_root/etc/kubernetes/admin.conf" "$test_root/etc/kubernetes/manifests/kube-apiserver.yaml" "$test_root/var/lib/etcd/retained.db"
rc=0
crictl --runtime-endpoint unix:///run/containerd/containerd.sock --timeout=90s stopp cri-pod > "$test_root/original-failure.log" 2>&1 || rc=$?
[[ "$rc" == 41 ]]
grep -Fq ClusterInformation "$test_root/original-failure.log"
bash "$test_root/scripts/pman-uninstall.sh" > "$test_root/log" 2>&1
grep -Fxq 'STAGE=complete' "$test_root/log"
[[ ! -s "$test_root/cri-pods" && ! -d "$state" ]]
''',
        'resume-after-offline-cni-interruption': r'''
rc=0
FAIL_PHASE=cni-delete bash "$test_root/scripts/pman-uninstall.sh" > "$test_root/first.log" 2>&1 || rc=$?
[[ "$rc" == 41 && -f "$state/cluster-owned" ]]
first_report=$(sed -n 's/^UNINSTALL_REPORT=//p' "$test_root/first.log" | head -1)
[[ -f "$first_report/retired-cni-config/10-calico.conflist" ]]
bash "$test_root/scripts/pman-uninstall.sh" > "$test_root/log" 2>&1
grep -Fxq 'STAGE=complete' "$test_root/log"
[[ ! -s "$test_root/cri-pods" && -f "$first_report/retired-cni-config/10-calico.conflist" ]]
''',
        'missing-loopback-preserves-original': r'''
rm "$test_root/opt/cni/bin/loopback"
rc=0
bash "$test_root/scripts/pman-uninstall.sh" > "$test_root/log" 2>&1 || rc=$?
[[ "$rc" == 1 && -f "$test_root/etc/cni/net.d/10-calico.conflist" ]]
! grep -Fq 'kubeadm reset' "$test_root/events"
''',
    }
    for name, body in scenarios.items():
        shell(setup + body + r'''
[[ "$(cat "$test_root/opt/local-path-provisioner/pvc.txt")" == retain-pvc ]]
[[ "$(cat "${state%/state}/registry/data.txt")" == retain-registry ]]
[[ "$(cat "$test_root/data/unrelated.txt")" == retain-unrelated ]]
''')
        print('PASS uninstall ' + name + ': actual file preservation with mocked services')
    for phase, code in [('stop', 17), ('backup', 18), ('disable', 19), ('docker-list', 21),
                        ('reset', 27), ('reset-warning', 1), ('cri-remains', 1),
                        ('cni-restart', 39), ('cni-delete', 41), ('cleanup', 29)]:
        # A successful main phase followed by cleanup failure returns its own status 1.
        expected = 1 if phase == 'cleanup' else code
        stop_fail = 17 if phase == 'stop' else 0
        shell(setup + f'export FAIL_PHASE={phase} STOP_FAIL={stop_fail}\nexpected={expected}\n' + r'''
rc=0
bash "$test_root/scripts/pman-uninstall.sh" > "$test_root/log" 2>&1 || rc=$?
if [[ "$rc" != "$expected" ]]; then cat "$test_root/log"; exit 1; fi
! grep -Fq '[PASS] Platform uninstalled.' "$test_root/log"
if [[ "$FAIL_PHASE" != cleanup ]]; then [[ -f "$state/cluster-owned" ]]; fi
if [[ "$FAIL_PHASE" == backup || "$FAIL_PHASE" == disable || "$FAIL_PHASE" == docker-list ]]; then
  ! grep -Fq 'kubeadm reset' "$test_root/events"
  [[ -f "$test_root/var/lib/etcd/retained.db" ]]
fi
''')
        print('PASS uninstall failure propagation: ' + phase)


def check_registry_reader():
    text = (ROOT / 'pman-uninstall.sh').read_text(encoding='utf-8')
    code = text.split("<<'PY'\n", 1)[1].split('\nPY\n', 1)[0]
    with tempfile.TemporaryDirectory() as folder:
        config = Path(folder) / 'install.env'
        original_argv = sys.argv
        try:
            sys.argv = ['reader', str(config)]
            for source, expected in [
                ('OTHER_SETTING=true\n', 'pm-verification-registry'),
                ('REGISTRY_CONTAINER_NAME="custom-registry" # comment\n', 'custom-registry'),
                ('REGISTRY_CONTAINER_NAME=old\nREGISTRY_CONTAINER_NAME=new\n', 'new'),
                ("REGISTRY_CONTAINER_NAME='$(exit 99)'\n", '$(exit 99)'),
            ]:
                config.write_text(source, encoding='utf-8')
                output = io.StringIO()
                with redirect_stdout(output):
                    exec(compile(code, 'registry-reader', 'exec'), {})
                assert output.getvalue().strip() == expected
        finally:
            sys.argv = original_argv
    print('PASS literal Registry config parser: defaults, quotes, last assignment and no shell execution')


if __name__ == '__main__':
    for path in ROOT.glob('pman-*.sh'):
        subprocess.run([BASH, '-n', str(path)], check=True)
    check_restart()
    check_uninstall()
    check_registry_reader()
