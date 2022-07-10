import Forecast from "../../../models/Forecast";
import { PersonalExpCategoryIds } from "../../../utils/constants";

export default function sortForecastsForView(data: Forecast[]): Forecast[] {
  return data.sort((a, b) => {
    if (a.category.id === PersonalExpCategoryIds.Lena) {
      return 1;
    }
    if (a.category.id === PersonalExpCategoryIds.Alexey) {
      return b.category.id === PersonalExpCategoryIds.Lena ? -1 : 1;
    }
    return a.category.id - b.category.id;
  });
}
