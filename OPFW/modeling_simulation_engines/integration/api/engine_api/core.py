# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2022-2026 E8IGHT Co., Ltd.
"""해석엔진 Python Main API의 처리 로직. FastAPI와 분리해 표준 라이브러리만 쓴다.

설계와 사용법: integration/README.md
  2.1 해석 실행 / 2.2 결과 다운로드 / 3 Engine -> Web 완료 알림 / 4 처리 순서·완료 판정·결과 파일 위치

이미지 안의 Python은 3.10(Ubuntu 22.04)이므로 3.10 문법만 쓴다.
"""
from __future__ import annotations

import json
import logging
import os
import re
import shlex
import shutil
import subprocess
import threading
import time
import urllib.request
import zipfile
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Callable, Iterator, Optional

log = logging.getLogger('engine_api')

KST = timezone(timedelta(hours=9))
ENGINES = ('lbm', 'lbm_dem')
JOB_ID_RE = re.compile(r'^[A-Za-z0-9_-]{1,64}$')
STATE_FILE = 'engine_job.json'
RUN_LOG = 'run.log'
RUN_ERR = 'run.err.log'
# 작업 폴더에 API가 쓰는 파일. 같은 이름으로 올라온 입력 파일은 거절한다.
RESERVED_NAMES = {STATE_FILE, RUN_LOG, RUN_ERR}
RC_DIVERGED = -4001


def now() -> str:
    return datetime.now(KST).isoformat(timespec='seconds')


@dataclass
class Settings:
    jobs_root: Path
    commands: dict
    result_url: Optional[str] = None
    result_token: Optional[str] = None
    callback_attempts: int = 3
    callback_delay_s: float = 5.0
    build_info: Path = Path('/opt/engine/BUILD_INFO.txt')

    @classmethod
    def from_env(cls) -> 'Settings':
        env = os.environ.get
        return cls(
            build_info=Path(env('ENGINE_BUILD_INFO', '/opt/engine/BUILD_INFO.txt')),
            jobs_root=Path(env('JOBS_ROOT', '/jobs')),
            commands={'lbm': shlex.split(env('ENGINE_CMD_LBM', 'NFLOW_LBM')),
                      'lbm_dem': shlex.split(env('ENGINE_CMD_LBM_DEM', 'NFLOW_LBM_DEM'))},
            result_url=env('FEDIT_RESULT_URL') or None,
            result_token=env('FEDIT_RESULT_TOKEN') or None,
            callback_attempts=int(env('CALLBACK_ATTEMPTS', '3')),
            callback_delay_s=float(env('CALLBACK_DELAY_S', '5')),
        )


# ---------------------------------------------------------------- 작업 상태

class JobStore:
    """작업 상태를 작업 폴더의 engine_job.json에 둔다. 재시작해도 남고, FeDiT도 같은 폴더에서 볼 수 있다."""

    def __init__(self, root: Path):
        self.root = Path(root)
        self._lock = threading.Lock()

    def dir(self, job_id: str) -> Path:
        return self.root / job_id

    def read(self, job_id: str) -> Optional[dict]:
        if not JOB_ID_RE.match(job_id):
            return None
        path = self.dir(job_id) / STATE_FILE
        try:
            return json.loads(path.read_text(encoding='utf-8'))
        except FileNotFoundError:
            return None

    def write(self, job_id: str, /, **updates) -> dict:
        with self._lock:
            state = self.read(job_id) or {}
            state.update(updates)
            path = self.dir(job_id) / STATE_FILE
            tmp = path.with_suffix('.json.tmp')
            tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')
            os.replace(tmp, path)
            return state


# ---------------------------------------------------------------- 입력 확인 (4절 1~3번)

class InputError(ValueError):
    """입력이 맞지 않아 해석을 시작하지 않는 경우. API는 400으로 돌려준다."""


def _check_plain_name(name: Optional[str], what: str) -> str:
    if not name or '/' in name or '\\' in name or '..' in name or '\0' in name:
        raise InputError(f"{what} '{name}' must be a plain file name without '/', '\\' or '..'.")
    return name


def _mesh_paths(obj) -> list:
    """JSON 어디에 있든 mesh_path 값을 모은다(빈 값 제외)."""
    found = []
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key == 'mesh_path' and isinstance(value, str) and value:
                found.append(value)
            else:
                found.extend(_mesh_paths(value))
    elif isinstance(obj, list):
        for value in obj:
            found.extend(_mesh_paths(value))
    return found


