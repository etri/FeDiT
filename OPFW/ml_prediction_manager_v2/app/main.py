from contextlib import asynccontextmanager
from html import escape as _escape
import logging
from pathlib import Path
import re as _re
import time as _time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse as _HTMLResponse, JSONResponse, FileResponse
from fastapi.openapi.docs import get_swagger_ui_html
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
    volumes,
)
from app.services import kubernetes_client, monitoring_service

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
    try:
        data_collection_service.shutdown_realtime_collections()
    except Exception as e:
        logger.exception(f"[lifespan] data collection shutdown failed: {e}")


app = FastAPI(
    title=settings.app_title,
    root_path="/prediction-manager",
    # The application is used through both the Kubeflow gateway
    # (/prediction-manager/docs) and a direct Kubernetes port-forward
    # (/docs).  FastAPI's stock Swagger endpoint always prepends root_path,
    # which makes the direct endpoint request a nonexistent
    # /prediction-manager/openapi.json.  The route below derives the prefix
    # from the browser URL instead.
    docs_url=None,
    lifespan=lifespan,
)


@app.get("/docs", include_in_schema=False)
async def standalone_api_docs() -> _HTMLResponse:
    """Serve Swagger UI with an OpenAPI URL valid for gateway and port-forward use."""
    page = get_swagger_ui_html(
        openapi_url="./openapi.json",
        title=f"{settings.app_title} - API documentation",
    )
    page_html = page.body.decode("utf-8")
    return _HTMLResponse(
        _re.sub(
            r"url:\\s*['\"]\\./openapi\\.json['\"],",
            'url: new URL("./openapi.json", window.location.href).href,',
            page_html,
            count=1,
        )
    )


def _standalone_platform_page(
    title: str,
    subtitle: str,
    tabs: list[str],
    empty_text: str,
    *,
    metrics: list[tuple[str, str]] | None = None,
    content: str | None = None,
) -> _HTMLResponse:
    tab_markup = "".join(
        f'<button class="tab" type="button" onclick="selectTab(this)">{_escape(tab)}</button>'
        for tab in tabs
    )
    metric_items = metrics or [
        ("Service", "Available"),
        ("Active resources", "0"),
        ("Last update", "Ready"),
    ]
    metric_markup = "".join(
        f'<div class="metric">{_escape(label)}<b>{_escape(value)}</b></div>'
        for label, value in metric_items
    )
    content_markup = content or f'<div class="empty" role="status">{_escape(empty_text)}</div>'
    html = f"""<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{_escape(title)}</title>
  <style>
    :root {{ color-scheme: light; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }}
    body {{ margin: 0; background: #f4f7fb; color: #172033; }}
    .shell {{ max-width: 1180px; margin: 0 auto; padding: 34px; }}
    .head {{ display:flex; justify-content:space-between; gap:24px; align-items:flex-start; }}
    h1 {{ margin:0 0 8px; font-size:28px; }}
    .subtitle {{ margin:0; color:#60708a; }}
    .status {{ border:1px solid #b9e6cf; background:#ecfbf3; color:#18794e; border-radius:999px; padding:8px 14px; font-size:13px; white-space:nowrap; }}
    .tabs {{ display:flex; gap:8px; margin:28px 0 16px; border-bottom:1px solid #dbe3ef; }}
    .tab {{ border:0; background:transparent; padding:12px 16px; color:#64748b; cursor:pointer; font-weight:600; }}
    .tab.active {{ color:#2563eb; border-bottom:2px solid #2563eb; }}
    .card {{ background:#fff; border:1px solid #dbe3ef; border-radius:12px; padding:24px; box-shadow:0 8px 24px rgba(30,64,175,.06); }}
    .empty {{ color:#64748b; padding:34px 12px; text-align:center; border:1px dashed #cbd5e1; border-radius:10px; }}
    .grid {{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:24px; }}
    .metric {{ background:#f8fafc; border-radius:10px; padding:16px; }}
    .metric b {{ display:block; font-size:22px; margin-top:7px; }}
    .endpoint-table {{ width:100%; border-collapse:collapse; }}
    .endpoint-table th, .endpoint-table td {{ text-align:left; padding:13px 10px; border-bottom:1px solid #e2e8f0; }}
    .endpoint-table th {{ color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em; }}
    .state {{ display:inline-block; border-radius:999px; padding:4px 9px; font-size:12px; font-weight:700; }}
    .state.ready {{ color:#18794e; background:#ecfbf3; }}
    .state.pending {{ color:#9a6700; background:#fff8c5; }}
    .refresh {{ float:right; border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; border-radius:7px; padding:7px 10px; cursor:pointer; }}
    @media(max-width:720px) {{ .shell {{ padding:18px; }} .head {{ display:block; }} .status {{ display:inline-block; margin-top:16px; }} .grid {{ grid-template-columns:1fr; }} }}
  </style>
</head>
<body>
  <main class="shell">
    <div class="head"><div><h1>{_escape(title)}</h1><p class="subtitle">{_escape(subtitle)}</p></div><div class="status">Service connected · standalone mode</div></div>
    <nav class="tabs" aria-label="{_escape(title)} sections">{tab_markup}</nav>
    <section class="card">
      <div class="grid">{metric_markup}</div>
      {content_markup}
    </section>
  </main>
  <script>function selectTab(button){{document.querySelectorAll('.tab').forEach(function(item){{item.classList.remove('active')}});button.classList.add('active')}}document.querySelector('.tab')?.classList.add('active');</script>
</body>
</html>"""
    return _HTMLResponse(html)


