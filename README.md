## FDTFW
_FDTFW 프로젝트_ 는 디지털 트윈간 연합과 상호운용을 위한 지능형 디지털 연합트윈 프레임워크

### FDTFW Modules
* `OPFW`: 디지털 트윈에서 사용하는 데이터에 대한 이상 징후를 추적하는 트래킹 기능, 가상공간의 물리 해석을 위한 모델링 저작도구 및 최적 의사결정 및 추론 도구 관련 모듈 제공
* `CDFW`: 디지털 트윈 연합을 위한 메타 데이터 관리, 동기화 관리, 충실도 관리 및 유효성 관리 등 데이터 프로세싱 기술과 관련한 요소 기술로 구성되어 있음
* `OSFW`: 다양한 디지털 트윈에서 제공하는 디지털 트윈 객체 정보와 시뮬레이션 등의 서비스를 재사용하고 연합하여 신규 디지털 트윈 응용 서비스를 설계/저작하고 쉽게 개발 및 운영할 수 있는 다양한 개발자 도구와 서비스 운영 기반을 제공

### Dependency

### How to Run Codes
각 모듈 내 문서를 참조

#### Prediction Manager: Ubuntu 22.04 / NVIDIA A40 설치

목표 A40 서버에서는 아래 명령으로 설치와 자동 구동 시험을 실행한다.
Ubuntu 22.04 x86_64, sudo 권한, 정상 동작하는 NVIDIA 드라이버,
루트와 별도로 마운트된 쓰기 가능한 `/data`, 인터넷과 저장소 읽기 권한이 필요하다.
요청될 때 sudo 비밀번호와 GitHub 인증을 입력한다.

```bash
git clone --branch OPFW_development_ETRI_pman --single-branch https://github.com/etri/FeDiT.git
cd FeDiT/OPFW/ml_prediction_manager_v2/scripts/server-a40
bash install.sh
```

위 `install.sh`는 기본 플랫폼 설치 후 최신 사용자 이미지·볼륨 보호 기능을 자동 적용하고
실제 PVC 생성·마운트·읽기·쓰기·삭제 및 삭제 차단 시험까지 실행한다.
기존 서버에서 앱만 갱신하려면 `bash update-user-sandbox.sh` 후
`bash verify-user-sandbox.sh`를 실행한다. 자세한 조건은 아래 사용자 볼륨 문서를 참조한다.

저장소가 이미 있으면 중복 clone하지 않고 해당 브랜치의 최신 버전을 받은 뒤
같은 `scripts/server-a40` 폴더에서 실행한다. 설치·재개, 서비스 점검,
Kubernetes GPU 실행, CPU/GPU 학습 및 모델 저장·재로드 시험을 자동 수행한다.
확인된 Keycloak HTTPS 오류에만 로컬 연결 보정으로 자동 재개한다.
플랫폼 기본 설치는 성공한 `725eb2ed`를 사용하고, 앱·볼륨 화면은 현재 checkout의 커밋으로 갱신한다.

최종 성공 기준은 `EXIT=0`, `STAGE=complete`,
`PLATFORM_AND_KUBERNETES_GPU_SMOKE_PASS`, `USER_SANDBOX_LIFECYCLE_PASS`,
마지막 `FEDIT_INSTALL_AND_SANDBOX_PASS`다.
마지막 `FEDIT FINAL RESULT`의 `EXIT=0`, `STAGE=complete`를 확인하고,
`FEDIT_REPORT_ARCHIVE`의 압축파일 하나로 실행 로그와 시험 결과를 전달한다.
설치 후 같은 폴더에서 서비스를 제어한다.

```bash
bash pman-start.sh   # 전체 시작
bash pman-stop.sh    # 전체 중지
bash pman-restart.sh # 전체 재시작
```

중지는 서버의 모든 Docker 컨테이너를 포함한다. 데이터와 부팅 시 활성화
설정은 변경하지 않는다. 시작은 Registry와 FeDiT 컨테이너도 직접 복구한다.
재시작은 중지 성공 후 시작을 실행한다. API·노드 Ready 이후에도 앱 Pod는
기동 중일 수 있으므로 전체 앱·CPU/GPU 시험은 `bash install.sh test`로 실행한다.

플랫폼을 제거하려면 설치했던 계정으로 같은 폴더에서 실행한다.

