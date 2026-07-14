-- AlterTable
ALTER TABLE "Subcategory" ADD COLUMN "projectId" TEXT;

-- Backfill from each subcategory's category (every existing row has a
-- categoryId, and Category already has a non-null projectId).
UPDATE "Subcategory" s
SET "projectId" = c."projectId"
FROM "Category" c
WHERE s."categoryId" = c."id";

-- AlterTable
ALTER TABLE "Subcategory" ALTER COLUMN "projectId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
