# GPU 개발 및 서버 이관

2026-10-15 사용자 제공 서버 출력과 로컬 직접 조회를 기준으로 작성했다.
기준 소스는 `OPFW_development_ETRI_pman`의 `fee2de9862f87f00f65de5d48329a59656f3c117`이다.

## 확인한 자원

| 항목 | 로컬 개발 PC | 설치 대상 서버 |
|---|---|---|
| OS | Windows, WSL2 Ubuntu 22.04 | Ubuntu 22.04.3, VMware VM |
| CPU | i5-1340P, 16 logical CPUs | Xeon Gold 6254, VM에 할당된 4 vCPU |
| RAM | 16GB; WSL 약 7.6GiB | 약 31GiB, 점검 시 available 약 28GiB |
| GPU | RTX 3050 Laptop, 4096MiB | A40, 46068MiB; 점검 시 free 45415MiB |
| NVIDIA driver | Windows 537.13 | Linux 535.309.01 |
| 사용자 저장소 | Windows C: 약 1TB 여유 | `/home/jejutp`가 있는 `/`는 18GB 여유 |
| 별도 데이터 디스크 | WSL 파일시스템 여유 약 822GB | `/data` 약 1004GB 여유, root 소유, 사용자 쓰기 불가 |
| Container runtime | WSL Docker 29.1.3, 기존 컨테이너 존재 | Docker 27.1.2 / containerd 1.7.20 |
| GPU 컨테이너 / K8s | 기존 Docker에 NVIDIA runtime 미등록 | Toolkit / kubectl 없음, 일반 사용자 Docker socket 접근 불가 |

`nvidia-smi`의 CUDA 12.2 표시는 호스트 드라이버 지원 수준이며 설치된 PyTorch
CUDA 런타임 버전과 별개다. 두 호스트를 함께 검증할 기준으로 PyTorch 2.7.1
CUDA 11.8 wheel과 XGBoost 2.1.4를 고정했다. 드라이버를 변경하지 않는다.
GPU worker 이미지 태그는 `ray-mlflow:2.54.1-gpu-cu118`로 분리하여 기존 CPU
이미지 태그/캐시와 구별한다.

## 실제 학습 경로

- XGBoost: GPU 요청 시 CUDA 지원 wheel을 확인하고 `device=cuda`, `tree_method=hist`로 학습한다.
  학습 후 booster 설정도 검사하여 CPU fallback을 성공으로 기록하지 않는다.
- TabNet: GPU 요청 시 CUDA 가용성을 검사하고 `device_name=cuda`를 명시한다.
  CPU 요청은 GPU가 있어도 `device_name=cpu`다.
- RF, LightGBM, sklearn MLP는 CPU 경로다. 이 모델만 선택하면서 GPU를 요청하면
  요청을 거절한다. CPU/GPU 모델을 함께 선택하면 GPU 가능 모델에만 GPU를 예약한다.
- 각 trial은 Ray Tune GPU 리소스를 요청한다. 이 구현은 단일 GPU 학습이며 trial당
  최대 1 GPU다. 분수 GPU와 NVIDIA time-slicing은 VRAM을 격리하지 않는다.
- `gpu_memory_fraction`은 PyTorch allocator 한도다. XGBoost/다른 프로세스의 GPU
  메모리나 데이터 전체 RAM 사용량을 제한하는 공통 장치가 아니다.
- 동시 trial 기본값은 1이다. 작은 표 데이터에는 GPU가 CPU보다 느릴 수도 있다.
- GPU 학습이 끝나면 XGBoost 장치 설정과 TabNet network/optimizer tensor를 CPU로
  내보낸다. TabNet 패키지는 sklearn Pipeline에서 DataFrame→float32 배열 변환을
  수행하므로 MLflow pyfunc 입력도 처리한다. TabNet 추론 런타임에는 여전히 같은
  PyTorch 릴리스와 pytorch-tabnet 패키지가 필요하며 기본 KServe 이미지에 있다고
  가정하지 않는다. 학습 GPU 할당과 추론 런타임 준비는 별도로 검증한다.

## 일반 사용자 로컬 설정

소스, 가상환경, 결과는 사용자 홈 아래 checkout에 둔다. `/root`와 시스템 Python을
사용하지 않는다. Windows PowerShell에서 프로젝트 디렉터리로 이동한 후:

