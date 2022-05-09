import React from 'react';
import { observer } from "mobx-react"
import { Typography, DatePicker, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import moment, { Moment } from 'moment';
import { AgGridReact } from 'ag-grid-react';
import expenseStore from '../stores/extenseStore';
import columnDefs from './columnDefs';
import ExpenseModal from './ExpenseModal';
import expenseModalStore from './expenseModalStore';
import { action } from 'mobx';
import Expense from '../models/Expense';

const { RangePicker } = DatePicker;

const { Title } = Typography;

const today = moment()

if (!new class { x: any }().hasOwnProperty('x')) throw new Error('Transpiler is not configured correctly');

const DataScreen = observer(function DataScreen() {
  const [rangeStart, setRangeStart] = React.useState<Moment | null>(today.clone().subtract(1, 'months').set('date', 1))
  const [rangeEnd, setRangeEnd] = React.useState<Moment | null>(today.clone().set('date', 1).subtract(1, 'day'))
  const [submittedCategory, setSubmittedCategory] = React.useState<string | null>(null);
  const gridRef = React.useRef<AgGridReact>(null);

  const handleRangeChange = ((dates: [Moment | null, Moment | null] | null) => {
    setRangeStart(dates?.[0] ?? null)
    setRangeEnd(dates?.[1] ?? null)
  })

  const onModalSubmit = React.useCallback((expense: Expense) => {
    setSubmittedCategory(expense.category.name)
  }, [])

  const handleAdd = action(() => { expenseModalStore.open(expenseStore.nextId); })

  React.useEffect(() => {
    if (submittedCategory) {
      if (!gridRef.current) {
        return
      }
      gridRef.current.api.forEachNode(node => {
        if (node.key === submittedCategory) {
          node.setExpanded(true);
        }
      })
      setSubmittedCategory(null)
  }
}, [submittedCategory])

  return (
    <>
      <Title>Экран данных</Title>
      <RangePicker value={[rangeStart, rangeEnd]} onChange={handleRangeChange} />
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Добавить</Button>
      <div className='ag-theme-alpine' style={{ height: 500 }}>
        <AgGridReact ref={gridRef} rowData={expenseStore.tableData} columnDefs={columnDefs} />
      </div>
      <ExpenseModal onSubmit={onModalSubmit} />
    </>
  )
})

export default DataScreen