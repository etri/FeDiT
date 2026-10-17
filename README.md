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

저장소가 이미 있으면 중복 clone하지 않고 해당 브랜치의 최신 버전을 받은 뒤
같은 `scripts/server-a40` 폴더에서 실행한다. 설치·재개, 서비스 점검,
Kubernetes GPU 실행, CPU/GPU 학습 및 모델 저장·재로드 시험을 자동 수행한다.
확인된 Keycloak HTTPS 오류에만 로컬 연결 보정으로 자동 재개한다.
실제 빌드 소스는 설치에 성공한 `725eb2ed` 커밋으로 고정한다.

최종 성공 기준은 `EXIT=0`, `STAGE=complete`,
`PLATFORM_AND_KUBERNETES_GPU_SMOKE_PASS`다.
설치 후 같은 폴더에서 서비스를 제어한다.

```bash
bash fedit-start.sh   # 전체 시작
bash fedit-stop.sh    # 전체 중지
```

중지는 서버의 모든 Docker 컨테이너를 포함한다. 데이터와 부팅 시 활성화
설정은 변경하지 않는다. 시작은 Registry와 FeDiT 컨테이너도 직접 복구한다.

목표 A40 서버에서 원본 설치기와 Keycloak v2 보정 조합의 설치·자동 시험 통과를
확인했다. 이후 추가한 단일 진입점·종료 보정·서비스 제어 변경은 로컬 검사까지
완료했으며 새 클린 서버에서 최신 묶음 전체를 재설치한 결과는 아직 없다.
UI에서 실제 데이터로 AutoML 학습부터 서빙까지의 전체 흐름은 별도 확인한다.

- [전체 설치 가이드](OPFW/ml_prediction_manager_v2/guide.txt)
- [설치·서비스 제어 상세 설명](OPFW/ml_prediction_manager_v2/scripts/server-a40/README.md)
- [실서버 성공 범위와 로컬 검증 기록](OPFW/ml_prediction_manager_v2/scripts/server-a40/VALIDATION.md)

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
