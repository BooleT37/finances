import './TreeSelect.css';

import { Input, Loader, Text } from '@mantine/core';
import { ClientOnly } from '@tanstack/react-router';
import RcTreeSelect from 'rc-tree-select';
import { type ReactNode, useState } from 'react';

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
  /** Shows a spinner in front of the placeholder. */
  loading?: boolean;
  notFoundContent?: string;
  error?: ReactNode;
  disabled?: boolean;
  titleRender?: (node: TreeNode) => ReactNode;
  /** Node field rendered in the selected-value box. Ignored when `titleRender` is set. */
  selectionProp?: 'selectionTitle';
  /** Node field used for search filtering (default: `title`). */
  searchProp?: 'title' | 'searchValue';
}

function findAncestorValues(nodes: TreeNode[], value: string): string[] | null {
  for (const node of nodes) {
    if (node.value === value) {
      return [];
    }
    const path = findAncestorValues(node.children ?? [], value);
    if (path) {
      return [node.value, ...path];
    }
  }
  return null;
}

export function TreeSelect<T extends string>({
  treeData,
  value = null,
  onChange,
  placeholder,
  loading,
  notFoundContent,
  error,
  disabled,
  titleRender,
  selectionProp,
  searchProp = 'title',
}: Props<T>) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');

  const expandToValue = (open: boolean) => {
    const ancestors =
      open && value ? findAncestorValues(treeData, value) : null;
    if (ancestors?.length) {
      setExpandedKeys((keys) => [...new Set([...keys, ...ancestors])]);
    }
  };

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
          placeholder={
            loading ? (
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Loader size={10} />
                {placeholder}
              </span>
            ) : (
              placeholder
            )
          }
          showSearch
          treeNodeFilterProp={searchProp}
          treeNodeLabelProp={selectionProp}
          allowClear
          notFoundContent={notFoundContent}
          disabled={disabled}
          virtual={false}
          listHeight={300}
          treeTitleRender={titleRender}
          treeExpandedKeys={searchValue ? undefined : expandedKeys}
          onTreeExpand={(keys) => setExpandedKeys(keys.map(String))}
          onSearch={setSearchValue}
          onDropdownVisibleChange={expandToValue}
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
