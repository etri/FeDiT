# 컨테이너 배포 — 페이지 + https 앞단 (+ 리허설용 해석엔진)

우리 페이지(시작·전처리·물리 시뮬레이션·후처리)와 https 앞단(proxy: 밖에서 오는 요청을 받아 안쪽 컨테이너로 나눠 보내는 웹서버)을 컨테이너(서로 격리된 작은 실행 환경)로 띄운다. 실제 서버는 1세부 서버 E8IGHT이고 주소는 `https://cfd.fedit.or.kr`이다. 그 서버의 해석엔진은 1세부가 따로 띄운다. 이 PC에서는 엔진까지 함께 띄워 리허설한다.

페이지가 같은 주소의 `engine/`·`results/`를 직접 부른다.

## 1. 구성

### 1.1 흐름

```text
사용자 브라우저 (FeDiT 화면의 iframe 탭 안 — iframe: 다른 웹페이지 안에 이 페이지를 끼워 보여 주는 틀)
  https://cfd.fedit.or.kr/
    pre.html 전처리 ──[해석 실행]──> sim.html 물리 시뮬레이션 ──[가시화]──> post.html?job=<작업 번호> 후처리
                                      │ POST engine/jobs                    │ GET results/<작업 번호>/...
                                      │ GET  engine/jobs/<작업 번호>          │ (폴더 목록 + 바이트 범위 읽기)
                                      v                                     v
  [proxy 컨테이너] nginx, 443(https) · 80(→ https) · 127.0.0.1:8090(안쪽 확인용 http)
    /           → renderer:8080   페이지(정적 파일)
    /engine/    → engine:8000     해석엔진 API. 앞의 /engine 을 떼고 넘긴다
    /results/   → /srv/jobs       엔진 작업 폴더(읽기 전용) = 서버의 JOBS_HOST_DIR
```

물리 시뮬레이션 페이지를 바로 열어 입력 JSON 하나와 STL을 올려 실행하는 길도 있다. 전처리는 해석기를 부르지 않고, 후처리는 결과를 열기만 한다. 세 페이지가 같은 주소라서 한 iframe 안에서 페이지만 바뀐다.

### 1.2 컨테이너

| 컨테이너 | 이미지 | 어디서 | 하는 일 |
| --- | --- | --- | --- |
| `renderer` | `union-twin-cfd-renderer:local` (122 MB) | 이 저장소 `../Dockerfile` | 페이지(nginx 정적 서버). `127.0.0.1:8088` 에도 연다(확인용) |
| `proxy` | `union-twin-cfd-proxy:local` (93 MB) | `proxy/` | https 앞단. 아래 1.3절의 길 나누기 |
| `engine` | `fedit-engine:local` (4.31 GB) | 1세부 패키지 `integration/Dockerfile` 그대로 | 해석엔진 API + 해석기(GPU). **이 PC 리허설에서만** 띄운다(profile `engine`). E8IGHT 서버에서는 1세부 compose 가 띄운 것을 쓴다 |

profile(묶음 이름): compose 서비스에 이름을 붙여 두면 `--profile engine` 을 줄 때만 그 서비스가 뜬다.

### 1.3 앞단의 길

