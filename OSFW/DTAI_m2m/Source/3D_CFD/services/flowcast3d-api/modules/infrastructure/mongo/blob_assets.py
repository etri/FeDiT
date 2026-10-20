"""원본 자산과 GridFS 업로드 임대 관리"""

import os
import time
from contextlib import contextmanager
from pathlib import Path
from uuid import uuid4

from modules.infrastructure.mongo import connection
from modules.infrastructure.mongo.namespace import namespace as normalize_path
from modules.infrastructure.mongo.namespace import prefix_query

BLOCK_SIZE = 1024 * 1024


@contextmanager
def source_stream(source):
    import io

    owned = isinstance(source, (str, Path, bytes, bytearray, memoryview))
    if isinstance(source, (str, Path)):
        stream = open(source, "rb")
    elif isinstance(source, (bytes, bytearray, memoryview)):
        stream = io.BytesIO(source)
    else:
        stream = source
    try:
        yield stream
    finally:
        if owned:
            stream.close()


class LeasedUpload:
    """활성 업로드의 청크가 정리되지 않도록 임대 갱신"""

    def __init__(self, assets, filename):
        self.assets = assets
        self.stream = assets.files.new_file(filename=filename, chunk_size=BLOCK_SIZE)
        self.leases = assets.db.asset_uploads
        self.owner = uuid4().hex
        self.leases.insert_one(
            {"_id": self.stream._id, "owner": self.owner, "state": "writing", "expires_at": time.time() + 300}
        )
        self.heartbeat = time.monotonic()
        self.publication_uncertain = False

    def __getattr__(self, name):
        return getattr(self.stream, name)

    @property
    def metadata(self):
        return self.stream.metadata

    @metadata.setter
    def metadata(self, value):
        self.stream.metadata = value

    def renew(self, force=False):
        """임대 갱신 권한을 잃으면 업로드 중단"""
        if force or time.monotonic() - self.heartbeat >= 30:
            result = self.leases.update_one(
                {"_id": self.stream._id, "owner": self.owner, "state": "writing"},
                {"$set": {"expires_at": time.time() + 300}},
            )
            if not result.matched_count:
                raise RuntimeError("GridFS upload lease has been lost.")
            self.heartbeat = time.monotonic()

    def write(self, chunk):
        self.renew()
        self.stream.write(chunk)

    def close(self):
        self.renew(force=True)
        self.stream.close()

    def publish(self, write):
        """정리 작업이 참조 공개 중인 파일을 회수하지 못하도록 보호"""
        from pymongo.errors import DuplicateKeyError

        result = self.leases.update_one(
            {"_id": self.stream._id, "owner": self.owner, "state": "writing"},
            {"$set": {"state": "publishing"}},
        )
        if not result.matched_count:
            raise RuntimeError("GridFS upload lease has been lost.")
        # 응답이 유실된 쓰기는 서버에서 나중에 완료될 수 있으므로 격리
        self.publication_uncertain = True
        try:
            result = write()
        except DuplicateKeyError:
            self.publication_uncertain = False
            raise
        self.publication_uncertain = False
        return result

    def abort(self):
        self.stream.abort()

    def release(self):
        if self.publication_uncertain:
            try:
                # 참조가 확인된 공개만 완료로 처리하고 나머지는 격리 유지
                referenced = (
                    self.assets.collection.find_one({"file_id": self.stream._id}, {"_id": 1}) is not None
                    or self.assets.db.zarr_chunks.find_one({"blob_id": self.stream._id}, {"_id": 1})
                    is not None
                )
                if referenced:
                    self.publication_uncertain = False
            except Exception:
                return
        if not self.publication_uncertain:
            self.leases.delete_one({"_id": self.stream._id, "owner": self.owner})


