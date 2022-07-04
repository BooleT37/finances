import { AgChartsReact } from "ag-charts-react";
import { DatePicker, Select, Space, Typography } from "antd";
import moment, { Moment } from "moment";
import React from "react";
import SiteContent from "../SiteContent";
import expenseStore from "../stores/expenseStore";
import WhiteHeader from "../WhiteHeader";
import getOptions from "./getOptions";

/* eslint-disable mobx/missing-observer */

const { Title } = Typography;
const { Option } = Select;

const thisMonth = moment().date(1);
const lastMonth = thisMonth.clone().subtract(1, "month");

type Granularity = "month"|"quarter"|"year"
const pickerFormat: Record<Granularity, string> = {
  month: "MMMM YYYY",
  quarter: "[Q]Q YYYY",
  year: "YYYY"
}

function dateFormat(date1: Moment, date2: Moment, granularity: Granularity): string {
  if (granularity === "month") {
    if (date1.year() === date2.year()) {
      return "MMMM"
    }
    return "MMMM YYYY"
  }
  if (granularity === "quarter") {
    return "[Q]Q"
  }
  return "YYYY"
}

const StatisticsScreen: React.FC = () => {
  const [startDate, setStartDate] = React.useState<Moment>(lastMonth);
  const [endDate, setEndDate] = React.useState<Moment>(thisMonth);
  const [granularity, setGranularity] = React.useState<Granularity>("month")

  const datesAreSame = startDate.isSame(endDate, granularity)
  const format = dateFormat(startDate, endDate, granularity)

  const options = datesAreSame ? null : getOptions(
    startDate.format(format),
    endDate.format(format),
    expenseStore.getComparisonData(
      startDate,
      endDate,
      granularity
    ),
  );

  return (
    <>
      <WhiteHeader className="site-layout-background">
        <Title>Статистика</Title>
      </WhiteHeader>
      <SiteContent className="site-layout-background">
        <Space direction="vertical" size="middle">
          <Space size="small">
            <DatePicker
              clearIcon={false}
              picker={granularity}
              value={startDate}
              onChange={(d) => {
                if (d) {
                  setStartDate(d);
                }
              }}
              format={pickerFormat[granularity]}
            />
            -
            <DatePicker
              clearIcon={false}
              picker={granularity}
              value={endDate}
              onChange={(d) => {
                if (d) {
                  setEndDate(d);
                }
              }}
              format={pickerFormat[granularity]}
            />
            <Select value={granularity} onChange={setGranularity}>
              <Option value="month">Месяц</Option>
              <Option value="quarter">Квартал</Option>
              <Option value="year">Год</Option>
            </Select>
          </Space>
          {datesAreSame
            ? "Пожалуйста, выберите различные периоды в виджете сверху"
            : <AgChartsReact options={options} />}
          
        </Space>
      </SiteContent>
    </>
  );
};

export default StatisticsScreen;
