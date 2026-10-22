# 참고 문서

설치 절차 요약은 [../README.md](../README.md) 를 먼저 본다. 이 문서는 포트 목록, 트러블슈팅, 폐쇄망 설치 등 상세 내용이다.

---

## 1. 개요

### 1.1 구성

플랫폼은 네 묶음으로 나뉜다. 아래 순서대로 올려야 한다. 앞 단계가 준비되지 않으면 뒷 단계가 기동 직후 재시작을 반복한다.

| 순서 | 묶음 | 구성 요소 | compose 파일 |
|---|---|---|---|
| 1 | 데이터 저장소 | PostgreSQL, MongoDB, Redis | `fdt-service-backend/db/compose.yml` |
| 2 | 메시지 파이프라인 | Zookeeper, Kafka, Kafka UI | `fdt-service-backend/kafka/compose.yml` |
| 3 | NDXPro 코어 | Eureka, Gateway, Data Ingest / Translator / Broker / Service / Manager / Auth, @context | `fdt-service-backend/ndxpro/compose.yml` |
| 4 | 파일 서비스 | File Service | `fdt-service-backend/ndxpro/compose-file.yml` |
| 5 | FDT 뷰어 | FDT Service | `fdt-service-backend/ndxpro/compose-fdt.yml` |
| 6 | 연합트윈 화면 | union-twin-fe(웹), union-twin-be(BFF) | `fdt-service-frontend/front/compose.yml` |
| 7 | (선택) 리버스 프록시 | nginx | `fdt-service-frontend/nginx/compose.yml` |

```
                 [브라우저]
                     │  https://service.fedit.or.kr
                 ┌───▼────┐
                 │ nginx  │  7
                 └───┬────┘
                     │ :50028
        ┌────────────▼────────────┐
        │ union-twin-fe ─▶ -be    │  6      ─▶ PostgreSQL(union_twin)
        └───────┬─────────┬───────┘
                │         └──────────────▶ [FDT 뷰어 :50038] 5
                │ :54002
        ┌───────▼──────────────────────────────────────┐
        │ Gateway ─ Eureka                              │ 3
        │   ├ Data Ingest ─▶ Kafka ─▶ NGSI Translator   │
        │   ├ Data Broker  ─▶ MongoDB / Redis           │
        │   ├ Data Manager ─▶ MongoDB                   │
        │   ├ Data Auth    ─▶ PostgreSQL                │
        │   └ File Service ─▶ PostgreSQL + 파일 볼륨     │ 4
        └──────────────────┬───────────────────────────┘
                    1,2 [PostgreSQL · MongoDB · Redis · Kafka]
```

### 1.2 디렉터리 구조

```
연합트윈/
├── .env.example            복사해서 .env 로 사용. 두 쪽이 같이 참조한다
├── docs/                   상세 문서 (이 문서, 설치 해설서 docx)
│
├── fdt-service-backend/
│   ├── install/            0-init  1-db  2-kafka  3-ndxpro  9-clean
│   ├── db/
│   │   ├── compose.yml     PostgreSQL · MongoDB · Redis
│   │   └── init/           최초 기동 시 계정·DB·스키마 생성
│   ├── kafka/
│   │   ├── compose.yml     Zookeeper · Kafka · Kafka UI
│   │   └── build/          이미지 빌드 소스 (Dockerfile)
│   ├── ndxpro/
│   │   ├── compose.yml     코어 9개
│   │   ├── compose-file.yml
│   │   ├── compose-fdt.yml
│   │   └── ngsi-context/   기존 @context 파일을 쓸 때만 (선택)
│   └── scripts/            bootstrap · health · check-images · images-load · backup · remake_container
│
└── fdt-service-frontend/
    ├── install/            1-front  9-clean
    ├── front/
    │   ├── compose.yml            화면(fe) + 자체 서버(BFF)
    │   ├── compose-expose.yml     프록시 없이 포트 공개
    │   ├── compose-local.yml      로컬 개발용
    │   ├── compose-watchtower.yml 자동 갱신 (기본 비활성)
    │   └── init-postgres/         로컬 개발용 DB 초기화
    ├── nginx/              리버스 프록시 compose + 설정
    └── scripts/
```

**핵심 원칙**: 환경변수는 최상위 `.env` **한 곳**에만 있다. 백엔드와 프론트가 같은 파일을 `--env-file ../.env` 로 참조한다. compose 파일에는 비밀번호·IP·토큰을 적지 않는다.

---

## 2. 사전 준비

### 2.1 서버 요구사항

| 항목 | 최소 | 권장 |
|---|---|---|
| CPU | 8 core | 16 core |
| 메모리 | 16 GB | 32 GB 이상 (전체 20개 컨테이너 실사용 약 9 GB) |
| 디스크 | 500 GB | 1 TB 이상, `${REPO}` 경로에 마운트 |
| OS | Ubuntu 20.04 / RHEL 8 이상 (x86_64). Windows 는 WSL2 필요 — 9.3 참고 | |
| Docker | Engine 20.10 + Compose v2 | 24.x |

```bash
docker --version          # 20.10 이상
docker compose version    # v2.x  ('docker-compose' 하이픈 버전 아님)
```

> Compose v1(`docker-compose`)에서는 이 문서의 `--env-file`, `name:`, `x-common` 앵커가 동작하지 않는다. 반드시 v2 를 쓴다.

### 2.2 방화벽 / 포트

