# API docs left navigation — design

## Problem

The generated API docs (`web/`, the React app served by `src/render`) render
every endpoint as a flat, vertically-stacked list of `EndpointCard`s. With one or
two endpoints this is fine, but the docs are meant to grow to many example sets
(users, orders, authentication, …). As that list grows, there is no way to jump
to a section — the user must scroll and scan. We need a persistent **left
navigation** that mirrors the endpoint → example tree and lets the user jump
straight to (and expand) any single example.

## Goals

- A left sidebar listing every endpoint as a first-level, collapsible group
  (`GET /health`, `GET /users`) with a chevron affordance.
- Expanding a group reveals its examples (`200  …returns the application status`).
- Clicking an example deep-links to it: the URL hash updates, the page scrolls to
  the matching example, and that example's accordion expands.
- Deep links are shareable — pasting/reloading a URL with a hash lands on that
  open example.
- Works on narrow screens via a collapsible drawer.

## Non-goals (YAGNI)

- **No scrollspy.** The sidebar highlight updates on click only, not on passive
  scroll position.
- **No router dependency.** We use `window.location.hash` directly, not React
  Router or similar.
- **No slug de-duplication.** Example names already embed method + route + status,
  so anchor slugs are unique in practice. Genuine duplicates are a catalog data
  issue, out of scope here.

## Approach

Chosen approach: **hash as shared state, components self-sync** (over a
lifted-state/controlled-components variant, and over adding a hash router).

The URL hash is the single source of truth for "which example is active." A tiny
`useHash()` hook owned by `App` turns the hash into React state; the sidebar and
the example accordions both key off it. No global open-state store, no context,
no new dependency. This adds the least coupling and leaves the existing
`ExampleAccordion` owning its own open state.

Open-state semantics mimic **Swagger UI**: examples expand/collapse
independently and several can be open at once. The hash only "jumps to and opens"
its target; it never forces other open examples shut.

## Design

### 1. Anchor slugs (the shared key)

`web/src/nav/slug.ts` exports:

```ts
exampleSlug(method: string, route: string, name: string): string
```

It slugifies `${method} ${route} ${name}` to a lowercase, URL-safe string
(e.g. `get-users-200-returns-the-list-of-users`): lowercase, replace each run of
non-alphanumeric characters with a single `-`, and trim leading/trailing `-`.

This one function is the only producer of slugs. Both the sidebar's
`<a href="#…">` and the accordion's DOM `id="…"` are derived from it, so a hash
can never point at a target that does not exist.

### 2. New modules

- `web/src/nav/slug.ts` — `exampleSlug()` (above).
- `web/src/nav/use-hash.ts` — `useHash(): string`. Returns the current
  `location.hash` without the leading `#`; subscribes to the `hashchange` event
  and unsubscribes on unmount. Owned/called once by `App`.
- `web/src/nav/use-media-query.ts` — `useMediaQuery(query: string): boolean`. A
  `window.matchMedia` wrapper returning whether the query currently matches and
  updating on change. Keeps us on the codebase's inline-style convention (no
  global stylesheet) while still giving us a real breakpoint.
- `web/src/components/Sidebar.tsx` — the navigation tree (see §4).

### 3. Component tree & data flow

```
App  (owns: catalog, useHash → activeHash, useMediaQuery → isNarrow, drawerOpen)
├─ Sidebar(endpoints, activeHash, onNavigate)
│   └─ per endpoint: collapsible group — "GET /health" + chevron (local expanded state)
│        └─ <a href="#slug">  "200  …name"   ← highlighted when slug === activeHash
└─ <main> (h1 "API docs" + generated timestamp)
     └─ EndpointCard(endpoint, baseUrl, activeHash)
          └─ ExampleAccordion(id=slug, activeHash, …)
```

Flow:

1. A sidebar example is a plain `<a href="#slug">`. Clicking it changes
   `location.hash`.
2. `useHash` (in `App`) catches the `hashchange`, re-renders with the new
   `activeHash`, and threads it down through `EndpointCard` to each
   `ExampleAccordion`.
