import math
import re
from pathlib import Path

from modules.application.workspace.presentation import DatasetPresentation
from modules.application.workspace.values import digest
from modules.domain.errors import ApiError
from modules.domain.schemas.context import CONTEXT_KEYS, source_context


class DatasetService:
    """원본 공간과 예측 결과의 조회 및 표시 메타데이터 관리"""

    def __init__(self, runtime, processor):
        self.runtime = runtime
        self.processor = processor
        self.presentation = DatasetPresentation(runtime.repository, runtime.cases)

    def case_source(self, case_id, result_id=None):
        from modules.application.results import locate

        case = self.runtime.cases.get(case_id)
        if case is None:
            raise ApiError(404, "Dataset was not found.")
        path = self.runtime.cases.path(case_id)
        source = {
            "kind": "zarr",
            "path": str(path / case.flow.source) if case.flow else None,
            "case": case.model_dump(mode="json", by_alias=True),
            "caseRoot": str(path),
        }
        base_context = self.runtime.repository.result_contexts.find_one({"_id": f"case:{case_id}"}) or {}
        source.update({key: base_context[key] for key in CONTEXT_KEYS if key in base_context})
        source["validation"] = list(base_context.get("validation") or [])
        if result_id:
            for key in ("analysisKind", "supportModes", "initialFrame"):
                source.pop(key, None)
            located = locate(self.runtime.prediction_jobs, self.runtime.cases, result_id)
            if located.case_id != case_id:
                raise ApiError(404, "Result does not belong to the dataset.")
            source["path"] = str(located.store)
            source["resultRole"] = "model_wind"
            context = self.runtime.repository.result_contexts.find_one({"_id": result_id}) or {}
            if context.get("sourceRef"):
                context["sourceRef"] = {**source.get("sourceRef", {}), **context["sourceRef"]}
            source.update({key: context[key] for key in CONTEXT_KEYS if key in context})
            source["validation"].extend(context.get("validation") or [])
        return source

    def source(self, dataset_id, result_id=None):
        if result_id and (
            result_id.startswith("prediction:")
            or self.runtime.repository.datasets.find_one({"_id": result_id})
        ):
            expected = self.presentation.space({"id": dataset_id, "name": dataset_id})[0]
            actual = self.presentation.space({"id": result_id, "name": result_id})[0]
            if expected != actual or expected == "unknown:prediction":
                raise ApiError(404, "Result does not belong to the dataset.")
            return self.source(result_id)
        if dataset_id.startswith("case:"):
            return self.case_source(dataset_id[5:], result_id)
        if dataset_id.startswith("prediction:"):
            prediction_id = dataset_id.removeprefix("prediction:")
            if not re.fullmatch(r"[a-f0-9]{24}", prediction_id):
                raise ApiError(404, "Prediction dataset was not found.")
            record = self.runtime.repository.prediction(prediction_id, completed=True)
            if record is None or not record.get("npz_file_id"):
                raise ApiError(404, "Prediction dataset was not found.")
            target = self.runtime.root / "predictions" / f"{prediction_id}.npz"
            with self.runtime.prediction_lock:
                self.runtime.repository.restore_prediction(
                    record, prediction_id, target, self.runtime.settings.max_prediction_bytes
                )
            source = {
                "kind": "array",
                "paths": [str(target)],
                "mapping": {},
                "cache": str(target.with_suffix("")),
            }
            case = self.presentation.prediction_case(record)
            if case:
                geometry = self.case_source(case[0][5:])
                if geometry["case"].get("mesh"):
                    transform = (record.get("model_metadata") or {}).get("geometry_transform")
                    if transform:
                        from pydantic import ValidationError

                        from modules.domain.schemas.case import MeshSpec

                        try:
                            mesh = MeshSpec.model_validate(
                                dict(
                                    geometry["case"]["mesh"],
                                    up_axis=transform.get("up_axis"),
                                    to_world={
                                        "scale": transform.get("unit_scale"),
                                        "rotate_z_deg": transform.get("rotate_z_deg", 0),
                                        "translate": transform.get("translate", [0, 0, 0]),
                                    },
                                )
                            )
                            if not all(
                                math.isfinite(value)
                                for value in (
                                    mesh.to_world.scale,
                                    mesh.to_world.rotate_z_deg,
                                    *mesh.to_world.translate,
                                )
                            ):
                                return source
                        except (AttributeError, ValidationError):
                            return source
                        # 생성 당시 변환을 복사본에만 적용하여 원본 공간 메타데이터 보존
                        geometry["case"]["mesh"] = mesh.model_dump(mode="json")
                    source["geometrySource"] = geometry
            return source
        record = self.runtime.repository.datasets.find_one({"_id": dataset_id})
        if record is None:
            raise ApiError(404, "Dataset was not found.")
        if record["status"] != "ready":
            raise ApiError(409, "Dataset preparation is incomplete.")
        return record["source"]

    def descriptor(self, source, dataset_id, name):
        value = self.processor.process(
            "inspect", {"source": source, "assetRoot": str(self.runtime.root / "assets")}
        )
        value.update(source_context(source))
        if source.get("provenance"):
            value["provenance"] = {**(value.get("provenance") or {}), **source["provenance"]}
        context = {key: value[key] for key in ("scenarioId", "resultRole", "sourceRef") if key in value}
        if context:
            value["provenance"] = {**(value.get("provenance") or {}), **context}
        value.update(
            id=dataset_id,
            name=name,
            version=digest({"id": dataset_id, "source": source, "data": value})[:16],
            status="ready",
            results=[],
        )
        return value

    def get(self, dataset_id, result_id=None):
        return self.presentation.describe(self.describe_raw(dataset_id, result_id))

    def rename(self, dataset_id, title):
        return self.presentation.rename(self.describe_raw(dataset_id), title)

    def _result_catalog(self):
        """목록 요청에서 공간별 결과를 한 번만 조회해 구성"""
        predictions = self.runtime.repository.completed_predictions()
        datasets = list(
            self.runtime.repository.datasets.find({"status": "ready"}).sort("createdAt", 1).limit(1000)
        )
        groups = {}
        for record in predictions:
            owner = self.presentation.prediction_case(record)
            identifier = f"prediction:{record['_id']}"
            space = owner[0] if owner else self.presentation.space({"id": identifier, "name": identifier})[0]
            if space != "unknown:prediction":
                groups.setdefault(space, []).append(
                    {
                        "id": identifier,
                        "status": "succeeded",
                        "times": [],
                        "fields": [],
                        "resultRole": "model_wind",
                        "_prediction": True,
                    }
                )
        for record in datasets:
            descriptor = record["descriptor"]
            space = self.presentation.space(descriptor)[0]
            groups.setdefault(space, []).append(
                {
                    "id": descriptor["id"],
                    "name": descriptor["name"],
                    "status": "succeeded",
                    "times": descriptor.get("times", []),
                    "fields": descriptor.get("fields", []),
                    **{
                        key: descriptor[key]
                        for key in (*CONTEXT_KEYS, "capabilities", "provenance")
                        if key in descriptor
                    },
                }
            )
        return {"groups": groups, "predictions": predictions}

    def _space_results(self, dataset_id, catalog=None):
        space = self.presentation.space({"id": dataset_id, "name": dataset_id})[0]
        catalog = self._result_catalog() if catalog is None else catalog
        listed, ordinal = [], 0
        for item in catalog["groups"].get(space, []):
            if item["id"] == dataset_id:
                continue
            value = dict(item)
            if value.pop("_prediction", False):
                ordinal += 1
                value["name"] = f"Prediction #{ordinal}"
            listed.append(value)
        return listed

    def describe_raw(self, dataset_id, result_id=None, *, catalog=None):
        if result_id and (
            result_id.startswith("prediction:")
            or self.runtime.repository.datasets.find_one({"_id": result_id})
        ):
            source = self.source(dataset_id, result_id)
            base = self.describe_raw(dataset_id, catalog=catalog)
            result = self.descriptor(source, dataset_id, base["name"])
            return result | {
                "results": base["results"],
                "fileFormat": base.get("fileFormat"),
                "validation": [*base.get("validation", []), *result.get("validation", [])],
                "attribution": base.get("attribution"),
                "synthetic": base.get("synthetic", False),
            }
        if dataset_id.startswith("case:"):
            from modules.application import results
            from modules.domain.coordinates.units import canonical_unit

            source = self.source(dataset_id, result_id)
            case = self.runtime.cases.get(dataset_id[5:])
            reader = self.runtime.repository.read_flow(source["path"]) if source["path"] else None
            fields, times, grid, bounds = [], [], None, [[0, 0, 0], [1, 1, 1]]
            if reader:
                grid = reader.grid.model_dump(mode="json")
                bounds = [
                    list(reader.grid.origin),
                    [
                        a + n * h
                        for a, n, h in zip(reader.grid.origin, reader.grid.shape, reader.grid.spacing)
                    ],
                ]
                fields = [
                    {
                        "id": name,
                        "label": name.replace("_", " "),
                        "unit": canonical_unit(name) or "",
                        "association": "cell",
                        "components": 1,
                    }
                    for name in reader.channels
                ]
                if all(f"velocity_{axis}" in reader.channels for axis in "xyz"):
                    fields.insert(
                        0,
                        {
                            "id": "speed",
                            "label": "Speed",
                            "unit": "m/s",
                            "association": "cell",
                            "components": 1,
                        },
                    )
                times = [float(value) for value in reader.times()]
            listed = self._space_results(dataset_id, catalog)
            if result_id is None and self.runtime.prediction_jobs is not None:
                stored = catalog.get("execution") if catalog is not None else None
                for item in results.case_results(
                    self.runtime.prediction_jobs,
                    self.runtime.cases,
                    case.id,
                    stored_results=stored.get(case.id, []) if stored is not None else None,
                ):
                    metadata = item["result"]
                    context = self.runtime.repository.result_contexts.find_one({"_id": item["job_id"]}) or {}
                    listed.append(
                        {
                            "id": item["job_id"],
                            "name": item["job_id"],
                            "resultRole": "model_wind",
                            "status": item["job"]["state"] if item["job"] else "succeeded",
                            "times": metadata.times if metadata else [],
                            "initialFrame": metadata.history_frames
                            if metadata and metadata.history_frames < len(metadata.times)
                            else 0,
                            "fields": [
                                {
                                    "id": field.name,
                                    "label": field.name,
                                    "unit": field.unit or "",
                                    "association": "cell",
                                    "components": 1,
                                }
                                for field in metadata.channels
                            ]
                            if metadata
                            else [],
                            **{key: context[key] for key in CONTEXT_KEYS if key in context},
                        }
                    )
            revisions = []
            if case.mesh:
                for name in case.mesh.files:
                    path = self.runtime.cases.path(case.id) / name
                    information = self.runtime.cases.assets.info(path)
                    revisions.append(
                        information.get("revision")
                        if information
                        else (path.stat().st_mtime_ns if path.is_file() else None)
                    )
            return {
                "id": dataset_id,
                "name": case.name,
                "version": digest(
                    {
                        "id": dataset_id,
                        "times": times,
                        "grid": grid,
                        "result": result_id,
                        "mesh": case.mesh.model_dump(mode="json") if case.mesh else None,
                        "meshRevisions": revisions,
                        "storeRevision": self.runtime.repository.store_revision(source["path"])
                        if reader
                        else None,
                    }
                )[:16],
                "status": "ready",
                "fields": fields,
                "times": times,
                "initialFrame": reader.history_frames
                if reader and reader.history_frames < reader.n_frames
                else 0,
                "bounds": bounds,
                "grid": grid,
                "gridKind": "uniform",
                "results": listed,
                "capabilities": {
                    "geometry": case.mesh is not None,
                    "flow": bool(times),
                    "concentration": any(field["id"] == "concentration" for field in fields),
                    "timeseries": len(times) > 1,
                    "predict": case.flow is not None,
                },
                "validation": (
                    []
                    if reader or case.mesh
                    else [{"level": "warning", "message": "No readable data is available."}]
                )
                + source.get("validation", []),
                "attribution": case.attribution.model_dump(mode="json"),
                "synthetic": case.synthetic,
                "fileFormat": "/".join(sorted({Path(path).suffix[1:].upper() for path in case.mesh.files}))
                if case.mesh
                else None,
                "analysisKind": "volume" if times else "none",
                "scenarioModes": ["model"] if case.flow else [],
                "supportModes": (
                    ["points", "surface", "slice", "iso", "volume", "vectors", "streamlines"] if times else []
                )
                + (["geometry"] if case.mesh else []),
                **source_context(source),
                "provenance": reader.attrs.get("provenance") if reader else None,
            }
        record = self.runtime.repository.datasets.find_one({"_id": dataset_id})
        if record:
            if record["status"] != "ready" and self.runtime.repository.tasks.find_one(
                {"datasetId": dataset_id, "kind": "dispersion"}
            ):
                raise ApiError(404, "Dataset was not found.")
            return record["descriptor"] | {
                "status": record["status"],
                "results": self._space_results(dataset_id, catalog),
            }
        if dataset_id.startswith("prediction:"):
            return self.descriptor(self.source(dataset_id), dataset_id, f"Prediction {dataset_id[11:]}") | {
                "results": self._space_results(dataset_id, catalog)
            }
        raise ApiError(404, "Dataset was not found.")

    def list(self):
        catalog = self._result_catalog()
        if self.runtime.prediction_jobs is not None:
            from modules.application.results import scan_stored_results

            # 재시작 후 결과 저장소도 케이스별 반복 탐색 없이 한 번만 수집
            catalog["execution"] = {}
            for located in scan_stored_results(self.runtime.cases):
                catalog["execution"].setdefault(located.case_id, []).append(located)
        output = [
            self.describe_raw(f"case:{case_id}", catalog=catalog) for case_id in self.runtime.cases.ids()
        ]
        unfinished = {
            item["datasetId"]
            for item in self.runtime.repository.tasks.find(
                {"kind": "dispersion", "status": {"$ne": "succeeded"}}, {"datasetId": 1}
            )
        }
        output.extend(
            record["descriptor"] | {"status": record["status"]}
            for record in self.runtime.repository.datasets.find({}).sort("createdAt", -1).limit(1000)
            if record["status"] == "ready" or record["_id"] not in unfinished
        )
        for record in catalog["predictions"]:
            if self.presentation.prediction_case(record):
                continue
            dataset_id = f"prediction:{record['_id']}"
            try:
                output.append(self.describe_raw(dataset_id, catalog=catalog))
            except ApiError:
                output.append(
                    {
                        "id": dataset_id,
                        "name": f"Prediction {record['_id']}",
                        "status": "unavailable",
                        "fields": [],
                        "times": [],
                        "results": [],
                        "bounds": [[0, 0, 0], [1, 1, 1]],
                        "capabilities": {},
                        "validation": [{"level": "error", "message": "Prediction cannot be read."}],
                    }
                )
        return {"datasets": self.presentation.describe_all(output)}
