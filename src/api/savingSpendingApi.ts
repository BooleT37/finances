import {
  createApiEndpoint,
  createDeleteApiEndpoint,
  createGetApiEndpoint,
} from "./createApiEndpoint";
export interface SavingSpendingJson {
  id: number;
  name: string;
  completed: boolean;
}

interface AddSavingSpendingRequest {
  name: string;
}

export const savingSpendingApi = {
  getAll: createGetApiEndpoint<SavingSpendingJson[]>("saving-spending"),
  add: createApiEndpoint<AddSavingSpendingRequest, never, { id: number }>(
    "saving-spending",
    "POST"
  ),
  edit: createApiEndpoint<SavingSpendingJson, never, never>(
    "saving-spending",
    "PUT"
  ),
  delete: createDeleteApiEndpoint("saving-spending"),
};
