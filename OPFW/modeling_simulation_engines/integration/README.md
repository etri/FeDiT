# FeDiT 연동 (해석엔진 API)

FeDiT Web이 해석기를 실행하고 결과를 받아 가도록 해석기 앞에 두는 서버 프로그램이다. Python으로 작성했고(FastAPI), Docker 이미지로 묶어 서버에 올린다. 이 폴더의 소스는 LGPL-2.1-only다. 이미지에 넣는 해석기 실행 파일은 `release/linux/`의 묶음이며, 그 사용 조건은 [`release/LICENSE.md`](../release/LICENSE.md)를 따른다.

| 경로 | 내용 |
| --- | --- |
| `api/engine_api/core.py` | 처리 로직: 입력 확인, 대기열, 해석기 실행, 완료 판정, 완료 알림, 결과 묶기. 표준 라이브러리만 쓴다 |
| `api/engine_api/app.py` | HTTP 경로 5개 (FastAPI) |
| `api/requirements.txt` | 이미지에 설치하는 패키지 (버전 고정) |
| `api/tests/` | 단위 테스트, 경로 테스트, 가짜 해석기 |
| `Dockerfile`, `Dockerfile.dockerignore` | 실행 이미지 |
| `docker-compose.yml` | 서버 실행 예시 |

## 1. 구성과 흐름

FeDiT Web과 해석엔진이 같은 서버에서 돈다고 본다. 해석 결과는 서버의 공유 폴더에 해석기가 만든 그대로 쌓이고, FeDiT도 이 폴더를 직접 읽는다.

```text
[FeDiT Web] --(engine, JSON, STL)--> POST /jobs --> [대기열] --> [해석기 실행: NFLOW_LBM 또는 NFLOW_LBM_DEM]
                                                                        |
     ^                                                                  | 결과는 공유 폴더에 그대로
     |                                                                  v
     +---------- 완료 알림 (job_id, status, message, result_path) <-- [완료 판정]

[FeDiT Web] --> GET /jobs/{job_id}/download --> 결과를 ZIP으로 묶으면서 바로 보냄
```

| `engine` 값 | 실행 파일 | 해석기 |
| --- | --- | --- |
| `lbm` | `NFLOW_LBM` | 다성분, 다상, 농도확산, 복합 열전달 |
| `lbm_dem` | `NFLOW_LBM_DEM` | 유체-DEM 연성 |

해석이 끝날 때 결과 ZIP을 미리 만들지 않는다. 원래 길이 결과는 10~30 GB까지 커지므로, 사용자가 내려받을 때 필요한 범위만 묶어 보낸다.

## 2. Web → Engine API

| API | 용도 |
| --- | --- |
| `POST /jobs` | 입력을 받아 해석을 실행 (2.1절) |
| `GET /jobs/{job_id}/download` | 끝난 해석의 결과를 ZIP으로 받기 (2.2절) |
| `GET /jobs/{job_id}` | 작업 상태와 진행률 (2.3절) |
| `DELETE /jobs/{job_id}` | 끝난 작업의 폴더 삭제 (2.4절) |
| `GET /health` | 엔진 상태: GPU, 대기열, 해석기 빌드 정보 (2.5절) |

해석 중인 작업을 멈추는 API는 없다. 꼭 멈춰야 하면 컨테이너를 다시 시작한다. 그러면 실행 중이던 작업은 `failed`로 알려지고 대기 중인 작업은 계속 돈다.

### 2.1 해석 실행 — POST /jobs

`multipart/form-data`로 보낸다.

| 필드 | 필수 | 내용 |
| --- | --- | --- |
| `job_id` | 예 | 작업 ID. 영문·숫자·`_`·`-`, 64자 이하. 작업 폴더 이름이 된다 |
| `engine` | 예 | `lbm` 또는 `lbm_dem` |
| `config` | 예 | 해석기 입력 JSON 파일 ([`doc/input_json.md`](../doc/input_json.md)) |
| `files` | 경우에 따라 | JSON이 가리키는 STL 등 입력 파일. 여러 개 가능 |

