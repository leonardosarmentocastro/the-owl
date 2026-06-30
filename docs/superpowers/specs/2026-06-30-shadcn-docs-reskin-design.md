# Shadcn + Tailwind reskin of the generated API docs — design

**Date:** 2026-06-30
**Branch:** `feat/shadcn-docs-reskin`
**Status:** approved design, ready for implementation plan

## Goal

Replace the hand-rolled, inline-styled UI of the generated API docs web app
(`web/`) with [shadcn/ui](https://ui.shadcn.com) components on Tailwind CSS v4.
This is a **faithful reskin with light polish**: the layout and information
architecture stay the same (left nav + content cards + accordions + try-it
form); only the presentational layer changes. No behavior, data flow, or
pipeline logic is altered.

This document is the "study" requested: how Shadcn slots into the Vite/React
bundle that `the-owl build` produces, and which Shadcn components replace each
hand-made one.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Visual ambition | Reskin + light polish — same layout, Shadcn primitives, nicer badges/spacing/typography |
| Theming | Light only this pass; tokens defined as CSS variables so dark mode is a later add |
| Icons | `lucide-react` (replace the Unicode glyphs `☰ ▾ ▸ × ▶`) |
| Integration strategy | **A — standard Shadcn CLI** (`shadcn init` + `components.json` + `shadcn add`) |
| Tailwind version | v4 (CSS-first config via `@tailwindcss/vite`) |

## Context: how the web app is built and shipped

- `web/` is a Vite + React 19 app, styled **entirely with inline styles** —
  there is currently **no global CSS** and no CSS framework.
- `npm run build:web` (`vite build web`) bundles `web/` into `dist/web`.
- `src/render/html.ts` (`emitHtml`) copies `dist/web` into the static site
  alongside `catalog.json`; `src/render/serve.ts` serves the same bundle live.
- The published package ships `dist/` only (`package.json` `files: ["dist"]`).
  The web bundle is self-contained, so anything Vite inlines into `dist/web`
  has **zero impact** on consumers' dependency trees.
- One root `tsconfig.json` covers both `src/` (library) and `web/src/` (app).
  The library never imports from the app, so an app-scoped `@` path alias is
  safe.
- Tests are co-located `@testing-library/react` tests run by a separate
  `vitest.config.ts`. They query by **role, text, and display value** — not by
  style or class — so a className-based reskin is low-risk.

## Architecture & setup

`render/` and the four-domain pipeline are **not touched**. All changes are
inside `web/` plus the three config files that resolve the `@` alias.

### 1. Tailwind v4

- Add `@tailwindcss/vite` to `web/vite.config.ts` `plugins`.
- New `web/src/index.css`:
  - `@import "tailwindcss";`
  - the Shadcn `@theme` token block (light theme).
- Import `./index.css` once from `web/src/main.tsx`.

### 2. Shadcn init

- Run `npx shadcn@latest init` with the **Vite + Tailwind v4** preset.
- Scaffolds:
  - `web/components.json` (style: default, base color: neutral, RSC: false).
  - `web/src/lib/utils.ts` exporting `cn()` (`clsx` + `tailwind-merge`).
  - the CSS theme variables (merged into `web/src/index.css`).
- Shadcn primitives land in `web/src/components/ui/`.

### 3. The `@` path alias → `web/src`

Must be added in **all three** places (missing the vitest one silently breaks
every test importing `@/components/ui/*`):

- `tsconfig.json` → `compilerOptions.baseUrl` + `paths: { "@/*": ["web/src/*"] }`
- `web/vite.config.ts` → `resolve.alias` `{ "@": <abs path to web/src> }`
- `vitest.config.ts` → `resolve.alias` `{ "@": <abs path to web/src> }`

### 4. Dependency placement

All new deps go in **devDependencies** (they are inlined into `dist/web`, never
required by published-package consumers):

`tailwindcss`, `@tailwindcss/vite`, `clsx`, `tailwind-merge`, `lucide-react`,
and the Radix primitives pulled in by the added Shadcn components.

### Primitives to add

`shadcn add card badge button input textarea label accordion collapsible sheet alert`

(Tooltip and other extras are intentionally omitted — see Out of scope.)

## Component mapping

| Current (inline-styled) | Shadcn / lucide replacement |
|---|---|
| App shell `aside` + `main` (`web/src/App.tsx`) | Keep the flex/sticky layout, expressed with Tailwind utilities |
| Mobile drawer (hand-rolled overlay + panel) | **`Sheet`** (Radix Dialog); header toggle → ghost icon **`Button`** + lucide **`Menu`** |
| `EndpointCard` `<section>` | **`Card`** (`CardHeader` / `CardTitle` / `CardContent`); method → **`Badge`** |
| `Sidebar` group toggle + links | **`Collapsible`** + ghost **`Button`** trigger w/ lucide **`ChevronRight`/`ChevronDown`**; status code → **`Badge`**; active link styled via theme tokens |
| `ExampleAccordion` | **`Accordion`** (type single, collapsible) — trigger gains a real button role; status → **`Badge`** (green 2xx / red otherwise) |
| `RequestForm` | **`Label`**, **`Input`**, **`Textarea`**, **`Button`**; remove-row → ghost icon **`Button`** + lucide **`X`**; "+ add" → outline **`Button`** + lucide **`Plus`**; "Try it out" → **`Button`** + lucide **`Play`** |
| `ResponsePanel` | status → **`Badge`**; error box → **`Alert`** (destructive) + lucide **`AlertCircle`**; headers `<details>` → **`Collapsible`** |
| `CodeBlock` | Keep `<pre>`, restyled with Tailwind (`bg-muted`, `rounded`, `border`, monospace) |
| `CurlBlock` | Copy → outline **`Button`** size sm + lucide **`Copy`/`Check`**; reuses `CodeBlock` |

## Theme & tokens

- Light-only Shadcn **neutral** theme, tokens as CSS variables.
- Keep the **monospace** treatment for routes, methods, and code blocks.
- HTTP methods and status codes become `Badge`s with a small mapping:
  2xx → green, 4xx/5xx → red; method colors kept subtle.
- No theme toggle and no `prefers-color-scheme` wiring this pass. Because the
  tokens are CSS variables, adding dark mode later is a localized change.

## Data flow, behavior & error handling

**No logic changes.** Every component keeps its props and behavior contract;
only its rendered markup/styling changes. Untouched:

- `web/src/nav/use-hash.ts`, `use-media-query.ts`, `slug.ts`
- `web/src/request/*` (`prefill`, `fire`, `curl`, `build-request`, etc.)
- The hash-driven open/scroll effect in `ExampleAccordion`
- Validation in `RequestForm` (`validateForm`)
- `loadCatalog` / live-vs-static detection in `App.tsx`

## Testing impact

- Most existing tests pass **unchanged** — they query by role/text/display
  value, and all visible text and accessible names are preserved ("Try it
  out", input placeholders, status numbers, JSON bodies).
- Expected touch-ups: the `ExampleAccordion` and `Sidebar` toggles become real
  buttons (Radix). A couple of tests may move from a text-click to
  `getByRole("button", …)`. This is an accessibility improvement.
- **Known risk to verify during implementation:** Radix components in jsdom
  occasionally need polyfills (`Element.prototype.scrollIntoView`,
  `hasPointerCapture`, `ResizeObserver`). Add a vitest setup file with these
  shims **only if** a test actually requires it — do not add speculatively.
- The new `@` alias must be present in `vitest.config.ts` before any test that
  imports `@/components/ui/*` will run.

## Build & serve verification

- `npm run build:web` must still emit a self-contained `dist/web` (now with a
  hashed Tailwind CSS asset). `emitHtml` and `serve.ts` need no changes.
- `npm run typecheck` must pass with the new `@` paths.
- `npm test` must stay green.
- Manual smoke check: run an example's docs build and the live `docs()` server,
  confirm the reskinned UI renders in both modes (static + live).

## Out of scope (YAGNI)

Dark mode toggle / `prefers-color-scheme`, layout or IA redesign, syntax
highlighting, command palette, tooltips. Tokens are wired so dark mode can be
added later without rework.

## Rollout shape (for the implementation plan)

Rough vertical-slice ordering (the plan will refine this):

1. Tailwind v4 + `shadcn init` + `@` alias in all three configs + `cn()` util;
   prove `npm test` / `typecheck` / `build:web` still pass with no UI change yet.
2. Add the Shadcn primitives; reskin the leaf components first
   (`CodeBlock`, `CurlBlock`, `Badge`-ify method/status).
3. Reskin `RequestForm` and `ResponsePanel`.
4. Reskin `ExampleAccordion` (Accordion) and `EndpointCard` (Card).
5. Reskin `Sidebar` (Collapsible) and the `App` shell + mobile `Sheet`.
6. Test touch-ups + jsdom polyfills if needed; full build/serve smoke check.

Keep the suite green and commit after each slice.
