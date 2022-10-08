import type { Option } from "../types";

export enum PersonalExpCategoryIds {
  Alexey = 0,
  Lena = 50,
}

export const CATEGORY_IDS = {
  personal: {
    Alexey: PersonalExpCategoryIds.Alexey,
    Lena: PersonalExpCategoryIds.Lena,
  },
  fromSavings: 35,
  toSavings: 11,
  total: -1,
};

export default class Category {
  public readonly isPersonal: boolean;
  public readonly fromSavings: boolean;
  public readonly toSavings: boolean;
  public readonly isSavings: boolean;
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly shortname: string,
    public readonly isIncome = false,
    public readonly isContinuous = false
  ) {
    this.isPersonal = [
      CATEGORY_IDS.personal.Alexey,
      CATEGORY_IDS.personal.Lena,
    ].includes(id);
    this.fromSavings = id === CATEGORY_IDS.fromSavings;
    this.toSavings = id === CATEGORY_IDS.toSavings;
    this.isSavings = this.fromSavings || this.toSavings;
  }

  get asOption(): Option {
    return {
      value: this.id,
      label: this.name,
    };
  }
}