def prepare_job(store: JobStore, job_id: Optional[str], engine: Optional[str],
                config_name: Optional[str], config_bytes: Optional[bytes],
                files: list) -> None:
    """입력을 확인하고 작업 폴더를 만든다. files는 (파일 이름, 내용 bytes) 목록이다.

    맞지 않는 입력은 InputError로 알린다. 확인을 모두 통과해야 폴더를 만든다.
    """
    if not job_id or not JOB_ID_RE.match(job_id):
        raise InputError("job_id must be 1-64 characters of letters, digits, '_' or '-'.")
    if engine not in ENGINES:
        raise InputError(f"engine must be one of {', '.join(ENGINES)} (got '{engine}').")
    if config_bytes is None:
        raise InputError('config (JSON file) is required.')
    _check_plain_name(config_name, 'config file name')
    if not config_name.lower().endswith('.json'):
        raise InputError(f"config file name '{config_name}' must end with .json.")
    try:
        config = json.loads(config_bytes.decode('utf-8-sig'))
    except (UnicodeDecodeError, json.JSONDecodeError) as e:
        raise InputError(f'config is not valid JSON: {e}') from None
    if not isinstance(config, dict):
        raise InputError('config must be a JSON object.')

    names = []
    for name, _ in files:
        _check_plain_name(name, 'file name')
        if name in RESERVED_NAMES:
            raise InputError(f"file name '{name}' is reserved by the engine API.")
        if name == config_name or name in names:
            raise InputError(f"file '{name}' was uploaded more than once.")
        names.append(name)

    # meta.title은 결과 파일 이름 앞에 그대로 붙는다. 경로 문자가 있으면 작업 폴더 밖에 파일이 생길 수 있다.
    meta = config.get('meta')
    title = meta.get('title') if isinstance(meta, dict) else None
    if isinstance(title, str) and title:
        _check_plain_name(title, 'meta.title')

    for mesh in _mesh_paths(config):
        _check_plain_name(mesh, 'mesh_path')
        if mesh not in names:
            raise InputError(f"mesh_path '{mesh}' is referenced in config but was not uploaded.")

    job_dir = store.dir(job_id)
    try:
        job_dir.mkdir(parents=True, exist_ok=False)
    except FileExistsError:
        raise InputError(f"job_id '{job_id}' already exists.") from None

    # export_path가 비어 있으면 결과가 작업 폴더 안(<JSON 이름>/)에 생긴다. 다른 위치에 쓰지 못하게 비운다.
    report = config.get('config', {}).get('result_report') if isinstance(config.get('config'), dict) else None
    if isinstance(report, dict) and report.get('export_path', '') != '':
        report['export_path'] = ''
        config_bytes = json.dumps(config, ensure_ascii=False, indent=2).encode('utf-8')
    (job_dir / config_name).write_bytes(config_bytes)
    for name, data in files:
        (job_dir / name).write_bytes(data)

    store.write(job_id, job_id=job_id, engine=engine, config=config_name, inputs=names,
                status='queued', message='', created_at=now(), started_at=None,
                finished_at=None, exit_code=None, result_path=None)


# ---------------------------------------------------------------- 대기열 (4절 4·8번)

class Scheduler:
    """한 번에 한 작업만 실행한다. GPU 1장에서 해석 두 개를 함께 돌리면 GPU 메모리가 모자랄 수 있다."""

    def __init__(self, run: Callable[[str], None]):
        self._run = run
        self._cv = threading.Condition()
        self._pending: deque = deque()
        self._current: Optional[str] = None
        threading.Thread(target=self._loop, name='engine-scheduler', daemon=True).start()

    def submit(self, job_id: str) -> str:
        """작업을 넣고 'running'(바로 시작) 또는 'queued'(앞 작업 대기)를 돌려준다."""
        with self._cv:
            if self._current is None and not self._pending:
                self._current = job_id
                status = 'running'
            else:
                self._pending.append(job_id)
                status = 'queued'
            self._cv.notify()
            return status

    def busy(self) -> bool:
        with self._cv:
            return self._current is not None or bool(self._pending)

    def snapshot(self) -> tuple:
        """(실행 중인 작업, 대기 중인 작업 목록)."""
        with self._cv:
            return self._current, list(self._pending)

    def _loop(self) -> None:
        while True:
            with self._cv:
                while self._current is None and not self._pending:
                    self._cv.wait()
                if self._current is None:
                    self._current = self._pending.popleft()
                job_id = self._current
            try:
                self._run(job_id)
            except Exception:  # 한 작업의 예외로 대기열 전체가 멈추지 않게 한다
                log.exception('job %s crashed in the runner', job_id)
            finally:
                with self._cv:
                    self._current = None