| 길 | 넘기는 곳 | 허용 | 비고 |
| --- | --- | --- | --- |
| `/` | `renderer:8080` | 모두 | 캐시·보안·iframe 허용 헤더는 renderer 가 붙인 것을 그대로 넘긴다 |
| `/engine/` | `engine:8000` | GET · POST | `engine/jobs` → 엔진의 `/jobs`. 여는 길은 `health` · `jobs` · `jobs/<작업 번호>` · `jobs/<작업 번호>/download` 넷이고, 나머지(엔진 설명 페이지 `docs` · `openapi.json` 등)는 404. DELETE 등은 403. 업로드 1 GB까지, 받는 대로 흘려보냄(앞단에 쌓지 않음), 대기 1시간. 해석 실행(POST)은 접속 주소(IP)별 분당 10건(한꺼번에 5건까지)·동시 2건, 넘으면 429. 조회(GET)는 세지 않는다 |
| `/results/<작업 번호>/...` | 작업 폴더(읽기 전용) | GET | 폴더 주소(`/`로 끝남)는 JSON 목록 `[{"name","type","mtime","size"}]`. 파일은 Range(파일의 일부 바이트만 받기) 지원 |
| `/results/` | — | — | 404. 작업 전체 목록은 내주지 않는다. 다만 결과는 공개다(아래 1.4절 '결과 공개') |
| `.../continue/`, 점(.)으로 시작하는 이름 | — | — | 404. `continue/`는 재시작 파일 폴더(대소문자를 가리지 않고 막음). 다만 부모 폴더 목록에는 `continue` 이름이 보인다(nginx 목록은 거르지 못함) |

`results/`의 파일은 json·log 만 글자로, 나머지는 내려받기 형식(application/octet-stream)으로 보낸다. 누군가 올린 파일이 이 주소의 웹페이지로 열리지 않게 하려는 것이다. 페이지의 `fetch`로 읽는 데는 차이가 없다.

### 1.4 접근 키 (해석 실행만)

| `ACCESS_KEY` | 동작 |
| --- | --- |
| 비움(기본) | 해석 실행이 로그인·키 없이 열려 있다 |
| 16자 이상 값 | `POST engine/jobs`만 쿠키 `cfd_key`가 그 값과 같아야 한다. 아니면 401. 조회·결과 읽기·페이지는 그대로 열려 있다 |

- 페이지는 키를 쿠키 `cfd_key`로 보낸다(`src/data/engineApi.ts` `setAccessKey`).
- 키는 영문·숫자·`_`·`-` 만 쓴다. 대소문자를 가린다. 만들기: `openssl rand -hex 16`.
- 값이 틀리면(짧거나 다른 글자) 앞단이 시작하지 않는다(`proxy/check-env.sh`).
- `service.fedit.or.kr`와 `cfd.fedit.or.kr`는 같은 사이트(fedit.or.kr)라서 iframe 안에서도 쿠키가 막히지 않을 것이다(추정. 브라우저의 3자 쿠키 차단은 다른 사이트에만 걸린다. 실제 iframe 에서는 아직 확인 전).

**결과 공개 (2026-10-21 결정)**: 해석 입력·결과는 누구나 볼 수 있게 둔다. `engine/health` 응답의 `running_job`에 지금 도는 작업 번호가 들어 있고, 그 번호로 `results/<작업 번호>/`와 `engine/jobs/<작업 번호>/download`(입력 JSON·STL·결과 ZIP)를 누구나 읽는다. 접근 키를 넣어도 이 조회는 열려 있다. 숨기려면: 443 server 에서 `location = /engine/health { return 404; }`(8080 은 그대로 — run.sh·smoke 가 씀)와 작업 번호를 길게(`src/data/engineApi.ts` `newJobId`의 난수 2바이트 → 8바이트). 대가로 물리 시뮬레이션 페이지의 '실행 중 1건 · 대기 n건' 줄이 빈다. 실제 기관 데이터를 올리게 되면 다시 정한다.

### 1.5 파일

