# API docs left navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a left navigation sidebar to the generated API docs (`web/`) that mirrors the endpoint → example tree and deep-links to (and expands) any single example via the URL hash.

**Architecture:** The URL hash is the single source of truth for "which example is active." A `useHash()` hook in `App` turns the hash into React state; the `Sidebar` and each `ExampleAccordion` key off it independently — no lifted open-state store, no router. Example open/close stays Swagger-style independent (the hash only jumps-to-and-opens its target). A `useMediaQuery()` hook swaps a sticky desktop sidebar for an off-canvas mobile drawer, keeping the codebase's inline-style convention (no global stylesheet).

**Tech Stack:** React 19, TypeScript, Vite, Vitest + @testing-library/react (jsdom), `slugify` (already a dependency).

## Global Constraints

- **Branch:** all work on `feat/docs-left-nav` (already created off the merged `master` `d7c116c`). Never commit to `master`.
- **`web/` is out of the four-domain layout** — this plan touches only `web/`. Do not modify `src/` (`types.ts`, the pipeline) at all.
- **Inline styles only** — the web app uses inline `style={{…}}`; do not introduce a global stylesheet. Media queries come from `useMediaQuery`, not CSS files.
- **Factories/helpers are plain exported functions**; one responsibility per file. Tests are co-located under a sibling `__tests__/` directory.
- **Slug rule (verbatim from `src/drain/slug.ts`):** slugs use `slugify(input, { lower: true, strict: true, replacement: "-" })` and collapse route separators first with `route.replace(/[/:]+/g, " ")`.
- **Test runner:** `npx vitest run <path>` for a single file; jsdom tests must start with the `// @vitest-environment jsdom` pragma (first line).
- **`window.matchMedia` and `Element.scrollIntoView` are not implemented in jsdom** — any test that mounts a component using them must stub `matchMedia`, and production code must call `scrollIntoView` via optional chaining (`?.()`).

---

### Task 1: `exampleSlug` anchor helper

**Files:**
- Create: `web/src/nav/slug.ts`
- Test: `web/src/nav/__tests__/slug.test.ts`

**Interfaces:**
- Consumes: `slugify` (npm, already installed).
- Produces: `exampleSlug(method: string, route: string, name: string): string` — the single producer of example anchor slugs, used by `Sidebar` links and `ExampleAccordion` ids.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { exampleSlug } from "../slug";

