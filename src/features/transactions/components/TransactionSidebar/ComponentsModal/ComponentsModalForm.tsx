import { Button, Divider, Stack, Text } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useForm } from '@mantine/form';
import { useQuery } from '@tanstack/react-query';
import { useMolecule } from 'bunshi/react';
import Decimal from 'decimal.js';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import {
  buildCategorySubcategoryId,
  parseCategorySubcategoryId,
} from '~/features/categories/categorySubcategoryId';
import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { adaptCost } from '~/shared/utils/adaptCost';
import { costToString } from '~/shared/utils/costToString';
import { decimalSum } from '~/shared/utils/decimalSum';
import { getOrThrow } from '~/shared/utils/getOrThrow';

import type { TransactionComponentData } from '../TransactionSidebarForm/transactionFormValues';
import { TransactionSidebarMolecule } from '../transactionSidebarMolecule';
import type {
  ComponentFormRow,
  ComponentsFormValues,
  ComponentsFormValuesValidated,
} from './ComponentsModal';
import { ComponentsModalRow } from './ComponentsModalRow';

const costRegex = /^-?\d+(?:\.\d+)?$/;

function rowToComponentData(
  row: ComponentsFormValuesValidated['components'][number],
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

interface Props {
  parentCategoryId: number | null;
  parentSubcategoryId: number | null;
  parentCost: Decimal | null;
  components: TransactionComponentData[];
  onSave: (components: TransactionComponentData[]) => void;
  onClose: () => void;
}

export function ComponentsModalForm({
  parentCategoryId,
  parentSubcategoryId,
  parentCost,
  components,
  onSave,
  onClose,
}: Props) {
  const { t } = useTranslation('transactions');

  const { highlightedComponentIdAtom } = useMolecule(
    TransactionSidebarMolecule,
  );
  const highlightedComponentId = useAtomValue(highlightedComponentIdAtom);
  const { data: categoryMap = {} } = useQuery(getCategoryMapQueryOptions());

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
      (form.values as ComponentsFormValuesValidated).components.map((row) => {
        const component = rowToComponentData(row);
        const category = getOrThrow(
          categoryMap,
          component.categoryId,
          'Category',
        );
        return {
          ...component,
          cost: adaptCost(
            new Decimal(component.cost),
            category.isIncome,
          ).toString(),
        };
      }),
    );
    onClose();
  }

  return (
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
  );
}
