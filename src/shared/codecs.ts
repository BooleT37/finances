import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { z } from 'zod';

/** Reusable Zod type for dayjs instances */
export const dayjsSchema = z.custom<dayjs.Dayjs>((v) => dayjs.isDayjs(v));

/** Wire: decimal string  ↔  Client: decimal.js Decimal */
export const decimalCodec = z.codec(
  z.string(),
  z.custom<Decimal>((v) => Decimal.isDecimal(v)),
  {
    decode: (s) => new Decimal(s),
    encode: (d) => d.toString(),
  },
);

/**
 * Wire: 'YYYY-MM-DD' calendar-date string  ↔  Client: dayjs at local midnight.
 *
 * Use for Postgres `@db.Date` columns. Encoding via toISOString() would shift
 * the date back a day for users in negative-offset zones; 'YYYY-MM-DD' keeps
 * the calendar date intact across all zones.
 */
export const dateCodec = z.codec(z.string(), dayjsSchema, {
  decode: (s) => dayjs(s),
  encode: (d) => d.format('YYYY-MM-DD'),
});

/**
 * Wire: ISO 8601 UTC string  ↔  Client: dayjs with full timestamp precision.
 *
 * Use for Postgres `DateTime` (timestamp) columns where millisecond precision
 * matters (e.g. createdAt, updatedAt).
 */
export const datetimeCodec = z.codec(z.string(), dayjsSchema, {
  decode: (s) => dayjs(s),
  encode: (d) => d.toISOString(),
});
