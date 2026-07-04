import './TreeSelect.css';

import { Input, Text } from '@mantine/core';
import { ClientOnly } from '@tanstack/react-router';
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
      {/* rc-tree-select renders something SSR can't type-check correctly
          (throws "Element type is invalid" during server rendering on a
          real browser's first request) — render it client-only and fall
          back to a plain disabled input during SSR/hydration. */}
      <ClientOnly fallback={<Input disabled placeholder={placeholder} />}>
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
          allowClear
          notFoundContent={notFoundContent}
          disabled={disabled}
          virtual={false}
          listHeight={300}
          treeTitleRender={titleRender}
        />
      </ClientOnly>
      {error && (
        <Text size="xs" c="red" mt={4}>
          {error}
        </Text>
      )}
    </div>
  );
}
