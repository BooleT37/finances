import { AgChartOptions } from "ag-charts-community";
import { ComparisonData } from "./models";

const getOptions = (
  period1: string,
  period2: string,
  data: ComparisonData
): AgChartOptions => ({
  autoSize: true,
  data,
  series: [
    { type: "column", xKey: "category", yKey: "period1", yName: period1 },
    { type: "column", xKey: "category", yKey: "period2", yName: period2 },
  ],
  axes: [
    {
      type: "category",
      position: "bottom",
    },
    {
      type: "number",
      position: "left",
      label: {
        formatter: (params: { value: number }) => {
          return `€${params.value}`;
        },
      },
    },
  ],
});

export default getOptions;
