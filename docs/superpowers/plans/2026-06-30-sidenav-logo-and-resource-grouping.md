# Sidenav Logo + Resource Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the docs site a professional finish — brand the navigation with the `the-owl` logo, polish the mobile chrome, and group sidebar endpoints by resource.

**Architecture:** A new pure function (`web/src/nav/group-endpoints.ts`) derives resource groups from the flat `Endpoint[]` by stripping the path prefix common to all routes. The sidebar renders those groups via a vocabulary-aligned component split (resource-level `SidebarGroup` over endpoint-level `SidebarEndpoint`). The logo lives in the shared `Sidebar`, so it appears in both the desktop aside and the mobile drawer; `App.tsx` moves the generated-date line into the mobile header.

**Tech Stack:** React 19 + TypeScript, Vite, Tailwind v4 + shadcn/ui, Vitest + Testing Library.

## Global Constraints

- **Branch:** all work on `feat/sidenav-logo-resource-grouping` (already checked out). Never commit to `master`.
- **One component per file** (AGENTS.md). Foldered components keep tests in their own `__tests__/`. Import entries explicitly, no barrels.
- **GitHub URL (verbatim):** `https://github.com/leonardosarmentocastro/the-owl`. Logo link opens with `target="_blank" rel="noopener noreferrer"`.
- **CONTEXT.md vocabulary:** the render-time grouping of Endpoints is a **Group**. Endpoint = method+route.
- **Run a single test file:** `npx vitest run <path>`. Full suite: `npm test`. Typecheck: `npm run typecheck`.
- **Title-casing is minimal:** uppercase the first character only (`users → Users`).
- The docs app is **light-only** — use the light lockup (`assets/the-owl-lockup-light.svg`).

---

### Task 1: `groupEndpoints` — resource grouping function

**Files:**
- Create: `web/src/nav/group-endpoints.ts`
- Test: `web/src/nav/__tests__/group-endpoints.test.ts`

**Interfaces:**
- Consumes: `Endpoint` from `web/src/api.ts` (`{ method: string; route: string; examples: Example[] }`).
- Produces: `interface ResourceGroup { name: string; endpoints: Endpoint[] }` and `groupEndpoints(endpoints: Endpoint[]): ResourceGroup[]`.

- [ ] **Step 1: Write the failing test**

Create `web/src/nav/__tests__/group-endpoints.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { groupEndpoints } from "../group-endpoints";
import type { Endpoint } from "../../api";

const ep = (method: string, route: string): Endpoint => ({
  method, route,
  examples: [{ name: "x", request: { url: "u", method, path: route, query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: {} } }],
});

const names = (eps: Endpoint[]) => groupEndpoints(eps).map((g) => g.name);

describe("groupEndpoints", () => {
  it("groups by first segment when routes share no prefix", () => {
    const groups = groupEndpoints([ep("GET", "/users/:id"), ep("GET", "/users/:id/addresses"), ep("GET", "/health")]);
    expect(groups.map((g) => g.name)).toEqual(["Users", "Health"]);
    expect(groups[0].endpoints.map((e) => e.route)).toEqual(["/users/:id", "/users/:id/addresses"]);
  });

  it("strips a prefix shared by every route", () => {
    expect(names([ep("GET", "/api/users/:id"), ep("GET", "/api/users/:id/addresses"), ep("GET", "/api/health")]))
      .toEqual(["Users", "Health"]);
  });

  it("groups multi-version APIs by version (documented behavior)", () => {
    expect(names([ep("GET", "/api/v1/users"), ep("GET", "/api/v1/orders"), ep("GET", "/api/v2/users"), ep("GET", "/api/v2/orders")]))
      .toEqual(["V1", "V2"]);
  });

  it("keeps the last segment for a single endpoint", () => {
    expect(names([ep("GET", "/api/health")])).toEqual(["Health"]);
  });

  it("labels the root route", () => {
    expect(names([ep("GET", "/")])).toEqual(["Root"]);
  });

  it("preserves catalog order of groups and endpoints", () => {
    expect(names([ep("GET", "/health"), ep("GET", "/users/:id")])).toEqual(["Health", "Users"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/nav/__tests__/group-endpoints.test.ts`