class MongoAssets:
    def __init__(self, db=None):
        import gridfs

        self.db = connection.database() if db is None else db
        self.collection = self.db["assets"]
        self.files = gridfs.GridFS(self.db, collection="asset_blobs")
        self.collection.create_index("path", unique=True)

    def info(self, path):
        return self.collection.find_one({"_id": normalize_path(path)})

    def exists(self, path):
        info = self.info(path)
        return info is not None and self.files.exists(info["file_id"])

    def list(self, prefix):
        return list(self.collection.find(prefix_query(prefix)).sort("path", 1))

    def open(self, path):
        info = self.info(path)
        if info is None:
            raise FileNotFoundError(str(path))
        return self.files.get(info["file_id"])

    def save(self, path, source, metadata=None, overwrite=True):
        """업로드를 마친 자산만 새 리비전으로 공개"""
        from pymongo.errors import DuplicateKeyError

        namespace = normalize_path(path)
        previous = self.info(namespace)
        if previous and not overwrite:
            raise FileExistsError(namespace)
        upload = LeasedUpload(self, namespace)
        size = 0
        try:
            with source_stream(source) as stream:
                while chunk := stream.read(BLOCK_SIZE):
                    size += len(chunk)
                    upload.write(chunk)
            upload.close()
            document = {
                "_id": namespace,
                "path": namespace,
                "file_id": upload._id,
                "size": size,
                "revision": uuid4().hex,
                "updated_at": time.time(),
                "metadata": dict(metadata or {}),
            }
            if overwrite:
                upload.publish(lambda: self.collection.replace_one({"_id": namespace}, document, upsert=True))
            else:
                upload.publish(lambda: self.collection.insert_one(document))
            return document
        except BaseException as error:
            if upload.publication_uncertain:
                pass
            elif not upload.closed:
                upload.abort()
            else:
                # 공개 응답이 유실되어도 참조된 자산은 보존
                try:
                    self._delete_blob(upload._id)
                except Exception:
                    pass
            if isinstance(error, DuplicateKeyError):
                raise FileExistsError(namespace) from None
            raise
        finally:
            upload.release()

    def verify(self, path):
        info = self.info(path)
        if info is None:
            raise FileNotFoundError(str(path))
        with self.open(path) as stream:
            if stream.length != info["size"]:
                raise ValueError(f"GridFS size mismatch: {path}")
        return info

    def _delete_blob(self, file_id):
        """자산과 Zarr에서 참조하지 않는 GridFS 파일만 제거"""
        if not self.collection.find_one(
            {"file_id": file_id}, {"_id": 1}
        ) and not self.db.zarr_chunks.find_one({"blob_id": file_id}, {"_id": 1}):
            self.files.delete(file_id)

    def delete(self, path):
        document = self.collection.find_one_and_delete({"_id": normalize_path(path)})
        if document:
            self._delete_blob(document["file_id"])
        return document is not None

    def delete_tree(self, prefix):
        documents = self.list(prefix)
        for document in documents:
            self.delete(document["path"])
        return len(documents)

    def materialize(self, prefix, destination, paths=None):
        """상대 경로와 크기를 검증해 /tmp 아래에 복원"""
        base, target = Path(normalize_path(prefix)), Path(destination).resolve()
        if not target.is_relative_to(Path("/tmp")):
            raise ValueError("Assets can only be restored to a temporary directory under /tmp.")
        selected = None if paths is None else {normalize_path(path) for path in paths}
        target.mkdir(parents=True, exist_ok=True)
        documents = self.list(base)
        if selected is not None:
            missing = selected - {info["path"] for info in documents}
            if missing:
                raise FileNotFoundError(f"MongoDB assets not found: {sorted(missing)}")
        for info in documents:
            if selected is not None and info["path"] not in selected:
                continue
            relative = Path(info["path"]).relative_to(base)
            output = (target / relative).resolve()
            if not output.is_relative_to(target) or output == target:
                raise ValueError("Asset path resolves outside the temporary directory.")
            output.parent.mkdir(parents=True, exist_ok=True)
            temporary = output.with_name(output.name + "." + uuid4().hex + ".restoring")
            try:
                size = 0
                with self.open(info["path"]) as stream, open(temporary, "wb") as local:
                    while chunk := stream.read(BLOCK_SIZE):
                        size += len(chunk)
                        local.write(chunk)
                if size != info["size"]:
                    raise ValueError(f"Restored GridFS size mismatch: {info['path']}")
                mtime = info.get("metadata", {}).get("mtime_ns")
                if mtime is not None:
                    os.utime(temporary, ns=(int(mtime), int(mtime)))
                os.replace(temporary, output)
            finally:
                temporary.unlink(missing_ok=True)
        return target
