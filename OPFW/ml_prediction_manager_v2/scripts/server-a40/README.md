# Ubuntu 22.04 / A40 서버 설치 및 서비스 제어

## 예측매니저 컨테이너의 JupyterLab을 8080으로 연결

앱 설정 `NOTEBOOK_PUBLIC_URL=https://서버주소:8080`을 지정하면 컨테이너 목록의
‘열기’ 주소가 `/notebook/사용자영역/컨테이너명/lab`으로 생성된다. 컨테이너 내부
서비스 포트는 이미지가 실제 사용하는 값이며 JupyterLab 기본값은 `8888`이다.
외부 포트 `8080`으로 내부 포트를 바꿀 필요는 없다.

`notebook-gateway.py`는 예측매니저가 생성한 Jupyter Notebook과 실제 Ready Pod를
확인하고, 루프백 포트 포워딩과 Nginx 경로를 자동 관리한다. 컨테이너가 여러 개면
서로 다른 경로로 구분하고, 중지·삭제된 대상의 경로는 제거한다. Pod가 교체되면
새 Pod로 다시 연결한다. Jupyter 서버 자체가 준비된 후 경로를 공개한다.

이미 HTTPS 8080에서 호스트의 `127.0.0.1:8888`로 연결하던 서버를 전환할 때:

```bash
sudo python3 install-notebook-gateway.py
kubectl -n kubeflow set env deployment/prediction-manager \
  NOTEBOOK_PUBLIC_URL=https://서버주소:8080 \
  NOTEBOOK_PROXY_CPU_REQUEST=10m
```

이 전환 도구는 기존 `/etc/nginx/conf.d/jupyterlab-8080.conf`와 인증서를 사용한다.
Nginx 및 기존 호스트 서비스 상태를 백업하고, 호스트 JupyterLab 대신
`prediction-manager-notebook-gateway.service`의 자동 시작을 등록한다. 이미 전환한
서버에서는 다시 실행할 필요가 없다. 새 서버의 Nginx·HTTPS 설정이나 방화벽 개방을
대신하는 도구는 아니다. 인증서 비공개 키, 토큰, Kubernetes 인증 파일은 저장소에
포함하지 않는다. 노트북의 로그인 정책은 사용하는 이미지의 Jupyter 설정을 따른다.

`NOTEBOOK_PROXY_CPU_REQUEST`는 노트북 프록시의 CPU 예약량만 조정하며 기본 메모리
예약량과 CPU·메모리 제한은 유지한다. CPU가 적은 서버에서는 생성 화면의 CPU Min도
남은 예약량에 맞춰 지정해야 한다. 현재 서버는 CPU Min `0.1`, Max `1`을 기본으로
사용한다. 기존 사용자 파일은 각 컨테이너의 PVC에 보존되며 호스트의 별도 작업 폴더를
자동으로 합치지 않는다.

## 사용자 관리 화면 숨김

예측기 생성/연동 도구의 ‘시스템 관리’ 타일과 빠른 이동 항목을 표시하지 않는다.
기존 `/predictor-creator-tool/system-admin` 주소는 도구 홈으로 이동하며, 예측매니저의
`#/admin` 주소도 홈으로 이동한다. 계정 삭제나 역할 변경은 수행하지 않는다.
이 변경은 화면 표시 정책이며 관리자 API의 인증·권한 정책을 대신하지 않는다.

`install.sh`는 검증된 플랫폼 기본 소스 `725eb2ed` 설치와 Keycloak 자동 복구 후,
현재 checkout 커밋의 이미지·볼륨 보호 기능을 자동 배포한다. 실제 사용자 PVC의
생성·마운트·읽기·쓰기·삭제와 사용 중/중지된 작업의 삭제 차단을 시험한다.
시험용 UUID 리소스만 삭제하고 기존 PVC UID가 보존되는지 확인한다.

## 설치와 자동 구동 시험

저장소 전체를 서버로 복사하거나 아래 명령으로 clone한 뒤 이 디렉터리에서 실행한다.
설치 후 현재 커밋의 앱을 반영하므로 설치에는 전체 저장소가 필요하다.
기존 설치와 같은 일반 로그인 계정을 사용한다. 필요할 때 sudo 비밀번호와
비공개 GitHub 저장소 읽기 인증을 입력한다.

