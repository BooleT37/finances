import Currency from "../models/Currency";
import {
  createApiEndpoint,
  createDeleteApiEndpoint,
  createGetApiEndpoint,
} from "./createApiEndpoint";

export interface ExpenseJson {
  id: number;
  name?: string;
  cost: number | null;
  currency: Currency;
  date: string;
  category_id: number;
  personal_expense_id: number | null;
  source_id: number | null;
  subscription_id: number | null;
}

export const expenseApi = {
  delete: createDeleteApiEndpoint("expense"),
  getAll: createGetApiEndpoint<ExpenseJson[]>("expense"),
  add: createApiEndpoint<ExpenseJson, never>("expense", "POST"),
  modify: createApiEndpoint<ExpenseJson, never>("expense", "PUT"),
};
