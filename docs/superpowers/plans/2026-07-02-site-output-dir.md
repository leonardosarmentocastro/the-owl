# `THE_OWL_SITE_OUTPUT_DIR` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `THE_OWL_SITE_OUTPUT_DIR` environment variable that overrides the full output directory of the built docs site (default `docs/site`), honored by both `the-owl build` and the live `docs()` router.

**Architecture:** A single shared resolver, `resolveSiteOutputDir()` in `src/render/output-dir.ts`, is the one source of truth for the default and path resolution. The internal path concept moves from "the parent of `site/`" (`outDir`) to "the full site directory" (`siteDir`), so the `/site` suffix is no longer appended anywhere. The CLI and the `docs()` router each call the resolver at their composition point.

**Tech Stack:** TypeScript, Node built-ins (`node:path`), Vitest, Express (existing `docs()` router).

## Global Constraints

- **Never commit to `master`.** Work happens on branch `feat/site-output-dir` (already created).
- **Spec:** `docs/superpowers/specs/2026-07-02-site-output-dir-design.md`.
- **Env var name (verbatim):** `THE_OWL_SITE_OUTPUT_DIR`. **Default (verbatim):** `docs/site`. Follows the existing `THE_OWL_*` build-time convention.
- **Semantics:** the variable is the **full** output path (no `/site` appended). Relative values resolve against `process.cwd()`; absolute values are used as-is.
- **File purity:** a behavior file exports functions only; a constant used privately by exactly one function may stay local to that file. Tests are co-located in `<domain>/__tests__/*.test.ts`.
- **Avoid generic names** (`utils`, `store`, etc.).
- **Dependency direction:** `render → types, catalog` only. The new module lives in `render/` and is consumed by `render/` + `bin/cli` (which already depends on `render`). No new cross-domain edges.
- **Verify:** `npm test` (Vitest) and `npm run typecheck` (`tsc --noEmit`) must both pass before the final commit of each task.

---

### Task 1: `resolveSiteOutputDir()` resolver

**Files:**
- Create: `src/render/output-dir.ts`
- Test: `src/render/__tests__/output-dir.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `resolveSiteOutputDir(): string` — returns the absolute site output directory. Reads `process.env.THE_OWL_SITE_OUTPUT_DIR` (default `"docs/site"`), resolved against `process.cwd()`.

- [ ] **Step 1: Write the failing test**

Create `src/render/__tests__/output-dir.test.ts`:

```ts
import { describe, it, expect, afterEach } from "vitest";
import { resolve } from "node:path";
import { resolveSiteOutputDir } from "../output-dir";

const KEY = "THE_OWL_SITE_OUTPUT_DIR";
const original = process.env[KEY];
afterEach(() => {
  if (original === undefined) delete process.env[KEY];
  else process.env[KEY] = original;
});

