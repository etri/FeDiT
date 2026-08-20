# TODO: 전처리 에디터 과제 로드맵 (SimEdit9)

본 문서는 향후 구현해야 할 4가지 과제를 정리합니다.

- 1) 개별 건물의 STL 파일 생성
- 2) 생성된 STL 경로를 Tofu JSON의 MeshPath에 반영
- 3) 농도 소스(Concentration Source) 구현
- 4) VTK 기반 시각화(스트림라인)

현재 기준 프로젝트 상태 요약
- 해석공간(analysis-space) 타입 및 AABB 편집/Export는 구현됨.
- 건물(박스/원통) 메타(BoundaryScheme, Ratio, MeshPath) 편집 및 JSON Export 포함 로직이 구현됨.
- Tofu 전처리 JSON Export 시, 해석공간과 겹치는 오브젝트만 Struct에 포함하도록 필터링함.

---

## 1) 개별 건물의 STL 파일 생성

목표
- 각 건물(박스/원통/임포트 메시)을 독립 .stl 파일로 내보낸다.
- 좌표계: 현재 장면의 월드 좌표로 bake된 정점/법선을 사용한다.
- 파일 저장 위치: `data/exports/stl/{project-or-scene}/{objectName_or_id}.stl`

설계
- 対象オブジェクト: type ∈ { `building-box`, `building-cylinder`, `mesh-import` }.
- 지오메트리 취득 전략:
  - mesh-import: 엔티티의 meshInstances에서 VertexBuffer/IndexBuffer 추출 → 월드 변환 적용 → STL로 덤프.
  - building-box: 파라메트릭 박스(중심/크기/회전)를 12개의 삼각형으로 생성. 로컬→월드 행렬 적용.
  - building-cylinder: 세그먼트 수 N(기본 32)로 원통 측면/상단/하단 삼각화. 로컬→월드 행렬 적용.
- 법선 계산:
  - 파라메트릭: 삼각형의 면 법선을 cross로 계산.
  - 기존 메시: 원본 법선을 사용할 수 있으면 사용, 없으면 삼각형 면 법선 계산.
- STL 포맷: 바이너리(권장, 용량/속도 우수). 옵션으로 ASCII 지원.

API / 코드 구조
- `src/exporters/stlExporter.mjs` (신규):
  - `exportMeshInstancesToSTL(meshInstances, worldMatrix, options): ArrayBuffer`
  - `exportTrianglesToBinarySTL(triangles, options): ArrayBuffer`
- `src/main.mjs`:
  - `api.exportBuildingToSTL(id, { dir, ascii? })`
  - `api.exportAllBuildingsToSTL({ dir, ascii? })`
  - 내보내기 성공 시, 해당 record.meta.building.meshPath를 상대 경로로 자동 업데이트(2단계와 연계).

파일명 규칙
- `{type}-{nameOrId}.stl` 예: `box-OfficeA.stl`, `cyl-#42.stl`, `mesh-Bld_03.stl`

엣지 케이스
- 스케일이 0에 가까움/삼각형 면적 0 → 삼각형 제외 또는 경고.
- 정점 수 과다로 인해 바이너리 STL 80바이트 헤더 + 삼각형 50바이트/개 계산 → 파일 크기 사전 안내.

수락 기준(AC)
- AC1: 박스/원통 각각 1개씩 생성 후 STL 내보내기가 동작하고 파일이 저장된다.
- AC2: 내보낸 STL을 일반 뷰어(meshlab 등)로 열어 형상이 올바르게 표시된다.
- AC3: 월드 변환(위치/회전/스케일)이 STL에 반영된다.

---

## 2) JSON의 MeshPath에 STL 경로 반영

목표
- 1)에서 생성한 STL 경로를 건물 메타에 기록하고, Tofu JSON Export 시 `ui.Struct[*].MeshPath`에 반영한다.

설계
- 메타 갱신: `api.exportBuildingToSTL` 완료 후 `rec.meta.building.meshPath = relativePath`로 업데이트.
- Export 우선순위(이미 구현된 정책 유지):
  1) `rec.meta.building.meshPath`
  2) `rec.meta.source?.name` (임포트 원본명)
  3) `""`
- buildTofuPreprocessingJson()는 위 우선순위로 MeshPath를 써 넣는다.

UI/흐름
- 개별 또는 일괄 STL 내보낸 뒤, Export JSON 실행 → MeshPath가 채워진 상태로 출력.

수락 기준(AC)
- AC1: STL 내보낸 후 즉시 JSON Export 시 해당 건물의 MeshPath가 STL 상대 경로로 출력된다.
- AC2: STL을 내보내지 않은 건물은 기존 규칙대로 빈 문자열 또는 임포트명으로 출력된다.

---

## 3) 농도 소스(Concentration Source) 구현

배경
- 과거 요구사항에서 폐기되었으나, 본 과제에서 재도입 요청이 있음. 옵션 기능으로 구현하고 Export에서 포함 가능하도록 한다.

