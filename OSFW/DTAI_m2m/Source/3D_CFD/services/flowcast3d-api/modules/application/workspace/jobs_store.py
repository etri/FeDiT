import threading
import time


class TaskStore:
    """공유 작업 상태와 취소 세대 및 시나리오 알림 관리"""

    def __init__(self, runtime):
        self.runtime = runtime

    def create(self, job_id, name, dataset_id, kind, **extra):
        now = time.time()
        record = {
            "_id": job_id,
            "id": job_id,
            "name": name,
            "datasetId": dataset_id,
            "status": "queued",
            "progress": {"stage": "queued", "current": 0, "total": 1},
            "createdAt": now,
            "updatedAt": now,
            "cancellable": True,
            "kind": kind,
            **extra,
        }
        self.runtime.repository.tasks.insert_one(record)
        self.runtime.cancellations[job_id] = threading.Event()
        (self.runtime.root / "control").mkdir(exist_ok=True)
        (self.runtime.root / "control" / f"{job_id}.cancel").unlink(missing_ok=True)
        return record

    def update(self, job_id, **values):
        values["updatedAt"] = time.time()
        query = {"_id": job_id}
        if values.get("status") != "cancelled":
            query["status"] = {"$ne": "cancelled"}
        self.runtime.repository.tasks.update_one(query, {"$set": values})
        self.runtime.scenario_wakeup.set()
