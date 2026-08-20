# 디지털 연합트윈 서비스 플랫폼 — 설치

DTSP 저장소의 설치 모듈이다. 플랫폼 소개와 전체 구성은 [../README.md](../README.md),
서비스 소스코드는 `../source/` 에 있다.

서버 한 대에 플랫폼 전체를 올린다. 백엔드(DB·Kafka·NDXPro)와 프론트(화면·BFF)가 분리돼 있고,
환경변수는 두 쪽이 함께 쓰는 **최상위 `.env` 한 파일**만 사용한다.

```
q연합트윈/
├── .env.example              복사해서 .env 로 사용. 두 쪽이 같이 참조한다
├── docs/                     상세 문서
│
├── image-bundle/             이미지 묶음 제작·갱신 (사내 전용, 설치와 무관)
│
├── fdt-service-backend/      DB · Kafka · NDXPro 코어 · 파일 서비스 · FDT 뷰어
│   ├── install/              0-init  1-db  2-kafka  3-ndxpro  9-clean
│   ├── db/                   compose.yml + init/ (계정·스키마 생성)
│   ├── kafka/                compose.yml + build/ (이미지 Dockerfile)
│   ├── ndxpro/               compose.yml, compose-file.yml, compose-fdt.yml
│   └── scripts/              bootstrap · health · check-images · images-load · backup · remake_container
│
└── fdt-service-frontend/     연합트윈 화면(fe) + 자체 서버(BFF)
    ├── install/              1-front  9-clean
    ├── front/                compose.yml 외
    ├── nginx/                리버스 프록시 (선택)
    └── scripts/
```

프론트는 자체 BFF 서버를 갖고 있어 백엔드와 별도로 배포·재기동할 수 있다.
단, BFF 가 백엔드의 PostgreSQL(`union_twin` DB)을 쓰므로 **백엔드를 먼저 올려야 한다.**

**설치 서버는 이미지 레지스트리에 접속하지 않는다.** 이미지는 `install/images/` 의 tar.gz 에 이미 들어 있고, `0-init.sh` 가 그것을 적재한다.

---

## 설치

```bash
cp .env.example .env
vi .env                       # 주소만 고친다 (아래 참고)

cd fdt-service-backend
./install/0-init.sh           # 네트워크·디렉터리 생성 + 이미지 준비
./install/1-db.sh             # PostgreSQL / MongoDB / Redis
./install/2-kafka.sh          # Zookeeper / Kafka   (최초 1회 이미지 빌드 5~10분)
./install/3-ndxpro.sh         # NDXPro 코어 + 파일 서비스 + FDT 뷰어

cd ../fdt-service-frontend
./install/1-front.sh          # 화면 + BFF   (프록시 없으면 --expose)

cd ../fdt-service-backend
./scripts/health.sh           # 설치 확인
```

접속: `.env` 의 `PUBLIC_URL` + `/signin` → `admin@e8ight.co.kr` / `ndxpro123!`

---

## 고쳐야 하는 부분

`.env` 는 두 구역으로 나뉜다. **[1] 주소만 고치고 [2] 는 그대로 둔다.**
계정·비밀번호·토큰·포트는 기존 운영 환경과 같은 값이 이미 채워져 있다.

| 변수 | 무엇 | 예시 |
|---|---|---|
| `HOST` | 플랫폼이 설치되는 서버 IP | `220.124.222.90` |
| `PUBLIC_URL` | 브라우저로 접속할 주소 | `http://220.124.222.90` 또는 `https://service.fedit.or.kr` |
| `REPO` | 데이터·로그 저장 경로 | `/data/ndxpro` |
| `LOGSTASH_URL` `ZIPKIN_URL`<br>`DTMETA_API_URL` `FDT_SYNC_API_URL` | 외부 연동 주소 | 안 쓰면 비워 둔다 |

### 어떻게 고치는가

서버 IP 가 `10.0.1.50` 이고 데이터를 `/mnt/data` 에 둔다면 세 줄만 바꾼다.

```diff
- HOST=220.124.222.90
+ HOST=10.0.1.50

- PUBLIC_URL=http://220.124.222.90
+ PUBLIC_URL=http://10.0.1.50

- REPO=/data/ndxpro
+ REPO=/mnt/data/ndxpro
```

`HOST` 한 줄이면 아래 주소가 전부 따라 바뀐다. 따로 고칠 필요 없다.

