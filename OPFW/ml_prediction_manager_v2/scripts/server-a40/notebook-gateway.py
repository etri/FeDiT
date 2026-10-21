#!/usr/bin/python3
"""Reconcile PM Notebook Pods into the existing HTTPS 8080 Nginx server."""
import html
import json
import logging
import os
from pathlib import Path
import re
import signal
import socket
import subprocess
import time
import urllib.request

LABEL = 'app.kubernetes.io/managed-by=prediction-manager'
NAME = re.compile(r'[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\Z')
ROUTES = Path('/etc/nginx/snippets/prediction-manager-notebooks.conf')
STATE = Path('/var/lib/prediction-manager-notebook-gateway')
RUN = Path('/run/prediction-manager-notebook-gateway')
PROXY = '/etc/nginx/snippets/prediction-manager-notebook-proxy.conf'
log = logging.getLogger('notebook-gateway')


def discover(notebooks, pods):
    """Only PM-created Jupyter Pods in tenant namespaces can become upstreams."""
    targets = []
    for nb in notebooks:
        meta = nb['metadata']
        ns, name = meta.get('namespace', ''), meta.get('name', '')
        annotations = meta.get('annotations') or {}
        if not (NAME.fullmatch(ns) and NAME.fullmatch(name) and ns.startswith('kubeflow-')):
            continue
        if ns in {'kubeflow-system'} or meta.get('deletionTimestamp'):
            continue
        if meta.get('labels', {}).get('app.kubernetes.io/managed-by') != 'prediction-manager':
            continue
        if annotations.get('notebooks.kubeflow.org/server-type', 'jupyter') != 'jupyter':
            continue
        main = nb['spec']['template']['spec']['containers'][0]
        port = int(annotations.get('prediction-manager.io/container-port') or main.get('ports', [{}])[0].get('containerPort', 8888))
        if not 1 <= port <= 65535:
            continue
        stopped = bool(annotations.get('kubeflow-resource-stopped'))
        target = {'namespace': ns, 'name': name, 'uid': meta['uid'], 'port': port,
                  'prefix': f'/notebook/{ns}/{name}/', 'state': '중지됨' if stopped else '준비 중'}
        if not stopped:
            for pod in pods:
                pm = pod['metadata']
                owners = pm.get('ownerReferences') or []
                if (pm.get('namespace') != ns or pm.get('deletionTimestamp')
                        or not any(o.get('kind') == 'StatefulSet' and o.get('name') == name for o in owners)):
                    continue
                ready = any(c.get('type') == 'Ready' and c.get('status') == 'True'
                            for c in pod.get('status', {}).get('conditions', []))
                if ready and pod.get('status', {}).get('phase') == 'Running':
                    target.update(pod=pm['name'], pod_uid=pm['uid'])
                    break
        targets.append(target)
    return sorted(targets, key=lambda t: (t['namespace'], t['name']))


def render(targets, active):
    ready = [t for t in targets if t['uid'] in active]
    if len(ready) == 1:
        root = f"location = / {{ return 302 {ready[0]['prefix']}lab; }}\n"
    else:
        root = f'location = / {{ root {STATE}; try_files /index.html =503; add_header Cache-Control "no-store"; }}\n'
    routes = root + 'location = /lab { return 302 /; }\n'
    for target in ready:
        prefix = target['prefix']
        port = active[target['uid']]
        routes += (f'location = {prefix[:-1]} {{ return 302 {prefix}; }}\n'
                   f'location ^~ {prefix} {{\n'
                   f'    proxy_pass http://127.0.0.1:{port};\n'
                   f'    include {PROXY};\n}}\n')
    rows = []
    for t in targets:
        text = html.escape(t['namespace'] + ' / ' + t['name'])
        if t['uid'] in active:
            rows.append(f'<li><a href="{t["prefix"]}lab">{text}</a> — 실행 중</li>')
        else:
            rows.append(f'<li>{text} — {html.escape(t["state"])}</li>')
    description = ('<ul>' + ''.join(rows) + '</ul>' if rows else
                   '<p>실행 중인 컨테이너가 없습니다. 예측매니저에서 이미지로 컨테이너를 실행하세요.</p>')
    page = ('<!doctype html><html lang="ko"><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<meta http-equiv="refresh" content="10">'
            '<title>예측매니저 JupyterLab</title>'
            '<body style="font:16px sans-serif;max-width:850px;margin:60px auto;padding:20px">'
            '<h1>예측매니저 JupyterLab</h1>' + description + '</body></html>')
    return routes, page


