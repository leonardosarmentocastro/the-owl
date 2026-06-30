# Copy as cURL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every API-docs Example a copy-pasteable `curl` command, available in both the static and live docs modes.

**Architecture:** A single pure formatter `formatCurl(form, baseUrl)` is the source of truth, fed through the existing `prefillFromExample` seam so both modes share one code path. A new `<CurlBlock>` React component renders the command with a Copy button. The base URL is `window.location.origin` in live mode, or a build-time `THE_OWL_DOCS_HOST` baked into `catalog.baseUrl` (falling back to `http://localhost:3000`) in static mode.

**Tech Stack:** TypeScript, React 19, Vitest 4 (node env globally; component tests opt into jsdom per-file), `@testing-library/react`, Express 5 (library side), tsup build.

## Global Constraints

- **File purity (AGENTS.md):** behavior files export functions only; types live in `types.ts`, constants in `constants.ts`; tests are co-located in `__tests__`.
- **Test env:** Vitest runs node env globally; any component (`.tsx`) test must start with `// @vitest-environment jsdom`.
- **Naming:** owl-related env vars/marks use the `THE_OWL_` prefix. The build-time host var is exactly `THE_OWL_DOCS_HOST`.
- **Placeholder format:** empty redacted/required values render as exactly `<CHANGE_ME:<name>>` (e.g. `<CHANGE_ME:authorization>`, `<CHANGE_ME:id>`). The `<name>` is the field name verbatim.
- **Scope:** cURL only — do NOT add `wget` or any other client. Do NOT walk the request body to placeholder redacted body fields (body redactions stay `""`, matching the editable form).
- **cURL block appears in BOTH modes** (static read-only block and live form).
- After each task: `npm test` stays green and `npm run typecheck` is clean.

---

### Task 1: `formatCurl` pure formatter

**Files:**
- Create: `web/src/request/curl.ts`
- Test: `web/src/request/__tests__/curl.test.ts`

**Interfaces:**
- Consumes: `RequestFormState`, `KeyValue` from `web/src/request/types.ts`.
- Produces: `formatCurl(form: RequestFormState, baseUrl: string): string`.

- [ ] **Step 1: Write the failing test**

Create `web/src/request/__tests__/curl.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatCurl } from "../curl";
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

const HOST = "http://localhost:3000";

describe("formatCurl", () => {
  it("renders a GET with the method and absolute URL, no body", () => {
    expect(formatCurl(base(), HOST)).toBe("curl -X GET 'http://localhost:3000/users/2'");
  });

  it("encodes real path param values", () => {
    expect(formatCurl(base({ pathParams: [{ name: "id", value: "a b" }] }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/a%20b'"
    );
  });

  it("uses a CHANGE_ME placeholder for an empty path param", () => {
    expect(formatCurl(base({ pathParams: [{ name: "id", value: "" }] }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/<CHANGE_ME:id>'"
    );
  });

  it("appends named query rows and encodes real values", () => {
    expect(formatCurl(base({ query: [{ name: "q", value: "a b" }, { name: "", value: "skip" }] }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/2?q=a%20b'"
    );
  });

  it("placeholders a redacted (needsInput) query value", () => {
    expect(formatCurl(base({ query: [{ name: "token", value: "", needsInput: true }] }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/2?token=<CHANGE_ME:token>'"
    );
  });

  it("emits one -H per named header", () => {
    expect(formatCurl(base({ headers: [{ name: "accept", value: "application/json" }] }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/2' \\\n  -H 'accept: application/json'"
    );
  });

  it("placeholders a redacted (needsInput) header value", () => {
    expect(formatCurl(base({ headers: [{ name: "authorization", value: "", needsInput: true }] }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/2' \\\n  -H 'authorization: <CHANGE_ME:authorization>'"
    );
  });

  it("includes -d with the body for non-bodyless methods", () => {
    expect(
      formatCurl(base({ method: "POST", route: "/users", pathParams: [], body: '{"name":"John"}' }), HOST)
    ).toBe("curl -X POST 'http://localhost:3000/users' \\\n  -d '{\"name\":\"John\"}'");
  });

  it("omits the body for GET even when present", () => {
    expect(formatCurl(base({ body: '{"x":1}' }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/2'"
    );
  });

  it("shell-escapes single quotes in the body", () => {
    expect(formatCurl(base({ method: "POST", route: "/x", pathParams: [], body: "a'b" }), HOST)).toBe(
      "curl -X POST 'http://localhost:3000/x' \\\n  -d 'a'\\''b'"
    );
  });

  it("joins without doubling the slash when baseUrl has a trailing slash", () => {
    expect(formatCurl(base(), "http://localhost:3000/")).toBe(
      "curl -X GET 'http://localhost:3000/users/2'"
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/request/__tests__/curl.test.ts`
Expected: FAIL — cannot resolve `../curl` / `formatCurl is not a function`.

