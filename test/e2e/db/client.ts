import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from '../../../src/generated/prisma/client';

export const TEST_DB_URL =
  'postgresql://postgres:postgres@localhost:5434/finances_test';

const pool = new Pool({ connectionString: TEST_DB_URL });
// Suppress unhandled 'error' events when the container shuts down idle connections.
pool.on('error', () => {});

export const testPrisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});
