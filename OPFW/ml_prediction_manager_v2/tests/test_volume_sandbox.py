import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from kubernetes import client
from kubernetes.client.rest import ApiException
from pydantic import ValidationError

from app import auth
from app.models.notebook_models import NotebookCreateRequest, VolumeSpec
from app.routers import volumes
from app.services import notebook_service, volume_service

A = 'kubeflow-alice-example-com'
B = 'kubeflow-bob-example-com'
NAME = 'pm-user-training'


def pvc(name=NAME, namespace=A, labels=None, storage_class=None, mode='Filesystem'):
    if labels is None:
        labels = {volume_service.MANAGER: 'prediction-manager',
                  volume_service.PURPOSE: 'user-volume', volume_service.OWNER: namespace}
    return client.V1PersistentVolumeClaim(
        metadata=client.V1ObjectMeta(name=name, namespace=namespace, labels=labels, uid='uid-1', resource_version='7'),
        spec=client.V1PersistentVolumeClaimSpec(
            storage_class_name=storage_class or volume_service.STORAGE_CLASS,
            volume_mode=mode, access_modes=['ReadWriteOnce'],
            resources=client.V1VolumeResourceRequirements(requests={'storage': '10Gi'})),
        status=client.V1PersistentVolumeClaimStatus(phase='Bound'))