- [ ] **Step 3: Write minimal implementation**

Create `web/src/request/curl.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run web/src/request/__tests__/curl.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Typecheck and commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add web/src/request/curl.ts web/src/request/__tests__/curl.test.ts
git commit -m "feat(web): add formatCurl request formatter"
```

---

### Task 2: Base-URL plumbing (`catalog.baseUrl` + `THE_OWL_DOCS_HOST`)

**Files:**
- Modify: `src/types.ts` (add `baseUrl?` to `Catalog`)
- Modify: `src/render/build.ts` (read env var in `runBuild`)
- Modify: `web/src/api.ts` (mirror `baseUrl?` on web `Catalog`; add `DEFAULT_DOCS_HOST`)
- Test: `src/render/__tests__/build.test.ts` (extend)

**Interfaces:**
- Consumes: existing `runBuild(BuildOptions)`, `readCatalog`, `emitHtml`.
- Produces: `Catalog.baseUrl?: string` (library + web); `DEFAULT_DOCS_HOST` exported from `web/src/api.ts`.

- [ ] **Step 1: Write the failing tests**

Append to the `describe("build", …)` block in `src/render/__tests__/build.test.ts` (it already imports `mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync`, `tmpdir`, `join`, `createCollector`, `drainToDisk`, `runBuild`). Add a small local helper above the new tests and the two cases:

```ts
  const seedRoot = () => {
    const r = mkdtempSync(join(tmpdir(), "owl-root-"));
    const owlDir = join(r, ".owl");
    const bundle = join(r, "bundle");
    mkdirSync(bundle, { recursive: true });
    writeFileSync(join(bundle, "index.html"), "<html></html>");
    const c = createCollector();
    c.record({
      testName: "(200) ok", method: "GET", route: "/users/:id",
      request: { url: "u", method: "GET", path: "/users/1", query: {}, headers: {}, body: null },
      response: { status: 200, headers: {}, body: { id: 1 } },
    });
    drainToDisk(c, owlDir);
    return { r, owlDir, bundle };
  };

  it("bakes THE_OWL_DOCS_HOST into catalog.baseUrl when set", () => {
    const seeded = seedRoot();
    root = seeded.r;
    process.env.THE_OWL_DOCS_HOST = "https://api.example.com";
    try {
      runBuild({ owlDir: seeded.owlDir, outDir: join(root, "docs"), webBundleDir: seeded.bundle });
    } finally {
      delete process.env.THE_OWL_DOCS_HOST;
    }
    const catalog = JSON.parse(readFileSync(join(root, "docs", "site", "catalog.json"), "utf8"));
    expect(catalog.baseUrl).toBe("https://api.example.com");
  });

  it("omits catalog.baseUrl when THE_OWL_DOCS_HOST is unset", () => {
    delete process.env.THE_OWL_DOCS_HOST;
    const seeded = seedRoot();
    root = seeded.r;
    runBuild({ owlDir: seeded.owlDir, outDir: join(root, "docs"), webBundleDir: seeded.bundle });
    const catalog = JSON.parse(readFileSync(join(root, "docs", "site", "catalog.json"), "utf8"));
    expect(catalog.baseUrl).toBeUndefined();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/render/__tests__/build.test.ts`
Expected: the "bakes …" test FAILS (`catalog.baseUrl` is `undefined`); the "omits …" test passes incidentally.

- [ ] **Step 3: Add `baseUrl` to the library `Catalog` type**

In `src/types.ts`, change the `Catalog` interface:

```ts
export interface Catalog {
  generatedAt: string;
  endpoints: Endpoint[];
  /** Base URL baked at build time from THE_OWL_DOCS_HOST; used by the static
   * docs to render runnable curl commands. Absent when the env var is unset. */
  baseUrl?: string;
}
```

- [ ] **Step 4: Read the env var in `runBuild`**

In `src/render/build.ts`, update `runBuild`:

