import { Button, Divider, Modal, Stack, Text } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useForm } from '@mantine/form';
import { useMolecule } from 'bunshi/react';
import Decimal from 'decimal.js';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import {
  buildCategorySubcategoryId,
  type CategorySubcategoryId,
  parseCategorySubcategoryId,
} from '~/features/categories/categorySubcategoryId';
import { costToString } from '~/shared/utils/costToString';
import { decimalSum } from '~/shared/utils/decimalSum';

import type { TransactionComponentData } from '../TransactionSidebarForm/transactionFormValues';
import { TransactionSidebarMolecule } from '../transactionSidebarMolecule';
import { ComponentsModalRow } from './ComponentsModalRow';

export interface ComponentFormRow {
  id?: number;
  name: string;
  cost: string;
  categoryId: CategorySubcategoryId | null;
}

export interface ComponentFormRowValidated extends ComponentFormRow {
  categoryId: CategorySubcategoryId;
}

export interface ComponentsFormValues {
  components: ComponentFormRow[];
}

export interface ComponentsFormValuesValidated {
  components: ComponentFormRowValidated[];
}

interface Props {
  parentCategoryId: number | null;
  parentSubcategoryId: number | null;
  parentCost: Decimal | null;
  components: TransactionComponentData[];
  onSave: (components: TransactionComponentData[]) => void;
}

const costRegex = /^-?\d+(?:\.\d+)?$/;

function rowToComponentData(
  row: ComponentFormRowValidated,
): TransactionComponentData {
  const { categoryId, subcategoryId } = parseCategorySubcategoryId(
    row.categoryId,
  );
  return {
    id: row.id,
    name: row.name,
    cost: row.cost,
    categoryId,
    subcategoryId,
  };
}

function componentToRow(c: TransactionComponentData): ComponentFormRow {
  return {
    id: c.id,
    name: c.name,
    cost: c.cost,
    categoryId: buildCategorySubcategoryId({
      categoryId: c.categoryId,
      subcategoryId: c.subcategoryId,
    }),
  };
}

function costToDecimal(cost: string): Decimal {
  if (!costRegex.test(cost)) {
    return new Decimal(0);
  }
  return new Decimal(cost).abs();
}

export function ComponentsModal({
  parentCategoryId,
  parentSubcategoryId,
  parentCost,
  components,
  onSave,
}: Props) {
  const { t } = useTranslation('transactions');

  const { componentsModalOpenAtom, highlightedComponentIdAtom } = useMolecule(
    TransactionSidebarMolecule,
  );
  const open = useAtomValue(componentsModalOpenAtom);
  const setOpen = useSetAtom(componentsModalOpenAtom);
  const highlightedComponentId = useAtomValue(highlightedComponentIdAtom);

  const form: UseFormReturnType<ComponentsFormValues> =
    useForm<ComponentsFormValues>({
      initialValues: {
        components: components.map(componentToRow),
      },
      validate: (values) => {
        const errors: Record<string, string> = {};
        values.components.forEach((row, i) => {
          if (!costRegex.test(row.cost)) {
            errors[`components.${i}.cost`] = t('components.costRequired');
          }
          if (row.categoryId === null) {
            errors[`components.${i}.categoryId`] = t(
              'components.categoryRequired',
            );
          } else {
            const { categoryId, subcategoryId } = parseCategorySubcategoryId(
              row.categoryId,
            );
            if (
              categoryId === parentCategoryId &&
              subcategoryId === parentSubcategoryId
            ) {
              errors[`components.${i}.categoryId`] = t(
                'components.categorySameAsParent',
              );
            }
          }
        });
        return errors;
      },
    });

  const componentCosts = form.values.components.map((c) =>
    costToDecimal(c.cost),
  );
  const totalComponentCost = decimalSum(...componentCosts);
  const remaining =
    parentCost !== null ? parentCost.abs().minus(totalComponentCost) : null;

  function handleSave() {
    const result = form.validate();
    if (result.hasErrors) {
      return;
    }
    onSave(
      (form.values as ComponentsFormValuesValidated).components.map(
        rowToComponentData,
      ),
    );
    setOpen(false);
  }

  return (
    <Modal
      opened={open}
      onClose={() => setOpen(false)}
      title={t('components.modalTitle')}
      keepMounted={false}
      size="lg"
    >
      <Stack gap="sm">
        {form.values.components.map((_, index) => (
          <ComponentsModalRow
            key={index}
            form={form}
            index={index}
            highlightedComponentId={highlightedComponentId}
            onRemove={() => form.removeListItem('components', index)}
          />
        ))}

        <Button
          variant="default"
          onClick={() =>
            form.insertListItem('components', {
              name: '',
              cost: '',
              categoryId: null,
            } satisfies ComponentFormRow)
          }
        >
          {t('components.addComponent')}
        </Button>

        {remaining !== null && form.values.components.length > 0 && (
          <>
            <Divider />
            <Text size="sm" c="dimmed">
              {t('components.remaining', { value: costToString(remaining) })}
            </Text>
          </>
        )}

        <Button onClick={handleSave} mt="xs">
          {t('form.save')}
        </Button>
      </Stack>
    </Modal>
  );
}
