# 연합트윈 CFD 렌더러 — 시뮬레이션 가시화·저작도구 (웹)

디지털 연합트윈 3세부 '디지털 연합트윈 시뮬레이션 가시화/저작도구'의 이에이트(E8IGHT) 웹 구현이다.
1세부 해석엔진(LBM·LBM_DEM, FeDiT `OPFW/modeling_simulation_engines`)의 입력을 만들고, 해석을 실행하고,
결과(VTK)를 브라우저에서 후처리·가시화한다. 설치 없이 웹 페이지로 열리고, FeDiT 화면에는 iframe 탭 하나로 붙는다.
기반기술을 검증하는 시제품 단계다.

- 기술: TypeScript, three.js 0.179, Vite (화면 프레임워크 없음)
- 운영 주소: `https://cfd.fedit.or.kr/` (시작 화면)

## 화면 구성

```text
시작(index.html) ─┬─ 전처리(pre.html) ──[해석 실행]──> 물리 시뮬레이션(sim.html) ──[가시화]──> 후처리(post.html?job=<작업 번호>)
                  ├─ 물리 시뮬레이션(sim.html)   입력 JSON·STL 을 직접 올려 실행
                  └─ 후처리(post.html)           결과 폴더·결과 ZIP 을 직접 열기
```

| 페이지 | 하는 일 |
| --- | --- |
| 시작 `index.html` | 세 페이지로 가는 카드 |
| 전처리 `pre.html` | 해석기 5종(다성분, 다상, 농도확산, 복합 열전달, 유체-입자(DEM)) 템플릿 고르기 → 형상(STL)·계산 영역 → 핵심 값 수정 → '해석 실행' 또는 입력 JSON(+STL ZIP) 내려받기 |
| 물리 시뮬레이션 `sim.html` | 입력을 해석엔진에 보내 실행하고 진행·대기열을 보여 준다. 끝나면 마지막 저장 시점의 결과 ZIP 내려받기와 '가시화'(후처리로 넘김) |
| 후처리 `post.html` | 결과를 열어 필터를 쌓고 저장 시점을 넘겨 보며 그림으로 내보낸다. 주소 `?job=`(서버 결과)·`?data=`(데이터 목록)·`?scene=`(장면)로 바로 연다 |

'처음 화면' 단추(전처리·후처리는 왼쪽 패널 머리, 물리 시뮬레이션은 페이지 머리 오른쪽)로 시작 화면에 돌아간다. 전처리에서 입력을 열어 둔 채, 또는 물리 시뮬레이션에서 입력을 보내는 중에 누르면 화면 안 확인 상자로 한 번 묻는다.

## 후처리 기능

| 구분 | 내용 |
| --- | --- |
| 입력 | 해석엔진 결과 폴더·결과 ZIP(`<이름>_<n>.vtm` + `bin/LEVEL_xx/*.vtu`), 서버의 해석 결과(`?job=`), CSV 점 데이터, 형상 STL. VTI 축소본(`scripts/downsample_vtu.py`로 줄인 것)은 개발 서버 데이터 목록에서만 연다 |
| 다중 레벨 | LBM 옥트리 결과를 레벨마다 격자로 되살리고, 보간은 세밀한 레벨부터 찾는다. 레벨 경계·고체 옆은 유효한 이웃만 평균한다 |
| 시간축 | 저장 시점을 슬라이더·재생으로 넘긴다. 시각은 입력 JSON 의 저장 시작·간격으로 계산한다 |
| 필터 | Clip, Threshold, Slice(면 색·Contour lines), Glyph(벡터 화살표), Streamline(RK4), Isosurface. 장면 트리에 노드로 쌓고, 자식은 조상의 Clip·Threshold 를 이어받는다 |
| 표현 | Surface, Outline, Points, Volume(레벨별 3D 텍스처 + ray marching, Opacity 곡선 편집기) |
| 색 | Field(스칼라·벡터 크기·성분)마다 Color Map 하나. Preset: Cool-Warm, Viridis, Jet. 범위는 데이터·지정·전 시점·보이는 값 |
| 형상 편집 | 장면의 형상 객체 이동·연직축 회전·크기 조정, 상자·원기둥 추가, 복제·삭제·되돌리기 |
| 내보내기 | 1920×1080 PNG 캡처, 장면 JSON 저장·열기, 표시 중인 형상의 STL 내보내기 |

필터의 뜻·단위·기본값은 되도록 ParaView 를 따르고, 다른 점은 소스 주석에 적었다.

