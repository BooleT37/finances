import { computed, makeObservable, observable } from "mobx";

export interface Option {
  value: string
}

export default class Category {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly isIncome = false,
    public readonly isContinuous = false,
  ) {
    makeObservable(this, {
      id: observable,
      name: observable,
      asOption: computed,
      isIncome: false,
      isContinuous: false,
    })
  }

  get asOption(): Option {
    return {
      value: this.name
    }
  }
}
