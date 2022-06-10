import type { GridOptions } from 'ag-grid-community';
import Currency from '../models/Currency';
import { costToString } from '../utils';

const costValueFormatter = ({ value }: { value: number }): string => costToString({ currency: Currency.Eur, value })

const columnDefs: GridOptions['columnDefs'] = [
  { field: 'category', width: 150, headerName: 'Категория' },
  {
    field: 'average',
    width: 150,
    headerName: 'В среднем',
    valueFormatter: costValueFormatter,
    tooltipField: 'monthsWithSpendings'
  },
  { field: 'lastMonth', width: 160, headerName: 'Прошлый месяц', valueFormatter: costValueFormatter },
  { field: 'thisMonth', width: 160, headerName: 'Этот месяц', valueFormatter: costValueFormatter },
  { field: 'sum', width: 120, headerName: 'План', valueFormatter: costValueFormatter, editable: true },
  { field: 'comment', width: 200, headerName: 'Комментарий', editable: true },
];

export default columnDefs
