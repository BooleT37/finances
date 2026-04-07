# Finances - Project Documentation

A personal finance management application built with modern web technologies.

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/router/latest/docs/framework/react/start/overview) - Full-stack React framework with SSR
- **Router**: [TanStack Router](https://tanstack.com/router) - Type-safe routing
- **UI Library**: [Mantine](https://mantine.dev/) - React components library
- **API Layer**: [tRPC](https://trpc.io/) - End-to-end typesafe APIs
- **Database**: [Prisma](https://www.prisma.io/) - Next-generation ORM
- **Build Tool**: [Vite](https://vitejs.dev/) - Fast build tool with HMR

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

### Feature Documentation

Each feature has a dedicated documentation file at `src/features/{feature}/{FEATURE}.md` describing its domain concepts, business rules, and known limitations. Read the relevant feature doc(s) before implementing significant new UI or writing tests for that feature:

- [Transactions](src/features/transactions/TRANSACTIONS.md)
- [Budgeting](src/features/budgeting/BUDGETING.md)
- [Categories](src/features/categories/CATEGORIES.md)
- [Sources](src/features/sources/SOURCES.md)
- [Subscriptions](src/features/subscriptions/SUBSCRIPTIONS.md)
- [Saving Spendings](src/features/savingSpendings/SAVING_SPENDINGS.md)

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

**Always run these checks after every code change before considering a task done:**

```bash
npm run typecheck && npm run lint && npm run format:check
```

To auto-fix lint and formatting issues:

```bash
npm run lint:fix && npm run format
```

Pre-commit hooks (Husky + lint-staged) run automatically on `git commit` — ESLint check + Prettier check on staged `src/**/*.{ts,tsx}` files, then a full `tsc --noEmit`. The commit is blocked if any check fails.

## Commits

Use **atomic commits** (one logical change per commit) and **[conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)** format:

```
<type>[optional scope]: <description>
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`, `build`, `ci`

Examples:
- `feat(transactions): add cost sign flip on category change`
- `fix(forecasts): correct sum negation for income categories`
- `test(e2e): add unsaved-changes confirm dialog test`
- `chore: update dependencies`

**Stop before each commit** to let the user verify the changes in the working directory

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

## Authentication

**Not yet implemented.** The `Expense` (and other) Prisma models have a required `userId` field, but no auth system is in place yet. Current workarounds:

- Read queries (e.g. `fetchTransactionsByYear`) do not filter by `userId` — they return all records.
- Write mutations (e.g. `createTransaction`) use `prisma.user.findFirstOrThrow()` as a placeholder and mark the call with `// TODO: replace with actual user from auth`.

When auth is added, all server functions will need to resolve the current user from the session and apply `where: { userId }` filters.

## Notes

- Run `npm run dev` to auto-generate routeTree.gen.ts when routes change
- **Dates**: Use [dayjs](https://day.js.org/) for all date handling — never native `Date`. The `datetimeCodec` in `src/shared/codecs.ts` decodes ISO strings to `dayjs.Dayjs` objects. Prisma `where` clauses are the only exception (Prisma requires native `Date`).
- **Variable naming**: Never use `t` as a shorthand for a transaction — `t` is reserved for the i18n translation function from `useTranslation`. Use `tx` or the full name `transaction` instead.
- **Entity map lookups**: Always use `getOrThrow(map, key, 'Label')` from `~/shared/utils/getOrThrow` when reading from an entity map (e.g. `categoryMap`, `sourceMap`). Never use optional chaining (`map?.[key]`) — a missing key is a data integrity error and should throw, not silently return `undefined`.
- **Spell-checker warnings**: When the IDE reports spell-checker warnings for technical strings (CSS class names, XPath selectors, library prefixes, etc.), add the flagged words to `.vscode/spellright.dict` to suppress future noise. Do this in the same commit as the code that introduced them.
- **Interactive elements**: Never use `<Anchor>` (or bare `<a>`) for click actions without a real `href`. An `<a>` without `href` is not a link in the ARIA sense — screen readers and Playwright's `getByRole('link')` won't find it. Use `<Anchor component="button">` to keep the visual link style while rendering a proper `<button>` element.
- **Cost sign convention**: All `cost`/`sum` fields are sent from the API as **negative for expense categories** (`isIncome === false`) and **positive for income categories**. Negation happens in each feature's `api.ts` handler using `adaptCost` from `~/shared/utils/adaptCost`. The category must be included in the Prisma query (via `include: { category: true }`) to access `isIncome`, but only `categoryId` is exposed to the client (the `category` object is stripped by `schema.encode()`).
  - **Transactions and forecasts** can carry both positive and negative costs. Display rule: expense costs always shown with `"-"`, income costs without. The user may input either sign in a form field, but it is corrected the latest before DB write based on `category.isIncome`. Never call `.abs()` when populating form fields from API data — keep the sign as received.
- **Month convention**: Always use **0-based months (0-11)** everywhere — in Jotai atoms (`selectedMonthAtom`), API calls, DB fields, and all business logic. This matches dayjs's `.month()` return value and the database storage. The only place to convert to 1-based is in ISO date strings or `'YYYY-MM'` keys (e.g. `TODAY_MONTH + 1` in `today.ts` when building a dayjs string). Use `selectedMonthKeyAtom` (string `'YYYY-MM'`) only for display/storage; use `selectedMonthAtom` (0-based number) for all logic.
- **Never silence the rule "react-hooks/exhaustive-deps", instead try to follow it. If unsure, ask the user