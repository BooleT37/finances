import { computed, makeObservable, observable } from "mobx";
import Category, { Option } from "../models/Category";

class CategoryStore {
  public categories: Category[]

  constructor(categories: Category[]) {
    makeObservable(
      this,
      {
        categories: observable,
        getByName: false,
        expenseCategories: computed,
        incomeCategories: computed,
        incomeCategoriesNames: computed,
        expenseOptions: computed,
        incomeOptions: computed,
        isIncomeCategory: false,
      })
    this.categories = categories
  }

  getByName(name: string): Category {
    const category = this.categories.find((category) => category.name === name)
    if (!category) {
      throw new Error(`Cannot find category with the name ${name}`)
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
}

const fakeCategories: Category[] = [
  new Category(1, 'Подписки'),
  new Category(2, 'Рестораны'),
  new Category(3, 'Еда'),
  new Category(4, 'Аренда'),
  new Category(5, 'Зарплата', true),
  new Category(6, 'Прочие доходы', true)
]

const categoryStore = new CategoryStore(fakeCategories)

export default categoryStore