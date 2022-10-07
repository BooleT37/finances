import { MoneyCollectOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { sum } from "lodash";
import React, { useCallback } from "react";
import { SubscriptionsItem } from "../../../stores/forecastStore/types";
import { costToString, roundCost } from "../../../utils";
import { List, TooltipContainer } from "./SubscriptionsTooltip.styled";

interface Props {
  items: SubscriptionsItem[];
  onClick(totalCost: number): void;
}

// eslint-disable-next-line mobx/missing-observer
const SubscriptionsTooltip: React.FC<Props> = ({ items, onClick }) => {
  const total = roundCost(
    sum(items.map((item) => parseFloat(item.cost.toString())))
  );

  const handleClick = useCallback(() => {
    onClick(total);
  }, [onClick, total]);

  const tooltipText = React.useMemo(
    () => (
      <>
        {costToString(total)} из подписок:
        <List>
          {items.map((item) => (
            <li key={item.name}>
              {costToString(item.cost)}
              {"\u00A0"}
              {item.name}
            </li>
          ))}
        </List>
      </>
    ),
    [items, total]
  );

  return (
    <Tooltip title={tooltipText}>
      <TooltipContainer>
        ({total} <MoneyCollectOutlined onClick={handleClick} />)
      </TooltipContainer>
    </Tooltip>
  );
};

export default SubscriptionsTooltip;
