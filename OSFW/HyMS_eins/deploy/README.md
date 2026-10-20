# HyMS_eins 서버 배포 가이드 (simulation.fedit.or.kr / HTTPS)

대상 서버: **simulation.fedit.or.kr** (Windows + Docker Desktop)
웹 UI 라우트: **https://simulation.fedit.or.kr/simulation/**
외부 연동 주소: `ENV_DISCRETE_SIMULATOR_URL=https://simulation.fedit.or.kr`

> **배포는 패키지 + `setup.bat` 한 번으로 끝난다 (0장).**
> 아래 1~5장은 setup 이 내부에서 수행하는 단계와 수동 운영·문제 해결 참고용이다.

---

## 0. 배포 패키지 (권장 방식)

### 0-1. 패키지 만들기 (개발 PC)

```powershell
cd <프로젝트>\deploy
powershell -ExecutionPolicy Bypass -File .\build_package.ps1            # 온라인 패키지 (~50MB)
powershell -ExecutionPolicy Bypass -File .\build_package.ps1 -Offline   # 폐쇄망 패키지 (~800MB)
```

결과 : `dist\HyMS_eins_<yyyyMMdd>[_offline].zip` (+ `.sha256`)

| 구분 | 온라인 | 오프라인 (`-Offline`) |
|------|--------|----------------------|
| Python 3.10.11 / VC++ 설치 파일 | 설치 중 다운로드 | `prereq\` 동봉 |
| Python wheel (requirements.txt) | 설치 중 pip | `prereq\wheels\` 동봉 |
| Docker 이미지 3종 | 설치 중 pull | `prereq\docker_images.tar` 동봉 |
| Docker Desktop / WSL | 없으면 다운로드 후 무인 설치, `wsl --update` | `-IncludeDockerInstaller` 를 함께 주면 동봉 (+약 800MB, Docker 라이선스 범위 안에서만 배포) |

패키지에서 **제외**되는 것 : `db\`(운영 데이터), `docker_setup\.env`(비밀번호),
`web_conf\certs\server.*`(인증서·개인키), `__pycache__`·`*.bak_*`·`.vs` 등 개발 부산물,
`10_서버_설치_및_기동.ps1`(setup.ps1 로 대체), `01b_restapi_portproxy_fallback.ps1`(구 바이너리용).

빌드 시 `poc_manager.json` 포트와 nginx `poc_rest` upstream 이 다르면 중단한다(포트 불일치 재발 방지).

### 0-2. 서버 설치 (사용자)

1. zip 을 영문 경로에 압축 해제 (예: `C:\HyMS_eins`)
2. `setup.bat` 더블클릭 → UAC [예] → 설치 계획 확인 (Docker 신규 설치 시 라이선스 동의 포함) — 질문은 이것 하나
3. 자동 진행 : `.env` 생성(서버 주소 자동 감지, 무작위 DB 비밀번호) → VC++ → Python 3.10 → pip 패키지 →
   Docker(WSL 2 기능 활성화 → `wsl --update` → Docker Desktop 무인 설치 → 엔진 기동 → Linux 컨테이너 모드) →
   이미지 → `host.docker.internal` 경로 확인 → urlacl·방화벽 → 로그인 시 자동 기동 등록 → 전체 기동 → 상태 점검 → 브라우저 열기
4. 재부팅이 필요하면(WSL 기능 최초 활성화 등) 작업 스케줄러에 `HyMS_eins Setup Resume` 를 1회용으로 등록하고
   60초 뒤 재부팅한다. 같은 계정으로 로그인하면 setup 이 같은 옵션으로 자동 재개된다.

운영 : `start.bat` / `stop.bat` / `status.bat`  ·  로그 : `logs\setup_*.log`, `logs\autostart.log`

재부팅 후에는 작업 스케줄러 `HyMS_eins AutoStart`(로그인 시, 관리자 권한)가 Docker 엔진을 최대 10분 기다린 뒤
`02_start_all.ps1` 로 전체를 기동한다. `start.bat` 도 Docker 가 꺼져 있으면 Docker Desktop 을 띄우고 기다린다.

| setup 옵션 | 설명 |
|-----------|------|
| `-ServerHost <주소>` | 서버 주소 지정 (기본: 이 PC 의 IP 자동 감지. 설치된 서버에서는 주소만 변경, 비밀번호 유지) |
| `-Unattended` | 확인 질문 없이 진행 (자동화) |
| `-AcceptDockerLicense` | `-Unattended` 로 Docker Desktop 까지 설치할 때 라이선스 동의 |
| `-NoReboot` | 재부팅이 필요해도 자동 재부팅하지 않음 (직접 재부팅 후 로그인하면 자동 재개) |
| `-NoAutoStart` | 로그인 시 자동 기동을 등록하지 않음 (이미 있으면 삭제) |
| `-SkipStart` | 설치만 하고 기동하지 않음 |
| `-NoBrowser` | 완료 후 브라우저를 열지 않음 |

setup 이 다루지 않는 것 : 공인 IP·DNS, 네트워크 방화벽, 공유기·L4 포트포워딩, BIOS 가상화, 공인 인증서 발급.

> Docker 엔진 : Docker Desktop 기준이다. Rancher Desktop 도 `host.docker.internal` 을 Windows 호스트
> (192.168.127.254)로 해석해 동작함을 확인했다(2026-10-07). 엔진 기동 직후에는 이 이름의 해석이 잠시
> 실패할 수 있어 setup 은 여러 번 재시도하며, nginx 는 `restart: unless-stopped` 로 스스로 회복한다.
> compose 는 `docker_setup` 폴더에서 `-f` 없이 실행하므로 `.env` 의 `COMPOSE_FILE`(Linux 엔진용 오버라이드)이 적용된다.

> Python 패키지는 반드시 **Python 3.10** 에 설치돼야 한다. `model_cap_python.exe` 는
> `sim_engine\python310.dll` 을 쓰고 표준 라이브러리·site-packages 는 레지스트리에 등록된
> 3.10 설치본에서 찾는다. `python3 -m pip ...` 은 서버에 따라 다른 버전(예: 3.14)에 설치될 수
> 있으므로 setup 은 레지스트리에서 3.10 경로를 직접 찾아 `python.exe -m pip` 으로 설치한다.

---

## 1. 최종 구성

```
인터넷
  │  443 (HTTPS)                      80 (HTTP)
  ▼                                    ▼
