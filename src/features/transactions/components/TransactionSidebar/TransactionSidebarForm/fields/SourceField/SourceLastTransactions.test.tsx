import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

import { fetchAllCategories } from '~/features/categories/api';
import { fetchTransactionsByYear } from '~/features/transactions/api';
import type { TransactionWire } from '~/features/transactions/schema';
import { render, screen } from '~/test/render';

import { SourceLastTransactions } from './SourceLastTransactions';

vi.mock('~/features/categories/api', () => ({
  fetchAllCategories: vi.fn(),
}));

vi.mock('~/features/transactions/api', () => ({
  fetchTransactionsByYear: vi.fn(),
  createTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  updateTransaction: vi.fn(),
}));

const mockCategories = [
  {
    id: 1,
    name: 'Продукты',
    shortname: 'продукты',
    type: null,
    isIncome: false,
    isContinuous: false,
    icon: null,
    subcategories: [],
  },
  {
    id: 2,
    name: 'Транспорт',
    shortname: 'транспорт',
    type: null,
    isIncome: false,
    isContinuous: false,
    icon: null,
    subcategories: [],
  },
];

const makeTx = (overrides: Partial<TransactionWire> = {}): TransactionWire => ({
  id: 1,
  name: '',
  cost: '-50.00',
  date: '2026-01-15T00:00:00.000Z',
  actualDate: null,
  categoryId: 1,
  subcategoryId: null,
  sourceId: 1,
  subscriptionId: null,
  savingSpendingCategoryId: null,
  components: [],
  ...overrides,
});

const mockedTransactions =
  (year: number, txs: Partial<TransactionWire>[]) =>
  async ({ data: y }: { data: number }) =>
    y === year ? txs.map(makeTx) : [];

beforeEach(() => {
  // Pin the selected month so selectedYearAtom always yields 2026
  localStorage.setItem('finances.selectedMonth', '2026-03');
  vi.mocked(fetchAllCategories).mockResolvedValue(mockCategories);
  vi.mocked(fetchTransactionsByYear).mockResolvedValue([]);
});

describe('SourceLastTransactions', () => {
  it('renders nothing when there are no transactions for the given sourceId', () => {
    render(<SourceLastTransactions sourceId={1} />);
    expect(document.querySelector('span')).toBeNull();
  });

  it('displays the most recent date and prefers actualDate over date', async () => {
    vi.mocked(fetchTransactionsByYear).mockImplementation(
      mockedTransactions(2026, [
        {
          date: '2026-01-15T00:00:00.000Z',
          actualDate: '2026-01-20T00:00:00.000Z',
        },
      ]),
    );

    render(<SourceLastTransactions sourceId={1} />);
    expect(
      await screen.findByText('Последние траты: 20.01.2026'),
    ).toBeInTheDocument();
  });

  it('shows "Category — name" when transaction has a name and "Category" only when it does not', async () => {
    vi.mocked(fetchTransactionsByYear).mockImplementation(
      mockedTransactions(2026, [
        { id: 1, name: 'Батончик', categoryId: 1 },
        { id: 2, name: '', categoryId: 2 },
      ]),
    );

    render(<SourceLastTransactions sourceId={1} />);
    const trigger = await screen.findByText(/Последние траты/);
    fireEvent.mouseEnter(trigger);

    expect(await screen.findByText('Продукты — Батончик')).toBeInTheDocument();
    expect(screen.getByText('Транспорт')).toBeInTheDocument();
  });

  it('tooltip lists each transaction with its category name and formatted cost', async () => {
    vi.mocked(fetchTransactionsByYear).mockImplementation(
      mockedTransactions(2026, [
        { id: 1, cost: '-30.00', categoryId: 1 },
        { id: 2, cost: '-20.00', categoryId: 2 },
      ]),
    );

    render(<SourceLastTransactions sourceId={1} />);
    const trigger = await screen.findByText(/Последние траты/);
    fireEvent.mouseEnter(trigger);

    expect(await screen.findByText('Продукты')).toBeInTheDocument();
    expect(screen.getByText('-€30.00')).toBeInTheDocument();
    expect(screen.getByText('Транспорт')).toBeInTheDocument();
    expect(screen.getByText('-€20.00')).toBeInTheDocument();
  });
});
