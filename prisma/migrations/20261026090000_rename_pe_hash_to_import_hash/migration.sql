BEGIN;

-- AlterTable
ALTER TABLE "Expense" RENAME COLUMN "peHash" TO "importHash";

COMMIT;
