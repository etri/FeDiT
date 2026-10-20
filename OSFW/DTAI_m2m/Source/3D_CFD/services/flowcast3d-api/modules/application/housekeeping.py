import logging
import math
import os
import threading

logger = logging.getLogger(__name__)


class Housekeeping:
    """업로드와 GridFS 정리를 API 수명 주기에 맞춰 실행"""

    def __init__(self, uploads, *, interval=None, grace_seconds=3600, db=None, prune_blobs):
        value = (
            os.environ.get("FLOWCAST_MAINTENANCE_INTERVAL_SECONDS", "300") if interval is None else interval
        )
        try:
            self.interval = float(value)
        except (TypeError, ValueError):
            raise ValueError(
                "FLOWCAST_MAINTENANCE_INTERVAL_SECONDS must be a number between 0 and 86400."
            ) from None
        if not math.isfinite(self.interval) or not 0 <= self.interval <= 86400:
            raise ValueError("FLOWCAST_MAINTENANCE_INTERVAL_SECONDS must be a number between 0 and 86400.")
        self.uploads = uploads
        collection = getattr(uploads, "collection", None)
        self.db = getattr(collection, "database", None) if db is None else db
        self.grace_seconds = grace_seconds
        self.prune_blobs = prune_blobs
        self.stop = threading.Event()
        self.lock = threading.Lock()
        self.thread = None

    def run_once(self, *, dry_run=True):
        """업로드와 blob 정리 결과를 JSON 직렬화 가능한 집계로 반환"""
        with self.lock:
            blobs = {}
            self.prune_blobs(self.grace_seconds, dry_run=dry_run, db=self.db, report=blobs)
            uploads = self.uploads.prune_expired(dry_run=dry_run)
            return {"dry_run": dry_run, "blobs": blobs, "uploads": uploads}

    def start(self):
        """첫 정리는 지정한 간격이 지난 뒤 시작"""
        if self.interval and self.thread is None and not self.stop.is_set():
            self.thread = threading.Thread(target=self._run, name="api-housekeeping", daemon=True)
            self.thread.start()
        return self

    def _run(self):
        while not self.stop.wait(self.interval):
            try:
                result = self.run_once(dry_run=False)
                logger.info("API housekeeping completed: %s", result)
            except Exception:
                logger.exception("API housekeeping failed; retrying after the maintenance interval.")

    def close(self):
        """다음 실행을 취소하고 정리 스레드 종료 대기"""
        self.stop.set()
        if self.thread is not None and self.thread is not threading.current_thread():
            self.thread.join(timeout=5)
            if self.thread.is_alive():
                logger.warning("API housekeeping is still completing its current pass.")
