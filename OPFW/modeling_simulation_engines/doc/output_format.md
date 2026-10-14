# 결과 형식

해석기는 실행한 폴더 안에 결과 폴더를 만든다. 입력 JSON의 `result_report.export_path`가 비어 있으면 결과 폴더 이름은 JSON 파일 이름(확장자 제외)이고, 결과 파일 이름의 앞부분은 `meta.title`이다. 예제는 둘을 같게 맞췄다.

## 폴더 구성

예제 04 짧은 실행(격자 2단계, 저장 3회)의 결과 폴더는 다음과 같다.

```text
04_conjugate_heat_transfer_short/            결과 폴더 (JSON 파일 이름)
├── 04_conjugate_heat_transfer_short_0.vtm   저장 0회째 묶음. ParaView에서 이 파일을 연다
├── 04_conjugate_heat_transfer_short_1.vtm
├── 04_conjugate_heat_transfer_short_2.vtm
├── bin/
│   ├── LEVEL_00/04_conjugate_heat_transfer_short_<n>.vtu   격자 단계 0의 결과
│   └── LEVEL_01/04_conjugate_heat_transfer_short_<n>.vtu   격자 단계 1의 결과
└── continue/                                재시작 파일
    ├── 04_conjugate_heat_transfer_short_LEVEL_0.bin
    └── 04_conjugate_heat_transfer_short_LEVEL_1.bin
```

| 파일 | 위치 (결과 폴더 기준) | 내용 |
| --- | --- | --- |
| 저장 묶음 | `<title>_<n>.vtm` | 한 저장 시점의 격자 단계별 `.vtu`를 묶은 파일 |
| 격자 결과 | `bin/LEVEL_<xx>/<title>_<n>.vtu` | 셀별 물리량 (`result_report.items`에서 고른 것) |
| 입자 결과 (LBM_DEM) | `<title>_grid<g>_<n>.vtk` | 입자 위치·속도·힘 등. `g`는 `particle_generation`의 `grid` 번호 |
| 재시작 파일 | `continue/` | 이어서 계산할 때 쓰는 상태. 저장할 때마다 덮어쓴다 |
| 발산 직전 상태 (LBM) | `divergence/` | 계산이 발산해 멈췄을 때만 생긴다 |

`<n>`은 0부터 붙는 저장 번호다. LBM_DEM에서 고정 입자(예제 05의 벽 입자)는 움직이지 않으므로 0번 저장에만 `<title>_grid0_0.vtk`로 남는다. 마지막 시점을 볼 때도 이 파일을 함께 연다.

## 보는 방법

ParaView에서 `.vtm` 파일들을 열면 저장 시점이 시간 단계로 이어진다. `.vtm`은 `bin/` 아래 `.vtu`를 상대 경로로 가리키므로, 결과를 옮길 때는 결과 폴더를 통째로 옮겨야 한다.

## 크기

저장 1회의 크기는 격자 수와 저장 항목에 따라 달라진다. 예제 01 다성분은 저장 1회의 `.vtu`가 약 690 MB, 예제 04 복합 열전달은 약 305 MB다. 이 중 상당 부분(01은 약 70%, 04는 약 40%)은 저장마다 다시 쓰는 격자 구조라서, 저장 항목을 줄여도 크기가 크게 줄지 않는다. 결과를 줄이려면 저장 간격(`save_time_interval`)을 늘리는 것이 가장 효과가 크다.

재시작 파일은 JSON 설정으로 끌 수 없다. 저장 때마다 덮어쓰므로 저장 횟수와 관계없이 한 벌만 남는다. 필요 없으면 해석이 끝난 뒤 `continue/`를 지워도 된다.