# ---------------------------------------------------------------- 실행과 완료 판정 (4절 5~7번)

_ANSI = re.compile(r'\x1b\[[0-9;]*m')
_RC_LINE = re.compile(r'RC : (-?\d+), ([^\r\n]*)')
_NAN = re.compile(r'\b(nan|inf)\b|diverg', re.IGNORECASE)


def judge(engine: str, exit_code: Optional[int], log_text: str) -> tuple:
    """(status, message)를 정한다. README 4절 '완료 판정'."""
    text = _ANSI.sub('', log_text)
    rc_lines = _RC_LINE.findall(text)
    last_rc = (int(rc_lines[-1][0]), rc_lines[-1][1].strip()) if rc_lines else None

    if exit_code == 0 and last_rc and last_rc[0] == 0:
        if engine == 'lbm_dem':
            # LBM_DEM은 발산 검사가 없어 수치가 깨져도 종료 코드 0으로 끝난다.
            bad = [line.strip() for line in text.splitlines() if _NAN.search(line)]
            if bad:
                return 'failed', f'Solver output contains nan/inf in {len(bad)} log line(s), e.g. "{bad[0][:120]}".'
        return 'completed', 'Analysis done.'
    if last_rc and last_rc[0] == RC_DIVERGED:
        return 'failed', f'Solver diverged (RC {RC_DIVERGED}).'
    if last_rc and last_rc[0] != 0:
        return 'failed', f'RC {last_rc[0]}: {last_rc[1]}'
    return 'failed', f'Solver exited with code {exit_code} without a result code line.'


def run_job(settings: Settings, store: JobStore, job_id: str) -> None:
    state = store.write(job_id, status='running', started_at=now())
    job_dir = store.dir(job_id)
    config = state['config']
    cmd = list(settings.commands[state['engine']]) + [config]
    log.info('job %s start: %s', job_id, cmd)

    with open(job_dir / RUN_LOG, 'wb') as out, open(job_dir / RUN_ERR, 'wb') as err:
        try:
            exit_code = subprocess.run(cmd, cwd=job_dir, stdout=out, stderr=err).returncode
            launch_error = None
        except OSError as e:
            exit_code, launch_error = None, f'{type(e).__name__}: {e}'

    if launch_error:
        status, message = 'failed', f'Solver could not be started ({launch_error}).'
    else:
        log_text = (job_dir / RUN_LOG).read_text(encoding='utf-8', errors='replace')
        status, message = judge(state['engine'], exit_code, log_text)

    result_dir = job_dir / Path(config).stem
    result_path = f'{job_id}/{result_dir.name}/' if result_dir.is_dir() else None
    store.write(job_id, status=status, message=message, exit_code=exit_code,
                finished_at=now(), result_path=result_path)
    log.info('job %s %s: %s', job_id, status, message)
    notify_web(settings, store, job_id)


# ---------------------------------------------------------------- Engine -> Web 완료 알림 (3절)

def notify_web(settings: Settings, store: JobStore, job_id: str) -> None:
    state = store.read(job_id) or {}
    payload = {key: state.get(key) for key in ('job_id', 'status', 'message', 'result_path')}
    if not settings.result_url:
        store.write(job_id, callback={'sent': False, 'reason': 'FEDIT_RESULT_URL is not set.', 'at': now()})
        return
    headers = {'Content-Type': 'application/json'}
    if settings.result_token:
        headers['Authorization'] = f'Bearer {settings.result_token}'
    body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    error = None
    for attempt in range(1, settings.callback_attempts + 1):
        try:
            request = urllib.request.Request(settings.result_url, data=body, headers=headers, method='POST')
            with urllib.request.urlopen(request, timeout=10) as response:
                reply = response.read(2000).decode('utf-8', 'replace')
                store.write(job_id, callback={'sent': True, 'http_status': response.status,
                                              'attempts': attempt, 'at': now(), 'response': reply[:500]})
                return
        except Exception as e:  # 연결 실패, 4xx/5xx 모두 다시 시도한다
            error = f'{type(e).__name__}: {e}'
            log.warning('job %s callback attempt %d failed: %s', job_id, attempt, error)
        if attempt < settings.callback_attempts:
            time.sleep(settings.callback_delay_s)
    store.write(job_id, callback={'sent': False, 'attempts': settings.callback_attempts,
                                  'error': error, 'at': now()})


