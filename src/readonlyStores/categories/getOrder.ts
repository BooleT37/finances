import Category from "../../models/Category";
import { PersonalExpCategoryIds } from "../../utils/constants";

export default function getOrder(
  categories: Category[]
): Record<number, number> {
  const categoriesIds = categories.map((c) => c.id).sort();
  const lenaIndex = categoriesIds.indexOf(PersonalExpCategoryIds.Lena);
  const leshaIndex = categoriesIds.indexOf(PersonalExpCategoryIds.Alexey);

  categoriesIds.splice(lenaIndex, 1);
  categoriesIds.splice(leshaIndex, 1);
  categoriesIds.push(PersonalExpCategoryIds.Lena);
  categoriesIds.push(PersonalExpCategoryIds.Alexey);

  const order: Record<number, number> = {};

  categoriesIds.forEach((id, index) => {
    order[id] = index;
  });
  return order;
}