알려진 한계:
- VTU 압축(zlib)·base64 형식은 아직 읽지 않는다.
- 유체-입자(DEM) 해석의 입자 결과(`.vtk`)는 파일이 몇 개 있는지만 알려 주고 그리지는 않는다.
- 결과 ZIP 은 풀었을 때 256 MB까지만 메모리에서 연다. 그보다 크면 Chrome·Edge 에서 풀어 둘 폴더를 고른다. FeDiT 탭(다른 주소의 iframe) 안에서는 Chrome 이 폴더 선택 창을 막으므로, 큰 결과는 서버 결과(`?job=`)로 열거나 PC 에서 먼저 푼 폴더를 연다.

## 개발 실행

```bash
npm install
npm run dev        # http://localhost:5177
npm run build      # tsc 타입 검사 + 네 페이지 빌드(dist/)
npm run sample     # 합성 예제 데이터 다시 만들기(python + numpy)
```

개발 서버에서 큰 외부 결과 폴더를 쓰려면 `data-roots.json`(예시: `data-roots.example.json`)에 이름과 경로를 적는다.
개발 서버가 `/__data/<이름>/...` 로 내준다(바이트 범위 읽기 지원). 데이터 목록은 `public/datasets.json` 이고, 도시 예제 말고는 이렇게 연결한 외부 데이터가 있어야 열린다(빌드한 페이지에서는 목록에서 빠진다).
개발 서버에서 PNG 캡처는 내려받기 대신 `captures/` 폴더에 저장된다. 개발 서버는 같은 망의 다른 PC 에서도 열리므로(`host: true`), `/__data` 로 연결한 폴더도 망 안에서 읽힌다.

시험(Node 22):

```bash
ENGINE_EXAMPLES=<FeDiT 저장소>/OPFW/modeling_simulation_engines/examples node scripts/test_solver_input.mjs   # 전처리 입력 JSON 모듈
node scripts/test_zip_extract.mjs <결과 폴더>   # 결과 ZIP 풀기(내부 시험 결과 폴더 필요: video.json, run.log, video/video_9.vtm, video/bin/LEVEL_00/video_9.vtu)
node scripts/test_zip_input.mjs <결과 ZIP>                                # 결과 ZIP 열기
node scripts/test_opacity_editor.mjs                                      # Opacity 곡선 편집기
```

## 배포

페이지(nginx 정적 서버)와 https 앞단(proxy)을 컨테이너 두 개로 띄우고, 같은 서버에서 도는 1세부 해석엔진에 붙인다.
앞단이 한 주소 아래에서 페이지(`/`), 해석엔진 API(`/engine/`), 엔진 작업 폴더 읽기(`/results/`)를 나눠 준다.
설정과 절차는 [`deploy/README.md`](deploy/README.md), 서버 설치 묶음은 `deploy/bundle/`.

## 폴더 구성

| 경로 | 내용 |
| --- | --- |
| `src/app/` | 전처리·후처리가 함께 쓰는 틀(3D 화면·패널·장면 트리·도구막대)과 시작 화면 스타일 |
| `src/core/` | 뷰어 핵심(`AppCore.ts`)과 필터 노드 자료형(`layers.ts`) |
| `src/data/` | 결과 폴더·ZIP·CSV·VTU 읽기, 시간축, 해석엔진 API |
| `src/analysis/` | Surface 겉면·Slice·Isosurface·Streamline 계산 |
| `src/render/` · `src/shaders/` | 표현별 그리기와 셰이더 |
| `src/pre/` · `src/sim/` · `src/post/` | 전처리·물리 시뮬레이션·후처리 페이지 |
| `src/edit/` | 형상 객체 편집 |
| `src/ui/`, `src/styles.css` | 디자인 토큰·부품·아이콘·패널, 화면 배치 |
| `src/utils/` | 색 지도(Preset) |
| `src/types/` | 브라우저 API 타입 선언 |
| `public/models/`, `public/templates/` | 1세부 해석기 예제 형상(STL 8개)과 입력 템플릿(JSON 5개), 도시 샘플 형상, 형상 목록(`library.json`) |
| `public/sample/`, `public/scenes/` | 합성 도시 예제 데이터와 장면 |
| `deploy/` | 컨테이너 배포 설정 |
| `scripts/` | 예제 데이터 만들기, VTU 축소, 시험 |

## 라이선스

LGPL-2.1-only. Copyright (c) 2026 E8IGHT Co., Ltd.
전문은 [`LICENSE`](LICENSE)(FeDiT 저장소 맨 위 LICENSE 와 같은 원문)에 있고, 소스 파일마다 첫머리에 `SPDX-License-Identifier: LGPL-2.1-only` 와 저작권 표시가 있다.
함께 들어 있는 제3자 구성요소(three, fflate, viridis 근사식)와 1세부 해석기 예제(STL·입력 JSON)의 고지와 라이선스 전문은 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)에 있다.

---
# Funding
This work was supported by Institute of Information & communications Technology Planning & Evaluation (IITP) grant funded
by the Korea government (MSIT) (No.2022-0-00431, Development of open service platform and creation technology of federated intelligent digital twin, 100%).
