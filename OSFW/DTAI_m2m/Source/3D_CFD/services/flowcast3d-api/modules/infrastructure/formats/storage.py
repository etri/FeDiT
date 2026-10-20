"""애플리케이션의 유동장 저장소 계약 구현"""

from modules.infrastructure.formats.flow_store import DAMAGED, StoreReader
from modules.infrastructure.formats.flow_writer import FlowStore
from modules.infrastructure.mongo import storage


class FlowStorage:
    """파일과 MongoDB 저장소의 읽기 및 공개 처리 연결"""

    def read(self, path):
        return StoreReader(path)

    def exists(self, path):
        return storage.store_exists(path)

    def attrs(self, path):
        try:
            return storage.open_group(path, mode="r").attrs.asdict()
        except DAMAGED:
            return {}

    def list(self, prefix):
        return storage.list_stores(prefix)

    def mapping(self, path):
        return storage.MongoZarrStore(path)

    def create(self, path, metadata, **options):
        return FlowStore.create(path, metadata, **options)

    def rename(self, source, destination):
        storage.rename_store(source, destination)

    def copy(self, source, destination):
        storage.copy_store(source, destination)
