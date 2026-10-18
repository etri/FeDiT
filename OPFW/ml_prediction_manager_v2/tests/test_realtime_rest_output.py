import unittest

from pydantic import ValidationError

from app.models.data_collection_models import ConnectorRestOutputRequest
from app.services import data_collection_service


class RealtimeRestOutputTest(unittest.TestCase):
    def test_request_rejects_unsupported_method(self):
        with self.assertRaises(ValidationError):
            ConnectorRestOutputRequest(method="GET")

    def test_transform_selects_flattens_and_renames_fields(self):
        record = {
            "timestamp": "2026-07-28T12:00:00Z",
            "payload": {
                "temperature": {"type": "Property", "value": 23.4},
                "pressure": {"type": "Property", "value": 101.2},
                "ignored": "value",
            },
        }
        result = data_collection_service.transform_record_for_rest(
            record,
            {
                "selected_fields": ["temperature", "pressure"],
                "flatten_ngsi_values": True,
                "include_timestamp": True,
                "field_mapping": {"temperature": "temp_c"},
                "static_fields": {"site": "lab-a"},
                "envelope_key": "data",
            },
        )
        self.assertEqual(
            result,
            {
                "data": {
                    "temp_c": 23.4,
                    "pressure": 101.2,
                    "site": "lab-a",
                    "timestamp": "2026-07-28T12:00:00Z",
                }
            },
        )

    def test_transform_preserves_nested_values_when_flatten_disabled(self):
        value = {"type": "Property", "value": {"x": 1}}
        result = data_collection_service.transform_record_for_rest(
            {"payload": {"position": value}},
            {
                "selected_fields": [],
                "flatten_ngsi_values": False,
                "include_timestamp": False,
                "field_mapping": {},
                "static_fields": {},
                "envelope_key": "",
            },
        )
        self.assertEqual(result, {"position": value})

    def test_header_validation_blocks_transport_headers(self):
        with self.assertRaises(ValueError):
            data_collection_service._clean_rest_output_headers({"Host": "example.com"})


if __name__ == "__main__":
    unittest.main()