| 파일 | 내용 |
| --- | --- |
| `docker-compose.yml` | renderer · proxy · engine(profile `engine`) |
| `docker-compose.server.yml` | E8IGHT 서버용 덧붙임. proxy 를 1세부 엔진 네트워크에 붙이고, 작업 폴더 경로를 꼭 적게 한다 |
| `proxy/default.conf.template` | 앞단 설정 틀. 시작할 때 환경 변수를 넣어 만든다: 80 → https, 443 https, 8080 안쪽 확인용, 접근 키 판정 |
| `proxy/locations.conf` | 길 나누기(고정 파일). 443 과 8080 이 함께 쓴다 |
| `proxy/check-env.sh` | 시작 전 확인: 주소 이름, 접근 키 형식, 인증서 |
| `proxy/Dockerfile` | 앞단 이미지(공식 nginx 1.28) |
| `nginx/default.conf.template` | renderer 설정: 캐시 규칙, 보안 헤더, iframe 허용 출처(`FRAME_ANCESTORS`), 상태 확인 `/healthz` |
| `.env.example` | 서버마다 다른 값. `.env`로 복사해 쓴다 |
| `smoke_test.sh` | 띄운 뒤 확인: 엔진 → 페이지 → 해석 1건 → 결과 폴더 읽기 → 결과 ZIP |
| `certs/` | 인증서 폴더(기본 위치). 저장소에 넣지 않는다(`.gitignore`) |

## 2. 이 PC 리허설 (엔진까지 함께)

준비:

- Docker와 Docker Compose.
- NVIDIA GPU, 드라이버, NVIDIA Container Toolkit(컨테이너 안에서 GPU를 쓰게 해 주는 도구). Windows는 Docker Desktop(WSL2: Windows 안에서 도는 리눅스 환경)이 이를 대신한다.
- 1세부 해석엔진 패키지(FeDiT 저장소 `OPFW/modeling_simulation_engines`) 폴더.

```bash
cd deploy
cp .env.example .env
#   .env 고칠 것: ENGINE_DIR(엔진 패키지 경로),
#                 COMPOSE_PROFILES=engine 주석 풀기(매번 --profile engine 을 붙이지 않게)
#   PROXY_BIND 는 127.0.0.1(이 PC 안에서만 열기) 그대로 둔다

# 시험용 인증서(스스로 서명한 것, 2일짜리). Git Bash 에서는 MSYS_NO_PATHCONV=1 이 있어야 /CN=... 이 경로로 바뀌지 않는다
mkdir -p certs
MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:2048 -nodes -days 2 -subj "/CN=cfd.fedit.or.kr" \
  -addext "subjectAltName=DNS:cfd.fedit.or.kr" -keyout certs/privkey.pem -out certs/fullchain.pem

docker compose --profile engine build     # 처음에는 CUDA 기본 이미지(약 1.3 GB)를 받느라 몇 분 걸린다
docker compose --profile engine up -d
docker compose --profile engine ps        # 셋 다 (healthy)(상태 확인 통과)가 될 때까지 기다린다
```

- 페이지: `http://127.0.0.1:8090/`(앞단을 거침). `pre.html` · `sim.html` · `post.html?job=<작업 번호>`.
- https 확인(시험 인증서라 `-k`): `curl -k --resolve cfd.fedit.or.kr:443:127.0.0.1 https://cfd.fedit.or.kr/engine/health`. `--resolve`는 DNS(주소 이름을 IP로 바꾸는 체계) 없이 이 이름을 이 PC로 보낸다.
- 엔진 바로: `curl http://127.0.0.1:18080/health`. `"status":"ok"`와 GPU 이름이 나와야 한다. 503이면 컨테이너 안에서 GPU가 안 보이는 것이다.
- 멈추기: `docker compose --profile engine down`. 작업 폴더(`jobs/`)와 GPU 코드 캐시(`nvcache/`)는 그대로 남는다.
- 셋 다 `restart: unless-stopped`다. Docker가 다시 켜지면 직접 멈춘 경우가 아닌 한 함께 다시 뜬다.
- 예전 `.env`(2026-10-19판)를 쓰던 PC는 새 항목(`PUBLIC_HOST` · `CERT_DIR` · `ACCESS_KEY` · `PROXY_BIND` · `HTTP_PORT` · `HTTPS_PORT` · `PROXY_LOCAL_PORT`)을 `.env.example`에서 옮겨 적는다. 없으면 기본값으로 뜬다. `PROXY_BIND` 기본은 `127.0.0.1`(이 PC 안에서만)이다.
- 이 PC의 80·443 을 다른 프로그램이 쓰고 있으면 `HTTP_PORT`·`HTTPS_PORT`를 바꾼다.

