# GPU 변경 검증 기록

검증일: 2026-10-15 (Asia/Seoul). GitHub에서 새로 clone한
`OPFW_development_ETRI_pman` / `fee2de9862f87f00f65de5d48329a59656f3c117`을 기준으로 했다.
이전 `fedit_sources` 복사본과 이전 컨테이너를 실행 환경으로 사용하지 않았다.
실행 환경은 사용자 홈 아래 새 Windows Python 3.11.9 가상환경이다.

| 항목 | 결과 |
|---|---|
| 실제 GPU | RTX 3050 Laptop 4096MiB / driver 537.13 |
| 학습 스택 | PyTorch 2.7.1+cu118, Ray 2.54.1, XGBoost 2.1.4, TabNet 4.1.0 |
| 추적/데이터 스택 | MLflow 3.11.1, sklearn 1.7.2, NumPy 2.4.6, pandas 2.3.3 |
| 의존성 | `pip check` 통과 |
| 단위 회귀 테스트 | `test_automl_gpu.py` 7개 통과 |
| CPU 학습/평가/joblib 재로드 | 5개 모델 × 분류/회귀 = 10개 조합 통과 |
| CUDA 학습/평가/CPU 산출물 재로드 | XGBoost/TabNet × 분류/회귀 = 4개 조합 통과 |
| MLflow 패키지 저장/재로드/DataFrame 예측 | XGBoost/TabNet × CPU/GPU × 분류/회귀 = 8개 조합 통과 |
| 실제 Ray GPU worker | XGBoost/TabNet × 분류/회귀 = 4개 조합 통과 |
| 전체 AutoML 실행 함수 | Optuna → Tune GPU trial → HTTP MLflow 등록, 2개 모델 모두 통과 |
| 배포 manifest | 두 renderer에 서버 배치 512 / 동시 trial 1 / worker RAM 8GiB / GPU 전용 image tag 전달 확인 |
| 구문 | 수정 Python, JavaScript, Bash, PowerShell 검사 통과; `git diff --check` 통과 |

전체 AutoML 점검은 합성 분류 데이터 160행/8 feature, 모델당 trial 1개,
CPU 1, GPU 1, Ray 논리 메모리 요청 0.5GiB, 배치 64, TabNet 2 epochs로 수행했다.
두 모델 모두 `best_metric`과 `top_models` 1개가 생성되었다. 마지막 점검의 accuracy는
XGBoost 0.96875, TabNet 0.6875였다. 이는 동작 점검 결과이며 실제 데이터의
모델 품질이나 최적 배치/처리량을 입증하는 벤치마크가 아니다.

검증 과정에서 재현하고 수정한 문제:

- GPU 요청 시 XGBoost CPU 실행, TabNet 자동 장치 선택.
- TabNet MLflow pyfunc에 DataFrame을 전달할 때 행 인덱싱 오류.
- CUDA 학습 TabNet의 CPU export 시 등록되지 않은 attention/group tensor가 CUDA에 남는 문제.
- Windows Ray Tune의 파라미터 포함 trial 디렉터리 이름 길이 초과.
- Windows MLflow 점검 서버의 artifact 경로 URI 처리와 CP949 Unicode 로그 오류.
- Windows checkout에서 Bash 스크립트 줄바꿈 변환.

재실행 명령은 `GPU_DEVELOPMENT.md`에 있다. 원시 로그와 자원 스냅샷은 checkout의
`tmp/`에 보관하며 Git에는 포함하지 않는다. 점검용 Ray/MLflow 프로세스는 종료했다.

이 시점의 미검증 범위는 아래 Linux 추가 검증에서 갱신한다. A40 서버에서의 실제 실행,
Kubernetes/Kubeflow 전체 배포, KServe 추론 런타임 준비, 실제 대용량 데이터,
다중 사용자 부하, 10.254.254.x subnet의 전체 서비스 수용량.
서버의 `/data` 사용자 쓰기 권한, Docker 접근, NVIDIA runtime, Kubernetes 사전
구성은 아직 준비되지 않았다. 서버 배포 완료나 전체 플랫폼 운영 안정성을 의미하지 않는다.

## WSL 외부 통신 추가 점검

같은 날 일반 사용자 `user`로 재점검했다. 네트워크 설정/방화벽 변경이나 WSL
재시작 없이 PyPI/PyTorch/GitHub/Docker Registry DNS가 모두 응답했다.
PyPI와 PyTorch HTTPS는 200, private GitHub URL은 미인증 404,
Docker Registry `/v2/`는 정상 인증 요구 응답 401을 받았다.
`pip download --no-deps packaging==25.0`으로 실제 wheel을 내려받았고,
`docker manifest inspect docker.io/library/python:3.12-slim`도 성공했다.
현재 통신은 정상이며 이전 장애의 원인은 확정하지 않았다. 이 점검은 Linux
GPU 이미지 빌드나 전체 Kubernetes 검증을 대신하지 않는다.

## Linux 컨테이너 추가 검증 (2026-10-15)

새 클론의 같은 작업 브랜치로 Ray GPU 이미지와 실제 백엔드 Dockerfile을 빌드했다.
Python 3.12, torch 2.7.1+cu118, XGBoost 2.1.4, Ray 2.54.1, MLflow 3.11.1,
scikit-learn 1.7.2의 Linux 학습 조합을 확인했다. 학습 이미지와 백엔드 모두
`pip check`가 통과했다. 테스트 코드는 읽기 전용 bind mount이며 GPU 작업은
이미지의 `ray` 사용자, 백엔드 및 기존 테스트는 uid/gid 1000으로 실행했다.

