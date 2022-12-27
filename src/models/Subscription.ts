import { makeAutoObservable } from "mobx";
import moment, { Moment } from "moment";
import { api } from "../api";
import { costToString } from "../utils";
import Category from "./Category";
import Source from "./Source";

const today = moment();

export interface SubscriptionFormValues {
  id: number;
  name: string;
  cost: string;
  categoryId: number | null;
  period: number;
  firstDate: Moment | null;
  source: number | null;
}

export default class Subscription {
  static periodToString(period: number): string {
    if (period === 1) {
      return "мес";
    }
    if (period === 3) {
      return "квартал";
    }
    if (period === 12) {
      return "год";
    }
    return `${period} мес`;
  }

  id: number;
  name: string;
  cost: number;
  category: Category;
  period: number;
  firstDate: Moment;
  active: boolean;
  source: Source | null;

  constructor(
    id: number,
    name: string,
    cost: number,
    category: Category,
    period: number,
    firstDate: Moment,
    active: boolean,
    source: Source | null = null
  ) {
    makeAutoObservable(this);

    this.id = id;
    this.name = name;
    this.cost = cost;
    this.category = category;
    this.period = period;
    this.firstDate = firstDate;
    this.source = source;
    this.active = active;
  }

  get costString(): string {
    return `${costToString(this.cost)}/${Subscription.periodToString(
      this.period
    )}`;
  }

  get nextDate(): Moment {
    const date = this.firstDate.clone();
    while (date.isBefore(today, "day")) {
      date.add(this.period, "months");
    }
    return date;
  }

  get toFormValues(): SubscriptionFormValues {
    return {
      id: this.id,
      name: this.name,
      cost: String(this.cost),
      categoryId: this.category.id ?? null,
      period: this.period,
      firstDate: this.firstDate,
      source: this.source?.id ?? null,
    };
  }

  async setActive(active: boolean) {
    this.active = active;

    return api.subscription.toggle({ active }, { id: this.id });
  }

  isInMonth(month: number, year: number): boolean {
    const date = moment({ year, month });
    const iDate = this.firstDate.clone();
    while (iDate.isBefore(date, "month")) {
      iDate.add(this.period, "months");
    }
    return date.isSame(iDate, "month");
  }

  firstDateInInterval(startDate: Moment, endDate: Moment): Moment | null {
    const iDate = this.firstDate.clone();
    while (iDate.isBefore(startDate, "day")) {
      iDate.add(this.period, "months");
    }
    if (iDate.isBetween(startDate, endDate, "day", "[]")) {
      return iDate;
    }
    return null;
  }
}
