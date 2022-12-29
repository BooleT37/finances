import type { ColDef, ColGroupDef } from "ag-grid-community";
import { CATEGORY_IDS } from "../models/Category";
import { sortAllCategories } from "../readonlyStores/categories/categoriesOrder";
import { ForecastTableItem } from "../stores/forecastStore/types";
import { costToString } from "../utils";
import CostCellRenderer from "./CostCellRenderer/CostCellRenderer";
import LastMonthCellRenderer from "./LastMonthCellRenderer";
import ThisMonthCellRenderer from "./ThisMonthCellRenderer";

const costValueFormatter = ({ value }: { value: number }): string =>
  costToString(value);

const columnDefs: (ColDef | ColGroupDef)[] = [
  {
    field: "category",
    sort: "asc",
    width: 250,
    headerName: "Категория",
    tooltipField: "category",
    comparator: (categoryA, _categoryB, nodeA, nodeB) =>
      categoryA === "Всего"
        ? 1
        : sortAllCategories(
            nodeA.data.categoryShortname,
            nodeB.data.categoryShortname
          ),
  },
  {
    field: "average",
    width: 150,
    headerName: "В среднем",
    valueFormatter: costValueFormatter,
    tooltipField: "monthsWithSpendings",
  },
  {
    field: "lastMonth",
    width: 160,
    headerName: "Прошлый месяц",
    cellRenderer: LastMonthCellRenderer,
  },
  {
    field: "sum",
    width: 200,
    headerName: "План",
    cellRenderer: CostCellRenderer,
    valueFormatter: (data) => data.value.value,
    cellEditorParams: {
      useFormatter: true,
    },
    valueParser: (params) => ({
      value: parseFloat(params.newValue),
      subscriptions: params.oldValue.subscriptions,
    }),
    editable: ({ data }) =>
      ![CATEGORY_IDS.total, CATEGORY_IDS.fromSavings].includes(
        (data as ForecastTableItem).categoryId
      ),
  },
  {
    field: "thisMonth",
    width: 160,
    headerName: "Факт",
    cellRenderer: ThisMonthCellRenderer,
  },
  {
    field: "comment",
    width: 200,
    headerName: "Комментарий",
    editable: true,
    tooltipField: "comment",
  },
];

export default columnDefs;
