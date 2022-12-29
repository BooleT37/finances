import React from "react";
import TotalCostCellView from "../components/TotalCostCellView";
import type { MonthSpendings } from "../stores/forecastStore/types";
import { costToString } from "../utils";

interface Props {
  value: MonthSpendings;
}

// eslint-disable-next-line mobx/missing-observer
const ThisMonthCellRenderer: React.FC<Props> = ({ value: col }) => {
  const costString = costToString(col.spendings);
  const diffSum = costToString(Math.abs(col.diff));
  if (col.isIncome) {
    if (col.diff >= 0) {
      return (
        <TotalCostCellView
          cost={costString}
          suffix={`-${diffSum}`}
          color="red"
          barWidth={col.diff / (col.diff + col.spendings)}
        />
      );
    }
    return (
      <TotalCostCellView
        cost={costString}
        suffix={`+${diffSum}`}
        color="green"
        barWidth={-col.diff / col.spendings}
        barOffset={col.diff / col.spendings + 1}
      />
    );
  }
  if (col.diff >= 0) {
    return (
      <TotalCostCellView
        cost={costString}
        suffix={`+${diffSum}`}
        color="green"
        barWidth={col.spendings / (col.diff + col.spendings)}
      />
    );
  }

  const spentRatio = Math.min(-col.diff / col.spendings, 1);
  const offset = Math.max(col.diff / col.spendings + 1, 0);

  return (
    <TotalCostCellView
      cost={costString}
      suffix={`-${diffSum}`}
      color="red"
      barWidth={spentRatio}
      barOffset={offset}
    />
  );
};

export default ThisMonthCellRenderer;
