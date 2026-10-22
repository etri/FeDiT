import unittest

from pydantic import ValidationError

from app.models.notebook_models import NotebookCreateRequest
from app.services import notebook_service


class _FakeCustomObjectsApi:
    def __init__(self):
        self.body = None

    def list_namespaced_custom_object(self, *_):
        return {"items": []}

    def create_namespaced_custom_object(self, _group, _version, _namespace, _plural, body):
        self.body = body
        return body


class ContainerPortTest(unittest.TestCase):
    def test_request_accepts_configurable_port(self):
        request = NotebookCreateRequest(
            name="port-test",
            image="registry.example.local/lab:v1",
            container_port=18080,
        )
        self.assertEqual(request.container_port, 18080)

    def test_request_rejects_out_of_range_port(self):
        for port in (0, 65536):
            with self.subTest(port=port), self.assertRaises(ValidationError):
                NotebookCreateRequest(
                    name="port-test",
                    image="registry.example.local/lab:v1",
                    container_port=port,
                )

    def test_notebook_spec_uses_requested_port(self):
        fake_custom_api = _FakeCustomObjectsApi()
        original_custom_api = notebook_service.custom_api
        notebook_service.custom_api = fake_custom_api
        self.addCleanup(setattr, notebook_service, "custom_api", original_custom_api)

        notebook_service.create_notebook(
            name="port-test",
            image="registry.example.local/lab:v1",
            workspace_source="none",
            enable_shared_memory=False,
            container_port=18080,
            namespace="kubeflow-admin",
        )

        metadata = fake_custom_api.body["metadata"]
        container = fake_custom_api.body["spec"]["template"]["spec"]["containers"][0]
        self.assertEqual(
            metadata["annotations"]["prediction-manager.io/container-port"],
            "18080",
        )
        self.assertEqual(container["ports"][0]["containerPort"], 18080)


if __name__ == "__main__":
    unittest.main()
