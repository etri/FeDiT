# 모델링·시뮬레이션 엔진 (NFLOW 해석기)

격자 볼츠만 방법(LBM) 기반의 GPU 해석기 5종이다. 이에이트(주)가 개발했고, FeDiT에서 가상 물리 해석을 맡는다.

| 해석기 | 푸는 문제 | 실행 파일 |
| --- | --- | --- |
| 다성분 | 섞이지 않는 두 유체의 경계면 움직임 | LBM |
| 다상 | 액체와 기체가 함께 있는 흐름 (Peng-Robinson 상태방정식) | LBM |
| 농도확산 | 흐름을 따라 이동하고 퍼지는 농도 | LBM |
| 복합 열전달 | 고체 열전도와 유체 열대류를 함께 푸는 공액 열전달 | LBM |
| 유체-DEM 연성 | 자유수면 흐름과 입자(DEM)의 상호작용 | LBM_DEM |

해석기 5종은 실행 파일 2개로 돈다. Windows에서는 `LBM_Runtime.exe`, `LBM_DEM_Runtime.exe`, Linux에서는 `NFLOW_LBM`, `NFLOW_LBM_DEM`이다. 어느 해석기를 쓸지는 입력 JSON이 정한다.

## 빠른 시작

NVIDIA GPU와 드라이버가 있는 PC에서, 이 폴더(`OPFW/modeling_simulation_engines`)를 현재 폴더로 두고 실행한다. 스크립트가 실행 파일 묶음을 풀고, 새 작업 폴더에서 해석기를 돌린 뒤 성공 여부를 판정한다.

```powershell
# Windows (PowerShell 7). Visual C++ 2015–2022 재배포 가능 패키지(x64)가 필요하다
pwsh -File scripts\run_case.ps1 examples\03_concentration_diffusion\03_concentration_diffusion.json
```

```bash
# Linux. xz와 libgomp1이 필요하다
bash scripts/run_case.sh examples/03_concentration_diffusion/03_concentration_diffusion.json
```

예제 03은 1분 안에 끝나고 결과가 0.5 MB다. 결과는 `runs/<시각>_<JSON 이름>/`에 생기며 ParaView로 연다. 나머지 예제와 걸리는 시간은 [`examples/README.md`](examples/README.md)에 있다.

## 폴더 구성

| 폴더 | 내용 |
| --- | --- |
| [`release/`](release/) | 실행 파일 묶음 (Windows `.7z`, Linux `.tar.xz`), 빌드 정보, 사용 약관, 서드파티 고지 |
| [`examples/`](examples/) | 해석기별 예제 5개: 입력 JSON, STL, 결과 미리보기 |
| [`scripts/`](scripts/) | 예제 실행 스크립트 (`run_case.ps1`, `run_case.sh`) |
| [`doc/`](doc/) | [입력 JSON](doc/input_json.md), [결과 형식](doc/output_format.md), [확인 결과](doc/validation.md) |
| [`integration/`](integration/) | FeDiT 연동용 해석엔진 API와 Docker 이미지 |
| [`src/`](src/) | 해석기 5종의 물리 식 소스 |

## 라이선스

이 폴더는 두 가지 조건으로 나뉜다.

| 대상 | 조건 |
| --- | --- |
| `src/`, `examples/`, `scripts/`, `doc/`, `integration/` | LGPL-2.1-only |
| `release/`의 실행 파일 묶음 | 이에이트(주) 약관 ([`release/LICENSE.md`](release/LICENSE.md)). 오픈소스가 아니며 저장소의 LGPL-2.1 선언이 적용되지 않는다 |

`src/`는 해석기의 물리 식 부분만 담았다. 격자 자료구조, 유동 계산 핵심부, 격자 생성 등은 들어 있지 않으므로 단독으로 빌드되는 해석기가 아니다. 실행 파일에 들어 있는 제3자 구성요소는 [`release/THIRD_PARTY_NOTICES.md`](release/THIRD_PARTY_NOTICES.md)에 있다.

## 알아 둘 점

- LBM_DEM(유체-DEM 연성)은 계산이 발산해도 종료 코드 0으로 끝날 수 있다. 실행 스크립트와 연동 API는 로그에 `nan`이나 `inf`가 있으면 실패로 판정한다. 실행 파일을 직접 돌릴 때는 `run.log`를 확인한다.
- 입력 JSON에서 STL 영역(`region_type: "region_ref"`)에는 `local_source_term_id`를 꼭 적는다. 소스가 필요 없으면 0 소스를 하나 두고 그 번호를 적는다([`doc/input_json.md`](doc/input_json.md)).
- 사용자 정의 함수(UDF) 기능은 이번 확인 범위에 넣지 않았고, 예제에서도 쓰지 않는다.
