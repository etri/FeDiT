"""Exercise deployed APIs and real storage, without deleting existing resources."""
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid

WORK = Path(sys.argv[1])
BASE = os.environ.get('FEDIT_SANDBOX_CHECK_URL', 'http://127.0.0.1:18000').rstrip('/')
HTTP = urllib.request.build_opener(urllib.request.ProxyHandler({}))
TOKEN = 'verify-' + uuid.uuid4().hex[:16]
NS = ''
FIXTURES = []


def kubectl(*args, body=None):
    result = subprocess.run(['kubectl', *args], input=json.dumps(body) if body else None,
                            text=True, capture_output=True, timeout=180)
    if result.returncode:
        raise RuntimeError(f'kubectl {args}: {result.stderr}')
    return result.stdout


def api(method, path, expected, data=None):
    req = urllib.request.Request(BASE + path, method=method,
                                 data=json.dumps(data).encode() if data is not None else None,
                                 headers={'Content-Type': 'application/json'})
    try:
        with HTTP.open(req, timeout=45) as response:
            status, raw = response.status, response.read()
    except urllib.error.HTTPError as error:
        status, raw = error.code, error.read()
    value = json.loads(raw)
    with (WORK / 'api-results.jsonl').open('a') as output:
        output.write(json.dumps({'method': method, 'path': path, 'status': status, 'body': value}) + '\n')
    assert status == expected, (method, path, status, value)
    return value


def get(kind, name):
    return json.loads(kubectl('-n', NS, 'get', kind, name, '-o', 'json'))


def track(kind, name):
    obj = get(kind, name)
    FIXTURES.append((kind, name, obj['metadata']['uid']))
    return obj


def create(obj):
    obj['metadata'].update(namespace=NS, labels={'fedit-verification-id': TOKEN})
    kubectl('create', '-f', '-', body=obj)
    return track(obj['kind'].lower(), obj['metadata']['name'])


def remove(kind, name, uid):
    # UID precondition avoids deleting a replacement bearing the same name.
    raw = json.loads(kubectl('-n', NS, 'get', kind, name, '--ignore-not-found', '-o', 'json') or '{}')
    if not raw:
        return
    assert raw['metadata']['uid'] == uid, f'Fixture UID changed: {kind}/{name}'
    plural = {'pod': 'pods', 'persistentvolumeclaim': 'persistentvolumeclaims',
              'deployment': 'deployments'}[kind]
    group = 'apis/apps/v1' if kind == 'deployment' else 'api/v1'
    options = {'apiVersion': 'v1', 'kind': 'DeleteOptions', 'preconditions': {'uid': uid}}
    kubectl('delete', '--raw', f'/{group}/namespaces/{NS}/{plural}/{name}', '-f', '-', body=options)
    kubectl('-n', NS, 'wait', '--for=delete', kind + '/' + name, '--timeout=120s')


def existing_pvcs():
    data = json.loads(kubectl('get', 'pvc', '-A', '-o', 'json'))['items']
    return {(p['metadata']['namespace'], p['metadata']['name']): p['metadata']['uid'] for p in data}


