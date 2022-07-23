import type { ColDef, ColGroupDef } from "ag-grid-community";
import Currency from "../models/Currency";
import { costToString } from "../utils";
import MonthCellRenderer from "./MonthCellRenderer";

const costValueFormatter = ({ value }: { value: number }): string =>
  costToString({ currency: Currency.Eur, value });

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
    width: 120,
    headerName: "План",
    valueFormatter: costValueFormatter,
    editable: true,
  },
  { field: "comment", width: 200, headerName: "Комментарий", editable: true },
];

export default columnDefs;
