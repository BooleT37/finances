# Finances - Project Documentation

A personal finance management application built with modern web technologies.

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/router/latest/docs/framework/react/start/overview) - Full-stack React framework with SSR
- **Router**: [TanStack Router](https://tanstack.com/router) - Type-safe routing
- **UI Library**: [Mantine](https://mantine.dev/) - React components library
- **API Layer**: [tRPC](https://trpc.io/) - End-to-end typesafe APIs
- **Database**: [Prisma](https://www.prisma.io/) - Next-generation ORM
- **Build Tool**: [Vite](https://vitejs.dev/) - Fast build tool with HMR

## Project Structure

See **[docs/project-structure.md](docs/project-structure.md)** for the full layout, feature folder conventions, i18n pattern, and import rules.

## Configuration

- **Path Aliases**: `~/*` maps to `./src/*` (configured in tsconfig.json + vite-tsconfig-paths)
- **Scroll Restoration**: Enabled globally
- **Preloading**: Disabled by default (opt-in per route with `preload="intent"`)
- **404 Handling**: Global `defaultNotFoundComponent` in router config

## Documentation

Detailed framework-specific documentation is split into separate files:

### TanStack Router Documentation

- **[API Reference](docs/tanstack-router-api.md)** - Complete API reference for TanStack Router types, hooks, and components
- **[Guide](docs/tanstack-router-guide.md)** - Comprehensive guide covering all Router features
- **[Routing](docs/tanstack-router-routing.md)** - File-based routing, dynamic routes, and route configuration
- **[Installation](docs/tanstack-router-installation.md)** - Installation and setup instructions
- **[Setup & Architecture](docs/tanstack-router-setup.md)** - Project setup and architectural patterns

### Project Structure

- **[Project Structure](docs/project-structure.md)** - Bulletproof-react conventions, feature folder layout, import rules

### Testing

- **[Testing](docs/testing.md)** - Playwright E2E setup, writing tests, Mantine interaction patterns, MCP server

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run type checking
npm run typecheck
```

## Code Quality

After making any code changes, run the following checks:

```bash
npm run typecheck && npm run lint && npm run format:check
```

To auto-fix lint and formatting issues:

```bash
npm run lint:fix && npm run format
```

Pre-commit hooks (Husky + lint-staged) run automatically on `git commit` — ESLint check + Prettier check on staged `src/**/*.{ts,tsx}` files, then a full `tsc --noEmit`. The commit is blocked if any check fails.

## Testing

Run E2E tests (starts dev server automatically):

```bash
npm test
```

Open interactive test UI:

```bash
npm run test:ui
```

After making UI changes, run `npm test` to verify nothing broke. The Playwright MCP server is configured in `.mcp.json` — Claude can also use it to interactively inspect the app in a real browser.

## Translations (i18n)

Uses **react-i18next** with feature-colocated translations. Each feature owns its namespace:

1. Create `src/features/{feature}/locales/en/{feature}.json` and `ru/{feature}.json`
2. Export from `src/features/{feature}/i18n.ts`:
   ```ts
   import en from './locales/en/{feature}.json';
   import ru from './locales/ru/{feature}.json';
   export const i18nResources = { en: { {feature}: en }, ru: { {feature}: ru } } as const;
   ```
3. Register in `src/lib/i18n/index.ts` — spread into the `resources` object
4. Add the locales path to `.vscode/settings.json` → `i18n-ally.localesPaths`
5. Use in components: `const { t } = useTranslation('{feature}');`

Types are inferred automatically via `as const` — no manual type maintenance needed. See [docs/project-structure.md](docs/project-structure.md) for the full pattern.

## Notes

- Router uses `getRouter()` async function export (TanStack Start v1.x requirement)
- All route files must export using `createFileRoute()` or `createRootRoute()`
- Run `npm run dev` to auto-generate routeTree.gen.ts when routes change
- **Dates**: Use [dayjs](https://day.js.org/) for all date handling — never native `Date`. The `datetimeCodec` in `src/shared/codecs.ts` decodes ISO strings to `dayjs.Dayjs` objects. Prisma `where` clauses are the only exception (Prisma requires native `Date`).
- **Variable naming**: Never use `t` as a shorthand for a transaction — `t` is reserved for the i18n translation function from `useTranslation`. Use `tx` or the full name `transaction` instead.
- **Entity map lookups**: Always use `getOrThrow(map, key, 'Label')` from `~/shared/utils/getOrThrow` when reading from an entity map (e.g. `categoryMap`, `sourceMap`). Never use optional chaining (`map?.[key]`) — a missing key is a data integrity error and should throw, not silently return `undefined`.
- **Cost sign convention**: All `cost`/`sum` fields are sent from the API as **negative for expense categories** (`isIncome === false`) and **positive for income categories**. Negation happens in each feature's `api.ts` handler using `adaptCost` from `~/shared/utils/adaptCost`. The category must be included in the Prisma query (via `include: { category: true }`) to access `isIncome`, but only `categoryId` is exposed to the client (the `category` object is stripped by `schema.encode()`).
