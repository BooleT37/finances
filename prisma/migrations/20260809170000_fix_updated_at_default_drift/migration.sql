-- Reconciles the schema with drift found in the local dev database: the
-- `updatedAt` column on Project/User/Session/Account/Verification carries a
-- DB-level `CURRENT_TIMESTAMP` default live, but no committed migration
-- (including 20260711100435_auth_and_projects, which created these tables)
-- ever added one. `@updatedAt` alone only makes Prisma Client set the value
-- application-side on `update()` calls; it never creates a DB default. This
-- drift blocked `prisma migrate dev` schema-wide with "Drift detected".
--
-- The exact origin is unconfirmed (see issue for investigation notes), but
-- the default itself is harmless — arguably a reasonable belt-and-suspenders
-- default given Better Auth may write to these tables outside Prisma
-- Client's `@updatedAt` hook — so instead of dropping it, `schema.prisma`
-- now declares `@default(now())` alongside `@updatedAt` on all 5 fields, and
-- this migration brings the default forward explicitly rather than relying
-- on whatever undocumented step put it there.
--
-- `SET DEFAULT` is idempotent: safe to run whether or not a given
-- environment already has this default (e.g. production's state relative to
-- this drift is unverified from this session).
--
-- Prisma does not wrap Postgres migrations in a transaction by default —
-- wrapped explicitly here so a failure partway through can't leave a subset
-- of the 5 tables altered. Safe to wrap: plain ALTER COLUMN SET DEFAULT
-- statements, none of the kind Postgres forbids inside a transaction block.

BEGIN;

ALTER TABLE "Project" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Session" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Account" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Verification" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

COMMIT;
