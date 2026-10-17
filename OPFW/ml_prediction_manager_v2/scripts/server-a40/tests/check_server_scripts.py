"""Read-only checks plus mocked lifecycle failures; never contact the server."""
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import sys
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
    assert hashlib.sha256(original.read_bytes()).hexdigest() == '78b2c8ba0182320e5b06def1c2ce46ec4c55836858ab5c6d059d38b7b0c6ac3a'
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
        bootstrap.write_text((ROOT.parent / 'scripts/bootstrap-verification.sh').read_text(encoding='utf-8'), encoding='utf-8')
        patch = wrapper.read_text(encoding='utf-8').split('python3 - "$RUNTIME/scripts/bootstrap-verification.sh" <<\'PY\'\n', 1)[1].split('\nPY\n', 1)[0]
        sys.argv = ['patch', str(bootstrap)]
        exec(compile(patch, 'bootstrap-patch', 'exec'), {})
        subprocess.run([BASH, '-n', str(bootstrap)], check=True)
        result = bootstrap.read_text(encoding='utf-8')
        assert 'KEYCLOAK_PUBLIC_URL="http://127.0.0.1:38081/auth"' in result
        assert result.count("curl --noproxy '*' --retry 60 --retry-all-errors") == 5
    print('PASS pinned checksum, Bash syntax and actual runtime patches')


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


def check_install_recovery():
    with tempfile.TemporaryDirectory() as temp:
        temp = Path(temp)
        bundle = temp / 'bundle'
        bundle.mkdir()
        (bundle / 'install.sh').write_text((ROOT / 'install.sh').read_text(encoding='utf-8'), encoding='utf-8')
        (bundle / 'server-install-725eb2ed.sh').write_text(r'''#!/usr/bin/env bash
base="$HOME/pman-server-725eb2ed"
mkdir -p "$base/results/test"
echo 'KEYCLOAK_NODE_PORT=30081' > "$base/server-install.env"
printf 'EXIT=22\nSTAGE=install\n' > "$base/results/test/RESULT.txt"
echo "[FAIL] ${FAIL_STAGE:-PostgreSQL/Keycloak/OIDC}" > "$base/results/test/session.log"
exit "${ORIGINAL_EXIT:-22}"
''', encoding='utf-8')
        (bundle / 'resume-keycloak.sh').write_text('echo RECOVERY_CALLED\n', encoding='utf-8')
        mocks = temp / 'mocks'
        mocks.mkdir()
        (mocks / 'sha256sum').write_text('#!/usr/bin/env bash\ncat >/dev/null\nexit 0\n', encoding='utf-8')
        (mocks / 'flock').write_text('#!/usr/bin/env bash\nexit 0\n', encoding='utf-8')
        (mocks / 'curl').write_text('#!/usr/bin/env bash\nprintf \'{"error_description":"%s"}\\n\' "${MOCK_ERROR:-HTTPS required}"\n', encoding='utf-8')
        for path in mocks.iterdir():
            path.chmod(0o755)
        for index, (changes, mode, recovered, expected) in enumerate([
            ({}, 'install', True, 0),
            ({'ORIGINAL_EXIT': '0'}, 'install', False, 0),
            ({'FAIL_STAGE': 'Other stage'}, 'install', False, 22),
            ({'MOCK_ERROR': 'different error'}, 'install', False, 22),
            ({}, 'test', False, 22),
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
    print('PASS recovery only for the failed Keycloak stage with exact HTTPS rejection; unrelated failures and test mode preserved')


if __name__ == '__main__':
    check_pinned_and_generated()
    check_forward_lifecycle()
    check_service_controls()
    check_install_recovery()
