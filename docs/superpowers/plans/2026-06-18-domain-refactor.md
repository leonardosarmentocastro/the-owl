# the-owl Domain Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `src/` around the four architecture domains (capture / drain / catalog / render) with co-located `__tests__`, types/constants separated from behavior, and an `AGENTS.md` canonical agent doc — with zero runtime behavior change.

**Architecture:** Pure structural refactor of a small Express+Vitest library. Each task moves one domain's files, extracts its exported types/constants, updates every importer (source AND tests) in the same commit, relocates that domain's tests into `<domain>/__tests__/`, and ends with a green `npm test` + `npm run typecheck`. The existing test suite is the regression net — it must stay green at every commit.

**Tech Stack:** TypeScript (ESM, `moduleResolution: Bundler`), Express 5, Vitest 4, tsup, slugify.

---

## Reference: target structure

```
src/
├── index.ts                 # composition root + public API (was the-owl.ts)
├── types.ts                 # shared kernel: CapturedRequest/Response, Example, Endpoint, Catalog
├── keys.ts                  # endpointKey() + JSDoc
├── capture/
│   ├── middleware.ts        # createCaptureMiddleware()
│   ├── collector.ts         # createCollector()
│   ├── headers.ts           # filterHeaders() (+ private IGNORED_HEADERS)
│   ├── sanitize.ts          # sanitizeHeaders/sanitizeBody/normalizeKey
│   ├── vitest.ts            # owlHeaders() — `the-owl/vitest` entry
│   ├── types.ts             # Collector, RecordInput, SanitizeOptions, ConnectOptions
│   ├── constants.ts         # TEST_NAME_HEADER, REDACTED, DEFAULT_SANITIZE
│   └── __tests__/           # middleware / collector / sanitize tests
├── drain/
│   ├── to-disk.ts           # drainToDisk()
│   ├── slug.ts              # endpointSlug()
│   └── __tests__/           # drain test
├── catalog/
│   ├── read.ts              # readCatalog()
│   └── __tests__/           # read test
├── render/
│   ├── html.ts              # emitHtml()
│   ├── build.ts             # runBuild()
│   ├── serve.ts             # docs()
│   ├── types.ts             # BuildOptions, DocsOptions
│   └── __tests__/           # build test
└── bin/
    └── cli.ts
```

**Dependency direction (must not be violated):**
`capture → {types, keys}`; `drain → {types, keys, capture}`; `catalog → {types, keys}`; `render → {types, catalog}`; `index.ts → {capture, drain, render}`; `bin/cli.ts → render`.

---

### Task 1: Shared kernel — split `model.ts` into `types.ts` + `keys.ts`

**Files:**
- Create: `src/types.ts`
- Create: `src/keys.ts`
- Delete: `src/model.ts`
- Modify: `src/collector.ts`, `src/persist/read-catalog.ts`, `src/renderers/html.ts`
- Modify (tests): `test/collector.test.ts`, `test/persist.test.ts`

- [ ] **Step 1: Create `src/types.ts`** (the five interfaces, verbatim from `model.ts`)

```ts
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
```

- [ ] **Step 2: Create `src/keys.ts`** (the `endpointKey` function with explanatory JSDoc)

```ts
/**
 * The in-memory identity of an Endpoint: `METHOD route` (e.g. `GET /users/:id`).
 *
 * This single string keys two pipeline operations:
 *  - the Collector dedupes captured Examples by it (capture domain), and
 *  - the catalog reader merges Examples of the same Endpoint across drain files
 *    (catalog domain).
 *
 * It is the in-memory counterpart to `drain/slug.ts`'s on-disk identity (the
 * filename slug). Keep both in sync conceptually: same Endpoint, two encodings.
 */
export const endpointKey = (method: string, route: string): string =>
  `${method.toUpperCase()} ${route}`;
```

- [ ] **Step 3: Delete `src/model.ts`**

- [ ] **Step 4: Update `src/collector.ts` imports** (lines 1-2)

Replace:

```ts
import type { CapturedRequest, CapturedResponse, Endpoint } from "./model";
import { endpointKey } from "./model";
```

with:

```ts
import type { CapturedRequest, CapturedResponse, Endpoint } from "./types";
import { endpointKey } from "./keys";
```

- [ ] **Step 5: Update `src/persist/read-catalog.ts` imports** (lines 3-4)

Replace:

```ts
import type { Catalog, Endpoint } from "../model";
import { endpointKey } from "../model";
```

with:

```ts
import type { Catalog, Endpoint } from "../types";
import { endpointKey } from "../keys";
```

- [ ] **Step 6: Update `src/renderers/html.ts` import** (line 3)

Replace `import type { Catalog } from "../model";` with `import type { Catalog } from "../types";`

- [ ] **Step 7: Update `test/collector.test.ts` import** (line 3)

Replace `import type { CapturedRequest, CapturedResponse } from "../src/model";` with `import type { CapturedRequest, CapturedResponse } from "../src/types";`

- [ ] **Step 8: Update `test/persist.test.ts` import** (line 9)

Replace `import type { CapturedRequest, CapturedResponse } from "../src/model";` with `import type { CapturedRequest, CapturedResponse } from "../src/types";`

- [ ] **Step 9: Run the suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests PASS, no type errors.

- [ ] **Step 10: Commit**

```bash
git add src/types.ts src/keys.ts src/collector.ts src/persist/read-catalog.ts src/renderers/html.ts test/collector.test.ts test/persist.test.ts
git rm src/model.ts
git commit -m "refactor: split model.ts into shared types.ts + keys.ts"
```

---

### Task 2: `capture/` domain

Moves the five capture files into `src/capture/`, extracts exported types into `capture/types.ts` and exported constants into `capture/constants.ts`, renames the middleware factory to `createCaptureMiddleware`, moves `ConnectOptions` out of the composition root, and relocates the three capture tests.

