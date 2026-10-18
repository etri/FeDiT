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