Expected: FAIL — cannot resolve `../group-endpoints`.

- [ ] **Step 3: Write minimal implementation**

Create `web/src/nav/group-endpoints.ts`:

```ts
import type { Endpoint } from "../api";

/** A render-time grouping of Endpoints that share a resource. */
export interface ResourceGroup {
  name: string;
  endpoints: Endpoint[];
}

const ROOT_GROUP = "Root";

const segments = (route: string): string[] => route.split("/").filter((s) => s.length > 0);

const titleCase = (s: string): string => (s.length === 0 ? s : s[0].toUpperCase() + s.slice(1));

/**
 * The number of leading path segments shared by EVERY route, capped so each
 * route keeps at least its last segment. A segment common to all routes cannot
 * distinguish one resource from another, so it is stripped before grouping.
 */
const sharedPrefixLength = (routes: string[][]): number => {
  if (routes.length === 0) return 0;
  const cap = Math.min(...routes.map((r) => Math.max(r.length - 1, 0)));
  let i = 0;
  for (; i < cap; i++) {
    const seg = routes[0][i];
    if (!routes.every((r) => r[i] === seg)) break;
  }
  return i;
};

/**
 * Group Endpoints by resource for the sidebar. The resource is the first path
 * segment that DISTINGUISHES routes: the prefix common to all routes is stripped
 * first (so `/api/users` and `/api/health` group as Users / Health, not all
 * under "Api"), then endpoints are grouped by their first remaining segment,
 * title-cased. Group and within-group order follow first appearance.
 *
 * Documented consequence: when a catalog mixes API versions
 * (`/api/v1/...`, `/api/v2/...`), the only shared segment is `api`, so the first
 * distinguishing segment is the version — endpoints group by version (V1, V2),
 * not by resource. This is intentional: two versions are separate surfaces.
 */
export const groupEndpoints = (endpoints: Endpoint[]): ResourceGroup[] => {
  const routes = endpoints.map((e) => segments(e.route));
  const prefix = sharedPrefixLength(routes);
  const order: string[] = [];
  const byName = new Map<string, Endpoint[]>();
  endpoints.forEach((endpoint, i) => {
    const rest = routes[i].slice(prefix);
    const name = rest.length > 0 ? titleCase(rest[0]) : ROOT_GROUP;
    if (!byName.has(name)) {
      byName.set(name, []);
      order.push(name);
    }
    byName.get(name)!.push(endpoint);
  });
  return order.map((name) => ({ name, endpoints: byName.get(name)! }));
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run web/src/nav/__tests__/group-endpoints.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/nav/group-endpoints.ts web/src/nav/__tests__/group-endpoints.test.ts
git commit -m "feat(web): group endpoints by resource via shared-prefix stripping"
```

---

### Task 2: Rename `SidebarGroup` → `SidebarEndpoint`

The current `SidebarGroup` is the per-endpoint collapsible. Rename it so "Group" is free for the resource layer (Task 3). Behavior is unchanged; the `Sidebar` still renders one per endpoint for now, so the existing `Sidebar.test.tsx` stays green.

**Files:**
- Create: `web/src/components/Sidebar/SidebarEndpoint.tsx` (content of the old `SidebarGroup.tsx`, renamed)
- Delete: `web/src/components/Sidebar/SidebarGroup.tsx`
- Modify: `web/src/components/Sidebar/Sidebar.tsx`
- Test: `web/src/components/Sidebar/__tests__/SidebarEndpoint.test.tsx`

**Interfaces:**
- Produces: `SidebarEndpoint` component with props `{ endpoint: Endpoint; activeHash: string; onNavigate?: () => void }`.

- [ ] **Step 1: Write the failing test**

