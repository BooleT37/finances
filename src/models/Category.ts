import { makeObservable, observable } from "mobx";

export default class Category {
    constructor(public id: number, public name: string) {
        makeObservable(this, {
            id: observable,
            name: observable
        })
    }
}
