# Subscriptions

Subscriptions is an auxiliary feature for tracking and planning recurrent expenses.

## Structure

A subscription is structured similarly to a transaction: it has a **name**, **cost**, **category**, **source**, and a **date** (the date of the first payment). It also has a **period** property.

## Period

Period is an integer representing the number of months between payments. Subscriptions that occur more frequently than once a month are not supported. The supported periods in the UI are: every month, every quarter, twice a year, once a year.

By repeatedly adding the period to the first payment date, we generate a stream of payment dates used throughout the app.

## Payment Schedule

Using the first date and the period, we can always unambiguously determine whether a subscription is due in any given month, and if so, when. This information is shown on the forecasts (planning) page. We can also automatically populate the total subscription cost into each category's forecast. Additionally, using the source property, we can calculate how much money needs to be available on each specific bank account to cover all upcoming subscriptions.

## Linking to Transactions

By assigning a subscription to a transaction, we mark that subscription as paid for the current month. The expenses page shows which subscriptions have been paid and which are still pending.

Subscriptions also simplify adding new transactions: when creating a new transaction and selecting a category, the form automatically shows all unpaid subscriptions for that category. Selecting one marks the subscription as paid and pre-fills all relevant fields (name, cost, source, etc.).

## Active / Inactive

A subscription can be marked as **inactive** in settings, which prevents new transactions from being assigned to it.

---

## Temporary Notes

- Subcategories for subscriptions are not yet supported in the UI.
- Price changes are a current pain point: adjusting the cost in settings loses price history, while marking it inactive and creating a new one pollutes the subscriptions list. The planned solution is to support a list of price periods per subscription, so historical prices are preserved.