| 검사 | 결과 |
| --- | --- |
| 기존 PostgreSQL 연결 단위 테스트 | 27개 통과 |
| GPU 요청·기본 설정 검증 | 9개 통과 |
| 데이터 읽기·경로·오류 검사 | 6개 통과 |
| CPU 학습 / GPU 학습 | 10개 / 4개 통과 |
| Ray worker의 실제 GPU 학습 | 4개 통과 |
| MLflow 패키지 저장·DataFrame 추론 | 8개 통과 |
| Tune/Optuna → GPU → HTTP MLflow 통합 | XGBoost·TabNet 모두 지표와 top model 생성 |
| GPU 없는 별도 컨테이너에서 GPU 산출물 재읽기 | joblib/MLflow 총 8개 통과 |
| GPU 없는 MLflow 모델 서버의 실제 HTTP 예측 | XGBoost·TabNet 분류/회귀 총 4개 통과 |
| 실제 백엔드 HTTP 검사 | 시작 후 22개, API 단독 재시작 후 22개 통과 |
| 렌더링된 Kubernetes 기본 리소스 공식 스키마 검사 | 14개 통과 |

데이터 읽기 검사는 한글·공백 경로, 쿼리 문자열이 붙은 HTTP Parquet,
다운로드 한도 초과 및 임시 파일 정리, 파일 없음/HTTP 404, 읽기 권한 없음,
학습 불가능 데이터 거부를 포함한다. 기존 원격 데이터 로더의 임시 파일 미정리와
열린 핸들 재사용, URL 확장자 판단을 수정했다. 잘못된 환경변수 기본 자원 값과
빈 모델 선택도 거부한다. Docker 소켓 연결을 import 시 강제하던 미사용 전역
객체를 제거해, 소켓 없는 일반 사용자 API 시작을 실제 확인했다.

HTTP 검사는 HTML/문서/OpenAPI, AutoML 목록/큐 설정, 인증 누락 401,
잘못된 설정 422, 데이터셋 생성·CSV 업로드·프로파일·전처리·조회·삭제,
존재하지 않는 데이터셋 404를 포함한다. DB 준비 확인 후 API를 시작했고,
API 재시작 작업의 완료를 기다린 뒤 같은 검사를 다시 통과했다.
앞서 WSL 중단과 검증 시작/재시작이 겹친 시도의 DNS 오류는 통과로 집계하지 않았다.

통합 검증은 160행 합성 데이터, 모델당 trial 1개, 2 epochs, 배치 64,
단일 GPU/단일 trial이다. 마지막 Linux 결과는 XGBoost accuracy 0.96875,
TabNet 0.875였으며 모델 성능 벤치마크가 아니다.

자원 실패도 재현했다. 약 8GiB WSL과 여러 검증 서비스를 함께 사용하면 Windows
여유 RAM이 고갈되고 WSL 응답이 지연됐다. 3GiB 컨테이너에서는 Ray가 노드 사용량
2.89/3.00GiB에서 worker를 중단했고, 4GB WSL에서는 스왑까지 부족해졌다.
최종 GPU 통합 검증은 WSL 6GB/4 CPU/스왑 4GB, 컨테이너 4GiB/CPU 2,
추가 API/DB 정지, MLflow 비동기 평가 작업자 비활성화로 통과했다.
GPU 단계 이후 WSL을 재시작해 메모리를 회수하고 API/DB 단계를 분리했다.
전체 플랫폼을 이 PC에 상시 동시 실행할 수 있다는 의미가 아니다.

WSL의 systemd 서비스만으로는 인스턴스 수명이 유지되지 않는다.
백그라운드 API/DB를 검증할 때는 WSL 셸을 열어 유지하거나, 같은 foreground
검증 세션 안에서 시작·준비 확인·검사·종료를 수행해야 한다.
[Microsoft WSL systemd 문서](https://learn.microsoft.com/en-us/windows/wsl/systemd).

기존 Docker 설정의 `docker-credential-desktop.exe` 부재도 재현했다. 기존 인증
설정을 덮어쓰지 않고 사용자 홈의 별도 빈 Docker 설정으로 공개 베이스 이미지를
빌드했다. GPU는 WSL 장치 `/dev/dxg`와 `/usr/lib/wsl` 연결로 검증했으며,
표준 NVIDIA Docker runtime 등록은 변경하거나 검증하지 않았다.
검증 네트워크는 겹치지 않는 `10.254.254.224/28`을 사용했다.

스키마는 Kubernetes v1.30.14 공식 OpenAPI를 사용했고 IntOrString 형식을
정수/문자열로 처리했다. Istio VirtualService/AuthorizationPolicy 2개와 CRD 실행은
이 검사에 포함하지 않았다. 실제 API server admission, PVC 바인딩, CNI와 DNS,
GPU device plugin 및 Ray autoscaler/KServe의 Kubernetes 실행도 미검증이다.

남은 범위는 A40 서버 실행, 전체 Kubeflow·KServe 설치/연동, 실제 업무 데이터와
장기·다중 사용자 부하, `/24` 전체 네트워크 주소 수용량 검증이다. 서버 관리자
사전 준비와 디스크/사용자 권한 문제도 그대로 남아 있다. 서버는 변경하지 않았다.