Create `web/src/components/Sidebar/__tests__/SidebarEndpoint.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SidebarEndpoint } from "../SidebarEndpoint";
import type { Endpoint } from "../../../api";

const endpoint: Endpoint = {
  method: "GET", route: "/users",
  examples: [{ name: "returns the list of users", request: { url: "u", method: "GET", path: "/users", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: [] } }],
};

afterEach(cleanup);

describe("SidebarEndpoint", () => {
  it("collapses examples until the method+route toggle is clicked", () => {
    render(<SidebarEndpoint endpoint={endpoint} activeHash="" />);
    expect(screen.queryByText(/returns the list of users/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /GET \/users/i }));
    expect(screen.getByText(/returns the list of users/)).toBeTruthy();
  });

  it("links each example to its slug and fires onNavigate on click", () => {
    const onNavigate = vi.fn();
    render(<SidebarEndpoint endpoint={endpoint} activeHash="" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: /GET \/users/i }));
    const link = screen.getByRole("link", { name: /returns the list of users/ });
    expect(link.getAttribute("href")).toBe("#get-users-returns-the-list-of-users");
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run web/src/components/Sidebar/__tests__/SidebarEndpoint.test.tsx`
Expected: FAIL — cannot resolve `../SidebarEndpoint`.

- [ ] **Step 3: Create `SidebarEndpoint.tsx` and rewire `Sidebar.tsx`**

Create `web/src/components/Sidebar/SidebarEndpoint.tsx` with the exact body of the current `SidebarGroup.tsx`, changing only the component name and JSDoc:

```tsx
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Endpoint } from "../../api";
import { exampleSlug } from "../../nav/slug";
import { cn } from "@/lib/shadcn/utils";
import { methodColorClass, statusColorClass } from "../../theme/http-color-mapper";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/** One collapsible endpoint in the sidebar: a method+route toggle over the
 * endpoint's example links. */
export const SidebarEndpoint = ({ endpoint, activeHash, onNavigate }: {
  endpoint: Endpoint; activeHash: string; onNavigate?: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="list-none">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left font-mono text-[13px] hover:bg-muted">
          <span><span className={cn("font-bold", methodColorClass(endpoint.method))}>{endpoint.method}</span> {endpoint.route}</span>
          {expanded
            ? <ChevronDown className="size-3.5 opacity-50" />
            : <ChevronRight className="size-3.5 opacity-50" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="m-0 p-0">
            {endpoint.examples.map((example) => {
              const slug = exampleSlug(endpoint.method, endpoint.route, example.name);
              const active = slug === activeHash;
              return (
                <li key={example.name} className="list-none">
                  <a
                    href={`#${slug}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => onNavigate?.()}
                    className={cn(
                      "block cursor-pointer rounded-md py-1.5 pl-[22px] pr-2 text-[13px] no-underline",
                      active ? "bg-accent font-semibold text-primary" : "text-foreground/80",
                    )}
                  >
                    <span className={cn("font-mono text-[11px] font-bold", statusColorClass(example.response.status))}>{example.response.status}</span>{" "}
                    {example.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
};
```

Then delete the old file: `git rm web/src/components/Sidebar/SidebarGroup.tsx`.

Update `web/src/components/Sidebar/Sidebar.tsx` to import and render `SidebarEndpoint` (still flat — grouping arrives in Task 3):

```tsx
import type { Endpoint } from "../../api";
import { SidebarEndpoint } from "./SidebarEndpoint";

