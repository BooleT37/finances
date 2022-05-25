import { observer } from "mobx-react"
import { DatePicker, Typography } from 'antd';
import WhiteHeader from "../WhiteHeader"
import SiteContent from "../SiteContent";
import { AgGridReact } from "ag-grid-react";
import columnDefs from "./columnDefs";
import forecastStore from "../stores/forecastStore";
import React from "react";
import { Moment } from "moment";
import moment from "moment";

const { Title } = Typography;

const PlanningScreen = observer(function PlanningScreen() {
  const [date, setDate] = React.useState<Moment | null>(moment())

  return (
    <>
      <WhiteHeader className="site-layout-background">
        <Title>Планирование</Title>
      </WhiteHeader>
      <SiteContent className="site-layout-background">
        <DatePicker value={date} picker="month" onChange={(date) => setDate(date)} />
        { date &&
          <div className='ag-theme-alpine' style={{ width: 790 }}>
            <AgGridReact
              columnDefs={columnDefs}
              rowData={forecastStore.tableData(date.year(), date.month())}
              domLayout="autoHeight"
            />
          </div>
        }
      </SiteContent>
    </>
  )
})

export default PlanningScreen