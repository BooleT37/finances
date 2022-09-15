import type { ColDef, ColGroupDef } from "ag-grid-community";
import CostCellRenderer from "./CostCellRenderer/CostCellRenderer";
import { costToString } from "../utils";
import MonthCellRenderer from "./MonthCellRenderer";

const costValueFormatter = ({ value }: { value: number }): string =>
  costToString(value);

const columnDefs: (ColDef | ColGroupDef)[] = [
  { field: "category", width: 220, headerName: "Категория" },
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
    cellRenderer: MonthCellRenderer,
  },
  {
    field: "thisMonth",
    width: 160,
    headerName: "Факт",
    cellRenderer: MonthCellRenderer,
  },
  {
    field: "sum",
    width: 180,
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
    editable: true,
  },
  { field: "comment", width: 200, headerName: "Комментарий", editable: true },
];

export default columnDefs;
