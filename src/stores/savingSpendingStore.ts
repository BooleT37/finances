import sum from "lodash/sum";
import { makeAutoObservable, observable, runInAction } from "mobx";
import moment, { Moment } from "moment";
import { api } from "../api";
import { SavingSpendingJson } from "../api/savingSpendingApi";
import { SavingSpendingCategoryJson } from "../api/savingSpendingCategoryApi";
import { SAVINGS_DATE_LS_KEY, SAVINGS_LS_KEY } from "../constants";
import { CATEGORY_IDS } from "../models/Category";
import SavingSpending from "../models/SavingSpending";
import SavingSpendingCategory from "../models/SavingSpendingCategory";
import { Option } from "../types";
import expenseStore from "./expenseStore";

class SavingSpendingStore {
  savingSpendings = observable.array<SavingSpending>();
  initialSavings: number;
  initialSavingsDate: Moment | null;

  constructor() {
    makeAutoObservable(this);

    this.initialSavings = parseFloat(
      localStorage.getItem(SAVINGS_LS_KEY) ?? "0"
    );
    this.initialSavingsDate = localStorage[SAVINGS_DATE_LS_KEY]
      ? moment(localStorage.getItem(SAVINGS_DATE_LS_KEY))
      : null;
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

  get activeAsOptions(): Option[] {
    return this.savingSpendings
      .filter((s) => !s.completed)
      .map((s) => s.asOption);
  }

  categoriesAsOptions(id: number): Option[] {
    return this.getById(id).categories.map((c) => c.asOption);
  }

  get currentSpendings(): number | null {
    if (!this.initialSavingsDate) {
      return null;
    }

    const toSavingsExpenses =
      CATEGORY_IDS.toSavings in expenseStore.expensesByCategoryId
        ? expenseStore.expensesByCategoryId[CATEGORY_IDS.toSavings]
        : [];

    const fromSavingsExpenses =
      CATEGORY_IDS.fromSavings in expenseStore.expensesByCategoryId
        ? expenseStore.expensesByCategoryId[CATEGORY_IDS.fromSavings]
        : [];

    return (
      sum(
        toSavingsExpenses
          .concat(fromSavingsExpenses)
          .filter((expense) =>
            expense.date.isSameOrAfter(this.initialSavingsDate, "date")
          )
          .map((expense) =>
            expense.category.id === CATEGORY_IDS.fromSavings
              ? -(expense.cost ?? 0)
              : expense.cost
          )
      ) + this.initialSavings
    );
  }

  setInitialSavings(savings: number) {
    this.initialSavings = savings;
  }

  setInitialSavingsDate(date: Moment) {
    this.initialSavingsDate = date;
  }
}

const savingSpendingStore = new SavingSpendingStore();

export default savingSpendingStore;
