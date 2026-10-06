# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2022-2026 E8IGHT Co., Ltd.
"""engine_api.core 단위 테스트. 표준 unittest만 쓴다(이미지 안 Python 3.10에서도 돈다).

실행: python -m unittest discover -s tests -v   (api 폴더에서)
"""
import io
import json
import sys
import tempfile
import threading
import time
import unittest
import zipfile
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from engine_api import core  # noqa: E402

FAKE = [sys.executable, str(Path(__file__).with_name('fake_solver.py'))]


def make_config(title='case', mesh=(), fake=None, export_path=''):
    cfg = {'meta': {'version': 202412, 'title': title},
           'config': {'result_report': {'export_path': export_path},
                      'lattice_generation': [{'regional_segment': [{'mesh_path': m} for m in mesh]}]}}
    if fake is not None:
        cfg['fake'] = fake
    return json.dumps(cfg).encode()


class Receiver:
    """Engine -> Web 알림을 받는 작은 HTTP 서버. status_code로 응답 코드를 정한다."""

    def __init__(self, status_code=200):
        received, code = [], status_code

        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                body = self.rfile.read(int(self.headers['Content-Length']))
                received.append((dict(self.headers), json.loads(body)))
                self.send_response(code)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "completed", "message": "Result received successfully."}')

            def log_message(self, *args):
                pass

        self.received = received
        self.server = HTTPServer(('127.0.0.1', 0), Handler)
        self.url = f'http://127.0.0.1:{self.server.server_port}/engine/result'
        threading.Thread(target=self.server.serve_forever, daemon=True).start()

    def close(self):
        self.server.shutdown()
        self.server.server_close()


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.store = core.JobStore(self.root)
        self.settings = core.Settings(jobs_root=self.root, commands={'lbm': FAKE, 'lbm_dem': FAKE},
                                      callback_attempts=2, callback_delay_s=0.05)

    def tearDown(self):
        self.tmp.cleanup()

    def prepare(self, job_id='case_001', engine='lbm', cfg=None, files=(), name='case.json'):
        core.prepare_job(self.store, job_id, engine, name, cfg if cfg is not None else make_config(), list(files))


class TestPrepareJob(Base):
    def assertRejected(self, fragment, **kw):
        with self.assertRaises(core.InputError) as ctx:
            self.prepare(**kw)
        self.assertIn(fragment, str(ctx.exception))

    def test_rejects_bad_inputs(self):
        self.assertRejected('job_id', job_id='../x')
        self.assertRejected('job_id', job_id='')
        self.assertRejected('engine must be one of', engine='thermal')
        self.assertRejected('not valid JSON', cfg=b'{oops')
        self.assertRejected('must end with .json', name='case.txt')
        self.assertRejected('plain file name', name='../case.json')
        self.assertRejected('plain file name', files=[('a/wall.stl', b'x')])
        self.assertRejected('reserved', files=[('run.log', b'x')])
        self.assertRejected('more than once', files=[('w.stl', b'x'), ('w.stl', b'y')])
        self.assertRejected('meta.title', cfg=make_config(title='../evil'))
        self.assertRejected("mesh_path 'wall.stl'", cfg=make_config(mesh=['wall.stl']))
        self.assertRejected('mesh_path', cfg=make_config(mesh=['sub/wall.stl']), files=[('wall.stl', b'x')])
        self.assertEqual(list(self.root.iterdir()), [], 'rejected input must not create a job folder')

    def test_rejects_existing_job(self):
        self.prepare()
        self.assertRejected('already exists')

    def test_writes_inputs_and_clears_export_path(self):
        self.prepare(cfg=make_config(mesh=['wall.stl'], export_path='/elsewhere'), files=[('wall.stl', b'stl')])
        job = self.root / 'case_001'
        cfg = json.loads((job / 'case.json').read_text(encoding='utf-8'))
        self.assertEqual(cfg['config']['result_report']['export_path'], '')
        self.assertEqual((job / 'wall.stl').read_bytes(), b'stl')
        state = self.store.read('case_001')
        self.assertEqual((state['status'], state['engine'], state['inputs']), ('queued', 'lbm', ['wall.stl']))

    def test_keeps_config_bytes_when_export_path_empty(self):
        raw = make_config()
        self.prepare(cfg=raw)
        self.assertEqual((self.root / 'case_001' / 'case.json').read_bytes(), raw)


