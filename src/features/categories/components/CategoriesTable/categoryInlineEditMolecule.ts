import { molecule } from 'bunshi';
import { atom } from 'jotai';
import { atomWithMutation, queryClientAtom } from 'jotai-tanstack-query';

import { getUpdateCategoryMutationOptions } from '../../queries';
import type { Category } from '../../schema';
import { CategorySidebarMolecule } from '../CategorySidebar/categorySidebarMolecule';

export const CategoryInlineEditMolecule = molecule((mol) => {
  const { editingIdAtom, formRefAtom } = mol(CategorySidebarMolecule);

  const updateMutationAtom = atomWithMutation((get) =>
    getUpdateCategoryMutationOptions(get(queryClientAtom)),
  );

  // Takes the full category (the table row already has it) rather than an
  // id + a map-atom lookup, since there's nothing else to fetch here.
  const updateInlineCategoryNameAtom = atom(
    null,
    async (get, set, category: Category, name: string) => {
      const updated = await get(updateMutationAtom).mutateAsync({
        id: category.id,
        name,
        shortname: category.shortname,
        icon: category.icon,
        isContinuous: category.isContinuous,
        subcategories: category.subcategories.map((s) => ({
          id: s.id,
          name: s.name,
        })),
      });

      if (get(editingIdAtom) === category.id) {
        const form = get(formRefAtom);
        if (form) {
          form.setFieldValue('name', name);
          form.resetDirty();
        }
      }

      return updated;
    },
  );

  return {
    updateInlineCategoryNameAtom,
  };
});
