import type { GridOptions, ICellRendererParams } from "ag-grid-community";
import EditButtonRenderer from "../buttonRenderers/EditButtonRenderer";
import RemoveButtonRenderer from "../buttonRenderers/RemoveButtonRenderer";
import { DeleteHeaderIcon, EditHeaderIcon } from "../headerIcons";
import CostCellRenderer from "./CostCellRenderer";
import { costAggFunc } from "./utils";
import { sortAllCategoriesByName } from "./utils/sortAllCategoriesByName";

const columnDefs: GridOptions["columnDefs"] = [
  {
    field: "cost",
    width: 150,
    headerName: "Сумма",
    aggFunc: costAggFunc,
    cellRenderer: CostCellRenderer,
  },
  { field: "name", width: 200, headerName: "Имя" },
  { field: "date", width: 120, headerName: "Дата" },
  {
    field: "category",
    rowGroup: true,
    hide: true,
    headerName: "Категория",
    sort: "asc",
    comparator: (_categoryA, _categoryB, nodeA, nodeB) =>
      nodeA.group && nodeB.group
        ? sortAllCategoriesByName(nodeA.key ?? "", nodeB.key ?? "")
        : 0,
  },
  {
    field: "edit",
    headerName: "",
    headerComponent: EditHeaderIcon,
    cellRenderer: EditButtonRenderer,
    width: 50,
    cellStyle: {
      paddingLeft: 5,
      paddingRight: 0,
    },
  },
  {
    field: "remove",
    headerName: "",
    headerComponent: DeleteHeaderIcon,
    cellRendererSelector: (params: ICellRendererParams) => {
      // if it's a group row
      if (!params.data) {
        return;
      }
      return {
        component: RemoveButtonRenderer,
        params: {
          id: parseInt(params.data.id),
          onClick: () => {
            params.context.expandCategory(params.data.category);
          },
        },
      };
    },
    width: 50,
    cellStyle: {
      paddingLeft: 5,
      paddingRight: 0,
    },
  },
];

export default columnDefs;
