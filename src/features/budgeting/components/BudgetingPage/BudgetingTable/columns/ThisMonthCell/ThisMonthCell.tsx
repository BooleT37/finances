import { HoverCard } from '@mantine/core';

import { CostWithDiffCellView } from '~/components/CostWithDiffCellView';

import type { BudgetingRow } from '../../BudgetingTable.types';
import { ThisMonthLineItemsList } from './ThisMonthLineItemsList';
import { useThisMonthLineItems } from './useThisMonthLineItems';

interface Props {
  row: BudgetingRow;
  month: number;
  year: number;
}

export function ThisMonthCell({ row, month, year }: Props) {
  const items = useThisMonthLineItems(row, month, year);

  const view = (
    <CostWithDiffCellView
      cost={row.thisMonthActual}
      forecast={row.planSum}
      isContinuous={row.isContinuous}
      month={month}
      year={year}
    />
  );

  if (items.length === 0) {
    return view;
  }

  return (
    <HoverCard
      width={340}
      position="bottom-start"
      withArrow
      shadow="md"
      openDelay={150}
    >
      <HoverCard.Target>
        <div>{view}</div>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <ThisMonthLineItemsList items={items} />
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
