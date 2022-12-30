import { observer } from "mobx-react";
import { SavingsPerMonthChart } from "./SavingsPerMonthChart";
import { SavingsSpendingsEventsChart } from "./SavingsSpendingsEventsChart";
import { SavingsVsSpendingsChart } from "./SavingsVsSpendingsChart";

export const SavingsStep: React.FC = observer(function MostSpendingsStep() {
  return (
    <div>
      <SavingsVsSpendingsChart />
      <SavingsPerMonthChart />
      <SavingsSpendingsEventsChart />
    </div>
  );
});
