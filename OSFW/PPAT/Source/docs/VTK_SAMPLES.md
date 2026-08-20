# VTK 예제 데이터 생성기

`data/wind.vtk` 하나로는 시각화 기능을 검증하기 어려워, 해석적으로 정의된 유동장을
Legacy VTK 파일로 찍어내는 생성기를 두었습니다.

```bash
npm run samples          # 전체 생성 → data/samples/
npm run samples:list     # 케이스 목록만 확인
npm run samples:verify   # 앱 파서로 왕복 검증
```

옵션:

| 옵션 | 설명 |
| --- | --- |
| `--only 03,07` | 이름 부분 일치로 일부만 생성 |
| `--res 2` | 격자 해상도 배수 (2배 → 용량 8배) |
| `--up y` | Z-up 대신 Y-up 으로 축 변환해서 출력 |
| `--out <dir>` | 출력 폴더 (기본 `data/samples`) |

생성물은 `.gitignore` 되어 있습니다. `*.vtk` 가 `.gitattributes` 에서 LFS 대상이라
35 MB를 커밋하면 LFS 용량만 잡아먹고, 어차피 스크립트로 언제든 재생성되기 때문입니다.

---

## 파일 규격

[`src/lib/vtk-legacy.mjs`](../src/lib/vtk-legacy.mjs) 가 읽는 부분집합에 정확히 맞춥니다.

```
# vtk DataFile Version 3.0
<ASCII 한 줄 코멘트>
BINARY
DATASET STRUCTURED_POINTS
DIMENSIONS nx ny nz
SPACING   sx sy sz
ORIGIN    ox oy oz
POINT_DATA N
SCALARS <name> float 1
LOOKUP_TABLE default
<N개 float32, big-endian>
VECTORS <name> float
<3N개 float32, big-endian>
```

지켜야 할 제약이 몇 가지 있습니다.

