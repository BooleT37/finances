-- Add projectId to the two remaining cross-project-referenced models that
-- didn't have one yet, so every model a composite FK below points at
-- carries its own projectId.
-- AlterTable
ALTER TABLE "SavingSpendingCategory" ADD COLUMN "projectId" TEXT;

-- AlterTable
ALTER TABLE "ExpenseComponent" ADD COLUMN "projectId" TEXT;

-- Backfill from each row's existing (single-column) relation.
UPDATE "SavingSpendingCategory" ssc
SET "projectId" = ss."projectId"
FROM "SavingSpending" ss
WHERE ssc."savingSpendingId" = ss."id";

UPDATE "ExpenseComponent" ec
SET "projectId" = e."projectId"
FROM "Expense" e
WHERE ec."expenseId" = e."id";

-- AlterTable
ALTER TABLE "SavingSpendingCategory" ALTER COLUMN "projectId" SET NOT NULL;
ALTER TABLE "ExpenseComponent" ALTER COLUMN "projectId" SET NOT NULL;

-- AddForeignKey (new direct project relations)
ALTER TABLE "SavingSpendingCategory" ADD CONSTRAINT "SavingSpendingCategory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpenseComponent" ADD CONSTRAINT "ExpenseComponent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex — (id, projectId) uniques needed as the referenced side of
-- every composite FK added below.
CREATE UNIQUE INDEX "Category_id_projectId_key" ON "Category"("id", "projectId");
CREATE UNIQUE INDEX "Source_id_projectId_key" ON "Source"("id", "projectId");
CREATE UNIQUE INDEX "Subcategory_id_projectId_key" ON "Subcategory"("id", "projectId");
CREATE UNIQUE INDEX "Subscription_id_projectId_key" ON "Subscription"("id", "projectId");
CREATE UNIQUE INDEX "Expense_id_projectId_key" ON "Expense"("id", "projectId");
CREATE UNIQUE INDEX "SavingSpending_id_projectId_key" ON "SavingSpending"("id", "projectId");
CREATE UNIQUE INDEX "SavingSpendingCategory_id_projectId_key" ON "SavingSpendingCategory"("id", "projectId");

-- Drop the old single-column FKs before replacing them with composite ones.
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_categoryId_fkey";
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_subcategoryId_fkey";
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_sourceId_fkey";
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_categoryId_fkey";
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_subcategoryId_fkey";
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_sourceId_fkey";
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_subscriptionId_fkey";
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_savingSpendingCategoryId_fkey";
ALTER TABLE "ExpenseComponent" DROP CONSTRAINT "ExpenseComponent_categoryId_fkey";
ALTER TABLE "ExpenseComponent" DROP CONSTRAINT "ExpenseComponent_subcategoryId_fkey";
ALTER TABLE "ExpenseComponent" DROP CONSTRAINT "ExpenseComponent_expenseId_fkey";
ALTER TABLE "Forecast" DROP CONSTRAINT "Forecast_categoryId_fkey";
ALTER TABLE "Forecast" DROP CONSTRAINT "Forecast_subcategoryId_fkey";
ALTER TABLE "SavingSpendingCategory" DROP CONSTRAINT "SavingSpendingCategory_savingSpendingId_fkey";

-- AddForeignKey (composite, project-scoped)
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_categoryId_projectId_fkey" FOREIGN KEY ("categoryId", "projectId") REFERENCES "Category"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_subcategoryId_projectId_fkey" FOREIGN KEY ("subcategoryId", "projectId") REFERENCES "Subcategory"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_sourceId_projectId_fkey" FOREIGN KEY ("sourceId", "projectId") REFERENCES "Source"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_projectId_fkey" FOREIGN KEY ("categoryId", "projectId") REFERENCES "Category"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_subcategoryId_projectId_fkey" FOREIGN KEY ("subcategoryId", "projectId") REFERENCES "Subcategory"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_sourceId_projectId_fkey" FOREIGN KEY ("sourceId", "projectId") REFERENCES "Source"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_subscriptionId_projectId_fkey" FOREIGN KEY ("subscriptionId", "projectId") REFERENCES "Subscription"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_savingSpendingCategoryId_projectId_fkey" FOREIGN KEY ("savingSpendingCategoryId", "projectId") REFERENCES "SavingSpendingCategory"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExpenseComponent" ADD CONSTRAINT "ExpenseComponent_categoryId_projectId_fkey" FOREIGN KEY ("categoryId", "projectId") REFERENCES "Category"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseComponent" ADD CONSTRAINT "ExpenseComponent_subcategoryId_projectId_fkey" FOREIGN KEY ("subcategoryId", "projectId") REFERENCES "Subcategory"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseComponent" ADD CONSTRAINT "ExpenseComponent_expenseId_projectId_fkey" FOREIGN KEY ("expenseId", "projectId") REFERENCES "Expense"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_categoryId_projectId_fkey" FOREIGN KEY ("categoryId", "projectId") REFERENCES "Category"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_subcategoryId_projectId_fkey" FOREIGN KEY ("subcategoryId", "projectId") REFERENCES "Subcategory"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavingSpendingCategory" ADD CONSTRAINT "SavingSpendingCategory_savingSpendingId_projectId_fkey" FOREIGN KEY ("savingSpendingId", "projectId") REFERENCES "SavingSpending"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;
