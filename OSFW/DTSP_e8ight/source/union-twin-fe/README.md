# Union Twin

Union Twin 애플리케이션. 클라이언트(Next.js 15)와 서버(NestJS 11)를 하나의 pnpm 워크스페이스에 담았다.

`platform/e8ight-fe-monorepo`의 `apps/union-twin/`에서 떼어낸 독립 레포다. 모노레포에서
쓰던 pnpm 워크스페이스 구조는 그대로 남겼다 — `@e8ight/ui`를 `workspace:*`로 계속
해결하고, `catalog:` 프로토콜과 Dockerfile의 `turbo prune`을 그대로 쓰기 위해서다.
패키지 이름도 모노레포 때와 동일하다.

---

## 디렉터리 구조

| 경로                          | 패키지                         | 설명                               |
| ----------------------------- | ------------------------------ | ---------------------------------- |
| `client/`                    | `@workspace/union-twin-client`  | Next.js 15 App Router + BFF (3000) |
| `server/`                    | `@workspace/union-twin-be`      | NestJS 11 REST API (4000)         |
| `packages/ui/`               | `@e8ight/ui`                    | 공용 컴포넌트 라이브러리 (벤더링)  |

공용 툴링은 워크스페이스 패키지가 아니라 루트의 평범한 파일이다 — `eslint.shared.mjs`
(각 워크스페이스가 골라 쓰는 ESLint 레이어 3종), `.prettierrc`, `commitlint.config.js`.
`tsconfig.json`은 워크스페이스마다 독립이다.

각 앱의 상세 문서는 [`client/README.md`](client/README.md)와
[`server/README.md`](server/README.md)에 있다.

---

## 시작하기

### 사전 준비

- Node.js ≥ 22.13 (`.nvmrc`는 `v22.23.1`)
- pnpm — corepack으로 붙인다. 버전은 루트 `package.json`의 `packageManager`가 고정한다.

```bash
corepack enable
pnpm install
```

### 환경 변수

`client/.env`와 `server/.env`는 gitignore 대상이다. 각각 아래를 복사해서 만든다.

```bash
cp client/.env.example client/.env
cp server/.env.sample  server/.env
```

### 실행

```bash
pnpm dev     # client + server 동시 실행
pnpm build   # 전체 빌드
pnpm check   # lint + prettier + type-check
```

개별 워크스페이스만 돌리려면 `pnpm --filter @workspace/union-twin-be dev`처럼 필터를 준다.
로컬 Postgres는 `pnpm --filter @workspace/union-twin-be dev:db`로 띄운다.

---

## packages/ui 는 왜 여기 있나

모노레포의 `packages/ui`(`@e8ight/ui`)를 그대로 복사해 온 것이다. 워크스페이스 패키지로
두면 두 가지가 한 번에 해결된다.

- 클라이언트 전역의 `@e8ight/ui` import를 한 줄도 고치지 않아도 된다.
- 사내 Nexus 레지스트리에서 받아오지 않아도 되므로 `.npmrc`가 필요 없다. 이 레포에는
  의도적으로 `.npmrc`를 두지 않았다.

**이건 포크다.** 마지막으로 업스트림과 맞춘 시점은 `0.2.9`이고, 모노레포에는 이 패키지를 쓰는 앱이
6개(그리고 `packages/sdk`) 더 있다. 앞으로 양쪽은 갈라진다 — 업스트림 수정이 여기로
자동으로 오지 않고, 여기서 고친 것도 업스트림으로 가지 않는다.

포크를 되돌리려면 `client/package.json`의 `"@e8ight/ui": "workspace:*"`를 실제 버전으로
바꾸고 `packages/ui/`를 지우면 된다. 대신 레지스트리 접근(`.npmrc`)이 다시 필요해진다.

---

## CI / 배포

`Jenkinsfile`이 이 레포의 파이프라인이다. 모노레포에 있던 union-twin 항목을 그대로 옮겨왔고,
모노레포 쪽에서는 제거했다.

| 스테이지 | 언제 | 무엇을 |
| --- | --- | --- |
| `Verify` | 모든 브랜치 | `turbo run lint lint:prettier type-check` |
| `Build and Deploy` | `main` 만 | 두 앱 이미지를 빌드·push 후 223 에 배포 |

- 이미지는 루트 `Dockerfile` 하나로 빌드한다. 앱은 `--target union-twin-fe|union-twin-be` 와
  `--build-arg PKG=<워크스페이스 이름>` 으로 고른다. **빌드 컨텍스트는 레포 루트다** —
  Dockerfile이 `turbo prune`을 루트 기준으로 수행한다.
- 앱이 둘뿐이고 두 이미지가 `pruner`/`builder` 레이어를 공유하므로 변경 감지 없이 항상 둘 다 빌드한다.
- fe/be가 `docker-compose.yml` 한 벌을 공유하므로 배포는 한 번만 돈다.
  배포 경로는 모노레포 시절과 같은 `/mnt/sda1/home/e8ight/frontend/monorepo/union-twin`이다.
- **제주는 CI 대상이 아니다** — 수동 빌드·push·pull이다. 명령은
  [`server/README.md`](server/README.md)의 배포 절에 있다.

Jenkins job: <http://ndxpro-server:8282/job/union-twin/>. GitLab 쪽 Settings → Integrations →
Jenkins 가 push 이벤트를 이 job 으로 보낸다. 모노레포 job 은 더 이상 union-twin 을 빌드하지 않는다.

---

## 공개 전 확인 사항

레포는 당분간 private이다. 공개로 돌리기 전에 아래를 먼저 처리한다.

| 항목                                                                                            | 위치                                                              |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| ~~내부 레지스트리 호스트 노출~~ → 해결: 레지스트리 주소는 `DOCKER_REGISTRY`(compose `.env`, Jenkins 전역 환경변수)로 주입 | `docker-compose.yml`, `docker-compose-jeju.yml`, `Jenkinsfile` |
| 사내 배포 서버 경로 (`223-server`, `/mnt/sda1/home/e8ight/...`) 노출                             | `Jenkinsfile`                                                     |
| 관리자 계정 이메일 `admin@e8ight.co.kr` 하드코딩                                                 | `server/src/users/seeds/admin.seed.ts`, `server/.env.sample`      |
| ~~상위 서비스 엔드포인트 IP 노출~~ → 해결: 모든 주소는 배포 `.env`로 주입 (`client/.env.example` 은 자리표시자만) | `client/.env.example`, `src/lib/iframe/registry.ts` |
| `@e8ight/ui` 라이선스가 proprietary                                                              | `packages/ui/LICENSE`                                             |
| 루트 라이선스가 e8ight proprietary — 실제 오픈소스 라이선스로 교체 필요                          | `LICENSE`                                                         |
