from __future__ import annotations

import json
import logging
import math
import os
import re
import shutil
import signal
import stat
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import gettempdir, mkdtemp

from modules.visualization.media.public import WORKSPACE_KEY, RenderWorkspace
from modules.workers.visualization.compute import ComputeProcess

LOGGER = logging.getLogger(__name__)


def _public_cancel_path(params):
    """검증한 공개 요청 임시 경로에서만 취소 표식 확인"""
    value = params.get("input_path") if isinstance(params, dict) else None
    if not isinstance(value, str) or not value or "\x00" in value:
        raise ValueError("Public operation input_path must be an absolute temporary file path.")
    root = Path(os.environ.get("FLOWCAST_PUBLIC_TEMP_DIR", str(Path(gettempdir()) / "flowcast-public")))
    path = Path(value)
    if (
        not root.is_absolute()
        or ".." in root.parts
        or not path.is_absolute()
        or ".." in path.parts
        or any(parent.is_symlink() for parent in (path, *path.parents))
    ):
        raise ValueError("Public operation paths cannot contain traversal or symbolic links.")
    try:
        relative = path.relative_to(root)
    except ValueError as error:
        raise ValueError(
            "Public operation input_path must belong to its request temporary directory."
        ) from error
    if (
        len(relative.parts) != 2
        or re.fullmatch(r"request-[A-Za-z0-9_-]+", relative.parts[0]) is None
        or not path.is_file()
    ):
        raise ValueError("Public operation input_path must belong to its request temporary directory.")
    return path.parent / "cancel"


def _remove_render_workspace(directory, root, identities):
    """부모가 만든 세대와 요청 디렉터리의 inode가 같을 때만 회수"""
    try:
        for path, identity in zip((root, directory), identities):
            current = path.lstat()
            if not stat.S_ISDIR(current.st_mode) or (current.st_dev, current.st_ino) != identity:
                LOGGER.warning("Animation workspace identity changed; preserving the directory.")
                return
        shutil.rmtree(directory)
    except FileNotFoundError:
        return
    except OSError:
        # 완료 응답을 보존하고 남은 경로는 세대 종료 시 보호 프로세스가 회수
        LOGGER.warning(
            "Animation workspace cleanup was deferred to its generation guardian: %s",
            directory,
            exc_info=True,
        )


def timeout_setting(name, default):
    try:
        value = float(os.environ.get(name, str(default)))
    except ValueError:
        raise ValueError(f"{name} must be a number.") from None
    if not math.isfinite(value) or not 0 < value <= 86400:
        raise ValueError(f"{name} must be greater than 0 and at most 86400 seconds.")
    return value


