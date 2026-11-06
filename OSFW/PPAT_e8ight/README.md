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
| 물리 시뮬레이션 `sim.html` | 입력을 해석엔진에 보내 실행하고 진행·대기열을 보여 준다. 끝나면 마지막 저장 시점의 결과 ZIP 내려받기와 '가시화'(후처리로 넘김). 서버에 쌓인 해석도 '서버 결과' 목록에서 골라 진행을 보거나 후처리로 연다 |
| 후처리 `post.html` | 결과를 열어 필터를 쌓고 저장 시점을 넘겨 보며 그림으로 내보낸다. 서버에 쌓인 해석 결과를 '서버 결과' 목록에서 골라 연다. 주소 `?job=`(서버 결과)·`?data=`(예제)로 바로 열고, `?scene=`(장면)은 연 데이터 위에 얹는다(`?data=city-synthetic&scene=city-layers`). 주소 없이 열면 '데이터 열기' 창(서버 결과 · 파일 · 예제)이 뜨고, 데이터를 열어야 창이 닫힌다(나갈 길은 창 안 '처음 화면'). 연 뒤에는 데이터 화면 맨 위 [데이터 열기]로 다시 띄운다 |

서버의 해석 목록은 주소를 아는 누구나 본다(2026-11-04 결정, `deploy/README.md` 1.4절 '결과 공개').

'처음 화면' 단추(전처리·후처리는 왼쪽 패널 머리, 물리 시뮬레이션은 페이지 머리 오른쪽)로 시작 화면에 돌아간다. 전처리에서 입력을 열어 둔 채, 또는 물리 시뮬레이션에서 입력을 보내는 중에 누르면 화면 안 확인 상자로 한 번 묻는다.

## 후처리 기능

| 구분 | 내용 |
| --- | --- |
| 입력 | 해석엔진 결과 폴더·결과 ZIP(`<이름>_<n>.vtm` + `bin/LEVEL_xx/*.vtu`), 서버의 해석 결과(`?job=`), CSV 점 데이터, 형상 STL. VTI 축소본(`scripts/downsample_vtu.py`로 줄인 것)은 개발 서버의 '예제' 목록에서만 연다 |
| 다중 레벨 | LBM 옥트리 결과를 레벨마다 격자로 되살리고, 보간은 세밀한 레벨부터 찾는다. 레벨 경계·고체 옆은 유효한 이웃만 평균한다 |
| 시간축 | 저장 시점을 슬라이더·재생으로 넘긴다. 시각은 입력 JSON 의 저장 시작·간격으로 계산한다 |
| 필터 | Clip, Threshold, Slice(면 색·Contour lines), Glyph(벡터 화살표), Streamline(RK4), Isosurface. 장면 트리에 노드로 쌓고, 자식은 조상의 Clip·Threshold 를 이어받는다 |
| 표현 | Surface, Outline, Feature Edges(모양이 꺾이는 모서리만 단색 선으로), Points, Volume(레벨별 3D 텍스처 + ray marching, Opacity 곡선 편집기) |
| 색 | Field(스칼라·벡터 크기·성분)마다 Color Map 하나. Preset: Cool-Warm, Viridis, Jet. 범위는 데이터·지정·전 시점·보이는 값 |
| 시점 | 도구막대의 원근·직교, 등각·평면·정면·측면, 'View Up'(+X·-X·+Y·-Y·+Z·-Z — 화면에서 위로 세울 축, 파라뷰 Adjust Camera 의 이름). View Up 은 데이터를 열 때(전처리는 템플릿·입력을 받을 때) 입력 JSON 의 중력 반대 방향으로 정하고(중력이 없으면 +Z, 입력 JSON 이 있고 Z 가 한 층인 2D 는 +Y) 도구막대에서 바꾼다. 카메라만 바뀌고 좌표 값은 그대로다. 전처리 도구막대도 같다 |
| 형상 편집 | 장면의 형상 객체 이동·연직축 회전·크기 조정, 상자·원기둥 추가, STL 추가(후처리만 — 3D 화면에 STL 을 끌어다 놓아도 된다), 복제·삭제·되돌리기 |
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
개발 서버가 `/__data/<이름>/...` 로 내준다(바이트 범위 읽기 지원). 후처리 '데이터 열기' 창의 '예제' 목록은 `public/datasets.json` 이고, 도시 예제 말고는 이렇게 연결한 외부 데이터가 있어야 열린다(빌드한 페이지에서는 목록에서 빠진다).
개발 서버에서 PNG 캡처는 내려받기 대신 `captures/` 폴더에 저장된다. 개발 서버는 같은 망의 다른 PC 에서도 열리므로(`host: true`), `/__data` 로 연결한 폴더도 망 안에서 읽힌다.

