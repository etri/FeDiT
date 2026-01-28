# IITP PRE Web Preprocessor

CFD(전산유체역학) 시뮬레이션을 위한 웹 기반 전처리기 애플리케이션입니다.

## 기술 스택

- **Frontend**: React 19, TypeScript 5.8, Vite 7
- **UI Library**: PrimeReact 10, PrimeFlex, PrimeIcons
- **3D Graphics**: Three.js 0.160, @react-three/fiber, @react-three/drei
- **상태 관리**: Zustand 5
- **Form 관리**: React Hook Form

---

## Docker 빌드 및 실행 가이드

### 사전 요구사항

1. **Docker Desktop 설치**
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/) 다운로드 및 설치
   - 설치 후 Docker Desktop 실행

2. **Docker 버전 확인**

```bash
docker --version
docker compose version
```

### 빠른 시작 (로컬 실행)

#### 1단계: 환경변수 설정

`docker/.env` 파일을 생성하거나 수정합니다.

```env
# 필수 환경변수
VITE_API_URL=http://172.16.37.55:13000/api

# 선택 환경변수 (기본값 있음)
IMAGE_NAME=iitp-pre-web
VERSION=latest
NGINX_PORT=3000
VITE_ENV_MODE=production
```

#### 2단계: Docker 이미지 빌드

```bash
# docker 폴더로 이동
cd docker

# 이미지 빌드
docker compose build

# 캐시 무시하고 새로 빌드 (코드 변경 시)
docker compose build --no-cache
```

#### 3단계: 컨테이너 실행

```bash
# 백그라운드에서 컨테이너 실행
docker compose up -d

# 실행 상태 확인
docker ps

# 로그 확인
docker logs iitp-pre-web -f
```

#### 4단계: 브라우저에서 접속

```bash 
#.env 파일에 작성한 포트 기준
http://localhost:3000 
```

#### 5단계: 컨테이너 중지

```bash
docker compose down
```

### 자주 사용하는 명령어

| 명령어 | 설명 |
|--------|------|
| `docker compose build` | 이미지 빌드 |
| `docker compose up -d` | 백그라운드 실행 |
| `docker compose down` | 컨테이너 중지 |
| `docker compose restart` | 컨테이너 재시작 |
| `docker logs iitp-pre-web -f` | 로그 실시간 확인 |
| `docker exec -it iitp-pre-web sh` | 컨테이너 내부 접속 |

### 트러블슈팅

**포트 충돌 시:**

```bash
# 다른 포트로 변경 (.env 파일 수정)
NGINX_PORT=8080
```

**API 연결 오류 시:**

```bash
# 환경변수 확인
docker exec iitp-pre-web env | grep IITP_ENV

# .env 파일의 VITE_API_URL 확인 후 재시작
docker compose down && docker compose up -d
```

> 상세한 배포 가이드는 [docker/README.md](./docker/README.md)를 참고하세요.

---

## 애플리케이션 사용 가이드

### 화면 구성

애플리케이션은 크게 4개의 주요 영역으로 구성되어 있습니다.

```
┌─────────────────────────────────────────────────────────────┐
│                        네비게이션 바                          │
├────┬────────────────────────────────────────────┬───────────┤
│    │                                            │           │
│ 사 │                                            │   설정    │
│ 이 │              3D 뷰어 영역                   │   패널    │
│ 드 │                                            │           │
│ 메 │                                            │           │
│ 뉴 │                                            │           │
├────┼────────────────────────────────────────────┤           │
│    │            프로젝트 패널                     │           │
└────┴────────────────────────────────────────────┴───────────┘
```

### 1. 3D 뷰어 영역 (중앙)

Three.js 기반의 3D 뷰어로 모델과 시뮬레이션 도메인을 시각화합니다.

| 기능 | 조작 방법 |
|------|----------|
| 회전 | 마우스 왼쪽 버튼 드래그 |
| 이동 | 마우스 오른쪽 버튼 드래그 또는 Shift + 왼쪽 드래그 |
| 확대/축소 | 마우스 휠 스크롤 |
| 모델 업로드 | 파일을 뷰어로 드래그 앤 드롭 |

