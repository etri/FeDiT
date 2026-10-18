# 사용자 볼륨 관리 경계 (2026-10-17)

## 관리 대상

사용자 namespace에 생성한 `pm-user-*` PVC만 관리한다. 이름뿐 아니라 다음 조건을
모두 확인한다: PM 관리 라벨, `user-volume` 용도, 소유 namespace 일치, 지정
StorageClass, Filesystem 모드. 시스템·다른 사용자·MLflow·NiFi·서빙 데이터와
기존 미분류 PVC는 자동 등록하거나 라벨을 덧씌우지 않는다.

`/volumes/`는 공용 Kubeflow 볼륨 앱 대신 PM의 전용 화면으로 연결한다.
화면과 `/api/volumes`, `/volumes/api`는 같은 권한 검사를 사용한다. namespace
선택은 등록된 사용자 영역만 허용하며, 조회 권한이 있어도 자신의 소유 영역이
아니면 생성·삭제는 허용하지 않는다.

볼륨 생성은 1~1024Gi, ReadWriteOnce, 관리자가 지정한 StorageClass만 허용한다.
기본 StorageClass는 A40 설치의 `local-path`이며 변경은 서버 환경 변수
`PM_USER_VOLUME_STORAGE_CLASS`로만 한다. API 요청에 hostPath, PV 이름, selector,
다른 namespace, 임의 StorageClass를 넣으면 거부한다. PV나 호스트 파일시스템을
직접 삭제하는 API는 제공하지 않는다.

## 연결과 삭제

- 노트북의 기존 볼륨 선택지는 같은 namespace의 사용자 볼륨만 반환한다.
- 직접 API를 호출해 서비스용/미분류/다른 사용자의 PVC를 지정해도 거부한다.
- 선택한 PodDefault의 PVC와 hostPath도 검사해 사전 설정을 통한 우회를 차단한다.
- 새 workspace/data PVC도 같은 정책으로 생성하며 이름 충돌을 자동 재사용하지 않는다.
- 마운트 위치는 `/home/jovyan`, `/home/rstudio`, `/workspace` 아래로 제한한다.
- 노트북 삭제는 PVC를 삭제하지 않는다. 데이터 삭제는 볼륨 화면에서 별도로 한다.
- PVC 삭제 전 Pod, Deployment, StatefulSet, DaemonSet, Job, CronJob, Notebook,
  RayCluster의 참조를 확인한다. 중지/0 replicas 작업의 참조도 보호한다.
- 사용 상태 조회 실패는 삭제 실패로 처리한다. UID/resourceVersion 전제조건으로
  다른 객체나 변경된 PVC를 삭제하지 않으며 finalizer 강제 제거도 하지 않는다.
- 화면의 삭제는 정확한 볼륨 이름 입력으로 확인한다.

이전 노트북과 PVC는 자동 변환하거나 중단하지 않는다. 기존 데이터는 보존되며,
기존 미분류 PVC를 새 노트북에서 다시 연결하려면 운영자가 별도로 소유권과 용도를
확인해야 한다. 기존 노트북 스펙을 전부 다시 검증·재작성한 것은 아니다.

## 기존 A40 서버 반영

이 기능과 이전 이미지/namespace 보호는 앱 변경이다. 고정 커밋 설치기를 다시
실행하는 것만으로 반영되지 않는다. 기존 서비스를 실행한 상태에서 최신 저장소를
별도 폴더로 clone하고 다음 업데이트 스크립트를 실행한다. /data로 연결된
기존 prediction-manager-work 아래를 사용해 루트 디스크에 소스를 쌓지 않는다.
설치기가 관리하는
`~/pman-server-725eb2ed/source`의 detached checkout은 수정하지 않는다.

```bash
git clone --depth 1 --branch OPFW_development_ETRI_pman --single-branch https://github.com/etri/FeDiT.git "$HOME/prediction-manager-work/FeDiT-user-sandbox"
bash "$HOME/prediction-manager-work/FeDiT-user-sandbox/OPFW/ml_prediction_manager_v2/scripts/server-a40/update-user-sandbox.sh"
```

같은 clone 폴더가 이미 있다면 그 폴더에서 브랜치/변경 사항을 확인하고
`git pull --ff-only`로 갱신한 뒤 두 번째 명령을 실행한다.

스크립트는 현재 배포 이미지에 최신 커밋의 app/static 파일만 덧씌워 새 이미지를
빌드한다. 기존 의존성을 재설치하지 않으며 빌드 복사본의 PVC 자료형 호환성을
보정한다. Deployment를 갱신하고 Nginx의 볼륨 경로를 PM으로 전환한다.
중지된 작업과 사전 설정의 참조 조회를 위해 DaemonSet/CronJob/PodDefault 읽기
권한 세 규칙만 추가한다.
앱 배포·Nginx 갱신·공개 API 확인 중 실패하면 이전 이미지와 프록시 설정으로
원복을 시도하며, 원복 실패도 별도로 출력한다. 추가한 읽기 권한은 유지한다.

`SANDBOX UPDATE RESULT` 블록의 `EXIT=0`과 `USER_VOLUME_SCOPE_PASS`를 확인한다.
`UPDATE_REPORT` 경로에는 제한된 권한으로 백업과 결과를 보존한다. 그 디렉터리
전체에는 컨테이너 메타데이터/프록시 설정도 있으므로 우선 결과 블록만 전달한다.
성공 후 브라우저에서 기존 주소 `/volumes/`를 새로고침한다.

## 검증과 한계

로컬에서 볼륨 API·연결·삭제 검사 24개, 이전 리소스 격리 검사 29개,
Notebook 검사 3개와 빌드 호환성/원복 모의 검사 2개, 총 58개를 통과했다.
볼륨 화면의 namespace URL, 생성 요청, 읽기 전용 동작, 사용 중 오류와 안전한
텍스트 표시도 Node DOM 모의 검사로 확인했다. 셸·Python·JavaScript
문법도 검사한다. 2026-10-18 새 Ubuntu 22.04 WSL2 설치에서 실제 PVC 생성→Pod
마운트→읽기/쓰기→사용 중 삭제 차단→0 replicas Deployment 참조 삭제 차단→삭제와
기존 PVC UID 보존을 설치 직후와 서비스 재시작 후 통과했다. 브라우저의 전용
볼륨 화면에서도 사용자 시험 PVC 표시와 플랫폼 PVC 제외를 확인했다.
현재 코드를 목표 A40에서 직접 실행한 결과와는 구분한다.
세부 환경·소스·증거 해시: [VALIDATION.md](../scripts/server-a40/VALIDATION.md).

이 기능은 앱의 사용자 저장소 경계다. 호스트 Docker 소켓, Kubernetes 권한 전체,
기존 Kubeflow 앱 내부 접근과 네트워크 정책까지 분리한 완전한 실행 샌드박스는
아니다. 현재 검수용 Nginx의 고정 사용자 헤더도 실제 다중 사용자 인증으로
대체해야 한다. 운영자/root나 직접 Kubernetes 권한을 가진 사용자의 조작까지
이 API 라벨 검사로 통제할 수는 없다.
