---
name: react-state
description: Decides WHERE state lives — server state (TanStack Query) vs local useState/useReducer vs React Context vs Zustand — and how to wire it. Use when adding or moving state, choosing a state tool, writing stores/selectors, or handling server-data caching and invalidation.
---

# State Placement

> Where state lives is decided by **origin and access pattern**, not convenience. Pick the smallest tool that fits; escalate only when a concrete pressure forces it.

Single source of truth for state placement and for the TanStack Query query-key / invalidation convention. Library APIs (TanStack Query, Zustand) — consult Context7; this skill covers the repo's decisions and conventions only.

## Decision matrix

| Kind | Tool |
| --- | --- |
| Server data (from an API) | TanStack Query |
| URL-shareable state | `useSearchParams` / URL params |
| Form state | react-hook-form |
| Ephemeral UI state owned by one component | `useState` |
| Complex local state machine (coupled updates) | `useReducer` |
| Feature-scoped shared state with transitions | `useReducer` + Context (scoped Provider) |
| Infrequently changing app-wide values (auth, theme, i18n, flags) | Context with `useState`/`useReducer` inside |
| High-frequency or sliced client state across domains | Zustand |
| Client state read from outside React (interceptors, loaders) | Zustand |
| Client state that must survive reload | Zustand `persist` |

## Mental model

**State holders** — where the value lives: `useState` (one component), `useReducer` (component-local structured transitions), Zustand store (outside React, subscription-based).

**Transport** — how it reaches consumers: props (top-down, 1–2 levels), Context (DI for descendants, no selectors, all consumers re-render on value change), Zustand selectors (subscription, only changed slices re-render).

> **Context is transport, not state management.** State still lives in `useState`/`useReducer` inside the provider. Treating Context as "global state" is the source of most Context perf issues.

Server data (TanStack Query) and form state (react-hook-form) are their own categories — never in the primitives above.

## Decision sequence

Stop at the first level that fits. Don't preemptively globalize.

1. **`useState`, local.** Default. One component owns and reads it → stops here.
2. **`useReducer`, local.** Escalate when transitions tangle: 3+ related `useState` that always change together, branching on previous state, or a named state machine (`idle → loading → success | error`). The reducer is a pure, testable function.
3. **Lift to a common parent, pass props.** Two or three nearby components; 2–3 levels of drilling is fine. Don't reach for Context to avoid `<Child prop={value} />`.
4. **Context + `useState`/`useReducer`.** Prop drilling crosses many levels or consumers are wide, AND the value changes infrequently OR most consumers care about most of it (no selector problem).
5. **Zustand.** At least one holds: many consumers read different slices with frequent updates; must read/write from outside React; must survive reload (`persist`); genuinely cross-domain (notification queue, cart).

**Stop above the line you actually need.** Zustand for one screen's open/closed flag is the same mistake as putting it in Redux.

## Server state — TanStack Query

Any data from an API belongs to TanStack Query. The query cache is the **single source of truth** — never copy it into `useState`, Zustand, or Context. TanStack Query owns loading/error/success — no manual `isLoading`, no `useState` + `useEffect` fetch. (Suspense-mode reads and boundary placement → `suspense-data-fetching` skill. API-layer file structure → `api-layer` skill.)

### Query-key factory

Never hardcode `queryKey` arrays inline. Use a self-referencing `queryOptions()` factory so keys are one source of truth, colocated and type-linked with their fetcher, in a hierarchy that makes invalidation precise.

```ts
import { queryOptions } from '@tanstack/react-query';

export const projectQueries = {
  all: () => ['projects'] as const,
  lists: () => [...projectQueries.all(), 'list'] as const,
  list: (params?: GetListParams) =>
    queryOptions({
      queryKey: [...projectQueries.lists(), params],
      queryFn: () => getProjects(params),
      staleTime: 30_000,
    }),
  details: () => [...projectQueries.all(), 'detail'] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...projectQueries.details(), id],
      queryFn: () => getProjectById(id),
      enabled: !!id,
    }),
};
```

### Invalidation

Mutations invalidate the **narrowest** key scope that covers what changed — the hierarchy makes it precise. Broad keys refetch unrelated queries and waste network/renders.

```ts
// list changed → touch only lists, not details
queryClient.invalidateQueries({ queryKey: projectQueries.lists() });
// one project changed → its detail plus any list it appears in
queryClient.invalidateQueries({ queryKey: projectQueries.detail(id).queryKey });
queryClient.invalidateQueries({ queryKey: projectQueries.lists() });
```

Derived values from server data are computed at render time or via `select` — never stored separately (loses cache benefits, adds renders). Use `select` when one query feeds components needing different slices.

## Local state — `useState` / `useReducer`

- One concept per `useState` call. Two values that always change together → combine or move to `useReducer`.
- Derived values are computed at render, never stored: `const isValid = name.length > 0`.
- State depending on the previous value uses the updater form: `setCount((c) => c + 1)`.
- `useReducer` when state has coupled fields, transitions depend non-trivially on previous state, it forms a named state machine, or the logic deserves a unit test. Promote to Context + `useReducer` when actions must dispatch from deep descendants.

## Context conventions

Use Context for auth/session, app-wide settings (theme, locale, flags), and feature-scoped state machines whose descendants read or dispatch. Three required conventions:

