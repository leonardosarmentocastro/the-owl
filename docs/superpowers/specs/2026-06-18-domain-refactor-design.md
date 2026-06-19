# the-owl v2 domain refactor — design

**Date:** 2026-06-18
**Status:** Approved (pending implementation plan)

## Goal

The v2 rewrite works and ships. This refactor restructures `src/` around the four
architecture pieces of the library, using Domain-Driven Design semantics, without
changing runtime behavior. It is a **`src/`-only structural refactor**: `web/`,
`examples/`, and `documentation/` are out of scope.

The four pieces, in pipeline order:

1. **capture** — observe request/response traffic during functional tests.
2. **drain** — empty a test process's in-memory `Collector` to `.owl/*.json` (the write side).
3. **catalog** — read every `.owl/*.json` fragment and merge them into one in-memory
   `Catalog`, the source of truth (read + merge side; writes nothing).
4. **render** — turn the `Catalog` into `docs/site/` and serve it.

Secondary goals:

- Co-locate tests in `<domain>/__tests__/` instead of a separate top-level `test/`.
- Separate types and constants from behavior, so behavior files export functions only.
- Standardize factory naming and document the architecture in an agent-facing file.

## Operational workflow

```
capture (test process)         drain (afterAll)          catalog (the-owl build)        render / serve
─────────────────────          ────────────────          ──────────────────────         ──────────────
connect(app)                   save()                    readCatalog('.owl/')           emitHtml(catalog,...)
  → capture middleware           → collector.drain()       → read every *.json            → mkdir docs/site/
  → singleton Collector            group by method+route   → merge Examples by            → copy React bundle
test request w/ owlHeaders()     write one file per          endpoint key (dedupe         → write catalog.json
  → x-test-name header             Endpoint:                 by Example name)             Static: host docs/site/
middleware (after routing):        .owl/<slug>.<uuid>.json → Catalog { generatedAt,       Live: theOwl.docs()
  → sanitize headers/body/query    (uuid = concurrency       endpoints[] }                React app fetches
  → collector.record()             safe across processes)    = in-memory source            catalog.json, renders
  (dedupe testName+method+route)                             of truth                      Endpoint cards
```

Key boundary facts that drive the structure:

- The `Collector` is the boundary object between `capture` (fills it via `record`)
  and `drain` (empties it via `drain()`).
- Only `drain` writes to `.owl/`. `catalog` only reads and merges; the eventual
  `catalog.json` is written later by `render` (`emitHtml`).
- `Example` / `Endpoint` / `Catalog` are a **shared kernel** used by every domain.
- `index.ts` is the **composition root** — the only file that wires domains together.

## Target structure

```
the-owl/
├── AGENTS.md                      # canonical agent doc (new)
├── CLAUDE.md                      # thin pointer → AGENTS.md (new)
├── CONTEXT.md                     # unchanged — ubiquitous language
└── src/
    ├── index.ts                   # composition root + public API (was the-owl.ts)
    ├── types.ts                   # shared kernel: CapturedRequest/Response, Example, Endpoint, Catalog
    ├── keys.ts                    # endpointKey() + JSDoc (was part of model.ts)
    ├── capture/                   # 1 · runs inside the test process
    │   ├── middleware.ts          # createCaptureMiddleware()  (was capture.ts)
    │   ├── collector.ts           # createCollector()
    │   ├── headers.ts             # filterHeaders()  (IGNORED_HEADERS stays local/private)
    │   ├── sanitize.ts            # sanitizeHeaders/sanitizeBody/normalizeKey (functions only)
    │   ├── vitest.ts              # owlHeaders()  — public `the-owl/vitest` entry
    │   ├── types.ts               # Collector, RecordInput, SanitizeOptions, ConnectOptions
    │   ├── constants.ts           # TEST_NAME_HEADER, REDACTED, DEFAULT_SANITIZE
    │   └── __tests__/
    │       ├── middleware.test.ts
    │       ├── collector.test.ts
    │       └── sanitize.test.ts
    ├── drain/                     # 2 · Collector → .owl/*.json (write side)
    │   ├── to-disk.ts             # drainToDisk()  (was persist/drain-to-disk.ts)
    │   ├── slug.ts                # endpointSlug()
    │   └── __tests__/
    │       └── drain.test.ts
    ├── catalog/                   # 3 · .owl/*.json → in-memory source of truth (read + merge)
    │   ├── read.ts                # readCatalog()  (was persist/read-catalog.ts)
    │   └── __tests__/
    │       └── read.test.ts
    ├── render/                    # 4 · Catalog → docs/site + serving
    │   ├── html.ts                # emitHtml()  (was renderers/html.ts)
    │   ├── build.ts               # runBuild()
    │   ├── serve.ts               # docs()
    │   ├── types.ts               # BuildOptions, DocsOptions
    │   └── __tests__/
    │       └── build.test.ts
    └── bin/
        └── cli.ts                 # executable entry (unchanged location)
```

## Migration map (old → new)

