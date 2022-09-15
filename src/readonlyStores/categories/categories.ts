import Category from "../../models/Category";
import type { Option } from "../../types";
import {
  sortAllCategories,
  sortExpenseCategories,
  sortIncomeCategories,
} from "./categoriesOrder";

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
  private categories: Category[];
  public expenseCategories: Category[];
  public nonPersonalExpenseCategories: Category[];
  public personalExpensesCategories: Category[];
  public incomeCategories: Category[];
  public incomeCategoriesNames: string[];
  public options: Option[];
  public expenseOptions: Option[];
  public incomeOptions: Option[];
  public expenseAcOptions: Option[];
  public incomeAcOptions: Option[];

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

  fromJson(json: CategoryJson[]) {
    this.categories = json
      .map(
        (c) =>
          new Category(c.id, c.name, c.shortname, c.is_income, c.is_continuous)
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

    this.nonPersonalExpenseCategories = this.expenseCategories.filter(
      (c) => !c.isPersonal
    );
    this.personalExpensesCategories = this.expenseCategories.filter(
      (c) => c.isPersonal
    );
    this.incomeCategoriesNames = this.incomeCategories.map((c) => c.name);
    this.options = this.categories.map((c) => c.asOption);
    this.expenseOptions = this.expenseCategories.map((c) => c.asOption);
    this.incomeOptions = this.incomeCategories.map((c) => c.asOption);
    this.expenseAcOptions = this.expenseCategories.map(
      (c) => c.asAutocompleteOption
    );
    this.incomeAcOptions = this.incomeCategories.map(
      (c) => c.asAutocompleteOption
    );
  }
}

const categories = new Categories();

export default categories;
