export interface CapturedRequest {
  url: string;
  method: string;
  path: string;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  body: unknown;
}

export interface CapturedResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface Example {
  name: string;
  request: CapturedRequest;
  response: CapturedResponse;
}

export interface Endpoint {
  method: string;
  route: string;
  examples: Example[];
}

export interface Catalog {
  generatedAt: string;
  endpoints: Endpoint[];
  /** Base URL baked at build time from THE_OWL_DOCS_HOST; used by the static
   * docs to render runnable curl commands. Absent when the env var is unset. */
  baseUrl?: string;
  /** Regex source baked at build time from THE_OWL_GROUPING_REGEX. The docs
   * sidebar strips the longest matching leading path prefix before grouping
   * Endpoints (e.g. `^/api$` groups `/api/v1/...` under V1). Absent when the
   * env var is unset, in which case Endpoints group by their first segment. */
  grouping?: string;
}
