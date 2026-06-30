import type { RequestFormState } from "./types";

const isBodyless = (method: string): boolean => method === "GET" || method === "HEAD";

/** Single-quote a string for safe POSIX shell use (close, escaped quote, reopen). */
const shellQuote = (s: string): string => `'${s.replace(/'/g, "'\\''")}'`;

/** Join a base URL and a leading-slash path with exactly one slash. */
const joinUrl = (baseUrl: string, path: string): string => `${baseUrl.replace(/\/$/, "")}${path}`;

const placeholder = (name: string): string => `<CHANGE_ME:${name}>`;

/** Render a copy-pasteable curl command for the request the form describes.
 * Empty redacted/required values become `<CHANGE_ME:name>` placeholders. */
export const formatCurl = (form: RequestFormState, baseUrl: string): string => {
  let path = form.route;
  for (const p of form.pathParams) {
    const v = p.value.trim() === "" ? placeholder(p.name) : encodeURIComponent(p.value);
    path = path.replace(`:${p.name}`, v);
  }

  const queryParts: string[] = [];
  for (const q of form.query) {
    if (!q.name) continue;
    const v = q.needsInput && q.value.trim() === "" ? placeholder(q.name) : encodeURIComponent(q.value);
    queryParts.push(`${encodeURIComponent(q.name)}=${v}`);
  }
  const qs = queryParts.join("&");
  const url = qs ? `${joinUrl(baseUrl, path)}?${qs}` : joinUrl(baseUrl, path);

  const lines: string[] = [`curl -X ${form.method} ${shellQuote(url)}`];
  for (const h of form.headers) {
    if (!h.name) continue;
    const v = h.needsInput && h.value.trim() === "" ? placeholder(h.name) : h.value;
    lines.push(`-H ${shellQuote(`${h.name}: ${v}`)}`);
  }
  if (!isBodyless(form.method) && form.body.trim() !== "") {
    lines.push(`-d ${shellQuote(form.body)}`);
  }

  return lines.join(" \\\n  ");
};
