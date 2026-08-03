# 유효성 검증 및 데이터 증강 분석 API 서버 (DT Data API)

> _FDTFW_ (지능형 디지털 연합트윈 프레임워크) / `CDFW` / `fidelity_management` 구성 모듈

디지털 트윈 데이터의 **전처리**, **유효성 검증 도구 학습 · 추론**, **데이터 증강 도구 학습 · 합성 데이터
생성** 연산을 수행하는 Django REST Framework 기반 분석 API 서버입니다.

화면 · 메타데이터 · 이력 관리와 작업 스케줄링은 같은 디렉터리의 관리 플랫폼
[`../dt-data-platform`](../dt-data-platform) (Spring Boot) 이 담당하며, 본 모듈은 그 플랫폼이 REST 로
호출하는 **연산 백엔드**입니다. 두 모듈은 동일한 MariaDB 스키마(`dt_data_platform`)와 파일 저장소를
공유합니다.

## 목차

1. [주요 기능](#1-주요-기능)
2. [시스템 구성](#2-시스템-구성)
3. [기술 스택](#3-기술-스택)
4. [프로젝트 구조](#4-프로젝트-구조)
5. [사전 요구 사항](#5-사전-요구-사항)
6. [설치](#6-설치)
7. [실행](#7-실행)
8. [API 규격](#8-api-규격)
9. [운영 참고](#9-운영-참고)
10. [라이선스](#10-라이선스)

---

## 1. 주요 기능

관리 플랫폼의 도구 생성 마법사 단계와 본 API 의 엔드포인트가 1:1 로 대응합니다.

| 단계          | 처리 내용                                          | 라우터 접두사        |
| ------------- | -------------------------------------------------- | -------------------- |
| 데이터 준비   | CSV 적재 · 인덱스(시간) 컬럼 판정 · 구간/건수 확정 | `/dt/newpreproc/`    |
| 전처리        | 유효성 검증 · 이상치 · 결측치 · 리샘플링 · 단위 변환 | `/dt/newpreproc/`  |
| 학습          | 알고리즘별 모델 학습 및 손실 · 지표 적재            | `/dt/metalearning/`  |
| 증강          | 학습 모델 기반 합성 데이터 생성                     | `/dt/newaugment/`    |
| 평가 · 설명   | FID 충실도 평가, SHAP 기반 설명 데이터 산출         | 학습 · 증강에 포함   |

### 1.1 데이터 전처리 (`/dt/newpreproc/`)

| 엔드포인트                                                                       | 기능                                                       |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `processorMakeBaseDataSet` / `processorMakeUserUploadBaseDataSet`                 | DT 객체 데이터 · 업로드 CSV 기준 기초 데이터셋 생성 (1,000건 미리보기) |
| `processorCheckIndexTimeColumn`, `processorDateTimeCheck`                         | 인덱스 컬럼의 시계열 여부 · 시간 형식 확인                 |
| `processorMakeBaseDataSetRangeRow` / `processorMakeBaseDataSetRangeCol`           | 건수 기준 · 구간(컬럼) 기준 데이터셋 확정                  |
| `processorDatasetInfo`, `processorEmptyCheck`                                     | 기술통계 · 데이터 타입 · 분포 · 결측 현황                  |
| `processorDatasetVerify`                                                          | 데이터 타입(`dt`) · 포맷(`df`) · 범위(`rg`) 유효성 검증    |
| `processorOutlierStandardDeviation`, `processorOutlierKMeans`, `processorOutlierDBscan` | 표준편차 · K-Means · DBSCAN 기반 이상치 탐지         |
| `processorDatasetInterpolate`                                                     | 결측치 보간 (linear · time · spline · pchip 등 18종)       |
| `processorDatasetResample`                                                        | 시간 간격 리샘플링                                         |
| `processorDatasetUnitConverter`                                                   | 단위 변환 (`TB_UNIT` 기준)                                 |
| `processorDatasetCorrelation`, `processorDatasetCorrelationOption`                | 상관관계 분석 — Pandas 상관행렬(`pandas`) · 미분 DTW(`ddtw`) · 그레인저 인과(`granger`) |

검증 규칙(`TB_DATA_VRFC`)과 단위(`TB_UNIT`)는 관리 플랫폼의 시스템관리 화면에서 등록된 값을 사용합니다.

### 1.2 유효성 검증 도구 (AutoEncoder)

| 엔드포인트                                                                   | 기능                                          |
| ---------------------------------------------------------------------------- | --------------------------------------------- |
| `POST /dt/newpreproc/processorCreateAELearningModel/` (`..._New` 포함)       | AutoEncoder 이상 탐지 모델 학습               |
| `POST /dt/newpreproc/processorDataAEGenerater/` (`..._New` 포함)             | 학습된 AutoEncoder 로 이상(에러) 추론         |
| `POST /dt/example/processorDecisionTree/`, `.../processorDecisionTree_model/` | 의사결정나무 기반 판정 규칙 생성 · 적용       |

학습 손실은 `TB_META_ETC_MODEL_LOSS` 에 적재되어 플랫폼 상세 화면에서 조회됩니다.

### 1.3 데이터 증강 도구 학습 (`/dt/metalearning/`)

| 알고리즘        | 엔드포인트                          | 구현                                    |
| --------------- | ----------------------------------- | --------------------------------------- |
| LSTM / GRU      | `createModelGenerater`              | `model/rnnGeneraterMeta.py`             |
| SegRNN          | `createModelGenerater_SEG_RNN`      | `model/rnnGeneraterMeta.py`             |
| DeepAR          | `createModelGenerater_deepAR`       | `model/deepARGenerater.py`              |
| N-BEATS         | `createModelGenerater_nbeats`       | `model/nbeatsGenerater.py` (+ `nbeatskeras/`) |
| RandomForest    | `createModelGenerater_randomForest` | `model/randomForestGenerater.py`        |
| BRITS           | `createModelGenerater_brits`, `createModelGenerater_brits_ori` | `model/imputerBritsGenerater.py` (+ `brits/`) |
| ARIMA           | `createModelGenerater_arima`        | `model/arimaGenerater.py` (ARIMA · SARIMAX · VARMAX) |

주요 요청 파라미터는 다음과 같습니다 (미지정 시 코드에 정의된 기본값 사용).

| 파라미터                                            | 설명                                                    |
| --------------------------------------------------- | ------------------------------------------------------- |
| `filePath`, `fileName`, `targetFileName`            | 학습 데이터 경로 · 파일명 · 비교 대상 원본 파일명       |
| `modelFilePath`, `modelFileName`, `modelID`         | 모델 산출물 저장 경로 · 파일명(`*.h5`) · 도구 식별자    |
| `features`, `outputs`, `indexColumn`, `trgt_col_list` | 입력 · 출력 컬럼, 인덱스(시간) 컬럼, 대상 컬럼 목록   |
| `modelType`, `windowSize`, `batchSize`, `testSize`, `epochs` | 알고리즘 유형 및 학습 하이퍼파라미터            |
| `loss`, `meterics`, `optimizer`, `optimizerLr`      | 손실(`hub`·`mse`·`mae`·`mape`) · 지표 · 옵티마이저 · 학습률 |

학습 결과는 다음 테이블에 적재됩니다.

- 차수별 손실 · 검증 손실 · 지표 → `TB_META_MODEL_LOSS`
- 원본 대비 합성 데이터 충실도(FID) → `TB_META_MODEL_FID`
- SHAP 기반 설명 데이터 → `TB_META_MODEL_XAI`

### 1.4 데이터 증강 (`/dt/newaugment/`)

학습된 모델을 불러 합성 데이터를 생성합니다. `_interpolation` 접미사가 붙은 엔드포인트는 생성 결과에
보간을 결합해 결측 구간을 함께 채웁니다.

| 엔드포인트                                                                     | 기반 알고리즘              |
| ------------------------------------------------------------------------------ | -------------------------- |
| `augmentCreate`, `augmentCreate_interpolation`, `augmentCreate_repeat`          | LSTM / GRU (주기 반복 포함) |
| `augmentCreate_seg_rnn_interpolation`                                           | SegRNN                     |
| `augmentCreate_deepAR`, `augmentCreate_deepAR_interpolation`                    | DeepAR                     |
| `augmentCreate_nbeats`, `augmentCreate_nbeats_interpolation`                    | N-BEATS                    |
| `augmentCreate_randomForest`                                                    | RandomForest               |
| `augmentCreate_brits`, `augmentCreate_brits_ori`                                | BRITS                      |
| `augmentCreate_arima`, `augmentCreate_arima2`, `augmentCreate_arima_interpolation` | ARIMA                    |

### 1.5 충실도 평가 (FID)

`model/fid.py` · `model/fidMeta.py` 는 시계열을 Recurrence Plot 이미지로 변환한 뒤
`pytorch-fid-wrapper` 로 원본과 합성 데이터 간 FID 점수를 계산합니다. 학습 콜백
(`FIDCallback` · `NBeatsFIDCallback` · `BritsFIDCallback`) 으로 등록되어 학습 중 차수별 점수를 남깁니다.

### 1.6 운영 데이터 관리 API

관리 플랫폼과 공유하는 기준 정보를 조회 · 등록 · 수정 · 삭제합니다.

| 라우터 접두사 | 대상 테이블                | 주요 액션                                                          |
| ------------- | -------------------------- | ------------------------------------------------------------------ |
| `/dt/user/`   | `TB_USER`                  | `userList`, `userRegistration`, `userUpdate`, `userRemove`, `userExist`, `userLogin`, `userLastLoginUpdate` |
| `/dt/menu/`   | `TB_MENU`                  | `menuList`, `menuRegistration`, `menuUpdate`, `menuRemove`, `menuExist` |
| `/dt/auth/`   | `TB_MENU_AUTH`             | `authList`, `authMenuList`, `authMenuRegistration`, `authMenuRemove` |
| `/dt/code/`   | `TB_CODE_MST`, `TB_CODE_DTL` | `codeMstList` · `codeDtlList` 외 등록 · 수정 · 삭제 · 중복확인    |
| `/dt/unit/`   | `TB_UNIT`                  | `unitList`, `unitRegistration`, `unitUpdate`, `unitRemove`         |
| `/dt/vrfc/`   | `TB_DATA_VRFC`             | `vrfcList`, `vrfcRegistration`, `vrfcUpdate`, `vrfcRemove`         |

### 1.7 이전 세대 엔드포인트

`/dt/preprocess/`, `/dt/learning/`, `/dt/augment/`, `/dt/augmentModel/`, `/dt/processor/`,
`/dt/example/`, `/dt/sample/`, `/dt/meta/` 는 초기 버전 및 실험용 엔드포인트입니다. 현행 관리 플랫폼은
`/dt/example/processorDecisionTree*` 를 제외하고 이들을 호출하지 않으며, 구현 일부는
`dt_data_api/model_x/` (초기 모델 구현) 를 참조합니다.

> **NAOMI 알고리즘 안내**
> 공개 배포 정비 과정에서 NAOMI 구현(`imputerNaomiGenerater.py`) 과 관련 엔드포인트
> (`createModelGenerater_naomi`, `augmentCreate_naomi`) 가 제거되었습니다. 관리 플랫폼 화면에는 NAOMI
> 항목이 남아 있으므로, 해당 항목을 선택하면 본 API 에서 404 가 반환됩니다.

---

## 2. 시스템 구성

```text
  [ dt-data-platform (Spring Boot) ]
        |
        |  REST (Authorization: Token <key>)
        v
  [ dt-data-api ]  <-- 본 모듈 (기본 포트 8000)
        Django 4.1 + Django REST Framework
        |
        +-- 파일 I/O --> [ 공유 파일 저장소 ]   데이터 CSV / 모델 산출물(*.h5)
        |
        +-- JDBC/DBAPI -> [ MariaDB : dt_data_platform ]   업무 데이터 (원시 SQL)
        |
        +-- DBAPI -----> [ MariaDB : default ]             Django 인증 · 토큰 테이블
```

- 관리 플랫폼의 `TaskSchedulerService` 가 30초 주기로 대기 작업을 조회해 본 API 를 호출합니다.
  학습 · 증강 요청은 **동기 호출**로 처리되므로, 응답까지 학습 시간만큼 소요됩니다.
- 업무 데이터 조회 · 적재는 Django ORM 이 아니라 `dt/sql/` 의 원시 SQL 을 `dt_data_api/db/query.py`
  (커서 기반 실행기)로 실행하며, 모두 `dt_data_platform` 커넥션을 사용합니다.
- 데이터 파일과 모델 산출물은 관리 플랫폼과 **동일한 경로**를 바라봐야 합니다
  (플랫폼 `system.dt-meta-file-path` ↔ 본 모듈 `DATA_PATH_META` · `MODEL_PATH_META`).

---

## 3. 기술 스택

| 구분             | 사용 기술                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------- |
| 언어 · 런타임    | Python 3.9 (Conda 가상환경 권장)                                                              |
| 프레임워크       | Django 4.1.7, Django REST Framework 3.14.0 (`rest_framework.authtoken`)                       |
| 데이터베이스     | MariaDB — `django.db.backends.mysql` + PyMySQL 1.1.2 / mariadb 1.1.10                          |
| 딥러닝           | TensorFlow 2.10 (`tensorflow-gpu`) · Keras 2.10, PyTorch 2.1.0 (`torchvision 0.16.0+cu118`)   |
| 통계 · 머신러닝  | scikit-learn 1.2.2, statsmodels 0.14.0 (ARIMA · SARIMAX · VARMAX · Granger), scipy 1.10.1     |
| 데이터 처리      | pandas 1.5.3, numpy 1.23.5, pyts 0.12.0 (Recurrence Plot), fastdtw 0.3.4                      |
| 평가 · 설명      | pytorch-fid-wrapper 0.0.4 (FID), shap 0.46.0 (XAI)                                            |
| 시각화           | matplotlib 3.6.3, seaborn 0.12.2, plotly 5.22.0, Pillow 10.1.0                                |
| 기타             | multipledispatch (쿼리 실행기 오버로딩), python-dateutil, alive-progress, pytest 6.2.5        |

고정 버전 전체 목록은 [`requirements.txt`](requirements.txt) (119개), 라이선스 분류는
[`THIRD_PARTY_NOTICES.txt`](THIRD_PARTY_NOTICES.txt) 를 참조하십시오.

---

## 4. 프로젝트 구조

```
dt-data-api/
├── manage.py                        # Django 관리 명령 진입점
├── requirements.txt                 # 고정 의존 패키지 (119개)
├── THIRD_PARTY_NOTICES.txt          # 제3자 오픈소스 고지
├── dt/                              # API 애플리케이션 (Django app "dt")
│   ├── urls.py                      # DRF DefaultRouter 등록 (/dt/**)
│   ├── views/                       # 요청 파라미터 처리 · 응답 조립
│   ├── services/                    # 업무 로직 (전처리 · 학습 · 증강 · 기준정보)
│   ├── sql/                         # 원시 SQL 정의 (dt_data_platform 대상)
│   ├── models/                      # responseData 등 응답 모델
│   ├── serializers/
│   └── migrations/
└── dt_data_api/                     # 프로젝트 설정 및 분석 엔진
    ├── settings.py                  # Django 설정 (DB · 로그 · 파일 경로)
    ├── urls.py                      # 루트 URLConf
    ├── wsgi.py / asgi.py
    ├── common/
    │   ├── enum.py                  # 보간 · 손실 · 옵티마이저 · 오류코드 등 열거형
    │   ├── lib.py / lib_x.py        # 모델 · 유틸 임포트 파사드 (현행 / 초기 버전)
    │   ├── settings.py              # 1세대 파일 경로 파사드
    │   ├── settings_meta.py         # 현행 파일 경로 파사드
    │   └── log.py                   # 로깅 헬퍼 (info/debug/error/exception)
    ├── config/
    │   ├── platform_router.py       # 앱 라벨 기준 DB 라우팅
    │   ├── exception_handler.py     # DRF 예외 → code/message/detail 변환
    │   └── renderers.py
    ├── db/query.py                  # 커서 기반 쿼리 실행기 (select · execute · bulk)
    ├── util/
    │   ├── dataSet.py               # DataInfo — 기술통계 · 검증 · 상관 · 단위변환
    │   ├── paging.py                # ROWNUM 기반 페이징 쿼리 생성
    │   └── utils.py                 # SHAP 산출 등 공통 유틸
    ├── model/                       # 현행 분석 · 학습 모델 구현
    │   ├── rnnGeneraterMeta.py      # LSTM · GRU · SegRNN · AutoEncoder
    │   ├── deepARGenerater.py       # DeepAR
    │   ├── nbeatsGenerater.py       # N-BEATS
    │   ├── arimaGenerater.py        # ARIMA · SARIMAX · VARMAX
    │   ├── randomForestGenerater.py # RandomForest
    │   ├── imputerBritsGenerater.py # BRITS
    │   ├── imputerganGenerater.py   # GAIN 계열 결측 보정
    │   ├── outlier.py               # 표준편차 · K-Means · DBSCAN · AutoEncoder
    │   ├── interpolate.py · resample.py · fillna.py · regression.py · decisionTree.py
    │   ├── fid.py · fidMeta.py      # FID 충실도 평가 및 학습 콜백
    │   ├── estimate_hyper_parameter.py
    │   ├── brits/                   # 제3자 소스 (MIT) — LICENSE 포함
    │   └── nbeatskeras/             # 제3자 소스 (MIT) — LICENSE 포함
    ├── model_x/                     # 초기 버전 모델 구현 (레거시 엔드포인트용)
    └── module/                      # LSTM-AE 단독 실행 모듈 (CLI, 자체 README)
```

---

## 5. 사전 요구 사항

| 항목      | 버전                                     | 비고                                                                    |
| --------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| Python    | 3.9                                      | `tensorflow 2.10` · `numpy 1.23.5` 호환 기준                            |
| MariaDB   | 10.5 이상 권장                           | `utf8mb4` / `utf8mb4_general_ci`                                        |
| 관리 플랫폼 | [`../dt-data-platform`](../dt-data-platform) | `dt_data_platform` 스키마 및 기준 정보를 제공하는 선행 모듈       |
| GPU (선택) | CUDA 11.x + cuDNN                        | `tensorflow-gpu 2.10`, `torch 2.1.0+cu118` 기준. 미보유 시 CPU 로 동작  |
| 빌드 도구 | C/C++ 컴파일러                           | `mariadb` · `Cython` 등 소스 빌드 패키지 설치 시 필요                   |

---

## 6. 설치

### 6.1 Python 환경 (Miniconda)

```bash
mkdir -p ~/miniconda3 && wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
```

```bash
bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
```

```bash
conda create --name dt-data-api python=3.9
```

```bash
conda activate dt-data-api
```

### 6.2 의존 패키지 설치

```bash
pip install -r requirements.txt
```

`requirements.txt` 는 CUDA 11.8 환경 기준으로 고정되어 있습니다. CPU 전용 환경에서는
`tensorflow-gpu` · `nvidia-*` · `torchvision==0.16.0+cu118` 항목을 환경에 맞는 배포판으로 교체하십시오.

### 6.3 MariaDB

```bash
sudo yum install MariaDB-server MariaDB-client && systemctl enable --now mariadb
```

Django 인증 · 토큰 테이블을 저장할 데이터베이스와 계정을 생성합니다. 업무 데이터베이스
(`dt_data_platform`) 는 관리 플랫폼의 `initialize.sql` 이 생성하므로 여기서 만들지 않습니다.

```bash
mysql -u root -p -e "CREATE DATABASE dt_data_api DEFAULT CHARACTER SET utf8mb4; CREATE USER 'dtapi'@'%' IDENTIFIED BY '<password>'; GRANT ALL PRIVILEGES ON dt_data_api.* TO 'dtapi'@'%'; GRANT SELECT, INSERT, UPDATE, DELETE ON dt_data_platform.* TO 'dtapi'@'%'; FLUSH PRIVILEGES;"
```

### 6.4 환경 설정 (`dt_data_api/settings.py`)

배포본에는 접속 정보 · 경로가 플레이스홀더로 비워져 있습니다. 실행 전 사용 환경 값으로 채워야 합니다.

| 설정 키                                                            | 설명                                                                    |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `SECRET_KEY`                                                       | Django 시크릿 키. 기본값 `"[SECRET_KEY]"` 를 반드시 교체                |
| `DEBUG`                                                            | 기본값 `True`. 운영 배포 시 `False`                                     |
| `ALLOWED_HOSTS`                                                    | 기본값 `["*"]`. 운영 배포 시 서비스 호스트로 제한                       |
| `DATABASES["default"]`                                             | Django 인증 · 토큰 테이블용 DB (예: `dt_data_api`)                      |
| `DATABASES["dt_data_platform"]`                                    | 관리 플랫폼과 공유하는 업무 DB. 모든 업무 쿼리가 이 연결을 사용         |
| `MAIN_PATH`, `MODEL_PATH`, `DATA_PATH`, `UPLOAD_PATH`              | 1세대 엔드포인트용 저장 경로 (`~PATH\DT_FILE\...` 플레이스홀더)         |
| `MAIN_PATH_META`, `MODEL_PATH_META`, `DATA_PATH_META`, `UPLOAD_PATH_META` | 현행 엔드포인트용 저장 경로 (`~PATH\DT_META_FILE\...` 플레이스홀더) |
| `LOG_FILE`, `LOGGING`                                              | 로그 파일 경로(`logs/dt.log`), 자정 롤링 · 5일 보관                     |

> **`MODEL_AE_PATH_META` 누락 주의**
> `dt_data_api/common/settings_meta.py` 는 AutoEncoder 모델 저장 경로로 `MODEL_AE_PATH_META` 를
> 참조하지만 `settings.py` 에는 정의되어 있지 않아 기본값 `'localhost'` 로 동작합니다. 유효성 검증
> 도구 학습(`processorCreateAELearningModel`)을 사용하려면 다음 항목을 `settings.py` 에 추가하십시오.
>
> ```python
> MODEL_AE_PATH_META = "<경로>\\DT_META_FILE\\files\\storage\\model_ae\\"
> ```

> **`~PATH\DT\storage\...` 하드코딩 경로 주의**
> 일부 소스에는 저장 경로가 `settings.py` 가 아니라 코드에 직접 적혀 있으며, 배포본에서는
> 위 표와 동일한 `~PATH\` 플레이스홀더로 비워져 있습니다. 아래 세 곳은 **실행 시 실제로 사용**되므로
> 반드시 교체하거나 호출부에서 경로 인자를 넘겨야 합니다.
>
> | 위치                                                               | 동작                                                   |
> | ------------------------------------------------------------------ | ------------------------------------------------------ |
> | `dt/sql/preProcessSql.py` · `processorRegistrationMakeFileCsv`     | `filePath` 인자 생략 시 이 경로에 원본 샘플 CSV 생성    |
> | `dt/sql/preProcessSql.py` · `processorRegistrationMakeUserFileCsv` | `filePath` 인자 생략 시 이 경로에 사용자 파일 CSV 생성  |
> | `dt_data_api/model/rnnGenerater.py` · `output_file2`               | 증강 결과를 **고정 경로·고정 파일명**으로 매번 덮어씀   |
>
> 특히 세 번째 항목은 연도(`2023`) · 모델 ID(`9999`) 까지 고정된 디버그 잔재이므로, 운영 전에
> 제거하거나 호출부의 출력 경로를 사용하도록 수정할 것을 권장합니다.
>
> 그 밖의 `~PATH\` 표기는 각 View 의 `#테스트용` 요청 예시, 그리고 모델 스크립트의 주석·
> 문자열 블록 안에 있어 실행 경로에 영향을 주지 않습니다.

### 6.5 디렉터리 준비

`LOG_FILE` 은 **실행 디렉터리 기준 상대 경로**이므로, 프로젝트 루트에 `logs/` 디렉터리가 없으면 기동 시
오류가 발생합니다.

```bash
mkdir -p logs
```

`*_PATH*` 로 지정한 데이터 · 모델 저장 경로도 미리 생성하고 실행 계정에 읽기/쓰기 권한을 부여합니다.
학습 · 증강 서비스는 경로 하위에 `<연도>/<월>/<모델ID>/` 구조로 파일을 생성합니다.

### 6.6 Django 초기화 및 인증 토큰 발급

```bash
python manage.py migrate
```

본 API 의 모든 엔드포인트는 `IsAuthenticated` 와 `IsAdminUser` 를 함께 요구하므로, 호출용 계정은
**`is_staff` 권한을 가진 계정**이어야 합니다.

```bash
python manage.py createsuperuser
```

토큰은 `/api-token-auth/` 로 발급받거나 Django 관리자 화면(`/admin/`) 의 Tokens 메뉴에서 생성합니다.

```bash
curl -X POST http://<host>:8000/api-token-auth/ -d "username=<id>&password=<password>"
```

발급된 토큰을 관리 플랫폼의 `system.dt-api-key` 에, 서버 주소를 `system.dt-api-url` 에 설정합니다.

---

## 7. 실행

### 7.1 개발 서버

```bash
python manage.py runserver 0.0.0.0:8000 --noreload
```

`--noreload` 를 생략하면 소스 변경 시 자동 재기동되지만, 학습 작업 중 재기동되면 진행 중인 작업이
중단되므로 지정을 권장합니다.

### 7.2 백그라운드 실행

```bash
nohup python manage.py runserver 0.0.0.0:8000 --noreload > logs/nohup.out 2>&1 &
```

### 7.3 프로세스 확인 및 종료

```bash
ps -ef | grep "manage.py runserver"
```

```bash
kill -15 <PID>
```

> `runserver` 는 Django 개발용 서버입니다. 운영 환경에서는 `dt_data_api/wsgi.py` 를 진입점으로 하는
> WSGI 서버(gunicorn · uWSGI 등) 뒤에 배치하는 구성을 권장합니다. 학습 요청이 장시간 점유되므로 워커
> 수와 타임아웃을 학습 소요 시간에 맞춰 조정해야 합니다.

---

## 8. API 규격

### 8.1 인증

| 항목        | 내용                                                                     |
| ----------- | ------------------------------------------------------------------------ |
| 인증 방식   | `TokenAuthentication` (기본), `SessionAuthentication`                     |
| 요청 헤더   | `Authorization: Token <발급 토큰>`                                       |
| 권한        | `IsAuthenticated` + `IsAdminUser` — `is_staff` 계정만 호출 가능          |
| 토큰 발급   | `POST /api-token-auth/` (`username`, `password`)                         |
| 부가 경로   | `/admin/` (Django 관리자), `/api-auth/` (DRF 로그인)                     |

### 8.2 요청 · 응답 형식

모든 업무 엔드포인트는 `POST` · `GET` 을 함께 허용하며, 파라미터는 JSON 본문(`request.data`)으로
전달합니다. 라우터가 생성하는 URL 은 `/dt/<접두사>/<액션명>/` 형태이며 **후행 슬래시가 필요**합니다.

```bash
curl -X POST http://<host>:8000/dt/newpreproc/processorDatasetInfo/ -H "Authorization: Token <토큰>" -H "Content-Type: application/json" -d '{"file_path":"<경로>","file_name":"<파일>.csv","index_trgt_col":0}'
```

응답은 `dt/models/responseData.py` 의 고정 구조를 따릅니다.

```json
{ "code": 200, "message": "OK", "detail": "", "data": { } }
```

| 필드      | 설명                                                       |
| --------- | ---------------------------------------------------------- |
| `code`    | 성공 시 HTTP 상태코드(200), 실패 시 업무 오류코드 또는 400 |
| `message` | 결과 요약 (`OK` · `BAD_REQUEST` · 오류 명칭)               |
| `detail`  | 실패 시 예외 유형과 메시지                                 |
| `data`    | 처리 결과 (데이터셋 · 지표 · 목록 등)                      |

처리 실패 시에도 HTTP 상태는 200 으로 반환되고 `code` 로 성공 여부를 판별하므로, 호출 측은 반드시
`code` 를 확인해야 합니다. DRF 계층에서 발생한 예외(인증 실패 등)는
`config/exception_handler.py` 가 동일한 필드 구조로 변환합니다.

### 8.3 업무 오류 코드

`dt_data_api/common/enum.py` 의 `ERROR_CODE` 접두사와 일련번호를 조합해 `<접두사>-<번호>` 형식으로
반환됩니다 (예: `PP-0006`).

| 접두사 | 영역     | 접두사 | 영역     |
| ------ | -------- | ------ | -------- |
| `PP`   | 전처리   | `CD`   | 코드     |
| `AM`   | 증강모델 | `MN`   | 메뉴     |
| `AG`   | 증강     | `UI`   | 단위     |
| `AU`   | 권한     | `UE`   | 사용자   |
| `VR`   | 검증     |        |          |

### 8.4 라우터 목록

| URL 접두사           | ViewSet                            | 용도                          |
| -------------------- | ---------------------------------- | ----------------------------- |
| `/dt/newpreproc/`    | `metaPreProcessView`               | 전처리 · 검증 도구 학습(현행) |
| `/dt/metalearning/`  | `learningViewMeta`                 | 증강 도구 학습 (현행)         |
| `/dt/newaugment/`    | `metaAugmentView`                  | 데이터 증강 (현행)            |
| `/dt/user/` · `/dt/menu/` · `/dt/auth/` · `/dt/code/` · `/dt/unit/` · `/dt/vrfc/` | 기준정보 ViewSet | 운영 데이터 관리 |
| `/dt/preprocess/` · `/dt/learning/` · `/dt/augment/` · `/dt/augmentModel/` · `/dt/processor/` | 1세대 ViewSet | 초기 버전 엔드포인트 |
| `/dt/example/` · `/dt/sample/` · `/dt/meta/`                                     | 실험 · 예시 ViewSet | 의사결정나무 등 |

---

## 9. 운영 참고

| 항목        | 내용                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| 로그        | `logs/dt.log` (자정 롤링, 5일 보관) + 콘솔. 로거명 `dt`, 레벨 `DEBUG`                                     |
| SQL 로깅    | `django.db.backends` 로거가 `DEBUG` 로 설정되어 실행 쿼리가 콘솔에 출력됨. 운영 시 레벨 상향 권장         |
| 트랜잭션    | `db/query.py` 가 실행 단위로 `commit` · 예외 시 `rollback`. `execute_t*` 계열은 커밋 없이 호출 측이 제어  |
| 파일 경로   | 저장 경로는 관리 플랫폼과 동일해야 하며, 서버가 분리된 경우 공유 스토리지(NFS 등) 로 마운트 필요          |
| 실행 시간   | 학습 · 증강 요청은 동기 처리. 프록시 · WSGI 타임아웃을 학습 소요 시간보다 길게 설정                       |
| 언어 · 시간 | `LANGUAGE_CODE = "ko"`, `TIME_ZONE = "Asia/Seoul"`, `USE_TZ = True`                                       |
| 단독 모듈   | `dt_data_api/module/` 은 API 와 독립적으로 동작하는 LSTM-AE 학습 · 추론 CLI. 사용법은 해당 디렉터리의 [README](dt_data_api/module/README.md) 참조 |

---

## 10. 라이선스

본 저작물은 **GNU Lesser General Public License v2.1 (LGPL-2.1)** 로 배포됩니다.

- 라이선스 전문: 배포 루트의 [`COPYING.LGPLv2.1`](../../../COPYING.LGPLv2.1)
- 요약 안내: [`LICENSE_KR.md`](../../../LICENSE_KR.md)
- 제3자 오픈소스 고지: [`THIRD_PARTY_NOTICES.txt`](THIRD_PARTY_NOTICES.txt)

본 배포물은 소스 코드와 설정 파일로만 구성되며, 학습 데이터 · 모델 산출물 · pip 로 설치되는 라이브러리
바이너리는 포함되지 않습니다.

저장소에 소스가 직접 포함된 제3자 구성요소는 다음 2건이며, 각 디렉터리의 `LICENSE` 파일이 원문입니다.

| 구성요소            | 경로                             | 라이선스 | 저작권                       |
| ------------------- | -------------------------------- | -------- | ---------------------------- |
| BRITS (TensorFlow)  | `dt_data_api/model/brits/`       | MIT      | Copyright (c) 2022 Flavia Giammarino |
| N-BEATS (Keras)     | `dt_data_api/model/nbeatskeras/` | MIT      | Copyright (c) 2019 Philippe Rémy |

`requirements.txt` 에 고정된 119개 패키지 중 Intel · NVIDIA 독점 라이선스 5건과 약한 카피레프트 3건
(certifi · mariadb · tqdm) 은 별도 조건이 적용됩니다. 상세 분류는 `THIRD_PARTY_NOTICES.txt` 를
참조하십시오.
