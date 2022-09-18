import { makeAutoObservable, toJS } from "mobx";
import moment, { Moment } from "moment";
import Currency from "../models/Currency";
import Expense, { TableData } from "../models/Expense";
import { countUniqueMonths, roundCost } from "../utils";
import categories from "../readonlyStores/categories";
import { ComparisonData } from "../StatisticsScreen/ComparisonChart/models";
import { PersonalExpCategoryIds } from "../utils/constants";
import costToString from "../utils/costToString";
import sources from "../readonlyStores/sources";
import {
  DATE_FORMAT,
  DATE_SERVER_FORMAT,
  MONTH_DATE_FORMAT,
} from "../constants";
import { groupBy, sum } from "lodash";
import { DynamicsData } from "../StatisticsScreen/DynamicsChart/models";
import { DynamicsDataMonth } from "../StatisticsScreen/DynamicsChart/models/dynamicsData";
import Category from "../models/Category";
import Subscription from "../models/Subscription";
import subscriptionStore from "./subscriptionStore";

interface ExpenseJson {
  id: number;
  name?: string;
  cost: number | null;
  currency: Currency;
  date: string;
  category_id: number;
  personal_expense_id: number | null;
  source_id: number | null;
  subscription_id: number | null;
}

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
        if (tableData.cost && pe && pe.cost) {
          const cost = costToString(pe.cost);
          const author =
            pe.category.id === PersonalExpCategoryIds.Alexey ? "А" : "Л";
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

  *add(expense: Expense): Generator<Promise<Response>> {
    expense.id = this.nextId();
    this.expenses.push(expense);
    yield fetch(`${process.env.REACT_APP_API_URL}/expense`, {
      method: "POST",
      body: JSON.stringify({
        id: expense.id,
        name: expense.name,
        cost: expense.cost,
        currency: Currency.Eur,
        date: expense.date.format(DATE_SERVER_FORMAT),
        category_id: expense.category.id,
        personal_expense_id: expense.personalExpense?.id ?? null,
        source_id: expense.source?.id ?? null,
        subscription_id: expense.subscription?.id ?? null,
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
          currency: Currency.Eur,
          date: expense.date.format(DATE_SERVER_FORMAT),
          category_id: expense.category.id,
          personal_expense_id: expense.personalExpense?.id ?? null,
          source_id: expense.source?.id ?? null,
          subscription_id: expense.subscription?.id ?? null,
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
          moment(e.date),
          categories.getById(e.category_id),
          e.name,
          null,
          e.source_id === null ? null : sources.getById(e.source_id),
          e.subscription_id === null
            ? null
            : subscriptionStore.getById(e.subscription_id)
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

    const interim = from.clone();
    while (to > interim || interim.format("M") === to.format("M")) {
      const month = interim.format(MONTH_DATE_FORMAT);
      if (!dict[month]) {
        dict[month] = {
          date: interim.clone(),
        } as MonthEntry;
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

  totalForMonth(
    year: number,
    month: number,
    isIncome: boolean,
    isPersonal: boolean
  ) {
    return sum(
      this.expenses
        .filter(
          (expense) =>
            expense.date.month() === month &&
            expense.date.year() === year &&
            expense.category.isIncome === isIncome &&
            expense.category.isPersonal === isPersonal
        )
        .map((expense) => expense.cost || 0)
    );
  }

  getAvailableSubscriptions(
    startDate: Moment,
    endDate: Moment,
    category?: Category
  ): SubscriptionForPeriod[] {
    const allSubscriptions = category
      ? subscriptionStore.byCategory[category.name]
      : subscriptionStore.subscriptions;
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
}

const expenseStore = new ExpenseStore();

export default expenseStore;
