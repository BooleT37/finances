/**
 * One-time migration for a database that was built by finances-t3's Prisma
 * migrations (not this app's) and already holds real single-tenant data.
 *
 * Transforms the legacy schema (implicit single User owning everything) into
 * the Project-based schema, preserving all existing domain data by backfilling
 * a single bootstrap Project, then creates the first admin User through Better
 * Auth's own API (so password hashing matches what sign-in later verifies
 * against). Finally resets Prisma's `_prisma_migrations` bookkeeping so
 * `prisma migrate deploy` works normally against this DB from now on —
 * whatever history the DB had before (finances-t3's own, on dev/prod; a
 * partial one on local) is wiped and replaced with rows for exactly this
 * repo's two migrations (init + auth_and_projects), regardless of what was
 * there before.
 *
 * Resumable: if a "Project" row already exists, the schema/data step is
 * skipped and the script goes straight to migration-history reconciliation +
 * admin user creation (safe to re-run after a partial failure).
 *
 * Usage: npx tsx scripts/migrate-legacy-db.ts <local|dev|prod>
 */
import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

import 'dotenv/config';
import { Client } from 'pg';

const INIT_MIGRATION = '20250221000000_init';
const AUTH_AND_PROJECTS_MIGRATION = '20260711100435_auth_and_projects';
const PROJECT_ID = 'amalias-home';
const PROJECT_NAME = "Amalia's Home";

const ENV_DATABASE_URLS: Record<string, string | undefined> = {
  local: process.env.DATABASE_URL,
  // Fill in once available — never commit real values here even though this
  // file is gitignored; prefer exporting DEV_DATABASE_URL/PROD_DATABASE_URL
  // in your shell before running against those environments.
  dev: process.env.DEV_DATABASE_URL,
  prod: process.env.PROD_DATABASE_URL,
};

const KEY_LF = 0x0a;
const KEY_CR = 0x0d;
const KEY_EOF = 0x04;
const KEY_INTERRUPT = 0x03;
const KEY_BACKSPACE = 0x08;
const KEY_DELETE = 0x7f;

// zsh enables bracketed paste mode at its own prompt by default, and that
// terminal-level setting persists when this process takes over stdin. Without
// disabling it here, a pasted (Cmd+V) password arrives wrapped in escape
// sequences (ESC[200~...ESC[201~) that get appended into the captured input
// as literal bytes, silently corrupting the password that gets hashed.
const DISABLE_BRACKETED_PASTE = '\x1b[?2004l';
const ENABLE_BRACKETED_PASTE = '\x1b[?2004h';

function readHidden(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(DISABLE_BRACKETED_PASTE);
    process.stdout.write(promptText);
    const stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    let input = '';
    const onData = (buf: Buffer) => {
      const code = buf[0];
      if (code === undefined) return;
      if (code === KEY_LF || code === KEY_CR || code === KEY_EOF) {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write(ENABLE_BRACKETED_PASTE);
        process.stdout.write('\n');
        resolve(input);
      } else if (code === KEY_INTERRUPT) {
        process.stdout.write(ENABLE_BRACKETED_PASTE);
        process.stdout.write('\n');
        process.exit(1);
      } else if (code === KEY_BACKSPACE || code === KEY_DELETE) {
        input = input.slice(0, -1);
      } else {
        input += buf.toString('utf8');
      }
    };
    stdin.on('data', onData);
  });
}

// Supabase's transaction-mode pooler (port 6543) breaks Prisma migrate's
// advisory-lock usage and hangs indefinitely. Session mode (5432) on the same
// pooler host works fine. No-op for URLs that don't use port 6543 (local,
// or a prod URL that's already session-mode).
function toSessionModeUrl(url: string): string {
  return url.replace(':6543/', ':5432/');
}

