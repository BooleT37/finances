export interface Option {
  value: string
}

export default class Category {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly shortname: string,
    public readonly isIncome = false,
    public readonly isContinuous = false,
  ) {}

  get asOption(): Option {
    return {
      value: this.name
    }
  }
}
