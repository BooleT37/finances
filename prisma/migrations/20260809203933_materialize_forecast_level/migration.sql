-- Materializes the "Rest" forecast row as a real database entity instead of
-- computing it as `category.sum - Σ(subcategory sums)` on read. See issue #184.
--
-- `level` separates the two row kinds that both use `subcategoryId = null`:
-- CATEGORY (the parent) and SUBCATEGORY (a named subcategory, or Rest when
-- subcategoryId is null — the same convention Expense.subcategoryId = null
-- already uses for "no subcategory").
--
-- This migration is additive only: no existing `sum` value is changed.
-- `category.sum` means the same number before and after — it's the stored
-- total either way. Only new SUBCATEGORY(subcategoryId=null) "Rest" rows are
-- inserted, one per category/month/year that already has real subcategory
-- forecasts.
--
-- Prisma does not wrap Postgres migrations in a transaction by default —
-- wrapped explicitly here so a failure partway through can't leave a
-- half-migrated table. Safe to wrap: none of the statements below are of the
-- kind Postgres forbids inside a transaction block (no CREATE INDEX
-- CONCURRENTLY, no ALTER TYPE ... ADD VALUE — the enum is created fresh with
-- both values already present).

BEGIN;

CREATE TYPE "ForecastLevel" AS ENUM ('CATEGORY', 'SUBCATEGORY');

ALTER TABLE "Forecast" ADD COLUMN "level" "ForecastLevel";

UPDATE "Forecast" SET "level" =
  CASE WHEN "subcategoryId" IS NULL THEN 'CATEGORY' ELSE 'SUBCATEGORY' END::"ForecastLevel";

ALTER TABLE "Forecast" ALTER COLUMN "level" SET NOT NULL;

-- Materialize Rest for every category/month/year that already has ≥1 real
-- subcategory forecast (state 3). Categories with no subcategory forecasts
-- yet (states 1 and 2) are untouched — Rest stays a virtual UI-only row for
-- them until the first subcategory (or Rest itself) is edited.
INSERT INTO "Forecast" ("categoryId", "subcategoryId", "month", "year", "sum", "comment", "projectId", "level")
SELECT c."categoryId", NULL, c."month", c."year", c."sum" - s.total, '', c."projectId", 'SUBCATEGORY'
FROM "Forecast" c
JOIN (
  SELECT "categoryId", "month", "year", "projectId", SUM("sum") AS total
  FROM "Forecast"
  WHERE "subcategoryId" IS NOT NULL
  GROUP BY 1, 2, 3, 4
) s ON (c."categoryId", c."month", c."year", c."projectId")
     = (s."categoryId", s."month", s."year", s."projectId")
WHERE c."level" = 'CATEGORY';

-- The old index treated NULLs as distinct, so two subcategoryId-null rows
-- for the same category/month/year were never actually caught by it. The
-- new index adds `level` to the key (separating CATEGORY from the Rest
-- SUBCATEGORY row) and NULLS NOT DISTINCT (closing that pre-existing gap).
DROP INDEX "Forecast_categoryId_subcategoryId_month_year_projectId_key";

CREATE UNIQUE INDEX "Forecast_categoryId_subcategoryId_month_year_projectId_level_key"
  ON "Forecast" ("categoryId", "subcategoryId", "month", "year", "projectId", "level")
  NULLS NOT DISTINCT;

-- A CATEGORY-level row must always represent the parent (no subcategoryId).
ALTER TABLE "Forecast" ADD CONSTRAINT "forecast_level_shape"
  CHECK ("level" = 'SUBCATEGORY' OR "subcategoryId" IS NULL);

COMMIT;
