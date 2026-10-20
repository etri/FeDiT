import fcntl
import json
import os
import shutil
import tempfile
from pathlib import Path
from uuid import uuid4

from modules.infrastructure.mongo import storage
from modules.settings.rendering import path_component


def mongo_enabled():
    return os.getenv("FLOWCAST_RESULT_STORAGE", "").lower() == "mongodb"


def cache_root():
    root = Path(os.getenv("FLOWCAST_VIEWER_ASSET_CACHE", "/tmp/flowcast-viewer-assets")).resolve()
    if not root.is_relative_to(Path("/tmp")):
        raise ValueError("Viewer asset cache must be under /tmp.")
    return root


def case_directory(settings, case):
    """원본 자산을 검증해 임시 Case 폴더에 복원"""
    if not mongo_enabled():
        return settings.case_dir(case.id)
    directory = cache_root() / "cases" / path_component("case id", case.id)
    prefix = settings.case_dir(case.id)
    suffixes = {".obj", ".stl", ".mtl", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"}
    selected = []
    for asset in storage.list_assets(prefix):
        path = Path(asset["path"])
        relative = path.relative_to(prefix)
        if relative.parts[0] in {"mesh_cache", "results", "exports", "cache", "flow"}:
            continue
        if path.suffix.lower() in suffixes or str(relative) in (case.mesh.files if case.mesh else []):
            selected.append(asset)
    directory.mkdir(parents=True, exist_ok=True)
    manifest = directory / ".assets.json"
    with (directory / ".restore.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            previous = json.loads(manifest.read_text()) if manifest.is_file() else {}
        except (ValueError, OSError):
            previous = {}
        if not isinstance(previous, dict):
            previous = {}
        pending, records = [], {}
        for asset in selected:
            path = str(asset["path"])
            target = directory / Path(path).relative_to(prefix)
            record = {"revision": asset["revision"], "size": asset["size"]}
            old = previous.get(path, {})
            stat = target.stat() if target.is_file() else None
            if (
                stat is None
                or stat.st_size != record["size"]
                or stat.st_mtime_ns != old.get("mtime_ns")
                or any(old.get(key) != value for key, value in record.items())
            ):
                pending.append(path)
            records[path] = record
        if pending:
            storage.materialize_assets(prefix, directory, paths=pending)
            if previous:
                shutil.rmtree(directory / "mesh_cache", ignore_errors=True)
        for path, record in records.items():
            target = directory / Path(path).relative_to(prefix)
            record["mtime_ns"] = target.stat().st_mtime_ns
        for path in previous.keys() - records.keys():
            (directory / Path(path).relative_to(prefix)).unlink(missing_ok=True)
        temporary = manifest.with_suffix(".partial")
        temporary.write_text(json.dumps(records))
        temporary.replace(manifest)
    return directory


def export_target(requested):
    path = Path(requested).expanduser().resolve()
    if not mongo_enabled():
        return path
    return Path(tempfile.mkdtemp(prefix="flowcast-export-", dir="/tmp")) / path.name


def discard_export(path):
    directory = Path(path).parent
    if mongo_enabled() and directory.parent == Path("/tmp") and directory.name.startswith("flowcast-export-"):
        shutil.rmtree(directory, ignore_errors=True)


def persist_outputs(paths, case_id):
    """내보내기 결과를 GridFS에 저장한 뒤 임시 파일 삭제"""
    if not mongo_enabled():
        return {name: str(path) for name, path in paths.items()}
    prefix = Path("/data/exports") / path_component("case id", case_id) / uuid4().hex
    saved = {}
    try:
        for name, file in paths.items():
            file = Path(file)
            logical = prefix / file.name
            with file.open("rb") as stream:
                storage.save_asset(logical, stream, metadata={"case_id": case_id, "kind": name})
            saved[name] = str(logical)
        return saved
    except BaseException:
        for path in saved.values():
            storage.delete_asset(path)
        raise
    finally:
        for path in paths.values():
            discard_export(path)


def read_settings(path):
    path = Path(path).expanduser()
    if mongo_enabled() and str(path).startswith("/data/"):
        with storage.open_asset(path) as stream:
            content = stream.read((1 << 20) + 1)
        if len(content) > 1 << 20:
            raise ValueError("Scene settings must not exceed 1 MiB.")
        return content.decode()
    return path.read_text()