┌────────────────────────────────────────────────────────────┐
│ Nginx  컨테이너 172.28.0.2                                  │
│  /simulation/                  → web_root/ 정적 파일        │
│  /simulation/get_*  /set_*     → node 172.28.0.3:8081      │
│  /simulation/sim               → host:8869  (WSS)          │
│  /simulation/model             → host:8870  (WSS)          │
│  /api/sim/...  (/api/sim/run)  → host:8084  (시뮬 REST)     │
│  /api/tci/...  /GetWeight      → host:8082  (POC REST)     │
│  /Reset  /SendComfortIndex     → host:8082                 │
│  /poc/<경로>                    → host:8082                 │
│  /api/...  (그 외)              → host:8082  (POC REST)     │
│  그 외 80 요청                  → 443 으로 301 리다이렉트     │
└────────────────────────────────────────────────────────────┘
      │                                  │
      ▼                                  ▼
 node 172.28.0.3:8081            호스트 네이티브 프로세스
      │                           ├ fDTSimServer.exe
      ▼                           │    8864 model / 8869 GUI WS / 8084 REST
 mariadb 172.28.0.4:3306          ├ atomic_model_manager.exe
 (호스트 127.0.0.1:3307)           │    8865 model / 8870 GUI WS
                                  └ poc_manager.exe
                                       8082 POC REST (/api/simulations, /api/health ...)
                                       (fDTSimServer 8869 에 클라이언트로 접속)
