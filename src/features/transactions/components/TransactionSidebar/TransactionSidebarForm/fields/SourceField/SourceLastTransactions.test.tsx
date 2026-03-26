import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

import { fetchAllCategories } from '~/features/categories/api';
import { fetchTransactionsByYear } from '~/features/transactions/api';
import type { TransactionWire } from '~/features/transactions/schema';
import { TODAY_MONTH, TODAY_YEAR } from '~/shared/utils/today';
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

// Month string for the fixed test date, e.g. '2024-04'
const TEST_MONTH_STR = `${TODAY_YEAR}-${String(TODAY_MONTH + 1).padStart(2, '0')}`;
// ISO date string on the 15th of the fixed test month
const TEST_DATE_ISO = `${TODAY_YEAR}-${String(TODAY_MONTH + 1).padStart(2, '0')}-15T00:00:00.000Z`;
// ISO date string on the 20th of the fixed test month (used as actualDate)
const TEST_ACTUAL_DATE_ISO = `${TODAY_YEAR}-${String(TODAY_MONTH + 1).padStart(2, '0')}-20T00:00:00.000Z`;

const makeTx = (overrides: Partial<TransactionWire> = {}): TransactionWire => ({
  id: 1,
  name: '',
  cost: '-50.00',
  date: TEST_DATE_ISO,
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
  // Pin the selected month to the fixed test date using proper JSON encoding
  // (atomWithStorage uses JSON.parse/JSON.stringify, so the value must be JSON-serialised)
  localStorage.setItem(
    'finances.selectedMonth',
    JSON.stringify(TEST_MONTH_STR),
  );
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
      mockedTransactions(TODAY_YEAR, [
        {
          date: TEST_DATE_ISO,
          actualDate: TEST_ACTUAL_DATE_ISO,
        },
      ]),
    );

    render(<SourceLastTransactions sourceId={1} />);
    expect(
      await screen.findByText(
        `Последние траты: 20.${String(TODAY_MONTH + 1).padStart(2, '0')}.${TODAY_YEAR}`,
      ),
    ).toBeInTheDocument();
  });

  it('shows "Category — name" when transaction has a name and "Category" only when it does not', async () => {
    vi.mocked(fetchTransactionsByYear).mockImplementation(
      mockedTransactions(TODAY_YEAR, [
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
      mockedTransactions(TODAY_YEAR, [
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