```bash
git clone --branch OPFW_development_ETRI_pman --single-branch https://github.com/etri/FeDiT.git
cd FeDiT/OPFW/ml_prediction_manager_v2/scripts/server-a40
bash install.sh
```

이미 저장소가 있으면 중복 clone하지 않고 해당 브랜치와 로컬 변경 사항을 확인한
뒤 최신 커밋을 받아 같은 폴더에서 실행한다. 전체 가이드는
[guide.txt](../../guide.txt)를 참조한다.

`install.sh`는 먼저 함께 배포한 보완 설치기의 SHA-256을 확인하고 실행한다.
Keycloak 단계에서 실패하고 진단 응답이 정확히 `HTTPS required`인 경우에만
로컬 포트 포워딩을 이용해 자동 재개한다. 첫 실행의 실패 보고서와 재개의
최종 보고서가 각각 남으며, 마지막 실행의 `EXIT=0`, `STAGE=complete`,
`PLATFORM_AND_KUBERNETES_GPU_SMOKE_PASS`는 기본 플랫폼 성공이다.
앱 업데이트와 `USER_SANDBOX_LIFECYCLE_PASS`를 거친 마지막
`FEDIT_INSTALL_AND_SANDBOX_PASS`까지 출력돼야 전체 성공이다.
그 외 오류는 자동 우회하지 않는다. 기존 설치도 같은 명령으로 재개한다.

이미 clone한 저장소에 고정 기본 커밋이 있으면 Git 객체를 독립 복사해 재사용한다.
같은 소스의 재다운로드·재인증을 줄이며 원본 checkout은 변경하지 않는다.
얕은 clone 등으로 고정 커밋이 없으면 기존 GitHub 다운로드 경로를 사용한다.

보정 파일은 Pod 교체 시 포트 포워딩을 다시 연결하고 인증 요청을 제한된
횟수/시간 안에서 재시도한다. HTTPS 정책을 끄거나 인증을 생략하지 않는다.
종료 시 별도 권한 프로세스가 자신의 kubectl 자식을 정리하며, 부모 스크립트는
최대 10초만 정리를 기다린다. 과거 종료 대기 문제를 반영한 후속 보정이다.

이미 Keycloak HTTPS 오류로 중단된 서버에서 보정만 직접 실행하려면:

```bash
bash resume-keycloak.sh
```

설치 없이 상태 수집 / 구동 시험만 다시 실행:

```bash
bash install.sh inspect
bash install.sh test
```

고용량 데이터는 별도로 마운트된 `/data`에 배치한다. Docker/containerd/kubelet,
PVC, 소스와 빌드 작업을 포함한다. CPU·디스크 권장량만으로 차단하지 않으며,
실제 쓰기 실패, 잘못된 마운트, 기존 실행 작업, 네트워크 충돌은 오류로 처리한다.
NVIDIA 드라이버는 설치하거나 갱신하지 않는다.

네트워크: Pod `10.254.250.0/23`, Service `10.254.252.0/24`,
Docker bridge `10.254.254.192/28`, pool `10.254.254.224/27`.
A40 프로파일은 GPU worker 최대 1개, 테넌트별 동시 학습/시행 각각 1개다.

## 서비스 시작 / 중지 / 재시작

설치했던 일반 로그인 계정으로 실행한다. 시작·중지는 두 파일만 별도로 복사해도
되며, 재시작은 `pman-restart.sh`까지 세 파일을 같은 폴더에 둔다.
실행 권한 변경은 필요 없다.

```bash
bash pman-start.sh
bash pman-stop.sh
bash pman-restart.sh
```

