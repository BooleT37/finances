# Budgeting (Forecasts) — Master Plan

> **Naming**: The feature is called "Budgeting" in English code and docs. The UI label in Russian is "Планирование". The main entity remains "Forecast". The route is `/budgeting`.

This document is the source of truth for the budgeting feature implementation. It is split into five independently deliverable sub-features. Each sub-feature is implemented as a full vertical slice (API → data layer → UI → tests) before moving to the next.

---

## Mental Model

The budgeting page shows a **forecast table** for the selected month. Each row represents either a type-group header (Expenses / Income), a category, or a subcategory. A sticky totals row at the bottom shows the estimated monthly surplus.

Forecasts are stored sparsely: only "touched" rows live in the database. All rows are always shown; unfilled ones display `0`. When a cell is edited, we upsert (create or update) the corresponding `Forecast` record.

### Category grouping

- There are two top-level groups: **Расходы** (expenses) and **Доходы** (income). There is no separate "Savings" group.
- **`FROM_SAVINGS` categories** are not shown on the budgeting screen at all.

### "Rest" subcategory

A virtual row that appears whenever at least one real subcategory has a non-zero forecast. It shows the portion of the parent category forecast not yet allocated to named subcategories: `parentForecast.sum − Σ(real subcategory sums)`. The Rest cell is **editable in the UI** — editing it saves the parent category forecast as `Σ(real subcategory sums) + enteredRestValue`. The Rest row has no database record and no comment field.

### Parent category locking

The **parent category cell is locked** (read-only, with a tooltip) whenever any of its real subcategories has a non-zero forecast. The only ways to change the parent in that state are through the subcategory rows or the Rest row.

### Column order

**Name · Average · Last Month · Plan · This Month · Comment**

---

## Sub-feature 1 — Budgeting Page Foundation

### What it does

Sets up the budgeting route and the core read-only table. No editing yet.

### Routing & month switcher

- The `/budgeting` route renders the `BudgetingPage` component.
- The page reads the shared `selectedMonthAtom` / `selectedYearAtom` (same atoms as the transactions page). There is **no year-view on the budgeting page**.
- On mount, if `viewModeAtom` is `'year'`, the page auto-corrects it: switch to `'month'`, keeping the same year. If the year is the current calendar year, jump to the current month; otherwise jump to January of that year.
- The `MonthNavigator` in the app header hides its "Switch to year view" toggle when the active route is `/budgeting`. (Mechanism: route-aware conditional inside `MonthNavigator`. Instead of hiding it for the budgeting page, rather only show it for the transactions page)

### Table structure

- Uses `mantine-react-table` (same library as the transactions table).
- Three levels of nesting:
  1. **Type group rows** — "Расходы" (expenses) and "Доходы" (income). Always expanded, cannot be collapsed. Display aggregated values across their categories.
  2. **Category rows** — all categories except `FROM_SAVINGS`, in user-settings sort order. Always visible, even if no forecast exists.
  3. **Subcategory rows** — all subcategories for each category, in user-settings sort order. Always visible, even if no forecast exists. Collapsible per category (initially expanded).
- Name column: icon (categories only) + display name.
- Plan column: `sum` from the `Forecast` record, or `0` if no record exists. Expense sums shown with leading `"−"`, income without (cost sign convention).
- **"Rest" subcategory**: appears at the bottom of a category's subcategory list whenever at least one real subcategory has a non-zero forecast. Value = `parentForecast.sum − Σ(real subcategory sums)`. Uses a fixed sentinel ID (`REST_SUBCATEGORY_ID = -1`). No icon, no comment.

### Grand total (sticky footer)

- A sticky row pinned to the bottom of the viewport.
- Shows the **estimated monthly surplus**: `Σ(income forecasts) − Σ(expense forecasts)`.
- Displayed in green if ≥ 0, red if < 0.

### Loading & empty states

- While data is loading, show a skeleton / loader inside the table.
- If no categories exist, show an empty-state message.

