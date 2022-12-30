import { AgChartsReact } from "ag-charts-react";
import {
  AgCartesianSeriesTooltipRendererParams,
  AgChartOptions,
} from "ag-grid-community";
import { costToString, roundCost } from "../../../../utils";

export interface SubscriptionDatum {
  name: string;
  spent: number;
}

interface Props {
  title: string;
  yName: string;
  data: SubscriptionDatum[];
}

// eslint-disable-next-line mobx/missing-observer
export const SubscriptionsChart: React.FC<Props> = (props) => {
  const { title, yName, data } = props;

  const options: AgChartOptions = {
    title: {
      text: title,
    },
    data,
    series: [
      {
        type: "bar",
        xKey: "name",
        yKey: "spent",
        yName,
        tooltip: {
          renderer: ({
            yValue,
            datum,
          }: AgCartesianSeriesTooltipRendererParams) => ({
            title: datum.name,
            content: `${costToString(yValue)} (${costToString(
              roundCost(yValue / 12)
            )}/мес)`,
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
};
