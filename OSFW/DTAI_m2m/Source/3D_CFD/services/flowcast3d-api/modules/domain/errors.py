"""전송 방식과 독립적인 서비스 오류"""


class ApiError(Exception):
    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status = status
        self.detail = detail


class WorkerUnreachable(RuntimeError):
    """실행 큐나 추론 연결의 일시적인 실패로 재시도할 수 있는 오류"""


class WorkerError(RuntimeError):
    def __init__(self, status, detail):
        self.status = status
        self.detail = detail
        super().__init__(f"executor rejected {status}: {detail}")


class StoreError(ValueError):
    """저장소가 없거나 규격에 맞지 않음"""


class MeshError(ValueError):
    """메시 형상이 없거나 읽을 수 없음"""