시험(Node 22):

```bash
ENGINE_EXAMPLES=<FeDiT 저장소>/OPFW/modeling_simulation_engines/examples node scripts/test_solver_input.mjs   # 전처리 입력 JSON 모듈
node scripts/test_zip_extract.mjs <결과 폴더>   # 결과 ZIP 풀기(내부 시험 결과 폴더 필요: video.json, run.log, video/video_9.vtm, video/bin/LEVEL_00/video_9.vtu)
node scripts/test_zip_input.mjs <결과 ZIP>                                # 결과 ZIP 열기
node scripts/test_opacity_editor.mjs                                      # Opacity 곡선 편집기
node scripts/test_server_jobs.mjs                                         # 서버 해석 목록 읽기(가짜 fetch)
node scripts/test_open_dialog.mjs                                         # 후처리 '데이터 열기' 창의 닫힘 규칙 · 레이어 경고(연 뒤 바꾼 것만 — 레이어 · 데이터 표시 · 형상) · 끌어다 놓기 판정 · '파일' 결과 줄 · STL 안내 글
node scripts/test_post_url.mjs                                            # 후처리 주소 맞추기(?data= · ?job=, 창 안에서 연 뒤 ?scene= · ?tab= 지움)
node scripts/test_up_axis.mjs                                             # View Up(화면에서 위로 세울 축) 규칙 · 회전표 · three OrbitControls 회전 기준
node scripts/test_number_format.mjs                                       # 범위 끝값·기준값 숫자 표시(0 이 아닌 작은 값이 '0' 으로 안 보임 · 지수 표기)
node scripts/test_stl_add.mjs                                             # 후처리에서 STL 을 형상으로 더하기(이름 = 파일 이름, 겹치면 번호 · 삼각형 없는 STL 거절)
node scripts/test_fit_frame.mjs                                           # 화면 맞춤 거리(상자 꼭짓점 8개가 패널에 가려지지 않은 시야 안에 드는지)
node scripts/test_feature_edges.mjs                                       # Feature Edges 표현(셀 면에서 모양이 꺾이는 모서리 고르기 · 다중 레벨 경계)
node scripts/test_color_range.mjs                                         # Color Map 범위 규칙(값이 모두 같은 장면 · 벡터 성분의 0 근처 잡음 · 옛 장면의 '모두 같음' 범위 · 처음 정하기 · 넓히기 · 상태 줄 · 전 시점 범위 결과)
node scripts/test_alltime_scan.mjs [--big]                                # 전 시점 범위 읽기(배열 하나만 · 캐시 · 실패 · 멈춤 · 동시 수 · 가림 · HTTP) · 저장 시점 하나 읽기 진행과 캐시 바뀜 알림 · 읽어 둔 시점들의 범위(값 밀대). 합성 결과(메모리)는 늘 돌고, deploy/jobs 결과(git 에 없음)는 있으면 읽음. --big 은 유체-입자 51장면
node scripts/test_time_bar.mjs                                            # 재생 막대: 진행 원을 보일지(300 ms 넘는 읽기만 · 채움 · 모르거나 0 이면 도는 원 · 재생 중 이어 보이기 — 느린 서버 흉내에서 한 번만 켜짐) · 읽어 둔 장면 띠(구간 · 트랙 퍼센트 · CSS 글)
node scripts/test_slider_range.mjs                                        # 값 밀대 양 끝(노드마다 만들 때 · Field·Component 를 바꿀 때 · 전 시점 범위 뒤에만 정함 · 노드 값까지 넓히기만 · 보이는 장면 값이 모두 같으면 미정 → 처음 달라지는 장면에서 한 번, 미리 읽은 장면이 있어도 · 성분 전 시점 범위의 크기 최대는 크기 쪽 범위에 넣지 않음) · 재생 흉내 51장면 두 바퀴에서 손잡이가 한 번도 안 움직임 · 숫자 칸 글자(십진수만)
```

## 배포

페이지(nginx 정적 서버)와 https 앞단(proxy)을 컨테이너 두 개로 띄우고, 같은 서버에서 도는 1세부 해석엔진에 붙인다.
앞단이 한 주소 아래에서 페이지(`/`), 해석엔진 API(`/engine/`), 엔진 작업 폴더 읽기(`/results/`, 맨 윗단은 해석 목록)를 나눠 준다.
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
