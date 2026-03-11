import { queryOptions } from '@tanstack/react-query';

import type { TreeNode } from '~/shared/components/TreeSelect';

import { buildCategorySubcategoryId } from '../categorySubcategoryId';
import { getCategoriesQueryOptions } from '../queries';

export const getCategoryTreeDataQueryOptions = (options?: {
  isIncome?: boolean;
}) =>
  queryOptions({
    ...getCategoriesQueryOptions(),
    select: (data): TreeNode[] =>
      (options?.isIncome !== undefined
        ? data.filter((c) => c.isIncome === options.isIncome)
        : data
      ).map((cat) => {
        const node: TreeNode = {
          value: buildCategorySubcategoryId({ categoryId: cat.id }),
          title: cat.name,
        };
        if (cat.subcategories.length > 0) {
          node.children = cat.subcategories.map((sub) => ({
            value: buildCategorySubcategoryId({
              categoryId: cat.id,
              subcategoryId: sub.id,
            }),
            title: sub.name,
          }));
        }
        return node;
      }),
  });
