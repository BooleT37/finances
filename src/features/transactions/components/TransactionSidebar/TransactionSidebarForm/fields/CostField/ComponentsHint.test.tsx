import Decimal from 'decimal.js';
import { vi } from 'vitest';

import { fetchAllCategories } from '~/features/categories/api';
import { render, screen } from '~/test/render';

import { ComponentsHint } from './ComponentsHint';

vi.mock('~/features/categories/api', () => ({
  fetchAllCategories: vi.fn(),
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
    subcategories: [{ id: 10, name: 'Рынок' }],
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
  {
    id: 3,
    name: 'Зарплата',
    shortname: 'зарплата',
    type: null,
    isIncome: true,
    isContinuous: false,
    icon: null,
    subcategories: [],
  },
];

beforeEach(() => {
  vi.mocked(fetchAllCategories).mockResolvedValue(mockCategories);
});

describe('ComponentsHint', () => {
  it('renders nothing when components list is empty', () => {
    render(<ComponentsHint cost={new Decimal(-50)} components={[]} />);
    expect(document.querySelector('span')).toBeNull();
  });

  it('renders a single-line hint for one expense component', async () => {
    render(
      <ComponentsHint
        cost={new Decimal(-50)}
        components={[
          { name: '', cost: '20', categoryId: 1, subcategoryId: null },
        ]}
      />,
    );
    expect(
      await screen.findByText(/Из них €20\.00 из «Продукты»/),
    ).toBeInTheDocument();
  });

  it('renders a bulleted list with remainder for multiple components', async () => {
    render(
      <ComponentsHint
        cost={new Decimal(-60)}
        components={[
          { name: '', cost: '20', categoryId: 1, subcategoryId: null },
          { name: '', cost: '30', categoryId: 2, subcategoryId: null },
        ]}
      />,
    );

    expect(await screen.findByText('€20.00 из Продукты')).toBeInTheDocument();
    expect(screen.getByText('€30.00 из Транспорт')).toBeInTheDocument();
    expect(screen.getByText(/(остаток: €10\.00)/)).toBeInTheDocument();
  });

  it('includes subcategory name in the label when component has a subcategory', async () => {
    render(
      <ComponentsHint
        cost={new Decimal(-50)}
        components={[
          { name: '', cost: '20', categoryId: 1, subcategoryId: 10 },
        ]}
      />,
    );
    expect(
      await screen.findByText(/Из них €20\.00 из «Продукты - Рынок»/),
    ).toBeInTheDocument();
  });

  it('shows positive cost for an income component', async () => {
    // income component cost comes from API already positive (adaptCost keeps income positive)
    render(
      <ComponentsHint
        cost={new Decimal(200)}
        components={[
          { name: '', cost: '200', categoryId: 3, subcategoryId: null },
        ]}
      />,
    );
    expect(
      await screen.findByText(/Из них €200\.00 из «Зарплата»/),
    ).toBeInTheDocument();
  });

  it('computes the remainder correctly for an income parent with expense components', async () => {
    // parent cost sign is irrelevant — cost.abs() is used for the remainder
    render(
      <ComponentsHint
        cost={new Decimal(200)}
        components={[
          { name: '', cost: '80', categoryId: 1, subcategoryId: null },
          { name: '', cost: '60', categoryId: 2, subcategoryId: null },
        ]}
      />,
    );

    expect(await screen.findByText('€80.00 из Продукты')).toBeInTheDocument();
    expect(screen.getByText(/(остаток: €60\.00)/)).toBeInTheDocument();
  });
});