시작은 containerd, Docker, kubelet, 서비스 접근용 systemd 유닛을 실행하고
Kubernetes API 및 노드 Ready를 기다린다. 애플리케이션 Pod 전체와 외부 브라우저
접속까지 보장하는 판정은 아니며, 표시된 Pod READY와 브라우저를 확인한다.
명시적으로 중지한 Docker 컨테이너는 데몬 재시작만으로 복구되지 않으므로,
시작 스크립트가 `pm-verification-registry`와 `fedit-fe`를 직접 시작한다.
설치기 소유의 Docker bridge에서 IPAM gateway와 실제 주소가 달라졌으면 필요한
주소만 복원한다. 이 helper도 시작 파일 안에 포함되어 두 파일만 복사해 쓸 수 있다.
레지스트리 이름을 변경한 설치는 `sudo FEDIT_REGISTRY_CONTAINER=변경한이름 bash pman-start.sh`로 실행한다.
재시작은 `FEDIT_REGISTRY_CONTAINER=변경한이름 bash pman-restart.sh`로 지정할 수 있다.

재시작은 기존 중지를 실행하고 성공해야 시작으로 넘어간다. 필요한 두 파일은
중지 전에 확인하고, 실패하면 어느 단계인지와 원래 종료 코드를 표시한다.
시작·재시작 후 전체 앱 및 CPU/GPU 학습 시험은 `bash install.sh test`로 실행한다.
재시작·제거는 설치/점검과 같은 제어 잠금을 사용한다. 기존 시작/중지 명령은
별도 잠금이 없으므로 다른 제어 명령과 동시에 실행하지 않는다.
잠금 파일은 설치 계정 소유로 유지해 sudo 실행 뒤에도 일반 계정의 설치/점검을 막지 않는다.

중지는 접근용 유닛과 설치 재개 유닛, kubelet을 먼저 중지하고 Kubernetes
컨테이너와 **서버의 모든 Docker 컨테이너**를 정지한 뒤 실행 서비스를 내린다.
데이터, Kubernetes 리소스, 설치 설정은 삭제하지 않는다. 다른 Docker 작업이
있는 공용 서버에서는 이 중지 스크립트를 그대로 사용하지 않는다.

시작·중지·재시작은 부팅 시 활성화 설정을 바꾸지 않는다. 재부팅 후 자동 시작을
원하면 다음을 한 번 실행한다. 설치 재개 유닛은 활성화하지 않는다.

```bash
sudo systemctl enable containerd.service docker.service kubelet.service prediction-manager-access.service
```

## 플랫폼 제거 (데이터 보존)

설치했던 계정으로 실행한다. `pman-uninstall.sh`와 `pman-stop.sh`가 같은 폴더에
있어야 한다. sudo 인증 외 추가 입력 없이 실행한다. `--dry-run`은 선택 사항이다.

```bash
bash pman-uninstall.sh --dry-run  # 서비스/파일 변경 없이 범위 확인
bash pman-uninstall.sh            # 실제 제거
```

이 서버의 단일 노드 Kubernetes 클러스터 전체가 제거 대상이다. 먼저 기존 중지를
실행하므로 다른 Docker 컨테이너도 중지된다. 실제로 삭제하는 Docker 컨테이너는
`fedit-fe`와 설정된 Registry뿐이며 다른 컨테이너는 보존한다.
설치 계정의 `installation-started`와 `cluster-owned` 표시 및 클러스터 네트워크를
확인하고, 냉간 etcd·인증 정보·설정·설치 상태 백업에 성공한 뒤 `kubeadm reset`을 실행한다.
초기화 명령의 경고만으로 성공을 판단하지 않고 설정·etcd·Pod sandbox 제거를 확인한다.
백업 실패 시 클러스터를 초기화하지 않는다. 서비스는 중지 상태로 남는다.

Calico는 Pod 네트워크 삭제 때도 API를 조회한다. API 중지 후의 삭제 실패를
피하도록 백업 뒤 기존 CNI 설정을 보고서의 `retired-cni-config`로 옮기고,
제거 중에만 임시 loopback CNI를 로드한 containerd로 Pod sandbox를 삭제한다.
sandbox가 남으면 실패로 처리한다. 완료 시 임시 설정을 지우고 이전 CNI 캐시도
보고서로 옮긴다. CNI 바이너리와 PVC 데이터는 보존한다.