/** The docs navigation tree: one collapsible group per endpoint. */
export const Sidebar = ({ endpoints, activeHash, onNavigate }: {
  endpoints: Endpoint[]; activeHash: string; onNavigate?: () => void;
}) => (
  <nav aria-label="API endpoints">
    <ul className="m-0 p-0">
      {endpoints.map((endpoint) => (
        <SidebarEndpoint
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run web/src/components/Sidebar/`
Expected: PASS — both `SidebarEndpoint.test.tsx` and the unchanged `Sidebar.test.tsx`.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/Sidebar/
git commit -m "refactor(web): rename SidebarGroup to SidebarEndpoint"
```

---

### Task 3: New `SidebarGroup` (resource group) + group the `Sidebar`

**Files:**
- Create: `web/src/components/Sidebar/SidebarGroup.tsx`
- Modify: `web/src/components/Sidebar/Sidebar.tsx`
- Modify: `web/src/components/Sidebar/__tests__/Sidebar.test.tsx`

**Interfaces:**
- Consumes: `groupEndpoints` + `ResourceGroup` (Task 1); `SidebarEndpoint` (Task 2).
- Produces: `SidebarGroup` component with props `{ group: ResourceGroup; activeHash: string; onNavigate?: () => void }`.

- [ ] **Step 1: Update the `Sidebar` test for grouping**

Replace the body of `web/src/components/Sidebar/__tests__/Sidebar.test.tsx` with:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Sidebar } from "../Sidebar";
import type { Endpoint } from "../../../api";

const endpoints: Endpoint[] = [
  {
    method: "GET", route: "/users/:id",
    examples: [{ name: "returns the user", request: { url: "u", method: "GET", path: "/users/1", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: {} } }],
  },
  {
    method: "GET", route: "/users/:id/addresses",
    examples: [{ name: "returns the addresses", request: { url: "u", method: "GET", path: "/users/1/addresses", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: [] } }],
  },
  {
    method: "GET", route: "/health",
    examples: [{ name: "returns the application status", request: { url: "u", method: "GET", path: "/health", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: {} } }],
  },
];

afterEach(cleanup);

describe("Sidebar", () => {
  it("renders a section header per resource group", () => {
    render(<Sidebar endpoints={endpoints} activeHash="" />);
    expect(screen.getByText("Users")).toBeTruthy();
    expect(screen.getByText("Health")).toBeTruthy();
  });

  it("renders each endpoint as a collapsible toggle under its group", () => {
    render(<Sidebar endpoints={endpoints} activeHash="" />);
    expect(screen.getByRole("button", { name: /GET \/users\/:id$/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /GET \/users\/:id\/addresses/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /GET \/health/i })).toBeTruthy();
  });

  it("links examples to their slug and fires onNavigate on click", () => {
    const onNavigate = vi.fn();
    render(<Sidebar endpoints={endpoints} activeHash="" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: /GET \/health/i }));
    const link = screen.getByRole("link", { name: /returns the application status/ });
    expect(link.getAttribute("href")).toBe("#get-health-returns-the-application-status");
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalled();
  });

  it("links the logo to the GitHub repository", () => {
    render(<Sidebar endpoints={endpoints} activeHash="" />);
    const link = screen.getByRole("link", { name: /the-owl/i });
    expect(link.getAttribute("href")).toBe("https://github.com/leonardosarmentocastro/the-owl");
    expect(link.getAttribute("target")).toBe("_blank");
  });
});
```

(The logo assertion fails until Task 4 — that is expected and noted in Task 4. If using strict per-task green gates, add the `it.skip` to that one case now and un-skip it in Task 4.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run web/src/components/Sidebar/__tests__/Sidebar.test.tsx`
Expected: FAIL — no "Users"/"Health" section headers yet (logo case also fails; addressed in Task 4).

- [ ] **Step 3: Create `SidebarGroup.tsx`**

```tsx
import type { ResourceGroup } from "../../nav/group-endpoints";
import { SidebarEndpoint } from "./SidebarEndpoint";

/** One resource group in the sidebar: a section header (the resource name) over
 * its endpoints. */
export const SidebarGroup = ({ group, activeHash, onNavigate }: {
  group: ResourceGroup; activeHash: string; onNavigate?: () => void;
}) => (
  <li className="list-none">
    <h2 className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {group.name}
    </h2>
    <ul className="m-0 p-0">
      {group.endpoints.map((endpoint) => (
        <SidebarEndpoint
          key={`${endpoint.method} ${endpoint.route}`}
          endpoint={endpoint}
          activeHash={activeHash}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  </li>
);
```

- [ ] **Step 4: Rewire `Sidebar.tsx` to render groups**

```tsx
import type { Endpoint } from "../../api";
import { groupEndpoints } from "../../nav/group-endpoints";
import { SidebarGroup } from "./SidebarGroup";

/** The docs navigation tree: one section per resource group, each holding its
 * collapsible endpoints. */
export const Sidebar = ({ endpoints, activeHash, onNavigate }: {
  endpoints: Endpoint[]; activeHash: string; onNavigate?: () => void;
}) => (
  <nav aria-label="API endpoints">
    <ul className="m-0 p-0">
      {groupEndpoints(endpoints).map((group) => (
        <SidebarGroup
          key={group.name}
          group={group}
          activeHash={activeHash}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  </nav>
);
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run web/src/components/Sidebar/__tests__/Sidebar.test.tsx`
Expected: the three grouping/linking cases PASS; the logo case still FAILS (or is skipped) until Task 4.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/Sidebar/
git commit -m "feat(web): render the sidebar grouped by resource"
```

---

### Task 4: The logo (links to GitHub) in the shared `Sidebar`

Placing the logo in `Sidebar` covers both the desktop aside and the mobile drawer.

**Files:**
- Create: `web/src/assets/the-owl-lockup.svg` (copy of `assets/the-owl-lockup-light.svg`)
- Modify: `web/src/components/Sidebar/Sidebar.tsx`
- Verify: `web/src/components/Sidebar/__tests__/Sidebar.test.tsx` (logo case from Task 3)
- Check: `web/src/global.d.ts` (ensure `*.svg` imports are typed)

**Interfaces:**
- Consumes: nothing new. Produces: the logo link inside `Sidebar`.

- [ ] **Step 1: Copy the logo asset into the web bundle**

```bash
mkdir -p web/src/assets
cp assets/the-owl-lockup-light.svg web/src/assets/the-owl-lockup.svg
```

- [ ] **Step 2: Ensure SVG URL imports are typed**

Read `web/src/global.d.ts`. If it does not already declare SVG modules, add:

```ts
declare module "*.svg" {
  const src: string;
  export default src;
}
```

(If Vite client types already provide this — e.g. a `/// <reference types="vite/client" />` — skip this step.)

- [ ] **Step 3: Un-skip / confirm the logo test from Task 3**

The logo case in `Sidebar.test.tsx` asserts a link named `/the-owl/i` pointing at the GitHub URL with `target="_blank"`. If it was `it.skip`-ped in Task 3, change it back to `it`.

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run web/src/components/Sidebar/__tests__/Sidebar.test.tsx`
Expected: FAIL — no link named "the-owl" yet.

- [ ] **Step 5: Add the logo header to `Sidebar.tsx`**

```tsx
import type { Endpoint } from "../../api";
import { groupEndpoints } from "../../nav/group-endpoints";
import { SidebarGroup } from "./SidebarGroup";
import logoUrl from "../../assets/the-owl-lockup.svg";

const REPO_URL = "https://github.com/leonardosarmentocastro/the-owl";

/** The docs navigation tree: the branded logo over one section per resource
 * group, each holding its collapsible endpoints. */
export const Sidebar = ({ endpoints, activeHash, onNavigate }: {
  endpoints: Endpoint[]; activeHash: string; onNavigate?: () => void;
}) => (
  <nav aria-label="API endpoints">
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-4 block w-fit"
    >
      <img src={logoUrl} alt="the-owl" className="h-12 w-auto" />
    </a>
    <ul className="m-0 p-0">
      {groupEndpoints(endpoints).map((group) => (
        <SidebarGroup
          key={group.name}
          group={group}
          activeHash={activeHash}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  </nav>
);
```

(The `alt="the-owl"` text is what the test's `name: /the-owl/i` matches on the link.)

- [ ] **Step 6: Run tests + typecheck**

Run: `npx vitest run web/src/components/Sidebar/__tests__/Sidebar.test.tsx`
Expected: PASS (all four cases).
Run: `npm run typecheck`
Expected: no errors (confirms the SVG import is typed).

- [ ] **Step 7: Commit**

```bash
git add web/src/assets/the-owl-lockup.svg web/src/components/Sidebar/Sidebar.tsx web/src/global.d.ts
git commit -m "feat(web): brand the sidebar with the logo linking to GitHub"
```

---

### Task 5: Mobile shell — move the generated date into the header

**Files:**
- Modify: `web/src/App.tsx`
- Modify: `web/src/__tests__/App.test.tsx`

**Interfaces:** none new — internal `App` JSX only.

- [ ] **Step 1: Extend the `App` test for mobile/desktop heading placement**

The existing `App.test.tsx` stubs `matchMedia` (`stubMatchMedia(false)` = desktop). Add a helper to render narrow and assert placement. Replace the `describe("App", …)` block with:

```tsx
describe("App", () => {
  it("desktop: shows the heading and generated date in the main content", async () => {
    stubMatchMedia(false);
    render(<App />);
    expect(await screen.findByRole("heading", { name: /API docs/i })).toBeTruthy();
    expect(screen.getByText(/Generated/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /GET \/users/i })).toBeTruthy();
  });

  it("mobile: shows the generated date in the header and omits the main heading", async () => {
    stubMatchMedia(true);
    render(<App />);
    // The menu button proves we are in the mobile shell.
    expect(await screen.findByRole("button", { name: /open navigation/i })).toBeTruthy();
    expect(screen.getByText(/Generated/i)).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /API docs/i })).toBeNull();
  });
});
```

(`stubMatchMedia` already exists in the file; the `beforeEach(() => stubMatchMedia(false))` line may stay — each test sets its own value explicitly.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run web/src/__tests__/App.test.tsx`
Expected: FAIL — mobile currently renders no "Generated" text in the header and the main `<h1>` is always present.

