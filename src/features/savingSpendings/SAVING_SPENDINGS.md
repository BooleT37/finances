# Saving Spendings

Saving spendings is an auxiliary feature that tracks money movement in relation to savings: when we put money into savings, and when we spend from them.

## Putting Money into Savings

Putting money into savings means recording a transaction with the `TO_SAVINGS` category. This has no relation to saving spending events.

Subcategories of `TO_SAVINGS` represent continuous saving streams (e.g. "vacations", "emergency fund"). These are different from saving event categories — they represent ongoing purposes, not specific short-lived events.

## Spending from Savings

Spending from savings means recording a transaction with the `FROM_SAVINGS` category. When doing so, the user can optionally select a saving spending event to attribute the expense to. Transaction with a `FROM_SAVINGS` category are excluded from all totals calculations in the app (when we're spending from savings, we're not spending from our regular planned budget)

## Saving Spending Events (`SavingSpending`)

A saving spending event represents a specific goal or purpose for which money was saved — for example, "Vacation trip to Rome 2025", "Moving to another apartment 2026", or "Buying a new TV". We record these events to track actual spending and to help plan for similar events in the future.

### Categories within an Event

Each saving spending event has a list of categories (e.g. "Flight", "Transport", "Accommodation", "Food" for a vacation). Since transactions are linked to a saving spending event via `SavingSpendingCategory` in the database, every event must have at least one category. However, if only one category exists, it is hidden in the UI — the event effectively behaves as uncategorized.

Saving event categories are distinct from `TO_SAVINGS` subcategories. Subcategories represent continuous saving streams, while event categories represent the breakdown of a specific, time-limited spending event.

> **`SavingSpendingCategory` is not a `Category`.** Despite similar naming, these are entirely separate entities. A `Category` (with `type === 'FROM_SAVINGS'`) is a transaction category that marks an expense as paid from savings. A `SavingSpendingCategory` is a budget line within a saving spending event (e.g. "Билеты", "Отель") with its own `forecast` amount. One is about classifying a transaction; the other is about breaking down a savings goal.

### Completion

A saving spending event can be marked as **completed**, which prevents new transactions from being assigned to it.

---

## Temporary Notes

- The rule "each saving event must have at least one category, but if there's only one it's hidden in the UI" is fragile and may be refactored in the future.
- We used to store the
