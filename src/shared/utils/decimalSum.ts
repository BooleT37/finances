import Decimal from 'decimal.js';

export function decimalSum(...decimals: Decimal[]): Decimal {
  if (decimals.length === 0) {
    return new Decimal(0);
  }
  return Decimal.sum(...decimals);
}
