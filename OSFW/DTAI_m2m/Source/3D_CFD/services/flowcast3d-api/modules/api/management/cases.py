from fastapi import APIRouter, Request

from modules.application import cases, results
from modules.application import domain_setup as domain
from modules.application.ingest import IngestRequest
from modules.domain.schemas import Case

router = APIRouter()


@router.get("/cases")
def list_cases(request: Request):
    return cases.list_cases(request.app.state.cases)


@router.post("/cases", status_code=201)
def create_case(case: Case, request: Request):
    return cases.create(request.app.state.cases, case)


@router.get("/cases/{case_id}")
def get_case(case_id: str, request: Request):
    return cases.describe(request.app.state.cases, cases.load(request.app.state.cases, case_id))


@router.put("/cases/{case_id}/mesh/transform")
def set_mesh_transform(case_id: str, transform: cases.MeshTransform, request: Request):
    return cases.set_mesh_transform(request.app.state.cases, case_id, transform)


@router.get("/cases/{case_id}/results")
def list_case_results(case_id: str, request: Request):
    return results.case_results(request.app.state.jobs, request.app.state.cases, case_id)


@router.post("/cases/{case_id}/ingest", status_code=202)
def ingest(case_id: str, body: IngestRequest, request: Request):
    return request.app.state.ingests.start(case_id, body)


@router.post("/cases/{case_id}/domain", status_code=201)
def create_domain(case_id: str, request: Request):
    """메시를 감싸는 빈 예측 영역 생성"""
    return domain.create(request.app.state.cases, case_id)


@router.get("/ingests/{ingest_id}")
def get_ingest(ingest_id: str, request: Request):
    return request.app.state.ingests.get(ingest_id)