```powershell
./scripts/setup-local-gpu.ps1
./.venv/Scripts/python.exe scripts/resource-profile.py --output tmp/local-resources.json
./.venv/Scripts/python.exe -m unittest discover -s tests -p test_automl_gpu.py -v
./.venv/Scripts/python.exe scripts/gpu-smoke-test.py --require-gpu --mlflow --ray
./.venv/Scripts/python.exe scripts/automl-gpu-integration.py
```

WSL은 Linux 통합 검증 후 `memory=6GB`, `processors=4`, `swap=4GB`로 조정했다.
기존 NVIDIA 커널 경로를 유지했고 `.wslconfig.pman-validation-backup-20261015`로
사용자 홈에 원본을 백업했다. 약 8GiB 기본 상태에서는 Windows 여유 RAM 고갈과
WSL 응답 정지를 재현했고, 4GB 제한에서는 Linux 메모리/스왑 부족을 재현했다.
6GB/4GB 스왑에서 다른 검증 서비스를 정지하고 GPU 통합 검증을 순차 수행했다.
이 환경에서는 전체 Kubeflow를 새로 설치하지
않고 Windows 사용자 가상환경으로 실제 CUDA 학습을 먼저 검증했다. 최초 WSL
점검에서는 DNS/HTTPS 실패가 있었으나, 같은 날 추가 점검에서 DNS와 HTTPS가
정상 응답했고 pip wheel 다운로드와 Docker manifest 조회도 성공했다. 추가 점검
중 네트워크 설정이나 방화벽을 변경하지 않았으므로 복구 원인은 확정하지 않는다.
WSL 통신을 지속적인 차단 상태로 간주하지 않으며 Linux 검증에 다시 사용할 수 있다.
Windows Python 3.11과 배포 이미지 Python 3.12의 차이가 있으므로 로컬 학습 성공을
Linux Kubernetes 배포 성공으로 간주하지 않는다.
Windows 설정 스크립트는 Python 프로세스에 UTF-8을 적용한다. 전체 AutoML 점검
스크립트도 한글 Windows에서 UTF-8로 재실행하며 OS 언어/보안 설정은 변경하지 않는다.
실제 수행 결과와 미검증 범위는 `tests/GPU_VALIDATION.md`에 기록했다.

Linux 검증은 새 클론의 코드를 읽기 전용으로 `/home/ray/source`에 연결해 수행했다.
GPU 이미지의 실행 사용자는 `ray`, API 검증 사용자는 uid/gid 1000이다. WSL에서는
호스트 NVIDIA 런타임 설정을 수정하는 대신 `/dev/dxg`와 `/usr/lib/wsl`을 컨테이너에
연결했다. 서버의 표준 NVIDIA Container Toolkit/device plugin 검증을 대신하지 않는다.
검증용 Docker 네트워크는 `10.254.254.224/28`이며 기존 네트워크를 변경하지 않았다.
GPU 이미지 크기는 약 9.06GB, 백엔드는 약 1.79GB(압축 전)였다. 빌드 중간 파일과
Kubernetes 전체 이미지까지 필요하므로 서버 루트의 여유 18GB로 진행하지 않는다.

추가 재실행 도구:

```bash
# GPU 컨테이너에서 학습 산출물 생성. 출력 디렉터리는 사용자 소유 쓰기 가능 경로.
python scripts/gpu-portability-test.py export /home/ray/portability
# GPU 없는 별도 컨테이너: joblib/pyfunc 및 실제 HTTP 모델 서버 예측 검증.
python scripts/gpu-portability-test.py verify /home/ray/portability
# 임시 PostgreSQL이 연결된 실제 API에 수행. 데이터셋을 생성한 뒤 삭제한다.
python scripts/api-smoke-test.py --url http://pman-validation-api:8000
```

`automl-gpu-integration.py`의 임시 MLflow는 tracking/artifacts 검증에 필요 없는
비동기 평가 작업자(`MLFLOW_SERVER_ENABLE_JOB_EXECUTION=false`)를 끈다.
이 설정 없이 추가 작업자가 뜬 환경에서는 Ray 메모리 부족 종료를 재현했다.
운영 MLflow의 비동기 평가 기능이나 배포 설정을 이 점검으로 변경하지 않는다.
백그라운드 API/DB 검증 중에는 WSL 셸을 열어 유지한다. systemd 서비스만으로
WSL 인스턴스가 계속 실행되는 것은 아니다. 검증 서비스의 시작과 재시작은
직전 명령이 끝난 것을 확인한 뒤 수행하고, DB 준비 후 API를 시작한다.