> **Circular-import note:** `DEFAULT_SANITIZE` currently calls `normalizeKey()` on its `redactKeys`. Putting `DEFAULT_SANITIZE` in `constants.ts` while `normalizeKey` stays in `sanitize.ts` would make `constants.ts` import `sanitize.ts` AND `sanitize.ts` import `REDACTED` from `constants.ts` — a runtime cycle that can throw a TDZ error depending on import order. Every key in that list is already in normalized form (lowercase, no separators), so `.map(normalizeKey)` is an identity. We drop the `.map` and store the literals pre-normalized (behavior-identical) to break the cycle. `sanitize.ts → constants.ts` then flows one way.

**Files:**
- Create: `src/capture/types.ts`, `src/capture/constants.ts`, `src/capture/middleware.ts`, `src/capture/collector.ts`, `src/capture/headers.ts`, `src/capture/sanitize.ts`, `src/capture/vitest.ts`
- Create (tests): `src/capture/__tests__/middleware.test.ts`, `src/capture/__tests__/collector.test.ts`, `src/capture/__tests__/sanitize.test.ts`
- Delete: `src/capture.ts`, `src/collector.ts`, `src/headers.ts`, `src/sanitize.ts`, `src/vitest.ts`, `test/capture.test.ts`, `test/collector.test.ts`, `test/sanitize.test.ts`
- Modify: `src/the-owl.ts`, `src/persist/drain-to-disk.ts`, `test/persist.test.ts`, `test/build.test.ts`, `tsup.config.ts`, `vitest.config.ts`

- [ ] **Step 1: Create `src/capture/types.ts`**

```ts
import type { CapturedRequest, CapturedResponse, Endpoint } from "../types";

/** One captured request/response pair as handed to the Collector. */
export interface RecordInput {
  testName: string;
  method: string;
  route: string;
  request: CapturedRequest;
  response: CapturedResponse;
}

/**
 * Holds the Examples captured during one test process and drains them into
 * serialized Endpoints. Filled by the capture middleware (`record`), emptied by
 * the drain domain (`drain`).
 */
export interface Collector {
  record(input: RecordInput): void;
  drain(): Endpoint[];
}

/** Resolved sanitization policy applied to every captured Example before it leaves memory. */
export interface SanitizeOptions {
  /** Header names (lowercased) whose values are masked but kept. */
  redactHeaders: Set<string>;
  /** Object keys (normalized) whose values are masked anywhere in a body/query. */
  redactKeys: Set<string>;
  /** Max serialized body size before truncation. */
  maxBodyBytes: number;
}

/** Public overrides accepted by `connect()` for the redaction / body-safety defaults. */
export interface ConnectOptions {
  redactHeaders?: Iterable<string>;
  redactKeys?: Iterable<string>;
  maxBodyBytes?: number;
}
```

- [ ] **Step 2: Create `src/capture/constants.ts`** (note the dropped `.map(normalizeKey)`)

```ts
import type { SanitizeOptions } from "./types";

/** Correlation header the capture middleware keys on; carries the test title. */
export const TEST_NAME_HEADER = "x-test-name";

/** Replacement value written in place of a redacted header value or body key. */
export const REDACTED = "«redacted»";

/**
 * Default sanitization policy.
 *
 * `redactKeys` MUST be stored pre-normalized (lowercased, separators stripped —
 * see `normalizeKey()` in ./sanitize). Storing them pre-normalized avoids a
 * runtime import cycle between constants.ts and sanitize.ts.
 */
export const DEFAULT_SANITIZE: SanitizeOptions = {
  redactHeaders: new Set(["authorization", "cookie", "set-cookie", "proxy-authorization"]),
  redactKeys: new Set([
    "password",
    "token",
    "secret",
    "authenticationtoken",
    "accesstoken",
    "refreshtoken",
    "apikey",
    "clientsecret",
    "privatekey",
  ]),
  maxBodyBytes: 64 * 1024,
};
```

- [ ] **Step 3: Create `src/capture/sanitize.ts`** (functions only; `SanitizeOptions` → types, `REDACTED`/`DEFAULT_SANITIZE` → constants)

```ts
import { REDACTED } from "./constants";
import type { SanitizeOptions } from "./types";

/** Normalize an object key for redaction matching: lowercased, separators stripped,
 * so `access_token`, `api-key`, `accessToken` all collapse to one comparable form. */
export const normalizeKey = (key: string): string => key.toLowerCase().replace(/[-_]/g, "");

export const sanitizeHeaders = (
  headers: Record<string, string>,
  opts: SanitizeOptions
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(headers).map(([key, value]) =>
      opts.redactHeaders.has(key.toLowerCase()) ? [key, REDACTED] : [key, value]
    )
  );

const deepRedact = (value: unknown, keys: Set<string>): unknown => {
  if (Array.isArray(value)) return value.map((v) => deepRedact(v, keys));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) =>
        keys.has(normalizeKey(k)) ? [k, REDACTED] : [k, deepRedact(v, keys)]
      )
    );
  }
  return value;
};

const isInlineable = (contentType?: string): boolean => {
  if (!contentType) return true; // already-parsed objects have no content-type here
  const ct = contentType.toLowerCase();
  return ct.includes("application/json") || ct.startsWith("text/");
};

export const sanitizeBody = (
  body: unknown,
  contentType: string | undefined,
  opts: SanitizeOptions
): unknown => {
  if (body == null) return null;
  if (Buffer.isBuffer(body)) return `[${contentType ?? "binary"}]`;
  if (contentType && !isInlineable(contentType)) {
    return contentType.toLowerCase().includes("multipart/form-data")
      ? "[multipart/form-data]"
      : `[${contentType}]`;
  }

  const redacted = typeof body === "object" ? deepRedact(body, opts.redactKeys) : body;
  const serialized = typeof redacted === "string" ? redacted : JSON.stringify(redacted);
  if (serialized.length > opts.maxBodyBytes) {
    return `${serialized.slice(0, opts.maxBodyBytes)}… [truncated ${serialized.length - opts.maxBodyBytes} chars]`;
  }
  return redacted;
};
```

- [ ] **Step 4: Create `src/capture/headers.ts`** (`TEST_NAME_HEADER` now imported from constants; `IGNORED_HEADERS` stays private)

