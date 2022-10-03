import { makeAutoObservable } from "mobx";
import SavingSpendingCategory from "./SavingSpendingCategory";

export default class SavingSpending {
  id: number;
  name: string;
  completed: boolean;
  categories: SavingSpendingCategory[];

  constructor(
    id: number,
    name: string,
    completed: boolean,
    categories: SavingSpendingCategory[]
  ) {
    makeAutoObservable(this);

    this.id = id;
    this.name = name;
    this.completed = completed;
    this.categories = categories;
  }

  get nextLocalId() {
    for (let id = -1; ; id--)
      if (!this.categories.some((c) => c.id === id)) {
        return id;
      }
  }

  changeName(name: string) {
    this.name = name;
  }

  addEmptyCategory() {
    this.categories.push(
      new SavingSpendingCategory(this.nextLocalId, "", 0, "")
    );
  }

  editCategory(category: SavingSpendingCategory) {
    const index = this.categories.findIndex((c) => c.id === category.id);
    if (index === -1) {
      throw new Error(`Can't find category by id ${category.id}`);
    }
    this.categories[index] = category;
  }
}
