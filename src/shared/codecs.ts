import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { z } from 'zod';

import { API_DATE_FORMAT } from './constants';

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
 * Wire: API_DATE_FORMAT ('YYYY-MM-DD') calendar-date string  ↔  Client: dayjs at local midnight.
 *
 * Every field using this codec maps to a Postgres `@db.Date` column, so the
 * value is a calendar date with no time/zone. Encoding via toISOString() would
 * shift the date back a day for users in negative-offset zones; encoding as
 * 'YYYY-MM-DD' keeps the calendar date intact across all zones.
 */
export const datetimeCodec = z.codec(z.string(), dayjsSchema, {
  decode: (s) => dayjs(s),
  encode: (d) => d.format(API_DATE_FORMAT),
});
