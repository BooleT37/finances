import { HoverCard } from '@mantine/core';
import Decimal from 'decimal.js';
import { useTranslation } from 'react-i18next';

import type { ForecastLineItem } from '~/features/budgeting/schema';
import { CostList } from '~/shared/components/CostList';
import { evaluateFormula } from '~/shared/utils/formula/evaluateFormula';

import { isPlainNumber } from '../BreakdownModal/BreakdownModal.utils';
import type { BudgetingRow } from '../BudgetingTable.types';
import { useOpenBreakdownModal } from '../useOpenBreakdownModal';
import { PlanBreakdownIcon } from './PlanBreakdownIcon';

function lineItemCost(item: ForecastLineItem): Decimal {
  const price = evaluateFormula(item.unitPrice);
  return price.ok ? price.value.times(item.quantity) : new Decimal(0);
}

interface Props {
  row: BudgetingRow;
  month: number;
  year: number;
}

export function PlanBreakdownButton({ row, month, year }: Props) {
  const { t } = useTranslation('budgeting');
  const openBreakdown = useOpenBreakdownModal(month, year);

  function lineItemExtra(item: ForecastLineItem): string | undefined {
    if (!item.quantity.eq(1)) {
      return t('breakdown.extraWithQuantity', {
        formula: item.unitPrice,
        quantity: item.quantity.toString(),
      });
    }
    return isPlainNumber(item.unitPrice) ? undefined : item.unitPrice;
  }

  return (
    <HoverCard width={280} position="bottom-start" withArrow shadow="md">
      <HoverCard.Target>
        <PlanBreakdownIcon
          data-testid="breakdown-icon"
          onClick={(event) => {
            // Without this the click bubbles to the plan cell, whose own
            // onClick would try to open it for editing behind the modal.
            event.stopPropagation();
            openBreakdown(row);
          }}
        />
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <div data-testid="breakdown-tooltip">
          <CostList
            title={t('breakdown.title')}
            items={row.lineItems.map((item) => ({
              key: String(item.id),
              name: item.comment,
              cost: lineItemCost(item),
              extra: lineItemExtra(item),
            }))}
          />
        </div>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
