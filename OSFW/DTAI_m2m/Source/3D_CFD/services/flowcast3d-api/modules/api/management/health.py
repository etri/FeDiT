"""관리 API의 저장소와 작업자 상태 조회"""

from fastapi import Request
from fastapi.responses import JSONResponse

from modules.domain.errors import WorkerError, WorkerUnreachable


def health(request: Request):
    try:
        request.app.state.database.command("ping")
    except Exception:
        return JSONResponse(status_code=503, content={"status": "unavailable", "database": "unreachable"})
    services = request.app.state.services
    try:
        worker_health = request.app.state.jobs.worker.health()
        return {
            "status": "ok",
            "database": "ok",
            "executor": "ok",
            "worker": worker_health,
            "renderer": services.renderer_health(),
        }
    except (WorkerUnreachable, WorkerError):
        return {
            "status": "ok",
            "database": "ok",
            "executor": "unreachable",
            "worker": None,
            "renderer": services.renderer_health(),
        }
