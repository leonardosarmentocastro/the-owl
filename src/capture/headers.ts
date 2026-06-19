import { TEST_NAME_HEADER } from "./constants";

const IGNORED_HEADERS = new Set<string>([
  TEST_NAME_HEADER,
  "accept",
  "access-control-allow-origin",
  "accept-encoding",
  "cache-control",
  "connection",
  "content-length",
  "etag",
  "host",
  "postman-token",
  "user-agent",
  "x-powered-by",
]);

/** Drop transport/noise headers so a captured Example keeps only meaningful ones. */
export const filterHeaders = (
  headers: Record<string, unknown> | undefined
): Record<string, string> => {
  if (!headers) return {};
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([key]) => !IGNORED_HEADERS.has(key.toLowerCase()))
      .map(([key, value]) => [key, String(value)])
  );
};
