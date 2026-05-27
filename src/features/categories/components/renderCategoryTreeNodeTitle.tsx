import type { ReactNode } from 'react';

import type { TreeNode } from '~/shared/components/TreeSelect';

import { NameWithOptionalIcon } from './NameWithOptionalIcon';

export function renderCategoryTreeNodeTitle(node: TreeNode): ReactNode {
  return (
    <NameWithOptionalIcon name={node.title} icon={node.icon} reserveIconSpace />
  );
}