describe("resolveSiteOutputDir", () => {
  it("defaults to <cwd>/docs/site when the var is unset", () => {
    delete process.env[KEY];
    expect(resolveSiteOutputDir()).toBe(resolve(process.cwd(), "docs/site"));
  });

  it("resolves a relative value against the current working directory", () => {
    process.env[KEY] = "public/api-docs";
    expect(resolveSiteOutputDir()).toBe(resolve(process.cwd(), "public/api-docs"));
  });

  it("uses an absolute value as-is", () => {
    process.env[KEY] = "/tmp/owl-out";
    expect(resolveSiteOutputDir()).toBe("/tmp/owl-out");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/render/__tests__/output-dir.test.ts`
Expected: FAIL — cannot find module `../output-dir`.

- [ ] **Step 3: Write minimal implementation**

Create `src/render/output-dir.ts`:

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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/render/__tests__/output-dir.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/render/output-dir.ts src/render/__tests__/output-dir.test.ts
git commit -m "feat(render): add resolveSiteOutputDir for THE_OWL_SITE_OUTPUT_DIR

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Reshape the `outDir → siteDir` seam

Rename the build path concept from `outDir` (parent of `site/`) to `siteDir` (the full site directory) and stop appending `/site`. Wire the CLI to `resolveSiteOutputDir()`. These four files must change together to type-check.

**Files:**
- Modify: `src/render/types.ts:1-6` (`BuildOptions`)
- Modify: `src/render/html.ts:5-16` (`emitHtml`)
- Modify: `src/render/build.ts:6-11` (`runBuild`)
- Modify: `src/bin/cli.ts:13-18`
- Test: `src/render/__tests__/build.test.ts`

**Interfaces:**
- Consumes: `resolveSiteOutputDir()` from Task 1.
- Produces:
  - `BuildOptions = { owlDir: string; siteDir: string; webBundleDir?: string }`
  - `emitHtml(catalog: Catalog, siteDir: string, webBundleDir?: string): void` — writes `catalog.json` + the bundle directly into `siteDir`.
  - `runBuild({ owlDir, siteDir, webBundleDir }: BuildOptions): void`

- [ ] **Step 1: Update the build tests to the new seam (failing)**

In `src/render/__tests__/build.test.ts`:

Replace the first test's `runBuild` call and its assertions (lines ~28-33) so it passes a full `siteDir` and asserts output lands there directly:

```ts
    const site = join(root, "docs", "site");
    runBuild({ owlDir, siteDir: site, webBundleDir: bundle });

    expect(existsSync(join(site, "index.html"))).toBe(true);
    const catalog = JSON.parse(readFileSync(join(site, "catalog.json"), "utf8"));
    expect(catalog.endpoints[0].route).toBe("/users/:id");
```

In the three env-var tests, change each `outDir: join(root, "docs")` to `siteDir: join(root, "docs", "site")` (the `readFileSync(join(root, "docs", "site", "catalog.json"), ...)` assertions stay as-is).

Add a new test at the end of the `describe("build", ...)` block proving a custom `siteDir` relocates output:

```ts
  it("writes the site directly into the given siteDir (no /site appended)", () => {
    const seeded = seedRoot();
    root = seeded.r;
    const siteDir = join(root, "public", "api-docs");
    runBuild({ owlDir: seeded.owlDir, siteDir, webBundleDir: seeded.bundle });

    expect(existsSync(join(siteDir, "index.html"))).toBe(true);
    expect(existsSync(join(siteDir, "catalog.json"))).toBe(true);
    // The old `<parent>/site` layout must NOT be created.
    expect(existsSync(join(root, "public", "api-docs", "site"))).toBe(false);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/render/__tests__/build.test.ts`
Expected: FAIL — `emitHtml` still appends `/site`, so files land under `.../site/site` (or `outDir` is `undefined` → `join(undefined, "site")` throws). The new relocation test and the default test fail.

- [ ] **Step 3: Rename `outDir` → `siteDir` in `BuildOptions`**

In `src/render/types.ts`, replace lines 1-6:

```ts
/** Options for `runBuild()` — where to read drain fragments and the full
 * directory to emit the static site into. */
export interface BuildOptions {
  owlDir: string;
  siteDir: string;
  webBundleDir?: string;
}
```

- [ ] **Step 4: Make `emitHtml` write directly to `siteDir`**

In `src/render/html.ts`, replace lines 5-16:

```ts
/**
 * Render step (pipeline phase 4): write the Catalog as a static site into
 * `siteDir` — the React bundle plus the `catalog.json` the app fetches.
 */
export const emitHtml = (catalog: Catalog, siteDir: string, webBundleDir?: string): void => {
  mkdirSync(siteDir, { recursive: true });
  if (webBundleDir && existsSync(webBundleDir)) {
    cpSync(webBundleDir, siteDir, { recursive: true });
  }
  writeFileSync(join(siteDir, "catalog.json"), JSON.stringify(catalog, null, 2));
};
```

Note: `join` is still used (for `catalog.json`) so the existing `import { join } from "node:path";` stays.

- [ ] **Step 5: Pass `siteDir` through `runBuild`**

In `src/render/build.ts`, replace lines 6-11:

```ts
export const runBuild = ({ owlDir, siteDir, webBundleDir }: BuildOptions): void => {
  const catalog = readCatalog(owlDir);
  if (process.env.THE_OWL_DOCS_HOST) catalog.baseUrl = process.env.THE_OWL_DOCS_HOST;
  if (process.env.THE_OWL_GROUPING_REGEX) catalog.grouping = process.env.THE_OWL_GROUPING_REGEX;
  emitHtml(catalog, siteDir, webBundleDir);
};
```

- [ ] **Step 6: Wire the CLI to the resolver**

In `src/bin/cli.ts`, replace lines 1-18:

```ts
#!/usr/bin/env node
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runBuild } from "../render/build";
import { resolveSiteOutputDir } from "../render/output-dir";

const [, , command] = process.argv;
if (command !== "build") {
  console.error("usage: the-owl build");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const siteDir = resolveSiteOutputDir();
runBuild({
  owlDir: join(process.cwd(), ".owl"),
  siteDir,
  webBundleDir: join(here, "..", "web"), // dist/web shipped in the package
});
console.log(`the-owl: docs built into ${siteDir} (open index.html or serve via theOwl.docs())`);
```

- [ ] **Step 7: Run tests + typecheck to verify they pass**

Run: `npx vitest run src/render/__tests__/build.test.ts && npm run typecheck`
Expected: PASS (all build tests green; `tsc --noEmit` clean — the `outDir` rename is fully propagated).

- [ ] **Step 8: Commit**

```bash
git add src/render/types.ts src/render/html.ts src/render/build.ts src/bin/cli.ts src/render/__tests__/build.test.ts
git commit -m "feat(render): emit the site into a full siteDir (outDir -> siteDir)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Honor the var in the live `docs()` router

**Files:**
- Modify: `src/render/serve.ts:15-19` (the `catalogPath` default in `docs()`)
- Modify: `src/render/types.ts:9-14` (`DocsOptions.catalog` JSDoc)
- Test: `src/render/__tests__/serve.test.ts`

**Interfaces:**
- Consumes: `resolveSiteOutputDir()` from Task 1.
- Produces: `docs()` unchanged signature; its default catalog path becomes `join(resolveSiteOutputDir(), "catalog.json")`.

- [ ] **Step 1: Write the failing test**

In `src/render/__tests__/serve.test.ts`, extend the imports at the top:

```ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
```

Add a new `describe` block after the existing `docs() router` block:

```ts
describe("docs() default catalog honors THE_OWL_SITE_OUTPUT_DIR", () => {
  const KEY = "THE_OWL_SITE_OUTPUT_DIR";
  const original = process.env[KEY];
  let server: Server;

  afterEach(() => {
    if (original === undefined) delete process.env[KEY];
    else process.env[KEY] = original;
  });
  afterAll(() => server && new Promise<void>((r) => server.close(() => r())));

  it("serves catalog.json from the custom output dir when no catalog option is given", async () => {
    const outDir = mkdtempSync(join(tmpdir(), "owl-out-"));
    writeFileSync(join(outDir, "catalog.json"), JSON.stringify({ endpoints: [] }));
    process.env[KEY] = outDir; // absolute -> used as-is

    const bundleDir = mkdtempSync(join(tmpdir(), "owl-web-"));
    writeFileSync(join(bundleDir, "index.html"), "<html><head></head><body>d</body></html>");

    const app = express();
    app.use("/docs", docs({ bundleDir })); // no catalog option -> falls back to the resolver
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const port = (server.address() as AddressInfo).port;

    const res = await fetch(`http://127.0.0.1:${port}/docs/catalog.json`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ endpoints: [] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/render/__tests__/serve.test.ts`
Expected: FAIL — `docs()` still defaults to `<cwd>/docs/site/catalog.json`, so `/docs/catalog.json` returns 404, not 200.

- [ ] **Step 3: Wire `docs()` to the resolver**

In `src/render/serve.ts`, add the import near the other imports:

```ts
import { resolveSiteOutputDir } from "./output-dir";
```

Replace the `catalogPath` line (line ~19) inside `docs()`:

```ts
  const catalogPath = options.catalog ?? join(resolveSiteOutputDir(), "catalog.json");
```

- [ ] **Step 4: Update the `DocsOptions.catalog` JSDoc**

In `src/render/types.ts`, replace the `catalog` JSDoc (line 10):

```ts
  /** Path to catalog.json from `the-owl build`. Default:
   * `<THE_OWL_SITE_OUTPUT_DIR>/catalog.json` (i.e. `./docs/site/catalog.json`). */
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/render/__tests__/serve.test.ts && npm run typecheck`
Expected: PASS (existing `injectLiveFlag` + `docs() router` tests still green; new default-catalog test green).

- [ ] **Step 6: Commit**

```bash
git add src/render/serve.ts src/render/types.ts src/render/__tests__/serve.test.ts
git commit -m "feat(render): docs() default catalog honors THE_OWL_SITE_OUTPUT_DIR

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Document `THE_OWL_SITE_OUTPUT_DIR`

**Files:**
- Modify: `documentation/02-process-variables.md`

**Interfaces:** none (docs only).

- [ ] **Step 1: Add the var to the top bullet list**

In `documentation/02-process-variables.md`, add a bullet after the `THE_OWL_GROUPING_REGEX` line (line 12):

```markdown
* [THE_OWL_SITE_OUTPUT_DIR](#the-owl-site-output-dir)
```

- [ ] **Step 2: Add the documentation section**

Append this section to the end of `documentation/02-process-variables.md`:

```markdown
#### `THE_OWL_SITE_OUTPUT_DIR` <a name="the-owl-site-output-dir"></a>

_Read at `the-owl build` time and by the live `theOwl.docs()` router._

The **full** directory the static docs site is written to. When unset it defaults
to `docs/site`. Relative paths resolve against the current working directory;
absolute paths are used as-is. Unlike a parent directory, no `site/` subfolder is
appended — the value *is* the site directory.

```sh
# writes the built site to ./public/api-docs (open public/api-docs/index.html)
rimraf .owl public && CREATE_DOCS=true vitest run && THE_OWL_SITE_OUTPUT_DIR=public/api-docs the-owl build
```

The live `theOwl.docs()` router reads the same variable to locate `catalog.json`
by default, so a custom build location serves correctly without passing
`docs({ catalog })` explicitly. See [`examples/03-site-output-dir`](../examples/03-site-output-dir).
```

- [ ] **Step 3: Verify the anchor links render**

Run: `grep -n "the-owl-site-output-dir" documentation/02-process-variables.md`
Expected: two matches (the list link and the `<a name=...>` anchor).

- [ ] **Step 4: Commit**

```bash
git add documentation/02-process-variables.md
git commit -m "docs: document THE_OWL_SITE_OUTPUT_DIR process variable

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: New example `examples/03-site-output-dir`

A near-copy of `examples/01-minimal`; the only functional difference is the
`test:create-docs` script setting `THE_OWL_SITE_OUTPUT_DIR=public/api-docs`.

**Files:**
- Create: `examples/03-site-output-dir/package.json`
- Create: `examples/03-site-output-dir/vitest.config.ts`
- Create: `examples/03-site-output-dir/src/server.ts`
- Create: `examples/03-site-output-dir/test/helpers.ts`
- Create: `examples/03-site-output-dir/test/health.test.ts`
- Create: `examples/03-site-output-dir/test/users.test.ts`
- Create: `examples/03-site-output-dir/README.md`

**Interfaces:** none (standalone example package consuming `the-owl` via `file:../..`).

- [ ] **Step 1: Copy the unchanged files from `01-minimal` verbatim**

```bash
mkdir -p examples/03-site-output-dir/src examples/03-site-output-dir/test
cp examples/01-minimal/vitest.config.ts examples/03-site-output-dir/vitest.config.ts
cp examples/01-minimal/src/server.ts     examples/03-site-output-dir/src/server.ts
cp examples/01-minimal/test/helpers.ts   examples/03-site-output-dir/test/helpers.ts
cp examples/01-minimal/test/health.test.ts examples/03-site-output-dir/test/health.test.ts
cp examples/01-minimal/test/users.test.ts  examples/03-site-output-dir/test/users.test.ts
```

- [ ] **Step 2: Create `package.json`**

Create `examples/03-site-output-dir/package.json` (identical to `01-minimal` except `name` and the `test:create-docs` script):

```json
{
  "name": "site-output-dir",
  "version": "2.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "build:the-owl": "npm --prefix ../.. install && npm --prefix ../.. run build && pnpm install",
    "test": "vitest run",
    "pretest:create-docs": "pnpm run build:the-owl",
    "test:create-docs": "rimraf .owl public && CREATE_DOCS=true vitest run && THE_OWL_SITE_OUTPUT_DIR=public/api-docs the-owl build"
  },
  "devDependencies": {
    "the-owl": "file:../..",
    "express": "^5",
    "rimraf": "^6",
    "vitest": "^4"
  }
}
```

- [ ] **Step 3: Create `README.md`**

Create `examples/03-site-output-dir/README.md`:

```markdown
# site-output-dir

Same as [`01-minimal`](../01-minimal), but it writes the generated docs to a
custom directory using the `THE_OWL_SITE_OUTPUT_DIR` environment variable.

## What's different here?

Only the `test:create-docs` script. Instead of building into the default
`docs/site/`, it sets `THE_OWL_SITE_OUTPUT_DIR=public/api-docs`, so the static
site is written to `public/api-docs/` (open `public/api-docs/index.html`):

```sh
rimraf .owl public && CREATE_DOCS=true vitest run && THE_OWL_SITE_OUTPUT_DIR=public/api-docs the-owl build
```

`THE_OWL_SITE_OUTPUT_DIR` is the **full** output path — no `site/` subfolder is
appended. See [documentation/02-process-variables.md](../../documentation/02-process-variables.md#the-owl-site-output-dir).

## Prerequisite: build `the-owl` first

This example consumes `the-owl` as a local `file:../..` dependency, so the library
must be **built before** this example can resolve it. The `test:create-docs`
script handles this automatically via its `pretest:create-docs` hook. To do it
manually, from the repo root: `npm install && npm run build`, then in this folder:
`pnpm install`.

## How can I see docs being generated?

```sh
pnpm test:create-docs
```

This runs the tests with `CREATE_DOCS=true`, drains captured traffic into `.owl/`,
and runs `the-owl build` with `THE_OWL_SITE_OUTPUT_DIR=public/api-docs` to produce
the static site in `public/api-docs/`.
```

- [ ] **Step 4: Generate the docs to verify the example works end to end**

Run: `cd examples/03-site-output-dir && pnpm test:create-docs && cd ../..`
Expected: tests pass; the build prints `the-owl: docs built into <...>/public/api-docs ...`.
Verify: `test -f examples/03-site-output-dir/public/api-docs/index.html && test -f examples/03-site-output-dir/public/api-docs/catalog.json && echo OK`
Expected: `OK`. (Confirm nothing was written to `examples/03-site-output-dir/docs/`.)

- [ ] **Step 5: Commit the example (source + generated artifacts, matching `01-minimal`)**

```bash
git add examples/03-site-output-dir
git commit -m "docs(examples): add 03-site-output-dir demonstrating THE_OWL_SITE_OUTPUT_DIR

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all Vitest suites pass (including the new `output-dir`, updated `build`, and updated `serve` tests); `tsc --noEmit` is clean.

- [ ] **Step 2: Confirm no leftover `outDir` references in the render seam**

Run: `grep -rn "outDir" src`
Expected: no matches (the field and all call sites are renamed to `siteDir`).
