import { Group, Text, Tooltip } from '@mantine/core';
import type { MRT_Row } from 'mantine-react-table-open';
import { useTranslation } from 'react-i18next';

import { costToString } from '~/shared/utils/costToString';

import type { BudgetingRow } from '../BudgetingTable.types';
import { isPlanCellLocked } from './isPlanCellLocked';
import { PlanBreakdownButton } from './PlanBreakdownButton';
import { SubscriptionBadge } from './SubscriptionBadge';

interface Props {
  row: MRT_Row<BudgetingRow>;
  month: number;
  year: number;
}

export function PlanCell({ row, month, year }: Props) {
  const { t } = useTranslation('budgeting');

  const { lineItems, isUnderCategoryBreakdown } = row.original;
  const hasBreakdown = lineItems.length > 0;

  const text = <Text size="sm">{costToString(row.original.planSum)}</Text>;
  const lockedLabel = isUnderCategoryBreakdown
    ? t('breakdown.lockedByCategoryBreakdown')
    : t('lockedPlanTooltip');
  const planText =
    !hasBreakdown && isPlanCellLocked(row.original) ? (
      <Tooltip label={lockedLabel}>{text}</Tooltip>
    ) : (
      text
    );

  const hasBadge = row.original.subscriptions.list.length > 0;

  if (!hasBreakdown && !hasBadge) {
    return planText;
  }

  return (
    <Group gap={4} align="center" wrap="nowrap">
      {planText}
      {hasBreakdown && (
        <PlanBreakdownButton row={row.original} month={month} year={year} />
      )}
      {hasBadge && <SubscriptionBadge row={row} month={month} year={year} />}
    </Group>
  );
}