`engine`을 따로 받는 이유는 JSON만으로 실행 파일을 정할 수 없기 때문이다. 유체-DEM 입력의 `solver_type`은 `free_surface`인데, 같은 이름의 해석기가 `NFLOW_LBM`에도 있다.

엔진은 한 번에 해석 하나만 돌린다. 요청을 받으면 끝나기를 기다리지 않고 `202 Accepted`로 바로 답한다.

```json
{ "job_id": "case_001", "status": "running", "message": "Solver started successfully." }
```

앞 작업이 실행 중이면 `queued`로 답하고, 앞 작업이 끝나면 받은 순서대로 시작한다.

```json
{ "job_id": "case_002", "status": "queued", "message": "Waiting for the previous job to finish." }
```

입력이 맞지 않으면 실행하지 않고 `400 Bad Request`로 답한다. 확인 항목은 4절에 있다.

```json
{ "job_id": "case_001", "status": "rejected", "message": "mesh_path 'wall.stl' is referenced in config but was not uploaded." }
```

### 2.2 결과 다운로드 — GET /jobs/{job_id}/download

쿼리 `range`로 받을 범위를 정한다.

| `range` | 받는 것 |
| --- | --- |
| `last` (기본값) | 마지막 저장 1회분 |
| `all` | 모든 저장 시점. 재시작 파일(`continue/`)은 뺀다 |

어느 범위든 입력 JSON, 입력 파일, 실행 로그(`run.log`)를 함께 넣는다. ZIP 안의 폴더 구조는 결과 폴더 그대로라서, 풀고 나서 ParaView에서 `.vtm`을 바로 열 수 있다. 파일 이름은 `<job_id>_last.zip` 또는 `<job_id>_all.zip`이다. 요청을 받은 뒤 묶으면서 보내므로 응답에 전체 크기가 없다.

| 상황 | 응답 |
| --- | --- |
| 없는 `job_id` | `404 Not Found` |
| 대기 중·해석 중·실패한 작업 | `409 Conflict` |

### 2.3 상태 조회 — GET /jobs/{job_id}

```json
{
  "job_id": "case_001",
  "engine": "lbm",
  "config": "04_conjugate_heat_transfer.json",
  "inputs": ["CHT_natural_convection_in_a_finned.stl", "natural_convection_MB.stl"],
  "status": "running",
  "message": "",
  "created_at": "2026-10-02T12:26:34+09:00",
  "started_at": "2026-10-02T12:26:34+09:00",
  "finished_at": null,
  "exit_code": null,
  "result_path": null,
  "progress": { "step": 16640, "total_steps": 64000, "percent": 26.0 }
}
```

`status`는 `queued`, `running`, `completed`, `failed` 중 하나다. `progress`는 해석기가 찍는 `현재 스텝 / 전체 스텝` 줄을 로그 끝 64 KB에서 읽는다. 대기 중이거나 아직 진행 줄이 없으면(격자 생성 중) `null`이다. 끝난 작업에는 완료 알림 결과(`callback`)도 들어 있다. 없는 `job_id`는 `404`다.

### 2.4 작업 삭제 — DELETE /jobs/{job_id}

끝난 작업(`completed`, `failed`)의 작업 폴더를 지운다. 성공하면 `200 OK`와 `{"job_id": "case_001", "status": "deleted", "message": "Job folder deleted."}`, 대기·해석 중이면 `409 Conflict`, 없는 `job_id`면 `404 Not Found`다.

### 2.5 엔진 상태 — GET /health

```json
{
  "status": "ok",
  "gpus": [{ "name": "NVIDIA GeForce RTX 5080", "driver": "591.86", "memory": "16303 MiB" }],
  "running_job": "case_001",
  "queued_jobs": 1,
  "engine_build": {
    "date": "2026-10-02",
    "builder": "nvidia/cuda:12.1.1-devel-ubuntu22.04 (nvcc 12.1.105, gcc 11.4, cmake 3.22.1)",
    "cuda_arch": "75;80;86;89 (other GPUs run through PTX JIT)",
    "lbm": { "commit": "e20c70943288", "executable": "NFLOW_LBM" },
    "lbm_dem": { "commit": "9a73e00dd080", "executable": "NFLOW_LBM_DEM" }
  }
}
```

