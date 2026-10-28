import { Box, Select, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { useBankConnection } from '~/features/import/components/BankConnection/useBankConnection';
import { useUpdateSourceBank } from '~/features/sources/queries';
import type { Source } from '~/features/sources/schema';
import type { Bank } from '~/generated/prisma/enums';

interface Props {
  source: Source;
  bankOptions: { value: string; label: string }[];
}

export function BankCell({ source, bankOptions }: Props) {
  const { t } = useTranslation('sources');
  const updateSourceBank = useUpdateSourceBank();
  const connected = useBankConnection(source.id) !== null;

  return (
    <Tooltip
      label={t('columns.bankLockedTooltip')}
      disabled={!connected}
      multiline
      maw={280}
      withArrow
    >
      <Box>
        <Select
          value={source.bank ?? ''}
          data={bankOptions}
          size="xs"
          variant="unstyled"
          allowDeselect={false}
          disabled={connected}
          onChange={(val) =>
            updateSourceBank.mutate({
              id: source.id,
              bank: val === '' ? null : (val as Bank),
            })
          }
        />
      </Box>
    </Tooltip>
  );
}
