import React from "react";
import { observer } from "mobx-react";
import forecastStore from "../stores/forecastStore";
import { costToString, roundCost } from "../utils";
import expenseStore from "../stores/expenseStore";
import { Tooltip, Typography } from "antd";

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
        <Tooltip title="Планируемые доходы минус планируемые расходы. Личные траты не учитываются">
          По плану: &nbsp;
        </Tooltip>
        {costToString(
          roundCost(
            forecastStore.totalForMonth(year, month, true, false) -
              forecastStore.totalForMonth(year, month, false, false)
          )
        )}
      </div>
      <div>
        <Tooltip title="Фактические доходы минус фактические расходы. Личные траты не учитываются">
          Факт: &nbsp;
        </Tooltip>
        {costToString(
          roundCost(
            expenseStore.totalForMonth(year, month, true, false) -
              expenseStore.totalForMonth(year, month, false, false)
          )
        )}
      </div>
    </div>
  );
});

export default SurplusData;
