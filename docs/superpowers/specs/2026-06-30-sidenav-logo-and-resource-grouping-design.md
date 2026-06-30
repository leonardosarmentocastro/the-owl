# Sidenav logo + resource grouping — design

Give the docs site a professional finish: surface the `the-owl` brand in the
navigation, polish the mobile chrome, and group endpoints by resource so the
sidebar reads like a real API reference (à la Scalar) instead of a flat list.

## Goals

1. Show the `the-owl` logo at the top of the desktop sidenav and inside the
   mobile navigation drawer; the logo links to the project's GitHub page.
2. On mobile, move the "API docs / Generated `<date>`" line out of the main
   content and into the top navbar.
3. Group endpoints by resource in the sidebar (e.g. a **Users** group over
   `GET /users/:id` and `GET /users/:id/addresses`, a separate **Health** group
   over `GET /health`).

Non-goals: dark mode, search, reordering controls, per-group collapsing,
changing the desktop main-content heading.

## Architecture

Two layers change, plus the mobile shell:

- **Data layer** (`web/src/nav/`): a new pure function derives resource groups
  from the flat `Endpoint[]`.
- **Render layer** (`web/src/components/Sidebar/`): the sidebar renders those
  groups; a vocabulary-aligned rename clarifies the two nesting levels.
- **Shell** (`web/src/App.tsx`): the logo placement (via the shared `Sidebar`)
  and the mobile header/main tweaks.

The `web/` app is out of the four-domain pipeline (see AGENTS.md), so nothing in
`src/` changes except documentation.

## 1. Resource grouping — the data layer

New pure module **`web/src/nav/group-endpoints.ts`**, beside the existing
`slug.ts`:

```ts
export interface ResourceGroup {
  name: string;        // title-cased resource, e.g. "Users"
  endpoints: Endpoint[];
}

export const groupEndpoints = (endpoints: Endpoint[]): ResourceGroup[] => { … }
```

### The grouping rule (shared-prefix stripping)

1. Split each route into path segments (ignore `:param` vs literal — segments
   are compared as-is).
2. Compute the longest run of **leading segments common to every route** — the
   shared prefix — but **never consume any route's last segment** (so a single
   endpoint like `/api/health` still yields a group).
3. Drop the shared prefix from every route; group endpoints by their first
   remaining segment, title-cased (first letter upper, rest untouched).
4. **Ordering:** groups appear in order of first appearance in the catalog;
   endpoint order within a group is preserved from the catalog.

A segment shared by *all* routes carries no grouping information — it cannot
distinguish one resource from another — so stripping it is what makes both of
these work from one rule, with no maintained list of magic words (`v1`, `v2`):

| Routes in the catalog | Shared prefix dropped | Groups |
|---|---|---|
| `/users/:id`, `/users/:id/addresses`, `/health` | *(none)* | Users, Health |
| `/api/users/:id`, `/api/users/:id/addresses`, `/api/health` | `api` | Users, Health |
| `/api/v1/users`, `/api/v1/orders` | `api/v1` | Users, Orders |
| `/health` *(single endpoint)* | *(capped — last segment kept)* | Health |

### Documented edge case: two API versions

When a catalog mixes versions of the same surface, the only segment common to
**all** routes is the shared root, so the *first distinguishing* segment is the
version — and grouping happens by version, not by resource:

| Routes | Shared prefix | Groups |
|---|---|---|
| `/api/v1/users`, `/api/v1/orders`, `/api/v2/users`, `/api/v2/orders` | `api` | **V1** (users, orders), **V2** (users, orders) |

This is intentional, not a bug: two API versions are genuinely separate
surfaces, and the rule surfaces that split. It is documented here, in the
`groupEndpoints` JSDoc, and called out in CONTEXT.md so a reader who expected
resource-first grouping understands why they see version groups.

### Root route

`GET /` has a single empty segment that is also its last segment, so the cap
keeps it; it groups under a stable label (e.g. `Root`). Covered by a test.

## 2. Sidebar — the render layer

Today `components/Sidebar/SidebarGroup.tsx` is a per-endpoint collapsible. With
a real grouping layer the word "group" now belongs to the resource grouping, so
we rename to match CONTEXT.md (where **Endpoint** = method+route):

