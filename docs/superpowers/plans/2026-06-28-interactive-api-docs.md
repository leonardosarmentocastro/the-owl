# Interactive API docs ("Try it out") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the read-only generated docs into a lightweight interactive API book where each captured Example is an editable, fireable request with a live response panel.

**Architecture:** Almost all work is in the `web/` React app. Pure request logic (path-param parsing, sanitization-aware prefill, request building, validation, firing) lives in small testable modules under `web/src/request/`. Components (`ExampleAccordion`, `RequestForm`, `ResponsePanel`) consume them. The single `src/` change is in `src/render/serve.ts`: the live `docs()` router injects `window.__OWL_LIVE__ = true` into the served HTML, which gates the entire interactive UI. The static build never gets the flag and stays read-only.

**Tech Stack:** TypeScript, React 19, Vite 8, Express 5, Vitest 4 (node env globally; component tests opt into jsdom per-file), `@testing-library/react`.

## Global Constraints

- **Owl correlation header to strip:** `x-test-name` (verbatim, lowercase).
- **Redaction sentinel to treat as "needs input":** `«redacted»` (this is the real value of `REDACTED` in `src/capture/constants.ts` — NOT `[REDACTED]`).
- **"Try it out" works in live mode only.** Detection is `window.__OWL_LIVE__ === true`. Never sniff `file://`.
- **Requests are same-origin and relative** (e.g. `/users/2?active=true`). No base URL, no CORS handling.
- **File purity (AGENTS.md):** a behavior file exports functions only; exported types go in a `types.ts`, constants in a `constants.ts`. Factories use `create*`.
- **Tests are co-located** in `__tests__/*.test.ts(x)` next to the code.
- **Out of scope:** cURL generation, response-vs-captured diff, auth flows, file uploads, persisting edits.
- **Existing style convention:** components use inline `style={{…}}` objects (match the current `EndpointCard`/`App`).
- **Commit after every task.**

---

### Task 1: Path-param parsing + wire web test discovery

**Files:**
- Modify: `vitest.config.ts`
- Create: `web/src/request/path-params.ts`
- Test: `web/src/request/__tests__/path-params.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `parsePathParams(route: string, capturedPath: string): Record<string, string>` — maps a route template's `:params` to the concrete values from a captured path, in route order.

- [ ] **Step 1: Extend the Vitest include glob so `web/` tests are discovered**

`vitest.config.ts` currently only includes `src/**`. Replace its contents with:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "web/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
```

- [ ] **Step 2: Write the failing test**

Create `web/src/request/__tests__/path-params.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parsePathParams } from "../path-params";

describe("parsePathParams", () => {
  it("maps a single param", () => {
    expect(parsePathParams("/users/:id", "/users/2")).toEqual({ id: "2" });
  });

  it("maps multiple params in route order", () => {
    expect(parsePathParams("/orgs/:org/users/:id", "/orgs/acme/users/7")).toEqual({
      org: "acme",
      id: "7",
    });
  });

  it("returns an empty object when the route has no params", () => {
    expect(parsePathParams("/health", "/health")).toEqual({});
  });

  it("url-decodes captured segment values", () => {
    expect(parsePathParams("/users/:name", "/users/jane%20doe")).toEqual({ name: "jane doe" });
  });

  it("returns empty when the concrete path does not match the template shape", () => {
    expect(parsePathParams("/users/:id", "/health")).toEqual({});
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run web/src/request/__tests__/path-params.test.ts`
Expected: FAIL — cannot resolve `../path-params`.

- [ ] **Step 4: Write minimal implementation**

Create `web/src/request/path-params.ts`:

```ts
/** Map a route template's `:params` to the concrete values from a captured path. */
export const parsePathParams = (route: string, capturedPath: string): Record<string, string> => {
  const routeParts = route.split("/");
  const pathParts = capturedPath.split("/");
  if (routeParts.length !== pathParts.length) return {};

  const params: Record<string, string> = {};
  for (let i = 0; i < routeParts.length; i++) {
    const seg = routeParts[i];
    if (seg.startsWith(":")) {
      params[seg.slice(1)] = decodeURIComponent(pathParts[i]);
    }
  }
  return params;
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run web/src/request/__tests__/path-params.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts web/src/request/path-params.ts web/src/request/__tests__/path-params.test.ts
git commit -m "feat(web): parse path params from captured paths + discover web tests"
```

---

### Task 2: Web request types + sanitization-aware prefill

**Files:**
- Modify: `web/src/api.ts` (add `query` to the `Example` request type)
- Create: `web/src/request/types.ts`
- Create: `web/src/request/constants.ts`
- Create: `web/src/request/prefill.ts`
- Test: `web/src/request/__tests__/prefill.test.ts`

**Interfaces:**
- Consumes: `parsePathParams` (Task 1); `Example` from `web/src/api.ts`.
- Produces:
  - `interface KeyValue { name: string; value: string; needsInput?: boolean }`
  - `interface RequestFormState { method: string; route: string; pathParams: KeyValue[]; query: KeyValue[]; headers: KeyValue[]; body: string }`
  - `OWL_TEST_HEADER = "x-test-name"`, `REDACTED_SENTINEL = "«redacted»"`
  - `prefillFromExample(example: Example, route: string): RequestFormState`

- [ ] **Step 1: Add `query` to the web `Example` type**

In `web/src/api.ts`, the `Example.request` type currently lacks `query`. Update the interface so it reads:

```ts
export interface Example {
  name: string;
  request: { url: string; method: string; path: string; query: Record<string, unknown>; headers: Record<string, string>; body: unknown };
  response: { status: number; headers: Record<string, string>; body: unknown };
}
```

(Leave the rest of `web/src/api.ts` unchanged.)

- [ ] **Step 2: Create the shared types and constants**

Create `web/src/request/types.ts`:

```ts
/** One editable header / query / path-param row. `needsInput` marks a value that
 * was redacted at capture time and must be supplied before the request can fire. */
export interface KeyValue {
  name: string;
  value: string;
  needsInput?: boolean;
}

/** Editable state backing a single "Try it out" form. */
export interface RequestFormState {
  method: string;
  route: string;
  pathParams: KeyValue[];
  query: KeyValue[];
  headers: KeyValue[];
  body: string;
}
```

Create `web/src/request/constants.ts`:

```ts
/** Correlation header the capture middleware attaches; never sent from the docs UI. */
export const OWL_TEST_HEADER = "x-test-name";

/** Placeholder the capture sanitizer writes in place of a redacted value. */
export const REDACTED_SENTINEL = "«redacted»";
```

- [ ] **Step 3: Write the failing test**

Create `web/src/request/__tests__/prefill.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prefillFromExample } from "../prefill";
import type { Example } from "../../api";

