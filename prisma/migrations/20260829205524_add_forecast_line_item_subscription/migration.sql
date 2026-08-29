BEGIN;

-- AlterTable
ALTER TABLE "ForecastLineItem" ADD COLUMN     "subscriptionId" INTEGER;

-- AddForeignKey
ALTER TABLE "ForecastLineItem" ADD CONSTRAINT "ForecastLineItem_subscriptionId_projectId_fkey" FOREIGN KEY ("subscriptionId", "projectId") REFERENCES "Subscription"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
