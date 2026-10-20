import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from modules.application.ports.workspace import WorkspaceRepository, WorkspaceUploads


class WorkspaceRuntime:
    """작업 서비스가 공유하는 저장소와 실행 자원의 수명 관리"""

    def __init__(
        self, settings, repository: WorkspaceRepository, cases, jobs, *, root: Path, uploads: WorkspaceUploads
    ):
        self.settings = settings
        self.cases = cases
        self.prediction_jobs = jobs
        self.repository = repository
        self.root = Path(root).resolve()
        for name in ("assets", "datasets", "predictions"):
            (self.root / name).mkdir(parents=True, exist_ok=True)
        self.uploads = uploads

        # 작업 취소 세대와 결과 게시를 동일한 잠금으로 보호
        self.dispersion_lock = threading.RLock()
        self.prediction_lock = threading.Lock()
        self.cancellations = {}
        self.scenario_wakeup = threading.Event()
        self.executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="workspace")

    def close(self):
        self.executor.shutdown(wait=False, cancel_futures=True)
