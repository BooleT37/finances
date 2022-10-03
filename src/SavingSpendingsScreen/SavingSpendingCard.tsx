import { Card } from "antd";
import { observer } from "mobx-react";
import SavingSpending from "../models/SavingSpending";

interface Props {
  spending: SavingSpending;
}

const SavingSpendingCard: React.FC<Props> = observer(
  function SavingSpendingCard({ spending }) {
    return (
      <Card title={spending.name}>
        {spending.categories.map((c) => (
          <p key={c.id}>{(c.name, c.forecast)}</p>
        ))}
      </Card>
    );
  }
);

export default SavingSpendingCard;
