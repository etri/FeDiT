import logging
import re
import secrets
import shutil
import tempfile
import threading
import time
import zipfile
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from modules.application.cases import load
from modules.application.ports.ingest import IngestHistory
from modules.domain.errors import ApiError, StoreError
from modules.domain.grids.comparison import same_grid
from modules.domain.identifiers import NAME
from modules.domain.schemas.case import FlowSource, MeshSpec

logger = logging.getLogger(__name__)

Kind = Literal["mesh", "flow", "reference"]
GEOMETRY = (".obj", ".stl")
# VTK는 변환 전 원본으로만 보관
MESH_FILES = (*GEOMETRY, ".mtl", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".tga", ".vtk", ".vtp")
STORE_TARGETS = {"flow": "flow/source.zarr", "reference": "flow/reference.zarr"}
# 압축 해제용 임시 폴더
# 실패 시 원본 업로드는 보존
WORK = ".ingest"
CHUNK = 4 * 1024 * 1024


class IngestRequest(BaseModel):
    upload_id: str = Field(pattern=NAME.pattern)
    kind: Kind


class IngestStatus(BaseModel):
    ingest_id: str
    case_id: str
    upload_id: str
    kind: Kind
    state: Literal["running", "succeeded", "failed"] = "running"
    # 압축 해제 진행량과 전체 크기(바이트)
    bytes_done: int = 0
    bytes_total: int = 0
    message: str = ""
    error: str | None = None
    # Case 기준 배치 경로
    files: list[str] = []
    skipped: list[str] = []
    created_at: float = 0.0
    updated_at: float = 0.0


class IngestError(ValueError):
    """업로드한 자료를 받아들일 수 없음"""