컨테이너 안에서 GPU가 보이지 않으면 `status`가 `no_gpu`이고 `503 Service Unavailable`이다. 이미지의 HEALTHCHECK가 60초마다 이 경로를 확인한다.

## 3. Engine → Web 완료 알림

해석이 끝나면 엔진이 FeDiT의 결과 수신 API(`FEDIT_RESULT_URL`)로 다음을 `POST`한다. 이 API는 FeDiT 쪽에 만든다.

```json
{ "job_id": "case_001", "status": "completed", "message": "Analysis done.", "result_path": "case_001/04_conjugate_heat_transfer/" }
```

| 필드 | 내용 |
| --- | --- |
| `status` | `completed` 또는 `failed` |
| `message` | 실패하면 원인 요약 (예: `Solver diverged (RC -4001).`) |
| `result_path` | 결과 폴더. 공유 폴더(작업 루트) 기준 상대 경로 |

`result_path`를 상대 경로로 보내는 이유는 엔진 컨테이너와 FeDiT가 같은 공유 폴더를 서로 다른 경로에 붙여 쓸 수 있기 때문이다. `FEDIT_RESULT_TOKEN`이 있으면 `Authorization: Bearer <값>` 헤더를 붙인다. 호출이 실패하면 3번(5초 간격)까지 다시 보내고, 그래도 안 되면 작업 상태에 기록만 남긴다. `FEDIT_RESULT_URL`이 비어 있으면 알리지 않고 상태 조회(2.3절)로만 확인한다.

## 4. 처리 순서

요청 하나를 다음 순서로 처리한다.