def recover(settings: Settings, store: JobStore, scheduler: Scheduler) -> None:
    """API가 다시 시작됐을 때 남아 있는 작업을 정리한다.

    실행 중이던 작업은 해석기 프로세스가 사라졌으므로 실패로 알리고, 대기 중이던 작업은 받은 순서대로 다시 넣는다.
    """
    if not store.root.is_dir():
        return
    waiting = []
    for job_dir in sorted(store.root.iterdir()):
        state = store.read(job_dir.name) if job_dir.is_dir() else None
        if not state:
            continue
        if state.get('status') == 'running':
            store.write(job_dir.name, status='failed', finished_at=now(),
                        message='Engine API restarted while the job was running.')
            notify_web(settings, store, job_dir.name)
        elif state.get('status') == 'queued':
            waiting.append((state.get('created_at') or '', job_dir.name))
    for _, job_id in sorted(waiting):
        scheduler.submit(job_id)


# ---------------------------------------------------------------- 상태 조회·삭제·서버 상태 (2.3~2.5절)

_PROGRESS = re.compile(rb'^(\d+) / (\d+) \(', re.MULTILINE)


def read_progress(job_dir: Path) -> Optional[dict]:
    """해석기가 매 스텝 찍는 '현재 스텝 / 전체 스텝 (...)' 줄 중 마지막 것을 읽는다. 로그 끝부분만 읽는다."""
    try:
        with open(job_dir / RUN_LOG, 'rb') as f:
            f.seek(0, os.SEEK_END)
            f.seek(max(0, f.tell() - 65536))
            tail = f.read()
    except FileNotFoundError:
        return None
    found = _PROGRESS.findall(tail)
    if not found:
        return None
    step, total = int(found[-1][0]), int(found[-1][1])
    return {'step': step, 'total_steps': total, 'percent': round(100.0 * step / total, 1) if total else None}


def job_status(store: JobStore, job_id: str) -> Optional[dict]:
    """engine_job.json 내용에 진행률을 더해 돌려준다. 없는 작업은 None."""
    state = store.read(job_id)
    if state is None:
        return None
    state['progress'] = read_progress(store.dir(job_id)) if state.get('status') != 'queued' else None
    return state


class JobConflict(Exception):
    """대기·실행 중인 작업이라 요청을 들어줄 수 없다. API는 409로 돌려준다."""


def delete_job(store: JobStore, job_id: str) -> bool:
    """끝난 작업(completed, failed)의 작업 폴더를 지운다. 없는 작업이면 False.

    엔진 컨테이너는 결과 파일의 주인(기본 root)으로 돌기 때문에, FeDiT 쪽에서 권한 때문에 못 지우는 파일도 지울 수 있다.
    """
    state = store.read(job_id)
    if state is None:
        return False
    if state.get('status') in ('queued', 'running'):
        raise JobConflict(f"Job '{job_id}' is {state['status']}; only finished jobs can be deleted.")
    shutil.rmtree(store.dir(job_id))
    return True


def query_gpus(timeout: float = 5.0) -> list:
    """컨테이너 안에서 보이는 GPU 목록(nvidia-smi). GPU가 없거나 nvidia-smi가 실패하면 빈 목록."""
    try:
        out = subprocess.run(['nvidia-smi', '--query-gpu=name,driver_version,memory.total',
                              '--format=csv,noheader'], capture_output=True, text=True, timeout=timeout)
    except (OSError, subprocess.TimeoutExpired):
        return []
    if out.returncode != 0:
        return []
    gpus = []
    for line in out.stdout.strip().splitlines():
        parts = [p.strip() for p in line.split(',')]
        if len(parts) >= 3:
            gpus.append({'name': parts[0], 'driver': parts[1], 'memory': parts[2]})
    return gpus


_BUILD_LINE = re.compile(r'^(lbm|lbm_dem): .* @ ([0-9a-f]{7,40}) -> (\S+)$')