class TestJudge(unittest.TestCase):
    OK = 'step\n\x1b[32mAnalysis Done\x1b[0m\nRC : 0, SUCCESS: Analysis Done\n'

    def test_cases(self):
        self.assertEqual(core.judge('lbm', 0, self.OK), ('completed', 'Analysis done.'))
        # lbm은 종료 코드로 판정한다. 다상의 진단 출력 'averaged_vel = -nan'은 실패가 아니다.
        self.assertEqual(core.judge('lbm', 0, 'averaged_vel = -nan\n' + self.OK)[0], 'completed')
        self.assertEqual(core.judge('lbm', 1, 'RC : -4001, ERROR: diverged\n'),
                         ('failed', 'Solver diverged (RC -4001).'))
        self.assertEqual(core.judge('lbm', 1, 'RC : -2002, ERROR: key not found\n'),
                         ('failed', 'RC -2002: ERROR: key not found'))
        # lbm_dem은 발산 검사가 없어 로그의 nan/inf도 본다
        status, message = core.judge('lbm_dem', 0, 'max velocity = nan\n' + self.OK)
        self.assertEqual(status, 'failed')
        self.assertIn('nan/inf', message)
        self.assertEqual(core.judge('lbm_dem', 0, '[INFO] DEM damping\n' + self.OK)[0], 'completed')
        self.assertEqual(core.judge('lbm', 0, 'no result line\n')[0], 'failed')
        self.assertEqual(core.judge('lbm', -9, '')[0], 'failed')


class TestScheduler(unittest.TestCase):
    def test_one_at_a_time_in_order(self):
        gate, order = threading.Event(), []

        def run(job_id):
            order.append(job_id)
            gate.wait(5)

        sched = core.Scheduler(run)
        self.assertEqual([sched.submit(j) for j in ('a', 'b', 'c')], ['running', 'queued', 'queued'])
        time.sleep(0.2)
        self.assertEqual(order, ['a'])
        gate.set()
        deadline = time.time() + 5
        while sched.busy() and time.time() < deadline:
            time.sleep(0.02)
        self.assertEqual(order, ['a', 'b', 'c'])
        self.assertEqual(sched.submit('d'), 'running')


class TestRunAndNotify(Base):
    def run_one(self, fake, engine='lbm', receiver=None):
        if receiver:
            self.settings.result_url = receiver.url
        self.prepare(engine=engine, cfg=make_config(fake=fake))
        core.run_job(self.settings, self.store, 'case_001')
        return self.store.read('case_001')

    def test_completed_job_notifies_web(self):
        rx = Receiver()
        self.settings.result_token = 'secret'
        try:
            state = self.run_one({'saves': 2}, receiver=rx)
        finally:
            rx.close()
        self.assertEqual(state['status'], 'completed')
        self.assertEqual(state['result_path'], 'case_001/case/')
        self.assertEqual(state['exit_code'], 0)
        self.assertTrue(state['callback']['sent'])
        headers, payload = rx.received[0]
        self.assertEqual(payload, {'job_id': 'case_001', 'status': 'completed',
                                   'message': 'Analysis done.', 'result_path': 'case_001/case/'})
        self.assertEqual(headers['Authorization'], 'Bearer secret')

    def test_failed_jobs(self):
        self.assertEqual(self.run_one({'mode': 'diverge'})['message'], 'Solver diverged (RC -4001).')

    def test_lbm_dem_nan_fails(self):
        state = self.run_one({'mode': 'nan'}, engine='lbm_dem')
        self.assertEqual(state['status'], 'failed')
        self.assertIn('nan/inf', state['message'])

    def test_callback_failure_is_recorded(self):
        rx = Receiver(status_code=500)
        try:
            state = self.run_one({}, receiver=rx)
        finally:
            rx.close()
        self.assertEqual(len(rx.received), 2)
        self.assertFalse(state['callback']['sent'])
        self.assertIn('500', state['callback']['error'])

    def test_no_callback_url(self):
        state = self.run_one({})
        self.assertEqual(state['callback']['sent'], False)
        self.assertIn('FEDIT_RESULT_URL', state['callback']['reason'])

    def test_solver_not_found(self):
        self.settings.commands['lbm'] = ['/no/such/solver']
        state = self.run_one({})
        self.assertEqual(state['status'], 'failed')
        self.assertIn('could not be started', state['message'])


class TestDownload(Base):
    def setUp(self):
        super().setUp()
        cfg = make_config(title='video', mesh=['wall.stl'],
                          fake={'saves': 4, 'levels': 2, 'grid0': True, 'grid1': True})
        self.prepare(engine='lbm_dem', cfg=cfg, files=[('wall.stl', b'stl')])
        core.run_job(self.settings, self.store, 'case_001')

    def names(self, scope):
        return [arc for _, arc in core.download_entries(self.store, 'case_001', scope)]

    def test_last(self):
        self.assertEqual(sorted(self.names('last')), sorted([
            'case.json', 'wall.stl', 'run.log', 'run.err.log',
            'case/video_3.vtm', 'case/bin/LEVEL_00/video_3.vtu', 'case/bin/LEVEL_01/video_3.vtu',
            'case/video_grid1_3.vtk', 'case/video_grid0_0.vtk']))

    def test_all_excludes_restart(self):
        names = self.names('all')
        self.assertEqual(len([n for n in names if n.endswith('.vtm')]), 4)
        self.assertEqual(len([n for n in names if n.endswith('.vtu')]), 8)
        self.assertFalse([n for n in names if '/continue/' in n])

    def test_zip_stream_matches_files(self):
        entries = core.download_entries(self.store, 'case_001', 'all')
        data = b''.join(core.iter_zip(entries, chunk=64))  # 작은 조각으로 여러 번 내보내는 경로까지 확인
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            self.assertIsNone(zf.testzip())
            self.assertEqual(sorted(zf.namelist()), sorted(arc for _, arc in entries))
            for path, arc in entries:
                self.assertEqual(zf.read(arc), path.read_bytes())
            self.assertEqual({i.compress_type for i in zf.infolist()}, {zipfile.ZIP_DEFLATED})


