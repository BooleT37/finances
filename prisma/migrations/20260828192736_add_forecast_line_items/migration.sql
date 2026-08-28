BEGIN;

-- CreateTable
CREATE TABLE "ForecastLineItem" (
    "id" SERIAL NOT NULL,
    "forecastId" INTEGER NOT NULL,
    "unitPrice" TEXT NOT NULL,
    "quantity" DECIMAL(9,2) NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ForecastLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Forecast_id_projectId_key" ON "Forecast"("id", "projectId");

-- AddForeignKey
ALTER TABLE "ForecastLineItem" ADD CONSTRAINT "ForecastLineItem_forecastId_projectId_fkey" FOREIGN KEY ("forecastId", "projectId") REFERENCES "Forecast"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastLineItem" ADD CONSTRAINT "ForecastLineItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ForecastLineItem" ENABLE ROW LEVEL SECURITY;

COMMIT;
