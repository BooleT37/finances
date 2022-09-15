import { makeAutoObservable } from "mobx";
import { Moment } from "moment";
import { DATE_FORMAT } from "../constants";
import Category from "./Category";
import Source from "./Source";

export interface CostCol {
  value: number;
  personalExpStr?: string;
}

interface TableData {
  id: number;
  name: string;
  cost: CostCol | null;
  date: string;
  category: string;
  categoryId: number;
  categoryShortname: string;
}

export default class Expense {
  id: number;
  name?: string;
  cost: number | null;
  date: Moment;
  category: Category;
  personalExpense: Expense | null;
  source: Source | null;

  constructor(
    id: number,
    cost: number | null,
    date: Moment,
    category: Category,
    name?: string,
    personalExpense: Expense | null = null,
    source: Source | null = null
  ) {
    makeAutoObservable(this);
    this.id = id;
    this.cost = cost;
    this.date = date;
    this.category = category;
    this.personalExpense = personalExpense;
    this.name = name;
    this.source = source;
  }

  get asTableData(): TableData {
    return {
      id: this.id,
      name: this.name || "",
      cost:
        this.cost || this.cost === 0
          ? {
              value: this.cost,
            }
          : null,
      category: this.category.name,
      date: this.date.format(DATE_FORMAT),
      categoryId: this.category.id,
      categoryShortname: this.category.shortname,
    };
  }
}
