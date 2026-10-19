# 검증 기록

## Calico API 중단 후 제거 실패 복구 (2026-10-19)

목표 서버의 `811d66a5` 실행에서 API가 중지된 뒤 Calico DEL이
`ClusterInformation ... connection refused`로 실패했고, `kubeadm reset` 후에도
CRI sandbox가 남았다. 이전 실제 수명주기 시험은 API에 의존하지 않는 bridge CNI를
사용해 이 경우를 검증하지 못했다.

`pman-uninstall.sh`는 냉간 백업 뒤 기존 CNI 설정을 별도 보관하고,
제거 중에만 loopback CNI를 로드하도록 containerd를 재시작한다. sandbox를
실제 stop/remove한 뒤 기존 reset 검증을 계속한다. 완료 시 임시 설정을 지우고
오래된 CNI 캐시도 보관한다. API 설정이 이미 삭제된 실패 상태에서 재개할 수 있다.

실제 runtime 재현 시험:

- 공식 Ubuntu Base 22.04.5의 별도 WSL2 환경. containerd 1.7.28,
  crictl 1.30.1, runc 1.2.6, CNI plugins 1.5.1, 실제 Calico CNI 3.28.0.
- bridge/host-local로 실제 CRI sandbox와 netns/veth를 만들고, Calico DEL을
  닫힌 API 주소 `127.0.0.1:65534`로 실행해 동일한 ClusterInformation 접속 거부를 재현.
- 배포할 스크립트의 `offline-cni` 구문을 그대로 실행. 시험의 systemctl 함수는
  실제 containerd 프로세스를 중지·재시작한다. sandbox, 원래 netns와 veth 제거 확인.
- PVC 파일 내용과 다른 containerd namespace 이미지 보존. 최종 exit 0,
  `REAL_CONTAINERD_CALICO_OFFLINE_RECOVERY_PASS`.
- [실제 실행 로그](evidence/calico-offline-reset-ubuntu22-20261019.log.txt)와
  [환경·해시·검증 범위](evidence/calico-offline-reset-ubuntu22-20261019.json).

모의 서비스와 실제 Bash/임시 파일을 사용한 서비스 제어 회귀 검사 21개도 통과했다.
API 설정 삭제 후 Calico만 남은 상태, CNI 전환 중 실패 후 재개, plugin 누락 시 원본
설정 보존, runtime/CNI 실패 전파, 실제 잔여 sandbox의 실패 판정을 포함한다.
Windows Git Bash는 외부 명령 시작 비용을 고려해 fixture당 150초를 허용하며,
Linux의 기존 50초 한도와 제품의 실행 제한은 변경하지 않았다.
기존 설치기 22개와 이미지 정리·재개 7개 검사도 통과해 모의 회귀 검사는 총 50개다.

이 시험에는 Kubernetes API 서버나 전체 FeDiT 설치가 포함되지 않는다.
Calico ADD 대신 DEL과 실제 CRI/netns 정리를 검증했다. 목표 A40에서의 전체 재설치
완료 여부는 서버의 `PMAN_REINSTALL_REPORT_ARCHIVE`로 확인해야 한다.
시험용 WSL 배포판과 이미지 저장소는 삭제했고 원래 호스트 설정은 해시로 복원 확인했다.

## 이미지 제거 후 자동 재설치 연결 검사 (2026-10-19)

`pman-reinstall.sh`와 `pman-image-cleanup.py`를 추가했다. 기존 제거·설치기의
바이트는 유지하며 이미지 목록 저장 → 제거 → 이미지 정리 → `install.sh`의
전체 설치·시험을 연결한다. 실패 후 재실행에서 완료된 제거를 반복하지 않는다.

`python3 tests/check_reinstall.py`의 7개 검사 그룹과 기존 설치기 22개,
서비스 제어 16개 검사 그룹을 통과했다. 새 검사는 모의 Docker/CRI/containerd
응답과 실제 임시 파일, 실제 Bash 본문을 사용한다. 다음을 확인했다.

- 설치용 Registry·소스 기반 이미지와 Docker Hub 별칭 식별, 다른 이미지·태그 보존.
- 다른 컨테이너가 사용하는 이미지와 공유 Registry bind mount 보존.
- CRI 이미지와 `k8s.io`에 남은 별칭 제거, 빈 이미지 목록과 반복 정리 처리.
- 실제 임시 Registry blob 디렉터리 삭제와 PVC 파일 내용 보존, 범위 밖 경로·mount 거부.
- daemon/CRI 오류, 경고만 남긴 미완료 삭제와 남은 Pod의 실패 전파.
- 이미지 정리 실패 후 재개, 설치 실패 뒤 제거 단계를 건너뛰는 실제 Bash 흐름.
- 최종 공개 압축파일 생성과 시험용 bootstrap 토큰 제거, 비공개 파일 제외.

실제 저장소의 현재/고정 커밋에서 기반 이미지 목록을 읽는 검사도 수행했다.
이 기록은 새 자동화의 로컬 회귀 검사이며 A40 서버에서 이미지 삭제·전체 재설치를
수행한 기록은 아니다. 현재 PC에서 목표 서버 SSH 22번 접속은 시간 초과였다.
목표 서버 결과는 `PMAN_REINSTALL_REPORT_ARCHIVE`의 공개 압축파일로 확인한다.

