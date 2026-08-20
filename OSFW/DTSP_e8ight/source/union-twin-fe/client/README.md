# Union Twin 클라이언트

Union Twin 애플리케이션의 Next.js 15 App Router 프런트엔드.
RSC 페이지와 BFF(Backend-for-Frontend) Route Handler를 한 워크스페이스에서 제공한다.

- **포트:** `3000`
- **프레임워크:** Next.js 15 (App Router, `output: 'standalone'`)
- **워크스페이스:** `@workspace/union-twin-client`

인증, BFF 경계, API 표면, 임베디드 외부 앱까지 이 README 하나에 정리돼 있다.
그 아래 층위(라우트 핸들러 구현, 프록시 헬퍼 시그니처)는 `src/app/api/**`와 `src/lib/`의
코드가 유일한 진실이다.

---

## 기술 스택

| 구분            | 라이브러리                                  |
| --------------- | ------------------------------------------- |
| 프레임워크      | Next.js 15 (App Router) + React 19          |
| 서버 상태       | TanStack Query 5                            |
| 클라이언트 상태 | Zustand 5                                   |
| 폼 / 검증       | react-hook-form + Zod + @hookform/resolvers |
| HTTP            | axios                                       |
| UI              | `@e8ight/ui` (shadcn 기반 ui), Tailwind CSS v4 |
| 차트            | chart.js + react-chartjs-2                  |
| 에디터          | @monaco-editor/react, @uiw/react-md-editor  |
| 날짜            | dayjs                                       |
| 아이콘          | lucide-react                                |

---

## 시작하기

### 사전 준비

- Node.js ≥ 22.13 (루트 `package.json`의 `engines`)
- 실행 중인 Union Twin 서버(NestJS, 기본 `http://localhost:4000`)
- 접근 가능한 ndxpro / viewer / dtmeta / FDT sync 업스트림

### 환경 변수

이 디렉터리에 `.env`를 만든다. `.env.example`을 복사하면 아래 8개 키가 그대로 들어 있다.
모두 서버 전용이다 — `NEXT_PUBLIC_` 접두사가 없으므로 브라우저 번들에 들어가지 않는다.

| 키 | 쓰는 곳 | 의미 |
| --- | --- | --- |
| `UNION_TWIN_BFF_URL` | `lib/auth-cookies.ts`의 `bffUrl()` | NestJS 서버 base URL. `/api/...`를 붙여 호출한다 |
| `COOKIE_SECURE` | `lib/auth-cookies.ts` | `secure` 쿠키 플래그 override(`true`/`false`). HTTP 내부 배포에선 `false`, 미설정 시 `NODE_ENV`를 따름 |
| `NDXPRO_API_URL` | `/api/ndxpro/*` 프록시 | ndxpro base URL |
| `NDXPRO_TOKEN` | `/api/ndxpro/*` 프록시 | ndxpro Bearer. 프록시가 서버사이드에서 붙이며 브라우저로 나가지 않는다 |
| `VIEWER_URL` | `/api/viewer/*` 프록시 | FDT viewer base URL |
| `DTMETA_API_URL` | `/api/dtmeta/*` 프록시 | dtmeta base URL |
| `DTMETA_TOKEN` | `/api/dtmeta/*` 프록시 | dtmeta Bearer. 프록시가 서버사이드에서 붙인다 |
| `FDT_SYNC_API_URL` | `/api/fdt-sync/*` 프록시 | FDT sync base URL. 토큰 없이 호출한다 |

### 실행

```bash
pnpm dev          # 개발 서버 (포트 3000)
pnpm build        # 프로덕션 빌드 (standalone)
pnpm start        # 빌드 결과 실행
```

---

## 디렉터리 구조

