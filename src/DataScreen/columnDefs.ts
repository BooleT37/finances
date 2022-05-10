import type { GridOptions, ICellRendererParams } from 'ag-grid-community';
import EditButtonRenderer from './EditButtonRenderer';
import RemoveButtonRenderer from './RemoveButtonRenderer';

const columnDefs: GridOptions['columnDefs'] = [
  { field: 'name' },
  { field: 'cost' },
  { field: 'date' },
  { field: 'category', rowGroup: true, hide: true },
  {
    field: 'edit',
    headerName: '',
    cellRenderer: EditButtonRenderer,
    width: 70
  },
  {
    field: 'remove',
    headerName: '',
    cellRendererSelector: (params: ICellRendererParams) => {
      // if it's a group row
      if (!params.data) {
        return
      }
      return {
        component: RemoveButtonRenderer,
        params: {
          id: parseInt(params.data.id),
          onClick: () => { params.context.expandCategory(params.data.category) }
        }
      }
    },
    width: 70
  },
];

export default columnDefs
