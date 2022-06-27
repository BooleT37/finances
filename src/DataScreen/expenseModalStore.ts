import { action, computed, makeObservable, observable } from "mobx";
import Expense from "../models/Expense";
import expenseStore from "../stores/expenseStore";

class ExpenseModalStore {
  visible: boolean;
  expenseId: number | null;
  lastExpenseId: number | null = null

  constructor() {
    makeObservable(this, {
      visible: observable,
      expenseId: observable,
      lastExpenseId: observable,
      currentExpense: computed,
      lastExpense: computed,
      isNewExpense: computed,
      open: action,
      close: action
    })
  }
  
  get currentExpense(): Expense | undefined {
    return expenseStore.expenses.find(({ id }) => this.expenseId === id)
  }

  get lastExpense(): Expense | undefined {
    return expenseStore.expenses.find(({ id }) => this.lastExpenseId === id)
  }

  get isNewExpense(): boolean {
    return this.currentExpense === undefined
  }

  open(expenseId: number | null): void {
    this.expenseId = expenseId
    this.visible = true
  }

  close(): void {
    this.expenseId = null
    this.visible = false
    this.lastExpenseId = null
  }
}

const expenseModalStore = new ExpenseModalStore()

export default expenseModalStore