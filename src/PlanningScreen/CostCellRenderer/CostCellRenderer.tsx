import { ForecastSum } from "../../stores/forecastStore/types";
import { costToString } from "../../utils";
import SubscriptionsTooltip from "./SubscriptionsTooltip/SubscriptionsTooltip";

interface Props {
  value: ForecastSum;
}

// eslint-disable-next-line mobx/missing-observer
const CostCellRenderer: React.FC<Props> = ({ value }) => {
  return (
    <>
      {costToString({ value: value.value })}
      {value.subscriptions.length > 0 && (
        <SubscriptionsTooltip items={value.subscriptions} />
      )}
    </>
  );
};

export default CostCellRenderer;