`.env` 항목은 `.env.example`의 주석에 있다. 자주 바꾸는 것:

| 항목 | 기본값 | 바꿀 때 |
| --- | --- | --- |
| `PUBLIC_HOST` | `cfd.fedit.or.kr` | 다른 주소 이름으로 올릴 때. 인증서와 맞아야 한다 |
| `CERT_DIR` | `./certs` | 인증서 폴더. 서버에서는 절대 경로 |
| `ACCESS_KEY` | 비움(열림) | 해석 실행을 막고 싶을 때(1.4절) |
| `PROXY_BIND` | `127.0.0.1` (이 PC 안에서만) | 서버에서 밖에 열 때 `0.0.0.0` |
| `JOBS_HOST_DIR` | `./jobs` | 작업 폴더. 결과 한 건이 수 GB~수십 GB라 넉넉한 디스크로. 서버에서는 1세부 엔진의 작업 폴더(5절) |
| `FRAME_ANCESTORS` | `*` (제한 없음) | 호스트 주소로 좁힌다. 예: `FRAME_ANCESTORS="'self' https://service.fedit.or.kr"` |
| `ENGINE_DIR` | 이 PC 경로 | 엔진 패키지 경로. 리허설 빌드에만 쓴다(서버에서는 비워도 됨) |

## 3. 띄운 뒤 확인

`smoke_test.sh`는 물리 시뮬레이션 페이지가 할 일(해석 보내기, 상태 조회)과 후처리가 할 일(결과 폴더 읽기)을 curl로 대신한다. 실제로 해석 1건을 돌린다.

```bash
# 앞단을 거쳐 (권장): 페이지·engine/·results/ 를 모두 http://127.0.0.1:8090 으로
PROXY=http://127.0.0.1:8090 bash smoke_test.sh <해석엔진 패키지 폴더>/examples/03_concentration_diffusion/03_concentration_diffusion.json
# STL 이 있는 입력: JSON 다음에 STL 을 나열한다(전처리에서 내려받은 ZIP 을 풀면 JSON 과 STL 이 함께 있다)
PROXY=http://127.0.0.1:8090 bash smoke_test.sh multiphase.json corrected_left.stl solid.stl
# 앞단에 접근 키를 넣었으면
PROXY=http://127.0.0.1:8090 ACCESS_KEY=<키> bash smoke_test.sh <입력 JSON>
# 앞단 없이 엔진·renderer 를 바로 (예전 방식, 결과 폴더 읽기는 건너뜀)
bash smoke_test.sh <입력 JSON>
```

순서: 엔진 상태 → 페이지 8개 응답 → 해석 실행(202) → 5초마다 상태 조회(완료까지) → 결과 폴더 목록·`.vtm` 바이트 범위 읽기(206)·`continue/` 404 → 결과 ZIP(`range=all`) 받기. 끝나면 후처리 주소 `post.html?job=<작업 번호>`를 알려 준다. 입력 파일은 스크립트를 돌리는 컴퓨터에 있어야 한다. 그 밖의 환경 변수(`ENGINE_KIND`, `JOB_ID`, `RANGE`, `OUT`, `TIMEOUT_S`, `ENGINE`, `RENDERER`, `RESULTS`)는 스크립트 첫머리에 있다.

시험 작업 지우기: 앞단은 DELETE 를 막는다. 서버 안에서 엔진 포트로 직접 지운다: `curl -X DELETE http://127.0.0.1:18080/jobs/<작업 번호>`.

앞단만 따로 볼 때(해석을 돌리지 않음):

```bash
P=http://127.0.0.1:8090
curl -s $P/engine/health                                         # 200, GPU 이름
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE $P/engine/jobs/x # 403
curl -s -o /dev/null -w '%{http_code}\n' -X POST -F job_id= $P/engine/jobs   # 키 없음 401 / 열림 400(엔진이 job_id 형식 오류로 거절, 작업은 안 생김)
curl -s $P/results/<끝난 작업 번호>/                              # JSON 폴더 목록
curl -s -o /dev/null -w '%{http_code}\n' -H 'Range: bytes=0-15' $P/results/<작업 번호>/<입력 이름>/<이름>_0.vtm   # 206
```