1. 입력을 확인한다. 하나라도 맞지 않으면 실행하지 않고 `400`으로 답한다.
   - `engine`이 `lbm`, `lbm_dem` 중 하나인지
   - `job_id`가 형식에 맞고, 같은 이름의 작업 폴더가 없는지. 끝난 작업도 폴더가 남아 있으면 거절하므로, 같은 ID로 다시 돌리려면 먼저 삭제한다(2.4절)
   - `config`가 JSON으로 읽히는지
   - JSON의 `mesh_path`가 가리키는 파일이 모두 올라왔는지
   - 파일 이름에 경로(`/`, `\`, `..`)가 없는지. API가 쓰는 이름(`engine_job.json`, `run.log`, `run.err.log`)도 거절한다
   - `meta.title`에 경로 문자가 없는지. 이 값이 결과 파일 이름 앞에 붙기 때문이다
2. 작업 폴더(`<작업 루트>/<job_id>/`)를 만들고 입력을 저장한다.
3. JSON의 `result_report.export_path`를 빈 값으로 바꾼다. 결과가 작업 폴더 밖에 써지지 않게 하려는 것이다.
4. 실행 중인 작업이 없으면 바로 실행하고, 있으면 대기열에 넣는다. GPU 한 장에서 해석 두 개를 함께 돌리면 GPU 메모리가 모자랄 수 있어 하나씩 돌린다.
5. 차례가 오면 작업 폴더에서 `<실행 파일> <JSON 파일>`로 실행한다. 출력은 `run.log`, `run.err.log`에 남긴다.
6. 실행이 끝나면 성공·실패를 정한다(아래 '완료 판정').
7. 완료 알림을 보낸다(3절).
8. 대기열에 다음 작업이 있으면 시작한다.

작업 상태는 작업 폴더의 `engine_job.json`에 남는다. 컨테이너가 다시 시작되면 실행 중이던 작업은 `failed`로 알리고, 대기 중이던 작업은 받은 순서대로 다시 대기열에 넣는다.

### 완료 판정

- 공통: 종료 코드가 0이고 로그의 마지막 결과 코드 줄이 `RC : 0`이면 `completed`다. 입력 오류는 두 해석기 모두 종료 코드 1로 끝난다.
- `lbm`: 계산이 발산하면 스스로 멈추고 종료 코드 1(RC -4001)을 낸다. 발산 직전 상태는 결과 폴더의 `divergence/`에 남는다.
- `lbm_dem`: 발산 검사가 없어 수치가 깨져도 끝까지 돌고 종료 코드 0을 낸다. 그래서 로그에 `nan`이나 `inf`가 있으면 `failed`로 본다.

### 결과 파일 위치

결과 폴더는 작업 폴더 안에 JSON 파일 이름으로 생기고, 파일 이름 앞부분은 `meta.title`이다. 자세한 구성은 [`doc/output_format.md`](../doc/output_format.md)에 있다.

### 다운로드 요청 처리

- `last`: 저장 번호가 가장 큰 파일들(`.vtm`, 단계별 `.vtu`, LBM_DEM 입자 `.vtk`)을 보낸다. 0번 저장에만 있는 고정 입자 파일(`_grid0_0.vtk`)도 함께 넣는다.
- `all`: 결과 폴더 전체에서 재시작 파일(`continue/`)과 임시 파일(`*.tmp`)만 뺀다.
- 압축 수준은 1이다. 수준 6은 크기가 1%p 안팎 더 줄 뿐인데 시간은 2.6~3.5배 걸렸다.

## 5. 이미지 빌드와 실행

`modeling_simulation_engines` 폴더에서 빌드한다. 해석기는 `release/linux/`의 묶음을 그대로 풀어 넣으므로 이미지 안에서 빌드하지 않는다.

```bash
docker build -f integration/Dockerfile -t fedit-engine .
docker compose -f integration/docker-compose.yml up -d
```

| 항목 | 내용 |
| --- | --- |
| GPU | 서버에 NVIDIA 드라이버와 NVIDIA Container Toolkit이 있어야 한다. compose 예시는 GPU를 모두 붙인다 |
| 공유 폴더 | `JOBS_HOST_DIR`을 컨테이너의 `/jobs`에 붙인다. FeDiT도 같은 폴더를 붙여 결과를 읽는다 |
| JIT 캐시 | `NVCACHE_HOST_DIR`을 `/nvcache`에 붙인다. 빌드 대상(sm_75·80·86·89) 밖 GPU에서 드라이버가 컴파일한 코드를 남겨, 두 번째 실행부터 컴파일 시간이 들지 않게 한다 |
| 결과 수신 | `FEDIT_RESULT_URL`, 필요하면 `FEDIT_RESULT_TOKEN` |
| 포트 | 엔진 API는 서버 밖으로 열지 않고 `127.0.0.1:18080`에만 연다. 업로드한 파일로 프로그램을 실행하는 API라서, 같은 서버의 FeDiT만 부르게 한다. FeDiT도 컨테이너라면 두 컨테이너를 같은 Docker 네트워크에 두고 `http://engine:8000`으로 부른다 |
| 파일 주인 | 그냥 띄우면 root로 돌아 결과 파일 주인이 root가 된다. 다른 사용자가 결과를 지워야 하면 compose의 `user:`를 그 사용자로 맞춘다 |

그 밖의 환경 변수는 `app.py` 첫머리에 있다(`JOBS_ROOT`, `ENGINE_CMD_LBM`, `ENGINE_CMD_LBM_DEM`, `CALLBACK_ATTEMPTS`, `CALLBACK_DELAY_S`, `ENGINE_BUILD_INFO`).

띄운 뒤에는 다음으로 확인한다.

```bash
curl http://127.0.0.1:18080/health
curl -F job_id=cd_001 -F engine=lbm \
     -F config=@examples/03_concentration_diffusion/03_concentration_diffusion.json \
     http://127.0.0.1:18080/jobs
curl http://127.0.0.1:18080/jobs/cd_001
curl -o cd_001_last.zip "http://127.0.0.1:18080/jobs/cd_001/download?range=last"
```

## 6. 테스트

`api` 폴더에서 실행한다. 실제 해석기 대신 가짜 해석기(`tests/fake_solver.py`)를 쓰므로 GPU가 없어도 된다.

```bash
python -m unittest tests.test_core -v      # 처리 로직 20개. 표준 라이브러리만 필요
python -m unittest tests.test_app -v       # HTTP 경로 3개. fastapi, httpx, python-multipart 필요
```
