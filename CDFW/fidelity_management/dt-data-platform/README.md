# 유효성 검증 및 데이터 증강 도구 관리 플랫폼 (DT Data Platform)

> _FDTFW_ (지능형 디지털 연합트윈 프레임워크) / `CDFW` / `fidelity_management` 구성 모듈

디지털 트윈 데이터의 **유효성 검증 도구**와 **데이터 증강 도구**를 생성 · 학습 · 배포하고, 그 결과와 이력을
관리하는 Spring Boot 기반 관리 플랫폼(Web Admin) 입니다.

전처리 · 학습 · 증강 연산은 같은 디렉터리의 분석 API 서버 [`../dt-data-api`](../dt-data-api) (Django)
가 수행하며, 본 모듈은 **사용자 인터페이스**, **메타데이터 · 이력 관리**, **학습 / 증강 작업 스케줄링** 을
담당합니다.

## 목차

1. [주요 기능](#1-주요-기능)
2. [시스템 구성](#2-시스템-구성)
3. [기술 스택](#3-기술-스택)
4. [프로젝트 구조](#4-프로젝트-구조)
5. [사전 요구 사항](#5-사전-요구-사항)
6. [설치](#6-설치)
7. [빌드](#7-빌드)
8. [실행](#8-실행)
9. [운영 참고](#9-운영-참고)
10. [라이선스](#10-라이선스)

---

## 1. 주요 기능

메뉴 구성은 `tb_menu` 테이블로 관리되며(권한은 `tb_menu_auth`), `initialize.sql` 이 적재하는 기본 구성은
다음과 같습니다.

| 대메뉴                | 하위 메뉴                                            | 경로                                       |
| --------------------- | ---------------------------------------------------- | ------------------------------------------ |
| 대시보드              | 대시보드                                             | `/dt/history/dashboard`                    |
| 유효성 검증 도구 관리 | AutoEncoder / RandomForest / Brits / Naomi 모델      | `/dt/etc/model/{ae,rf,brits,naomi}/list`   |
| 데이터 증강 도구 관리 | My 도구 생성                                         | `/dt/model/model/list`                     |
|                       | 공개 도구 검색                                       | `/dt/model/shared/model/list`              |
|                       | 증강 도구 배포                                       | `/dt/simulation/augment/list`              |
| 게시판                | 공지사항 / 커뮤니티                                  | `/dt/board/{notice,community}/list`        |
| 시스템관리            | 사용자 / 코드 / 메뉴 / 권한 / 단위 / 데이터검증 관리 | `/setting/{user,code,menu,auth,unit,vrfc}` |

### 1.1 대시보드

전체 유효성 검증 도구 수 · 증강 도구 수 · 증강 배포 건수와 알고리즘별 생성/학습 이력 통계를 집계해
차트로 제공합니다.

### 1.2 유효성 검증 도구 (`/dt/etc/model/**`)

데이터 이상치 · 결측 등 품질 문제를 판정하는 모델을 생성 · 학습하고, 학습 지표와 이력을 관리합니다.

| 도구         | 알고리즘 코드   | 분석 서버 학습 요청                                        |
| ------------ | --------------- | ---------------------------------------------------------- |
| AutoEncoder  | `AUTO ENCODER`  | `POST /dt/newpreproc/processorCreateAELearningModel/`      |
| RandomForest | `RANDOM FOREST` | `POST /dt/metalearning/createModelGenerater_randomForest/` |
| Brits        | `BRITS`         | `POST /dt/metalearning/createModelGenerater_brits_ori/`    |
| Naomi        | `NAOMI`         | `POST /dt/metalearning/createModelGenerater_naomi/`        |

### 1.3 데이터 증강 도구 (`/dt/model/**`)

시계열 데이터를 학습해 합성 데이터를 생성하는 도구를 만들고, 공개 설정된 타 사용자 도구를 검색 · 재사용
할 수 있습니다.

| 알고리즘   | 알고리즘 코드 | 분석 서버 학습 요청                                   |
| ---------- | ------------- | ----------------------------------------------------- |
| LSTM / GRU | `LSTM`, `GRU` | `POST /dt/metalearning/createModelGenerater/`         |
| DeepAR     | `DEEP AR`     | `POST /dt/metalearning/createModelGenerater_deepAR/`  |
| N-BEATS    | `NBEATS`      | `POST /dt/metalearning/createModelGenerater_nbeats/`  |
| SegRNN     | `SEG_RNN`     | `POST /dt/metalearning/createModelGenerater_SEG_RNN/` |

학습 결과는 다음 형태로 축적되어 상세 화면에서 조회됩니다.

- 학습 차수별 손실 · 검증 손실 · 메트릭 (`tb_meta_model_loss`)
- 원본 대비 합성 데이터의 충실도(FID) 평가 지표 (`tb_meta_model_fid`)
- SHAP 기반 설명 데이터 (`tb_meta_model_xai`)

### 1.4 도구 생성 마법사

두 도구 모두 단계형 화면으로 생성합니다. 화면 조각은
`templates/pages/{dt_model,dt_etc_model}/fragments/platform/` 에 단계별로 분리되어 있습니다.

| 단계 | 화면            | 내용                                                            | 증강 | 검증 |
| ---- | --------------- | --------------------------------------------------------------- | :--: | :--: |
| 0    | 데이터 미리보기 | 디지털 트윈 객체 데이터 / 업로드 CSV 미리보기                   |  O   |  O   |
| 1    | 데이터 선택     | 인덱스(시간) 컬럼 지정, 구간 · 건수 기준 데이터셋 확정          |  O   |  O   |
| 2    | 입력 정보       | 도구 기본 정보 및 컬럼(피처 · 출력) 정보 설정                   |  O   |  O   |
| 3    | 전처리          | 유효성 검증 · 이상치 · 결측치 · 시간 간격(리샘플링) · 단위 변환 |  O   |  -   |
| 4    | 알고리즘 선택   | 알고리즘 및 하이퍼파라미터 설정                                 |  O   |  O   |
| 5    | 도구 저장       | 저장 및 학습 요청(대기 상태 등록)                               |  O   |  O   |
| 6    | 이력            | 학습 진행 상태 · 지표 · 산출물 이력 조회                        |  O   |  O   |

전처리 단계의 검증 규칙과 단위는 시스템관리의 **데이터검증관리**(`/setting/vrfc`) · **단위관리**
(`/setting/unit`) 에 등록된 기준을 사용합니다.

### 1.5 증강 도구 배포 (`/dt/simulation/**`)

학습이 완료된 증강 도구를 선택해 데이터 생성 작업으로 배포합니다. 1회성 실행과 주기 실행을 지원하며,
생성 결과는 시각화 화면과 파일 다운로드(`/file/download/dt/meta/augment/{fileSeq}`)로 제공됩니다.

### 1.6 게시판 · 시스템 관리

공지사항 · 커뮤니티 게시판(첨부파일 포함)과 사용자 · 권한 · 코드 · 메뉴 관리 기능을 제공합니다.

---

## 2. 시스템 구성

```text
  [ Web Browser ]
        |
        |  HTTP(S)
        v
  [ dt_data_platform_admin ]  <-- 본 모듈 (기본 포트 9102)
        Thymeleaf UI + Spring Security + MyBatis
        TaskManager / Scheduler (30s polling)
        |
        +-- JDBC --> [ MariaDB : dt_data_platform ]
        |
        +-- REST --> [ dt-data-api (Django) ]        전처리 / 학습 / 증강
        |
        +-- REST --> [ DT Metadata API ]             디지털 트윈 · 객체 메타데이터
        |
        +-- REST --> [ Sync Engine API ]             동기화 엔진
```

| 연동 대상         | 설정 키                                        | 용도                                                      |
| ----------------- | ---------------------------------------------- | --------------------------------------------------------- |
| 분석 API 서버     | `system.dt-api-url`, `system.dt-api-key`       | 전처리 · 학습 · 증강 실행 (`Authorization: Token <key>`)  |
| DT 메타데이터 API | `system.dt-meta-api-url`, `system.dt-meta-key` | 디지털 트윈 / 디지털 객체 메타데이터 수집 (`/dt/meta/**`) |
| 동기화 엔진 API   | `system.dt-keti-api-url`                       | 동기화 엔진 연동                                          |

애플리케이션 기동 시 `TaskSchedulerService` 가 메타데이터 API 를 페이지 단위로 순회하여 디지털 트윈
목록을 수집(Twin Collector)하고, 이후 30초 주기로 대기 상태의 학습 · 증강 작업을 조회해 작업 큐에
투입합니다.

---

## 3. 기술 스택

| 구분            | 사용 기술                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 언어 · 런타임   | Java 8 (source/target 1.8)                                                                                                                   |
| 프레임워크      | Spring Boot 2.1.13.RELEASE (Web / Security / JDBC / Actuator)                                                                                |
| 화면            | Thymeleaf, Thymeleaf Layout Dialect 2.5.2, `thymeleaf-extras-springsecurity5`                                                                |
| 퍼시스턴스      | MyBatis (`mybatis-spring-boot-starter` 2.1.4), MariaDB Java Client 2.5.4, log4jdbc-log4j2 1.16                                               |
| 빌드            | Gradle 멀티 프로젝트 (`dt_data_platform_core` + `dt_data_platform_admin`)                                                                    |
| 주요 라이브러리 | opencsv 5.5, Jackson, Gson, Apache Commons (lang3 · text · io · codec), HttpClient 4.5.11, jsoup, Thumbnailator 0.4.14, Jasypt 3.0.3, Lombok |
| 프런트엔드      | jQuery · Bootstrap · ECharts 등 정적 자원 포함 ([THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt) 참조)                                     |

---

## 4. 프로젝트 구조

```
dt-data-platform/
├── build.gradle                 # 루트 · 서브프로젝트 공통 빌드 설정
├── settings.gradle              # DT_DATA_PLATFORM (core + admin)
├── initialize.sql               # DB · 테이블 · 기본 데이터 생성 스크립트
├── THIRD_PARTY_NOTICES.txt      # 제3자 오픈소스 고지
├── dt_data_platform_core/       # 공통 라이브러리 (jar)
│   └── src/main/
│       ├── java/com/stoneitgt/
│       │   ├── common/          # 전역 상수 (GlobalConstant 등)
│       │   └── dt/data/platform/
│       │       ├── component/
│       │       ├── domain/      # 도메인 · meta / model / sync DTO
│       │       ├── enums/       # ModelType, TimeUnit
│       │       ├── interceptor/
│       │       ├── properties/  # BaseSystemProperties (system.* 매핑)
│       │       ├── security/
│       │       └── util/        # 문자열 · 시간 · CSV · 파일 유틸
│       └── resources/i18n/      # 메시지 · 검증 메시지
└── dt_data_platform_admin/      # 웹 애플리케이션 (war)
    └── src/main/
        ├── java/com/stoneitgt/dt/data/platform/admin/
        │   ├── AdminApplication.java   # 진입점 (SpringBootServletInitializer)
        │   ├── component/      # 스케줄러 실행 로직, 인증 파사드
        │   ├── config/         # DataSource(primary/second) · Security · Web · Scheduler
        │   ├── controller/     # 화면 · REST 엔드포인트
        │   ├── converter/
        │   ├── Filter/         # AutoLoginFilter
        │   ├── mapper/         # MyBatis 매퍼 인터페이스
        │   ├── properties/     # SystemProperties
        │   ├── security/       # AuthProvider · 성공/실패 핸들러
        │   ├── service/        # 업무 서비스 · 외부 API 연동
        │   └── task/           # TaskManager · TaskType · TaskSchedulerService
        └── resources/
            ├── application.yml
            ├── log4jdbc.log4j2.properties
            ├── mapper/primary/*.xml    # MyBatis 매퍼 XML
            ├── static/assets/          # css · js · images · vendors
            └── templates/              # layouts · fragments · pages
```

---

## 5. 사전 요구 사항

| 항목             | 버전                               | 비고                                                                                                |
| ---------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| JDK              | 1.8                                | `sourceCompatibility = 1.8`                                                                         |
| Gradle           | 6.x                                | 빌드 스크립트가 `compile` 설정을 사용하므로 Gradle 7 이상과 호환되지 않음. Wrapper 는 포함되지 않음 |
| MariaDB          | 10.5 이상 권장                     | `utf8mb4` / `utf8mb4_general_ci`                                                                    |
| Servlet 컨테이너 | Tomcat 9 (Servlet 3.1+)            | WAR 배포 시 필요 (로컬 실행 시에는 내장 Tomcat 사용)                                                |
| 분석 API 서버    | [`../dt-data-api`](../dt-data-api) | 전처리 · 학습 · 증강 기능 사용 시 필수                                                              |

---

## 6. 설치

### 6.1 데이터베이스 초기화

`initialize.sql` 은 `dt_data_platform` 데이터베이스를 생성하고 테이블 · 기본 코드 · 메뉴 · 권한 ·
관리자 계정(`admin`, BCrypt 해시 저장)을 적재합니다.

```bash
mysql -u root -p < initialize.sql
```

전용 계정을 사용하는 경우 다음과 같이 권한을 부여합니다.

```bash
mysql -u root -p -e "CREATE USER 'dtplatform'@'%' IDENTIFIED BY '<password>'; GRANT ALL PRIVILEGES ON dt_data_platform.* TO 'dtplatform'@'%'; FLUSH PRIVILEGES;"
```

### 6.2 환경 설정

설정 파일은 `dt_data_platform_admin/src/main/resources/application.yml` 하나이며, 프로파일별 블록으로
구성되어 있습니다.

| 프로파일  | 용도                                         |
| --------- | -------------------------------------------- |
| `local`   | 로컬 개발 (기본값, `spring.profiles.active`) |
| `virtual` | 컨테이너 · 샌드박스 환경                     |
| `dev`     | 개발 서버                                    |
| `prod`    | 운영 서버                                    |

주요 설정 항목은 다음과 같습니다.

| 키                                            | 설명                                                              |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `spring.primary.datasource.*`                 | 주 데이터소스 (JDBC URL · 계정)                                   |
| `spring.second.datasource.*`                  | 보조 데이터소스                                                   |
| `server.port`                                 | 서비스 포트 (기본 `9102`)                                         |
| `system.upload-file-path` / `upload-file-url` | 업로드 파일 저장 경로 / 접근 URL 프리픽스                         |
| `system.dt-file-path`                         | 도구 산출물 저장 경로                                             |
| `system.dt-meta-file-path`                    | 증강 도구용 데이터 저장 경로                                      |
| `system.dt-etc-meta-file-path`                | 검증 도구용 데이터 저장 경로                                      |
| `system.tmp-sample-data`                      | 미리보기용 샘플 CSV 경로                                          |
| `system.dt-api-url` / `dt-api-key`            | 분석 API 서버 주소 / 인증 토큰                                    |
| `system.dt-meta-api-url` / `dt-meta-key`      | 메타데이터 API 주소 / 인증 토큰                                   |
| `system.dt-keti-api-url`                      | 동기화 엔진 API 주소                                              |
| `system.limit-csv-row-count`                  | 화면에 적재할 CSV 최대 행 수                                      |
| `system.limit-make-model-cnt`                 | 작업 유형별 동시 실행 수 (증강 학습 · 검증 학습 · 증강 생성 각각) |
| `system.username` / `system.password`         | 자동 로그인 계정 (아래 주의 사항 참조)                            |
| `spring.servlet.multipart.*`                  | 업로드 임시 경로 및 용량 제한 (파일 20MB / 요청 60MB)             |

> **보안 주의**
>
> - 저장소에 포함된 DB 계정 · API 키는 개발용 예시값입니다. 배포 전 반드시 사용 환경의 값으로 교체하십시오.
>   민감 값은 Jasypt(`jasypt-spring-boot-starter` 포함) 또는 환경 변수로 분리할 수 있습니다.
> - `system.username` 과 `system.password` 가 모두 채워져 있으면 `AutoLoginFilter` 가 모든 요청을 해당
>   계정으로 자동 인증합니다. 로그인 화면을 사용하려면 두 값을 **비워 두십시오.**

### 6.3 파일 디렉터리 준비

`system.*-path` 와 `spring.servlet.multipart.location` 에 지정한 디렉터리를 미리 생성하고 애플리케이션
실행 계정에 쓰기 권한을 부여합니다. 증강 도구용 · 검증 도구용 데이터는 각 경로 하위 `tmp/` 에 임시
파일을 생성합니다.

---

## 7. 빌드

Gradle Wrapper 가 포함되어 있지 않으므로 Gradle 6.x 가 설치된 환경에서 실행합니다.

```bash
gradle clean build
```

| 산출물          | 경로                                                               |
| --------------- | ------------------------------------------------------------------ |
| 공통 라이브러리 | `dt_data_platform_core/build/libs/dt_data_platform_core-1.0.jar`   |
| 웹 애플리케이션 | `dt_data_platform_admin/build/libs/dt_data_platform_admin-1.0.war` |

`build.gradle` 은 `bootJar` / `bootWar` 를 비활성화하고 표준 `jar` · `war` 산출물을 생성하도록 설정되어
있습니다. `spring-boot-starter-tomcat` 이 `providedCompile` 로 선언되어 WAR 에 포함되지 않으므로,
빌드된 WAR 는 **외부 Servlet 컨테이너에 배포**해야 합니다. 단독 실행형(`java -jar`) 아티팩트가 필요하면
`build.gradle` 에서 `bootWar.enabled = true` 로 변경하고 Tomcat 의존성 범위를 조정하십시오.

---

## 8. 실행

### 8.1 로컬 실행 (내장 Tomcat)

IDE 에서 `AdminApplication` 을 실행하거나 Gradle 로 기동합니다.

```bash
gradle :dt_data_platform_admin:bootRun
```

기본 활성 프로파일은 `local` 이며, 브라우저에서 `http://localhost:9102/login` 에 접속합니다. 다른
프로파일로 기동할 때는 다음과 같이 지정합니다.

```bash
gradle :dt_data_platform_admin:bootRun --args='--spring.profiles.active=dev'
```

### 8.2 WAR 배포 (외부 Tomcat)

1. `dt_data_platform_admin-1.0.war` 를 배포 서버로 업로드합니다.
2. Tomcat `webapps/` 에 배치합니다. 컨텍스트 경로 없이 서비스하려면 `ROOT.war` 로 이름을 변경합니다.
3. 프로파일을 지정하고 Tomcat 을 기동합니다. (WAR 배포 시 서비스 포트는 Tomcat 설정을 따르며
   `server.port` 는 적용되지 않습니다.)

```bash
export CATALINA_OPTS="-Dspring.profiles.active=prod"
$CATALINA_HOME/bin/startup.sh
```

### 8.3 프로세스 확인 및 종료

```bash
ps -ef | grep dt_data_platform
```

```bash
kill -15 <PID>
```

### 8.4 로그인

`initialize.sql` 이 적재하는 관리자 계정 `admin` (권한 `AU00`) 으로 로그인합니다. 비밀번호는 BCrypt
해시로 저장되어 있으므로, 운영 적용 시 시스템관리 > 사용자관리에서 비밀번호를 변경하십시오.

---

## 9. 운영 참고

| 항목      | 내용                                                                                                                                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 스케줄러  | 증강 도구 학습 · 검증 도구 학습 · 증강 데이터 생성 3종을 각각 30초 주기(`fixedDelay`)로 폴링                                                                                                                           |
| 작업 처리 | 스케줄러가 대기 작업을 `TaskManager` 큐에 투입하고, 작업 유형(`MODEL` / `ETC_MODEL` / `DATA_AUGMENT`) 별 고정 스레드풀(크기 `system.limit-make-model-cnt`)이 처리. 스케줄러 자체는 3 스레드 풀(`twin-task-pool-`) 사용 |
| 세션      | 타임아웃 120분, 쿠키 `BASE_JSESSION_ID`, 연장 API `POST /session/extention`                                                                                                                                     |
| 권한      | `/`, `/login`, `/error/**` 는 공개, 그 외는 `ADMIN` 또는 `USER` 권한 필요, `/actuator/**` 는 `ADMIN` 전용                                                                                                              |
| SQL 로깅  | log4jdbc 사용. `logging.level.jdbc.sqlonly` 등으로 조정 (`log4jdbc.log4j2.properties`)                                                                                                                                 |
| 오류 이력 | 스케줄러 · API 연동 실패는 `tb_error_log` 에 적재                                                                                                                                                                      |

---

## 10. 라이선스

본 저작물은 **GNU Lesser General Public License v2.1 (LGPL-2.1)** 로 배포됩니다.

- 라이선스 전문: 배포 루트의 [`COPYING.LGPLv2.1`](../../../COPYING.LGPLv2.1)
- 요약 안내: [`LICENSE_KR.md`](../../../LICENSE_KR.md)
- 제3자 오픈소스 고지: [`THIRD_PARTY_NOTICES.txt`](THIRD_PARTY_NOTICES.txt)

본 배포물은 소스 코드와 빌드 설정 파일로만 구성되며, 빌드 산출물과 원격 저장소에서 취득되는 라이브러리
바이너리는 포함되지 않습니다. 배포에 포함된 제3자 구성요소(정적 프런트엔드 자원)의 목록과 라이선스는
`THIRD_PARTY_NOTICES.txt` 를 참조하십시오.

## 11. 민감성 정보 제거 및 복구 사항

- application.yml:전체
- 운영 도메인 하드코딩 SyncEngineAPIService.java:104
- 고정 관리자 계정 해시·이메일 initialize.sql:1629
- 개발자 로컬 경로 + 실제 산출물 파일명 Test.java:12 (테스트용, 영구 제거)
- 미참조 바이너리(내용 미확인) assets/images/platform/tmp_video.mp4 (테스트용 비디오, 영구 제거)
- 내부 서버 토폴로지 55건 (미사용 파일) sample.js (테스트용, 영구 제거)
- 사설/운영 서버 IP 하드코딩 test.html:24-30 (테스트용 영구 제거)
- /api/test/\*\* CSRF 예외 유지 WebSecurityConfig.java:68 (테스트용 영구 제거)
- application.yml에서 server.servlet.session.cookie.name 이름 부분 수정 (WebSecurityConfig.java:90과 동일하게 구성)
- TestController 영구 제거
