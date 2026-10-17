"""API regressions for accidental platform/cross-tenant resource management."""
import unittest
import ast
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from starlette.requests import Request

from app import auth
from app.models.image_models import ImageBuildRequest
from app.resource_policy import image_owner, require_tenant_namespace
from app.routers import images
from app.services import docker_service, notebook_service, registry_service
from app.services import tenant_dashboard_service

A = 'kubeflow-alice-example-com'
B = 'kubeflow-bob-example-com'


def request(namespace='', admin=True):
    return Request({'type': 'http', 'method': 'GET', 'path': '/',
                    'query_string': f'ns={namespace}'.encode() if namespace else b'',
                    'headers': [(b'kubeflow-userid', b'admin@example.com' if admin else b'alice@example.com')]})


def source_function(relative, name, scope):
    """Load the real boundary function without importing optional ML runtimes."""
    path = Path(__file__).parents[1] / 'app' / relative
    tree = ast.parse(path.read_text(encoding='utf-8'))
    node = next(item for item in tree.body if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)) and item.name == name)
    node.decorator_list = []
    module = ast.Module(body=[ast.ImportFrom(module='__future__', names=[ast.alias(name='annotations')], level=0), node], type_ignores=[])
    exec(compile(ast.fix_missing_locations(module), str(path), 'exec'), scope)
    return scope[name]


class ImageIsolationTest(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(images.router, prefix='/api/images')
        self.client = TestClient(app)
        self.headers = {'kubeflow-userid': 'admin@example.com'}
        connected = patch.object(auth.kubernetes_client, 'KUBERNETES_AVAILABLE', True)
        connected.start()
        self.addCleanup(connected.stop)
        self.catalogue = patch.object(registry_service, '_catalogue', AsyncMock(return_value={
            'prediction-manager-app': ['latest'], 'minio-pinned': ['latest'],
            'some-unclassified-platform-image': ['v1'],
            f'{A}/lab': ['v1'], f'{B}/lab': ['v1'],
        }))
        self.catalogue.start()
        self.addCleanup(self.catalogue.stop)
        owner = patch.object(auth, '_get_owner_namespace', return_value=A)
        owner.start()
        self.addCleanup(owner.stop)
        profiles = patch.object(auth, 'get_all_kubeflow_namespaces', return_value=[A, B])
        profiles.start()
        self.addCleanup(profiles.stop)

    def test_admin_list_contains_only_active_tenant(self):
        response = self.client.get('/api/images', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['name'] for item in response.json()], [f'{A}/lab'])
        self.assertTrue(response.json()[0]['can_delete'])

    def test_admin_selected_tenant_is_readable_but_not_deletable(self):
        response = self.client.get('/api/images', params={'ns': B}, headers=self.headers)
        self.assertEqual([item['name'] for item in response.json()], [f'{B}/lab'])
        self.assertFalse(response.json()[0]['can_delete'])

    def test_direct_delete_cannot_bypass_protection_even_with_force(self):
        with patch.object(registry_service, 'delete_image', AsyncMock()) as delete:
            for name in ['prediction-manager-app', 'minio-pinned',
                         'some-unclassified-platform-image', f'{B}/lab', f'{A}/../lab']:
                with self.subTest(name=name):
                    response = self.client.delete(f'/api/images/{name}',
                                                  params={'force': 'true'}, headers=self.headers)
                    self.assertIn(response.status_code, [403, 404])
            delete.assert_not_called()

    def test_owned_delete_does_not_restart_platform_jupyter(self):
        with patch.object(registry_service, 'delete_image', AsyncMock(return_value=True)) as delete, \
                patch.object(docker_service, 'unregister_image_from_kubeflow') as unregister:
            response = self.client.delete(f'/api/images/{A}/lab', params={'tag': 'v1'}, headers=self.headers)
            self.assertEqual(response.status_code, 200)
            delete.assert_awaited_once_with(f'{A}/lab', 'v1')
            unregister.assert_not_called()

    def test_platform_tag_lookup_is_denied(self):
        for name in ['minio-pinned', f'{B}/lab']:
            response = self.client.get(f'/api/images/{name}/tags', headers=self.headers)
            self.assertEqual(response.status_code, 403)

    def test_system_namespace_override_denied(self):
        response = self.client.get('/api/images', params={'ns': 'kubeflow'}, headers=self.headers)
        self.assertEqual(response.status_code, 403)

    def test_build_cannot_supply_repository_prefix_or_path(self):
        with patch.object(docker_service, 'build_and_push', AsyncMock()) as build:
            for name in ['../prediction-manager-app', 'other/lab', 'name:tag']:
                response = self.client.post('/api/images/build', json={'image_name': name}, headers=self.headers)
                self.assertEqual(response.status_code, 422)
            build.assert_not_called()

    def test_build_log_is_owner_only(self):
        with patch.object(docker_service, 'get_build_status', return_value={
            'owner_namespace': B, 'logs': ['private'], 'status': 'success', 'message': '',
        }):
            response = self.client.get('/api/images/build-log/other-build', headers=self.headers)
            self.assertEqual(response.status_code, 404)
            self.assertNotIn('private', response.text)


