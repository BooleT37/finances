---
name: testing
description: Testing conventions for this codebase — layers, Playwright E2E, React Testing Library, Mantine interaction patterns
---

## Test Layers

Three tiers, each with a different cost/confidence tradeoff:

- **E2E (Playwright)** — cover core user flows through the real UI. Slow and consumes CI minutes. Combine cases aggressively: if multiple assertions can flow naturally in a single test without conflicting, put them in one test to minimize DB resets and total runtime.
- **Component (React Testing Library)** — cover small, self-contained UI components with non-trivial branching logic. Fast and isolated. Keep each case in its own `test`/`it` block for clarity and precise failure attribution.
- **Unit** — cover pure functions only. Fastest, zero setup cost. Same rule: one case per `test`/`it`.

---

## E2E Testing with Playwright

### Setup

- **Config**: `playwright.config.ts` — Chromium only, `webServer` auto-starts `npm run dev`
- **Tests**: `e2e/` directory
- **Base fixture**: `e2e/fixtures.ts` — import from here instead of `@playwright/test`

### Running Tests

```bash
# Run all tests (starts dev server automatically)
npm test

# Open interactive UI mode
npm run test:ui

# View last HTML report
npm run test:report
```

### Writing Tests

Always import from `./fixtures`, not `@playwright/test`:

```ts
import { test, expect } from './fixtures';
```

The fixture wraps `page.goto()` to automatically call `waitForLoadState('networkidle')` after every navigation. This is required because Vite's dev mode continues loading JS modules after the `load` event fires — Mantine and React event handlers are not attached until the network goes idle. Without this wait, interactions silently fail.

### Mantine Component Interactions

Mantine `SegmentedControl` (and similar components) hides radio inputs off-screen behind label overlays using CSS clip. Playwright's normal `.click()` fails because the label intercepts the hit-test. Use `dispatchEvent('click')` on the input directly:

```ts
// Works — bypasses hit-testing, fires the click event that
// Mantine's internal handler uses to detect segment changes and call onChange
await page
  .getByLabel('Language switcher')
  .locator('input[value="en"]')
  .dispatchEvent('click');
```

Add `aria-label` to Mantine components that need to be targeted by `getByLabel()`:

```tsx
<SegmentedControl aria-label="Language switcher" ... />
```

### Labelling Icon Buttons

Icon-only buttons (e.g. Mantine `ActionIcon` with just an `<Icon>` child) have no accessible name by default. Always add an `aria-label` via an i18n key so tests can locate them by role and name:

```tsx
// ✅ locatable — getByRole('button', { name: 'Редактировать' })
<ActionIcon aria-label={t('actions.edit')} onClick={handleEdit}>
  <IconEdit size={16} />
</ActionIcon>

// ❌ not locatable by name — must fall back to .first() / nth(0) or raw CSS
<ActionIcon onClick={handleEdit}>
  <IconEdit size={16} />
</ActionIcon>
```

**Rule:** if an icon button doesn't already have an `aria-label`, add one before writing the test that targets it. Don't work around a missing label with positional selectors.

### When Tests Are Hard to Write

If writing a test requires brittle workarounds — such as targeting elements by internal CSS class, raw CSS selectors, or positional hacks — pause and consider whether the production code should be improved first.

Common signals:
- Can't locate a component by label or role (e.g., `Input.Wrapper` label has no `for` association to its inner control)
- Must use opaque selectors like `form input[value="income"]` instead of `getByRole(..., { name: '...' })`
- Must reach into internal DOM structure of a UI library component

In these cases, ask the user if they'd like to improve the code instead. Suggest the fix (e.g., "add `aria-label` to this component so it's addressable by role name") before writing the workaround. This keeps both the production code and test code clean.

### Importing from Source

It's fine to import test-specific constants from `src/` (e.g. a CSS class name exported for test targeting). Use **relative** imports — the `~` path alias is not resolved in the test environment:

```ts
// ✅ relative import — works
import { transactionNameCellClass } from '../src/features/transactions/components/TransactionsTable/TransactionsTable';

// ❌ alias import — not resolved in Playwright
import { transactionNameCellClass } from '~/features/transactions/components/TransactionsTable/TransactionsTable';
```

### Playwright MCP Server

`.mcp.json` at the project root configures the `@playwright/mcp` server for Claude Code. This allows interactive browser inspection — Claude can navigate pages, take screenshots, and verify UI state in a real browser during development.

---

## Component Tests (React Testing Library)

### Mocking Server Functions

When a component fetches data via a TanStack Query query, mock the **server function** that the query calls — not the query options object. Server functions are created with `createServerFn` and live in each feature's `api.ts`.

```ts
import { fetchAllCategories } from '../src/features/categories/api';

vi.mock('../src/features/categories/api', () => ({
  fetchAllCategories: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(fetchAllCategories).mockResolvedValue([
    { id: 1, name: 'Продукты', isIncome: false /* ... */ },
  ]);
});
```

This lets the TanStack Query layer (`queryOptions`, `select` transforms, caching) work normally — only the network boundary is replaced. Never mock `queryOptions` functions directly, as that skips the data-transform logic the component depends on.

Always use a **factory function** in `vi.mock` (not auto-mock) for server functions created with `createServerFn`, as auto-mock may not handle their shape correctly:

```ts
// ✅ explicit factory — reliable
vi.mock('~/features/categories/api', () => ({
  fetchAllCategories: vi.fn(),
}));

// ❌ auto-mock — may silently fail to intercept createServerFn calls
vi.mock('~/features/categories/api');
```

### Read feature docs before writing mocks

Before implementing mocks for a feature's entities, read `src/features/{feature}/{FEATURE}.md`. Feature docs describe domain concepts, distinctions between similarly-named entities, and business rules that are not obvious from type names alone. Getting the mock data wrong (e.g. confusing `Category` with `SavingSpendingCategory`) produces tests that pass but don't reflect production behaviour.

### Language and entity names in tests

The app is configured with Russian as the default locale. Always:

- **Assert against Russian translations**, not English. Check `src/features/{feature}/locales/ru/{feature}.json` for the exact strings.
- **Use Russian names for mocked entities** (categories, sources, etc.) — e.g. `'Продукты'` not `'Food'`. This is closer to production, and catches bugs where a component accidentally renders a key instead of a translated value. Translate "FROM_SAVINGS" category as "Из сбережений"
