# the-owl Collection-and-Emit Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `the-owl` in TypeScript so it collects request/response Examples behind a small Collector interface, serializes them to a canonical `Catalog` JSON (the seam), and ships an interactive HTML (React) app that reads it — browsable as a static site or served live from the API itself via `theOwl.docs()`.

**Architecture:** A single capture middleware reads everything at **response time** (so it auto-resolves the route template and needs no response-header mutation) → **Collector** (`record`/`drain`) → per-process `.owl/*.json` → `the-owl build` merges a **Catalog** → the HTML Renderer emits `catalog.json` + a pre-built React bundle. Delivery has two adapters over one build output: static files and a `theOwl.docs()` Express handler. A thin `the-owl/vitest` entry auto-fills the test name from Vitest, so consumer tests need almost no boilerplate.

**Tech Stack (latest stable, June 2026):** Node.js 24 (Krypton, Active LTS), TypeScript 5, Express 5 (peer), Vitest 4 (own tests + the `the-owl/vitest` helper), Vite 7 + React 19 (docs app), tsup 8 (library bundle), `slugify`. Native `fetch` (Node 24) in examples — no `got`/`detect-port`. **Redux and the markdown renderer are removed.**

**Branch:** all work happens on `feat/v2-collection-and-emit` (already created). Commit after each completed step; never commit to `master`.

**Domain vocabulary:** see `CONTEXT.md` — **Example**, **Endpoint**, **Catalog**, **Collector**, **Renderer**.

**Design notes folded in from review:**
- *Auto-resolved route (was candidate 5):* the capture middleware runs the capture inside the patched `res.json/send/end`, i.e. after routing, where `req.baseUrl + req.route.path` reconstructs `/users/:id`. The `x-req-original-path` header is **gone**.
- *No response-header correlation (was candidate 6):* request and response are captured in one closure over the same `req`/`res`, so there is no `res.setHeader(x-test-name)` leaking onto the wire.
- *One header only:* `x-test-name` — both the opt-in signal and the Example name. In Vitest, `owlHeaders()` fills it automatically.

---

## File Structure

```
the-owl/
  src/
    model.ts                  # The seam: Example, Endpoint, Catalog
    headers.ts                # x-test-name constant + header filtering
    collector.ts              # Collector (record/drain) — replaces redux store + duck
    capture.ts                # single Express capture middleware (response-time capture)
    persist/
      slug.ts                 # endpoint → filename slug
      drain-to-disk.ts        # drain Collector → .owl/<slug>.json
      read-catalog.ts         # merge .owl/*.json → Catalog
    renderers/
      html.ts                 # write catalog.json + copy the React bundle
    build.ts                  # readCatalog → emit catalog.json + bundle
    serve.ts                  # theOwl.docs() Express handler
    the-owl.ts                # public API: connect/buildHeaders/save(createDocs alias)/docs
    vitest.ts                 # `the-owl/vitest`: owlHeaders() from currentTestName
    bin/cli.ts                # `the-owl build`
  web/                        # Vite + React docs app → built into dist/web
    index.html
    vite.config.ts
    src/main.tsx
    src/api.ts
    src/App.tsx
    src/components/EndpointCard.tsx
  test/
    collector.test.ts
    capture.test.ts
    persist.test.ts
    build.test.ts
  CONTEXT.md                  # already written
  package.json                # rewritten
  tsconfig.json  tsup.config.ts  vitest.config.ts
```

**Legacy deleted in Task 13:** `src/redux/**`, `src/lib/**` (incl. all `write-markdown`), `src/the-owl.js`, `src/__helpers__/**`.

---

## Task 1: Tooling — TypeScript, Vitest, tsup, Vite (latest stable)

**Files:** Modify `package.json`; Create `tsconfig.json`, `vitest.config.ts`, `tsup.config.ts`, `.nvmrc`

- [ ] **Step 1: Pin Node with `.nvmrc`**

```
24
```

- [ ] **Step 2: Replace `package.json`**