class VolumeSandboxTest(unittest.TestCase):
    def setUp(self):
        self.core = MagicMock()
        self.apps = MagicMock()
        self.batch = MagicMock()
        self.custom = MagicMock()
        for obj, method in [(self.core, 'list_namespaced_pod'),
                            (self.apps, 'list_namespaced_deployment'),
                            (self.apps, 'list_namespaced_stateful_set'),
                            (self.apps, 'list_namespaced_daemon_set'),
                            (self.batch, 'list_namespaced_job'),
                            (self.batch, 'list_namespaced_cron_job')]:
            getattr(obj, method).return_value = SimpleNamespace(items=[])
        self.custom.list_namespaced_custom_object.return_value = {'items': []}
        self.core.read_namespaced_persistent_volume_claim.return_value = pvc()
        self.core.list_namespaced_persistent_volume_claim.return_value = SimpleNamespace(items=[pvc()])
        for module, attr, value in [(volume_service, 'core_v1', self.core), (volume_service, 'apps_v1', self.apps),
                                    (volume_service, 'batch_v1', self.batch), (volume_service, 'custom_api', self.custom),
                                    (notebook_service, 'core_v1', self.core), (notebook_service, 'custom_api', MagicMock())]:
            p = patch.object(module, attr, value)
            p.start(); self.addCleanup(p.stop)
        for p in [patch.object(auth, '_get_owner_namespace', return_value=A),
                  patch.object(auth.kubernetes_client, 'KUBERNETES_AVAILABLE', True),
                  patch.object(auth, 'get_all_kubeflow_namespaces', return_value=[A, B])]:
            p.start(); self.addCleanup(p.stop)
        app = FastAPI()
        app.include_router(volumes.router, prefix='/api/volumes')
        app.include_router(volumes.router, prefix='/volumes/api')
        self.web = TestClient(app)
        self.headers = {'kubeflow-userid': 'admin@example.com'}

    def test_list_hides_service_legacy_cross_tenant_and_block_volumes(self):
        self.core.list_namespaced_persistent_volume_claim.return_value = SimpleNamespace(items=[
            pvc(), pvc('pm-mlflow-data', labels={}), pvc('legacy-workspace', labels={}),
            pvc(namespace=B), pvc('pm-user-block', mode='Block'),
            pvc('pm-user-external', storage_class='arbitrary-host-storage'),
        ])
        result = self.web.get('/api/volumes', headers=self.headers)
        self.assertEqual(result.status_code, 200)
        self.assertEqual([item['name'] for item in result.json()['volumes']], [NAME])
        self.core.list_namespaced_persistent_volume_claim.assert_called_once_with(A)

    def test_unauthenticated_request_is_rejected(self):
        self.assertEqual(self.web.get('/api/volumes').status_code, 401)
        self.core.list_namespaced_persistent_volume_claim.assert_not_called()

    def test_admin_cannot_request_platform_namespace(self):
        response = self.web.get('/api/volumes?ns=kubeflow', headers=self.headers)
        self.assertEqual(response.status_code, 403)

    def test_admin_cannot_delete_other_tenant_volume(self):
        response = self.web.delete(f'/api/volumes/{NAME}?ns={B}', headers=self.headers)
        self.assertEqual(response.status_code, 403)
        self.core.delete_namespaced_persistent_volume_claim.assert_not_called()

    def test_create_builds_only_managed_filesystem_claim(self):
        response = self.web.post('/api/volumes', json={'name': 'training', 'size_gib': 10}, headers=self.headers)
        self.assertEqual(response.status_code, 201)
        namespace, body = self.core.create_namespaced_persistent_volume_claim.call_args.args
        self.assertEqual(namespace, A)
        self.assertEqual(body.metadata.name, NAME)
        self.assertTrue(volume_service.owned(body, A))
        self.assertIsNone(body.spec.volume_name)
        self.assertIsNone(body.spec.data_source)

    def test_create_rejects_host_path_static_pv_selector_and_namespace_override(self):
        for key, value in [('host_path', '/'), ('volume_name', 'platform-pv'),
                           ('selector', {}), ('namespace', B), ('storage_class', 'host-storage')]:
            with self.subTest(field=key):
                response = self.web.post('/api/volumes', json={'name': 'training', key: value}, headers=self.headers)
                self.assertEqual(response.status_code, 422)
        self.core.create_namespaced_persistent_volume_claim.assert_not_called()

    def test_create_rejects_path_names_and_invalid_sizes(self):
        for payload in [{'name': '../data'}, {'name': '/etc'}, {'name': 'data', 'size_gib': 0},
                        {'name': 'data', 'size_gib': 1025}, {'name': 'data', 'size_gib': 1.5}]:
            self.assertEqual(self.web.post('/api/volumes', json=payload, headers=self.headers).status_code, 422)
        self.core.create_namespaced_persistent_volume_claim.assert_not_called()

    def test_name_collision_is_not_silently_adopted(self):
        self.core.create_namespaced_persistent_volume_claim.side_effect = ApiException(status=409)
        with self.assertRaises(HTTPException) as error:
            volume_service.create_volume(A, 'training', '10Gi')
        self.assertEqual(error.exception.status_code, 409)
        self.core.patch_namespaced_persistent_volume_claim.assert_not_called()

    def test_quota_rejection_is_reported_as_a_resource_conflict(self):
        error = ApiException(status=403)
        error.body = '{"message":"exceeded quota: user-quota"}'
        self.core.create_namespaced_persistent_volume_claim.side_effect = error
        response = self.web.post('/api/volumes', json={'name': 'training'}, headers=self.headers)
        self.assertEqual(response.status_code, 409)
        self.assertIn('할당량', response.json()['detail'])

    def test_resource_version_conflict_is_not_reported_as_success(self):
        self.core.delete_namespaced_persistent_volume_claim.side_effect = ApiException(status=409)
        response = self.web.delete(f'/api/volumes/{NAME}', headers=self.headers)
        self.assertEqual(response.status_code, 409)
        self.core.patch_namespaced_persistent_volume_claim.assert_not_called()

    def test_delete_rejects_unclassified_claim(self):
        self.core.read_namespaced_persistent_volume_claim.return_value = pvc(labels={})
        response = self.web.delete(f'/api/volumes/{NAME}', headers=self.headers)
        self.assertEqual(response.status_code, 404)
        self.core.delete_namespaced_persistent_volume_claim.assert_not_called()

    def test_delete_live_pod_reference_is_blocked(self):
        self.core.list_namespaced_pod.return_value = SimpleNamespace(items=[client.V1Pod(
            metadata=client.V1ObjectMeta(name='running'), status=client.V1PodStatus(phase='Running'),
            spec=client.V1PodSpec(containers=[client.V1Container(name='main')], volumes=[client.V1Volume(
                name='data', persistent_volume_claim=client.V1PersistentVolumeClaimVolumeSource(claim_name=NAME))]))])
        self.assertEqual(self.web.delete(f'/api/volumes/{NAME}', headers=self.headers).status_code, 409)
        self.core.delete_namespaced_persistent_volume_claim.assert_not_called()

    def test_delete_scaled_down_controller_reference_is_blocked(self):
        item = MagicMock()
        item.metadata.name = 'scaled-down'
        item.to_dict.return_value = {'spec': {'replicas': 0, 'template': {'spec': {
            'volumes': [{'persistent_volume_claim': {'claim_name': NAME}}]}}}}
        self.apps.list_namespaced_deployment.return_value = SimpleNamespace(items=[item])
        self.assertEqual(self.web.delete(f'/api/volumes/{NAME}', headers=self.headers).status_code, 409)

    def test_delete_stopped_notebook_and_ray_reference_are_blocked(self):
        for plural in ['notebooks', 'rayclusters']:
            def objects(group, version, namespace, requested):
                return {'items': [{'metadata': {'name': 'reserved'}, 'spec': {'template': {'spec': {
                    'volumes': [{'persistentVolumeClaim': {'claimName': NAME}}]}}}}] if requested == plural else []}
            self.custom.list_namespaced_custom_object.side_effect = objects
            with self.subTest(controller=plural):
                self.assertEqual(self.web.delete(f'/api/volumes/{NAME}', headers=self.headers).status_code, 409)
        self.core.delete_namespaced_persistent_volume_claim.assert_not_called()

    def test_reference_lookup_failure_does_not_delete(self):
        self.batch.list_namespaced_cron_job.side_effect = ApiException(status=403)
        self.assertEqual(self.web.delete(f'/api/volumes/{NAME}', headers=self.headers).status_code, 503)
        self.core.delete_namespaced_persistent_volume_claim.assert_not_called()

    def test_delete_uses_uid_and_resource_version_without_forcing_finalizers(self):
        response = self.web.delete(f'/api/volumes/{NAME}', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        args, kwargs = self.core.delete_namespaced_persistent_volume_claim.call_args
        self.assertEqual(args, (NAME, A))
        options = kwargs['body']
        self.assertEqual(options.preconditions.uid, 'uid-1')
        self.assertEqual(options.preconditions.resource_version, '7')
        self.assertIsNone(options.grace_period_seconds)
        self.core.patch_namespaced_persistent_volume_claim.assert_not_called()

    def test_notebook_cannot_mount_tenant_mlflow_or_legacy_claim(self):
        with self.assertRaises(HTTPException):
            notebook_service.create_notebook('lab', 'python:3.12', namespace=A,
                                             workspace_source='existing', workspace_name='pm-mlflow-data')
        notebook_service.custom_api.create_namespaced_custom_object.assert_not_called()
        self.core.create_namespaced_persistent_volume_claim.assert_not_called()

    def test_notebook_cannot_mount_another_tenant_claim(self):
        self.core.read_namespaced_persistent_volume_claim.return_value = pvc(namespace=B)
        with self.assertRaises(HTTPException):
            notebook_service.create_notebook('lab', 'python:3.12', namespace=A,
                                             workspace_source='existing', workspace_name=NAME)
        notebook_service.custom_api.create_namespaced_custom_object.assert_not_called()

    def test_valid_notebook_mount_uses_exact_authorized_claim(self):
        notebook_service.create_notebook('lab', 'python:3.12', namespace=A,
                                         workspace_source='existing', workspace_name=NAME)
        body = notebook_service.custom_api.create_namespaced_custom_object.call_args.args[-1]
        self.assertEqual(body['spec']['template']['spec']['volumes'][0]['persistentVolumeClaim']['claimName'], NAME)

    def test_new_notebook_claim_has_sandbox_prefix_and_labels(self):
        notebook_service.create_notebook('lab', 'python:3.12', namespace=A)
        namespace, body = self.core.create_namespaced_persistent_volume_claim.call_args.args
        self.assertEqual(namespace, A)
        self.assertEqual(body.metadata.name, 'pm-user-lab-workspace')
        self.assertEqual(body.metadata.labels[volume_service.PURPOSE], 'user-volume')

    def test_notebook_volume_payload_rejects_host_path_and_unsafe_mounts(self):
        for path in ['/', '/etc', '/var/run', '/proc', '/home/jovyan/../../etc']:
            with self.subTest(path=path), self.assertRaises(ValidationError):
                NotebookCreateRequest(name='lab', image='python', workspace_mount_path=path)
        with self.assertRaises(ValidationError):
            VolumeSpec(mount_path='/home/jovyan/data', host_path='/')

    def test_alias_used_by_public_page_has_same_policy(self):
        self.assertEqual(self.web.get('/volumes/api?ns=kubeflow', headers=self.headers).status_code, 403)
        self.assertEqual(self.web.get('/volumes/api', headers=self.headers).status_code, 200)

    def test_poddefault_cannot_inject_service_claim_or_host_path(self):
        for volume in [{'name': 'service', 'persistentVolumeClaim': {'claimName': 'pm-mlflow-data'}},
                       {'name': 'host', 'hostPath': {'path': '/'}}]:
            notebook_service.custom_api.get_namespaced_custom_object.return_value = {'spec': {'volumes': [volume]}}
            with self.subTest(volume=volume), self.assertRaises(HTTPException):
                notebook_service.create_notebook('lab', 'python:3.12', namespace=A, workspace_source='none', pod_defaults=['unsafe'])
        notebook_service.custom_api.create_namespaced_custom_object.assert_not_called()
        self.core.create_namespaced_persistent_volume_claim.assert_not_called()

    def test_poddefault_cannot_mount_user_claim_over_system_directory(self):
        notebook_service.custom_api.get_namespaced_custom_object.return_value = {'spec': {
            'volumes': [{'name': 'data', 'persistentVolumeClaim': {'claimName': NAME}}],
            'volumeMounts': [{'name': 'data', 'mountPath': '/etc'}]}}
        with self.assertRaises(HTTPException):
            notebook_service.create_notebook('lab', 'python:3.12', namespace=A, workspace_source='none', pod_defaults=['unsafe'])
        notebook_service.custom_api.create_namespaced_custom_object.assert_not_called()


if __name__ == '__main__':
    unittest.main()