class IngestService:
    def __init__(self, data_dir, cases, jobs, history: IngestHistory):
        self.data_dir = Path(data_dir)
        self.cases = cases
        self.assets = cases.assets
        self.jobs = jobs
        self._records = {}
        self._threads = []
        self.history = history
        self.history.initialize()

    def _save(self, record):
        self.history.save(record.ingest_id, record.model_dump(mode="json"))

    def close(self, timeout=3.0):
        deadline = time.monotonic() + timeout
        for thread in self._threads:
            thread.join(timeout=max(0.0, deadline - time.monotonic()))

    def get(self, ingest_id):
        record = self._records.get(ingest_id)
        if record is not None:
            self._save(record)
        else:
            document = self.history.get(ingest_id)
            record = IngestStatus.model_validate(document) if document else None
        if record is None:
            raise ApiError(404, f"ingest {ingest_id!r} not found")
        return record.model_copy()

    def start(self, case_id, request):
        load(self.cases, case_id)
        staging = self.data_dir / "uploads" / request.upload_id
        uploaded = self.assets.list(staging)
        if not uploaded:
            raise ApiError(404, f"upload {request.upload_id!r} not found")
        if any(r.upload_id == request.upload_id and r.state == "running" for r in self._records.values()):
            raise ApiError(409, f"upload {request.upload_id!r} is already being ingested")
        # 미완료 작업이 원본을 다시 읽을 수 있어 실행 중 교체 거절
        if request.kind == "flow" and self.jobs.active(case_id):
            raise ApiError(409, f"case {case_id!r} has unfinished jobs reading its flow source")

        now = time.time()
        record = IngestStatus(
            ingest_id=secrets.token_hex(8),
            case_id=case_id,
            **request.model_dump(),
            created_at=now,
            updated_at=now,
        )
        self._records[record.ingest_id] = record
        self._save(record)
        if any(Path(info["path"]).suffix.lower() == ".zip" for info in uploaded):
            thread = threading.Thread(
                target=self._run, args=(record, staging), name=f"ingest-{record.ingest_id}", daemon=True
            )
            self._threads.append(thread)
            thread.start()
        else:
            self._run(record, staging)
        return record.model_copy()

    def _run(self, record, staging):
        # 업로드를 복원할 임시 작업 공간 준비
        temporary = tempfile.TemporaryDirectory(prefix="flowcast-api-ingest-", dir="/tmp")
        logical_upload = staging
        staging = Path(temporary.name)
        work = staging / WORK

        try:
            # 업로드 자료 복원과 압축 해제
            self.assets.materialize(logical_upload, staging)
            archives = list(_uploaded(staging, ".zip"))
            record.bytes_total = sum(_check_archive(archive) for archive in archives)
            for archive in archives:
                record.message = f"extracting {archive.name}"
                _extract(archive, work / archive.stem, record)

            # 자료 유형별 검증과 MongoDB 등록
            record.message = "validating"
            directory = self.cases.path(record.case_id)
            if record.kind == "mesh":
                self._place_mesh(record, staging, directory)
            else:
                self._place_store(record, staging, directory)
            self.assets.delete_tree(logical_upload)
            record.state, record.message = "succeeded", "done"
        except Exception as error:
            if not isinstance(error, IngestError):
                logger.exception("ingest %s failed", record.ingest_id)
            shutil.rmtree(work, ignore_errors=True)
            record.error = (
                str(error) if isinstance(error, IngestError) else f"{type(error).__name__}: {error}"
            )
            record.state, record.message = "failed", "failed"

        # 최종 처리 상태 저장과 임시 파일 회수
        record.updated_at = time.time()
        try:
            self._save(record)
        finally:
            temporary.cleanup()

    def _place_mesh(self, record, staging, directory):
        sources = {}
        for root in (staging, *sorted(path for path in (staging / WORK).glob("*") if path.is_dir())):
            for path in sorted(root.rglob("*")):
                relative = path.relative_to(root)
                hidden = any(part.startswith(".") or part == "__MACOSX" for part in relative.parts)
                if not path.is_file() or hidden or path.suffix.lower() == ".zip":
                    continue
                if path.suffix.lower() not in MESH_FILES:
                    record.skipped.append(str(relative))
                elif sources.setdefault(relative, path) != path:
                    raise IngestError(f"{relative} was uploaded more than once")
        geometry = [relative for relative in sources if relative.suffix.lower() in GEOMETRY]
        if not geometry:
            raise IngestError("the upload has no mesh geometry (.obj or .stl)")
        for relative in geometry:
            _check_geometry(sources[relative])
        mesh = directory / "mesh"
        existing = [str(relative) for relative in sources if self.assets.exists(mesh / relative)]
        if existing:
            raise IngestError(f"already in the case's mesh folder: {existing}")
        blocked = sorted(
            {
                str(parent)
                for relative in sources
                for parent in relative.parents
                if self.assets.exists(mesh / parent)
            }
        )
        if blocked:
            raise IngestError(f"the case's mesh folder has files where the upload needs folders: {blocked}")

        placed = []
        try:
            for relative, path in sources.items():
                target = mesh / relative
                self.assets.save(
                    target, path, metadata={"mtime_ns": path.stat().st_mtime_ns}, overwrite=False
                )
                placed.append(target)
            with self.cases.lock:
                case = load(self.cases, record.case_id)
                # 업로드 전 자리 표시 이름은 제외
                files = [
                    name
                    for name in (case.mesh.files if case.mesh else [])
                    if self.assets.exists(directory / name)
                ]
                files += [
                    f"mesh/{relative.as_posix()}"
                    for relative in geometry
                    if f"mesh/{relative.as_posix()}" not in files
                ]
                case.mesh = (
                    case.mesh.model_copy(update={"files": files}) if case.mesh else MeshSpec(files=files)
                )
                self.cases.save(case)
        except Exception:
            # 실패한 배치만 정리하고 원본 업로드는 보존
            for target in placed:
                self.assets.delete(target)
            raise
        record.files = [f"mesh/{relative.as_posix()}" for relative in sources]

    def _place_store(self, record, staging, directory):
        found = sorted(path.parent for path in staging.rglob(".zgroup") if "__MACOSX" not in path.parts)
        if len(found) != 1:
            raise IngestError(
                f"the upload must hold exactly one flowcast.store/1 store, found {len(found)} Zarr groups"
            )
        if found[0] == staging:
            raise IngestError("upload the store as a folder or as a zip, not as loose files")
        try:
            store = self.cases.stores.read(found[0])
            if store.n_frames < 1:
                raise StoreError("the store has no frames")
        except StoreError as error:
            raise IngestError(str(error)) from None
        case = load(self.cases, record.case_id)
        source = directory / case.flow.source if case.flow else None
        if source and self.cases.stores.exists(source):
            try:
                existing = self.cases.stores.read(source)
                # 프레임 없는 영역은 flow 업로드로 교체 허용
                matches = (record.kind == "flow" and existing.n_frames == 0) or same_grid(
                    store.grid, existing.grid
                )
            except StoreError as error:
                # 깨진 초기 유동장의 복구는 flow 업로드만 허용
                if record.kind != "flow":
                    raise IngestError(
                        f"the case's flow source is unreadable, replace it first: {error}"
                    ) from None
                matches = True
            if not matches:
                raise IngestError("the grid differs from the grid of the case's flow source")

        relative = STORE_TARGETS[record.kind]
        target = directory / relative
        partial = target.with_name(target.name + ".partial")
        backup = target.with_name(target.name + ".backup.zarr.partial")
        prepared = self.cases.stores.mapping(partial)
        prepared.clear()
        existing = self.cases.stores.exists(target)
        try:
            paths = sorted(
                (path for path in found[0].rglob("*") if path.is_file()),
                key=lambda path: path.name == ".zgroup",
            )
            for path in paths:
                prepared.write_stream(path.relative_to(found[0]).as_posix(), path)
            if existing:
                self.cases.stores.copy(target, backup)
            self.cases.stores.rename(partial, target)
            with self.cases.lock:
                case = load(self.cases, record.case_id)
                if record.kind == "flow":
                    case.flow = FlowSource(source=relative)
                else:
                    case.reference = relative
                self.cases.save(case)
            record.files = [relative]
        except Exception:
            if existing and self.cases.stores.exists(backup):
                self.cases.stores.rename(backup, target)
            elif not existing:
                self.cases.stores.mapping(target).clear()
            raise
        finally:
            prepared.clear()
            self.cases.stores.mapping(backup).clear()


