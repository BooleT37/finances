import { groupBy, sum } from "lodash";
import { makeAutoObservable, toJS } from "mobx";
import { computedFn } from "mobx-utils";
import moment, { Moment } from "moment";
import { api } from "../api";
import { ExpenseJson } from "../api/expenseApi";
import {
  DATE_FORMAT,
  DATE_SERVER_FORMAT,
  MONTH_DATE_FORMAT
} from "../constants";
import Category, { CATEGORY_IDS } from "../models/Category";
import Currency from "../models/Currency";
import Expense, { TableData } from "../models/Expense";
import Subscription from "../models/Subscription";
import categories from "../readonlyStores/categories";
import sources from "../readonlyStores/sources";
import { ComparisonData } from "../StatisticsScreen/ComparisonChart/models";
import { DynamicsData } from "../StatisticsScreen/DynamicsChart/models";
import { DynamicsDataMonth } from "../StatisticsScreen/DynamicsChart/models/dynamicsData";
import { countUniqueMonths, roundCost } from "../utils";
import costToString from "../utils/costToString";
import savingSpendingStore from "./savingSpendingStore";
import subscriptionStore from "./subscriptionStore";

interface SubscriptionForPeriod {
  subscription: Subscription;
  firstDate: Moment;
}

class ExpenseStore {
  public expenses: Expense[];

  constructor() {
    makeAutoObservable(this);
  }

  get expensesByCategoryId(): Record<string, Expense[]> {
    return groupBy(this.expenses, "category.id");
  }

  expensesByCategoryIdForYear = computedFn(
    (year: number): Record<string, Expense[]> => {
      return groupBy(
        this.expenses.filter((e) => e.date.year() === year),
        "category.id"
      );
    }
  );

  getById(id: number): Expense | undefined {
    return this.expenses.find((e) => e.id === id);
  }