`scripts/profiles/local-rtx3050.env.example`은 배치 64, 단일 trial, PyTorch 메모리
비율 0.75를 사용한다. 서버 프로필은 배치 512, 단일 trial, 비율 0.8이며 GPU worker
CPU limit 1, RAM limit 8GiB다. 서버 CPU 4개 중 나머지는 제어 서비스와 데이터
처리에 남긴다. 초기값이며 최적 성능을 보장하는 벤치마크 결과가 아니다.
프로필은 기존 설치 설정 파일에 병합해서 사용한다. `.env.example`에 필요한 URL,
스토리지, 시크릿을 갖추기 전에는 프로필 단독으로 앱을 실행하지 않는다.

학습 요청에서 `gpu_per_trial=1`을 명시해야 GPU 학습한다. UI 기본 GPU 값은 0이다.
점검 중 로컬 available RAM은 약 4GiB였다. 작은 점검 데이터는 로컬 trial RAM
요청 0.5GiB, 서버는 4GiB로 시작하고 실제 데이터 전처리 메모리를 측정한다.
Ray의 trial RAM 값은 스케줄링 요청이며 프로세스 메모리를 강제로 제한하지 않는다.
작은 GPU 배치가 대형 모델이나 큰 데이터셋의 OOM을 모두 예방하지는 않는다.

## 서버 이관 전 확인 사항

현재 사용자는 `jejutp`, 홈은 `/home/jejutp`이며 docker 그룹에 속하지 않는다.
관리자 작업 없이 기존 설치 스크립트로 Kubernetes/Container Toolkit을 설치할 수 없다.
현재 요청 범위에서는 서버 권한, 그룹, 드라이버, 디스크, Docker 설정을 변경하지 않았다.

1. 홈에 clone하고 사용자 가상환경으로 개발한다. `/root`에 소스나 상태를 두지 않는다.
2. 서버 배포 전에 관리자가 사용자 소유 데이터 디렉터리(예: `/data/jejutp`)와 runtime
   스토리지 배치를 준비해야 한다. 홈의 가용 18GB만으로 이미지 빌드와 전체 배포를 진행하지 않는다.
   임의 삭제/prune, 데이터 이동, 권한 변경은 하지 않는다.
3. 관리자 사전 작업으로 NVIDIA Container Toolkit, GPU 컨테이너 런타임,
   Kubernetes 및 사용자용 kubeconfig가 필요하다. Docker 소켓 접근 권한도 별도 문제다.
4. 준비된 서버에서 이미지 빌드, NVIDIA device plugin 등록, allocatable GPU 확인,
   GPU worker 기동, 실제 AutoML→MLflow 산출물→추론 검증을 수행해야 한다.
5. `GPU_TIME_SLICES=1`로 시작한다. A40 VRAM이 크다는 이유만으로 여러 tenant나
   trial을 동시에 배치하지 않는다. 4 vCPU 제약과 전체 서비스 메모리를 먼저 측정한다.

## 10.254.254.x 네트워크 검토

요청한 범위는 전체 `/24`(256개 주소)뿐이다. Pod/Service/Docker에 같은 서브넷을
중복 사용하면 안 된다. 아직 서버 네트워크는 변경하지 않았다.
단일 노드 검토안은 Pod `10.254.254.0/25`, Service `10.254.254.128/26`,
Docker bridge `10.254.254.192/28`, 추가 Docker pool `10.254.254.224/27`(각 `/28`)이다.
이 안은 Pod 약 128개와 Service 약 64개라는 작은 주소 예산이다. kubeadm의 기본
node CIDR `/24`를 그대로 쓰면 Pod `/25`와 맞지 않으므로 node CIDR mask와 Calico
pool/block 설정을 함께 수정해야 한다. 현 설치기에 이 CIDR 값만 넣어 실행하면 안 된다.
실제 서비스·Pod 수와 tenant 확장 수를 산정하기 전에는 적용하지 않는다.
범위가 부족하면 설치 전에 사용자와 더 큰 10.x 주소 범위를 결정한다.

## 근거

- [PyTorch 공식 이전 버전 설치 조합](https://pytorch.org/get-started/previous-versions/)
- [Ray GPU 리소스 및 장치 가시성](https://docs.ray.io/en/latest/ray-core/scheduling/accelerators.html)
- [XGBoost GPU 학습](https://xgboost.readthedocs.io/en/stable/gpu/)
- [TabNet 구현과 학습 파라미터](https://github.com/dreamquark-ai/tabnet)