### Out of scope

- Editing anything (values, comments).
- Transaction totals columns (average, last month, this month).
- Subscriptions.
- Cross-navigation to transactions.

---

## Sub-feature 2 — Inline Editing (Values + Comments)

### What it does

Makes plan values and comments editable inline. Persists changes to the database.

### API

- Add `upsertForecast` server function: accepts `{ categoryId, subcategoryId, month, year, sum, comment? }`. Checks whether a record matching `(categoryId, subcategoryId, month, year, userId)` exists; creates it if not, updates it if yes. Returns the upserted forecast.
- Update `forecastSchema` to expose `id` and `comment` (both already exist in the DB model).

### Plan value editing

- **Trigger**: double-click on any Plan cell opens it for inline editing (number input).
- **Tab** / **Enter** / click outside → save (calls `upsertForecast`). **Escape** → cancel.
- The input accepts the absolute magnitude (you can still type minus sign if you want, it will be ignored); the sign is determined by `category.isIncome` (same `adaptCost` convention). Display the absolute value in the input; save with the correct sign.
- **Category locking**: if any real subcategory has a non-zero plan value, the category's Plan cell is read-only. Tooltip on hover: "Значение рассчитывается автоматически как сумма подкатегорий".
- **Rest row editing**: editable. Saving calls `upsertForecast` for the **parent category** with `newSum = Σ(real subcategory sums) + enteredRestValue`. The Rest row itself is never written to the DB.

### Comment editing

- **Comment** column (rightmost). Single-click activates an inline text input.
- **Enter** or click outside → save (calls `upsertForecast` preserving `sum`). **Escape** → cancel.
- The Rest row has no editable comment cell.

### Optimistic updates

- After a successful upsert, the React Query cache for the forecasts year query is updated (or invalidated) so the table reflects the new value immediately.

### Edge cases

- Entering `0` is valid; it overwrites a previously non-zero forecast.
- If the parent category already has a value when a subcategory is first edited, the Rest row's value is automatically calculated as `parent.sum − Σ(subcategory sums)`. No action needed — this happens naturally from the existing formula. The Rest value may be negative if the subcategories exceed the parent; that is allowed and displayed as-is.

### Out of scope

- Bulk fill from subscriptions.
- Validation that subcategory sum ≤ parent.

---

## Sub-feature 3 — Transaction Totals Columns

### What it does

Adds three read-only columns showing actual spending data from transactions, with diffs vs the plan.

### Columns

| Column | Content |
|---|---|
| **Average** | Average monthly spend for this category/subcategory across all months (in the loaded range) that have at least one transaction (zero months excluded). Sign convention applied. Tooltip on hover: "X месяцев за {{prev_year}}–{{selected_year}}" where X is the count of months with at least one transaction for that row. |
| **Last Month** | Actual total for the previous month. Shown with a diff indicator: `actual − plan`. Over-budget diff is red; under-budget is green. |
| **This Month** | Actual total for the selected month. Same diff display logic as Last Month. |

### Diff display

- Diff is shown below the actual value in smaller, muted text.
- The "Rest" subcategory shows a diff between its auto-calculated budget value and the actual expenses that have no subcategory (i.e. transactions for that category where `subcategoryId` is null).
- Type-group rows show aggregated sums for all three columns.
- The grand total footer shows aggregated actuals and diff vs aggregated plan.

### Data source

