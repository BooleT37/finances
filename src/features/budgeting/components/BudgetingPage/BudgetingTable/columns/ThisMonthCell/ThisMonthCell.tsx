import { HoverCard } from '@mantine/core';

import { CostWithDiffCellView } from '~/components/CostWithDiffCellView';
import { CostList } from '~/shared/components/CostList';

import type { BudgetingRow } from '../../BudgetingTable.types';
import { useThisMonthLineItems } from './useThisMonthLineItems';

const MAX_VISIBLE = 5;

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
        <CostList items={items} limit={MAX_VISIBLE} />
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
