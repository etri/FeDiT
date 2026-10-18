"""Read-only checks plus mocked lifecycle failures; never contact the server."""
import hashlib
import contextlib
import copy
import importlib.util
import io
import json
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
import time

ROOT = Path(__file__).resolve().parents[1]
BASH = shutil.which('bash') if os.name != 'nt' else r'C:/Program Files/Git/bin/bash.exe'


def shell(script, *, env=None, timeout=25):
    return subprocess.run([BASH, '-s'], input=script, text=True, encoding='utf-8',
                          env=env, capture_output=True, timeout=timeout)


def require(result):
    assert result.returncode == 0, result.stdout + result.stderr


def check_pinned_and_generated():
    original = ROOT / 'server-install-725eb2ed.sh'
    assert hashlib.sha256(original.read_bytes()).hexdigest() == '8c24984e888eec190d83bc9f1bc35ca37dfc3e2f5018ed3909b01dc46546bbee'
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


def check_docker_bridge_guard(generated):
    helper = ROOT / 'ensure-docker-bridge.py'
    wrapper = (ROOT / 'server-install-725eb2ed.sh').read_text(encoding='utf-8')
    embedded = wrapper.split("<<'DOCKER_BRIDGE_PY'\n", 1)[1].split('DOCKER_BRIDGE_PY\n', 1)[0]
    assert embedded == helper.read_text(encoding='utf-8')
    start = (ROOT / 'fedit-start.sh').read_text(encoding='utf-8')
    assert start.split("<<'DOCKER_BRIDGE_PY'\n", 1)[1].split('DOCKER_BRIDGE_PY\n', 1)[0] == embedded
    assert 'ensure_docker_bridge_gateway\n  ensure_local_registry' in generated
    assert '"${2:-}" == buildx' in generated
    spec = importlib.util.spec_from_file_location('bridge_guard', helper)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    class Fixture:
        def __init__(self):
            self.network = {'Name':'bridge','Driver':'bridge','IPAM':{'Config':[{'Subnet':'10.254.254.192/28','Gateway':'10.254.254.193'}]},'Options':{}}
            self.addresses = [{'local':'172.17.0.1','prefixlen':16}]
            self.kind = 'bridge'
            self.actions = []
            self.apply = True
        def run(self, *args):
            if args[:3] == ('docker','network','inspect'): return json.dumps([self.network])
            if args[:4] == ('ip','-j','-d','link'): return json.dumps([{'linkinfo':{'info_kind':self.kind}}])
            if args[:4] == ('ip','-j','-4','address'): return json.dumps([{'addr_info':self.addresses}])
            assert args == ('ip','address','replace','10.254.254.193/28','dev','docker0'), args
            self.actions.append(args)
            if self.apply: self.addresses.append({'local':'10.254.254.193','prefixlen':28})
            return ''
    with contextlib.redirect_stdout(io.StringIO()):
        f=Fixture()
        assert module.ensure_bridge(f.run) is True
        assert len(f.actions)==1 and f.addresses[0]=={'local':'172.17.0.1','prefixlen':16}
        assert module.ensure_bridge(f.run) is False and len(f.actions)==1
        f=Fixture(); f.network['IPAM']['Config']=[{'Subnet':'172.17.0.0/16','Gateway':'172.17.0.1'}]
        assert module.ensure_bridge(f.run) is False and not f.actions
        for change in ('interface','gateway','kind','not_applied'):
            f=Fixture()
            if change=='interface': f.network['Options']['com.docker.network.bridge.name']='eth0'
            if change=='gateway': f.network['IPAM']['Config'][0]['Gateway']='10.254.254.194'
            if change=='kind': f.kind='veth'
            if change=='not_applied': f.apply=False
            try: module.ensure_bridge(f.run)
            except RuntimeError: pass
            else: raise AssertionError('Unsafe/ineffective bridge repair accepted: '+change)
            if change!='not_applied': assert not f.actions
    print('PASS installer-owned Docker gateway repair, alias preservation, idempotence and foreign-interface denial')


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
python3() { echo "python3 $*" >> "$events"; return 0; }
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
    assert result.stdout.index('systemctl start containerd.service docker.service') < result.stdout.index('python3 -') < result.stdout.index('docker start pm-verification-registry')
    assert 'systemctl enable' not in result.stdout
    result = shell(stop.replace(reexec, prelude) + '\ncat "$events"\n')
    require(result)
    assert result.stdout.index('systemctl stop kubelet.service') < result.stdout.index('crictl --runtime-endpoint')
    assert 'docker stop --timeout 20 test-docker-container' in result.stdout
    assert 'crictl --runtime-endpoint unix:///run/containerd/containerd.sock --timeout=90s stop --timeout 20 test-kube-container' in result.stdout
    assert 'systemctl stop docker.socket docker.service containerd.service' in result.stdout
    result = shell(stop.replace(reexec, prelude + '\nFAIL_CONTAINER=1\n'))
    assert result.returncode == 1 and '[FAIL]' in result.stderr
    print('PASS service ordering, unchanged boot settings and container-stop failure reporting')