```json
{
  "name": "the-owl",
  "version": "2.0.0",
  "description": "Generate interactive API docs from your functional tests",
  "type": "module",
  "engines": { "node": ">=24" },
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "bin": { "the-owl": "./dist/bin/cli.js" },
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs", "require": "./dist/index.js" },
    "./vitest": { "types": "./dist/vitest.d.ts", "import": "./dist/vitest.mjs", "require": "./dist/vitest.js" }
  },
  "files": ["dist"],
  "scripts": {
    "build:web": "vite build web",
    "build:lib": "tsup",
    "build": "npm run build:web && npm run build:lib",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": { "express": ">=5" },
  "peerDependenciesMeta": { "vitest": { "optional": true } },
  "dependencies": { "slugify": "^1.6.6" },
  "license": "ISC"
}
```

- [ ] **Step 3: Install the latest stable dev/peer packages**

Run (lets npm resolve true latest, per the "latest stable" requirement):

```bash
npm install -D typescript@latest tsup@latest vitest@latest vite@latest @vitejs/plugin-react@latest \
  react@latest react-dom@latest @types/react@latest @types/react-dom@latest \
  @types/node@latest express@latest @types/express@latest
npm install slugify@latest
```

Expected: installs without peer conflicts; `react`/`react-dom` resolve to 19.x, `express` to 5.x, `vitest` to 4.x.

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["src", "web/src", "test"]
}
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["test/**/*.test.ts"], environment: "node" },
});
```

- [ ] **Step 6: Create `tsup.config.ts`**

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/the-owl.ts", vitest: "src/vitest.ts", "bin/cli": "src/bin/cli.ts" },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: ["express", "vitest", "react", "react-dom"],
});
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts tsup.config.ts .nvmrc
git commit -m "chore: TypeScript + Vitest + tsup/Vite toolchain on Node 24"
```

---

## Task 2: The model (the seam)

**Files:** Create `src/model.ts`

- [ ] **Step 1: Write the model**

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

export const endpointKey = (method: string, route: string): string =>
  `${method.toUpperCase()} ${route}`;
```

- [ ] **Step 2: Typecheck** — Run: `npx tsc --noEmit` — Expected: PASS.
- [ ] **Step 3: Commit**

```bash
git add src/model.ts
git commit -m "feat: add Example/Endpoint/Catalog model (the render seam)"
```

---

## Task 3: Headers + filtering

**Files:** Create `src/headers.ts`

- [ ] **Step 1: Write `src/headers.ts`**

```ts
export const TEST_NAME_HEADER = "x-test-name";

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

- [ ] **Step 2: Typecheck** — Run: `npx tsc --noEmit` — Expected: PASS.
- [ ] **Step 3: Commit**

```bash
git add src/headers.ts
git commit -m "feat: x-test-name constant + response/request header filtering"
```

---

## Task 4: Collector (replaces Redux store + duck)

**Files:** Create `src/collector.ts`; Test `test/collector.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { createCollector } from "../src/collector";
import type { CapturedRequest, CapturedResponse } from "../src/model";

const request = (path: string): CapturedRequest => ({
  url: `http://localhost${path}`, method: "GET", path, query: {}, headers: {}, body: null,
});
const response = (status: number, body: unknown = null): CapturedResponse => ({ status, headers: {}, body });

