# union-twin — required reading

pnpm + turbo workspace holding one client and one server. All conventions live here at root and apply to both.

> MANDATORY: before changing code, load the conventions relevant to the task — the always-on house style plus whichever skill matches.

## Layout

| Path | Package | What |
| --- | --- | --- |
| `client/` | `@workspace/union-twin-client` | Next.js 15 App Router + BFF (3000) |
| `server/` | `@workspace/union-twin-be` | NestJS 11 REST API (4000) |
| `packages/ui/` | `@e8ight/ui` | shared component library, vendored |

Shared tooling sits at the root as plain files, not as workspace packages: `eslint.shared.mjs`
(the three ESLint layers each workspace picks from), `.prettierrc`, and `commitlint.config.js`.
Each workspace owns a self-contained `tsconfig.json`.

## Stack

**client** — TypeScript (strict), Next.js 15 App Router, TanStack Query, Zustand, react-hook-form + Zod, Tailwind CSS v4, `@e8ight/ui` primitives, Chart.js, Monaco.

**server** — TypeScript (strict), NestJS 11, TypeORM + Postgres, passport-jwt, class-validator, Swagger.

Library/framework APIs (React, Next.js, TanStack Query, Zustand, react-hook-form, Zod, Tailwind, shadcn/ui, NestJS, TypeORM): consult official docs via Context7, not memory.

## `packages/ui` is a vendored fork

It is a copy of `@e8ight/ui` taken from `platform/e8ight-fe-monorepo` at version `0.2.6`, kept here as a workspace package so the client resolves it without the internal registry. Upstream still ships releases and this copy will drift — see the root `README.md`.

**Never edit files under `packages/ui/`.** Wrap primitives in `client/src/components/ui/` instead — house style §4. Nothing is ever published from this repo.

## Conventions: house style + skills

- **House style (always-on)** — repo-specific cross-cutting code style in `.claude/rules/house-style.md`, auto-loaded every session.
- **Skills (on-demand)** — portable guidance under `.claude/skills/`, auto-loaded when a task matches the skill's `description`; pull one in manually with `/<skill-name>`.

| Skill | Load it when |
| --- | --- |
| `frontend-fundamentals` | design/refactor/review/naming; abstract-vs-duplicate; hook design (SRP); no mechanical rule fits |
| `react-state` | where state lives (server/local/context/store); caching + invalidation |
| `suspense-data-fetching` | fetching server data; Suspense/error boundaries; suspense vs `useQuery` |
| `folder-structure` | create files/folders; decide where code belongs |
| `api-layer` | organize API/data-fetching code (group by resource, query factories) |
| `loading-states` | loading spinners, skeletons, error/empty states |

`frontend-fundamentals` is the decision framework when nothing mechanical applies or rules conflict; a domain skill (api-layer, react-state, …) is authoritative for its domain and wins on conflict.

## Commands & verification

Run from root, or from inside `client/` or `server/`. From root, target one workspace with `pnpm --filter {package-name} <command>` (directory name works too: `pnpm --filter union-twin-client ...`).

| Purpose | Command |
| --- | --- |
| Dev server | `pnpm dev` |
| Build | `pnpm build` |
| Type check | `pnpm type-check` |
| Lint | `pnpm lint` |
| Full verify | `pnpm check` (runs `lint`, `lint:prettier`, `type-check`) |
| Local Postgres | `pnpm --filter @workspace/union-twin-be dev:db` |

- **There is no test runner in this repo.** Document the command here if one is added.
- Verify incrementally with the narrowest relevant command after each logical step — don't batch many edits then verify once. `pnpm type-check` after type/schema changes; `pnpm lint` after any change.
- No `pnpm build` just to check types. No hand-editing `pnpm-lock.yaml`.
- Editing `packages/ui/src` requires `pnpm --filter @e8ight/ui build` before the change shows up at runtime — but see the wrap-don't-modify rule above first.
- When reporting completion, state the command run + exit status.

## Non-negotiable

1. Run `pnpm check` before declaring a task complete.
2. Never commit. Never create or mark PRs ready.
3. Unsure → stop, ask — see `.claude/rules/house-style.md` §1.
