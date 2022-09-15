import React from "react";
import { sum } from "lodash";
import { SubscriptionsItem } from "../../../stores/forecastStore/types";
import { costToString, roundCost } from "../../../utils";
import { MoneyCollectOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { List, TooltipContainer } from "./SubscriptionsTooltip.styled";

interface Props {
  items: SubscriptionsItem[];
}

// eslint-disable-next-line mobx/missing-observer
const SubscriptionsTooltip: React.FC<Props> = ({ items }) => {
  const total = costToString(
    roundCost(sum(items.map((item) => parseFloat(item.cost.toString()))))
  );

  const tooltipText = React.useMemo(
    () => (
      <>
        {total} из подписок:
        <List>
          {items.map((item) => (
            <li>
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
        ({total} <MoneyCollectOutlined />)
      </TooltipContainer>
    </Tooltip>
  );
};

export default SubscriptionsTooltip;