- [ ] **Step 3: Update `App.tsx`**

Compute the generated label once, drop the heading from `<main>` when narrow, and add the date to the mobile header. Edit the `content` block and the narrow `return`:

Replace the `content` definition:

```tsx
  const generatedAt = new Date(catalog.generatedAt).toLocaleString();

  const content = (
    <main className="box-border min-w-0 max-w-[1400px] flex-1 p-3 sm:p-6">
      {!isNarrow && (
        <>
          <h1 className="text-2xl font-bold">API docs</h1>
          <small className="text-muted-foreground">Generated {generatedAt}</small>
        </>
      )}
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
```

Replace the mobile header's title line (`<strong>API docs</strong>`) with the title plus the generated date:

```tsx
          <div className="flex min-w-0 items-baseline gap-2">
            <strong>API docs</strong>
            <small className="truncate text-muted-foreground">Generated {generatedAt}</small>
          </div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run web/src/__tests__/App.test.tsx`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add web/src/App.tsx web/src/__tests__/App.test.tsx
git commit -m "feat(web): move the generated date into the mobile header"
```

---

### Task 6: Documentation — the "Group" vocabulary term

**Files:**
- Modify: `CONTEXT.md`

**Interfaces:** none.

- [ ] **Step 1: Add the `Group` term to the Language section**

In `CONTEXT.md`, after the **Catalog** entry, insert:

```markdown
**Group**:
A render-time grouping of **Endpoints** that share a resource — the first path
segment that distinguishes them after any prefix common to all routes is
stripped. Versioned APIs (`/api/v1/...`, `/api/v2/...`) therefore group by
version, since the version is the first distinguishing segment.
_Avoid_: section, category, tag.
```

- [ ] **Step 2: Verify the suite is green end-to-end**

Run: `npm test`
Expected: PASS — full lib + web suite.
Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add CONTEXT.md
git commit -m "docs: define the Group vocabulary term for resource grouping"
```

