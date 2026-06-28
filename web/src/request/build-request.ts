import { REDACTED_SENTINEL } from "./constants";
import type { RequestFormState } from "./types";

const isBodyless = (method: string): boolean => method === "GET" || method === "HEAD";

/** Turn editable form state into concrete `fetch` arguments (relative, same-origin). */
export const buildRequest = (form: RequestFormState): { url: string; init: RequestInit } => {
  let path = form.route;
  for (const p of form.pathParams) {
    path = path.replace(`:${p.name}`, encodeURIComponent(p.value));
  }

  const params = new URLSearchParams();
  for (const q of form.query) {
    if (q.name) params.append(q.name, q.value);
  }
  const qs = params.toString();
  const url = qs ? `${path}?${qs}` : path;

  const headers: Record<string, string> = {};
  for (const h of form.headers) {
    if (h.name) headers[h.name] = h.value;
  }

  const init: RequestInit = { method: form.method, headers };
  if (!isBodyless(form.method) && form.body.trim() !== "") init.body = form.body;
  return { url, init };
};

/** Human-readable reasons the form cannot be fired yet; empty array means OK. */
export const validateForm = (form: RequestFormState): string[] => {
  const errors: string[] = [];
  for (const h of form.headers) {
    if (h.needsInput && h.value.trim() === "") {
      errors.push(`Header "${h.name}" was redacted — enter a value`);
    }
  }
  if (!isBodyless(form.method) && form.body.trim() !== "") {
    if (form.body.includes(REDACTED_SENTINEL)) {
      errors.push("Request body still contains a redacted placeholder — replace it");
    } else {
      try {
        JSON.parse(form.body);
      } catch {
        errors.push("Request body is not valid JSON");
      }
    }
  }
  return errors;
};
