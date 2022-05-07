import { makeObservable, observable } from "mobx";
import Category, { Option } from "../models/Category";

class CategoryStore {
  public categories: Category[]

  constructor(categories: Category[]) {
    makeObservable(
      this,
      {
        categories: observable,
        getByName: false,
        asOptions: false
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

  get asOptions(): Option[] {
    return this.categories.map(c => c.asOption)
  }
}

const fakeCategories: Category[] = [
  new Category(1, 'Подписки'),
  new Category(2, 'Рестораны'),
  new Category(3, 'Еда'),
  new Category(4, 'Аренда'),
]

const categoryStore = new CategoryStore(fakeCategories)

export default categoryStore