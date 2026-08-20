# 저작·가시화 도구 (PPAT)

**디지털 연합트윈 시뮬레이션 저작/가시화 도구**는 STL 기반 전처리와 VTK 기반 후처리를
하나의 3D 편집기에서 지원합니다. 해석 공간과 건물 형상을 배치해 시뮬레이션 입력을 만들고,
해석 결과를 스트림라인·스칼라 슬라이스로 확인합니다.

## 구성

| 구성 요소 | 기술 스택 | 역할 |
|---|---|---|
| `src` | PlayCanvas 2 · PCUI 5 · React 18 (Vite 5) | 3D 뷰포트 편집기 UI, 씬·오브젝트 관리 |
| `src/lib` | 자체 구현 | Legacy VTK 리더, 스트림라인·스칼라 슬라이스 생성, 카메라 컨트롤, 월드 그리드 |
| `src/workers` | Web Worker | 메시 파트 분할을 백그라운드로 처리(진행률·취소 지원) |
| `electron` | Electron 33 | 데스크톱 패키징 및 파일 시스템 연동 |
| `tools` | Node.js 스크립트 | VTK 예제 데이터 생성·검증 |

## 주요 기능

### 전처리 (저작)

- **STL 가져오기 및 파트 분할** — 가져온 메시를 연결 요소 기준으로 분리하며, 워커에서
  처리해 진행률 표시와 취소를 지원합니다(`epsilon`·최소 삼각형 수 조정 가능)
- **해석공간(Analysis Space) 정의** — AABB로 해석 영역을 지정하고 편집
- **건물 배치** — 박스·원통 파라메트릭 객체와 임포트 메시를 배치하고
  `BoundaryScheme`, `Ratio`, `MeshPath` 속성을 편집
- **전처리 데이터 내보내기** — Tofu 전처리 JSON과 개별 STL을 함께 출력하며,
  해석공간과 겹치는 오브젝트만 포함하도록 필터링
- **클리핑 STL 내보내기** — 해석공간 기준 클리핑, 해석 평면(스칼라 슬라이스·Y 슬라이스) 기준 클리핑
- **씬 저장·불러오기** — File System Access API 사용, 미지원 환경에서는 다운로드로 대체
- **편집 보조** — 이동·회전·스케일 기즈모, 오브젝트 선택·포커스, 실행 취소/다시 실행

### 후처리 (가시화)

- **Legacy VTK 리더** — BINARY 포맷의 `STRUCTURED_POINTS` 데이터셋 파싱
  (`DIMENSIONS`·`SPACING`·`ORIGIN`·`POINT_DATA`)
- **스트림라인** — 격자 위 벡터장을 삼선형 보간으로 샘플링해 리본 메시 생성
- **스칼라 슬라이스** — 3점으로 정의한 평면에 스칼라장을 컬러 매핑

## 실행

Node.js 18 이상이 필요합니다.

```bash
npm install

npm run dev              # 웹 개발 서버 (http://localhost:5173)
npm run electron:dev     # 데스크톱 앱 개발 실행
npm run build            # 웹 번들 빌드
npm run electron:build   # 데스크톱 앱 패키징
```

## 예제 데이터

`data/`에 세종 스마트시티 STL 모델(바이너리·ASCII)과 바람길 강풍 해석 데이터 샘플이 있습니다.

가시화 기능 검증용 VTK 예제는 스크립트로 생성합니다. 자세한 옵션은
[docs/VTK_SAMPLES.md](docs/VTK_SAMPLES.md)를 참고하세요.

```bash
npm run samples          # data/samples/ 에 예제 생성
npm run samples:verify   # 앱 파서로 왕복 검증
```
