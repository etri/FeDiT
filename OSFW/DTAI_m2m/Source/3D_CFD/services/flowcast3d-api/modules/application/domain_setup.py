import math

import numpy as np

from modules.application.cases import check_store_path, describe, load
from modules.domain.coordinates import mesh_matrix
from modules.domain.errors import ApiError, MeshError
from modules.domain.schemas import SCHEMA, FlowMetadata, Grid
from modules.domain.schemas.case import FlowSource

TARGET = "flow/source.zarr"  # Case 기준 기본 초기 유동장 경로
SHAPE = (128, 128, 64)
# 형상 둘레의 수평 여유와 영역 높이(H 배수)
# 128셀 격자의 건물 해상도를 위해 여유 폭 3H 사용
MARGIN, TOP = 3.0, 3.0
CHANNELS = ("velocity_x", "velocity_y", "velocity_z", "pressure")
TIME_STEP = 1.0  # 합성 이력과 예측 프레임 간격(초)
BOUNDARY_CONDITIONS = {"x": ("open", "open"), "y": ("open", "open"), "z": ("wall", "open")}
CHUNK = (64, 64, 64)  # 공간 청크 크기(셀)
DECIMALS = 2  # 격자 간격은 올림, 원점은 반올림(cm)


def plan(low, high):
    low, high = np.asarray(low, dtype=np.float64), np.asarray(high, dtype=np.float64)
    height = float(high[2] - low[2])
    if not height > 0:
        raise ApiError(
            422, "the mesh is flat: a prediction domain needs geometry that rises above its lowest point"
        )
    side = float(max(high[:2] - low[:2])) + 2 * MARGIN * height
    unit = 10.0**DECIMALS
    spacing = (
        math.ceil(side / SHAPE[0] * unit) / unit,
        math.ceil(side / SHAPE[1] * unit) / unit,
        math.ceil(TOP * height / SHAPE[2] * unit) / unit,
    )
    centre = (low + high) / 2
    origin = (
        round(float(centre[0]) - SHAPE[0] * spacing[0] / 2, DECIMALS),
        round(float(centre[1]) - SHAPE[1] * spacing[1] / 2, DECIMALS),
        float(low[2]),
    )
    return Grid(crs="local", origin=origin, spacing=spacing, shape=SHAPE)


def write_store(storage, path, grid, provenance):
    """준비용 저장소에 기록을 마친 뒤 최종 이름으로 공개"""
    # 초기 유동장의 격자와 물리 규격 구성
    metadata = FlowMetadata(
        schema=SCHEMA,
        grid=grid,
        channels=list(CHANNELS),
        time_step=TIME_STEP,
        boundary_conditions=BOUNDARY_CONDITIONS,
    )

    # 준비 저장소에 빈 배열과 생성 정보 기록
    partial = path.with_name(f".{path.name}.partial")
    storage.mapping(partial).clear()
    store = storage.create(partial, metadata, chunk=CHUNK, overwrite=True)
    store.attrs["provenance"] = provenance

    # 완성한 저장소를 요청 논리 경로로 공개
    storage.rename(partial, path)


def create(cases, case_id):
    # 메시 자산과 초기 유동장 생성 경로 확인
    case = load(cases, case_id)
    directory = cases.path(case_id)
    files = [
        directory / name
        for name in (case.mesh.files if case.mesh else [])
        if cases.assets.exists(directory / name)
    ]
    if not files:
        raise ApiError(409, f"case {case_id!r} has no mesh files: ingest a mesh first")
    relative = case.flow.source if case.flow else TARGET
    target = cases.confine(relative, directory, directory)
    check_store_path(target)
    if cases.stores.exists(target):
        raise ApiError(409, f"case {case_id!r} already has a flow source at {relative}")

    # 메시 좌표 변환과 예측 격자 계산
    matrix = mesh_matrix(case.mesh.up_axis, **case.mesh.to_world.model_dump())
    try:
        low, high = cases.geometry_bounds(files, matrix)
    except (MeshError, OSError) as error:
        raise ApiError(422, f"the mesh cannot be read: {error}") from None
    grid = plan(low, high)
    provenance = {
        "generator": "modules.application.domain_setup",
        "note": "empty prediction domain around the case mesh; live predictions synthesise the initial flow",
        "synthetic": True,
        "mesh_bounds": [low.tolist(), high.tolist()],
        "margin_heights": MARGIN,
        "top_heights": TOP,
    }

    with cases.lock:
        # 동시 생성 방지를 위해 잠금 안에서 재확인
        if cases.stores.exists(target):
            raise ApiError(409, f"case {case_id!r} already has a flow source at {relative}")
        write_store(cases.stores, target, grid, provenance)
        case = load(cases, case_id)
        case.flow = FlowSource(source=relative)
        cases.save(case)
    return describe(cases, case) | {"grid": grid.model_dump(mode="json")}
