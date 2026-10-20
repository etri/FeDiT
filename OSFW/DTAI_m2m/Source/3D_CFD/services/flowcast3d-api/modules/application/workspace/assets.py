from modules.application.workspace.values import ASSET_NAME, digest
from modules.domain.errors import ApiError


class AssetService:
    """선택 영역의 시각화 요청과 안전한 자산 조회"""

    def __init__(self, runtime, datasets, processor):
        self.runtime = runtime
        self.datasets = datasets
        self.processor = processor

    def selection(self, body, operation):
        source = self.datasets.source(body.datasetId, body.resultId)
        selection = body.model_dump(mode="json", exclude_none=True)
        params = {"source": source, "selection": selection, "assetRoot": str(self.runtime.root / "assets")}
        context = digest(
            {"dataset": self.datasets.get(body.datasetId, body.resultId)["version"], "selection": selection}
        )
        params["contextKey"] = context
        if operation == "analysis" and body.compareDatasetId:
            params["compareSource"] = self.datasets.source(body.compareDatasetId, body.compareResultId)
        result = self.processor.process(operation, params)
        result["contextKey"] = context
        for asset in [*result.get("assets", []), *result.get("fallbackAssets", [])]:
            name = asset.pop("filename", None)
            if not isinstance(name, str) or not ASSET_NAME.fullmatch(name):
                raise ApiError(502, "Visualization worker returned an invalid asset identifier.")
            asset["url"] = f"/app-api/assets/{name}"
            if "maskFilename" in asset:
                asset["maskUrl"] = f"/app-api/assets/{asset.pop('maskFilename')}"
        return result

    def thumbnail(self, dataset_id):
        presentation = self.datasets.presentation.records.find_one({"_id": dataset_id})
        space_id = presentation["spaceId"] if presentation else None
        if space_id and space_id.startswith("case:"):
            source_id = space_id
            preview = self.datasets.describe_raw(source_id)
        else:
            preview = self.datasets.get(dataset_id)
            source_id = preview["spaceId"] if preview["spaceId"].startswith("case:") else dataset_id
            if source_id != dataset_id:
                preview = self.datasets.describe_raw(source_id)
        if preview["status"] != "ready":
            raise ApiError(409, "Dataset preparation is incomplete.")
        key = digest(
            {"schema": "flowcast.dataset-thumbnail/1", "dataset": source_id, "version": preview["version"]}
        )
        name = f"{key}.png"
        path = self.runtime.root / "assets" / name
        if not path.is_file():
            self.processor.process(
                "thumbnail",
                {
                    "source": self.datasets.source(source_id),
                    "assetRoot": str(self.runtime.root / "assets"),
                    "contextKey": key,
                },
                background=True,
            )
        return self.get(name)

    def get(self, name):
        if not ASSET_NAME.fullmatch(name):
            raise ApiError(404, "Asset was not found.")
        root = self.runtime.root / "assets"
        path = root / name
        if path.is_symlink() or not path.is_file() or path.resolve().parent != root.resolve():
            raise ApiError(404, "Asset was not found.")
        return path
