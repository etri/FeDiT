# Ubuntu 22.04 / A40 서버 설치 및 서비스 제어

사용자 이미지·볼륨 보호 기능은 아래 고정 소스 설치 후 별도 앱 업데이트가
필요하다. 최신 전체 저장소를 받은 폴더에서 `bash update-user-sandbox.sh`를
실행한다. 자세한 반영 절차와 검증 범위는
[사용자 볼륨 관리](../../tests/VOLUME_SANDBOX.md)를 참조한다.

고정 소스 커밋 `725eb2edeec1b756b45abb809cdc4dc971a890bf`의 설치와
목표 A40 서버에서 성공한 보정 절차를 함께 제공한다. 이 디렉터리의 스크립트가
후속 커밋에 추가되더라도 실제 빌드 소스는 위 커밋으로 고정한다.

## 설치와 자동 구동 시험

이 디렉터리 전체를 서버로 복사하거나 아래 명령으로 저장소를 받아 실행한다.
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

`install.sh`는 먼저 검증된 원본 설치기의 SHA-256을 확인하고 실행한다.
Keycloak 단계에서 실패하고 진단 응답이 정확히 `HTTPS required`인 경우에만
로컬 포트 포워딩을 이용해 자동 재개한다. 첫 실행의 실패 보고서와 재개의
최종 보고서가 각각 남으며, 마지막 실행의 `EXIT=0`, `STAGE=complete`,
`PLATFORM_AND_KUBERNETES_GPU_SMOKE_PASS`가 성공 기준이다.
그 외 오류는 자동 우회하지 않는다. 기존 설치도 같은 명령으로 재개한다.

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

## 서비스 시작 / 중지

이 두 파일만 별도로 복사해서 실행해도 된다. 실행 권한 변경은 필요 없다.

```bash
bash fedit-start.sh
bash fedit-stop.sh
```

시작은 containerd, Docker, kubelet, 서비스 접근용 systemd 유닛을 실행하고
Kubernetes API 및 노드 Ready를 기다린다. 애플리케이션 Pod 전체와 외부 브라우저
접속까지 보장하는 판정은 아니며, 표시된 Pod READY와 브라우저를 확인한다.
명시적으로 중지한 Docker 컨테이너는 데몬 재시작만으로 복구되지 않으므로,
시작 스크립트가 `pm-verification-registry`와 `fedit-fe`를 직접 시작한다.
레지스트리 이름을 변경한 설치는 `sudo FEDIT_REGISTRY_CONTAINER=변경한이름 bash fedit-start.sh`로 실행한다.

중지는 접근용 유닛과 설치 재개 유닛, kubelet을 먼저 중지하고 Kubernetes
컨테이너와 **서버의 모든 Docker 컨테이너**를 정지한 뒤 실행 서비스를 내린다.
데이터, Kubernetes 리소스, 설치 설정은 삭제하지 않는다. 다른 Docker 작업이
있는 공용 서버에서는 이 중지 스크립트를 그대로 사용하지 않는다.

두 스크립트는 부팅 시 활성화 설정을 바꾸지 않는다. 재부팅 후 자동 시작을
원하면 다음을 한 번 실행한다. 설치 재개 유닛은 활성화하지 않는다.

```bash
sudo systemctl enable containerd.service docker.service kubelet.service prediction-manager-access.service
```

## 결과 전달 및 검증 범위

설치/시험 마지막의 `COPY BACK TO CODEX`부터 `END`까지 전달한다.
보정 실행이면 `KEYCLOAK_RESUME_EXIT`도 함께 전달한다. 상세 파일 경로는
`REPORT_ARCHIVE`에 표시된다. 비밀번호, 토큰, 설정/Secret 전체는 전달하지 않는다.

구성 파일과 실행 결과는 실행 계정의 `~/pman-server-725eb2ed/`에 저장된다.
상세 설치 보고서는 `~/prediction-manager-work/.prediction-manager/gpu/results/`에
있으며, 계정 비밀번호는 해당 실행의 `verification-credentials.txt`에서 확인한다.

2026-10-17 사용자가 전달한 목표 서버 로그에서 설치와 자동 시험 통과를 확인했다.
Ubuntu 22.04, CPU 4개, RAM 31GiB, NVIDIA A40 46068MiB, 드라이버 535.309.01 환경이다.
성공한 실행은 원본 설치기와 `resume-keycloak-725eb2ed-v2.sh` 보정의 조합이다.
당시 서비스 종료 대기 문제는 별도로 발생했다.

원본 설치기 SHA-256:
`78b2c8ba0182320e5b06def1c2ce46ec4c55836858ab5c6d059d38b7b0c6ac3a`.

서버 통과 범위와 후속 변경의 로컬 검증은 [VALIDATION.md](VALIDATION.md)에 구분해
기록한다. 실제 사용자 데이터로 UI 작업 생성 → AutoML 분산 학습 → 서빙,
외부 PC 접속, 재부팅 복구, 부하 시험까지 완료했다는 뜻은 아니다.
