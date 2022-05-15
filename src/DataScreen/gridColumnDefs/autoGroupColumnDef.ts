import { ColDef } from "ag-grid-enterprise";

const autoGroupColumnDef: ColDef = { 
  cellRendererParams: {
      footerValueGetter: (params: { value: string }) =>`Всего (${params.value})`
  }
};

export default autoGroupColumnDef