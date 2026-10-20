import argparse
import contextlib
import logging
import os
import signal
import subprocess
import sys
import time
from contextlib import ExitStack, asynccontextmanager
from pathlib import Path

from fastapi import FastAPI

from modules.api.public.predict import router as predict_router
from modules.api.public.visualize import router as visualize_router
from modules.api.shared.access import install_public_access
from modules.api.shared.errors import install_error_handlers
from modules.application.prediction import StatelessWorkflow
from modules.infrastructure.formats.prediction import prediction_arrays
from modules.infrastructure.mongo.connection import MongoConnection
from modules.infrastructure.public_services import PublicServices
from modules.settings.management import ManagementSettings as Settings
from modules.settings.public import PublicSettings
from modules.settings.validation import env_port

__all__ = ["app", "public_app", "create_app"]

logger = logging.getLogger(__name__)
GRACEFUL_SHUTDOWN_TIMEOUT = 5
SERVICE_DIR = Path(__file__).resolve().parent


def create_app(settings=None, store=None, services=None, worker=None, *, public=False, job_repository=None):
    """공개 API와 관리 API의 자원 구성을 수명 주기에 연결"""

    @asynccontextmanager
    async def lifespan(app):
        # 공개 처리에 필요한 설정과 외부 연결 구성
        active_settings = settings or (PublicSettings.from_env() if public else Settings.from_env())
        if public and not active_settings.api_key:
            raise ValueError("FLOWCAST_API_KEY is required for the public API.")
        app.state.settings = active_settings
        with ExitStack() as cleanup:
            if not public:
                active_store = store or MongoConnection(active_settings)
                cleanup.callback(active_store.close)
            active_services = services or PublicServices(active_settings)
            cleanup.callback(active_services.close)
            app.state.services = active_services
            app.state.prediction_workflow = StatelessWorkflow(
                active_settings, active_services, decoder=prediction_arrays
            )

            # 관리 전용 저장소와 실행 자원 연결
            if not public:
                from modules.api.workspace.security import WorkspaceSessions
                from modules.application.housekeeping import Housekeeping
                from modules.application.ingest import IngestService
                from modules.application.jobs import JobService
                from modules.application.workspace.service import Workspace
                from modules.infrastructure.filesystem.uploads import Uploads
                from modules.infrastructure.formats.storage import FlowStorage
                from modules.infrastructure.memory.jobs import JobRepository
                from modules.infrastructure.mongo.cases import CaseRepository
                from modules.infrastructure.mongo.cleanup import prune_asset_blobs
                from modules.infrastructure.mongo.ingests import IngestRepository
                from modules.infrastructure.mongo.workspace import WorkspaceRepository
                from modules.infrastructure.renderer.workspace import WorkspaceRendererClient

                active_store.open()
                app.state.mongo_connection = active_store
                app.state.database = active_store.database
                data_dir = active_settings.case_data_dir or active_settings.data_dir
                repository = job_repository if job_repository is not None else JobRepository()
                if worker is None:
                    from modules.workers.execution.service import LocalExecutor

                    active_worker = LocalExecutor(
                        repository=repository, data_dir=data_dir, triton_url=active_settings.model_url
                    )
                else:
                    active_worker = worker
                cleanup.callback(active_worker.close)
                active_worker.start()
                app.state.cases = CaseRepository(data_dir, active_store.database, stores=FlowStorage())
                app.state.jobs = JobService(repository, app.state.cases, active_worker, data_dir)
                app.state.ingests = IngestService(
                    data_dir, app.state.cases, app.state.jobs, IngestRepository(active_store.database)
                )
                cleanup.callback(app.state.ingests.close)

                # Viewer 저장 경로와 처리 자원을 명시적으로 주입
                workspace_root = Path(
                    os.environ.get("FLOWCAST_WORKSPACE_DIR", "/var/lib/flowcast3d-api/workspace")
                ).resolve()
                for name in ("assets", "datasets", "predictions"):
                    (workspace_root / name).mkdir(parents=True, exist_ok=True)
                uploads = Uploads(workspace_root, active_store.database)
                workspace_renderer = WorkspaceRendererClient(active_settings.viewer_url, workspace_root)
                cleanup.callback(workspace_renderer.close)
                app.state.workspace = Workspace(
                    active_settings,
                    WorkspaceRepository(active_store.database),
                    app.state.cases,
                    app.state.jobs,
                    root=workspace_root,
                    uploads=uploads,
                    processor=workspace_renderer,
                )
                cleanup.callback(app.state.workspace.close)
                app.state.workspace_sessions = WorkspaceSessions(workspace_root)
                app.state.housekeeping = Housekeeping(uploads, prune_blobs=prune_asset_blobs)
                cleanup.callback(app.state.housekeeping.close)
                app.state.housekeeping.start()
            yield

    # HTTP 경로와 오류 응답 등록
    options = {"docs_url": None, "redoc_url": None, "openapi_url": None} if public else {}
    app = FastAPI(title="Flowcast3D", version="0.2.0", lifespan=lifespan, **options)
    app.state.settings = settings
    if public:
        install_public_access(app)
        app.include_router(predict_router, prefix="/v1")
        app.include_router(visualize_router, prefix="/v1")
    else:
        from modules.api.management.health import health
        from modules.api.router import router
        from modules.api.workspace.router import router as workspace_router

        app.include_router(router)
        app.include_router(workspace_router)
        app.add_api_route("/health", health, methods=["GET"])
    install_error_handlers(app, management=not public)
    return app


