import React from 'react';
import { observer } from "mobx-react"
import { Typography, DatePicker, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import moment, { Moment } from 'moment';
import { AgGridReact } from 'ag-grid-react';
import expenseStore from '../stores/expenseStore';
import columnDefs from './columnDefs';
import ExpenseModal from './ExpenseModal';
import expenseModalStore from './expenseModalStore';
import { action } from 'mobx';
import getRowStyle from './getRowStyle';
import autoGroupColumnDef from './autoGroupColumnDef';

const { RangePicker } = DatePicker;

const { Title } = Typography;

const today = moment()

const DataScreen = observer(function DataScreen() {
  const [rangeStart, setRangeStart] = React.useState<Moment | null>(today.clone().subtract(1, 'months').set('date', 1))
  const [rangeEnd, setRangeEnd] = React.useState<Moment | null>(today.clone().set('date', 1).subtract(1, 'day'))
  const gridRef = React.useRef<AgGridReact>(null);

  const handleRangeChange = ((dates: [Moment | null, Moment | null] | null) => {
    setRangeStart(dates?.[0] ?? null)
    setRangeEnd(dates?.[1] ?? null)
  })

  const expandCategory = React.useCallback((category: string) => {
      setTimeout(() => {
        if (!gridRef.current) {
          return
        }
        gridRef.current.api.forEachNode(node => {
          if (node.key === category) {
            node.setExpanded(true);
          }
        })
      }, 0)
    }, [])

  const handleAdd = action(() => { expenseModalStore.open(expenseStore.nextId); })

  return (
    <>
      <Title>Экран данных</Title>
      <RangePicker value={[rangeStart, rangeEnd]} onChange={handleRangeChange} />
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Добавить</Button>
      <div className='ag-theme-alpine' style={{ height: 500, width: 765 }}>
        <AgGridReact
          ref={gridRef}
          rowData={expenseStore.tableData}
          columnDefs={columnDefs}
          context={{ expandCategory }}
          getRowStyle={getRowStyle}
          groupIncludeFooter
          suppressAggFuncInHeader
          autoGroupColumnDef={autoGroupColumnDef}
        />
      </div>
      <ExpenseModal onSubmit={e => { expandCategory(e.category.name) }}/>
    </>
  )
})

export default DataScreen