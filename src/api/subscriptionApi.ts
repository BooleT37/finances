import Currency from "../models/Currency";
import {
  createApiEndpoint,
  createDeleteApiEndpoint,
  createGetApiEndpoint,
} from "./createApiEndpoint";

export interface SubscriptionJson {
  id: number;
  name: string;
  cost: number;
  currency: Currency;
  category_id: number;
  period: number;
  first_date: string;
  source_id: number | null;
}

type AddSubscriptionRequest = Omit<SubscriptionJson, "id">;

export const subscriptionApi = {
  getAll: createGetApiEndpoint<SubscriptionJson[]>("subscription"),
  add: createApiEndpoint<AddSubscriptionRequest, never, { id: number }>(
    "subscription",
    "POST"
  ),
  modify: createApiEndpoint<SubscriptionJson, never, never>(
    "subscription",
    "PUT"
  ),
  delete: createDeleteApiEndpoint("subscription"),
};
