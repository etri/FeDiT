from fastapi import APIRouter, Request

from modules.application import results

router = APIRouter()


@router.get("/results/{job_id}")
def get_result(job_id: str, request: Request):
    return results.metadata(request.app.state.jobs, request.app.state.cases, job_id)
