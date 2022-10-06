import SavingSpending from "../../../models/SavingSpending";
import SavingSpendingCategory from "../../../models/SavingSpendingCategory";
import savingSpendingStore from "../../../stores/savingSpendingStore";
import { FormValues } from "../SpendingCategoriesForm";

export async function saveSavingSpending(id: number, values: FormValues) {
  const spending = new SavingSpending(id, values.name, false, []);
  for (const category of values.categories) {
    spending.categories.push(
      new SavingSpendingCategory(
        category.id,
        category.name,
        category.forecast || 0,
        category.comment || ""
      )
    );
  }
  if (id === -1) {
    savingSpendingStore.addSpending(spending);
  } else {
    savingSpendingStore.editSpending(spending);
  }
}