## 4. 이 PC에서 확인한 것

환경: Windows 11 25H2, Docker Desktop 4.95(WSL2), RTX 4070 Ti SUPER(드라이버 591.86).

**2026-10-19 — 엔진 + 페이지 (앞단 전)**. 이 GPU는 해석기 빌드 대상(sm_89)에 들어 있어 첫 실행에도 GPU 코드 컴파일이 없었다(`nvcache/` 0 B).

| 확인 | 결과 |
| --- | --- |
| 빌드 | 두 이미지 빌드 성공. 엔진 컨테이너 안에서 GPU가 보임(`/health` 200) |
| 페이지 | 전처리·후처리 페이지가 콘솔 오류 없이 뜸. 요청이 모두 200. 압축 전송: 내장 STL `RTI_region.stl` 21 MB → 3.4 MB, 도시 예제 CSV 3 MB → 0.7 MB |
| 농도확산 | 전처리에서 템플릿 → ZIP 내보내기 → 엔진 실행 11초, 저장 5회, 결과 ZIP 355 KB → 후처리에서 열림(셀 264, 시점 5). 내보낸 JSON은 공식 예제와 `meta.title`만 다르다(파일 이름에 맞춤) |
| 다상 + STL 2개 | 전처리에서 템플릿 → 계산 끝·저장 끝을 200으로 줄임(공식 짧은 실행과 같은 값) → ZIP(JSON+STL 2개) → 엔진 실행 6초, 저장 3회, 결과 ZIP 7.8 MB → 후처리에서 열림(셀 70,500, 형상 2개) |
| STL 굽기 | 위 다상 결과 `.vtu` 3개가 공식 `02_multiphase_short.json`을 같은 컨테이너에서 돌린 결과와 바이트 단위로 같다 |
| 다시 시작 | `docker compose restart` 뒤 두 컨테이너가 9초 안에 healthy. 끝난 작업 기록(`engine_job.json`)이 남아 상태 조회가 그대로 됨 |

**2026-10-21 — 앞단**. compose 로 띄우지 않고, 이미 떠 있던 engine·renderer 의 네트워크에 시험용 앞단 컨테이너를 따로 붙여 확인했다(인증서는 스스로 서명한 시험용, 작업 폴더는 끝난 작업 1건의 사본).

| 확인 | 결과 |
| --- | --- |
| 설정 | `docker compose config`(리허설·서버 덧붙임 모두) 통과, 앞단 이미지 빌드, `nginx -t` 통과(키 비움·키 넣음) |
| 시작 전 확인 | 주소 이름 없음 · 키 15자 이하 · 키에 다른 글자 · 인증서 없음 · 안쪽 주소 형식 틀림 → 모두 멈춤(종료 코드 1) |
| 페이지 | `/` · `pre.html` · `/healthz` 200. renderer 헤더(frame-ancestors 등)와 미리 압축한 gzip 이 그대로 지나감 |
| engine/ | `health` · `jobs/<번호>` 200, `download?range=last` 200(ZIP 315 KB, 쿼리가 그대로 감). DELETE·PUT 403. 검토 뒤 고침: 엔진 설명 페이지 `docs` · `redoc` · `openapi.json`이 200 으로 열리던 것 → `health` · `jobs` · `jobs/<번호>` · `jobs/<번호>/download` 밖은 404 |
| 접근 키 | 키 넣음: 쿠키 없음 401, 대소문자만 다른 쿠키 401, 맞는 쿠키는 엔진까지 감(빈 job_id → 엔진 400 메시지가 그대로 옴). 키 비움: 쿠키 없이 엔진까지 감. 20 MB 업로드도 엔진까지 감(1 MB 제한 없음) |
| results/ | 작업 폴더 JSON 목록 200, `/results/` 404, `continue/`·그 안 파일·점 파일 404, `/` 없는 폴더 주소는 `/` 붙은 경로로 301(주소 이름·포트 없이), Range 206, POST 403, `..`·`%2e%2e` 로 폴더 밖 → 모두 막힘(404·400), `.html` 파일은 내려받기 형식 + `sandbox` 헤더. 검토 뒤 고침: Windows 폴더를 붙인 이 PC 에서 `CONTINUE/`처럼 대소문자만 바꾼 주소로 재시작 파일 폴더가 200 으로 열리던 것 → 404 |
| https | TLS 1.2·1.3 200, TLS 1.1 거절, HTTP/2 협상(ALPN h2). 80 → `https://<PUBLIC_HOST>/...` 301(요청의 Host 를 따르지 않음). 상태 확인 healthy |