def run():
    global NS
    before = existing_pvcs()
    catalogue = api('GET', '/volumes/api', 200)
    NS = catalogue['namespace']
    assert NS.startswith('kubeflow-') and catalogue['can_manage']
    api('GET', '/volumes/api?ns=kubeflow', 403)
    api('POST', '/volumes/api?ns=kubeflow', 403, {'name': TOKEN, 'size_gib': 1})
    images = api('GET', '/prediction-manager/api/images', 200)
    assert isinstance(images, list)
    assert all(i.get('owner_namespace') == NS and i.get('type') == 'user' for i in images)
    api('DELETE', '/prediction-manager/api/images/prediction-manager-app', 403)
    print('PASS image catalogue scope and platform mutation denial', flush=True)

    volume = api('POST', '/volumes/api', 201, {'name': TOKEN, 'size_gib': 1})
    name = volume['name']
    assert name == 'pm-user-' + TOKEN and volume['namespace'] == NS
    pvc = track('persistentvolumeclaim', name)
    storage = pvc['spec']['storageClassName']
    # Even a matching name prefix must not adopt an unlabelled existing PVC.
    legacy = 'pm-user-' + TOKEN + '-unmanaged'
    create({'apiVersion': 'v1', 'kind': 'PersistentVolumeClaim', 'metadata': {'name': legacy},
            'spec': {'accessModes': ['ReadWriteOnce'], 'storageClassName': storage,
                     'resources': {'requests': {'storage': '1Gi'}}}})
    listed = api('GET', '/volumes/api', 200)['volumes']
    assert name in [v['name'] for v in listed] and legacy not in [v['name'] for v in listed]
    api('DELETE', '/volumes/api/' + legacy, 404)
    print('PASS owned PVC creation and unmanaged PVC protection', flush=True)

    image = kubectl('-n', 'kubeflow', 'get', 'deployment', 'prediction-manager', '-o',
                    'jsonpath={.spec.template.spec.containers[?(@.name=="prediction-manager")].image}')
    pod_name = TOKEN + '-mount'
    pod_spec = {'restartPolicy': 'Never', 'automountServiceAccountToken': False,
                'securityContext': {'runAsUser': 1000, 'runAsGroup': 100, 'fsGroup': 100},
                'containers': [{'name': 'rw', 'image': image, 'command': ['python', '-u', '-c',
                   "from pathlib import Path; import time; p=Path('/workspace/probe'); "
                   f"p.write_text('{TOKEN}'); assert p.read_text()=='{TOKEN}'; "
                   "print('VOLUME_RW_PASS',flush=True); time.sleep(600)"],
                    'resources': {'requests': {'cpu': '10m', 'memory': '64Mi'},
                                  'limits': {'cpu': '500m', 'memory': '256Mi'}},
                    'volumeMounts': [{'name': 'data', 'mountPath': '/workspace'}]}],
                'volumes': [{'name': 'data', 'persistentVolumeClaim': {'claimName': name}}]}
    create({'apiVersion': 'v1', 'kind': 'Pod',
            'metadata': {'name': pod_name, 'annotations': {'sidecar.istio.io/inject': 'false'}}, 'spec': pod_spec})
    kubectl('-n', NS, 'wait', '--for=condition=Ready', 'pod/' + pod_name, '--timeout=180s')
    for _ in range(30):
        logs = kubectl('-n', NS, 'logs', pod_name)
        if 'VOLUME_RW_PASS' in logs:
            break
        time.sleep(1)
    assert 'VOLUME_RW_PASS' in logs, logs
    (WORK / 'volume-read-write.log').write_text(logs)
    api('DELETE', '/volumes/api/' + name, 409)
    remove(*FIXTURES[-1])
    # A stopped controller still owns the data and must block deletion.
    deployment = TOKEN + '-stopped'
    pod_spec['restartPolicy'] = 'Always'
    create({'apiVersion': 'apps/v1', 'kind': 'Deployment', 'metadata': {'name': deployment},
            'spec': {'replicas': 0, 'selector': {'matchLabels': {'fedit-verification-id': TOKEN}},
                     'template': {'metadata': {'labels': {'fedit-verification-id': TOKEN}},
                                  'spec': pod_spec}}})
    api('DELETE', '/volumes/api/' + name, 409)
    remove(*FIXTURES[-1])
    api('DELETE', '/volumes/api/' + name, 200)
    kubectl('-n', NS, 'wait', '--for=delete', 'pvc/' + name, '--timeout=120s')
    after = existing_pvcs()
    assert all(after.get(key) == uid for key, uid in before.items()), 'Existing PVC changed/disappeared'
    print('PASS real PVC mount/read/write, active/stopped workload deletion guards and final deletion', flush=True)
    print('PASS all pre-existing PVC UIDs preserved', flush=True)


try:
    run()
finally:
    errors = []
    for fixture in reversed(FIXTURES):
        try:
            remove(*fixture)
        except Exception as exc:
            errors.append(str(exc))
    if errors:
        raise RuntimeError('Test fixture cleanup failed: ' + '; '.join(errors))
print('USER_SANDBOX_LIFECYCLE_PASS', flush=True)
