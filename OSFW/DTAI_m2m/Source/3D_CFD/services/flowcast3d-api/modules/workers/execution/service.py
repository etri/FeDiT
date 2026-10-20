import logging
import threading
import time
from pathlib import Path

from pydantic import BaseModel, Field

from modules.domain.errors import ApiError, WorkerError, WorkerUnreachable
from modules.domain.schemas import Case, JobSpec
from modules.infrastructure.memory.jobs import JobRepository
from modules.infrastructure.mongo.storage import get_case
from modules.infrastructure.triton.client import TritonClient, TritonRequestError
from modules.settings import execution as config
from modules.workers.execution.predict import Stopped, run_prediction
from modules.workers.execution.queue import JobQueue

log = logging.getLogger("flowcast.worker")
# 재시도 지연이 끝난 작업의 확인 간격(초)
POLL_INTERVAL = 1.0
SHUTDOWN_TIMEOUT = 20.0
HEALTH_TIMEOUT = 0.5


class Run(BaseModel):
    job_id: str = Field(pattern=r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")
    spec: JobSpec


def confine(spec, data_dir):
    """심볼릭 링크를 해석한 모든 작업 경로의 data_dir 이탈 검사"""
    root = Path(data_dir).resolve()
    paths = [spec.source.flow, *spec.source.mesh, spec.output]
    if spec.case_id is not None:
        paths.append(root / "cases" / spec.case_id / "case.json")
    for path in paths:
        if not Path(path).resolve().is_relative_to(root):
            raise ValueError(f"{path} is outside the data directory {root}")


def load_case(spec, data_dir):
    document = get_case(spec.case_id) if spec.case_id else None
    return Case.model_validate(document) if document is not None else None


class Worker:
    def __init__(self, queue, data_dir, client, max_concurrent, tile_concurrency=1):
        self.queue, self.data_dir, self.client, self.max_concurrent = queue, data_dir, client, max_concurrent
        self.tile_concurrency = tile_concurrency
        # job_id별 (스레드, 큐 기록 완료 표시)
        self.jobs = {}
        self.stopping = threading.Event()
        self.wake = threading.Event()
        self.loop = threading.Thread(target=self._loop, name="worker-loop", daemon=True)

    def running(self):
        return sum(not done.is_set() for _, done in list(self.jobs.values()))

    def start(self):
        self.loop.start()

    def stop(self, timeout=60.0):
        """실행 중인 작업을 재개 가능한 지점에서 중단하고 종료 대기"""
        self.stopping.set()
        self.wake.set()
        deadline = time.monotonic() + timeout
        if self.loop.ident is not None:
            self.loop.join(max(0.0, deadline - time.monotonic()))
        for thread, _ in list(self.jobs.values()):
            thread.join(max(0.0, deadline - time.monotonic()))
        return not self.loop.is_alive() and not any(
            thread.is_alive() for thread, _ in list(self.jobs.values())
        )

    def _loop(self):
        while not self.stopping.is_set():
            try:
                # 계산 완료 표시로 실행 슬롯 회수
                self.jobs = {job_id: job for job_id, job in self.jobs.items() if not job[1].is_set()}

                # 빈 슬롯만큼 작업 점유
                while (
                    not self.stopping.is_set()
                    and len(self.jobs) < self.max_concurrent
                    and (claimed := self.queue.claim(exclude=self.jobs))
                ):
                    done = threading.Event()
                    try:
                        thread = threading.Thread(
                            target=self._run, args=(*claimed, done), name=f"job-{claimed[0]}", daemon=True
                        )
                        self.jobs[claimed[0]] = (thread, done)
                        thread.start()
                    except Exception:
                        # 스레드를 시작하지 못한 작업은 슬롯과 점유를 복구
                        try:
                            self.queue.stopped(claimed[0], claimed[2])
                        finally:
                            self.queue.release(claimed[0], claimed[2])
                            self.jobs.pop(claimed[0], None)
                            done.set()
                        raise
            except Exception:  # 큐 오류 뒤에도 실행 루프 유지
                log.exception("worker loop")
            self.wake.wait(POLL_INTERVAL)
            self.wake.clear()

    def _run(self, job_id, spec, token, done):
        try:
            # 진행률과 취소 요청을 큐에 연결
            if self.stopping.is_set() or self.queue.cancel_requested(job_id, token):
                raise Stopped()
            result = run_prediction(
                spec,
                progress=lambda update: self.queue.set_progress(job_id, token, update),
                should_stop=lambda: self.stopping.is_set() or self.queue.cancel_requested(job_id, token),
                client=self.client,
                case=load_case(spec, self.data_dir),
                job_id=job_id,
                tile_concurrency=self.tile_concurrency,
            )

            outcome = (self.queue.succeed, (job_id, token, result))
        except Stopped:
            outcome = (self.queue.stopped, (job_id, token))
        except Exception as error:
            log.exception("job %s failed", job_id)
            # 입력 검증 실패는 재시도하지 않음
            permanent = isinstance(error, ValueError) or (
                isinstance(error, TritonRequestError) and error.status == 400
            )
            outcome = (self.queue.fail, (job_id, token, f"{type(error).__name__}: {error}", not permanent))
        try:
            # 계산 결과를 현재 메모리 실행 상태에 반영
            action, arguments = outcome
            action(*arguments)
        except Exception:
            log.exception("job state update %s", job_id)
        finally:
            # 계산 종료 뒤 슬롯을 해제하고 대기 루프를 즉시 깨움
            self.queue.release(job_id, token)
            done.set()
            self.wake.set()


class LocalExecutor:
    def __init__(
        self,
        settings=None,
        client=None,
        queue=None,
        data_dir=None,
        triton_url=None,
        shutdown_timeout=SHUTDOWN_TIMEOUT,
        repository=None,
    ):
        # 실행 설정과 공유 메모리 작업 큐 구성
        self.settings = config.load("worker", "FLOWCAST")
        self.settings.update(settings or {})
        if data_dir is not None:
            self.settings["data_dir"] = str(data_dir)
        if triton_url is not None:
            self.settings["triton_url"] = triton_url
        if (
            min(self.settings["max_concurrent_jobs"], self.settings["tile_concurrency"], shutdown_timeout)
            <= 0
        ):
            raise ValueError("Execution concurrency and shutdown timeout must be positive.")
        self.repository = (
            queue.repository
            if queue is not None
            else repository
            if repository is not None
            else JobRepository()
        )
        self.queue = (
            queue
            if queue is not None
            else JobQueue(repository=self.repository, retry_delay=self.settings["retry_delay"])
        )
        self.client = client if client is not None else TritonClient(self.settings["triton_url"])
        self.worker = Worker(
            self.queue,
            self.settings["data_dir"],
            self.client,
            self.settings["max_concurrent_jobs"],
            self.settings["tile_concurrency"],
        )
        self.shutdown_timeout = shutdown_timeout
        self._started = False
        self._closed = False

    def start(self):
        if self._closed:
            raise WorkerUnreachable("A closed executor cannot be restarted.")
        if not self._started:
            self._call(self.worker.start)
            self._started = True

    def close(self):
        if self._closed:
            return
        try:
            if self._started and not self.worker.stop(self.shutdown_timeout):
                log.warning("Shutdown timed out. Job state will be discarded when the process exits.")
        finally:
            self._closed = True
            if getattr(self.client, "close", None) is not None:
                self.client.close()

    def _call(self, action, *args):
        if self._closed:
            raise WorkerUnreachable("Executor is closed.")
        try:
            return action(*args)
        except ApiError as error:
            raise WorkerError(error.status, error.detail) from error
        except (ValueError, TypeError) as error:
            raise WorkerUnreachable(f"Job queue request failed: {type(error).__name__}.") from error

    @staticmethod
    def _found(status):
        if status is None:
            raise WorkerError(404, "no such job")
        return status

    def submit(self, job_id, spec):
        try:
            run = Run(job_id=job_id, spec=spec)
            confine(run.spec, self.settings["data_dir"])
        except ValueError as error:
            raise WorkerError(422, str(error)) from None
        status = self._call(self.queue.submit, run.job_id, run.spec)
        self.worker.wake.set()
        return status

    def list(self):
        return self._call(self.queue.list)

    def notify(self, job_id):
        self._call(self.queue.notify, job_id)
        self.worker.wake.set()

    def available(self):
        return not self._closed and self._started and self.worker.loop.is_alive()

    def status(self, job_id):
        return self._found(self._call(self.queue.get, job_id))

    def cancel(self, job_id):
        status = self._found(self._call(self.queue.cancel, job_id))
        self.worker.wake.set()
        return status

    def retry(self, job_id):
        status = self._found(self._call(self.queue.retry, job_id))
        self.worker.wake.set()
        return status

    def health(self):
        if self._closed or not self._started or not self.worker.loop.is_alive():
            raise WorkerUnreachable("Executor loop is not running.")
        return {
            "status": "ok",
            "triton_ready": self.client.ready(timeout=HEALTH_TIMEOUT),
            "running": self.worker.running(),
            "max_concurrent": self.worker.max_concurrent,
        }
