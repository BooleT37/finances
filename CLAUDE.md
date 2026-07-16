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
- [Project Users](src/features/projectUsers/PROJECT_USERS.md)

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

**When to commit:**
- Do not commit automatically if it's unclear whether the work is finished. If the conversation is shifting to a new topic but there are uncommitted changes, ask the user whether they want those changes committed first.
- In general, prefer asking "should I commit this?" rather than committing without prompting.
- Exception: skills that explicitly instruct committing as part of their workflow (e.g. `implement-ai-issues`, `fix-pr-comments`) should commit without asking — the skill description is the authorisation.

**Keeping history clean (unpushed commits):**
- If a commit exists locally but has not been pushed yet, and we decide to change the implementation, **squash the new changes into that commit** rather than adding a follow-up commit. Keep the history clean.
- Keep commits scoped — do not bundle unrelated changes into one commit.

**Pushing:**
- **Never push** unless the user explicitly asks, or it is part of a skill's workflow.
- Once commits have been pushed, **do not rewrite history** (no rebase, no amend, no force-push) unless the user explicitly asks for it.

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

## Analytics (PostHog)

All `createServerFn` POST mutations are auto-captured via the global `posthogTrackingMiddleware` registered in [src/start.ts](src/start.ts). Events are named `serverfn_<functionName>` (e.g. `serverfn_createTransaction`) and logged with `{ input, timestamp, success: true, environment }`. The `environment` field is `VERCEL_ENV` on Vercel (`production` / `preview` / `development`) or `NODE_ENV` locally — filter by it in PostHog to separate prod traffic from preview/dev noise.

Required env vars (set on Vercel for production, in `.env` for local):
- `POSTHOG_API_KEY` — Project API key
- `POSTHOG_HOST` — defaults to `https://eu.i.posthog.com`

Currently `distinctId` is hardcoded (matches the value used in `finances-t3` so events keep flowing under the same user). Replace it with the real session user id once auth is implemented.

## Authentication & Projects