```ts
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
```

- [ ] **Step 5: Create `src/capture/collector.ts`** (`Collector`/`RecordInput` now imported from types; export `createCollector` only)

```ts
import type { Endpoint } from "../types";
import { endpointKey } from "../keys";
import type { Collector, RecordInput } from "./types";

/**
 * Create a Collector: the in-memory accumulator the capture middleware writes to
 * during one test process. `record` dedupes by testName+method+route (first write
 * wins) so a res.json→res.end double-fire keeps the real body; `drain` groups the
 * Examples into serialized Endpoints for the drain domain to persist.
 */
export const createCollector = (): Collector => {
  // EC1: keyed by testName+method+route, so one test can document several endpoints
  // while res.json→res.end double-fires and repeated calls to the same endpoint dedupe.
  const byExample = new Map<string, RecordInput>();
  const exampleKey = (r: RecordInput) => `${r.testName}\u0000${endpointKey(r.method, r.route)}`;

  return {
    record(input) {
      const key = exampleKey(input);
      if (byExample.has(key)) return; // first write wins
      byExample.set(key, input);
    },

    drain() {
      const byEndpoint = new Map<string, Endpoint>();
      for (const r of byExample.values()) {
        const key = endpointKey(r.method, r.route);
        let endpoint = byEndpoint.get(key);
        if (!endpoint) {
          endpoint = { method: r.method.toUpperCase(), route: r.route, examples: [] };
          byEndpoint.set(key, endpoint);
        }
        endpoint.examples.push({ name: r.testName, request: r.request, response: r.response });
      }
      return [...byEndpoint.values()];
    },
  };
};
```

- [ ] **Step 6: Create `src/capture/middleware.ts`** (renamed from `makeCaptureMiddleware` → `createCaptureMiddleware`)

```ts
import type { Request, Response, NextFunction } from "express";
import { TEST_NAME_HEADER, DEFAULT_SANITIZE } from "./constants";
import { filterHeaders } from "./headers";
import { sanitizeHeaders, sanitizeBody } from "./sanitize";
import type { Collector, SanitizeOptions } from "./types";

/**
 * Create the Express middleware that captures the request/response of any request
 * tagged with the `x-test-name` header. It patches res.json/res.send/res.end so it
 * runs AFTER routing (route template + parsed body available), sanitizes the pair,
 * and records it into the Collector. This is step 1 of the pipeline (capture).
 */
export const createCaptureMiddleware =
  (collector: Collector, sanitize: SanitizeOptions = DEFAULT_SANITIZE) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const testName = req.header(TEST_NAME_HEADER);
    if (!testName) return next();

    // Runs inside the patched response methods, i.e. after routing — so req.route is populated
    // and req.body is parsed. Request and response are captured together (no header round-trip).
    const capture = (body: unknown): void => {
      const route = `${req.baseUrl ?? ""}${req.route?.path ?? req.path}`;
      const reqHeaders = filterHeaders(req.headers as Record<string, unknown>);
      const resHeaders = filterHeaders(res.getHeaders() as Record<string, unknown>);
      collector.record({
        testName,
        method: req.method,
        route,
        request: {
          url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
          method: req.method,
          path: req.path,
          query: sanitizeBody(req.query, undefined, sanitize) as Record<string, unknown>,
          headers: sanitizeHeaders(reqHeaders, sanitize),
          body: sanitizeBody(req.body ?? null, req.get("content-type"), sanitize),
        },
        response: {
          status: res.statusCode,
          headers: sanitizeHeaders(resHeaders, sanitize),
          body: sanitizeBody(body ?? null, res.getHeader("content-type") as string | undefined, sanitize),
        },
      });
    };

    const json = res.json.bind(res);
    res.json = (body: unknown) => {
      capture(body);
      return json(body);
    };

    const send = res.send.bind(res);
    res.send = (body?: unknown) => {
      capture(body);
      return send(body);
    };

    const end = res.end.bind(res) as (...args: unknown[]) => Response;
    res.end = ((...args: unknown[]) => {
      capture(null); // Collector keeps the first record, so a prior json/send body survives
      return end(...args);
    }) as Response["end"];

    next();
  };
```

- [ ] **Step 7: Create `src/capture/vitest.ts`** (import path only changes)

```ts
import { expect } from "vitest";
import { TEST_NAME_HEADER } from "./constants";

/** Returns the-owl's correlation header, filled from the current Vitest test name. */
export const owlHeaders = (): Record<string, string> => {
  const testName = expect.getState().currentTestName;
  if (!testName) {
    throw new Error("owlHeaders() must be called inside a running test");
  }
  return { [TEST_NAME_HEADER]: testName };
};
```

- [ ] **Step 8: Delete the old capture-domain source files**

```bash
git rm src/capture.ts src/collector.ts src/headers.ts src/sanitize.ts src/vitest.ts
```

- [ ] **Step 9: Update `src/the-owl.ts` imports** (lines 3-7)

Replace:

```ts
import { createCollector } from "./collector";
import { makeCaptureMiddleware } from "./capture";
import { drainToDisk } from "./persist/drain-to-disk";
import { TEST_NAME_HEADER } from "./headers";
import { DEFAULT_SANITIZE, normalizeKey, type SanitizeOptions } from "./sanitize";
```

with:

```ts
import { createCollector } from "./capture/collector";
import { createCaptureMiddleware } from "./capture/middleware";
import { drainToDisk } from "./persist/drain-to-disk";
import { TEST_NAME_HEADER } from "./capture/constants";
import { DEFAULT_SANITIZE } from "./capture/constants";
import { normalizeKey } from "./capture/sanitize";
import type { SanitizeOptions, ConnectOptions } from "./capture/types";
```

Then in the same file **remove the inline `ConnectOptions` interface** (it now lives in `capture/types.ts`) and update the middleware call. The `connect` block becomes:

