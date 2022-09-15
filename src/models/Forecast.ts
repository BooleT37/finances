import { makeAutoObservable } from "mobx";
import Category from "./Category";

class Forecast {
  constructor(
    public category: Category,
    public month: number,
    public year: number,
    public sum: number,
    public comment?: string
  ) {
    makeAutoObservable(this);
  }
}

export default Forecast;
