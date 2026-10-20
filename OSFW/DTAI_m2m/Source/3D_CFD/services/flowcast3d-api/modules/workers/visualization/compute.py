"""HTTP 서버와 분리된 시각화 계산 프로세스 관리"""

from __future__ import annotations

import contextlib
import json
import logging
import multiprocessing
import os
import shutil
import signal
import stat
import tempfile
import threading
import time
from pathlib import Path

LOGGER = logging.getLogger(__name__)


def group_stopped(group):
    """Linux 프로세스 그룹에 파일을 기록할 수 있는 구성원이 없는지 확인"""
    if type(group) is not int or group <= 0:
        return False
    try:
        for directory in Path("/proc").iterdir():
            if not directory.name.isdecimal():
                continue
            try:
                fields = (directory / "stat").read_text().rsplit(")", 1)[1].split()
            except (FileNotFoundError, ProcessLookupError):
                continue
            if int(fields[2]) != group:
                continue
            if fields[0] not in {"Z", "X", "x"}:
                return False
            # leader 종료 뒤에도 남을 수 있는 native 스레드까지 확인
            tasks = list((directory / "task").iterdir())
            if not tasks:
                return False
            for task in tasks:
                if not task.name.isdecimal():
                    return False
                task_fields = (task / "stat").read_text().rsplit(")", 1)[1].split()
                if int(task_fields[2]) != group or task_fields[0] not in {"Z", "X", "x"}:
                    return False
        return True
    except (OSError, ValueError, IndexError):
        return False


def cleanup_scratch(directory, identity):
    """부모가 생성한 동일 inode의 임시 디렉터리만 정리"""
    directory = Path(directory)
    try:
        current = directory.lstat()
        if not stat.S_ISDIR(current.st_mode) or (current.st_dev, current.st_ino) != identity:
            LOGGER.warning("Visualization scratch identity changed; cleanup was deferred: %s", directory)
            return False
        shutil.rmtree(directory)
        return True
    except FileNotFoundError:
        return True
    except OSError:
        LOGGER.warning("Visualization scratch cleanup was deferred: %s", directory, exc_info=True)
        return False


def cleanup_stopped_group(group, directory, identity, timeout=2, *, deferred=False):
    """종료 신호 전달 후 모든 기록 프로세스가 멈춘 세대만 회수"""
    deadline = time.monotonic() + timeout
    announced = False
    while not group_stopped(group):
        if time.monotonic() >= deadline:
            if not announced:
                LOGGER.warning(
                    "Visualization group exit is unconfirmed; scratch cleanup was deferred: %s", directory
                )
                announced = True
            if not deferred:
                return False
            time.sleep(0.25)
        else:
            time.sleep(0.02)
    return cleanup_scratch(directory, identity)


def response_limit():
    try:
        maximum = int(os.environ.get("FLOWCAST_RENDER_MAX_RESPONSE_BYTES", str(32 * 1024 * 1024)))
    except ValueError:
        raise ValueError("FLOWCAST_RENDER_MAX_RESPONSE_BYTES must be an integer.") from None
    if not 1024 <= maximum <= 128 * 1024 * 1024:
        raise ValueError("FLOWCAST_RENDER_MAX_RESPONSE_BYTES must be between 1024 and 134217728.")
    return maximum


def send_result(connection, status, payload, maximum):
    data = json.dumps([status, payload], ensure_ascii=False, allow_nan=False).encode()
    if len(data) > maximum:
        data = json.dumps([413, {"detail": "Visualization response exceeds the IPC size limit."}]).encode()
    connection.send_bytes(data)


def guard_group(connection, compute_pid, scratch_root, scratch_identity):
    """HTTP 부모의 연결이 끊기면 계산 그룹의 하위 프로세스까지 종료"""
    os.setsid()
    try:
        connection.send_bytes(b"ready")
        connection.recv_bytes(1024)
    except (EOFError, OSError):
        pass
    finally:
        with contextlib.suppress(ProcessLookupError):
            os.killpg(compute_pid, signal.SIGKILL)
        cleanup_stopped_group(compute_pid, scratch_root, scratch_identity, deferred=True)
        connection.close()


