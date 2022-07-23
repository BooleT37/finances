import { ColDef, ColGroupDef } from "ag-grid-community";
import columnDefs from "./columnDefs";
import TransferPeButtonRenderer from "./TransferPeButtonRenderer";

const personalExpensesColumnDefs: (ColDef | ColGroupDef)[] = columnDefs.concat({
  field: "actions",
  width: 70,
  headerName: "",
  cellRenderer: TransferPeButtonRenderer,
});

export default personalExpensesColumnDefs;