확인하지 않은 것:

- compose 로 셋을 함께 띄운 리허설(`docker compose --profile engine up -d`)과 그 상태의 `smoke_test.sh` 끝까지. 결과 폴더 읽기 단계는 위 시험용 앞단에서 끝난 작업으로만 돌렸다.
- 진짜 인증서(*.fedit.or.kr)로 https. `sim.html`이 든 새 renderer 이미지.
- 호스트 앱 iframe 안에서 세 페이지 이동, 쿠키, 내려받기.
- 대기열(앞 작업이 끝나기 전에 다음 작업), 완료 알림(`FEDIT_RESULT_URL`), 큰 결과(원래 길이 01·04의 수 GB), `lbm_dem`(유체-DEM), Linux 서버에서의 실행.

## 5. E8IGHT 서버에 올릴 때

### 5.1 두 서버의 역할

| 서버 | 주소 | 할 일 |
| --- | --- | --- |
| E8IGHT (1세부 서버) | `<서버 IP>` → `cfd.fedit.or.kr` | 1세부 해석엔진(1세부가 띄움) + 우리 renderer · proxy |
| TWIN (FeDiT 운영) | `service.fedit.or.kr` | 사이드바에 우리 탭 등록만. 엔진 중계·실행 화면은 만들지 않는다 |

FeDiT 는 이 주소를 iframe 으로 띄우기만 한다.

### 5.2 먼저 서버에서 확인할 것

1세부 엔진은 그들의 compose(`<엔진 폴더>/integration/docker-compose.yml`, 엔진 폴더는 서버에 받은 FeDiT 의 `modeling_simulation_engines`)로 이미 떠 있다(컨테이너 `integration-engine-1`, `127.0.0.1:18080`). 아래 두 값은 추정이라 서버에서 확인한다.

```bash
docker inspect integration-engine-1 --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'
#   → 네트워크 이름. integration_default 가 아니면 .env 의 ENGINE_NETWORK 에 적는다
docker inspect integration-engine-1 --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}'
#   → "... -> /jobs" 의 앞부분이 작업 폴더. .env 의 JOBS_HOST_DIR 에 그대로 적는다
#     (예상: <엔진 폴더>/integration/jobs)
```

### 5.3 파일 옮기기

**보통은 묶음으로 한다**: 이 PC 에서 `bash deploy/bundle/make_bundle.sh <인증서 폴더>` → 만든 폴더 안의 파일을 파일질라(SFTP, 배포 계정)로 서버 `~/cfd-deploy`(배포 계정의 홈 아래) 에 모두 올림 → 서버에서 `cd ~/cfd-deploy && bash run.sh`. 자세한 것(최종본으로 바꾸기·되돌리기·인증서 교체)은 `deploy/bundle/README.txt`. run.sh 가 5.2절의 두 값을 찾아 `.env` 에 채우고 5.4-5.5절 일을 대신한다. 아래는 묶음을 쓰지 않을 때.

서버에는 git 이 없다. 두 길 중 하나:

