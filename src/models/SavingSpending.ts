import { makeAutoObservable } from "mobx";
import { isTempId } from "../utils/tempId";
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

  changeName(name: string) {
    this.name = name;
  }

  editCategory(category: SavingSpendingCategory) {
    const index = this.categories.findIndex((c) => c.id === category.id);
    if (index === -1) {
      throw new Error(`Can't find category by id ${category.id}`);
    }
    this.categories[index] = category;
  }

  clone() {
    return new SavingSpending(
      this.id,
      this.name,
      this.completed,
      this.categories.slice()
    );
  }

  getCategoryById(id: number) {
    const found = this.categories.find((c) => c.id === id);
    if (!found) {
      throw new Error(`Can't find category by id ${id}`);
    }

    return found;
  }

  async persistCategories(categories: SavingSpendingCategory[]) {
    const categoriesToSave: SavingSpendingCategory[] = [];
    const categoriesToUpdate: SavingSpendingCategory[] = [];
    const categoriesToDelete: SavingSpendingCategory[] = [];

    for (const category of categories) {
      if (isTempId(category.id)) {
        categoriesToSave.push(category);
      } else {
        const currentCategory = this.getCategoryById(category.id);
        if (!currentCategory.isSame(category)) {
          categoriesToUpdate.push(category);
        }
      }
    }

    for (const category of this.categories) {
      if (!categories.find((c) => c.id === category.id)) {
        categoriesToDelete.push(category);
      }
    }
    this.categories = categories;

    const id = this.id;

    for (const category of categoriesToSave) {
      await category.save(id);
    }

    for (const category of categoriesToUpdate) {
      await category.update(id);
    }

    for (const category of categoriesToDelete) {
      await category.delete();
    }
  }
}
