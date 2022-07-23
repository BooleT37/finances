import { ICellRendererParams } from "ag-grid-enterprise";
import { Button } from "antd";
import React from "react";
import { RightSquareOutlined } from "@ant-design/icons";
import forecastStore from "../stores/forecastStore";

// eslint-disable-next-line mobx/missing-observer
const TransferPeButtonRenderer: React.FC<ICellRendererParams> = (props) => {
  const { year, month, scrollToRow } = props.context;
  return (
    <Button
      title="Рассчитать персональные расходы"
      icon={<RightSquareOutlined />}
      onClick={() => {
        forecastStore.transferPersonalExpense(
          props.data.categoryId,
          month,
          year
        );
        setTimeout(() => {
          scrollToRow(props.data.categoryId);
        });
      }}
    />
  );
};

export default TransferPeButtonRenderer;