3. The matching `ExampleAccordion` (its `slug === activeHash`) runs a
   `useEffect([activeHash])` that calls `setOpen(true)` and
   `ref.scrollIntoView({ behavior: "smooth" })`.
4. The `Sidebar` highlights the link whose `slug === activeHash`. Because the
   highlight is derived from the hash and the hash only changes on click, this is
   click-only highlighting (no scrollspy).

Clicking an `ExampleAccordion` header directly toggles its open state and, when
opening, sets `location.hash = slug` — so examples are shareable/linkable from the
main column too, not only via the sidebar.

`activeHash` is threaded as a prop (App → EndpointCard → ExampleAccordion) so there
is a single `hashchange` listener rather than one per accordion.

### 4. Sidebar

`Sidebar` maps `catalog.endpoints` to one collapsible group each:

- Group header: `<METHOD> <route>` (e.g. `GET /health`) with a chevron icon on the
  right. The header owns **local** expanded/collapsed state (independent of the
  content column and of the hash).
- Group body (when expanded): one `<a href="#slug">` per example, labelled with the
  status + example name (e.g. `200  [get] /health > (200) returns the application
  status`). The link is visually highlighted when its `slug === activeHash`.
- Each link click also invokes `onNavigate` (used by the responsive shell to close
  the mobile drawer).

### 5. Responsive shell

`App` switches layout on `useMediaQuery("(max-width: 768px)")`:

- **Wide:** a sticky left sidebar (~280px, its own scroll) beside the content
  column. Replaces today's single centered `max-width: 900px` column.
- **Narrow:** the sidebar becomes an off-canvas drawer behind a ☰ button in a slim
  top bar. `App` holds `drawerOpen` state; opening shows the drawer over a dimmed
  overlay backdrop; `onNavigate` (fired on any example-link click) sets
  `drawerOpen = false`, so tapping a link both navigates and dismisses the drawer.

### 6. Edge cases

- **Empty catalog / endpoint with no examples:** sidebar renders the group header
  with no body; nothing to navigate to. No special handling beyond rendering an
  empty list.
- **Hash present on initial load:** `useHash` returns the initial hash on mount, so
  the matching accordion's `useEffect` opens and scrolls to it on first render
  (deep-link reload works).
- **Re-clicking the already-active example:** the hash does not change, so no
  `hashchange` fires and the accordion stays as-is. Acceptable (matches the
  "hash only jumps + opens" model); not treated as a toggle.

## Testing

Co-located, Vitest + Testing Library, following existing `web/src/**/__tests__`
conventions.

- `web/src/nav/__tests__/slug.test.ts` — `exampleSlug` is deterministic and
  URL-safe; same inputs → same output; collapses non-alphanumeric runs; trims.
- `web/src/nav/__tests__/use-hash.test.ts` — returns the current hash; updates on a
  `hashchange` event; cleans up its listener.
- `web/src/components/__tests__/Sidebar.test.tsx` — renders one group per endpoint;
  the chevron toggles example visibility; clicking an example sets
  `location.hash`; the active item is highlighted when the hash matches.
- Extend `web/src/components/__tests__/ExampleAccordion.test.tsx` — renders
  `id={slug}`; opens when `activeHash` matches its slug.

A `use-media-query` unit test is optional (thin `matchMedia` wrapper); the
responsive behavior is primarily exercised by hand.

## Files touched

New:
- `web/src/nav/slug.ts`
- `web/src/nav/use-hash.ts`
- `web/src/nav/use-media-query.ts`
- `web/src/components/Sidebar.tsx`
- tests listed above.

Modified:
- `web/src/App.tsx` — layout shell (sidebar + content), `useHash`,
  `useMediaQuery`, drawer state; thread `activeHash`.
- `web/src/components/EndpointCard.tsx` — accept and pass `activeHash`.
- `web/src/components/ExampleAccordion.tsx` — accept `activeHash`, set `id={slug}`,
  add the open-on-match `useEffect`, set hash on header open.

Out of scope: the four-domain pipeline (`src/`) is untouched — this is purely the
`web/` render app. No changes to `Catalog`/`types.ts`.
