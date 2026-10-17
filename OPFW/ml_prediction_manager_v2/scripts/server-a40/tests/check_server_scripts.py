"""Read-only checks plus mocked lifecycle failures; never contact the server."""
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import tarfile
import threading
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BASH = shutil.which('bash') if os.name != 'nt' else r'C:/Program Files/Git/bin/bash.exe'


def shell(script, *, env=None, timeout=25):
    return subprocess.run([BASH, '-s'], input=script, text=True, encoding='utf-8',
                          env=env, capture_output=True, timeout=timeout)


def require(result):
    assert result.returncode == 0, result.stdout + result.stderr


def check_pinned_and_generated():
    original = ROOT / 'server-install-725eb2ed.sh'
    assert hashlib.sha256(original.read_bytes()).hexdigest() == '58f8f21c41a19b2040f4545c3f3cf7f1348c2490204a37e6ee56a8dbb57e6dfa'
    for path in ROOT.glob('*.sh'):
        subprocess.run([BASH, '-n', str(path)], check=True)
    repair = (ROOT / 'resume-keycloak.sh').read_text(encoding='utf-8')
    code = repair.split('python3 - "$original" "$run/server-install-local-keycloak.sh" "$url" <<\'PY\'\n', 1)[1].split('\nPY\n', 1)[0]
    with tempfile.TemporaryDirectory() as temp:
        temp = Path(temp)
        wrapper = temp / 'wrapper.sh'
        sys.argv = ['patch', str(original), str(wrapper), 'http://127.0.0.1:38081/auth']
        exec(compile(code, 'repair-generator', 'exec'), {})
        subprocess.run([BASH, '-n', str(wrapper)], check=True)
        bootstrap = temp / 'bootstrap.sh'
        # Exercise the immutable baseline that the real wrapper archives.
        baseline = subprocess.check_output(['git', '-C', str(ROOT.parents[3]), 'show',
            '725eb2edeec1b756b45abb809cdc4dc971a890bf:OPFW/ml_prediction_manager_v2/scripts/scripts/bootstrap-verification.sh'])
        bootstrap.write_bytes(baseline)
        patch = wrapper.read_text(encoding='utf-8').split('python3 - "$RUNTIME/scripts/bootstrap-verification.sh" <<\'PY\'\n', 1)[1].split('\nPY\n', 1)[0]
        sys.argv = ['patch', str(bootstrap)]
        exec(compile(patch, 'bootstrap-patch', 'exec'), {})
        subprocess.run([BASH, '-n', str(bootstrap)], check=True)
        result = bootstrap.read_text(encoding='utf-8')
        assert 'KEYCLOAK_PUBLIC_URL="http://127.0.0.1:38081/auth"' in result
        assert result.count("curl --noproxy '*' --retry 60 --retry-all-errors") == 5
        assert '${IMAGE_PULL_TIMEOUT_SECONDS:=1800}' in result
        assert '${LARGE_IMAGE_PULL_TIMEOUT_SECONDS:=7200}' in result
        assert result.count('# CRI resolves canonical Docker references; a short ctr alias is not enough.') == 1
        assert result.index('  prime_manifest_images "${GENERATED_DIR}/kubeflow.yaml" "Kubeflow full workload"') < result.index('  apply_with_retry "$kubeflow_bootstrap_manifest"')
    print('PASS pinned checksum, Bash syntax and actual runtime patches')
    return result