@app.get("/volumes/", include_in_schema=False)
async def standalone_volumes():
    return _HTMLResponse((Path(__file__).resolve().parent.parent / "static" / "volumes.html").read_text(encoding="utf-8"))


@app.get("/volumes/sandbox.js", include_in_schema=False)
async def volume_sandbox_script():
    return FileResponse(Path(__file__).resolve().parent.parent / "static" / "js" / "volumes-sandbox.js", media_type="application/javascript")


@app.get("/tensorboards/", include_in_schema=False)
async def standalone_tensorboards():
    return _standalone_platform_page(
        "TensorBoard",
        "Training metrics and experiment visualization",
        ["Scalars", "Graphs", "Media"],
        "No active TensorBoard run is available. Training runs will appear here when a run is started.",
    )


def _standalone_namespace(request: Request) -> str:
    """Return a namespace the current user is allowed to inspect in a sub-app."""
    default_namespace = get_user_namespace(request)
    requested = request.query_params.get("ns", "").strip()
    if not requested:
        return default_namespace
    accessible = {
        item.get("namespace")
        for item in get_user_accessible_namespaces(request)
        if item.get("namespace")
    }
    return requested if requested in accessible else default_namespace


@app.get("/kserve-endpoints/", include_in_schema=False)
async def standalone_kserve_endpoints(request: Request):
    """Show live InferenceService state after AutoML one-click serving."""
    namespace = _standalone_namespace(request)
    result = monitoring_service.get_kserve_endpoints(namespace=namespace)
    endpoints = sorted(result.get("endpoints", []), key=lambda item: item["name"])
    ready_count = sum(1 for endpoint in endpoints if endpoint.get("ready"))
    if result.get("error"):
        content = (
            '<div class="empty" role="alert">KServe 상태를 읽을 수 없습니다. '
            '클러스터 연결과 권한을 확인한 후 새로고침하십시오.</div>'
        )
        last_update = "Unavailable"
    elif not endpoints:
        content = (
            '<div class="empty" role="status">현재 이 네임스페이스에 배포된 '
            'KServe 엔드포인트가 없습니다. AutoML 결과에서 서빙을 실행하면 '
            '여기에 실제 배포 상태가 표시됩니다.</div>'
        )
        last_update = "Ready"
    else:
        rows = "".join(
            "<tr data-name=\"{name}\"><td><strong>{name}</strong></td>"
            "<td>{namespace}</td><td><span class=\"state {state_class}\">{state}</span></td></tr>".format(
                name=_escape(endpoint["name"]),
                namespace=_escape(endpoint["namespace"]),
                state_class="ready" if endpoint.get("ready") else "pending",
                state="Ready" if endpoint.get("ready") else "Not ready",
            )
            for endpoint in endpoints
        )
        content = (
            '<button class="refresh" type="button" onclick="window.location.reload()">새로고침</button>'
            '<table class="endpoint-table"><thead><tr><th>Endpoint</th><th>Namespace</th>'
            '<th>Status</th></tr></thead><tbody>'
            f"{rows}</tbody></table>"
        )
        last_update = "Live"
    return _standalone_platform_page(
        "KServe Endpoints",
        "Model serving endpoint status and inference operations",
        ["Endpoints", "Revisions", "Inference"],
        "",
        metrics=[
            ("Namespace", namespace),
            ("Active resources", str(len(endpoints))),
            ("Ready endpoints", f"{ready_count} · {last_update}"),
        ],
        content=content,
    )


@app.get("/pipeline/", include_in_schema=False)
@app.get("/pipeline", include_in_schema=False)
async def standalone_pipeline():
    return _standalone_platform_page(
        "Kubeflow Pipelines",
        "Pipeline definitions, experiments, runs, schedules, artifacts and executions",
        ["Pipelines", "Experiments", "Runs", "Recurring Runs", "Artifacts", "Executions"],
        "No pipeline run is currently registered. The full pipeline menu is available and ready for a Kubeflow Pipelines provider.",
    )


@app.api_route("/pipeline/{subpath:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], include_in_schema=False)
async def standalone_pipeline_api(subpath: str):
    return JSONResponse(
        {
            "items": [],
            "pipelines": [],
            "runs": [],
            "experiments": [],
            "message": "Kubeflow Pipelines is not connected in standalone mode.",
            "path": subpath,
        }
    )


@app.get('/healthz', include_in_schema=False)
async def healthz():
    return {
        'status': 'ok',
        'kubernetes_available': kubernetes_client.KUBERNETES_AVAILABLE,
    }


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
app.include_router(volumes.router, prefix="/api/volumes", tags=["volumes"])
app.include_router(volumes.router, prefix="/volumes/api", include_in_schema=False)
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
