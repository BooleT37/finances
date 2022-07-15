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
  const { year, month, scrollToRow } = props.context;
  if (
    [PersonalExpCategoryIds.Alexey, PersonalExpCategoryIds.Lena].includes(
      props.data.categoryId
    )
  ) {
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
  }
  return null;
};

export default TransferPeButtonRenderer;
