import secrets
import threading
import time
from pathlib import Path

from pydantic import BaseModel, ConfigDict, Field

from modules.application.cases import load
from modules.domain.errors import ApiError, StoreError, WorkerError, WorkerUnreachable
from modules.domain.schemas import Inflow, JobSpec, JobStatus, Progress
from modules.domain.schemas.job import Job

ACTIVE = ("queued", "running")
# 실시간 예측 결과의 Case 기준 경로
LIVE = "results/live"


class SourceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    flow: str | None = None
    mesh: list[str] = []
    inflow: Inflow | None = None


class JobRequest(JobSpec):
    case_id: str
    source: SourceRequest = SourceRequest()
    output: str | None = None


class LiveRequest(Inflow):
    steps: int = Field(default=60, ge=1, le=600)
    # 교체할 이전 실시간 작업 ID
    replaces: str | None = None


def _new_id():
    # 결과 폴더를 시각 순으로 정렬
    return f"{time.strftime('%Y%m%d-%H%M%S', time.gmtime())}-{secrets.token_hex(3)}"


def is_live(cases, job):
    if job.spec.case_id is None:
        return False
    return Path(job.spec.output).is_relative_to((cases.path(job.spec.case_id) / LIVE).resolve())


def _output_stores(spec):
    output = Path(spec.output)
    paths = {output}
    if spec.output_grid == "source":
        paths.add(output.with_name(output.name.removesuffix(".zarr") + ".prediction.zarr"))
    return paths


def view(job, executor="ok"):
    return {
        **job.status.model_dump(),
        "case_id": job.spec.case_id,
        "spec": job.spec.model_dump(mode="json"),
        "executor": executor,
    }


