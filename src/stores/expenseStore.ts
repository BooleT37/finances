import { action, computed, flow, makeObservable, observable } from "mobx";
import moment, { Moment } from "moment";
import Currency from "../models/Currency";
import Expense from "../models/Expense";
import categoryStore from "./categoryStore";

interface ExpenseJson {
  id: number;
  name?: string;
  cost: number | null;
  currency: Currency;
  date: string;
  category_id: number;
}

class ExpenseStore {
  public expenses: Expense[]

  constructor() {
    makeObservable(
      this,
      {
        expenses: observable,
        tableData: false,
        nextId: computed,
        insert: flow.bound,
        delete: flow.bound,
        fromJson: action
      })
  }

  tableData(startDate: Moment, endDate: Moment) {
    return this.expenses
      .filter(e => e.date.isSameOrAfter(startDate) && e.date.isSameOrBefore(endDate))
      .map(ex => ex.asTableData)
  }

  get nextId(): number {
    return Math.max(...this.expenses.map(e => e.id)) + 1
  }

  *insert(expense: Expense): Generator<Promise<Response>> {
    const foundIndex = this.expenses.findIndex(e => e.id === expense.id);
    const found = foundIndex !== -1;
    if (found) {
      this.expenses[foundIndex] = expense
    } else {
      this.expenses.push(expense)
    }
    yield fetch(
      `${process.env.REACT_APP_API_URL}/expense`,
      {
        method: found ? "PUT" : "POST", body: JSON.stringify({
          id: expense.id,
          name: expense.name,
          cost: expense.cost,
          currency: expense.currency,
          date: expense.date.format("YYYY-MM-DD"),
          category_id: expense.category.id
        }),
        headers: {
          "content-type": "application/json"
        }
      })
  }

  *delete(id: number): Generator<Promise<Response>> {
    const foundIndex = this.expenses.findIndex(e => e.id === id);
    if (foundIndex === -1) {
      return
    }
    this.expenses.splice(foundIndex, 1)
    yield fetch(
      `${process.env.REACT_APP_API_URL}/expense?id=${id}`,
      { method: "DELETE" }
    )
  }

  fromJson(json: ExpenseJson[]) {
    this.expenses = json.map(e => new Expense(
      e.id,
      e.cost,
      e.currency,
      moment(e.date),
      categoryStore.getById(e.category_id),
      e.name
    ))
  }
}

const expenseStore = new ExpenseStore();

export default expenseStore