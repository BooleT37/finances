import { observer } from "mobx-react"
import { DatePicker, Space, Typography } from 'antd';
import WhiteHeader from "../WhiteHeader"
import SiteContent from "../SiteContent";
import { AgGridReact } from "ag-grid-react";
import columnDefs from "./columnDefs";
import forecastStore from "../stores/forecastStore/forecastStore";
import React from "react";
import { Moment } from "moment";
import moment from "moment";
import type { CellEditRequestEvent } from "ag-grid-community";
import { action } from "mobx";
import categoryStore from "../stores/categoryStore";

const { Title } = Typography;

const PlanningScreen = observer(function PlanningScreen() {
  const [date, setDate] = React.useState<Moment | null>(moment())
  const handleCellEditRequest = action((params: CellEditRequestEvent) => {
    if (!date) {
      return
    }
    const field = params.column.getColDef().field
    if (field === 'sum') {
      forecastStore.changeForecastSum(
        categoryStore.getByName(params.data.category),
        date.month(),
        date.year(),
        parseFloat(params.newValue)
      )
    } else if (field === 'comment') {
      forecastStore.changeForecastComment(
        categoryStore.getByName(params.data.category),
        date.month(),
        date.year(),
        params.newValue
      )
    }
  })

  return (
    <>
      <WhiteHeader className="site-layout-background">
        <Title>Планирование</Title>
      </WhiteHeader>
      <SiteContent className="site-layout-background">
        <Space direction="vertical" size="middle">
          <DatePicker value={date} picker="month" onChange={(date) => setDate(date)} />
          {date &&
            <div className='ag-theme-alpine' style={{ width: 915 }}>
              <AgGridReact
                readOnlyEdit
                onCellEditRequest={handleCellEditRequest}
                columnDefs={columnDefs}
                rowData={forecastStore.tableData(date.year(), date.month())}
                domLayout="autoHeight"
              />
            </div>
          }
        </Space>
      </SiteContent>
    </>
  )
})

export default PlanningScreen