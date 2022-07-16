import Forecast from "../../../models/Forecast";
import categories from "../../../readonlyStores/categories/categories";

export default function sortForecastsForView(data: Forecast[]): Forecast[] {
  return data.sort(
    (a, b) => categories.order[a.category.id] - categories.order[b.category.id]
  );
}
