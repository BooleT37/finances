# Import

Import adds transactions in bulk from a bank instead of entering them one by one. The rows first show up in a review modal, where each one gets a category and can be unticked, and only the ticked rows are saved as transactions.

A source can be imported in two ways: by uploading a bank statement, or straight from the bank. A source that supports neither can't be imported.

## Statement Upload

Each source can have its own statement parser (see [Sources](../sources/SOURCES.md)). Only Vivid's PDF statements can be parsed for now.

Statement upload stays even for a source connected to the bank as a plan B if something doesn't work with bank import, and since statements reach further back in time than the bank lets an app read.

## Bank Import

A source connected to the bank (see below) can import its transactions straight from the bank. Like a parsed statement, the bank's transactions are only saved once the user confirms them. We reuse the same business logic for imported transactions as for transactions parsed from a bank statement

Only booked transactions are imported. A pending one can still change its amount, date and reference when it's booked, so it would come back as a different row later.

Bank import now goes through [Enable Banking](https://enablebanking.com), which connects to the bank under the EU's PSD2 rules. It only reads accounts and can never move money.

## Bank Access

Enable Banking's free terms only cover the bank accounts of the person who set it up, for personal use, and forbid giving anyone else access. So each environment has one Enable Banking application, and only one project may use it. Every other project can't use bank import and keeps uploading statements.

The application and the project are set in env vars: `ENABLE_BANKING_APP_ID`, `ENABLE_BANKING_PRIVATE_KEY` (the PEM the Enable Banking Control Panel downloads, with `\n` for line breaks when on one line) and `ENABLE_BANKING_PROJECT_ID`. Without all three, no project can use bank import. On Vercel they're only set for Production, so preview deployments don't get bank access.

The server checks the project on every bank request. Even a bug in that check wouldn't expose anyone else's bank, since the application can only reach accounts linked in the owner's Enable Banking Control Panel.

## Bank Connections

Connecting a source means logging in to the bank itself, so only an admin can connect, reconnect or disconnect a source, while every project member can import from a connected one. Each source can be connected to one bank account. To import another account, connect it to another source.

If the bank returns several EUR accounts, the user picks which one the source imports. Until then, the source can't import. Accounts in other currencies are never offered, since the app has no notion of currency.

The bank allows a connection for 180 days at most (an EU rule, and Vivid's own limit too). A connection also ends early when the user revokes it in the bank. Either way the source has to be connected again, and importing from it is refused until then.

## Import Period

Once a source has been imported from the bank, the next import's start date is preselected as the last import date (`lastImportedAt`) minus 2 days, to catch transactions the bank publishes late.

## Bank Rows

- The date is the day the bank booked the transaction. For card payments that's often a day off from the date in the banking app, which shows the purchase time, and the bank doesn't send the purchase date. Statements have the same problem.
- The amount is negative for money going out and positive for money coming in.
- The description is the other party's name (the merchant for card payments), followed by the payment reference when the bank sends one.
- The type uses the statement's wording ("Card transaction", "Transfer between own accounts", "Incoming transfer", "Outgoing transfer", "Fees and charges").

## Import Deduplication

Each transaction has an **`importHash`** used to detect whether it was already imported via the "Import" feature, preventing duplicates. For a statement row, the hash is computed from the row exactly as the statement shows it. For a bank row, it's computed from the bank's own reference for that transaction, so repeated bank imports recognise their rows exactly. Either way, editing the description or the amount in the import modal keeps it the same.

A row also counts as already imported when a transaction with the same amount on the same day exists, which catches transactions entered by hand or by another import type. Rows that were already imported are still shown in the table, but deselected by default.

## Imported Description

A transaction created by the import keeps the description exactly as the bank shows it in **`importedDescription`**, while its `name` can be edited freely, both in the import modal and later. Category suggestions (see below) rely on it, since the bank's own wording is what the next import will contain.

Transactions imported before this field existed were filled in from the saved bank statements. The ones whose statements weren't available stay empty.

## Category Suggestions

When importing, the app suggests a category for each imported transaction (a row from a statement or from the bank, not yet saved) and pre-fills it in the import modal:

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

- Only Vivid can be connected to the bank. Another bank needs its own connector: Commerzbank, for example, sends no transaction type and no reference, but puts the card purchase time in the payment reference

- Vivid's Pockets can't be imported from the bank yet. Transfers to and from them show up as "Transfer between own accounts" on the main account
