import { computed, makeObservable, observable } from "mobx";
import Category from "../Category";
import Currency from "../Currency";

interface TableData {
    id: number
    name: string
    cost: {
      value: number,
      currency: Currency
    } | null
    date: string
    category: string
}

export default class Expense {
    id: number;
    name?: string;
    cost: number | null;
    currency: Currency;
    date: string;
    category: Category;

    constructor(
        id: number,
        cost: number | null,
        currency: Currency,
        date: string,
        category: Category,
        name?: string
    ) {
        makeObservable(this, {
            id: observable,
            cost: observable,
            currency: observable,
            date: observable,
            category: observable,
            name: observable,
            asTableData: computed
        })
        this.id = id
        this.cost = cost;
        this.currency = currency;
        this.date = date;
        this.category = category;
        this.name = name
    }

    get asTableData(): TableData {
        return {
            id: this.id,
            name: this.name || '',
            cost: this.cost ? {
              value: this.cost,
              currency: this.currency
            } : null,
            category: this.category.name,
            date: this.date
        }
    }
}
