# `THE_OWL_SITE_OUTPUT_DIR` — configurable docs output directory

## Summary

`the-owl build` currently writes the static docs site to a hardcoded `docs/site/`.
This adds a new environment variable, `THE_OWL_SITE_OUTPUT_DIR`, that overrides the
**full** output path. When unset, behavior is unchanged (`docs/site`). The live
`docs()` router honors the same variable so its default catalog lookup stays in
sync with wherever the build wrote the site.

## Decisions (settled during brainstorming)

- **Semantics:** the variable is the **full** output path, not a parent with
  `/site` appended. `THE_OWL_SITE_OUTPUT_DIR=public/api-docs` → `public/api-docs/`;
  unset → `docs/site/`.
- **Name:** `THE_OWL_SITE_OUTPUT_DIR` (explicit, follows the `THE_OWL_*`
  build-time convention alongside `THE_OWL_DOCS_HOST` / `THE_OWL_GROUPING_REGEX`).
- **Scope:** honored by **both** `the-owl build` (write side) and the live
  `docs()` router (its default catalog path), so a custom build location still
  serves correctly without passing `docs({ catalog })` explicitly.
- **Path resolution:** relative values resolve against `process.cwd()`; absolute
  values are used as-is.
- **Out of scope (YAGNI):** no CLI flag, no per-call build/`docs()` option. Env
  var only.

## Architecture (Approach A — shared resolver in `render/`)

One source of truth for the default and resolution, called at both composition
points. `runBuild`/`emitHtml` stay pure "path-in" functions (keeps existing tests
straightforward). Both callers already live in `render/`, so the new module stays
within the domain and violates no dependency-direction rule.

### New file: `src/render/output-dir.ts`

```ts
import { resolve } from "node:path";

// Default static-site output, relative to cwd, when THE_OWL_SITE_OUTPUT_DIR is unset.
// Local: used privately by the one function below (allowed by the file-purity rule).
const DEFAULT_SITE_OUTPUT_DIR = "docs/site";

/** Resolve the built-docs output directory from THE_OWL_SITE_OUTPUT_DIR (full
 * path, default docs/site). Relative values are anchored at the current working
 * directory; absolute values are used as-is. Read by `the-owl build` and the live
 * `docs()` router. */
export const resolveSiteOutputDir = (): string =>
  resolve(process.cwd(), process.env.THE_OWL_SITE_OUTPUT_DIR ?? DEFAULT_SITE_OUTPUT_DIR);
```

### Seam change: `outDir` → `siteDir`

The internal concept moves from "the parent of `site/`" to "the site directory
itself" (the full path), so the `/site` suffix is no longer appended anywhere.

- **`src/render/types.ts`** — `BuildOptions.outDir` → `siteDir`; update its JSDoc
  to "the full directory to emit the static site into".
- **`src/render/html.ts`** — `emitHtml(catalog, siteDir, webBundleDir)` writes
  directly to `siteDir`; drop the internal `join(outDir, "site")`. Update the
  JSDoc to say it writes under `<siteDir>`.
- **`src/render/build.ts`** — `runBuild({ owlDir, siteDir, webBundleDir })` passes
  `siteDir` straight to `emitHtml`. The existing `THE_OWL_DOCS_HOST` /
  `THE_OWL_GROUPING_REGEX` catalog reads are unchanged.
- **`src/bin/cli.ts`** — resolve the site dir at the composition root:
  `const siteDir = resolveSiteOutputDir();` and pass it into `runBuild`. Update the
  closing `console.log` to print the actual `siteDir` instead of the hardcoded
  `./docs/site`.

### Live serve

- **`src/render/serve.ts`** — `catalogPath = options.catalog ?? join(resolveSiteOutputDir(), "catalog.json")`.
- **`src/render/types.ts`** — update the `DocsOptions.catalog` JSDoc default note
  to `<THE_OWL_SITE_OUTPUT_DIR>/catalog.json` (default `docs/site/catalog.json`).

## Tests

- **New `src/render/__tests__/output-dir.test.ts`:**
  - unset → returns `<cwd>/docs/site`;
  - relative value → resolved against `cwd` (e.g. `public/api-docs` → `<cwd>/public/api-docs`);
  - absolute value → returned as-is.
  - Save/restore `process.env.THE_OWL_SITE_OUTPUT_DIR` around each case.
- **`src/render/__tests__/build.test.ts`:**
  - Update the existing `outDir:` call sites to `siteDir: join(root, "docs", "site")`
    (the default-path assertion still holds).
  - Add a case: with `THE_OWL_SITE_OUTPUT_DIR` set, the CLI-resolved dir relocates
    output (assert `catalog.json` + `index.html` land under the custom dir, not
    `docs/site`). This can drive `runBuild` with an explicit `siteDir`, plus a
    focused test of `resolveSiteOutputDir()` for the env wiring.
- **`src/render/__tests__/serve.test.ts`:**
  - Add a case: unset var → `docs()` default catalog resolves under `docs/site`;
  - set var → `docs()` default catalog resolves under the custom dir.
  - Continue to override with an explicit `catalog` option where the existing
    tests need a known-missing path.

## Documentation

- **`documentation/02-process-variables.md`:**
  - Add `THE_OWL_SITE_OUTPUT_DIR` to the bullet list at the top.
  - Add a section documenting it: read at **build time** *and* by `docs()`; it is
    the **full** output path (default `docs/site`); relative paths resolve against
    cwd; show the nested-path example and a `rimraf` note. Cross-reference
    `examples/03-site-output-dir`.

## New example: `examples/03-site-output-dir`

A near-copy of `examples/01-minimal`. The **only** functional difference is that
its `test:create-docs` script sets `THE_OWL_SITE_OUTPUT_DIR` to a custom, clearly
different location (`public/api-docs`), demonstrating the feature end to end.

- Copy `src/server.ts`, `test/` (helpers + two tests), `vitest.config.ts`, and the
  scripts/deps from `01-minimal` verbatim.
- `package.json` `name`: `site-output-dir`. Same `build:the-owl`,
  `pretest:create-docs`, and `test` scripts as `01-minimal`.
- Changed script:

  ```jsonc
  "test:create-docs": "rimraf .owl public && CREATE_DOCS=true vitest run && THE_OWL_SITE_OUTPUT_DIR=public/api-docs the-owl build"
  ```

  (rimraf targets the custom `public/` dir instead of `docs`.)
- `README.md`: same shape as `01-minimal`, with a short "What's different here?"
  note calling out `THE_OWL_SITE_OUTPUT_DIR` and that the site lands in
  `public/api-docs/` (open `public/api-docs/index.html`).
- Generated artifacts (`.owl/`, `public/api-docs/`) are produced by running
  `pnpm test:create-docs`, mirroring how `01-minimal` commits its `docs/site/`.

## Non-goals

- No change to how `.owl/` drain fragments are located (`owlDir` stays
  `<cwd>/.owl`).
- No new public API surface beyond the environment variable.
