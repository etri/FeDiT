"""파일 저장소와 MongoDB 논리 저장소의 공통 접근"""

import os
from pathlib import Path
from uuid import uuid4

from modules.infrastructure.mongo import connection
from modules.infrastructure.mongo.blob_assets import MongoAssets
from modules.infrastructure.mongo.cleanup import prune_asset_blobs
from modules.infrastructure.mongo.namespace import mongo_result, prefix_query
from modules.infrastructure.mongo.zarr_store import MongoZarrStore

__all__ = [
    "MongoAssets",
    "MongoZarrStore",
    "asset_info",
    "asset_exists",
    "list_assets",
    "open_asset",
    "save_asset",
    "delete_asset",
    "delete_assets",
    "materialize_assets",
    "get_case",
    "list_stores",
    "store_exists",
    "store_revision",
    "open_group",
    "rename_store",
    "copy_store",
    "prune_asset_blobs",
]


def asset_info(path):
    return MongoAssets().info(path)


def asset_exists(path):
    return MongoAssets().exists(path)


def list_assets(prefix):
    return MongoAssets().list(prefix)


def open_asset(path):
    return MongoAssets().open(path)


def save_asset(path, source, metadata=None, overwrite=True):
    return MongoAssets().save(path, source, metadata, overwrite)


def delete_asset(path):
    return MongoAssets().delete(path)


def delete_assets(prefix):
    return MongoAssets().delete_tree(prefix)


def materialize_assets(prefix, destination, paths=None):
    return MongoAssets().materialize(prefix, destination, paths)


def get_case(case_id):
    document = connection.database().cases.find_one({"_id": case_id})
    return document.get("case") if document else None


def list_stores(prefix):
    query = prefix_query(prefix, "store") | {"key": ".zgroup"}
    return sorted(connection.database().zarr_chunks.distinct("store", query))


def store_exists(path: str | Path) -> bool:
    if (Path(path) / ".zgroup").is_file():
        return True
    return mongo_result(path) and ".zgroup" in MongoZarrStore(path, readonly=True)


def store_revision(path: str | Path):
    attrs = Path(path) / ".zattrs"
    if attrs.is_file():
        stat = attrs.stat()
        return stat.st_ino, stat.st_mtime_ns, stat.st_size
    if mongo_result(path):
        return MongoZarrStore(path, readonly=True).revision()
    return None


def open_group(path: str | Path, mode: str = "r", **kwargs):
    """운영 논리 경로는 MongoDB, 임시 경로는 파일로 열기"""
    import zarr

    local = (Path(path) / ".zgroup").is_file()
    if mongo_result(path) and (mode != "r" or not local):
        return zarr.open_group(MongoZarrStore(path, readonly=mode == "r"), mode=mode, **kwargs)
    return zarr.open_group(str(path), mode=mode, **kwargs)


def rename_store(source: str | Path, destination: str | Path) -> None:
    """완성된 청크를 최종 이름으로 공개하고 준비용 이름 정리"""
    if not mongo_result(destination):
        os.replace(source, destination)
        return
    copy_store(source, destination)
    MongoZarrStore(source).clear()


def copy_store(source: str | Path, destination: str | Path) -> None:
    """GridFS 참조를 유지한 채 청크의 논리 이름 복사"""
    source_store, target = MongoZarrStore(source), MongoZarrStore(destination)
    if source_store.path == target.path:
        raise ValueError("Zarr source and destination must differ.")
    target.clear()
    keys = sorted(source_store, key=lambda key: key == ".zgroup")
    for key in keys:
        document = source_store.collection.find_one(source_store._query(key))
        document.pop("sha256", None)
        document.update(_id=uuid4().hex, store=target.path, revision=uuid4().hex)
        target.collection.replace_one(target._query(key), document, upsert=True)