외부에 열어야 하는 포트는 **웹(80/443)** 뿐이다. 나머지는 운영·점검용이므로 사내망에서만 접근 가능하게 제한하는 것을 권장한다.

| 포트 | 서비스 | 외부 공개 |
|---|---|---|
| 80 / 443 | nginx (연합트윈 화면) | ○ |
| 50038 | FDT 뷰어 | ○ (뷰어를 직접 임베드하는 경우) |
| 53005 | NGSI-LD @context 파일 | ○ (외부 시스템이 컨텍스트를 읽어야 하면) |
| 19092 | Kafka (외부 프로듀서용) | 데이터 송신처 IP 만 |
| 54002 | API Gateway | 사내망 |
| 54003/4/5/7/8/9, 54011 | 각 NDXPro 서비스 | 사내망 |
| 54020, 54021 | File Service, actuator | 사내망 |
| 55432 / 57017 / 56379 | PostgreSQL / MongoDB / Redis | **차단 권장** |
| 58761 / 59500 / 22181 | Eureka / Kafka UI / Zookeeper | 사내망 |
| 50028 | union-twin-fe | 비공개(nginx 뒤) |

포트를 바꿔야 하면 `.env` 의 `PORT_*` 만 수정한다. compose 파일은 건드리지 않는다.

### 2.3 이미지 준비

설치 서버는 이미지 레지스트리에 접속하지 않는다. 도커 데몬 설정(`daemon.json`)을 건드릴 일이
없다 — `insecure-registries` 도 `docker login` 도 필요 없다.

이미지 묶음은 **이미 `images/` 에 들어 있다.** 95 MB 조각 21개
(`union-twin-service-images.tar.gz.part-aa` ~ `.part-au`)로 나뉘어 있고,
`0-init.sh` 가 조각을 자동으로 합쳐서 적재한다. 직접 합칠 필요는 없다.

```bash
ls -1 images/union-twin-service-images.tar.gz.part-* | wc -l   # 21
cat  images/union-twin-service-images.tar.gz.part-* | wc -c    # 2076529707
```

묶음이 없거나 새로 만들어야 하는 경우에만 7장을 본다.

### 2.4 배포 파일 배치

묶음이 일반 Git 파일(95 MB 조각)로 올라가 있으므로 `git lfs` 는 필요하지 않다.

```bash
sudo mkdir -p /opt/union-twin && sudo chown "$USER" /opt/union-twin
git clone <배포 저장소> /opt/union-twin
cd /opt/union-twin
```

**클론 후 반드시 확인한다.**

```bash
ls -1 images/union-twin-service-images.tar.gz.part-* | wc -l
#  21  → 정상
#  그 외 → 클론이 덜 받아졌다. git fetch --all 후 git status 확인

cat images/union-twin-service-images.tar.gz.part-* | gzip -t && echo OK
#  OK  → 내용 정상 (합친 파일을 만들지 않으므로 추가 디스크가 들지 않는다)
```

### 2.5 NGSI-LD @context 파일 (선택)

플랫폼에서 컨텍스트를 새로 만들어 쓴다면 설치 전에 준비할 것이 없다. 이 절은 건너뛴다.

기존 컨텍스트 파일을 그대로 쓰는 경우에만, `fdt-service-backend/ndxpro/ngsi-context/` 에
`.jsonld` 파일을 넣어 둔다. `0-init.sh` 가 `${REPO}/ngsi-context/` 로 복사하고 httpd 컨테이너가
`http://${HOST}:53005/` 로 서빙하며, FDT 서비스가 `FDT_CONTEXT` 로 참조한다.

파일이 없으면 `health.sh` 의 `@context 파일` 항목이 404 로 나오는데, 컨텍스트를 나중에
등록할 계획이라면 정상이다.

---

## 3. 환경변수 설정

```bash
cp .env.example .env
vi .env
```

`.env` 는 두 부분으로 나뉜다. **[1] 주소** 만 고치고 **[2] 기본값** 은 그대로 둔다.

| 변수 | 설명 |
|---|---|
| `HOST` | 서버 IP. 게이트웨이(`NDXPRO_API_URL`), 뷰어(`VIEWER_URL`), 컨텍스트(`FDT_CONTEXT`), Kafka 외부 광고 주소가 모두 이 값에서 만들어진다 |
| `PUBLIC_URL` | 브라우저로 접속할 주소. 그대로 `CORS_ORIGIN` 이 되므로 프로토콜·포트까지 주소창과 일치해야 한다 |
| `REPO` | 데이터·로그 저장 경로 |
| `LOGSTASH_URL` `ZIPKIN_URL` `DTMETA_API_URL` `FDT_SYNC_API_URL` | 외부 연동 주소. 미사용 시 빈 값 |

[2] 의 계정·비밀번호·토큰은 기존 운영 환경과 같은 값이 들어 있다. 그대로 설치해 정상 동작을 확인한 뒤 필요하면 바꾼다.

비밀번호를 바꾼다면 `'` `@` `:` `/` 는 쓰지 않는다. MongoDB 접속 URI 와 초기화 SQL 파싱이 깨진다. 또한 `file-service` 는 원래 compose 에서 DB 계정을 받지 않았으므로 이미지에 박힌 계정을 쓸 가능성이 있다. 비밀번호 변경은 전체 정상 동작 확인 후에 한다.

```bash
docker compose config | less     # 변수 치환 결과 확인
```

## 4. 설치 절차

모든 명령은 각 폴더(`fdt-service-backend` / `fdt-service-frontend`) 안에서 실행한다.

