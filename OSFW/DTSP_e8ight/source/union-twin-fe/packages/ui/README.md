# @e8ight/ui

e8ight 공유 React 컴포넌트 라이브러리입니다. shadcn/ui(new-york) 기반 프리미티브
45종과 공유 훅, 유틸리티, 로고와 폰트 에셋을 서브경로 export로 노출합니다.

> 이 레포에서는 pnpm workspace 패키지로만 해석됩니다. 레지스트리도 `.npmrc`도
> 쓰지 않습니다.

## 설치

별도 설치가 없습니다. `client/package.json`이 아래처럼 워크스페이스로 참조합니다.

```json
"@e8ight/ui": "workspace:*"
```

## 서브경로

| 서브경로 | 내용 |
|---|---|
| `@e8ight/ui/components/ui/*` | UI 프리미티브 45종 (`button`, `dialog`, `select`, `sidebar`, …) |
| `@e8ight/ui/components/theme-provider` | light/dark/system 테마 프로바이더 |
| `@e8ight/ui/hooks` | 공유 훅 배럴 |
| `@e8ight/ui/utils/*` | `cn`, `clipboard`, `file` |
| `@e8ight/ui/contexts/*` | `GlobalPortal` |
| `@e8ight/ui/assets/*` | 로고 SVG 4종(NAXiS, NDX Cloud 각각 기본/화이트), Pretendard 가변 폰트 |
| `@e8ight/ui/styles.css` | Tailwind 베이스 + 디자인 토큰 + `@source` 등록 |
| `@e8ight/ui/themes/*.css` | 앱 테마 (`naxis`) |

```ts
import { Button } from '@e8ight/ui/components/ui/button';
import { cn } from '@e8ight/ui/utils/cn';
import { useDebounce, useIsMobile } from '@e8ight/ui/hooks';
```

훅 배럴이 노출하는 것: `useOutSideRef`, `useIntersectionObserver`,
`useInfiniteScroll`, `useInfiniteScrollWithVirtualization`, `useDebounce`,
`useResizable`, `useIsMobile`.

## 스타일

이 패키지가 디자인 토큰, 테마, Pretendard 폰트를 모두 소유합니다. 앱 CSS 엔트리에
아래 블록을 넣으세요.

```css
@import 'tailwindcss';
@import '@e8ight/ui/styles.css';
@import '@e8ight/ui/themes/naxis.css';
```

- `@e8ight/ui/styles.css`는 컴파일된 스타일시트가 아닙니다. Tailwind 베이스,
  `@theme` 토큰, `@custom-variant`, Pretendard `@font-face`, 그리고 이 패키지를
  스캔 대상에 등록하는 `@source`가 들어 있습니다. 클래스는 앱의 Tailwind 빌드에서
  앱 자신의 클래스와 함께 생성됩니다.
- `@import 'tailwindcss'`는 소비 앱이 소유합니다. 이 패키지는 하지 않습니다 —
  두 번 import하면 preflight가 두 벌 나갑니다.
- 테마를 쓴다면 반드시 `styles.css` **다음**에 와야 토큰을 덮어씁니다. 생략하면
  `styles.css`의 기본 토큰을 씁니다.
- 앱 로컬 오버라이드는 이 블록 아래에 둡니다.

`tailwindcss@^4.2.1`은 peer dependency입니다. 소비 앱에서 직접 설치합니다.

`<html>`의 `light` / `dark` 클래스로 테마를 전환합니다.

## 로고 에셋

SVG는 원본 파일 그대로 노출됩니다. 소비 앱의 번들러가 처리합니다. Next.js에서는
`next/image`나 `@svgr/webpack` 설정을 통해 가져옵니다.

```tsx
import naxisLogo from '@e8ight/ui/assets/logos/NAXiS.svg';
```

## 요구 사항

- **ESM 전용** — Vite, Next.js 13+, Webpack 5+. CommonJS 빌드는 없습니다.
- **Peer dependency:** `react@^19`, `react-dom@^19`. 소비 앱에서 직접 설치합니다.
- Next.js App Router에서 클라이언트 훅을 쓰는 프리미티브 17종은 `'use client'`
  디렉티브를 유지합니다.

## 컴포넌트 추가, 수정

`packages/ui/`는 업스트림에서 벤더링해 온 코드입니다. 커스터마이징이 필요하면 이 패키지를
직접 고치지 말고 `client/src/components/ui/`에서 프리미티브를 감싸세요. 자세한 규칙은
루트 [`.claude/rules/house-style.md`](../../.claude/rules/house-style.md) §4를 참고하세요.

`src/`를 고친 뒤에는 `dist`를 다시 빌드해야 런타임에 반영됩니다.

```sh
pnpm --filter @e8ight/ui build
```

## 이 사본에 대해

**이 레포에서는 아무것도 게시하지 않습니다.** 이건 `platform/e8ight-fe-monorepo`의
`@e8ight/ui` `0.2.9`를 그대로 복사해 온 포크입니다. 업스트림 릴리스는 모노레포에서만
일어나고, 여기서 고친 것은 업스트림으로 가지 않습니다.

포크를 되돌리려면 `client/package.json`의 `"@e8ight/ui": "workspace:*"`를 실제 버전으로
바꾸고 `packages/ui/`를 지우면 됩니다. 대신 레지스트리 접근이 다시 필요해집니다.