```ts
export const connect = (app: Express, options: ConnectOptions = {}): void => {
  const sanitize: SanitizeOptions = {
    redactHeaders: options.redactHeaders ? new Set([...options.redactHeaders].map((h) => h.toLowerCase())) : DEFAULT_SANITIZE.redactHeaders,
    redactKeys: options.redactKeys ? new Set([...options.redactKeys].map(normalizeKey)) : DEFAULT_SANITIZE.redactKeys,
    maxBodyBytes: options.maxBodyBytes ?? DEFAULT_SANITIZE.maxBodyBytes,
  };
  app.use(createCaptureMiddleware(collector, sanitize));
};
```

(Delete the `export interface ConnectOptions { ... }` block at lines 15-20 of the original.)

- [ ] **Step 10: Update `src/persist/drain-to-disk.ts` import** (line 4)

Replace `import type { Collector } from "../collector";` with `import type { Collector } from "../capture/types";`

- [ ] **Step 11: Update `test/persist.test.ts` import** (line 5)

Replace `import { createCollector } from "../src/collector";` with `import { createCollector } from "../src/capture/collector";`

- [ ] **Step 12: Update `test/build.test.ts` import** (line 5)

Replace `import { createCollector } from "../src/collector";` with `import { createCollector } from "../src/capture/collector";`

- [ ] **Step 13: Create `src/capture/__tests__/collector.test.ts`** (moved from `test/collector.test.ts`, imports rewritten)

Same body as the original `test/collector.test.ts`, with lines 2-3 changed to:

```ts
import { createCollector } from "../collector";
import type { CapturedRequest, CapturedResponse } from "../../types";
```

- [ ] **Step 14: Create `src/capture/__tests__/sanitize.test.ts`** (moved from `test/sanitize.test.ts`, imports rewritten)

Same body as the original `test/sanitize.test.ts`, with line 2 changed to:

```ts
import { sanitizeHeaders, sanitizeBody } from "../sanitize";
import { DEFAULT_SANITIZE, REDACTED } from "../constants";
```

- [ ] **Step 15: Create `src/capture/__tests__/middleware.test.ts`** (moved from `test/capture.test.ts`, imports rewritten + `makeCaptureMiddleware` → `createCaptureMiddleware`)

Same body as the original `test/capture.test.ts`, with lines 4-6 changed to:

```ts
import { createCollector } from "../collector";
import { createCaptureMiddleware } from "../middleware";
import { TEST_NAME_HEADER } from "../constants";
```

and the in-body call `app.use(makeCaptureMiddleware(collector));` changed to `app.use(createCaptureMiddleware(collector));`

- [ ] **Step 16: Delete the old capture test files**

```bash
git rm test/capture.test.ts test/collector.test.ts test/sanitize.test.ts
```

- [ ] **Step 17: Repoint the `vitest` build entry in `tsup.config.ts`** (line 4)

Replace:

```ts
  entry: { index: "src/the-owl.ts", vitest: "src/vitest.ts", "bin/cli": "src/bin/cli.ts" },
```

with:

```ts
  entry: { index: "src/the-owl.ts", vitest: "src/capture/vitest.ts", "bin/cli": "src/bin/cli.ts" },
```

- [ ] **Step 18: Widen `vitest.config.ts` include to cover both locations during migration**

Replace `include: ["test/**/*.test.ts"]` with `include: ["src/**/*.test.ts", "test/**/*.test.ts"]`

- [ ] **Step 19: Run the suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests PASS (capture tests now run from `src/capture/__tests__/`, drain/catalog/render tests still run from `test/`), no type errors.

- [ ] **Step 20: Commit**

```bash
git add src/capture src/the-owl.ts src/persist/drain-to-disk.ts test/persist.test.ts test/build.test.ts tsup.config.ts vitest.config.ts
git commit -m "refactor: extract capture domain into src/capture/ with co-located tests"
```

---

### Task 3: `drain/` domain

Moves the write-side persistence (`drain-to-disk` + `slug`) into `src/drain/`, and pulls the drain-related cases out of `test/persist.test.ts` into `src/drain/__tests__/drain.test.ts`.

**Files:**
- Create: `src/drain/to-disk.ts`, `src/drain/slug.ts`, `src/drain/__tests__/drain.test.ts`
- Delete: `src/persist/drain-to-disk.ts`, `src/persist/slug.ts`
- Modify: `src/the-owl.ts`, `test/persist.test.ts`, `test/build.test.ts`

- [ ] **Step 1: Create `src/drain/slug.ts`**

```ts
import slugify from "slugify";

/**
 * The on-disk identity of an Endpoint — a filesystem-safe slug used as the prefix
 * of its drain file (`<slug>.<uuid>.json`). The in-memory counterpart is
 * `endpointKey()` in `src/keys.ts`.
 */
export const endpointSlug = (method: string, route: string): string =>
  slugify(`${method} ${route.replace(/[/:]+/g, " ")}`, { lower: true, strict: true, replacement: "-" });
```

- [ ] **Step 2: Create `src/drain/to-disk.ts`** (`Collector` now imported from `../capture/types`)

```ts
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Collector } from "../capture/types";
import { endpointSlug } from "./slug";

/**
 * Drain step (pipeline phase 2): empty a Collector to `.owl/*.json`. Each Endpoint
 * is written to its own `<slug>.<uuid>.json` file. The uuid makes every write
 * unique so the concurrently-forked test processes never clobber one another; the
 * merge into a single Catalog happens later in the catalog domain (`readCatalog`).
 */
export const drainToDisk = (collector: Collector, dir: string): string[] => {
  mkdirSync(dir, { recursive: true });
  const written: string[] = [];
  for (const endpoint of collector.drain()) {
    const file = join(dir, `${endpointSlug(endpoint.method, endpoint.route)}.${randomUUID()}.json`);
    writeFileSync(file, JSON.stringify(endpoint, null, 2));
    written.push(file);
  }
  return written;
};
```

- [ ] **Step 3: Delete the old write-side files**

```bash
git rm src/persist/drain-to-disk.ts src/persist/slug.ts
```

- [ ] **Step 4: Update `src/the-owl.ts` drain import** (line 5)

Replace `import { drainToDisk } from "./persist/drain-to-disk";` with `import { drainToDisk } from "./drain/to-disk";`

- [ ] **Step 5: Update `test/build.test.ts` drain import** (line 6)

Replace `import { drainToDisk } from "../src/persist/drain-to-disk";` with `import { drainToDisk } from "../src/drain/to-disk";`

- [ ] **Step 6: Create `src/drain/__tests__/drain.test.ts`** (the slug + drain cases, moved out of `persist.test.ts`)

```ts
import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCollector } from "../../capture/collector";
import { drainToDisk } from "../to-disk";
import { endpointSlug } from "../slug";
import type { CapturedRequest, CapturedResponse } from "../../types";