- **`SidebarGroup.tsx`** (repurposed) — renders one **resource group**: a plain,
  non-collapsible section header (the resource name) above a list of its
  endpoints.
- **`SidebarEndpoint.tsx`** (renamed from today's `SidebarGroup`) — the
  collapsible method+route toggle with its examples. Behavior unchanged; only
  the name and file move.
- **`Sidebar.tsx`** — calls `groupEndpoints(endpoints)` and maps
  groups → `SidebarGroup` → `SidebarEndpoint`.

Renaming (rather than adding a third confusingly-named component) follows the
"improve the code you're working in" principle: once resource groups exist, the
old `SidebarGroup` name describes the wrong thing.

Resulting layout (the approved shape):

```
USERS
  ▸ GET /users/:id
  ▾ GET /users/:id/addresses
       200 returns addresses
       404 user not found

HEALTH
  ▸ GET /health
```

Per AGENTS.md the `Sidebar/` folder keeps one component per file with tests in
its own `__tests__/`.

## 3. The logo

- Copy `assets/the-owl-lockup-light.svg` → `web/src/assets/the-owl-lockup.svg`.
  The docs app is light-only, and the "light" lockup carries the dark ink meant
  for light backgrounds. (A copy under `web/` keeps the Vite root self-contained;
  the lockup changes rarely.)
- Import it as a URL asset (Vite bundles and fingerprints it) and render it as
  the header of **`Sidebar.tsx`**, wrapped in:

  ```html
  <a href="https://github.com/leonardosarmentocastro/the-owl"
     target="_blank" rel="noopener noreferrer">
  ```

- Because both the desktop `<aside>` and the mobile `Sheet` drawer render the
  same `<Sidebar>`, placing the logo there satisfies *both* the desktop-sidenav
  and mobile-drawer requirements from a single change.
- Sized to fit the 280px column (constrained width, auto height).

## 4. Mobile shell tweaks (`App.tsx`)

- **Top header** (the bar with the `Menu` button): keep `API docs`, and append
  `Generated <date>` right after it as muted small text — the same
  `new Date(catalog.generatedAt).toLocaleString()` value shown on desktop.
- **Main content:** remove the `<h1>API docs</h1>` + `Generated …` block **on
  mobile only** (it now lives in the header). Desktop `<main>` keeps its heading
  unchanged — desktop has no top bar.

The narrow vs. wide split already exists via `useMediaQuery("(max-width: 768px)")`,
so this is a conditional-render tweak, not new plumbing.

## 5. Documentation

- This spec records the grouping rule and the v1/v2 rationale.
- `groupEndpoints` carries a JSDoc explaining the shared-prefix stripping and the
  version-grouping consequence.
- CONTEXT.md gains a **Group** term: "A render-time grouping of Endpoints that
  share a resource — the first path segment that distinguishes them after any
  prefix common to all routes is stripped. _Avoid_: section, category, tag."

## 6. Testing (TDD, co-located)

- **`nav/__tests__/group-endpoints.test.ts`** — no shared prefix; shared `api/`
  prefix; mixed `v1`/`v2` (asserts version groups, documenting the behavior in a
  test); single endpoint (`/api/health` → Health); root `/`; title-casing.
- **`components/Sidebar/__tests__/Sidebar.test.tsx`** — renders one section
  header per group with the right endpoints nested under it; logo present and
  links to the GitHub URL with `target="_blank"`.
- **`components/Sidebar/__tests__/SidebarEndpoint.test.tsx`** — the collapsible
  endpoint behavior carried over from the old `SidebarGroup` test.
- **`__tests__/App.test.tsx`** — mobile header shows the generated date; mobile
  main omits the `API docs` heading; desktop main still shows it.

## Risks / open considerations

- **Title-casing** is deliberately minimal (first letter only): `users → Users`,
  `health-checks → Health-checks`. Richer prettifying is out of scope.
- **Logo copy drift**: the `web/` copy can diverge from `assets/`. Acceptable —
  the lockup is stable; revisit only if it starts changing often.
