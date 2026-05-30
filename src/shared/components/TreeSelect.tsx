import './TreeSelect.css';

import { Text } from '@mantine/core';
import RcTreeSelect from 'rc-tree-select';
import type { ReactNode } from 'react';

export interface TreeNode {
  value: string;
  title: ReactNode;
  icon?: string | null;
  /** Custom label shown in the selected-value box (defaults to `title`). */
  selectionTitle?: ReactNode;
  /** Plain-text used for searching when `title` is not a plain string. */
  searchValue?: string;
  children?: TreeNode[];
}

interface Props<T extends string> {
  treeData: TreeNode[];
  value?: T | null;
  onChange: (value: T | null) => void;
  placeholder?: string;
  notFoundContent?: string;
  error?: ReactNode;
  disabled?: boolean;
  titleRender?: (node: TreeNode) => ReactNode;
  /** Node field rendered in the selected-value box. Ignored when `titleRender` is set. */
  selectionProp?: 'selectionTitle';
  /** Node field used for search filtering (default: `title`). */
  searchProp?: 'title' | 'searchValue';
}

export function TreeSelect<T extends string>({
  treeData,
  value = null,
  onChange,
  placeholder,
  notFoundContent,
  error,
  disabled,
  titleRender,
  selectionProp,
  searchProp = 'title',
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
        treeNodeFilterProp={searchProp}
        treeNodeLabelProp={selectionProp}
        treeDefaultExpandAll
        allowClear
        notFoundContent={notFoundContent}
        disabled={disabled}
        virtual={false}
        treeTitleRender={titleRender}
      />
      {error && (
        <Text size="xs" c="red" mt={4}>
          {error}
        </Text>
      )}
    </div>
  );
}