Auth is implemented via [Better Auth](https://better-auth.com) (`src/server/auth.ts`), self-hosted with a Prisma adapter — email/password (invite-only, no public sign-up) and Google OAuth (auto-links to an existing account by email match).

- **`Project` is the ownership boundary, not `User`.** A `User` belongs to exactly one `Project` for life (`User.projectId`, no join table, no project switching). Every domain model (`Category`, `Source`, `SavingSpending`, `Subscription`, `Expense`, `Forecast`) has `projectId`, not `userId`. `ProjectSetting` (renamed from `UserSetting`) is 1:1 with `Project`.
- **Every protected `createServerFn` must attach `.middleware([authMiddleware])`** (`src/middlewares/authMiddleware.ts`) explicitly — a route's `beforeLoad` guard only protects the UI, never the underlying RPC (server functions are directly callable regardless of which route renders them). The middleware resolves the session and injects `{ userId, projectId, role }` into `context`; handlers filter/stamp all Prisma calls with `context.projectId`.
- **Single-row `update`/`delete` calls** (`prisma.<model>.update/delete({ where: { id } })`) can't fold `projectId` into that `where` clause (Prisma only accepts unique fields there). Use `assertOwnedByProject` (`~/shared/utils/assertOwnedByProject`) as a guard before the call — it throws if the row's `projectId` doesn't match the caller's.
- **Cross-project relations are composite foreign keys.** Every relation from one project-scoped model to another references `(id, projectId)`, never `id` alone — e.g. `Expense.category` is `@relation(fields: [categoryId, projectId], references: [id, projectId])` — backed by `@@unique([id, projectId])` on the referenced model. The database rejects a reference to another project's row outright, so handlers don't need to verify each relation by hand. The trade-off: such an FK **cannot use `onDelete: SetNull`** (`projectId` is required, and SetNull nulls *every* column of the FK), so they are `Restrict`. Therefore, **before deleting a row that other rows reference, null the referencing column explicitly in the same transaction** — see `deleteSource`, `deleteSubscription`, `clearSubcategoryReferences`. When the domain wants the deletion blocked rather than the reference cleared, guard it in the handler with a clear error instead — see `deleteSavingSpending`. Never rely on the UI alone for that rule: server functions are directly callable.
- **`role` (`user`/`admin`) only gates the project-users page** (`/settings/users`, admin-only via `adminMiddleware`) — every other feature is equally accessible to any project member regardless of role. See [Project Users](src/features/projectUsers/PROJECT_USERS.md).
- **Bootstrapping a new environment** (fresh `Project` + first admin `User` + `ProjectSetting`) is done via `scripts/bootstrap-project.ts`, never through the UI (sign-up is closed). Migrating an existing pre-auth database (real data, no `Project` yet) uses `scripts/migrate-legacy-db.ts` instead — see that file's header comment. `scripts/reset-password.ts` resets any user's password directly on any environment, for when no admin can sign in to use the in-app reset UI. All three prompt interactively for credentials/connection strings rather than taking them as arguments or hardcoding them — never hardcode a real secret or connection string in these files even though they're tracked in git.

## Notes

- Run `npm run dev` to auto-generate routeTree.gen.ts when routes change
- **Dates**: Use [dayjs](https://day.js.org/) for all date handling — never native `Date`. The `datetimeCodec` in `src/shared/codecs.ts` decodes ISO strings to `dayjs.Dayjs` objects. Two exceptions where native `Date` is acceptable: Prisma `where` clauses (Prisma requires it), and Mantine form field values (Mantine's `DatePickerInput` works with native `Date`, so form state for date fields may use `Date | null`).
- **Variable naming**: Never use `t` as a shorthand for a transaction — `t` is reserved for the i18n translation function from `useTranslation`. Use `tx` or the full name `transaction` instead.
- **Entity map lookups**: Always use `getOrThrow(map, key, 'Label')` from `~/shared/utils/getOrThrow` when reading from an entity map (e.g. `categoryMap`, `sourceMap`). Never use optional chaining (`map?.[key]`) — a missing key is a data integrity error and should throw, not silently return `undefined`.
- **Spell-checker warnings**: When the IDE reports spell-checker warnings for technical strings (CSS class names, XPath selectors, library prefixes, etc.), add the flagged words to `.vscode/spellright.dict` to suppress future noise. Do this in the same commit as the code that introduced them.
- **Interactive elements**: Never use `<Anchor>` (or bare `<a>`) for click actions without a real `href`. An `<a>` without `href` is not a link in the ARIA sense — screen readers and Playwright's `getByRole('link')` won't find it. Use `<Anchor component="button">` to keep the visual link style while rendering a proper `<button>` element.
- **Cost sign convention**: All `cost`/`sum` fields are sent from the API as **negative for expense categories** (`isIncome === false`) and **positive for income categories**. Negation happens in each feature's `api.ts` handler using `adaptCost` from `~/shared/utils/adaptCost`. The category must be included in the Prisma query (via `include: { category: true }`) to access `isIncome`, but only `categoryId` is exposed to the client (the `category` object is stripped by `schema.encode()`).
  - **Transactions and forecasts** can carry both positive and negative costs. Display rule: expense costs always shown with `"-"`, income costs without. The user may input either sign in a form field, but it is corrected the latest before DB write based on `category.isIncome`. Never call `.abs()` when populating form fields from API data — keep the sign as received.
- **Month convention**: Always use **0-based months (0-11)** everywhere — in Jotai atoms (`selectedMonthAtom`), API calls, DB fields, and all business logic. This matches dayjs's `.month()` return value and the database storage. The only place to convert to 1-based is in ISO date strings or `'YYYY-MM'` keys (e.g. `TODAY_MONTH + 1` in `today.ts` when building a dayjs string). Use `selectedMonthKeyAtom` (string `'YYYY-MM'`) only for display/storage; use `selectedMonthAtom` (0-based number) for all logic.
- **Never silence the rule "react-hooks/exhaustive-deps", instead try to follow it. If unsure, ask the user
- **Comments**: Avoid code comments. The code should explain itself — always prefer good function/variable names and well-chosen abstractions over a comment. Only add a comment when genuinely necessary to explain extra-complex business logic that names alone cannot convey (e.g. a non-obvious domain rule and *why* it exists).
- **No barrel files**: Never create `index.ts` (or `index.tsx`) files that only re-export from sibling modules. Import each symbol directly from the file that defines it (e.g. `./ThisMonthCell/ThisMonthCell`, not `./ThisMonthCell`).
- **Transaction/subscription hover lists**: When rendering a hover popup with a list of transactions or subscriptions (name + cost + date), use the shared `CostList` component (`~/shared/components/CostList`) inside a Mantine `HoverCard` — never a dark `Tooltip`, and don't hand-roll the rows. `CostList` is only the dropdown content (wrap it in `HoverCard` yourself); it takes `items` (`{ key, name, cost, date, secondary? }`), an optional `title`, and an optional `limit` (shows a "show more" link beyond that count; omit to show all). Use `secondary: true` to dim a row (e.g. an already-paid subscription) and fold any suffix like "(оплачено)" into `name`.
- **Mutations**: In React components, prefer `mutate` with an `onSuccess` callback over `mutateAsync` + `await`. Outside of React components (e.g. in Jotai atom write functions or stores), always use `mutateAsync` — TanStack Query's per-call lifecycle callbacks (`onSuccess`, `onError`, `onSettled`) are tied to the observer/component lifecycle and silently do nothing outside of it.
- **Database transactions in server functions**: When a `createServerFn` handler performs multiple related database operations (e.g. a read that a later write depends on, or several writes that must all succeed or none should), wrap them in `prisma.$transaction(async (tx) => { ... })` and use `tx` for every call inside it. This keeps the operations atomic and prevents another concurrent request from seeing or acting on an inconsistent intermediate state.
- **Cross-feature imports**: Never import a type or value directly from another feature's internal files (e.g. `~/features/subscriptions/components/SubscriptionSidebar/subscriptionFormValues`). If the type is small, duplicate it locally. If it genuinely needs sharing, move it to `~/shared`. Utilities from `~/features/categories` (category IDs, tree data) and similar foundational features are an exception — they act as shared infrastructure and can be imported freely.