let dir: string;
afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

const req: CapturedRequest = { url: "u", method: "GET", path: "/users/1", query: {}, headers: {}, body: null };
const res = (body: unknown): CapturedResponse => ({ status: 200, headers: {}, body });

const seed = (name: string, body: unknown) => {
  const c = createCollector();
  c.record({ testName: name, method: "GET", route: "/users/:id", request: req, response: res(body) });
  return c;
};

describe("drain", () => {
  it("slugs an endpoint deterministically", () => {
    expect(endpointSlug("GET", "/users/:id")).toBe("get-users-id");
  });

  it("drains uniquely-named files (EC7: no clobber across processes)", () => {
    dir = mkdtempSync(join(tmpdir(), "owl-"));
    const files = drainToDisk(seed("(200) ok", { id: 1 }), dir);
    expect(files).toHaveLength(1);
    const [name] = readdirSync(dir);
    expect(name).toMatch(/^get-users-id\..+\.json$/); // <slug>.<unique>.json
  });
});
```

- [ ] **Step 7: Trim `test/persist.test.ts` down to only the catalog-merge case** (it moves to the catalog domain in Task 4; for now keep it green here)

Replace the whole file body with (imports repointed; drain/slug cases removed):

```ts
import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCollector } from "../src/capture/collector";
import { drainToDisk } from "../src/drain/to-disk";
import { readCatalog } from "../src/persist/read-catalog";
import type { CapturedRequest, CapturedResponse } from "../src/types";

let dir: string;
afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

const req: CapturedRequest = { url: "u", method: "GET", path: "/users/1", query: {}, headers: {}, body: null };
const res = (body: unknown): CapturedResponse => ({ status: 200, headers: {}, body });

const seed = (name: string, body: unknown) => {
  const c = createCollector();
  c.record({ testName: name, method: "GET", route: "/users/:id", request: req, response: res(body) });
  return c;
};

describe("catalog (merge)", () => {
  it("merges Examples by endpoint key across multiple drain files (EC7)", () => {
    dir = mkdtempSync(join(tmpdir(), "owl-"));
    // simulate two separate test processes documenting the SAME endpoint
    drainToDisk(seed("(200) ok", { id: 1 }), dir);
    drainToDisk(seed("(404) missing", { error: "nope" }), dir);

    const catalog = readCatalog(dir);
    expect(catalog.endpoints).toHaveLength(1); // merged, not duplicated
    expect(catalog.endpoints[0].examples.map((e) => e.name).sort()).toEqual(["(200) ok", "(404) missing"]);
  });
});
```

- [ ] **Step 8: Run the suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests PASS, no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/drain src/the-owl.ts test/build.test.ts test/persist.test.ts
git commit -m "refactor: extract drain domain (write side) into src/drain/"
```

---

### Task 4: `catalog/` domain

Moves the read+merge side into `src/catalog/`, relocates the merge test, and removes the now-empty `src/persist/`.

**Files:**
- Create: `src/catalog/read.ts`, `src/catalog/__tests__/read.test.ts`
- Delete: `src/persist/read-catalog.ts` (and the empty `src/persist/` dir), `test/persist.test.ts`
- Modify: `src/build.ts`

- [ ] **Step 1: Create `src/catalog/read.ts`**

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog, Endpoint } from "../types";
import { endpointKey } from "../keys";

/**
 * Catalog step (pipeline phase 3): read every drain fragment in `dir` and merge
 * them into one in-memory Catalog — the source of truth a Renderer consumes. This
 * domain WRITES NOTHING; the same Endpoint documented across multiple test files
 * becomes one Endpoint (Examples deduped by name). EC7.
 */
export const readCatalog = (dir: string): Catalog => {
  const byKey = new Map<string, Endpoint>();
  if (existsSync(dir)) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
      const endpoint = JSON.parse(readFileSync(join(dir, file), "utf8")) as Endpoint;
      const key = endpointKey(endpoint.method, endpoint.route);
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, endpoint);
        continue;
      }
      const seen = new Set(existing.examples.map((e) => e.name));
      for (const example of endpoint.examples) {
        if (!seen.has(example.name)) existing.examples.push(example);
      }
    }
  }
  return { generatedAt: new Date().toISOString(), endpoints: [...byKey.values()] };
};
```

- [ ] **Step 2: Delete the old read-catalog file and the empty persist dir**

```bash
git rm src/persist/read-catalog.ts
rmdir src/persist
```

- [ ] **Step 3: Update `src/build.ts` import** (line 1)

Replace `import { readCatalog } from "./persist/read-catalog";` with `import { readCatalog } from "./catalog/read";`

- [ ] **Step 4: Create `src/catalog/__tests__/read.test.ts`** (the merge case, moved out of `test/persist.test.ts`)

```ts
import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCollector } from "../../capture/collector";
import { drainToDisk } from "../../drain/to-disk";
import { readCatalog } from "../read";
import type { CapturedRequest, CapturedResponse } from "../../types";

let dir: string;
afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

const req: CapturedRequest = { url: "u", method: "GET", path: "/users/1", query: {}, headers: {}, body: null };
const res = (body: unknown): CapturedResponse => ({ status: 200, headers: {}, body });

const seed = (name: string, body: unknown) => {
  const c = createCollector();
  c.record({ testName: name, method: "GET", route: "/users/:id", request: req, response: res(body) });
  return c;
};

