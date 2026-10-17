"""Wait for the public route to serve the new sandbox after an Nginx reload."""
import hashlib
from http.client import HTTPException
import json
from pathlib import Path
import sys
import time
import urllib.error
import urllib.request


def check(base, work, javascript, timeout=180, poll=2):
    base = base.rstrip('/')
    work = Path(work)
    expected = hashlib.sha256(Path(javascript).read_bytes()).digest()
    http = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    deadline = time.monotonic() + timeout
    last = 'No response'

    def request(path):
        try:
            with http.open(base + path, timeout=max(0.1, min(20, deadline - time.monotonic()))) as response:
                return response.status, response.read()
        except urllib.error.HTTPError as error:
            return error.code, error.read()

    while time.monotonic() < deadline:
        try:
            status, raw = request('/volumes/api')
            data = None
            if status == 200:
                try:
                    data = json.loads(raw)
                except (ValueError, UnicodeDecodeError):
                    pass
            if not isinstance(data, dict) or 'namespace' not in data or 'volumes' not in data:
                last = f'Volume API HTTP {status}; waiting for JSON instead of a previous upstream response'
            else:
                namespace = data['namespace']
                if not isinstance(namespace, str) or not namespace.startswith('kubeflow-') or data.get('can_manage') is not True:
                    raise RuntimeError('Public API did not select the writable user namespace')
                if not isinstance(data['volumes'], list) or any(
                    not isinstance(v, dict) or v.get('namespace') != namespace or not v.get('name', '').startswith('pm-user-')
                    for v in data['volumes']
                ):
                    raise RuntimeError('Public API exposed a volume outside the managed user scope')
                denied_status, denied = request('/volumes/api?ns=kubeflow')
                if denied_status != 403:
                    # A retiring worker can still serve the former HTML app.
                    # A successful JSON response to this request violates policy.
                    if denied_status == 200:
                        try:
                            json.loads(denied)
                        except (ValueError, UnicodeDecodeError):
                            pass
                        else:
                            raise RuntimeError('Platform namespace request was not denied')
                    last = f'Platform denial HTTP {denied_status}; waiting for the new worker'
                else:
                    js_status, script = request('/volumes/sandbox.js')
                    if js_status == 200 and hashlib.sha256(script).digest() == expected:
                        (work / 'volumes.json').write_bytes(raw)
                        (work / 'platform-denial.json').write_bytes(denied)
                        print('USER_VOLUME_SCOPE_PASS', flush=True)
                        print('PUBLIC_SANDBOX_API_AND_COMMITTED_JAVASCRIPT_PASS', flush=True)
                        return
                    last = f'Sandbox JavaScript HTTP {js_status}; waiting for the committed file'
        except (urllib.error.URLError, HTTPException, TimeoutError, ConnectionError) as error:
            last = type(error).__name__
        print('[INFO] Public sandbox route: ' + last, flush=True)
        time.sleep(max(0, min(poll, deadline - time.monotonic())))
    raise RuntimeError('Public sandbox route did not become ready: ' + last)


if __name__ == '__main__':
    check(*sys.argv[1:])