def check_image_fallback(generated):
    function = 'retry_kubernetes_image_pull() {' + generated.split('retry_kubernetes_image_pull() {', 1)[1].split('\nrecover_image_pull_failures()', 1)[0]
    script = r'''set -Eeuo pipefail
test_dir=$(mktemp -d)
trap 'rm -rf -- "$test_dir"' EXIT
mkdir "$test_dir/bin"
export PATH="$test_dir/bin:$PATH"
export FALLBACK_MARK="$test_dir/canonical-tag"
cat > "$test_dir/bin/timeout" <<'MOCK'
#!/usr/bin/env bash
[[ "$1" == "$EXPECTED_LIMIT" ]] || exit 90
shift
exec "$@"
MOCK
cat > "$test_dir/bin/crictl" <<'MOCK'
#!/usr/bin/env bash
if [[ "$1" == pull ]]; then [[ "$2" == 127.0.0.1:5000/fallback/* ]];
else [[ -f "$FALLBACK_MARK" && "$2" == "$EXPECTED_IMAGE" ]]; fi
MOCK
cat > "$test_dir/bin/docker" <<'MOCK'
#!/usr/bin/env bash
[[ "$1 $2" != 'image save' ]]
MOCK
cat > "$test_dir/bin/ctr" <<'MOCK'
#!/usr/bin/env bash
if [[ "$*" == *' images tag '* ]]; then
  [[ "${!#}" == "$EXPECTED_IMAGE" ]] || exit 9
  touch "$FALLBACK_MARK"
fi
MOCK
chmod +x "$test_dir/bin/"*
warn() { echo "$*"; }
retry_command() { shift 3; "$@"; }
DOWNLOADS_DIR="$test_dir"
REGISTRY_HOST=127.0.0.1:5000
IMAGE_PULL_TIMEOUT_SECONDS=1
LARGE_IMAGE_PULL_TIMEOUT_SECONDS=7
IMAGE_PULL_CRIO_ATTEMPTS=1
IMAGE_PULL_RETRY_ATTEMPTS=1
IMAGE_PULL_RETRY_DELAY_SECONDS=0
CONTAINERD_IMAGE_VISIBILITY_TIMEOUT_SECONDS=1
''' + function + r'''
for pair in 'kserve/storage-initializer:v0.13.1|docker.io/kserve/storage-initializer:v0.13.1' \
            'python:3.10-slim|docker.io/library/python:3.10-slim' \
            'library/python:3.10-slim|docker.io/library/python:3.10-slim' \
            'docker.io/python:3.10-slim|docker.io/library/python:3.10-slim' \
            'index.docker.io/library/python:3.10-slim|docker.io/library/python:3.10-slim' \
            'gcr.io/ml-pipeline/visualization-server:2.3.0|gcr.io/ml-pipeline/visualization-server:2.3.0' \
            'gcr.io/ml-pipeline/metadata-writer:2.3.0|gcr.io/ml-pipeline/metadata-writer:2.3.0' \
            'quay.io/example/test:v1|quay.io/example/test:v1' \
            'localhost:5000/test:v1|localhost:5000/test:v1'; do
  rm -f "$FALLBACK_MARK"
  export EXPECTED_IMAGE="${pair#*|}"
  export EXPECTED_LIMIT=1s
  [[ "$EXPECTED_IMAGE" != *ml-pipeline/* ]] || EXPECTED_LIMIT=7s
  retry_kubernetes_image_pull "${pair%%|*}"
  [[ -f "$FALLBACK_MARK" ]]
done
'''
    require(shell(script))
    print('PASS actual generated CRI fallback: canonical Docker aliases and explicit registries')


def check_manifest_prefetch(generated):
    function = 'prime_manifest_images() {' + generated.split('prime_manifest_images() {', 1)[1].split('\nwait_namespace_workloads()', 1)[0]
    script = r'''set -Eeuo pipefail
events=$(mktemp)
trap 'rm -f "$events"' EXIT
python3() { cat >/dev/null; printf '%s\n' 'present:v1' 'missing:v1' 'present:v1' 'missing:v1'; }
crictl() { [[ "$1" == inspecti && "$2" == present:v1 ]]; }
retry_kubernetes_image_pull() { echo "$1" >> "$events"; }
record() { echo "$*"; }
''' + function + r'''
prime_manifest_images /unused example
[[ "$(cat "$events")" == missing:v1 ]]
'''
    result = shell(script)
    require(result)
    assert '2개 이미지' in result.stdout
    print('PASS full manifest prefetch runs before apply, deduplicates and preserves cached images')


