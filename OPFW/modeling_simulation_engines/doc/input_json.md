# 입력 JSON

해석기는 입력 JSON 파일 하나와, JSON이 가리키는 STL 파일을 읽는다. 이 문서는 예제 5개에 쓰인 구조를 기준으로 각 부분이 무엇을 정하는지 설명한다. 새 문제를 만들 때는 가장 비슷한 예제의 JSON을 복사해 값을 바꾸는 것이 가장 안전하다.

## 전체 구조

```json
{
  "meta":   { "version": 202502, "title": "03_concentration_diffusion" },
  "config": { "solver_common": { ... }, "materials": [ ... ], "lattice_generation": [ ... ], "result_report": { ... }, ... }
}
```

`meta.title`은 결과 파일 이름의 앞부분이 된다. 예제는 모두 JSON 파일 이름과 같게 맞췄다. `meta.version`은 입력 형식의 판을 나타낸다.

`config` 안의 주요 블록은 다음과 같다.

| 블록 | 정하는 것 |
| --- | --- |
| `solver_common` | 해석기 종류, 충돌 모델, 시작·종료 시간, 시간 간격, 사용할 GPU |
| `initial_conditions` | 처음 압력, 속도, 농도·온도 등 |
| `reference_values` | 기준 압력·속도 등 (일부 예제는 `reference_quantities`) |
| `source_terms` | 영역 전체의 운동량 소스, 중력 |
| `local_source_terms` | 영역별 소스 목록. STL 영역이 `local_source_term_id`로 번호를 고른다 |
| `materials` | 재질 목록. 이름, 상(gas·liquid·solid), 밀도, 점성, 확산계수, 열물성 |
| `model_settings` | 난류 모델과 그 상수 |
| `<해석기>_settings` | 해석기별 모델 설정 (아래 표) |
| `outer_boundary_condition` | 계산 영역 6면(`xmin`~`zmax`)의 경계조건 |
| `lattice_generation` | 격자 크기, 계산 영역, STL로 정하는 영역 목록 |
| `result_report` | 저장 위치, 형식, 저장 시간 간격, 저장할 물리량 |

## 해석기 고르기

`solver_common.solver_type`이 해석기를 정한다.

| 해석기 | `solver_type` | 해석기별 설정 블록 | 실행 파일 |
| --- | --- | --- | --- |
| 다성분 | `Multi_component` | `multi_component_settings` | LBM |
| 다상 | `multiphase` | `multiphase_settings` | LBM |
| 농도확산 | `concentration_diffusion` | `concentration_diffusion_settings` | LBM |
| 복합 열전달 | `thermal` | `thermal_settings` | LBM |
| 유체-DEM 연성 | `free_surface` + `particle_generation` | `grid`, `particle_generation` | LBM_DEM |

유체-DEM 연성은 `solver_type`만으로는 실행 파일을 정할 수 없다. LBM에도 같은 이름의 자유수면 해석기가 있기 때문이다. 입자 설정(`particle_generation`)이 있는 입력은 LBM_DEM으로 돌린다. 실행 스크립트도 이 기준으로 실행 파일을 고른다.

## 해석기별 설정 (예제 값)

| 블록 | 예제의 키 |
| --- | --- |
| `multi_component_settings` | `number_of_components`(2), `interface_width`, `mobility`, `surface_tension`, `miscibility` |
| `multiphase_settings` | `multiphase_model`(`PR`), `critical_temperature`, `saturated_temperature`, `surface_tension`, `peng_robinsonA_lattice`, `peng_robinsonB_lattice` 등 |
| `concentration_diffusion_settings` | `turbulent_Schmidt` |
| `thermal_settings` | `turbulent_Prandtl`, `thermal_expansion_coefficient` |
| `particle_generation` | 입자 묶음마다 `grid` 번호, `radius`, STL 영역(`regional_segment`) |

다상 해석기는 상태방정식으로 Peng-Robinson만 쓴다. 상태방정식 값과 온도는 이 식에 맞춰 정해야 한다.

## 영역과 STL

`lattice_generation[].regional_segment`의 각 항목은 STL 하나로 영역 하나를 정한다.

| 키 | 내용 |
| --- | --- |
| `mesh_path` | STL 파일 이름. 해석기를 실행하는 폴더 기준이다 |
| `material` | `materials`의 이름 |
| `region_type` | 영역의 쓰임. 예제에 쓰인 값은 아래 표 |
| `local_source_term_id` | `local_source_terms`의 번호 (`region_ref` 영역) |

| `region_type` | 뜻 | 예제 |
| --- | --- | --- |
| `region_ref` | 처음 상태를 정하는 유체 영역 (예: 무거운 유체, 액체가 처음 차지하는 곳) | 01, 02 |
| `fixed` | 고정 고체 | 02, 05(벽 입자) |
| `cht` | 공액 열전달을 계산하는 고체 | 04 |
| `subdivision_ref` | 격자를 한 단계 더 잘게 나누는 영역 | 04 |
| `free_surface` | 처음 물이 차지하는 자유수면 영역 | 05 |

`region_ref` 영역에는 `local_source_term_id`를 꼭 적는다. 소스가 필요 없으면 `local_source_terms`에 0 소스를 하나 두고 그 번호(0)를 적는다. 예제 01·02가 이렇게 되어 있다. 이 번호를 빠뜨렸을 때의 동작은 보장되지 않는다.

## 경계조건

`outer_boundary_condition`의 `xmin`~`zmax`마다 `type`을 정한다. 예제에 쓰인 값은 `wall`, `periodic`, `inlet`, `outflow_neumann`이다. `inlet`은 `scheme`(예: `equilibrium`), `momentum_type`(예: `velocity`), `velocity`와 함께 농도(`concentration1`) 같은 스칼라 값을 받는다. 예제 03이 위아래 벽을 `inlet`으로 두고 속도와 농도를 함께 지정한 예다.

## 결과 저장

| 키 | 내용 |
| --- | --- |
| `export_path` | 결과 위치. 비워 두면 실행 폴더 안에 JSON 파일 이름으로 결과 폴더가 생긴다. 예제는 모두 비워 두었다 |
| `export_format` | 예제는 `BINARY_VTK`, `NFILE` |
| `save_start_time`, `save_end_time`, `save_time_interval` | 저장 구간과 간격 (해석 시간 단위) |
| `items` | 저장할 물리량. `true`인 것만 저장한다 |

결과 크기는 저장 횟수에 거의 비례한다. 원래 길이 입력의 결과가 너무 크면 `save_time_interval`을 늘린다. 결과 폴더 구성은 [`output_format.md`](output_format.md)에 있다.

## 난류 모델

`model_settings.turbulence_model`에는 `none`, `smagorinsky`, `wale`, `sa`, `kw_sst`를 쓸 수 있다. 예제 04·05는 `smagorinsky`를 쓴다.
