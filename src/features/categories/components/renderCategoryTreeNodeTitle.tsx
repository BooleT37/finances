import type { ReactNode } from 'react';

import type { TreeNode } from '~/shared/components/TreeSelect';

import { NameWithOptionalIcon } from './NameWithOptionalIcon';

export function renderCategoryTreeNodeTitle(node: TreeNode): ReactNode {
  const name = typeof node.title === 'string' ? node.title : '';
  return <NameWithOptionalIcon name={name} icon={node.icon} reserveIconSpace />;
}
