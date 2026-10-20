import logging
import math
import os
from typing import Literal

from pydantic import BaseModel, ConfigDict, ValidationError

from modules.domain.errors import ApiError
from modules.domain.schemas.case import MeshSpec, ToWorld

logger = logging.getLogger(__name__)

# 좌표 변환을 바꿔도 기존 마스크는 다시 복셀화하지 않음
MASKS_KEPT = (
    "building masks that were already voxelised with the previous transform (the case's flow source and its results) "
    "are not recomputed; upload the initial flow again to voxelise the mesh with the new transform"
)


class MeshTransform(BaseModel):
    model_config = ConfigDict(extra="forbid")

    up_axis: Literal["z", "y"]
    to_world: ToWorld


def load(cases, case_id):
    try:
        case = cases.get(case_id)
    except ValidationError as error:
        raise ApiError(
            500, f"Case metadata of {case_id!r} is invalid: {error.errors(include_url=False)}"
        ) from None
    if case is None:
        raise ApiError(404, f"case {case_id!r} not found")
    return case


def describe(cases, case):
    return {"case": case.model_dump(mode="json", by_alias=True), "files": cases.files(case)}


def list_cases(cases):
    found = []
    for case_id in cases.ids():
        try:
            found.append(describe(cases, load(cases, case_id)))
        except ApiError as error:
            # 깨진 기술서는 목록에서 제외
            logger.warning("skipping case %s: %s", case_id, error.detail)
    return found


def check_finite(to_world):
    # JSON 재읽기에 실패하는 NaN 거절
    if not all(map(math.isfinite, (to_world.scale, to_world.rotate_z_deg, *to_world.translate))):
        raise ApiError(422, "mesh.to_world must be finite")


def check_store_path(path):
    """MongoDB 저장 정책을 우회하는 로컬 경로 거절"""
    if os.getenv("FLOWCAST_RESULT_STORAGE", "").lower() == "mongodb" and not str(path).endswith(".zarr"):
        raise ApiError(422, "MongoDB flow and reference store paths must end with .zarr")


def create(cases, case):
    directory = cases.path(case.id)
    if case.mesh:
        check_finite(case.mesh.to_world)
    for relative in [
        *(case.mesh.files if case.mesh else []),
        *([case.flow.source] if case.flow else []),
        case.reference,
    ]:
        if relative is not None:
            cases.confine(relative, directory, directory)
    for relative in (case.flow.source if case.flow else None, case.reference):
        if relative is not None:
            check_store_path(relative)
    try:
        cases.create(case)
    except FileExistsError:
        raise ApiError(409, f"case {case.id!r} already exists") from None
    return describe(cases, case)


def set_mesh_transform(cases, case_id, transform):
    check_finite(transform.to_world)
    with cases.lock:
        case = load(cases, case_id)
        if case.mesh is None:
            raise ApiError(
                409, f"case {case_id!r} has no mesh: upload the mesh first, then set its transform"
            )
        case.mesh = MeshSpec(files=case.mesh.files, **transform.model_dump())
        cases.save(case)
    return describe(cases, case) | {"note": MASKS_KEPT}