```

포트 공개 범위

| 포트 | 서비스 | 공개 범위 |
|------|--------|-----------|
| 80 | Nginx HTTP | 인터넷 (API·WS 는 그대로, UI 는 443 리다이렉트) |
| 443 | Nginx HTTPS | 인터넷 |
| 8081 | Node.js | 호스트 루프백만 (`127.0.0.1:8081`) |
| 3307 | MariaDB | 호스트 루프백만 (`127.0.0.1:3307`) |
| 8082 | poc_manager REST (POC RestAPI, `poc_manager.json`) | 로컬 + Docker 서브넷만 |
| 8084 | fDTSimServer 보조 REST (`GET /api/sim/run`) | 로컬 + Docker 서브넷만 |
| 8864 / 8869 | fDTSimServer model / GUI WS | 로컬 + Docker 서브넷만 |
| 8865 / 8870 | AtomicModelManager model / GUI WS | 로컬 + Docker 서브넷만 |

> **2026-10-07 포트 정렬** : 2026-10-02 빌드 바이너리는 `poc_manager` = **8082**,
> fDTSimServer 보조 REST = **8084** 를 쓴다(`poc_manager/README.md`, `masterAgent.h`).
> 그런데 nginx·urlacl·방화벽·점검 스크립트는 이전 구성(fDTSimServer 8082 / poc_manager 8083)
> 그대로여서 `/GetWeight`·`/api/tci/...` 는 502, `/api/sim/run` 은 404 가 나는 상태였다.
> `default.conf`, `api_locations.conf`, `01_windows_prepare.ps1`, `02_start_all.ps1`,
> `03_health_check.ps1` 을 바이너리 기준으로 맞췄다.

---

## 2. 배포 절차

### 2-0. 사전 준비 (서버에서 1회)

1. Docker Desktop 설치 및 실행 (WSL2 백엔드 권장)
2. 프로젝트 전체를 서버로 복사
   - `fdtfw_240516/OSFW/HyMS_eins/` 전체
   - **`db/` 폴더를 함께 복사하면 기존 DB 데이터가 그대로 유지된다.**
     새 DB 로 시작하려면 `db/` 를 비운 상태로 복사한다.
3. `docker_setup/.env` 값 확인 (DB 패스워드 등)

### 2-1. Windows 준비 (관리자 PowerShell, 1회)

```powershell
cd <프로젝트>\fdtfw_240516\OSFW\HyMS_eins\deploy
powershell -ExecutionPolicy Bypass -File .\01_windows_prepare.ps1
```

- `http://+:8082/`, `http://+:8084/` URL 예약 (REST API 와일드카드 바인딩용)
- 방화벽 규칙 등록 (80/443 공개, 엔진 포트는 로컬 전용)

### 2-2. HTTPS 인증서

> **필수 단계가 아니다.** 인증서가 없으면 nginx 컨테이너가 기동할 때 자체 서명
> 인증서를 직접 만든다(`docker_setup/docker-compose.yaml` 의 `web.command`).
> 즉 `docker-compose up -d` 만으로도 HTTPS 가 뜬다.
> 아래 스크립트는 미리 만들어 두고 싶을 때만 쓴다.

```powershell
powershell -ExecutionPolicy Bypass -File .\00_generate_cert.ps1
```

- `web_conf/certs/server.crt`, `server.key` 생성 (자체 서명, IP SAN 포함, 10년)
- **공인 인증서가 있으면** 이 스크립트 대신 위 두 파일을 PEM 형식으로 덮어쓴다.
  - `server.crt` = 서버 인증서 + 중간 체인
  - `server.key` = 개인키 (암호 없음)

> 자체 서명 인증서는 브라우저 경고가 뜬다. `https://simulation.fedit.or.kr/simulation/`
> 에서 **한 번 예외를 승인**해야 `wss://` WebSocket 도 연결된다.

### 2-3. 시뮬레이션 엔진 재빌드 (C++ 소스를 고쳤을 때만)

