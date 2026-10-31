import { useMemo } from 'react';

import type { TreeNode } from '~/shared/components/TreeSelect';

import { buildCategorySubcategoryId } from '../categorySubcategoryId';
import type { Category } from '../schema';
import { useExpenseCategories } from './expenseCategories';
import { useIncomeCategories } from './incomeCategories';

export const categorySearchValue = (category: Category) =>
  `${category.name} ${category.shortname}`;

function categoryToTreeNode(cat: Category): TreeNode {
  const node: TreeNode = {
    value: buildCategorySubcategoryId({ categoryId: cat.id }),
    title: cat.shortname,
    searchValue: categorySearchValue(cat),
    icon: cat.icon,
  };
  if (cat.subcategories.length > 0) {
    node.children = cat.subcategories.map((sub) => ({
      value: buildCategorySubcategoryId({
        categoryId: cat.id,
        subcategoryId: sub.id,
      }),
      title: sub.name,
      searchValue: sub.name,
    }));
  }
  return node;
}

export const useCategoryTreeData = (options?: {
  isIncome?: boolean;
}): TreeNode[] | undefined => {
  const expenseCategories = useExpenseCategories();
  const incomeCategories = useIncomeCategories();
  return useMemo(() => {
    if (!expenseCategories || !incomeCategories) {
      return undefined;
    }
    const categories =
      options?.isIncome === true
        ? incomeCategories
        : options?.isIncome === false
          ? expenseCategories
          : [...expenseCategories, ...incomeCategories];
    return categories.map(categoryToTreeNode);
  }, [expenseCategories, incomeCategories, options?.isIncome]);
};
