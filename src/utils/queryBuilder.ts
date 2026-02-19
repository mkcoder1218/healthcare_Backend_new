// utils/queryBuilder.ts
export interface QueryParams {
  filters?: Record<string, any>;           // exact match filters
  search?: Record<string, string>;         // full-text search
  limit?: number;
  offset?: number;
  order?: [string, "ASC" | "DESC"][];
  include?: any[];
}

// Encode query (frontend & Node.js)
export const encodeQuery = (params: QueryParams) => {
  if (typeof window !== "undefined") {
    return btoa(JSON.stringify(params));
  }
  return Buffer.from(JSON.stringify(params)).toString("base64");
};

// Decode query
export const decodeQuery = (encoded: string): QueryParams => {
  try {
    const json =
      typeof window !== "undefined"
        ? atob(encoded)
        : Buffer.from(encoded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return {};
  }
};
