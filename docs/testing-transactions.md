# Transactions & Saving Spendings — Proposed Test Structure

## Philosophy

Three tiers, each with a different cost/confidence tradeoff:

- **E2E (Playwright)** — cover core user flows through the real UI. Slow but high confidence. Keep to happy paths + the most important edge cases.
- **Component (React Testing Library)** — cover small, self-contained UI components with non-trivial branching logic. Fast and isolated.
- **Unit** — cover pure functions only. Fastest, zero setup cost.

Do not aim for 100% coverage. Prioritise cases where a silent regression would be painful.

**E2E grouping principle:** combine cases that flow naturally together to reduce DB resets and total runtime. One test = one DB reset, so combine aggressively when the assertions don't conflict.

---

## Transactions

### E2E (`test/e2e/transactions.spec.ts`) ✅

#### Create transaction

| # | Combined cases | Key assertions |
|---|----------------|----------------|
| 1 | Minimal expense (category + cost + source); expense with subcategory; expense with `actualDate` in a different month | Negative cost + source name in row; subcategory group row visible when grouped; transaction stays in current month when `actualDate` is in the past |
| 2 | Income transaction | Positive cost; no minus sign |
| 3 | Expense with `date` in previous month | Not visible in current month; appears in previous month after navigation (also covers month navigation) |

#### Edit and delete transaction

| # | Combined cases | Key assertions |
|---|----------------|----------------|
| 4 | Click row → pre-filled sidebar; change cost → auto-save fires; delete via row action | All fields match; new cost appears without manual save; row removed after delete |
| 5a | Change category (expense→income); auto-save fires | Cost sign flips in table row |
| 5b | Close sidebar while form has a validation error (auto-save skipped) | Confirm dialog appears; dismiss keeps changes; confirm discards |

### Component tests (RTL)

#### `getCostWithDiffParams` ✅ [`getCostWithDiffParams.test.ts`](../src/components/getCostWithDiffParams.test.ts)

Business logic was extracted from `CostAggregatedCellRenderer` into a pure function `getCostWithDiffParams` (colocated with `CostWithDiffCellView` in `src/components/`) and tested directly — no `renderHook` or mocking needed. `getToday()` returns a fixed date in test mode (April 15, 2024), so `passedDaysRatio` is naturally controlled by the `month`/`year` inputs.

| # | Case |
|---|------|
| 1 | ~~`isRangePicker = true` → `passedDaysRatio` is `null`; no forecast data returned~~ _(concept removed; year mode handled upstream)_ |
| 2 | ✅ Current month → `passedDaysRatio` is `today.date / daysInMonth` (fractional) |
| 3 | ✅ Past or future month → `passedDaysRatio` is `1` |
| 4 | ✅ Value ≤ forecast, `isContinuous = false` → green/red bar at `spentRatio`; no exceeding-forecast variant |
| 5 | ✅ Value ≤ forecast, `isContinuous = true`, `spentRatio ≤ passedDaysRatio` → same as case 4 |
| 6 | ✅ Value ≤ forecast, `isContinuous = true`, `spentRatio > passedDaysRatio` → orange color + exceeded-by hint |
| 7 | ✅ Value exceeds forecast → bar uses `barOffset + barLength` layout |
| 8 | ✅ No forecast (forecast = 0) → `divideWithFallbackToOne` prevents division by zero |

---

## Components

### E2E ✅ [`transactions.spec.ts`](../test/e2e/transactions.spec.ts)

| # | Combined cases | Key assertions |
|---|----------------|----------------|
| 6 | ✅ Add two components in different categories; component costs sum less than parent | Hint appears below cost field; parent row + two component rows in table; remainder displayed in hint |
| 7 | ✅ Open a transaction that already has components; verify hint; click "edit components" → modal opens with components pre-filled; delete one component → its row disappears from the table and the hint updates | Components hint visible on pre-existing transaction; modal fields match seeded data; deleted component row gone; hint reflects new remainder |
| 8 | ✅ Click the row-action "edit" on a component row (not the parent); components modal opens immediately with that component scrolled into view; edit the component's cost and submit → parent row cost and hint remainder both update in the table | Modal opens directly from component row action; component highlighted; updated cost propagates to parent row and hint |

### Component tests (RTL)

#### `ComponentsHint` (`TransactionSidebarForm/fields/CostField/ComponentsHint.tsx`) ✅ [`ComponentsHint.test.tsx`](../src/features/transactions/components/TransactionSidebar/TransactionSidebarForm/fields/CostField/ComponentsHint.test.tsx)

> Requires mocking `fetchAllCategories` (the server function) to provide category data — see the Component Tests mocking convention in `docs/testing.md`. The sign of the parent `cost` prop is irrelevant — the component uses `cost.abs()` for the remainder, so an income parent and an expense parent with the same magnitude produce the same output. The sign of each component's cost is determined by its category's `isIncome` flag (expense → negative, income → positive).

| # | Case |
|---|------|
| 1 | `components = []` → renders nothing |
| 2 | One expense component → single "of which €X in Category" line |
| 3 | Several expense components → bulleted list per component + remainder line |
| 4 | Component with subcategory → label reads "Category - Subcategory" |
| 5 | Component belonging to an income category → cost shown as positive in the hint (no UI for this yet, but the logic should handle it) |
| 6 | Parent `cost` is positive (income transaction) with expense components → remainder still computed correctly via `cost.abs()` |

