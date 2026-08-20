---
name: loading-states
description: Loading / empty / error UI conventions — skeleton vs spinner vs blocking backdrop, a consistent spinner size & color scale, and a reusable empty/error component instead of raw error text. Use when adding loading spinners, skeletons, or error/empty states.
---

# Loading & Error States

Use three primitives — a **spinner**, a **skeleton**, and a reusable **empty/error** component — composed **inline** at the call site. Don't invent ad-hoc loaders or one-off error components.

## Loading vs status (don't confuse them)

- **Loading** = the user is waiting on a fetch or mutation → spinner or skeleton.
- **Status** = the system reporting its own ongoing state (AI mid-thought, socket reconnecting, pending toast) → pulsing/colored-dot indicators. **Don't** replace a status indicator with a loading spinner.

## Decision rule — skeleton vs spinner vs blocking backdrop

1. **Skeleton** — first paint of structured content whose layout shape is known (tables, card grids, lists, headers). Match the heights/widths of the real content.
2. **Spinner** — indefinite waits where a skeleton would mislead (initial section load, dialog body, infinite-scroll fetch-next, button submit, inline label).
3. **Inline backdrop + spinner** — a mutation must block interaction during a decisive action. Render a backdrop div containing a centered spinner and an optional label.

## Spinner size & color scale

Define a **small fixed size scale and stick to it** — don't sprinkle arbitrary sizes. A typical scale:

| Size | Use |
|---|---|
| smallest | inline icon inside a button |
| small | button content / dialog footer / inline label |
| medium | dialog body / dropdown / small centered region |
| large | section or page initial load (centered) |
| largest | blocking backdrop (centered) |

Color: a **muted** token for passive loading; the **primary/accent** token for a blocking action; **no color** inside a button or colored container that already sets text color. Use semantic design tokens, not raw colors (see `.claude/rules/house-style.md`).

## Layout patterns

### Skeleton placeholder (initial structured load)

```tsx
{isPending ? (
  <div>
    {Array.from({ length: 8 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
) : (
  <Content />
)}
```

### Centered region spinner (initial section load)

```tsx
{isPending ? (
  <div className="flex h-full items-center justify-center">
    <Spinner className="size-6 text-muted-foreground" />
  </div>
) : (
  <Content />
)}
```

Keep this small pattern **inline** — don't abstract it into a wrapper; inline keeps the layout self-documenting.

### Inline blocking backdrop (mutation in progress)

Viewport-wide blocking uses a `fixed inset-0` overlay; content-area blocking uses `absolute inset-0` on a `relative` parent.

```tsx
<div className="relative flex min-h-0 flex-1 flex-col">
  {mutation.isPending && (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-xs"
    >
      <Spinner className="size-10 text-primary" />
      <span className="text-sm text-muted-foreground">Saving…</span>
    </div>
  )}
  <Content />
</div>
```

Omit the label when the action is brief enough that text is unhelpful.

## Error & zero-result states

Always use a **reusable empty/error component** with an icon, title, description, and an optional action. **Never** render plain-text errors or one-off custom error components.

```tsx
<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <SearchX />
    </EmptyMedia>
    <EmptyTitle>Couldn't load results</EmptyTitle>
    <EmptyDescription>Check your connection and try again.</EmptyDescription>
  </EmptyHeader>
  <Button variant="outline" onClick={retry}>Retry</Button>
</Empty>
```

Pick an icon that communicates the state (e.g. a warning icon for a generic error, a search-x for "no results", a file-search for "not found"/"no permission").

## Boundaries & fallbacks

- Pages still inline-handle `isError` from a query for contextual, recoverable errors (404, validation, retryable states). A top-level error boundary is the safety net for *unexpected* render errors, not a replacement for inline handling. (See the `suspense-data-fetching` skill for where Suspense + ErrorBoundary boundaries go.)
- **Secondary/enrichment data** (a badge, a count) with a sensible visual fallback (`—`, `0`, hidden) needs **no** loading/error UI — let the primary content handle its own state.

> Styling rules (`cn()`, inline classes, semantic tokens, `lucide-react` icons) live in `.claude/rules/house-style.md`. Server-data loading/error ownership is the `react-state` skill (TanStack Query).
