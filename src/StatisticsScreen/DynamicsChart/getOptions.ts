import { AgChartOptions } from "ag-charts-community";
import { DynamicsData } from "./models";

const getOptions = (
  categories: string[],
  categoriesNames: string[],
  data: DynamicsData
): AgChartOptions => ({
  autoSize: true,
  data,
  series: categories.map((s, i) => ({
    xKey: "month",
    yKey: s,
    yName: categoriesNames[i],
    highlightStyle: {
      series: {
        dimOpacity: 0.2,
        strokeWidth: 4,
      },
    },
  })),
  legend: {
    enabled: true,
    position: "right",
  },
});

export default getOptions;
