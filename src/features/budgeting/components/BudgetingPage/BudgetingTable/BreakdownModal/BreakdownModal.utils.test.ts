import Decimal from 'decimal.js';

import type { ForecastLineItem } from '~/features/budgeting/schema';

import type { BreakdownFormRow } from './BreakdownModal.utils';
import {
  breakdownTotal,
  lineItemsToFormRows,
  parseQuantity,
  rowSubtotal,
} from './BreakdownModal.utils';

function row(
  unitPrice: string,
  quantity = '1',
  comment = '',
): BreakdownFormRow {
  return { unitPrice, quantity, comment };
}

describe('parseQuantity', () => {
  it.each([
    ['1', '1'],
    ['3', '3'],
    ['2.5', '2.5'],
    ['2,5', '2.5'],
    ['0.5', '0.5'],
    [' 4 ', '4'],
  ])('parses %j', (input, expected) => {
    expect(parseQuantity(input)?.toString()).toBe(expected);
  });

  it.each(['', '0', '0.0', '-1', 'abc', '1+1', '2*3', '1.', '.5', '1,5,5'])(
    'rejects %j',
    (input) => {
      expect(parseQuantity(input)).toBeNull();
    },
  );

  it('rejects a formula, unlike the unit price', () => {
    expect(parseQuantity('2+3')).toBeNull();
  });
});

describe('rowSubtotal', () => {
  it('multiplies the evaluated price by the quantity', () => {
    expect(rowSubtotal(row('20', '3'))?.toString()).toBe('60');
  });

  it('evaluates a formula price', () => {
    expect(rowSubtotal(row('12+8', '2'))?.toString()).toBe('40');
  });

  it('defaults to a single unit', () => {
    expect(rowSubtotal(row('49.99'))?.toString()).toBe('49.99');
  });

  it('stays exact for prices with cents', () => {
    expect(rowSubtotal(row('19.99', '3'))?.toString()).toBe('59.97');
  });

  it('handles a fractional quantity', () => {
    expect(rowSubtotal(row('4', '2.5'))?.toString()).toBe('10');
  });

  it('allows a negative price for a discount line', () => {
    expect(rowSubtotal(row('-20'))?.toString()).toBe('-20');
  });

  it.each([
    ['1+', '1'],
    ['abc', '1'],
    ['1/0', '1'],
    ['1.5+2,5', '1'],
    ['', '1'],
    ['10', '0'],
    ['10', 'abc'],
    ['10', ''],
  ])('returns null for price %j and quantity %j', (price, quantity) => {
    expect(rowSubtotal(row(price, quantity))).toBeNull();
  });
});

describe('breakdownTotal', () => {
  it('sums the rows', () => {
    expect(
      breakdownTotal([row('10', '2'), row('5', '3'), row('1')]).toString(),
    ).toBe('36');
  });

  it('applies a discount line', () => {
    expect(breakdownTotal([row('100'), row('-20')]).toString()).toBe('80');
  });

  it('is zero for no rows', () => {
    expect(breakdownTotal([]).toString()).toBe('0');
  });

  it('ignores rows that do not evaluate, so the total keeps updating while typing', () => {
    expect(breakdownTotal([row('10'), row('5+')]).toString()).toBe('10');
  });
});

describe('lineItemsToFormRows', () => {
  it('keeps the raw price text and renders the quantity as a plain string', () => {
    const items: ForecastLineItem[] = [
      {
        id: 1,
        unitPrice: '12+8',
        quantity: new Decimal('2.00'),
        comment: 'Овощи',
      },
      {
        id: 2,
        unitPrice: '49.99',
        quantity: new Decimal(1),
        comment: '',
      },
    ];
    expect(lineItemsToFormRows(items)).toEqual([
      { unitPrice: '12+8', quantity: '2', comment: 'Овощи' },
      { unitPrice: '49.99', quantity: '1', comment: '' },
    ]);
  });

  it('is empty for a forecast with no breakdown', () => {
    expect(lineItemsToFormRows([])).toEqual([]);
  });
});