def check_large_image_limits(generated):
    function = 'retry_command() {' + generated.split('retry_command() {', 1)[1].split('\n}\n', 1)[0] + '\n}\n'
    script = r'''set -Eeuo pipefail
test_dir=$(mktemp -d)
trap 'rm -rf -- "$test_dir"' EXIT
mkdir "$test_dir/bin"
export PATH="$test_dir/bin:$PATH"
cat > "$test_dir/bin/timeout" <<'MOCK'
#!/usr/bin/env bash
[[ "$1" == "$EXPECTED_LIMIT" ]] || exit 90
shift
exec "$@"
MOCK
printf '#!/usr/bin/env bash\nexit 0\n' > "$test_dir/bin/docker"
chmod +x "$test_dir/bin/"*
unset DOCKER_PULL_TIMEOUT_SECONDS
IMAGE_PULL_TIMEOUT_SECONDS=1
LARGE_IMAGE_PULL_TIMEOUT_SECONDS=7
''' + function + r'''
export EXPECTED_LIMIT=1s
retry_command 1 0 fixture docker pull python:3.10-slim
export EXPECTED_LIMIT=7s
retry_command 1 0 fixture docker pull --platform=linux/amd64 gcr.io/ml-pipeline/visualization-server:2.3.0
retry_command 1 0 fixture docker pull gcr.io/ml-pipeline/metadata-writer:2.3.0
retry_command 1 0 fixture docker pull --platform=linux/amd64 seldonio/mlserver:1.6.0
'''
    require(shell(script))
    print('PASS actual Docker retry classifier uses large-image limits even with platform flags')


def check_rollout_time_budget(generated):
    function = 'wait_rollout_if_exists() {' + generated.split('wait_rollout_if_exists() {', 1)[1].split('\ndownload_verified_kubernetes_manifest()', 1)[0]
    script = r'''set -Eeuo pipefail
test_dir=$(mktemp -d)
trap 'rm -rf -- "$test_dir"' EXIT
echo 0 > "$test_dir/count"
success_after=3
kubectl() {
  if [[ "$*" == *'rollout status'* ]]; then
    count=$(cat "$test_dir/count")
    count=$((count+1))
    echo "$count" > "$test_dir/count"
    if ((success_after > 0 && count >= success_after)); then echo ready; return 0; fi
    echo 'error: deployment exceeded its progress deadline' >&2
    return 1
  fi
}
recover_image_pull_failures() { return 1; }
''' + function + r'''
wait_rollout_if_exists example deployment example 4s
success_after=0
started=$SECONDS
if wait_rollout_if_exists example deployment example 2s; then exit 99; fi
[[ $((SECONDS-started)) -ge 2 ]]
'''
    require(shell(script))
    print('PASS actual rollout wait tolerates immediate controller errors until its real wait budget expires')


def check_dcgm_prefetch(generated):
    start = generated.index('    helm get manifest dcgm-exporter --namespace monitoring')
    wait = '    wait_rollout_if_exists monitoring daemonset dcgm-exporter 900s'
    end = generated.index(wait, start) + len(wait)
    assert generated.index('    helm upgrade --install dcgm-exporter ') < start
    script = r'''set -Eeuo pipefail
test_dir=$(mktemp -d)
trap 'rm -rf -- "$test_dir"' EXIT
GENERATED_DIR="$test_dir/generated with spaces"
mkdir "$GENERATED_DIR"
IMAGE_PULL_TIMEOUT_SECONDS=1
LARGE_IMAGE_PULL_TIMEOUT_SECONDS=7
helm() { [[ "$*" == 'get manifest dcgm-exporter --namespace monitoring' ]]; echo fixture; }
prime_manifest_images() {
  [[ "$IMAGE_PULL_TIMEOUT_SECONDS" == 7 && "$(cat "$1")" == fixture ]]
  echo ready > "$test_dir/prefetched"
}
wait_rollout_if_exists() { [[ -f "$test_dir/prefetched" ]]; }
''' + generated[start:end] + '\n[[ "$IMAGE_PULL_TIMEOUT_SECONDS" == 1 ]]\n'
    require(shell(script))
    print('PASS DCGM release images are prepared with the large-image limit before its startup wait')