  tableData(
    startDate: Moment,
    endDate: Moment,
    searchString: string,
    includeUpcomingSubscriptions: boolean
  ): TableData[] {
    const rows = this.expenses
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
        if (tableData.cost && pe && pe.cost !== null) {
          const cost = costToString(pe.cost);
          const author =
            pe.category.id === CATEGORY_IDS.personal.Alexey ? "А" : "Л";
          tableData.cost.personalExpStr = `${cost} личных (${author})`;
        }
        return tableData;
      });
    if (includeUpcomingSubscriptions) {
      return rows.concat(
        this.availableSubscriptionsAsTableData(startDate, endDate, searchString)
      );
    }
    return rows;
  }

  nextId(): number {
    return Math.max(...this.expenses.map((e) => e.id)) + 1;
  }

  async add(expense: Expense): Promise<Response> {
    expense.id = this.nextId();
    this.expenses.push(expense);
    return api.expense.add({
      id: expense.id,
      name: expense.name,
      cost: expense.cost,
      currency: Currency.Eur,
      date: expense.date.format(DATE_SERVER_FORMAT),
      category_id: expense.category.id,
      subcategory_id: expense.subcategory?.id ?? null,
      personal_expense_id: expense.personalExpense?.id ?? null,
      source_id: expense.source?.id ?? null,
      subscription_id: expense.subscription?.id ?? null,
      saving_spending_category_id: expense.savingSpending
        ? expense.savingSpending.category.id
        : null,
    });
  }

  async modify(expense: Expense, then?: () => void): Promise<Response> {
    const foundIndex = this.expenses.findIndex((e) => e.id === expense.id);
    if (foundIndex !== -1) {
      this.expenses[foundIndex] = expense;
      return api.expense
        .modify({
          id: expense.id,
          name: expense.name,
          cost: expense.cost,
          currency: Currency.Eur,
          date: expense.date.format(DATE_SERVER_FORMAT),
          category_id: expense.category.id,
          subcategory_id: expense.subcategory?.id ?? null,
          personal_expense_id: expense.personalExpense?.id ?? null,
          source_id: expense.source?.id ?? null,
          subscription_id: expense.subscription?.id ?? null,
          saving_spending_category_id: expense.savingSpending
            ? expense.savingSpending.category.id
            : null,
        })
        .then((res) => {
          then?.();
          return res;
        });
    } else {
      throw new Error(`Can't find expense with id ${expense.id}`);
    }
  }

  async delete(id: number): Promise<void> {
    const foundIndex = this.expenses.findIndex((e) => e.id === id);
    if (foundIndex === -1) {
      return;
    }
    const personalExpenseId = this.expenses[foundIndex].personalExpense?.id;
    this.expenses.splice(foundIndex, 1);
    await api.expense.delete(id);
    if (personalExpenseId !== undefined) {
      this.delete(personalExpenseId);
    }
  }

  fillPersonalExpenses(json: ExpenseJson[]) {
    json.forEach((eJson) => {
      if (eJson.personal_expense_id !== null) {
        const expense = this.getById(eJson.id);
        if (expense) {
          expense.personalExpense =
            this.getById(eJson.personal_expense_id) ?? null;
        }
      }
    });
  }

  getSavingSpendingByCategoryId(id: number): Expense["savingSpending"] {
    for (const spending of savingSpendingStore.savingSpendings) {
      const found = spending.categories.find((c) => c.id === id);
      if (found) {
        return {
          spending,
          category: found,
        };
      }
    }
    throw new Error(`Can't find spending by category id ${id}`);
  }

  fromJson(json: ExpenseJson[]) {
    this.expenses = json.map(
      (e) => {
        const category = categories.getById(e.category_id);
        return new Expense(
          e.id,
          e.cost,
          moment(e.date),
          category,
          e.subcategory_id === null ? null : category.findSubcategoryById(e.subcategory_id),
          e.name,
          null,
          e.source_id === null ? null : sources.getById(e.source_id),
          e.subscription_id === null
            ? null
            : subscriptionStore.getById(e.subscription_id),
          e.saving_spending_category_id === null
            ? null
            : this.getSavingSpendingByCategoryId(e.saving_spending_category_id)
        )
      }
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
      (e) =>
        !e.category.isIncome &&
        !e.category.toSavings &&
        e.date.isSame(from, granularity)
    );
    const expensesTo = this.expenses.filter(
      (e) =>
        !e.category.isIncome &&
        !e.category.toSavings &&
        e.date.isSame(to, granularity)
    );
    const map: Record<string, { from: number; to: number }> = {};
    expensesFrom.forEach((e) => {
      const categoryId = String(e.category.id);
      if (e.cost !== null) {
        if (map[categoryId] !== undefined) {
          map[categoryId].from += e.cost;
        } else {
          map[categoryId] = { from: e.cost, to: 0 };
        }
      }
    });
    expensesTo.forEach((e) => {
      const categoryId = String(e.category.id);
      if (e.cost !== null) {
        if (map[categoryId] !== undefined) {
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
    categoriesIds: number[]
  ): DynamicsData {
    type MonthEntry = Record<string, number> & { date: Moment };
    const dict: Record<string, MonthEntry> = {};

    let filteredExpensed = this.expenses.filter((e) =>
      e.date.isBetween(from, to, "month", "[]")
    );

    if (categoriesIds.length > 0) {
      filteredExpensed = filteredExpensed.filter((e) =>
        categoriesIds.includes(e.category.id)
      );
    }
    filteredExpensed.forEach((e) => {
      if (e.cost === null) {
        return;
      }
      const month = e.date.format(MONTH_DATE_FORMAT);
      if (dict[month] !== undefined) {
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

    const interim = from.clone();
    const allCategoriesIds =
      categoriesIds.length === 0
        ? categories.getAll().map((c) => c.id)
        : categoriesIds;
    while (to > interim || interim.format("M") === to.format("M")) {
      const month = interim.format(MONTH_DATE_FORMAT);
      if (dict[month] === undefined) {
        dict[month] = {
          date: interim.clone(),
        } as MonthEntry;
      }
      for (let categoryId of allCategoriesIds) {
        if (dict[month][categoryId] === undefined) {
          dict[month][categoryId] = 0;
        }
      }
      interim.add(1, "month");
    }

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

  get lastExpensesPerSource(): Record<number, Expense[]> {
    return Object.fromEntries(
      sources.getAll().map<[number, Expense[]]>((s) => {
        const expensesWithSource = this.expenses.filter(
          (e) => e.source?.id === s.id
        );
        if (expensesWithSource.length > 0) {
          const lastDate = moment.max(expensesWithSource.map((e) => e.date));
          return [
            s.id,
            expensesWithSource.filter((expense) =>
              expense.date.isSame(lastDate, "date")
            ),
          ];
        }
        return [s.id, []];
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
            expense.category.isIncome === isIncome &&
            !expense.category.fromSavings
        )
        .map((expense) => expense.cost ?? 0)
    );
  }

  getAvailableSubscriptions(
    startDate: Moment,
    endDate: Moment,
    category?: Category
  ): SubscriptionForPeriod[] {
    const allSubscriptions = category
      ? subscriptionStore.activeByCategory[category.name] ?? []
      : subscriptionStore.activeSubscriptions;
    let subscriptionsForPeriod = allSubscriptions
      .map((subscription): SubscriptionForPeriod | null => {
        const firstDate = subscription.firstDateInInterval(startDate, endDate);
        if (firstDate) {
          return {
            subscription,
            firstDate,
          };
        }
        return null;
      })
      .filter(
        (subscription): subscription is SubscriptionForPeriod => !!subscription
      );

    if (subscriptionsForPeriod.length === 0) {
      return [];
    }
    const allExpenses = category
      ? this.expensesByCategoryId[category.id]
      : this.expenses;
    const addedSubscriptionsIds = allExpenses
      .filter(
        (expense): expense is Expense & { subscription: Subscription } =>
          expense.subscription !== null &&
          expense.date.isBetween(startDate, endDate, "day", "[]")
      )
      .map((e) => e.subscription.id);
    subscriptionsForPeriod = subscriptionsForPeriod.filter(
      (subscription) =>
        !addedSubscriptionsIds.includes(subscription.subscription.id)
    );
    return subscriptionsForPeriod;
  }

  availableSubscriptionsAsTableData(
    startDate: Moment,
    endDate: Moment,
    searchString: string
  ): TableData[] {
    const subscriptions = this.getAvailableSubscriptions(startDate, endDate);

    let rows = subscriptions.map(({ subscription, firstDate }) => ({
      category: subscription.category.name,
      categoryId: subscription.category.id,
      categoryShortname: subscription.category.shortname,
      subcategory: "",
      cost: {
        value: subscription.cost,
        isSubscription: true,
        isUpcomingSubscription: true,
      },
      date: firstDate.format(DATE_FORMAT),
      id: 0,
      isUpcomingSubscription: true,
      name: subscription.name,
    }));
    if (searchString) {
      rows = rows.filter((data) => data.name.includes(searchString));
    }
    return rows;
  }

  savingSpendingsForecast(year: number, month: number): number {
    return sum(
      this.expenses
        .filter(
          (
            expense
          ): expense is Expense & {
            savingSpending: NonNullable<Expense["savingSpending"]>;
          } =>
            expense.savingSpending !== null &&
            expense.date.month() === month &&
            expense.date.year() === year
        )
        .map((expense) => expense.savingSpending.category.forecast)
    );
  }

  get boundaryDates(): [Moment, Moment] {
    const sorted = this.expenses
      .slice()
      .sort((e1, e2) => e1.date.valueOf() - e2.date.valueOf());

    return [sorted[0].date, sorted[sorted.length - 1].date];
  }
}

const expenseStore = new ExpenseStore();

export default expenseStore;