**지원 파일 형식:** STL, OBJ, GLTF/GLB, PLY

### 2. 사이드 메뉴 (좌측)

프로젝트 패널의 각 섹션으로 빠르게 이동할 수 있는 아이콘 메뉴입니다.

| 아이콘 | 섹션 | 설명 |
|--------|------|------|
| 📍 | Initial Conditions | 초기 조건 설정 (압력, 속도, 농도 위치) |
| 📦 | Materials | 물질 속성 설정 (밀도, 점성, 확산계수) |
| 📢 | Concentration Diffusion | 농도 확산 관련 설정 |
| 🔨 | Outer Boundary Conditions | 외부 경계 조건 설정 |
| 📊 | Lattice Generation | 계산 도메인 격자 설정 |
| 🧮 | Calculation | 계산 조건 설정 (종료 시간, 시간 간격) |

**사용 방법:**
- 아이콘 클릭: 해당 섹션으로 이동
- 동일 아이콘 재클릭: 프로젝트 패널 닫기/열기 토글

### 3. 프로젝트 패널 (좌측 하단)

시뮬레이션 파라미터를 입력하는 폼 영역입니다.

#### Initial Conditions (초기 조건)

| 필드 | 설명 | 단위 |
|------|------|------|
| Pressure | 초기 압력 | Pa |
| Velocity X/Y/Z | 초기 속도 성분 | m/s |
| Concentration Point X/Y/Z | 농도 초기 위치 | m |
| Concentration Width | 농도 초기 분포 폭 | m |

#### Materials (물질 속성)

| 필드 | 설명 | 단위 |
|------|------|------|
| Density | 밀도 | kg/m³ |
| Kinematic Viscosity | 동점성계수 | m²/s |
| Diffusivity 1/2/3 | 확산계수 (물질별) | m²/s |

#### Lattice Generation (격자 생성)

| 필드 | 설명 | 단위 |
|------|------|------|
| Domain Min X/Y/Z | 도메인 최소 좌표 | m |
| Domain Max X/Y/Z | 도메인 최대 좌표 | m |

#### Calculation (계산 설정)

| 필드 | 설명 | 단위 |
|------|------|------|
| End Time | 시뮬레이션 종료 시간 | s |
| Time Step | 시간 간격 | s |
| Save Interval | 결과 저장 간격 | s |

### 4. 설정 패널 (우측)

뷰어 디스플레이 설정을 조정하는 패널입니다.

#### Display Settings (표시 설정)

| 설정 | 설명 |
|------|------|
| Background Color | 배경색 선택 |
| Grid | 그리드 표시 ON/OFF |
| Axes Helper | 좌표축 표시 ON/OFF |
| Model Hover | 모델 호버 하이라이트 ON/OFF |
| Model Selection | 모델 선택 기능 ON/OFF |
| Antialiasing | 안티앨리어싱 ON/OFF |
| Render Mode | 렌더링 모드 (Solid, Wireframe, Points 등) |
| Shadows | 그림자 효과 ON/OFF |

#### Lighting Settings (조명 설정)

| 설정 | 설명 |
|------|------|
| Ambient Light | 환경광 강도 |
| Directional Light | 직사광 강도, 색상, 위치 |
| Hemisphere Light | 반구광 강도, 하늘/지면 색상 |

#### Camera Control (카메라 제어)

| 버튼/기능 | 설명 |
|-----------|------|
| Fit to Box | 모든 객체가 보이도록 카메라 자동 조정 |
| Camera Position | 카메라 위치 저장/이동 |
| Camera Target | 카메라 타겟 저장/적용 |

### 5. 상단 버튼

| 버튼 | 위치 | 기능 |
|------|------|------|
| ⚙️ 설정 | 우측 상단 | 설정 패널 열기/닫기 |
| ⬆️ 업로드 | 우측 (설정 아래) | 3D 모델 파일 업로드 |
| ↔️ 변환 | 우측 (업로드 아래) | 모델 이동/회전/스케일 모드 토글 |

