from dataclasses import dataclass
from pathlib import Path

from modules.application.cases import load
from modules.application.jobs import LIVE, is_live, view
from modules.domain.errors import ApiError, StoreError
from modules.domain.identifiers import NAME
from modules.domain.schemas import ResultMetadata
from modules.domain.schemas.job import Job

ROLLOUT = ".prediction.zarr"


@dataclass
class Located:
    job_id: str
    case_id: str
    store: Path
    job: Job | None = None


def locate(jobs, cases, job_id):
    # 현재 프로세스의 작업에서 결과 저장소 위치 조회
    job = jobs.repository.get(job_id)
    if job:
        return Located(job_id, job.spec.case_id, Path(job.spec.output), job)

    # 재시작 후에는 결과의 출처와 이전 기본 경로로 검색
    if NAME.fullmatch(job_id):
        matches = [located for located in scan_stored_results(cases) if located.job_id == job_id]
        if len(matches) > 1:
            raise ApiError(409, f"result {job_id!r} has multiple stores")
        if matches:
            return matches[0]
    raise ApiError(404, f"result {job_id!r} not found")


def _provenance(attrs):
    value = attrs.get("provenance")
    return value if isinstance(value, dict) else {}


def _auxiliary(path, attrs, storage):
    if not path.name.endswith(ROLLOUT):
        return False
    primary = path.with_name(path.name.removesuffix(ROLLOUT) + ".zarr")
    if not storage.exists(primary):
        return False
    main = storage.attrs(primary)
    for record in (attrs, main):
        prediction = record.get("prediction")
        if isinstance(prediction, dict) and prediction.get("rollout_store") == path.name:
            return True
    job_id, main_id = _provenance(attrs).get("job_id"), _provenance(main).get("job_id")
    return job_id == main_id


def scan_stored_results(cases):
    """작업 상태를 복원하지 않고 저장된 결과의 위치만 탐색"""
    root, case_root = cases.root.parent.resolve(), cases.root.resolve()
    descriptors = {}
    for name in cases.stores.list(root):
        # 데이터 경계와 케이스 경계를 벗어난 논리 경로 제외
        try:
            path = Path(name)
            if not path.is_absolute() or not path.name.endswith(".zarr"):
                continue
            path = path.resolve()
            if not path.is_relative_to(root):
                continue
            relative = path.relative_to(case_root) if path.is_relative_to(case_root) else None
            owner = relative.parts[0] if relative and len(relative.parts) > 1 else None
            if relative is not None and owner is None:
                continue
            canonical = relative is not None and relative.parts[1:-1] in (("results",), ("results", "live"))
            attrs = cases.stores.attrs(path)
            provenance = _provenance(attrs)
            case_id = provenance.get("case_id", owner) if canonical else provenance.get("case_id")
            if not isinstance(case_id, str) or (owner is not None and owner != case_id):
                continue
            directory = cases.path(case_id)
        except (ApiError, OSError, RuntimeError, ValueError):
            continue

        # 입력과 참조 저장소는 결과 출처가 있어도 목록에서 제외
        if case_id not in descriptors:
            try:
                descriptors[case_id] = load(cases, case_id)
            except ApiError as error:
                if error.status == 503:
                    raise
                descriptors[case_id] = None
        case = descriptors[case_id]
        if case is not None:
            inputs = [case.flow.source if case.flow else None, case.reference]
            if path in {(directory / value).resolve() for value in inputs if value is not None}:
                continue
        elif not canonical:
            continue

        # 사용자 지정 출력은 예측 출처로 식별하고 보조 격자는 제외
        job_id = provenance.get("job_id", path.stem if canonical else None)
        if not isinstance(job_id, str) or not NAME.fullmatch(job_id):
            continue
        if not canonical and not isinstance(attrs.get("prediction"), dict):
            continue
        if _auxiliary(path, attrs, cases.stores):
            continue
        yield Located(job_id, case_id, path)


def _unreadable(located, error):
    return ApiError(404, f"result {located.job_id!r} has no readable store: {error}")


def open_store(located, storage):
    try:
        return storage.read(located.store)
    except StoreError as error:
        raise _unreadable(located, error) from None


def describe(cases, located, reader):
    try:
        try:
            case = load(cases, located.case_id)
            synthetic, attribution = case.synthetic, case.attribution
        except ApiError:
            provenance = reader.attrs.get("provenance") or {}
            synthetic, attribution = bool(provenance.get("synthetic", False)), provenance.get("attribution")
        origin = (
            is_live(cases, located.job)
            if located.job
            else located.store.resolve().is_relative_to((cases.path(located.case_id) / LIVE).resolve())
        )
        recorded = (
            {"state": located.job.status.state, "created_at": located.job.status.created_at}
            if located.job
            else {}
        )
        prediction = reader.attrs.get("prediction") or {}
        recorded["model"] = prediction.get("model", ResultMetadata.model_fields["model"].default)
        result = ResultMetadata.from_store(
            reader.path,
            reader.attrs,
            reader.times(),
            job_id=located.job_id,
            case_id=located.case_id,
            origin="live" if origin else "batch",
            synthetic=synthetic,
            attribution=attribution,
            **recorded,
        )
        if located.job and located.job.spec.source.inflow is not None:
            # 이전 결과의 누락된 바람 조건은 요청값으로 보충
            prediction = dict(result.prediction or {})
            if prediction.get("inflow") is None:
                prediction["inflow"] = located.job.spec.source.inflow.model_dump(mode="json")
                result.prediction = prediction
        return result
    except (ValueError, TypeError, AttributeError) as error:
        raise StoreError(f"{reader.path} has invalid result attributes: {error}") from None


def metadata(jobs, cases, job_id):
    located = locate(jobs, cases, job_id)
    try:
        return describe(cases, located, cases.stores.read(located.store))
    except StoreError as error:
        raise _unreadable(located, error) from None


def case_results(jobs, cases, case_id, *, stored_results=None):
    # 현재 작업과 저장된 결과를 함께 수집
    load(cases, case_id)
    listed, executor = jobs.list(case_id)
    found = [Located(job.status.job_id, case_id, Path(job.spec.output), job) for job in listed]
    claimed = {located.store.resolve() for located in found}
    current = {located.job_id for located in found}
    stored = {}

    # 메모리에서 사라진 작업도 사용자 지정 출력의 출처로 조회
    for located in scan_stored_results(cases) if stored_results is None else stored_results:
        if located.case_id != case_id or located.store in claimed or located.job_id in current:
            continue
        if located.job_id in stored and stored[located.job_id].store != located.store:
            raise ApiError(409, f"result {located.job_id!r} has multiple stores")
        stored[located.job_id] = located
    found.extend(stored.values())

    # 읽을 수 있는 결과 정보와 작업 상태 조립
    entries = []
    for located in found:
        try:
            result = describe(cases, located, cases.stores.read(located.store))
        except StoreError:
            result = None
        entries.append(
            {
                "job_id": located.job_id,
                "job": view(located.job, executor) if located.job else None,
                "result": result,
            }
        )
    return entries
