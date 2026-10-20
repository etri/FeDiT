import math
import threading
import time
from dataclasses import dataclass, field
from uuid import uuid4

from modules.domain.schemas import JobSpec
from modules.infrastructure.memory.jobs import JobRepository


@dataclass
class _Running:
    token: str
    cancelled: threading.Event = field(default_factory=threading.Event)


class JobQueue:
    """공유 메모리 저장소에서 작업을 점유하고 실행 중단 신호 관리"""

    def __init__(self, repository=None, *, retry_delay=30.0):
        if not math.isfinite(retry_delay) or retry_delay < 0:
            raise ValueError("Job retry delay must be finite and nonnegative.")
        self.repository = repository if repository is not None else JobRepository()
        self.retry_delay = retry_delay
        self._lock = threading.RLock()
        self._running = {}

    def notify(self, job_id):
        """실행기 깨우기 인터페이스를 위한 메모리 작업 확인"""
        return self.repository.get(job_id) is not None

    def submit(self, job_id, spec):
        return self.repository.register(job_id, spec)

    def get(self, job_id):
        job = self.repository.get(job_id)
        return job.status if job is not None else None

    def list(self):
        return [job.status for job in self.repository.list()]

    # 이전 계산 스레드가 해제한 작업만 다음 실행에 배정
    def claim(self, now=None, exclude=()):
        now = time.time() if now is None else now
        with self._lock:
            token = uuid4().hex
            document = self.repository.claim_next(token, now, set(exclude) | set(self._running))
            if document is None:
                return None
            job_id = document["_id"]
            self._running[job_id] = _Running(token)
            return job_id, JobSpec.model_validate(document["spec"]), token

    def set_progress(self, job_id, token, progress):
        self.repository.update_progress(job_id, token, progress)

    def succeed(self, job_id, token, result):
        return self.repository.finish_running(job_id, token, "succeeded", result)

    def fail(self, job_id, token, error, retry=True):
        return self.repository.finish_running(
            job_id, token, "failed", error, retry=retry, retry_delay=self.retry_delay
        )

    def stopped(self, job_id, token):
        return self.repository.finish_running(job_id, token, "stopped")

    def release(self, job_id, token):
        """계산 스레드가 끝난 실행만 슬롯에서 해제"""
        with self._lock:
            running = self._running.get(job_id)
            if running is not None and running.token == token:
                self._running.pop(job_id)

    # 취소 이벤트와 상태 전환을 같은 잠금에서 처리
    def cancel(self, job_id):
        with self._lock:
            status = self.repository.cancel(job_id)
            running = self._running.get(job_id)
            if status is not None and running is not None:
                running.cancelled.set()
            return status

    def cancel_requested(self, job_id, token):
        with self._lock:
            running = self._running.get(job_id)
            return (
                running is None
                or running.token != token
                or running.cancelled.is_set()
                or self.repository.cancel_requested(job_id, token)
            )

    def retry(self, job_id):
        return self.repository.retry(job_id)
