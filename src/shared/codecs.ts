import Decimal from 'decimal.js';
import { z } from 'zod';

/** Wire: decimal string  ↔  Client: decimal.js Decimal */
export const decimalCodec = z.codec(z.string(), z.instanceof(Decimal), {
  decode: (s) => new Decimal(s),
  encode: (d) => d.toString(),
});

/** Wire: ISO datetime string  ↔  Client: Date */
export const datetimeCodec = z.codec(z.string(), z.date(), {
  decode: (s) => new Date(s),
  encode: (d) => d.toISOString(),
});
