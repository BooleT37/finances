import {ICellRendererParams} from 'ag-grid-enterprise';
import {Button} from 'antd';
import React from 'react'
import {RightSquareOutlined} from '@ant-design/icons';
import forecastStore from "../stores/forecastStore";
import categories from "../readonlyStores/categories";
import {PersonalExpCategoryIds} from "../utils/constants";

// eslint-disable-next-line mobx/missing-observer
const TransferPeButtonRenderer: React.FC<ICellRendererParams> = (props) => {
  if (props.data.category === 'Всего') {
    return null
  }
  const { year, month } = props.context
  const categoryId = categories.getByName(props.data.category).id
  if ([PersonalExpCategoryIds.Alexey, PersonalExpCategoryIds.Lena].includes(categoryId)) {
    return (
      <Button
        title="Перенести с пред. месяца"
        icon={<RightSquareOutlined/>}
        onClick={() => {
          forecastStore.transferPersonalExpense(categoryId, month, year)
        }}
      />
    )
  }
  return null
}

export default TransferPeButtonRenderer;