### Unit tests

#### `costWithoutComponents` (`costWithoutComponents.ts`) ✅ [`costWithoutComponents.test.ts`](../src/features/transactions/utils/costWithoutComponents.test.ts)

| # | Case |
|---|------|
| 1 | No components → returns cost unchanged |
| 2 | One component → returns `cost - component.cost` |
| 3 | Multiple components → returns `cost - sum(components)` |
| 4 | Components sum equals cost → returns `0` |
| 5 | Components sum exceeds cost → returns negative value (we allow this per the domain rules) |

---

## Subscriptions

### E2E ✅ [`transactions.spec.ts`](../test/e2e/transactions.spec.ts)

| # | Combined cases | Key assertions |
|---|----------------|----------------|
| 9 | ✅ Create transaction: select an available subscription from the dropdown | Name and cost fields auto-fill from the subscription |
| 10 | ✅ Edit an existing subscription transaction: select a different subscription | Sidebar fields update; cost updates in the table row without a manual save |
| 11 | ✅ Toggle "show upcoming subscriptions": verify correct rows appear and correct rows are absent; confirm upcoming rows have no edit/delete actions; confirm they are excluded from the expense grand total; confirm each row shows a subscription badge | Upcoming rows visible; rows not due this month absent; action buttons absent on upcoming rows; grand total unchanged; badge visible |

### Component tests (RTL)

#### `useAvailableSubscriptions` (`subscriptions/facets/availableSubscriptions.ts`) ⬜

> Requires mocking `fetchAllSubscriptions` and `fetchTransactionsByYear` server functions and providing Jotai atom values via a test wrapper. Use `renderHook`.

| # | Case |
|---|------|
| 1 | Active subscription due this month → included in result with correct `firstDate` |
| 2 | Inactive subscription → not returned |
| 3 | Active subscription whose period does not land in the current month → not returned |
| 4 | Active subscription due this month but already paid (transaction with matching `subscriptionId` in range) → not returned |
| 5 | `viewMode = 'year'`, monthly subscription with no payments → returns only the first due date in the year, not all 12 |
| 6 | `viewMode = 'year'`, subscription paid in January → returns the next due date (February) as `firstDate`; subsequent unpaid months are not returned (only first) ⚠ requires code change: current implementation excludes the subscription entirely once any payment exists in the year range |

---

## Source last transactions tooltip

### Component tests (RTL)

#### `SourceLastTransactions` (`TransactionSidebarForm/fields/SourceField/SourceLastTransactions.tsx`) ✅ [`SourceLastTransactions.test.tsx`](../src/features/transactions/components/TransactionSidebar/TransactionSidebarForm/fields/SourceField/SourceLastTransactions.test.tsx)

> Requires mocking `fetchTransactionsByYear` and `fetchAllCategories` server functions. Provide `selectedYearAtom` via a Jotai atom wrapper.

| # | Case |
|---|------|
| 1 | No transactions for the given `sourceId` → renders nothing |
| 2 | Has transactions → displays the most recent date; prefers `actualDate` over `date` when both are set |
| 3 | Transaction has a name → label reads "Category — name"; without a name it reads "Category" only |
| 4 | Tooltip lists each transaction with its category name and formatted cost |

---

## Saving Spendings

All cases assume saving spending events are pre-seeded in the DB. No saving spendings page UI is driven here.

Seed requirements:
- **Event A** — active, single category
- **Event B** — active, multiple categories (e.g. "Flight", "Accommodation")
- **Event C** — completed

### E2E ✅ (`test/e2e/transactions.spec.ts`)

#### Creating a from-savings transaction

| # | Combined cases | Key assertions |
|---|----------------|----------------|
| 13 | ✅ Pre-seed one "from-savings" transaction. Create a new one. Select "From savings" type; select Event A (single category); select Event B (multiple categories); confirm Event C absent; save | Event select appears; category hidden for single-category event; category visible for multi-category event; completed event absent from list; row appears in table with cost not counted toward expense totals; Pressing "Group by subcategories" also shows the event group row: both for pre-seeded transaction, and for the one we just created (should be different events) |

#### Editing an existing from-savings transaction

| # | Combined cases | Key assertions |
|---|----------------|----------------|
| 14 | ✅ Open from-savings transaction linked to a completed event; change to a different active event | Completed event shown initially (initial value preserved); category select updates when event changes; auto-save moves row to new event's subcategory |
| 15 | ✅ Change transaction type away from "From savings" (e.g. to expense) and save | Transaction cost now appears in the expense grand total |

---

## What to skip (for now)

- `TransactionsTable` — too integrated; covered by E2E
- `TransactionSidebarForm` — same reason; the auto-save debounce and full form flow are better tested end-to-end
- `useTransactionTableItems` — a complex hook tightly coupled to query data; E2E gives better coverage at lower maintenance cost
- Import deduplication (`peHash`) — no UI surface yet

---

## Cross-feature note

When a transaction field references an entity managed on another page (saving spending events, subscriptions, sources), seed the DB directly rather than driving the other page's creation UI in the same test. The transaction test only needs to assert that the form fetches, renders, and handles the entity correctly — how it got into the DB is irrelevant.
