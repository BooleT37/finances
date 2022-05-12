import { action, computed, makeObservable, observable } from "mobx";
import Expense from "../models/Expense";
import expenseStore from "../stores/expenseStore";

class ExpenseModalStore {
  visible: boolean;
  expenseId: number;

  constructor() {
    makeObservable(this, {
      visible: observable,
      expenseId: observable,
      currentExpense: computed,
      isNewExpense: computed,
      open: action,
      close: action
    })
  }
  
  get currentExpense(): Expense | undefined {
    return expenseStore.expenses.find(({ id }) => this.expenseId === id)
  }

  get isNewExpense(): boolean {
    return expenseStore.expenses.some(({ id }) => id === expenseModalStore.expenseId)
  }

  open(expenseId: number): void {
    this.expenseId = expenseId
    this.visible = true
  }

  close(): void {
    this.expenseId = -1
    this.visible = false
  }
}

const expenseModalStore = new ExpenseModalStore()

export default expenseModalStore