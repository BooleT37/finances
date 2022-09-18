import React from "react";
import { CostCol } from "../../../models/Expense";
import { costToString, roundCost } from "../../../utils";
import { AggCostCol } from "../../models";
import { isAggCostCol } from "../utils";
import CostGroupCellView from "./CostGroupCellView";
import CostCellView from "./CostCellView";

interface Props {
  value: CostCol | AggCostCol;
  context: { passedDaysRatio: number };
}

// eslint-disable-next-line mobx/missing-observer
const CostCellRenderer: React.FC<Props> = ({
  value: col,
  context: { passedDaysRatio },
}) => {
  if (!col) {
    return null;
  }
  const costString = costToString(col.value);
  if (!isAggCostCol(col) || col.diff === null) {
    return (
      <CostCellView
        cost={costString}
        personalExpStr={col.personalExpStr}
        isSubscription={col.isSubscription}
      />
    );
  }
  const diffSum = costToString(Math.abs(col.diff));
  if (col.isIncome) {
    if (col.diff >= 0) {
      return (
        <CostGroupCellView
          cost={costString}
          suffix={`-${diffSum}`}
          color="red"
          barWidth={col.diff / (col.diff + col.value)}
        />
      );
    }
    return (
      <CostGroupCellView
        cost={costString}
        suffix={`+${diffSum}`}
        color="green"
        barWidth={-col.diff / col.value}
        barOffset={col.diff / col.value + 1}
      />
    );
  }
  if (col.diff >= 0) {
    const spentRatio = col.value / (col.diff + col.value);
    const exceedingForecast = col.isContinuous && spentRatio > passedDaysRatio;
    const color = exceedingForecast ? "orange" : "green";

    const exceedingAmount = exceedingForecast
      ? costToString(
          roundCost(col.value - passedDaysRatio * (col.value + col.diff))
        )
      : undefined;
    const title = exceedingAmount
      ? `Превышение на ${exceedingAmount}`
      : undefined;

    return (
      <CostGroupCellView
        cost={costString}
        suffix={`+${diffSum}`}
        color={color}
        barWidth={spentRatio}
        title={title}
      />
    );
  }

  const spentRatio = Math.min(-col.diff / col.value, 1);
  const offset = Math.max(col.diff / col.value + 1, 0);

  return (
    <CostGroupCellView
      cost={costString}
      suffix={`-${diffSum}`}
      color="red"
      barWidth={spentRatio}
      barOffset={offset}
    />
  );
};

export default CostCellRenderer;