def check_effective_download_limits():
    text = (ROOT / 'server-install-725eb2ed.sh').read_text(encoding='utf-8')
    start = text.index("  {\n    echo 'AUTO_DETECT_SOURCE_PATHS=false'")
    end = text.index('  } >> "$CONFIG"', start) + len('  } >> "$CONFIG"')
    script = r'''set -Eeuo pipefail
test_dir=$(mktemp -d)
trap 'rm -rf -- "$test_dir"' EXIT
CONFIG="$test_dir/server.env"
BUILD_TREE="$test_dir/build source"
printf 'IMAGE_PULL_TIMEOUT_SECONDS=300\nLARGE_IMAGE_PULL_TIMEOUT_SECONDS=900\n' > "$CONFIG"
''' + text[start:end] + r'''
source "$CONFIG"
[[ "$IMAGE_PULL_TIMEOUT_SECONDS" == 1800 && "$LARGE_IMAGE_PULL_TIMEOUT_SECONDS" == 7200 ]]
[[ "$PREDICTION_MANAGER_ROOT" == "$BUILD_TREE/OPFW/ml_prediction_manager_v2" ]]
'''
    require(shell(script))
    print('PASS actual config append overrides old 300/900-second settings, including paths with spaces')


def check_local_source_reuse():
    text = (ROOT / 'server-install-725eb2ed.sh').read_text(encoding='utf-8')
    start = text.index('  if [[ ! -d "$REPO/.git" ]]; then')
    end = text.index('\n  # The dedicated checkout', start)
    block = text[start:end]
    with tempfile.TemporaryDirectory() as temp:
        temp = Path(temp)
        source, dest = temp / 'source with spaces', temp / 'copy with spaces'
        subprocess.run(['git', 'init', '-q', str(source)], check=True)
        subprocess.run(['git', '-C', str(source), '-c', 'user.name=Fixture', '-c',
                        'user.email=fixture@example.invalid', 'commit', '-q', '--allow-empty', '-m', 'fixture'], check=True)
        pin = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
        subprocess.run(['git', '-C', str(source), '-c', 'user.name=Fixture', '-c',
                        'user.email=fixture@example.invalid', 'commit', '-q', '--allow-empty', '-m', 'newer source'], check=True)
        env = os.environ.copy()
        env.update(CLONE_SOURCE=source.as_posix(), CLONE_DEST=dest.as_posix(), CLONE_PIN=pin)
        prelude = 'set -Eeuo pipefail\nREPO="$CLONE_DEST"\nFEDIT_SOURCE_REPO="$CLONE_SOURCE"\nPIN="$CLONE_PIN"\n'
        require(shell(prelude + block, env=env))
        assert subprocess.check_output(['git', '-C', str(dest), 'rev-parse', 'HEAD'], text=True).strip() == pin
        assert subprocess.check_output(['git', '-C', str(dest), 'remote', 'get-url', 'origin'], text=True).strip() == 'https://github.com/etri/FeDiT.git'
        assert not (dest / '.git/objects/info/alternates').exists()
        obj = next(p for p in (source / '.git/objects').glob('*/*') if p.is_file())
        assert not os.path.samefile(obj, dest / '.git/objects' / obj.relative_to(source / '.git/objects'))
        env['CLONE_DEST'] = (temp / 'fallback').as_posix()
        fallback = 'git() { if [[ "$*" == *"cat-file -e"* ]]; then return 1; fi; echo "FALLBACK:$*"; }\n'
        result = shell(prelude + fallback + block, env=env)
        require(result)
        assert 'FALLBACK:clone --single-branch --branch OPFW_development_ETRI_pman https://github.com/etri/FeDiT.git' in result.stdout
    print('PASS real local Git source reuse without hardlinks/alternates, with remote fallback for missing commit')


def check_forward_lifecycle():
    # First Pod disappears. Second Pod ignores TERM. Cleanup must reconnect,
    # then kill the stubborn child and return without an unbounded wait.
    helper = (ROOT / 'keycloak-forward.sh').read_text(encoding='utf-8')
    script = r'''set -Eeuo pipefail
test_dir=$(mktemp -d)
trap 'rm -rf -- "$test_dir"' EXIT
mkdir "$test_dir/bin"
export FORWARD_TEST="$test_dir"
cat > "$test_dir/bin/kubectl" <<'MOCK'
#!/usr/bin/env bash
n=$(cat "$FORWARD_TEST/count" 2>/dev/null || echo 0)
echo $((n+1)) > "$FORWARD_TEST/count"
echo $$ > "$FORWARD_TEST/child"
echo 'Forwarding from 127.0.0.1:38081 -> 8080'
if [[ "$n" == 0 ]]; then exit 1; fi
trap '' TERM
while true; do sleep 0.1; done
MOCK
chmod +x "$test_dir/bin/kubectl"
export PATH="$test_dir/bin:$PATH"
cat > "$test_dir/helper.sh" <<'HELPER'
''' + helper + r'''
HELPER
bash "$test_dir/helper.sh" "$test_dir" 38081 > "$test_dir/log" 2>&1 &
parent=$!
for i in $(seq 1 80); do
  count=$(cat "$test_dir/count" 2>/dev/null || echo 0)
  [[ "$count" -ge 2 ]] && break
  sleep 0.1
done
[[ "$count" -ge 2 ]]
sleep 0.2
touch "$test_dir/stop"
wait "$parent"
child=$(cat "$test_dir/child")
if kill -0 "$child" 2>/dev/null; then echo 'Forwarder child leaked'; exit 1; fi
'''
    require(shell(script))
    print('PASS Pod replacement reconnect and bounded cleanup of TERM-resistant child')


