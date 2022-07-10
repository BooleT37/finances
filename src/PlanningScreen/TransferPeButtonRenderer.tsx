import { ICellRendererParams } from "ag-grid-enterprise";
import { Button } from "antd";
import React from "react";
import { RightSquareOutlined } from "@ant-design/icons";
import forecastStore from "../stores/forecastStore";
import { PersonalExpCategoryIds } from "../utils/constants";

// eslint-disable-next-line mobx/missing-observer
const TransferPeButtonRenderer: React.FC<ICellRendererParams> = (props) => {
  if (props.data.category === "Всего") {
    return null;
  }
  const { year, month } = props.context;
  if (
    [PersonalExpCategoryIds.Alexey, PersonalExpCategoryIds.Lena].includes(
      props.data.category
    )
  ) {
    return (
      <Button
        title="Сложить с остатком"
        icon={<RightSquareOutlined />}
        onClick={() => {
          forecastStore.transferPersonalExpense(
            props.data.category,
            month,
            year
          );
        }}
      />
    );
  }
  return null;
};

export default TransferPeButtonRenderer;
