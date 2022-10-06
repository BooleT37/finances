import {
  createApiEndpoint,
  createDeleteApiEndpoint,
  createGetApiEndpoint,
} from "./createApiEndpoint";

export interface SavingSpendingCategoryJson {
  id: number;
  name: string;
  forecast: number;
  comment: string;
  saving_spending_id: number;
}

type AddSavingSpendingCategoryRequest = Omit<SavingSpendingCategoryJson, "id">;

export const savingSpendingCategoryApi = {
  getAll: createGetApiEndpoint<SavingSpendingCategoryJson[]>(
    "saving-spending-category"
  ),
  add: createApiEndpoint<
    AddSavingSpendingCategoryRequest,
    never,
    { id: number }
  >("saving-spending-category", "POST"),
  modify: createApiEndpoint<SavingSpendingCategoryJson, never, never>(
    "saving-spending-category",
    "PUT"
  ),
  delete: createDeleteApiEndpoint("saving-spending-category"),
};
