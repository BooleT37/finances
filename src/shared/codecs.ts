import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { z } from 'zod';

/** Reusable Zod type for dayjs instances */
export const dayjsSchema = z.custom<dayjs.Dayjs>((v) => dayjs.isDayjs(v));

/** Wire: decimal string  ↔  Client: decimal.js Decimal */
export const decimalCodec = z.codec(z.string(), z.instanceof(Decimal), {
  decode: (s) => new Decimal(s),
  encode: (d) => d.toString(),
});

/** Wire: ISO datetime string  ↔  Client: dayjs */
export const datetimeCodec = z.codec(z.string(), dayjsSchema, {
  decode: (s) => dayjs(s),
  encode: (d) => d.toISOString(),
});
