import { createApiEndpoint, createGetApiEndpoint } from "./createApiEndpoint";

export interface ForecastJson {
  category_id: number;
  month: number;
  year: number;
  sum: number;
  comment?: string;
}

interface ModifyForecastRequest {
  sum?: number;
  comment?: string;
}

interface ModifyForecastQuery {
  category_id: number;
  month: number;
  year: number;
}

export const forecastApi = {
  getAll: createGetApiEndpoint<ForecastJson[]>("forecast"),
  modify: createApiEndpoint<ModifyForecastRequest, ModifyForecastQuery, never>(
    "forecast",
    "PATCH"
  ),
  create: createApiEndpoint<ForecastJson, never, never>("forecast", "POST"),
};
