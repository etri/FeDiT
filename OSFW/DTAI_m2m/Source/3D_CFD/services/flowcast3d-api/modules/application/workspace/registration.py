import hashlib
import logging
import os
import re
import secrets
import shutil
import threading
import time
from contextlib import ExitStack
from pathlib import Path

from modules.application.workspace.contracts import Register
from modules.application.workspace.values import digest, public_job
from modules.domain.errors import ApiError

log = logging.getLogger(__name__)


class RegistrationService:
    """업로드 등록과 원본 복구 및 데이터셋 게시 관리"""

    def __init__(self, runtime, datasets, tasks):
        self.runtime = runtime
        self.datasets = datasets
        self.tasks = tasks

    @staticmethod
    def _names(names):
        """상대 파일명 중복과 파일 및 디렉터리 경로 충돌 검사"""
        paths = [Path(name) for name in names]
        if any(
            path.is_absolute()
            or "\\" in name
            or "\x00" in name
            or any(part in {"", ".", ".."} for part in name.split("/"))
            for name, path in zip(names, paths)
        ):
            raise ApiError(422, "Dataset filenames must be safe relative paths.")
        selected = set(paths)
        if len(selected) != len(paths) or any(
            parent in selected for path in paths for parent in path.parents
        ):
            raise ApiError(422, "Dataset filenames contain duplicate or overlapping paths.")

    def directory(self, record):
        if not re.fullmatch(r"[a-f0-9]{32}", record["_id"]) or not re.fullmatch(
            r"[a-f0-9]{32}", record["jobId"]
        ):
            raise ValueError("Registration journal identifiers are invalid.")
        names = [item["filename"] for item in record.get("uploads", [])]
        self._names(names)
        directory = self.runtime.root / "datasets" / record["_id"]
        if directory.is_symlink() or directory.resolve().parent != (self.runtime.root / "datasets").resolve():
            raise ValueError("Registration directory is outside the workspace.")
        return directory

    def _rollback(self, record):
        """미공개 등록의 이동 파일과 업로드 상태를 원래 위치로 복구"""
        directory = self.directory(record)
        dataset = self.runtime.repository.datasets.find_one({"_id": record["_id"]})
        if dataset and dataset["status"] == "ready":
            self.runtime.repository.registrations.delete_one({"_id": record["_id"]})
            return
        # DB 정리를 재시도하더라도 원본 파일은 업로드 위치에 보존
        for item in record.get("uploads", []):
            original = self.runtime.uploads.root / f"{item['_id']}.part"
            target = directory / item["filename"]
            if target.is_symlink() or not target.resolve().is_relative_to(directory.resolve()):
                raise ValueError("Registration file is outside the dataset directory.")
            if target.is_file():
                if original.exists():
                    raise ValueError("Registration recovery found two copies of an upload.")
                target.replace(original)
            if not original.is_file() or original.stat().st_size != item["length"]:
                raise ValueError("Registration recovery requires the complete original upload.")

        # 미공개 문서와 업로드 예약을 정리
        self.runtime.repository.tasks.delete_one({"_id": record["jobId"], "datasetId": record["_id"]})
        self.runtime.repository.datasets.delete_one({"_id": record["_id"], "status": {"$ne": "ready"}})
        if record.get("uploads"):
            self.runtime.uploads.collection.update_many(
                {
                    "_id": {"$in": [item["_id"] for item in record["uploads"]]},
                    "$or": [{"registrationId": record["_id"]}, {"datasetId": record["_id"]}],
                },
                {"$set": {"registered": False}, "$unset": {"registrationId": "", "datasetId": ""}},
            )
        if directory.exists():
            shutil.rmtree(directory)
        for suffix in ("cancel", "json"):
            (self.runtime.root / "control" / f"{record['jobId']}.{suffix}").unlink(missing_ok=True)
        self.runtime.cancellations.pop(record["jobId"], None)
        self.runtime.repository.registrations.delete_one({"_id": record["_id"]})

    def recover(self):
        """재시작 시 공개 완료된 등록을 보존하고 나머지 원본 복구"""
        with self.runtime.uploads.lock("admission"):
            for record in self.runtime.repository.registrations.find({}):
                with ExitStack() as locks:
                    for item in sorted(record.get("uploads", []), key=lambda item: item["_id"]):
                        locks.enter_context(self.runtime.uploads.lock(item["_id"]))
                    self.directory(record)
                    dataset = self.runtime.repository.datasets.find_one({"_id": record["_id"]})
                    task = self.runtime.repository.tasks.find_one(
                        {"_id": record["jobId"], "datasetId": record["_id"]}
                    )
                    if dataset and (dataset["status"] == "ready" or task is not None):
                        if record.get("uploads"):
                            self.runtime.uploads.collection.update_many(
                                {"_id": {"$in": [item["_id"] for item in record["uploads"]]}},
                                {
                                    "$set": {"registered": True, "datasetId": record["_id"]},
                                    "$unset": {"registrationId": ""},
                                },
                            )
                        self.runtime.repository.registrations.delete_one({"_id": record["_id"]})
                    else:
                        self._rollback(record)

    def _register_import(self, body, names, *, uploads=(), references=None):
        """등록 일지를 먼저 남긴 뒤 원본 이동과 작업 공개를 함께 처리"""
        self._names(names)
        dataset_id, job_id = secrets.token_hex(16), secrets.token_hex(16)
        directory = self.runtime.root / "datasets" / dataset_id
        source = {
            "kind": "array",
            "paths": [str(directory / name) for name in names],
            "mapping": body.mapping.model_dump(exclude_none=True, exclude_unset=True),
            "cache": str(directory / ".prepared"),
        }
        source["mapping"]["coordinateConfirmed"] = {"origin", "spacing"} <= body.mapping.model_fields_set
        descriptor = {
            "id": dataset_id,
            "name": body.name,
            "version": dataset_id,
            "fields": [],
            "times": [],
            "bounds": [[0, 0, 0], [1, 1, 1]],
            "capabilities": {},
            "validation": [],
            "results": [],
        }
        journal = {"_id": dataset_id, "jobId": job_id, "uploads": list(uploads), "createdAt": time.time()}

        # 원본 이동 전에 복구 일지와 업로드 예약을 기록
        try:
            self.runtime.repository.registrations.insert_one(journal)
            directory.mkdir(mode=0o700)
            if uploads:
                changed = self.runtime.uploads.collection.update_many(
                    {
                        "_id": {"$in": [item["_id"] for item in uploads]},
                        "registered": False,
                        "registrationId": {"$exists": False},
                    },
                    {"$set": {"registrationId": dataset_id}},
                )
                if changed.matched_count != len(uploads):
                    raise ApiError(409, "Upload registration changed during the request.")
                for item, name in zip(uploads, source["paths"]):
                    target = Path(name)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    (self.runtime.uploads.root / f"{item['_id']}.part").replace(target)
                self.runtime.uploads.collection.update_many(
                    {"registrationId": dataset_id},
                    {"$set": {"registered": True, "datasetId": dataset_id}, "$unset": {"registrationId": ""}},
                )

            # 원본 준비가 끝난 데이터셋과 작업을 공개
            self.runtime.repository.datasets.insert_one(
                {
                    "_id": dataset_id,
                    "source": source,
                    "descriptor": descriptor,
                    "status": "preparing",
                    "createdAt": time.time(),
                }
            )
            extra = {"serverReferences": references} if references is not None else {}
            record = self.tasks.create(
                job_id, f"Prepare {body.name}", dataset_id, "import", source=source, **extra
            )
            self.runtime.executor.submit(self.prepare, record)
        except BaseException:
            try:
                self._rollback(journal)
            except Exception:
                log.exception("Registration recovery is pending for %s", dataset_id)
            raise

        # 제출된 작업은 보존하고 남은 등록 일지만 정리
        try:
            self.runtime.repository.registrations.delete_one({"_id": dataset_id})
        except Exception:
            log.exception("Registration journal cleanup is pending for %s", dataset_id)
        return {"dataset": descriptor | {"status": "preparing"}, "job": public_job(record)}

    def register(self, body: Register, owner):
        if len(set(body.uploadIds)) != len(body.uploadIds):
            raise ApiError(422, "Upload IDs must be unique.")
        with self.runtime.uploads.lock("admission"), ExitStack() as locks:
            for upload_id in sorted(body.uploadIds):
                locks.enter_context(self.runtime.uploads.lock(upload_id))
            uploads = [self.runtime.uploads.get(upload_id, owner) for upload_id in body.uploadIds]
            if any(
                item["registered"] or item.get("registrationId") or item["offset"] != item["length"]
                for item in uploads
            ):
                raise ApiError(409, "Every upload must be complete and unregistered.")
            names = [item["filename"] for item in uploads]
            self._names(names)
            for item in uploads:
                path = self.runtime.uploads.root / f"{item['_id']}.part"
                if path.is_symlink() or not path.is_file() or path.stat().st_size != item["length"]:
                    raise ApiError(409, "Upload file is missing or incomplete.")
            return self._register_import(body, names, uploads=uploads)

    def prepare(self, record, *, cancelled=None):
        job_id, dataset_id = record["id"], record["datasetId"]
        derived = record.get("kind") == "dispersion"
        if cancelled is None:
            cancelled = self.runtime.cancellations.setdefault(job_id, threading.Event())

        def active():
            return not cancelled.is_set() and (
                not derived or self.runtime.cancellations.get(job_id) is cancelled
            )

        try:
            with self.runtime.dispersion_lock:
                if not active():
                    return
                self.tasks.update(
                    job_id, status="running", progress={"stage": "validating", "current": 0, "total": 1}
                )
            dataset = (
                {"descriptor": record.get("descriptor") or {"name": record["name"]}}
                if derived
                else self.runtime.repository.datasets.find_one({"_id": dataset_id})
            )
            source = record["source"]
            if record.get("serverReferences"):
                self._copy_server_sources(record)
            descriptor = self.datasets.descriptor(source, dataset_id, dataset["descriptor"]["name"])
            with self.runtime.dispersion_lock:
                if not active():
                    if not derived:
                        self.runtime.repository.datasets.update_one(
                            {"_id": dataset_id}, {"$set": {"status": "cancelled"}}
                        )
                    return
                self.tasks.update(
                    job_id, progress={"stage": "storing", "current": 0, "total": len(source["paths"])}
                )
            assets = self.runtime.repository.assets
            for index, name in enumerate(source["paths"]):
                with self.runtime.dispersion_lock:
                    if not active():
                        if not derived:
                            self.runtime.repository.datasets.update_one(
                                {"_id": dataset_id}, {"$set": {"status": "cancelled"}}
                            )
                        return
                path = Path(name)
                relative = path.relative_to(self.runtime.root / "datasets" / dataset_id)
                sha256 = hashlib.sha256()
                with path.open("rb") as stream:
                    while block := stream.read(1024 * 1024):
                        sha256.update(block)
                logical = self.runtime.root / "datasets" / dataset_id / relative
                assets.save(
                    logical,
                    path,
                    metadata={
                        "workspace_dataset_id": dataset_id,
                        "sha256": sha256.hexdigest(),
                        "relative": str(relative),
                    },
                )
                with self.runtime.dispersion_lock:
                    if not active():
                        return
                    self.tasks.update(
                        job_id,
                        progress={"stage": "storing", "current": index + 1, "total": len(source["paths"])},
                    )
            # 취소와 재시도 세대를 확인한 뒤 완료 결과를 게시
            with self.runtime.dispersion_lock:
                if not active():
                    return
                if derived:
                    self.runtime.repository.datasets.insert_one(
                        {
                            "_id": dataset_id,
                            "descriptor": descriptor,
                            "source": source,
                            "status": "ready",
                            "createdAt": record["createdAt"],
                            "kind": "dispersion",
                            "jobId": job_id,
                        }
                    )
                else:
                    self.runtime.repository.datasets.update_one(
                        {"_id": dataset_id, "status": "preparing"},
                        {"$set": {"descriptor": descriptor, "status": "ready"}},
                    )
                self.tasks.update(
                    job_id,
                    status="succeeded",
                    cancellable=False,
                    result={"datasetId": dataset_id},
                    progress={"stage": "ready", "current": 1, "total": 1},
                )
        except Exception as error:
            with self.runtime.dispersion_lock:
                if derived and (
                    not active()
                    or self.runtime.repository.tasks.find_one({"_id": job_id, "status": "succeeded"})
                ):
                    return
                message = (
                    error.detail
                    if isinstance(error, ApiError)
                    else "Dataset preparation failed. Check the input format and mapping."
                )
                self.runtime.repository.datasets.update_one(
                    {"_id": dataset_id, "status": "preparing"},
                    {
                        "$set": {
                            "status": "failed",
                            "descriptor.validation": [{"level": "error", "message": message}],
                        }
                    },
                )
                self.tasks.update(job_id, status="failed", cancellable=False, error=message)

    def _source_root(self):
        value = os.environ.get("FLOWCAST_WORKSPACE_SOURCE_DIR", "")
        return Path(value).resolve() if value else None

    def list_sources(self):
        root = self._source_root()
        if root is None or not root.is_dir():
            return {"configured": False, "sources": [], "truncated": False}
        output, examined = [], 0
        for directory, names, filenames in os.walk(root, followlinks=False):
            names[:] = sorted(
                name
                for name in names
                if not name.startswith(".")
                and name not in {"work", "__pycache__"}
                and not (Path(directory) / name).is_symlink()
            )
            for name in sorted(filenames):
                examined += 1
                if examined > 10000 or len(output) >= 1000:
                    return {"configured": True, "sources": output, "truncated": True}
                path = Path(directory) / name
                if (
                    name.startswith(".")
                    or path.suffix.lower() not in self.runtime.uploads.allowed_formats
                    or path.is_symlink()
                ):
                    continue
                if not path.resolve().is_relative_to(root):
                    continue
                stat = path.stat()
                if not 0 < stat.st_size <= 32 * 1024**3:
                    continue
                relative = str(path.relative_to(root))
                source_id = digest(
                    {"root": str(root), "relative": relative, "size": stat.st_size, "mtime": stat.st_mtime_ns}
                )
                self.runtime.repository.sources.replace_one(
                    {"_id": source_id},
                    {
                        "_id": source_id,
                        "path": str(path),
                        "name": relative,
                        "size": stat.st_size,
                        "mtime": stat.st_mtime_ns,
                    },
                    upsert=True,
                )
                output.append(
                    {
                        "id": source_id,
                        "name": relative,
                        "size": stat.st_size,
                        "format": path.suffix.lower().removeprefix("."),
                    }
                )
        return {"configured": True, "sources": output, "truncated": False}

    def register_server(self, body):
        root = self._source_root()
        if root is None or len(set(body.sourceIds)) != len(body.sourceIds):
            raise ApiError(422, "Server sources must be configured and source IDs must be unique.")
        references = []
        for source_id in body.sourceIds:
            record = self.runtime.repository.sources.find_one({"_id": source_id})
            if record is None:
                raise ApiError(404, "Server source was not found. Refresh the source list.")
            path = Path(record["path"])
            if path.is_symlink() or not path.resolve().is_relative_to(root) or not path.is_file():
                raise ApiError(409, "Server source is no longer available.")
            stat = path.stat()
            if stat.st_size != record["size"] or stat.st_mtime_ns != record["mtime"]:
                raise ApiError(409, "Server source changed. Refresh the source list.")
            references.append(record)
        if sum(item["size"] for item in references) > 64 * 1024**3:
            raise ApiError(413, "Server dataset exceeds the 64 GiB bundle limit.")
        with self.runtime.uploads.lock("admission"):
            return self._register_import(body, [item["name"] for item in references], references=references)

    def _copy_server_sources(self, record):
        root = self._source_root()
        for index, (reference, destination) in enumerate(
            zip(record["serverReferences"], record["source"]["paths"])
        ):
            path, target = Path(reference["path"]), Path(destination)
            if root is None or path.is_symlink() or not path.resolve().is_relative_to(root):
                raise ApiError(422, "Server source is outside the configured directory.")
            before = path.stat()
            if before.st_size != reference["size"] or before.st_mtime_ns != reference["mtime"]:
                raise ApiError(409, "Server source changed. Register it again.")
            target.parent.mkdir(parents=True, exist_ok=True)
            available = os.statvfs(target.parent)
            if before.st_size > available.f_bavail * available.f_frsize:
                raise ApiError(507, "Dataset storage has insufficient free space.")
            temporary = target.with_suffix(target.suffix + ".partial")
            with path.open("rb") as source, temporary.open("wb") as output:
                shutil.copyfileobj(source, output, length=1024 * 1024)
            after = path.stat()
            if (before.st_mtime_ns, before.st_size, before.st_ino) != (
                after.st_mtime_ns,
                after.st_size,
                after.st_ino,
            ):
                temporary.unlink(missing_ok=True)
                raise ApiError(409, "Server source changed while being copied. Register it again.")
            temporary.replace(target)
            self.tasks.update(
                record["id"],
                progress={"stage": "copying", "current": index + 1, "total": len(record["serverReferences"])},
            )
