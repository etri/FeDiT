---
name: folder-structure
description: Domain-first file placement — where new files/folders go (pages/<domain> vs shared src/ roots), role-based grouping within a folder, and promotion to shared. Use when creating new files or directories or deciding where code belongs.
---

# Domain-First Folder Structure

## Principle

Domain-first co-location (cohesion, frontend-fundamentals Rule 3.1):

- Keep code close to the domain that owns it.
- Promote to a shared/global root folder only after **real cross-domain reuse** (used by 2+ domains).
- A feature should be deletable as a single directory; cross-domain imports should be visible smells.

Start flat; refactor into domain folders when the flat structure becomes painful or cross-domain imports appear. Only create directories the project actually needs — never scaffold empty folders.

## Placement rules

- Code used by **one domain** → keep it inside that domain folder.
- Code used by **2+ domains** → promote to the matching shared/global root folder.
- Never place single-domain code in a root-level shared folder.
- Domain code must not depend on another domain's internal folders; cross-domain reuse flows through shared/global folders.

## Root-level layout

One folder per route/domain under `pages/`; the data layer is grouped **by resource** and lives at the root regardless of scale.

```text
src/
├── apis/           # Data layer: HTTP client, query/mutation factories, types (api-layer skill)
├── components/     # Shared UI used across 2+ domains
├── hooks/          # Shared hooks used across 2+ domains
├── lib/            # Pure utilities (cn(), formatters)
├── pages/          # Route entry points — one folder per route/domain
├── stores/         # App-wide client-state stores (react-state skill)
├── types/          # Shared TypeScript types (2+ domains)
├── App.tsx         # Root layout (renders <Outlet />)
├── router.tsx      # Route definitions (createBrowserRouter)
├── index.tsx       # Entry (providers + RouterProvider) — referenced by index.html
└── assets/styles/index.css   # Global styles, Tailwind entry
```

Root shared folders hold code promoted after real cross-domain reuse, or inherently app-wide infrastructure.

## Domain folder shape (`pages/<domain>/`)

Use only what the domain needs: `components/`, `constants/`, `hooks/`, `types/`, `utils/`, `stores/`, `schemas/`.

**Grouping within a folder:** group by role once a folder mixes kinds — hooks in `hooks/`, utilities in `utils/`, a component plus its variants in a family folder (`ContentCard/`). Name child files after the family (`ContentCardSkeleton.tsx`, not bare `Skeleton.tsx`) so the name communicates ownership. A subfolder needs at least one real file.

**`features/` (complex domains only):** for a domain with heavy distinct sub-features, add `features/<feature>/` each with its own `components/`, `hooks/`, `types/`. If a complex component needs isolated hooks/utils used nowhere else, nest them adjacent to the component inside `components/` rather than forcing a `features/` extraction.

## Barrels

Avoid unnecessary `index`/barrel files; add one only when it clearly improves import ergonomics. A per-resource API barrel (`api/<resource>/index.ts`) is the standard exception.

## Test placement

- Co-locate `ComponentName.test.tsx` next to `ComponentName.tsx`; it inherits the source's domain.
- Shared test infrastructure lives in `src/test/`.
- **Do NOT** create a top-level `__tests__/` mirror. Integration/E2E may live in a project-root `e2e/` outside `src/`.

## Migration policy

Guidance, not a forced repo-wide migration. Apply to new and touched files when practical; don't refactor stable, untouched structure just to satisfy this policy.

## Examples

Good: `pages/dashboard/hooks/useDashboardFilters.ts` (dashboard-only) · `hooks/useDebounce.ts` (multi-domain) · `stores/useFilterStore.ts` (app-wide).
Bad: `components/WidgetX.tsx` used by only one domain · `pages/a/hooks/useSharedThing.ts` imported by `pages/b/*` · `src/store.tsx` (singular root file — use `stores/use{X}Store.ts`).
