import { action, computed, flow, makeObservable, observable, toJS } from "mobx";
import moment, { Moment } from "moment";
import Currency from "../models/Currency";
import Expense from "../models/Expense";
import { countUniqueMonths, roundCost } from "../utils";
import categories from "../readonlyStores/categories";
import { ComparisonData } from "../StatisticsScreen/ComparisonChart/models";
import { PersonalExpCategoryIds } from "../utils/constants";
import costToString from "../utils/costToString";
import sources from "../readonlyStores/sources";
import { DATE_FORMAT, MONTH_DATE_FORMAT } from "../constants";
import { sum } from "lodash";
import { DynamicsData } from "../StatisticsScreen/DynamicsChart/models";
import { DynamicsDataMonth } from "../StatisticsScreen/DynamicsChart/models/dynamicsData";

interface ExpenseJson {
  id: number;
  name?: string;
  cost: number | null;
  currency: Currency;
  date: string;
  category_id: number;
  personal_expense_id: number | null;
  source_id: number | null;
}

class ExpenseStore {
  public expenses: Expense[];

  constructor() {
    makeObservable(this, {
      getById: false,
      expenses: observable,
      tableData: false,
      nextId: false,
      add: flow.bound,
      modify: flow.bound,
      delete: flow.bound,
      fromJson: action,
      totalMonths: computed,
      fillPersonalExpenses: false,
      getComparisonData: action,
      getDynamicsData: action,
      lastModifiedPerSource: computed,
      totalForMonth: false,
    });
  }

  getById(id: number): Expense | undefined {
    return this.expenses.find((e) => e.id === id);
  }

  tableData(startDate: Moment, endDate: Moment, searchString: string) {
    return this.expenses
      .filter(
        (e) =>
          e.date.isSameOrAfter(startDate) &&
          e.date.isSameOrBefore(endDate) &&
          (!searchString ||
            e.name?.toLowerCase().includes(searchString.toLowerCase()))
      )
      .map((ex) => {
        const tableData = ex.asTableData;
        const pe = ex.personalExpense;
        if (tableData.cost && pe && pe.cost) {
          const cost = costToString({ value: pe.cost, currency: pe.currency });
          const author =
            pe.category.id === PersonalExpCategoryIds.Alexey ? "А" : "Л";
          tableData.cost.personalExpStr = `${cost} личных (${author})`;
        }
        return tableData;
      });
  }

  nextId(): number {
    return Math.max(...this.expenses.map((e) => e.id)) + 1;
  }

  *add(expense: Expense): Generator<Promise<Response>> {
    expense.id = this.nextId();
    this.expenses.push(expense);
    yield fetch(`${process.env.REACT_APP_API_URL}/expense`, {
      method: "POST",
      body: JSON.stringify({
        id: expense.id,
        name: expense.name,
        cost: expense.cost,
        currency: expense.currency,
        date: expense.date.format("YYYY-MM-DD"),
        category_id: expense.category.id,
        personal_expense_id: expense.personalExpense?.id ?? null,
        source_id: expense.source?.id ?? null,
      }),
      headers: {
        "content-type": "application/json",
      },
    });
  }

  *modify(expense: Expense, then?: () => void): Generator<Promise<Response>> {
    const foundIndex = this.expenses.findIndex((e) => e.id === expense.id);
    if (foundIndex !== -1) {
      this.expenses[foundIndex] = expense;
      yield fetch(`${process.env.REACT_APP_API_URL}/expense`, {
        method: "PUT",
        body: JSON.stringify({
          id: expense.id,
          name: expense.name,
          cost: expense.cost,
          currency: expense.currency,
          date: expense.date.format("YYYY-MM-DD"),
          category_id: expense.category.id,
          personal_expense_id: expense.personalExpense?.id ?? null,
          source_id: expense.source?.id ?? null,
        }),
        headers: {
          "content-type": "application/json",
        },
      }).then((res) => {
        then?.();
        return res;
      });
    } else {
      throw new Error(`Can't find expense with id ${expense.id}`);
    }
  }

  *delete(id: number): Generator<Promise<Response>> {
    const foundIndex = this.expenses.findIndex((e) => e.id === id);
    if (foundIndex === -1) {
      return;
    }
    const personalExpenseId = this.expenses[foundIndex].personalExpense?.id;
    this.expenses.splice(foundIndex, 1);
    yield fetch(`${process.env.REACT_APP_API_URL}/expense?id=${id}`, {
      method: "DELETE",
    });
    if (personalExpenseId) {
      this.delete(personalExpenseId);
    }
  }