```
src/
├── middleware.ts         # same-origin 게이트(api/*), 인증 리다이렉트, access 만료 시 인라인 refresh
├── app/
│   ├── layout.tsx        # 루트 레이아웃 (html lang="ko", light 테마)
│   ├── providers.tsx     # 'use client' 경계: QueryClient, overlay, toaster
│   ├── (auth)/           # public 라우트: signin, signup
│   ├── (app)/            # 보호 라우트: home, admin, noticeboard, service/* 등
│   └── api/              # BFF Route Handler (proxyToBff / proxyToUpstream)
├── apis/                 # axios 클라이언트 + React Query 팩토리 (도메인별)
│   ├── client.ts         # ndxproClient + bffClient(401-refresh 인터셉터)
│   ├── config.ts         # ndxpro/viewer/dtmeta/fdt-sync 경로 상수
│   └── {domain}/         # {domain}Api.ts, {domain}.queries.ts, {domain}.mutations.ts, {domain}.types.ts, index.ts
├── components/           # 공유 UI: embedded/(외부 앱 iframe), layout/(앱 셸), ui/
├── hooks/                # 공유 훅 (useCartPostMessage, useIframeMessage 등)
├── lib/
│   ├── auth-cookies.ts   # 쿠키 set/get, bffUrl(), requireSessionCookies(), refreshAccessToken()
│   ├── auth-errors.ts    # errorCode → 한국어 문구 변환
│   ├── bff-fetch.ts      # SSR fetch 헬퍼 (401 시 /signin redirect)
│   ├── proxy-to-bff.ts   # Route Handler용 BFF 헬퍼 (Bearer JWT 전달, 401 JSON 반환)
│   ├── proxy-to-upstream.ts # ndxpro/viewer passthrough 프록시 (쿠키 제거)
│   ├── revalidation-tags.ts # Next.js fetch 캐시 태그 상수 (notices)
│   ├── service-api-config.ts # ndxpro base URL + 토큰 로더
│   └── iframe/           # 임베디드 외부 앱 레지스트리 + postMessage 브릿지
├── assets/               # 정적 에셋
├── constants/            # 앱 전역 상수
├── stores/               # 라우트 여러 곳이 공유하는 Zustand 스토어
└── types/                # 공유 TS 타입
```

라우트 하나에만 쓰이는 코드는 `src/` 루트가 아니라 그 라우트 옆 언더스코어 폴더에 둔다 —
`app/(app)/noticeboard/_components/`, `_schemas/`, `_hooks/`, `_stores/`처럼. 폼 Zod 스키마도
마찬가지라 `src/schemas/`는 없다. 그 밖의 폴더 컨벤션은 레포 기본값을 따른다 —
[`folder-structure` 스킬](../.claude/skills/folder-structure/SKILL.md). 레포 전체 컨벤션은
[`../CLAUDE.md`](../CLAUDE.md).

---

## 핵심 개념

### BFF 경계 — `src/app/api/**`

브라우저는 어떤 백엔드 토큰도 직접 들고 있지 않는다. 모든 백엔드 호출은
`src/app/api/**`의 Route Handler를 거치며, 두 종류의 헬퍼로 나뉜다.

- **`proxyToBff()`** — 자체 NestJS 서버용. HttpOnly 쿠키의 access 토큰을 읽어
  `Authorization: Bearer <jwt>`로 변환해 전달하고, 성공 시 필요한 fetch 캐시 태그
  (`notices`)를 무효화한다. 쿠키가 없으면 401 JSON을 반환한다.
- **`proxyToUpstream()`** — ndxpro/viewer 업스트림용 passthrough 프록시.
  요청 쿠키를 제거한 뒤 전달한다.

SSR(RSC) 페이지가 직접 NestJS를 호출할 때는 `src/lib/bff-fetch.ts`의 `fetchBff()`를
쓴다 — 쿠키에서 토큰을 읽어 Bearer를 붙이고, 401이면 `/signin`으로 redirect한다.

### 세 개의 API 표면