**Strict context hook.** Always wrap `useContext` in a `use{X}Context()` that throws if the Provider is missing. Consumers never touch the raw context object.

```tsx
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}
```

**Stabilize the provider value.** An inline object value is a new reference every render and re-renders all consumers — the named, measured reason to memoize (house-style's no-preemptive-memo does not apply here). `useMemo` the value, `useCallback` the callbacks.

```tsx
// ❌ new object every render — re-renders every consumer
<AuthContext.Provider value={{ user, setUser }}>
// ✅
const value = useMemo(() => ({ user, setUser }), [user]);
<AuthContext.Provider value={value}>
```

**Split state and dispatch when consumers diverge.** `useReducer`'s `dispatch` is stable. Two contexts (`StateContext`, `DispatchContext`) mean dispatch-only consumers never re-render on state changes — the biggest perf win in the Context pattern.

Context has no selectors: any value change re-renders every consumer. If consumers diverge on which slice they read, or updates run many times per second, move to Zustand.

### Context + `useReducer` vs Zustand

| Question | Context + `useReducer` | Zustand |
| --- | --- | --- |
| Reset when the feature unmounts? | Yes, naturally | No, manual reset |
| Many independent instances at once? | Yes, trivially | One (or per-Provider) |
| Consumers read different slices? | No, most read most | Yes, sliced subscriptions matter |
| Update frequency? | Low–moderate | High |
| Read/write from outside React? | No | Yes |
| Persist across reloads? | No | Yes (`persist`) |

Context + `useReducer` naturally scopes state to the Provider's lifetime (fresh instance per mount, resets on unmount) — right for wizards, checkout, editor sessions. A module-scope Zustand store is a singleton that does not reset (correct for app-global, a leak for feature-local).

## Zustand conventions

External store for cross-domain client state. The repo's rules (library API → Context7):

- **Every read goes through a selector.** Inline atomic `useStore((s) => s.field)` is default; `useShallow` for genuine multi-field picks. Whole-store `useStore()` is forbidden.
- **Actions are event-named, grouped under an `actions` object.** `addItem`, not `setItems` — logic in the store, components state intent. Select `actions` whole (its reference is stable), so action-only components never re-render. No store in the repo groups actions yet: this is guidance for new stores, not a forced migration — apply it to new and touched stores, don't restructure stable ones just to satisfy the rule.
- **Derived values computed in selectors or a `useMemo` hook**, never stored.
- **`getState()` / `setState()` are forbidden in render paths.** Sanctioned only in non-React code (interceptors, loaders, ws handlers), accessed via a labeled non-`use`-prefixed namespace exported from the store file.
- **One store per domain**, one per file, no god-store. `persist` only for state that must survive reload, with `partialize` to whitelist persisted fields (never actions/transient flags).
- When client state drives a query, combine in a custom hook so the Zustand state becomes part of the query key — no mirroring.

```ts
// labeled non-reactive namespace — the ONLY sanctioned getState/setState; never import into a .tsx
export const cartStore = {
  getState: () => useCartStoreBase.getState(),
  setState: useCartStoreBase.setState,
  subscribe: useCartStoreBase.subscribe,
};
```

Feature-scoped or multiple isolated instances → per-instance `createStore` + Context; for that shape, Context + `useReducer` is usually simpler (see table above).

## Anti-patterns

| Anti-pattern | Do this instead |
| --- | --- |
| `useState` + `useEffect` for API data | TanStack Query `useQuery` / `useMutation` |
| Mirroring server data into Zustand/Context | Cache is the single source |
| Hardcoded `queryKey` arrays inline | `queryOptions()` factories |
| Invalidating with the broadest key | Narrowest key that covers the change |
| Whole-store `useStore()` (no selector) | Atomic selectors |
| Setter-style actions (`setItems`) | Event actions (`addItem`) |
| Storing derived values (query, store, or state) | Compute at render / in selectors / `useMemo` |
| God-store / god-context | One store or Provider per domain |
| Zustand for auth / theme | Context for infrequently changing globals |
| Zustand for feature-scoped state | Context + `useReducer`, scoped Provider |
| Preemptive globalization ("just in case") | Start local, escalate on real pressure |
| Bare `useContext()` without wrapper | `use{X}Context()` with a throw guard |
| Inline `value={{ ... }}` on a Provider | `useMemo` value, `useCallback` callbacks |
| One context for state + dispatch | Split `StateContext` / `DispatchContext` |
| `getState()` inside a component | Selector; `getState()` only via reader namespace |

## Rules

- Server data is always TanStack Query's; never mirror it. Use `queryOptions()` factories; invalidate the narrowest scope per mutation.
- Default to local state; escalate only on concrete pressure (drilling depth, cross-domain access, frequency, outside-React access, persistence).
- Auth/theme/locale/i18n use Context: `useMemo` the value, expose via `use{X}Context()` with a throw guard; split state/dispatch when dispatch-only consumers exist.
- Every Zustand read goes through a selector; `getState()`/`setState()` only in non-React code via a labeled namespace; derived values never stored.
- Shareable persistent state → URL (`useSearchParams`); non-shareable → Zustand `persist` with `partialize`.
- No Redux in new code unless explicitly requested.
- Cross-cutting style (no-comments, named-fn exports, no-default-export, absolute imports, no-preemptive-memo) lives in `.claude/rules/house-style.md`.
