# 검증 기록

## 목표 서버에서 확인된 결과

근거: 2026-10-17 사용자가 전달한 목표 서버 실행 로그. 이 커밋 작성자가 서버에
직접 접속하여 실행한 결과가 아니다. 서버의 원본 전체 로그·인증 정보는 커밋하지 않는다.

- 소스: `725eb2edeec1b756b45abb809cdc4dc971a890bf`.
- 환경: Ubuntu 22.04 x86_64, 4 CPU, RAM 31GiB, A40 46068MiB, NVIDIA 535.309.01.
- 원본 설치기 + Keycloak 로컬 포워딩 v2 보정으로 완료.
- 최종 `EXIT=0`, `STAGE=complete`, `MODE=install`.
- `ALL_PODS_READY_OR_COMPLETED`, `PLATFORM_AND_KUBERNETES_GPU_SMOKE_PASS` 확인.
- FeDiT 및 Prediction Manager HTTP 200, Kubernetes node Ready.
- GPU 1개를 요청한 Kubernetes Pod에서 A40 `nvidia-smi` 성공.
- 실제 배포 Ray 이미지의 PyTorch `2.7.1+cu118` / CUDA `11.8`로 시험.
- 전달 로그에서 추출한 지표는 [target-gpu-smoke.json](evidence/target-gpu-smoke.json)에 보존.
- CPU 회귀/분류 10개(XGBoost, TabNet, RF, LightGBM, MLP), GPU 회귀/분류
  4개(XGBoost, TabNet), 모델 저장/재로드 및 예측 검증 통과.
- 설치 후 wrapper 종료 대기는 별도 문제로 남아 강제 종료를 안내했음.

## 이 커밋의 후속 보정

- 성공한 원본 설치 파일의 바이트와 SHA-256 보존.
- 알려진 Keycloak 단계/HTTPS 오류에만 자동 재개하는 `install.sh` 추가.
- 포워딩 프로세스를 권한 있는 helper가 직접 소유하도록 변경. Pod 교체 시 재연결.
- 종료는 stop 파일로 전달하며 자식 종료를 제한 시간 후 강제 처리.
  부모도 무기한 wait하지 않음. 정리가 끝나지 않으면 실패로 보고.
- 서비스 시작/중지 스크립트 포함. 데이터와 부팅 설정을 보존.
- 시작 시 명시적으로 중지된 Registry/FeDiT Docker 컨테이너도 직접 재시작.

로컬 검사 명령:

```bash
python3 tests/check_server_scripts.py
```

검사는 원본 SHA-256, 모든 셸 문법, 실제 고정 소스에 대한 런타임 패치 적용,
Keycloak 요청 5곳의 재시도, Pod 교체를 모의한 포워딩 재연결과 종료를 확인한다.
서비스 시작/중지 순서, 컨테이너 중지 실패 보고, 알려진 오류만 자동 재개하는
분기도 모의 검사한다. 이 검사는 sudo·파일 잠금 자체를 검증하는 시험은 아니다.
모의 검사에서는 실제 Kubernetes나 systemd 서비스를 변경하지 않는다.

2026-10-17 로컬 실행 결과:

```text
PASS pinned checksum, Bash syntax and actual runtime patches
PASS Pod replacement reconnect and bounded cleanup of TERM-resistant child
PASS service ordering, unchanged boot settings and container-stop failure reporting
PASS recovery only for the failed Keycloak stage with exact HTTPS rejection; unrelated failures and test mode preserved
```

후속 자동 재개 진입점, 종료 처리 변경 및 서비스 제어 스크립트를 목표 서버에서
새로 실행한 결과는 아직 없다. 위 서버 통과 기록을 후속 변경 전체의 실서버
통과로 확대 해석하지 않는다.
