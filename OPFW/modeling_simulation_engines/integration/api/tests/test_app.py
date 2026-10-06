# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2022-2026 E8IGHT Co., Ltd.
"""API 경로 테스트 (FastAPI TestClient). 가짜 해석기로 실행 요청 → 대기열 → 완료 알림 → 다운로드까지 본다.

실행: python -m unittest tests.test_app -v   (api 폴더에서, fastapi·httpx·python-multipart 필요)
"""
import io
import json
import os
import sys
import tempfile
import time
import unittest
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
sys.path.insert(0, str(HERE))

from test_core import Receiver, make_config  # noqa: E402

TMP = tempfile.TemporaryDirectory()
RX = Receiver()
FAKE = f'"{sys.executable}" "{HERE / "fake_solver.py"}"'
os.environ.update(JOBS_ROOT=TMP.name, ENGINE_CMD_LBM=FAKE, ENGINE_CMD_LBM_DEM=FAKE,
                  FEDIT_RESULT_URL=RX.url, CALLBACK_ATTEMPTS='1', CALLBACK_DELAY_S='0')

from fastapi.testclient import TestClient  # noqa: E402

from engine_api import app as app_module  # noqa: E402
from engine_api import core  # noqa: E402

# Settings.from_env는 shlex(POSIX 규칙)로 명령을 나눈다. Windows 경로의 '\'가 지워지므로 테스트에서는 목록으로 넣는다.
FAKE_CMD = [sys.executable, str(HERE / 'fake_solver.py')]
app_module.settings.commands.update(lbm=FAKE_CMD, lbm_dem=FAKE_CMD)


def submit(client, job_id, cfg, files=(), engine='lbm', name='case.json'):
    multipart = [('config', (name, cfg, 'application/json'))] + [('files', (n, d, 'application/octet-stream')) for n, d in files]
    return client.post('/jobs', data={'job_id': job_id, 'engine': engine}, files=multipart)


def wait_done(job_id, timeout=20):
    deadline = time.time() + timeout
    while time.time() < deadline:
        state = app_module.store.read(job_id)
        if state and state['status'] in ('completed', 'failed') and 'callback' in state:
            return state
        time.sleep(0.05)
    raise AssertionError(f'{job_id} did not finish')


class TestApp(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app_module.app)
        cls.client.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client.__exit__(None, None, None)
        RX.close()

    def test_1_run_queue_callback_download(self):
        slow = make_config(title='video', mesh=['wall.stl'], fake={'saves': 3, 'sleep': 0.3, 'grid1': True})
        r1 = submit(self.client, 'job_a', slow, files=[('wall.stl', b'stl')], engine='lbm_dem')
        r2 = submit(self.client, 'job_b', make_config(fake={'saves': 2}))
        self.assertEqual((r1.status_code, r1.json()['status']), (202, 'running'))
        self.assertEqual((r2.status_code, r2.json()), (202, {
            'job_id': 'job_b', 'status': 'queued', 'message': 'Waiting for the previous job to finish.'}))

        # 실행 중이거나 대기 중인 작업은 받을 수도, 지울 수도 없다
        self.assertEqual(self.client.get('/jobs/job_b/download').status_code, 409)
        r = self.client.delete('/jobs/job_b')
        self.assertEqual((r.status_code, r.json()['status']), (409, 'queued'))
        r = self.client.get('/jobs/job_b')
        self.assertEqual((r.status_code, r.json()['status'], r.json()['progress']), (200, 'queued', None))

        a, b = wait_done('job_a'), wait_done('job_b')
        self.assertEqual((a['status'], b['status']), ('completed', 'completed'))
        self.assertLessEqual(a['finished_at'], b['started_at'])  # 한 번에 하나씩
        payloads = [p for _, p in RX.received]
        self.assertIn({'job_id': 'job_a', 'status': 'completed', 'message': 'Analysis done.',
                       'result_path': 'job_a/case/'}, payloads)

        r = self.client.get('/jobs/job_a/download')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.headers['content-type'], 'application/zip')
        self.assertIn('job_a_last.zip', r.headers['content-disposition'])
        with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
            self.assertEqual(sorted(zf.namelist()), sorted([
                'case.json', 'wall.stl', 'run.log', 'run.err.log', 'case/video_2.vtm',
                'case/bin/LEVEL_00/video_2.vtu', 'case/video_grid1_2.vtk']))
        r = self.client.get('/jobs/job_a/download', params={'range': 'all'})
        with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
            self.assertEqual(len([n for n in zf.namelist() if n.endswith('.vtm')]), 3)
            self.assertFalse([n for n in zf.namelist() if '/continue/' in n])

        r = self.client.get('/jobs/job_a')
        self.assertEqual(r.status_code, 200)
        self.assertEqual((r.json()['status'], r.json()['result_path']), ('completed', 'job_a/case/'))
        self.assertEqual(r.json()['progress'], {'step': 3, 'total_steps': 3, 'percent': 100.0})
        r = self.client.delete('/jobs/job_b')
        self.assertEqual(r.json(), {'job_id': 'job_b', 'status': 'deleted', 'message': 'Job folder deleted.'})
        self.assertFalse((Path(TMP.name) / 'job_b').exists())
        self.assertEqual(self.client.get('/jobs/job_b').status_code, 404)
        self.assertEqual(self.client.delete('/jobs/job_b').status_code, 404)

    def test_3_health(self):
        real = core.query_gpus
        core.query_gpus = lambda timeout=5.0: [{'name': 'Fake GPU', 'driver': '1', 'memory': '1 MiB'}]
        try:
            r = self.client.get('/health')
            self.assertEqual((r.status_code, r.json()['status'], r.json()['queued_jobs']), (200, 'ok', 0))
            core.query_gpus = lambda timeout=5.0: []
            self.assertEqual(self.client.get('/health').status_code, 503)
        finally:
            core.query_gpus = real

    def test_2_errors(self):
        r = submit(self.client, 'job_x', make_config(mesh=['wall.stl']))
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.json(), {'job_id': 'job_x', 'status': 'rejected',
                                    'message': "mesh_path 'wall.stl' is referenced in config but was not uploaded."})
        r = self.client.post('/jobs', data={'job_id': 'job_y', 'engine': 'lbm'})  # config 없음
        self.assertEqual((r.status_code, r.json()['status']), (400, 'rejected'))
        self.assertEqual(self.client.get('/jobs/nope/download').status_code, 404)
        self.assertEqual(self.client.get('/jobs/..%2F..%2Fetc/download').status_code, 404)

        submit(self.client, 'job_fail', make_config(fake={'mode': 'diverge'}))
        state = wait_done('job_fail')
        self.assertEqual(state['message'], 'Solver diverged (RC -4001).')
        r = self.client.get('/jobs/job_fail/download')
        self.assertEqual((r.status_code, r.json()['status']), (409, 'failed'))
        r = self.client.get('/jobs/job_a/download', params={'range': 'some'})
        self.assertEqual(r.status_code, 400)


if __name__ == '__main__':
    unittest.main()
