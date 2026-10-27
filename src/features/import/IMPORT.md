# Import

Import adds transactions in bulk from a bank instead of entering them one by one. The rows first show up in a review modal, where each one gets a category and can be unticked, and only the ticked rows are saved as transactions.

Each source can have its own statement parser (see [Sources](../sources/SOURCES.md)), and only sources with a parser can be picked for import.

## Import Deduplication

Each transaction has an **`importHash`** used to detect whether it was already imported via the "Import" feature, preventing duplicates. The hash is computed from the statement row exactly as the bank shows it, so editing the description or the amount in the import modal keeps it the same.

## Imported Description

A transaction created by the import keeps the description exactly as the bank statement shows it in **`importedDescription`**, while its `name` can be edited freely, both in the import modal and later. Category suggestions (see below) rely on it, since the bank's own wording is what the next statement will contain.

Transactions imported before this field existed were filled in from the saved bank statements. The ones whose statements weren't available stay empty.

## Category Suggestions

When importing, the app suggests a category for each imported transaction (a row parsed from a bank statement, not yet saved) and pre-fills it in the import modal:

1. It finds the similar transactions (see below).
2. It sends Jev, a classification model by TypeSafe, a question: which of the row's criteria fits it. The criteria ("criteria" is Jev's own word) are the options the category picker offers for this row, each described in words, plus "unknown". Along with the imported transaction, Jev sees the similar transactions, each with the criterion it was filed under.
3. Jev answers with a choice and its confidence. The app keeps the choice as the row's category suggestion only if Jev is confident enough (see below). Otherwise the row stays empty.

A category suggestion can be a subscription too. If the suggested subscription isn't offered for this row (e.g. it's already paid this period), the row gets the subscription's category and subcategory instead.

A category suggestion fills a row only while its category is still empty, so a category the user has already picked always stays. The row is marked as suggested until the user changes it. If category suggestions can't be fetched, the modal says so and offers to retry, and the import works as usual.

## Category Autofill

Category suggestions only run when the project has category autofill turned on. A project starts with it off, and only an admin can turn it on or off, on the project settings page (see [Project](../project/PROJECT.md)).

Turning it on is how the household agrees to its data going to TypeSafe, which is in the USA and has no EU data protection agreement. That's why it starts off, and why the server refuses to suggest categories while it's off, whoever asks.

While it's off, the import modal says so and links to the project settings. The hint can be hidden, and then stays hidden in that browser.

## Similar Transactions

The similar transactions of an imported transaction are up to 10 transactions of the same source and the same sign (expense or income) whose imported description is the closest to the imported transaction's. Closeness is measured by Postgres' `pg_trgm` trigram similarity.

The search stays within one source, since each bank writes its descriptions in its own way.

## Suggestion Confidence

Jev returns a confidence from 0 to 1 with each choice, and a category suggestion is shown only when it's at least **0.8**.

This number, and the 10 similar transactions, were picked by replaying about 800 past Vivid imports (October 2026): at 0.8, about 63% of rows got a category, 80% of them exactly right and 89% in the right category. Most of the misses are merchants we file under different categories at different times (Wolt, Amazon, Rossmann), which no description can tell apart.

These results hold for the exact Jev version (`JEV_MODEL`) and the exact wording of the question sent to Jev, so changing either means replaying the past imports again.

---

## Temporary Notes

- Category suggestions use only the description, amount and date of an imported transaction. The bank's transaction type ("Card transaction", "Outgoing transfer", etc.) is left out for now, since its effect couldn't be measured on past imports
