import shutil
import time

import gridfs
from bson import ObjectId

from modules.domain.errors import ApiError
from modules.infrastructure.formats.flow_store import StoreError, StoreReader
from modules.infrastructure.mongo.blob_assets import MongoAssets
from modules.infrastructure.mongo.storage import store_revision


class WorkspaceRepository:
    """Workspace 문서 접근과 재시작 복구 및 예측 원본 복원"""

    def __init__(self, database):
        self.database = database
        self.assets = MongoAssets(database)
        self.datasets = database["workspace_datasets"]
        self.tasks = database["workspace_jobs"]
        self.registrations = database["workspace_registrations"]
        self.scenarios = database["workspace_dispersion_scenarios"]
        self.result_contexts = database["workspace_result_contexts"]
        self.predictions = database["predictions"]
        self.presentations = database["workspace_dataset_presentations"]
        self.space_counters = database["workspace_space_counters"]
        self.sources = database["workspace_sources"]
        self.state = database["workspace_state"]

    def recover_incomplete(self):
        """재시작 전에 끝나지 않은 작업과 시나리오를 중단 상태로 전환"""
        self.tasks.update_many(
            {"status": {"$in": ["queued", "running"]}},
            {
                "$set": {
                    "status": "interrupted",
                    "error": "API restarted before the task finished. Retry the task.",
                    "cancellable": False,
                    "updatedAt": time.time(),
                }
            },
        )
        self.datasets.update_many({"status": "preparing"}, {"$set": {"status": "interrupted"}})
        for scenario in self.scenarios.find({"status": {"$in": ["queued", "running"]}}):
            for branch in scenario["branches"].values():
                if branch["status"] in {"queued", "running"}:
                    branch.update(
                        status="interrupted",
                        error="API restarted before the branch finished. Retry the scenario.",
                    )
            self.scenarios.update_one(
                {"_id": scenario["_id"]},
                {
                    "$set": {
                        "status": "interrupted",
                        "branches": scenario["branches"],
                        "updatedAt": time.time(),
                    }
                },
            )

    def completed_predictions(self):
        """기존 정렬과 상한을 유지하여 완료한 예측 조회"""
        return list(
            self.predictions.find({"status": "completed", "npz_file_id": {"$exists": True}})
            .sort("_id", 1)
            .limit(100)
        )

    def prediction(self, identifier, *, completed=False, projection=None):
        query = {"_id": ObjectId(identifier)}
        if completed:
            query["status"] = "completed"
        return self.predictions.find_one(query, projection)

    def restore_prediction(self, record, identifier, target, maximum_bytes):
        """예측 소유권과 크기를 확인한 NPZ를 원자적으로 복원"""
        if target.is_file():
            return
        temporary = target.with_suffix(".partial")
        try:
            with (
                gridfs.GridFS(self.database).get(record["npz_file_id"]) as source,
                temporary.open("wb") as output,
            ):
                if (
                    source.length > maximum_bytes
                    or record.get("npz_size") != source.length
                    or (source.metadata or {}).get("prediction_id") != identifier
                ):
                    raise ApiError(409, "Prediction NPZ metadata or size is invalid.")
                shutil.copyfileobj(source, output, length=1024 * 1024)
            temporary.replace(target)
        finally:
            temporary.unlink(missing_ok=True)

    def get_state(self):
        document = self.state.find_one({"_id": "default"})
        return document.get("state", {}) if document else {}

    def save_state(self, value):
        self.state.replace_one({"_id": "default"}, {"_id": "default", "state": value}, upsert=True)

    def read_flow(self, path):
        """기존 결과 조회와 같은 기준으로 읽을 수 없는 저장소 처리"""
        try:
            return StoreReader(path)
        except StoreError:
            return None

    def flow_grid(self, path):
        return StoreReader(path).grid

    def store_revision(self, path):
        return store_revision(path)