| 표면          | 진입 경로                      | 클라이언트     | 인증                                   |
| ------------- | ------------------------------ | -------------- | -------------------------------------- |
| 자체 BFF      | `/api/auth`, `/api/admin`, `/api/notices` 등 | `bffClient`    | 쿠키 → BFF가 Bearer JWT로 중계         |
| 업스트림 데이터 | `/api/ndxpro/*`, `/api/viewer/*`, `/api/dtmeta/*`, `/api/fdt-sync/*` | `ndxproClient` | 프록시가 서버사이드에서 토큰 부착 |
| 임베디드 외부 앱 | `<EmbeddedApp appId="…">`     | iframe 직접 로드 | 자식 앱 자체 세션 (프록시 없음)        |

- `bffClient`는 401 응답에 대해 `/api/auth/refresh`를 한 번 시도하는 인터셉터를
  갖는다(동시 401은 단일 refresh로 dog-pile 방지). 업스트림 표면 호출은
  `ndxproClient`로 나가 이 인터셉터를 타지 않는다 — 이쪽의 401은 "세션 없음"을
  뜻하며 refresh 대상이 아니다.
- 업스트림 프록시 4개는 모두 `[...path]` catch-all Route Handler이고,
  `requireSessionCookies()`로 **세션 쿠키 존재 여부만** 게이트한다(accessToken 또는
  refreshToken 중 하나라도 있으면 통과). JWT 자체는 검증하지 않는다. 허용 메서드는
  핸들러가 export하는 것만이다 — `/api/ndxpro`는 GET/POST/PUT/PATCH/DELETE,
  `/api/viewer`는 GET/POST, `/api/dtmeta`는 GET/PUT, `/api/fdt-sync`는 GET.
- 프록시가 붙이는 토큰: `/api/ndxpro`는 `NDXPRO_TOKEN`, `/api/dtmeta`는 `DTMETA_TOKEN`,
  `/api/viewer`와 `/api/fdt-sync`는 토큰 없이 전달한다.
- 임베디드 외부 앱(메타데이터, 프로세싱, 예측, 뷰어 등)은 프록시 없이 iframe으로 외부
  origin을 직접 로드한다. URL은 `lib/iframe/registry.ts`에 하드코딩된다.

### 인증

- **쿠키:** `accessToken`(15분), `refreshToken`(7일). 둘 다 HttpOnly,
  `sameSite: lax`. `secure`는 `COOKIE_SECURE`가 설정돼 있으면 그 값을, 없으면
  `NODE_ENV === 'production'`을 따른다.
- **미들웨어:** `/api/*`에 대해서는 비안전 메서드의 same-origin을 강제하고,
  페이지 라우트에 대해서는 인증 리다이렉트를 수행한다. access가 만료됐고
  refresh가 있으면 미들웨어가 인라인으로 토큰을 갱신해 새 쿠키를 심는다.
- **register:** `/api/auth/register` Route Handler가 NestJS 응답에서
  access/refresh 토큰을 꺼내 쿠키로 심고, 클라이언트에는 `{ data: null }`을
  반환한다(`authApi.register()`는 void).

토큰 회전, 로그아웃, 비밀번호 변경, 다중 기기 로그인의 서버 쪽 규칙은
`../server/README.md`의 인증 / 인가 절에 있다.

---

## 스크립트

| 목적      | 명령어            |
| --------- | ----------------- |
| 개발 서버 | `pnpm dev`        |
| 빌드      | `pnpm build`      |
| 빌드 실행 | `pnpm start`      |
| 타입 체크 | `pnpm type-check` |
| 린트      | `pnpm lint`       |
| 포맷      | `pnpm format`     |
| 전체 검증 | `pnpm check`      |

`pnpm check`는 `lint`, `lint:prettier`, `type-check`를 순서대로 실행한다.
테스트 러너는 아직 없다 — `pnpm check` + `pnpm build`로 검증한다.

---

## 상호 참조

- 서버 엔드포인트 레퍼런스, 인증 / 인가, 응답 형식, 시드, 배포: [`../server/README.md`](../server/README.md)
- 레포 컨벤션: [`../CLAUDE.md`](../CLAUDE.md),
  [`../.claude/rules/house-style.md`](../.claude/rules/house-style.md),
  [`../.claude/skills/`](../.claude/skills/)
