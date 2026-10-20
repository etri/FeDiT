import re
import threading
from pathlib import Path

from pymongo.errors import DuplicateKeyError, PyMongoError

from modules.domain.errors import ApiError
from modules.domain.schemas import Case
from modules.infrastructure.mongo.storage import MongoAssets, store_exists

CASE_ID = re.compile(r"^[a-z0-9][a-z0-9_-]*$")


class CaseRepository:
    def __init__(self, data_dir, database, *, stores=None):
        from modules.infrastructure.formats.storage import FlowStorage

        self.stores = stores if stores is not None else FlowStorage()
        self.root = Path(data_dir).resolve() / "cases"
        self.collection = database["cases"]
        self.assets = MongoAssets(database)
        self.database = database
        self.lock = threading.Lock()

    def path(self, case_id):
        """디렉터리를 만들지 않고 검증한 논리 경로 반환"""
        if not CASE_ID.fullmatch(case_id):
            raise ApiError(422, "Case ID is invalid.")
        path = self.root / case_id
        if not path.resolve().is_relative_to(self.root.resolve()):
            raise ApiError(422, "Path is outside the case data directory.")
        return path

    def get(self, case_id):
        if not CASE_ID.fullmatch(case_id):
            return None
        try:
            document = self.collection.find_one({"_id": case_id})
        except PyMongoError as error:
            raise ApiError(503, "Cannot read case from MongoDB.") from error
        return Case.model_validate(document["case"]) if document else None

    def ids(self):
        try:
            return sorted(document["_id"] for document in self.collection.find({}, {"_id": 1}))
        except PyMongoError as error:
            raise ApiError(503, "Cannot list cases in MongoDB.") from error

    def create(self, case):
        self.path(case.id)
        try:
            self.collection.insert_one({"_id": case.id, "case": case.model_dump(mode="json", by_alias=True)})
        except DuplicateKeyError:
            raise FileExistsError(case.id) from None
        except PyMongoError as error:
            raise ApiError(503, "Cannot save case to MongoDB.") from error

    def save(self, case):
        try:
            self.collection.replace_one(
                {"_id": case.id},
                {"_id": case.id, "case": case.model_dump(mode="json", by_alias=True)},
                upsert=True,
            )
        except PyMongoError as error:
            raise ApiError(503, "Cannot save case changes to MongoDB.") from error

    def files(self, case):
        root = self.path(case.id)

        def store(relative):
            return {"path": relative, "exists": store_exists(root / relative)}

        return {
            "mesh": [
                {"path": name, "exists": self.assets.exists(root / name)}
                for name in (case.mesh.files if case.mesh else [])
            ],
            "flow": store(case.flow.source) if case.flow else None,
            "reference": store(case.reference) if case.reference else None,
        }

    def confine(self, path, base, root):
        """케이스 요청의 경로 경계 검증"""
        from modules.infrastructure.filesystem.paths import confine

        return confine(path, base, root)

    def geometry_bounds(self, files, matrix):
        """형상 저장 형식과 무관하게 물리 경계 조회"""
        from modules.infrastructure.formats.mesh_bounds import mesh_bounds

        return mesh_bounds(files, matrix)
