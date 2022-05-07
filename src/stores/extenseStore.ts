import { action, computed, makeObservable, observable } from "mobx";
import Currency from "../models/Currency";
import Expense from "../models/Expense/Expense";
import categoryStore from "./categoryStore";

class ExpenseStore {
  public expenses: Expense[]

  constructor(expenses: Expense[]) {
    makeObservable(
      this,
      {
        expenses: observable,
        tableData: computed,
        nextId: computed,
        insert: action
      })
    this.expenses = expenses
  }

  get tableData() {
    return this.expenses.map(ex => ex.asTableData)
  }

  get nextId(): number {
    return Math.max(...this.expenses.map(e => e.id)) + 1
  }

  insert(expense: Expense): void {
    const foundIndex = this.expenses.findIndex(e => e.id === expense.id);
    if (foundIndex === -1) {
      this.expenses.push(expense)
    } else {
      this.expenses[foundIndex] = expense
    }
  }
}

const fakeExpenses: Expense[] = [
  new Expense(1, 14.99, Currency.Eur, '2022-04-02', categoryStore.getByName('Подписки'), 'YT Music'),
  new Expense(2, 8, Currency.Eur, '2022-03-13', categoryStore.getByName('Подписки'), 'Disney+'),
  new Expense(3, 14.99, Currency.Eur, '2022-04-02', categoryStore.getByName('Подписки'), 'YT Music'),
  new Expense(4, 12.99, Currency.Eur, '2022-04-07', categoryStore.getByName('Подписки'), 'Netflix'),
  new Expense(5, 8, Currency.Eur, '2022-04-13', categoryStore.getByName('Подписки'), 'Disney+'),
  new Expense(6, 31.45, Currency.Eur, '2022-03-20', categoryStore.getByName('Рестораны')),
  new Expense(7, 27.90, Currency.Eur, '2022-04-01', categoryStore.getByName('Рестораны')),
  new Expense(8, 21.30, Currency.Eur, '2022-04-04', categoryStore.getByName('Рестораны')),
  new Expense(9, 20.00, Currency.Eur, '2022-04-09', categoryStore.getByName('Рестораны')),
  new Expense(10, 67.40, Currency.Eur, '2022-04-12', categoryStore.getByName('Рестораны')),
  new Expense(11, 1100, Currency.Eur, '2022-03-26', categoryStore.getByName('Аренда')),
  new Expense(12, 1100, Currency.Eur, '2022-04-27', categoryStore.getByName('Аренда'))
]

const expenseStore = new ExpenseStore(fakeExpenses);

export default expenseStore