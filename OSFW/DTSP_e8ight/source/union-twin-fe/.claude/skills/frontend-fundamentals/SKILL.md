---
name: frontend-fundamentals
description: Core code-quality decision framework — readability, predictability, cohesion, coupling, and SOLID-for-React. Use when designing, refactoring, reviewing, or naming React/TypeScript code; deciding whether to abstract vs duplicate; or whenever no mechanical rule applies.
---

# Frontend Fundamentals

> **Good frontend code is code that is easy to modify.** Judge every suggestion, refactor, or new piece of code against four criteria. Inspired by [frontend-fundamentals.com](https://frontend-fundamentals.com/code-quality/code/).

## The four criteria

1. **Readability** — How quickly can another person understand this?
2. **Predictability** — Can behavior be guessed from name, params, and return type alone?
3. **Cohesion** — Do things that change together live together?
4. **Coupling** — When this changes, how wide is the blast radius?

### The central trade-off (read first)

These four can conflict; you cannot maximize all at once. Raising cohesion (abstracting shared logic) often reduces readability; lowering coupling (allowing duplication) often reduces cohesion. **Do not mechanically apply a rule** — weigh which principle matters most for the change. Prefer cohesion when not-changing-together causes real bugs; prefer readability when the risk is low.

A reader's working memory holds **~6 concepts** at once. If a function, component, or hook needs more than that held simultaneously, break it down. But an abstraction nobody asked for is equally harmful: if it adds more indirection than it removes, stop.

### SOLID in React

| Principle | In practice |
| --- | --- |
| **SRP** | One hook = one concern; one component = one reason to change. A hook named after a page (`usePageState`) is a smell. |
| **OCP** | Extend via composition (`children`, slots), not config props (`<Card><CardHeader/></Card>`, not `<Card showHeader header={…}/>`). |
| **LSP** | Same-category hooks return the same shape (Rule 2.2). Swapping one for another should not surprise. |
| **ISP** | Small, focused prop interfaces. No god-props (`PageProps` with 15 fields). |
| **DIP** | Depend on abstractions: query factories (`api-layer` skill), context hooks (`use{X}Context`), not concrete fetch calls or raw stores. |

---

## 1. Readability

Readable code holds **few contexts** at once and **flows top-to-bottom**.

- **Rule 1.1 — Separate code that doesn't run together.** Branches that never execute together (`viewer` vs `admin`) → split into two components, dispatch once at the top.
- **Rule 1.2 — Abstract implementation details.** Side concerns (auth checks, redirects, analytics) belong in a wrapper/HOC, not inline in the main body.
- **Rule 1.3 — Split functions/hooks grouped only by "logic type."** A `usePageState()` owning every query param forces re-renders on unrelated changes. Split by **domain/responsibility**, not technical category.
- **Rule 1.4 — Name complex conditions.** Extract multi-part booleans into named variables (skip trivial one-liners used once).
- **Rule 1.5 — Name magic numbers.** `delay(300)` → `const ANIMATION_DELAY_MS = 300`.
- **Rule 1.6 — Reduce eye movement.** Prefer linear reading over jumps between policy-map → helper → component. Reserve abstraction for genuinely complex cases.
- **Rule 1.7 — Do not nest ternaries.** Replace nested `? :` with an IIFE of early-returning `if`s.
- **Rule 1.8 — Range comparisons left-to-right.** `80 <= score && score <= 100`, don't repeat the middle term.

## 2. Predictability

Name + params + return type should fully imply behavior.

- **Rule 2.1 — Distinct behaviors get distinct names.** Wrapping a library and adding behavior (auth headers, caching) → don't shadow its name. `http.get` that secretly fetches a token is a trap.
- **Rule 2.2 — Unify return types for same-category functions.** All API hooks return the same shape (e.g. always a `Query` object); all validators the same. Use discriminated unions (`{ ok: true } | { ok: false; reason }`).
- **Rule 2.3 — Do not hide logic.** A function must not do what its signature doesn't imply. `fetchBalance()` fetches balance — it does not also fire analytics. Compose at the call site.

## 3. Cohesion

- **Rule 3.1 — Co-locate files that change together.** Avoid type-first top-level layouts (`/components`, `/hooks`, `/utils` with hundreds of files); prefer domain-first so a feature is deletable as one directory. Layout: `folder-structure` skill.
- **Rule 3.2 — Magic numbers as named constants (cohesion view).** If `delay(300)` tracks a 300ms animation, a shared `ANIMATION_DELAY_MS` forces them to change together.
- **Rule 3.3 — Field-level vs form-level validation, chosen deliberately.** One per form. Default form-level (single Zod schema + `zodResolver`); field-level only for genuinely independent async checks.

## 4. Coupling

- **Rule 4.1 — Manage responsibilities individually.** A god hook (`usePageState`) is referenced everywhere; one edit breaks a whole page. Split per responsibility.
- **Rule 4.2 — Allow duplicate code when divergence is likely.** Don't reflexively DRY. (1) same behavior, stable, must stay in sync → **extract**; (2) likely to diverge per feature within ~3 months → **allow duplication**; (3) similar but unrelated domains → **never merge**, even if identical today.
- **Rule 4.3 — Eliminate props drilling via composition.** A prop through 2+ intermediate components that don't use it is coupling. Let the parent render the leaf directly before reaching for Context/store/URL state.

---

## Custom hooks

Hooks are the primary unit of logic reuse — apply SRP rigorously (Rules 1.3 / 4.1).

- **One hook, one concern.** A hook managing `keyword` + `sort` + `dateRange` is three hooks. A hook named after a page (`usePageState`, `useEverything`) is a smell — name it after the concern (`useSearchKeyword`).
- **Return shape:** object when 3+ values or callers take a subset; tuple when order is semantic and ≤2 values (like `useState`).
- **Inline vs extract:** inline when used once and ≤5 lines; extract when used in 2+ places or it holds non-trivial logic.
- **Anti-patterns:** *mega hook* (every query param for a page → split per concern); *god hook* (fetch + transform + local state + side effect in one body → separate); *kitchen-sink return* (8+ values).

(Naming `use*`, no-memoization-by-default, and no-comments are in `.claude/rules/house-style.md`.)

## Smell → rule lookup

| When you see… | Rule |
| --- | --- |
| `useEffect` + early-return-on-role branching, or 2+ `useEffect` for unrelated concerns | 1.1 |
| Raw inline auth/redirect checks inside page components | 1.2 |
| Hook named `usePageState` / `useEverything`, or managing 3+ unrelated params | 1.3 / 4.1 |
| Boolean expression > 2 conjuncts without a name | 1.4 |
| Numeric literal that isn't `0`, `1`, or array indexing | 1.5 / 3.2 |
| `a >= b && a <= c` (middle term repeated) | 1.8 |
| Nested `? :` chains | 1.7 |
| Same name as an imported library symbol, with extra behavior | 2.1 |
| Hook returning `.data` while siblings return the full `Query` | 2.2 |
| Function that fetches and also logs/tracks/mutates | 2.3 |
| Top-level `/components`, `/hooks`, `/utils` with hundreds of files | 3.1 |
| A prop passing through a component that only forwards it | 4.3 |
| A "shared" hook accepting 6+ boolean/config params, or returning 8+ values | 4.2 / SRP |
| `useMemo`/`useCallback`/`React.memo` without a profiled or dependency-array reason | unnecessary memoization (house-style) |

Two worked examples where the fix isn't obvious from the rule:

```ts
// Rule 1.7 — nested ternary → early-return IIFE
const status = (() => {
  if (A && B) return 'BOTH';
  if (A) return 'A';
  if (B) return 'B';
  return 'NONE';
})();
```

```tsx
// Rule 4.3 — composition over props drilling: parent composes the leaf, middle layer gone
<Modal open={open} onClose={onClose}>
  <Input value={keyword} onChange={...} />
  <ItemEditList items={items} keyword={keyword} onConfirm={onConfirm} />
</Modal>
```

## Agent decision checklist

Before emitting a suggestion, silently answer:

1. **Readability** — ≤ ~6 contexts? Reads top-to-bottom? Conditions and numbers named?
2. **Predictability** — Behavior guessable from name + signature? No hidden side effects? Return shape consistent with siblings?
3. **Cohesion** — Do lines/files that must change together live together?
4. **Coupling** — In 3 months, how many unrelated files need edits? Props drilling? Premature deduplication?
5. **Trade-off named** — If a fix improves one principle at another's cost, say so.

When a rule is violated, quote the rule number and give the **minimal** fix. A domain skill's rule overrides this framework when they conflict.

> Out of scope: formatting → Prettier/ESLint; cross-cutting style and memoization → `.claude/rules/house-style.md`; library APIs → Context7.