```ts
export const runBuild = ({ owlDir, outDir, webBundleDir }: BuildOptions): void => {
  const catalog = readCatalog(owlDir);
  if (process.env.THE_OWL_DOCS_HOST) catalog.baseUrl = process.env.THE_OWL_DOCS_HOST;
  emitHtml(catalog, outDir, webBundleDir);
};
```

- [ ] **Step 5: Mirror on the web `Catalog` + add the default host**

In `web/src/api.ts`, add `baseUrl?` to the `Catalog` interface and export the default:

```ts
export interface Catalog { generatedAt: string; endpoints: Endpoint[]; baseUrl?: string }

/** Fallback base URL for static-mode curl commands when THE_OWL_DOCS_HOST was
 * not set at build time. */
export const DEFAULT_DOCS_HOST = "http://localhost:3000";
```

- [ ] **Step 6: Run tests + typecheck**

Run: `npx vitest run src/render/__tests__/build.test.ts && npm run typecheck`
Expected: all build tests PASS; no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/render/build.ts web/src/api.ts src/render/__tests__/build.test.ts
git commit -m "feat: bake THE_OWL_DOCS_HOST into catalog.baseUrl"
```

---

### Task 3: `CurlBlock` component

**Files:**
- Create: `web/src/components/CurlBlock.tsx`
- Test: `web/src/components/__tests__/CurlBlock.test.tsx`

**Interfaces:**
- Consumes: `formatCurl` (Task 1), `RequestFormState`, the existing `CodeBlock` component.
- Produces: `CurlBlock({ form: RequestFormState; baseUrl: string })`.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/__tests__/CurlBlock.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CurlBlock } from "../CurlBlock";
import type { RequestFormState } from "../../request/types";

const form: RequestFormState = {
  method: "GET",
  route: "/users/:id",
  pathParams: [{ name: "id", value: "2" }],
  query: [],
  headers: [],
  body: "",
};

afterEach(cleanup);

describe("CurlBlock", () => {
  it("renders the curl command for the form", () => {
    render(<CurlBlock form={form} baseUrl="http://localhost:3000" />);
    expect(screen.getByText(/curl -X GET 'http:\/\/localhost:3000\/users\/2'/)).toBeTruthy();
  });

  it("copies the command to the clipboard when Copy is clicked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<CurlBlock form={form} baseUrl="http://localhost:3000" />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    expect(writeText).toHaveBeenCalledWith("curl -X GET 'http://localhost:3000/users/2'");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/components/__tests__/CurlBlock.test.tsx`
Expected: FAIL — cannot resolve `../CurlBlock`.

- [ ] **Step 3: Write minimal implementation**

Create `web/src/components/CurlBlock.tsx`:

```tsx
import { useState } from "react";
import type { RequestFormState } from "../request/types";
import { formatCurl } from "../request/curl";
import { CodeBlock } from "./CodeBlock";

/** Shows a copy-pasteable curl command for a request form, in both docs modes. */
export const CurlBlock = ({ form, baseUrl }: { form: RequestFormState; baseUrl: string }) => {
  const [copied, setCopied] = useState(false);
  const command = formatCurl(form, baseUrl);

  const copy = () => {
    navigator.clipboard.writeText(command).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", opacity: 0.7 }}>cURL</span>
        <button type="button" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
      </div>
      <CodeBlock>{command}</CodeBlock>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run web/src/components/__tests__/CurlBlock.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck and commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add web/src/components/CurlBlock.tsx web/src/components/__tests__/CurlBlock.test.tsx
git commit -m "feat(web): add CurlBlock component"
```

---

### Task 4: Wire `CurlBlock` into the tree (both modes)

**Files:**
- Modify: `web/src/App.tsx` (resolve `baseUrl`, pass to `EndpointCard`)
- Modify: `web/src/components/EndpointCard.tsx` (accept + forward `baseUrl`)
- Modify: `web/src/components/ExampleAccordion.tsx` (accept `baseUrl`, render `CurlBlock` in both branches)
- Test: `web/src/components/__tests__/ExampleAccordion.test.tsx` (extend; fix existing `render` calls)

**Interfaces:**
- Consumes: `CurlBlock` (Task 3), `DEFAULT_DOCS_HOST` (Task 2), `isLive()`, `prefillFromExample`.
- Produces: `EndpointCard` and `ExampleAccordion` both gain a required `baseUrl: string` prop.

- [ ] **Step 1: Write the failing test**

In `web/src/components/__tests__/ExampleAccordion.test.tsx`:

