import { computed, makeObservable, observable } from "mobx";
import Currency from "../models/Currency";
import Expense from "../models/Expense/Expense";
import categoryStore from "./categoryStore";

class ExpenseStore {
    public expenses: Expense[]

    constructor(expenses: Expense[]) {
        makeObservable(this, { expenses: observable, tableData: computed })
        this.expenses = expenses
    }

    get tableData() {
        return this.expenses.map(ex => ex.asTableData)
    }
}

const fakeExpenses: Expense[] = [
    new Expense(14.99, Currency.Eur, '2022-04-02', categoryStore.getByName('Подписки'), 'YT Music'),
    new Expense(8, Currency.Eur, '2022-03-13', categoryStore.getByName('Подписки'), 'Disney+'),
    new Expense(14.99, Currency.Eur, '2022-04-02', categoryStore.getByName('Подписки'), 'YT Music'),
    new Expense(12.99, Currency.Eur, '2022-04-07', categoryStore.getByName('Подписки'), 'Netflix'),
    new Expense(8, Currency.Eur, '2022-04-13', categoryStore.getByName('Подписки'), 'Disney+'),
    new Expense(31.45, Currency.Eur, '2022-03-20', categoryStore.getByName('Рестораны')),
    new Expense(27.90, Currency.Eur, '2022-04-01', categoryStore.getByName('Рестораны')),
    new Expense(21.30, Currency.Eur, '2022-04-04', categoryStore.getByName('Рестораны')),
    new Expense(20.00, Currency.Eur, '2022-04-09', categoryStore.getByName('Рестораны')),
    new Expense(67.40, Currency.Eur, '2022-04-12', categoryStore.getByName('Рестораны')),
    new Expense(1100, Currency.Eur, '2022-03-26', categoryStore.getByName('Аренда')),
    new Expense(1100, Currency.Eur, '2022-04-27', categoryStore.getByName('Аренда'))
]

const expenseStore = new ExpenseStore(fakeExpenses);

export default expenseStore