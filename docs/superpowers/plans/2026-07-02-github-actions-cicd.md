# GitHub Actions CI/CD + v2.0.0 Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Travis CI with GitHub Actions that test the library + examples with coverage to Codecov, publish to npm on GitHub Release via Trusted Publishing (OIDC), and refresh contributing docs — enabling the v2.0.0 release.

**Architecture:** Two workflows — `ci.yml` (a `test` job for the library suite + Codecov upload, and an `examples` matrix job running each example's end-to-end doc pipeline) and `release.yml` (build + tag/version guard + `npm publish` via OIDC on `release: published`). Vitest gains v8 coverage. `contributing.md` is rewritten and renamed to `CONTRIBUTING.md`; `.travis.yml` is deleted.

**Tech Stack:** GitHub Actions, Node 24, npm (root) + pnpm/corepack (examples), Vitest 4 + `@vitest/coverage-v8`, tsup, Vite, Codecov, npm Trusted Publishing (OIDC).

## Global Constraints

- **Branch:** all work on `chore/github-actions-cicd` (never commit to `master`).
- **Node version:** `24` everywhere (matches `engines.node >= 24` and `.nvmrc`).
- **Root package manager:** npm (`package-lock.json`); **examples** package manager: pnpm (`pnpm-lock.yaml`, `the-owl: file:../..`).
- **Coverage report path:** `./coverage/lcov.info`.
- **Repo slug:** `leonardosarmentocastro/the-owl`; **default branch:** `master`; **package name:** `the-owl`.
- **`@vitest/coverage-v8` version must match the installed Vitest major** (Vitest is `^4.1.9`).
- **Publish auth:** npm Trusted Publishing (OIDC) — no `NODE_AUTH_TOKEN`; requires npm ≥ 11.5 in CI and `id-token: write` permission.
- **No commit signing / CI changes beyond what's listed.** Keep diffs focused.

---

### Task 1: Vitest coverage tooling

**Files:**
- Modify: `package.json` (add devDependency + `test:coverage` script)
- Modify: `vitest.config.ts` (add `test.coverage` config)

**Interfaces:**
- Produces: an `npm run test:coverage` script that writes `./coverage/lcov.info` (consumed by Task 2's `ci.yml`).

- [ ] **Step 1: Add the coverage dependency**

Run:
```bash
npm install -D @vitest/coverage-v8@^4.1.9
```
Expected: `package.json` gains `"@vitest/coverage-v8": "^4.1.9"` under `devDependencies` and `package-lock.json` updates. (If npm resolves a newer 4.x, that is fine — it must stay major `4` to match Vitest.)

- [ ] **Step 2: Add the `test:coverage` script**

In `package.json`, add to `"scripts"` (after the existing `"test:watch"` line):
```json
    "test:coverage": "vitest run --coverage",
```

- [ ] **Step 3: Add coverage config to `vitest.config.ts`**

Replace the entire file with:
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    // `@` → web/src so tests resolve shadcn/ui imports the same way the app build
    // does (web/vite.config.ts) and the typechecker does (tsconfig.json paths).
    alias: { "@": fileURLToPath(new URL("./web/src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "web/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["./web/src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**", "web/src/**"],
      exclude: [
        "**/__tests__/**",
        "**/__helpers__/**",
        "**/__fixtures__/**",
        "**/*.d.ts",
        "web/src/test-setup.ts",
      ],
    },
  },
});
```

- [ ] **Step 4: Run coverage and verify the lcov report is produced**

Run:
```bash
npm run test:coverage
```
Expected: tests PASS, a text coverage table prints, and the file `coverage/lcov.info` exists:
```bash
test -f coverage/lcov.info && echo "lcov OK"
```
Expected output: `lcov OK`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add v8 coverage reporting (test:coverage script + lcov)"
```

---

### Task 2: `ci.yml` workflow (library + examples)

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `npm run typecheck`, `npm run test:coverage` (Task 1), `npm run build`, and each example's `pnpm test` / `pnpm run test:create-docs`.
- Produces: a workflow named `CI` with jobs `test` and `examples` (referenced by the README CI badge in Task 4).

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/ci.yml` with:
```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  test:
    name: test + coverage
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v5
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  examples:
    name: example ${{ matrix.example }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        example: [01-minimal, 02-elaborate, 03-site-output-dir]
    env:
      COREPACK_ENABLE_DOWNLOAD_PROMPT: "0"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: corepack enable
      - run: npm ci
      - run: npm run build
      - name: Install example deps
        working-directory: examples/${{ matrix.example }}
        run: pnpm install
      - name: Run example tests
        working-directory: examples/${{ matrix.example }}
        run: pnpm test
      - name: Run example doc pipeline (end-to-end)
        working-directory: examples/${{ matrix.example }}
        run: pnpm run test:create-docs
```

- [ ] **Step 2: Validate the YAML parses**

Run:
```bash
grep -q "name: CI" .github/workflows/ci.yml && echo "ci.yml present"
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('YAML OK')"
```
Expected: `ci.yml present` then `YAML OK`. (If `python3`/`yaml` is unavailable, skip the second line — GitHub validates on push.)

- [ ] **Step 3: Locally rehearse the library job commands**

Run (mirrors the `test` job):
```bash
npm run typecheck && npm run test:coverage && test -f coverage/lcov.info && echo "test job OK"
```
Expected: ends with `test job OK`.

- [ ] **Step 4: Locally rehearse one example leg end-to-end**

Run (mirrors an `examples` matrix leg; `03` validates the output dir):
```bash
npm run build && (cd examples/03-site-output-dir && pnpm install && pnpm test && pnpm run test:create-docs) && echo "example leg OK"
```
Expected: ends with `example leg OK`. If `corepack`/`pnpm` is not enabled locally, run `corepack enable` first.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions CI (library coverage + examples matrix)"
```

---

### Task 3: `release.yml` workflow (npm publish via OIDC)

**Files:**
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: `npm run typecheck`, `npm test`, `npm run build`, `package.json` version.
- Produces: a workflow that publishes `the-owl` to npm on `release: published` with a tag/version guard.

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/release.yml` with:
```yaml
name: Release

on:
  release:
    types: [published]

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    name: publish to npm
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          registry-url: https://registry.npmjs.org
          cache: npm
      # Trusted Publishing (OIDC) requires npm >= 11.5.
      - run: npm install -g npm@latest
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - name: Verify release tag matches package.json version
        run: |
          TAG="${GITHUB_REF_NAME#v}"
          PKG="$(node -p "require('./package.json').version")"
          echo "release tag: $TAG | package.json: $PKG"
          if [ "$TAG" != "$PKG" ]; then
            echo "::error::Release tag ($TAG) does not match package.json version ($PKG)"
            exit 1
          fi
      # OIDC provides auth + provenance automatically; no NODE_AUTH_TOKEN.
      - run: npm publish
```

- [ ] **Step 2: Validate the YAML parses**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml')); print('YAML OK')"
```
Expected: `YAML OK`. (Skip if `python3`/`yaml` unavailable — GitHub validates on push.)

- [ ] **Step 3: Rehearse the tag/version guard logic locally**

Run (simulates the guard for a matching `v2.0.0` tag):
```bash
GITHUB_REF_NAME=v2.0.0; TAG="${GITHUB_REF_NAME#v}"; PKG="$(node -p "require('./package.json').version")"; [ "$TAG" = "$PKG" ] && echo "guard passes for v2.0.0" || echo "guard would FAIL ($TAG vs $PKG)"
```
Expected: `guard passes for v2.0.0` (since `package.json` is `2.0.0`).

Then simulate a mismatch to confirm the guard would block it:
```bash
GITHUB_REF_NAME=v1.9.9; TAG="${GITHUB_REF_NAME#v}"; PKG="$(node -p "require('./package.json').version")"; [ "$TAG" = "$PKG" ] && echo "unexpectedly passed" || echo "guard correctly blocks v1.9.9"
```
Expected: `guard correctly blocks v1.9.9`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: publish to npm on release via Trusted Publishing (OIDC)"
```

---

### Task 4: README badges

**Files:**
- Modify: `README.md` (add badge row below the logo lockup)

**Interfaces:**
- Consumes: workflow `ci.yml` (Task 2) for the CI badge; Codecov + npm for the others.

- [ ] **Step 1: Insert the badge row**

In `README.md`, immediately after the logo lockup block (the `</p>` that closes the opening `<p align="center">…</picture>…</p>`, currently line 7) and before `# the-owl`, insert a blank line then:
```markdown
<p align="center">
  <a href="https://github.com/leonardosarmentocastro/the-owl/actions/workflows/ci.yml"><img src="https://github.com/leonardosarmentocastro/the-owl/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <a href="https://codecov.io/gh/leonardosarmentocastro/the-owl"><img src="https://codecov.io/gh/leonardosarmentocastro/the-owl/branch/master/graph/badge.svg" alt="coverage" /></a>
  <a href="https://www.npmjs.com/package/the-owl"><img src="https://img.shields.io/npm/v/the-owl" alt="npm version" /></a>
</p>
```

- [ ] **Step 2: Verify the badge block is present and well-formed**

Run:
```bash
grep -c "actions/workflows/ci.yml/badge.svg\|codecov.io/gh/leonardosarmentocastro/the-owl/branch/master/graph/badge.svg\|img.shields.io/npm/v/the-owl" README.md
```
Expected: `3`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add CI, coverage, and npm version badges to README"
```

---

### Task 5: Rewrite and rename `contributing.md` → `CONTRIBUTING.md`

**Files:**
- Create: `CONTRIBUTING.md`
- Delete: `contributing.md`
- Modify: `README.md` (update the Contributing link)
- Modify: `.npmignore` (rename the entry)

**Interfaces:**
- Consumes: the release process defined by Task 3 (documented in the "Release process" section).

- [ ] **Step 1: Create `CONTRIBUTING.md` with the rewritten content**

Create `CONTRIBUTING.md` with:
```markdown
# Contributing

Thanks for contributing to **`the-owl`**!

This guide covers how to develop, test, and release the library. For the
architecture (the `capture → drain → catalog → render` pipeline) and the domain
vocabulary (Example, Endpoint, Catalog, Collector, Renderer), read
[AGENTS.md](./AGENTS.md) and [CONTEXT.md](./CONTEXT.md) — they are not repeated
here.

## Getting started

`the-owl` is written in TypeScript. You need **Node ≥ 24** (see `.nvmrc`).

```sh
npm install
```

The library is built with [tsup](https://tsup.egoist.dev/) (dual CJS/ESM in
`dist/`); the docs web app lives in `web/` and is built with
[Vite](https://vitejs.dev/).

## Developing & testing

Tests use [Vitest](https://vitest.dev/) and are co-located in each domain's
`__tests__/` folder (there is no top-level `test/` directory).

```sh
npm test            # run the whole suite once
npm run test:watch  # watch mode
npm run typecheck   # tsc --noEmit
npm run test:coverage  # run with v8 coverage → ./coverage/lcov.info
npm run build       # tsup (library) + Vite (web bundle)
```

## Working with the examples

The [`examples/`](./examples) projects use **pnpm** and depend on the library
via `the-owl: file:../..`, so they exercise the real published surface. After
changing `src/`, rebuild and relink the library before running an example:

```sh
cd examples/01-minimal
pnpm run build:the-owl      # builds the root package and relinks it here
pnpm test                   # the example's own tests
pnpm run test:create-docs   # full pipeline: capture → build → the-owl build
```

`test:create-docs` is the end-to-end check — it runs the capture, drains to
`.owl/`, and renders the docs site via the `the-owl build` CLI. The examples
also cover process variables end-to-end (e.g. `03-site-output-dir` exercises
`THE_OWL_SITE_OUTPUT_DIR`, `02-elaborate` exercises `THE_OWL_GROUPING_REGEX`).

## Workflow conventions

**Never commit directly to `master`.** Branch first, using a
conventional-commit-style prefix: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`,
`docs/<slug>`, `refactor/<slug>`, `test/<slug>`. Open a pull request; CI runs the
library suite (with coverage) and every example's pipeline before merge.

## Release process

Releases are published to npm automatically by GitHub Actions
([`.github/workflows/release.yml`](./.github/workflows/release.yml)) using npm
**Trusted Publishing** (OIDC) — there is no npm token stored in the repo, and
provenance is attached automatically.

To cut a release:

1. Bump `version` in `package.json` (semver) on a branch and open a PR.
2. After it merges to `master`, create a **GitHub Release** with a tag matching
   the version, prefixed with `v` (e.g. `v2.0.0`).
3. The `Release` workflow builds, runs the tests, verifies the tag matches
   `package.json`, and runs `npm publish`.

If the release tag and `package.json` version disagree, the workflow fails
before publishing.

## Open ideas

- **Add a linter.** The project has no linter yet;
  [`xo`](https://github.com/xojs/xo) or a flat-config ESLint setup would be a
  welcome addition.
```

- [ ] **Step 2: Delete the old file**

```bash
git rm contributing.md
```

- [ ] **Step 3: Update the README Contributing link**

In `README.md`, change the Contributing section link from `./contributing.md` to `./CONTRIBUTING.md`:
```markdown
Please refer to [this](./CONTRIBUTING.md) document.
```

- [ ] **Step 4: Update the `.npmignore` entry**

In `.npmignore`, change the line `contributing.md` to `CONTRIBUTING.md`.

- [ ] **Step 5: Verify the rename is consistent**

Run:
```bash
test -f CONTRIBUTING.md && test ! -f contributing.md && echo "renamed OK"
grep -q "./CONTRIBUTING.md" README.md && echo "README link OK"
grep -q "^CONTRIBUTING.md$" .npmignore && echo "npmignore OK"
```
Expected: `renamed OK`, `README link OK`, `npmignore OK`.

- [ ] **Step 6: Commit**

```bash
git add CONTRIBUTING.md README.md .npmignore
git commit -m "docs: rewrite contributing guide and rename to CONTRIBUTING.md"
```

---

### Task 6: Retire Travis

**Files:**
- Delete: `.travis.yml`
- Modify: `.npmignore` (drop the `.travis.yml` line)

**Interfaces:** none (removal only).

- [ ] **Step 1: Delete the Travis config**

```bash
git rm .travis.yml
```

- [ ] **Step 2: Drop the `.travis.yml` entry from `.npmignore`**

In `.npmignore`, remove the line `.travis.yml`.

- [ ] **Step 3: Verify Travis is fully gone**

Run:
```bash
test ! -f .travis.yml && ! grep -q "travis" .npmignore && echo "travis retired"
```
Expected: `travis retired`.

- [ ] **Step 4: Commit**

```bash
git add .travis.yml .npmignore
git commit -m "chore: retire Travis CI (.travis.yml)"
```

---

### Task 7: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full local suite green**

Run:
```bash
npm run typecheck && npm run test:coverage && echo "suite OK"
```
Expected: ends with `suite OK`.

- [ ] **Step 2: All three example legs green**

Run:
```bash
corepack enable
npm run build
for ex in 01-minimal 02-elaborate 03-site-output-dir; do
  echo "== $ex =="
  (cd "examples/$ex" && pnpm install && pnpm test && pnpm run test:create-docs) || { echo "FAILED: $ex"; break; }
done
echo "examples done"
```
Expected: each example ends its section without `FAILED:`, then `examples done`.

- [ ] **Step 3: Confirm workflows and docs are in place**

Run:
```bash
test -f .github/workflows/ci.yml && test -f .github/workflows/release.yml && test -f CONTRIBUTING.md && test ! -f .travis.yml && test ! -f contributing.md && echo "all artifacts OK"
```
Expected: `all artifacts OK`.

---

## Manual setup (maintainer, outside the repo)

These must be done for the workflows to succeed but are **not** code changes in this plan. Note them in the PR description:

1. **Codecov:** add `leonardosarmentocastro/the-owl` on codecov.io and set a `CODECOV_TOKEN` repository secret (required even for public repos; the `test` job passes it to `codecov-action`).
2. **npm Trusted Publishing:** on npmjs.com, configure `the-owl`'s trusted publisher to point at the `leonardosarmentocastro/the-owl` repository and the `.github/workflows/release.yml` workflow.

## Releasing v2.0.0 (after merge to `master`)

1. Confirm `package.json` is at `2.0.0` (already true).
2. Create a GitHub Release with tag `v2.0.0`.
3. `release.yml` runs, the tag/version guard passes, and `the-owl@2.0.0` publishes to npm with provenance.
