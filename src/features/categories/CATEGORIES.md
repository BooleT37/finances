# Categories

Categories are the primary way to group and aggregate transactions and forecasts. They also "glue" the two features together — every transaction and forecast must have a category.

## Expense vs Income

A category is either an **income** or an **expense** category (`isIncome`). This determines whether the related transactions and forecasts are treated as income or expenses respectively. The sign of a transaction or forecast cost does not determine this — the category does. (In the database, all costs are stored as positive values.)

## Editable Properties

Users can edit categories in the UI:

- **Name** — must be unique per user
- **Short name** — used in charts and other space-constrained views
- **Icon** — selected from a set of predefined icons
- **Order** — categories can be reordered in the category editor
- **Continuous** — see below

## Ordering

The order set in the category editor is reused across all views that display categories: the transactions table, forecasts, component selectors, etc. Expense and income categories are always displayed in separate groups — they are never mixed.

## Continuous Categories

A **continuous** category is one with many small, evenly spread expenses throughout the month (e.g. groceries, public transport). For continuous categories, we can extrapolate current spending mid-month to predict whether the plan will be exceeded at the current rate. If so, a warning is shown in the transactions UI.

## Special Categories

There are two categories with custom business logic:

### `FROM_SAVINGS`

Indicates that an expense was paid from savings, not from the regular monthly budget. It may optionally be linked to a specific saving event. Expenses in this category are **excluded from monthly total calculations**. This category is also **omitted from the forecasts UI** — we never plan for savings expenses.

### `TO_SAVINGS`

Indicates money transferred into savings. It may have subcategories for separate saving purposes (e.g. vacation fund, emergency fund). In the forecasts table, it is displayed in a dedicated **savings group**. Otherwise, it behaves like any other category.

---

## Temporary Notes

- Reordering subcategories is not yet supported.
