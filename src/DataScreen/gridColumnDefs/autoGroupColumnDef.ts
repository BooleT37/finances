import { ColDef } from "ag-grid-enterprise";

const autoGroupColumnDef: ColDef = {
  headerName: "Категория",
  minWidth: 300,
  cellRendererParams: {
    footerValueGetter: (params: { value: string }) => `Всего (${params.value})`,
  },
};

export default autoGroupColumnDef;