app = create_app()
public_app = create_app(public=True)


def commands(*, public_only=False):
    """포트 설정을 검증한 뒤 API 실행 명령 구성"""
    host = os.environ.get("FLOWCAST_API_BIND_HOST", "127.0.0.1")
    public_port = env_port("FLOWCAST_API_PORT", 8080)
    configured = [
        [
            sys.executable,
            "-m",
            "uvicorn",
            "main:public_app",
            "--host",
            host,
            "--port",
            str(public_port),
            "--timeout-graceful-shutdown",
            str(GRACEFUL_SHUTDOWN_TIMEOUT),
        ],
    ]
    if not public_only:
        management_host = os.environ.get("FLOWCAST_MANAGEMENT_BIND_HOST", "127.0.0.1")
        management_port = env_port("FLOWCAST_MANAGEMENT_PORT", 8082)
        if public_port == management_port:
            raise ValueError("FLOWCAST_API_PORT and FLOWCAST_MANAGEMENT_PORT must be different.")
        configured.append(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "main:app",
                "--host",
                management_host,
                "--port",
                str(management_port),
                "--workers",
                "1",
                "--timeout-graceful-shutdown",
                str(GRACEFUL_SHUTDOWN_TIMEOUT),
            ]
        )
    return configured


def run_servers(
    server_commands=None,
    shutdown_timeout=30.0,
    *,
    auxiliary_commands=None,
    restart_delay=1.0,
    public_only=False,
):
    """API 종료는 전파하고 렌더 작업 서버는 별도로 재시작"""
    active_commands = commands(public_only=public_only) if server_commands is None else server_commands
    if not active_commands or shutdown_timeout <= 0 or restart_delay <= 0:
        raise ValueError("Server commands and positive shutdown limits are required.")
    if auxiliary_commands is None:
        if server_commands is None:
            renderer_port = env_port("FLOWCAST_RENDERER_PORT", 8081)
            listener_ports = {int(command[command.index("--port") + 1]) for command in active_commands}
            if renderer_port in listener_ports:
                raise ValueError("FLOWCAST_RENDERER_PORT must differ from API listener ports.")
        auxiliary_commands = (
            []
            if server_commands is not None
            else [[sys.executable, str(SERVICE_DIR / "main.py"), "render-worker"]]
        )
    processes = []
    auxiliary = []
    stopping = False
    exit_code = 0
    previous_handlers = {}

    def request_stop(signum, frame):
        nonlocal stopping
        stopping = True

    try:
        # 공개 서버와 관리 서버는 기존 종료 정책 유지
        for signum in (signal.SIGTERM, signal.SIGINT):
            previous_handlers[signum] = signal.signal(signum, request_stop)
        for command in active_commands:
            if stopping:
                break
            processes.append(subprocess.Popen(command, cwd=SERVICE_DIR if server_commands is None else None))
        for command in auxiliary_commands:
            if stopping:
                break
            try:
                process = subprocess.Popen(command, cwd=SERVICE_DIR, start_new_session=True)
            except OSError:
                logger.exception("Auxiliary worker could not start; retrying.")
                process = None
            auxiliary.append(
                {
                    "command": command,
                    "process": process,
                    "next_start": time.monotonic() + restart_delay,
                    "delay": restart_delay,
                }
            )

        # 보조 작업 프로세스의 실패는 API 서비스와 분리
        while not stopping:
            for process in processes:
                status = process.poll()
                if status is not None:
                    exit_code = status if status > 0 else 1
                    logger.error("API child process exited with status %s.", status)
                    stopping = True
                    break
            for item in auxiliary:
                process = item["process"]
                if process is not None and process.poll() is not None:
                    logger.error("Auxiliary worker exited with status %s; restarting.", process.returncode)
                    process.wait()
                    # 남아 있는 렌더링 또는 세션 자식도 같은 그룹에서 회수
                    with contextlib.suppress(ProcessLookupError):
                        os.killpg(process.pid, signal.SIGKILL)
                    item["process"] = None
                    item["next_start"] = time.monotonic() + item["delay"]
                    item["delay"] = min(30.0, item["delay"] * 2)
                if not stopping and item["process"] is None and time.monotonic() >= item["next_start"]:
                    try:
                        item["process"] = subprocess.Popen(
                            item["command"], cwd=SERVICE_DIR, start_new_session=True
                        )
                    except OSError:
                        logger.exception("Auxiliary worker restart failed.")
                        item["next_start"] = time.monotonic() + item["delay"]
                        item["delay"] = min(30.0, item["delay"] * 2)
            if not stopping:
                time.sleep(0.1)
    finally:
        # 종료 시 프로세스 그룹과 모든 직접 자식 회수
        auxiliary_processes = [item["process"] for item in auxiliary if item["process"] is not None]
        for process in auxiliary_processes:
            with contextlib.suppress(ProcessLookupError):
                os.killpg(process.pid, signal.SIGTERM)
        for process in processes:
            if process.poll() is None:
                with contextlib.suppress(ProcessLookupError):
                    process.terminate()
        deadline = time.monotonic() + shutdown_timeout
        for process in [*processes, *auxiliary_processes]:
            try:
                process.wait(timeout=max(0.0, deadline - time.monotonic()))
            except subprocess.TimeoutExpired:
                with contextlib.suppress(ProcessLookupError):
                    if process in auxiliary_processes:
                        os.killpg(process.pid, signal.SIGKILL)
                    else:
                        process.kill()
                process.wait()
        for signum, handler in previous_handlers.items():
            signal.signal(signum, handler)
    return exit_code


