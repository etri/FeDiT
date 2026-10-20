import math
import threading
import time
from copy import deepcopy
from dataclasses import dataclass

from modules.domain.errors import ApiError
from modules.domain.schemas import JobStatus, Progress
from modules.domain.schemas.job import Job

ACTIVE = {"queued", "running"}


@dataclass
class _Record:
    job: Job
    queued_at: float
    not_before: float = 0.0
    cancel_requested: bool = False
    token: str | None = None
    completed_at: float | None = None


class JobRepository:
    """단일 API 프로세스의 작업 명세와 실행 상태를 메모리에 보관"""

    def __init__(self, *, completed_limit=1000, completed_ttl=86400.0):
        if (
            isinstance(completed_limit, bool)
            or not isinstance(completed_limit, int)
            or completed_limit < 1
            or not math.isfinite(completed_ttl)
            or completed_ttl <= 0
        ):
            raise ValueError("Completed job retention limits must be positive and finite.")
        self.completed_limit = completed_limit
        self.completed_ttl = completed_ttl
        self._lock = threading.RLock()
        self._jobs = {}
        self._outputs = {}

    # 완료 작업만 시간과 개수 한도에 따라 정리
    def _prune(self):
        now = time.monotonic()
        completed = sorted(
            (record.completed_at, job_id)
            for job_id, record in self._jobs.items()
            if record.completed_at is not None and record.job.status.state not in ACTIVE
        )
        excess = max(0, len(completed) - self.completed_limit)
        for index, (updated_at, job_id) in enumerate(completed):
            if index < excess or now - updated_at >= self.completed_ttl:
                record = self._jobs.pop(job_id)
                self._outputs.pop(record.job.spec.output, None)

    @staticmethod
    def _snapshot(record):
        return Job(record.job.spec.model_copy(deep=True), record.job.status.model_copy(deep=True))

    @classmethod
    def _document(cls, job_id, record):
        return {
            "_id": job_id,
            "case_id": record.job.spec.case_id,
            "spec": record.job.spec.model_dump(mode="json"),
            "status": record.job.status.model_dump(mode="json"),
            "execution": {
                "queued_at": record.queued_at,
                "not_before": record.not_before,
                "cancel_requested": record.cancel_requested,
                "token": record.token,
            },
        }

    # 등록과 조회는 외부 객체와 분리한 복사본으로 처리
    def add(self, spec, status):
        with self._lock:
            self._prune()
            if status.job_id in self._jobs or spec.output in self._outputs:
                raise ApiError(409, "Job ID or output path is already registered.")
            job = Job(spec.model_copy(deep=True), status.model_copy(deep=True))
            self._jobs[status.job_id] = _Record(
                job, status.created_at, completed_at=time.monotonic() if status.state not in ACTIVE else None
            )
            self._outputs[spec.output] = status.job_id
            self._prune()

    def register(self, job_id, spec):
        """동일 ID와 명세의 재등록은 기존 상태 반환"""
        with self._lock:
            self._prune()
            existing = self._jobs.get(job_id)
            if existing is not None:
                if existing.job.spec != spec:
                    raise ApiError(409, "Job ID is already registered with another specification.")
                return existing.job.status.model_copy(deep=True)
            now = time.time()
            status = JobStatus(
                job_id=job_id,
                state="queued",
                progress=Progress(steps_total=spec.steps),
                max_attempts=spec.max_attempts,
                created_at=now,
                updated_at=now,
            )
            self.add(spec, status)
            return status.model_copy(deep=True)

    def save(self, status):
        """주입된 실행기와의 호환을 위해 상태 복사본 저장"""
        with self._lock:
            self._prune()
            record = self._jobs.get(status.job_id)
            if record is None:
                raise ApiError(404, "Job to update was not found.")
            if status.state in ACTIVE:
                record.completed_at = None
            elif record.completed_at is None:
                record.completed_at = time.monotonic()
            record.job.status = status.model_copy(
                deep=True, update={"created_at": record.job.status.created_at}
            )
            if status.state != "running":
                record.token = None
            self._prune()

    def get(self, job_id):
        with self._lock:
            self._prune()
            record = self._jobs.get(job_id)
            return self._snapshot(record) if record is not None else None

    def get_document(self, job_id):
        with self._lock:
            self._prune()
            record = self._jobs.get(job_id)
            return self._document(job_id, record) if record is not None else None

    def list(self, case_id=None):
        with self._lock:
            self._prune()
            records = [
                record
                for record in self._jobs.values()
                if case_id is None or record.job.spec.case_id == case_id
            ]
            records.sort(
                key=lambda record: (record.job.status.created_at, record.job.status.job_id), reverse=True
            )
            return [self._snapshot(record) for record in records]

    # 대기 순서와 실행 세대 확인을 같은 잠금에서 처리
    def claim_next(self, token, now, exclude=()):
        with self._lock:
            self._prune()
            blocked = set(exclude)
            candidates = sorted(
                (record.queued_at, record.job.status.created_at, job_id)
                for job_id, record in self._jobs.items()
                if job_id not in blocked and self._ready(record, now)
            )
            return self.claim(candidates[0][2], token, now) if candidates else None

    @staticmethod
    def _ready(record, now):
        status = record.job.status
        return (
            status.state == "queued"
            and not record.cancel_requested
            and record.not_before <= now
            and status.attempts < status.max_attempts
        )

    def claim(self, job_id, token, now):
        if not isinstance(token, str) or not token:
            raise ValueError("A nonempty execution token is required.")
        with self._lock:
            record = self._jobs.get(job_id)
            if record is None or not self._ready(record, now):
                return None
            status = record.job.status
            record.job.status = status.model_copy(
                update={
                    "state": "running",
                    "attempts": status.attempts + 1,
                    "updated_at": now,
                }
            )
            record.token = token
            return self._document(job_id, record)

    def update_progress(self, job_id, token, progress):
        with self._lock:
            record = self._jobs.get(job_id)
            if record is not None and record.token == token and record.job.status.state == "running":
                record.job.status.progress = progress.model_copy(deep=True)
                record.job.status.updated_at = time.time()

    def finish_running(self, job_id, token, kind, payload=None, *, retry=True, retry_delay=30.0):
        """현재 실행의 완료와 취소 우선순위를 원자적으로 반영"""
        with self._lock:
            record = self._jobs.get(job_id)
            if record is None:
                return None
            if record.token != token or record.job.status.state != "running":
                return record.job.status.model_copy(deep=True)
            now = time.time()
            status = record.job.status
            values = {"updated_at": now, "result": None, "error": None}
            if record.cancel_requested:
                values["state"] = "cancelled"
            elif kind == "succeeded":
                values.update(state="succeeded", result=deepcopy(payload))
            elif kind == "stopped":
                values.update(state="queued", attempts=max(0, status.attempts - 1))
                record.not_before = 0.0
            else:
                values.update(state="failed", error=str(payload))
                if retry and status.attempts < status.max_attempts:
                    values["state"] = "queued"
                    record.not_before = now + retry_delay * 2 ** (status.attempts - 1)
            record.job.status = status.model_copy(update=values)
            record.token = None
            record.completed_at = time.monotonic() if values["state"] not in ACTIVE else None
            result = record.job.status.model_copy(deep=True)
            self._prune()
            return result

    # 취소와 수동 재시도는 허용된 상태에서만 전환
    def cancel(self, job_id):
        with self._lock:
            self._prune()
            record = self._jobs.get(job_id)
            if record is None:
                return None
            status = record.job.status
            if status.state not in ACTIVE:
                raise ApiError(409, "Only queued or running jobs can be cancelled.")
            record.cancel_requested = True
            status.updated_at = time.time()
            if status.state == "queued":
                status.state = "cancelled"
                record.token = None
                record.completed_at = time.monotonic()
            result = status.model_copy(deep=True)
            self._prune()
            return result

    def retry(self, job_id):
        with self._lock:
            self._prune()
            record = self._jobs.get(job_id)
            if record is None:
                return None
            status = record.job.status
            if status.state not in {"failed", "cancelled"}:
                raise ApiError(409, "Only failed or cancelled jobs can be retried.")
            record.job.status = status.model_copy(
                update={
                    "state": "queued",
                    "attempts": 0,
                    "error": None,
                    "result": None,
                    "updated_at": time.time(),
                }
            )
            record.not_before, record.cancel_requested, record.token = 0.0, False, None
            record.completed_at = None
            return record.job.status.model_copy(deep=True)

    def cancel_requested(self, job_id, token):
        with self._lock:
            record = self._jobs.get(job_id)
            return (
                record is None
                or record.token != token
                or record.cancel_requested
                or record.job.status.state != "running"
            )