### 4.0 초기화 — 백엔드

```bash
cd fdt-service-backend
./install/0-init.sh            # 이미지 묶음(tar.gz) 적재            [기본]
./install/0-init.sh --build    # 소스코드에서 직접 빌드
```

`.env` 확인 → 포트 충돌 점검 → 도커 네트워크 생성 → `${REPO}` 하위 디렉터리 생성 → @context 배치 →
이미지 준비 → 이미지 점검(존재·아키텍처)까지 한 번에 수행한다.

**이 서버는 레지스트리에 접속하지 않는다.** 묶음은 `.env` 의 `IMAGE_BUNDLE`(기본
`./images/union-twin-service-images.tar.gz`)이 가리킨다. 이 값은 **조각을 뺀 기준 경로**로,
실제 파일이 조각(`.part-aa` …)뿐이어도 그대로 두면 된다 — `0-init.sh` 가
`$IMAGE_BUNDLE` 와 `$IMAGE_BUNDLE.part-*` 둘 다 찾는다. 만드는 방법은 7장.

### 4.1 1단계 — 데이터 저장소

```bash
./install/1-db.sh
```

`db/init/postgres/01-init.sh` 와 `db/init/mongo/01-init.js` 는 **데이터 디렉터리가 비어 있을 때만** 실행된다. `${REPO}/docker-volumes/postgres-data` 가 이미 있으면 계정·DB 를 다시 만들지 않는다. `.env` 의 DB 비밀번호를 바꾸고 재설치하는 경우 8.4 를 확인한다.

생성 결과 확인:

```bash
docker exec -it postgres psql -U postgresadmin -c '\l'      # ndxpro, union_twin 두 DB
docker exec -it mongodb mongosh --quiet -u mongoadmin -p --eval 'db.getSiblingDB("ndxpro").getUsers()'
```

### 4.2 2단계 — Kafka

```bash
./install/2-kafka.sh
```

이미지가 없을 때만 `kafka/build/` 에서 빌드한다(최초 1회 5~10분, 인터넷 필요). 브로커가 뜬 뒤
`.env` 의 `KAFKA_TOPICS` 에 적힌 토픽을 만든다.

```bash
KAFKA_TOPICS="ngsild_topic observedAt_topic fdt_topic"
KAFKA_TOPIC_PARTITIONS=5
```

| 토픽 | 쓰는 쪽 |
|---|---|
| `fdt_topic` | agent 가 수집해 넣는 원본 토픽 |
| `ngsild_topic` | translator 가 변환해 넣고, 브로커가 구독 (`KAFKA_TOPIC_FOR_ENTITY`) |
| `observedAt_topic` | 브로커가 구독 (`KAFKA_TOPIC_FOR_OBSERVED_AT`) |

데이터 흐름은 `agent → fdt_topic → translator → ngsild_topic → broker → MongoDB` 다.

이 클러스터는 `auto.create.topics.enable=false` 이고 **애플리케이션도 토픽을 만들지 않는다.**
agent·translator 코드 어디에도 `AdminClient` 호출이 없어서, 토픽이 없으면 오류 없이 조용히
데이터가 흐르지 않는다. 수집 소스를 추가하면 그 토픽 이름을 `KAFKA_TOPICS` 에 덧붙인다.

파티션은 나중에 늘릴 수는 있어도 줄일 수 없다. 운영이 5개라 기본값을 5로 맞췄다.
Kafka 가 스스로 만드는 내부 토픽(`__consumer_offsets`)은 이 설정과 무관하게 생성된다.

```bash
./install/2-kafka.sh --rebuild   # 이미지가 있어도 다시 빌드
```

### 4.3 3단계 — NDXPro 코어

```bash
./install/3-ndxpro.sh
```

코어 9개 + 파일 서비스 + FDT 뷰어를 순서대로 올린다. 스프링 부트 기동에 서비스당 30~90초가 걸리므로 스크립트가 중간에 대기하고, 끝나면 Eureka 등록 목록을 출력한다.

`NDXPRO-GW`, `DATAMANAGER-SERVICE`, `DATABROKER-SERVICE`, `DATASERVICE-SERVICE`, `AUTHORIZATION-SERVICE`, `DATAINGEST-SERVICE`, `NGSI-TRANSLATOR-SERVICE`, `TRANSLATOR-BUILDER-SERVICE`, `FILE-SERVICE` 가 모두 보이면 정상이다. (`MyOwn` 은 FDT 뷰어가 기본 이름으로 등록된 것으로 정상이다.)

### 4.4 4단계 — 프론트

```bash
cd ../fdt-service-frontend
./install/1-front.sh            # 리버스 프록시 뒤에서 동작 (포트 비공개)
./install/1-front.sh --expose   # 프록시 없이 화면 포트를 직접 공개
./install/1-front.sh --nginx    # 리버스 프록시까지 함께 올린다
```

BFF 가 백엔드의 PostgreSQL 을 쓰므로 `postgres` 컨테이너가 없으면 스크립트가 멈추고 안내한다.
최초 기동 시 역할·조직·관리자 계정을 시드한다.

---

## 5. 설치 검증

```bash
cd fdt-service-backend && ./scripts/health.sh
```

- 컨테이너 20개의 상태(`running` / healthcheck)
- 주요 HTTP 엔드포인트 응답 코드
- Eureka 등록 서비스 목록

수동 확인:

