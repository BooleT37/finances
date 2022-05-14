import { computed, makeObservable, observable } from "mobx";

export interface Option {
    value: string
}

export default class Category {
    constructor(public id: number, public name: string, public readonly isIncome = false) {
        makeObservable(this, {
            id: observable,
            name: observable,
            asOption: computed,
            isIncome: false
        })
    }

    get asOption(): Option {
        return {
            value: this.name
        }
    }
}
