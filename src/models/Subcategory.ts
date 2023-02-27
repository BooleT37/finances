import type { Option } from "../types";

export default class Subcategory {
  constructor(
    public readonly id: number,
    public readonly name: string,
  ) {}

  get asOption(): Option {
    return {
      value: this.id,
      label: this.name,
    };
  }
}