| 자동으로 만들어지는 값 | 결과 |
|---|---|
| 게이트웨이 (`NDXPRO_API_URL`) | `http://10.0.1.50:54002` |
| 뷰어 (`VIEWER_URL`) | `http://10.0.1.50:50038` |
| 컨텍스트 (`FDT_CONTEXT`) | `http://10.0.1.50:53005/fdt-twin-context-v1.0.1.jsonld` |
| Kafka 외부 접속 주소 | `10.0.1.50:19092` |

### 그 밖에 준비할 것

**이미지 묶음** — `install/images/union-twin-service-images.tar.gz` 가 있는지만 확인한다. 이미 들어 있다.

**NGSI-LD @context** — 플랫폼에서 새로 만들어 쓰는 경우 미리 준비할 것이 없다.
기존 컨텍스트 파일을 그대로 쓴다면 `fdt-service-backend/ndxpro/ngsi-context/` 에 넣어 두면
`0-init.sh` 가 `${REPO}/ngsi-context/` 로 복사하고 httpd 컨테이너가 서빙한다.

---

## 단계별 스크립트

| 스크립트 | 올리는 것 | 걸리는 시간 |
|---|---|---|
| `backend/install/0-init.sh` | 포트 점검, 네트워크·디렉터리 생성, 이미지 묶음 적재 | 3~10분 |
| `backend/install/1-db.sh` | PostgreSQL · MongoDB · Redis | 30초 |
| `backend/install/2-kafka.sh` | Zookeeper · Kafka · Kafka UI | **최초 1회 5~10분** (이미지 빌드) |
| `backend/install/3-ndxpro.sh` | NDXPro 코어 9개 + 파일 서비스 + FDT 뷰어 | 2분 |
| `frontend/install/1-front.sh` | 화면 + BFF | 30초 |

각 스크립트는 앞 단계가 뜰 때까지 기다린 뒤 상태와 다음 단계를 출력한다. 여러 번 실행해도 안전하다.

**프론트 옵션**

```bash
./install/1-front.sh --expose   # 프록시 없이 화면 포트를 호스트에 직접 공개
./install/1-front.sh --nginx    # 리버스 프록시까지 함께 올린다
```

### 이미지

이미지는 `install/images/` 에 **함께 들어 있다.**
설치할 때 따로 받거나 만들 필요가 없다. `0-init.sh` 가 적재한다.

```
install/images/
├── union-twin-service-images.tar.gz             사내 이미지 13개 (약 1.9 GB, linux/amd64)
├── union-twin-service-images.images.txt         이미지 목록
└── union-twin-service-images.manifest.txt       생성 시각·플랫폼·각 이미지 ID
```

묶음의 구성은 compose 파일이 참조하는 이미지 그대로다.

**묶음에는 사내 레지스트리 이미지 13개만 들어 있다.** 나머지는 설치 서버가 스스로 준비한다.

| 구분 | 개수 | 어떻게 |
|---|---|---|
| NDXPro 코어·파일 서비스·FDT 뷰어 | 11 | 묶음에 포함 |
| 연합트윈 화면·BFF | 2 | 묶음에 포함 |
| PostgreSQL·MongoDB·Redis·httpd·nginx·Kafka UI | 6 | `0-init.sh` 가 Docker Hub 에서 받는다 |
| Kafka·Zookeeper | 2 | `2-kafka.sh` 가 Dockerfile 로 빌드한다 (5~10분) |

**따라서 설치 서버에 인터넷이 필요하다.** 사내 레지스트리 접속은 필요 없다.

공개 이미지는 `.env` 의 `IMG_*` 에 **버전이 고정돼 있다.** `latest` 로 두면 설치 시점마다
다른 버전이 깔려 재현이 안 되고, DB 는 데이터 호환 문제로 이어진다.

```
postgres:14.1   mongo:8.2.12   redis:6.2
httpd:2.4-alpine   nginx:1.31.4   provectuslabs/kafka-ui:v0.7.2
```

인터넷이 전혀 없는 서버라면 전부 포함해 묶는다.

```bash
cd image-bundle
./fetch-from-registry.sh     # 사내 이미지
./pack.sh                    # 옵션 없이 → 공개 이미지·Kafka 까지 전부 (약 3.1 GB)
```

설치 서버는 이미지 레지스트리에 접속하지 않는다. `docker login` 도 `insecure-registries` 설정도 필요 없다.

#### 직접 풀어야 할 때

평소에는 `0-init.sh` 가 알아서 적재하므로 따로 실행할 필요가 없다. 아래 경우에만 쓴다.

