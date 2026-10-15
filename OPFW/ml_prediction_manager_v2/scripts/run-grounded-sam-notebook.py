"""Execute the benchmark through a running Jupyter server's real kernel API."""
import json
import http.cookiejar
from pathlib import Path
import time
import urllib.request
import uuid

import nbformat
import websocket


def main():
    base = 'http://127.0.0.1:8888'
    cookies = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))
    for attempt in range(90):
        try:
            with opener.open(base + '/api/status', timeout=2) as response:
                assert response.status == 200
            break
        except OSError:
            time.sleep(1)
    else:
        raise RuntimeError('Jupyter server did not become ready')
    opener.open(base + '/lab', timeout=30).close()
    xsrf = next(cookie.value for cookie in cookies if cookie.name == '_xsrf')
    request = urllib.request.Request(base + '/api/kernels', data=b'{"name":"python3"}',
                                     headers={'Content-Type': 'application/json', 'X-XSRFToken': xsrf})
    with opener.open(request, timeout=30) as response:
        kernel = json.load(response)['id']
    print('JUPYTER_KERNEL=' + kernel, flush=True)
    notebook = nbformat.v4.new_notebook()
    code = "import runpy\nrunpy.run_path('/home/jovyan/source/scripts/grounded-sam-benchmark.py', run_name='__main__')"
    cell = nbformat.v4.new_code_cell(code)
    notebook.cells = [cell]
    identifier = uuid.uuid4().hex
    connection = websocket.create_connection(
        f'ws://127.0.0.1:8888/api/kernels/{kernel}/channels?session_id={identifier}',
        timeout=120, origin=base, cookie='; '.join(f'{cookie.name}={cookie.value}' for cookie in cookies))
    try:
        connection.send(json.dumps({'header': {'msg_id': identifier, 'username': 'validation',
                                               'session': identifier, 'msg_type': 'execute_request',
                                               'version': '5.3'}, 'parent_header': {}, 'metadata': {},
                                    'content': {'code': code, 'silent': False, 'store_history': True,
                                                'user_expressions': {}, 'allow_stdin': False,
                                                'stop_on_error': True}, 'channel': 'shell'}))
        error = None
        while True:
            message = json.loads(connection.recv())
            if message.get('parent_header', {}).get('msg_id') != identifier:
                continue
            kind = message.get('msg_type', message.get('header', {}).get('msg_type'))
            content = message['content']
            if kind == 'stream':
                print(content['text'], end='', flush=True)
                cell.outputs.append(nbformat.v4.new_output('stream', name=content['name'], text=content['text']))
            elif kind == 'error':
                error = content
                cell.outputs.append(nbformat.v4.new_output('error', **content))
            elif kind == 'execute_input':
                cell.execution_count = content['execution_count']
            elif kind == 'status' and content.get('execution_state') == 'idle':
                break
        notebook.metadata.kernelspec = {'name': 'python3', 'display_name': 'Python 3', 'language': 'python'}
        nbformat.write(notebook, '/home/jovyan/work/grounded-sam-executed.ipynb')
        if error:
            raise RuntimeError(json.dumps(error))
        result = json.loads(Path('/home/jovyan/work/grounded-sam-results.json').read_text())
        assert result['completed']
        print('JUPYTER_NOTEBOOK_VERIFIED', flush=True)
    finally:
        connection.close()
        opener.open(urllib.request.Request(base + '/api/kernels/' + kernel, method='DELETE',
                                           headers={'X-XSRFToken': xsrf}), timeout=30).close()


if __name__ == '__main__':
    main()
