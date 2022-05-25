import { makeObservable, observable } from "mobx";
import Category from "./Category";

class Forecast {
  constructor(
    public category: Category,
    public month: number,
    public year: number,
    public sum: number,
    public comment?: string
    ) {
      makeObservable(this, {
        category: observable,
        sum: observable,
        comment: observable,
      })
    }
}

export default Forecast
