"""업로드 처리 이력과 재시작 복구 저장소"""

import time

from pymongo.errors import PyMongoError

from modules.domain.errors import ApiError


class IngestRepository:
    def __init__(self, database):
        self.collection = database["ingests"]

    def initialize(self):
        try:
            self.collection.create_index([("upload_id", 1), ("state", 1)])
            self.collection.update_many(
                {"state": "running"},
                {
                    "$set": {
                        "state": "failed",
                        "error": "Upload processing was interrupted by an API restart.",
                        "message": "failed",
                        "updated_at": time.time(),
                    }
                },
            )
        except PyMongoError as error:
            raise ApiError(503, "Cannot initialize upload history in MongoDB.") from error

    def save(self, ingest_id, document):
        try:
            self.collection.replace_one({"_id": ingest_id}, {"_id": ingest_id, **document}, upsert=True)
        except PyMongoError as error:
            raise ApiError(503, "Cannot save upload processing status to MongoDB.") from error

    def get(self, ingest_id):
        try:
            return self.collection.find_one({"_id": ingest_id})
        except PyMongoError as error:
            raise ApiError(503, "Cannot read upload processing status from MongoDB.") from error
