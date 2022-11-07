import { groupBy } from "lodash";
import { makeAutoObservable, toJS } from "mobx";
import moment from "moment";
import { api } from "../api";
import { SubscriptionJson } from "../api/subscriptionApi";
import { DATE_SERVER_FORMAT } from "../constants";
import Category from "../models/Category";
import Currency from "../models/Currency";
import Subscription, { SubscriptionFormValues } from "../models/Subscription";
import categories from "../readonlyStores/categories";
import sources from "../readonlyStores/sources";
import { SubscriptionsItem } from "./forecastStore/types";

const subscriptionToItem = (subscription: Subscription): SubscriptionsItem => ({
  cost: subscription.cost,
  name: subscription.name,
});

class SubscriptionStore {
  subscriptions: Subscription[];

  constructor() {
    makeAutoObservable(this);
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
          e.active,
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

  getJsById(id: number) {
    return toJS(this.getById(id));
  }

  getByIdOrThrow(id: number) {
    const found = this.subscriptionsMap[id];

    if (found === undefined) {
      throw new Error(`Can't find subscription by id ${id}`);
    }

    return found;
  }

  getFormValuesByIdOrThrow(id: number) {
    const found = this.formValuesMap[id];

    if (found === undefined) {
      throw new Error(`Can't find subscription by id ${id}`);
    }

    return found;
  }

  get activeSubscriptions() {
    return this.subscriptions.filter((s) => s.active);
  }

  get byCategory(): Record<string, Subscription[]> {
    return groupBy(this.subscriptions, "category.name");
  }

  get activeByCategory(): Record<string, Subscription[]> {
    return groupBy(this.activeSubscriptions, "category.name");
  }

  async add(subscription: Subscription): Promise<void> {
    subscription.active = true;
    this.subscriptions.push(subscription);
    const { id } = await api.subscription.add({
      name: subscription.name,
      cost: subscription.cost,
      currency: Currency.Eur,
      category_id: subscription.category.id,
      period: subscription.period,
      first_date: subscription.firstDate.format(DATE_SERVER_FORMAT),
      active: subscription.active,
      source_id: subscription.source?.id ?? null,
    });
    subscription.id = id;
  }

  *modify(subscription: Subscription): Generator<Promise<Response>> {
    const foundIndex = this.subscriptions.findIndex(
      (e) => e.id === subscription.id
    );
    if (foundIndex !== -1) {
      this.subscriptions[foundIndex] = subscription;
      yield api.subscription.modify({
        id: subscription.id,
        name: subscription.name,
        cost: subscription.cost,
        currency: Currency.Eur,
        category_id: subscription.category.id,
        period: subscription.period,
        first_date: subscription.firstDate.format(DATE_SERVER_FORMAT),
        active: subscription.active,
        source_id: subscription.source?.id ?? null,
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
    yield api.subscription.delete(id);
  }

  getSubscriptionsForForecast(
    month: number,
    year: number,
    category: Category | null
  ): SubscriptionsItem[] {
    return this.activeSubscriptions
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
