import 'dotenv/config';

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prisma CLI commands (migrate, generate, studio, db push) use this URL,
    // deliberately separate from the app runtime's DATABASE_URL (src/server/
    // db.ts): on Vercel, DATABASE_URL points at Supabase's transaction-mode
    // pooler (built for many concurrent short-lived serverless callers),
    // while `prisma migrate deploy` needs the session-mode pooler for its
    // advisory lock, which transaction mode breaks. Locally/in tests, both
    // vars point at the same plain Postgres connection.
    url: env('DIRECT_DATABASE_URL'),
  },
});
