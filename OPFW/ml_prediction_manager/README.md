# ML Prediction Manager - 폴더 구조 설명

## 프로젝트 구조
`ml_prediction_manager` 프로젝트는 체계적이고 효율적인 관리 및 협업을 위해 다음과 같은 폴더 구조를 채택했습니다. 각 폴더의 목적과 내용은 아래에 설명되어 있습니다.

```
ml_prediction_manager/
│
├── docs/                 # 설계 문서 및 관련 자료
├── src/                  # 소스코드
├── models/               # 머신러닝 모델 파일
├── data/                 # 데이터셋 (원본 및 전처리 데이터)
├── notebooks/            # Jupyter Notebook 및 실험 파일
├── tests/                # 테스트 코드
├── configs/              # 설정 파일 (configurations)
└── scripts/              # 실행 스크립트 또는 유틸리티
```

---

## 폴더별 상세 설명

### `docs/` (Documentation)
- 프로젝트 설계 문서, 요구사항 정의서, 다이어그램 등을 저장합니다.
- 주요 파일:
  - `architecture.md`: 시스템 아키텍처 설명 문서
  - `예측매니저 상세설계서_v1.0.pdf`: 예측매니저 상세설계 문서

---

### `src/` (Source Code)
- 핵심 소스 코드가 저장되는 폴더입니다.
- 주요 파일 및 하위 폴더:  
  - `manage.py`: 메인 실행 파일
  - `requirements.txt`: 사전에 설치해야 하는 패키지 모음

---

### `models/` (Machine Learning Models)
- 학습된 모델 파일 및 관련 파일을 저장합니다.
- 주요 파일 예:
  - `models/dust/`: 미세먼지 추정 모델 학습 및 추론 서비스 코드
  - `models/temperature/`: 미세먼지 추정 모델 학습 및 추론 서비스 코드

---

### `data/` (Datasets)
- 데이터셋 및 데이터 처리 결과를 저장합니다.
- 하위 폴더 구조:
  - `data/raw/`: 원본 데이터
  - `data/processed/`: 전처리된 데이터
  - `data/results/`: 결과 데이터

---

### `notebooks/` (Jupyter Notebooks)
- 데이터 분석, 실험 및 모델 학습에 사용되는 Jupyter Notebook 파일을 저장합니다.
- 주요 파일:
  - `notebooks/eda.ipynb`: 데이터 탐색 분석 (EDA)
  - `notebooks/train_model.ipynb`: 모델 학습 코드

---

### `tests/` (Test Cases)
- 프로젝트의 테스트 코드를 저장합니다.
- 주요 파일:
  - `tests/test_main.py`: 메인 코드 테스트

---

### `configs/` (Configuration Files)
- 설정 파일 및 환경 변수 관련 파일을 저장합니다.
- 주요 파일 예:
  - `configs/model_config.yaml`: 모델 학습 관련 설정
  - `configs/database.ini`: 데이터베이스 연결 정보

---

### `scripts/` (Utility Scripts)
- 실행 가능한 스크립트 파일이나 자주 사용하는 유틸리티를 저장합니다.
- 주요 파일 예:
  - `scripts/run_training.sh`: 모델 학습 실행 스크립트
  - `scripts/cleanup_data.py`: 데이터 정리 스크립트

---

## README 관리
각 폴더에는 해당 폴더의 내용을 설명하는 `README.md` 파일을 포함하여 폴더의 목적과 사용법을 명확히 합니다. 예를 들어:
- `src/README.md`: 예측 매니저 프로그램 설치 설명
- `docs/README.md`: 설계 문서 관리 방침
- `data/README.md`: 데이터셋 구성 및 사용 방법


---

### 참고
이 폴더 구조는 확장 가능하며, 프로젝트의 요구사항에 따라 조정될 수 있습니다.