describe("catalog read", () => {
  it("merges Examples by endpoint key across multiple drain files (EC7)", () => {
    dir = mkdtempSync(join(tmpdir(), "owl-"));
    // simulate two separate test processes documenting the SAME endpoint
    drainToDisk(seed("(200) ok", { id: 1 }), dir);
    drainToDisk(seed("(404) missing", { error: "nope" }), dir);

    const catalog = readCatalog(dir);
    expect(catalog.endpoints).toHaveLength(1); // merged, not duplicated
    expect(catalog.endpoints[0].examples.map((e) => e.name).sort()).toEqual(["(200) ok", "(404) missing"]);
  });
});
```

- [ ] **Step 5: Delete the now-empty `test/persist.test.ts`**

```bash
git rm test/persist.test.ts
```

- [ ] **Step 6: Run the suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests PASS, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/catalog src/build.ts
git commit -m "refactor: extract catalog domain (read + merge) into src/catalog/"
```

---

### Task 5: `render/` domain

Moves the rendering/serving files into `src/render/`, extracts `BuildOptions`/`DocsOptions` into `render/types.ts`, relocates the build test, and removes the empty `src/renderers/`.

**Files:**
- Create: `src/render/types.ts`, `src/render/html.ts`, `src/render/build.ts`, `src/render/serve.ts`, `src/render/__tests__/build.test.ts`
- Delete: `src/renderers/html.ts` (and empty `src/renderers/`), `src/build.ts`, `src/serve.ts`, `test/build.test.ts`
- Modify: `src/the-owl.ts`, `src/bin/cli.ts`

- [ ] **Step 1: Create `src/render/types.ts`**

```ts
/** Options for `runBuild()` — where to read drain fragments and where to emit the site. */
export interface BuildOptions {
  owlDir: string;
  outDir: string;
  webBundleDir?: string;
}

/** Options for the live `docs()` Express router. */
export interface DocsOptions {
  /** Path to catalog.json from `the-owl build`. Default: ./docs/site/catalog.json */
  catalog?: string;
  /** Path to the pre-built React bundle. Default: the bundle shipped in the package. */
  bundleDir?: string;
}
```

- [ ] **Step 2: Create `src/render/html.ts`** (`Catalog` from `../types`)

```ts
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog } from "../types";

/**
 * Render step (pipeline phase 4): write the Catalog as a static site under
 * `<outDir>/site` — the React bundle plus the `catalog.json` the app fetches.
 */
export const emitHtml = (catalog: Catalog, outDir: string, webBundleDir?: string): void => {
  const siteDir = join(outDir, "site");
  mkdirSync(siteDir, { recursive: true });
  if (webBundleDir && existsSync(webBundleDir)) {
    cpSync(webBundleDir, siteDir, { recursive: true });
  }
  writeFileSync(join(siteDir, "catalog.json"), JSON.stringify(catalog, null, 2));
};
```

- [ ] **Step 3: Create `src/render/build.ts`** (`readCatalog` from `../catalog/read`, `BuildOptions` from `./types`)

```ts
import { readCatalog } from "../catalog/read";
import { emitHtml } from "./html";
import type { BuildOptions } from "./types";

/** Build the docs site: read + merge the Catalog, then render it. Used by the CLI. */
export const runBuild = ({ owlDir, outDir, webBundleDir }: BuildOptions): void => {
  const catalog = readCatalog(owlDir);
  emitHtml(catalog, outDir, webBundleDir);
};
```

- [ ] **Step 4: Create `src/render/serve.ts`** (`DocsOptions` from `./types`)

```ts
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { type RequestHandler } from "express";
import type { DocsOptions } from "./types";

/** Live-route Renderer: serve the catalog + React bundle from a running app. */
export const docs = (options: DocsOptions = {}): RequestHandler => {
  const here = dirname(fileURLToPath(import.meta.url));
  const bundleDir = options.bundleDir ?? join(here, "web");
  const catalogPath = options.catalog ?? join(process.cwd(), "docs", "site", "catalog.json");

  const router = express.Router();
  router.get("/catalog.json", (_req, res) => {
    if (!existsSync(catalogPath)) {
      res.status(404).json({ error: "catalog.json not found — run `the-owl build`" });
      return;
    }
    res.type("application/json").send(readFileSync(catalogPath, "utf8"));
  });
  router.use(express.static(bundleDir));
  return router;
};
```

> **Note:** `serve.ts` resolves the bundle relative to its own compiled location (`dirname(import.meta.url)/web`). The bundle is shipped at `dist/web` and the compiled `serve` lands in `dist/` regardless of `src/` layout (tsup flattens by entry), so this path is unaffected by the move. Verified by the build in Task 6.

- [ ] **Step 5: Delete the old render-domain files**

```bash
git rm src/renderers/html.ts src/build.ts src/serve.ts
rmdir src/renderers
```

- [ ] **Step 6: Update `src/the-owl.ts` docs import** (line 40)

Replace `import { docs } from "./serve";` with `import { docs } from "./render/serve";`

- [ ] **Step 7: Update `src/bin/cli.ts` import** (line 4)

Replace `import { runBuild } from "../build";` with `import { runBuild } from "../render/build";`

- [ ] **Step 8: Create `src/render/__tests__/build.test.ts`** (moved from `test/build.test.ts`, imports rewritten)

```ts
import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCollector } from "../../capture/collector";
import { drainToDisk } from "../../drain/to-disk";
import { runBuild } from "../build";

let root: string;
afterEach(() => root && rmSync(root, { recursive: true, force: true }));

describe("build", () => {
  it("emits catalog.json and copies the web bundle into docs/site", () => {
    root = mkdtempSync(join(tmpdir(), "owl-root-"));
    const owlDir = join(root, ".owl");
    const bundle = join(root, "bundle");
    mkdirSync(bundle, { recursive: true });
    writeFileSync(join(bundle, "index.html"), "<html></html>");

    const c = createCollector();
    c.record({
      testName: "(200) ok", method: "GET", route: "/users/:id",
      request: { url: "u", method: "GET", path: "/users/1", query: {}, headers: {}, body: null },
      response: { status: 200, headers: {}, body: { id: 1 } },
    });
    drainToDisk(c, owlDir);

    runBuild({ owlDir, outDir: join(root, "docs"), webBundleDir: bundle });

    const site = join(root, "docs", "site");
    expect(existsSync(join(site, "index.html"))).toBe(true);
    const catalog = JSON.parse(readFileSync(join(site, "catalog.json"), "utf8"));
    expect(catalog.endpoints[0].route).toBe("/users/:id");
  });
});
```

