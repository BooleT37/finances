import { sum } from "lodash";
import { makeAutoObservable, runInAction } from "mobx";
import { api } from "../api";
import { RecordType } from "../SavingSpendingsScreen/SavingSpendingCard";
import expenseStore from "../stores/expenseStore";
import type { Option } from "../types";
import { isTempId } from "../utils/tempId";

export default class SavingSpendingCategory {
  id: number;
  name: string;
  forecast: number;
  comment: string;

  constructor(id: number, name: string, forecast: number, comment: string) {
    makeAutoObservable(this);

    this.id = id;
    this.name = name;
    this.forecast = forecast;
    this.comment = comment;
  }

  get asTableRecord(): RecordType {
    return {
      id: String(this.id),
      expenses: this.expenses,
      forecast: this.forecast,
      name: this.name,
    };
  }

  get expenses() {
    return sum(
      expenseStore.expenses
        .filter(
          (e) => e.savingSpending && e.savingSpending.category.id === this.id
        )
        .map((e) => e.cost ?? 0)
    );
  }

  isSame(anotherCategory: SavingSpendingCategory) {
    return (
      this.id === anotherCategory.id &&
      this.name === anotherCategory.name &&
      this.forecast === anotherCategory.forecast &&
      this.comment === anotherCategory.comment
    );
  }

  async save(savingSpendingId: number) {
    if (!isTempId(this.id)) {
      throw new Error(`Can't save the category ${this.name}: already exist`);
    }

    const { id } = await api.savingSpendingCategory.add({
      name: this.name,
      forecast: this.forecast,
      comment: this.comment,
      saving_spending_id: savingSpendingId,
    });

    runInAction(() => {
      this.id = id;
    });
  }

  async update(savingSpendingId: number) {
    if (isTempId(this.id)) {
      throw new Error(
        `Can't update the category ${this.name}: doesn't exist yet`
      );
    }

    await api.savingSpendingCategory.modify({
      id: this.id,
      name: this.name,
      forecast: this.forecast,
      comment: this.comment,
      saving_spending_id: savingSpendingId,
    });
  }

  async delete() {
    if (isTempId(this.id)) {
      throw new Error(
        `Can't update the category ${this.name}: doesn't exist yet`
      );
    }

    await api.savingSpendingCategory.delete(this.id);
  }

  get asOption(): Option {
    return {
      value: this.id,
      label: this.name,
    };
  }
}
