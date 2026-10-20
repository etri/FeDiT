"""관리 서버와 계산 프로세스의 MongoDB 연결"""

import os
from functools import lru_cache
from urllib.parse import quote

from modules.domain.errors import ApiError
from modules.settings.validation import env_port


class MongoConnection:
    """관리 앱 수명 동안 사용하는 연결과 예측 조회 인덱스 관리"""

    def __init__(self, settings):
        from pymongo import MongoClient
        from pymongo.errors import PyMongoError

        self.database_error = PyMongoError
        self.client = MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=5000)
        self.database = self.client[settings.mongo_database]

    def open(self):
        try:
            self.client.admin.command("ping")
            self.database.predictions.create_index([("run_id", 1), ("created_at", -1)])
        except self.database_error as error:
            raise ApiError(503, "Cannot connect to MongoDB.") from error

    def close(self):
        self.client.close()


@lru_cache(maxsize=4)
def _database(uri: str, name: str):
    """프로세스별 MongoDB 연결 풀 재사용"""
    from pymongo import MongoClient

    return MongoClient(uri, serverSelectionTimeoutMS=5000)[name]


def database():
    uri = os.getenv("FLOWCAST_MONGO_URI", "")
    if not uri:
        password = os.getenv("MONGO_PASSWORD", "")
        if not password:
            raise ValueError("MongoDB result storage requires a connection URI or password.")
        user = quote(os.getenv("MONGO_USER", "flowcast3d"), safe="")
        port = env_port("FLOWCAST_DB_PORT", 27017)
        uri = f"mongodb://{user}:{quote(password, safe='')}@flowcast3d-db:{port}/?authSource=admin"
    return _database(uri, os.getenv("FLOWCAST_MONGO_DATABASE", "flowcast3d"))