def check_registry_recovery(generated):
    start = generated.index('pull_docker_image_via_registry_api() {')
    end = generated.index('\npull_and_mirror_docker_image() {', start)
    function = generated[start:end]
    generic = (ROOT.parent / 'scripts/bootstrap-verification.sh').read_text(encoding='utf-8')
    a = generic.index('pull_docker_image_via_registry_api() {')
    b = generic.index('\npull_and_mirror_docker_image() {', a)
    assert function == generic[a:b]
    code = function.split("<<'REGISTRY_DOWNLOAD_PY'\n", 1)[1].split('\nREGISTRY_DOWNLOAD_PY\n', 1)[0]
    blobs = [b'{"architecture":"amd64","os":"linux"}', b'first-layer-proof' * 9000, b'next-layer-proof' * 90000]
    digests = ['sha256:' + hashlib.sha256(body).hexdigest() for body in blobs]
    manifest = {'schemaVersion': 2, 'config': {'digest': digests[0], 'size': len(blobs[0])},
                'layers': [{'digest': d, 'size': len(body)} for d, body in zip(digests[1:], blobs[1:])]}
    state = {'tokens': {}, 'token_count': 0, 'phase': 'fail', 'forced_401': False,
             'partial': False, 'first_gets': 0, 'resumed': False}

    class Registry(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def send(self, status, body=b'', headers=None):
            self.send_response(status)
            self.send_header('Content-Length', str(len(body)))
            for key, value in (headers or {}).items():
                self.send_header(key, value)
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path.startswith('/token?'):
                state['token_count'] += 1
                token = 'test-token-' + str(state['token_count'])
                state['tokens']['Bearer ' + token] = time.monotonic() + 2
                self.send(200, json.dumps({'token': token, 'expires_in': 2}).encode())
                return
            if state['tokens'].get(self.headers.get('Authorization'), 0) <= time.monotonic():
                self.send(401)
                return
            if '/manifests/' in self.path:
                self.send(200, json.dumps(manifest).encode())
                return
            digest = self.path.rsplit('/', 1)[-1]
            index = digests.index(digest)
            if index == 1:
                state['first_gets'] += 1
                assert not self.headers.get('Range'), 'Corrupt complete blob must restart at zero'
                time.sleep(2.2)  # Token expires while a valid response is streaming.
            if index == 2:
                if not state['forced_401']:
                    state['forced_401'] = True
                    self.send(401)
                    return
                if state['phase'] == 'fail':
                    if not state['partial']:
                        state['partial'] = True
                        self.send_response(200)
                        self.send_header('Content-Length', str(len(blobs[index])))
                        self.end_headers()
                        self.wfile.write(blobs[index][:len(blobs[index]) // 2])
                        self.wfile.flush()
                        self.connection.shutdown(socket.SHUT_RDWR)
                        self.close_connection = True
                    else:
                        self.send(503)
                    return
                if self.headers.get('Range'):
                    offset = int(self.headers['Range'].split('=')[1].split('-')[0])
                    state['resumed'] = offset == len(blobs[index]) // 2
                    self.send(206, blobs[index][offset:], {'Content-Range': f'bytes {offset}-{len(blobs[index])-1}/{len(blobs[index])}'})
                    return
            self.send(200, blobs[index])

    server = ThreadingHTTPServer(('127.0.0.1', 0), Registry)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with tempfile.TemporaryDirectory() as temp:
            temp = Path(temp)
            local = f'http://127.0.0.1:{server.server_port}'
            code = code.replace('https://registry-1.docker.io', local).replace('https://auth.docker.io/token', local + '/token')
            code = code.replace('range(12)', 'range(3)').replace('attempt == 11', 'attempt == 2').replace('min(8, 1 + attempt)', '0.01')
            script = temp / 'download.py'
            script.write_text(code, encoding='utf-8')
            cache = temp / 'cache with spaces'
            archive = temp / 'image.tar'
            env = os.environ.copy()
            env.update(NO_PROXY='127.0.0.1', no_proxy='127.0.0.1')
            def run():
                return subprocess.run([sys.executable, str(script), 'fixture:latest', str(archive), str(cache)],
                                      capture_output=True, text=True, encoding='utf-8', timeout=20, env=env)
            failed = run()
            assert failed.returncode != 0 and cache.is_dir(), failed.stdout + failed.stderr
            assert (cache / 'blobs/sha256' / digests[2].split(':')[1]).stat().st_size == len(blobs[2]) // 2
            state['phase'] = 'pass'
            require(run())
            assert state['resumed'] and state['first_gets'] == 1 and state['token_count'] >= 4
            with tarfile.open(archive) as saved:
                for digest, body in zip(digests, blobs):
                    assert saved.extractfile('blobs/sha256/' + digest.split(':')[1]).read() == body
            bad = cache / 'blobs/sha256' / digests[1].split(':')[1]
            bad.write_bytes(b'x' * len(blobs[1]))
            require(run())
            assert state['first_gets'] == 2 and bad.read_bytes() == blobs[1]
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
    shell_test = r'''set -Eeuo pipefail
test_dir=$(mktemp -d)
trap 'rm -rf -- "$test_dir"' EXIT
DOWNLOADS_DIR="$test_dir/downloads with spaces"
mkdir -p "$DOWNLOADS_DIR"
python3() { cat >/dev/null; echo payload > "$4/blob"; echo "$4" > "$test_dir/cache"; }
docker() { return "${LOAD_EXIT:-0}"; }
''' + function + r'''
pull_docker_image_via_registry_api fixture:latest
[[ ! -e "$(cat "$test_dir/cache")" ]]
LOAD_EXIT=7
if pull_docker_image_via_registry_api fixture:latest; then exit 99; fi
[[ -f "$(cat "$test_dir/cache")/blob" ]]
for archive in "$DOWNLOADS_DIR"/docker-registry-image.*.tar; do [[ ! -e "$archive" ]]; done
'''
    require(shell(shell_test))
    print('PASS real HTTP token expiry/401 renewal, interrupted blob resume, corrupt cache repair and post-load cache cleanup')


def check_readonly_source_git():
    helper = next(line for line in (ROOT / 'update-user-sandbox.sh').read_text(encoding='utf-8').splitlines()
                  if line.startswith('git_repo()'))
    with tempfile.TemporaryDirectory() as temp:
        repo = Path(temp) / 'source with spaces'
        repo.mkdir()
        def git(*args, env=None):
            return subprocess.run(['git', '-C', str(repo), *args], capture_output=True, check=True, env=env)
        git('init', '-q')
        file = repo / 'tracked.txt'
        file.write_text('source remains unchanged\n', encoding='utf-8')
        git('add', 'tracked.txt')
        index = repo / '.git/index'
        before = index.read_bytes()
        changed_time = file.stat().st_mtime + 5
        os.utime(file, (changed_time, changed_time))
        env = os.environ.copy()
        env['SOURCE_GIT_FIXTURE'] = repo.as_posix()
        require(shell('set -Eeuo pipefail\nrepo="$SOURCE_GIT_FIXTURE"\n' + helper + '\ngit_repo status --porcelain\n', env=env))
        assert index.read_bytes() == before, 'Read-only source check rewrote the Git index'
        env['GIT_OPTIONAL_LOCKS'] = '1'
        git('status', '--porcelain', env=env)
        assert index.read_bytes() != before, 'Fixture did not exercise Git index refresh'
    print('PASS real Git source check leaves the index unchanged when its stat cache needs refresh')


def check_public_sandbox_readiness():
    path = ROOT / 'check-user-sandbox-route.py'
    spec = importlib.util.spec_from_file_location('sandbox_route_check', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    namespace = 'kubeflow-user-example-com'
    correct = {'namespace': namespace, 'can_manage': True,
               'volumes': [{'namespace': namespace, 'name': 'pm-user-owned'}]}
    script = b'const sandbox = "committed version";\n'
    state = {'mode': 'reload', 'api': 0, 'platform': 0, 'js': 0}

    class Route(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def send(self, status, body):
            self.send_response(status)
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            old = b'<!doctype html><title>Previous upstream</title>'
            if self.path == '/volumes/api':
                state['api'] += 1
                if state['mode'] == 'html' or (state['mode'] == 'reload' and state['api'] == 2):
                    self.send(200, old)
                elif state['mode'] == 'reload' and state['api'] == 1:
                    self.send(503, b'not ready')
                elif state['mode'] == 'wrong-scope':
                    self.send(200, json.dumps({**correct, 'namespace': 'kubeflow'}).encode())
                else:
                    self.send(200, json.dumps(correct).encode())
            elif self.path == '/volumes/api?ns=kubeflow':
                state['platform'] += 1
                if state['mode'] == 'reload' and state['platform'] == 1:
                    self.send(200, old)
                elif state['mode'] == 'allowed-platform':
                    self.send(200, b'{"namespace":"kubeflow"}')
                else:
                    self.send(403, b'{"detail":"denied"}')
            elif self.path == '/volumes/sandbox.js':
                state['js'] += 1
                if state['mode'] == 'bad-js' or (state['mode'] == 'reload' and state['js'] == 1):
                    self.send(200, old)
                else:
                    self.send(200, script)
            else:
                self.send(404, b'')

    server = ThreadingHTTPServer(('127.0.0.1', 0), Route)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with tempfile.TemporaryDirectory() as temp, contextlib.redirect_stdout(io.StringIO()):
            root = Path(temp)
            javascript = root / 'committed file with spaces.js'
            javascript.write_bytes(script)
            work = root / 'success'
            work.mkdir()
            module.check(f'http://127.0.0.1:{server.server_port}', work, javascript, timeout=3, poll=0.01)
            assert (state['api'], state['platform'], state['js']) == (5, 3, 2), state
            assert json.loads((work / 'volumes.json').read_text()) == correct
            for mode, reason in [('html', 'did not become ready'), ('bad-js', 'did not become ready'),
                                 ('wrong-scope', 'writable user namespace'), ('allowed-platform', 'was not denied')]:
                state.update(mode=mode, api=0, platform=0, js=0)
                work = root / mode
                work.mkdir()
                try:
                    module.check(f'http://127.0.0.1:{server.server_port}', work, javascript, timeout=0.25, poll=0.02)
                except RuntimeError as error:
                    assert reason in str(error), str(error)
                else:
                    raise AssertionError('Invalid public route was accepted: ' + mode)
                assert not (work / 'volumes.json').exists()
                if mode in ('wrong-scope', 'allowed-platform'):
                    assert state['api'] == 1
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
    print('PASS real HTTP reload race: old HTML/503 retries, exact JavaScript, namespace denial and security failures')


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


def check_label_startup_profile(generated):
    import yaml
    render = generated.split('render_label_studio() {', 1)[1].split('\ndeploy_prediction_manager()', 1)[0]
    code = render.split("<<'PY'\n", 1)[1].split('\nPY\n', 1)[0]
    baseline = subprocess.check_output(['git', '-C', str(ROOT.parents[3]), 'show',
        '725eb2edeec1b756b45abb809cdc4dc971a890bf:OPFW/ml_prediction_manager_v2/k8s/optional/label-studio.yaml'])
    profile = generated.split('apply_cpu_single_node_resource_profile() {', 1)[1].split('\nrestore_full_kubeflow_workloads()', 1)[0]
    with tempfile.TemporaryDirectory() as temp:
        temp = Path(temp)
        source, output = temp / 'source.yaml', temp / 'label.yaml'
        source.write_bytes(baseline)
        sys.argv = ['render', str(source), str(output), '127.0.0.1:5000/label-studio:1.18.0',
                    'http://gateway', 'http://public/label-studio', 'admin@example.com', 'true']
        exec(compile(code, 'actual-label-renderer', 'exec'), {})
        deployment = next(d for d in yaml.safe_load_all(output.read_text(encoding='utf-8')) if d.get('kind') == 'Deployment')
        container = deployment['spec']['template']['spec']['containers'][0]
        assert container['resources'] == {'requests': {'cpu': '100m', 'memory': '128Mi'},
                                         'limits': {'cpu': '1', 'memory': '2Gi'}}
        assert container['startupProbe'] == {'httpGet': {'path': '/health', 'port': 'http'},
            'timeoutSeconds': 10, 'periodSeconds': 10, 'failureThreshold': 90}
        assert 'livenessProbe' in container and 'readinessProbe' in container
        # Execute the actual generic resource exclusion: current Label settings
        # must survive the post-tenant tuning, while other deployments still change.
        case = 'case "${namespace}/${resource_name}" in' + profile.split('case "${namespace}/${resource_name}" in', 1)[1].split('esac', 1)[0] + 'esac'
        script = 'set -Eeuo pipefail\nfor resource_name in deployment.apps/label-studio statefulset.apps/pm-postgresql deployment.apps/ordinary; do\nnamespace=kubeflow\n' + case + '\necho "APPLY:$resource_name"\ndone\n'
        result = shell(script)
        require(result)
        assert result.stdout.strip() == 'APPLY:deployment.apps/ordinary'
        # Execute the actual probe updater against the rendered Label deployment.
        # Its startup budget must not be overwritten by the generic 12-failure profile.
        probe_code = profile.split('python3 - "$probe_source_file" "$probe_patch_file" <<\'PY\'\n', 1)[1].split('\nPY\n', 1)[0]
        other = {'metadata': {'namespace': 'kubeflow', 'name': 'ordinary'},
                 'spec': {'template': {'spec': {'containers': [{'name': 'app', 'livenessProbe': {'timeoutSeconds': 1}}]}}}}
        data, patch = temp / 'deployments.json', temp / 'patches.tsv'
        data.write_text(json.dumps({'items': [deployment, other]}), encoding='utf-8')
        sys.argv = ['probe', str(data), str(patch)]
        exec(compile(probe_code, 'actual-probe-updater', 'exec'), {})
        patches = patch.read_text(encoding='utf-8').splitlines()
        assert len(patches) == 1 and patches[0].startswith('kubeflow\tordinary\t')
    print('PASS Label startup probe and dedicated resources survive generic post-tenant tuning without another rollout')


def check_postgres_and_proxy_profile(generated):
    import yaml
    wrapper = (ROOT / 'server-install-725eb2ed.sh').read_text(encoding='utf-8')
    patch = wrapper.split("<<'POSTGRES_READINESS_PY'\n", 1)[1].split('\nPOSTGRES_READINESS_PY\n', 1)[0]
    baseline = subprocess.check_output(['git', '-C', str(ROOT.parents[3]), 'show',
        '725eb2edeec1b756b45abb809cdc4dc971a890bf:OPFW/ml_prediction_manager_v2/scripts/k8s/verification/postgres-keycloak.yaml.template'])
    with tempfile.TemporaryDirectory() as temp:
        path = Path(temp) / 'postgres.yaml.template'
        path.write_bytes(baseline)
        expected = list(yaml.safe_load_all(baseline))
        for doc in expected:
            if doc.get('kind') == 'StatefulSet' and doc.get('metadata', {}).get('name') == 'pm-postgresql':
                container = doc['spec']['template']['spec']['containers'][0]
                container['resources']['requests']['cpu'] = '100m'
                container['readinessProbe'].update(timeoutSeconds=10, failureThreshold=6)
        sys.argv = ['patch', str(path)]
        exec(compile(patch, 'actual-postgres-template-patch', 'exec'), {})
        assert list(yaml.safe_load_all(path.read_text(encoding='utf-8'))) == expected
        # The semantic equality above also protects Secret placeholders, SQL,
        # storage claims, the pg_isready command and all unrelated documents.
    profile = generated.split('apply_cpu_single_node_resource_profile() {', 1)[1].split('\nrestore_full_kubeflow_workloads()', 1)[0]
    start = profile.index('        case "${namespace}/${resource_name}" in\n          kubeflow/deployment.apps/kuberay-operator|')
    case = profile[start:profile.index('esac', start) + len('esac')]
    setup = '''set -Eeuo pipefail
kubectl() { printf '%s\\n' "${@: -1}"; }
for pair in kubeflow:deployment.apps/kuberay-operator kubeflow-user-example-com:deployment.apps/ml-pipeline-ui-artifact kubeflow-user-example-com:deployment.apps/ml-pipeline-visualizationserver kubeflow:deployment.apps/ordinary other-user:deployment.apps/ml-pipeline-ui-artifact; do
namespace=${pair%%:*}
resource_name=${pair#*:}
'''
    result = shell(setup + case + '\ndone\n')
    require(result)
    patches = [json.loads(line) for line in result.stdout.splitlines()]
    assert len(patches) == 3
    for item in patches:
        assert item['spec']['template']['metadata']['annotations'] == {
            'sidecar.istio.io/proxyCPU': '10m', 'sidecar.istio.io/proxyMemory': '64Mi'}
        assert item['spec']['strategy'] == {'type': 'RollingUpdate',
            'rollingUpdate': {'maxSurge': 0, 'maxUnavailable': 1}}
    print('PASS PostgreSQL readiness/resources preserve credentials and PVCs; exact three proxy templates avoid CPU surge')


def check_http_readiness_deadline(generated):
    function = 'wait_for_http_endpoint() {' + generated.split('wait_for_http_endpoint() {', 1)[1].split('\nconfigure_host_firewall_ports()', 1)[0]
    class Handler(BaseHTTPRequestHandler):
        initial_calls = 0
        def log_message(self, *args):
            pass
        def do_GET(self):
            if self.path == '/slow':
                time.sleep(6)
                status = 200
            elif self.path == '/initial':
                Handler.initial_calls += 1
                status = 503 if Handler.initial_calls <= 2 else 200
            else:
                status = 500
            try:
                self.send_response(status)
                self.end_headers()
                self.wfile.write(b'ok')
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        url = f'http://127.0.0.1:{server.server_port}'
        setup = 'set -Eeuo pipefail\nrecord() { echo "$*"; }\n' + function
        result = shell(setup + f'\nSERVICE_HTTP_READY_TIMEOUT_SECONDS=7 wait_for_http_endpoint "{url}/initial" "startup"\n', timeout=12)
        require(result)
        assert Handler.initial_calls == 3 and 'PASS startup' in result.stdout
        for path in ('fail', 'slow'):
            start = time.monotonic()
            result = shell(setup + f'\nSERVICE_HTTP_READY_TIMEOUT_SECONDS=2 wait_for_http_endpoint "{url}/{path}" "failure"\n', timeout=7)
            assert result.returncode != 0 and time.monotonic() - start < 5
            assert '2초 안에' in result.stderr and '120초' not in result.stderr
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
    print('PASS real HTTP startup recovery and elapsed deadlines, including a blocked response')


def check_optional_storage_scan():
    source = (ROOT / 'server-install-725eb2ed.sh').read_text(encoding='utf-8')
    body = source.split('for path in /var/lib/docker /var/lib/containerd /var/lib/kubelet /opt/local-path-provisioner; do\n', 1)[1].split('\ndone\n', 1)[0]
    assert 'du -shx "$path"' in body and '--kill-after=2s 5s' in body
    setup = r'''set -Eeuo pipefail
test_dir=$(mktemp -d)
trap 'rm -rf -- "$test_dir"' EXIT
mkdir "$test_dir/bin"
export PATH="$test_dir/bin:$PATH"
cat > "$test_dir/bin/sudo" <<'MOCK'
#!/usr/bin/env bash
exec "$@"
MOCK
cat > "$test_dir/bin/du" <<'MOCK'
#!/usr/bin/env bash
[[ "$1" == -shx ]] || exit 90
trap '' TERM
while true; do sleep 1; done
MOCK
chmod +x "$test_dir/bin/"*
path="$test_dir/optional-scan"
'''
    start = time.monotonic()
    result = shell(setup + body + '\necho INSTALLATION_CONTINUES\n', timeout=18)
    require(result)
    assert time.monotonic() - start < 14
    assert 'Optional storage-size scan skipped or timed out:' in result.stdout
    assert 'INSTALLATION_CONTINUES' in result.stdout
    print('PASS optional storage scan is bounded even when du ignores TERM; installation continues')


def check_stale_tenant_refresh(generated):
    source = (ROOT / 'refresh-stale-tenant-pods.py').read_text(encoding='utf-8')
    wrapper = (ROOT / 'server-install-725eb2ed.sh').read_text(encoding='utf-8')
    embedded = wrapper.split("<<'TENANT_REFRESH_PY'\n", 1)[1].split('\nTENANT_REFRESH_PY\n', 1)[0] + '\n'
    assert embedded == source
    assert 'python3 "${SCRIPT_DIR}/../server-a40/refresh-stale-tenant-pods.py"' in generated
    assert 'delete pod nifi-0 --wait=false' not in generated
    assert 'delete pod -l ray.io/node-type=head --wait=false' not in generated
    assert '    nifi_request_cpu=100m\n    nifi_request_memory=256Mi\n    nifi_limit_cpu=1\n' in generated
    module = {}
    exec(compile(source, 'refresh-stale-tenant-pods.py', 'exec'), module)
    ns = module['NAMESPACE']
    sts = {'metadata': {'uid': 'nifi-owner'}, 'status': {'updateRevision': 'current'}}
    nifi = {'metadata': {'namespace': ns, 'name': 'nifi-0', 'uid': 'nifi-uid',
        'labels': {'controller-revision-hash': 'current'}, 'ownerReferences': [
            {'controller': True, 'kind': 'StatefulSet', 'uid': 'nifi-owner'}]},
        'status': {'phase': 'Pending'}}
    cluster = {'metadata': {'uid': 'ray-owner'}, 'spec': {'headGroupSpec': {'rayStartParams': {'num-cpus': '1'}}}}
    ray = {'metadata': {'namespace': ns, 'name': 'pm-ray-head-example', 'uid': 'ray-uid',
        'ownerReferences': [{'controller': True, 'kind': 'RayCluster', 'uid': 'ray-owner'}]},
        'spec': {'containers': [{'name': 'ray-head', 'command': ['/bin/bash', '-lc'],
                               'args': ['ulimit -n 65536; ray start --head --num-cpus="1.0" --block']}]}}
    plan = module['stale_pods']
    assert plan(sts, nifi, cluster, [ray]) == []  # A fresh Pending Pod keeps its initialization.
    nifi['status']['phase'] = 'Running'
    assert plan(sts, nifi, cluster, [ray]) == []
    stale_nifi = copy.deepcopy(nifi)
    stale_nifi['metadata']['labels']['controller-revision-hash'] = 'old'
    assert plan(sts, stale_nifi, cluster, [ray]) == [stale_nifi]
    stale_ray = copy.deepcopy(ray)
    stale_ray['spec']['containers'][0]['args'] = ['ray start --head --num-cpus 2 --block']
    assert plan(sts, nifi, cluster, [stale_ray]) == [stale_ray]
    foreign = copy.deepcopy(stale_nifi)
    foreign['metadata']['ownerReferences'][0]['uid'] = 'replacement-owner'
    assert plan(sts, foreign, cluster, [ray]) == []
    assert plan({}, nifi, {}, []) == []
    deletes = []
    def fake_kubectl(*args, body=None):
        if args[0] == 'delete':
            deletes.append((args, body))
            return {}
        kind = args[3]
        return {'statefulset': sts, 'pod': stale_nifi, 'raycluster': cluster,
                'pods': {'items': [stale_ray]}}[kind]
    module['kubectl'] = fake_kubectl
    with contextlib.redirect_stdout(io.StringIO()):
        module['refresh']()
    assert len(deletes) == 2
    for args, body in deletes:
        assert args[:2] == ('delete', '--raw') and args[-2:] == ('-f', '-')
        assert args[2].startswith('/api/v1/namespaces/' + ns + '/pods/')
        expected = 'nifi-uid' if args[2].endswith('/nifi-0') else 'ray-uid'
        assert body['preconditions'] == {'uid': expected}
    bad = copy.deepcopy(ray)
    bad['spec']['containers'][0]['args'] = ['ray start --head --block']
    try:
        plan(sts, stale_nifi, cluster, [bad])
    except ValueError:
        pass
    else:
        raise AssertionError('An unknown existing head setting must not trigger guessed Pod deletion')
    stale_ray['spec']['containers'][0]['args'] = bad['spec']['containers'][0]['args']
    deletes.clear()
    try:
        module['refresh']()
    except ValueError:
        pass
    else:
        raise AssertionError('Unsafe refresh plan was accepted')
    assert deletes == []  # Validate the complete plan before deleting even the stale NiFi Pod.
    print('PASS fresh tenant Pods retained; only stale revisions/CPU settings refreshed with UID preconditions')


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
    check_docker_bridge_guard(generated)
    check_optional_storage_scan()
    check_label_startup_profile(generated)
    check_postgres_and_proxy_profile(generated)
    check_http_readiness_deadline(generated)
    check_stale_tenant_refresh(generated)
    check_registry_recovery(generated)
    check_readonly_source_git()
    check_public_sandbox_readiness()
    check_sudo_session()
    check_install_recovery()
