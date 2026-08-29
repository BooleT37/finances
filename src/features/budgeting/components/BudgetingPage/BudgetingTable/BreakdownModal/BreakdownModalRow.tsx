import { ActionIcon, Text, TextInput, Tooltip } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { IconTrash } from '@tabler/icons-react';
import Decimal from 'decimal.js';
import { useTranslation } from 'react-i18next';

import { costToString } from '~/shared/utils/costToString';
import { evaluateFormula } from '~/shared/utils/formula/evaluateFormula';

import type { BreakdownFormValues } from './BreakdownModal.utils';
import { parseQuantity, rowSubtotal } from './BreakdownModal.utils';

const ZERO = new Decimal(0);

interface Props {
  form: UseFormReturnType<BreakdownFormValues>;
  index: number;
  onRemove: () => void;
}

/** The cells of one grid row — the grid itself lives in `BreakdownModal`. */
export function BreakdownModalRow({ form, index, onRemove }: Props) {
  const { t } = useTranslation('budgeting');
  const row = form.values.rows[index];
  const subtotal = row ? rowSubtotal(row) : null;

  const priceProps = form.getInputProps(`rows.${index}.unitPrice`);
  const quantityProps = form.getInputProps(`rows.${index}.quantity`);

  // An untouched field is empty rather than wrong, so only flag what was typed.
  const isPriceInvalid =
    !!row?.unitPrice.trim() && !evaluateFormula(row.unitPrice).ok;
  const isQuantityInvalid =
    !!row?.quantity.trim() && !parseQuantity(row.quantity);

  return (
    <>
      <TextInput {...priceProps} error={priceProps.error ?? isPriceInvalid} />
      <TextInput
        {...quantityProps}
        error={quantityProps.error ?? isQuantityInvalid}
      />
      <TextInput {...form.getInputProps(`rows.${index}.comment`)} />
      <Text size="sm" ta="right" mt={8}>
        {costToString(subtotal ?? ZERO)}
      </Text>
      <Tooltip label={t('breakdown.deleteRow')}>
        <ActionIcon
          variant="subtle"
          color="red"
          onClick={onRemove}
          aria-label={t('breakdown.deleteRow')}
          mt={4}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Tooltip>
    </>
  );
}
