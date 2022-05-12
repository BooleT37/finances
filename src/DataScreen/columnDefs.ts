import type { GridOptions, ICellRendererParams } from 'ag-grid-community';
import Currency from '../models/Currency';
import costToString from './costToString';
import EditButtonRenderer from './EditButtonRenderer';
import RemoveButtonRenderer from './RemoveButtonRenderer';

const columnDefs: GridOptions['columnDefs'] = [
  { field: 'name', width: 200, headerName: 'Имя' },
  {
    field: 'cost',
    width: 150,
    headerName: 'Сумма',
    valueFormatter: params => costToString(params.value),
    aggFunc: (params) => ({
      value: Math.trunc(params.values.reduce((a, c) => a + c.value, 0) * 100) / 100,
      currency: Currency.Eur
    })
  },
  { field: 'date', width: 120, headerName: 'Дата' },
  { field: 'category', rowGroup: true, hide: true, headerName: 'Категория' },
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