| 확인 항목 | 방법 | 기대 결과 |
|---|---|---|
| 웹 화면 | 브라우저에서 `${PUBLIC_URL}` | `/signin` 으로 리다이렉트 |
| 로그인 | `${PUBLIC_URL}/signin` 에서 `admin@e8ight.co.kr` / `.env` 의 `ADMIN_SEED_PASSWORD` 값 | 대시보드 진입 |
| @context | `curl ${FDT_CONTEXT}` | JSON-LD 본문 |
| 게이트웨이 | `curl http://${HOST}:54002/actuator/health` | `{"status":"UP"}` |
| Kafka | `http://${HOST}:59500` | 브로커 1대, 토픽 목록 |
| 뷰어 | 화면에서 트윈 선택 → 3D 뷰 | 모델 렌더링 |

---

## 6. 운영

### 6.1 특정 서비스만 최신 이미지로 교체

```bash
./scripts/remake_container.sh union-twin-fe fdt-service-frontend/front/compose.yml
./scripts/remake_container.sh data-broker-1 fdt-service-backend/ndxpro/compose.yml
```

이전 이미지를 지우고 다시 받으므로 `:latest` 태그도 확실하게 갱신된다.

### 6.2 버전 올리기

`.env` 의 `TAG_*` 를 수정한 뒤 해당 단계만 다시 올린다.

```bash
vi .env               # 예: TAG_DATA_BROKER=v1.1.3
./install/0-init.sh
./install/3-ndxpro.sh        # 변경된 서비스만 재생성된다
```

### 6.3 토큰 재발급

`NDXPRO_TOKEN` 은 만료 시각이 포함된 JWT 다. 만료되면 화면·뷰어가 일제히 401 을 낸다.

```bash
# 남은 유효기간 확인 (payload 의 exp 를 사람이 읽는 시각으로)
set -a; source .env; set +a
echo "$NDXPRO_TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | python3 -c \
  'import json,sys,datetime; print(datetime.datetime.fromtimestamp(json.load(sys.stdin)["exp"]))'
```

재발급은 인증 서비스(data-auth, `:54009`)의 로그인 API 로 받는다. 정확한 경로와 파라미터는 배포된 버전의 Swagger(`http://${HOST}:54009/swagger-ui/index.html`)에서 확인한다. 새 토큰을 `.env` 의 `NDXPRO_TOKEN` 에 넣고:

```bash
./install/3-ndxpro.sh && ./install/1-front.sh
```

### 6.4 백업

```bash
./scripts/backup.sh      # ./backup/ 에 PostgreSQL 전체 덤프 + MongoDB 아카이브 생성
```

같이 백업해야 하는 것: `${REPO}/file-service/data`(업로드 원본), `${REPO}/ngsi-context`, `${REPO}/translatorJars`, 그리고 **`.env` 파일 자체**(비밀번호가 여기에만 있다).

복구:

```bash
cat backup/postgres-YYYYmmdd-HHMM.sql | docker exec -i postgres psql -U postgresadmin
gunzip -c backup/mongo-YYYYmmdd-HHMM.archive.gz | docker exec -i mongodb mongorestore --archive --gzip -u mongoadmin -p '<암호>' --authenticationDatabase admin
```

### 6.5 로그

```bash
docker logs gateway          # 특정 서비스
docker compose --env-file .env -f fdt-service-backend/ndxpro/compose.yml logs --tail=200 data-broker-1
ls ${REPO}/logs/             # 각 서비스가 파일로도 남긴다
```

### 6.6 중지 / 재기동

```bash
cd fdt-service-frontend  && ./install/9-clean.sh          # 프론트 먼저
cd ../fdt-service-backend && ./install/9-clean.sh          # 컨테이너만 삭제 (데이터 보존)
                             ./install/9-clean.sh --data   # 데이터·로그·네트워크까지 삭제
                             ./install/9-clean.sh --all    # + 내려받은 이미지까지
```

`${REPO}` 하위를 지우지 않는 한 데이터는 보존된다. **볼륨까지 지우려면** `docker compose ... down -v` 를 써야 하는데, 이 경우 DB 가 초기화된다.

---

## 7. 이미지 묶음 (사내 작업)

**설치할 때는 이 장이 필요 없다.** 묶음은 이미 `install/images/` 에 들어 있고,
`0-init.sh` 가 적재한다. 이 장은 묶음을 새로 만들거나 갱신하는 사내 담당자를 위한 것이다.

설치 서버가 쓰는 방법은 둘뿐이며 레지스트리 접속은 없다.

| 방법 | 명령 | 필요한 것 |
|---|---|---|
| 묶음 적재 | `./install/0-init.sh` | `images/` 의 tar.gz (기본, 이미 들어 있음) |
| 소스 빌드 | `./install/0-init.sh --build` | 소스코드 + `image-bundle/bundle.env` 의 경로 |

### 7.1 묶음 만들기 (사내)

`image-bundle/` 폴더에서 한다. 이 폴더는 설치 서버로 가져가지 않는다.

레지스트리는 프라이빗이라 사내망 밖에서는 접속되지 않는다. 계정은 파일에 두지 않고
`fetch-from-registry.sh` 실행 시 직접 입력한다(비밀번호는 화면에 보이지 않는다).
한 번 로그인하면 도커가 기억하며, 다시 입력하려면 `docker logout <레지스트리>` 후 실행한다.

