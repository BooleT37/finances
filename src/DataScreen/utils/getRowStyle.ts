import { RowClassParams, RowStyle } from "ag-grid-enterprise";
import { action } from "mobx";
import categoryStore from "../../stores/categoryStore";

const getRowStyle = action((params: RowClassParams): RowStyle | undefined => {
  if (params.node.group) {
    if (categoryStore.incomeCategoriesNames.includes(params.node.key || '')) {
      return {
        fontStyle: 'italic'
      }
    }
  }
  return undefined
})

export default getRowStyle