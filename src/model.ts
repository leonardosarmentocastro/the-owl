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
}

export const endpointKey = (method: string, route: string): string =>
  `${method.toUpperCase()} ${route}`;
