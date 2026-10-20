"""참조와 업로드 임대를 보존하는 GridFS 정리"""

import time
from uuid import uuid4

from modules.infrastructure.mongo import connection


def prune_asset_blobs(grace_seconds=3600, *, dry_run=False, db=None, report=None):
    """참조와 업로드 임대를 확인하여 오래된 GridFS 파일 정리

    Args:
        grace_seconds: 파일 생성 후 정리 전까지의 유예 시간
        dry_run: 삭제하거나 임대를 변경하지 않고 대상 수만 확인
        db: 정리할 MongoDB 연결
        report: 삭제 대상과 보호된 파일의 집계 결과

    Returns:
        실행 시 삭제 수 또는 미리보기 시 삭제 대상 수
    """
    import math
    from datetime import datetime, timedelta, timezone

    import gridfs
    from pymongo.errors import DuplicateKeyError

    if not isinstance(grace_seconds, (int, float)) or not math.isfinite(grace_seconds) or grace_seconds < 0:
        raise ValueError("GridFS cleanup grace_seconds must be finite and non-negative.")
    active_db = connection.database() if db is None else db
    files = gridfs.GridFS(active_db, collection="asset_blobs")
    leases = active_db.asset_uploads
    # 실제 정리에서만 참조 조회 인덱스를 준비
    if not dry_run:
        active_db.assets.create_index("file_id")
        active_db.zarr_chunks.create_index("blob_id")

    cutoff = datetime.now(timezone.utc) - timedelta(seconds=grace_seconds)
    counts = {
        "candidates": 0,
        "removed": 0,
        "skipped_referenced": 0,
        "skipped_active": 0,
        "skipped_publishing": 0,
        "busy": 0,
    }
    if report is not None:
        report.update(counts)

    def referenced(file_id):
        return (
            active_db.assets.find_one({"file_id": file_id}, {"_id": 1}) is not None
            or active_db.zarr_chunks.find_one({"blob_id": file_id}, {"_id": 1}) is not None
        )

    def collect(file_id):
        # 공개된 파일과 만료되지 않은 업로드 보호
        if referenced(file_id):
            counts["skipped_referenced"] += 1
            return
        now = time.time()
        lease = leases.find_one({"_id": file_id})
        if lease is not None:
            state = lease.get("state")
            if state == "publishing":
                counts["skipped_publishing"] += 1
                return
            expiry = (
                lease.get("collect_expires_at", 0)
                if state == "collecting"
                else lease.get("expires_at", now + 1)
            )
            if state not in {"writing", "collecting"} or expiry > now:
                counts["skipped_active"] += 1
                return
        if dry_run:
            counts["candidates"] += 1
            return

        # 업로드 갱신과 경쟁하는 정리 권한을 원자적으로 확보
        collector = uuid4().hex
        claim = {"state": "collecting", "collector": collector, "collect_expires_at": now + 300}
        if lease is None:
            try:
                leases.insert_one({"_id": file_id, **claim})
            except DuplicateKeyError:
                counts["busy"] += 1
                return
        else:
            available = {
                "_id": file_id,
                "$or": [
                    {"state": "writing", "expires_at": {"$lte": now}},
                    {"state": "collecting", "collect_expires_at": {"$lte": now}},
                    {"state": "collecting", "collect_expires_at": {"$exists": False}},
                ],
            }
            if leases.find_one_and_update(available, {"$set": claim}) is None:
                counts["busy"] += 1
                return

        # 정리 권한 확보 중 공개된 참조와 다른 정리 작업의 권한 보존
        ownership = {"_id": file_id, "state": "collecting", "collector": collector}
        if referenced(file_id):
            leases.delete_one(ownership)
            counts["skipped_referenced"] += 1
            return
        if not leases.update_one(
            ownership, {"$set": {"collect_expires_at": time.time() + 300}}
        ).matched_count:
            counts["busy"] += 1
            return
        counts["candidates"] += 1
        try:
            files.delete(file_id)
        except BaseException:
            # 중단된 정리는 다음 실행에서 다시 시도
            leases.update_one(ownership, {"$set": {"collect_expires_at": time.time()}})
            raise
        leases.delete_one(ownership)
        counts["removed"] += 1

    # 완료 파일과 메타데이터 생성 전 중단된 청크를 각각 검사
    for document in active_db.asset_blobs.files.find({"uploadDate": {"$lt": cutoff}}, {"_id": 1}):
        collect(document["_id"])
    # 공개 전 중단된 업로드는 ObjectId 생성 시각으로 판별
    for file_id in active_db.asset_blobs.chunks.distinct("files_id"):
        created = getattr(file_id, "generation_time", None)
        if created is not None and created < cutoff and not files.exists(file_id):
            collect(file_id)
    if report is not None:
        report.update(counts)
    return counts["candidates"] if dry_run else counts["removed"]
