import Decimal from 'decimal.js';

export function costToString(
  value: Decimal | number,
  params: { addPlus: boolean } = { addPlus: false },
): string {
  const parsedValue = typeof value === 'number' ? new Decimal(value) : value;
  return parsedValue.isPos() || parsedValue.isZero()
    ? `${params.addPlus ? '+' : ''}€${parsedValue.toFixed(2)}`
    : `-€${parsedValue.neg().toFixed(2)}`;
}

export function costToDiffString(value: Decimal | number): string {
  const str = costToString(value);
  const parsedValue = typeof value === 'number' ? new Decimal(value) : value;
  return parsedValue.isNeg() ? str : `+${str}`;
}