접근·설치 재개·루트 mount propagation 전용 systemd 유닛을 제거하고
kubelet/Docker/docker.socket/containerd의 부팅 시 자동 시작을 해제한다.
PVC 파일, Registry 데이터, Docker/containerd 이미지, 설치 패키지와 NVIDIA 드라이버,
`/data` 및 bind 마운트, 실행 서비스의 저장소 보호 drop-in과 Docker/호스트 네트워크 설정은 보존한다.
디스크 전체 삭제, 이미지 prune, 공용 방화벽/iptables 초기화는 하지 않는다.
이미 제거된 설치에 재실행하면 기존 데이터를 건드리지 않고 종료한다.

이전 완료 표시는 보고서 폴더로 옮기므로 같은 설치 계정에서 `bash install.sh`로
재설치할 때 제거된 클러스터 단계를 건너뛰지 않는다. 설치 소유·네트워크 표시인
`installation-started`와 사용자 설정은 유지한다. 제거 후에는 시작/재시작만으로
복구되지 않는다. 보존된 PVC 파일은 새 클러스터에 자동 연결되지 않으며,
이전 작업을 복원하려면 별도 복구가 필요하다.

root로 직접 실행하려면 `bash pman-uninstall.sh --owner 설치계정`을 사용한다.
Registry 이름은 `server-install.env`에서 실행 없이 읽으며, 필요하면
`FEDIT_REGISTRY_CONTAINER=이름 bash pman-uninstall.sh`로 지정한다.

완료 기준은 `EXIT=0`, `STAGE=complete`다. 마지막 `UNINSTALL_REPORT` 아래에
`RESULT.txt`, `uninstall.log`, `cluster-backup.private.tar`, `backup.sha256`이 남는다.
오류를 전달할 때는 `RESULT.txt`와 `uninstall.log`만 보낸다. 비공개 백업과 파일 목록은
클러스터 인증 정보를 포함하므로 채팅에 보내지 않는다. 재설치 전까지 백업을 보관한다.

## 기존 이미지 정리 후 자동 재설치

기존 A40 설치를 제거하고 관련 로컬 이미지까지 정리한 뒤 재설치·구동 시험을
자동으로 실행하려면 설치했던 일반 계정에서 다음을 실행한다. sudo 인증은 요청될 때
입력하고 완료될 때까지 터미널 연결을 유지한다. 미리 uninstall을 따로 실행할 필요는 없다.

```bash
bash pman-reinstall.sh
```

서버에 최신 저장소가 없거나 기존 checkout의 위치·변경 여부를 확인하기 번거로우면
새 작업 폴더에 최신 브랜치를 받아 바로 실행한다. GitHub 읽기 인증은 필요할 때 입력한다.

```bash
PMAN_SRC=$(mktemp -d "$HOME/pman-reinstall-source.XXXXXX")
git clone --branch OPFW_development_ETRI_pman --single-branch https://github.com/etri/FeDiT.git "$PMAN_SRC" &&
bash "$PMAN_SRC/OPFW/ml_prediction_manager_v2/scripts/server-a40/pman-reinstall.sh"
```

자동 실행 순서:

1. 현재 설치의 Docker/CRI 이미지와 Registry 저장소 위치를 기록한다.
2. `pman-uninstall.sh`로 냉간 백업을 남기고 플랫폼을 제거한다.
3. 설치된 이미지 참조·현재/고정 소스의 기반 이미지·설치용 로컬 Registry 태그로
   식별한 Docker 이미지를 제거한다. 설치 클러스터의 CRI 이미지와 containerd `k8s.io`
   namespace의 남은 별칭, Registry의 `docker/registry/v2` 이미지 저장분도 제거한다.
4. 기존 `install.sh`를 실행해 플랫폼·앱 갱신, CPU/GPU 모델 시험과 실제 PVC 시험을 수행한다.

다른 Docker 컨테이너가 사용하는 이미지, 다른 작업의 태그와 식별되지 않은 Docker
이미지는 보존한다. 다른 containerd namespace를 지우지 않는다. 공유된 Registry bind mount도
보존 대상으로 기록한다. 실제 제거/보존 목록은 결과 JSON에서 확인할 수 있다.
PVC 파일·NVIDIA 드라이버·패키지·데이터 mount는 보존하며 디스크 전체 삭제나 전역 prune을 하지 않는다.
새 클러스터에 이전 PVC 데이터가 자동 연결되는 것은 아니다.

