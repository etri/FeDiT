"""Availability regressions: reject excess work before creating storage or Pods."""
import unittest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from pydantic import ValidationError
from app.models.notebook_models import NotebookCreateRequest
from app.services import notebook_service as service

NS = "kubeflow-user-example-com"


def notebook(name, gpu=0, stopped=False):
    return {"metadata": {"name": name, "annotations": {"kubeflow-resource-stopped": "true"} if stopped else {}},
            "spec": {"template": {"spec": {"containers": [{"resources": {
                "requests": {"cpu": "100m", "memory": "1Gi"},
                "limits": {"cpu": "1", "memory": "4Gi", "nvidia.com/gpu": str(gpu)}}}]}}}}


class ComputeLimitsTest(unittest.TestCase):
    def setUp(self):
        self.api = MagicMock()
        self.api.list_namespaced_custom_object.return_value = {"items": []}
        p = patch.object(service, "custom_api", self.api)
        p.start()
        self.addCleanup(p.stop)

    def create(self, **kwargs):
        return service.create_notebook(name="new", image="cuda-image", namespace=NS,
                                       workspace_source="none", **kwargs)

    def test_invalid_resources_cannot_create_storage_or_notebooks(self):
        with patch.object(service, "_ensure_pvc") as pvc:
            for values in [dict(cpu_limit="4"), dict(memory_limit="8Gi"), dict(cpu_request="2"),
                           dict(cpu_limit="NaN"), dict(memory_limit="garbage"), dict(cpu_request="0"),
                           dict(gpu_count=-1), dict(gpu_count=2), dict(gpu_count=1, gpu_vendor="other/gpu")]:
                with self.subTest(values=values), self.assertRaises(HTTPException) as exc:
                    self.create(**values)
                self.assertEqual(exc.exception.status_code, 422)
            pvc.assert_not_called()
            self.api.create_namespaced_custom_object.assert_not_called()

    def test_one_gpu_job_and_two_active_notebooks(self):
        for active, gpu in [([notebook("gpu", 1)], 1),
                            ([notebook("a"), notebook("b")], 0)]:
            self.api.list_namespaced_custom_object.return_value = {"items": active}
            with self.assertRaises(HTTPException) as exc:
                self.create(gpu_count=gpu)
            self.assertEqual(exc.exception.status_code, 409)
        self.api.create_namespaced_custom_object.assert_not_called()

    def test_stopped_work_does_not_consume_admission_slots(self):
        self.api.list_namespaced_custom_object.return_value = {"items": [notebook("old", 1, True)]}
        self.create(gpu_count=1)
        self.api.create_namespaced_custom_object.assert_called_once()

    def test_cpu_image_cannot_override_gpu_isolation(self):
        self.create(env_vars=[{"name": "NVIDIA_VISIBLE_DEVICES", "value": "all"}])
        body = self.api.create_namespaced_custom_object.call_args.args[-1]
        spec = body["spec"]["template"]["spec"]
        self.assertEqual(spec["priorityClassName"], "prediction-manager-compute")
        visible = [e["value"] for e in spec["containers"][0]["env"] if e["name"] == "NVIDIA_VISIBLE_DEVICES"]
        self.assertEqual(visible, ["void"])

    def test_start_cannot_bypass_gpu_limit(self):
        self.api.get_namespaced_custom_object.return_value = notebook("resume", 1, True)
        self.api.list_namespaced_custom_object.return_value = {"items": [notebook("other", 1)]}
        with self.assertRaises(HTTPException) as exc:
            service.start_notebook("resume", NS)
        self.assertEqual(exc.exception.status_code, 409)
        self.api.patch_namespaced_custom_object.assert_not_called()

    def test_gpu_request_model_rejects_negative_and_multiple_devices(self):
        for count in [-1, 2]:
            with self.assertRaises(ValidationError):
                NotebookCreateRequest(name="bad", image="cuda-image", gpu_count=count)


if __name__ == "__main__":
    unittest.main()
