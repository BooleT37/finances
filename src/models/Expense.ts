import { makeAutoObservable } from "mobx";
import { Moment } from "moment";
import { DATE_FORMAT } from "../constants";
import Category from "./Category";
import SavingSpending from "./SavingSpending";
import SavingSpendingCategory from "./SavingSpendingCategory";
import Source from "./Source";
import Subscription from "./Subscription";

export interface CostCol {
  value: number;
  personalExpStr?: string;
  isSubscription?: boolean;
  isUpcomingSubscription?: boolean;
}

export interface TableData {
  id: number;
  name: string;
  cost: CostCol | null;
  date: string;
  category: string;
  categoryId: number;
  categoryShortname: string;
  isUpcomingSubscription: boolean;
}

export default class Expense {
  id: number;
  name?: string;
  cost: number | null;
  date: Moment;
  category: Category;
  personalExpense: Expense | null;
  source: Source | null;
  subscription: Subscription | null;
  savingSpending: {
    spending: SavingSpending;
    category: SavingSpendingCategory;
  } | null;

  constructor(
    id: number,
    cost: number | null,
    date: Moment,
    category: Category,
    name?: string,
    personalExpense: Expense | null = null,
    source: Source | null = null,
    subscription: Subscription | null = null,
    savingSpending: {
      spending: SavingSpending;
      category: SavingSpendingCategory;
    } | null = null
  ) {
    makeAutoObservable(this);
    this.id = id;
    this.cost = cost;
    this.date = date;
    this.category = category;
    this.personalExpense = personalExpense;
    this.name = name;
    this.source = source;
    this.subscription = subscription;
    this.savingSpending = savingSpending;
  }

  get asTableData(): TableData {
    return {
      id: this.id,
      name: this.name || "",
      cost:
        this.cost || this.cost === 0
          ? {
              value: this.cost,
              isSubscription: this.subscription !== null,
              isUpcomingSubscription: false,
            }
          : null,
      category: this.category.name,
      date: this.date.format(DATE_FORMAT),
      categoryId: this.category.id,
      categoryShortname: this.category.shortname,
      isUpcomingSubscription: false,
    };
  }
}
