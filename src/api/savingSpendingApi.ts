import {
  createApiEndpoint,
  createApiEndpointWithResponse,
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
  add: createApiEndpointWithResponse<
    AddSavingSpendingRequest,
    never,
    { id: number }
  >("saving-spending", "POST"),
  edit: createApiEndpoint<SavingSpendingJson, never>("saving-spending", "PUT"),
  delete: createDeleteApiEndpoint("saving-spending"),
  toggle: createApiEndpoint<{ completed: boolean }, { id: number }>(
    "saving-spending/toggle",
    "PATCH"
  ),
};
