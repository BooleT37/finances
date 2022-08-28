import { computed, makeObservable, observable } from "mobx";
import moment from "moment";
import { Moment } from "moment";
import { costToString } from "../utils";
import Category from "./Category";
import Currency from "./Currency";
import Source from "./Source";

const today = moment();

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
  currency: Currency;
  category: Category;
  period: number;
  firstDate: Moment;
  source: Source | null;

  constructor(
    id: number,
    name: string,
    cost: number,
    currency: Currency,
    category: Category,
    period: number,
    firstDate: Moment,
    source: Source | null = null
  ) {
    makeObservable(this, {
      id: observable,
      name: observable,
      cost: observable,
      currency: observable,
      category: observable,
      period: observable,
      firstDate: observable,
      source: observable,
      costString: computed,
      nextDate: computed,
    });
    this.id = id;
    this.name = name;
    this.cost = cost;
    this.currency = currency;
    this.category = category;
    this.period = period;
    this.firstDate = firstDate;
    this.source = source;
  }

  get costString(): string {
    return `${costToString({ value: this.cost })}/${Subscription.periodToString(
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
}
