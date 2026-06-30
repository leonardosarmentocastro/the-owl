import { buildRequest } from "./build-request";
import type { RequestFormState } from "./types";

export interface LiveResult {
  ok: boolean;
  status: number;
  statusText: string;
  timeMs: number;
  sizeBytes: number;
  headers: Record<string, string>;
  bodyText: string;
  error?: string;
}

/** Fire the request the form describes (relative, same-origin). Never throws —
 * a network/CORS failure is reported via `error`. */
export const fireRequest = async (form: RequestFormState): Promise<LiveResult> => {
  const { url, init } = buildRequest(form);
  const started = performance.now();
  try {
    const res = await fetch(url, init);
    const bodyText = await res.text();
    const timeMs = Math.round(performance.now() - started);
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => { headers[key] = value; });
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      timeMs,
      sizeBytes: new Blob([bodyText]).size,
      headers,
      bodyText,
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      statusText: "",
      timeMs: Math.round(performance.now() - started),
      sizeBytes: 0,
      headers: {},
      bodyText: "",
      error: e instanceof Error ? e.message : String(e),
    };
  }
};