class TestStatusDeleteHealth(Base):
    def test_status_and_progress(self):
        self.prepare(cfg=make_config(fake={'saves': 4}))
        state = core.job_status(self.store, 'case_001')
        self.assertEqual((state['status'], state['progress']), ('queued', None))
        core.run_job(self.settings, self.store, 'case_001')
        state = core.job_status(self.store, 'case_001')
        self.assertEqual(state['status'], 'completed')
        self.assertEqual(state['progress'], {'step': 4, 'total_steps': 4, 'percent': 100.0})
        self.assertIsNone(core.job_status(self.store, 'nope'))

    def test_progress_reads_last_line_of_long_log(self):
        job = self.root / 'j'
        job.mkdir()
        lines = [f'{n} / 64000 ({n * 0.003125:.8f} / 200.00000000) 26.9iter/s' for n in range(1, 20001)]
        (job / core.RUN_LOG).write_text('\n'.join(lines) + '\nVTU Export [009]: x.vtu\n', encoding='utf-8')
        self.assertEqual(core.read_progress(job), {'step': 20000, 'total_steps': 64000, 'percent': 31.2})

    def test_delete_only_finished_jobs(self):
        self.prepare()
        with self.assertRaises(core.JobConflict):
            core.delete_job(self.store, 'case_001')  # queued
        self.store.write('case_001', status='running')
        with self.assertRaises(core.JobConflict):
            core.delete_job(self.store, 'case_001')
        self.store.write('case_001', status='failed')
        self.assertTrue(core.delete_job(self.store, 'case_001'))
        self.assertFalse((self.root / 'case_001').exists())
        self.assertFalse(core.delete_job(self.store, 'case_001'))

    def test_health(self):
        info = self.root / 'BUILD_INFO.txt'
        info.write_text('NFLOW Linux build (FeDiT release)\n'
                        'Date      : 2026-10-02\n'
                        'Builder   : nvidia/cuda:12.1.1-devel-ubuntu22.04 (nvcc 12.1.105, gcc 11.4, cmake 3.22.1)\n'
                        'CUDA arch : 75;80;86;89\n'
                        'lbm: NFLOW LBM @ e20c70943288668bf891a61f1f960dcd0c49ca6e -> lbm/bin/NFLOW_LBM\n'
                        'lbm_dem: NFLOW LBM_DEM @ 9a73e00dd080f98caabbc44d04760b5b375c7e70 -> lbm_dem/bin/NFLOW_LBM_DEM\n',
                        encoding='utf-8')
        self.settings.build_info = info
        gate = threading.Event()
        sched = core.Scheduler(lambda j: gate.wait(5))
        sched.submit('a')
        sched.submit('b')
        time.sleep(0.1)
        gpu = [{'name': 'NVIDIA GeForce RTX 5080', 'driver': '591.86', 'memory': '16303 MiB'}]
        code, body = core.health(self.settings, sched, gpus=gpu)
        gate.set()
        self.assertEqual(code, 200)
        self.assertEqual((body['status'], body['running_job'], body['queued_jobs']), ('ok', 'a', 1))
        self.assertEqual(body['engine_build']['lbm'], {'commit': 'e20c70943288', 'executable': 'NFLOW_LBM'})
        self.assertEqual(body['engine_build']['lbm_dem']['commit'], '9a73e00dd080')
        self.assertEqual(body['engine_build']['cuda_arch'], '75;80;86;89')
        code, body = core.health(self.settings, sched, gpus=[])
        self.assertEqual((code, body['status']), (503, 'no_gpu'))
        self.settings.build_info = self.root / 'missing.txt'
        self.assertIsNone(core.health(self.settings, sched, gpus=gpu)[1]['engine_build'])


class TestRecover(Base):
    def test_running_becomes_failed_and_queued_requeued(self):
        rx = Receiver()
        self.settings.result_url = rx.url
        try:
            self.prepare(job_id='was_running')
            self.store.write('was_running', status='running')
            self.prepare(job_id='was_queued', cfg=make_config(fake={'saves': 1}))
            ran = []
            sched = core.Scheduler(lambda j: ran.append(j))
            core.recover(self.settings, self.store, sched)
            deadline = time.time() + 5
            while sched.busy() and time.time() < deadline:
                time.sleep(0.02)
        finally:
            rx.close()
        state = self.store.read('was_running')
        self.assertEqual(state['status'], 'failed')
        self.assertIn('restarted', state['message'])
        self.assertEqual(rx.received[0][1]['job_id'], 'was_running')
        self.assertEqual(ran, ['was_queued'])


if __name__ == '__main__':
    unittest.main()
