import type { Option } from "../types";
import { PersonalExpCategoryIds } from "../utils/constants";

export default class Category {
  public readonly isPersonal: boolean;
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
  }

  get asOption(): Option {
    return {
      value: this.id,
      label: this.name,
    };
  }

  get asAutocompleteOption(): Option {
    return {
      label: this.name,
      value: this.name,
    };
  }
}