class JobService:
    def __init__(self, repository, cases, worker, data_dir):
        self.repository = repository
        self.cases = cases
        self.worker = worker
        self.data_dir = data_dir
        # 출력 중복 검사와 등록을 함께 잠금
        self._lock = threading.Lock()
        # 이전 실시간 작업 중단과 새 작업 등록을 함께 잠금
        self._live_lock = threading.Lock()

    def submit(self, request):
        job_id = _new_id()
        spec = self._prepare(request, job_id)
        # 실시간 결과 경로는 실시간 요청에만 허용
        if Path(spec.output).is_relative_to((self.cases.path(request.case_id) / LIVE).resolve()):
            raise ApiError(422, f"output must not be under {LIVE}, which live predictions manage")
        return self._enqueue(job_id, spec)

    def live(self, case_id, request):
        case = load(self.cases, case_id)
        if case.flow is None:
            raise ApiError(422, f"case {case_id!r} has no flow.source to start a live prediction from")
        directory = self.cases.path(case_id)
        # 업로드 전 자리 표시 파일은 제외
        meshes = [
            name
            for name in (case.mesh.files if case.mesh else [])
            if self.cases.assets.exists(directory / name)
        ]
        inflow = request.model_dump(include={"direction", "speed"})
        job_id = _new_id()
        spec = self._prepare(
            JobRequest(
                case_id=case_id,
                source=SourceRequest(flow=case.flow.source, mesh=meshes, inflow=inflow),
                output=f"{LIVE}/{job_id}.zarr",
                steps=request.steps,
                mode="global",
                normalization="frozen",
                history_length=3,
                max_attempts=1,
                output_grid="prediction",
            ),
            job_id,
        )
        with self._live_lock:
            jobs = [job for job in self.list(case_id)[0] if is_live(self.cases, job)]
            for job in jobs:
                if job.status.job_id == request.replaces and job.status.state in ACTIVE:
                    self._cancel(job)
            return self._enqueue(job_id, spec)

    def _prepare(self, request, job_id):
        # Case와 초기 유동장 경로 확인
        case = load(self.cases, request.case_id)
        directory = self.cases.path(case.id)
        flow = request.source.flow or (case.flow.source if case.flow else None)
        if flow is None:
            raise ApiError(422, "the request names no source.flow and the case has no flow.source")

        # 절대 논리 경로로 변환한 작업 명세 구성과 검증
        spec = JobSpec(
            **request.model_dump(exclude={"source", "output"}),
            source={
                "flow": str(self.cases.confine(flow, directory, self.data_dir)),
                "mesh": [
                    str(self.cases.confine(mesh, directory, self.data_dir)) for mesh in request.source.mesh
                ],
                "inflow": request.source.inflow,
            },
            output=str(
                self.cases.confine(request.output or f"results/{job_id}.zarr", directory, self.data_dir)
            ),
        )
        self._check(spec)
        return spec

    def _enqueue(self, job_id, spec):
        # 대기 상태와 작업 진행 정보 생성
        now = time.time()
        status = JobStatus(
            job_id=job_id,
            state="queued",
            progress=Progress(steps_total=spec.steps),
            max_attempts=spec.max_attempts,
            created_at=now,
            updated_at=now,
        )

        # 출력 중복 확인과 작업 등록
        with self._lock:
            # 재개 시 결과가 섞이지 않도록 중복 출력 거절
            if any(_output_stores(job.spec) & _output_stores(spec) for job in self.repository.list()):
                raise ApiError(409, f"output {spec.output} already belongs to another job")
            for output in _output_stores(spec):
                if self.cases.assets.exists(output) or self.cases.stores.exists(output):
                    raise ApiError(409, f"Output store already exists: {output}. Use a new output path.")
            self.repository.add(spec, status)

        # 메모리에 등록한 작업의 실행 대기열을 깨움
        job = Job(spec, status)
        try:
            self.worker.notify(job_id)
        except WorkerUnreachable:
            return job, "unreachable"
        except WorkerError as error:
            raise ApiError(error.status, error.detail) from None
        return job, self._availability()

    def _check(self, spec):
        try:
            source = self.cases.stores.read(spec.source.flow)
        except StoreError as error:
            raise ApiError(422, f"source.flow: {error}") from None
        # 합성 이력은 원본 프레임 없이 격자와 마스크만 사용
        if source.n_frames < 1 and spec.source.inflow is None:
            raise ApiError(422, f"source.flow: {spec.source.flow} has no frames")
        missing = [mesh for mesh in spec.source.mesh if not self.cases.assets.exists(mesh)]
        if missing:
            raise ApiError(422, f"source.mesh: no such file: {missing}")
        # 보조 예측 저장소 경로도 출력 충돌 검사에 포함
        if not spec.output.endswith(".zarr"):
            raise ApiError(422, "output must end with .zarr")
        output = Path(spec.output)
        if spec.output == spec.source.flow:
            raise ApiError(422, "output must not be the source.flow store")
        if any(self.cases.stores.exists(parent) for parent in output.parents):
            raise ApiError(422, f"output {spec.output} lies inside another store")

    def _load(self, job_id):
        job = self.repository.get(job_id)
        if job is None:
            raise ApiError(404, f"job {job_id!r} not found")
        return job

    def _availability(self):
        try:
            return "ok" if self.worker.available() else "unreachable"
        except WorkerUnreachable:
            return "unreachable"

    def get(self, job_id):
        job = self._load(job_id)
        executor = self._availability()
        if executor == "ok":
            try:
                # 메모리 진행률은 응답에만 반영
                job.status = self.worker.status(job_id)
            except WorkerUnreachable:
                executor = "unreachable"
            except WorkerError as error:
                if error.status != 404:
                    raise ApiError(error.status, error.detail) from None
        return job, executor

    def list(self, case_id=None):
        jobs = self.repository.list(case_id)
        executor = self._availability()
        if executor != "ok":
            return jobs, executor
        try:
            known = {status.job_id: status for status in self.worker.list()}
            for job in jobs:
                if job.status.job_id in known:
                    # 저장된 상태와 메모리 진행률을 실행기가 병합
                    job.status = known[job.status.job_id]
        except WorkerUnreachable:
            return jobs, "unreachable"
        except WorkerError as error:
            raise ApiError(error.status, error.detail) from None
        return jobs, "ok"

    def active(self, case_id):
        jobs, _ = self.list(case_id)
        return any(job.status.state in ACTIVE for job in jobs)

    def cancel(self, job_id):
        return self._cancel(self._load(job_id))

    def _cancel(self, job):
        job_id = job.status.job_id
        try:
            self.worker.cancel(job_id)
        except WorkerUnreachable as error:
            raise ApiError(503, f"executor unreachable: {error}") from None
        except WorkerError as error:
            raise ApiError(error.status, error.detail) from None
        return self._load(job_id)

    def retry(self, job_id):
        self._load(job_id)
        try:
            self.worker.retry(job_id)
        except WorkerUnreachable as error:
            raise ApiError(503, f"executor unreachable: {error}") from None
        except WorkerError as error:
            raise ApiError(error.status, error.detail) from None
        return self._load(job_id)
