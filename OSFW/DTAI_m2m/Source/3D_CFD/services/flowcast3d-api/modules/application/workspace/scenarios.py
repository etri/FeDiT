import math
import re
import secrets
import threading
import time

from modules.application.workspace.contracts import DispersionRequest, PredictRequest
from modules.domain.errors import ApiError


class ScenarioService:
    """참조와 모델 분기의 독립 실행 및 재시도 조정"""

    def __init__(self, runtime, datasets, jobs, dispersion):
        self.runtime = runtime
        self.datasets = datasets
        self.jobs = jobs
        self.dispersion = dispersion
        self.lock = threading.RLock()
        self.stop = threading.Event()
        self.thread = None

    def close(self):
        self.stop.set()
        self.runtime.scenario_wakeup.set()
        if self.thread is not None:
            self.thread.join(timeout=3)

    def get(self, scenario_id):
        record = (
            self.runtime.repository.scenarios.find_one({"_id": scenario_id})
            if re.fullmatch(r"[a-f0-9]{32}", scenario_id)
            else None
        )
        if record is None:
            raise ApiError(404, "Dispersion scenario was not found.")
        return {key: value for key, value in record.items() if key != "_id"}

    def list(self, dataset_id=None):
        query = {"datasetId": dataset_id} if dataset_id else {}
        return {
            "scenarios": [
                {key: value for key, value in record.items() if key != "_id"}
                for record in self.runtime.repository.scenarios.find(query).sort("createdAt", -1).limit(1000)
            ]
        }

    def create(self, body):
        # 공간 소속을 검증한 뒤 두 분기의 성공 상태를 독립적으로 저장
        source = self.datasets.source(body.datasetId)
        if body.referenceResultId:
            self.datasets.source(body.datasetId, body.referenceResultId)
        now, identifier = time.time(), secrets.token_hex(16)
        record = {
            "_id": identifier,
            "id": identifier,
            "datasetId": body.datasetId,
            "request": body.model_dump(mode="json", exclude={"resultId"}),
            "status": "queued",
            "createdAt": now,
            "updatedAt": now,
            "branches": {
                "reference": {
                    "status": "queued",
                    "stage": "dispersion",
                    "windResultId": body.referenceResultId,
                },
                "model": {"status": "queued", "stage": "prediction"},
            },
        }
        if source.get("kind") == "zarr" and source.get("path"):
            grid = self.runtime.repository.flow_grid(source["path"])
            stride = max(1, math.ceil((math.prod(grid.shape) / 262144) ** (1 / 3)))
            dimensions = [math.ceil(size / stride) for size in grid.shape]
            while math.prod(dimensions) > 262144:
                stride += 1
                dimensions = [math.ceil(size / stride) for size in grid.shape]
            record["simulationGrid"] = {
                "origin": list(grid.origin),
                "dimensions": dimensions,
                "spacing": [length / size for length, size in zip(grid.extent, dimensions)],
            }
        with self.lock:
            self.runtime.repository.scenarios.insert_one(record)
            self._start_branch(record, "reference")
            self._start_branch(record, "model")
            self._save(record)
            self._ensure_coordinator()
        return self.get(identifier)

    def _ensure_coordinator(self):
        # 추론 완료 확인은 시각화 단일 실행기의 대기열과 분리
        if self.thread is None:
            self.thread = threading.Thread(target=self._coordinate, name="dispersion-scenarios", daemon=True)
            self.thread.start()
        self.runtime.scenario_wakeup.set()

    def _coordinate(self):
        while not self.stop.is_set():
            self.runtime.scenario_wakeup.wait(timeout=1)
            self.runtime.scenario_wakeup.clear()
            if self.stop.is_set():
                return
            with self.lock:
                for record in self.runtime.repository.scenarios.find(
                    {"status": {"$in": ["queued", "running"]}}
                ):
                    try:
                        self._advance(record)
                    except Exception:
                        # 일시적인 상태 조회 실패는 성공한 다른 분기를 변경하지 않음
                        continue

    def _start_branch(self, record, name):
        branch, request = record["branches"][name], record["request"]
        try:
            if name == "reference" and not request.get("referenceResultId"):
                branch.update(
                    status="unavailable", error="Published three-dimensional reference wind is unavailable."
                )
                return
            if name == "model" and not request["datasetId"].startswith("case:"):
                branch.update(
                    status="unavailable", error="A prepared model case is unavailable for this dataset."
                )
                return
            if name == "model" and not branch.get("windResultId"):
                job = self.jobs.predict(
                    PredictRequest(
                        datasetId=request["datasetId"],
                        direction=request["direction"],
                        speed=request["speed"],
                        steps=1,
                    )
                )
                branch.update(status="running", stage="prediction", predictionJobId=job["id"], error=None)
                context = {
                    "scenarioId": record["id"],
                    "resultRole": "model_wind",
                    "sourceRef": {"datasetId": request["datasetId"], "resultId": job["id"]},
                }
                self.runtime.repository.result_contexts.replace_one(
                    {"_id": job["id"]}, {"_id": job["id"], **context}, upsert=True
                )
                return
            self._start_dispersion(record, name)
        except Exception as error:
            branch.update(
                status="failed",
                error=error.detail
                if isinstance(error, ApiError)
                else "Scenario branch could not start. Check the wind source and model availability.",
            )

    def _start_dispersion(self, record, name):
        branch, request = record["branches"][name], record["request"]
        wind_id = branch.get("windResultId") or request.get("referenceResultId")
        context = {
            "scenarioId": record["id"],
            "resultRole": f"virtual_{name}",
            "sourceRef": {"datasetId": request["datasetId"], "resultId": wind_id},
        }
        if record.get("simulationGrid"):
            context["simulationGrid"] = record["simulationGrid"]
        body = DispersionRequest(
            **{
                key: request[key] for key in ("datasetId", "source", "durationSeconds", "stepSeconds", "seed")
            },
            resultId=wind_id,
        )
        job = self.dispersion.create(body, context=context)["job"]
        branch.update(
            status="running",
            stage="dispersion",
            jobId=job["id"],
            resultId=job["datasetId"],
            windResultId=wind_id,
            error=None,
        )

    def _advance(self, record):
        for name, branch in record["branches"].items():
            if branch["status"] not in {"queued", "running"}:
                continue
            if branch.get("stage") == "prediction":
                job, _ = self.runtime.prediction_jobs.get(branch["predictionJobId"])
                status = job.status.state
                if status == "succeeded":
                    branch["windResultId"] = branch["predictionJobId"]
                    try:
                        self._start_dispersion(record, name)
                    except Exception as error:
                        branch.update(
                            status="failed",
                            error=error.detail
                            if isinstance(error, ApiError)
                            else "Predicted wind could not start dispersion.",
                        )
                elif status in {"failed", "cancelled"}:
                    branch.update(status=status, error="Model wind prediction did not complete.")
            elif branch.get("jobId"):
                task = self.runtime.repository.tasks.find_one({"_id": branch["jobId"]})
                if task:
                    branch.update(
                        status=task["status"], error=task.get("error"), progress=task.get("progress")
                    )
        self._save(record)

    def _save(self, record):
        statuses = [
            branch["status"] for branch in record["branches"].values() if branch["status"] != "unavailable"
        ]
        if any(status in {"queued", "running"} for status in statuses):
            status = "running"
        elif statuses and all(value == "succeeded" for value in statuses):
            status = "succeeded"
        elif "succeeded" in statuses:
            status = "partial"
        elif statuses and all(value == "cancelled" for value in statuses):
            status = "cancelled"
        elif "interrupted" in statuses:
            status = "interrupted"
        else:
            status = "failed"
        record.update(status=status, updatedAt=time.time())
        completed = [
            branch["resultId"]
            for branch in record["branches"].values()
            if branch["status"] == "succeeded" and branch.get("resultId")
        ]
        ranges = [
            item["descriptor"]["colorRange"]
            for identifier in completed
            if (item := self.runtime.repository.datasets.find_one({"_id": identifier}))
            and item["descriptor"].get("colorRange")
        ]
        if ranges:
            record["colorRange"] = [0.0, max(value[1] for value in ranges)]
            self.runtime.repository.datasets.update_many(
                {"_id": {"$in": completed}},
                {
                    "$set": {
                        "descriptor.colorRange": record["colorRange"],
                        "source.colorRange": record["colorRange"],
                    }
                },
            )
        self.runtime.repository.scenarios.replace_one({"_id": record["id"]}, record)

    def cancel(self, scenario_id):
        with self.lock:
            self.get(scenario_id)
            record = self.runtime.repository.scenarios.find_one({"_id": scenario_id})
            if record["status"] not in {"queued", "running"}:
                raise ApiError(409, "Only queued or running scenarios can be cancelled.")
            for branch in record["branches"].values():
                if branch["status"] not in {"queued", "running"}:
                    continue
                identifier = (
                    branch.get("jobId")
                    if branch.get("stage") == "dispersion"
                    else branch.get("predictionJobId")
                )
                if identifier:
                    try:
                        self.jobs.cancel(identifier)
                    except ApiError as error:
                        task = self.runtime.repository.tasks.find_one({"_id": identifier})
                        if error.status == 409 and task and task["status"] == "succeeded":
                            branch.update(status="succeeded", error=None)
                            continue
                        if error.status != 409:
                            raise
                branch.update(status="cancelled", error=None)
            self._save(record)
            return self.get(scenario_id)

    def retry(self, scenario_id, selected=None):
        with self.lock:
            self.get(scenario_id)
            record = self.runtime.repository.scenarios.find_one({"_id": scenario_id})
            retryable = [
                name
                for name, branch in record["branches"].items()
                if branch["status"] in {"failed", "cancelled", "interrupted"} and selected in {None, name}
            ]
            if not retryable:
                raise ApiError(
                    409, "Only failed, cancelled, or interrupted scenario branches can be retried."
                )
            for name in retryable:
                branch = record["branches"][name]
                if branch.get("jobId"):
                    try:
                        self.jobs.retry(branch["jobId"])
                        branch.update(status="running", stage="dispersion", error=None)
                    except ApiError as error:
                        branch.update(status="failed", error=error.detail)
                else:
                    self._start_branch(record, name)
            self._save(record)
            self._ensure_coordinator()
            return self.get(scenario_id)
