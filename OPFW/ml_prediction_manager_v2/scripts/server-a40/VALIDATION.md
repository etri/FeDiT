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

## 최신 스크립트의 새 Ubuntu 22.04 설치 시험 (2026-10-18)

시험한 소스: `a65490197eea91b3f9fbf20c906c9687f1d93739`. 이후 검증 문서/증거만 추가하며 설치 코드의 바이트는
변경하지 않는다. [정규화된 실행 결과](evidence/clean-ubuntu22-20261018.json)에
공개 보고서·전체 검증 ZIP의 SHA-256과 시험 범위를 기록한다.

- 공식 Ubuntu 22.04.5 rootfs에서 WSL2 환경을 새로 생성했다. 4 CPU,
  메모리 한도 13GiB, swap 16GiB, RTX 3050 Laptop 4GB를 사용했다.
- 시험용 `/data`는 파일 기반 loop 장치에 직접 입출력(DIO)을 켠 별도 256GiB
  ext4 파일시스템이다. 이 설정은 설치 시작 전에 적용했다. Git 소스 외 패키지·빌드·이미지
  캐시를 가져오지 않았고 Docker/containerd/Kubernetes 미설치 상태에서 시작했다.
- 일반 사용자로 저장소의 `bash install.sh`를 한 번 실행해 설치·앱 갱신·실제
  PVC 시험까지 `EXIT=0`, `STAGE=complete`, `FEDIT_INSTALL_AND_SANDBOX_PASS`를 확인했다.
  이 최종 실행 도중 수동 복구나 설치 재개를 하지 않았다.
- CPU 회귀/분류 10개, GPU 회귀/분류 4개의 학습·모델 저장·재로드·예측을
  설치 직후와 서비스 재시작 후 각각 통과했다.
- 사용자 이미지의 생성·Registry 등록·목록·태그·삭제와 Docker fallback을
  시험했다. 같은 이미지 ID를 공유하는 플랫폼 태그와 기존 이미지들을 보존했다.
- 실제 사용자 PVC 생성, Pod 마운트·읽기·쓰기, 사용 중 삭제 차단,
  0 replicas Deployment 참조의 삭제 차단, 최종 삭제와 기존 PVC UID 보존을 통과했다.
- Keycloak Pod를 실제 교체해 포워딩 재연결과 제한 시간 내 종료를 확인했다.
  일회 인증 후 sudo ticket 유지와 종료 후 만료도 임시 계정으로 확인했다.
- 배포된 Ray GPU worker와 같은 CPU·메모리·GPU 요청의 Pod를 UID 1000으로
  실행해 실제 CUDA 텐서 연산과 시험 Pod 정리를 확인했다.
- GPU 온도·GPU 메모리의 DCGM 지표와 Prometheus의 GPU 온도 수집 결과를 실제 조회했다.
  이 시험 장치의 DCGM은 `GPU_UTIL` 지표를 내보내지 않았다. 추가 검사에서 이를
  필수로 요구해 중단됐던 기록과 미노출 관측 결과를 별도로 보존했다.
  추가 검사 조건만 보정했으며 통과한 설치나 제품 코드는 다시 바꾸지 않았다.
- 시작·중지 파일 두 개만 별도 폴더로 복사해 전체 중지·시작을 실행하고
  포트·Pod·HTTP 응답 및 데이터 보존을 확인했다.
- 실제 브라우저의 Images·Volumes 화면에서 사용자 시험 항목 표시와 플랫폼
  구성요소 제외를 확인했다. 시험 항목은 UID/이미지 ID 확인 후 API로 정리했다.
- 최종 로그를 보존한 뒤 이 작업의 시험 VM과 Docker/containerd 이미지를 삭제하고,
  시험 때문에 변경한 호스트 WSL 설정도 원래 바이트로 복원했다.

## 설치기 보완과 회귀 검사

플랫폼 기본 소스는 `725eb2ed`에 고정하며, 앱과 정적 파일은 실행한 저장소의
커밋으로 갱신한다. wrapper는 보완했으므로 과거 A40 원본 파일과 해시가 다르다.
현행 wrapper SHA-256: `8c24984e888eec190d83bc9f1bc35ca37dfc3e2f5018ed3909b01dc46546bbee`.

전체 Kubeflow 이미지 사전 확보, 대형 이미지 다운로드 시간과 서비스 기동 대기
분리, 명시적 Registry 경로, DCGM 사전 다운로드, Registry 토큰 갱신·이어받기·
파일 해시 검사, Git 소스 재사용, 진단용 용량 집계 제한, 새 tenant Pod의 불필요한 재시작 방지,
NiFi CPU 배분, Label Studio 전용 자원·startup probe 보존, 실제 HTTP 준비 대기 시간, PostgreSQL 준비 검사와 CPU 몫 보존, 누락된 Istio 보조 컨테이너 예약 정합성, sudo ticket 유지, Keycloak 연결/종료,
실제 Nginx 응답 전환 대기와 컨테이너 중지 시간을 보완했다.

Docker IPAM과 실제 docker0 주소가 달라 이미지 빌드의 DNS가 실패했던 이전
새 설치 시험은 실패로 보존했다. 보완은 설치기 소유의 bridge 프로파일만
확인하고 필요한 gateway 주소만 복원한다. 다른 주소·네트워크를 지우지 않는다.
이후 공식 rootfs로 환경을 다시 생성해 위 최종 시험을 진행했다.

최종 커밋으로 진행한 앞선 시험에서는 시험용 loop 디스크의 중복 캐시와 함께
큰 메모리·입출력 대기 및 tenant 기동 실패를 관찰했다. 실패 기록을 보존한 뒤
직접 입출력 전환 진단에서 메모리 대기가 약 80%에서 1% 미만으로 줄고 NiFi·Ray가
준비 상태가 되는 것을 확인했다. 이 진단 실행은 설치 성공으로 집계하지 않았다.
앱 코드를 바꾸지 않고 새 rootfs에서 DIO를 먼저 적용한 뒤 위 최종 설치를 진행했다.
원래 목표 서버의 `/data`는 실제 별도 디스크이며 이 loop 장치 설정은 시험 환경에만 해당한다.

`python3 tests/check_server_scripts.py` 전체 검사를 통과했다. 셸 문법·체크섬과
실제 고정 소스 패치, HTTP 오류/토큰 만료/이어받기, Git index 보존,
gateway 복원 범위·기존 주소 보존·반복 실행, 독립 시작 파일의 helper 일치,
실패 전파와 제한 시간 내 종료를 검사한다. 모의 회귀 검사와 위 실제 설치
시험의 결과는 서로 구분한다.

## 확인하지 않은 범위

이번 최신 코드를 목표 A40 서버에서 직접 실행한 기록은 아니다. 위 A40 기록은
사용자가 제공한 과거 기본 설치 결과다. 현재 시험은 Ubuntu 22.04 WSL2와 RTX 3050이다.
실제 사용자 데이터로 화면 작업 생성 → AutoML 분산 학습 → 서빙 전체 흐름,
Notebook 전체 조작, 외부 PC 접속, 호스트 재부팅 및 부하 시험은 포함하지 않는다.
이미지·볼륨 보호는 앱 관리 API의 소유권 경계다. 호스트 Docker 소켓, 광범위한
Kubernetes 권한, 다른 Kubeflow 앱까지 분리한 완전한 실행 샌드박스는 아니다.
검수용 고정 사용자 헤더도 운영 다중 사용자 인증으로 대체해야 한다.