class ServiceIsolationTest(unittest.IsolatedAsyncioTestCase):
    async def test_model_deployment_body_cannot_target_platform(self):
        scope = {'_check_write_access': lambda *_: A,
                 'require_namespace_access': auth.require_namespace_access,
                 'get_user_namespace': lambda *_: A}
        for name in ['deploy_production', 'rollback_model']:
            function = source_function('routers/models.py', name, scope)
            with self.subTest(endpoint=name), self.assertRaises(HTTPException):
                if name == 'rollback_model':
                    await function('model', request(), SimpleNamespace(target_namespace='kubeflow'))
                else:
                    await function('model', SimpleNamespace(target_namespace='kubeflow'), request())

    async def test_production_service_rejects_platform_before_mlflow_or_kubernetes(self):
        scope = {'require_tenant_namespace': require_tenant_namespace, 'registry': MagicMock(), '_k8s_clients': MagicMock()}
        deploy = source_function('services/production_deploy_service.py', 'deploy_production', scope)
        undeploy = source_function('services/production_deploy_service.py', 'undeploy_production', scope)
        with self.assertRaises(HTTPException):
            await deploy('model', '1', 'kubeflow')
        with self.assertRaises(HTTPException):
            undeploy('model', 'kubeflow')
        self.assertEqual(scope['registry'].mock_calls, [])
        scope['_k8s_clients'].assert_not_called()

    async def test_service_rejects_unknown_images_before_any_registry_or_docker_call(self):
        with patch.object(registry_service.httpx, 'AsyncClient') as http, \
                patch.object(registry_service.docker, 'DockerClient') as docker:
            for name in ['minio-pinned', 'prediction-manager-app', 'postgres', f'{A}/../lab']:
                with self.assertRaises(HTTPException):
                    await registry_service.delete_image(name, 'latest')
            http.assert_not_called()
            docker.assert_not_called()

    async def test_dashboard_catalogue_hides_all_non_user_images(self):
        with patch.object(registry_service, '_catalogue', AsyncMock(return_value={
            'prediction-manager-app': ['latest'], 'unknown': ['latest'], f'{A}/lab': ['v1'],
        })):
            result = await registry_service.list_all_repositories()
            self.assertEqual([item['name'] for item in result], [f'{A}/lab'])

    async def test_build_rejects_platform_repository(self):
        with self.assertRaises(ValueError):
            await docker_service.build_and_push(ImageBuildRequest(image_name='prediction-manager-app'))

    async def test_delete_fallback_does_not_prune_parent_images(self):
        import httpx
        with patch.object(registry_service.httpx, 'AsyncClient', side_effect=httpx.ConnectError('private registry')), \
                patch.object(registry_service.docker, 'DockerClient') as docker:
            self.assertTrue(await registry_service.delete_image(f'{A}/lab', 'v1'))
            self.assertTrue(docker.return_value.images.remove.call_args.kwargs['noprune'])

    async def test_notebook_image_fallback_is_tenant_scoped(self):
        import httpx
        with patch('httpx.Client', side_effect=httpx.ConnectError('private registry')), \
                patch.object(registry_service, '_local_docker_catalogue', return_value={
                    'minio-pinned': ['v1'], f'{A}/lab': ['v1'], f'{B}/lab': ['v1'],
                }):
            choices = notebook_service._shared_user_images(A)
            self.assertEqual(choices, [f'{registry_service.settings.registry_host}/{A}/lab:v1'])

    async def test_build_does_not_mutate_shared_jupyter_configuration(self):
        req = ImageBuildRequest(image_name='lab')
        req.image_name = f'{A}/lab'
        build_id = 'scope-regression'
        docker_service.build_logs[build_id] = {'logs': [], 'status': 'building', 'message': ''}
        self.addCleanup(docker_service.build_logs.pop, build_id)
        with patch.object(docker_service.docker, 'APIClient') as docker, \
                patch.object(docker_service, '_register_image_to_kubeflow') as register:
            docker.return_value.build.return_value = []
            docker.return_value.push.return_value = []
            docker_service._do_build(build_id, req)
            self.assertEqual(docker_service.build_logs[build_id]['status'], 'success')
            register.assert_not_called()