1. 여기서 만든 이미지를 옮긴다(서버에서 빌드하지 않음).
   ```bash
   docker compose build renderer proxy
   docker save union-twin-cfd-renderer:local union-twin-cfd-proxy:local | gzip > union-twin-cfd-images.tar.gz
   # 서버에서
   gunzip -c union-twin-cfd-images.tar.gz | docker load
   ```
   서버의 한 폴더(예: `~/cfd/deploy`)에 `docker-compose.yml` · `docker-compose.server.yml` · `.env` · `smoke_test.sh`를 둔다. 띄울 때 `--no-build`를 붙인다.
2. 저장소 폴더를 통째로 옮겨 서버에서 빌드한다(`node_modules` · `dist` · `data` · `captures` · `output` · `tmp` · `deploy/jobs` · `deploy/nvcache` 는 빼고).

### 5.4 인증서와 .env

- 인증서 폴더(예: `~/cfd/certs`)에 두 파일을 둔다.
  - `fullchain.pem`: 서버 인증서 다음에 중간 인증서를 이어 붙인 것(받은 NginX 묶음).
  - `privkey.pem`: 비밀 키. `chmod 600`(주인만 읽기). 앞단의 nginx 는 root 로 키를 읽으므로 root 소유여도 된다.
- `.env`(`.env.example`을 복사해 고침):

| 항목 | 서버 값 |
| --- | --- |
| `PUBLIC_HOST` | `cfd.fedit.or.kr` |
| `CERT_DIR` | 위 인증서 폴더 절대 경로 |
| `ACCESS_KEY` | 비움(열림) 또는 키(1.4절) |
| `PROXY_BIND` · `HTTP_PORT` · `HTTPS_PORT` | `0.0.0.0` · `80` · `443` |
| `JOBS_HOST_DIR` | 5.2절의 작업 폴더. 비우면 덧붙임 설정이 멈춘다(빈 `./jobs`를 붙여 결과가 안 보이는 일을 막음). `.env.example`에는 주석으로만 있으니 주석을 풀고 적는다 |
| `ENGINE_NETWORK` | 5.2절의 네트워크 이름 |
| `FRAME_ANCESTORS` | `"'self' https://service.fedit.or.kr"` |
| `ENGINE_DIR` 등 엔진 항목 | 쓰지 않는다(비워도 됨) |

### 5.5 띄우기와 확인

```bash
docker compose -f docker-compose.yml -f docker-compose.server.yml up -d --no-build renderer proxy
docker compose -f docker-compose.yml -f docker-compose.server.yml ps        # 둘 다 healthy
curl -s http://127.0.0.1:8090/engine/health                                 # 앞단 → 1세부 엔진. 502 면 네트워크 이름 확인
curl -s --resolve cfd.fedit.or.kr:443:127.0.0.1 https://cfd.fedit.or.kr/ -o /dev/null -w '%{http_code}\n'   # 진짜 인증서라 -k 없이 200
PROXY=http://127.0.0.1:8090 bash smoke_test.sh <입력 JSON>                  # 해석 1건(1세부 엔진에 실제로 돈다 — 1세부와 미리 맞춘다)
```

- `docker-compose.server.yml`은 proxy 를 우리 기본 네트워크와 1세부 네트워크(external network: 다른 compose 가 만든 네트워크에 붙기만 함) 둘에 붙인다. 우리 compose 를 내려도 1세부 네트워크와 엔진은 그대로다.
- `results/`가 403 이면 작업 폴더의 파일을 앞단 nginx(uid 101)가 읽지 못하는 것이다. 엔진이 root 로 만든 파일은 보통 누구나 읽을 수 있다(644). 다르면 권한을 확인한다. SELinux(Rocky 의 접근 통제 기능)가 켜져 있으면(`getenforce`가 Enforcing) 붙인 폴더 읽기가 막힐 수 있다.
- 서버 밖에서 열리는지는 아래 5.6절이 끝나야 확인된다(2026-10-21 기준 밖에서 80·443 무응답이었다). 서버 안에서는 되는데 밖에서 안 열리면 `.env`의 `PROXY_BIND`가 `0.0.0.0`인지도 본다(기본은 `127.0.0.1`).

