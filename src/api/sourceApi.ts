import Source from "../models/Source";
import { createGetApiEndpoint } from "./createApiEndpoint";

export const sourceApi = {
  getAll: createGetApiEndpoint<Source[]>("source"),
};
