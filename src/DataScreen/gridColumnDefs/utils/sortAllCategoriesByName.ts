import categories from "../../../readonlyStores/categories";
import { sortAllCategories } from "../../../readonlyStores/categories/categoriesOrder";

export const sortAllCategoriesByName = (
  category1Name: string,
  category2Name: string
) => {
  return sortAllCategories(
    categories.getByName(category1Name).shortname,
    categories.getByName(category2Name).shortname
  );
};
