import { Decimal } from 'decimal.js';
import { useAtomValue } from 'jotai';

import { CostWithDiffCellView } from '~/components/CostWithDiffCellView';
import { costToString } from '~/shared/utils/costToString';
import {
  selectedMonthAtom,
  selectedYearAtom,
  viewModeAtom,
} from '~/stores/month';

import type { CostColValue } from '../../TransactionsTable.types';
import { CostCellView } from './CostCellView';
import {
  type GetCostForecastParams,
  useGetCostForecast,
} from './getCostForecast';

interface Props extends GetCostForecastParams {
  value: CostColValue | null;
  isContinuous: boolean;
}

export function CostAggregatedCellRenderer({
  value,
  isRestRow,
  categoryId,
  subcategoryId,
  isIncome,
  isContinuous,
}: Props) {
  const getCostForecast = useGetCostForecast();
  const forecast =
    getCostForecast({
      categoryId,
      isRestRow,
      subcategoryId,
      isIncome,
    }) ?? new Decimal(0);

  const isYearMode = useAtomValue(viewModeAtom) === 'year';
  const year = useAtomValue(selectedYearAtom);
  const month = useAtomValue(selectedMonthAtom);

  if (!value) {
    return null;
  }

  if (isYearMode) {
    return <CostCellView cost={costToString(value.cost)} />;
  }

  return (
    <CostWithDiffCellView
      cost={value.cost}
      forecast={forecast}
      isContinuous={isContinuous}
      month={month}
      year={year}
      showPlanTooltip
    />
  );
}
