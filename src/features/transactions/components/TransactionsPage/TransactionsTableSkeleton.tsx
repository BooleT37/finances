import { Paper, Skeleton, Table } from '@mantine/core';

const GROUP_BG: Record<number, string> = { 0: '#e0e0e0', 1: '#f0f0f0' };

const SKELETON_ROWS: Array<
  { depth: 0 | 1; nameWidth: string } | { depth: 2; nameWidths: string[] }
> = [
  { depth: 0, nameWidth: '12%' },
  { depth: 1, nameWidth: '20%' },
  { depth: 2, nameWidths: ['70%', '55%', '80%'] },
];

export function TransactionsTableSkeleton() {
  return (
    <Paper withBorder radius="sm" style={{ overflow: 'hidden' }}>
      <Table style={{ tableLayout: 'fixed' }}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Skeleton height={12} width="55%" />
            </Table.Th>
            <Table.Th style={{ width: 150 }}>
              <Skeleton height={12} width="50%" />
            </Table.Th>
            <Table.Th style={{ width: 130 }}>
              <Skeleton height={12} width="55%" />
            </Table.Th>
            <Table.Th style={{ width: 130 }}>
              <Skeleton height={12} width="60%" />
            </Table.Th>
            <Table.Th style={{ width: 110 }} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {SKELETON_ROWS.map((row, i) =>
            row.depth === 2 ? (
              row.nameWidths.map((w, j) => (
                <Table.Tr key={`${i}-${j}`}>
                  <Table.Td style={{ padding: 8 }}>
                    <Skeleton height={12} width={w} />
                  </Table.Td>
                  <Table.Td style={{ padding: 8 }}>
                    <Skeleton height={12} width="60%" />
                  </Table.Td>
                  <Table.Td style={{ padding: 8 }}>
                    <Skeleton height={12} width="70%" />
                  </Table.Td>
                  <Table.Td style={{ padding: 8 }}>
                    <Skeleton height={12} width="50%" />
                  </Table.Td>
                  <Table.Td />
                </Table.Tr>
              ))
            ) : (
              <Table.Tr key={i} style={{ background: GROUP_BG[row.depth] }}>
                <Table.Td colSpan={5} style={{ padding: 8 }}>
                  <Skeleton height={12} width={row.nameWidth} />
                </Table.Td>
              </Table.Tr>
            ),
          )}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
