"""애플리케이션 오류의 HTTP 응답 변환"""

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from modules.domain.errors import ApiError, WorkerError


def install_error_handlers(app, *, management):
    """입력 본문을 노출하지 않는 오류 응답 등록"""

    @app.exception_handler(ApiError)
    def service_error(request: Request, error: ApiError):
        return JSONResponse(status_code=error.status, content={"detail": error.detail})

    @app.exception_handler(RequestValidationError)
    def validation_error(request: Request, error: RequestValidationError):
        detail = [{key: item[key] for key in ("type", "loc", "msg")} for item in error.errors()]
        return JSONResponse(status_code=422, content={"detail": detail})

    if management:

        @app.exception_handler(WorkerError)
        def worker_error(request: Request, error: WorkerError):
            return JSONResponse(status_code=502, content={"detail": str(error)})