const example = (over: Partial<Example["request"]> = {}): Example => ({
  name: "(200) ok",
  request: {
    url: "u",
    method: "POST",
    path: "/users/2",
    query: { active: "true" },
    headers: { "x-test-name": "login.test.ts", "content-type": "application/json", authorization: "«redacted»" },
    body: { email: "a@b.io", password: "«redacted»" },
    ...over,
  },
  response: { status: 200, headers: {}, body: null },
});

describe("prefillFromExample", () => {
  it("drops the owl test header", () => {
    const form = prefillFromExample(example(), "/users/:id");
    expect(form.headers.find((h) => h.name === "x-test-name")).toBeUndefined();
  });

  it("empties + flags redacted header values", () => {
    const form = prefillFromExample(example(), "/users/:id");
    const auth = form.headers.find((h) => h.name === "authorization");
    expect(auth).toEqual({ name: "authorization", value: "", needsInput: true });
  });

  it("keeps normal header values", () => {
    const form = prefillFromExample(example(), "/users/:id");
    expect(form.headers.find((h) => h.name === "content-type")?.value).toBe("application/json");
  });

  it("fills path params from the captured path", () => {
    const form = prefillFromExample(example(), "/users/:id");
    expect(form.pathParams).toEqual([{ name: "id", value: "2" }]);
  });

  it("builds query rows", () => {
    const form = prefillFromExample(example(), "/users/:id");
    expect(form.query).toEqual([{ name: "active", value: "true" }]);
  });

  it("clears redacted values inside the body JSON and pretty-prints it", () => {
    const form = prefillFromExample(example(), "/users/:id");
    expect(form.body).toBe(JSON.stringify({ email: "a@b.io", password: "" }, null, 2));
  });

  it("uses an empty body string when there is no body", () => {
    const form = prefillFromExample(example({ body: null }), "/users/:id");
    expect(form.body).toBe("");
  });

  it("carries the method through", () => {
    expect(prefillFromExample(example(), "/users/:id").method).toBe("POST");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run web/src/request/__tests__/prefill.test.ts`
Expected: FAIL — cannot resolve `../prefill`.

- [ ] **Step 5: Write minimal implementation**

Create `web/src/request/prefill.ts`:

```ts
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
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run web/src/request/__tests__/prefill.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 7: Commit**

```bash
git add web/src/api.ts web/src/request/types.ts web/src/request/constants.ts web/src/request/prefill.ts web/src/request/__tests__/prefill.test.ts
git commit -m "feat(web): sanitization-aware prefill of editable request forms"
```

---

### Task 3: Request building + validation

**Files:**
- Create: `web/src/request/build-request.ts`
- Test: `web/src/request/__tests__/build-request.test.ts`

**Interfaces:**
- Consumes: `RequestFormState`, `KeyValue` (Task 2); `REDACTED_SENTINEL` (Task 2).
- Produces:
  - `buildRequest(form: RequestFormState): { url: string; init: RequestInit }` — substitutes path params, appends the query string, assembles headers/body (no body for GET/HEAD).
  - `validateForm(form: RequestFormState): string[]` — human-readable blockers; empty array means OK.

- [ ] **Step 1: Write the failing test**

Create `web/src/request/__tests__/build-request.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildRequest, validateForm } from "../build-request";
import type { RequestFormState } from "../types";

const base = (over: Partial<RequestFormState> = {}): RequestFormState => ({
  method: "GET",
  route: "/users/:id",
  pathParams: [{ name: "id", value: "2" }],
  query: [],
  headers: [],
  body: "",
  ...over,
});

describe("buildRequest", () => {
  it("substitutes path params into the route", () => {
    expect(buildRequest(base()).url).toBe("/users/2");
  });

  it("url-encodes path param values", () => {
    expect(buildRequest(base({ pathParams: [{ name: "id", value: "a b" }] })).url).toBe("/users/a%20b");
  });

  it("appends non-empty query rows", () => {
    expect(buildRequest(base({ query: [{ name: "active", value: "true" }, { name: "", value: "skip" }] })).url).toBe(
      "/users/2?active=true"
    );
  });

  it("sets method and header rows", () => {
    const { init } = buildRequest(base({ method: "POST", headers: [{ name: "content-type", value: "application/json" }] }));
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "content-type": "application/json" });
  });

  it("omits the body for GET", () => {
    expect(buildRequest(base({ body: '{"x":1}' })).init.body).toBeUndefined();
  });

  it("includes the body string for non-GET", () => {
    expect(buildRequest(base({ method: "POST", body: '{"x":1}' })).init.body).toBe('{"x":1}');
  });
});

describe("validateForm", () => {
  it("passes a clean form", () => {
    expect(validateForm(base())).toEqual([]);
  });

  it("blocks an unfilled redacted header", () => {
    const errors = validateForm(base({ headers: [{ name: "authorization", value: "", needsInput: true }] }));
    expect(errors).toContain('Header "authorization" was redacted — enter a value');
  });

  it("blocks invalid JSON body on a non-GET", () => {
    expect(validateForm(base({ method: "POST", body: "{not json" }))).toContain("Request body is not valid JSON");
  });

  it("blocks a body that still contains the redaction placeholder", () => {
    expect(validateForm(base({ method: "POST", body: '{"p":"«redacted»"}' }))).toContain(
      "Request body still contains a redacted placeholder — replace it"
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/request/__tests__/build-request.test.ts`
Expected: FAIL — cannot resolve `../build-request`.

- [ ] **Step 3: Write minimal implementation**

Create `web/src/request/build-request.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run web/src/request/__tests__/build-request.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/request/build-request.ts web/src/request/__tests__/build-request.test.ts
git commit -m "feat(web): build and validate fireable requests from form state"
```

---

### Task 4: Live-mode flag injection + `isLive()` detector

**Files:**
- Modify: `src/render/serve.ts`
- Create: `web/src/live.ts`
- Create: `web/src/global.d.ts`
- Test: `src/render/__tests__/serve.test.ts`

**Interfaces:**
- Consumes: nothing from prior web tasks.
- Produces:
  - `injectLiveFlag(html: string): string` (exported from `src/render/serve.ts`) — inserts the live marker script before `</head>` (or prepends it when there is no head).
  - `isLive(): boolean` (web) — `true` when `window.__OWL_LIVE__ === true`.

- [ ] **Step 1: Write the failing test for the injector**

Create `src/render/__tests__/serve.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { injectLiveFlag } from "../serve";

describe("injectLiveFlag", () => {
  it("inserts the live marker before </head>", () => {
    const out = injectLiveFlag("<html><head><title>x</title></head><body></body></html>");
    expect(out).toContain("window.__OWL_LIVE__ = true");
    expect(out.indexOf("window.__OWL_LIVE__")).toBeLessThan(out.indexOf("</head>"));
  });

  it("still injects when there is no head", () => {
    const out = injectLiveFlag("<body>hi</body>");
    expect(out).toContain("window.__OWL_LIVE__ = true");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/render/__tests__/serve.test.ts`
Expected: FAIL — `injectLiveFlag` is not exported.

- [ ] **Step 3: Implement injection + wire it into `docs()`**

Replace the contents of `src/render/serve.ts` with:

```ts
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { type RequestHandler } from "express";
import type { DocsOptions } from "./types";

const LIVE_FLAG = "<script>window.__OWL_LIVE__ = true</script>";

/** Inject the live-mode marker so the docs UI enables "Try it out". */
export const injectLiveFlag = (html: string): string =>
  html.includes("</head>") ? html.replace("</head>", `${LIVE_FLAG}</head>`) : `${LIVE_FLAG}${html}`;

/** Live-route Renderer: serve the catalog + React bundle from a running app.
 * The served HTML carries the live-mode flag so "Try it out" fires same-origin. */
export const docs = (options: DocsOptions = {}): RequestHandler => {
  const here = dirname(fileURLToPath(import.meta.url));
  const bundleDir = options.bundleDir ?? join(here, "web");
  const catalogPath = options.catalog ?? join(process.cwd(), "docs", "site", "catalog.json");
  const indexPath = join(bundleDir, "index.html");

  const router = express.Router();
  router.get("/catalog.json", (_req, res) => {
    if (!existsSync(catalogPath)) {
      res.status(404).json({ error: "catalog.json not found — run `the-owl build`" });
      return;
    }
    res.type("application/json").send(readFileSync(catalogPath, "utf8"));
  });
  router.get(["/", "/index.html"], (_req, res, next) => {
    if (!existsSync(indexPath)) return next();
    res.type("html").send(injectLiveFlag(readFileSync(indexPath, "utf8")));
  });
  router.use(express.static(bundleDir));
  return router;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/render/__tests__/serve.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Add the web `isLive()` detector and the window typing**

Create `web/src/global.d.ts`:

```ts
interface Window {
  __OWL_LIVE__?: boolean;
}
```

Create `web/src/live.ts`:

```ts
/** True only when the docs are served live by `theOwl.docs()` (so "Try it out"
 * can fire same-origin requests). The static build never sets this flag. */
export const isLive = (): boolean => typeof window !== "undefined" && window.__OWL_LIVE__ === true;
```

- [ ] **Step 6: Verify the whole suite + typecheck still pass**

Run: `npm test && npm run typecheck`
Expected: PASS — all existing tests plus the new ones; no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/render/serve.ts src/render/__tests__/serve.test.ts web/src/live.ts web/src/global.d.ts
git commit -m "feat(render): inject live-mode flag so the docs UI can fire requests"
```

---

### Task 5: Fire a request (fetch wrapper)

**Files:**
- Create: `web/src/request/fire.ts`
- Test: `web/src/request/__tests__/fire.test.ts`

**Interfaces:**
- Consumes: `buildRequest` (Task 3); `RequestFormState` (Task 2).
- Produces:
  - `interface LiveResult { ok: boolean; status: number; statusText: string; timeMs: number; sizeBytes: number; headers: Record<string, string>; bodyText: string; error?: string }`
  - `fireRequest(form: RequestFormState): Promise<LiveResult>` — fires via `fetch`, measures round-trip time and byte size, never throws (network failures land in `error`).

- [ ] **Step 1: Write the failing test**

Create `web/src/request/__tests__/fire.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { fireRequest } from "../fire";
import type { RequestFormState } from "../types";

const form: RequestFormState = {
  method: "GET",
  route: "/users/:id",
  pathParams: [{ name: "id", value: "2" }],
  query: [],
  headers: [],
  body: "",
};

afterEach(() => vi.restoreAllMocks());

describe("fireRequest", () => {
  it("returns status, body, headers and size on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response('{"id":2}', { status: 200, statusText: "OK", headers: { "content-type": "application/json" } })
      )
    );
    const result = await fireRequest(form);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.bodyText).toBe('{"id":2}');
    expect(result.headers["content-type"]).toBe("application/json");
    expect(result.sizeBytes).toBe(8);
    expect(result.error).toBeUndefined();
  });

  it("captures network failures in `error` without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("boom"); }));
    const result = await fireRequest(form);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("boom");
    expect(result.status).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/request/__tests__/fire.test.ts`
Expected: FAIL — cannot resolve `../fire`.

- [ ] **Step 3: Write minimal implementation**

Create `web/src/request/fire.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run web/src/request/__tests__/fire.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/request/fire.ts web/src/request/__tests__/fire.test.ts
git commit -m "feat(web): fire same-origin requests and capture the live result"
```

---

### Task 6: ResponsePanel component (+ React test infra)

**Files:**
- Modify: `package.json` (add dev deps)
- Create: `web/src/components/ResponsePanel.tsx`
- Test: `web/src/components/__tests__/ResponsePanel.test.tsx`

**Interfaces:**
- Consumes: `LiveResult` (Task 5).
- Produces: `ResponsePanel({ result }: { result: LiveResult })` — status badge (green 2xx / red otherwise), `timeMs` + `sizeBytes`, pretty-printed JSON body (falls back to raw text), collapsible response headers, and a red error block when `result.error` is set.

- [ ] **Step 1: Install React testing dependencies**

Run: `npm install -D jsdom @testing-library/react @testing-library/dom`
Expected: the three packages are added to `devDependencies`.

- [ ] **Step 2: Write the failing test**

Create `web/src/components/__tests__/ResponsePanel.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ResponsePanel } from "../ResponsePanel";
import type { LiveResult } from "../../request/fire";

const ok: LiveResult = {
  ok: true, status: 200, statusText: "OK", timeMs: 12, sizeBytes: 8,
  headers: { "content-type": "application/json" }, bodyText: '{"id":2}',
};

afterEach(cleanup);

describe("ResponsePanel", () => {
  it("shows the status and pretty-printed JSON body", () => {
    render(<ResponsePanel result={ok} />);
    expect(screen.getByText(/200/)).toBeTruthy();
    expect(screen.getByText(/"id": 2/)).toBeTruthy();
  });

  it("shows an error block when the fetch failed", () => {
    render(<ResponsePanel result={{ ...ok, ok: false, status: 0, bodyText: "", error: "boom" }} />);
    expect(screen.getByText(/boom/)).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run web/src/components/__tests__/ResponsePanel.test.tsx`
Expected: FAIL — cannot resolve `../ResponsePanel`.

- [ ] **Step 4: Write minimal implementation**

Create `web/src/components/ResponsePanel.tsx`:

```tsx
import type { LiveResult } from "../request/fire";

const prettify = (text: string): string => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

export const ResponsePanel = ({ result }: { result: LiveResult }) => {
  if (result.error) {
    return (
      <div style={{ marginTop: 10, border: "1px solid crimson", borderRadius: 6, padding: 10, color: "crimson" }}>
        <strong>Request failed:</strong> {result.error}
      </div>
    );
  }

  const ok2xx = result.status >= 200 && result.status < 300;
  return (
    <div style={{ marginTop: 10, borderTop: "1px dashed #ccc", paddingTop: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span
          style={{
            fontFamily: "monospace", fontWeight: 700, padding: "1px 8px", borderRadius: 20,
            background: ok2xx ? "#dcfce7" : "#fee2e2", color: ok2xx ? "#15803d" : "#b91c1c",
          }}
        >
          {result.status} {result.statusText}
        </span>
        <small style={{ opacity: 0.7 }}>{result.timeMs} ms · {result.sizeBytes} B</small>
      </div>
      <h4>Body</h4>
      <pre>{prettify(result.bodyText)}</pre>
      <details>
        <summary>Response headers ({Object.keys(result.headers).length})</summary>
        <pre>{Object.entries(result.headers).map(([k, v]) => `${k}: ${v}`).join("\n")}</pre>
      </details>
    </div>
  );
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run web/src/components/__tests__/ResponsePanel.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json web/src/components/ResponsePanel.tsx web/src/components/__tests__/ResponsePanel.test.tsx
git commit -m "feat(web): render live response panel with status, body and headers"
```

---

### Task 7: RequestForm component

**Files:**
- Create: `web/src/components/RequestForm.tsx`
- Test: `web/src/components/__tests__/RequestForm.test.tsx`

**Interfaces:**
- Consumes: `RequestFormState`, `KeyValue` (Task 2); `validateForm` (Task 3).
- Produces: `RequestForm({ form, onChange, onFire, firing }: { form: RequestFormState; onChange: (next: RequestFormState) => void; onFire: () => void; firing: boolean })` — editable path-param inputs, add/remove key-value rows for query + headers, a JSON body textarea, and a "Try it out" button disabled while `firing` or when `validateForm(form)` returns blockers (which are shown inline).

- [ ] **Step 1: Write the failing test**

Create `web/src/components/__tests__/RequestForm.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RequestForm } from "../RequestForm";
import type { RequestFormState } from "../../request/types";

const form = (over: Partial<RequestFormState> = {}): RequestFormState => ({
  method: "GET", route: "/users/:id",
  pathParams: [{ name: "id", value: "2" }], query: [], headers: [], body: "",
  ...over,
});

afterEach(cleanup);

describe("RequestForm", () => {
  it("fires when the form is valid", () => {
    const onFire = vi.fn();
    render(<RequestForm form={form()} onChange={() => {}} onFire={onFire} firing={false} />);
    fireEvent.click(screen.getByRole("button", { name: /try it out/i }));
    expect(onFire).toHaveBeenCalledOnce();
  });

  it("blocks firing and shows the reason when a redacted header is empty", () => {
    const onFire = vi.fn();
    render(
      <RequestForm
        form={form({ headers: [{ name: "authorization", value: "", needsInput: true }] })}
        onChange={() => {}}
        onFire={onFire}
        firing={false}
      />
    );
    expect(screen.getByText(/was redacted — enter a value/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /try it out/i })).toHaveProperty("disabled", true);
  });

  it("edits a path param through onChange", () => {
    const onChange = vi.fn();
    render(<RequestForm form={form()} onChange={onChange} onFire={() => {}} firing={false} />);
    fireEvent.change(screen.getByDisplayValue("2"), { target: { value: "9" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ pathParams: [{ name: "id", value: "9" }] }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/components/__tests__/RequestForm.test.tsx`
Expected: FAIL — cannot resolve `../RequestForm`.

- [ ] **Step 3: Write minimal implementation**

Create `web/src/components/RequestForm.tsx`:

```tsx
import { validateForm } from "../request/build-request";
import type { KeyValue, RequestFormState } from "../request/types";

interface Props {
  form: RequestFormState;
  onChange: (next: RequestFormState) => void;
  onFire: () => void;
  firing: boolean;
}

const label: React.CSSProperties = {
  display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", opacity: 0.7, marginTop: 8,
};
const input: React.CSSProperties = { fontFamily: "monospace", fontSize: 12, padding: "5px 8px" };

const KeyValueRows = ({
  title, rows, onRows,
}: { title: string; rows: KeyValue[]; onRows: (rows: KeyValue[]) => void }) => (
  <div>
    <span style={label}>{title}</span>
    {rows.map((row, i) => (
      <div key={i} style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <input
          style={input} placeholder="name" value={row.name}
          onChange={(e) => onRows(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
        />
        <input
          style={{ ...input, flex: 1, border: row.needsInput && row.value.trim() === "" ? "1px solid #f59e0b" : undefined }}
          placeholder={row.needsInput ? "was redacted — enter a value" : "value"} value={row.value}
          onChange={(e) => onRows(rows.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
        />
        <button type="button" onClick={() => onRows(rows.filter((_, j) => j !== i))}>×</button>
      </div>
    ))}
    <button type="button" style={{ marginTop: 4 }} onClick={() => onRows([...rows, { name: "", value: "" }])}>
      + add
    </button>
  </div>
);

export const RequestForm = ({ form, onChange, onFire, firing }: Props) => {
  const errors = validateForm(form);
  const bodyless = form.method === "GET" || form.method === "HEAD";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {form.pathParams.length > 0 && (
        <div>
          <span style={label}>Path</span>
          {form.pathParams.map((p, i) => (
            <div key={p.name} style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
              <code>{p.name}</code>
              <input
                style={{ ...input, flex: 1 }} value={p.value}
                onChange={(e) =>
                  onChange({ ...form, pathParams: form.pathParams.map((q, j) => (j === i ? { ...q, value: e.target.value } : q)) })
                }
              />
            </div>
          ))}
        </div>
      )}

      <KeyValueRows title="Query" rows={form.query} onRows={(query) => onChange({ ...form, query })} />
      <KeyValueRows title="Headers" rows={form.headers} onRows={(headers) => onChange({ ...form, headers })} />

      {!bodyless && (
        <div>
          <span style={label}>Body</span>
          <textarea
            style={{ ...input, width: "100%", minHeight: 80, boxSizing: "border-box" }}
            value={form.body} onChange={(e) => onChange({ ...form, body: e.target.value })}
          />
        </div>
      )}

      {errors.map((e) => (
        <small key={e} style={{ color: "#b45309" }}>{e}</small>
      ))}

      <button
        type="button" style={{ alignSelf: "flex-start", marginTop: 8, padding: "7px 16px" }}
        disabled={firing || errors.length > 0} onClick={onFire}
      >
        {firing ? "Firing…" : "Try it out ▶"}
      </button>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run web/src/components/__tests__/RequestForm.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/RequestForm.tsx web/src/components/__tests__/RequestForm.test.tsx
git commit -m "feat(web): editable request form with validation-gated fire button"
```

---

### Task 8: ExampleAccordion + EndpointCard integration

**Files:**
- Create: `web/src/components/ExampleAccordion.tsx`
- Modify: `web/src/components/EndpointCard.tsx`
- Test: `web/src/components/__tests__/ExampleAccordion.test.tsx`

**Interfaces:**
- Consumes: `Endpoint`, `Example` (`web/src/api.ts`); `isLive` (Task 4); `prefillFromExample` (Task 2); `fireRequest` + `LiveResult` (Task 5); `RequestForm` (Task 7); `ResponsePanel` (Task 6).
- Produces:
  - `ExampleAccordion({ method, route, example }: { method: string; route: string; example: Example })` — a collapsed-by-default row (`status · name`). Expanded: in live mode shows `RequestForm` (state seeded by `prefillFromExample`) + `ResponsePanel` after firing; in static mode shows the read-only request/response `<pre>` blocks.
  - Updated `EndpointCard` renders one `ExampleAccordion` per example.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/__tests__/ExampleAccordion.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ExampleAccordion } from "../ExampleAccordion";
import type { Example } from "../../api";

const example: Example = {
  name: "returns the user",
  request: { url: "u", method: "GET", path: "/users/2", query: {}, headers: {}, body: null },
  response: { status: 200, headers: {}, body: { id: 2, name: "Paul" } },
};

afterEach(() => { cleanup(); delete window.__OWL_LIVE__; });

describe("ExampleAccordion", () => {
  it("is collapsed by default and shows status + name", () => {
    render(<ExampleAccordion method="GET" route="/users/:id" example={example} />);
    expect(screen.getByText(/returns the user/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /try it out/i })).toBeNull();
  });

  it("shows the read-only response when expanded in static mode", () => {
    render(<ExampleAccordion method="GET" route="/users/:id" example={example} />);
    fireEvent.click(screen.getByText(/returns the user/));
    expect(screen.getByText(/"name": "Paul"/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /try it out/i })).toBeNull();
  });

  describe("live mode", () => {
    beforeEach(() => { window.__OWL_LIVE__ = true; });
    it("shows the Try it out form when expanded", () => {
      render(<ExampleAccordion method="GET" route="/users/:id" example={example} />);
      fireEvent.click(screen.getByText(/returns the user/));
      expect(screen.getByRole("button", { name: /try it out/i })).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/components/__tests__/ExampleAccordion.test.tsx`
Expected: FAIL — cannot resolve `../ExampleAccordion`.

- [ ] **Step 3: Write the ExampleAccordion**

Create `web/src/components/ExampleAccordion.tsx`:

```tsx
import { useState } from "react";
import type { Example } from "../api";
import { isLive } from "../live";
import { prefillFromExample } from "../request/prefill";
import { fireRequest, type LiveResult } from "../request/fire";
import type { RequestFormState } from "../request/types";
import { RequestForm } from "./RequestForm";
import { ResponsePanel } from "./ResponsePanel";

export const ExampleAccordion = ({
  method, route, example,
}: { method: string; route: string; example: Example }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RequestFormState | null>(null);
  const [result, setResult] = useState<LiveResult | null>(null);
  const [firing, setFiring] = useState(false);
  const live = isLive();

  const toggle = () => {
    if (!open && live && !form) setForm(prefillFromExample(example, route));
    setOpen(!open);
  };

  const fire = async () => {
    if (!form) return;
    setFiring(true);
    setResult(await fireRequest(form));
    setFiring(false);
  };

  const ok2xx = example.response.status >= 200 && example.response.status < 300;
  return (
    <div style={{ borderTop: "1px solid #eee" }}>
      <div onClick={toggle} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 4px", cursor: "pointer" }}>
        <span style={{ opacity: 0.5, width: 12 }}>{open ? "▾" : "▸"}</span>
        <span
          style={{
            fontFamily: "monospace", fontWeight: 700, fontSize: 11, padding: "1px 8px", borderRadius: 20,
            background: ok2xx ? "#dcfce7" : "#fee2e2", color: ok2xx ? "#15803d" : "#b91c1c",
          }}
        >
          {example.response.status}
        </span>
        <span>{example.name}</span>
      </div>

      {open && (
        <div style={{ padding: "4px 4px 14px 36px" }}>
          {live && form ? (
            <>
              <RequestForm form={form} onChange={setForm} onFire={fire} firing={firing} />
              {result && <ResponsePanel result={result} />}
            </>
          ) : (
            <>
              <h4>Request</h4>
              <pre>{JSON.stringify(example.request.body ?? {}, null, 2)}</pre>
              <h4>Response</h4>
              <pre>{JSON.stringify(example.response.body ?? {}, null, 2)}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Rewrite EndpointCard to use the accordion**

Replace the contents of `web/src/components/EndpointCard.tsx` with:

```tsx
import type { Endpoint } from "../api";
import { ExampleAccordion } from "./ExampleAccordion";

export const EndpointCard = ({ endpoint }: { endpoint: Endpoint }) => (
  <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 16 }}>
    <h2 style={{ fontFamily: "monospace" }}>
      <span style={{ color: "#067" }}>{endpoint.method}</span> {endpoint.route}
    </h2>
    {endpoint.examples.map((example) => (
      <ExampleAccordion key={example.name} method={endpoint.method} route={endpoint.route} example={example} />
    ))}
  </section>
);
```

- [ ] **Step 5: Run the accordion test + full suite + typecheck**

Run: `npx vitest run web/src/components/__tests__/ExampleAccordion.test.tsx && npm test && npm run typecheck`
Expected: PASS — accordion tests, the whole suite, and no type errors.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/ExampleAccordion.tsx web/src/components/EndpointCard.tsx web/src/components/__tests__/ExampleAccordion.test.tsx
git commit -m "feat(web): per-Example accordions with live Try-it-out, static read-only"
```

---

### Task 9: End-to-end verification via example 02 + docs

**Files:**
- Modify: `examples/02-elaborate/README.md` (document the live "Try it out")
- (No source changes — this task proves the feature works end to end and records how to use it.)

**Interfaces:**
- Consumes: the whole feature.
- Produces: a verified live experience + user-facing note.

- [ ] **Step 1: Build the library and web bundle**

Run (from repo root): `npm run build`
Expected: completes; `dist/web/index.html` and `dist/index.js` exist.

- [ ] **Step 2: Generate docs for example 02 and serve them live**

Run: `cd examples/02-elaborate && pnpm install && pnpm test:create-docs`
Expected: `examples/02-elaborate/docs/site/catalog.json` is produced.

Then start the example app with docs serving enabled (the README documents `OWL_DOCS`):

Run: `OWL_DOCS=1 pnpm --filter . exec node --import tsx src/server.ts` (use the start command the example already defines if different; consult `examples/02-elaborate/package.json` scripts).

- [ ] **Step 3: Manually verify in a browser**

Open the served `/docs`. Confirm:
1. Endpoints render as cards with collapsed Example accordions.
2. Expanding `GET /users/:id` (200) shows the editable form with `id` prefilled to a captured value.
3. Clicking "Try it out" fires and the ResponsePanel shows a `200` with the JSON body.
4. Changing `id` to an unknown value and firing shows the `404` body.
5. Opening the **static** `examples/02-elaborate/docs/site/index.html` from `file://` shows the read-only view with **no** "Try it out" button.

- [ ] **Step 4: Document the feature in the example README**

In `examples/02-elaborate/README.md`, under the "How can I see docs being generated?" section, add:

```markdown
## Trying endpoints live

When the docs are served via `theOwl.docs()` (set `OWL_DOCS=1`), each Example is
interactive: expand it, edit the path params / query / headers / body, and click
**Try it out** to fire a real same-origin request and see the live response. The
captured owl test header is dropped automatically, and any redacted value is
shown as an empty field you must fill before firing. The static `docs/site` build
(opened from `file://`) stays read-only — there is no server to call.
```

- [ ] **Step 5: Commit**

```bash
git add examples/02-elaborate/README.md
git commit -m "docs(examples): document live Try-it-out in example 02"
```

---

## Self-Review

**1. Spec coverage:**
- Live-only "Try it out" → Tasks 4 (flag), 5 (fire), 8 (wiring). ✓
- Editable path/query/headers/body → Tasks 2 (prefill), 3 (build), 7 (form). ✓
- Per-Example accordions, collapsed, `status · name` → Task 8. ✓
- Key/value rows for headers + query; JSON textarea body → Task 7. ✓
- Strip `x-test-name`; flag `«redacted»` as needs-input → Task 2 (prefill) + Task 3 (validation) + Task 7 (UI). ✓
- Static build hides affordance → Task 4 (`isLive`) + Task 8 (branch). ✓
- Live detection via injected window flag → Task 4. ✓
- Response panel: status + time/size + body + collapsible headers + inline errors → Tasks 5 + 6. ✓
- `query` added to web Example type → Task 2. ✓
- Testing: pure-module unit tests (Tasks 1,2,3,5), serve injection (Task 4), component smoke tests (Tasks 6,7,8) → ✓
- Out-of-scope items (cURL, diff) correctly omitted. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows complete code; every test step shows the test. ✓

**3. Type consistency:** `RequestFormState` (method, route, pathParams[], query[], headers[], body) is defined in Task 2 and consumed identically in Tasks 3,5,7,8. `KeyValue` (name, value, needsInput?) consistent throughout. `LiveResult` defined in Task 5, consumed identically in Tasks 6,8. `prefillFromExample(example, route)`, `buildRequest(form)`, `validateForm(form)`, `fireRequest(form)`, `isLive()`, `injectLiveFlag(html)` signatures match across producer/consumer tasks. ✓
