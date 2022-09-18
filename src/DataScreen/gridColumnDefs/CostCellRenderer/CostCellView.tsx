import { Tooltip } from "antd";
import React from "react";
import styled from "styled-components";
import { MoneyCollectOutlined } from "@ant-design/icons";

interface Props {
  cost: string;
  personalExpStr?: string;
  isSubscription?: boolean;
  isUpcomingSubscription?: boolean;
}

const ShiftedCost = styled.div`
  position: relative;
  bottom: 5px;
`;

const PersonalExp = styled.div`
  position: relative;
  bottom: 30px;
  font-size: 10px;
  font-style: italic;
  color: gray;
`;

// eslint-disable-next-line mobx/missing-observer
const CostCellView: React.FC<Props> = ({
  cost,
  personalExpStr,
  isSubscription,
  isUpcomingSubscription,
}) => {
  const costElement = (
    <div>
      {cost}
      {isSubscription && (
        <>
          &nbsp;
          <Tooltip
            title={isUpcomingSubscription ? "Предстоящая подписка" : "Подписка"}
          >
            <MoneyCollectOutlined style={{ color: "gray" }} />
          </Tooltip>
        </>
      )}
    </div>
  );

  return (
    <div>
      {personalExpStr ? (
        <>
          <ShiftedCost>{costElement}</ShiftedCost>
          <PersonalExp>+{personalExpStr}</PersonalExp>
        </>
      ) : (
        <div>{costElement}</div>
      )}
    </div>
  );
};

export default CostCellView;
