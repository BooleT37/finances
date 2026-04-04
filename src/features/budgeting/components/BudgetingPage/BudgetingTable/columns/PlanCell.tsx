import { Text, Tooltip } from '@mantine/core';
import type { MRT_Row } from 'mantine-react-table';
import { useTranslation } from 'react-i18next';

import { costToString } from '~/shared/utils/costToString';

import type { BudgetingRow } from '../BudgetingTable.types';
import { isPlanCellLocked } from './isPlanCellLocked';

interface Props {
  row: MRT_Row<BudgetingRow>;
}

export function PlanCell({ row }: Props) {
  const { t } = useTranslation('budgeting');
  const text = <Text size="sm">{costToString(row.original.planSum)}</Text>;
  if (isPlanCellLocked(row.original)) {
    return <Tooltip label={t('lockedPlanTooltip')}>{text}</Tooltip>;
  }
  return text;
}