def compute_main(connection, enforce_budget, maximum, dispatcher=None, dependency_loader=None):
    """독립 프로세스 그룹에서 의존성을 읽고 작업을 순차 처리"""
    # HTTP 부모가 비정상 종료되어도 계산 프로세스가 남지 않도록 설정
    parent_pid = os.getppid()
    os.setsid()
    import ctypes

    if ctypes.CDLL(None, use_errno=True).prctl(1, signal.SIGKILL, 0, 0, 0) != 0:
        raise OSError(ctypes.get_errno(), "Cannot configure compute parent shutdown.")
    if os.getppid() != parent_pid:
        return
    try:
        if dependency_loader is None:
            import pyvista

            from modules.workers.visualization.operations import limit_heap

            metadata = {
                "pyvista": pyvista.__version__,
                "heapLimitMiB": limit_heap() if enforce_budget else None,
            }
        else:
            metadata = dependency_loader()
        send_result(connection, "ready", metadata, maximum)
        if dispatcher is None:
            from modules.workers.visualization.operations import dispatch

            dispatcher = dispatch
        while True:
            path, request = connection.recv()
            try:
                payload = dispatcher(path, request)
                send_result(connection, 200, payload, maximum)
            except FileNotFoundError as error:
                send_result(connection, 404, {"detail": str(error)}, maximum)
            except MemoryError as error:
                send_result(
                    connection, 413, {"detail": str(error) or "Visualization memory limit exceeded."}, maximum
                )
            except (ValueError, TypeError, UnicodeError) as error:
                send_result(connection, 400, {"detail": str(error)}, maximum)
            except RuntimeError as error:
                send_result(connection, 503, {"detail": str(error)}, maximum)
            except Exception:
                LOGGER.exception("Visualization failed.")
                send_result(connection, 500, {"detail": "Visualization failed."}, maximum)
    except (EOFError, BrokenPipeError, ConnectionResetError):
        pass
    except Exception:
        LOGGER.exception("Visualization compute process failed.")
        with contextlib.suppress(OSError):
            send_result(
                connection, "error", {"detail": "Visualization dependencies are unavailable."}, maximum
            )
    finally:
        connection.close()


