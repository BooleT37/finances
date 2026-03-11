import './TreeSelect.css';

import { Text } from '@mantine/core';
import RcTreeSelect from 'rc-tree-select';
import type { ReactNode } from 'react';

export interface TreeNode {
  value: string;
  title: string;
  children?: TreeNode[];
}

interface Props<T extends string> {
  treeData: TreeNode[];
  value?: T | null;
  onChange: (value: T | null) => void;
  placeholder?: string;
  notFoundContent?: string;
  error?: ReactNode;
}

export function TreeSelect<T extends string>({
  treeData,
  value = null,
  onChange,
  placeholder,
  notFoundContent,
  error,
}: Props<T>) {
  return (
    <div>
      <RcTreeSelect
        className={`treeSelect${error ? ' error' : ''}`}
        dropdownClassName="treeSelectDropdown"
        value={value ?? undefined}
        onChange={(v: string | undefined) => {
          onChange((v as T) ?? null);
        }}
        treeData={treeData}
        placeholder={placeholder}
        showSearch
        treeNodeFilterProp="title"
        treeDefaultExpandAll
        allowClear
        notFoundContent={notFoundContent}
      />
      {error && (
        <Text size="xs" c="red" mt={4}>
          {error}
        </Text>
      )}
    </div>
  );
}
