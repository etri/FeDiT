# House Style — union-twin

Cross-cutting **always-on** conventions for `client/` and `server/`. On-demand **skills** under `.claude/skills/` hold general portable guidance (frontend-fundamentals framework, state placement, routing, folder structure, API-layer organization, loading states); this file holds **repo-specific** style they defer to. Skill says "see house-style" = this file.

> Loaded always-on via root `CLAUDE.md`. Library APIs (React, Next.js App Router, TanStack Query, Zustand, react-hook-form, Zod, Tailwind, shadcn/ui): consult official docs via Context7 — not reproduced here.

---

## 1. Working rules

### Think before coding

No assuming, no hiding confusion; surface tradeoffs. State assumptions explicitly; multiple interpretations → present them, don't pick silently; simpler approach exists → say so. Unclear → stop, ask.

### Simplicity first

Minimum code that solves problem, nothing speculative. No features beyond ask, no abstractions for single-use code, no unrequested "flexibility", no error handling for impossible scenarios. 200 lines that could be 50 → rewrite. Reader's working memory holds ~6 concepts — function/component/hook needing more → break down. Abstraction must _reduce_ cognitive load, not add indirection.

- **Inline vs extract (hooks / utils):** 1–5-line wrapper used in exactly one place → inline at call site.
- **UI components:** never inline structural React components (headers, banners, grids) just because single-use — keep parents declarative with smaller sub-components.

### Surgical changes

Touch only what you must; clean up only own mess. No "improving" adjacent code, comments, formatting. Match existing style even if you'd differ. Remove imports/variables your changes made unused; don't delete pre-existing dead code unless asked — mention it. Every changed line traces to request.

### Goal-driven execution

Turn task into verifiable goal ("add validation" → "write tests for invalid inputs, then make them pass"). Multi-step work → brief plan with verify step each.

### Declarative handlers

Components describe **what** happens, not **how**. Push imperative boilerplate into custom hooks or utilities. (`frontend-fundamentals` skill, Rule 1.2.)

### Allow duplication when divergence is likely

No reflexive DRY. Two similar hooks/components in different domains fine — even preferable — if likely to diverge; premature extraction couples unrelated features. Full decision tree: `frontend-fundamentals` skill, Rule 4.2.

### No unsolicited comments

No comments, JSDoc, inline explanations when writing/editing code — names + structure carry intent. Comment **only** when user explicitly asks. Pre-existing comments not yours to touch.

---

## 2. TypeScript

- `strict: true` non-negotiable.
- **Never** `any` — use `unknown` and narrow. **Never** `@ts-ignore`; `@ts-expect-error` only with one-line reason.
- Prefer `satisfies` over `as`. Avoid `!` (non-null assertion) unless structurally guaranteed.
- `interface` for public object shapes (component props, service inputs); `type` for unions, intersections, mapped/conditional types, tuples. Component props: `interface {Component}Props`.
- Prefer discriminated unions over optional grab-bags: `{ status: 'success'; data } | { status: 'error'; error }`, not `{ data?; error? }`.
- **Zod is form validation only** (`react-hook-form` + `zodResolver` combo, §5). API types, request bodies, params, domain entities: plain `interface` or `type` — no schema just to `z.infer` a type.
- **Imports:** always absolute via alias (`apis/`, `components/`, `pages/`, `hooks/`, `stores/`, …). No `./` or `../`. Order: node built-ins → external → absolute internal → type-only last. `import type` for type-only imports.

---

## 3. Components & styling

### Placement & export

- Shared (2+ domains): `src/components/`. Domain-local: `src/pages/{domain}/components/`. (Placement rules: `folder-structure` skill.)
- One component per file. Named function declaration: `export function UserCard() {}`. File name matches component. **No default exports** unless framework requires (app needing them notes exception in own `CLAUDE.md`).
- Props typed via `interface {Component}Props`, destructured at parameter position.
- **Presentational** (props in, JSX out, no side effects/fetching) vs **container** (wires `useQuery`/`useMutation`, passes data down) — keep split.

### `cn()` is the only way to compose classNames

Import from `@e8ight/ui/utils/cn`. Never template literals, never string concatenation, never `lib/utils`.

```tsx
// ✅
<div className={cn('flex items-center', isActive && 'bg-primary text-primary-foreground')} />
// ❌ template literal
<div className={`flex items-center ${isActive ? 'bg-primary' : ''}`} />
```

Class strings stay inline — no className variables. Pattern repeats across files → extract **component**, not string constant. Prefer predefined Tailwind utilities + semantic tokens over arbitrary values; `style={{}}` only for runtime-computed values Tailwind can't express statically.

### Typography roles

These 8 inline class strings are the **only** typography combinations. Apply verbatim with `cn()`. No extracting into utility classes or wrapper components (`<PageTitle>`).

| Role | When | Class string |
| --- | --- | --- |
| **page-title** | `<h1>` in page header, one per route | `text-xl font-semibold text-foreground` |
| **section-title** | major in-page section header, dialog title | `text-lg font-bold text-primary` |
| **card-title** | sidebar header, in-card heading | `text-sm font-bold tracking-[.03em] text-primary` |
| **body** | default content, list rows, table cells | `text-sm text-foreground` |
| **body-strong** | emphasis inside body, KPI numbers | `text-sm font-bold text-foreground` |
| **caption** | tab labels, secondary metadata, helper text | `text-xs text-muted-foreground` |
| **code-label** | uppercase wide-tracked tags ("STEP 01") | `text-xs font-bold tracking-[0.07em] uppercase` |
| **answer-prose** | streamed assistant answer body | `text-[0.9375rem] leading-7 text-foreground` |

### Composition over configuration

