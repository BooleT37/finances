import { computed, makeObservable, observable } from "mobx";
import { Moment } from "moment";
import { DATE_FORMAT } from "../constants";
import Category from "./Category";
import Currency from "./Currency";

export interface CostCol {
  value: number,
  currency: Currency,
  categoryId: number,
  isIncome: boolean
}

interface TableData {
  id: number
  name: string
  cost: CostCol | null
  date: string
  category: string
  isIncome: boolean
}

export default class Expense {
  id: number;
  name?: string;
  cost: number | null;
  currency: Currency;
  date: Moment;
  category: Category;

  constructor(
    id: number,
    cost: number | null,
    currency: Currency,
    date: Moment,
    category: Category,
    name?: string
  ) {
    makeObservable(this, {
      id: observable,
      cost: observable,
      currency: observable,
      date: observable,
      category: observable,
      name: observable,
      asTableData: computed
    })
    this.id = id
    this.cost = cost;
    this.currency = currency;
    this.date = date;
    this.category = category;
    this.name = name
  }

  get asTableData(): TableData {
    return {
      id: this.id,
      name: this.name || '',
      cost: this.cost || this.cost === 0 ? {
        value: this.cost,
        currency: this.currency,
        categoryId: this.category.id,
        isIncome: this.category.isIncome
      } : null,
      category: this.category.name,
      date: this.date.format(DATE_FORMAT),
      isIncome: this.category.isIncome
    }
  }
}
