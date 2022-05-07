import { computed, makeObservable, observable } from "mobx";

export interface Option {
    value: string
}

export default class Category {
    constructor(public id: number, public name: string) {
        makeObservable(this, {
            id: observable,
            name: observable,
            asOption: computed
        })
    }

    get asOption(): Option {
        return {
            value: this.name
        }
    }
}
