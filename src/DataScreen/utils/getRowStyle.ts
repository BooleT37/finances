import { RowClassParams, RowStyle } from "ag-grid-enterprise";
import { action } from "mobx";
import categories from "../../categories";

const getRowStyle = action((params: RowClassParams): RowStyle | undefined => {
  if (params.node.group) {
    if (categories.incomeCategoriesNames.includes(params.node.key || '')) {
      return {
        fontStyle: 'italic'
      }
    }
  }
  return undefined
})

export default getRowStyle