def main(argv: list[str] | None = None) -> int:
    from modules.visualization.rendering.settings import PRESETS
    from modules.workers.visualization import runtime

    # 명령별 입력과 내보내기 옵션 등록
    parser = argparse.ArgumentParser(
        prog="python main.py", description="Run APIs, visualization workers, and exports"
    )
    commands = parser.add_subparsers(dest="command")
    commands.add_parser("public-server", help="run only the stateless public API and visualization worker")
    command = commands.add_parser(
        "render-worker", aliases=["render-server"], help="run the loopback visualization worker"
    )
    command.set_defaults(run=runtime.render_server)
    command = commands.add_parser("prepare-mesh", help="build case mesh tiles and detail levels")
    command.add_argument("case_dir", help="case namespace or temporary asset cache")
    command.add_argument("--workers", type=int, default=4, help="processes for simplification")
    command.add_argument(
        "--textures",
        action="store_true",
        help="bake photo textures onto the simplified mesh",
    )
    command.set_defaults(run=runtime.prepare_mesh)
    command = commands.add_parser("render", help="render a PNG with reproduction settings")
    command.add_argument(
        "--case", dest="case_id", required=True, help="case ID under FLOWCAST_DATA_DIR/cases"
    )
    command.add_argument("--result", help="logical Zarr result path; omitted for the case input field")
    command.add_argument(
        "--settings", dest="settings_file", help="saved camera and layer settings (SceneSettings JSON)"
    )
    command.add_argument("--preset", choices=PRESETS, default="plume")
    command.add_argument("--frame", type=int, help="frame index; defaults to the first prediction")
    command.add_argument(
        "--texture", action="store_true", help="use photo textures prepared with prepare-mesh --textures"
    )
    command.add_argument("--release-start", type=float, help="frame position where virtual release starts")
    command.add_argument(
        "--output", required=True, help="PNG export name for image and reproduction metadata in GridFS"
    )
    command.add_argument("--width", type=int, default=3840)
    command.add_argument("--height", type=int, default=2160)
    command.set_defaults(run=runtime.render)
    command = commands.add_parser("animate", help="export MP4 or GIF, final PNG and reproduction JSON")
    command.add_argument("--case", dest="case_id", required=True)
    command.add_argument("--result")
    command.add_argument("--settings", dest="settings_file")
    command.add_argument("--preset", choices=PRESETS, default="plume")
    command.add_argument("--frame-start", type=float)
    command.add_argument("--frame-end", type=float)
    command.add_argument("--frame-step", type=float, default=1.0)
    command.add_argument("--release-start", type=float)
    command.add_argument("--fps", type=float, default=10)
    command.add_argument("--width", type=int, default=1280)
    command.add_argument("--height", type=int, default=720)
    command.add_argument(
        "--output", required=True, help="export name; the .mp4 or .gif suffix picks the format"
    )
    command.add_argument("--work-dir", help="frame directory; defaults to the system temporary directory")
    command.add_argument("--progress", action="store_true", help="write progress as JSON lines")
    command.set_defaults(run=runtime.animate)

    # 인수가 없으면 통합 서버를 실행하고 하위 명령은 개별 처리
    args = parser.parse_args(argv)
    if args.command in (None, "public-server", "render-worker", "render-server"):
        logging.basicConfig(level=logging.INFO)
    if args.command is None:
        return run_servers()
    if args.command == "public-server":
        return run_servers(public_only=True)
    try:
        args.run(args)
    except (ValueError, OSError, MemoryError) as error:
        parser.exit(2, f"{error}\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
