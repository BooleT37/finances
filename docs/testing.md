# Testing

## Test Layers

Three tiers, each with a different cost/confidence tradeoff:

- **E2E (Playwright)** — cover core user flows through the real UI. Slow and consumes CI minutes. Combine cases aggressively: if multiple assertions can flow naturally in a single test without conflicting, put them in one test to minimize DB resets and total runtime.
- **Component (React Testing Library)** — cover small, self-contained UI components with non-trivial branching logic. Fast and isolated. Keep each case in its own `test`/`it` block for clarity and precise failure attribution.
- **Unit** — cover pure functions only. Fastest, zero setup cost. Same rule: one case per `test`/`it`.

---

## E2E Testing with Playwright

## Setup

- **Config**: `playwright.config.ts` — Chromium only, `webServer` auto-starts `npm run dev`
- **Tests**: `e2e/` directory
- **Base fixture**: `e2e/fixtures.ts` — import from here instead of `@playwright/test`

## Running Tests

```bash
# Run all tests (starts dev server automatically)
npm test

# Open interactive UI mode
npm run test:ui

# View last HTML report
npm run test:report
```

## Writing Tests

Always import from `./fixtures`, not `@playwright/test`:

```ts
import { test, expect } from './fixtures';
```

The fixture wraps `page.goto()` to automatically call `waitForLoadState('networkidle')` after every navigation. This is required because Vite's dev mode continues loading JS modules after the `load` event fires — Mantine and React event handlers are not attached until the network goes idle. Without this wait, interactions silently fail.

## Mantine Component Interactions

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

## When Tests Are Hard to Write

If writing a test requires brittle workarounds — such as targeting elements by internal CSS class, raw CSS selectors, or positional hacks — pause and consider whether the production code should be improved first.

Common signals:
- Can't locate a component by label or role (e.g., `Input.Wrapper` label has no `for` association to its inner control)
- Must use opaque selectors like `form input[value="income"]` instead of `getByRole(..., { name: '...' })`
- Must reach into internal DOM structure of a UI library component

In these cases, ask the user if they'd like to improve the code instead. Suggest the fix (e.g., "add `aria-label` to this component so it's addressable by role name") before writing the workaround. This keeps both the production code and test code clean.

## Importing from Source

It's fine to import test-specific constants from `src/` (e.g. a CSS class name exported for test targeting). Use **relative** imports — the `~` path alias is not resolved in the test environment:

```ts
// ✅ relative import — works
import { transactionNameCellClass } from '../src/features/transactions/components/TransactionsTable/TransactionsTable';

// ❌ alias import — not resolved in Playwright
import { transactionNameCellClass } from '~/features/transactions/components/TransactionsTable/TransactionsTable';
```

Avoid importing utility functions (like formatters) from the production codebase into tests — either hardcode the expected value directly, or write a minimal local helper if the logic is non-trivial.

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
    { id: 1, name: 'Продукты', isIncome: false, /* ... */ },
  ]);
});
```

This lets the TanStack Query layer (`queryOptions`, `select` transforms, caching) work normally — only the network boundary is replaced. Never mock `queryOptions` functions directly, as that skips the data-transform logic the component depends on.

## Playwright MCP Server

`.mcp.json` at the project root configures the `@playwright/mcp` server for Claude Code. This allows interactive browser inspection — Claude can navigate pages, take screenshots, and verify UI state in a real browser during development.
