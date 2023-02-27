import { CategoryJson } from "../../api/categoryApi";
import { SubcategoryJson } from "../../api/subcategoryApi";
import Category from "../../models/Category";
import Subcategory from "../../models/Subcategory";
import type { Option } from "../../types";
import {
  sortAllCategories,
  sortExpenseCategories,
  sortIncomeCategories
} from "./categoriesOrder";

// The categories are NOT mutable!
// Having it like this makes using them much more easy
class Categories {
  private categories: Category[];
  public expenseCategories: Category[];
  public generalExpenseCategories: Category[]; // not personal and not savings
  public personalExpensesCategories: Category[];
  public incomeCategories: Category[];
  public savingsCategories: Category[];
  public incomeCategoriesNames: string[];
  public options: Option[];
  public expenseOptions: Option[];
  public incomeOptions: Option[];

  getAll(): Category[] {
    return this.categories;
  }

  getByNameIfExists(name: string): Category | undefined {
    return this.categories.find((category) => category.name === name);
  }

  getByName(name: string): Category {
    const category = this.getByNameIfExists(name);
    if (!category) {
      throw new Error(`Cannot find category with the name ${name}`);
    }
    return category;
  }

  getByIdIfExists(id: number): Category | undefined {
    return this.categories.find((category) => category.id === id);
  }

  getById(id: number): Category {
    const category = this.getByIdIfExists(id);
    if (!category) {
      throw new Error(`Cannot find category with id ${id}`);
    }
    return category;
  }

  fromJson(json: CategoryJson[], subcategories: SubcategoryJson[]) {
    this.categories = json
      .map(
        (c) => {
          const subcategoriesModels = subcategories.filter(s => s.category_id === c.id).map(s => new Subcategory(s.id, s.name))
          return new Category(c.id, c.name, c.shortname, c.is_income, c.is_continuous, subcategoriesModels)
        }
      )
      .sort((c1, c2) => sortAllCategories(c1.shortname, c2.shortname));
    this.calculateDerivations();
  }

  calculateDerivations() {
    this.expenseCategories = this.categories
      .filter((c) => !c.isIncome)
      .sort((c1, c2) => sortExpenseCategories(c1.shortname, c2.shortname));

    this.incomeCategories = this.categories
      .filter((c) => c.isIncome)
      .sort((c1, c2) => sortIncomeCategories(c1.shortname, c2.shortname));

    this.generalExpenseCategories = this.expenseCategories.filter(
      (c) => !c.isPersonal && !c.isSavings
    );
    this.personalExpensesCategories = this.expenseCategories.filter(
      (c) => c.isPersonal
    );
    this.savingsCategories = this.expenseCategories.filter((c) => c.isSavings);
    this.incomeCategoriesNames = this.incomeCategories.map((c) => c.name);
    this.options = this.categories.map((c) => c.asOption);
    this.expenseOptions = this.expenseCategories.map((c) => c.asOption);
    this.incomeOptions = this.incomeCategories.map((c) => c.asOption);
  }
}

const categories = new Categories();

export default categories;