- [ ] **Step 9: Delete the old build test**

```bash
git rm test/build.test.ts
```

- [ ] **Step 10: Run the suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests PASS, no type errors. `test/` is now empty.

- [ ] **Step 11: Commit**

```bash
git add src/render src/the-owl.ts src/bin/cli.ts
git commit -m "refactor: extract render domain (html/build/serve) into src/render/"
```

---

### Task 6: Composition root rename + config finalize

Renames `the-owl.ts` → `index.ts`, repoints the tsup `index` entry, narrows the Vitest include now that no tests remain in `test/`, drops `test` from tsconfig, and verifies the full build.

**Files:**
- Rename: `src/the-owl.ts` → `src/index.ts`
- Delete: empty `test/` directory
- Modify: `tsup.config.ts`, `vitest.config.ts`, `tsconfig.json`

- [ ] **Step 1: Rename the composition root**

```bash
git mv src/the-owl.ts src/index.ts
```

- [ ] **Step 2: Replace `src/index.ts` with the canonical final content** (consolidates the incremental import edits from Tasks 2/3/5 into a clean, deduped header)

```ts
import { join } from "node:path";
import type { Express } from "express";
import { createCollector } from "./capture/collector";
import { createCaptureMiddleware } from "./capture/middleware";
import { drainToDisk } from "./drain/to-disk";
import { normalizeKey } from "./capture/sanitize";
import { TEST_NAME_HEADER, DEFAULT_SANITIZE } from "./capture/constants";
import type { SanitizeOptions, ConnectOptions } from "./capture/types";
import { docs } from "./render/serve";

// The composition root: the ONLY module that wires capture + drain + render
// together and exposes the public API. A single process-wide Collector is filled
// by the capture middleware and emptied by save().
const collector = createCollector();

export const buildHeaders = (testName: string): Record<string, string> => ({
  [TEST_NAME_HEADER]: testName,
});

/** Mount the capture middleware on an Express app (pipeline phase 1). */
export const connect = (app: Express, options: ConnectOptions = {}): void => {
  const sanitize: SanitizeOptions = {
    redactHeaders: options.redactHeaders ? new Set([...options.redactHeaders].map((h) => h.toLowerCase())) : DEFAULT_SANITIZE.redactHeaders,
    redactKeys: options.redactKeys ? new Set([...options.redactKeys].map(normalizeKey)) : DEFAULT_SANITIZE.redactKeys,
    maxBodyBytes: options.maxBodyBytes ?? DEFAULT_SANITIZE.maxBodyBytes,
  };
  app.use(createCaptureMiddleware(collector, sanitize));
};

/** Drain this process's captured Examples to `.owl/*.json` (pipeline phase 2). Render later with `the-owl build`. */
export const save = (): void => {
  if (!process.env.CREATE_DOCS) return;
  drainToDisk(collector, join(process.cwd(), ".owl"));
};

/** @deprecated renamed to save(); kept for v1 compatibility. */
export const createDocs = save;

export { docs };

export default { buildHeaders, connect, save, createDocs, docs };
```

- [ ] **Step 3: Repoint the `index` build entry in `tsup.config.ts`** (line 4)

Replace:

```ts
  entry: { index: "src/the-owl.ts", vitest: "src/capture/vitest.ts", "bin/cli": "src/bin/cli.ts" },
```

with:

```ts
  entry: { index: "src/index.ts", vitest: "src/capture/vitest.ts", "bin/cli": "src/bin/cli.ts" },
