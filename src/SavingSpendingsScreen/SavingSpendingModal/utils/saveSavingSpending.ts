import { FormValues } from "../../../components/CostsListModal/CostsListForm";
import SavingSpending from "../../../models/SavingSpending";
import SavingSpendingCategory from "../../../models/SavingSpendingCategory";
import savingSpendingStore from "../../../stores/savingSpendingStore";

export async function saveSavingSpending(id: number, values: FormValues) {
  const spending = new SavingSpending(id, values.name, false, []);
  for (const category of values.costs) {
    spending.categories.push(
      new SavingSpendingCategory(
        category.id,
        category.name,
        category.sum || 0,
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
