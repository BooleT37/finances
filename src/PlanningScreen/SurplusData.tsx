import React from "react";
import { observer } from "mobx-react";
import forecastStore from "../stores/forecastStore";
import { costToString, roundCost } from "../utils";
import expenseStore from "../stores/expenseStore";
import { Typography } from "antd";

const { Title } = Typography;

interface Props {
  year: number;
  month: number;
}

const SurplusData: React.FC<Props> = observer(function SurplusData({
  year,
  month,
}) {
  return (
    <div>
      <Title level={4}>Разница в этом месяце:</Title>
      <div>
        По плану: &nbsp;
        {costToString({
          value: roundCost(
            forecastStore.totalForMonth(year, month, true) -
              forecastStore.totalForMonth(year, month, false)
          ),
        })}
      </div>
      <div>
        Факт: &nbsp;
        {costToString({
          value: roundCost(
            expenseStore.totalForMonth(year, month, true) -
              expenseStore.totalForMonth(year, month, false)
          ),
        })}
      </div>
    </div>
  );
});

export default SurplusData;
