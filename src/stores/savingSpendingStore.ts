import { makeAutoObservable } from "mobx";
import SavingSpending from "../models/SavingSpending";
import SavingSpendingCategory from "../models/SavingSpendingCategory";

interface SavingSpendingJson {
  id: number;
  name: string;
  completed: boolean;
}

interface SavingSpendingCategoryJson {
  id: number;
  name: string;
  forecast: number;
  comment: string;
  saving_spending_id: number;
}

class SavingSpendingStore {
  savingSpendings: SavingSpending[];

  constructor() {
    makeAutoObservable(this);
  }

  fromJson(
    json: SavingSpendingJson[],
    categories: SavingSpendingCategoryJson[]
  ) {
    this.savingSpendings = json.map(
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
    this.savingSpendings.push(spending);

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/saving-spending`,
      {
        method: "POST",
        body: JSON.stringify({
          name: spending.name,
        }),
        headers: {
          "content-type": "application/json",
        },
      }
    );

    const { id } = await response.json();

    for (let category of spending.categories) {
      await fetch(`${process.env.REACT_APP_API_URL}/saving-spending-category`, {
        method: "POST",
        body: JSON.stringify({
          name: category.name,
          forecast: category.forecast,
          comment: category,
          saving_spending_id: id,
        }),
        headers: {
          "content-type": "application/json",
        },
      });
    }
  }
}

const savingSpendingStore = new SavingSpendingStore();

export default savingSpendingStore;