```bash
cd image-bundle
cp bundle.env.example bundle.env     # 소스코드 경로만 들어 있다

./fetch-from-registry.sh             # 방법 A — 사내 레지스트리에서 받기 (계정 입력)
./build-from-source.sh               # 방법 B — 소스코드에서 빌드
./pack.sh                            # out/union-twin-service-images.tar.gz (약 1.9 GB, 사내 이미지 13개)
```

대상 이미지 목록은 compose 파일에서 자동으로 뽑는다. `.env` 의 `TAG_*` 를 고치면 그대로 따라간다.

| 구분 | 개수 | 출처 | 묶음 포함 |
|---|---|---|---|
| NDXPro 코어·파일 서비스·FDT 뷰어 | 11 | 사내 레지스트리 | ○ |
| 연합트윈 화면·BFF | 2 | 사내 레지스트리 | ○ |
| PostgreSQL·MongoDB·Redis·httpd·nginx·Kafka UI | 6 | Docker Hub | ✕ — `0-init.sh` 가 받음 |
| Kafka·Zookeeper | 2 | `kafka/build/` 에서 직접 빌드 | ✕ — `2-kafka.sh` 가 빌드 |

기본 묶음은 `./pack.sh --private-only` 로 만든다. 사내 레지스트리에서만 받을 수 있는 13개만
담으므로 가장 작다(약 1.9 GB).

| 옵션 | 담기는 것 | 크기 | 설치 서버 인터넷 |
|---|---|---|---|
| `--private-only` | 사내 13개 | 1.9 GB | 필요 (공개 6개 + Kafka 빌드) |
| `--no-kafka` | 사내 13 + 공개 6 | 2.6 GB | 필요 (Kafka 빌드만) |
| (옵션 없음) | 전부 21개 | 3.1 GB | 불필요 |

Kafka 빌드는 `ubuntu:18.04`(Docker Hub), Ubuntu 패키지 저장소, `archive.apache.org`
세 곳에 접속한다. 인터넷이 전혀 없는 서버라면 옵션 없이 묶어야 한다.

공개 이미지는 `.env` 의 `IMG_*` 에 버전이 고정돼 있다(`mongo:8.2.12`, `nginx:1.31.4` 등).
`latest` 로 두면 설치 시점마다 다른 버전이 깔려 재현이 안 되고, DB 는 데이터 호환 문제가 된다.

압축 수준은 `GZIP_LEVEL`(기본 9)로 조절한다. `docker save` 는 레이어를 압축하지 않고
내보내므로 바깥 gzip 이 크기를 좌우한다. 낮추면 빨라지지만 결과가 10~15% 커진다.

`build-from-source.sh` 의 동작:

| 이미지 종류 | 처리 |
|---|---|
| 사내 서비스 (`ndxpro-*`, `fdt-service`, `union-twin-*`) | `bundle.env` 의 `SRC_*` 경로에서 빌드 |
| Kafka · Zookeeper | 저장소 안의 `kafka/build/` 에서 빌드 |
| 공개 이미지 (`postgres`·`mongo`·`redis`·`httpd`·`nginx`·`kafka-ui`) | Docker Hub 에서 받기 |
| `SRC_*` 가 빈 사내 이미지 | 건너뛰고 안내 |

### 7.2 새 이미지가 올라왔을 때

전체를 다시 말지 않고 바뀐 것만 보낸다.

```bash
cd image-bundle
./fetch-from-registry.sh 172.16.28.217:12000/union-twin-fe:latest
./pack.sh --only 172.16.28.217:12000/union-twin-fe:latest \
          --name union-twin-fe-20260819.tar.gz
```

설치 서버에서:

```bash
cd fdt-service-backend
./scripts/images-load.sh ../images/union-twin-service-images-fe-20260819.tar.gz
cd ../fdt-service-frontend
./scripts/remake_container.sh union-twin-fe front/compose.yml
```

버전 태그가 바뀌었다면 먼저 `.env` 의 해당 `TAG_*` 를 고친다.

### 7.3 설치 서버에서 (묶음을 새로 받았을 때)

```bash
cp .env.example .env && vi .env       # 주소와 비밀번호·토큰(CHANGE_ME)을 채운다
cd fdt-service-backend
./install/0-init.sh                   # 묶음 적재 + 이미지 점검
./install/1-db.sh
./install/2-kafka.sh                  # 이미지가 있으므로 빌드하지 않는다
./install/3-ndxpro.sh
cd ../fdt-service-frontend && ./install/1-front.sh
```

적재만 따로 하려면 `./scripts/images-load.sh <파일>`,
확인만 하려면 `./scripts/check-images.sh` 를 쓴다.

### 7.4 저장소에 올리기

묶음은 크기가 커서 그냥 커밋하면 서버가 거부한다(GitHub 은 파일당 100MB 하드 제한).

**분할 (현재 방식)** — 95MB 조각으로 나눠 일반 Git 파일로 올린다.

```bash
./pack.sh --private-only --split      # SPLIT_SIZE=50m 처럼 크기 조절 가능
mv out/union-twin-service-images.tar.gz.part-* ../images/
```

`.gitattributes` 를 고칠 필요가 **없다.** `*.tar.gz` LFS 규칙 바로 아래에
`*.tar.gz.part-* -text` 가 있어서 조각은 LFS 대상에서 빠진다. 확인하려면:

```bash
git check-attr filter images/union-twin-service-images.tar.gz.part-aa
#  filter: unspecified   → LFS 아님 (정상)
git lfs push --dry-run origin main
#  출력 없음             → LFS 업로드 0건 (정상)
```

