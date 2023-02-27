import { createGetApiEndpoint } from "./createApiEndpoint";

export interface SubcategoryJson {
  id: number;
  name: string;
  category_id: number;
}

export const subcategoryApi = {
  getAll: createGetApiEndpoint<SubcategoryJson[]>("subcategory"),
};
