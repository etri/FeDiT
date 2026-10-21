import copy
import importlib.util
from pathlib import Path
import unittest
from urllib.error import HTTPError
from unittest.mock import MagicMock, patch

from app.services import notebook_service

NS = 'kubeflow-user-example-com'
SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/server-a40/notebook-gateway.py'
spec = importlib.util.spec_from_file_location('notebook_gateway', SCRIPT)
gateway = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gateway)


def notebook(name='lab'):
    return {'metadata': {'name': name, 'namespace': NS, 'uid': 'notebook-uid',
                         'labels': {'app.kubernetes.io/managed-by': 'prediction-manager'},
                         'annotations': {'notebooks.kubeflow.org/server-type': 'jupyter',
                                         'prediction-manager.io/container-port': '8888'}},
            'spec': {'template': {'spec': {'containers': [{'image': 'user/lab:v1',
                                                          'resources': {},
                                                          'ports': [{'containerPort': 8888}]}]}}},
            'status': {'readyReplicas': 1}}


def pod(name='lab'):
    return {'metadata': {'name': name + '-0', 'namespace': NS, 'uid': 'pod-uid',
                         'ownerReferences': [{'kind': 'StatefulSet', 'name': name}]},
            'status': {'phase': 'Running', 'conditions': [{'type': 'Ready', 'status': 'True'}]}}


class NotebookGatewayTest(unittest.TestCase):
    def test_ready_pod_is_not_published_until_jupyter_serves_its_prefix(self):
        target = {'prefix': f'/notebook/{NS}/lab/'}
        with patch.object(gateway.urllib.request, 'build_opener') as build:
            build.return_value.open.side_effect = HTTPError('http://localhost', 404, 'Not ready', {}, None)
            self.assertFalse(gateway.serving(target, 45001))
            build.return_value.open.side_effect = None
            build.return_value.open.return_value.__enter__.return_value.status = 200
            self.assertTrue(gateway.serving(target, 45001))

    def test_open_link_uses_public_jupyter_origin_without_changing_other_apps(self):
        nb = notebook()
        api = MagicMock()
        api.list_namespaced_custom_object.return_value = {'items': [nb]}
        with patch.object(notebook_service, 'custom_api', api), \
             patch.object(notebook_service.settings, 'notebook_public_url', 'https://server:8080/'), \
             patch.object(notebook_service.settings, 'kubeflow_url', 'https://cluster'):
            self.assertEqual(notebook_service.list_notebooks(NS)[0]['url'],
                             f'https://server:8080/notebook/{NS}/lab/lab')
            nb['metadata']['annotations']['notebooks.kubeflow.org/server-type'] = 'vscode'
            self.assertTrue(notebook_service.list_notebooks(NS)[0]['url'].startswith('https://cluster/'))

    def test_creation_marks_managed_pods_and_keeps_assets_under_the_notebook_path(self):
        with patch.object(notebook_service, 'custom_api') as api, \
             patch.object(notebook_service.settings, 'notebook_proxy_cpu_request', '10m'):
            notebook_service.create_notebook('lab', 'user/lab:v1', namespace=NS,
                                             workspace_source='none',
                                             env_vars=[{'name': 'NB_PREFIX', 'value': '/wrong'},
                                                       {'name': 'EXAMPLE', 'value': 'kept'}])
            body = api.create_namespaced_custom_object.call_args.args[-1]
        self.assertEqual(body['metadata']['labels']['app.kubernetes.io/managed-by'], 'prediction-manager')
        self.assertNotIn('metadata', body['spec']['template'])
        self.assertEqual(body['metadata']['annotations']['sidecar.istio.io/proxyCPU'], '10m')
        self.assertEqual(body['metadata']['annotations']['sidecar.istio.io/proxyMemory'], '128Mi')
        self.assertEqual(body['metadata']['annotations']['sidecar.istio.io/proxyCPULimit'], '2000m')
        self.assertEqual(body['metadata']['annotations']['sidecar.istio.io/proxyMemoryLimit'], '1024Mi')
        env = body['spec']['template']['spec']['containers'][0]['env']
        self.assertEqual([x['value'] for x in env if x['name'] == 'NB_PREFIX'], [f'/notebook/{NS}/lab'])
        self.assertIn({'name': 'EXAMPLE', 'value': 'kept'}, env)

    def test_only_ready_managed_jupyter_tenant_pods_are_routable(self):
        good = notebook()
        for change in ['unmanaged', 'system', 'unsafe', 'stopped', 'deleting', 'other-app']:
            nb = copy.deepcopy(good)
            if change == 'unmanaged': nb['metadata']['labels'] = {}
            if change == 'system': nb['metadata']['namespace'] = 'kubeflow-system'
            if change == 'unsafe': nb['metadata']['name'] = 'lab;include /etc/passwd'
            if change == 'stopped': nb['metadata']['annotations']['kubeflow-resource-stopped'] = 'true'
            if change == 'deleting': nb['metadata']['deletionTimestamp'] = 'now'
            if change == 'other-app': nb['metadata']['annotations']['notebooks.kubeflow.org/server-type'] = 'rstudio'
            targets = gateway.discover([nb], [pod()])
            self.assertFalse(any('pod' in t for t in targets), change)
        self.assertEqual(gateway.discover([good], [pod()])[0]['pod'], 'lab-0')
        unready = pod()
        unready['status']['conditions'][0]['status'] = 'False'
        self.assertNotIn('pod', gateway.discover([good], [unready])[0])
        foreign = pod()
        foreign['metadata']['namespace'] = 'kubeflow-other'
        self.assertNotIn('pod', gateway.discover([good], [foreign])[0])

    def test_multiple_notebooks_keep_separate_paths_and_deleted_routes_disappear(self):
        targets = gateway.discover([notebook()], [pod()])
        second = copy.deepcopy(targets[0])
        second.update(name='other', uid='other-uid', prefix=f'/notebook/{NS}/other/')
        routes, page = gateway.render(targets + [second], {'notebook-uid': 45001, 'other-uid': 45002})
        self.assertIn('127.0.0.1:45001', routes)
        self.assertIn('127.0.0.1:45002', routes)
        self.assertIn(second['prefix'] + 'lab', page)
        routes, _ = gateway.render(targets, {'notebook-uid': 45001})
        self.assertNotIn('45002', routes)
        self.assertIn(f'return 302 /notebook/{NS}/lab/lab', routes)
        routes, page = gateway.render([], {})
        self.assertNotIn('proxy_pass', routes)
        self.assertNotIn('8888', routes)
        self.assertIn('컨테이너를 실행하세요', page)


if __name__ == '__main__':
    unittest.main()