> 현재 `sim_engine\` 의 바이너리(2026-10-02 빌드)는 아래 변경과 포트 분리
> (poc_manager 8082 / fDTSimServer REST 8084)가 모두 반영돼 있어 재빌드가 필요 없다.
> 아래는 이력 참고용이다.

REST API 바인딩 주소 등을 고치기 위해 아래 C++ 파일이 변경되었다.

- `fDTSim/fDTSimServer/masterAgent.cpp` / `masterAgent.h` — REST API 와일드카드 바인딩
- `fDTSim/fDTSimServer/fDTSimServer.cpp` — 종료 처리
- `fDTSim/atomic_model_manager/atomic_manager.h` / `atomic_manager.cpp` — `db_uri` 초기화 및 예외 보호
- `fDTSim/poc_manager/poc_server.cpp` / `poc_server.h` — 와일드카드 바인딩, `poc_manager.json` 으로 포트 지정
  (2026-10-02 빌드부터 poc_manager 8082, fDTSimServer 보조 REST 8084)

**Visual Studio 2016 / x64 / Release** 로 `fDTSim.sln` 을 재빌드한 뒤
`fDTSim/deploy_to_sim_engine.ps1` 을 실행해 `sim_engine/` 에 배포한다.

```powershell
cd <프로젝트>\fDTSim
powershell -ExecutionPolicy Bypass -File .\deploy_to_sim_engine.ps1
```

> 위 배포 스크립트는 `x64\Release` 의 모든 exe/dll 을 복사하므로
> 재빌드 후 실행하면 `poc_manager.exe` 도 함께 배포된다.
> 포트를 바꿔 재빌드했다면 `web_conf/default.conf` 의 upstream, `01_windows_prepare.ps1`,
> `03_health_check.ps1` 도 함께 바꾼다 (`build_package.ps1` 이 poc 포트 불일치를 검사한다).
>
> `01b_restapi_portproxy_fallback.ps1` 은 REST 를 루프백(localhost)에만 바인딩하던
> 구 바이너리용 임시 우회책이다. 현재 바이너리에는 필요 없어 배포 패키지에서 제외한다.

### 2-4. 기동

```powershell
powershell -ExecutionPolicy Bypass -File .\02_start_all.ps1
```

> **[중요] 기존에 실행 중인 컨테이너가 있으면 `docker restart nginx` 를 쓰지 말 것.**
> 이번 변경으로 마운트 볼륨이 늘어났다(`api_locations.conf`, `certs/`).
> 볼륨은 컨테이너 생성 시점에 고정되므로, 구 컨테이너를 그냥 재시작하면
> `open() "/etc/nginx/api_locations.conf" failed` 로 기동에 실패한다.
> 반드시 **`docker compose up -d`(재생성)** 로 올려야 한다 —
> `02_start_all.ps1` 이 이 방식으로 동작한다.
>
> 80/443 을 이미 다른 서비스(IIS, traefik, k8s 등)가 점유하고 있으면
> `docker_setup/.env` 의 `HTTP_PORT` / `HTTPS_PORT` 로 바꿀 수 있다.

1. `docker compose up -d` (nginx / node / mariadb) — 빌드 단계 없음
2. `atomic_model_manager.exe` 기동 → 2초 대기
3. `fDTSimServer.exe` 기동 → 3초 대기
4. `poc_manager.exe` 기동

세 개의 콘솔 창이 열린다. 아래 메시지가 출력되면 정상이다.

- fDTSimServer : `REST API listening on http://+:8084  (GET /api/sim/run)`
- poc_manager  : `POC REST API listening on http://+:8082/`

### 2-5. 확인

```powershell
powershell -ExecutionPolicy Bypass -File .\03_health_check.ps1
```

### 2-6. 종료

```powershell
powershell -ExecutionPolicy Bypass -File .\99_stop_all.ps1
```

---

## 3. 외부 시스템 연동

### 3-1. 시뮬레이션 실행 (fDTSimServer, 8084)

```
GET https://simulation.fedit.or.kr/api/sim/run?id=<웹ID>&projectname=<프로젝트명>&end_t=<초>
GET https://simulation.fedit.or.kr/simulation/api/sim/run?id=...&projectname=...&end_t=...
```

