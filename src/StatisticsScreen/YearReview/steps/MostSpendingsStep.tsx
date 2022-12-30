import { AgChartsReact } from "ag-charts-react";
import {
  AgCartesianSeriesTooltipRendererParams,
  AgChartOptions,
} from "ag-grid-community";
import { Button } from "antd";
import { sum } from "lodash";
import { observer } from "mobx-react";
import { useState } from "react";
import categories from "../../../readonlyStores/categories";
import expenseStore from "../../../stores/expenseStore";
import { costToString, roundCost } from "../../../utils";

interface BarDatum {
  category: string;
  spent: number;
}

export const MostSpendingsStep: React.FC = observer(
  function MostSpendingsStep() {
    const [allCategoriesShown, setAllCategoriesShown] = useState(false);
    const { expensesByCategoryIdForYear } = expenseStore;

    const expenses = expensesByCategoryIdForYear(2022);

    const data: BarDatum[] = Object.entries(expenses)
      .filter(([categoryId]) => {
        const category = categories.getById(parseInt(categoryId));
        return !category.isIncome && !category.toSavings;
      })
      .map(([categoryId, expenses]): [string, number] => [
        categoryId,
        roundCost(sum(expenses.map((e) => e.cost ?? 0))),
      ])
      .sort((e1, e2) => e2[1] - e1[1])
      .slice(0, allCategoriesShown ? Object.keys(expenses).length : 3)
      .map(
        ([categoryId, spent]): BarDatum => ({
          category: categories.getById(parseInt(categoryId)).name,
          spent,
        })
      );

    const options: AgChartOptions = {
      title: {
        text: "На что мы потратили больше всего?",
      },
      data,
      series: [
        {
          type: "column",
          xKey: "category",
          yKey: "spent",
          yName: "Потрачено",
          tooltip: {
            renderer: ({
              xValue,
              yValue,
            }: AgCartesianSeriesTooltipRendererParams) => ({
              title: xValue,
              content: `${costToString(yValue)} (в среднем ${costToString(
                roundCost(yValue / 12)
              )}/мес)`,
            }),
          },
          label: allCategoriesShown
            ? undefined
            : {
                formatter: (params) => costToString(params.value),
                placement: "outside",
              },
        },
      ],
    };

    return (
      <div>
        <AgChartsReact options={options}></AgChartsReact>
        <Button
          type="link"
          onClick={() => {
            setAllCategoriesShown((shown) => !shown);
          }}
        >
          {allCategoriesShown ? "Показать топ 3" : "Показать все"}
        </Button>
      </div>
    );
  }
);
