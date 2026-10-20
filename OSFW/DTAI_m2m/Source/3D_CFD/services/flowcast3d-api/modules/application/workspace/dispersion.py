import logging
import math
import secrets
import shutil
import threading
import time
from pathlib import Path

from modules.application.workspace.values import public_job
from modules.domain.errors import ApiError
from modules.domain.schemas.context import source_context

log = logging.getLogger(__name__)


class DispersionService:
    """가상 농도 실행과 미공개 결과의 수명 관리"""

    def __init__(self, runtime, datasets, registrations, tasks, processor):
        self.runtime = runtime
        self.datasets = datasets
        self.registrations = registrations
        self.tasks = tasks
        self.processor = processor

    def create(self, body, *, context=None):
        source = self.datasets.source(body.datasetId, body.resultId)
        descriptor = self.datasets.get(body.datasetId, body.resultId)
        available = {field["id"]: field["unit"] for field in descriptor["fields"]}
        if any(available.get(f"velocity_{axis}") != "m/s" for axis in "xyz"):
            raise ApiError(422, "Dispersion requires velocity_x, velocity_y, and velocity_z in m/s.")
        if descriptor.get("gridKind") != "uniform":
            raise ApiError(422, "Dispersion requires a uniform velocity grid.")
        dataset_id, job_id = secrets.token_hex(16), secrets.token_hex(16)
        name = f"Virtual concentration — {descriptor['name']}"
        result_descriptor = {
            "id": dataset_id,
            "name": name,
            "version": dataset_id,
            "fields": [],
            "times": [],
            "results": [],
            "bounds": descriptor["bounds"],
            "capabilities": {},
            "validation": [],
        }
        context = context or {}
        if context.get("sourceRef"):
            context["sourceRef"] = {**source_context(source).get("sourceRef", {}), **context["sourceRef"]}
        result_descriptor.update(context)
        record = self.tasks.create(
            job_id,
            name,
            dataset_id,
            "dispersion",
            source=source,
            request=body.model_dump(mode="json"),
            sourceVersion=descriptor["version"],
            context=context,
            descriptor=result_descriptor,
        )
        self.submit(record)
        return {"job": public_job(record)}

    def submit(self, record):
        try:
            self.runtime.executor.submit(self._simulate, record)
        except Exception:
            self.tasks.update(
                record["id"], status="failed", cancellable=False, error="Dispersion task could not start."
            )
            self._discard(record)
            raise ApiError(503, "Dispersion task could not start.") from None

    def _simulate(self, record):
        job_id, dataset_id = record["id"], record["datasetId"]
        with self.runtime.dispersion_lock:
            claimed = self.runtime.repository.tasks.update_one(
                {"_id": job_id, "datasetId": dataset_id, "kind": "dispersion", "status": "queued"},
                {
                    "$set": {
                        "status": "running",
                        "updatedAt": time.time(),
                        "progress": {"stage": "simulating", "current": 0, "total": 1},
                    }
                },
            )
            if not claimed.modified_count:
                return
            cancelled = self.runtime.cancellations.setdefault(job_id, threading.Event())
            self.runtime.scenario_wakeup.set()
        try:
            if cancelled.is_set():
                return
            self._discard(record, pending=True)
            (self.runtime.root / "datasets" / dataset_id).mkdir(mode=0o700, exist_ok=True)
            source = self.processor.process(
                "dispersion",
                {
                    "source": record["source"],
                    "selection": record["request"],
                    "sourceVersion": record["sourceVersion"],
                    "directory": str(self.runtime.root / "datasets" / dataset_id),
                    "simulationGrid": (record.get("context") or {}).get("simulationGrid"),
                    "assetRoot": str(self.runtime.root / "assets"),
                    "control": str(self.runtime.root / "control" / job_id),
                },
            )
            if cancelled.is_set():
                return
            source.update(record.get("context") or {})
            source["colorRange"] = self._range(source, dataset_id)
            imported = dict(record, source=source)
            self.registrations.prepare(imported, cancelled=cancelled)
        except Exception as error:
            with self.runtime.dispersion_lock:
                if not cancelled.is_set() and self.runtime.cancellations.get(job_id) is cancelled:
                    message = (
                        error.detail
                        if isinstance(error, ApiError)
                        else "Dispersion calculation failed. Check the source and velocity field."
                    )
                    self.runtime.repository.datasets.update_one(
                        {"_id": dataset_id},
                        {
                            "$set": {
                                "status": "failed",
                                "descriptor.validation": [{"level": "error", "message": message}],
                            }
                        },
                    )
                    self.tasks.update(job_id, status="failed", cancellable=False, error=message)

        finally:
            try:
                self._discard(record)
            except Exception:
                log.exception("Dispersion output cleanup failed for %s", job_id)

    def _discard(self, record, *, pending=False):
        """실패한 확산 작업이 소유한 미공개 결과만 회수"""
        dataset_id, job_id = record["datasetId"], record["id"]
        directory = self.registrations.directory({"_id": dataset_id, "jobId": job_id})
        with self.runtime.dispersion_lock:
            task = self.runtime.repository.tasks.find_one(
                {"_id": job_id, "datasetId": dataset_id, "kind": "dispersion"}
            )
            if (
                not task
                or task["status"] == "succeeded"
                or (not pending and task["status"] in {"queued", "running"})
            ):
                return
            dataset = self.runtime.repository.datasets.find_one({"_id": dataset_id})
            if dataset and dataset["status"] == "ready" and dataset.get("jobId") != job_id:
                return
            self.runtime.repository.datasets.delete_one({"_id": dataset_id})
            assets = self.runtime.repository.assets
            references = assets.list(directory)
            foreign = False
            for item in references:
                if item.get("metadata", {}).get("workspace_dataset_id") == dataset_id:
                    assets.delete(item["path"])
                else:
                    foreign = True
            if not foreign and directory.exists():
                shutil.rmtree(directory)

    def _range(self, source, dataset_id):
        """완료한 가상 농도 전체 프레임에서 공통 색상 상한 계산"""
        import numpy as np

        directory = self.runtime.root / "datasets" / dataset_id
        path = next(
            (Path(name) for name in source.get("paths", []) if Path(name).name == "concentration.npy"), None
        )
        if path is None or not path.resolve().is_relative_to(directory.resolve()):
            return [0.0, 1.0]
        values = np.load(path, mmap_mode="r", allow_pickle=False)
        maximum = max((float(np.nanmax(frame)) for frame in values), default=0.0)
        return [0.0, maximum if math.isfinite(maximum) and maximum > 0 else 1.0]
