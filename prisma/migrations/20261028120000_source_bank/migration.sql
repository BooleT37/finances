BEGIN;

-- CreateEnum
CREATE TYPE "Bank" AS ENUM ('VIVID', 'COMMERZBANK');

-- AlterTable: Source.parser becomes Source.bank
ALTER TABLE "Source" ADD COLUMN "bank" "Bank";
UPDATE "Source" SET "bank" = "parser"::text::"Bank" WHERE "parser" IS NOT NULL;
ALTER TABLE "Source" DROP COLUMN "parser";

-- AlterTable: BankConnection.connector switches to Bank
ALTER TABLE "BankConnection" ALTER COLUMN "connector" TYPE "Bank" USING "connector"::text::"Bank";

-- DropEnum
DROP TYPE "ExpensesParser";
DROP TYPE "BankConnector";

COMMIT;
