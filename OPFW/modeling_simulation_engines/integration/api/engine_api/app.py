# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2022-2026 E8IGHT Co., Ltd.
"""해석엔진 Python Main API (FastAPI).

경로는 README 2절의 다섯 가지다.
  POST   /jobs                     해석 실행 (2.1절)
  GET    /jobs/{job_id}/download   결과 다운로드 (2.2절)
  GET    /jobs/{job_id}            상태 조회, 진행률 포함 (2.3절)
  DELETE /jobs/{job_id}            끝난 작업의 폴더 삭제 (2.4절)
  GET    /health                   서버 상태: GPU, 대기열, 해석기 빌드 정보 (2.5절)
해석이 끝나면 FEDIT_RESULT_URL로 완료를 알린다(3절, core.notify_web).

환경 변수
  JOBS_ROOT            작업 루트(공유 폴더). 기본 /jobs
  ENGINE_CMD_LBM       lbm 실행 명령. 기본 NFLOW_LBM
  ENGINE_CMD_LBM_DEM   lbm_dem 실행 명령. 기본 NFLOW_LBM_DEM
  FEDIT_RESULT_URL     FeDiT 결과 수신 API 주소. 없으면 알리지 않고 작업 상태에만 남긴다
  FEDIT_RESULT_TOKEN   있으면 알림에 'Authorization: Bearer <값>'을 붙인다
  CALLBACK_ATTEMPTS, CALLBACK_DELAY_S   알림 재시도 횟수(기본 3)와 간격(기본 5초)
  ENGINE_BUILD_INFO    해석기 빌드 정보 파일. 기본 /opt/engine/BUILD_INFO.txt
"""
from __future__ import annotations

import logging
import threading
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, File, Form, Query, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse, StreamingResponse

from . import core

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')

settings = core.Settings.from_env()
store = core.JobStore(settings.jobs_root)
scheduler = core.Scheduler(lambda job_id: core.run_job(settings, store, job_id))

MESSAGES = {'running': 'Solver started successfully.',
            'queued': 'Waiting for the previous job to finish.'}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings.jobs_root.mkdir(parents=True, exist_ok=True)
    # 재시작 전 작업 정리. 알림 재시도로 시작이 늦어지지 않게 따로 돌린다.
    threading.Thread(target=core.recover, args=(settings, store, scheduler), daemon=True).start()
    yield


app = FastAPI(title='FeDiT Engine API', version='0.1.0', lifespan=lifespan,
              description='해석엔진–FeDiT 연동 API. 설계와 사용법: integration/README.md')


@app.post('/jobs', status_code=202)
async def submit_job(job_id: Optional[str] = Form(None),
                     engine: Optional[str] = Form(None),
                     config: Optional[UploadFile] = File(None),
                     files: Optional[List[UploadFile]] = File(None)):
    """해석 입력을 받아 확인하고 실행한다. 앞 작업이 있으면 대기열에 넣는다."""
    config_bytes = await config.read() if config is not None else None
    uploads = [(f.filename, await f.read()) for f in (files or [])]
    try:
        await run_in_threadpool(core.prepare_job, store, job_id, engine,
                                config.filename if config is not None else None, config_bytes, uploads)
    except core.InputError as e:
        return JSONResponse(status_code=400,
                            content={'job_id': job_id, 'status': 'rejected', 'message': str(e)})
    status = scheduler.submit(job_id)
    return {'job_id': job_id, 'status': status, 'message': MESSAGES[status]}


@app.get('/jobs/{job_id}/download')
def download(job_id: str, scope: str = Query('last', alias='range')):
    """끝난 해석의 결과를 ZIP으로 묶으면서 내려준다. range=last(기본) 또는 all."""
    state = store.read(job_id)
    if state is None:
        return JSONResponse(status_code=404, content={
            'job_id': job_id, 'status': 'not_found', 'message': f"job_id '{job_id}' does not exist."})
    if scope not in ('last', 'all'):
        return JSONResponse(status_code=400, content={
            'job_id': job_id, 'status': state['status'], 'message': "range must be 'last' or 'all'."})
    if state['status'] != 'completed':
        return JSONResponse(status_code=409, content={
            'job_id': job_id, 'status': state['status'],
            'message': f"Results can be downloaded only for completed jobs (status: {state['status']})."})
    entries = core.download_entries(store, job_id, scope)
    return StreamingResponse(core.iter_zip(entries), media_type='application/zip',
                             headers={'Content-Disposition': f'attachment; filename="{job_id}_{scope}.zip"'})


def _not_found(job_id: str) -> JSONResponse:
    return JSONResponse(status_code=404, content={
        'job_id': job_id, 'status': 'not_found', 'message': f"job_id '{job_id}' does not exist."})


@app.get('/jobs/{job_id}')
def get_job(job_id: str):
    """작업 상태. 완료 알림을 놓쳤거나 대기 중인 작업이 언제 시작했는지 볼 때 쓴다. 실행 중이면 진행률이 있다."""
    state = core.job_status(store, job_id)
    return state if state is not None else _not_found(job_id)


@app.delete('/jobs/{job_id}')
def delete_job(job_id: str):
    """끝난 작업(completed, failed)의 작업 폴더를 지운다. 대기·실행 중이면 409."""
    try:
        deleted = core.delete_job(store, job_id)
    except core.JobConflict as e:
        state = store.read(job_id) or {}
        return JSONResponse(status_code=409, content={
            'job_id': job_id, 'status': state.get('status'), 'message': str(e)})
    if not deleted:
        return _not_found(job_id)
    return {'job_id': job_id, 'status': 'deleted', 'message': 'Job folder deleted.'}


@app.get('/health')
def get_health():
    """엔진 상태. GPU가 안 보이면 503. Docker HEALTHCHECK와 FeDiT의 '엔진 사용 가능' 표시에 쓴다."""
    code, body = core.health(settings, scheduler)
    return JSONResponse(status_code=code, content=body)
