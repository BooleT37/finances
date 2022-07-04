import Category, { Option } from "../models/Category";

interface CategoryJson {
  id: number;
  name: string;
  is_income: boolean;
  is_continuous: boolean;
  shortname: string;
}

// The categories are NOT mutable!
// Having it like this makes using them much more easy
class Categories {
  private categories: Category[]

  getAll(): Category[] {
    return this.categories
  }

  getByNameIfExists(name: string): Category | undefined {
    return this.categories.find((category) => category.name === name)
  }

  getByName(name: string): Category {
    const category = this.getByNameIfExists(name)
    if (!category) {
      throw new Error(`Cannot find category with the name ${name}`)
    }
    return category
  }

  getByIdIfExists(id: number): Category | undefined {
    return this.categories.find((category) => category.id === id)
  }

  getById(id: number): Category {
    const category = this.getByIdIfExists(id)
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

  fromJson(json: CategoryJson[]) {
    this.categories = json.map(
      c => new Category(
        c.id,
        c.name,
        c.shortname,
        c.is_income,
        c.is_continuous
      ))
  }
}

const categoryStore = new Categories()

export default categoryStore