def check_service_controls():
    # Replace only root re-exec; execute the real bodies against harmless mocks.
    start = (ROOT / 'fedit-start.sh').read_text(encoding='utf-8')
    stop = (ROOT / 'fedit-stop.sh').read_text(encoding='utf-8')
    reexec = 'if (( EUID != 0 )); then exec sudo bash "$0" "$@"; fi'
    assert start.count(reexec) == stop.count(reexec) == 1
    prelude = r'''
events=$(mktemp)
trap 'rm -f "$events"' EXIT
systemctl() {
  echo "systemctl $*" >> "$events"
  if [[ "$1" == is-active ]]; then
    [[ "$2" == --quiet ]] && return 0
    if [[ "${START_TEST:-0}" == 1 ]]; then echo active; return 0; fi
    echo inactive; return 3
  fi
}
mountpoint() { return 0; }
kubectl() { echo "kubectl $*" >> "$events"; return 0; }
crictl() {
  echo "crictl $*" >> "$events"
  if [[ "$*" == *' ps -q' ]]; then echo test-kube-container;
  elif [[ "${FAIL_CONTAINER:-0}" == 1 ]]; then return 1; fi
}
docker() {
  echo "docker $*" >> "$events"
  [[ "$1" != ps ]] || echo test-docker-container
  return 0
}
'''
    start_body = start.replace(reexec, prelude + '\nSTART_TEST=1\n')
    result = shell(start_body + '\ncat "$events"\n')
    require(result)
    assert 'systemctl start containerd.service docker.service' in result.stdout
    assert result.stdout.index('docker start pm-verification-registry') < result.stdout.index('systemctl start kubelet.service')
    assert 'docker start fedit-fe' in result.stdout
    assert 'systemctl enable' not in result.stdout
    result = shell(stop.replace(reexec, prelude) + '\ncat "$events"\n')
    require(result)
    assert result.stdout.index('systemctl stop kubelet.service') < result.stdout.index('crictl --runtime-endpoint')
    assert 'docker stop --time 20 test-docker-container' in result.stdout
    assert 'systemctl stop docker.socket docker.service containerd.service' in result.stdout
    result = shell(stop.replace(reexec, prelude + '\nFAIL_CONTAINER=1\n'))
    assert result.returncode == 1 and '[FAIL]' in result.stderr
    print('PASS service ordering, unchanged boot settings and container-stop failure reporting')


def check_sudo_session():
    helper = (ROOT / 'sudo-session.sh').read_text(encoding='utf-8')
    assert '(( EUID != 0 )) || return 0' in helper
    helper = helper.replace('  (( EUID != 0 )) || return 0\n', '')
    helper = helper.replace('sleep 60 &', 'sleep 0.2 &')
    helper = helper.replace('sleeper=$!', 'sleeper=$!; echo "$sleeper" > "$test_dir/sleeper"')
    script = r'''set -Eeuo pipefail
test_dir=$(mktemp -d)
trap 'sudo_session_stop; rm -rf -- "$test_dir"' EXIT
sudo() { printf '%s\n' "$*" >> "$test_dir/auth"; return "${AUTH_EXIT:-0}"; }
''' + helper + r'''
sudo_session_start
keeper=$sudo_session_pid
sleep 0.7
sleeper_pid=$(cat "$test_dir/sleeper")
sudo_session_stop
! kill -0 "$keeper" 2>/dev/null
! kill -0 "$sleeper_pid" 2>/dev/null
[[ $(grep -c -- '^-n -v$' "$test_dir/auth") -ge 2 ]]
[[ $(head -1 "$test_dir/auth") == -v ]]
AUTH_EXIT=7
if sudo_session_start; then exit 99; else [[ $? == 7 ]]; fi
[[ -z "$sudo_session_pid" ]]
'''
    require(shell(script))
    print('PASS sudo ticket refresh, initial authentication failure and bounded worker/timer cleanup')


