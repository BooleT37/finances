import { ActionIcon, Group, TextInput } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getCategoryTreeDataQueryOptions } from '~/features/categories/facets/categoryTreeData';
import { TreeSelect } from '~/shared/components/TreeSelect';

import type { ComponentsFormValues } from './ComponentsModal';
import styles from './ComponentsModalRow.module.css';

interface Props {
  form: UseFormReturnType<ComponentsFormValues>;
  index: number;
  highlightedComponentId: number | null;
  onRemove: () => void;
}

export function ComponentsModalRow({
  form,
  index,
  highlightedComponentId,
  onRemove,
}: Props) {
  const { t } = useTranslation('transactions');
  const { data: treeData = [] } = useQuery(
    getCategoryTreeDataQueryOptions({ isIncome: false }),
  );

  const row = form.values.components[index];
  const isHighlighted =
    highlightedComponentId !== null && row?.id === highlightedComponentId;

  return (
    <Group
      align="flex-start"
      wrap="nowrap"
      style={{ position: 'relative' }}
      className={isHighlighted ? styles.highlighted : undefined}
    >
      <Group gap="xs" style={{ flex: 1 }} wrap="nowrap" align="flex-start">
        <TextInput
          placeholder={t('form.comment')}
          style={{ flex: 1 }}
          {...form.getInputProps(`components.${index}.name`)}
        />
        <TextInput
          placeholder={t('form.amount')}
          required
          style={{ width: '7rem', flexShrink: 0 }}
          {...form.getInputProps(`components.${index}.cost`)}
        />
        <div style={{ flex: 1.5, minWidth: 0 }}>
          <TreeSelect
            treeData={treeData}
            placeholder={t('components.categoryRequired')}
            notFoundContent={t('components.categoryNotFound')}
            {...form.getInputProps(`components.${index}.categoryId`)}
          />
        </div>
      </Group>
      <ActionIcon
        variant="subtle"
        color="red"
        onClick={onRemove}
        mt={4}
        aria-label={t('delete.confirm')}
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  );
}
