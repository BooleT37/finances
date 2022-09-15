import { groupBy } from "lodash";
import { action, computed, flow, makeObservable, observable } from "mobx";
import moment from "moment";
import { DATE_SERVER_FORMAT } from "../constants";
import Category from "../models/Category";
import Currency from "../models/Currency";
import Subscription, { SubscriptionFormValues } from "../models/Subscription";
import categories from "../readonlyStores/categories";
import sources from "../readonlyStores/sources";
import { SubscriptionsItem } from "./forecastStore/types";

interface SubscriptionJson {
  id: number;
  name: string;
  cost: number;
  currency: Currency;
  category_id: number;
  period: number;
  first_date: string;
  source_id: number | null;
}

const subscriptionToItem = (subscription: Subscription): SubscriptionsItem => ({
  cost: subscription.cost,
  name: subscription.name,
});

class SubscriptionStore {
  subscriptions: Subscription[];

  constructor() {
    makeObservable(this, {
      getSubscriptionsForForecast: false,
      delete: flow,
      subscriptionsMap: computed,
      getById: action,
      getByIdOrThrow: action,
      add: action,
      modify: flow,
      subscriptions: observable,
      formValuesMap: computed,
      getFormValuesByIdOrThrow: action,
      fromJson: action,
      byCategory: computed,
    });
  }

  fromJson(json: SubscriptionJson[]) {
    this.subscriptions = json.map(
      (e) =>
        new Subscription(
          e.id,
          e.name,
          e.cost,
          categories.getById(e.category_id),
          e.period,
          moment(e.first_date),
          e.source_id === null ? null : sources.getById(e.source_id)
        )
    );
  }

  get subscriptionsMap() {
    return this.subscriptions.reduce<Record<string, Subscription>>(
      (a, c) => ({ ...a, [c.id]: c }),
      {}
    );
  }

  get formValuesMap() {
    return this.subscriptions
      .map((s) => s.toFormValues)
      .reduce<Record<string, SubscriptionFormValues>>(
        (a, c) => ({ ...a, [c.id]: c }),
        {}
      );
  }

  getById(id: number) {
    return this.subscriptionsMap[id];
  }

  getByIdOrThrow(id: number) {
    const found = this.subscriptionsMap[id];

    if (!found) {
      throw new Error(`Can't find subscription by id ${id}`);
    }

    return found;
  }

  getFormValuesByIdOrThrow(id: number) {
    const found = this.formValuesMap[id];

    if (!found) {
      throw new Error(`Can't find subscription by id ${id}`);
    }

    return found;
  }

  get byCategory(): Record<string, Subscription[]> {
    return groupBy(this.subscriptions, "category.name");
  }

  async add(subscription: Subscription): Promise<void> {
    this.subscriptions.push(subscription);
    const body: Omit<SubscriptionJson, "id"> = {
      name: subscription.name,
      cost: subscription.cost,
      currency: Currency.Eur,
      category_id: subscription.category.id,
      period: subscription.period,
      first_date: subscription.firstDate.format(DATE_SERVER_FORMAT),
      source_id: subscription.source?.id ?? null,
    };
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/subscription`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }
    );
    const { id } = await response.json();
    subscription.id = id;
  }

  *modify(subscription: Subscription): Generator<Promise<Response>> {
    const foundIndex = this.subscriptions.findIndex(
      (e) => e.id === subscription.id
    );
    if (foundIndex !== -1) {
      this.subscriptions[foundIndex] = subscription;
      const body: SubscriptionJson = {
        id: subscription.id,
        name: subscription.name,
        cost: subscription.cost,
        currency: Currency.Eur,
        category_id: subscription.category.id,
        period: subscription.period,
        first_date: subscription.firstDate.format(DATE_SERVER_FORMAT),
        source_id: subscription.source?.id ?? null,
      };
      yield fetch(`${process.env.REACT_APP_API_URL}/subscription`, {
        method: "PUT",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      });
    } else {
      throw new Error(`Can't find subscription with id ${subscription.id}`);
    }
  }

  *delete(id: number): Generator<Promise<Response>> {
    const foundIndex = this.subscriptions.findIndex((e) => e.id === id);
    if (foundIndex === -1) {
      return;
    }
    this.subscriptions.splice(foundIndex, 1);
    yield fetch(`${process.env.REACT_APP_API_URL}/subscription?id=${id}`, {
      method: "DELETE",
    });
  }

  getSubscriptionsForForecast(
    month: number,
    year: number,
    category: Category | null
  ): SubscriptionsItem[] {
    return this.subscriptions
      .filter(
        (subscription) =>
          (!category || subscription.category.id === category.id) &&
          subscription.isInMonth(month, year)
      )
      .map(subscriptionToItem);
  }
}

const subscriptionStore = new SubscriptionStore();

export default subscriptionStore;