def check_install_recovery():
    with tempfile.TemporaryDirectory() as temp:
        temp = Path(temp)
        bundle = temp / 'bundle'
        bundle.mkdir()
        (bundle / 'install.sh').write_text((ROOT / 'install.sh').read_text(encoding='utf-8'), encoding='utf-8')
        (bundle / 'sudo-session.sh').write_text((ROOT / 'sudo-session.sh').read_text(encoding='utf-8'), encoding='utf-8')
        (bundle / 'server-install-725eb2ed.sh').write_text(r'''#!/usr/bin/env bash
base="$HOME/pman-server-725eb2ed"
mkdir -p "$base/results/test"
echo "KEYCLOAK_NODE_PORT=${MOCK_PORT:-30081}" > "$base/server-install.env"
printf 'EXIT=22\nSTAGE=install\n' > "$base/results/test/RESULT.txt"
echo "[FAIL] ${FAIL_STAGE:-PostgreSQL/Keycloak/OIDC}" > "$base/results/test/session.log"
echo '--token abcdef.0123456789abcdef'
exit "${ORIGINAL_EXIT:-22}"
''', encoding='utf-8')
        (bundle / 'resume-keycloak.sh').write_text('echo RECOVERY_CALLED\n', encoding='utf-8')
        (bundle / 'update-user-sandbox.sh').write_text('echo UPDATE_CALLED\nexit "${UPDATE_EXIT:-0}"\n', encoding='utf-8')
        (bundle / 'verify-user-sandbox.sh').write_text('echo VERIFY_CALLED\n(sleep 0.2; echo SANDBOX_TEST_REPORT=/data/fedit-sandbox-tests/run.FIXTURE) &\nexit "${VERIFY_EXIT:-0}"\n', encoding='utf-8')
        mocks = temp / 'mocks'
        mocks.mkdir()
        (mocks / 'sha256sum').write_text('#!/usr/bin/env bash\ncat >/dev/null\nexit 0\n', encoding='utf-8')
        (mocks / 'flock').write_text('#!/usr/bin/env bash\nexit 0\n', encoding='utf-8')
        (mocks / 'curl').write_text(r'''#!/usr/bin/env bash
if [[ -n "${MOCK_REAL_CURL:-}" ]]; then exec "$MOCK_REAL_CURL" "$@"; fi
output=''
while (($#)); do
  if [[ "$1" == --output ]]; then output="$2"; shift 2; else shift; fi
done
printf '{"error_description":"%s"}\n' "${MOCK_ERROR:-HTTPS required}" > "$output"
''', encoding='utf-8')
        (mocks / 'sudo').write_text('#!/usr/bin/env bash\n[[ "$*" != -v && "$*" != "-n -v" ]] || exit 0\nshift\nif [[ "$1" == test ]]; then exit 0; fi\necho FIXTURE_SANDBOX_RESULT\n', encoding='utf-8')
        for path in mocks.iterdir():
            path.chmod(0o755)
        for index, (changes, mode, recovered, expected) in enumerate([
            ({}, 'install', True, 0),
            ({'ORIGINAL_EXIT': '0'}, 'install', False, 0),
            ({'FAIL_STAGE': 'Other stage'}, 'install', False, 22),
            ({'MOCK_ERROR': 'different error'}, 'install', False, 22),
            ({}, 'test', False, 22),
            ({'ORIGINAL_EXIT': '0', 'UPDATE_EXIT': '7'}, 'install', False, 7),
            ({'ORIGINAL_EXIT': '0', 'VERIFY_EXIT': '8'}, 'install', False, 8),
            ({'ORIGINAL_EXIT': '0'}, 'test', False, 0),
        ]):
            home = temp / f'home{index}'
            home.mkdir()
            env = os.environ.copy()
            env.update(changes)
            env['HOME'] = home.as_posix()
            env['MOCK_BIN'] = mocks.as_posix()
            env['MOCK_ENTRY'] = (bundle / 'install.sh').as_posix()
            env['MOCK_MODE'] = mode
            result = shell('mockbin="$MOCK_BIN"\nif command -v cygpath >/dev/null; then mockbin=$(cygpath -u "$mockbin"); fi\nexport PATH="$mockbin:$PATH"\nbash "$MOCK_ENTRY" "$MOCK_MODE"\n', env=env)
            assert result.returncode == expected, result.stdout + result.stderr
            assert ('RECOVERY_CALLED' in result.stdout) == recovered, result.stdout + result.stderr
            reports = list((home / 'pman-server-725eb2ed/complete-reports').glob('run.*'))
            reports = [p for p in reports if p.is_dir()]
            assert len(reports) == 1
            values = dict(line.split('=', 1) for line in (reports[0] / 'RESULT.txt').read_text().splitlines())
            assert int(values['EXIT']) == expected
            assert values['STAGE'] == ('complete' if expected == 0 else 'sandbox-update' if expected == 7 else 'sandbox-validation' if expected == 8 else 'platform')
            with tarfile.open(str(reports[0]) + '.tar.gz') as archive:
                assert 'combined.private.log' not in archive.getnames()
                assert 'keycloak-probe.private.json' not in archive.getnames()
                public_log = archive.extractfile('session.log').read().decode('utf-8')
                assert 'abcdef.0123456789abcdef' not in public_log
                assert '<REDACTED_BOOTSTRAP_TOKEN>' in public_log
                assert ('sandbox-RESULT.txt' in archive.getnames()) == ('VERIFY_CALLED' in result.stdout)
            assert 'FEDIT_REPORT_ARCHIVE=' in result.stdout
            assert ('UPDATE_CALLED' in result.stdout) == (mode == 'install' and (recovered or changes.get('ORIGINAL_EXIT') == '0'))
            if expected == 0:
                assert 'VERIFY_CALLED' in result.stdout and 'FEDIT_INSTALL_AND_SANDBOX_PASS' in result.stdout
        class TransientHandler(BaseHTTPRequestHandler):
            calls = 0

            def do_POST(self):
                self.rfile.read(int(self.headers.get('Content-Length', '0')))
                type(self).calls += 1
                if self.calls == 1:
                    self.close_connection = True
                    self.connection.shutdown(socket.SHUT_RDWR)
                    return
                code = 503 if self.calls == 2 else 403
                body = b'{"temporary":true}' if code == 503 else b'{"error_description":"HTTPS required"}'
                self.send_response(code)
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def log_message(self, *_):
                pass

        server = ThreadingHTTPServer(('127.0.0.1', 0), TransientHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            home = temp / 'real-http-home'
            home.mkdir()
            env = os.environ.copy()
            env.update(HOME=home.as_posix(), MOCK_PORT=str(server.server_port), MOCK_REAL_CURL=Path(shutil.which('curl')).as_posix(),
                       MOCK_BIN=mocks.as_posix(), MOCK_ENTRY=(bundle / 'install.sh').as_posix())
            result = shell('mockbin="$MOCK_BIN"\nif command -v cygpath >/dev/null; then mockbin=$(cygpath -u "$mockbin"); fi\nexport PATH="$mockbin:$PATH"\nbash "$MOCK_ENTRY" install\n', env=env)
            require(result)
            assert TransientHandler.calls == 3 and 'RECOVERY_CALLED' in result.stdout, result.stdout + result.stderr
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)
    print('PASS recovery only for the failed Keycloak stage with exact HTTPS rejection; unrelated failures and test mode preserved')
    print('PASS real curl recovery from empty reply and HTTP 503 without concatenating error responses')


if __name__ == '__main__':
    generated = check_pinned_and_generated()
    check_image_fallback(generated)
    check_manifest_prefetch(generated)
    check_large_image_limits(generated)
    check_rollout_time_budget(generated)
    check_dcgm_prefetch(generated)
    check_effective_download_limits()
    check_local_source_reuse()
    check_forward_lifecycle()
    check_service_controls()
    check_sudo_session()
    check_install_recovery()