describe("exampleSlug", () => {
  it("builds a lowercase, url-safe slug from method, route and name", () => {
    expect(exampleSlug("GET", "/users/:id", "returns the user")).toBe(
      "get-users-id-returns-the-user",
    );
  });

  it("collapses route separators and punctuation into single dashes", () => {
    expect(exampleSlug("GET", "/health", "(200) returns the application status")).toBe(
      "get-health-200-returns-the-application-status",
    );
  });

  it("is deterministic for the same inputs", () => {
    const a = exampleSlug("POST", "/orders", "creates an order");
    const b = exampleSlug("POST", "/orders", "creates an order");
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/nav/__tests__/slug.test.ts`
Expected: FAIL — cannot find module `../slug`.

- [ ] **Step 3: Write minimal implementation**

```ts
import slugify from "slugify";

/**
 * The anchor identity of an Example in the docs UI: a lowercase, URL-safe slug
 * derived from its Endpoint's method + route and the Example name. It is the sole
 * producer of slugs shared by the sidebar link's `href="#…"` and the matching
 * accordion's DOM `id`, so a hash can never point at a missing target. Mirrors the
 * slugify options of `src/drain/slug.ts`.
 */
export const exampleSlug = (method: string, route: string, name: string): string =>
  slugify(`${method} ${route.replace(/[/:]+/g, " ")} ${name}`, {
    lower: true,
    strict: true,
    replacement: "-",
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run web/src/nav/__tests__/slug.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/nav/slug.ts web/src/nav/__tests__/slug.test.ts
git commit -m "feat(web): add exampleSlug anchor helper"
```

---

### Task 2: `useHash` hook

**Files:**
- Create: `web/src/nav/use-hash.ts`
- Test: `web/src/nav/__tests__/use-hash.test.ts`

**Interfaces:**
- Produces: `useHash(): string` — the current `location.hash` without the leading `#`, re-rendering on `hashchange`. Owned/called once by `App`.

- [ ] **Step 1: Write the failing test**

```ts
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useHash } from "../use-hash";

afterEach(() => { cleanup(); window.location.hash = ""; });

describe("useHash", () => {
  it("returns the current hash without the leading #", () => {
    window.location.hash = "#get-users-200";
    const { result } = renderHook(() => useHash());
    expect(result.current).toBe("get-users-200");
  });

  it("updates when a hashchange event fires", () => {
    const { result } = renderHook(() => useHash());
    act(() => {
      window.location.hash = "#changed";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(result.current).toBe("changed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/nav/__tests__/use-hash.test.ts`
Expected: FAIL — cannot find module `../use-hash`.

- [ ] **Step 3: Write minimal implementation**

```ts
import { useEffect, useState } from "react";

const currentHash = (): string => window.location.hash.replace(/^#/, "");

/** Tracks `location.hash` (without the leading `#`) as React state, the single
 *  source of truth for which docs Example is active. */
export const useHash = (): string => {
  const [hash, setHash] = useState(currentHash);
  useEffect(() => {
    const onChange = () => setHash(currentHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run web/src/nav/__tests__/use-hash.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/nav/use-hash.ts web/src/nav/__tests__/use-hash.test.ts
git commit -m "feat(web): add useHash hook"
```

---

### Task 3: `useMediaQuery` hook

**Files:**
- Create: `web/src/nav/use-media-query.ts`
- Test: `web/src/nav/__tests__/use-media-query.test.ts`

**Interfaces:**
- Produces: `useMediaQuery(query: string): boolean` — whether the media query currently matches, updating on change. Used by `App` to choose desktop vs. drawer layout.

- [ ] **Step 1: Write the failing test**

```ts
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useMediaQuery } from "../use-media-query";

const stubMatchMedia = (matches: boolean) =>
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });

afterEach(cleanup);

describe("useMediaQuery", () => {
  it("returns true when the query matches", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("returns false when the query does not match", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/nav/__tests__/use-media-query.test.ts`
Expected: FAIL — cannot find module `../use-media-query`.

- [ ] **Step 3: Write minimal implementation**

```ts
import { useEffect, useState } from "react";

/** Reactive `window.matchMedia` wrapper — lets `App` pick the desktop sidebar vs.
 *  the mobile drawer layout without a global stylesheet. */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run web/src/nav/__tests__/use-media-query.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/nav/use-media-query.ts web/src/nav/__tests__/use-media-query.test.ts
git commit -m "feat(web): add useMediaQuery hook"
```

---

### Task 4: `ExampleAccordion` reacts to the active hash

Give each accordion a stable `id` (its slug), auto-open + scroll when the active
hash matches it, and write the hash when its header is opened so links are
shareable from the main column too. Independent toggle behavior is preserved.

**Files:**
- Modify: `web/src/components/ExampleAccordion.tsx`
- Test: `web/src/components/__tests__/ExampleAccordion.test.tsx` (extend)

**Interfaces:**
- Consumes: `exampleSlug` (Task 1).
- Produces: `ExampleAccordion` now accepts an optional `activeHash?: string` prop; renders a container with `id={exampleSlug(method, route, example.name)}`. (`EndpointCard` in Task 5 passes `activeHash` through.)

- [ ] **Step 1: Write the failing test** (append inside the existing top-level `describe("ExampleAccordion", …)`, after the static-mode tests)

```ts
  it("auto-opens and carries its slug as id when activeHash matches", () => {
    const { container } = render(
      <ExampleAccordion
        method="GET"
        route="/users/:id"
        example={example}
        baseUrl="http://localhost:3000"
        activeHash="get-users-id-returns-the-user"
      />,
    );
    expect(container.querySelector("#get-users-id-returns-the-user")).toBeTruthy();
    expect(screen.getByText(/"name": "Paul"/)).toBeTruthy();
  });

  it("stays collapsed when activeHash does not match", () => {
    render(
      <ExampleAccordion
        method="GET"
        route="/users/:id"
        example={example}
        baseUrl="http://localhost:3000"
        activeHash="some-other-slug"
      />,
    );
    expect(screen.queryByText(/"name": "Paul"/)).toBeNull();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/components/__tests__/ExampleAccordion.test.tsx`
Expected: FAIL — `activeHash` not a known prop / no element with that id, and the body is not rendered (accordion stays closed).

- [ ] **Step 3: Write the implementation**

Replace the current contents of `web/src/components/ExampleAccordion.tsx` with:

```tsx
import { useEffect, useRef, useState } from "react";
import type { Example } from "../api";
import { isLive } from "../live";
import { exampleSlug } from "../nav/slug";
import { prefillFromExample } from "../request/prefill";
import { fireRequest, type LiveResult } from "../request/fire";
import type { RequestFormState } from "../request/types";
import { RequestForm } from "./RequestForm";
import { ResponsePanel } from "./ResponsePanel";
import { CodeBlock } from "./CodeBlock";
import { CurlBlock } from "./CurlBlock";

export const ExampleAccordion = ({
  method, route, example, baseUrl, activeHash,
}: { method: string; route: string; example: Example; baseUrl: string; activeHash?: string }) => {
  const slug = exampleSlug(method, route, example.name);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RequestFormState | null>(null);
  const [result, setResult] = useState<LiveResult | null>(null);
  const [firing, setFiring] = useState(false);
  const live = isLive();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeHash && activeHash === slug) {
      setOpen(true);
      ref.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [activeHash, slug]);

  const toggle = () => {
    const next = !open;
    if (next && live && !form) setForm(prefillFromExample(example, route));
    if (next) window.location.hash = slug;
    setOpen(next);
  };

  const fire = async () => {
    if (!form) return;
    setFiring(true);
    setResult(await fireRequest(form));
    setFiring(false);
  };

  const ok2xx = example.response.status >= 200 && example.response.status < 300;
  return (
    <div id={slug} ref={ref} style={{ borderTop: "1px solid #eee", scrollMarginTop: 16 }}>
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
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run the full accordion test file to verify it passes**

Run: `npx vitest run web/src/components/__tests__/ExampleAccordion.test.tsx`
Expected: PASS — the original tests plus the 2 new ones.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/ExampleAccordion.tsx web/src/components/__tests__/ExampleAccordion.test.tsx
git commit -m "feat(web): open ExampleAccordion from the active URL hash"
```

---

### Task 5: `EndpointCard` threads `activeHash`

**Files:**
- Modify: `web/src/components/EndpointCard.tsx`
- Test: `web/src/components/__tests__/EndpointCard.test.tsx` (create)

**Interfaces:**
- Consumes: `ExampleAccordion`'s `activeHash` prop (Task 4).
- Produces: `EndpointCard` now accepts `activeHash?: string` and forwards it to every `ExampleAccordion`. (`App` in Task 7 supplies it.)

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { EndpointCard } from "../EndpointCard";
import type { Endpoint } from "../../api";

const endpoint: Endpoint = {
  method: "GET",
  route: "/users/:id",
  examples: [
    {
      name: "returns the user",
      request: { url: "u", method: "GET", path: "/users/2", query: {}, headers: {}, body: null },
      response: { status: 200, headers: {}, body: { id: 2, name: "Paul" } },
    },
  ],
};

afterEach(() => { cleanup(); window.location.hash = ""; });

describe("EndpointCard", () => {
  it("forwards activeHash so a matching example opens", () => {
    render(
      <EndpointCard
        endpoint={endpoint}
        baseUrl="http://localhost:3000"
        activeHash="get-users-id-returns-the-user"
      />,
    );
    expect(screen.getByText(/"name": "Paul"/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/components/__tests__/EndpointCard.test.tsx`
Expected: FAIL — `activeHash` not forwarded, example stays collapsed (body not found).

- [ ] **Step 3: Write the implementation**

Replace `web/src/components/EndpointCard.tsx` with:

```tsx
import type { Endpoint } from "../api";
import { ExampleAccordion } from "./ExampleAccordion";

export const EndpointCard = ({ endpoint, baseUrl, activeHash }: { endpoint: Endpoint; baseUrl: string; activeHash?: string }) => (
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
        activeHash={activeHash}
      />
    ))}
  </section>
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run web/src/components/__tests__/EndpointCard.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/EndpointCard.tsx web/src/components/__tests__/EndpointCard.test.tsx
git commit -m "feat(web): thread activeHash through EndpointCard"
```

---

### Task 6: `Sidebar` navigation tree

A two-level nav: one collapsible group per endpoint (header `GET /health` + chevron,
default collapsed), each revealing its examples as `<a href="#slug">` deep links.
The link for the active example is marked `aria-current="page"`. Each link click
invokes `onNavigate` (used by the mobile drawer).

**Files:**
- Create: `web/src/components/Sidebar.tsx`
- Test: `web/src/components/__tests__/Sidebar.test.tsx`

**Interfaces:**
- Consumes: `exampleSlug` (Task 1), `Endpoint` type.
- Produces: `Sidebar({ endpoints, activeHash, onNavigate })` where `endpoints: Endpoint[]`, `activeHash: string`, `onNavigate?: () => void`. (`App` in Task 7 renders it.)

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Sidebar } from "../Sidebar";
import type { Endpoint } from "../../api";

const endpoints: Endpoint[] = [
  {
    method: "GET", route: "/health",
    examples: [{ name: "returns the application status", request: { url: "u", method: "GET", path: "/health", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: {} } }],
  },
  {
    method: "GET", route: "/users",
    examples: [{ name: "returns the list of users", request: { url: "u", method: "GET", path: "/users", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: [] } }],
  },
];

afterEach(cleanup);

describe("Sidebar", () => {
  it("renders one collapsible group per endpoint", () => {
    render(<Sidebar endpoints={endpoints} activeHash="" />);
    expect(screen.getByRole("button", { name: /GET \/health/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /GET \/users/i })).toBeTruthy();
  });

  it("hides examples until the group is expanded", () => {
    render(<Sidebar endpoints={endpoints} activeHash="" />);
    expect(screen.queryByText(/returns the list of users/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /GET \/users/i }));
    expect(screen.getByText(/returns the list of users/)).toBeTruthy();
  });

  it("links each example to its slug and fires onNavigate on click", () => {
    const onNavigate = vi.fn();
    render(<Sidebar endpoints={endpoints} activeHash="" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: /GET \/users/i }));
    const link = screen.getByRole("link", { name: /returns the list of users/ });
    expect(link.getAttribute("href")).toBe("#get-users-returns-the-list-of-users");
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalled();
  });

  it("marks the active example link with aria-current", () => {
    render(<Sidebar endpoints={endpoints} activeHash="get-users-returns-the-list-of-users" />);
    fireEvent.click(screen.getByRole("button", { name: /GET \/users/i }));
    const link = screen.getByRole("link", { name: /returns the list of users/ });
    expect(link.getAttribute("aria-current")).toBe("page");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/components/__tests__/Sidebar.test.tsx`
Expected: FAIL — cannot find module `../Sidebar`.

- [ ] **Step 3: Write the implementation**

```tsx
import { useState } from "react";
import type { Endpoint } from "../api";
import { exampleSlug } from "../nav/slug";

const SidebarGroup = ({ endpoint, activeHash, onNavigate }: {
  endpoint: Endpoint; activeHash: string; onNavigate?: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <li style={{ listStyle: "none" }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          gap: 8, padding: "7px 8px", background: "none", border: "none", cursor: "pointer",
          fontFamily: "monospace", fontSize: 13, textAlign: "left", color: "inherit",
        }}
      >
        <span><span style={{ color: "#067" }}>{endpoint.method}</span> {endpoint.route}</span>
        <span style={{ opacity: 0.5 }}>{expanded ? "▾" : "▸"}</span>
      </button>
      {expanded && (
        <ul style={{ margin: 0, padding: 0 }}>
          {endpoint.examples.map((example) => {
            const slug = exampleSlug(endpoint.method, endpoint.route, example.name);
            const active = slug === activeHash;
            return (
              <li key={example.name} style={{ listStyle: "none" }}>
                <a
                  href={`#${slug}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onNavigate?.()}
                  style={{
                    display: "block", padding: "5px 8px 5px 22px", fontSize: 13, textDecoration: "none",
                    color: active ? "#067" : "#333", background: active ? "#eef6f8" : "transparent",
                    fontWeight: active ? 600 : 400, borderRadius: 6,
                  }}
                >
                  <span style={{ fontFamily: "monospace", fontSize: 11, opacity: 0.7 }}>{example.response.status}</span>{" "}
                  {example.name}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
};

export const Sidebar = ({ endpoints, activeHash, onNavigate }: {
  endpoints: Endpoint[]; activeHash: string; onNavigate?: () => void;
}) => (
  <nav aria-label="API endpoints">
    <ul style={{ margin: 0, padding: 0 }}>
      {endpoints.map((endpoint) => (
        <SidebarGroup
          key={`${endpoint.method} ${endpoint.route}`}
          endpoint={endpoint}
          activeHash={activeHash}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  </nav>
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run web/src/components/__tests__/Sidebar.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/Sidebar.tsx web/src/components/__tests__/Sidebar.test.tsx
git commit -m "feat(web): add Sidebar navigation tree"
```

---

### Task 7: Wire the sidebar + responsive shell into `App`

Replace the single centered column with a layout shell: a sticky sidebar beside the
content on wide screens, and an off-canvas drawer behind a ☰ button on narrow
screens. `App` owns the one `useHash` subscription and threads `activeHash` into
both the sidebar and the content cards.

**Files:**
- Modify: `web/src/App.tsx`
- Test: `web/src/__tests__/App.test.tsx` (create)

**Interfaces:**
- Consumes: `Sidebar` (Task 6), `useHash` (Task 2), `useMediaQuery` (Task 3), `EndpointCard` with `activeHash` (Task 5).
- Produces: the composed docs page. No exports beyond the existing `App`.

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("../api", () => ({
  DEFAULT_DOCS_HOST: "http://localhost:3000",
  loadCatalog: vi.fn(async () => ({
    generatedAt: "2026-06-30T00:00:00.000Z",
    endpoints: [
      {
        method: "GET", route: "/users",
        examples: [{ name: "returns the list of users", request: { url: "u", method: "GET", path: "/users", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: [] } }],
      },
    ],
  })),
}));

const stubMatchMedia = (matches: boolean) =>
  Object.defineProperty(window, "matchMedia", {
    writable: true, configurable: true,
    value: (query: string) => ({
      matches, media: query, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    }),
  });

import { App } from "../App";

beforeEach(() => stubMatchMedia(false));
afterEach(() => { cleanup(); window.location.hash = ""; });

describe("App", () => {
  it("renders the content heading and the sidebar nav group", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: /API docs/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /GET \/users/i })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/__tests__/App.test.tsx`
Expected: FAIL — `App` does not render a `Sidebar`, so the `GET /users` nav button is not found.

- [ ] **Step 3: Write the implementation**

Replace `web/src/App.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { loadCatalog, type Catalog, DEFAULT_DOCS_HOST } from "./api";
import { isLive } from "./live";
import { EndpointCard } from "./components/EndpointCard";
import { Sidebar } from "./components/Sidebar";
import { useHash } from "./nav/use-hash";
import { useMediaQuery } from "./nav/use-media-query";

export const App = () => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeHash = useHash();
  const isNarrow = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((e: unknown) => setError(String(e)));
  }, []);

  if (error) return <pre style={{ color: "crimson" }}>{error}</pre>;
  if (!catalog) return <p>Loading…</p>;

  const baseUrl = isLive() ? window.location.origin : (catalog.baseUrl ?? DEFAULT_DOCS_HOST);

  const sidebar = (
    <Sidebar endpoints={catalog.endpoints} activeHash={activeHash} onNavigate={() => setDrawerOpen(false)} />
  );

  const content = (
    <main style={{ flex: 1, maxWidth: 900, padding: 24, boxSizing: "border-box" }}>
      <h1>API docs</h1>
      <small>Generated {new Date(catalog.generatedAt).toLocaleString()}</small>
      {catalog.endpoints.map((endpoint) => (
        <EndpointCard
          key={`${endpoint.method} ${endpoint.route}`}
          endpoint={endpoint}
          baseUrl={baseUrl}
          activeHash={activeHash}
        />
      ))}
    </main>
  );

  if (isNarrow) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #eee", position: "sticky", top: 0, background: "#fff", zIndex: 20 }}>
          <button onClick={() => setDrawerOpen(true)} aria-label="Open navigation" style={{ fontSize: 20, lineHeight: 1, background: "none", border: "none", cursor: "pointer" }}>☰</button>
          <strong>API docs</strong>
        </header>
        {drawerOpen && (
          <>
            <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 30 }} />
            <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 280, background: "#fff", overflowY: "auto", zIndex: 40, padding: 16, boxSizing: "border-box", boxShadow: "2px 0 8px rgba(0,0,0,0.15)" }}>
              {sidebar}
            </div>
          </>
        )}
        {content}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", fontFamily: "system-ui, sans-serif" }}>
      <aside style={{ position: "sticky", top: 0, height: "100vh", overflowY: "auto", width: 280, flexShrink: 0, borderRight: "1px solid #eee", padding: 16, boxSizing: "border-box" }}>
        {sidebar}
      </aside>
      {content}
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run web/src/__tests__/App.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Run the whole suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests PASS; `tsc --noEmit` reports no errors.

- [ ] **Step 6: Commit**

```bash
git add web/src/App.tsx web/src/__tests__/App.test.tsx
git commit -m "feat(web): render docs with a left navigation sidebar"
```

---

### Task 8: Manual verification & docs

**Files:**
- Modify: `README.md` (only if it documents the docs UI and the sidebar is worth a mention)

- [ ] **Step 1: Build the web bundle**

Run: `npm run build`
Expected: `build:lib` (tsup) and `build:web` (vite) both succeed; bundle emitted to `dist/web`.

- [ ] **Step 2: Serve an example's docs and eyeball the feature**

Use the existing example flow (`examples/` — e.g. `examples/02`, which has a `pnpm start` that serves docs live per the git history). Verify by hand:
  - Sidebar lists every endpoint; chevron expands/collapses each group.
  - Clicking an example link scrolls to it, expands it, and updates the URL hash.
  - Reloading a URL with a hash opens that example on load.
  - Several examples can stay open at once (Swagger-style independence).
  - Narrowing the window below 768px collapses the sidebar behind ☰; opening the drawer and tapping a link navigates and closes the drawer.

- [ ] **Step 3: Update README if it covers the docs UI**

If `README.md` describes the generated docs page, add a sentence about the left navigation + shareable example deep links. If it does not, skip this step (do not invent a new section). Keep wording consistent with the existing `THE_OWL_` / docs phrasing.

- [ ] **Step 4: Commit any doc change**

```bash
git add README.md
git commit -m "docs: mention the API docs left navigation"
```

(Skip the commit if Step 3 made no change.)

---

## Self-Review

**Spec coverage:**
- Left sidebar listing endpoints as collapsible groups with chevron → Task 6.
- Expanding a group reveals examples → Task 6.
- Clicking an example deep-links (hash), scrolls, expands → Tasks 1, 2, 4, 6.
- Shareable deep links / reload-to-open → Task 2 (`useHash` initial value) + Task 4 (open-on-match effect).
- Click-only sidebar highlight → Task 6 (`aria-current` derived from `activeHash`).
- Swagger-style independent open-state → Task 4 (local `open` per accordion; hash only opens its target).
- Responsive drawer → Tasks 3, 7.
- Non-goals (no scrollspy, no router, no slug de-dup) respected — nothing in the plan adds them.

**Placeholder scan:** No TBD/TODO; every code step shows complete code; Task 8's README step is conditional with an explicit skip rule, not a vague "update docs."

**Type consistency:** `exampleSlug(method, route, name)` signature is identical across Tasks 1, 4, 6. `activeHash?: string` is the prop name in Tasks 4, 5, 7; `Sidebar({ endpoints, activeHash, onNavigate })` matches between Tasks 6 and 7. `useHash(): string` and `useMediaQuery(query): boolean` signatures match their consumers in Task 7. The `Endpoint`/`Example` shapes used in test fixtures match `web/src/api.ts`.