describe("collector", () => {
  it("groups examples under one endpoint by method+route", () => {
    const c = createCollector();
    c.record({ testName: "(200) ok", method: "GET", route: "/users/:id", request: request("/users/1"), response: response(200) });
    c.record({ testName: "(500) missing", method: "GET", route: "/users/:id", request: request("/users/9"), response: response(500) });

    const endpoints = c.drain();
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].route).toBe("/users/:id");
    expect(endpoints[0].examples.map((e) => e.name)).toEqual(["(200) ok", "(500) missing"]);
  });

  it("keeps the first record per test name (res.json then res.end fires twice)", () => {
    const c = createCollector();
    c.record({ testName: "(200) ok", method: "GET", route: "/h", request: request("/h"), response: response(200, "OK") });
    c.record({ testName: "(200) ok", method: "GET", route: "/h", request: request("/h"), response: response(200, null) });
    const [endpoint] = c.drain();
    expect(endpoint.examples).toHaveLength(1);
    expect(endpoint.examples[0].response.body).toBe("OK");
  });

  it("separates distinct endpoints", () => {
    const c = createCollector();
    c.record({ testName: "a", method: "GET", route: "/a", request: request("/a"), response: response(200) });
    c.record({ testName: "b", method: "POST", route: "/b", request: request("/b"), response: response(201) });
    expect(c.drain()).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run test/collector.test.ts` — Expected: FAIL "Cannot find module '../src/collector'".
- [ ] **Step 3: Implement `src/collector.ts`**

```ts
import type { CapturedRequest, CapturedResponse, Endpoint } from "./model";
import { endpointKey } from "./model";

export interface RecordInput {
  testName: string;
  method: string;
  route: string;
  request: CapturedRequest;
  response: CapturedResponse;
}

export interface Collector {
  record(input: RecordInput): void;
  drain(): Endpoint[];
}

export const createCollector = (): Collector => {
  const byTest = new Map<string, RecordInput>();

  return {
    record(input) {
      if (byTest.has(input.testName)) return; // first write wins (dedups res.json → res.end)
      byTest.set(input.testName, input);
    },

    drain() {
      const byEndpoint = new Map<string, Endpoint>();
      for (const r of byTest.values()) {
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

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run test/collector.test.ts` — Expected: PASS (3 tests).
- [ ] **Step 5: Commit**

```bash
git add src/collector.ts test/collector.test.ts
git commit -m "feat: Collector deep module (record/drain) replacing redux"
```

---

## Task 5: Capture middleware (single, response-time, auto-route)

**Files:** Create `src/capture.ts`; Test `test/capture.test.ts`

- [ ] **Step 1: Write the failing test (real Express server, native fetch)**

```ts
import { describe, it, expect } from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import { createCollector } from "../src/collector";
import { makeCaptureMiddleware } from "../src/capture";
import { TEST_NAME_HEADER } from "../src/headers";

const start = async () => {
  const collector = createCollector();
  const app = express();
  app.use(express.json());
  app.use(makeCaptureMiddleware(collector));
  app.get("/health", (_req, res) => res.status(200).send("OK"));
  const users = express.Router();
  users.get("/:id", (req, res) => res.json({ id: req.params.id }));
  app.use("/users", users);
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address() as AddressInfo;
  return { collector, server, base: `http://localhost:${port}` };
};

describe("capture middleware", () => {
  it("auto-resolves the mounted route template (no x-req-original-path)", async () => {
    const { collector, server, base } = await start();
    await fetch(`${base}/users/1`, { headers: { [TEST_NAME_HEADER]: "(200) returns user" } });
    server.close();

    const [endpoint] = collector.drain();
    expect(endpoint.method).toBe("GET");
    expect(endpoint.route).toBe("/users/:id");
    expect(endpoint.examples[0].name).toBe("(200) returns user");
    expect(endpoint.examples[0].response.body).toEqual({ id: "1" });
  });

  it("captures res.send bodies and ignores untagged requests", async () => {
    const { collector, server, base } = await start();
    await fetch(`${base}/health`, { headers: { [TEST_NAME_HEADER]: "(200) ok" } });
    await fetch(`${base}/health`); // untagged
    server.close();

    const endpoints = collector.drain();
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].examples[0].response.body).toBe("OK");
  });

  it("does not write x-test-name onto the outgoing response", async () => {
    const { server, base } = await start();
    const res = await fetch(`${base}/health`, { headers: { [TEST_NAME_HEADER]: "x" } });
    server.close();
    expect(res.headers.get(TEST_NAME_HEADER)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run test/capture.test.ts` — Expected: FAIL "Cannot find module '../src/capture'".
- [ ] **Step 3: Implement `src/capture.ts`**

```ts
import type { Request, Response, NextFunction } from "express";
import type { Collector } from "./collector";
import { TEST_NAME_HEADER, filterHeaders } from "./headers";

export const makeCaptureMiddleware =
  (collector: Collector) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const testName = req.header(TEST_NAME_HEADER);
    if (!testName) return next();

    // Runs inside the patched response methods, i.e. after routing — so req.route is populated
    // and req.body is parsed. Request and response are captured together (no header round-trip).
    const capture = (body: unknown): void => {
      const route = `${req.baseUrl ?? ""}${req.route?.path ?? req.path}`;
      collector.record({
        testName,
        method: req.method,
        route,
        request: {
          url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
          method: req.method,
          path: req.path,
          query: req.query as Record<string, unknown>,
          headers: filterHeaders(req.headers as Record<string, unknown>),
          body: req.body ?? null,
        },
        response: {
          status: res.statusCode,
          headers: filterHeaders(res.getHeaders() as Record<string, unknown>),
          body: body ?? null,
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

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run test/capture.test.ts` — Expected: PASS (3 tests).
- [ ] **Step 5: Commit**

```bash
git add src/capture.ts test/capture.test.ts
git commit -m "feat: single capture middleware with auto-resolved routes, no header round-trip"
```

---

## Task 6: Persist — slug, drain-to-disk, read-catalog

**Files:** Create `src/persist/slug.ts`, `src/persist/drain-to-disk.ts`, `src/persist/read-catalog.ts`; Test `test/persist.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCollector } from "../src/collector";
import { drainToDisk } from "../src/persist/drain-to-disk";
import { readCatalog } from "../src/persist/read-catalog";
import { endpointSlug } from "../src/persist/slug";

let dir: string;
afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

const seed = () => {
  const c = createCollector();
  c.record({
    testName: "(200) ok", method: "GET", route: "/users/:id",
    request: { url: "u", method: "GET", path: "/users/1", query: {}, headers: {}, body: null },
    response: { status: 200, headers: {}, body: { id: 1 } },
  });
  return c;
};

describe("persist", () => {
  it("slugs an endpoint deterministically", () => {
    expect(endpointSlug("GET", "/users/:id")).toBe("get-users-id");
  });

  it("drains one json file per endpoint and merges them into a catalog", () => {
    dir = mkdtempSync(join(tmpdir(), "owl-"));
    drainToDisk(seed(), dir);
    expect(readdirSync(dir)).toEqual(["get-users-id.json"]);

    const catalog = readCatalog(dir);
    expect(catalog.endpoints).toHaveLength(1);
    expect(catalog.endpoints[0].examples[0].response.body).toEqual({ id: 1 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run test/persist.test.ts` — Expected: FAIL "Cannot find module '../src/persist/slug'".
- [ ] **Step 3: Implement `src/persist/slug.ts`**

```ts
import slugify from "slugify";

export const endpointSlug = (method: string, route: string): string =>
  slugify(`${method} ${route}`, { lower: true, strict: true, replacement: "-" });
```

- [ ] **Step 4: Implement `src/persist/drain-to-disk.ts`**

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Collector } from "../collector";
import { endpointSlug } from "./slug";

export const drainToDisk = (collector: Collector, dir: string): string[] => {
  mkdirSync(dir, { recursive: true });
  const written: string[] = [];
  for (const endpoint of collector.drain()) {
    const file = join(dir, `${endpointSlug(endpoint.method, endpoint.route)}.json`);
    writeFileSync(file, JSON.stringify(endpoint, null, 2));
    written.push(file);
  }
  return written;
};
```

- [ ] **Step 5: Implement `src/persist/read-catalog.ts`**

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog, Endpoint } from "../model";

export const readCatalog = (dir: string): Catalog => {
  const endpoints: Endpoint[] = [];
  if (existsSync(dir)) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
      endpoints.push(JSON.parse(readFileSync(join(dir, file), "utf8")) as Endpoint);
    }
  }
  return { generatedAt: new Date().toISOString(), endpoints };
};
```

- [ ] **Step 6: Run test to verify it passes** — Run: `npx vitest run test/persist.test.ts` — Expected: PASS (2 tests).
- [ ] **Step 7: Commit**

```bash
git add src/persist test/persist.test.ts
git commit -m "feat: persist drained endpoints to .owl/*.json and merge into a Catalog"
```

---

## Task 7: HTML Renderer + build step + CLI

**Files:** Create `src/renderers/html.ts`, `src/build.ts`, `src/bin/cli.ts`; Test `test/build.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCollector } from "../src/collector";
import { drainToDisk } from "../src/persist/drain-to-disk";
import { runBuild } from "../src/build";

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

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run test/build.test.ts` — Expected: FAIL "Cannot find module '../src/build'".
- [ ] **Step 3: Implement `src/renderers/html.ts`**

```ts
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog } from "../model";

export const emitHtml = (catalog: Catalog, outDir: string, webBundleDir?: string): void => {
  const siteDir = join(outDir, "site");
  mkdirSync(siteDir, { recursive: true });
  if (webBundleDir && existsSync(webBundleDir)) {
    cpSync(webBundleDir, siteDir, { recursive: true });
  }
  writeFileSync(join(siteDir, "catalog.json"), JSON.stringify(catalog, null, 2));
};
```

- [ ] **Step 4: Implement `src/build.ts`**

```ts
import { readCatalog } from "./persist/read-catalog";
import { emitHtml } from "./renderers/html";

export interface BuildOptions {
  owlDir: string;
  outDir: string;
  webBundleDir?: string;
}

export const runBuild = ({ owlDir, outDir, webBundleDir }: BuildOptions): void => {
  const catalog = readCatalog(owlDir);
  emitHtml(catalog, outDir, webBundleDir);
};
```

- [ ] **Step 5: Implement `src/bin/cli.ts`**

```ts
#!/usr/bin/env node
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runBuild } from "../build";

const [, , command] = process.argv;
if (command !== "build") {
  console.error("usage: the-owl build");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
runBuild({
  owlDir: join(process.cwd(), ".owl"),
  outDir: join(process.cwd(), "docs"),
  webBundleDir: join(here, "..", "web"), // dist/web shipped in the package
});
console.log("the-owl: docs built into ./docs/site (open index.html or serve via theOwl.docs())");
```

- [ ] **Step 6: Run test to verify it passes** — Run: `npx vitest run test/build.test.ts` — Expected: PASS.
- [ ] **Step 7: Commit**

```bash
git add src/renderers/html.ts src/build.ts src/bin/cli.ts test/build.test.ts
git commit -m "feat: build step emits catalog.json + web bundle; the-owl build CLI"
```

---

## Task 8: Public API

**Files:** Create `src/the-owl.ts`

- [ ] **Step 1: Implement `src/the-owl.ts`**

```ts
import { join } from "node:path";
import type { Express } from "express";
import { createCollector } from "./collector";
import { makeCaptureMiddleware } from "./capture";
import { drainToDisk } from "./persist/drain-to-disk";
import { TEST_NAME_HEADER } from "./headers";

const collector = createCollector();

export const buildHeaders = (testName: string): Record<string, string> => ({
  [TEST_NAME_HEADER]: testName,
});

export const connect = (app: Express): void => {
  app.use(makeCaptureMiddleware(collector));
};

/** Drain this process's captured Examples to `.owl/*.json`. Render later with `the-owl build`. */
export const save = (): void => {
  if (!process.env.CREATE_DOCS) return;
  drainToDisk(collector, join(process.cwd(), ".owl"));
};

/** @deprecated renamed to save(); kept for v1 compatibility. */
export const createDocs = save;

export { docs } from "./serve";

export default { buildHeaders, connect, save, createDocs };
```

- [ ] **Step 2: Note** — typecheck deferred until Task 9 creates `./serve`. Implement Task 9 next, then run `npx tsc --noEmit` (Expected: PASS).
- [ ] **Step 3: Commit**

```bash
git add src/the-owl.ts
git commit -m "feat: public API (connect/buildHeaders/save, createDocs alias)"
```

---

## Task 9: Serve adapter — `theOwl.docs()`

**Files:** Create `src/serve.ts`

- [ ] **Step 1: Implement `src/serve.ts`**

```ts
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { type RequestHandler } from "express";

export interface DocsOptions {
  /** Path to catalog.json from `the-owl build`. Default: ./docs/site/catalog.json */
  catalog?: string;
  /** Path to the pre-built React bundle. Default: the bundle shipped in the package. */
  bundleDir?: string;
}

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

Consumer usage (documented in Task 13):

```ts
if (process.env.NODE_ENV === "staging") app.use("/docs", theOwl.docs());
```

- [ ] **Step 2: Typecheck** — Run: `npx tsc --noEmit` — Expected: PASS.
- [ ] **Step 3: Commit**

```bash
git add src/serve.ts
git commit -m "feat: theOwl.docs() Express handler serving the bundle + catalog.json"
```

---

## Task 10: `the-owl/vitest` — zero-boilerplate headers

**Files:** Create `src/vitest.ts`

This is the answer to "do we still need the preparation steps?": **no**. `owlHeaders()` reads the test name from Vitest itself, and the route is auto-resolved server-side — so a consumer test attaches one header with no arguments and sets nothing on `t.context`.

- [ ] **Step 1: Implement `src/vitest.ts`**

```ts
import { expect } from "vitest";
import { TEST_NAME_HEADER } from "./headers";

/** Returns the-owl's correlation header, filled from the current Vitest test name. */
export const owlHeaders = (): Record<string, string> => {
  const testName = expect.getState().currentTestName;
  if (!testName) {
    throw new Error("owlHeaders() must be called inside a running test");
  }
  return { [TEST_NAME_HEADER]: testName };
};
```

- [ ] **Step 2: Typecheck** — Run: `npx tsc --noEmit` — Expected: PASS (vitest is an optional peer, resolved in dev).
- [ ] **Step 3: Commit**

```bash
git add src/vitest.ts
git commit -m "feat: the-owl/vitest owlHeaders() auto-fills the test name"
```

---

## Task 11: The React docs app (Vite + React 19)

**Styling decision:** start with the simplest readable plain-CSS/inline layout, but structure it as small presentational components (`EndpointCard`) loading from `api.ts`, so adopting **Tailwind + shadcn/ui** later is purely additive — `npm i -D tailwindcss && npx shadcn init`, then swap the inline styles inside the components without touching data flow. No data-layer coupling to styling.

**Files:** Create `web/index.html`, `web/vite.config.ts`, `web/src/main.tsx`, `web/src/api.ts`, `web/src/App.tsx`, `web/src/components/EndpointCard.tsx`

- [ ] **Step 1: `web/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>the-owl · API docs</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: `web/vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // relative asset URLs so it works under any mount path (e.g. /docs)
  build: { outDir: "../dist/web", emptyOutDir: true },
});
```

- [ ] **Step 3: `web/src/api.ts`**

```ts
export interface Example {
  name: string;
  request: { url: string; method: string; path: string; headers: Record<string, string>; body: unknown };
  response: { status: number; headers: Record<string, string>; body: unknown };
}
export interface Endpoint { method: string; route: string; examples: Example[] }
export interface Catalog { generatedAt: string; endpoints: Endpoint[] }

export const loadCatalog = async (): Promise<Catalog> => {
  const res = await fetch("./catalog.json");
  if (!res.ok) throw new Error("catalog.json not found — run `the-owl build`");
  return res.json() as Promise<Catalog>;
};
```

- [ ] **Step 4: `web/src/components/EndpointCard.tsx`**

```tsx
import type { Endpoint } from "../api";

export const EndpointCard = ({ endpoint }: { endpoint: Endpoint }) => (
  <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 16 }}>
    <h2 style={{ fontFamily: "monospace" }}>
      <span style={{ color: "#067" }}>{endpoint.method}</span> {endpoint.route}
    </h2>
    {endpoint.examples.map((example) => (
      <details key={example.name} style={{ marginTop: 8 }}>
        <summary>
          {example.name} — <code>{example.response.status}</code>
        </summary>
        <h4>Request</h4>
        <pre>{JSON.stringify(example.request.body ?? {}, null, 2)}</pre>
        <h4>Response</h4>
        <pre>{JSON.stringify(example.response.body ?? {}, null, 2)}</pre>
      </details>
    ))}
  </section>
);
```

- [ ] **Step 5: `web/src/App.tsx`**

```tsx
import { useEffect, useState } from "react";
import { loadCatalog, type Catalog } from "./api";
import { EndpointCard } from "./components/EndpointCard";

export const App = () => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((e: unknown) => setError(String(e)));
  }, []);

  if (error) return <pre style={{ color: "crimson" }}>{error}</pre>;
  if (!catalog) return <p>Loading…</p>;

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>API docs</h1>
      <small>Generated {new Date(catalog.generatedAt).toLocaleString()}</small>
      {catalog.endpoints.map((endpoint) => (
        <EndpointCard key={`${endpoint.method} ${endpoint.route}`} endpoint={endpoint} />
      ))}
    </main>
  );
};
```

- [ ] **Step 6: `web/src/main.tsx`**

```tsx
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(<App />);
```

- [ ] **Step 7: Build the web bundle** — Run: `npm run build:web` — Expected: emits `dist/web/index.html` + hashed assets.
- [ ] **Step 8: Build the full package** — Run: `npm run build` — Expected: `dist/` has `index.*`, `vitest.*`, `bin/cli.*`, `web/`.
- [ ] **Step 9: Commit**

```bash
git add web
git commit -m "feat: Vite + React 19 docs app (static browse) reading catalog.json"
```

---

## Task 12: Migrate examples to v2 and verify end-to-end

Both examples must run on the rewritten library. They are migrated to Vitest + native `fetch`, drop `endpointOriginalPath`/`buildHeaders(t.title, …)`, and use `owlHeaders()`.

**Files (per example `01-minimal` and `02-elaborate`):** rewrite `package.json`, server, test helpers, and the functional tests; add `vitest.config.ts`.

- [ ] **Step 1: `examples/01-minimal/package.json`**

```json
{
  "name": "minimal",
  "version": "2.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "vitest run",
    "test:create-docs": "rimraf .owl docs && CREATE_DOCS=true vitest run && the-owl build"
  },
  "devDependencies": {
    "the-owl": "file:../..",
    "express": "^5",
    "rimraf": "^6",
    "vitest": "^4"
  }
}
```

- [ ] **Step 2: `examples/01-minimal/src/server.ts`**

```ts
import express, { type Express } from "express";
import theOwl from "the-owl";

export const createApp = (): Express => {
  const app = express();
  theOwl.connect(app); // capture middleware
  app.use(express.json());

  app.get("/health", (_req, res) => res.status(200).send("OK"));
  app.get("/users", (_req, res) => res.status(200).json([{ id: 1, name: "John" }, { id: 2, name: "Paul" }]));
  return app;
};
```

- [ ] **Step 3: `examples/01-minimal/test/helpers.ts`**

```ts
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/server";

export const startServer = async (): Promise<{ server: Server; base: string }> => {
  const server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address() as AddressInfo;
  return { server, base: `http://localhost:${port}` };
};

export const stopServer = (server: Server): Promise<void> =>
  new Promise((resolve) => server.close(() => resolve()));
```

- [ ] **Step 4: `examples/01-minimal/test/health.test.ts`**

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import theOwl from "the-owl";
import { owlHeaders } from "the-owl/vitest";
import { startServer, stopServer } from "./helpers";

let server: Server;
let base: string;

beforeAll(async () => {
  ({ server, base } = await startServer());
});
afterAll(async () => {
  theOwl.save(); // drain this file's Examples to .owl/
  await stopServer(server);
});

describe("[get] /health", () => {
  it("(200) returns the application status", async () => {
    const res = await fetch(`${base}/health`, {
      headers: { "your-custom-header": "appears in the docs; the-owl's header is filtered out", ...owlHeaders() },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
  });
});
```

- [ ] **Step 5: `examples/01-minimal/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["test/**/*.test.ts"], fileParallelism: false, environment: "node" },
});
```

(`fileParallelism: false` mirrors the v1 `--serial` sandboxing so DB-style side effects between files don't interfere.)

- [ ] **Step 6: Rewrite `examples/02-elaborate` the same way**

Apply Steps 1–5 to `02-elaborate`, keeping its `/users/:id` controller. The functional test becomes (note: **no `endpointOriginalPath`** — the route is auto-resolved):

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import theOwl from "the-owl";
import { owlHeaders } from "the-owl/vitest";
import { startServer, stopServer } from "./helpers";

let server: Server;
let base: string;
beforeAll(async () => { ({ server, base } = await startServer()); });
afterAll(async () => { theOwl.save(); await stopServer(server); });

describe("[get] /users/:id", () => {
  it("(200) returns the given user if it exists", async () => {
    const res = await fetch(`${base}/users/1`, { headers: owlHeaders() });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1, name: "John" });
  });

  it("(404) returns an error if the given user doesn't exist", async () => {
    const res = await fetch(`${base}/users/999`, { headers: owlHeaders() });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 7: Verify end-to-end (the real acceptance test)**

```bash
# from the-owl/
npm run build
cd examples/01-minimal && npm install && npm run test:create-docs
```

Expected:
- `examples/01-minimal/.owl/get-health.json` and `get-users.json` exist after the run.
- `examples/01-minimal/docs/site/catalog.json` exists with both endpoints and their captured Examples.
- `examples/01-minimal/docs/site/index.html` exists (the React bundle).

Then repeat for `02-elaborate`:

```bash
cd ../02-elaborate && npm install && npm run test:create-docs
```

Expected: `docs/site/catalog.json` contains `GET /users/:id` with the `(200)` and `(404)` Examples.

- [ ] **Step 8: Smoke-test the live docs route (02-elaborate)**

Add to `02-elaborate/src/server.ts`: `if (process.env.OWL_DOCS) app.use("/docs", theOwl.docs());`
Run a throwaway script that starts the app and fetches `/docs/catalog.json`; Expected: 200 with the catalog JSON.

- [ ] **Step 9: Commit**

```bash
git add examples
git commit -m "test: migrate both examples to v2 (Vitest, owlHeaders, auto-routes) + verify e2e"
```

---

## Task 13: Documentation + delete legacy

**Files:** Modify `documentation/01-api.md`, `documentation/02-process-variables.md`, `README.md`; Delete legacy `src`.

- [ ] **Step 1: Rewrite `documentation/01-api.md`** — document `connect(app)`, `buildHeaders(testName)`, `the-owl/vitest`'s `owlHeaders()`, `save()` (with `createDocs()` as deprecated alias), the `the-owl build` command, and `docs(options)`. Remove all `x-req-original-path`, redux, and "single test file" language. Explain the flow: capture → `.owl/*.json` → `the-owl build` → `docs/site/`.
- [ ] **Step 2: Rewrite `documentation/02-process-variables.md`** — keep `CREATE_DOCS` (now gates `save()`); remove `LOG_REDUX` and `LOG_MESSAGES` (no longer used).
- [ ] **Step 3: Update root `README.md`** — new pitch (interactive HTML), quickstart with Vitest + `owlHeaders()`, and the two delivery modes.
- [ ] **Step 4: Delete legacy source**

```bash
git rm -r src/redux src/lib src/the-owl.js src/__helpers__
```

- [ ] **Step 5: Full verification**

```bash
npm run typecheck && npm test && npm run build
```

Expected: typecheck clean; all `test/*.test.ts` pass; `dist/` complete.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "docs: rewrite docs for v2; remove redux/markdown/legacy pipeline"
```

---

## Self-Review

**Spec coverage:**
- Feature branch + per-step commits → Branch created; every task ends in a commit on `feat/v2-collection-and-emit`.
- Latest stable versions → Task 1 (Node 24, install `@latest`, Express 5, React 19, Vitest 4, Vite 7).
- Drop markdown renderer → removed entirely; Task 7 emits only `catalog.json` + bundle; legacy `write-markdown` deleted in Task 13.
- Vitest test-name access → Task 10 (`expect.getState().currentTestName`), used in examples (Task 12).
- Styling room for Tailwind/shadcn → Task 11 styling decision + component split.
- Remove preparation steps → Tasks 5 (auto-route), 10 (`owlHeaders()`), 12 (examples drop `endpointOriginalPath`/`buildHeaders(t.title, …)`).
- Examples use the new library → Task 12 (both, with an end-to-end acceptance run).
- Candidate 1 (deep Collector) → Task 4. Candidate 2 (model + render adapters) → Tasks 2, 7, 9, 11. Candidate 4 (no single-endpoint assumption, merged Catalog) → Tasks 4, 6, 7.

**Placeholder scan:** every code step ships complete code; Task 12 Step 6 references the elaborate controller (exists in repo) and repeats the full test. No TBD/TODO.

**Type consistency:** `createCollector`/`Collector.record`/`drain`, `RecordInput`, `Example`/`Endpoint`/`Catalog` (`response` required), `makeCaptureMiddleware`, `drainToDisk`/`readCatalog`/`endpointSlug`, `runBuild`/`BuildOptions`, `emitHtml`, `docs`/`DocsOptions`, `owlHeaders`, `buildHeaders`/`save`/`createDocs` are used identically across tasks.

**Deliberately deferred:** live "try it out" in the HTML app (the model already carries real request Examples + the docs route is same-origin, so it's additive later); OpenAPI Renderer (a second adapter over the same Catalog when wanted).
