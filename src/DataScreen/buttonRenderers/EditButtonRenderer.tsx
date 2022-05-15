import { ICellRendererParams } from 'ag-grid-enterprise';
import { Button } from 'antd';
import React from 'react'
import { EditFilled } from '@ant-design/icons';
import expenseModalStore from '../expenseModalStore';

// eslint-disable-next-line mobx/missing-observer
const EditButtonRenderer: React.FC<ICellRendererParams> = (props) => {
  // if it's a group row
  if (!props.data) {
    return null
  }
  const id = props.data.id
  return <Button icon={ <EditFilled /> } onClick={ () => { expenseModalStore.open(id) } }/>
}

export default EditButtonRenderer;