`<Card><CardHeader/><CardBody/></Card>`, not `<Card showHeader header={…} body={…} />`. No prop-drilling beyond two levels — composition first, Context second (`frontend-fundamentals` skill, Rule 4.3).

### Accessibility

Every interactive element has accessible name. `useId()` for form-field IDs — never `Math.random()`. No overriding focus styles without replacement.

### Memoization

No `useMemo`, `useCallback`, `React.memo` by default. Only with named reason: `React.memo` when profiling shows expensive re-renders with unchanged props; `useMemo` for genuinely expensive computation (large transforms, not string concat); `useCallback` for function passed to `React.memo` child or used in dependency array. **Stabilizing a Context provider value** (`useMemo` the value, `useCallback` callbacks) is sanctioned named reason — see `react-state` skill.

---

## 4. UI library — `@e8ight/ui`

All UI primitives come from `@e8ight/ui`, which lives in this repo at `packages/ui/` as a vendored copy of the shared library. `client/` does **not** keep a second local shadcn copy: `client/src/components/ui/default/` does not exist, must never be created.

### Import paths

```ts
import { Button } from '@e8ight/ui/components/ui/button';
import { Input } from '@e8ight/ui/components/ui/input';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@e8ight/ui/components/ui/empty';
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from '@e8ight/ui/components/ui/field';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { cn } from '@e8ight/ui/utils/cn';
// Hooks — check these before writing a custom equivalent:
import {
  useDebounce,
  useSonner,
  useIsMobile,
  useInfiniteScroll,
  useIntersectionObserver,
  useOutSideRef,
  useResizable,
} from '@e8ight/ui/hooks';
```

Full primitive set lives in `packages/ui/src/components/ui/` — browse it before writing a new component.

### Wrap, don't modify (HARD RULE)

**Never edit files inside `packages/ui/`** — it is a vendored fork of the upstream shared library, kept diffable against it. Customize: wrap primitive in `client/src/components/ui/` (PascalCase filename, named export), compose with `cn()`, preserve `data-slot` attributes. `class-variance-authority` (CVA) for custom variants.

Primitives export the component, not a `{Name}Props` interface — derive props with `React.ComponentProps<typeof X>`.

```tsx
// src/components/ui/PrimaryAction.tsx
import { Button } from '@e8ight/ui/components/ui/button';
import { cn } from '@e8ight/ui/utils/cn';

import type { ComponentProps } from 'react';

export function PrimaryAction({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return <Button className={cn('px-6 font-semibold', className)} {...props} />;
}
```

> Editing `@e8ight/ui` requires rebuilding its `dist` — runtime consumes built output, changes take no effect until rebuilt.

### Icons & theming

- Icons: **lucide only** (`import { SomeIcon } from 'lucide-react'`). No other icon libraries.
- Theme class on `<html>`: `"light"` | `"dark"`. Design tokens (CSS variables) live in `@e8ight/ui` (`styles.css` + `themes/*.css`). Prefer semantic tokens (`bg-primary`, `text-muted-foreground`) over raw colors (`bg-blue-500`); raw colors only when no semantic token maps.

## 5. Forms

**Stack:** `react-hook-form` for state, `zod` + `@hookform/resolvers/zod` for validation, `@e8ight/ui` `Field` components for rendering + a11y. **Do not** use shadcn `Form`/`FormField`/`FormItem` system — this repo uses the `Field` system from `@e8ight/ui/components/ui/field`.

**Placement:** schema in `pages/{domain}/schemas/{form}.schema.ts` (or inline for simple single-field); form component in `pages/{domain}/components/` (domain-local) or `src/components/` (shared). Form-level cohesion (one Zod schema per form) is default — `frontend-fundamentals` skill, Rule 3.3.

`FieldLabel` renders a plain `<label>` — it only associates with an input when you pass `htmlFor` matching the input's `id`. Generate that id with `useId()` (§3, Accessibility).

```tsx
const usernameId = useId();

const {
  register,
  handleSubmit,
  setError,
  formState: { errors, isSubmitting },
} = useForm<ProfileFormValues>({
  resolver: zodResolver(profileSchema),
  defaultValues: { username: '', email: '' },
  mode: 'onTouched',
});

const onSubmit = (values: ProfileFormValues) =>
  updateProfile.mutate(values, {
    onError: (e) => setError('root', { message: e.message }),
  });

return (
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
    <Field>
      <FieldLabel htmlFor={usernameId}>Username</FieldLabel>
      <Input
        id={usernameId}
        {...register('username')}
        aria-invalid={!!errors.username}
      />
      {errors.username && <FieldError>{errors.username.message}</FieldError>}
    </Field>
    {errors.root && <FieldError>{errors.root.message}</FieldError>}
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting && <Spinner className="size-4" />}저장
    </Button>
  </form>
);
```

**Rules:**

- Type form via `z.infer` — never redeclare type separately. Always provide `defaultValues`.
- `mode: 'onTouched'` for forms with 3+ fields; `'onBlur'` for very short forms.
- Cross-field validation via `.superRefine()`. Server errors via `setError('root' | '{field}', { message })`.
- Complex inputs (rich editors, date pickers) `register` can't drive → `Controller`.
- Arrays use `useFieldArray`, inner shape as own Zod schema.
- Submit handler delegates to mutation hook from `apis/{domain}` — no inline `fetch`/`axios`. Disable submit with `isSubmitting`; wrap multi-field forms in `<fieldset disabled={mutation.isPending}>` during submission.
- Programmatic dialogs/overlays use **overlay-kit** (`overlay.openAsync` imported from `overlay-kit`), not inline `useState` dialog state; confirms use `openConfirmDialog` from `@e8ight/ui/components/ui/confirm-dialog`. Loading/empty/error UI: `loading-states` skill.
