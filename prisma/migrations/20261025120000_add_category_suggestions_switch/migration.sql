BEGIN;

-- AlterTable
ALTER TABLE "ProjectSetting" ADD COLUMN     "categorySuggestionsEnabledAt" TIMESTAMP(3);

COMMIT;
