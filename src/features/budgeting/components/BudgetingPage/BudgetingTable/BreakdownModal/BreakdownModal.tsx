import { Alert, Box, Button, Divider, Group, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import type Decimal from 'decimal.js';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ForecastLineItem } from '~/features/budgeting/schema';
import { costToString } from '~/shared/utils/costToString';
import { evaluateFormula } from '~/shared/utils/formula/evaluateFormula';

import type {
  BreakdownFormRow,
  BreakdownFormValues,
} from './BreakdownModal.utils';
import {
  breakdownTotal,
  EMPTY_BREAKDOWN_ROW,
  lineItemsToFormRows,
  parseQuantity,
} from './BreakdownModal.utils';
import { BreakdownModalRow } from './BreakdownModalRow';

function HeaderLabel({
  children,
  align,
}: {
  children: ReactNode;
  align?: 'right';
}) {
  return (
    <Text size="xs" c="dimmed" lh={1} mb={-4} ta={align}>
      {children}
    </Text>
  );
}

interface Props {
  lineItems: ForecastLineItem[];
  onSave: (rows: BreakdownFormRow[], total: Decimal) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function BreakdownModal({
  lineItems,
  onSave,
  onRemove,
  onClose,
}: Props) {
  const { t } = useTranslation('budgeting');

  const form = useForm<BreakdownFormValues>({
    initialValues: {
      rows:
        lineItems.length > 0
          ? lineItemsToFormRows(lineItems)
          : [{ ...EMPTY_BREAKDOWN_ROW }],
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      values.rows.forEach((row, index) => {
        if (!evaluateFormula(row.unitPrice).ok) {
          errors[`rows.${index}.unitPrice`] = t('breakdown.invalidFormula');
        }
        if (!parseQuantity(row.quantity)) {
          errors[`rows.${index}.quantity`] = t('breakdown.invalidQuantity');
        }
      });
      return errors;
    },
  });

  const [wasSubmitted, setWasSubmitted] = useState(false);

  const total = breakdownTotal(form.values.rows);
  const isTotalPositive = total.gt(0);

  function handleRemove() {
    modals.openConfirmModal({
      title: t('breakdown.remove'),
      children: <Text size="sm">{t('breakdown.removeConfirm')}</Text>,
      labels: { confirm: t('breakdown.remove'), cancel: t('breakdown.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        onRemove();
        onClose();
      },
    });
  }

  function handleSave() {
    setWasSubmitted(true);
    if (form.validate().hasErrors || !isTotalPositive) {
      return;
    }
    onSave(form.values.rows, total);
    onClose();
  }

  return (
    <Stack gap="sm">
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: '7rem 5rem 1fr 6rem auto',
          columnGap: 'var(--mantine-spacing-xs)',
          rowGap: 'var(--mantine-spacing-xs)',
          alignItems: 'start',
        }}
      >
        <HeaderLabel>{t('breakdown.unitPrice')}</HeaderLabel>
        <HeaderLabel>{t('breakdown.quantity')}</HeaderLabel>
        <HeaderLabel>{t('breakdown.comment')}</HeaderLabel>
        <HeaderLabel align="right">{t('breakdown.subtotal')}</HeaderLabel>
        <span />

        {form.values.rows.map((_, index) => (
          <BreakdownModalRow
            key={index}
            form={form}
            index={index}
            onRemove={() => form.removeListItem('rows', index)}
          />
        ))}
      </Box>

      <Button
        variant="default"
        leftSection={<IconPlus size={14} />}
        onClick={() => form.insertListItem('rows', { ...EMPTY_BREAKDOWN_ROW })}
      >
        {t('breakdown.addRow')}
      </Button>

      <Divider />

      <Group justify="space-between" align="center">
        <Text size="sm" fw={600} data-testid="breakdown-total">
          {t('breakdown.total', { cost: costToString(total) })}
        </Text>
        <Group gap="xs">
          {lineItems.length > 0 && (
            <Button variant="subtle" color="red" onClick={handleRemove}>
              {t('breakdown.remove')}
            </Button>
          )}
          <Button onClick={handleSave}>{t('breakdown.save')}</Button>
        </Group>
      </Group>

      {wasSubmitted && !isTotalPositive && (
        <Alert color="yellow" p="xs">
          {t('breakdown.totalMustBePositive')}
        </Alert>
      )}
    </Stack>
  );
}
