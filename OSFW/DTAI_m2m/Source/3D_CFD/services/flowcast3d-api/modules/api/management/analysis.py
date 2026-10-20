from fastapi import APIRouter, Request
from pydantic import BaseModel, FiniteFloat

from modules.application import analysis
from modules.application.results import locate, open_store

router = APIRouter(prefix="/analysis")

Point = tuple[FiniteFloat, FiniteFloat, FiniteFloat]


class ProbeRequest(BaseModel):
    result: str
    point: Point
    # 음수는 완료 프레임의 끝에서부터 계산
    frame: int = -1


class TimeseriesRequest(BaseModel):
    result: str
    point: Point


class RegionRequest(BaseModel):
    result: str
    box: tuple[Point, Point]
    frame: int = -1


class CompareRequest(BaseModel):
    result: str
    frame: int = -1


def _open(request, job_id):
    located = locate(request.app.state.jobs, request.app.state.cases, job_id)
    return located, open_store(located, request.app.state.cases.stores)


@router.post("/probe")
def probe(body: ProbeRequest, request: Request):
    _, reader = _open(request, body.result)
    return {"result": body.result, **analysis.probe(reader, body.point, body.frame)}


@router.post("/timeseries")
def timeseries(body: TimeseriesRequest, request: Request):
    _, reader = _open(request, body.result)
    return {"result": body.result, **analysis.timeseries(reader, body.point)}


@router.post("/region")
def region(body: RegionRequest, request: Request):
    _, reader = _open(request, body.result)
    return {"result": body.result, **analysis.region(reader, body.box, body.frame)}


@router.post("/compare")
def compare(body: CompareRequest, request: Request):
    located, reader = _open(request, body.result)
    reference, reason = analysis.open_reference(request.app.state.cases, located.case_id)
    return {"result": body.result, **analysis.compare(reader, reference, body.frame, reason)}