async function main() {
  const env = process.argv[2];
  if (!env || !(env in ENV_DATABASE_URLS)) {
    console.error('Usage: npx tsx scripts/migrate-legacy-db.ts <local|dev|prod>');
    process.exit(1);
  }

  const databaseUrl = ENV_DATABASE_URLS[env];
  if (!databaseUrl) {
    console.error(
      `No DATABASE_URL resolved for env "${env}". For "dev"/"prod", export DEV_DATABASE_URL/PROD_DATABASE_URL first.`,
    );
    process.exit(1);
  }
  process.env.DATABASE_URL = databaseUrl;

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const existingProject = await client
    .query('SELECT id FROM "Project" LIMIT 1')
    .catch(() => ({ rows: [] as unknown[] }));
  const schemaAlreadyMigrated = existingProject.rows.length > 0;

  if (schemaAlreadyMigrated) {
    console.log(
      'Schema/data already migrated (Project exists) — skipping straight to migration-history reconciliation and admin user creation.',
    );
  } else {
    console.log(
      `Migrating ${env} database schema + data (bootstrap project: "${PROJECT_NAME}")...`,
    );
    await client.query('BEGIN');
    try {
      // 1. Project table + the single bootstrap project
      await client.query(`
        CREATE TABLE "Project" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
        );
      `);
      await client.query('INSERT INTO "Project" (id, name) VALUES ($1, $2)', [
        PROJECT_ID,
        PROJECT_NAME,
      ]);

      // 2. Add nullable projectId columns, backfill from the single legacy userId,
      //    then drop userId and tighten projectId to NOT NULL + FK + unique constraints.
      const domainTables = [
        { table: 'Category', onDelete: 'CASCADE' },
        { table: 'Source', onDelete: 'RESTRICT' },
        { table: 'SavingSpending', onDelete: 'RESTRICT' },
        { table: 'Subscription', onDelete: 'RESTRICT' },
        { table: 'Expense', onDelete: 'RESTRICT' },
        { table: 'Forecast', onDelete: 'RESTRICT' },
      ];

      for (const { table } of domainTables) {
        await client.query(
          `ALTER TABLE "${table}" ADD COLUMN "projectId" TEXT;`,
        );
        await client.query(`UPDATE "${table}" SET "projectId" = $1;`, [
          PROJECT_ID,
        ]);
        await client.query(
          `ALTER TABLE "${table}" DROP CONSTRAINT "${table}_userId_fkey";`,
        );
      }

      await client.query('DROP INDEX "Category_name_userId_key";');
      await client.query(
        'DROP INDEX "Forecast_categoryId_subcategoryId_month_year_userId_key";',
      );

      // Expense also gains a brand-new createdAt column as part of this
      // migration (bundled into the same generated migration file as the
      // projectId rename, unrelated to it) — the mechanical loop above only
      // handles the userId->projectId rename shared by all domain tables, so
      // this needs to be added explicitly or it's silently missing once
      // `prisma migrate resolve` marks the migration applied without running
      // its SQL.
      await client.query(
        'ALTER TABLE "Expense" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;',
      );

      for (const { table, onDelete } of domainTables) {
        await client.query(`ALTER TABLE "${table}" DROP COLUMN "userId";`);
        await client.query(
          `ALTER TABLE "${table}" ALTER COLUMN "projectId" SET NOT NULL;`,
        );
        await client.query(`
          ALTER TABLE "${table}" ADD CONSTRAINT "${table}_projectId_fkey"
            FOREIGN KEY ("projectId") REFERENCES "Project"("id")
            ON DELETE ${onDelete} ON UPDATE CASCADE;
        `);
      }

      await client.query(
        'CREATE UNIQUE INDEX "Category_name_projectId_key" ON "Category"("name", "projectId");',
      );
      await client.query(`
        CREATE UNIQUE INDEX "Forecast_categoryId_subcategoryId_month_year_projectId_key"
          ON "Forecast"("categoryId", "subcategoryId", "month", "year", "projectId");
      `);

      // 3. ProjectSetting, migrated from the single UserSetting row (if any)
      await client.query(`
        CREATE TABLE "ProjectSetting" (
          "id" SERIAL NOT NULL,
          "pePerMonth" DECIMAL(9,2),
          "savings" DECIMAL(9,2),
          "savingsDate" DATE,
          "projectId" TEXT NOT NULL,
          "incomeCategoriesOrder" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
          "expenseCategoriesOrder" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
          "sourcesOrder" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
          CONSTRAINT "ProjectSetting_pkey" PRIMARY KEY ("id")
        );
      `);
      await client.query(
        'CREATE UNIQUE INDEX "ProjectSetting_projectId_key" ON "ProjectSetting"("projectId");',
      );
      await client.query(`
        ALTER TABLE "ProjectSetting" ADD CONSTRAINT "ProjectSetting_projectId_fkey"
          FOREIGN KEY ("projectId") REFERENCES "Project"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      await client.query(
        `INSERT INTO "ProjectSetting"
           ("pePerMonth", "savings", "savingsDate", "projectId",
            "incomeCategoriesOrder", "expenseCategoriesOrder", "sourcesOrder")
         SELECT "pePerMonth", "savings", "savingsDate", $1,
                "incomeCategoriesOrder", "expenseCategoriesOrder", "sourcesOrder"
         FROM "UserSetting";`,
        [PROJECT_ID],
      );
      await client.query('DROP TABLE "UserSetting";');

      // 4. Drop the old placeholder User table entirely — its identity isn't
      //    worth preserving (no real credentials ever existed for it).
      //    NOTE: `DROP TABLE ... CASCADE` only drops dependent FK *constraints*,
      //    not the dependent tables themselves — Account/Session/VerificationToken
      //    (NextAuth-era leftovers on dev/prod, never present on local) survive
      //    it and need to be dropped explicitly before recreating them below.
      await client.query('DROP TABLE "User" CASCADE;');
      await client.query('DROP TABLE IF EXISTS "Session";');
      await client.query('DROP TABLE IF EXISTS "Account";');
      await client.query('DROP TABLE IF EXISTS "VerificationToken";');

      // 5. Fresh Better-Auth-shaped auth tables
      await client.query(`
        CREATE TABLE "User" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "emailVerified" BOOLEAN NOT NULL DEFAULT false,
          "image" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "role" TEXT NOT NULL DEFAULT 'user',
          "banned" BOOLEAN DEFAULT false,
          "banReason" TEXT,
          "banExpires" TIMESTAMP(3),
          "projectId" TEXT NOT NULL,
          CONSTRAINT "User_pkey" PRIMARY KEY ("id")
        );
      `);
      await client.query(
        'CREATE UNIQUE INDEX "User_email_key" ON "User"("email");',
      );
      await client.query(`
        ALTER TABLE "User" ADD CONSTRAINT "User_projectId_fkey"
          FOREIGN KEY ("projectId") REFERENCES "Project"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      `);

      await client.query(`
        CREATE TABLE "Session" (
          "id" TEXT NOT NULL,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "token" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "impersonatedBy" TEXT,
          "userId" TEXT NOT NULL,
          CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
        );
      `);
      await client.query(
        'CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");',
      );
      await client.query(`
        ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      `);

      await client.query(`
        CREATE TABLE "Account" (
          "id" TEXT NOT NULL,
          "accountId" TEXT NOT NULL,
          "providerId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "accessToken" TEXT,
          "refreshToken" TEXT,
          "idToken" TEXT,
          "accessTokenExpiresAt" TIMESTAMP(3),
          "refreshTokenExpiresAt" TIMESTAMP(3),
          "scope" TEXT,
          "password" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
        );
      `);
      await client.query(`
        ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      `);

      await client.query(`
        CREATE TABLE "Verification" (
          "id" TEXT NOT NULL,
          "identifier" TEXT NOT NULL,
          "value" TEXT NOT NULL,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
        );
      `);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      await client.end();
      throw err;
    }
    console.log('Schema + data migration committed.');
  }

  // Reset Prisma's bookkeeping (idempotent, always runs): wipe whatever
  // migration history this DB had — finances-t3's own full history on
  // dev/prod, or local's partial one — and replace it with rows for exactly
  // this repo's two migrations, regardless of what was there before.
  console.log('Resetting Prisma migration history...');
  await client.query('DELETE FROM "_prisma_migrations";');
  await client.end();

  const resolveUrl = toSessionModeUrl(databaseUrl);
  for (const migration of [INIT_MIGRATION, AUTH_AND_PROJECTS_MIGRATION]) {
    // prisma.config.ts's datasource now reads DIRECT_DATABASE_URL, not
    // DATABASE_URL — see its comment for why the app runtime and Prisma CLI
    // commands intentionally use different pooler modes on Vercel.
    execSync(`npx prisma migrate resolve --applied ${migration}`, {
      env: { ...process.env, DIRECT_DATABASE_URL: resolveUrl },
      stdio: 'inherit',
    });
  }

  // Create the first admin user through Better Auth's own API so password
  // hashing matches exactly what sign-in later verifies against.
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const email =
    (await rl.question('Admin email [boolet37@gmail.com]: ')) ||
    'boolet37@gmail.com';
  const name = (await rl.question('Admin name [BooleT]: ')) || 'BooleT';
  rl.close();
  const password = await readHidden('Admin password: ');

  const { auth } = await import('../src/server/auth');
  const result = await auth.api.createUser({
    body: {
      email,
      name,
      password,
      role: 'admin',
      data: { projectId: PROJECT_ID, emailVerified: true },
    },
  });

  console.log(
    `Created admin user ${result.user.email} (id: ${result.user.id}) on project "${PROJECT_NAME}".`,
  );
  console.log('Done.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
