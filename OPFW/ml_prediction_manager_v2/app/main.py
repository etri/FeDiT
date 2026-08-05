from contextlib import asynccontextmanager
import logging
from pathlib import Path
import re as _re
import time as _time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse as _HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.auth import (
    get_user_email,
    get_user_namespace,
    is_admin,
    get_user_accessible_namespaces,
)
from app.routers import (
    images,
    containers,
    dashboard,
    admin,
    automl,
    models,
    datasets,
    nifi,
    tenant_dashboards,
    monitoring,
    data_collection,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prediction-manager")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    from app.services import automl_service, data_collection_service
    try:
        automl_service.start_scheduler()
        logger.info("[lifespan] AutoML scheduler started")
    except Exception as e:
        logger.exception(f"[lifespan] scheduler start failed: {e}")
    try:
        resumed = data_collection_service.resume_realtime_collections()
        logger.info("[lifespan] resumed %s data collection session(s)", resumed)
    except Exception as e:
        logger.exception(f"[lifespan] data collection resume failed: {e}")
    yield
    data_collection_service.shutdown_realtime_collections()


app = FastAPI(
    title=settings.app_title,
    root_path="/prediction-manager",
    lifespan=lifespan,
)


_VALIDATION_FIELD_LABELS = {
    "name": "이름",
    "task": "학습 유형",
    "dataset_path": "데이터셋 경로",
    "target_column": "타깃 컬럼",
    "models": "모델 후보",
    "num_trials": "시도 횟수",
    "timeout_minutes": "제한 시간(분)",
    "metric": "평가 지표",
    "test_size": "테스트 비율",
    "random_state": "랜덤 시드",
    "cpu_per_trial": "Trial당 CPU",
    "gpu_per_trial": "Trial당 GPU",
    "memory_per_trial_gb": "Trial당 메모리(GB)",
    "top_n": "저장 모델 수",
}


def _validation_label(loc) -> str:
    parts = [str(p) for p in (loc or []) if str(p) not in {"body", "query", "path"}]
    if not parts:
        return "입력값"
    key = parts[-1]
    return _VALIDATION_FIELD_LABELS.get(key, key)


def _format_validation_error(err: dict) -> str:
    label = _validation_label(err.get("loc"))
    err_type = str(err.get("type") or "")
    ctx = err.get("ctx") or {}
    if "greater_than_equal" in err_type or err_type.endswith("ge"):
        return f"{label}: {ctx.get('ge')} 이상으로 입력해야 합니다."
    if "less_than_equal" in err_type or err_type.endswith("le"):
        return f"{label}: {ctx.get('le')} 이하로 입력해야 합니다."
    if "greater_than" in err_type or err_type.endswith("gt"):
        return f"{label}: {ctx.get('gt')}보다 크게 입력해야 합니다."
    if "less_than" in err_type or err_type.endswith("lt"):
        return f"{label}: {ctx.get('lt')}보다 작게 입력해야 합니다."
    if "missing" in err_type:
        return f"{label}: 필수 입력값입니다."
    if "literal_error" in err_type:
        expected = ctx.get("expected")
        return f"{label}: 지원하는 값만 선택해야 합니다{f' ({expected})' if expected else ''}."
    if "float" in err_type or "int" in err_type:
        return f"{label}: 숫자로 입력해야 합니다."
    return f"{label}: 입력값이 올바르지 않습니다."


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    messages = []
    for err in exc.errors():
        msg = _format_validation_error(err)
        if msg not in messages:
            messages.append(msg)
    detail = "입력값을 확인하세요: " + "; ".join(messages or ["요청 형식이 올바르지 않습니다."])
    return JSONResponse(status_code=422, content={"detail": detail})

app.include_router(images.router, prefix="/api/images", tags=["images"])
app.include_router(containers.router, prefix="/api/containers", tags=["containers"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(automl.router, prefix="/api/automl", tags=["automl"])
app.include_router(models.router, prefix="/api/models", tags=["models"])
app.include_router(datasets.router, prefix="/api/datasets", tags=["datasets"])
app.include_router(nifi.router, prefix="/api/nifi", tags=["nifi"])
app.include_router(tenant_dashboards.router, prefix="/api/dashboards", tags=["dashboards"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["monitoring"])
app.include_router(data_collection.router, prefix="/api/data-collection", tags=["data-collection"])
app.include_router(data_collection.devices_router, prefix="/api/devices", tags=["devices"])


@app.get("/api/user-info")
async def user_info(request: Request):
    email = get_user_email(request)
    ns = get_user_namespace(request)
    admin = is_admin(request)
    accessible = get_user_accessible_namespaces(request)
    logger.info(f"[AUTH] user-info: email={email} ns={ns} admin={admin}")
    return {
        "email": email,
        "namespace": ns,
        "is_admin": admin,
        "accessible_namespaces": accessible,
    }


static_dir = Path(__file__).parent.parent / "static"

_APP_VERSION = str(int(_time.time()))


@app.get("/", include_in_schema=False)
async def root():
    html = (static_dir / "index.html").read_text(encoding="utf-8")
    html = _re.sub(r'(\.(?:js|css))(")', rf'\1?v={_APP_VERSION}\2', html)
    return _HTMLResponse(
        content=html,
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
    )


app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
