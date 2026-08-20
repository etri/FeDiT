---
name: suspense-data-fetching
description: Declarative server-data fetching with React Suspense + TanStack Query via Suspensive. Covers when a read may be suspense vs must stay useQuery, boundary composition (QueryErrorResetBoundary + ErrorBoundary + Suspense), the SuspenseQuery components, and the enabled/pagination/infinite migration cases. Use when fetching server data, adding or moving Suspense/error boundaries, or deciding whether a query may be suspense.
---

# Suspense Data Fetching

> Suspense hoists loading and error handling **out of components, into boundaries**. A component that fetches assumes its data is already there; the nearest `<Suspense>` shows the fallback while it isn't, the nearest `<ErrorBoundary>` shows the error if it throws. No `isLoading`/`isError` branching at the call site, and `data` is always defined.

**Suspensive** (`@suspensive/react`, `@suspensive/react-query`) provides the Suspense ↔ TanStack Query glue. This skill is the **where / when**; for the component APIs read the Suspensive + TanStack Query docs via Context7 — don't reproduce them here. Note: `<AsyncBoundary>` was removed in Suspensive v2 — compose `<ErrorBoundary>` + `<Suspense>` directly, don't reintroduce it.

## Setup — default fallbacks once, at the root

```tsx
import { DefaultProps, DefaultPropsProvider } from '@suspensive/react';

const defaults = new DefaultProps({
  Suspense: { fallback: <Spinner /> },
  Delay: { ms: 200 }, // flash-guard
});
<DefaultPropsProvider defaultProps={defaults}>{/* app */}</DefaultPropsProvider>;
```

A page may still pass an explicit `<Suspense fallback={<Skeleton />}>` to override.

## The load-bearing rule: may this read be suspense?

Suspense fits a read that is **required and resolved during render**, behind a boundary. Classify every query before converting:

| Bucket | Shape | Migrate to |
| --- | --- | --- |
| **A** unconditional render read | `useQuery(opts)` | `useSuspenseQuery` / `SuspenseQuery` + boundary |
| **B** conditional (`enabled`) | `useQuery({ ...opts, enabled })` | gate the suspense child by render |
| **C** pagination | `placeholderData` / `keepPreviousData` | `useSuspenseQuery` + `useDeferredValue` |
| **D** infinite | `useInfiniteQuery` | `useSuspenseInfiniteQuery` / `SuspenseInfiniteQuery` |
| **E** imperative | fired in a handler/effect/`fetchQuery` | **stays `useQuery`** — suspense is render-only |

A is the bulk and the safe win. E never becomes suspense.

## Boundary composition

Wire query-error reset so the fallback's retry actually refetches — `useQueryErrorResetBoundary()` in a component body, or the `QueryErrorResetBoundary` render-prop in route-element JSX (no hooks there):

```tsx
const { reset } = useQueryErrorResetBoundary();
<ErrorBoundary onReset={reset} fallback={QueryErrorFallback}>
  <Suspense>{children}</Suspense>
</ErrorBoundary>;
```

- **One boundary per independently-recoverable region**, co-located with its data — never one page-wide boundary (a single failed fetch must not blank the page).
- Wrap sibling regions in `ErrorBoundaryGroup` for a single "retry all".
- `<ErrorBoundary shouldCatch={SomeError}>` scopes which errors a boundary catches; the rest bubble out.

## Fetching components

```tsx
<SuspenseQuery {...userQueryOptions(id)}>
  {({ data: user }) => <Profile user={user} />}
</SuspenseQuery>
```

Use `SuspenseQueries` for a fixed parallel set, `SuspenseInfiniteQuery` for infinite. Use the **hook** form (`useSuspenseQuery` / `useSuspenseInfiniteQuery`) when the data feeds body logic/hooks or a dynamic-length parallel set.

## The B / C / D cases

- **B — `enabled`:** suspense queries are always enabled; lift the condition to JSX so the suspending child mounts only when the guard holds (`{selectedId ? <Suspense><Detail id={selectedId} /></Suspense> : <EmptyState />}`).
- **C — pagination:** no `placeholderData`; `const deferred = useDeferredValue(page)` and read `useSuspenseQuery(listOptions(deferred))`; `page !== deferred` dims the stale table.
- **D — infinite:** `useSuspenseInfiniteQuery` with the same options; drop the initial-load `isLoading` branch (the boundary owns it), keep `isFetchingNextPage`.

After converting, delete the manual `isLoading`/`isError` branches the boundary now owns; keep inline `isError` only for an in-place recoverable case you deliberately handle without a boundary.

## Mutations

Mutations are **never suspended** — keep `useMutation` and the `loading-states` blocking backdrop for in-flight writes.

## Anti-patterns

| Anti-pattern | Instead |
| --- | --- |
| Reintroducing an `AsyncBoundary` wrapper (removed in v2) | Compose `ErrorBoundary` + `Suspense` |
| Suspense query with `enabled` | Gate the child by render (B) |
| `isPending`/`isError` branch **inside** a boundary | Let the boundary render the fallback |
| One boundary around the whole page | One boundary per recoverable region |
| Suspending an imperative/handler fetch | Keep `useQuery` (E) |
| Copying suspense `data` into `useState` | Cache is the source of truth (`react-state`) |

## See also

- **`react-state`** — where state lives, plus the query-key factories these reads consume.
- **`loading-states`** — the spinner / skeleton / empty-error UI a fallback renders.