def atomic_write(path, text):
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(text)
    tmp.chmod(0o644)
    tmp.replace(path)


def publish(targets, active):
    routes, page = render(targets, active)
    if not (STATE / 'index.html').exists() or (STATE / 'index.html').read_text() != page:
        atomic_write(STATE / 'index.html', page)
    if ROUTES.exists() and ROUTES.read_text() == routes:
        return
    previous = ROUTES.read_text() if ROUTES.exists() else ''
    atomic_write(ROUTES, routes)
    checked = subprocess.run(['nginx', '-t'], capture_output=True, text=True)
    if checked.returncode:
        atomic_write(ROUTES, previous)
        raise RuntimeError('Generated Nginx routes rejected: ' + checked.stderr)
    # Signal Nginx directly: a systemd reload job can wait on this service's
    # own stop job because the gateway is ordered After=nginx.service.
    subprocess.run(['nginx', '-s', 'reload'], check=True, timeout=10)
    log.info('Published %s notebook routes', len(active))


def get_items(resource):
    args = ['kubectl', '--request-timeout=10s', 'get', resource, '-A', '-l', LABEL, '-o', 'json']
    result = subprocess.run(args, check=True, capture_output=True, text=True, timeout=15)
    return json.loads(result.stdout).get('items', [])


def listening(port):
    try:
        with socket.create_connection(('127.0.0.1', port), timeout=0.2):
            return True
    except OSError:
        return False


def serving(target, port):
    """Pod readiness can precede Jupyter startup; wait for the actual app."""
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(f'http://127.0.0.1:{port}{target["prefix"]}lab', timeout=1) as response:
            return response.status == 200
    except (OSError, ValueError):
        return False


def stop(child):
    if child['process'].poll() is None:
        child['process'].terminate()
        try:
            child['process'].wait(timeout=3)
        except subprocess.TimeoutExpired:
            child['process'].kill()
            child['process'].wait(timeout=3)
    child['log'].unlink(missing_ok=True)


def launch(target):
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    logfile = RUN / (target['uid'] + '.log')
    with logfile.open('w') as output:
        process = subprocess.Popen(['kubectl', '-n', target['namespace'], 'port-forward',
                                    '--address=127.0.0.1', '--pod-running-timeout=10s',
                                    'pod/' + target['pod'], f'{port}:{target["port"]}'],
                                   stdout=output, stderr=subprocess.STDOUT)
    return {'process': process, 'port': port, 'pod_uid': target['pod_uid'],
            'target_port': target['port'], 'log': logfile, 'started': time.monotonic()}


def run():
    STATE.mkdir(parents=True, exist_ok=True)
    RUN.mkdir(parents=True, exist_ok=True)
    children = {}
    running = True

    def shutdown(*_):
        nonlocal running
        running = False

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)
    try:
        while running:
            try:
                targets = discover(get_items('notebooks'), get_items('pods'))
            except Exception:
                log.exception('Discovery failed; removing notebook routes until recovery')
                targets = []
            desired = {t['uid']: t for t in targets if 'pod' in t}
            for uid, child in list(children.items()):
                target = desired.get(uid)
                failed = (child['process'].poll() is not None
                          or 'error' in child['log'].read_text(errors='replace')[-2048:].lower())
                if (not target or child['pod_uid'] != target['pod_uid']
                        or child['target_port'] != target['port'] or failed):
                    stop(child)
                    del children[uid]
            for uid, target in desired.items():
                if uid not in children:
                    children[uid] = launch(target)
            active = {uid: c['port'] for uid, c in children.items()
                      if c['process'].poll() is None and listening(c['port'])
                      and serving(desired[uid], c['port'])}
            publish(targets, active)
            atomic_write(STATE / 'routes.json', json.dumps([
                {'namespace': t['namespace'], 'name': t['name'], 'prefix': t['prefix'],
                 'ready': t['uid'] in active, 'pod': t.get('pod', '')} for t in targets], indent=2) + '\n')
            for _ in range(30):
                if not running:
                    break
                time.sleep(0.1)
    finally:
        for child in children.values():
            stop(child)
        publish([], {})


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
    run()
