export interface QueryGraphQLArgs {
  url: string;
  queryName: string;
  query: string;
  variables?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeoutMs?: number;
}
