import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { useDebouncedCallback } from '@mantine/hooks';
import { IconInfoCircle, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { CategoryIconComp } from '~/features/categories/components/categoryIcons/CategoryIconComp';
import { categoryIconsGroups } from '~/features/categories/components/categoryIcons/categoryIcons';
import {
  getCategoriesQueryOptions,
  useCreateCategory,
  useUpdateCategory,
} from '~/features/categories/queries';
import type { Category } from '~/features/categories/schema';

import { insertedCategoryAtom } from '../CategoriesTable/flashCategory';
import type { CategoryFormValues } from './categoryFormValues';
import { CategorySidebarMolecule } from './categorySidebarMolecule';

function categoryToFormValues(category: Category): CategoryFormValues {
  return {
    icon: category.icon,
    name: category.name,
    shortname: category.shortname,
    isIncome: category.isIncome ? 'income' : 'expense',
    isContinuous: category.isContinuous,
    subcategories: category.subcategories.map((s) => ({
      id: s.id,
      name: s.name,
    })),
  };
}

const iconSelectData = categoryIconsGroups.map((group) => ({
  group: group.group,
  items: group.icons.map((icon) => ({
    value: icon.value,
    label: icon.label,
  })),
}));

export function CategorySidebarForm() {
  const { editingIdAtom, isNewCategoryAtom, formRefAtom, closeAtom } =
    useMolecule(CategorySidebarMolecule);
  const editingId = useAtomValue(editingIdAtom);
  const isNew = useAtomValue(isNewCategoryAtom);
  const setFormRef = useSetAtom(formRefAtom);
  const close = useSetAtom(closeAtom);
  const setInsertedCategory = useSetAtom(insertedCategoryAtom);
  const store = useStore();
  const { t } = useTranslation('categories');

  const { data: categories } = useQuery(getCategoriesQueryOptions());
  const currentCategory = useMemo(
    () => categories?.find((c) => c.id === editingId) ?? null,
    [categories, editingId],
  );

  // Keep validators stable while always seeing the latest categories + editingId
  const categoriesRef = useRef<Category[] | undefined>(categories);
  const editingIdRef = useRef<number | null | undefined>(editingId);
  useEffect(() => {
    categoriesRef.current = categories;
    editingIdRef.current = editingId;
  });

  const updateCategory = useUpdateCategory();
  const createCategory = useCreateCategory();

  const initialValues = useMemo((): CategoryFormValues => {
    if (currentCategory) {
      return categoryToFormValues(currentCategory);
    }
    return {
      icon: null,
      name: '',
      shortname: '',
      isIncome: 'expense',
      isContinuous: false,
      subcategories: [],
    };
  }, [currentCategory]);

  // Must be declared before useForm so it can be passed as onValuesChange.
  // Uses store.get to avoid a stale closure on `form`.
  const debouncedSave = useDebouncedCallback(async () => {
    const f = store.get(formRefAtom);
    if (editingId == null || !f?.isValid() || !f?.isDirty()) {
      return;
    }
    const values = f.getValues();
    await updateCategory.mutateAsync({
      id: editingId,
      name: values.name,
      shortname: values.shortname,
      icon: values.icon,
      isContinuous: values.isContinuous,
      subcategories: values.subcategories,
    });
    f.resetDirty();
  }, 600);

  const form = useForm<CategoryFormValues>({
    initialValues,
    validateInputOnBlur: true,
    onValuesChange: debouncedSave,
    validate: {
      name: (value: string) => {
        if (value.trim().length === 0) {
          return t('form.errors.nameRequired');
        }
        const taken = categoriesRef.current?.some(
          (c) => c.id !== editingIdRef.current && c.name === value.trim(),
        );
        return taken ? t('form.errors.nameTaken') : null;
      },
      shortname: isNotEmpty(t('form.errors.shortnameRequired')),
      subcategories: {
        name: isNotEmpty(t('form.errors.subcategoryNameRequired')),
      },
    },
  });

  useEffect(() => {
    setFormRef(form);
    return () => setFormRef(null);
  }, [form, setFormRef]);

  const handleSubmit = form.onSubmit(async (values) => {
    const result = await createCategory.mutateAsync({
      name: values.name,
      shortname: values.shortname,
      icon: values.icon,
      isIncome: values.isIncome === 'income',
      isContinuous: values.isContinuous,
      subcategories: values.subcategories.map((s: { name: string }) => ({
        name: s.name,
      })),
    });
    form.reset();
    close();
    setInsertedCategory({ id: result.id, isIncome: result.isIncome });
  });

  const subcategoryFields = form.getValues().subcategories;

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm" pr={16}>
        <Select
          label={t('form.icon')}
          data={iconSelectData}
          value={form.getValues().icon}
          onChange={(val) => form.setFieldValue('icon', val)}
          searchable
          clearable
          leftSection={
            form.getValues().icon ? (
              <CategoryIconComp value={form.getValues().icon!} />
            ) : null
          }
          renderOption={({ option }) => (
            <Group gap="xs">
              <CategoryIconComp value={option.value} />
              <Text size="sm">{option.label}</Text>
            </Group>
          )}
        />

        <TextInput
          label={t('form.name')}
          required
          {...form.getInputProps('name')}
        />

        <TextInput
          label={t('form.shortname')}
          required
          maxLength={16}
          {...form.getInputProps('shortname')}
        />

        <Select
          label={t('form.type')}
          data={[
            { value: 'expense', label: t('form.typeExpense') },
            { value: 'income', label: t('form.typeIncome') },
          ]}
          disabled={!isNew}
          {...form.getInputProps('isIncome')}
        />

        <Group gap="xs" align="center">
          <Switch
            label={t('form.isContinuous')}
            checked={form.getValues().isContinuous}
            onChange={(e) =>
              form.setFieldValue('isContinuous', e.currentTarget.checked)
            }
          />
          <Tooltip
            label={t('form.isContinuousTooltip')}
            multiline
            w={260}
            withArrow
          >
            <IconInfoCircle
              size={16}
              style={{ color: 'var(--mantine-color-dimmed)' }}
            />
          </Tooltip>
        </Group>

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            {t('form.subcategories')}
          </Text>
          {subcategoryFields.map(
            (_: CategoryFormValues['subcategories'][number], index: number) => (
              <Group key={index} gap="xs" align="flex-start">
                <TextInput
                  style={{ flex: 1 }}
                  placeholder={t('form.subcategoryName')}
                  {...form.getInputProps(`subcategories.${index}.name`)}
                />
                <ActionIcon
                  variant="subtle"
                  color="red"
                  mt={4}
                  onClick={() => form.removeListItem('subcategories', index)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ),
          )}
          <Button
            variant="light"
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={() => form.insertListItem('subcategories', { name: '' })}
          >
            {t('form.addSubcategory')}
          </Button>
        </Stack>

        {!isNew && Object.keys(form.errors).length > 0 && (
          <Alert color="yellow" p="xs">
            {t('form.unsavedChanges')}
          </Alert>
        )}

        {isNew && (
          <Button type="submit" mt="sm" disabled={!form.isDirty()}>
            {t('form.add')}
          </Button>
        )}
      </Stack>
    </form>
  );
}