```bash
cd fdt-service-backend

# 1) 갱신본(delta)을 받았을 때 — 파일명이 기본값과 다르므로 직접 지정한다
./scripts/images-load.sh ../images/union-twin-service-images-fe-20260820.tar.gz

# 2) 이미지가 지워졌거나 일부만 없을 때 — 다시 적재한다
./scripts/images-load.sh                      # 기본 경로 (../images/...)

# 3) 무엇이 없는지, 아키텍처가 맞는지 확인만 할 때
./scripts/check-images.sh
```

`images-load.sh` 는 적재 후 호스트 아키텍처와 각 이미지 아키텍처를 나란히 출력한다.
분할 파일(`.tar.gz.part-aa`, `-ab` …)로 받았다면 조각을 자동으로 합쳐서 읽는다.

**저장소를 클론할 때** 묶음이 Git LFS 로 관리되므로 `git lfs install` 이 먼저 돼 있어야 한다.
LFS 없이 클론하면 tar.gz 대신 몇 줄짜리 포인터 파일이 받아져 `0-init.sh` 가 실패한다.

```bash
git lfs install
git clone <저장소>
ls -lh images/union-twin-service-images.tar.gz   # 1.9G 면 정상, 100바이트대면 LFS 미설치
```

묶음을 새로 만들거나 갱신하는 일은 **사내에서** `image-bundle/` 로 한다. 설치 담당자가 할 일은 아니다.
레지스트리에서 받아오거나(`fetch-from-registry.sh`), 옆의 `../source/` 소스코드에서 직접 빌드할 수 있다
(`build-from-source.sh` — Dockerfile / Jib / Docker Hub 를 자동 판별).
→ [image-bundle/README.md](image-bundle/README.md)

### Kafka 이미지

Kafka·Zookeeper 는 공개 이미지가 아니라 `kafka/build/` 의 Dockerfile 로 직접 빌드한다.
**이미지 묶음에 포함돼 있으므로 폐쇄망에서는 빌드하지 않는다.** 이미지가 없을 때만 빌드하며,
Ubuntu 이미지와 Kafka 2.7 / Zookeeper 3.7 tarball 을 받아오므로 인터넷이 필요하고 5~10분 걸린다.

```bash
./install/2-kafka.sh --push      # 빌드 후 레지스트리에 업로드
./install/2-kafka.sh --rebuild   # 이미지가 있어도 다시 빌드
```

`--push` 하면 다른 서버에서는 빌드 없이 쓸 수 있다. `.env` 를 이렇게 바꾼다.

```
IMG_KAFKA=172.16.28.217:12000/pipeline-kafka:v1
IMG_ZOOKEEPER=172.16.28.217:12000/pipeline-zookeeper:v1
```

---

## 이미지 버전

`.env` 에 운영 서버와 동일한 버전이 명시돼 있다. 버전을 올릴 때만 고친다.

| 이미지 | 태그 | | 이미지 | 태그 |
|---|---|---|---|---|
| `ndxpro-eurekaserver` | `v1.1` | | `ndxpro-file-service` | `v1.0` |
| `ndxpro-gatewayserver` | `v1.1` | | `fdt-service` | `v1.1` |
| `ndxpro-dataingest` | `v1.1` | | `union-twin-fe` | `latest` |
| `ndxpro-translatorbuilder` | `v1.1.1` | | `union-twin-be` | `latest` |
| `ndxpro-ngsi-translator` | `v1.1.1` | | `postgres` | `14.1` |
| `ndxpro-core-databroker` | `v1.1.2` | | `mongo` | `8.2.12` |
| `ndxpro-dataservice` | `v1.1` | | `redis` | `6.2` |
| `ndxpro-datamanager` | `v1.1` | | `httpd` | `2.4-alpine` |
| `ndxpro-authorization` | `v1.1` | | `nginx` | `1.31.4` |

`union-twin-fe` 는 현장별 태그가 따로 있다 — 제주 `jeju`, 삼성 `samsung`.
공개 이미지는 전부 버전을 고정했다. `latest` 로 두면 설치 시점마다 다른 버전이 깔려 재현이 안 되고, DB 는 데이터 호환 문제가 된다.

---

## 확인과 운영

```bash
cd fdt-service-backend
./scripts/health.sh                       # 컨테이너 상태 + 엔드포인트 + Eureka 등록 목록
./scripts/check-images.sh                 # 필요한 이미지가 다 있는지 + 아키텍처 확인
docker logs -f gateway                    # 특정 서비스 로그

# 서비스 하나만 최신 이미지로 교체
./scripts/remake_container.sh data-broker-1 ndxpro/compose.yml
cd ../fdt-service-frontend
./scripts/remake_container.sh union-twin-fe front/compose.yml
```

버전 올리기: `.env` 의 해당 `TAG_*` 를 고치고 그 단계 스크립트를 다시 실행한다.