def _uploaded(staging, suffix):
    return (
        path
        for path in sorted(staging.rglob("*"))
        if path.is_file() and path.suffix.lower() == suffix and WORK not in path.relative_to(staging).parts
    )


def _check_archive(archive):
    """경로 이탈을 검사하고 압축 해제 후 전체 크기 반환"""
    try:
        with zipfile.ZipFile(archive) as bundle:
            members = bundle.infolist()
    except zipfile.BadZipFile as error:
        raise IngestError(f"{archive.name} is not a readable zip: {error}") from None
    for member in members:
        name = member.filename
        parts = name.replace("\\", "/").split("/")
        if name.startswith(("/", "\\")) or re.match(r"^[A-Za-z]:", name) or ".." in parts:
            raise IngestError(f"{archive.name}: member {name!r} would be written outside the target folder")
    return sum(member.file_size for member in members)


def _extract(archive, target, record):
    root = target.resolve()
    with zipfile.ZipFile(archive) as bundle:
        for member in bundle.infolist():
            path = (target / member.filename).resolve()
            if not path.is_relative_to(root):
                raise IngestError(
                    f"{archive.name}: member {member.filename!r} would be written outside the target folder"
                )
            if member.is_dir():
                path.mkdir(parents=True, exist_ok=True)
                continue
            path.parent.mkdir(parents=True, exist_ok=True)
            with bundle.open(member) as source, open(path, "wb") as output:
                while chunk := source.read(CHUNK):
                    output.write(chunk)
                    record.bytes_done += len(chunk)


def _check_geometry(path):
    with open(path, "rb") as file:
        head = file.read(1024 * 1024)
    if path.suffix.lower() == ".obj":
        valid = re.search(rb"^v\s", head, re.MULTILINE) is not None
    else:
        # STL 크기 = 헤더 84바이트 + 삼각형당 50바이트
        binary = len(head) >= 84 and path.stat().st_size == 84 + 50 * int.from_bytes(head[80:84], "little")
        valid = binary or head.lstrip().startswith(b"solid")
    if not valid:
        raise IngestError(f"{path.name} does not look like a {path.suffix.lower()[1:].upper()} mesh")
