import { createGetApiEndpoint } from "./createApiEndpoint";

export interface CategoryJson {
  id: number;
  name: string;
  is_income: boolean;
  is_continuous: boolean;
  shortname: string;
}

export const categoryApi = {
  getAll: createGetApiEndpoint<CategoryJson[]>("category"),
};
