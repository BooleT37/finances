import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import type { MRT_TableInstance } from 'mantine-react-table-open';
import { useTranslation } from 'react-i18next';

import { EditableCellInput } from '~/shared/components/EditableCellInput';

import type { Category } from '../../schema';
import { CategoryInlineEditMolecule } from './categoryInlineEditMolecule';

interface CategoryNameCellEditProps {
  row: Category;
  table: MRT_TableInstance<Category>;
}

export function CategoryNameCellEdit({
  row,
  table,
}: CategoryNameCellEditProps) {
  const { t } = useTranslation('categories');
  const { updateInlineCategoryNameAtom } = useMolecule(
    CategoryInlineEditMolecule,
  );
  const updateInlineCategoryName = useSetAtom(updateInlineCategoryNameAtom);

  return (
    <EditableCellInput
      aria-label={t('form.name')}
      initialValue={row.name}
      onClose={() => table.setEditingCell(null)}
      onSave={(value) =>
        // The global error notification middleware already surfaces failures.
        updateInlineCategoryName(row, value).catch(() => {})
      }
    />
  );
}
