import React from 'react';
import { observer } from "mobx-react"
import { Typography, DatePicker, Button, Space } from 'antd';
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
import { Layout } from 'antd';
import styled from 'styled-components';

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Content, Header } = Layout;

const today = moment()

const WhiteHeader = styled(Header)`
  background: white;
`

const StyledContent = styled(Content)`
  margin: 24px 16px;
  padding: 24px;
  background: white;
`

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
      <WhiteHeader className="site-layout-background">
        <Title>Данные</Title>
      </WhiteHeader>
      <StyledContent className="site-layout-background">
        <Space direction="vertical" size="middle">
          <Space size="middle">
            <RangePicker value={[rangeStart, rangeEnd]} onChange={handleRangeChange} />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Добавить</Button>
          </Space>
          <div className='ag-theme-alpine' style={{ height: 500, width: 790 }}>
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
        </Space>
      </StyledContent>
      <ExpenseModal onSubmit={e => { expandCategory(e.category.name) }} />
    </>
  )
})

export default DataScreen