푸시할 때는 **커밋을 조각 2~3개씩(약 200~290 MB) 나눈다.** 한 커밋에 1 GB 넘게 담으면
HTTPS 전송이 `send-pack: unexpected disconnect` 로 끊긴다. LFS 와 무관한 전송 문제다.

**Git LFS (옛 방식, 현재 쓰지 않음)** — `.gitattributes` 의 `*.tar.gz` 규칙이 그대로 남아 있어
통짜 tar.gz 을 커밋하면 LFS 로 올라간다. 갱신이 쌓여 LFS 예산을 초과하면
`batch response: This repository exceeded its LFS budget.` 로 푸시가 막히므로 쓰지 않는다.

> 어느 쪽이든 1.9 GB 가 git 히스토리에 남고, 갱신할 때마다 다시 1.9 GB 가 쌓인다.
> 자주 갱신한다면 묶음을 git 에 두지 않고 **컨테이너 레지스트리(GHCR 등)에 이미지별로 push**
> 하는 편이 낫다. 레이어 단위로 증분 전송돼 바뀐 이미지만 올라간다.

### 7.5 아키텍처

`pack.sh` 는 저장 직전에 모든 이미지가 `TARGET_PLATFORM`(기본 `linux/amd64`)인지 검사하고,
하나라도 다르면 **파일을 만들지 않고 중단**한다.

맥(Apple Silicon)에서 작업할 때 필요한 장치다. 그냥 받거나 빌드하면 공개 이미지 6개와
직접 빌드하는 Kafka·Zookeeper 2개가 arm64 로 만들어져 리눅스 x86_64 서버에서
`exec format error` 가 난다. `fetch-from-registry.sh` 와 `build-from-source.sh` 는
`--platform` 을 항상 붙인다.

설치 서버에서는 `check-images.sh` 로 확인한다.

| 표시 | 뜻 |
|---|---|
| `[OK]` | 이미지가 있고 아키텍처가 이 서버와 같다 |
| `[에뮬]` | 맥에서 amd64 이미지를 도는 경우. 동작하지만 느리다 |
| `[불가]` | 리눅스 x86_64 에서 arm64 이미지. 실행하면 `exec format error` |
| `[없음]` | 이미지가 없다. 묶음을 적재하거나 빌드해야 한다 |

---

## 8. 트러블슈팅

### 8.1 `network ndxpro declared as external, but could not be found`
`./install/0-init.sh` 을 건너뛴 경우다. `docker network create ndxpro` 또는 `./install/0-init.sh` 실행.

### 8.2 Kafka 컨테이너가 계속 재시작
```bash
docker logs pipeline-kafka-1 | tail -50
```
- `Connection refused ... pipeline-zookeeper-a:2181` → Zookeeper 가 아직 안 뜬 것. 1분 뒤 자동 복구된다. 계속되면 `docker restart pipeline-zookeeper-a`.
- `Configured broker.id 1 doesn't match stored broker.id` → 이전 설치의 `${REPO}/docker-volumes/pipeline-kafka-1-volume` 이 남아 있다. 데이터가 필요 없으면 디렉터리를 비운다.
- 외부 프로듀서만 못 붙는다면 `.env` 의 `HOST` 가 실제 접속 주소인지 확인한다. Kafka 는 이 값을 클라이언트에게 알려 준다.

### 8.3 NDXPro 서비스가 Eureka 에 안 뜬다
컨테이너는 살아 있는데 등록이 안 되면 대개 기동 중이다. 2분 뒤에도 없으면 `docker logs <컨테이너>` 에서 `Connection refused` 대상을 본다. PostgreSQL/MongoDB 인증 실패라면 `.env` 비밀번호와 실제 DB 계정이 어긋난 것이다(8.4).

### 8.4 DB 비밀번호를 바꿨는데 접속이 안 된다
초기화 스크립트는 데이터 디렉터리가 비어 있을 때만 돈다. `.env` 만 고치면 컨테이너 쪽 비밀번호는 그대로다. 둘 중 하나를 택한다.

```bash
# (a) 기존 데이터를 유지하고 DB 계정 비밀번호를 직접 변경
docker exec -it postgres psql -U postgresadmin -c "alter user ndxpro with password '새암호';"
docker exec -it mongodb mongosh -u mongoadmin -p --eval \
  'db.getSiblingDB("ndxpro").changeUserPassword("ndxpro","새암호")'

# (b) 데이터를 버리고 완전 초기화 (개발 환경에서만)
./install/9-clean.sh && sudo rm -rf ${REPO}/docker-volumes/postgres-data ${REPO}/docker-volumes/mongodb-data
./install/1-db.sh
```

### 8.5 화면은 뜨는데 로그인이 안 된다 / API 가 CORS 로 막힌다
브라우저 주소창의 주소와 `.env` 의 `PUBLIC_URL` 이 다른 경우다(예: `https://` 로 접속하는데 `PUBLIC_URL` 이 `http://`). 값을 맞추고 `./install/1-front.sh`.

### 8.6 뷰어(3D)가 빈 화면
`VIEWER_URL` 이 브라우저에서 도달 가능한 주소인지 확인한다. 기존 컨텍스트 파일을 쓰는
구성이라면 `curl http://${HOST}:53005/<파일명>` 이 열리는지도 함께 본다.

### 8.7 이미지를 못 찾는다
설치 서버는 레지스트리에 접속하지 않으므로, 이미지가 없다는 것은 묶음이 없거나 적재되지 않았다는 뜻이다.