목표
- 타입: `concentration-source` 재도입.
- 데이터: `concentration[3]`, `velocity[3]`, `boundaryScheme(기본 EQ=4 또는 정책값)`.
- 시각화: 작은 구체 + 방향 화살표(velocity) 엔티티.
- 인스펙터: 농도 3종/속도/스킴 편집.
- Export(JSON): tofu `Document`의 `Struct` 배열에 `ConcentrationSource`로 직렬화.

설계
- `src/main.mjs`
  - 생성기: `createConcentrationSource()`
  - 메타 기본값: `{ concentration:[0.1,0.2,0.3], velocity:[0,0,0], boundaryScheme:4, ratio:1, meshPath:"" }`
  - observer: `selected.concentration`, `selected.velocity`, `selected.boundaryScheme` 반영 및 히스토리.
  - Export: `Struct`에 `{ ...common, Concentration1,2,3, Velocity }` 추가.
- `src/controls.mjs`
  - 메뉴: Create > Concentration Source
  - Inspector: 농도/속도/스킴 입력 + 적용 버튼

수락 기준(AC)
- AC1: 생성/선택/편집/Undo-Redo가 동작한다.
- AC2: Export JSON에 ConcentrationSource 항목이 포함된다(옵션 토글로 켜고 끌 수 있음).

비고
- 분석공간(AABB) 기반 필터링 정책을 그대로 적용(해석공간과 교차할 때만 Export).

---

## 4) VTK 시각화(스트림라인)

> 검증용 예제 데이터: `npm run samples` → `data/samples/` (14종).
> 규격/케이스 설명은 [VTK_SAMPLES.md](VTK_SAMPLES.md) 참고.

목표
- 장면 또는 해석공간의 유동장을 바탕으로 스트림라인을 시각화한다.
- 1차 목표: 데모 수준(균일 유속장/간단한 시드)으로 화면에 폴리라인 표시.

설계 옵션
- 라이브러리: `vtk.js` 도입.
- 통합 방식:
  - A안: 별도 `<canvas>`로 vtk.js 렌더링(오버레이/패널). UI와 상호작용 동기화.
  - B안: 스트림라인을 샘플링한 후 PlayCanvas 라인 렌더러로 그리기(단, 정확한 적분기는 직접 구현 필요).
- 초기 버전 제안: A안을 채택해 vtk.js 파이프라인으로 Seed → Integrator → PolyLine 출력.

데이터 경로
- 유동장 소스: 
  - 간단: 사용자가 Inspector에서 균일 Velocity를 설정(해석공간의 면 설정 또는 별도 필드).
  - 심화: 외부 시뮬레이션 결과(VTK/VTU/VTKjs)를 로드하여 벡터장을 사용.

UI
- Inspector에 스트림라인 섹션: Seed 수/영역, 최대 스텝, 스텝 크기, 적분기( Euler/RK2/RK4 ), 표시 두께/색상.

수락 기준(AC)
- AC1: 시드 몇 개에서 시작하는 폴리라인 스트림라인이 화면에 렌더링된다.
- AC2: 시드 수/스텝 크기 변경 시 즉시 재계산되어 업데이트된다.
- AC3: 성능: 중간 규모(수백 라인, 수천 포인트)에서 30FPS 이상 유지.

---

## 일정 및 마일스톤(제안)

M1: STL Export(개별/일괄) + MeshPath 연동 — 3~5일
- 파라메트릭 박스/원통 삼각화 유틸
- meshInstances → STL 내보내기
- 파일 저장 + 메타 갱신 + JSON 확인

M2: Concentration Source 재도입 — 2~3일
- 엔티티/메타/인스펙터/Export
- 시각화(구+화살표) 및 편집 반영

M3: VTK 스트림라인(데모) — 3~6일
- vtk.js 도입 및 렌더링 파이프라인 구성
- 시드/파라미터 UI + 동기화
- 균일장 또는 샘플 벡터장으로 데모 구현

---

## 리스크 및 고려사항
- 대용량 메시 STL 변환 시 메모리/용량 증가 → 바이너리 STL 사용, 진행률 표시 필요.
- 임포트 메시의 원본 경로 보존/상대경로 처리 정책 확정.
- Concentration Source의 BoundaryScheme 값(EQ/HBB 등) 상충 케이스 → 정책 고정(예: EQ=4)으로 단순화.
- vtk.js와 PlayCanvas의 입력/렌더링 포커스 충돌 가능성 → 캔버스 포커스 관리 필요.

---

## 참고(Enums 값 제안)
- BoundaryScheme: HBB=1, FBB=2, EQ=4, NEQ=8
- WallType: Inlet=8, Outlet=16, FixedWall=32
- ValueType: Velocity=1, Pressure=0

---

## 구현 체크리스트
- [ ] `src/exporters/stlExporter.mjs` 추가 및 유닛 함수 구현
- [ ] `api.exportBuildingToSTL`, `api.exportAllBuildingsToSTL` 추가
- [ ] 내보내기 후 `meta.building.meshPath` 자동 갱신
- [ ] JSON Export(MeshPath) 검증 케이스 추가
- [ ] `concentration-source` 재도입: 생성/인스펙터/Export
- [ ] `vtk.js` 도입 및 스트림라인 데모 렌더링