- Loads transactions for **two years**: the selected year and the year before it (`getTransactionsQueryOptions(year)` + `getTransactionsQueryOptions(year - 1)`). Both queries run in parallel.
- Average is computed client-side across all transactions from both years.
- "Last month" = the calendar month before the selected month (rolls back to the previous year if needed; that year's data is already loaded).

### Out of scope

- Clicking on these cells (Sub-feature 5).

---

## Sub-feature 4 — Subscriptions Integration

### What it does

Shows upcoming subscriptions for each forecast row and allows one-click population of the forecast value.

### Per-row subscription badge

- For each **category row** and each **subcategory row**, compute subscriptions due in the selected month matching the row's `categoryId` (and `subcategoryId` for subcategory rows).
- If non-empty, show a badge icon next to the Plan value.
- **Hover**: tooltip listing individual subscriptions. Paid subscriptions are shown with dimmed color. Total rules:
  - **Single subscription, unpaid**: just the name — no total line needed.
  - **Single subscription, paid**: name + "(оплачено)" appended.
  - **Multiple subscriptions, all unpaid**: total line at the bottom showing the sum.
  - **Multiple subscriptions, all paid**: total line showing the sum + "(оплачено)".
  - **Multiple subscriptions, mixed**: total line showing "FULL_TOTAL (UNPAID_TOTAL не оплачено)" in regular (non-dimmed) color.
- **Click** behavior depends on whether the category has non-zero subcategory forecasts (i.e. is locked):
  - **Unlocked category row**: sets the category Plan value to the total subscriptions cost for that category (subscriptions with `subcategoryId = null` for this category).
  - **Locked category row**: instead of setting the parent, distributes subscriptions to the appropriate subcategory rows — calls `upsertForecast` for each subcategory that has matching subscriptions. Category-level subscriptions (with `subcategoryId = null`) are ignored in this case, since the parent is calculated automatically.
  - **Subcategory row**: sets the subcategory Plan value to its total subscriptions cost (unchanged).

### Grand total subscriptions tooltip

- The sticky grand total row shows the badge icon if any subscriptions are due this month.
- **Hover only** (not clickable).
- Tooltip lists **all** upcoming subscriptions grouped by **source**: source name with its group total (same paid/unpaid total rules as above), then individual "Cost — Name" items under it. Paid items are dimmed. Subscriptions without a source: "Без источника".

### "Upcoming" subscription definition

- A subscription is due in month M of year Y if advancing `firstDate` by multiples of `period` months lands at least one date inside that month. The logic is the same and should be shared with the transactions page with one exception: already-paid subscriptions are excluded on the transactions page, but still persist as the badge on the planning page
- Only `active` subscriptions are included.

### Out of scope

- "Fill all categories from subscriptions" bulk action.

---

## Sub-feature 5 — Cross-navigation to Transactions

### What it does

Clicking an actual-spend cell (Last Month or This Month) navigates to the Transactions page and focuses on that category or subcategory.

### Interaction

- **Last Month** and **This Month** cells on category and subcategory rows are rendered as clickable links (underlined on hover, pointer cursor).
- Clicking **This Month**: navigate to `/transactions` (month already selected, no change needed). Expand + highlight the row's category/subcategory.
- Clicking **Last Month**: set `selectedMonthAtom` to the previous month, then navigate to `/transactions`. Same expand + highlight.

### Expand + highlight mechanism

- New shared atom: `focusedCategoryAtom?: { categoryId: number; subcategoryId: number | null }`.
- `TransactionsTable` reads this atom after navigation and:
  1. Collapses all category groups.
  2. Expands the matching category group.
  3. Flashes the matching subcategory row (if `subcategoryId` is non-null) or the category row (if null).
  4. Clears `focusedCategoryAtom` after applying the effect.
- The Rest row **is** clickable: it corresponds to transactions with `subcategoryId = null` for that category, which appear as the "<без подкатегории>" group in the transactions table. Pass `subcategoryId: null` in `focusedCategoryAtom`.
- Type-group rows are non-clickable.

### Out of scope

- Filtering transactions to only the highlighted category.

---

## Implementation Order

| Sub-feature | Depends on |
|---|---|
| 1 — Foundation | — |
| 2 — Editing | 1 |
| 3 — Transaction Totals | 1 |
| 4 — Subscriptions | 1, 2 |
| 5 — Cross-navigation | 1, 3 |

Sub-features 2 and 3 can be implemented in either order after 1. Sub-feature 4 requires 2 (badge click writes a forecast). Sub-feature 5 requires 3 (the clickable cells).
