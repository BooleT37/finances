import { computed, makeObservable, observable } from "mobx";
import Category from "../Category";
import Currency from "../Currency";
import costToString from "./costToString";

interface TableData {
    name: string
    cost: string
    date: string
    category: string
}

export default class Expense {
    name?: string;
    cost: number;
    currency: Currency;
    date: string;
    category: Category;

    constructor(
        cost: number,
        currency: Currency,
        date: string,
        category: Category,
        name?: string
    ) {
        makeObservable(this, {
            cost: observable,
            currency: observable,
            date: observable,
            category: observable,
            name: observable,
            asTableData: computed
        })
        this.cost = cost;
        this.currency = currency;
        this.date = date;
        this.category = category;
        this.name = name
    }

    get asTableData(): TableData {
        return {
            name: this.name || '',
            cost: costToString(this.cost, this.currency),
            category: this.category.name,
            date: this.date
        }
    }
}