First, every existing `render(<ExampleAccordion … />)` call must pass the new required prop `baseUrl="http://localhost:3000"`. Update each existing render call accordingly.

Then add these two cases (the static one inside the top-level `describe`, the live one inside the existing `describe("live mode", …)` block which sets `window.__THE_OWL_LIVE__ = true`):

```ts
  it("shows a curl command in the static read-only view", () => {
    render(<ExampleAccordion method="GET" route="/users/:id" example={example} baseUrl="http://localhost:3000" />);
    fireEvent.click(screen.getByText(/returns the user/));
    expect(screen.getByText(/curl -X GET 'http:\/\/localhost:3000\/users\/2'/)).toBeTruthy();
  });
```

```ts
    it("shows a curl command alongside the live form", () => {
      render(<ExampleAccordion method="GET" route="/users/:id" example={example} baseUrl="http://localhost:3000" />);
      fireEvent.click(screen.getByText(/returns the user/));
      expect(screen.getByRole("button", { name: /try it out/i })).toBeTruthy();
      expect(screen.getByText(/curl -X GET/)).toBeTruthy();
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/components/__tests__/ExampleAccordion.test.tsx`
Expected: FAIL — type error / missing `baseUrl` prop and no curl text rendered.

- [ ] **Step 3: Add `baseUrl` to `ExampleAccordion` and render `CurlBlock`**

In `web/src/components/ExampleAccordion.tsx`:

Add the import:

```tsx
import { CurlBlock } from "./CurlBlock";
```

Change the component signature to accept `baseUrl`:

```tsx
export const ExampleAccordion = ({
  method, route, example, baseUrl,
}: { method: string; route: string; example: Example; baseUrl: string }) => {
```

Render `CurlBlock` in both branches of the expanded view. The live branch becomes:

```tsx
          {live && form ? (
            <>
              <RequestForm form={form} onChange={setForm} onFire={fire} firing={firing} />
              {result && <ResponsePanel result={result} />}
              <CurlBlock form={form} baseUrl={baseUrl} />
            </>
          ) : (
            <>
              <h4>Request</h4>
              <CodeBlock>{JSON.stringify(example.request.body ?? {}, null, 2)}</CodeBlock>
              <h4>Response</h4>
              <CodeBlock>{JSON.stringify(example.response.body ?? {}, null, 2)}</CodeBlock>
              <CurlBlock form={prefillFromExample(example, route)} baseUrl={baseUrl} />
            </>
          )}
```

(`prefillFromExample` is already imported in this file.)

- [ ] **Step 4: Thread `baseUrl` through `EndpointCard`**

In `web/src/components/EndpointCard.tsx`:

```tsx
import type { Endpoint } from "../api";
import { ExampleAccordion } from "./ExampleAccordion";

export const EndpointCard = ({ endpoint, baseUrl }: { endpoint: Endpoint; baseUrl: string }) => (
  <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 16 }}>
    <h2 style={{ fontFamily: "monospace" }}>
      <span style={{ color: "#067" }}>{endpoint.method}</span> {endpoint.route}
    </h2>
    {endpoint.examples.map((example) => (
      <ExampleAccordion
        key={example.name}
        method={endpoint.method}
        route={endpoint.route}
        example={example}
        baseUrl={baseUrl}
      />
    ))}
  </section>
);
```

- [ ] **Step 5: Resolve `baseUrl` in `App`**

In `web/src/App.tsx`, add imports and resolve the base URL once, then pass it down:

```tsx
import { useEffect, useState } from "react";
import { loadCatalog, type Catalog, DEFAULT_DOCS_HOST } from "./api";
import { isLive } from "./live";
import { EndpointCard } from "./components/EndpointCard";
```

Inside the component, after the `if (!catalog) return …` guard:

```tsx
  const baseUrl = isLive() ? window.location.origin : (catalog.baseUrl ?? DEFAULT_DOCS_HOST);
```

And pass it to each card:

```tsx
      {catalog.endpoints.map((endpoint) => (
        <EndpointCard key={`${endpoint.method} ${endpoint.route}`} endpoint={endpoint} baseUrl={baseUrl} />
      ))}
```

- [ ] **Step 6: Run tests + typecheck**

Run: `npx vitest run web/src/components/__tests__/ExampleAccordion.test.tsx && npm run typecheck`
Expected: all ExampleAccordion tests PASS; no type errors.

- [ ] **Step 7: Full suite + commit**

