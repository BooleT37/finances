import { Group, Text, Tooltip } from '@mantine/core';
import type { MRT_Row } from 'mantine-react-table';
import { useTranslation } from 'react-i18next';

import { costToString } from '~/shared/utils/costToString';

import type { BudgetingRow } from '../BudgetingTable.types';
import { isPlanCellLocked } from './isPlanCellLocked';
import { SubscriptionBadge } from './SubscriptionBadge';

interface Props {
  row: MRT_Row<BudgetingRow>;
  month: number;
  year: number;
}

export function PlanCell({ row, month, year }: Props) {
  const { t } = useTranslation('budgeting');
  const text = <Text size="sm">{costToString(row.original.planSum)}</Text>;
  const planText = isPlanCellLocked(row.original) ? (
    <Tooltip label={t('lockedPlanTooltip')}>{text}</Tooltip>
  ) : (
    text
  );

  const hasBadge = row.original.subscriptions.length > 0;

  if (!hasBadge) {
    return planText;
  }

  return (
    <Group gap={4} align="center" wrap="nowrap">
      {planText}
      <SubscriptionBadge row={row} month={month} year={year} />
    </Group>
  );
}
