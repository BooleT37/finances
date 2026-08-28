BEGIN;

-- RenameIndex
ALTER INDEX "Forecast_categoryId_subcategoryId_month_year_projectId_level_ke" RENAME TO "Forecast_categoryId_subcategoryId_month_year_projectId_leve_key";

COMMIT;