Run: `npm test`
Expected: entire suite green.

```bash
git add web/src/App.tsx web/src/components/EndpointCard.tsx web/src/components/ExampleAccordion.tsx web/src/components/__tests__/ExampleAccordion.test.tsx
git commit -m "feat(web): render CurlBlock in both docs modes"
```

---

### Task 5: Documentation

**Files:**
- Modify: `README.md` (root — "Two delivery modes")
- Modify: `examples/02-elaborate/README.md`
- Modify: `examples/02-elaborate/package.json` (show `THE_OWL_DOCS_HOST` in the create-docs flow)

**Interfaces:** none (docs only).

- [ ] **Step 1: Update the root README**

In `README.md`, within the "Two delivery modes" section, update the **Static** bullet and add a note so both modes mention the curl command. Replace the Static bullet:

```markdown
- **Static** — open or host the generated `docs/site/` directory directly
  (`docs/site/index.html` + assets). Read-only, but every Example offers a
  **Copy as cURL** command you can run against your own API. Set the base URL
  baked into those commands with the `THE_OWL_DOCS_HOST` env var at build time
  (e.g. `THE_OWL_DOCS_HOST=https://api.example.com the-owl build`); it defaults
  to `http://localhost:3000`.
```

Then, at the end of the existing Live-route paragraph (after "…it stays read-only."), append:

```markdown

  Both modes also expose a **Copy as cURL** button on each Example. In live mode
  the command reflects your current edits and targets the page's own origin; in
  static mode it uses the `THE_OWL_DOCS_HOST` base URL. Redacted or missing
  values appear as `<CHANGE_ME:name>` so it's obvious what to fill in before
  running the command.
```

- [ ] **Step 2: Update the example README**

In `examples/02-elaborate/README.md`, within the "Trying endpoints live" section, append a paragraph after the existing content:

```markdown

Every Example also has a **Copy as cURL** button — including in the static
`docs/site` build, which has no server to fire against. The command's base URL
comes from `THE_OWL_DOCS_HOST` (set it when generating: `THE_OWL_DOCS_HOST=https://api.example.com pnpm test:create-docs`),
defaulting to `http://localhost:3000`. Any redacted or empty value shows as
`<CHANGE_ME:name>` to flag what you must replace before running it.
```

- [ ] **Step 3: Show the env var in the example's script**

In `examples/02-elaborate/package.json`, add a sibling script that documents the host (keep the existing `test:create-docs` untouched so default behavior is unchanged):

```json
    "test:create-docs": "rimraf .owl docs && CREATE_DOCS=true vitest run && the-owl build",
    "test:create-docs:hosted": "rimraf .owl docs && CREATE_DOCS=true vitest run && THE_OWL_DOCS_HOST=https://api.example.com the-owl build",
```

- [ ] **Step 4: Verify nothing broke + commit**

Run: `npm test && npm run typecheck`
Expected: suite green, no type errors (docs-only change, but confirm).

```bash
git add README.md examples/02-elaborate/README.md examples/02-elaborate/package.json
git commit -m "docs: document Copy as cURL and THE_OWL_DOCS_HOST"
```

---

## Self-Review

**Spec coverage:**
- `formatCurl` pure formatter + placeholder rules + shell escaping → Task 1. ✓
- `catalog.baseUrl` field (library + web) + `THE_OWL_DOCS_HOST` read in `runBuild` + `DEFAULT_DOCS_HOST` → Task 2. ✓
- `CurlBlock` component with Copy button → Task 3. ✓
- Base-URL resolution (`window.location.origin` live / `catalog.baseUrl ?? DEFAULT_DOCS_HOST` static) threaded App→EndpointCard→ExampleAccordion; rendered in BOTH branches → Task 4. ✓
- Docs (root README, example README, example package.json) → Task 5. ✓
- Out-of-scope honored: no wget, no body-walking. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code.

**Type consistency:** `formatCurl(form, baseUrl)` signature identical across Tasks 1, 3, 4. `baseUrl: string` prop name consistent across `EndpointCard`/`ExampleAccordion`. `Catalog.baseUrl?: string` matches between `src/types.ts` and `web/src/api.ts`. `DEFAULT_DOCS_HOST` defined in `web/src/api.ts` (Task 2), consumed in `App.tsx` (Task 4). Placeholder format `<CHANGE_ME:name>` consistent between Task 1 implementation and Task 1/3/4 test expectations.
