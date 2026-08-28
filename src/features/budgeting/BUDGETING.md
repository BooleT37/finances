# Forecasts

Forecasts are the second main feature in the app after transactions. A forecast stores how much we expected to spend for a given category (or subcategory) in a given month. Forecasts, unlike transactions, represent *totals* for the entire category or subcategory. 

## Uniqueness

Each forecast is unique for the combination of: **category id + subcategory id + month + year + project id + level**. 

## Naming

All forecasts for a given month are sometimes called "planning" or "budgeting". The forecasts table page is sometimes called "Planning page"

## Sum Storage

Forecast sums are stored in the database as **absolute values**, the same way transaction costs are stored. The sign is applied on read via `adaptCost` in the API handler (negative for expense categories, positive for income). When writing a forecast, send the absolute value — the server always calls `.abs()` before persisting.

## Sparse Storage

In the UI, we always display forecasts for all possible categories and subcategories for the given month. However, in the database we only store forecasts that were "touched" (i.e. edited). The rest are pre-filled with empty values in the UI. When a forecast is edited, we check whether it already exists — if not, we create it; otherwise, we update it.

Having subcategories defined doesn't create any extra rows by itself — splitting a forecast by subcategory is a convenience, and most categories never use it. The Rest row only gets created the first time a subcategory (or Rest itself) is actually edited, never just because subcategories exist.

## Category Level vs Subcategory Level

As was mentioned before, unlike transactions, that represent individual items within categories and subcategories, forecasts denote the totals. They also have the "rest" subcategory, that can also be manually inputed. And since there's no way to differently represent the category forecast and the "rest" subcategory forecast in the db (both should have subcategoryId = null), we have an additional flag to show the forecast layer: `level`. It can be either `CATEGORY` or `SUBCATEGORY`.

- **`CATEGORY`** — the category's own row. `subcategoryId` is always `null`.
- **`SUBCATEGORY`** — a real subcategory (`subcategoryId` set to that subcategory's id), or Rest, when `subcategoryId` is `null`. This is the same convention `Expense.subcategoryId = null` uses for "no subcategory", so forecasts and actual spending use the same keys.

## Category vs Subcategory Forecasts

Forecasts for a category and for each of its subcategories are stored as separate entities, and splitting by subcategory is optional — most categories don't use it. A category forecast can be in one of three states:

1. It has no subcategories at all. Only its own row exists, nothing else applies.
2. It has subcategories, but none of them have ever been edited. Still only the category's own row exists. In the UI, Rest is a made-up row, shown as `category.sum − Σ(subcategory sums)` (which is just `category.sum`, since nothing else has a value yet).
3. It has subcategories and at least one of them (or Rest itself) has been edited. Now a real row exists for each edited subcategory, and Rest gets a real row too, with its own sum and comment. Editing any subcategory or Rest for the first time is what creates the Rest row — never having subcategories defined by itself — and it always happens together with making sure the category's own row exists.

Once Rest has a real row, `category.sum` always equals the sum of all its `SUBCATEGORY` rows for that month — the server recalculates and stores this every time one of them changes.

The category's own cell gets disabled in the UI once any of its real subcategories (not Rest) has a non-zero value. While disabled, the only way to change the category's total is through its subcategories or Rest.

Rest shows up in the UI whenever the category has at least one subcategory defined, whether or not it or any subcategory has a value yet.

There's currently no check that subcategory forecasts don't add up to more than the category forecast — Rest is allowed to go negative, and we just show it as-is.

## Writing Forecasts

There are two endpoints for saving a forecast, each scoped to one category. No caller ever needs to write the category's own value and its subcategories in the same request, since a category with subcategories never has its own value written directly:

- `upsertCategoryForecast` — writes only the category's own row (sum and/or comment). It refuses to change the sum if any subcategory already has a non-zero value, mirroring the lock in the UI. The server has to check this too, since server functions are directly callable regardless of which route renders them.
- `upsertSubcategoryForecasts` — writes several subcategory rows for one category at once (real subcategories and/or Rest, via `subcategoryId: null`), creates Rest the first time any of them is touched, and recalculates the category's sum once for the whole batch.

Neither endpoint sends anything back — the client just asks for the forecasts to be refetched instead of merging in a response. This is done to not overcomplicate the logic, since app is primarily client-side logic, and this is one of the few examples of server recalculating anything.

## Surplus Estimation

The sum of all income forecasts minus all expense forecasts gives the **estimated monthly surplus**. If negative, the plan needs adjustment by cutting costs.

## Subscription Auto-Population

"Fill from subscriptions" fills in planned costs from upcoming subscriptions — for one row, for a whole group (Расходы/В сбережения/Доходы), or for the whole table via the grand total badge. A category's own badge always shows the total for every subscription under it, subcategory or not — a subcategory's (including rest's) own badge only counts its own. But clicking a category's badge behaves differently depending on whether it has subcategories: with none, it fills the category's own value directly; with subcategories, it fills each subcategory instead, and any subscription with no subcategory goes to Rest, the same as editing them by hand.

Filling several categories at once builds a plan for each category first, then saves them one at a time, never all together — two requests touching the same category at once could step on each other's recalculated sum. While this is happening, a loading overlay covers the table. The sequential logic instead of one bulk edit endpoint was made not to overcomplicate the code.

## Forecast vs Actual Visualization

In both the transactions and forecasts views, we visualize the **diff between the forecast and the actual total transaction cost** for each category. This helps us see for which categories we're on track this month, and for which not

---

## Temporary Notes

- There is currently no way to split a forecast into a line-by-line breakdown with its own formulas (price × quantity per line, with comments) — see issue #105. The only way to split a forecast today is by subcategory.
- Month is currently a required field for a forecast. In future, we want to also support yearly forecasts in addition to monthly ones.
