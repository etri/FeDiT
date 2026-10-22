from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime
import errno
import json
import os
from pathlib import Path
import time
from typing import Iterator


_DEFAULT_STALE_SECONDS = int(os.environ.get("IR_FILE_LOCK_STALE_SECONDS", str(12 * 60 * 60)))


def _pid_is_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        
        
        return True
    except OSError:
        
        return True
    return True


def _try_parse_lock_pid(lock_path: Path) -> int | None:
    try:
        raw = lock_path.read_text(encoding="utf-8")
    except Exception:
        return None
    for line in raw.splitlines():
        if line.startswith("pid="):
            try:
                return int(line.split("=", 1)[1].strip())
            except Exception:
                return None
    return None


def _try_parse_lock_created_at(lock_path: Path) -> datetime | None:
    try:
        raw = lock_path.read_text(encoding="utf-8")
    except Exception:
        return None
    for line in raw.splitlines():
        if not line.startswith("created_at="):
            continue
        value = line.split("=", 1)[1].strip()
        if not value:
            return None
        try:
            
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            return None
        if parsed.tzinfo is None:
            parsed = parsed.astimezone()
        return parsed
    return None


@contextmanager
def exclusive_file_lock(lock_path: str | Path) -> Iterator[Path]:
    pass

    resolved = Path(lock_path).expanduser().resolve()
    resolved.parent.mkdir(parents=True, exist_ok=True)

    try:
        import fcntl  
    except Exception:
        fcntl = None  

    if fcntl is not None:
        fd = os.open(str(resolved), os.O_CREAT | os.O_RDWR, 0o644)
        handle = os.fdopen(fd, "r+", encoding="utf-8")
        acquired = False
        try:
            try:
                fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            except OSError as exc:
                if getattr(exc, "errno", None) in (errno.EACCES, errno.EAGAIN):
                    raise RuntimeError(f"Lock already exists: {resolved}") from exc
                raise
            acquired = True

            handle.seek(0)
            handle.truncate(0)
            context = os.environ.get("IR_LOCK_CONTEXT")
            context_line = ""
            if context:
                try:
                    parsed = json.loads(context)
                except Exception:
                    parsed = None
                if isinstance(parsed, dict):
                    try:
                        context_line = f"context={json.dumps(parsed, ensure_ascii=True, sort_keys=True)}\n"
                    except Exception:
                        context_line = f"context={context}\n"
                else:
                    context_line = f"context={context}\n"
            handle.write(
                f"created_at={datetime.now().astimezone().isoformat(timespec='seconds')}\n"
                f"pid={os.getpid()}\n"
                f"{context_line}"
            )
            handle.flush()
            yield resolved
        finally:
            if acquired:
                try:
                    fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
                except Exception:
                    pass
            try:
                handle.close()
            finally:
                if acquired:
                    try:
                        resolved.unlink(missing_ok=True)
                    except Exception:
                        pass
        return

    try_count = 0
    while True:
        try:
            fd = os.open(str(resolved), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            break
        except FileExistsError as exc:
            try_count += 1
            if try_count > 1:
                raise RuntimeError(f"Lock already exists: {resolved}") from exc
            pid = _try_parse_lock_pid(resolved)
            created_at = _try_parse_lock_created_at(resolved)
            age_seconds: float | None = None
            if created_at is not None:
                try:
                    age_seconds = max(0.0, (datetime.now().astimezone() - created_at).total_seconds())
                except Exception:
                    age_seconds = None

            if pid is None or _pid_is_alive(pid):
                if age_seconds is None or age_seconds <= float(_DEFAULT_STALE_SECONDS):
                    raise RuntimeError(f"Lock already exists: {resolved}") from exc
            try:
                resolved.unlink(missing_ok=True)
            except OSError as unlink_exc:
                
                if getattr(unlink_exc, "errno", None) not in (errno.ENOENT,):
                    raise RuntimeError(f"Lock already exists: {resolved}") from exc

    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            context = os.environ.get("IR_LOCK_CONTEXT")
            context_line = ""
            if context:
                try:
                    parsed = json.loads(context)
                except Exception:
                    parsed = None
                if isinstance(parsed, dict):
                    try:
                        context_line = f"context={json.dumps(parsed, ensure_ascii=True, sort_keys=True)}\n"
                    except Exception:
                        context_line = f"context={context}\n"
                else:
                    context_line = f"context={context}\n"
            handle.write(
                f"created_at={datetime.now().astimezone().isoformat(timespec='seconds')}\n"
                f"pid={os.getpid()}\n"
                f"{context_line}"
            )
        yield resolved
    finally:
        try:
            resolved.unlink(missing_ok=True)
        except Exception:
            
            pass


@contextmanager
def exclusive_file_lock_wait(
    lock_path: str | Path,
    *,
    timeout_seconds: float | None = None,
    poll_seconds: float = 5.0,
) -> Iterator[Path]:
    pass

    
    
    if timeout_seconds is None:
        timeout_seconds = 0.0
    if timeout_seconds < 0:
        timeout_seconds = 0.0
    if poll_seconds <= 0:
        poll_seconds = 0.5

    deadline = time.monotonic() + float(timeout_seconds)
    while True:
        try:
            with exclusive_file_lock(lock_path) as acquired:
                yield acquired
            return
        except RuntimeError as exc:
            message = str(exc)
            if "Lock already exists:" not in message:
                raise
            if time.monotonic() >= deadline:
                raise
            time.sleep(float(poll_seconds))
