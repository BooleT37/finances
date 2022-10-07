import { makeAutoObservable, observable, runInAction } from "mobx";
import { api } from "../api";
import { SavingSpendingJson } from "../api/savingSpendingApi";
import { SavingSpendingCategoryJson } from "../api/savingSpendingCategoryApi";
import SavingSpending from "../models/SavingSpending";
import SavingSpendingCategory from "../models/SavingSpendingCategory";
import { Option } from "../types";

class SavingSpendingStore {
  savingSpendings = observable.array<SavingSpending>();

  constructor() {
    makeAutoObservable(this);
  }

  fromJson(
    json: SavingSpendingJson[],
    categories: SavingSpendingCategoryJson[]
  ) {
    this.savingSpendings.replace(
      json.map(
        (ss) =>
          new SavingSpending(
            ss.id,
            ss.name,
            ss.completed,
            categories
              .filter((c) => c.saving_spending_id === ss.id)
              .map(
                (ssc) =>
                  new SavingSpendingCategory(
                    ssc.id,
                    ssc.name,
                    ssc.forecast,
                    ssc.comment
                  )
              )
          )
      )
    );
  }

  getById(id: number): SavingSpending {
    const spending = this.savingSpendings.find((s) => s.id === id);
    if (!spending) {
      throw new Error(`Cannot find spending with id ${id}`);
    }
    return spending;
  }

  async addSpending(spending: SavingSpending) {
    const { id } = await api.savingSpending.add({
      name: spending.name,
    });

    runInAction(async () => {
      spending.id = id;

      const categoriesToSave: SavingSpendingCategory[] = [];
      for (const category of spending.categories) {
        categoriesToSave.push(category);
      }
      this.savingSpendings.push(spending);

      for (const category of categoriesToSave) {
        await category.save(id);
      }
    });
  }

  async editSpending(spending: SavingSpending) {
    const currentSpending = this.getById(spending.id);
    spending.completed = currentSpending.completed;

    if (currentSpending.name !== spending.name) {
      await api.savingSpending.edit({
        id: spending.id,
        name: spending.name,
        completed: spending.completed,
      });
      runInAction(() => {
        currentSpending.name = spending.name;
      });
    }

    runInAction(async () => {
      await currentSpending.persistCategories(spending.categories);
    });
  }

  async removeSpending(id: number) {
    const spending = this.getById(id);

    const categoriesToDelete: SavingSpendingCategory[] = [];

    for (const category of spending.categories) {
      categoriesToDelete.push(category);
    }

    for (const category of categoriesToDelete) {
      await category.delete();
    }

    await api.savingSpending.delete(id);

    runInAction(() => {
      this.savingSpendings.remove(spending);
    });
  }

  get asOptions(): Option[] {
    return this.savingSpendings.map((s) => s.asOption);
  }

  categoriesAsOptions(id: number): Option[] {
    return this.getById(id).categories.map((c) => c.asOption);
  }
}

const savingSpendingStore = new SavingSpendingStore();

export default savingSpendingStore;
