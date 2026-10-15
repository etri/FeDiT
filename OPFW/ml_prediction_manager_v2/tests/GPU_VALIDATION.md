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

미검증 범위: A40 서버에서의 실제 실행, Linux GPU 이미지 빌드/컨테이너 실행,
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
