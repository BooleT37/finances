import { makeAutoObservable } from "mobx";
import Expense from "../models/Expense";
import expenseStore from "../stores/expenseStore";

class ExpenseModalStore {
  visible: boolean;
  expenseId: number | null;
  lastExpenseId: number | null = null;
  lastSource: number | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get currentExpense(): Expense | undefined {
    return expenseStore.expenses.find(({ id }) => this.expenseId === id);
  }

  get lastExpense(): Expense | undefined {
    return expenseStore.expenses.find(({ id }) => this.lastExpenseId === id);
  }

  get isNewExpense(): boolean {
    return this.currentExpense === undefined;
  }

  open(expenseId: number | null): void {
    this.expenseId = expenseId;
    this.visible = true;
  }

  close(source: number | null): void {
    this.lastSource = source;
    this.expenseId = null;
    this.visible = false;
    this.lastExpenseId = null;
  }
}

const expenseModalStore = new ExpenseModalStore();

export default expenseModalStore;
