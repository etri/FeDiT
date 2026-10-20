"""MongoDB Zarr 청크 매핑과 리비전 관리"""

from collections.abc import Iterator, MutableMapping
from pathlib import Path
from uuid import uuid4

from modules.infrastructure.mongo import connection
from modules.infrastructure.mongo.blob_assets import BLOCK_SIZE, LeasedUpload, MongoAssets, source_stream
from modules.infrastructure.mongo.namespace import namespace


class MongoZarrStore(MutableMapping[str, bytes]):
    """Zarr 메타데이터와 압축 청크를 MongoDB에 저장하는 매핑"""

    def __init__(self, path: str | Path, readonly: bool = False, collection=None):
        self.path = namespace(path)
        self.readonly = readonly
        self.collection = connection.database()["zarr_chunks"] if collection is None else collection
        if not readonly:
            self.collection.create_index([("store", 1), ("key", 1)], unique=True)

    def _query(self, key: str) -> dict:
        return {"store": self.path, "key": key}

    def __getitem__(self, key: str) -> bytes:
        document = self.collection.find_one(self._query(key))
        if document is None:
            raise KeyError(key)
        if "data" in document:
            payload = bytes(document["data"])
        else:
            with MongoAssets(self.collection.database).files.get(document["blob_id"]) as stream:
                payload = stream.read()
        if "size" in document and len(payload) != document["size"]:
            raise ValueError(f"Zarr chunk size mismatch: {self.path}/{key}")
        return payload

    def __setitem__(self, key: str, value: bytes) -> None:
        """청크를 원자적으로 저장하고 변경 세대 갱신"""
        self.write_stream(key, value)

    def read_stream(self, key):
        import io

        document = self.collection.find_one(self._query(key))
        if document is None:
            raise KeyError(key)
        if "data" in document:
            return io.BytesIO(document["data"])
        return MongoAssets(self.collection.database).files.get(document["blob_id"])

    def size(self, key) -> int:
        """전체 내용을 순회하지 않고 저장된 청크 크기 확인"""
        document = self.collection.find_one(self._query(key))
        if document is None:
            raise KeyError(key)
        if "data" in document:
            return len(document["data"])
        with MongoAssets(self.collection.database).files.get(document["blob_id"]) as stream:
            return stream.length

    def write_stream(self, key, source, overwrite=True):
        """큰 청크는 GridFS에 저장하며 기존 이관 청크와의 충돌 거절"""
        from bson.binary import Binary
        from pymongo.errors import DuplicateKeyError

        self._writable()
        assets = MongoAssets(self.collection.database)
        query = self._query(key)
        previous = self.collection.find_one(query)
        upload = None
        published = False
        try:
            with source_stream(source) as stream:
                head = stream.read(15 * 1024 * 1024 + 1)
                size = len(head)
                document = {"store": self.path, "key": key, "revision": uuid4().hex}
                if len(head) <= 15 * 1024 * 1024:
                    document["data"] = Binary(head)
                else:
                    upload = LeasedUpload(assets, self.path + "/" + key)
                    upload.write(head)
                    while chunk := stream.read(BLOCK_SIZE):
                        size += len(chunk)
                        upload.write(chunk)
                    document["blob_id"] = upload._id
                document["size"] = size
                if previous is not None and not overwrite:
                    if self.size(key) != size:
                        raise FileExistsError(f"MongoDB Zarr chunk conflict: {self.path}/{key}")
                    if upload:
                        upload.abort()
                    return previous
                if upload:
                    upload.close()

                # 추가 전용 저장은 고유 인덱스로 경쟁 쓰기의 덮어쓰기 차단
                if not overwrite:
                    document["_id"] = uuid4().hex
                    try:
                        if upload:
                            upload.publish(lambda: self.collection.insert_one(document))
                        else:
                            self.collection.insert_one(document)
                    except DuplicateKeyError:
                        current = self.collection.find_one(query)
                        if current is None or self.size(key) != size:
                            raise FileExistsError(f"MongoDB Zarr chunk conflict: {self.path}/{key}") from None
                        if upload:
                            assets.files.delete(upload._id)
                        return current
                    published = True
                    return document

                # 기존 문서 식별자는 유지하고 저장 방식이 바뀐 필드만 정리
                unused = "blob_id" if "data" in document else "data"
                update = {"$set": document, "$unset": {unused: ""}, "$setOnInsert": {"_id": uuid4().hex}}
                if upload:
                    upload.publish(lambda: self.collection.update_one(query, update, upsert=True))
                else:
                    self.collection.update_one(query, update, upsert=True)
                published = True
                return self.collection.find_one(query)
        except BaseException:
            if upload and not published and not upload.publication_uncertain:
                if upload.closed:
                    # 응답 유실로 공개 여부가 불명확하면 참조된 파일 보존
                    try:
                        assets._delete_blob(upload._id)
                    except Exception:
                        pass
                else:
                    upload.abort()
            raise
        finally:
            if upload:
                upload.release()

    def __delitem__(self, key: str) -> None:
        self._writable()
        document = self.collection.find_one_and_delete(self._query(key))
        if document is None:
            raise KeyError(key)
        if "blob_id" in document:
            MongoAssets(self.collection.database)._delete_blob(document["blob_id"])

    def __iter__(self) -> Iterator[str]:
        for document in self.collection.find({"store": self.path}, {"key": 1}).sort("key", 1):
            yield document["key"]

    def __len__(self) -> int:
        return self.collection.count_documents({"store": self.path})

    def __contains__(self, key: object) -> bool:
        return isinstance(key, str) and self.collection.find_one(self._query(key), {"_id": 1}) is not None

    def _writable(self) -> None:
        if self.readonly:
            raise PermissionError("Cannot modify a read-only MongoDB store.")

    def clear(self) -> None:
        self._writable()
        blobs = self.collection.distinct("blob_id", {"store": self.path})
        self.collection.delete_many({"store": self.path})
        assets = MongoAssets(self.collection.database)
        for file_id in blobs:
            assets._delete_blob(file_id)

    def revision(self, key: str = ".zattrs") -> str | None:
        document = self.collection.find_one(self._query(key), {"revision": 1})
        return document["revision"] if document else None
