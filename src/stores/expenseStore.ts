import { action, computed, flow, makeObservable, observable } from "mobx";
import moment, { Moment } from "moment";
import Currency from "../models/Currency";
import Expense from "../models/Expense";
import { countUniqueMonths } from "../utils";
import categories from "../categories";

interface ExpenseJson {
  id: number;
  name?: string;
  cost: number | null;
  currency: Currency;
  date: string;
  category_id: number;
  personal_expense_id: number | null
}

class ExpenseStore {
  public expenses: Expense[]

  constructor() {
    makeObservable(
      this,
      {
        getById: false,
        expenses: observable,
        tableData: false,
        nextId: false,
        add: flow.bound,
        modify: flow.bound,
        delete: flow.bound,
        fromJson: action,
        totalMonths: computed,
        fillPersonalExpenses: false
      })
  }

  getById(id: number): Expense | undefined {
    return this.expenses.find(e => e.id === id)
  }

  tableData(startDate: Moment, endDate: Moment) {
    return this.expenses
      .filter(e => e.date.isSameOrAfter(startDate) && e.date.isSameOrBefore(endDate))
      .map(ex => ex.asTableData)
  }

  nextId(): number {
    return Math.max(...this.expenses.map(e => e.id)) + 1
  }

  *add(expense: Expense): Generator<Promise<Response>> {
    expense.id = this.nextId()
    this.expenses.push(expense)
    yield fetch(
      `${process.env.REACT_APP_API_URL}/expense`,
      {
        method: "POST", body: JSON.stringify({
          id: expense.id,
          name: expense.name,
          cost: expense.cost,
          currency: expense.currency,
          date: expense.date.format("YYYY-MM-DD"),
          category_id: expense.category.id,
          personal_expense_id: expense.personalExpense?.id ?? null
        }),
        headers: {
          "content-type": "application/json"
        }
      })
  }

  *modify(expense: Expense, then?: () => void): Generator<Promise<Response>> {
    const foundIndex = this.expenses.findIndex(e => e.id === expense.id);
    if (foundIndex !== -1) {
      this.expenses[foundIndex] = expense
      yield fetch(
        `${process.env.REACT_APP_API_URL}/expense`,
        {
          method: "PUT", body: JSON.stringify({
            id: expense.id,
            name: expense.name,
            cost: expense.cost,
            currency: expense.currency,
            date: expense.date.format("YYYY-MM-DD"),
            category_id: expense.category.id,
            personal_expense_id: expense.personalExpense?.id ?? null
          }),
          headers: {
            "content-type": "application/json"
          }
        }).then(res => {
          then?.()
          return res
      })
    } else {
      throw new Error(`Can't find expense with id ${expense.id}`)
    }
  }

  *delete(id: number): Generator<Promise<Response>> {
    const foundIndex = this.expenses.findIndex(e => e.id === id);
    if (foundIndex === -1) {
      return
    }
    const personalExpenseId = this.expenses[foundIndex].personalExpense?.id;
    this.expenses.splice(foundIndex, 1)
    yield fetch(
      `${process.env.REACT_APP_API_URL}/expense?id=${id}`,
      { method: "DELETE" }
    )
    if (personalExpenseId) {
      this.delete(personalExpenseId)
    }
  }

  fillPersonalExpenses(json: ExpenseJson[]) {
    json.forEach(eJson => {
      if (eJson.personal_expense_id) {
        const expense = this.getById(eJson.id)
        if (expense) {
          expense.personalExpense = this.getById(eJson.personal_expense_id) ?? null
        }
      }
    })
  }

  fromJson(json: ExpenseJson[]) {
    this.expenses = json.map(e => new Expense(
      e.id,
      e.cost,
      e.currency,
      moment(e.date),
      categories.getById(e.category_id),
      e.name,
      null
    ))
    this.fillPersonalExpenses(json)
  }

  get totalMonths(): number {
    return countUniqueMonths(this.expenses.map(e => e.date))
  }
}

const expenseStore = new ExpenseStore();

export default expenseStore