class ComputeProcess:
    """제한 시간을 넘긴 계산과 하위 프로세스를 함께 회수"""

    def __init__(self, *, enforce_budget=False, dispatcher=None, dependency_loader=None):
        self.enforce_budget = enforce_budget
        self.dispatcher, self.dependency_loader = dispatcher, dependency_loader
        self.process = self.connection = None
        self.lock = threading.Lock()
        self.owner_stop = threading.Event()
        self.owner = None
        self.group_ready = False
        self.guardian = self.guardian_connection = None
        self.reaping = set()
        self.max_response_bytes = response_limit()
        self.spawn_finished = threading.Event()
        self.compute_pid = None
        self.scratch_root = Path(tempfile.mkdtemp(prefix="flowcast-render-compute-"))
        scratch_stat = self.scratch_root.lstat()
        self.scratch_identity = (scratch_stat.st_dev, scratch_stat.st_ino)
        self.cleanup_thread = None

    @property
    def alive(self):
        with self.lock:
            return self.process is not None and self.process.is_alive()

    def start(self, timeout):
        context = multiprocessing.get_context("spawn")
        parent, child = context.Pipe()
        process = context.Process(
            target=compute_main,
            args=(
                child,
                self.enforce_budget,
                self.max_response_bytes,
                self.dispatcher,
                self.dependency_loader,
            ),
            name="visualization-compute",
        )
        with self.lock:
            self.connection, self.process = parent, process
        started, failures, results = threading.Event(), [], []
        deadline = time.monotonic() + timeout

        def own_process():
            # Linux 부모 종료 신호가 준비 스레드 종료에 반응하지 않도록 생성 스레드 유지
            try:
                if self.owner_stop.is_set():
                    raise RuntimeError("Visualization compute startup was cancelled.")
                process.start()
                self.compute_pid = process.pid
                child.close()
                if not parent.poll(max(0, deadline - time.monotonic())):
                    raise TimeoutError("Visualization compute startup timed out.")
                status, metadata = json.loads(parent.recv_bytes(self.max_response_bytes))
                if status != "ready":
                    raise RuntimeError(metadata["detail"])
                self.group_ready = True
                control, guard = context.Pipe()
                guardian = context.Process(
                    target=guard_group,
                    args=(
                        guard,
                        process.pid,
                        self.scratch_root,
                        self.scratch_identity,
                    ),
                    name="visualization-guardian",
                )
                with self.lock:
                    self.guardian_connection, self.guardian = control, guardian
                guardian.start()
                guard.close()
                if (
                    not control.poll(max(0, deadline - time.monotonic()))
                    or control.recv_bytes(1024) != b"ready"
                ):
                    raise TimeoutError("Visualization guardian startup timed out.")
                results.append(metadata)
            except Exception as error:
                failures.append(error)
            finally:
                self.compute_pid = process.pid
                child.close()
                self.spawn_finished.set()
                started.set()
            if failures or self.owner_stop.is_set():
                self.close()
            self.owner_stop.wait()

        self.owner = threading.Thread(target=own_process, name="visualization-compute-owner", daemon=True)
        self.owner.start()
        if not started.wait(max(0, deadline - time.monotonic())):
            self.close()
            raise TimeoutError("Visualization compute startup timed out.")
        try:
            if failures:
                raise failures[0]
            if not results:
                raise RuntimeError("Visualization compute startup was cancelled.")
            return results[0]
        except BaseException:
            self.close()
            raise

    def run(self, path, request, timeout):
        expired = threading.Event()

        def abort():
            expired.set()
            self.close()

        # 송수신 중에도 제한 시간이 지나면 계산 프로세스 종료
        timer = threading.Timer(timeout, abort)
        timer.daemon = True
        timer.start()
        try:
            connection = self.connection
            if connection is None or not self.alive:
                raise RuntimeError("Visualization compute process is unavailable.")
            connection.send((path, request))
            if not connection.poll(timeout):
                abort()
                raise TimeoutError("Visualization task timed out.")
            result = json.loads(connection.recv_bytes(self.max_response_bytes))
            if expired.is_set():
                raise TimeoutError("Visualization task timed out.")
            if (
                not isinstance(result, list)
                or len(result) != 2
                or type(result[0]) is not int
                or not 200 <= result[0] <= 599
                or not isinstance(result[1], dict)
            ):
                raise ValueError("Invalid visualization compute response.")
            return result
        except (OSError, EOFError, TypeError, ValueError):
            if expired.is_set():
                raise TimeoutError("Visualization task timed out.") from None
            raise RuntimeError("Visualization compute process exited unexpectedly.") from None
        finally:
            timer.cancel()
            timer.join()

    def _finish(self, process, attribute):
        if process.is_alive():
            if attribute not in self.reaping:
                self.reaping.add(attribute)

                def reap():
                    process.join()
                    with self.lock:
                        process.close()
                        if getattr(self, attribute) is process:
                            setattr(self, attribute, None)
                        self.reaping.discard(attribute)
                        self._cleanup_scratch()

                threading.Thread(target=reap, name="visualization-reaper", daemon=True).start()
        else:
            process.close()
            setattr(self, attribute, None)

    def _cleanup_scratch(self):
        """늦은 생성과 비동기 회수까지 끝난 세대의 임시 경로만 정리"""
        if not self.spawn_finished.is_set() and (self.process is not None or self.owner is not None):
            return
        for process in (self.process, self.guardian):
            if process is not None and process.pid is not None and process.is_alive():
                return
        if self.compute_pid is not None and not group_stopped(self.compute_pid):
            if self.cleanup_thread is None:
                # 보호 프로세스 생성 전 실패도 정확한 세대 경로의 지연 정리 소유권 유지
                self.cleanup_thread = threading.Thread(
                    target=cleanup_stopped_group,
                    args=(
                        self.compute_pid,
                        self.scratch_root,
                        self.scratch_identity,
                    ),
                    kwargs={"deferred": True},
                    name="visualization-scratch-reaper",
                    daemon=True,
                )
                self.cleanup_thread.start()
            return
        cleanup_scratch(self.scratch_root, self.scratch_identity)

    def close(self):
        with self.lock:
            process, connection = self.process, self.connection
            self.connection = None
            try:
                if self.spawn_finished.is_set() and process is not None and process.pid is not None:
                    # 전용 그룹만 종료하며 초기화 전 실패는 직접 자식만 회수
                    grouped = self.group_ready
                    with contextlib.suppress(ProcessLookupError):
                        grouped = grouped or os.getpgid(process.pid) == process.pid
                    if grouped:
                        with contextlib.suppress(ProcessLookupError):
                            os.killpg(process.pid, signal.SIGTERM)
                    elif process.is_alive():
                        process.terminate()
                    process.join(timeout=0.2)
                    if grouped:
                        with contextlib.suppress(ProcessLookupError):
                            os.killpg(process.pid, signal.SIGKILL)
                    elif process.is_alive():
                        process.kill()
                    process.join(timeout=2)
            finally:
                try:
                    if connection is not None:
                        connection.close()
                    if self.guardian_connection is not None:
                        self.guardian_connection.close()
                        self.guardian_connection = None
                    if self.spawn_finished.is_set() and self.guardian is not None:
                        if self.guardian.pid is not None:
                            self.guardian.join(timeout=2)
                            # 종료 확인과 임시 파일 정리를 수행하는 보호 프로세스는 회수 스레드에 위임
                        self._finish(self.guardian, "guardian")
                finally:
                    if self.spawn_finished.is_set() and process is not None:
                        self._finish(process, "process")
                    self._cleanup_scratch()
                    self.owner_stop.set()
        if (
            self.spawn_finished.is_set()
            and self.owner is not None
            and self.owner is not threading.current_thread()
        ):
            self.owner.join(timeout=2)
