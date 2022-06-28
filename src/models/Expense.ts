import { computed, makeObservable, observable } from "mobx";
import { Moment } from "moment";
import { DATE_FORMAT } from "../constants";
import Category from "./Category";
import Currency from "./Currency";

export interface CostCol {
  value: number,
  currency: Currency,
  personalExpStr?: string
}

interface TableData {
  id: number
  name: string
  cost: CostCol | null
  date: string
  category: string
  categoryId: number
}

export default class Expense {
  id: number;
  name?: string;
  cost: number | null;
  currency: Currency;
  date: Moment;
  category: Category;
  personalExpense: Expense | null

  constructor(
    id: number,
    cost: number | null,
    currency: Currency,
    date: Moment,
    category: Category,
    name?: string,
    personalExpense: Expense | null = null
  ) {
    makeObservable(this, {
      id: observable,
      cost: observable,
      currency: observable,
      date: observable,
      category: observable,
      personalExpense: observable,
      name: observable,
      asTableData: computed
    })
    this.id = id
    this.cost = cost;
    this.currency = currency;
    this.date = date;
    this.category = category;
    this.name = name
    this.personalExpense = personalExpense
  }

  get asTableData(): TableData {
    return {
      id: this.id,
      name: this.name || '',
      cost: this.cost || this.cost === 0 ? {
        value: this.cost,
        currency: this.currency,
      } : null,
      category: this.category.name,
      date: this.date.format(DATE_FORMAT),
      categoryId: this.category.id
    }
  }
}
