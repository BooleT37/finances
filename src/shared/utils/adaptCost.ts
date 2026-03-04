import Decimal from 'decimal.js';

export const adaptCost = (cost: Decimal, isIncome: boolean): Decimal =>
  isIncome || cost.eq(0) ? cost : cost.abs().negated();
