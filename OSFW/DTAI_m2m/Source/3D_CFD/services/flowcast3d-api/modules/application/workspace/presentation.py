import re
import threading
from urllib.parse import quote

from modules.application.ports.workspace import WorkspaceRepository


class DatasetPresentation:
    """원본 자료와 분리한 카드 제목과 공간별 번호 관리"""

    def __init__(self, repository: WorkspaceRepository, cases):
        self.repository, self.cases = repository, cases
        self.records = repository.presentations
        self.counters = repository.space_counters
        self.lock = threading.Lock()

    def _case(self, case_id):
        if not isinstance(case_id, str) or case_id not in self.cases.ids():
            return None
        case = self.cases.get(case_id)
        if case is None:
            return None
        name = re.sub(r"\s*\([^)]*(?:실측 형상|합성 초기 유동장)[^)]*\)$", "", case.name).strip()
        mesh = getattr(case, "mesh", None)
        if mesh:
            from pathlib import Path

            formats = "/".join(sorted({Path(path).suffix[1:].upper() for path in mesh.files}))
            name = f"{name} ({formats})"
        return f"case:{case.id}", name

    def prediction_case(self, record):
        """예측에 기록된 공간 식별자나 생성 경로로 등록 공간 확인"""
        metadata = (record or {}).get("model_metadata") or {}
        explicit = self._case((record or {}).get("case_id") or metadata.get("case_id"))
        if explicit:
            return explicit
        provenance = metadata.get("geometry_transform") or {}
        location = provenance.get("metadata_source", "") if isinstance(provenance, dict) else ""
        for case_id in self.cases.ids():
            if isinstance(location, str) and location.endswith(f"/cases/{case_id}/case.json"):
                return self._case(case_id)
        return None

    def space(self, descriptor, depth=0):
        dataset_id = descriptor["id"]
        if dataset_id.startswith("case:"):
            return self._case(dataset_id[5:]) or (dataset_id, descriptor["name"])
        if dataset_id.startswith("prediction:"):
            identifier = dataset_id[11:]
            record = (
                self.repository.prediction(
                    identifier,
                    projection={
                        "case_id": 1,
                        "model_metadata.case_id": 1,
                        "model_metadata.geometry_transform.metadata_source": 1,
                        "model_metadata.geometry_sha256": 1,
                    },
                )
                if re.fullmatch(r"[a-f0-9]{24}", identifier)
                else None
            )
            case = self.prediction_case(record)
            if case:
                return case
            metadata = (record or {}).get("model_metadata") or {}
            geometry = metadata.get("geometry_sha256")
            if isinstance(geometry, str) and re.fullmatch(r"[a-f0-9]{64}", geometry):
                return f"geometry:{geometry}", "3D 공간"
            return "unknown:prediction", "3D 공간"
        record = self.repository.datasets.find_one({"_id": dataset_id}) or {}
        source = record.get("source", {})
        geometry = source
        for _ in range(4):
            if not geometry.get("geometrySource"):
                break
            geometry = geometry["geometrySource"]
        case = self._case(geometry.get("case", {}).get("id"))
        if case:
            return case
        stored = record.get("descriptor") or {}
        parent = (descriptor.get("sourceRef") or stored.get("sourceRef") or {}).get("datasetId") or (
            descriptor.get("provenance") or stored.get("provenance") or {}
        ).get("sourceDatasetId")
        if isinstance(parent, str) and parent != dataset_id and depth < 4:
            if parent.startswith(("case:", "prediction:")):
                return self.space({"id": parent, "name": descriptor["name"]}, depth + 1)
            original = self.repository.datasets.find_one({"_id": parent})
            if original:
                return self.space(original["descriptor"], depth + 1)
        return f"dataset:{dataset_id}", descriptor["name"]

    def _register(self, descriptor):
        record = self.records.find_one({"_id": descriptor["id"]})
        ready = descriptor.get("status") == "ready"
        if record and (record.get("spaceResolved") or not ready):
            case = self._case(record["spaceId"][5:]) if record["spaceId"].startswith("case:") else None
            if case and record["spaceName"] != case[1]:
                self.records.update_one({"_id": descriptor["id"]}, {"$set": {"spaceName": case[1]}})
                record["spaceName"] = case[1]
            return record
        with self.lock:
            record = self.records.find_one({"_id": descriptor["id"]})
            if record and (record.get("spaceResolved") or not ready):
                return record
            space_id, space_name = self.space(descriptor)
            if record and record["spaceId"] == space_id:
                values = {"spaceName": space_name, "spaceResolved": ready}
            else:
                counter = self.counters.find_one_and_update(
                    {"_id": space_id},
                    {"$inc": {"ordinal": 1}},
                    upsert=True,
                    return_document=True,
                )
                values = {
                    "spaceId": space_id,
                    "spaceName": space_name,
                    "ordinal": counter["ordinal"],
                    "spaceResolved": ready,
                }
            self.records.update_one({"_id": descriptor["id"]}, {"$set": values}, upsert=True)
            return self.records.find_one({"_id": descriptor["id"]})

    def describe(self, descriptor):
        record = self._register(descriptor)
        result = dict(
            descriptor,
            name=record.get("title", record["spaceName"]),
            spaceId=record["spaceId"],
            spaceName=record["spaceName"],
            spaceOrdinal=record["ordinal"],
        )
        modes = set(result.get("scenarioModes", []))
        if result.get("capabilities", {}).get("predict"):
            modes.add("model")
        references = [
            item
            for item in result.get("results", [])
            if item.get("resultRole") == "reference_wind" and "reference" in item.get("scenarioModes", [])
        ]
        if references:
            modes.add("reference")
            result.setdefault("referenceResultId", references[0]["id"])
        result["scenarioModes"] = [mode for mode in ("reference", "model") if mode in modes]
        if descriptor.get("status") == "ready" and (
            descriptor.get("fields") or descriptor.get("capabilities", {}).get("geometry")
        ):
            result["thumbnailUrl"] = (
                f"/app-api/datasets/{quote(descriptor['id'], safe='')}/thumbnail"
                f"?v={quote(descriptor.get('version', ''), safe='')}"
            )
        return result

    def describe_all(self, descriptors):
        # 같은 공간은 원본 Case를 우선하여 한 번만 표시
        spaces = {}
        for descriptor in descriptors:
            value = self.describe(descriptor)
            key = value["spaceId"] if value["spaceId"] != "unknown:prediction" else value["id"]
            if key not in spaces or value["id"].startswith("case:"):
                spaces[key] = value
        return list(spaces.values())

    def rename(self, descriptor, title):
        self._register(descriptor)
        self.records.update_one({"_id": descriptor["id"]}, {"$set": {"title": title}})
        return self.describe(descriptor)
