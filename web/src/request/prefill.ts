import type { Example } from "../api";
import { parsePathParams } from "./path-params";
import { OWL_TEST_HEADER, REDACTED_SENTINEL } from "./constants";
import type { KeyValue, RequestFormState } from "./types";

const clearRedacted = (value: unknown): unknown => {
  if (value === REDACTED_SENTINEL) return "";
  if (Array.isArray(value)) return value.map(clearRedacted);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, clearRedacted(v)])
    );
  }
  return value;
};

const bodyToText = (body: unknown): string => {
  if (body == null || body === "") return "";
  const cleared = clearRedacted(body);
  return typeof cleared === "string" ? cleared : JSON.stringify(cleared, null, 2);
};

/** Build editable form state from a captured Example: drop the owl header, flag
 * redacted values for the user to fill, and prefill path/query/body. */
export const prefillFromExample = (example: Example, route: string): RequestFormState => {
  const { request } = example;

  const headers: KeyValue[] = Object.entries(request.headers)
    .filter(([name]) => name.toLowerCase() !== OWL_TEST_HEADER)
    .map(([name, value]) =>
      value === REDACTED_SENTINEL ? { name, value: "", needsInput: true } : { name, value }
    );

  const pathParams: KeyValue[] = Object.entries(parsePathParams(route, request.path)).map(
    ([name, value]) => ({ name, value })
  );

  const query: KeyValue[] = Object.entries(request.query ?? {}).map(([name, value]) => ({
    name,
    value: String(value),
  }));

  return { method: request.method, route, pathParams, query, headers, body: bodyToText(request.body) };
};
