import { Button, Tooltip } from "antd";
import React from "react";
import { EditOutlined } from "@ant-design/icons";
import { DeleteOutlined } from "@ant-design/icons";
import {
  SubscriptionName,
  SubscriptionCost,
  SubscriptionDate,
} from "./SubscriptionItem.styled";

interface Props {
  id: number;
  name: string;
  costString: string;
  nextDate: string;
  onEdit(id: number): void;
  onDelete(id: number): void;
}

// eslint-disable-next-line mobx/missing-observer
const SubscriptionsItem: React.FC<Props> = function SubscriptionsItem(props) {
  return (
    <div>
      <SubscriptionName>{props.name}</SubscriptionName>
      <SubscriptionCost>{props.costString}</SubscriptionCost>
      <Tooltip title="Следующая дата списания">
        <SubscriptionDate>{props.nextDate}</SubscriptionDate>
      </Tooltip>
      <Button
        type="text"
        icon={<EditOutlined />}
        onClick={() => {
          props.onEdit(props.id);
        }}
      />
      <Button
        type="text"
        icon={<DeleteOutlined />}
        onClick={() => {
          props.onDelete(props.id);
        }}
      />
    </div>
  );
};

export default SubscriptionsItem;
