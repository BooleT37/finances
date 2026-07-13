import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from '../generated/prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  // Supabase's session-mode pooler (used for DATABASE_URL — see
  // prisma/migrate-deploy notes) caps total concurrent connections much
  // lower than transaction mode. Each serverless invocation gets its own
  // fresh Pool, and pg's default max (10) per instance was exhausting that
  // cap under only a handful of concurrent requests ([EMAXCONNSESSION] "max
  // clients reached in session mode"). Capping to 1 per instance keeps many
  // concurrent invocations within the shared limit.
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
