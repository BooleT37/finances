import type Decimal from 'decimal.js';

import { decimalSum } from '~/shared/utils/decimalSum';

export function costWithoutComponents(
  cost: Decimal,
  components: { cost: Decimal }[],
): Decimal {
  if (components.length === 0) {
    return cost;
  }
  return cost.minus(decimalSum(...components.map((c) => c.cost)));
}
