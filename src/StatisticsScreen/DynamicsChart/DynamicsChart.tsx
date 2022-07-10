import { AgChartsReact } from "ag-charts-react";
import { DatePicker, Typography } from "antd";
import moment from "moment";
import { Moment } from "moment";
import React from "react";
import { MONTH_DATE_FORMAT } from "../../constants";
import categories from "../../readonlyStores/categories";
import expenseStore from "../../stores/expenseStore";
import getOptions from "./getOptions";

const { RangePicker } = DatePicker;
const { Title } = Typography;

const thisMonth = moment().date(1);

// eslint-disable-next-line mobx/missing-observer
const DynamicsChart = function DynamicsChart() {
  const [startDate, setStartDate] = React.useState<Moment>(() =>
    thisMonth.clone().subtract(1, "year")
  );
  const [endDate, setEndDate] = React.useState<Moment>(() => thisMonth.clone());

  const datesAreSame = startDate.isSame(endDate, "month");
  const options = datesAreSame
    ? null
    : getOptions(
        categories.getAll().map((c) => c.id.toString()),
        categories.getAll().map((c) => c.shortname),
        expenseStore.getDynamicsData(startDate, endDate)
      );

  const handleRangeChange = (dates: [Moment | null, Moment | null] | null) => {
    if (!dates || !dates[0] || !dates[1]) {
      return;
    }
    setStartDate(dates[0]);
    setEndDate(dates[1]);
  };

  const ref = React.useRef(null);

  return (
    <div style={{ width: 1200 }}>
      <Title level={3}>Динамика</Title>
      <RangePicker
        picker="month"
        value={[startDate, endDate]}
        onChange={handleRangeChange}
        format={MONTH_DATE_FORMAT}
        allowClear={false}
      />
      <AgChartsReact ref={ref} options={options} />
    </div>
  );
};

export default DynamicsChart;