```bash
./scripts/check-images.sh          # 무엇이 없는지 확인
./scripts/images-load.sh          # 기본 경로 (../images/...)
```

묶음 자체가 없으면 사내에서 `image-bundle/` 로 만들어 와야 한다(7장).

### 8.8 `Ports are not available: ... address already in use`

컨테이너가 쓰려는 포트를 다른 프로그램이 먼저 잡고 있는 경우다. 이 플랫폼의 포트 대부분이
OS 의 임시 포트 범위(리눅스 32768~60999, 맥 49152~65535) 안에 있어서, 브라우저나 VPN 같은
프로그램의 바깥 방향 연결이 우연히 같은 번호를 쓰면 충돌한다. 실제로 검증 중 54009 에서 발생했다.

```bash
lsof -nP -i:54009            # 무엇이 잡고 있는지
netstat -an | grep 54009     # lsof 에 안 보이는 연결도 확인
```

대처는 셋 중 하나다.

1. **잠시 기다린다.** 일시적 연결이면 곧 사라진다.
2. **포트를 바꾼다.** `.env` 의 해당 `PORT_*` 를 다른 번호로.
3. **포트를 예약한다(리눅스, 권장).** 재발을 막는다.

```bash
sudo sysctl -w net.ipv4.ip_local_reserved_ports=$(grep '^PORT_' .env | cut -d= -f2 | paste -sd, -)
# 영구 적용은 /etc/sysctl.d/ 에 같은 내용을 기록한다
```

`bootstrap.sh` 가 실행 시 미리 점검해서 충돌하는 포트를 알려준다.

### 8.9 디스크가 가득 찼다
```bash
docker system df
docker image prune -a          # 사용하지 않는 이미지 정리
du -sh ${REPO}/*               # 로그·Kafka 데이터 확인
```
Kafka 보존 기간은 `fdt-service-backend/kafka/build/kafka/config/server.properties` 의 `log.retention.hours=120`(5일), `log.retention.bytes=5G` 다. 필요하면 줄이고 `./install/2-kafka.sh` 후 재기동한다.

---

## 9. 부록

### 9.1 로컬 PC 에서 화면만 띄우기 (개발용)

NDXPro 백엔드는 서버 것을 그대로 쓰고, 연합트윈 화면과 전용 Postgres 만 로컬에 올린다.

```bash
cd fdt-service-frontend
docker compose --env-file ../.env -f front/compose-local.yml up -d      # → http://localhost:50028
docker compose --env-file ../.env -f front/compose-local.yml down -v
```

Apple Silicon 에서는 `platform: linux/amd64` 로 Rosetta 에뮬레이션이 걸린다. 기동이 느린 것은 정상이다. 로컬 Postgres 는 운영과 헷갈리지 않도록 **55433** 포트를 쓴다.

### 9.2 Windows 서버에 설치할 때

이미지는 전부 `linux/amd64` 이고 **컨테이너 안은 리눅스로 고정**이다. 호스트가 Windows 여도
도커가 리눅스 컨테이너를 돌릴 수 있으면 동작한다. 다만 설치 스크립트가 bash 라
**WSL2 안에서** 실행해야 한다.

| 호스트 | 동작 | 방식 |
|---|---|---|
| Linux x86_64 | 그대로 | 네이티브 |
| Windows | 됨 | WSL2 (내부에 리눅스 커널) |
| macOS Intel | 됨 | Docker Desktop 리눅스 VM |
| macOS Apple Silicon | 됨, 느림 | Rosetta 에뮬레이션 |
| Linux arm64 | **안 됨** | 이미지가 amd64 전용 |

중요한 것은 OS 가 아니라 **CPU 아키텍처**다. arm64 서버에는 올릴 수 없다.

#### 준비

```powershell
wsl --install -d Ubuntu-22.04          # 관리자 PowerShell
```

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER          # 로그아웃 후 재접속

