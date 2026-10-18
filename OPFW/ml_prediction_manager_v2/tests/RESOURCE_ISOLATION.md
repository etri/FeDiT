# 사용자 관리 영역과 플랫폼 구성요소 분리 (2026-10-17)

## 확인된 문제

기존 이미지 화면은 관리자에게 로컬 레지스트리 전체를 반환했다. 시스템 이미지
보호는 일부 이름 목록에만 의존했고, 이름을 모르는 플랫폼 이미지는 미분류로
처리해 관리자가 삭제할 수 있었다. 사용자 이미지 빌드/삭제도 전역 Jupyter
ConfigMap을 변경하고 공유 웹 앱을 재시작했다.

관리자 namespace override가 시스템 namespace까지 허용되는 경로와,
노트북 삭제 시 `{name}-workspace`라는 이름만으로 PVC를 삭제하는 경로도 확인했다.

## 이번 변경의 범위

- 이미지 목록과 태그 조회는 선택한 사용자 영역만 반환한다. 시스템/미분류
  이미지는 목록·대시보드 이미지 목록에서 제외한다.
- 관리자도 생성자 영역 밖의 이미지를 삭제할 수 없다. 화면을 우회한 API 호출,
  `force=true`, 시스템 이미지 이름 또는 잘못된 경로도 차단한다.
- Registry 서비스도 소유권 형식이 확인되지 않는 저장소를 삭제하지 않는다.
  Docker 삭제 fallback은 부모 이미지 가지치기를 하지 않는다.
- 빌드 이름·태그를 검증하고 빌드 로그도 생성자의 영역으로 제한한다.
- 빌드/삭제가 전역 Notebook ConfigMap이나 공유 Jupyter 배포를 변경하지 않는다.
  Notebook 선택지는 현재 사용자 영역의 이미지와 기존 공식 기본 이미지를 사용한다.
- PM 사용자 namespace는 기존 생성 규칙인 `kubeflow-{email}` 영역으로 제한한다.
  시스템 namespace는 관리자도 선택할 수 없고, 관리자 override는 등록된 Profile만
  허용한다. view contributor는 선택한 영역을 변경할 수 없다.
- Notebook 생성/시작/중지/삭제, PVC 조회, 모델 배포 대상, AutoML Notebook 대상,
  사용자별 MLflow/Ray/NiFi 정리 및 관리 API에도 해당 경계를 적용한다.
- 후속 볼륨 보호에서는 Notebook 삭제 시 PVC를 모두 보존하고, 별도 볼륨 API에서
  소유권과 사용 상태를 확인한 뒤 삭제한다. [VOLUME_SANDBOX.md](VOLUME_SANDBOX.md) 참조.
- 모니터링의 앱/PVC/Ray/MLflow 등 namespace 대상은 선택한 사용자 영역으로
  제한한다. 노드/GPU의 물리 지표처럼 읽기 전용 호스트 지표까지 제거한 것은 아니다.

## 검증

모듈 폴더 `OPFW/ml_prediction_manager_v2`에서:

```bash
python -m unittest discover -s tests -p test_resource_isolation.py -v
python -m unittest discover -s tests -p test_container_port.py -v
```

API 및 서비스 모의 검사는 실제 클러스터/Docker를 변경하지 않는다.
로컬에서 리소스 격리 회귀 검사 29개와 기존 Notebook 포트 회귀 검사 3개가
통과했고, 변경된 Python 코드와 이미지 화면 JavaScript의 문법도 확인했다.
2026-10-18 새 Ubuntu 22.04 WSL2 설치에서 실제 사용자 이미지 등록·목록·태그·삭제,
공유 이미지 ID의 사용자 태그 삭제 시 플랫폼 태그 보존, 시스템 namespace 차단과
브라우저 Images·Volumes 화면을 확인했다. 최신 코드의 목표 A40 직접 실행 결과는
아니다. [실행 환경과 증거](../scripts/server-a40/VALIDATION.md)를 참조한다.

## 남은 실행 격리와 배포 조건

이번 변경은 앱의 관리 API 경계다. 완전한 호스트 샌드박스는 아니다.
기존 설치는 이미지 빌드용 호스트 Docker 소켓과 폭넓은 Kubernetes ServiceAccount
권한을 사용한다. 별도 빌드 실행기/레지스트리 권한과 namespace 단위 RBAC,
플랫폼 관리용 권한 분리를 별도로 설계·이관해야 한다. 이 변경이 호스트 권한이나
외부 Kubeflow 앱 자체의 권한을 모두 분리했다고 해석하지 않는다.

`scripts/server-a40/install.sh`는 플랫폼 기본 설치 소스 `725eb2ed` 설치 후 현재
checkout 커밋의 앱·정적 파일을 자동 배포하고 실제 PVC 시험까지 실행한다.
기존 서버에서 앱만 갱신하려면 `update-user-sandbox.sh`와 `verify-user-sandbox.sh`를
사용한다. git pull만으로 실행 중인 앱이 갱신되는 것은 아니다.
이미지·볼륨 외 Notebook/모델 기능 전체의 실서버 동작까지 검증한 결과는 아니다.