- 두 경로 모두 `host.docker.internal:8084` (fDTSimServer REST) 로 프록시된다.
- `ENV_DISCRETE_SIMULATOR_URL=https://simulation.fedit.or.kr` 로 설정된 외부 시스템은
  평문 HTTP 로 호출해도 동작한다 (80 포트에서 API 는 리다이렉트하지 않음).
- 호출 전에 웹 UI 에서 해당 프로젝트를 **Push** 해 모델이 로드되어 있어야 한다.
  (UI 의 `외부연동` 버튼 → `ExternalPanel` 에서 서버/모델 로드 상태 확인)

### 3-2. POC RestAPI (poc_manager, 8082)

```
POST https://simulation.fedit.or.kr/api/simulations/push     (Push JSON)  -> request_id
POST https://simulation.fedit.or.kr/api/simulations/run      (Run JSON + request_id)
GET  https://simulation.fedit.or.kr/api/simulations/<request_id>
GET  https://simulation.fedit.or.kr/api/health
GET  https://simulation.fedit.or.kr/api/tci/sim/weight?user_id=<id>&W1=&W2=&W3=&W4=
GET  https://simulation.fedit.or.kr/GetWeight
POST https://simulation.fedit.or.kr/SendComfortIndex        (JSON body)
```

- `/simulation` 프리픽스를 붙인 형태도 동일하게 동작한다.
  예) `https://simulation.fedit.or.kr/simulation/GetWeight`
- 네임스페이스를 정리하고 싶으면 `/poc/<경로>` 별칭을 쓸 수 있다.
  예) `https://simulation.fedit.or.kr/poc/GetWeight` → `8082/GetWeight`
- `/api/sim/...` 만 fDTSimServer(8084) 로 가고, 그 외 `/api/...` 는 모두 poc_manager(8082) 로 간다.
  (`/api/sim/` 은 끝 슬래시까지 매칭하므로 `/api/simulations/...` 와 겹치지 않는다)
- 상세 API : `fDTSim/poc_manager/README.md`

---

## 4. 수동 기동 (스크립트를 쓰지 않는 경우)

```powershell
# Docker
cd <프로젝트>\fdtfw_240516\OSFW\HyMS_eins\docker_setup
docker compose up -d --build

# 엔진 (반드시 sim_engine 을 작업 디렉터리로, 순서 중요)
cd ..\sim_engine
Start-Process .\atomic_model_manager.exe -WorkingDirectory (Get-Location)
Start-Process .\fDTSimServer.exe        -WorkingDirectory (Get-Location)
Start-Process .\poc_manager.exe         -WorkingDirectory (Get-Location)
```

---

## 5. 문제 해결

