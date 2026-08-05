import json
import unittest

from app.services import dataset_service


class DatasetPreprocessingTests(unittest.TestCase):
    def test_expands_legacy_collection_payload_json(self):
        columns = ["id", "device_id", "twin_id", "timestamp", "payload_json", "meta_json"]
        rows = [{
            "id": "record-1",
            "device_id": "device-1",
            "twin_id": "twin-1",
            "timestamp": "2026-07-29T00:00:00Z",
            "payload_json": json.dumps({
                "id": "urn:test",
                "type": "Sensor",
                "temperature": {"type": "Property", "value": 25.3},
                "status": {"type": "Property", "value": "normal"},
            }),
            "meta_json": "{}",
        }]

        expanded_columns, expanded_rows, expanded = dataset_service._expand_collection_payload_rows(
            columns,
            rows,
        )

        self.assertTrue(expanded)
        self.assertEqual(
            expanded_columns,
            ["timestamp", "device_id", "twin_id", "temperature", "status"],
        )
        self.assertEqual(expanded_rows[0]["temperature"], "25.3")
        self.assertEqual(expanded_rows[0]["status"], "normal")
        self.assertNotIn("id", expanded_columns)
        self.assertNotIn("payload_json", expanded_columns)

    def test_removes_duplicate_rows(self):
        columns = ["timestamp", "temperature"]
        rows = [
            {"timestamp": "1", "temperature": "20"},
            {"timestamp": "1", "temperature": "20"},
            {"timestamp": "2", "temperature": "21"},
        ]

        unique_rows, removed = dataset_service._drop_duplicate_rows(rows, columns)

        self.assertEqual(removed, 1)
        self.assertEqual(len(unique_rows), 2)

    def test_removes_iqr_outlier_rows(self):
        rows = [{"temperature": str(value)} for value in [10, 11, 11, 12, 12, 13, 100]]

        filtered, removed = dataset_service._remove_outlier_rows(rows, {"temperature"})

        self.assertEqual(removed, 1)
        self.assertEqual([row["temperature"] for row in filtered], ["10", "11", "11", "12", "12", "13"])


if __name__ == "__main__":
    unittest.main()
