from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

from app.models.data_collection_models import NifiFlowApplyRequest, NifiFlowSyncRequest
from app.services import data_collection_service


def _connector(connector_id: str, name: str = "REST source") -> dict:
    return {
        "id": connector_id,
        "name": name,
        "connector_type": "rest",
        "twin_id": "twin-1",
        "twin_name": "Twin 1",
        "endpoint_url": "http://source.example",
        "port": 8080,
        "topic": "/data",
        "method": "GET",
        "yaml_config": "",
        "status": "ready",
        "metadata": {},
    }


class NifiPerConnectorSpecTest(TestCase):
    def test_requires_exactly_one_connector(self):
        with self.assertRaisesRegex(ValueError, "대상 커넥터"):
            data_collection_service._nifi_request_connector_id(NifiFlowSyncRequest())

        with self.assertRaisesRegex(ValueError, "커넥터별로 하나씩"):
            data_collection_service._nifi_request_connector_id(
                NifiFlowSyncRequest(connector_ids=["connector-1", "connector-2"])
            )

    @patch.object(data_collection_service.tenant_resources, "nifi_status")
    @patch.object(data_collection_service, "list_twins")
    @patch.object(data_collection_service, "get_connector")
    def test_generates_one_connector_process_group(
        self,
        get_connector,
        list_twins,
        nifi_status,
    ):
        get_connector.return_value = _connector("connector-1")
        list_twins.return_value = [{"id": "twin-1", "name": "Twin 1"}]
        nifi_status.return_value = SimpleNamespace(
            ready=True,
            provisioned=True,
            path="/nifi/twin-1/",
        )

        spec = data_collection_service.generate_nifi_flow_spec(
            "kubeflow-user",
            NifiFlowSyncRequest(connector_id="connector-1"),
        )

        self.assertEqual(spec["connector_id"], "connector-1")
        self.assertEqual(spec["summary"]["connector_count"], 1)
        self.assertEqual(len(spec["connectors"]), 1)
        self.assertEqual(spec["connectors"][0]["connector_id"], "connector-1")
        self.assertEqual(spec["name"], "pm-connector-connector-1")

    @patch.object(data_collection_service, "get_nifi_flow_spec")
    def test_rejects_legacy_integrated_spec_on_apply(self, get_nifi_flow_spec):
        get_nifi_flow_spec.return_value = {
            "id": "legacy-integrated",
            "spec": {
                "connectors": [
                    {"connector_id": "connector-1"},
                    {"connector_id": "connector-2"},
                ]
            },
        }

        with self.assertRaisesRegex(ValueError, "통합 NiFi flow spec"):
            data_collection_service.apply_nifi_flow_spec(
                "kubeflow-user",
                "user@example.com",
                NifiFlowApplyRequest(spec_id="legacy-integrated", dry_run=False),
            )