| 증상 | 원인 / 조치 |
|------|-------------|
| 브라우저 인증서 경고 | 자체 서명 인증서. 예외 승인 또는 공인 인증서로 교체 |
| WebSocket 이 연결 안 됨 (`wss` 실패) | 인증서 예외를 **먼저** 승인해야 wss 핸드셰이크가 통과한다 |
| `/api/sim/run` 이 502 | fDTSimServer REST(8084) 미바인딩 → 콘솔의 `REST API listening` 로그, `01_windows_prepare.ps1`(urlacl 8084) 확인 |
| `/api/simulations`, `/GetWeight`, `/api/tci/...` 가 502 | `poc_manager.exe` 미실행 또는 `poc_manager.json` 의 `port` 가 8082 가 아님 |
| `/api/sim/run` 이 JSON 본문의 404 | poc_manager 가 받은 것 = nginx 가 구 설정이다. `web_conf` 갱신 후 `docker exec nginx nginx -s reload` |
| `poc_manager` 콘솔에 `bind failed` | 8082 가 이미 사용 중이거나 urlacl 미등록 → `01_windows_prepare.ps1` 실행 |
| Python 모델이 `ModuleNotFoundError` | 패키지가 3.10 이 아닌 다른 Python 에 설치됨 → `py -3.10 -m pip install -r sim_engine\requirements.txt` 또는 `setup.bat` 재실행 |
| `/simulation/sim` 이 502 | `fDTSimServer.exe` 미실행, 또는 방화벽에서 Docker 서브넷 차단 |
| `/simulation/model` 이 502 | `atomic_model_manager.exe` 미실행 |
| `get_project_list` 가 `result:0` | MariaDB 미기동 또는 `.env` 의 DB 패스워드 불일치. `docker logs mariadb` 확인 |
| Nginx 가 기동 실패 | `web_conf/certs/server.crt|key` 누락. `docker logs nginx` 확인 |
| `api_locations.conf ... No such file` | 구 컨테이너를 `docker restart` 한 경우. `docker compose up -d` 로 재생성 |
| `bind: address already in use` (80/443) | 다른 서비스가 점유. `.env` 의 `HTTP_PORT`/`HTTPS_PORT` 변경 또는 해당 서비스 중지 |
| 443 을 `vmware-hostd` 가 점유 | VMware Workstation Server. setup 7단계가 확인 후 서비스 중지 + 자동 시작 해제(로컬 VM 실행에는 영향 없음). 수동 : `Set-Service VMwareHostd -StartupType Disabled; Stop-Service VMwareHostd -Force` — 중지만 하면 다시 켜진다 |
| `bind: An attempt was made to access a socket in a way forbidden by its access permissions` (쓰는 프로세스 없음) | Hyper-V/WSL2(WinNAT)가 포트 대역을 예약한 상태. 원인은 TCP 동적 포트 범위가 1024 부터로 바뀐 PC (`netsh int ipv4 show dynamicport tcp`). setup 7단계가 범위를 49152-65535 로 되돌리고 WinNAT 재시작(필요 시 재부팅 후 자동 재개)으로 자동 정리한다 |
| 모델 저장 시 413 오류 | Nginx `client_max_body_size 50m` 이 적용됐는지 확인 (`web_conf/default.conf`) |
| 재부팅 후 전부 502 | `logs\autostart.log` 확인. 자동 기동을 껐다면 `start.bat` (Docker 가 꺼져 있으면 띄우고 기다린다) |
| setup 이 재부팅 후 이어지지 않음 | 설치를 시작한 **같은 계정**으로 로그인해야 한다. 아니면 `setup.bat` 을 다시 실행 |
| `CPU 가상화가 꺼져 있어` 로 중단 | BIOS/UEFI 에서 VT-x / AMD-V 활성화. VM 이면 호스트에서 중첩 가상화 활성화 |

로그 확인

```powershell
docker logs nginx
docker logs node
docker logs mariadb
docker exec nginx cat /var/log/nginx/host.error.log
```

---

