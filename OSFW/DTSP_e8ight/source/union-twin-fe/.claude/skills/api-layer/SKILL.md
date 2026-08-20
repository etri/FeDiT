---
name: api-layer
description: Conventions for organizing a data/API layer — group by resource, separate HTTP functions from query/mutation hooks, standalone async functions, co-located types, and per-resource barrels. Use when adding or editing API calls or data-fetching code. For query-key factories and cache invalidation, see the react-state skill.
---

# API / Data Layer

Group data-fetching code **by resource** (one folder per API resource), and keep three concerns separate: raw HTTP functions, query/mutation hooks, and types.

> Query keys, the query-key factory pattern, and cache invalidation live in the **react-state** skill. This skill covers how to *organize* the data layer.

## Structure per resource

```text
<api-root>/<resource>/
  <resource>Api.ts            # Standalone exported async HTTP functions
  <resource>.queries.ts       # Query option factories (queryOptions)
  <resource>.mutations.ts     # Mutation hooks (useMutation) — only if needed
  <resource>.types.ts         # Request/response/param types — only if needed
  index.ts                    # Barrel re-export
```

## Rules

- **Shared infrastructure** (the HTTP client instance, base config, shared response-envelope types) lives at the data-layer root, not inside a resource folder.
- The **barrel** (`index.ts`) re-exports the resource's query factories, mutation hooks, and types; callers import from the barrel, not individual files.
- **HTTP files** contain only HTTP logic — no React, no hooks. Query/mutation files contain only the hook wrappers.
- **Use standalone exported async functions**, not one object with methods — better tree-shaking, natural call sites. Each awaits the request and returns the response body.
- **Create `*.mutations.ts` / `*.types.ts` only when needed.** A query-only resource skips mutations.
- **Keep all queries/mutations for a resource in its folder.** A page needing a new query adds it there — don't scatter data hooks into page-local folders.
- **Resource-agnostic types** shared across many features belong in a shared types location, not a resource folder.

(Absolute imports, named functions, no default exports, no `any` are house-wide — see `.claude/rules/house-style.md`; a per-resource barrel `index.ts` is the standard exception to the "avoid barrels" rule.)

## Types file

Co-locate the resource's API types: entity types (what the API returns), request types (`Create*Request`, `Update*Request`), and param types (`Get*Params`). Reuse a shared response-envelope type (e.g. `ApiResponse<T>` / `Paginated<T>`) from the data-layer root; add a resource-specific wrapper only when it carries extra fields.

## HTTP function template

```ts
import { client } from '<api-root>/client';
import type { Entity, CreateEntityRequest, GetEntitiesParams } from './entity.types';
import type { ApiResponse, Paginated } from '<api-root>/types';

const BASE = '/entities';

export const getEntities = async (params?: GetEntitiesParams) => {
  const { data } = await client.get<Paginated<Entity>>(BASE, { params });
  return data;
};

export const getEntityById = async (id: string) => {
  const { data } = await client.get<ApiResponse<Entity>>(`${BASE}/${id}`);
  return data;
};

export const createEntity = async (body: CreateEntityRequest) => {
  const { data } = await client.post<ApiResponse<Entity>>(BASE, body);
  return data;
};
```

For the HTTP client's own API (interceptors, config), consult its official docs via Context7 — this skill is about layer organization, not the client's API.
