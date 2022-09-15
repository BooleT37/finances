import { computed, makeObservable, observable } from "mobx";
import moment from "moment";
import { Moment } from "moment";
import { costToString } from "../utils";
import Category from "./Category";
import Source from "./Source";

const today = moment();

export interface SubscriptionFormValues {
  id: number;
  name: string;
  cost: string;
  category: string | null;
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
  source: Source | null;

  constructor(
    id: number,
    name: string,
    cost: number,
    category: Category,
    period: number,
    firstDate: Moment,
    source: Source | null = null
  ) {
    makeObservable(this, {
      id: observable,
      name: observable,
      cost: observable,
      category: observable,
      period: observable,
      firstDate: observable,
      source: observable,
      costString: computed,
      nextDate: computed,
      toFormValues: computed,
      isInMonth: false,
    });

    this.id = id;
    this.name = name;
    this.cost = cost;
    this.category = category;
    this.period = period;
    this.firstDate = firstDate;
    this.source = source;
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
      category: this.category.name || null,
      period: this.period,
      firstDate: this.firstDate,
      source: this.source?.id ?? null,
    };
  }

  isInMonth(month: number, year: number): boolean {
    const date = moment({ year, month });
    const iDate = this.firstDate.clone();
    while (iDate.isBefore(date, "month")) {
      iDate.add(this.period, "months");
    }
    return date.isSame(iDate, "month");
  }
}
