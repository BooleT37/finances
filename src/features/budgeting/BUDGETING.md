# Forecasts

Forecasts are the second main feature in the app after transactions. A forecast stores how much we expected to spend for a given category (or subcategory) in a given month. Forecasts, unlike transactions, represent *totals* for the entire category or subcategory. 

## Uniqueness

Each forecast is unique for the combination of: **category id + subcategory id + month + year + project id + level**. 

## Naming

All forecasts for a given month are sometimes called "planning" or "budgeting". The forecasts table page is sometimes called "Planning page"

## Sum Storage

Forecast sums are stored in the database as **absolute values**, the same way transaction costs are stored. The sign is applied on read via `adaptCost` in the API handler (negative for expense categories, positive for income). Before saving a forecast, the server always strips the sign.

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
2. It has subcategories, but none of them have ever been edited. Still only the category's own row exists. Rest is made up, calculated as `category.sum − Σ(subcategory sums)` (which is just `category.sum`, since nothing else has a value yet).
3. It has subcategories and at least one of them (or Rest itself) has been edited. Now a real row exists for each edited subcategory, and Rest gets a real row too, with its own sum and comment. Editing any subcategory or Rest for the first time is what creates the Rest row — never having subcategories defined by itself — and it always happens together with making sure the category's own row exists.

Once Rest has a real row, `category.sum` always equals the sum of all its `SUBCATEGORY` rows for that month — the server recalculates and stores this every time one of them changes.

Once any of its real subcategories (not Rest) has a non-zero value, the category's own sum can't be changed directly. The only way to change the category's total then is through its subcategories or Rest.

A category has Rest whenever it has at least one subcategory defined, whether or not it or any subcategory has a value yet.

## Composite Plan

Splitting by subcategory is one way to make more granular forecasts. A composite plan is the other: instead of one typed number, the forecast holds a list of line items, each with a price, a quantity and an optional comment, and its sum is what they add up to. A price can be a formula (`12+8`), so the arithmetic you'd otherwise do in your head stays visible in the plan.

The two ways can't both describe the same total for the category, so a category with a composite plan can't have its subcategories (or Rest) edited, and a category whose subcategories are in use can't have its own sum edited. Rest counts as a subcategory here: a composite plan on Rest locks the category too.

Line items live in their own table, keyed to the forecast they belong to. They store the price exactly as it was typed — `12+8` stays `12+8`, not `20` — since the point is to show how the number was reached. Only the sum on the forecast is ever used for calculations; the line items are there to explain it.

The client evaluates the formulas and sends the total along with the items, and the server stores what it was given. It means the stored sum is the total the user saw when saving, and the parser never has to run on the server.

A plan is savable when every price parses, every quantity is a positive number, there's at least one line, and the total comes out positive. A single line may be negative — writing a discount as its own line is much of the reason to break a plan down — but the total can't be. Removing the plan keeps the forecast's sum: the number stays, only the explanation behind it goes away.

A line item can also come from a subscription fill (see Subscription Auto-Population below), carrying that subscription's id.

## Writing Forecasts

There are two endpoints for saving a forecast, each scoped to one category. No caller ever needs to write the category's own value and its subcategories in the same request, since a category with subcategories never has its own value written directly:

- `upsertCategoryForecast` — writes the category's own row (sum and/or comment). It refuses to change the sum while a child owns the category's total, which means a real subcategory with a value of its own, or any child with a composite plan. The server has to check this itself, since server functions are directly callable. If Rest already has a row, a sum write recalculates Rest to absorb the new total, so `category.sum` still equals the sum of its children.
- `upsertSubcategoryForecasts` — writes several subcategory rows for one category at once (real subcategories and/or Rest, via `subcategoryId: null`), creates Rest the first time any of them is touched, and recalculates the category's sum once for the whole batch.

Both also take the line items of a composite plan, written in the same request as the sum they add up to, so a plan and the number it produces can't land apart.

Neither endpoint sends anything back — the client just asks for the forecasts to be refetched instead of merging in a response. This is done to not overcomplicate the logic, since app is primarily client-side logic, and this is one of the few examples of server recalculating anything.

## Surplus Estimation

The sum of all income forecasts minus all expense forecasts gives the **estimated monthly surplus**. If negative, the plan needs adjustment by cutting costs.

## Subscription Auto-Population

Filling from subscriptions fills in planned costs from upcoming subscriptions, for one row, for a whole group (expenses, savings or income), or for all forecasts of the month. A category's own due total always covers every subscription under it, subcategory or not, while a subcategory's (including rest's) own due total only counts its own. But filling a category works differently depending on whether it has subcategories: with none, it fills the category's own value directly; with subcategories, it fills each subcategory instead, and any subscription with no subcategory goes to Rest, the same as editing them by hand.

A fill writes line items, one per subscription, never merged even when several land on the same row. Each one's price is the subscription's cost, its quantity is 1, and its comment names the subscription. If the row already held a plain typed sum, that sum becomes its own line alongside the new ones — the subscription is additional spend, not a replacement for what was planned — but only on the transition into having a breakdown; a row that already has one keeps its existing lines as they are. A zero sum is skipped rather than turning into an empty line.

Filling a row again updates only the price of the lines it already owns. Quantity and comment stay as edited, since these lines can be edited by hand, and price is the only field with an upstream source to refresh from.

A fill needs the user's confirmation only when it would touch rows it doesn't fully own (a group, all forecasts of the month, or a category whose subcategories already have their own data), or would update subscription lines already applied.

Once every due subscription for a row is already in its plan, the row counts as fully applied. Its due total stays the same either way, since that's what makes rows comparable.

Filling several categories at once builds a plan for each category first, then saves them one at a time, never all together — two requests touching the same category at once could step on each other's recalculated sum. The sequential logic instead of one bulk edit endpoint was made not to overcomplicate the code.

Deleting a subscription leaves its line items behind as ordinary hand-written lines, comment and all — the reference to the subscription is cleared, the same way it's cleared on a transaction that paid it.

## Forecast vs Actual Visualization

In both the transactions and forecasts views, we visualize the **diff between the forecast and the actual total transaction cost** for each category. This helps us see for which categories we're on track this month, and for which not

---

## Temporary Notes

- Month is currently a required field for a forecast. In future, we want to also support yearly forecasts in addition to monthly ones.
