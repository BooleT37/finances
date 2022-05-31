import { action, computed, flow, makeObservable, observable } from "mobx";
import moment from "moment";
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
        tableData: computed,
        nextId: computed,
        insert: flow.bound,
        delete: action,
        fromJson: action
      })
  }

  get tableData() {
    return this.expenses.map(ex => ex.asTableData)
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
      "https://rttvji9hud.execute-api.eu-central-1.amazonaws.com/dev/expense",
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

  delete(id: number): void {
    const foundIndex = this.expenses.findIndex(e => e.id === id);
    if (foundIndex === -1) {
      return
    }
    this.expenses.splice(foundIndex, 1)
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