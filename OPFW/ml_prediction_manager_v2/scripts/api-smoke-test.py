"""Exercise the real HTTP backend and PostgreSQL without a Kubernetes cluster."""
import argparse
import json
import time
import uuid
import urllib.error
import urllib.request


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', required=True)
    args = parser.parse_args()
    checks = []

    def request(path, body=None, method=None, expected=200, headers=None, authenticated=True):
        request_headers = {'kubeflow-userid': 'local-validation@example.com'} if authenticated else {}
        if isinstance(body, dict):
            body = json.dumps(body).encode()
            request_headers['Content-Type'] = 'application/json'
        request_headers.update(headers or {})
        req = urllib.request.Request(args.url.rstrip('/') + path, data=body,
                                     headers=request_headers, method=method)
        try:
            response = urllib.request.urlopen(req, timeout=30)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            content = response.read()
            assert response.status == expected, (path, response.status, content[:1000])
            checks.append([path, response.status])
            return json.loads(content) if 'application/json' in response.headers.get('Content-Type', '') else content

    for attempt in range(30):
        try:
            assert request('/healthz')['status'] == 'ok'
            break
        except urllib.error.URLError:
            if attempt == 29:
                raise
            time.sleep(1)
    for path in ['/', '/docs', '/openapi.json', '/api/user-info', '/api/automl/jobs', '/api/automl/queue-config']:
        request(path)
    request('/api/datasets', expected=401, authenticated=False)
    schema = request('/openapi.json')['components']['schemas']['AutoMLJobRequest']['properties']
    for field in ['batch_size', 'max_concurrent_trials', 'gpu_memory_fraction', 'max_epochs']:
        assert field in schema, field
    base = {'name': 'invalid', 'dataset_path': '/missing.csv', 'target_column': 'target', 'models': ['xgb']}
    for invalid in [{'gpu_per_trial': 2}, {'batch_size': 0}, {'max_concurrent_trials': 0},
                    {'gpu_memory_fraction': 1.5}, {'gpu_per_trial': 1, 'models': ['rf']},
                    {'models': []}]:
        request('/api/automl/jobs', {**base, **invalid}, expected=422)
    dataset = request('/api/datasets', {'name': 'validation-' + uuid.uuid4().hex[:8],
                                       'task': 'classification', 'target_column': 'target'})
    dataset_id = dataset['id']
    try:
        request(f'/api/datasets/{dataset_id}/versions', b'x,target\n1,0\n2,1\n3,0\n4,1\n5,0\n6,1\n',
                headers={'Content-Type': 'text/csv', 'x-dataset-filename': 'sample.csv'})
        request(f'/api/datasets/{dataset_id}')
        request(f'/api/datasets/{dataset_id}/versions/1/profile')
        request(f'/api/datasets/{dataset_id}/versions/1/preprocess', {})
        request('/api/datasets/missing-validation-id', expected=404)
    finally:
        request(f'/api/datasets/{dataset_id}', method='DELETE')
    print('API_SMOKE_RESULT=' + json.dumps({'checks': checks}))


if __name__ == '__main__':
    main()
