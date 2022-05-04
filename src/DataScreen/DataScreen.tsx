import React from 'react';
import { observer } from "mobx-react"
import { Typography, DatePicker, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import moment, { Moment } from 'moment';
import { AgGridReact } from 'ag-grid-react';
import expenseStore from '../stores/extenseStore';
import columnDefs from './columnDefs';

const { RangePicker } = DatePicker;

const { Title } = Typography;

const today = moment()

const DataScreen = observer(function DataScreen () {
    const [rangeStart, setRangeStart] = React.useState<Moment | null>(today.clone().subtract(1, 'months').set('date', 1))
    const [rangeEnd, setRangeEnd] = React.useState<Moment | null>(today.clone().set('date', 1).subtract(1, 'day'))

    const handleRangeChange = ((dates: [Moment | null, Moment | null] | null) => {
        setRangeStart(dates?.[0] ?? null)
        setRangeEnd(dates?.[1] ?? null)
    })
    return (
        <>
            <Title>Экран данных</Title>
            <RangePicker value={[rangeStart, rangeEnd]} onChange={handleRangeChange}/>
            <Button type="primary" icon={<PlusOutlined />}>Добавить</Button>
            <div className='ag-theme-alpine' style={{ height: 500 }}>
                <AgGridReact rowData={expenseStore.tableData} columnDefs={columnDefs} />
            </div>
        </>
    )
})

export default DataScreen