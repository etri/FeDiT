"""Image cleanup and resumable Bash orchestration checks; no server contact."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BASH = r'C:/Program Files/Git/bin/bash.exe' if os.name == 'nt' else shutil.which('bash')
spec = importlib.util.spec_from_file_location('pman_cleanup', ROOT/'pman-image-cleanup.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def image_plan_checks():
    assert module.read_cri_images(lambda args: '{"images":null}') == []
    assert module.read_cri_images(lambda args: '{}') == []
    images = [{'id': 'own', 'refs': ['127.0.0.1:5000/prediction-manager-app:old'], 'digests': []},
              {'id': 'shared', 'refs': ['python:3.12-slim', 'foreign/python:keep'], 'digests': []},
              {'id': 'foreign', 'refs': ['foreign/standalone:v1'], 'digests': []},
              {'id': 'anonymous', 'refs': [], 'digests': []},
              {'id': 'other-registry', 'refs': ['127.0.0.1:5555/other:v1'], 'digests': []}]
    containers = [{'name': 'fedit-fe', 'image_id': 'own', 'image_ref': images[0]['refs'][0]},
                  {'name': 'another-project', 'image_id': 'shared', 'image_ref': 'foreign/python:keep'}]
    cri = [{'id': 'anonymous', 'repoTags': None, 'repoDigests': None}]
    selected, retained = module.image_plan(images, containers, cri, {module.canonical('python:3.12-slim')}, 'pm-verification-registry', 5000)
    assert {i['id'] for i in selected} == {'own', 'shared', 'anonymous'}
    assert {i['id'] for i in retained} == {'foreign', 'other-registry'}
    shared = next(i for i in selected if i['id'] == 'shared')
    assert shared['protected'] and shared['refs'] == ['python:3.12-slim']
    for ref in ('python:3.12-slim', 'docker.io/python:3.12-slim', 'index.docker.io/library/python:3.12-slim'):
        assert module.canonical(ref) == 'docker.io/library/python:3.12-slim'
    print('PASS image selection: local Registry, Docker aliases, anonymous CRI images and foreign image protection')


class Runtime:
    def __init__(self):
        self.images = {'own': ['127.0.0.1:5000/app:old', 'foreign/alias:keep'],
                       'shared': ['python:3.12-slim'], 'foreign': ['foreign/app:v1']}
        self.containers = [{'Name': '/foreign-container', 'Image': 'shared',
                            'Config': {'Image': 'python:3.12-slim'}, 'Mounts': []}]
        self.cri = [{'id': 'cri-old', 'repoTags': ['docker.io/library/busybox:old']}]
        self.calls = []
        self.fail = None
        self.pods = ''
        self.ctr_refs = ['short-unmanaged-alias:old']

    def __call__(self, args):
        self.calls.append(args)
        if args[:len(module.DOCKER)] == module.DOCKER:
            cmd = args[len(module.DOCKER):]
            if cmd[:2] == ['image', 'ls']:
                return '\n'.join(self.images)
            if cmd[:2] == ['image', 'inspect']:
                return json.dumps([{'Id': i, 'RepoTags': self.images[i]} for i in cmd[2:]])
            if cmd[:2] == ['container', 'ls']:
                return 'container' if self.containers else ''
            if cmd[:2] == ['container', 'inspect']:
                return json.dumps(self.containers)
            if cmd[:2] == ['image', 'rm']:
                if self.fail == 'docker':
                    raise RuntimeError('real daemon failure fixture')
                ref = cmd[-1]
                for key, refs in list(self.images.items()):
                    if ref in refs:
                        refs.remove(ref)
                    if not refs:
                        del self.images[key]
                return ref
        if args[:len(module.CRI)] == module.CRI:
            cmd = args[len(module.CRI):]
            if cmd == ['pods', '-q']:
                return self.pods
            if cmd == ['images', '-o', 'json']:
                return json.dumps({'images': self.cri})
            if cmd[0] == 'rmi':
                if self.fail == 'cri':
                    raise RuntimeError('CRI removal failure fixture')
                if self.fail != 'cri-warning':
                    self.cri = [i for i in self.cri if i['id'] != cmd[1]]
                return ''
        if args[:len(module.CTR)] == module.CTR:
            cmd = args[len(module.CTR):]
            if cmd == ['images', 'ls', '-q']:
                return '\n'.join(self.ctr_refs)
            if cmd[:2] == ['images', 'rm']:
                self.ctr_refs.remove(cmd[2])
                return ''
        raise AssertionError(args)


def cleanup_checks():
    with tempfile.TemporaryDirectory(prefix='pman-cleanup-check-') as folder:
        root = Path(folder).resolve()
        registry = root/'home/registry'
        blobs = registry/'docker/registry/v2'
        blobs.mkdir(parents=True)
        (blobs/'old-image.txt').write_text('old image blob')
        pvc = root/'home/pvc'
        pvc.mkdir()
        (pvc/'keep.txt').write_text('keep PVC bytes')
        plan = {'schema': 1, 'registry': 'pm-verification-registry', 'owner_home': str(root/'home'),
                'owner_uid': 1000, 'registry_roots': [str(registry)], 'docker_targets': [
                    {'id': 'own', 'refs': ['127.0.0.1:5000/app:old']},
                    {'id': 'shared', 'refs': ['python:3.12-slim']}]}
        runtime = Runtime()
        output = root/'removed.json'
        module.cleanup(plan, output, runtime, mountpoints=[])
        result = json.loads(output.read_text())
        assert result['removed_docker_refs'] == ['127.0.0.1:5000/app:old']
        assert result['protected_docker_images'][0]['id'] == 'shared'
        assert runtime.images['own'] == ['foreign/alias:keep']
        assert runtime.images['shared'] == ['python:3.12-slim']
        assert not runtime.cri and not runtime.ctr_refs and not blobs.exists()
        assert (pvc/'keep.txt').read_text() == 'keep PVC bytes'
        module.cleanup(plan, output, runtime, mountpoints=[])
        assert not json.loads(output.read_text())['removed_docker_refs']
        print('PASS cleanup and retry: selected tags/CRI/blob deletion, shared aliases and actual PVC files preserved')
        for failure in ('docker', 'cri', 'cri-warning', 'pods'):
            runtime = Runtime()
            runtime.fail = failure
            if failure == 'pods':
                runtime.pods = 'still-running-pod'
            try:
                module.cleanup(plan, output, runtime, mountpoints=[])
            except (RuntimeError, ValueError):
                pass
            else:
                raise AssertionError('Failure was hidden: ' + failure)
        print('PASS daemon/CRI failures, warning-only incomplete removal and remaining Pod sandboxes propagate')
        for candidate, mounts in [(root/'outside', []), (registry, [blobs])]:
            try:
                module.clear_registry(candidate, [root/'home'], mounts)
            except ValueError:
                pass
            else:
                raise AssertionError('Unowned or mounted storage accepted')
        print('PASS Registry deletion refuses paths outside the installation and mounted subtrees')
        blobs.mkdir(parents=True)
        (blobs/'shared.txt').write_text('shared registry image')
        runtime = Runtime()
        runtime.containers[0]['Mounts'] = [{'Type': 'bind', 'Source': str(registry), 'Destination': '/shared'}]
        module.cleanup(plan, output, runtime, mountpoints=[])
        assert (blobs/'shared.txt').read_text() == 'shared registry image'
        assert json.loads(output.read_text())['shared_registry_directories_preserved']
        runtime = Runtime()
        anonymous_plan = copy.deepcopy(plan)
        anonymous_plan['registry_roots'] = []
        anonymous_plan['docker_targets'] = [{'id': 'own', 'refs': []}]
        module.cleanup(anonymous_plan, output, runtime, mountpoints=[])
        assert runtime.images['own'] == ['127.0.0.1:5000/app:old', 'foreign/alias:keep']
        assert json.loads(output.read_text())['protected_docker_images'][0]['reason'] == 'new Docker tags since inventory'
        print('PASS shared Registry mounts and newly added aliases preserve other work')


def source_catalog_checks():
    def runner(args):
        if 'ls-tree' in args:
            return 'OPFW/ml_prediction_manager_v2/Dockerfile\nOPFW/ml_prediction_manager_v2/scripts/scripts/bootstrap-verification.sh'
        if args[-1].endswith('Dockerfile'):
            return 'FROM python:3.12-slim\nFROM nginx:alpine\n'
        return ': "${RAY_BASE_IMAGE:=rayproject/ray:2.54.1-py312}"\ndocker pull registry:2.8.3\nfrom pathlib import Path\n# docker pull retries\n# docker pull\npathlib\n'
    refs = module.source_images(Path('/fixture'), runner)
    assert refs == {module.canonical(r) for r in ('python:3.12-slim', 'nginx:alpine', 'rayproject/ray:2.54.1-py312', 'registry:2.8.3')}
    print('PASS pinned/current source image catalog includes Docker bases and installer defaults')


def orchestration_checks():
    # Run the shell body with privilege/preflight mocks and an isolated home path.
    source = (ROOT/'pman-reinstall.sh').read_text(encoding='utf-8')
    source = source.replace('(( EUID != 0 )) ||', 'true ||')
    source = source.replace('$HOME', '${PMAN_TEST_HOME}')
    script = r'''set -Eeuo pipefail
test_root=$(mktemp -d)
cleanup_test() {
  rc=$?
  trap - EXIT
  if (( rc != 0 )); then
    for log in "$test_root/"run*.log; do [[ ! -f "$log" ]] || cat "$log" >&2; done
  fi
  rm -rf -- "$test_root"
  exit "$rc"
}
trap cleanup_test EXIT
export PMAN_TEST_HOME="$test_root/home" TEST_ROOT="$test_root"
export TEST_ROOT_NATIVE="$test_root"
if command -v cygpath >/dev/null; then TEST_ROOT_NATIVE=$(cygpath -m "$test_root"); export TEST_ROOT_NATIVE; fi
mkdir -p "$PMAN_TEST_HOME/pman-server-725eb2ed" "$test_root/bin" "$test_root/repo/a/b/c/scripts"
touch "$PMAN_TEST_HOME/pman-server-725eb2ed/installation-started"
export PATH="$test_root/bin:$PATH"
cat > "$test_root/bin/sudo" <<'MOCK'
#!/usr/bin/env bash
[[ "$1" != -n ]] || shift
case "$1" in
  mountpoint|nvidia-smi|chown) exit 0 ;;
  systemctl) echo "systemctl $*" >> "$TEST_ROOT/events"; exit 0 ;;
esac
exec "$@"
MOCK
cat > "$test_root/bin/flock" <<'MOCK'
#!/usr/bin/env bash
exit 0
MOCK
cat > "$test_root/bin/git" <<'MOCK'
#!/usr/bin/env bash
[[ "$*" != *'rev-parse HEAD'* ]] || echo fixture-commit
exit 0
MOCK
chmod +x "$test_root/bin/"*
here="$test_root/repo/a/b/c/scripts"
cat > "$here/sudo-session.sh" <<'MOCK'
sudo_session_start() { :; }
sudo_session_stop() { :; }
MOCK
echo ':' > "$here/pman-stop.sh"
cat > "$here/pman-uninstall.sh" <<'MOCK'
echo uninstall >> "$TEST_ROOT/events"
MOCK
cat > "$here/pman-image-cleanup.py" <<'MOCK'
import json, os, pathlib, sys
root=pathlib.Path(os.environ['TEST_ROOT_NATIVE'])
action=sys.argv[1]
with (root/'events').open('a') as f: f.write(action+'\n')
if action=='cleanup' and (root/'fail-cleanup').exists(): sys.exit(23)
pathlib.Path(sys.argv[sys.argv.index('--output')+1]).write_text(json.dumps({'action':action}))
MOCK
cat > "$here/install.sh" <<'MOCK'
echo install >> "$TEST_ROOT/events"
if [[ -f "$TEST_ROOT/fail-install" ]]; then exit 31; fi
mkdir -p "$PMAN_TEST_HOME/pman-server-725eb2ed/complete-reports"
archive="$PMAN_TEST_HOME/pman-server-725eb2ed/complete-reports/run.fixture.tar.gz"
tar -czf "$archive" --files-from /dev/null
if command -v cygpath >/dev/null; then archive=$(cygpath -m "$archive"); fi
echo "FEDIT_REPORT_ARCHIVE=$archive"
echo 'kubeadm join --token abc123.abcdefghijklmnop'
MOCK
cat > "$here/pman-reinstall.sh" <<'ACTUAL_SCRIPT'
''' + source + r'''
ACTUAL_SCRIPT
touch "$test_root/fail-cleanup"
rc=0
bash "$here/pman-reinstall.sh" > "$test_root/run1.log" 2>&1 || rc=$?
[[ "$rc" == 23 ]]
[[ $(grep -c '^uninstall$' "$test_root/events") == 1 ]]
! grep -qx install "$test_root/events"
rm "$test_root/fail-cleanup"
touch "$test_root/fail-install"
rc=0
bash "$here/pman-reinstall.sh" > "$test_root/run2.log" 2>&1 || rc=$?
[[ "$rc" == 31 ]]
[[ $(grep -c '^uninstall$' "$test_root/events") == 1 ]]
[[ $(grep -c '^cleanup$' "$test_root/events") == 2 ]]
rm "$test_root/fail-install"
bash "$here/pman-reinstall.sh" > "$test_root/run3.log" 2>&1
grep -Fxq 'PMAN_IMAGE_CLEANUP_AND_REINSTALL_PASS' "$test_root/run3.log"
[[ $(grep -c '^uninstall$' "$test_root/events") == 1 ]]
[[ $(grep -c '^cleanup$' "$test_root/events") == 2 ]]
[[ $(grep -c '^install$' "$test_root/events") == 2 ]]
[[ ! -e "$PMAN_TEST_HOME/pman-server-725eb2ed/reinstall-active" ]]
report=$(find "$PMAN_TEST_HOME/pman-server-725eb2ed" -name 'reinstall.run.*' -type d | head -1)
grep -Fxq 'EXIT=0' "$report/RESULT.txt"
! grep -Fq 'abc123.abcdefghijklmnop' "$report/session.log"
tar -tzf "$report.tar.gz" | grep -Fxq installation-report.tar.gz
! tar -tzf "$report.tar.gz" | grep -q private
echo 'PASS actual Bash sequence/resume: no repeated uninstall or image deletion after failed installation; final public archive redacts tokens'
'''
    result = subprocess.run([BASH, '-s'], input=script, text=True, encoding='utf-8', capture_output=True, timeout=100)
    assert result.returncode == 0, result.stdout + result.stderr
    print(result.stdout.strip())


if __name__ == '__main__':
    subprocess.run([BASH, '-n', str(ROOT/'pman-reinstall.sh')], check=True)
    image_plan_checks()
    cleanup_checks()
    source_catalog_checks()
    orchestration_checks()
