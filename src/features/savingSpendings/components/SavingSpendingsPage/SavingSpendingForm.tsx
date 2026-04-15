import {
  ActionIcon,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import {
  useCreateSavingSpending,
  useUpdateSavingSpending,
} from '../../queries';
import type { SavingSpending } from '../../schema';

const forecastRegex = /^-?\d+(\.\d+)?$/;

interface CategoryFormRow {
  id?: number;
  name: string;
  forecast: string;
  comment: string;
}

interface FormValues {
  name: string;
  categories: CategoryFormRow[];
}

interface Props {
  editItem: SavingSpending | null;
  onClose: () => void;
}

export function SavingSpendingForm({ editItem, onClose }: Props) {
  const { t } = useTranslation('savingSpendings');
  const createMutation = useCreateSavingSpending();
  const updateMutation = useUpdateSavingSpending();

  const isEditing = editItem !== null;

  const actualMap = new Map(
    editItem?.categories.map((cat) => [cat.id, cat.actual]) ?? [],
  );

  const form = useForm<FormValues>({
    initialValues: isEditing
      ? {
          name: editItem.name,
          categories: editItem.categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            forecast: cat.forecast.toString(),
            comment: cat.comment,
          })),
        }
      : {
          name: '',
          categories: [{ name: '', forecast: '0', comment: '' }],
        },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.name.trim()) {
        errors.name = t('validation.nameRequired');
      }
      values.categories.forEach((cat, i) => {
        if (!cat.name.trim()) {
          errors[`categories.${i}.name`] = t('validation.categoryNameRequired');
        }
        if (!forecastRegex.test(cat.forecast)) {
          errors[`categories.${i}.forecast`] = t('validation.planRequired');
        }
      });
      return errors;
    },
  });

  function handleNameBlur() {
    if (!isEditing && form.values.categories[0]?.name === '') {
      form.setFieldValue('categories.0.name', form.values.name);
    }
  }

  function handleSubmit() {
    const result = form.validate();
    if (result.hasErrors) {
      return;
    }

    const values = form.values;

    if (isEditing) {
      updateMutation.mutate(
        { id: editItem.id, name: values.name, categories: values.categories },
        {
          onSuccess: () => {
            notifications.show({
              message: t('notifications.updated'),
              color: 'green',
            });
            onClose();
          },
        },
      );
    } else {
      createMutation.mutate(
        { name: values.name, categories: values.categories },
        {
          onSuccess: () => {
            notifications.show({
              message: t('notifications.created'),
              color: 'green',
            });
            onClose();
          },
        },
      );
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Stack gap="md">
      <TextInput
        label={t('modal.eventName')}
        required
        {...form.getInputProps('name')}
        onBlur={handleNameBlur}
      />

      <Stack gap="xs">
        {form.values.categories.map((row, index) => {
          const hasExpenses =
            row.id !== undefined &&
            (actualMap.get(row.id)?.greaterThan(0) ?? false);
          return (
            <Group key={index} align="flex-start" gap="sm">
              <TextInput
                label={index === 0 ? t('categoryForm.name') : undefined}
                placeholder={t('categoryForm.name')}
                required
                style={{ flex: 2 }}
                {...form.getInputProps(`categories.${index}.name`)}
              />
              <TextInput
                label={index === 0 ? t('categoryForm.plan') : undefined}
                placeholder="0"
                required
                rightSection={
                  <Text size="sm" c="dimmed">
                    {t('categoryForm.planSuffix')}
                  </Text>
                }
                style={{ flex: 1 }}
                {...form.getInputProps(`categories.${index}.forecast`)}
              />
              <TextInput
                label={index === 0 ? t('categoryForm.comment') : undefined}
                placeholder={t('categoryForm.comment')}
                style={{ flex: 3 }}
                {...form.getInputProps(`categories.${index}.comment`)}
              />
              <Tooltip
                label={
                  hasExpenses
                    ? t('categoryForm.deleteCategoryDisabled')
                    : t('categoryForm.deleteCategory')
                }
              >
                <ActionIcon
                  variant="subtle"
                  mb={6}
                  disabled={form.values.categories.length === 1 || hasExpenses}
                  aria-label={t('categoryForm.deleteCategory')}
                  onClick={() => form.removeListItem('categories', index)}
                  style={{ alignSelf: index === 0 ? 'flex-end' : 'flex-start' }}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          );
        })}
      </Stack>

      <Button
        variant="default"
        leftSection={<IconPlus size={16} />}
        styles={{ root: { borderStyle: 'dashed' } }}
        onClick={() =>
          form.insertListItem('categories', {
            name: '',
            forecast: '0',
            comment: '',
          } satisfies CategoryFormRow)
        }
      >
        {t('modal.addCategory')}
      </Button>

      <Group justify="flex-end" mt="sm">
        <Button variant="default" onClick={onClose} disabled={isPending}>
          {t('modal.cancel')}
        </Button>
        <Button onClick={handleSubmit} loading={isPending}>
          {t('modal.save')}
        </Button>
      </Group>
    </Stack>
  );
}
