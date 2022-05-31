import type { GridOptions } from 'ag-grid-community';

const columnDefs: GridOptions['columnDefs'] = [
  { field: 'category', width: 150, headerName: 'Категория' },
  { field: 'average', width: 120, headerName: 'Среднее' },
  { field: 'lastMonth', width: 160, headerName: 'Прошлый месяц' },
  { field: 'sum', width: 120, headerName: 'Сумма', editable: true },
  { field: 'comment', width: 200, headerName: 'Комментарий', editable: true },
];

export default columnDefs