---

## Self-Review

**Spec coverage:**
- §1 grouping data layer → Task 1. ✓
- §1 documented v1/v2 edge case → Task 1 JSDoc + test. ✓
- §2 sidebar rename + grouped render → Tasks 2 & 3. ✓
- §3 logo in shared Sidebar, GitHub link, light lockup → Task 4. ✓
- §4 mobile header date + main heading removed on mobile, desktop unchanged → Task 5. ✓
- §5 docs: spec (done), JSDoc (Task 1), CONTEXT.md Group term (Task 6). ✓
- §6 tests (group-endpoints, Sidebar, SidebarEndpoint, App) → Tasks 1–5. ✓

**Placeholder scan:** none — every code/test step shows full content.

**Type consistency:** `ResourceGroup { name; endpoints }` and `groupEndpoints` (Task 1) are consumed verbatim by `SidebarGroup` (Task 3) and `Sidebar` (Tasks 3–4). `SidebarEndpoint` props `{ endpoint, activeHash, onNavigate? }` (Task 2) match the call sites in `SidebarGroup` (Task 3). `Sidebar` props are unchanged throughout, so `App.tsx` (Task 5) needs no signature change.

**Note on per-task green gates:** Task 3 introduces a logo test that only passes after Task 4. If your execution mode requires every task to end fully green, `it.skip` that one case in Task 3 and un-skip it in Task 4 (called out in both tasks).
