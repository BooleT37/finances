import { ICellRendererParams } from "ag-grid-community";
import { useCallback } from "react";
import {
  ForecastSum,
  ForecastTableItem,
} from "../../stores/forecastStore/types";
import { costToString } from "../../utils";
import SubscriptionsTooltip from "./SubscriptionsTooltip/SubscriptionsTooltip";

type Props = Omit<ICellRendererParams, "value" | "data"> & {
  value: ForecastSum;
  data: ForecastTableItem;
};

// eslint-disable-next-line mobx/missing-observer
const CostCellRenderer: React.FC<Props> = ({ value, data, context }) => {
  const handleClick = useCallback(
    (totalCost: number) => {
      context.setForecastSum(data.categoryId, totalCost);
    },
    [context, data.categoryId]
  );
  return (
    <>
      {costToString(value.value)}
      {value.subscriptions.length > 0 && (
        <SubscriptionsTooltip
          items={value.subscriptions}
          onClick={handleClick}
        />
      )}
    </>
  );
};

export default CostCellRenderer;
