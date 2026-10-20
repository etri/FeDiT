from pathlib import Path
from typing import Any

from modules.application.ports.workspace import WorkspaceRepository, WorkspaceUploads
from modules.application.workspace.assets import AssetService
from modules.application.workspace.contracts import (
    AnalysisRequest,
    DispersionRequest,
    DispersionScenarioRequest,
    PredictRequest,
    Register,
    SceneRequest,
    ServerRegister,
)
from modules.application.workspace.datasets import DatasetService
from modules.application.workspace.dispersion import DispersionService
from modules.application.workspace.jobs import JobService
from modules.application.workspace.jobs_store import TaskStore
from modules.application.workspace.processor import WorkspaceProcessing, WorkspaceProcessor
from modules.application.workspace.registration import RegistrationService
from modules.application.workspace.runtime import WorkspaceRuntime
from modules.application.workspace.scenarios import ScenarioService


class Workspace:
    """Viewer 기능 서비스를 조립하고 공유 자원의 종료 순서 관리"""

    def __init__(
        self,
        settings,
        repository: WorkspaceRepository,
        cases,
        jobs,
        *,
        root: Path,
        uploads: WorkspaceUploads,
        processor: WorkspaceProcessing,
    ):
        self.runtime = WorkspaceRuntime(settings, repository, cases, jobs, root=root, uploads=uploads)
        self.processor = WorkspaceProcessor(processor)
        self.tasks = TaskStore(self.runtime)
        self.datasets = DatasetService(self.runtime, self.processor)
        self.registrations = RegistrationService(self.runtime, self.datasets, self.tasks)
        try:
            # 원본 등록 복구가 끝난 뒤 중단된 실행 상태를 반영
            self.registrations.recover()
            self.runtime.repository.recover_incomplete()
        except BaseException:
            self.runtime.close()
            raise
        self.dispersions = DispersionService(
            self.runtime, self.datasets, self.registrations, self.tasks, self.processor
        )
        self.jobs = JobService(self.runtime, self.registrations, self.dispersions, self.tasks)
        self.scenarios = ScenarioService(self.runtime, self.datasets, self.jobs, self.dispersions)
        self.assets = AssetService(self.runtime, self.datasets, self.processor)

    @property
    def root(self) -> Path:
        return self.runtime.root

    @property
    def uploads(self) -> WorkspaceUploads:
        return self.runtime.uploads

    def close(self) -> None:
        self.scenarios.close()
        self.runtime.close()

    def source(self, dataset_id: str, result_id: str | None = None) -> dict[str, Any]:
        return self.datasets.source(dataset_id, result_id)

    def dataset(self, dataset_id: str, result_id: str | None = None) -> dict[str, Any]:
        return self.datasets.get(dataset_id, result_id)

    def rename_dataset(self, dataset_id: str, title: str) -> dict[str, Any]:
        return self.datasets.rename(dataset_id, title)

    def list_datasets(self) -> dict[str, Any]:
        return self.datasets.list()

    def register(self, body: Register, owner):
        return self.registrations.register(body, owner)

    def list_sources(self):
        return self.registrations.list_sources()

    def register_server(self, body: ServerRegister):
        return self.registrations.register_server(body)

    def list_jobs(self):
        return self.jobs.list()

    def cancel(self, job_id):
        return self.jobs.cancel(job_id)

    def retry(self, job_id):
        return self.jobs.retry(job_id)

    def predict(self, body: PredictRequest):
        return self.jobs.predict(body)

    def selection(self, body: SceneRequest | AnalysisRequest, operation: str) -> dict[str, Any]:
        return self.assets.selection(body, operation)

    def thumbnail(self, dataset_id):
        return self.assets.thumbnail(dataset_id)

    def asset(self, name):
        return self.assets.get(name)

    def dispersion(self, body: DispersionRequest, *, context=None):
        return self.dispersions.create(body, context=context)

    def scenario(self, scenario_id):
        return self.scenarios.get(scenario_id)

    def list_scenarios(self, dataset_id=None):
        return self.scenarios.list(dataset_id)

    def create_scenario(self, body: DispersionScenarioRequest):
        return self.scenarios.create(body)

    def cancel_scenario(self, scenario_id):
        return self.scenarios.cancel(scenario_id)

    def retry_scenario(self, scenario_id, selected=None):
        return self.scenarios.retry(scenario_id, selected)

    def get_state(self) -> dict[str, Any]:
        return self.runtime.repository.get_state()

    def save_state(self, value: dict[str, Any]) -> None:
        self.runtime.repository.save_state(value)
