import { AgChartsReact } from "ag-charts-react";
import {
  AgCartesianSeriesTooltipRendererParams,
  AgChartOptions,
} from "ag-grid-community";
import { Checkbox } from "antd";
import { maxBy, range, sum } from "lodash";
import { observer } from "mobx-react";
import moment from "moment";
import { useState } from "react";
import expenseStore from "../../../../stores/expenseStore";
import { costToString, roundCost } from "../../../../utils";
import { CategoriesBreakdown } from "./CategoriesBreakdown";

interface Datum {
  month: string;
  spent: number;
  earned: number;
  saved: number;
}

export const MonthsDataStep: React.FC = observer(function MonthsDataStep() {
  const { expenses } = expenseStore;
  const [showFromSavings, setShowFromSavings] = useState(true);

  const thisYearExpenses = expenses.filter((e) => e.date.year() === 2022);

  const data: Datum[] = range(0, 12).map((month) => ({
    month: moment().month(month).format("MMMM"),
    spent: roundCost(
      sum(
        thisYearExpenses
          .filter(
            (e) =>
              (showFromSavings || !e.category.fromSavings) &&
              !e.category.isIncome &&
              !e.category.toSavings &&
              e.date.month() === month
          )
          .map((e) => e.cost ?? 0)
      )
    ),
    earned: roundCost(
      sum(
        thisYearExpenses
          .filter((e) => e.category.isIncome && e.date.month() === month)
          .map((e) => e.cost ?? 0)
      )
    ),
    saved: roundCost(
      sum(
        thisYearExpenses
          .filter((e) => e.category.toSavings && e.date.month() === month)
          .map((e) => e.cost ?? 0)
      )
    ),
  }));

  const options: AgChartOptions = {
    title: {
      text: "Расходы и доходы по месяцам",
    },
    data,
    series: [
      {
        type: "column",
        xKey: "month",
        yKey: "spent",
        yName: "Потрачено",
        fill: "orangered",
        tooltip: {
          renderer: ({
            yValue,
            yName,
          }: AgCartesianSeriesTooltipRendererParams) => ({
            title: yName,
            content: `${costToString(yValue)}`,
          }),
        },
      },
      {
        type: "column",
        xKey: "month",
        yKey: "earned",
        yName: "Заработано",
        fill: "#50C878",
        tooltip: {
          renderer: ({
            yValue,
            yName,
          }: AgCartesianSeriesTooltipRendererParams) => ({
            title: yName,
            content: `${costToString(yValue)}`,
          }),
        },
      },
      {
        type: "column",
        xKey: "month",
        yKey: "saved",
        yName: "Отложено",
        fill: "dodgerblue",
        tooltip: {
          renderer: ({
            yValue,
            yName,
          }: AgCartesianSeriesTooltipRendererParams) => ({
            title: yName,
            content: `${costToString(yValue)}`,
          }),
        },
      },
    ],
  };

  const mostExpensiveMonth = maxBy(data, "spent");
  const mostExpensiveMonthIndex = data.findIndex(
    (d) => d.month === mostExpensiveMonth?.month
  );

  return (
    <div>
      <Checkbox
        checked={showFromSavings}
        onChange={(e) => {
          setShowFromSavings(e.target.checked);
        }}
      >
        Учитывать траты из сбережений
      </Checkbox>
      <AgChartsReact options={options}></AgChartsReact>
      {mostExpensiveMonth && (
        <div>
          <div>
            Самый дорогой месяц:{" "}
            <b>
              {mostExpensiveMonth.month} (
              {costToString(mostExpensiveMonth.spent)})
            </b>
          </div>
          <CategoriesBreakdown
            month={mostExpensiveMonthIndex}
            showFromSavings={showFromSavings}
          />
        </div>
      )}
    </div>
  );
});
