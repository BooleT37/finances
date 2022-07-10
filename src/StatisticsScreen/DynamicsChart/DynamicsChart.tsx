import { AgChartsReact } from "ag-charts-react";
import { DatePicker, Select, Space, Typography } from "antd";
import moment from "moment";
import { Moment } from "moment";
import React from "react";
import { MONTH_DATE_FORMAT } from "../../constants";
import categories from "../../readonlyStores/categories";
import expenseStore from "../../stores/expenseStore";
import getOptions from "./getOptions";
import { Option } from "../../types";
import styled from "styled-components";

const { RangePicker } = DatePicker;
const { Title } = Typography;

const thisMonth = moment().date(1);

const SelectStyled = styled(Select)`
  width: 200px;
`;

// eslint-disable-next-line mobx/missing-observer
const DynamicsChart = function DynamicsChart() {
  const [startDate, setStartDate] = React.useState<Moment>(() =>
    thisMonth.clone().subtract(1, "year")
  );
  const [endDate, setEndDate] = React.useState<Moment>(() => thisMonth.clone());
  const [categoryId, setCategoryId] = React.useState<number | null>(null);

  const datesAreSame = startDate.isSame(endDate, "month");
  const filteredCategories = React.useMemo(() => {
    if (categoryId === null) {
      return categories.getAll();
    }
    return categories.getAll().filter((c) => c.id === categoryId);
  }, [categoryId]);
  const options = React.useMemo(
    () =>
      datesAreSame
        ? null
        : getOptions(
            filteredCategories.map((c) => c.id.toString()),
            filteredCategories.map((c) => c.shortname),
            expenseStore.getDynamicsData(startDate, endDate, categoryId)
          ),
    [categoryId, datesAreSame, endDate, filteredCategories, startDate]
  );

  const handleRangeChange = (dates: [Moment | null, Moment | null] | null) => {
    if (!dates || !dates[0] || !dates[1]) {
      return;
    }
    setStartDate(dates[0]);
    setEndDate(dates[1]);
  };

  const ref = React.useRef(null);

  const categoriesOptions: Option[] = React.useMemo(() => {
    const options: Option[] = categories.options;
    options.unshift({ value: null, label: "Все" });

    return options;
  }, []);

  return (
    <div style={{ width: 1200 }}>
      <Title level={3}>Динамика</Title>
      <Space size="middle">
        <RangePicker
          picker="month"
          value={[startDate, endDate]}
          onChange={handleRangeChange}
          format={MONTH_DATE_FORMAT}
          allowClear={false}
        />
        <SelectStyled
          options={categoriesOptions}
          value={categoryId}
          /* @ts-ignore bug in styled-components*/
          onChange={setCategoryId}
        />
      </Space>
      <AgChartsReact ref={ref} options={options} />
    </div>
  );
};

export default DynamicsChart;
