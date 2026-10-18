# FeDiT/OPFW 프로젝트 저장소

이 저장소는 다양한 프로젝트와 기술 자료를 포함하고 있으며, 각 디렉토리는 특정 기능 또는 서비스를 담당합니다. 아래는 저장소의 폴더 구조와 각 폴더에 대한 설명입니다.


## 폴더 구조

```
/
├── data_repository
├── ml_knowledge_base
├── ml_prediction_manager
├── ml_prediction_models
├── modeling_simulation_engines
├── msa_device_api_gateway
├── msa_device_orchestrator
├── msa_dynamic_event_tracker
├── ontology_digital_twin_search
├── testbed
└── README.md
```



## 폴더 설명

### **`data_repository`**
- **설명**: 데이터 수집기 및 저장소 구현 소스코드와 문서 저장
- **담당 기관**: 진우소프트이노베이션
- **하위 폴더**:
  - `build`: 데이터 빌드와 관련된 파일
  - `deploy`: 데이터 배포와 관련된 파일

### **`ml_knowledge_base`**
- **설명**: 머신러닝 관련 지식베이스 소스코드와 문서 저장
- **담당 기관**: ETRI
- **하위 폴더**:
  - `doc`: 지식 자료에 대한 문서화
  - `release`: 릴리즈된 파일
  - `src`: 소스 코드

### **`ml_prediction_manager`**
- **설명**: 머신러닝 예측 매니저 소스코드와 문서 저장
- **담당 기관**: ETRI
- **하위 폴더**:
  - `configs`: 설정 파일
  - `data`: 데이터 관련 파일
  - `docs`: 문서화 파일
  - `models`: 머신러닝 모델 파일
  - `scripts`: 스크립트 파일
  - `src`: 소스 코드
  - `tests`: 테스트 코드

### **`ml_prediction_manager_v2`**
- **설명**: 머신러닝 예측 매니저의 백엔드, 웹 UI, 배포 설정, 테스트 및 실행 예제 저장 (2026년 제작)
- **담당 기관**: ETRI
- **적용기술**: FastAPI, Python 3.12, PostgreSQL, Kubernetes, Kubeflow, Ray, MLflow, KServe
- **주요 역할**: 데이터 수집, 데이터셋 관리, AutoML 학습, 모델 등록·배포, 모니터링 및 사용자별 실행환경 관리
- **하위 폴더**:
  - `app`: FastAPI 백엔드와 핵심 업무 로직
  - `docker`: Prediction Manager 연계 서비스용 Docker 이미지 구성
  - `examples`: Kubeflow Pipeline 및 재학습 실행 예제
  - `k8s`: Kubernetes 배포 Manifest
  - `scripts`: 설치·배포 설정 생성 스크립트
  - `static`: Prediction Manager 웹 UI 정적 파일
  - `tests`: 테스트 코드, 시험계획 및 시험결과 문서


### **`ml_prediction_manager_v2_frontend`**
- **설명**: FeDiT 통합 포털의 웹 프론트엔드 소스코드 저장 (2026년 제작)
- **담당 기관**: ETRI
- **적용기술**: React, TypeScript, React Router, Recoil, Axios, Chart.js
- **주요 역할**: FeDiT 통합 화면, 사용자·관리자 화면, 디지털 트윈 관리 화면 및 Prediction Manager를 포함한 예측기 생성·연동 도구의 진입 화면 제공
- **하위 폴더**:
  - `.husky`: Git 커밋 전에 코드 검사 등을 실행하기 위한 Git Hook 설정 파일
  - `public`: React 애플리케이션의 공개 정적 파일
  - `src`: FeDiT 프론트엔드의 실제 React·TypeScript 소스코드


### **`ml_prediction_models`**
- **설명**: 머신러닝 기반 예측 모델 소스코드와 문서 저장
- **담당 기관**: ETRI
- **하위 폴더**:
  - `dust_prediction/jupyter`: 미세먼지 예측 관련 노트북 파일
  - `parking_space_detection`: 주차 공간 검출 모델
  - `temperature_prediction`: 온도 예측 모델
  - `traffic_prediction`: 교통량 예측 모델

### **`modeling_simulation_engines`**
- **설명**: LBM 기반 해석기 5종(다성분, 다상, 농도확산, 복합 열전달, 유체-DEM 연성)의 실행 파일, 예제, 문서, 물리 식 소스, FeDiT 연동 API
- **담당 기관**: 이에이트㈜
- **하위 폴더**:
  - `release`: 실행 파일 묶음(Windows, Linux)과 사용 약관
  - `examples`: 해석기별 예제
  - `scripts`: 예제 실행 스크립트
  - `doc`: 입력·결과 형식과 확인 결과
  - `integration`: FeDiT 연동용 해석엔진 API와 Docker 이미지
  - `src`: 해석기 물리 식 소스

### **`msa_device_api_gateway`**
- **설명**: MSA 장치 API 게이트웨이 소스코드와 문서 저장
- **담당 기관**: ㈜티오이십일콤즈
- **하위 폴더**:
  - `doc`: 문서화 파일
  - `src/FeditApiGWService`: API 게이트웨이 소스 코드

### **`msa_device_orchestrator`**
- **설명**: 디바이스 오케스트레이션 소스코드와 문서 저장
- **담당 기관**: ㈜티오이십일콤즈
- **하위 폴더**:
  - `doc`: 문서화 파일
  - `release`: 릴리즈 파일
  - `src/MSAOrchestrationService`: 오케스트레이션 서비스 소스 코드

### **`msa_dynamic_event_tracker`**
- **설명**: 동적 데이터 이벤트 추적기 소스코드와 문서 저장
- **담당 기관**: ㈜티오이십일콤즈
- **하위 폴더**:
  - `doc`: 문서화 파일
  - `release`: 릴리즈 파일
  - `src/DataEventTrackingService`: 이벤트 추적 서비스 소스 코드

### **`ontology_digital_twin_search`**
- **설명**: 온톨로지 기반 디지털 트윈 검색 기술 소스코드와 문서 저장
- **담당 기관**: 한국기술교육대학교
- **하위 폴더**:
  - `doc`: 문서화 파일
  - `release`: 릴리즈 파일
  - `src/FederatedSearchRuleGenerator`: 검색 규칙 생성 소스 코드

### **`testbed`**
- **설명**: 테스트 환경 및 관련 파일 저장
- **담당 기관**: 제주테크노파크


---

이 저장소와 관련된 질문이나 요청 사항이 있다면 담당자에게 문의하세요!

