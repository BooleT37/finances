import type { GridOptions } from 'ag-grid-community';
import EditButtonRenderer from './EditButtonRenderer';

const columnDefs: GridOptions['columnDefs'] = [
    { field: 'name' },
    { field: 'cost' },
    { field: 'date' },
    { field: 'category', rowGroup: true, hide: true },
    {
      field: 'edit',
      headerName: '',
      cellRenderer: EditButtonRenderer
    }
  ];

export default columnDefs
