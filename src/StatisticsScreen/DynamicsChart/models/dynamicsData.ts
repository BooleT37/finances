export type DynamicsDataMonth = {
  [key: string]: number;
} & { month: string };

type DynamicsData = DynamicsDataMonth[];

export default DynamicsData;