### 워크플로우 예시

**농도 확산 시뮬레이션 설정:**

1. 브라우저에서 애플리케이션 접속
2. 사이드 메뉴에서 **Initial Conditions** 클릭
3. 압력, 속도, 농도 초기 위치 입력
4. **Materials** 클릭하여 밀도, 점성, 확산계수 입력
5. **Lattice Generation** 클릭하여 도메인 범위 설정
6. **Calculation** 클릭하여 시뮬레이션 시간 설정
7. 3D 뷰어에서 농도 마커 위치 확인
8. 설정 완료 후 JSON 내보내기

---

## 로컬 개발 환경

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### 환경변수 (.env.local)

```env
VITE_API_URL=http://localhost:13000/api
VITE_ENV_MODE=development
```

---

## 프로젝트 구조

```
src/
├── components/
│   ├── forms/              # 폼 컴포넌트
│   │   └── simulation/     # 시뮬레이션 설정 폼
│   ├── viewer3d/           # 3D 뷰어 컴포넌트
│   │   ├── components/     # 뷰어 하위 컴포넌트
│   │   └── hooks/          # 커스텀 훅
│   ├── workbench/          # 작업공간 컴포넌트
│   └── import/             # 파일 임포트 관련
├── configs/                # 설정 파일
├── pages/                  # 페이지 컴포넌트
├── stores/                 # Zustand 상태 관리
├── styles/                 # CSS 스타일
├── types/                  # TypeScript 타입 정의
└── utils/                  # 유틸리티 함수
```

---

## 사용된 라이브러리 및 라이선스

이 프로젝트는 다음의 오픈소스 라이브러리를 사용합니다.

### Core Libraries

| 라이브러리 | 버전 | 라이선스 | 용도 |
|------------|------|----------|------|
| [React](https://react.dev/) | 19.x | MIT | UI 프레임워크 |
| [TypeScript](https://www.typescriptlang.org/) | 5.8.x | Apache-2.0 | 타입 시스템 |
| [Vite](https://vitejs.dev/) | 7.x | MIT | 빌드 도구 |

### 3D Graphics

| 라이브러리 | 버전 | 라이선스 | 용도 |
|------------|------|----------|------|
| [Three.js](https://threejs.org/) | 0.160.x | MIT | 3D 렌더링 엔진 |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) | 9.x | MIT | React용 Three.js 렌더러 |
| [@react-three/drei](https://github.com/pmndrs/drei) | 10.x | MIT | Three.js 유틸리티 컴포넌트 |
| [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) | 0.8.x | MIT | 메시 충돌 검사 최적화 |

### UI Components

| 라이브러리 | 버전 | 라이선스 | 용도 |
|------------|------|----------|------|
| [PrimeReact](https://primereact.org/) | 10.x | MIT | UI 컴포넌트 라이브러리 |
| [PrimeFlex](https://primeflex.org/) | 4.x | MIT | CSS 유틸리티 |
| [PrimeIcons](https://primereact.org/icons/) | 7.x | MIT | 아이콘 라이브러리 |

### State & Form Management

| 라이브러리 | 버전 | 라이선스 | 용도 |
|------------|------|----------|------|
| [Zustand](https://zustand-demo.pmnd.rs/) | 5.x | MIT | 상태 관리 |
| [React Hook Form](https://react-hook-form.com/) | 7.x | MIT | 폼 상태 관리 |
| [React Router](https://reactrouter.com/) | 7.x | MIT | 라우팅 |

### Utilities

| 라이브러리 | 버전 | 라이선스 | 용도 |
|------------|------|----------|------|
| [Axios](https://axios-http.com/) | 1.x | MIT | HTTP 클라이언트 |
| [JSZip](https://stuk.github.io/jszip/) | 3.x | MIT | ZIP 파일 처리 |
| [EventEmitter3](https://github.com/primus/eventemitter3) | 5.x | MIT | 이벤트 시스템 |

---

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

### 서드파티 라이선스

이 프로젝트에서 사용된 서드파티 라이브러리의 전체 라이선스 목록은 [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md)를 참조하세요.
