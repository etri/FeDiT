import json
import threading
import time

from modules.application.workspace.values import public_job
from modules.domain.errors import ApiError


class JobService:
    """가져오기와 예측 및 확산 작업의 조회와 취소 조정"""

    def __init__(self, runtime, registrations, dispersion, tasks):
        self.runtime = runtime
        self.registrations = registrations
        self.dispersion = dispersion
        self.tasks = tasks

    def _external_job(self, job, executor="ok"):
        status = job.status
        progress = status.progress
        return {
            "id": status.job_id,
            "name": f"Prediction {job.spec.case_id}",
            "datasetId": f"case:{job.spec.case_id}",
            "status": status.state,
            "progress": {
                "stage": "prediction",
                "current": progress.steps_done,
                "total": progress.steps_total,
            },
            "createdAt": status.created_at,
            "updatedAt": status.updated_at,
            "error": "Prediction failed. Check the case settings and input data." if status.error else None,
            "cancellable": status.state in {"queued", "running"},
            "executor": executor,
        }

    def list(self):
        own = []
        for record in self.runtime.repository.tasks.find({}).sort("createdAt", -1).limit(1000):
            if record["status"] == "running":
                path = self.runtime.root / "control" / f"{record['id']}.json"
                if path.is_file() and path.stat().st_size <= 4096:
                    try:
                        progress = json.loads(path.read_text())
                        if (
                            isinstance(progress, dict)
                            and progress.get("stage") == "simulating"
                            and isinstance(progress.get("current"), int)
                            and isinstance(progress.get("total"), int)
                        ):
                            record["progress"] = progress
                    except (OSError, ValueError):
                        pass
            own.append(public_job(record))
        if self.runtime.prediction_jobs is not None:
            listed, executor = self.runtime.prediction_jobs.list()
            own.extend(self._external_job(job, executor) for job in listed)
        return {"jobs": sorted(own, key=lambda item: item["createdAt"], reverse=True)}

    def cancel(self, job_id):
        with self.runtime.dispersion_lock:
            return self._cancel(job_id)

    def _cancel(self, job_id):
        record = self.runtime.repository.tasks.find_one({"_id": job_id})
        if record:
            if record["status"] not in {"queued", "running"}:
                raise ApiError(409, "Only queued or running tasks can be cancelled.")
            self.runtime.cancellations.setdefault(job_id, threading.Event()).set()
            (self.runtime.root / "control" / f"{job_id}.cancel").touch(mode=0o600)
            self.tasks.update(job_id, status="cancelled", cancellable=False)
            self.runtime.repository.datasets.update_one(
                {"_id": record["datasetId"], "status": "preparing"}, {"$set": {"status": "cancelled"}}
            )
            return public_job(self.runtime.repository.tasks.find_one({"_id": job_id}))
        return self._external_job(self.runtime.prediction_jobs.cancel(job_id))

    def retry(self, job_id):
        with self.runtime.dispersion_lock:
            return self._retry(job_id)

    def _retry(self, job_id):
        record = self.runtime.repository.tasks.find_one({"_id": job_id})
        if record and record["kind"] == "import":
            if record["status"] not in {"failed", "interrupted", "cancelled"}:
                raise ApiError(409, "Only failed, interrupted, or cancelled tasks can be retried.")
            self.runtime.cancellations[job_id] = threading.Event()
            self.runtime.repository.tasks.update_one(
                {"_id": job_id},
                {"$set": {"status": "queued", "error": None, "cancellable": True, "updatedAt": time.time()}},
            )
            (self.runtime.root / "control" / f"{job_id}.cancel").unlink(missing_ok=True)
            self.runtime.repository.datasets.update_one(
                {"_id": record["datasetId"]}, {"$set": {"status": "preparing"}}
            )
            self.runtime.executor.submit(self.registrations.prepare, record)
            return public_job(self.runtime.repository.tasks.find_one({"_id": job_id}))
        if record and record["kind"] == "dispersion":
            if record["status"] not in {"failed", "interrupted", "cancelled"}:
                raise ApiError(409, "Only failed, interrupted, or cancelled tasks can be retried.")
            self.runtime.cancellations[job_id] = threading.Event()
            (self.runtime.root / "control" / f"{job_id}.cancel").unlink(missing_ok=True)
            self.runtime.repository.tasks.update_one(
                {"_id": job_id},
                {"$set": {"status": "queued", "error": None, "cancellable": True, "updatedAt": time.time()}},
            )
            self.dispersion.submit(record)
            return public_job(self.runtime.repository.tasks.find_one({"_id": job_id}))
        return self._external_job(self.runtime.prediction_jobs.retry(job_id))

    def predict(self, body):
        from modules.application.jobs import LiveRequest

        if not body.datasetId.startswith("case:"):
            raise ApiError(422, "Prediction requires a prepared model case.")
        return self._external_job(
            *self.runtime.prediction_jobs.live(
                body.datasetId[5:],
                LiveRequest(
                    direction=body.direction,
                    speed=body.speed,
                    steps=body.steps,
                    replaces=body.replaces,
                ),
            )
        )
