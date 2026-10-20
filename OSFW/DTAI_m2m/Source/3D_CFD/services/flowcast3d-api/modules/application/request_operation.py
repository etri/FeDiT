"""공개 작업의 요청 파일과 취소 가능한 외부 연결 수명 관리"""

import contextlib
import os
import tempfile
import threading
import time
from pathlib import Path

from modules.domain.errors import ApiError


class RequestOperation:
    """요청별 작업 디렉터리와 연결을 한 번만 회수"""

    def __init__(self, workflow, deadline=None):
        self.settings = workflow.settings
        self.decoder = workflow.decoder
        self.deadline = deadline or time.monotonic() + self.settings.request_timeout
        root = Path(
            getattr(self.settings, "public_temp_dir", None)
            or os.environ.get("FLOWCAST_PUBLIC_TEMP_DIR", Path(tempfile.gettempdir()) / "flowcast-public")
        )
        if not root.is_absolute() or any(path.is_symlink() for path in (root, *root.parents)):
            raise ApiError(503, "Public temporary directory must be absolute and contain no symbolic links.")
        root.mkdir(mode=0o700, parents=True, exist_ok=True)
        self.temporary = tempfile.TemporaryDirectory(prefix="request-", dir=root)
        self.directory = Path(self.temporary.name)
        self.services = workflow.services
        self.owns_services = getattr(self.services, "owns_client", False) is True
        self.phase = "input"
        self.closed = False
        self.cancelled = threading.Event()
        if self.owns_services:
            self.services = self.services.fork(self.cancelled, self.deadline)

    def cancel(self):
        """작업 프로세스에 취소를 알리고 추론 전용 HTTP 연결 종료"""
        self.cancelled.set()
        with contextlib.suppress(OSError):
            (self.directory / "cancel").touch()
        if self.phase == "model" and self.owns_services:
            self.services.close()

    def check_cancelled(self):
        if self.cancelled.is_set():
            raise ApiError(499, "Request was cancelled by the client.")
        if time.monotonic() >= self.deadline:
            raise ApiError(504, "Prediction request timed out.")

    def close(self):
        if self.closed:
            return
        self.closed = True
        try:
            if self.owns_services:
                self.services.close()
        finally:
            self.temporary.cleanup()