| Old | New | Notes |
|---|---|---|
| `model.ts` | `types.ts` + `keys.ts` | interfaces vs. `endpointKey` (now JSDoc'd) |
| `the-owl.ts` | `index.ts` | composition root; `ConnectOptions` → `capture/types.ts` |
| `capture.ts` | `capture/middleware.ts` | `makeCaptureMiddleware` → `createCaptureMiddleware` |
| `collector.ts` | `capture/collector.ts` | `Collector`/`RecordInput` → `capture/types.ts` |
| `headers.ts` | `capture/headers.ts` | `TEST_NAME_HEADER` → `capture/constants.ts`; `IGNORED_HEADERS` stays private |
| `sanitize.ts` | `capture/sanitize.ts` | `SanitizeOptions` → `capture/types.ts`; `REDACTED`/`DEFAULT_SANITIZE` → `capture/constants.ts` |
| `vitest.ts` | `capture/vitest.ts` | tsup `vitest` entry repointed |
| `persist/drain-to-disk.ts` | `drain/to-disk.ts` | |
| `persist/slug.ts` | `drain/slug.ts` | |
| `persist/read-catalog.ts` | `catalog/read.ts` | |
| `renderers/html.ts` | `render/html.ts` | |
| `build.ts` | `render/build.ts` | `BuildOptions` → `render/types.ts` |
| `serve.ts` | `render/serve.ts` | `DocsOptions` → `render/types.ts` |
| `bin/cli.ts` | `bin/cli.ts` | import paths updated |

### Test migration

Tests leave `test/` and co-locate under each domain. The `test/` folder is deleted.

| Old test | New location | Covers |
|---|---|---|
| `test/capture.test.ts` | `src/capture/__tests__/middleware.test.ts` | capture middleware behavior |
| `test/collector.test.ts` | `src/capture/__tests__/collector.test.ts` | `createCollector` |
| `test/sanitize.test.ts` | `src/capture/__tests__/sanitize.test.ts` | sanitization |
| `test/persist.test.ts` (drain + slug cases) | `src/drain/__tests__/drain.test.ts` | `drainToDisk`, `endpointSlug` |
| `test/persist.test.ts` (merge case) | `src/catalog/__tests__/read.test.ts` | `readCatalog` merge/dedupe |
| `test/build.test.ts` | `src/render/__tests__/build.test.ts` | `runBuild` |

Test imports change from `../src/<x>` to relative-within-domain paths
(e.g. `../collector`, `../../types`).

## Conventions

These become the rules documented in `AGENTS.md`:

- **Factories use `create*`**: `createCaptureMiddleware()`, `createCollector()`.
  (`makeCaptureMiddleware` is renamed.)
- **File purity**: behavior files export functions only. Exported types live in
  `<domain>/types.ts`; exported constants in `<domain>/constants.ts`. Single-use
  private constants (e.g. `IGNORED_HEADERS`) stay local to their function file.
- **Tests co-located** in `<domain>/__tests__/*.test.ts`. No top-level `test/`.
- **JSDoc on each domain's key function**, explaining its role in the
  `capture → drain → catalog → render` pipeline. `keys.ts`'s `endpointKey` gets a
  JSDoc explaining it is the in-memory identity of an Endpoint (mirroring
  `drain/slug.ts`'s on-disk identity).
- **Ubiquitous language** lives in `CONTEXT.md`; `AGENTS.md` links to it rather than
  restating it.

## Allowed dependency direction

```
types.ts / keys.ts   ← shared kernel (no deps)
capture/             → types, keys
drain/               → types, keys, capture (uses the Collector type)
catalog/             → types, keys
render/              → types, catalog (build reads the catalog)
index.ts (root)      → capture, drain, render        # the ONLY place that wires domains together
bin/cli.ts           → render (runBuild)
```

Domains reach "sideways" only along the pipeline (`drain → capture`,
`render → catalog`). Any other cross-domain wiring belongs to the composition root.

## Build / config updates

- `tsup.config.ts`:
  `entry: { index: "src/index.ts", vitest: "src/capture/vitest.ts", "bin/cli": "src/bin/cli.ts" }`.
  Output names (`dist/index`, `dist/vitest`, `dist/bin/cli`) are unchanged, so
  **`package.json` exports need no change**.
- `vitest.config.ts`: `include: ["src/**/*.test.ts"]`.
- `tsconfig.json`: `include: ["src", "web/src"]` (drop `"test"`).

## Agent docs

- `AGENTS.md` (canonical) contains: one-paragraph what/why, the pipeline diagram,
  the domain/folder map, the conventions above, the dependency rules, and a link to
  `CONTEXT.md`.
- `CLAUDE.md` is a short pointer directing Claude Code to `AGENTS.md`.

## Verification

The refactor preserves behavior, so success = the existing suite passes unchanged
(after import-path updates) plus a green typecheck and build:

- `npm test` — all migrated tests pass.
- `npm run typecheck` — no type errors.
- `npm run build` — `dist/index`, `dist/vitest`, `dist/bin/cli`, and the web bundle
  emit as before.

## Non-goals

- No runtime/behavior changes.
- No changes to `web/`, `examples/`, or `documentation/`.
- No new features, no public API surface changes (same exports from `the-owl` and
  `the-owl/vitest`).
