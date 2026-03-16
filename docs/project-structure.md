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
├── {FEATURE}.md    # Product description of the feature, its intent and reasonings
├── api.ts          # createServerFn handlers (TanStack Start — see note below)
├── schema.ts       # Feature types and Zod schemas with codec properties for wire↔client types
├── components/     # Feature-specific React components
├── facets/         # Derived query options — one file per logical getter (see pattern below)
├── i18n.ts         # Exports i18nResources = { en: { ns: data }, ru: { ns: data } }
├── locales/        # Translations colocated with the feature
│   ├── en/{feature}.json
│   └── ru/{feature}.json
├── queries.ts      # React Query keys + base query options (see pattern below)
├── stores/         # Feature-specific Jotai atoms
├── types/          # TypeScript types
└── utils/          # Utility functions
```

---

credit: https://github.com/alan2207/bulletproof-react/

For easy scalability and maintenance, organize most of the code within the features folder. Only put things into the shared folder if they don't relate to any feature, or relate to several features at once in equal measure

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

For API design patterns (server functions, React Query, facets, Zod schemas), see [`.claude/skills/api-conventions/SKILL.md`](../.claude/skills/api-conventions/SKILL.md).

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

Do not use barrel files in the project unless a framework requires it
