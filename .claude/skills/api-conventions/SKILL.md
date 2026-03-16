---
name: api-conventions
description: API design patterns for this codebase
---

## TanStack Start: server functions in feature folders

TanStack Start's `createServerFn` handlers can live anywhere in the codebase — including inside `features/`. The framework uses a Vite plugin to extract server-only code at build time, so physical file location doesn't affect the client/server boundary. See [TanStack Start docs](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions#advanced-topics).

In this project, `features/<name>/api.ts` holds `createServerFn` handlers for that feature. The shared server infrastructure (Prisma singleton, tRPC init) stays in `src/server/`.

## React Query: keys vs query options

Each feature's `queries.ts` separates **keys** from **query options**:

- `createQueryKeys` (from `@lukemorales/query-key-factory`) defines only the key structure — no `queryFn` inside it.
- `queryOptions` (from `@tanstack/react-query`) wraps the key + `queryFn` + any other options. This gives the returned `queryKey` a `dataTag`, so `getQueryData`/`setQueryData` infer the data type automatically.

**Always import query options (not raw keys) when calling `useQuery`, `getQueryData`, etc.** The raw keys are an internal detail of the file and should not even be exported.

Why not put `queryFn` inside `createQueryKeys`? The library doesn't attach a `dataTag` to the query key ([discussion](https://github.com/lukemorales/query-key-factory/discussions/31)), so `queryClient.getQueryData(key)` returns `unknown`. Wrapping with `queryOptions` fixes this.

## Facets: derived query options

Derived queries live in `facets/` — one file per logical getter function. Each facet spreads the base query options from `queries.ts` and adds a `select` transform (or other derivation logic). This keeps `queries.ts` focused on data fetching and key management, while facets handle reshaping.

```ts
// src/features/{feature}/facets/featureMap.ts
import { queryOptions } from '@tanstack/react-query';
import { indexBy, prop } from 'ramda';

import { getFeatureQueryOptions } from '../queries';

export const getFeatureMapQueryOptions = () =>
  queryOptions({
    ...getFeatureQueryOptions(),
    select: indexBy(prop('id')),
  });
```

File naming does not double the exported function name exactly and instead follows the derivation purpose (e.g. `categoryMap.ts`, `subcategoryMap.ts`, `transactionMap.ts`). One file per function unless functions are logically connected.

## Zod schemas: encode/decode with codecs

Each feature that transfers data between server and client defines a `schema.ts` using Zod codec properties for bidirectional type-safe serialization:

```
Prisma result ──[schema.encode()]──▶ wire JSON ──[schema.decode()]──▶ client type
     api.ts handler                                queries.ts queryFn
```

- **Schema field names must match Prisma model field names** — this allows passing Prisma results directly to `schema.encode()` with almost zero manual mapping. Exception: we use dayjs on the client, but prisma returns Date objects, so we need to explicitly map those. `encode()` strips extra Prisma fields (`userId`, etc.) automatically.
- `z.input<typeof schema>` = **wire type** — plain JSON (strings for Decimal/Date)
- `z.output<typeof schema>` = **client type** — rich objects (decimal.js `Decimal`, `Date`)
- Shared codecs (`decimalCodec`, `datetimeCodec`) live in `src/shared/codecs.ts` — features import them as codec properties inside `z.object()`
- Cross-feature schema imports are allowed (e.g. `transactions/schema.ts` imports `categories/schema.ts`) since schemas are pure type definitions with no side effects
- The handler calls `schema.encode(prismaResult)` directly — no intermediate mapping unless really necessary (e.g. for date fields).
- The queryFn calls `schema.decode(wireData)` — returns typed client objects

```ts
// src/features/{feature}/schema.ts
import { decimalCodec } from '~/shared/codecs';
import { categorySchema } from '~/features/categories/schema';

export const itemSchema = z.object({
  id: z.number(),
  cost: decimalCodec, // wire: string ↔ client: Decimal
  category: categorySchema, // composed from another feature's schema
});

// api.ts — handler
return items.map((item) => itemSchema.encode(item));

// queries.ts — queryFn
return rows.map((row) => itemSchema.decode(row));
```
