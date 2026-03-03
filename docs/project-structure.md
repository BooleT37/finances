# 🗄️ Project Structure

## This project's layout

```
finances/
├── src/
│   ├── components/      # Shared UI components (generic, reusable across features)
│   ├── features/        # Feature modules — see feature structure below
│   ├── lib/
│   │   ├── i18n/        # react-i18next init; merges i18nResources from all features
│   │   └── trpc/        # tRPC React client
│   ├── routes/          # File-based routes (TanStack Router)
│   │   ├── __root.tsx   # Root layout: AppShell, providers
│   │   └── index.tsx    # Redirects to default route
│   ├── server/          # Shared server infrastructure (TanStack Start convention)
│   │   ├── db.ts        # Prisma client singleton
│   │   ├── routers/     # tRPC routers
│   │   └── trpc.ts      # tRPC server init
│   ├── shared/          # Shared utilities with no feature dependencies
│   │   └── codecs.ts    # Zod codecs for common wire↔client transforms (Decimal, Date)
│   ├── stores/          # Global Jotai atom stores
│   ├── router.tsx       # Router config with getRouter()
│   └── routeTree.gen.ts # Auto-generated (do not edit)
├── docs/
├── prisma/
└── vite.config.ts
```

## Feature folder structure

Each feature lives under `src/features/{feature}/` and includes only the files it needs:

```
src/features/{feature}/
├── api.ts          # createServerFn handlers (TanStack Start — see note below)
├── schema.ts       # Zod schemas with codec properties for wire↔client types
├── components/     # Feature-specific React components
├── facets/         # Derived query options — one file per logical getter (see pattern below)
├── hooks/          # Feature-specific hooks
├── i18n.ts         # Exports i18nResources = { en: { ns: data }, ru: { ns: data } }
├── locales/        # Translations colocated with the feature
│   ├── en/{namespace}.json
│   └── ru/{namespace}.json
├── queries.ts      # React Query keys + base query options (see pattern below)
├── stores/         # Feature-specific Jotai atoms
├── types/          # TypeScript types
└── utils/          # Utility functions
```

---

credit: https://github.com/alan2207/bulletproof-react/

Most of the code lives in the `src` folder and looks something like this:

```sh
src
|
+-- app               # application layer containing:
|   |                 # this folder might differ based on the meta framework used
|   +-- routes        # application routes / can also be pages
|   +-- app.tsx       # main application component
|   +-- provider.tsx  # application provider that wraps the entire application with different global providers - this might also differ based on meta framework used
|   +-- router.tsx    # application router configuration
+-- assets            # assets folder can contain all the static files such as images, fonts, etc.
|
+-- components        # shared components used across the entire application
|
+-- config            # global configurations, exported env variables etc.
|
+-- features          # feature based modules
|
+-- hooks             # shared hooks used across the entire application
|
+-- lib               # reusable libraries preconfigured for the application
|
+-- stores            # global state stores
|
+-- testing           # test utilities and mocks
|
+-- types             # shared types used across the application
|
+-- utils             # shared utility functions
```

For easy scalability and maintenance, organize most of the code within the features folder. Each feature folder should contain code specific to that feature, keeping things neatly separated. This approach helps prevent mixing feature-related code with shared components, making it simpler to manage and maintain the codebase compared to having many files in a flat folder structure. By adopting this method, you can enhance collaboration, readability, and scalability in the application's architecture.

A feature could have the following structure:

```sh
src/features/awesome-feature
|
+-- api         # exported API request declarations and api hooks related to a specific feature
|
+-- assets      # assets folder can contain all the static files for a specific feature
|
+-- components  # components scoped to a specific feature
|
+-- hooks       # hooks scoped to a specific feature
|
+-- stores      # state stores for a specific feature
|
+-- types       # typescript types used within the feature
|
+-- utils       # utility functions for a specific feature
```

NOTE: You don't need all of these folders for every feature. Only include the ones that are necessary for the feature.

### TanStack Start: server functions in feature folders