- **헤더 4줄의 순서가 고정**입니다. 리더가 1~4행을 위치로 읽습니다
  ([vtk-legacy.mjs:72-82](../src/lib/vtk-legacy.mjs#L72-L82)).
- **코멘트 행은 반드시 ASCII 한 줄**이어야 합니다. 한글을 넣으면 리더의
  `TextDecoder('ascii')` 에서 깨지는 것은 물론이고, 인코딩 과정에서 하위 바이트가
  `0x0A`/`0x0D` 로 떨어져 줄 구조 자체가 깨집니다(예: `밍` U+BC0D → `0x0D` = CR).
  그래서 생성기는 코멘트에 케이스 이름(ASCII)만 쓰고, 한글 제목은 `manifest.json` 에 둡니다.
- **바이너리 블록은 big-endian**입니다. 리더가 무조건 바이트 스왑합니다.
- 포인트 인덱싱은 **x-fastest** (`i + j*nx + k*nx*ny`).

## 좌표계

기본 출력은 **Z-up** (z = 고도, 바람은 주로 +x). CFD 관례이자 가져오기 대화상자의
기본값(`importUpAxis = 'z'`, [controls.mjs:1256](../src/controls.mjs#L1256))과 일치합니다.
불러올 때 Up축 = **Z**, 스케일 = **1** 로 두면 됩니다.

`--up y` 로 만들면 파일 자체가 `(x, y, z) → (x, z, -y)` 로 회전되어 저장됩니다.
이건 `importVTKOverlay` 경로가 `upAxis: 'y'` 로 고정되어 있어서
([controls.mjs:1626](../src/controls.mjs#L1626)) 필요한 변형입니다.

## 표준 도메인

특별한 언급이 없으면 **400 × 300 × 96 m**, 격자 간격 5 × 5 × 4 m → **81 × 61 × 25**
(123,525 포인트, 파일 약 1.9 MB). 접근류는 도시 조도(z₀ = 0.5 m)의 대수 분포이며
50 m 고도에서 6 m/s 입니다.

---

## 케이스 목록

### 00_tiny_smoke — 파서 점검용 초소형 격자
5×4×3, 비대칭 spacing `(2.5, 3, 1.5)`, 0이 아닌 origin `(-10, -20, 2)`.
`scalars = i + 10j + 100k`, `vectors = (i, j, k)` 로 인덱스를 그대로 인코딩했습니다.
값이 정확히 복원되면 **엔디안 처리와 x-fastest 순서, origin/spacing 반영**이
한꺼번에 검증됩니다. `npm run samples:verify` 가 이 파일만 값 단위로 대조합니다.

### 01_uniform_flow — 균일류
전 영역 +x 5 m/s. 스트림라인이 완전한 직선, 글리프 길이·색이 균일해야 합니다.
축 방향과 부호가 틀어졌을 때 가장 먼저 드러나는 회귀 케이스.

### 02_abl_shear — 대기경계층 전단류
`U(z) = Uref·ln((z+z₀)/z₀) / ln((zref+z₀)/z₀)`. 지표 0 → 상공 6.84 m/s.
수직 슬라이스와 컬러맵 범위 확인용.

### 03_building_wake — 단일 건물 후류 *(주력 케이스)*
50 × 70 × 45 m 건물 1동. 정체점 감속, 측면 가속(최대 10.6 m/s), 지붕 상승류,
후류 역류가 모두 들어 있습니다. 후류는 유선함수 `ψ = A·sin(πξ)·sin(πζ)` 로 만든
폐쇄 와류라서 재순환 영역에서 실제로 유속이 뒤집힙니다 — 스트림라인 적분기가
제대로 도는지 보려면 이 파일이 가장 유용합니다.

### 04_street_canyon — 가로협곡 스키밍 흐름
높이 30 m 슬래브 6열(폭 22 m, 협곡 34 m, H/W ≈ 0.9). 협곡마다 단일 와류가 생겨
노면에서는 역류, 지붕 높이에서는 순류가 나타납니다. y 방향으로 거의 균일한
2차원 구조라 결과를 눈으로 판정하기 쉽습니다.

### 05_block_array — 엇갈림 건물군
높이 30~66 m 건물 12동을 엇갈리게 배치. 가로 채널링, 건물 사이 제트,
다중 후류가 겹칩니다(최대 12.8 m/s). 글리프 밀도와 stride 튜닝에 적합.

### 06_hill_speedup — 가우시안 언덕 지형 가속
높이 55 m 언덕 위의 지형추종 흐름. 정상부 가속과 풍하측 박리 와류를 포함하고,
지형 아래는 0 벡터라 **고체 영역 마스킹**이 제대로 처리되는지 볼 수 있습니다.

### 07_vortex_pair — 역회전 수직 와류 쌍
Lamb–Oseen 와류 2개(코어 28 m, 순환 부호 반대) + 약한 평균류 + 코어 상승류.
스트림라인이 강하게 감기므로 RK4 스텝 크기·최대 스텝 수 튜닝에 씁니다.
스칼라는 속력이 아니라 **와도**라서, 스칼라와 벡터 크기가 분리된 케이스이기도 합니다.

### 08_abc_chaotic — ABC 유동 (적분기 스트레스 테스트)
Arnold–Beltrami–Childress 해석해. 주기 200 m 정육면체(51³)에서 3차원 카오스 궤적을
만듭니다. 도시 바람은 아니고 순수하게 적분 안정성 확인 전용입니다.

### 09_plume_dispersion — 굴뚝 플룸 확산 *(벡터 + 스칼라)*
높이 45 m 점오염원의 가우시안 플룸 농도(2 ~ 2,087 µg/m³) + 약한 사행이 있는 ABL 바람장.
**벡터와 스칼라가 물리적으로 짝지어진 유일한 케이스**라, 스트림라인 위에 농도를
얹어 보는 검증에 씁니다. 배출구 근처 특이점은 초기 확산폭 σ₀ = 8 m 로 제거했습니다.

### 10_concentration_only — 교통 선오염원 농도 *(SCALARS 전용)*
`VECTORS` 블록이 아예 없는 파일. 도로 4개와 교차로 핫스팟 농도장(15 ~ 2,925 µg/m³)으로,
스칼라 슬라이스와 컬러맵 경로만 단독으로 시험합니다.

### 11_vectors_only — 건물군 바람장 *(VECTORS 전용)*
`SCALARS` 블록이 없는 파일. 유동장은 05번과 동일하므로 둘을 비교하면
스칼라 부재 시 글리프 색상 산정이 속력으로 잘 대체되는지 바로 확인됩니다.

### 12_thermal_updraft — 열적 상승류
지표 수렴 유입 → 상승 코어 → 상공 확산으로 이어지는 축대칭 열기둥이 평균풍에 기울어집니다.
반경 방향 성분은 연속방정식에서 유도했습니다. 스칼라는 온도 편차 [K].
**연직 성분이 지배적인 유일한 케이스**라 up축을 잘못 잡으면 바로 티가 납니다.

### 13_block_array_highres — 고해상도 (성능 측정용)
05번과 같은 유동장을 161 × 121 × 49 (954,569 포인트, 14.6 MB)로 생성.
파싱 시간, 글리프 stride, 메모리 사용량 측정용이라 `--only 13` 로 따로 뽑는 편이 낫습니다.

---

## 알아둘 점: 현재 임포트 경로가 실제로 쓰는 것

`api.importVTKWindField` 는 지금 **벡터가 있을 때만** 무언가를 그립니다
([main.mjs:4743](../src/main.mjs#L4743)) — 반투명 볼륨 박스 + 속력으로 색칠한
병합 화살표 글리프(`kind: 'vtk-glyphs-merged'`)까지입니다.

- `createScalarSliceFromVTK` ([main.mjs:5007](../src/main.mjs#L5007)) 는 정의만 되어 있고
  **호출하는 곳이 없습니다.** 따라서 `10_concentration_only.vtk` 는 지금 불러도
  볼륨 박스만 나오고 슬라이스는 생기지 않습니다.
- `generateStreamlineRibbons` 도 임포트 경로에서 호출되지 않아
  `kind: 'wind-streamlines'` 레코드는 만들어지지 않습니다.
- `controls.mjs` 가 부르는 `importVTKOverlay` 는 `main.mjs` 에 정의가 없어
  옵셔널 체이닝으로 조용히 무시됩니다.

즉 TODO 4번(VTK 스트림라인)은 아직 배선 전이고, 예제 파일들은 그 배선을 할 때
바로 쓸 수 있도록 미리 준비해 둔 것입니다. `npm run samples:verify` 는 임포트 UI를
거치지 않고 `generateStreamlineRibbons` 를 직접 호출하므로, **적분기 자체는 14개 파일
모두에서 정상 동작함**을 이미 확인했습니다.
