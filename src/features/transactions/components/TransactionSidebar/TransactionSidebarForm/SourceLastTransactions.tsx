import { Group, Stack, Tooltip } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { useLastTransactionsPerSource } from '~/features/transactions/facets/lastTransactionsPerSource';
import { DATE_FORMAT } from '~/shared/constants';
import { costToString } from '~/shared/utils/costToString';
import { getOrThrow } from '~/shared/utils/getOrThrow';
import { selectedYearAtom } from '~/stores/month';

interface Props {
  sourceId: number;
}

export function SourceLastTransactions({ sourceId }: Props) {
  const { t } = useTranslation('transactions');
  const selectedYear = useAtomValue(selectedYearAtom);
  const lastTransactionsPerSource = useLastTransactionsPerSource(selectedYear);
  const { data: categoryMap = {} } = useQuery(getCategoryMapQueryOptions());

  const txs = lastTransactionsPerSource?.[sourceId] ?? [];
  if (txs.length === 0) return null;

  const lastDate = txs[0].actualDate ?? txs[0].date;

  return (
    <Tooltip
      label={
        <Stack gap={2}>
          {txs.map((tx) => (
            <Group key={tx.id} gap="md" justify="space-between" wrap="nowrap">
              <span>
                {getOrThrow(categoryMap, tx.categoryId, 'Category').name}
                {tx.name && ` — ${tx.name}`}
              </span>
              <span>{costToString(tx.cost)}</span>
            </Group>
          ))}
        </Stack>
      }
    >
      <span style={{ cursor: 'default' }}>
        {t('form.sourceLastEntry', { date: lastDate.format(DATE_FORMAT) })}
      </span>
    </Tooltip>
  );
}
