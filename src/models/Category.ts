import type { Option } from "../types";
import {
  PersonalExpCategoryIds,
  SAVINGS_CATEGORY_ID,
} from "../utils/constants";

export default class Category {
  public readonly isPersonal: boolean;
  public readonly isSavingSpending: boolean;
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly shortname: string,
    public readonly isIncome = false,
    public readonly isContinuous = false
  ) {
    this.isPersonal = [
      PersonalExpCategoryIds.Alexey,
      PersonalExpCategoryIds.Lena,
    ].includes(id);
    this.isSavingSpending = id === SAVINGS_CATEGORY_ID;
  }

  get asOption(): Option {
    return {
      value: this.id,
      label: this.name,
    };
  }
}