```bash
bash pman-uninstall.sh --dry-run # 선택 사항: 변경 없이 제거 범위 확인
bash pman-uninstall.sh           # 단일 노드 클러스터와 서비스 제거
```

제거는 클러스터 초기화 전에 etcd·설정·인증 정보의 비공개 백업을 남기고,
플랫폼 컨테이너와 전용 systemd 서비스를 제거하며 실행 서비스의 자동 시작을 끈다.
PVC 파일·Registry 데이터·이미지·패키지·NVIDIA 드라이버·`/data` 마운트는 보존한다.
제거 뒤에는 시작/재시작으로 복구되지 않으며 `bash install.sh`로 재설치한다.
보존된 PVC 파일이 새 클러스터에 자동 연결되지는 않는다. 마지막 `UNINSTALL_REPORT`에
결과·로그·비공개 백업 위치가 표시된다. 비공개 백업에는 인증 정보가 포함되므로 공유하지 않는다.

기존 설치 이미지까지 제거하고 재설치·자동 구동 시험을 이어서 실행하려면 같은 폴더에서
`bash pman-reinstall.sh`를 실행한다. 설치했던 일반 계정을 사용하고 터미널 연결을 유지한다.
PVC 데이터 파일과 NVIDIA 드라이버는 보존한다. 실패 후 같은 명령을 다시 실행하면
완료된 제거 단계를 반복하지 않고 재개한다. 최종 성공 표시는
`PMAN_IMAGE_CLEANUP_AND_REINSTALL_PASS`이며, 결과 전달 파일은 `PMAN_REINSTALL_REPORT_ARCHIVE`다.

Calico `ClusterInformation ... connection refused`와 남은 Pod sandbox 오류로 중단된
이전 재설치는 기존 소스 checkout 최상위에서 `git pull --ff-only origin
OPFW_development_ETRI_pman` 후 같은 재설치 명령으로 재개한다. 제거 중에는 백업된
CNI 설정 대신 API가 필요 없는 임시 loopback CNI를 로드해 sandbox를 실제로 정리한다.

2026-10-18 공식 Ubuntu 22.04 rootfs로 새 WSL2 환경을 만들고 최신 스크립트의
전체 설치, 실제 사용자 이미지·PVC 수명주기, 서비스 중지·시작과 재시작 후
CPU/GPU 학습 시험을 통과했다. 시험 GPU는 RTX 3050 Laptop이며, 최신 코드를
목표 A40에서 직접 실행한 결과는 아니다. Images·Volumes 화면도 실제 브라우저에서
확인했다. 전체 AutoML→서빙, 호스트 재부팅과 부하 시험은 별도 항목이다.

추가한 재시작·제거 스크립트는 2026-10-19 별도 Ubuntu 22.04의 실제 Docker·Kubernetes와
시험용 HTTP 서비스에서 실행했다. PVC·이미지 보존과 냉간 etcd 백업 조회까지 확인했다.
이번 제어 스크립트 시험의 환경·범위·로그는 아래 검증 기록에 구분해 두었다.

- [전체 설치 가이드](OPFW/ml_prediction_manager_v2/guide.txt)
- [설치·서비스 제어 상세 설명](OPFW/ml_prediction_manager_v2/scripts/server-a40/README.md)
- [실서버 성공 범위와 로컬 검증 기록](OPFW/ml_prediction_manager_v2/scripts/server-a40/VALIDATION.md)
- [사용자 리소스 관리 경계와 남은 실행 격리·배포 조건](OPFW/ml_prediction_manager_v2/tests/RESOURCE_ISOLATION.md)
- [사용자 볼륨 보호와 기존 서버 업데이트](OPFW/ml_prediction_manager_v2/tests/VOLUME_SANDBOX.md)

### How to Contribute Your Codes
[CONTRIBUTING.md](CONTRIBUTING.md)를 참조

### History
_FDTFW 프로젝트_ 는 2022년 4월 시작
Version 1.0 공개: 2024년 10월 31일

### Authors
[AUTHORS.md](AUTHORS.md)를 참조

### License
[LGPL v2.1](LICENSE_KR.md)를 참조

### Acknowledgement
The authors thank the following contributors and projects.

* This work was supported by Institute of Information & communications Technology Planning & Evaluation (IITP) grant funded by the Korea government(MSIT) (Development of an intelligent digital twin federation core technology) .
