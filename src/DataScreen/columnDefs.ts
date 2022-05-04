import type { GridOptions } from 'ag-grid-community';

const columnDefs: GridOptions['columnDefs'] = [
    { field: 'name' },
    { field: 'cost' },
    { field: 'date' },
    { field: 'category', rowGroup: true, hide: true }
];

export default columnDefs
