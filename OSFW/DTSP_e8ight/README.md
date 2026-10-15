# DTSP — 디지털 연합트윈 서비스 플랫폼

> **연합트윈 서비스 플랫폼(Fedit) 프레임워크 메인 모듈**
>
> 플랫폼에 등록된 디지털 트윈들의 객체정보를 재사용하고, 새로운 연합트윈 응용서비스 개발과
> 운영을 위한 디지털 트윈 저작도구 및 예측 분석 기술을 통합하여 제공합니다.

---

## 저장소 구성

```
DTSP_연합/
├── install/     설치·배포 일습 (compose, 스크립트, 이미지 묶음, 문서)
└── source/      각 서비스 소스코드
```

### install/

```bash
cd install
cp .env.example .env && vi .env    # 서버 주소와 비밀번호·토큰(CHANGE_ME)을 채운다

cd fdt-service-backend
./install/0-init.sh                # 이미지 적재
./install/1-db.sh                  # PostgreSQL / MongoDB / Redis
./install/2-kafka.sh               # Zookeeper / Kafka
./install/3-ndxpro.sh              # NDXPro 코어 + 파일 서비스 + FDT 뷰어

cd ../fdt-service-frontend
./install/1-front.sh --expose      # 연합트윈 화면 + BFF
```

자세한 절차는 [install/README.md](install/README.md).

### source/

| 디렉터리 | 서비스 | 빌드 |
|---|---|---|
| `eurekaServer` | 서비스 디스커버리 | Jib |
| `gatewayServer` | API 게이트웨이 | Jib |
| `dataIngest` | 데이터 수집 | Dockerfile |
| `translatorBuilder` | 변환기 빌더 | Jib |
| `ngsiTranslator` | NGSI-LD 변환 | Jib |
| `dataBroker` | 데이터 브로커 | Dockerfile |
| `dataService` | 데이터 제공 API | Jib |
| `dataManager` | 데이터 모델·속성 관리 | Jib |
| `dataAuth` | 인증·인가 | Jib |
| `file-service` | 파일 업로드·다운로드 | Jib |
| `fdt-service` | FDT 뷰어 | Jib |
| `union-twin-fe` | 연합트윈 화면 + BFF (모노레포) | Dockerfile |

소스에서 이미지를 만드는 방법은 [install/image-bundle/README.md](install/image-bundle/README.md).

---

## 구성 요소

플랫폼은 아래 순서로 기동한다. 앞 단계가 준비되지 않으면 뒷 단계가 재시작을 반복한다.

| 순서 | 묶음 | 구성 |
|---|---|---|
| 1 | 데이터 저장소 | PostgreSQL · MongoDB · Redis |
| 2 | 메시지 파이프라인 | Zookeeper · Kafka · Kafka UI |
| 3 | NDXPro 코어 | Eureka · Gateway · Ingest · Translator · Broker · Service · Manager · Auth · @context |
| 4 | 파일 서비스 | File Service |
| 5 | FDT 뷰어 | FDT Service |
| 6 | 연합트윈 화면 | union-twin-fe(웹) · union-twin-be(BFF) |
| 7 | (선택) 리버스 프록시 | nginx |

```
                 [브라우저]
                 ┌───▼────┐
                 │ nginx  │  7
                 └───┬────┘
        ┌────────────▼────────────┐
        │ union-twin-fe ─▶ -be    │  6      ─▶ PostgreSQL(union_twin)
        └───────┬─────────┬───────┘
                │         └──────────────▶ [FDT 뷰어] 5
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

---

## 문서

| 문서 | 내용 |
|---|---|
| [install/README.md](install/README.md) | 설치 절차, 고쳐야 할 값, 운영 명령 |
| [install/docs/reference.md](install/docs/reference.md) | 포트 목록, 트러블슈팅, 이미지 묶음 제작, 변경 이력 |
| `install/docs/디지털연합트윈_설치_해설서.docx` | 배포용 Word 문서 |
| [install/image-bundle/README.md](install/image-bundle/README.md) | 이미지 묶음 제작·갱신 (사내) |