git config --global core.autocrlf input
git clone <저장소> ~/DTSP_연합
cd ~/DTSP_연합/install
```

이후 절차는 리눅스와 동일하다(4장).

#### 주의할 점

| 항목 | 내용 |
|---|---|
| 저장소 위치 | `/home/...` 안에 둔다. `/mnt/c/...` 는 I/O 가 느리고 파일 권한이 꼬여 볼륨 마운트가 실패한다 |
| `REPO` | `.env` 의 `REPO` 도 WSL 내부 경로로 둔다. `/mnt/c/data` 같은 경로는 피한다 |
| 줄바꿈 | `.gitattributes` 가 `*.sh` 를 LF 로 고정한다. 그래도 `\r: command not found` 가 나면 `dos2unix *.sh` |
| Docker Desktop | 쓴다면 **Linux containers 모드**여야 한다. Windows containers 모드로는 이 이미지들이 돌지 않는다 |
| 메모리 | WSL2 는 기본적으로 호스트 메모리의 절반까지 쓴다. 전체 스택이 약 9 GB 를 쓰므로 `.wslconfig` 에서 `memory=16GB` 정도로 지정한다 |
| 자동 시작 | WSL 은 로그인해야 뜬다. 서버 재부팅 후 자동 기동이 필요하면 작업 스케줄러에 `wsl -d Ubuntu-22.04 -u root service docker start` 를 등록한다 |

#### 외부 접속 (포트 포워딩)

WSL2 는 기본적으로 localhost 만 열린다. 다른 PC 에서 접속하려면 포워딩을 걸어야 하고,
WSL 의 IP 는 재부팅마다 바뀌므로 부팅 스크립트로 두는 편이 낫다.

```powershell
$ip = (wsl hostname -I).Split(" ")[0]
foreach ($p in 50028,50038,53005,54002) {
  netsh interface portproxy delete v4tov4 listenport=$p listenaddress=0.0.0.0 2>$null
  netsh interface portproxy add    v4tov4 listenport=$p listenaddress=0.0.0.0 connectport=$p connectaddress=$ip
  New-NetFirewallRule -DisplayName "DTSP $p" -Direction Inbound -LocalPort $p -Protocol TCP -Action Allow
}
```

Windows 11 22H2 / Windows Server 2022 이상은 `%USERPROFILE%\.wslconfig` 에
`[wsl2]` `networkingMode=mirrored` 를 넣으면 포워딩 없이 호스트 IP 로 바로 접근된다.

`.env` 의 `HOST` 와 `PUBLIC_URL` 에는 **WSL 의 IP 가 아니라 Windows 서버의 IP** 를 적는다.

### 9.3 기존 구조에서 달라진 점

| 기존 | 변경 후 | 이유 |
|---|---|---|
| `.env` 3개(백엔드/infra/kafka)에 값 중복 | 최상위 `.env` 1개 | 한쪽만 고쳐 생기는 불일치 제거 |
| `docker compose up -d docker-compose.yml` | `./install/1-db.sh` (내부적으로 `-f` 사용) | 기존 명령은 파일명을 서비스명으로 해석해 실제로는 동작하지 않았다 |
| compose 파일에 비밀번호·토큰 평문 | 전부 `.env` 참조 | 저장소에 시크릿이 남지 않도록 |
| `docker-compose-file.yml` 의 `DATASOURCE_URL=jdbc:postgresql://220.124.222.90:55432/...` | `postgres:5432` | 같은 네트워크 안인데 호스트 IP 로 우회하고 있었다. IP 변경 시 수정 누락의 원인 |
| 프론트 compose 의 이미지 주소 하드코딩. 운영과 로컬이 서로 다른 레지스트리 참조 | `${IMAGE_REPO_URL}` 로 통일 | 어느 레지스트리를 보는지 파일마다 달랐다 |
| Kafka UI 가 `220.124.222.90:19092` 참조 | `pipeline-kafka-1:9092` | 컨테이너 내부 통신이 호스트를 경유하지 않도록 |
| 서비스 간 `KAFKA_URL=pipeline-kafka-1:19092` | `pipeline-kafka-1:9092` | 내부 리스너 직접 사용. 외부 리스너(19092)는 외부 프로듀서 전용 |
| Redis 가 존재하지 않는 `redis.conf` / `users.acl` 을 바인드 마운트 | 마운트 제거, `--requirepass` 만 사용 | 파일이 없으면 도커가 같은 이름의 **디렉터리**를 만들어 기동이 꼬였다 |
| `schema.sql` 에 계정·비밀번호 하드코딩 | `db/init/postgres/01-init.sh` 가 `.env` 값으로 생성 | 비밀번호를 바꾸면 스키마 생성이 어긋나던 문제 |
| `union_twin` DB 를 로컬 전용 SQL 로만 생성 | 초기화 스크립트가 운영에서도 생성 | 운영 재설치 시 수동 작업이 필요했다 |
| `mongo` / `nginx` 등 `latest` 태그 | `.env` 의 `IMG_*` 로 버전 고정 | 재설치 시점에 따라 다른 버전이 깔리는 것을 방지 |
| watchtower 상시 동작 | 기본 비활성(`WATCHTOWER_ENABLED=false`, 별도 compose) | 운영 중 예고 없는 자동 재배포 방지 |
| 설치 시 레지스트리 pull 필수 | 묶음(tar.gz) 적재 또는 소스 빌드 | 설치 서버가 사내망에 없어도 된다. 레지스트리 계정이 설치 서버에 남지 않는다 |
| `cd infra`, `cd kafka` 로 옮겨 다니며 실행 | 각 폴더에서 `install/` 스크립트 실행 | 기동 대기·상태 확인이 스크립트에 포함된다 |
| Kafka 토픽을 수동 생성 | `2-kafka.sh` 가 `.env` 의 `KAFKA_TOPICS` 를 생성 | `auto.create.topics.enable=false` 라 없으면 데이터가 흐르지 않는다 |
| 백엔드·프론트가 같은 폴더 깊이에서 뒤섞임 | 두 폴더로 분리, `.env` 만 공유 | 프론트는 자체 BFF 서버가 있어 따로 배포·재기동한다 |
| `version:` 키 사용 | 제거 | Compose v2 에서 무시되며 경고를 낸다 |

이전 구조(`docker-compose-*.yml`, `infra/`, `kafka/` 흩어진 `.env`)는 새 구조로 모두 이관 후 삭제했다.

### 9.4 명령 요약

```bash
각 폴더의 README.md              # 전체 명령 목록
./install/0-init.sh         # 최초 준비
./install/2-kafka.sh       # kafka/zookeeper 이미지 빌드
./install/0-init.sh              # 이미지 내려받기
./install/1-db.sh ~ 3-ndxpro.sh                # 1~6단계 순차 기동
./scripts/health.sh            # 설치 검증
docker ps / logs S=xxx   # 상태 / 로그
./scripts/backup            # DB 백업
./install/9-clean.sh              # 전체 중지
```
