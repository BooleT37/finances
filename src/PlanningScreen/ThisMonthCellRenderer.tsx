import React from "react";
import TotalCostCellView from "../components/TotalCostCellView";
import type { MonthSpendings } from "../stores/forecastStore/types";
import { costToString } from "../utils";

interface Props {
  value: MonthSpendings;
}

function divideWithFallbackToOne(divident: number, divider: number) {
  return divider === 0 ? 1 : divident / divider;
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
          barWidth={divideWithFallbackToOne(col.diff, col.diff + col.spendings)}
        />
      );
    }
    return (
      <TotalCostCellView
        cost={costString}
        suffix={`+${diffSum}`}
        color="green"
        barWidth={divideWithFallbackToOne(-col.diff, col.spendings)}
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
        barWidth={divideWithFallbackToOne(
          col.spendings,
          col.diff + col.spendings
        )}
      />
    );
  }

  const spentRatio = Math.min(
    divideWithFallbackToOne(-col.diff, col.spendings),
    1
  );
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
