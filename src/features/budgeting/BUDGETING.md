# Forecasts

Forecasts are the second main feature in the app after transactions. A forecast stores how much we expected to spend for a given category (or subcategory) in a given month.

## Uniqueness

Each forecast is unique for the combination of: **category id + subcategory id + month + year + user id**.

## Naming

All forecasts for a given month are sometimes called "planning" or "budgeting". The forecasts table page is sometimes called "Planning page"

## Sparse Storage

In the UI, we always display forecasts for all possible categories and subcategories for the given month. However, in the database we only store forecasts that were "touched" (i.e. edited). The rest are pre-filled with empty values in the UI. When a forecast is edited, we check whether it already exists — if not, we create it; otherwise, we update it.

## Category vs Subcategory Forecasts

Forecasts for a category and for each of its subcategories are stored as separate entities. The sum of subcategory forecasts does not have to equal the parent category forecast.

If the subcategory forecasts don't add up to the parent category forecast, we display a fake **"rest"** subcategory in the UI, which shows the difference (parent forecast minus sum of subcategory forecasts). This makes the split visible and editable at the category level. The sum of subcategory forecasts should not exceed the parent forecast.

## Surplus Estimation

The sum of all income forecasts minus all expense forecasts gives the **estimated monthly surplus**. If negative, the plan needs adjustment by cutting costs.

## Subscription Auto-Population

We have a feature to automatically populate planned subscription costs into forecasts — for each category separately or for all of the categories in one go

## Forecast vs Actual Visualization

In both the transactions and forecasts views, we visualize the **diff between the forecast and the actual total transaction cost** for each category. This helps us see for which categories we're on track this month, and for which not

---

## Temporary Notes

- There is currently no validation that the sum of subcategory forecasts for a category doesn't exceed the parent category forecast. May be added later.
- There is currently no way to split a forecast into components (like transactions support). The only granularity available is subcategories, which is often insufficient — component-level forecast splits are planned for the future.
- There is currently no way to add a comment to the fake "rest" subcategory in a forecast with subcategories. May be addressed later.
- Month is currently a required field for a forecast. In future, we want to also support yearly forecasts in addition to monthly ones.