```

- [ ] **Step 4: Narrow `vitest.config.ts` include** (tests are now all under `src/`)

Replace `include: ["src/**/*.test.ts", "test/**/*.test.ts"]` with `include: ["src/**/*.test.ts"]`

- [ ] **Step 5: Remove the empty `test/` directory**

```bash
rmdir test
```

- [ ] **Step 6: Drop `test` from `tsconfig.json` include** (line 16)

Replace `"include": ["src", "web/src", "test"]` with `"include": ["src", "web/src"]`

- [ ] **Step 7: Full verification — tests, typecheck, build**

Run: `npm test && npm run typecheck && npm run build`
Expected:
- all tests PASS
- no type errors
- `dist/index.js`, `dist/index.cjs`, `dist/vitest.js`, `dist/vitest.cjs`, `dist/bin/cli.js`, and the web bundle emit as before (same names referenced by `package.json` `main`/`module`/`exports`/`bin`).

- [ ] **Step 8: Sanity-check an example still consumes the package** (optional but recommended)

Run: `cd examples/01-minimal && npm run test:create-docs` (if defined) — expected: `.owl/*.json` written and `the-owl build` produces `docs/site/catalog.json`. Then `cd ../..`.

- [ ] **Step 9: Commit**

```bash
git add src/index.ts tsup.config.ts vitest.config.ts tsconfig.json
git commit -m "refactor: rename composition root to index.ts and finalize test/build config"
```

---

### Task 7: Agent documentation

Adds `AGENTS.md` (canonical, read by Cursor and other tools) and `CLAUDE.md` (thin pointer for Claude Code).

**Files:**
- Create: `AGENTS.md`, `CLAUDE.md`

- [ ] **Step 1: Create `AGENTS.md`**

````markdown
# the-owl — agent guide

`the-owl` watches the request/response traffic of an Express app during its
functional tests and turns that traffic into interactive API docs. This file is
the canonical guide for AI agents and contributors. For the domain vocabulary
(Example, Endpoint, Catalog, Collector, Renderer) read **[CONTEXT.md](./CONTEXT.md)** —
it is not repeated here.

## Architecture: four domains, one pipeline

```
capture → drain → catalog → render
```

1. **`src/capture/`** — runs inside the test process. The capture middleware
   observes any request tagged with `x-test-name`, sanitizes it, and records it
   into the in-memory `Collector`.
2. **`src/drain/`** — the write side. Empties one process's `Collector` to
   `.owl/<slug>.<uuid>.json`. The uuid keeps concurrent test processes from
   clobbering each other.
3. **`src/catalog/`** — the read + merge side. Reads every `.owl/*.json` fragment
   and merges them into one in-memory `Catalog` (the source of truth). Writes
   nothing.
4. **`src/render/`** — turns the `Catalog` into `docs/site/` (static) or serves it
   live via `docs()`.

Shared across all domains:
- **`src/types.ts`** — the shared kernel: `CapturedRequest/Response`, `Example`,
  `Endpoint`, `Catalog`.
- **`src/keys.ts`** — `endpointKey()`, an Endpoint's in-memory identity (mirrors
  `drain/slug.ts`'s on-disk identity).
- **`src/index.ts`** — the composition root and public API (`connect`, `save`,
  `docs`); the only module that wires domains together.
- **`src/bin/cli.ts`** — the `the-owl build` executable.

## Allowed dependency direction

```
capture   → types, keys
drain     → types, keys, capture        (uses the Collector type)
catalog   → types, keys
render    → types, catalog              (build reads the catalog)
index.ts  → capture, drain, render      (the ONLY cross-domain wiring)
bin/cli   → render
```

Domains may reach "sideways" ONLY along the pipeline (`drain → capture`,
`render → catalog`). Any other cross-domain coupling belongs in the composition
root. Do not let a domain import a sibling outside this list.

## Conventions

- **Factories use `create*`**: `createCaptureMiddleware()`, `createCollector()`.
- **File purity**: a behavior file exports functions only. Exported types live in
  `<domain>/types.ts`; exported constants in `<domain>/constants.ts`. A constant
  used privately by exactly one function may stay local to that file.
- **Tests are co-located** in `<domain>/__tests__/*.test.ts`. There is no
  top-level `test/` folder.
- **JSDoc the entry function of each domain** with its role in the pipeline.
- **Avoid generic names** (`utils`, `store`, `state`, `registry`) — see the
  "_Avoid_" lists in `CONTEXT.md`.

## Build & test

- `npm test` — Vitest, discovers `src/**/*.test.ts`.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run build` — `tsup` (entries: `src/index.ts`, `src/capture/vitest.ts`,
  `src/bin/cli.ts`) + the Vite web bundle.

Out of scope for the domain layout: `web/` (the React app), `examples/`, and
`documentation/`.

## Workflow conventions

- **Never commit directly to `master`.** Before starting any unit of work, create a
  branch named with a conventional-commit-style prefix:
  `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`, `refactor/<slug>`,
  `test/<slug>`. This applies to spec/plan docs too — branch first, then commit.
- **Brainstorming hand-off.** When a `/brainstorming` (or design → plan) session
  finishes, always end by giving the user a ready-to-paste prompt for a *fresh
  session* that executes the implementation plan. The prompt must name the plan
  file, the branch to work on, and the execution skill. Template:

  > Execute the implementation plan at `docs/superpowers/plans/<file>.md` on branch
  > `<branch>` using superpowers:executing-plans (or subagent-driven-development).
  > Implement it task-by-task, keep the test suite green, and commit after each task.
````

- [ ] **Step 2: Create `CLAUDE.md`** (pointer)

```markdown
# CLAUDE.md

This project's agent guide is **[AGENTS.md](./AGENTS.md)** — read it first.

It documents the four-domain architecture (`capture → drain → catalog → render`),
the allowed dependency direction between domains, the file/naming conventions, and
the **workflow conventions** (always branch before working — never commit to
`master`; provide an execution hand-off prompt at the end of a brainstorming
session). For the domain vocabulary, see **[CONTEXT.md](./CONTEXT.md)**.
```

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs: add AGENTS.md architecture guide + CLAUDE.md pointer"
```

---

## Self-Review

**Spec coverage** — every section of the design spec maps to a task:
- Four domain folders → Tasks 2–5. Shared kernel (`types.ts`/`keys.ts`) → Task 1.
- Composition root rename + entries → Task 6 (vitest entry repointed in Task 2).
- `create*` factory rename → Task 2 (`createCaptureMiddleware`).
- types/constants separation → Tasks 2 (`capture/types.ts`, `capture/constants.ts`) and 5 (`render/types.ts`); `ConnectOptions`→`capture/types.ts` in Task 2.
- Co-located `__tests__` + `test/` deletion → Tasks 2–6.
- Dependency direction + JSDoc + agent docs → JSDoc throughout Tasks 1–6; docs in Task 7.
- Config updates (tsup/vitest/tsconfig) → Tasks 2 and 6.

**Type/symbol consistency** — `makeCaptureMiddleware` is renamed to
`createCaptureMiddleware` in exactly one place (Task 2) and every caller
(`index.ts`, `middleware.test.ts`) uses the new name. `Collector`, `RecordInput`,
`SanitizeOptions`, `ConnectOptions`, `BuildOptions`, `DocsOptions` are each defined
once and imported by path thereafter. `readCatalog`/`drainToDisk`/`endpointSlug`/
`emitHtml`/`runBuild`/`docs`/`owlHeaders`/`endpointKey` keep their names; only their
file paths move.

**Behavior preservation** — the one micro-change is dropping `.map(normalizeKey)`
from `DEFAULT_SANITIZE.redactKeys` (Task 2); every literal is already normalized, so
output is identical. This is required to break a constants↔sanitize import cycle.

**Greenness invariant** — each task updates every importer of the modules it moves
(source AND tests) within the same commit, and the migration-phase Vitest include
(`["src/**/*.test.ts", "test/**/*.test.ts"]`, set in Task 2) keeps both old and new
test locations discoverable until `test/` is emptied in Task 6.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-18-domain-refactor.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — I execute the tasks in this session using executing-plans, with checkpoints for your review.

Which approach?