### 5.6 제주TP에 요청할 것

| 요청 | 내용 |
| --- | --- |
| DNS | `cfd.fedit.or.kr` → `<서버 IP>` (A 레코드: 이름을 IP에 잇는 항목) |
| 방화벽 | `<서버 IP>` 의 443(https)·80(→ https 되돌림) 밖에서 들어오기 허용 |

인증서는 이미 받은 *.fedit.or.kr 를 그대로 쓴다. 만료일은 run.sh 가 출력한다.

### 5.7 FeDiT 쪽

탭 등록만 한다(탭 하나, 2026-10-22 결정). 호스트 앱 `registry.ts`에 주소 하나 `https://cfd.fedit.or.kr/`(시작 화면)를 넣고 '분석 > 물리 시뮬레이션'(`app/(app)/physics/page.tsx`)을 그 iframe 으로 바꾸고, iframe sandbox(틀 안의 페이지에 허락할 일 목록)에 `allow-downloads`를 더한다. 없으면 전처리의 JSON·ZIP 내려받기와 물리 시뮬레이션의 결과 ZIP 내려받기가 막힌다(해석 실행·후처리 보기는 된다). 그 전에는 `https://cfd.fedit.or.kr/` 을 브라우저 새 탭으로 직접 열어 쓴다. 세 페이지 사이 이동은 같은 iframe 안에서 우리가 한다. 결과는 후처리가 `results/`로 바로 읽으므로 FeDiT 를 거치지 않는다.

## 6. 주의

- **앞단은 DELETE 를 막는다**: 시험 작업 지우기는 서버 안에서 엔진 포트(`127.0.0.1:18080`)로 직접 한다. E8IGHT 의 엔진은 1세부 것이므로 지우기 전에 1세부와 맞춘다.
- **결과 크기**: `range=all`로 원래 길이 01·04를 받으면 수 GB다. 후처리 `post.html?job=`은 서버의 결과를 바이트 범위로 바로 읽으므로 ZIP 을 받지 않아도 된다. ZIP 을 직접 열 때 메모리에서 바로 여는 상한은 풀었을 때 256 MB다(맨 위 README '후처리 기능'의 알려진 한계).
- **이 PC의 Docker Desktop 시작 실패(2026-10-19)**: Docker Desktop이 "The file cannot be accessed by the system"으로 멈췄다. 원인은 `%LOCALAPPDATA%\Docker\run\`과 `%LOCALAPPDATA%\docker-secrets-engine\`에 7월에 남은 0바이트 소켓 파일(프로그램끼리 연결하는 데 쓰는 표시 파일)이다. 이 파일은 PowerShell `Remove-Item`·`del`·`fsutil`로는 지워지지 않았고, WSL에서 `rm /mnt/c/Users/<사용자>/AppData/Local/Docker/run/<파일>`로 지워졌다. 창의 'Reset to factory defaults'는 이미지·설정을 모두 지우니 누르지 않는다.
- **Windows에서 작업 폴더**: `./jobs`는 NTFS(Windows 디스크 형식) 폴더를 WSL2 너머로 붙인 것이라, 큰 결과(수십 GB)는 쓰기가 느릴 수 있다. 이 PC에서는 작은 결과만 확인했다.
- **엔진 파일 주인(Linux)**: 이 PC 리허설의 엔진은 그냥 띄우면 root 로 돌아 결과 파일의 주인이 root 가 된다. 서버 사용자가 결과를 직접 지워야 하면 `docker-compose.yml`의 `user:`를 그 사용자의 uid:gid(리눅스 사용자 번호:그룹 번호)로 맞춘다(1세부 연동 안내 3.3절). E8IGHT 의 엔진 설정은 1세부 compose 가 정한다.