class NamespaceAndVolumeTest(unittest.TestCase):
    def test_standalone_namespace_override_cannot_escape_configured_scope(self):
        with patch.object(auth.kubernetes_client, 'KUBERNETES_AVAILABLE', False), \
                patch.object(auth, '_get_owner_namespace', return_value=A):
            self.assertEqual(auth.get_user_namespace(request(A)), A)
            with self.assertRaises(HTTPException):
                auth.get_user_namespace(request(B))

    def test_model_owner_and_namespace_guards_are_fail_closed_for_admin(self):
        scope = {'HTTPException': HTTPException, 'is_admin': lambda _: True,
                 'require_namespace_access': auth.require_namespace_access,
                 'require_tenant_namespace': require_tenant_namespace, 'registry': MagicMock()}
        source_function('routers/models.py', '_requested_model_namespace', scope)
        write = source_function('routers/models.py', '_check_write_access', scope)
        for owner in [None, 'kubeflow', 'monitoring']:
            scope['registry'].get_model_owner_namespace.return_value = owner
            with self.subTest(owner=owner), self.assertRaises(HTTPException):
                write('model', request())

    def test_platform_namespaces_rejected_including_admin_override(self):
        for namespace in ['kubeflow', 'kube-system', 'keycloak', 'monitoring',
                          'istio-system', 'default', 'kubeflow-system', '../kubeflow']:
            with self.subTest(namespace=namespace), self.assertRaises(HTTPException):
                auth.get_user_namespace(request(namespace))

    def test_admin_cannot_select_an_unregistered_tenant(self):
        with patch.object(auth, 'get_all_kubeflow_namespaces', return_value=[A]):
            with self.assertRaises(HTTPException):
                auth.get_user_namespace(request(B))

    def test_non_admin_cannot_override_to_other_tenant(self):
        with patch.object(auth, 'get_user_accessible_namespaces', return_value=[{'namespace': A}]):
            with self.assertRaises(HTTPException):
                auth.get_user_namespace(request(B, admin=False))

    def test_view_only_contributor_cannot_modify_selected_namespace(self):
        req = request(B, admin=False)
        req.scope['method'] = 'DELETE'
        with patch.object(auth.kubernetes_client, 'KUBERNETES_AVAILABLE', True), \
                patch.object(auth, 'get_user_accessible_namespaces', return_value=[{'namespace': B, 'role': 'view'}]):
            with self.assertRaises(HTTPException):
                auth.get_user_namespace(req)

    def test_new_workspace_records_ownership(self):
        with patch.object(notebook_service, 'core_v1') as core:
            notebook_service._ensure_pvc(A, 'lab-workspace', '1Gi', '', 'ReadWriteOnce', notebook_name='lab')
            pvc = core.create_namespaced_persistent_volume_claim.call_args.args[1]
            self.assertEqual(pvc.metadata.labels['prediction-manager.io/notebook'], 'lab')

    def test_tenant_cleanup_and_provision_cannot_touch_platform(self):
        with patch.object(tenant_dashboard_service, 'custom_api') as custom:
            with self.assertRaises(HTTPException):
                tenant_dashboard_service.delete_tenant_resources('kubeflow')
            with self.assertRaises(HTTPException):
                tenant_dashboard_service.ensure_tenant_resources('kubeflow', 'admin@example.com')
            self.assertEqual(custom.mock_calls, [])

    def test_system_profile_is_not_a_manageable_user_namespace(self):
        with patch.object(auth, 'custom_api') as custom:
            custom.list_cluster_custom_object.return_value = {'items': [
                {'metadata': {'name': 'kubeflow'}}, {'metadata': {'name': A}},
            ]}
            self.assertEqual(auth.get_all_kubeflow_namespaces(), [A])

    def test_image_repository_validation(self):
        for value in ['kubeflow-system/lab', f'{A}/a/b', f'{A}/../a', f'{A}/a?x', f'{A}/a:latest']:
            self.assertIsNone(image_owner(value))
        self.assertEqual(image_owner(f'{A}/my-lab'), A)
        self.assertEqual(require_tenant_namespace(A), A)

    def test_notebook_system_namespace_mutation_fails_before_kubernetes(self):
        with patch.object(notebook_service, 'custom_api') as custom:
            for operation in [notebook_service.delete_notebook, notebook_service.stop_notebook, notebook_service.start_notebook]:
                with self.assertRaises(HTTPException):
                    operation('essential', namespace='kubeflow')
            custom.assert_not_called()
            self.assertEqual(custom.mock_calls, [])

    def test_notebook_delete_preserves_unowned_or_legacy_workspace(self):
        for labels in [{}, {'prediction-manager.io/notebook': 'other'}]:
            with patch.object(notebook_service, 'custom_api'), patch.object(notebook_service, 'core_v1') as core:
                core.read_namespaced_persistent_volume_claim.return_value = SimpleNamespace(metadata=SimpleNamespace(labels=labels))
                notebook_service.delete_notebook('lab', namespace=A)
                core.delete_namespaced_persistent_volume_claim.assert_not_called()

    def test_notebook_delete_preserves_even_its_owned_workspace(self):
        with patch.object(notebook_service, 'custom_api'), patch.object(notebook_service, 'core_v1') as core:
            core.read_namespaced_persistent_volume_claim.return_value = SimpleNamespace(metadata=SimpleNamespace(labels={
                'app.kubernetes.io/managed-by': 'prediction-manager', 'prediction-manager.io/notebook': 'lab',
            }))
            notebook_service.delete_notebook('lab', namespace=A)
            core.delete_namespaced_persistent_volume_claim.assert_not_called()


if __name__ == '__main__':
    unittest.main()