## 서비스 제어 파일명 변경 (2026-10-19)

서비스 제어 파일을 `pman-start.sh`, `pman-stop.sh`, `pman-restart.sh`,
`pman-uninstall.sh`로 변경했다. 스크립트 간 호출·사용법과 guide·README,
회귀 검사도 새 이름으로 맞췄다. 기존 설치의 컨테이너·서비스·데이터 경로는 유지한다.

이름 변경 전 커밋 `19134320`과 비교해 파일명 문자열을 제외한 스크립트 내용이
동일한지 확인하고 기존 회귀 검사를 새 이름으로 실행했다. 아래 실제 Ubuntu
실행 기록과 증거 파일은 시험 당시의 원래 파일명·해시를 보존한다.
새 이름으로 `check_server_scripts.py` 22개, `check_lifecycle_scripts.py` 16개
검사 그룹과 Bash 문법·도움말 검사를 통과했다. 이번 변경은 별도 서버 설치 시험으로 집계하지 않는다.

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

## 재시작·제거 스크립트 검증 (2026-10-19)

`fedit-restart.sh`, `fedit-uninstall.sh`를 추가했다. 기존 설치기와 시작·중지
파일의 바이트는 변경하지 않았다. [파일 해시와 결과](evidence/restart-uninstall-ubuntu22-20261019.json),
[실제 실행 로그](evidence/restart-uninstall-ubuntu22-20261019.log.txt)를 함께 보존한다.

공식 Ubuntu 22.04.5 rootfs로 별도 WSL2 환경을 만들고 실제 Docker 29.1.3,
containerd, Kubernetes 1.30.14를 설치했다. `/data`는 별도 16GiB ext4 loop 디스크이며
실행 서비스·PVC 경로를 bind mount했다. 실제 API 서버·etcd·노드와 PVC를 마운트한
Pod를 사용했다. 프런트엔드와 접근 서비스는 각각 Nginx·HTTP 시험 서비스로 구성했다.
이는 새 제어 스크립트의 실행 시험이며, FeDiT 전체를 다시 설치한 시험이나
목표 A40 서버에 직접 접속한 시험으로 집계하지 않는다.

- 최종 파일을 일반 설치 계정에서 sudo 재실행 경로로 실행했다.
- 재시작 후 API·노드 Ready, HTTP 18000/19090 응답, 동일 PVC UID·파일 내용,
  기존 부팅 활성화 설정 보존을 확인했다.
- 실제 `--dry-run` 이후에도 서비스·클러스터와 설치 상태가 유지됐다.
- 실제 제거가 `EXIT=0`, `STAGE=complete`로 끝났다. 클러스터 설정·etcd·Pod
  sandbox와 전용 서비스 제거, 실행 서비스 자동 시작 해제, 데이터 mount 보존을 확인했다.
- PVC의 실제 Pod 쓰기 결과와 기존 파일, Registry 데이터, Docker/CRI 이미지 ID,
  삭제 대상이 아닌 Docker 컨테이너와 별도 데이터 파일을 보존했다.
- 반복 제거가 추가 삭제나 백업 생성 없이 종료됐다. 기존 `.kube/config`와 다른
  사용자 컨텍스트의 보존은 모의 서비스 회귀 검사에서 별도로 확인했다.
- 제어 파일을 root가 만들더라도 설치 계정이 재시작·제거 후 잠금을 다시 열고
  획득할 수 있음을 실제로 확인했다. 잠금의 root 소유로 다음 설치가 막히지 않도록 했다.
- 최종 냉간 백업에서 etcd를 별도 포트로 구동해 제거 전 Kubernetes ConfigMap의
  원래 값을 조회했다. 인증 파일·노드 인증서·백업 원본은 공개 기록에 포함하지 않았다.
- 마지막에 6443/5000/18000/19090 포트가 닫힌 것을 확인했다.

초기 시험 환경의 API 준비 대기와 WSL 세션 간 mount 문제는 시험 환경에서 보정했다.
추가 백업 복구 검사에서 시험 etcd를 의도적으로 종료한 뒤의 `143`을 실패로
처리했던 검사 코드는 정상 종료 처리로 보정하고 그 추가 검사만 다시 실행했다.
이미 성공한 최종 제거 스크립트를 이 때문에 변경하거나 재실행하지 않았다.
주요 제거 결과와 추가 검사 결과는 증거 JSON에 구분했다.

기존 `python3 tests/check_server_scripts.py` 22개 검사 그룹과 새
`python3 tests/check_lifecycle_scripts.py` 16개 검사 그룹을 통과했다.
새 회귀 검사는 실제 Bash와 임시 파일에서 수행하되 서비스/CRI 명령을 모의한다.
중지·백업·자동 시작 해제·Docker 조회·클러스터 초기화 실패 및 경고, 남은 Pod,
종료 정리 오류의 실패 전파, 소유 표시, 잠금, 다른 kubeconfig 보존, Registry 설정의
리터럴 읽기를 검증한다. 위 실제 Kubernetes 실행 결과와 구분한다.

시험이 끝난 뒤 이 작업의 VM과 그 안의 이미지를 삭제했다. 기존 WSL 세 개는
중지 상태로 보존했고 호스트 `.wslconfig`는 원래 123바이트와 SHA-256이 일치하도록 복원했다.

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
