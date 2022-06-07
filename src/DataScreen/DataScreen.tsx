import React from 'react';
import { observer } from "mobx-react"
import { Typography, DatePicker, Button, Space } from 'antd';
import { PlusOutlined, SwapOutlined } from '@ant-design/icons';
import moment, { Moment } from 'moment';
import { AgGridReact } from 'ag-grid-react';
import expenseStore from '../stores/expenseStore';
import columnDefs from './gridColumnDefs/columnDefs';
import ExpenseModal from './ExpenseModal';
import expenseModalStore from './expenseModalStore';
import { action } from 'mobx';
import { getRowStyle, resetTime, setTimeToMax } from './utils';
import autoGroupColumnDef from './gridColumnDefs/autoGroupColumnDef';
import WhiteHeader from '../WhiteHeader';
import SiteContent from '../SiteContent';
import styled from 'styled-components';
import { DATE_FORMAT } from '../constants';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const today = moment()

const DateTypeButton = styled(Button)`
  padding-left: 0
`

const DataScreen = observer(function DataScreen() {
  const [rangeStart, setRangeStart] = React.useState<Moment | null>(resetTime(today.clone().set('date', 1)))
  const [rangeEnd, setRangeEnd] = React.useState<Moment | null>(setTimeToMax(today.clone().add(1, 'month').set('date', 1).subtract(1, 'day')))
  const gridRef = React.useRef<AgGridReact>(null);
  const [isRangePicker, setIsRangePicker] = React.useState(false)

  const handleRangeChange = ((_dates: [Moment | null, Moment | null] | null, dateStrings: [string, string]) => {
    setRangeStart(dateStrings && dateStrings[0] ? moment(dateStrings[0], DATE_FORMAT) : null)
    setRangeEnd(dateStrings && dateStrings[1] ? setTimeToMax(moment(dateStrings[1], DATE_FORMAT)) : null)
  })

  const handleMonthChange = ((date: Moment | null) => {
    setRangeStart(date ? resetTime(date.clone().set('date', 1)) : null)
    setRangeEnd(date ? setTimeToMax(date.clone().add(1, 'month').subtract(1, 'day')) : null)
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
      <SiteContent className="site-layout-background">
        <Space direction="vertical" size="middle">
          <div>
            <Space size="middle">
              {isRangePicker ? (<RangePicker
                format={DATE_FORMAT}
                value={[rangeStart, rangeEnd]}
                onChange={handleRangeChange}
              />) : (
                <DatePicker
                  value={rangeStart}
                  picker="month"
                  onChange={handleMonthChange}
                  format='MMMM YYYY'
                />
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Добавить
              </Button>
            </Space>
            <br />
            <DateTypeButton icon={<SwapOutlined />} type='link' onClick={() => { setIsRangePicker(value => !value) }}>
              {isRangePicker ? 'Выбрать только месяц' : 'Выбрать точный период'}
            </DateTypeButton>
          </div>
          {rangeStart && rangeEnd && (
            <div className='ag-theme-alpine' style={{ height: 500, width: 790 }}>
              <AgGridReact
                ref={gridRef}
                rowData={expenseStore.tableData(rangeStart, rangeEnd)}
                columnDefs={columnDefs}
                context={{ expandCategory }}
                getRowStyle={getRowStyle}
                groupIncludeFooter
                suppressAggFuncInHeader
                autoGroupColumnDef={autoGroupColumnDef}
              />
            </div>
          )}
        </Space>
      </SiteContent>
      <ExpenseModal startDate={rangeStart} endDate={rangeEnd} onSubmit={e => { expandCategory(e.category.name) }} />
    </>
  )
})

export default DataScreen