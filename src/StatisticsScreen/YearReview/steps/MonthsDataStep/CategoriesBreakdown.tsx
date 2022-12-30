import { AgChartsReact } from "ag-charts-react";
import {
  AgCartesianSeriesTooltipRendererParams,
  AgChartOptions,
} from "ag-grid-community";
import { sum } from "lodash";
import { observer } from "mobx-react";
import categories from "../../../../readonlyStores/categories";
import expenseStore from "../../../../stores/expenseStore";
import { costToString, roundCost } from "../../../../utils";

interface BarDatum {
  category: string;
  spent: number;
}

interface Props {
  month: number;
  showFromSavings: boolean;
}

export const CategoriesBreakdown: React.FC<Props> = observer(
  function MostSpendingsStep({ month, showFromSavings }) {
    const { expensesByCategoryIdForYear } = expenseStore;

    const expenses = expensesByCategoryIdForYear(2022);

    const data: BarDatum[] = Object.entries(expenses)
      .filter(([categoryId]) => {
        const category = categories.getById(parseInt(categoryId));
        return (showFromSavings || !category.fromSavings) && !category.isIncome;
      })
      .map(([categoryId, expenses]): [string, number] => [
        categoryId,
        roundCost(
          sum(
            expenses
              .filter((e) => e.date.month() === month)
              .map((e) => e.cost ?? 0)
          )
        ),
      ])
      .sort((e1, e2) => e2[1] - e1[1])
      .slice(0, 3)
      .map(
        ([categoryId, spent]): BarDatum => ({
          category: categories.getById(parseInt(categoryId)).name,
          spent,
        })
      );

    const options: AgChartOptions = {
      title: {
        text: "На что мы потратили больше всего в этом месяце?",
      },
      data,
      series: [
        {
          type: "bar",
          xKey: "category",
          yKey: "spent",
          yName: "Потрачено",
          tooltip: {
            renderer: ({
              xValue,
              yValue,
            }: AgCartesianSeriesTooltipRendererParams) => ({
              title: xValue,
              content: costToString(yValue),
            }),
          },
          label: {
            formatter: (params) => costToString(params.value),
            placement: "outside",
          },
        },
      ],
    };

    return (
      <div>
        <AgChartsReact options={options}></AgChartsReact>
      </div>
    );
  }
);
