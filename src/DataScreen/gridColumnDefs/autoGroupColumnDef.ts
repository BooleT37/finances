import { ColDef } from "ag-grid-enterprise";

const autoGroupColumnDef: ColDef = {
  headerName: "Категория",
  minWidth: 370,
  resizable: true,
  cellRendererParams: {
    footerValueGetter: (params: { value: string }) => `Всего (${params.value})`,
  },
};

export default autoGroupColumnDef;
