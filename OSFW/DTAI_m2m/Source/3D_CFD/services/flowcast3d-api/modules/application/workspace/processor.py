import threading
from typing import Any, Callable

from modules.domain.errors import ApiError

WorkspaceProcessing = Callable[[str, dict[str, Any]], dict[str, Any]]


class WorkspaceProcessor:
    """카드 이미지보다 사용자 요청을 우선하는 단일 처리 잠금 관리"""

    def __init__(self, processor: WorkspaceProcessing):
        self.processor = processor
        self.lock = threading.Lock()

    def process(self, operation: str, params: dict[str, Any], *, background: bool = False) -> dict[str, Any]:
        if not self.lock.acquire(blocking=not background):
            raise ApiError(503, "Visualization worker is busy. Retry shortly.")
        try:
            return self.processor(operation, params)
        finally:
            self.lock.release()