## 6. 변경된 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `web_conf/default.conf` | HTTPS(443) 추가, `/simulation` 라우트, upstream 정리, 80→443 리다이렉트 |
| `web_conf/api_locations.conf` | (신규) API/WS/REST 프록시 규칙 — 80·443 공통 include, POC REST(8083) 포함 |
| `docker_setup/docker-compose.yaml` | 443 포트·인증서 마운트, node/DB 루프백 바인딩, `extra_hosts` 제거 / (2026-09-21) `mariadb:11.4` 고정 + `MARIADB_AUTO_UPGRADE`, 인증서 자동 생성, app 빌드 제거, DB healthcheck 교체 |
| `docker_setup/initdb/01_model_designer.sql` | (2026-09-21 신규) 빈 DB 일 때 스키마·저장 프로시저·기본 데이터 자동 생성 |
| `docker_setup/docker-compose.linux.yaml` | (2026-09-21 신규) Linux Docker 엔진용 `extra_hosts` 오버라이드 |
| `app_root/node_modules/` | (2026-09-21 신규 포함) npm 접속 없이 기동하기 위한 번들 의존성 |
| `docker_setup/.env`, `.env.example` | 서버 주소·포트·`ENV_DISCRETE_SIMULATOR_URL` 추가 |
| `web_root/coupling_designer_main2.js` | API 주소를 현재 origin + 경로 프리픽스로 계산 (mixed-content 제거) |
| `web_root/scripts2/sim_connector.js` | WS 주소를 현재 host + 경로 프리픽스로 계산 |
| `web_root/lib/WSClientLib.js` | https 페이지에서 `wss://` 자동 선택 |
| `web_root/config.js` | 배포 서버 기준으로 갱신 (현재 index.html 미로드) |
| `web_root/50x.html` | (신규) 502/504 안내 페이지 — 없어서 오류가 404 로 뒤바뀌던 문제 해결 |
| `web_conf/certs/` | (신규) 인증서 배치 폴더 |
| `deploy/*.ps1`, `deploy/README.md` | (신규) 배포·기동·점검 스크립트 |
| `fDTSim/fDTSimServer/masterAgent.cpp/.h` | REST API 와일드카드 바인딩 + 논블로킹 기동 + `RestAPI_Stop()` |
| `fDTSim/fDTSimServer/fDTSimServer.cpp` | 종료 시 `RestAPI_Stop()` 호출 |
| `fDTSim/atomic_model_manager/atomic_manager.cpp/.h` | `db_uri` 를 `http://localhost` 로 초기화(미초기화 상태였음), REST 호출 예외 보호 |
| `fDTSim/poc_manager/poc_server.cpp/.h` | 리슨 포트 8082 → 8083 분리, 와일드카드 바인딩, `listen_port` 인자 실제 사용 |
| `fDTSim/deploy_to_sim_engine.ps1` | UTF-8 BOM 추가 (PowerShell 에서 한글 출력 깨짐 해결) |
| `setup.bat`, `start.bat`, `stop.bat`, `status.bat`, `README.txt` | (2026-10-07 신규) 패키지 루트의 사용자용 실행 파일과 설치 안내 |
| `deploy/setup.ps1` | (2026-10-07 신규) 통합 설치 : .env 생성 → VC++ → Python 3.10 → pip → Docker → urlacl·방화벽 → 기동 → 점검 |
| `deploy/build_package.ps1` | (2026-10-07 신규) 배포 zip 생성 (온라인 / `-Offline`), 비밀 파일 제외, 포트 불일치 검사 |
| `sim_engine/requirements.txt` | (2026-10-07 신규) Python 3.10 모델 의존 패키지 (버전 고정) |
| `web_conf/default.conf`, `api_locations.conf` | (2026-10-07) poc_rest 8083→8082, sim_rest 8082→8084, `/api/sim/` 만 fDTSimServer 로 분리 |
| `deploy/01_windows_prepare.ps1` | (2026-10-07) urlacl·방화벽 8083→8084, 웹 포트는 `.env` 의 HTTP/HTTPS_PORT 사용 |
| `deploy/02_start_all.ps1`, `03_health_check.ps1` | (2026-10-07) 포트 정렬, 주소를 `.env` 에서 읽음, 점검 대상 기본 localhost |
| `deploy/99_stop_all.ps1` | (2026-10-07) `-Force`, `-EnginesOnly` 옵션, 종료 실패 표시 |
| `deploy/common.ps1` | (2026-10-07 신규) Docker 엔진 대기·Docker Desktop 실행·compose 호출 공용 함수 |
| `deploy/setup.ps1` (2차) | (2026-10-07) 질문 1회, Docker Desktop·WSL 2 무인 설치, 재부팅 후 자동 재개, Linux 모드 자동 전환, `host.docker.internal` 확인, 로그인 시 자동 기동 등록, Python 런처 충돌 회피 |
| `deploy/02_start_all.ps1` (2차) | (2026-10-07) Docker 엔진 대기, compose 를 `docker_setup` 에서 `-f` 없이 실행(`COMPOSE_FILE` 적용), `-AutoStart` 로그 |

원본은 같은 폴더에 `*.bak_<타임스탬프>` 로 백업되어 있다.
