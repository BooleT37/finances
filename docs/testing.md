# E2E Testing with Playwright

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

## Playwright MCP Server

`.mcp.json` at the project root configures the `@playwright/mcp` server for Claude Code. This allows interactive browser inspection — Claude can navigate pages, take screenshots, and verify UI state in a real browser during development.