def read_build_info(path: Path) -> Optional[dict]:
    """release/linux/BUILD_INFO.txt에서 해석기 커밋과 빌드 정보를 읽는다."""
    try:
        text = Path(path).read_text(encoding='utf-8')
    except OSError:
        return None
    info = {}
    for line in text.splitlines():
        m = _BUILD_LINE.match(line.strip())
        if m:
            info[m.group(1)] = {'commit': m.group(2)[:12], 'executable': Path(m.group(3)).name}
            continue
        key, sep, value = line.partition(':')
        key = key.strip().lower().replace(' ', '_')
        if sep and key in ('date', 'builder', 'cuda_arch'):
            info[key] = value.strip()
    return info


def health(settings: Settings, scheduler: Scheduler, gpus: Optional[list] = None) -> tuple:
    """(HTTP 상태 코드, 내용). GPU가 안 보이면 해석을 돌릴 수 없으므로 503."""
    gpus = query_gpus() if gpus is None else gpus
    running, waiting = scheduler.snapshot()
    body = {'status': 'ok' if gpus else 'no_gpu', 'gpus': gpus, 'running_job': running,
            'queued_jobs': len(waiting), 'engine_build': read_build_info(settings.build_info)}
    return (200 if gpus else 503), body


# ---------------------------------------------------------------- 결과 다운로드 (2.2절, 4절 '다운로드 요청 처리')

_SAVE_FILE = re.compile(r'^(?P<series>.*_)(?P<index>\d+)\.(?P<ext>vtm|vtu|vtk)$')


def download_entries(store: JobStore, job_id: str, scope: str) -> list:
    """ZIP에 넣을 (파일 경로, ZIP 안 이름) 목록. ZIP 안 이름은 작업 폴더 기준 경로다.

    last: 저장 계열(같은 폴더, 같은 이름 앞부분)마다 번호가 가장 큰 파일. 0번에만 있는 고정 입자 파일도 이렇게 들어간다.
    all : 결과 폴더 전체. 재시작 파일(continue/)과 쓰다 만 임시 파일(*.tmp)은 뺀다.
    어느 쪽이든 입력 JSON, 입력 파일, 실행 로그를 함께 넣는다.
    """
    state = store.read(job_id)
    job_dir = store.dir(job_id)
    result_dir = job_dir / Path(state['config']).stem

    results = []
    if result_dir.is_dir():
        for path in sorted(result_dir.rglob('*')):
            rel = path.relative_to(result_dir)
            if path.is_file() and rel.parts[0] != 'continue' and not path.name.endswith('.tmp'):
                results.append(path)

    if scope == 'last':
        newest = {}
        others = []
        for path in results:
            m = _SAVE_FILE.match(path.name)
            if not m:
                others.append(path)
                continue
            key = (path.parent, m['series'], m['ext'])
            if key not in newest or int(m['index']) > newest[key][0]:
                newest[key] = (int(m['index']), path)
        results = sorted([p for _, p in newest.values()] + others)

    inputs = [job_dir / state['config']] + [job_dir / name for name in state.get('inputs', [])]
    logs = [job_dir / name for name in (RUN_LOG, RUN_ERR) if (job_dir / name).is_file()]
    return [(p, p.relative_to(job_dir).as_posix()) for p in inputs + logs + results]


class _Sink:
    """zipfile이 쓰는 바이트를 모아 두었다가 스트리밍으로 넘긴다(되감기 없는 출력)."""

    def __init__(self):
        self._chunks = []

    def write(self, data) -> int:
        self._chunks.append(bytes(data))
        return len(data)

    def flush(self) -> None:
        pass

    def take(self) -> bytes:
        data = b''.join(self._chunks)
        self._chunks.clear()
        return data


def iter_zip(entries: list, level: int = 1, chunk: int = 1 << 20) -> Iterator[bytes]:
    """파일을 읽으면서 ZIP으로 묶어 조각으로 내보낸다. 서버에 ZIP 파일을 따로 만들지 않는다."""
    sink = _Sink()
    with zipfile.ZipFile(sink, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=level,
                         allowZip64=True) as archive:
        for path, arcname in entries:
            info = zipfile.ZipInfo.from_file(path, arcname)
            info.compress_type = zipfile.ZIP_DEFLATED
            info._compresslevel = level  # Python 3.10에는 공개 속성이 없다(3.13의 compress_level과 같은 값)
            with open(path, 'rb') as source, archive.open(info, 'w') as target:
                while True:
                    block = source.read(chunk)
                    if not block:
                        break
                    target.write(block)
                    data = sink.take()
                    if data:
                        yield data
            data = sink.take()
            if data:
                yield data
    data = sink.take()
    if data:
        yield data
