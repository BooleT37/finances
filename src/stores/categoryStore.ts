import { action, computed, makeObservable, observable } from "mobx";
import Category, { Option } from "../models/Category";

interface CategoryJson {
  id: number;
  name: string;
  is_income: boolean;
  is_continuous: boolean;
}

class CategoryStore {
  public categories: Category[]

  constructor() {
    makeObservable(
      this,
      {
        categories: observable,
        getByName: false,
        getById: false,
        expenseCategories: computed,
        incomeCategories: computed,
        incomeCategoriesNames: computed,
        expenseOptions: computed,
        incomeOptions: computed,
        isIncomeCategory: false,
        fromJson: action
      })
  }

  getByName(name: string): Category {
    const category = this.categories.find((category) => category.name === name)
    if (!category) {
      throw new Error(`Cannot find category with the name ${name}`)
    }
    return category
  }

  getById(id: number): Category {
    const category = this.categories.find((category) => category.id === id)
    if (!category) {
      throw new Error(`Cannot find category with id ${id}`)
    }
    return category
  }

  get expenseCategories(): Category[] {
    return this.categories.filter(c => !c.isIncome)
  }

  get incomeCategories(): Category[] {
    return this.categories.filter(c => c.isIncome)
  }

  get incomeCategoriesNames(): string[] {
    return this.incomeCategories.map(c => c.name)
  }

  get expenseOptions(): Option[] {
    return this.expenseCategories.map(c => c.asOption)
  }

  get incomeOptions(): Option[] {
    return this.incomeCategories.map(c => c.asOption)
  }

  isIncomeCategory(categoryName: string): boolean {
    return this.incomeCategories.map(c => c.name).includes(categoryName)
  }

  fromJson(json: CategoryJson[]) {
    this.categories = json.map(c => new Category(c.id, c.name, c.is_income, c.is_continuous))
  }
}

const categoryStore = new CategoryStore()

export default categoryStore