def request_limit():
    from modules.infrastructure.formats.prediction import prediction_size_limit

    # 공개 배열의 요청 크기와 작업자 본문 한도를 함께 제한
    default = 4 * ((prediction_size_limit() + 2) // 3) + 2 * 1024 * 1024
    try:
        value = int(os.environ.get("FLOWCAST_VIEWER_MAX_REQUEST_BYTES", str(default)))
    except ValueError:
        raise ValueError("FLOWCAST_VIEWER_MAX_REQUEST_BYTES must be an integer.") from None
    if not 0 < value <= 1024 * 1024 * 1024:
        raise ValueError("FLOWCAST_VIEWER_MAX_REQUEST_BYTES must be between 1 and 1073741824.")
    return value


class WorkerServer(ThreadingHTTPServer):
    """작업 하나만 수락하고 상태 조회는 별도 처리"""

    daemon_threads = True

    def __init__(
        self,
        address,
        handler=None,
        *,
        compute_factory=ComputeProcess,
        render_timeout=None,
        process_timeout=None,
        startup_timeout=None,
    ):
        self.admission = threading.BoundedSemaphore(1)
        self.compute_factory = compute_factory
        self.compute = None
        self.render_timeout = (
            timeout_setting("FLOWCAST_RENDER_TASK_TIMEOUT", 300) if render_timeout is None else render_timeout
        )
        self.process_timeout = (
            timeout_setting("FLOWCAST_PROCESS_TASK_TIMEOUT", 3600)
            if process_timeout is None
            else process_timeout
        )
        self.startup_timeout = (
            timeout_setting("FLOWCAST_RENDER_STARTUP_TIMEOUT", 60)
            if startup_timeout is None
            else startup_timeout
        )
        for value in (self.render_timeout, self.process_timeout, self.startup_timeout):
            if not math.isfinite(value) or not 0 < value <= 86400:
                raise ValueError("Visualization timeouts must be greater than 0 and at most 86400 seconds.")
        self.max_request_bytes = request_limit()
        self.state_lock = threading.RLock()
        self.stopping = threading.Event()
        self.preparing = False
        self.enforce_budget = False
        self.state = "starting"
        self.ready = False
        self.dependency_error = None
        self.heap_mb = None
        self.pyvista_version = None
        super().__init__(address, handler or Handler)

    def prepare(self, *, enforce_budget=False):
        with self.state_lock:
            if self.stopping.is_set() or self.preparing:
                return
            self.preparing = True
            self.enforce_budget = enforce_budget
            previous = self.compute
            compute = self.compute_factory(enforce_budget=enforce_budget)
            self.compute = compute
        try:
            if previous is not None:
                previous.close()
            metadata = compute.start(self.startup_timeout)
            with self.state_lock:
                if not self.stopping.is_set():
                    self.pyvista_version = metadata["pyvista"]
                    self.heap_mb = metadata.get("heapLimitMiB")
                    self.ready, self.state, self.dependency_error = True, "ready", None
        except Exception as error:
            with self.state_lock:
                self.ready, self.state = False, "recovering"
                self.dependency_error = (
                    str(error)
                    if isinstance(error, (ValueError, RuntimeError, TimeoutError))
                    else "Visualization dependencies are unavailable."
                )
            LOGGER.exception("Visualization dependencies are unavailable.")
        finally:
            with self.state_lock:
                self.preparing = False
            if self.stopping.is_set():
                compute.close()

    def recover(self):
        with self.state_lock:
            if self.stopping.is_set() or self.preparing:
                return
            self.ready, self.state = False, "recovering"
        threading.Thread(target=lambda: self.prepare(enforce_budget=self.enforce_budget), daemon=True).start()

    def health(self):
        with self.state_lock:
            if self.ready and (self.compute is None or not self.compute.alive):
                self.ready, self.state = False, "recovering"
            ready = self.ready
            payload = {"status": self.state, "pyvista": self.pyvista_version, "heapLimitMiB": self.heap_mb}
            if not ready:
                payload["detail"] = self.dependency_error or "Visualization worker is recovering."
        if not ready and self.state == "recovering":
            self.recover()
        return (200 if ready else 503), payload

    def execute(self, path, request):
        if not isinstance(request, dict) or WORKSPACE_KEY in request:
            raise ValueError("Visualization request contains an invalid or reserved field.")
        public_render = path == "/process" and request.get("operation") == "render_public_prediction"
        public_operation = path == "/process" and request.get("operation") in {
            "prepare_public_prediction",
            "render_public_prediction",
        }
        params = request.get("params", {})
        options = params.get("options", {}) if isinstance(params, dict) else {}
        if public_render and (
            not isinstance(params, dict)
            or WORKSPACE_KEY in params
            or isinstance(options, dict)
            and WORKSPACE_KEY in options
        ):
            raise ValueError("Visualization request contains an invalid or reserved field.")
        cancel_path = _public_cancel_path(params) if public_operation else None
        with self.state_lock:
            if not self.ready or self.compute is None:
                return 503, {"detail": "Visualization worker is recovering."}
            self.state = "busy"
            compute = self.compute
        workspace, identities, completed = None, None, False
        cancelled, stop_watching = threading.Event(), threading.Event()
        watcher = None
        try:
            if cancel_path is not None:
                directory = cancel_path.parent.stat()
                identity = (directory.st_dev, directory.st_ino)

                def watch_cancellation():
                    while not stop_watching.is_set():
                        try:
                            current = cancel_path.parent.lstat()
                            changed = (
                                not stat.S_ISDIR(current.st_mode)
                                or (current.st_dev, current.st_ino) != identity
                            )
                            marked = cancel_path.is_file() and not cancel_path.is_symlink()
                        except FileNotFoundError:
                            changed, marked = True, False
                        if changed or marked:
                            cancelled.set()
                            compute.close()
                            self.recover()
                            return
                        stop_watching.wait(0.05)

                # 연결 중단 표식을 확인하는 스레드는 해당 계산 세대만 종료
                watcher = threading.Thread(
                    target=watch_cancellation, name="public-operation-cancellation", daemon=True
                )
                watcher.start()
            # 삭제 경로는 HTTP 본문이 아니라 현재 계산 세대의 전용 루트에서 생성
            animated = public_render and isinstance(options, dict) and options.get("format") in ("gif", "mp4")
            if animated:
                root = getattr(compute, "scratch_root", None)
                if not isinstance(root, Path) or root.is_symlink() or not root.is_dir():
                    raise RuntimeError("Animation scratch workspace is unavailable.")
                generation = root.lstat()
                workspace = RenderWorkspace(Path(mkdtemp(prefix="render-", dir=root)))
                owned = workspace.directory.lstat()
                identities = ((generation.st_dev, generation.st_ino), (owned.st_dev, owned.st_ino))
                request = {**request, WORKSPACE_KEY: workspace}
            timeout = self.render_timeout if public_render else self.process_timeout
            result = compute.run(path, request, timeout)
            if cancelled.is_set():
                return 409, {"detail": "Public operation was cancelled."}
            completed = True
            return result
        except TimeoutError:
            compute.close()
            if cancelled.is_set():
                return 409, {"detail": "Public operation was cancelled."}
            self.recover()
            return 504, {"detail": "Visualization task timed out."}
        except RuntimeError as error:
            compute.close()
            if cancelled.is_set():
                return 409, {"detail": "Public operation was cancelled."}
            self.recover()
            return 503, {"detail": str(error)}
        finally:
            stop_watching.set()
            if watcher is not None:
                watcher.join()
            try:
                if workspace is not None:
                    if completed:
                        # 정상 응답은 인코더가 종료된 뒤 정확한 요청 디렉터리만 회수
                        _remove_render_workspace(workspace.directory, root, identities)
                    else:
                        # 강제 종료 경로의 정리는 그룹 종료를 확인하는 guardian에 위임
                        compute.close()
            finally:
                with self.state_lock:
                    if self.ready and self.state == "busy":
                        self.state = "ready"

    def server_close(self):
        self.stopping.set()
        with self.state_lock:
            self.ready, self.state = False, "recovering"
            compute = self.compute
        if compute is not None:
            compute.close()
        super().server_close()


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def send_json(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.close_connection = True
        self.wfile.write(data)

    def do_GET(self):
        if self.path != "/health":
            self.send_json(404, {"detail": "Requested path was not found."})
        else:
            self.send_json(*self.server.health())

    def do_POST(self):
        if self.path != "/process":
            self.send_json(404, {"detail": "Requested path was not found."})
            return
        if not self.server.ready:
            self.send_json(
                503, {"detail": self.server.dependency_error or "Visualization worker is starting."}
            )
            return
        if not self.server.admission.acquire(blocking=False):
            self.send_json(503, {"detail": "Visualization worker is busy."})
            return
        status, payload = 200, None
        try:
            # 요청 크기와 읽기 시간을 제한한 뒤 순차 실행
            self.connection.settimeout(30)
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= self.server.max_request_bytes:
                raise ValueError("Visualization request size is outside the allowed range.")
            data = self.rfile.read(length)
            if len(data) != length:
                raise ValueError("Visualization request body is incomplete.")
            request = json.loads(data.decode("utf-8"))
            status, payload = self.server.execute(self.path, request)
            json.dumps(payload, ensure_ascii=False, allow_nan=False).encode("utf-8")
        except FileNotFoundError as error:
            status, payload = 404, {"detail": str(error)}
        except MemoryError as error:
            status, payload = 413, {"detail": str(error) or "Visualization memory limit exceeded."}
        except (ValueError, TypeError, UnicodeError) as error:
            status, payload = 400, {"detail": str(error)}
        except RuntimeError as error:
            status, payload = 503, {"detail": str(error)}
        except (BrokenPipeError, ConnectionResetError):
            LOGGER.info("Visualization client disconnected.")
            return
        except Exception:
            LOGGER.exception("Visualization failed.")
            status, payload = 500, {"detail": "Visualization failed."}
        finally:
            # 응답을 받은 다음 요청이 완료된 작업과 충돌하지 않도록 슬롯 회수
            self.server.admission.release()
        try:
            self.send_json(status, payload)
        except (BrokenPipeError, ConnectionResetError):
            LOGGER.info("Visualization client disconnected.")

    def log_message(self, format, *args):
        LOGGER.info(format, *args)


def serve():
    # 외부 인터페이스에 작업 서버를 노출하지 않음
    address = ("127.0.0.1", int(os.environ.get("FLOWCAST_RENDERER_PORT", "8081")))
    with WorkerServer(address) as server:
        threading.Thread(target=lambda: server.prepare(enforce_budget=True), daemon=True).start()

        def stop(number, frame):
            threading.Thread(target=server.shutdown, daemon=True).start()

        for number in (signal.SIGTERM, signal.SIGINT):
            signal.signal(number, stop)
        LOGGER.info("Visualization worker listening on %s:%s", *address)
        server.serve_forever(poll_interval=0.2)
