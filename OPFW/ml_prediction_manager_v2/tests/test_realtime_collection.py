import unittest
from unittest.mock import MagicMock, patch

import httpx
from pydantic import ValidationError

from app.models.data_collection_models import ConnectorRealtimeRequest
from app.services import data_collection_service


class RealtimeCollectionTest(unittest.TestCase):
    def test_realtime_request_accepts_selected_attributes_and_interval(self):
        request = ConnectorRealtimeRequest(
            selected_attributes=["temperature", "pressure"],
            interval_seconds=2,
        )
        self.assertEqual(request.selected_attributes, ["temperature", "pressure"])
        self.assertEqual(request.interval_seconds, 2)

    def test_realtime_request_rejects_interval_below_one_second(self):
        with self.assertRaises(ValidationError):
            ConnectorRealtimeRequest(
                selected_attributes=["temperature"],
                interval_seconds=0.5,
            )

    def test_payload_filter_keeps_only_selected_attributes(self):
        payload, selected = data_collection_service._filter_payload_by_attributes(
            {"temperature": 23.4, "pressure": 101.2, "status": "normal"},
            ["temperature", "status"],
        )
        self.assertEqual(payload, {"temperature": 23.4, "status": "normal"})
        self.assertEqual(selected, ["temperature", "status"])

    def test_attribute_normalization_removes_duplicates_and_connector_items(self):
        selected = data_collection_service._normalize_selected_attributes(
            ["temperature", "temperature", "connector:rest-1", "", " pressure "]
        )
        self.assertEqual(selected, ["temperature", "pressure"])

    def test_rest_preview_attributes_use_actual_payload_fields(self):
        attributes = data_collection_service._rest_preview_attributes(
            {
                "id": "urn:ngsi-ld:Sensor:1",
                "type": "Sensor",
                "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
                "temperature": {
                    "type": "Property",
                    "value": 23.4,
                    "observedAt": "2026-07-29T01:02:03Z",
                },
                "status": "normal",
            }
        )
        self.assertEqual([item["name"] for item in attributes], ["temperature", "status"])
        self.assertEqual(attributes[0]["type"], "Property")
        self.assertEqual(attributes[0]["sample"], 23.4)
        self.assertEqual(attributes[0]["observed_at"], "2026-07-29T01:02:03Z")
        self.assertEqual(attributes[1]["sample"], "normal")

    def test_rest_preview_attributes_keep_zero_sample(self):
        attributes = data_collection_service._rest_preview_attributes(
            {"battery": {"type": "Property", "value": 0}}
        )
        self.assertEqual(attributes[0]["sample"], 0)

    def test_post_preview_uses_current_connector_id(self):
        response = httpx.Response(
            200,
            json={"temperature": 23.4},
            request=httpx.Request("POST", "https://example.com/api/data"),
        )
        client = MagicMock()
        client.__enter__.return_value = client
        client.request.return_value = response

        connector = {
            "id": "connector-rest-1",
            "connector_type": "rest",
            "twin_id": "twin-1",
            "endpoint_url": "https://example.com",
            "port": None,
            "topic": "/api/data",
            "method": "POST",
        }
        with patch.object(data_collection_service.httpx, "Client", return_value=client):
            _, payload, url, method = data_collection_service._request_rest_connector(connector)

        self.assertEqual(payload, {"temperature": 23.4})
        self.assertEqual(url, "https://example.com/api/data")
        self.assertEqual(method, "POST")
        client.request.assert_called_once_with(
            "POST",
            "https://example.com/api/data",
            headers={
                "Accept": "application/json",
                "User-Agent": "prediction-manager-data-collector/1.0",
            },
            json={"source": "prediction-manager", "connector_id": "connector-rest-1"},
        )


if __name__ == "__main__":
    unittest.main()
