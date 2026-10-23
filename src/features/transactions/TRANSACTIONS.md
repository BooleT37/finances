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

Each transaction has a **`peHash`** (parsed expense hash) used to detect whether it was already imported via the "Import" feature, preventing duplicates. The hash is computed from the statement row exactly as the bank shows it, so editing the description or the amount in the import modal keeps it the same.

## Imported Description

A transaction created by the import keeps the description exactly as the bank statement shows it in **`importedDescription`**, while its `name` can be edited freely, both in the import modal and later. Category suggestions (see below) rely on it, since the bank's own wording is what the next statement will contain.

Transactions imported before this field existed were filled in from the saved bank statements. The ones whose statements weren't available stay empty.

## Category Suggestions

When importing, the app suggests a category for each parsed expense (a row parsed from a bank statement, not yet saved) and pre-fills it in the import modal:

1. It finds the similar transactions (see below).
2. It sends Jev, a classification model by TypeSafe, a question: which of the row's criteria fits it. The criteria ("criteria" is Jev's own word) are the options the category picker offers for this row, each described in words, plus "unknown". Along with the parsed expense, Jev sees the similar transactions, each with the criterion it was filed under.
3. Jev answers with a choice and its confidence. The app keeps the choice as the row's category suggestion only if Jev is confident enough (see below). Otherwise the row stays empty.

A category suggestion can be a subscription too. If the suggested subscription isn't offered for this row (e.g. it's already paid this period), the row gets the subscription's category and subcategory instead.

A category suggestion fills a row only while its category is still empty, so a category the user has already picked always stays. The row is marked as suggested until the user changes it. If category suggestions can't be fetched, the modal says so and offers to retry, and the import works as usual.

## Similar Transactions

The similar transactions of a parsed expense are up to 10 transactions of the same source and the same sign (expense or income) whose imported description is the closest to the parsed expense's. Closeness is measured by Postgres' `pg_trgm` trigram similarity.

The search stays within one source, since each bank writes its descriptions in its own way.

## Suggestion Confidence

Jev returns a confidence from 0 to 1 with each choice, and a category suggestion is shown only when it's at least **0.8**.

This number, and the 10 similar transactions, were picked by replaying about 800 past Vivid imports (October 2026): at 0.8, about 63% of rows got a category, 80% of them exactly right and 89% in the right category. Most of the misses are merchants we file under different categories at different times (Wolt, Amazon, Rossmann), which no description can tell apart.

These results hold for the exact Jev version (`JEV_MODEL`) and the exact wording of the question sent to Jev, so changing either means replaying the past imports again.

---

## Temporary Notes

- In the database, the transaction table is still named **`expenses`**. It will be renamed once migration from the old app is complete.

- We exclude expenses from aggregation if it's a spending from savings. Currently, we detect that by its category's type "SAVING_SPENDING", not when its savingSpendingCategoryId is defined. In future, we might switch to only care about savingSpendingCategoryId, to have only one source of truth for when exclude the transaction from calculation (and in general, when consider it a spending from savings)

- We don't support subscriptions or components for income transactions yet. But we will in future

- We don't support positive costs and income categories for components yet. Will implement it in future

- Category suggestions use only the description, amount and date of a parsed expense. The bank's transaction type ("Card transaction", "Outgoing transfer", etc.) is left out for now, since its effect couldn't be measured on past imports