  fillPersonalExpenses(json: ExpenseJson[]) {
    json.forEach((eJson) => {
      if (eJson.personal_expense_id) {
        const expense = this.getById(eJson.id);
        if (expense) {
          expense.personalExpense =
            this.getById(eJson.personal_expense_id) ?? null;
        }
      }
    });
  }

  fromJson(json: ExpenseJson[]) {
    this.expenses = json.map(
      (e) =>
        new Expense(
          e.id,
          e.cost,
          e.currency,
          moment(e.date),
          categories.getById(e.category_id),
          e.name,
          null,
          e.source_id === null ? null : sources.getById(e.source_id)
        )
    );
    this.fillPersonalExpenses(json);
  }

  get totalMonths(): number {
    return countUniqueMonths(this.expenses.map((e) => e.date));
  }

  getComparisonData(
    from: Moment,
    to: Moment,
    granularity: "month" | "quarter" | "year"
  ): ComparisonData {
    const expensesFrom = this.expenses.filter(
      (e) => !e.category.isIncome && e.date.isSame(from, granularity)
    );
    const expensesTo = this.expenses.filter(
      (e) => !e.category.isIncome && e.date.isSame(to, granularity)
    );
    const map: Record<string, { from: number; to: number }> = {};
    expensesFrom.forEach((e) => {
      const categoryId = String(e.category.id);
      if (e.cost) {
        if (map[categoryId] && e.cost) {
          map[categoryId].from += e.cost;
        } else {
          map[categoryId] = { from: e.cost, to: 0 };
        }
      }
    });
    expensesTo.forEach((e) => {
      const categoryId = String(e.category.id);
      if (e.cost) {
        if (map[categoryId] && e.cost) {
          map[categoryId].to += e.cost;
        } else {
          map[categoryId] = { from: 0, to: e.cost };
        }
      }
    });
    return toJS(
      Object.entries(map).map(([category, costs]) => ({
        category: categories.getById(parseInt(category)).shortname,
        period1: costs.from,
        period2: costs.to,
      }))
    );
  }

  getDynamicsData(
    from: Moment,
    to: Moment,
    categoryId: number | null
  ): DynamicsData {
    type MonthEntry = Record<string, number> & { date: Moment };
    const dict: Record<string, MonthEntry> = {};

    let filteredExpensed = this.expenses.filter((e) =>
      e.date.isBetween(from, to, "month", "[]")
    );

    if (categoryId !== null) {
      filteredExpensed = filteredExpensed.filter(
        (e) => e.category.id === categoryId
      );
    }
    filteredExpensed.forEach((e) => {
      if (!e.cost) {
        return;
      }
      const month = e.date.format(MONTH_DATE_FORMAT);
      if (dict[month]) {
        if (dict[month][e.category.id]) {
          dict[month][e.category.id] += e.cost;
        } else {
          dict[month][e.category.id] = e.cost;
        }
      } else {
        dict[month] = {
          date: e.date,
          [e.category.id.toString()]: e.cost,
        } as MonthEntry;
      }
    });

    const data: DynamicsDataMonth[] = Object.values(dict)
      .sort((a, b) => (a.date.isBefore(b.date, "month") ? -1 : 1))
      .map((e) => {
        const month = e.date.format(MONTH_DATE_FORMAT);
        const { date, ...eWithoutDate } = { ...e };
        return { month, ...eWithoutDate } as DynamicsDataMonth;
      });

    data.forEach((m) => {
      Object.keys(m).forEach((k) => {
        if (typeof m[k] === "number") {
          m[k] = roundCost(m[k]);
        }
      });
    });

    return data;
  }

  get lastModifiedPerSource(): Record<number, string | null> {
    return Object.fromEntries(
      sources.getAll().map((s) => {
        const expensesWithSource = this.expenses.filter(
          (e) => e.source?.id === s.id
        );
        if (expensesWithSource.length > 0) {
          return [
            s.id,
            moment
              .max(expensesWithSource.map((e) => e.date))
              .format(DATE_FORMAT),
          ];
        }
        return [s.id, null];
      })
    );
  }

  totalForMonth(year: number, month: number, isIncome: boolean) {
    return sum(
      this.expenses
        .filter(
          (expense) =>
            expense.date.month() === month &&
            expense.date.year() === year &&
            expense.category.isIncome === isIncome
        )
        .map((expense) => expense.cost || 0)
    );
  }
}

const expenseStore = new ExpenseStore();

export default expenseStore;
