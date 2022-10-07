import { Tooltip } from "antd";
import { observer } from "mobx-react";
import styled from "styled-components";
import { DATE_FORMAT } from "../../../constants";
import expenseStore from "../../../stores/expenseStore";
import { costToString } from "../../../utils";

import "./SourceLastExpenses.css";

interface Props {
  sourceId: number;
}

const Row = styled.div`
  display: flex;
  justify-content: space-between;

  & > *:not(:last-child) {
    margin-right: 10px;
  }
`;

const SourceLastExpenses: React.FC<Props> = observer(
  function SourceLastExpenses({ sourceId }) {
    const lastExpenses = expenseStore.lastExpensesPerSource[sourceId];
    const expensesDate =
      lastExpenses.length === 0
        ? "Никогда"
        : lastExpenses[0].date.format(DATE_FORMAT);
    const tooltipContent =
      lastExpenses.length === 0 ? null : (
        <>
          {lastExpenses.map((expense) => (
            <div key={expense.id}>
              <Row>
                <span>{expense.category.name}</span>
                {expense.name && <span>- {expense.name}</span>}
                {expense.cost !== null && (
                  <span>{costToString(expense.cost)}</span>
                )}
              </Row>
            </div>
          ))}
        </>
      );
    return (
      <Tooltip overlayClassName="source-last-expenses" title={tooltipContent}>
        <div>Последняя запись: {expensesDate}</div>
      </Tooltip>
    );
  }
);

export default SourceLastExpenses;