실패하면 마지막에 표시되는 `Resume with:` 명령을 다시 실행한다. 같은 계정에서
`pman-reinstall.sh`를 다시 실행해도 미완료 실행을 찾아 재개한다. 설치 단계가 실패한 경우
이미 끝난 플랫폼 제거·이미지 삭제를 다시 수행하지 않는다. 기존 설정이 있는 설치 계정의
`~/pman-server-725eb2ed/reinstall-active`가 이 실행 위치를 가리킨다.

이전 버전에서 `calico ... ClusterInformation ... connection refused`와
`CRI Pod sandboxes remain after reset`로 멈춘 경우도 같은 작업을 재개할 수 있다.
기존 소스 checkout의 최상위에서 다음을 실행한다. 새 clone이나 수동 reset은 필요 없다.

```bash
git pull --ff-only origin OPFW_development_ETRI_pman &&
bash OPFW/ml_prediction_manager_v2/scripts/server-a40/pman-reinstall.sh
```

기존 이미지 목록·실패 기록·비공개 백업은 유지한다. API 설정이 이미 삭제된 상태에서도
남은 sandbox를 정리한 뒤 이미지 삭제·설치·구동 시험을 이어서 실행한다.

최종 `PMAN REINSTALL FINAL RESULT`에서 `EXIT=0`, `STAGE=complete`,
`PMAN_IMAGE_CLEANUP_AND_REINSTALL_PASS`를 확인한다. `PMAN_REINSTALL_REPORT_ARCHIVE`의
압축파일 하나를 보내면 된다. 이미지 목록·정리 결과, 토큰을 가린 전체 로그와 설치기의
공개 시험 보고서를 포함한다. uninstall의 비공개 인증 백업은 포함하지 않는다.

## 결과 전달 및 검증 범위

설치/시험의 맨 마지막 `FEDIT FINAL RESULT` 블록을 전달한다.
그 블록의 `EXIT=0`, `STAGE=complete`가 전체 설치·앱 갱신·볼륨 시험의 성공 기준이다.
`FEDIT_REPORT_ARCHIVE`에 표시된 압축파일 하나를 함께 전달하면 된다.
기본 플랫폼만 끝났을 때 출력되는 중간 `COPY BACK TO CODEX` 블록과 구분한다.
압축파일에는 전체 실행 로그, 파일 해시, 볼륨 API·마운트 시험 결과를 모은다.
Kubernetes 부트스트랩 토큰은 가리고 설정/Secret·원복용 private 파일은 포함하지 않는다.

구성 파일과 실행 결과는 실행 계정의 `~/pman-server-725eb2ed/`에 저장된다.
상세 설치 보고서는 `~/prediction-manager-work/.prediction-manager/gpu/results/`에
있으며, 계정 비밀번호는 해당 실행의 `verification-credentials.txt`에서 확인한다.

2026-10-17 사용자가 전달한 목표 서버 로그에서 설치와 자동 시험 통과를 확인했다.
Ubuntu 22.04, CPU 4개, RAM 31GiB, NVIDIA A40 46068MiB, 드라이버 535.309.01 환경이다.
성공한 실행은 원본 설치기와 `resume-keycloak-725eb2ed-v2.sh` 보정의 조합이다.
당시 서비스 종료 대기 문제는 별도로 발생했다.

위 과거 A40 성공 기록의 설치기 SHA-256 (현행 파일의 해시와 구분):
`78b2c8ba0182320e5b06def1c2ce46ec4c55836858ab5c6d059d38b7b0c6ac3a`.

최신 묶음도 공식 Ubuntu 22.04 rootfs의 새 WSL2 환경에서 설치부터 구동 시험까지
통과했다. RTX 3050 Laptop으로 시험했으며, 현재 코드를 목표 A40에서 직접 실행한
결과는 아니다. 실제 이미지·PVC 보호, 독립 시작/중지 파일, 재시작 후 학습과
Images·Volumes 화면 확인 결과는 [VALIDATION.md](VALIDATION.md)에 기록한다.
실제 사용자 데이터로 UI 작업 생성 → AutoML 분산 학습 → 서빙,
외부 PC 접속, 재부팅 복구, 부하 시험까지 완료했다는 뜻은 아니다.
