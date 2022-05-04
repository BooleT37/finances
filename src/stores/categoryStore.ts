import { makeObservable, observable } from "mobx";
import Category from "../models/Category";

class CategoryStore {
    public categories: Category[]

    constructor(categories: Category[]) {
        makeObservable(this, { categories: observable, getByName: false })
        this.categories = categories
    }

    getByName(name: string): Category {
        const category = this.categories.find((category) => category.name === name)
        if (!category) {
            throw new Error(`Cannot find category with the name ${name}`)
        }
        return category
    }
}

const fakeCategories: Category[] = [
    {
        name: 'Подписки',
        id: 1,
    },
    {
        name: 'Рестораны',
        id: 2,
    },
    {
        name: 'Еда',
        id: 3,
    },
    {
        name: 'Аренда',
        id: 4
    }
]

const categoryStore = new CategoryStore(fakeCategories)

export default categoryStore