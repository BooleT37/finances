import { execSync } from 'child_process';

import { PostgreSqlContainer } from '@testcontainers/postgresql';

import { TEST_DB_URL } from './db/client';
import { seed } from './db/seed';

export default async function globalSetup() {
  console.log('Starting PostgreSQL test container...');
  const container = await new PostgreSqlContainer('postgres:17')
    .withDatabase('finances_test')
    .withPassword('postgres')
    .withUsername('postgres')
    .withExposedPorts({ host: 5435, container: 5432 })
    .start();
  console.log('PostgreSQL test container started');

  execSync('npx prisma migrate deploy', {
    // prisma.config.ts reads DIRECT_DATABASE_URL (see its comment) — no
    // pooler distinction locally/in tests, so both point at the same DB.
    env: {
      ...process.env,
      DATABASE_URL: TEST_DB_URL,
      DIRECT_DATABASE_URL: TEST_DB_URL,
    },
    stdio: 'inherit',
  });

  await seed();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__pgContainer__ = container;
}