`NDXPRO_TOKEN` 은 만료 시각이 있는 JWT 다. 만료되면 data-auth(`:54009`)에서 재발급받아 `.env` 를 바꾸고 3단계와 프론트를 다시 올린다.

---

## 정리 (전부 내리기)

```bash
cd fdt-service-frontend  && ./install/9-clean.sh          # 프론트 먼저
cd ../fdt-service-backend && ./install/9-clean.sh --data   # 백엔드 + 데이터 전체
```

| 옵션 | 지우는 것 |
|---|---|
| 없음 | 컨테이너만 (데이터 보존) |
| `--data` | `${REPO}` 의 DB·로그·볼륨 + 도커 네트워크 |
| `--all` | `--data` + 내려받은 이미지 |

`REPO` 가 `/` 나 `/Users` 같은 위험한 경로면 삭제를 거부한다.

---

## Windows 서버에 설치할 때

이미지는 전부 `linux/amd64` 다. **컨테이너 안은 리눅스로 고정**이고 호스트 OS 는 상관없지만,
설치 스크립트가 bash 라서 Windows 에서는 **WSL2 안에서** 실행해야 한다.

```powershell
# 1) WSL2 + Ubuntu 설치 (관리자 PowerShell)
wsl --install -d Ubuntu-22.04
```

```bash
# 2) WSL 안에서 Docker Engine 설치
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER      # 로그아웃 후 다시 접속

# 3) 저장소는 WSL 파일시스템 안에 둔다
git config --global core.autocrlf input   # 줄바꿈이 CRLF 로 바뀌는 것을 막는다
git lfs install
git clone <저장소> ~/DTSP_연합
cd ~/DTSP_연합/install
```

| 항목 | 주의 |
|---|---|
| 저장소 위치 | `/home/...` 안에 둔다. `/mnt/c/...` 는 I/O 가 느리고 파일 권한이 꼬인다 |
| `REPO` 경로 | `.env` 의 `REPO` 도 WSL 내부 경로(`/data/ndxpro`)로 둔다 |
| 줄바꿈 | `.gitattributes` 가 `*.sh` 를 LF 로 고정한다. 그래도 깨지면 `dos2unix` |
| Docker Desktop | 쓴다면 **Linux containers 모드**여야 한다. Windows containers 모드로는 안 돈다 |
| 외부 접속 | WSL2 는 기본적으로 localhost 만 열린다. 다른 PC 에서 접속하려면 아래 포트 포워딩 필요 |

**외부에서 접속하게 하려면** — WSL2 의 IP 는 재부팅마다 바뀌므로 포워딩을 걸어 준다.

```powershell
# 관리자 PowerShell. 50028(화면), 50038(뷰어), 54002(게이트웨이) 예시
$ip = (wsl hostname -I).Split(" ")[0]
foreach ($p in 50028,50038,54002) {
  netsh interface portproxy delete v4tov4 listenport=$p listenaddress=0.0.0.0 2>$null
  netsh interface portproxy add    v4tov4 listenport=$p listenaddress=0.0.0.0 connectport=$p connectaddress=$ip
  New-NetFirewallRule -DisplayName "DTSP $p" -Direction Inbound -LocalPort $p -Protocol TCP -Action Allow
}
```

Windows 11 22H2 / Windows Server 2022 이상이면 `.wslconfig` 에
`networkingMode=mirrored` 를 넣어 포워딩 없이 쓸 수도 있다.

---

## 개발용 — 로컬 PC 에서 화면만 실행

NDXPro 백엔드는 서버 것을 쓰고 화면과 전용 Postgres 만 로컬에 띄운다.

```bash
cd fdt-service-frontend
docker compose --env-file ../.env -f front/compose-local.yml up -d   # http://localhost:50028
docker compose --env-file ../.env -f front/compose-local.yml down -v
```

---

## 문서

| 문서 | 내용 |
|---|---|
| [docs/reference.md](docs/reference.md) | 포트 목록, 트러블슈팅, 폐쇄망 설치, 기존 구조에서 바뀐 점 |
| `docs/디지털연합트윈_설치_해설서.docx` | 배포용 Word 문서 |
| `docs/make-docx.py` | 위 Word 문서 생성 스크립트 |

---

## 주의

`.env` 에는 실제 비밀번호와 서비스 토큰이 들어간다. `.gitignore` 에 등록돼 있다.
`.env.example` 에도 운영과 동일한 기본값이 담겨 있으므로, 저장소를 외부에 공개한다면 토큰을 지우고 배포해야 한다.
