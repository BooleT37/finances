BEGIN;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "importedDescription" TEXT;

COMMIT;
