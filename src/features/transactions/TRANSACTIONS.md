# Transactions

Transaction is the main entity in the app. It represents either an expense or income.

## Dates

A transaction has two date fields:

- **`date`** — the primary date used in app logic to determine which month the transaction belongs to.
- **`actualDate`** — the date as it appears in the banking app, receipt, etc. Used outside the app to locate the transaction. This is why the "last transactions" tooltip in transaction editing mode uses `actualDate`, not `date` — we need the tooltip to help find transactions in banking apps.

## Category and Subcategory

Each transaction must have a **category**, and optionally a **subcategory**, used for structural grouping and budget planning.

## Expense vs Income

Whether a transaction is an expense or income is determined purely by its **category** (`category.isIncome`), not by the sign of its cost.

In the database, all transaction costs are stored as **positive values**. When reading from the database, we apply a sign to the cost for presentation purposes and to simplify arithmetic when mixing expense and income transactions. See `adaptCost` in `~/shared/utils/adaptCost.ts`. Before saving a cost to the database, we always strip the sign.

## Source

Each transaction has an optional **source**, used to help locate it in third-party apps (primarily banking apps).

## Subscription

A transaction may be linked to a **subscription**, indicating that the subscription was paid this month.

## Saving Spending

A transaction may be linked to a **saving spending category** via `savingSpendingCategoryId`. This means the money were spent from savings and should not be counted toward any expense aggregations. However, we use this expense data in "actual spending for this saving event" aggregation, which is a part of "saving spendings" page.

We don't support saving spendings for income transactions, and most likely never will

## Components

A transaction may be split into **components**. In this case, the transaction's `cost` still holds the total amount, but that total is distributed across components. The sum of all the components doesn't have to be strictly equal to the transaction cost, but it should not exceed it. Each component can have a different category from the parent transaction, and must be accounted for separately in category totals.

Example: an expense of 100 EUR in the "Food" category with a 30 EUR "Dog" component → 70 EUR is counted toward "Food", 30 EUR toward "Dog".

Components must always have a different category or subcategory from the parent transaction. We consciously ignore use cases where a component shares the same category + subcategory as its parent — they are rare in practice, and excluding them keeps the calculation logic simpler: it allows us to always exclude component costs from the parent's category/subcategory totals.

## Import Deduplication

Each transaction has a **`peHash`** (parsed expense hash) used to detect whether it was already imported via the "Import" feature, preventing duplicates.

---

## Temporary Notes

- In the database, the transaction table is still named **`expenses`**. It will be renamed once migration from the old app is complete.

- We exclude expenses from aggregation if it's a spending from savings. Currently, we detect that by its category's type "SAVING_SPENDING", not when its savingSpendingCategoryId is defined. In future, we might switch to only care about savingSpendingCategoryId, to have only one source of truth for when exclude the transaction from calculation (and in general, when consider it a spending from savings)

- We don't support subscriptions or components for income transactions yet. But we will in future
