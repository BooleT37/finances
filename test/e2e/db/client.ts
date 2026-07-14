import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from '../../../src/generated/prisma/client';

export const TEST_DB_URL =
  'postgresql://postgres:postgres@localhost:5435/finances_test';

export const TEST_BASE_URL = 'http://localhost:3001';

// Shared between the webServer's Better Auth instance (src/server/auth.ts,
// via playwright.config.ts's webServer.env) and the test-only instance used
// to mint sessions in db/seed.ts — both must sign with the same secret for
// an injected session cookie to validate.
export const TEST_BETTER_AUTH_SECRET = 'e2e-test-secret-not-for-production-use';

const pool = new Pool({ connectionString: TEST_DB_URL });
// Suppress unhandled 'error' events when the container shuts down idle connections.
pool.on('error', () => {});

export const testPrisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});
