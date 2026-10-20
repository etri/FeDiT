from fastapi import APIRouter, Request

from modules.application.jobs import JobRequest, LiveRequest, view

router = APIRouter()


@router.post("/jobs", status_code=202)
def submit_job(body: JobRequest, request: Request):
    return view(*request.app.state.jobs.submit(body))


@router.post("/cases/{case_id}/live", status_code=202)
def start_live(case_id: str, body: LiveRequest, request: Request):
    """실시간 예측을 시작하고 지정한 이전 작업 중단"""
    return view(*request.app.state.jobs.live(case_id, body))


@router.get("/jobs")
def list_jobs(request: Request):
    jobs, executor = request.app.state.jobs.list()
    return [view(job, executor) for job in jobs]


@router.get("/jobs/{job_id}")
def get_job(job_id: str, request: Request):
    return view(*request.app.state.jobs.get(job_id))


@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: str, request: Request):
    return view(request.app.state.jobs.cancel(job_id))


@router.post("/jobs/{job_id}/retry")
def retry_job(job_id: str, request: Request):
    return view(request.app.state.jobs.retry(job_id))