TanStack Start's `createServerFn` handlers can live anywhere in the codebase — including inside `features/`. The framework uses a Vite plugin to extract server-only code at build time, so physical file location doesn't affect the client/server boundary. See [TanStack Start docs](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions#advanced-topics).

In this project, `features/<name>/api.ts` holds `createServerFn` handlers for that feature. The shared server infrastructure (Prisma singleton, tRPC init) stays in `src/server/`.

### i18n: feature-colocated translations (Option B)

Each feature that has translations exports an `i18nResources` object from its `i18n.ts`:

```ts
// src/features/{feature}/i18n.ts
export const i18nResources = {
  en: { namespace: enData },
  ru: { namespace: ruData },
} as const;
```

`src/lib/i18n/index.ts` imports and spreads them all into the master `resources` object passed to `i18n.init()`. TypeScript infers all namespace types automatically via `as const` + `(typeof resources)['ru']` — no manual type maintenance needed.

### React Query: keys vs query options

Each feature's `queries.ts` separates **keys** from **query options**:

- `createQueryKeys` (from `@lukemorales/query-key-factory`) defines only the key structure — no `queryFn` inside it.
- `queryOptions` (from `@tanstack/react-query`) wraps the key + `queryFn` + any other options. This gives the returned `queryKey` a `dataTag`, so `getQueryData`/`setQueryData` infer the data type automatically.
**Always import query options (not raw keys) when calling `useQuery`, `getQueryData`, etc.** The raw keys are an internal detail of the file.

```ts
// src/features/{feature}/queries.ts
import { createQueryKeys } from '@lukemorales/query-key-factory';
import { queryOptions } from '@tanstack/react-query';

// 1. Keys only — no queryFn
const featureKeys = createQueryKeys('feature', {
  byYear: (year: number) => ({ queryKey: [year] }),
});

// 2. Query options — wraps key + queryFn
export const getFeatureQueryOptions = (year: number) =>
  queryOptions({
    ...featureKeys.byYear(year),
    queryFn: async () => { /* fetch + decode */ },
  });
```

Why not put `queryFn` inside `createQueryKeys`? The library doesn't attach a `dataTag` to the query key ([discussion](https://github.com/lukemorales/query-key-factory/discussions/31)), so `queryClient.getQueryData(key)` returns `unknown`. Wrapping with `queryOptions` fixes this.

### Facets: derived query options

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

File naming follows the derivation purpose (e.g. `categoryMap.ts`, `subcategoryMap.ts`, `transactionMap.ts`). One file per function unless functions are logically connected.

### Zod schemas: encode/decode with codecs

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
- The handler calls `schema.encode(prismaResult)` directly — no intermediate mapping unless really nessessary (e.g. for date fields).
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

In some cases it might be more practical to keep all API calls outside of the features folders in a dedicated `api` folder where all API calls are defined. This can be useful if you have a lot of shared API calls between features.

In the past, it was recommended to use barrel files to export all the files from a feature. However, it can cause issues for Vite to do tree shaking and can lead to performance issues. Therefore, it is recommended to import the files directly.

It might not be a good idea to import across the features. Instead, compose different features at the application level. This way, you can ensure that each feature is independent which makes the codebase less convoluted.

To forbid cross-feature imports, you can use ESLint:

```js
'import/no-restricted-paths': [
    'error',
    {
        zones: [
            // disables cross-feature imports:
            // eg. src/features/discussions should not import from src/features/comments, etc.
            {
                target: './src/features/auth',
                from: './src/features',
                except: ['./auth'],
            },
            {
                target: './src/features/comments',
                from: './src/features',
                except: ['./comments'],
            },
            {
                target: './src/features/discussions',
                from: './src/features',
                except: ['./discussions'],
            },
            {
                target: './src/features/teams',
                from: './src/features',
                except: ['./teams'],
            },
            {
                target: './src/features/users',
                from: './src/features',
                except: ['./users'],
            },

            // More restrictions...
        ],
    },
],
```

You might also want to enforce unidirectional codebase architecture. This means that the code should flow in one direction, from shared parts of the code to the application (shared -> features -> app). This is a good practice to follow as it makes the codebase more predictable and easier to understand.

![Unidirectional Codebase](./assets/unidirectional-codebase.png)

As you can see, the shared parts can be used by any part of the codebase, but the features can only import from shared parts and the app can import from features and shared parts.

To enforce this, you can use ESLint:

```js
'import/no-restricted-paths': [
    'error',
    {
    zones: [
        // Previous restrictions...

        // enforce unidirectional codebase:
        // e.g. src/app can import from src/features but not the other way around
        {
            target: './src/features',
            from: './src/app',
        },

        // e.g src/features and src/app can import from these shared modules but not the other way around
        {
            target: [
                './src/components',
                './src/hooks',
                './src/lib',
                './src/types',
                './src/utils',
            ],
            from: ['./src/features', './src/app'],
        },
    ],
    },
],
```

By following these practices, you can ensure that your codebase is well-organized, scalable, and maintainable. This will help you and your team to work more efficiently and effectively on the project.
This approach can also make it easier to apply similar architecture to apps built with Next.js, Remix or React Native.
