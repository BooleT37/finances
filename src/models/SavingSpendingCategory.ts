import { makeAutoObservable } from "mobx";

export default class SavingSpendingCategory {
  id: number;
  name: string;
  forecast: number;
  comment: string;

  constructor(id: number, name: string, forecast: number, comment: string) {
    makeAutoObservable(this);

    this.id = id;
    this.name = name;
    this.forecast = forecast;
    this.comment = comment;
  }
}
