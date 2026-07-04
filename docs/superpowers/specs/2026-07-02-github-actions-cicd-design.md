# Migrate CI/CD to GitHub Actions + v2.0.0 npm release

**Date:** 2026-07-02
**Branch:** `chore/github-actions-cicd`
**Status:** Design approved, pending spec review

## Goal

Retire Travis CI (`.travis.yml`) and replace it with GitHub Actions that:

1. Run the library test suite and generate coverage reports consumed by
   **Codecov** (for README coverage badges) on every push and pull request.
2. Also run the `examples/` test suites and full doc-build pipelines in CI, so
   the end-to-end behaviour they exercise (e.g. `03-site-output-dir` validating
   `THE_OWL_SITE_OUTPUT_DIR`, `02-elaborate` validating `THE_OWL_GROUPING_REGEX`)
   is protected against regressions.
3. Publish the package to the npm registry when a **GitHub Release is
   published**, authenticated via npm **Trusted Publishing (OIDC)** — no
   long-lived token stored in the repo, provenance attached automatically.
4. Fully rewrite `contributing.md` for the current TypeScript/Vitest/tsup
   architecture and rename it to `CONTRIBUTING.md`, dropping the obsolete topics
   list (including the "Minify deployed code" topic).

The first published release will be **v2.0.0** (last released tag: `v1.1.1`;
`package.json` is already at `2.0.0`).

## Context / current state

- `package.json` is already modernized: `version: 2.0.0`, `type: module`,
  `engines.node >= 24`, dual CJS/ESM build via **tsup**, web bundle via **Vite**,
  tests via **Vitest**. Publish surface is `dist/` (`files: ["dist"]`).
- **No coverage tooling exists** — the old `.travis.yml` referenced a
  `test:coverage` script that is not present, and Vitest has no coverage config.
- **No README coverage badge exists today** — this adds it.
- `.github/` already contains `dependabot.yml`; there are no workflows yet.
- Examples use **pnpm** (`pnpm-lock.yaml`) with `the-owl: file:../..`. Each has a
  `build:the-owl` script (`npm --prefix ../.. install && npm --prefix ../.. run
  build && pnpm install`) run via the `pretest:create-docs` hook, so
  `test:create-docs` bootstraps the whole pipeline: build root → install example
  against the freshly built `dist/` → `CREATE_DOCS=true vitest run` →
  `the-owl build`.
- The current `contributing.md` describes the old pure-JS/symlink world and lists
  topics that are now obsolete (docs/api relocation, delete-docs-before-generate,
  semantic renames, configure-chalk — no `chalk` in the codebase, cURL-via-`exec`).
  Only "Add linter" survives as a genuine open idea (no linter configured today).

## Design decisions (locked)

| Decision | Choice | Rationale |
| --- | --- | --- |
| Coverage badge source | **Codecov** (external service) | Matches prior Travis setup; live badge + PR coverage comments. |
| Examples in CI | **Yes** — matrix over all three | They carry important end-to-end coverage (output dir, grouping regex). |
| npm auth | **Trusted Publishing (OIDC)** | No stored token to rotate; automatic provenance; modern npm default. |
| Publish trigger | **`release: published`** | Matches "deploy when a new release is created". |
| Workflow layout | **Two workflows** (`ci.yml`, `release.yml`) | Keeps the publish path off every commit; CI badge reflects test health only. |
| "Minify deployed code" topic | **Drop as obsolete** | Minifying library JS harms consumer stack traces for little gain; Vite web bundle is already production-minified; `dist` already trimmed. |
| contributing.md | **Full rewrite + rename to `CONTRIBUTING.md`** | Old content no longer matches the architecture; GitHub-standard filename. |
| Node version | **24** (single, the `engines`/`.nvmrc` floor) | Testing the supported floor is what matters for a library; a matrix can be added later. |

## Changes

### 1. Coverage tooling

- Add dev dependency `@vitest/coverage-v8` (matched to the installed Vitest 4.x).
- Add script to `package.json`: `"test:coverage": "vitest run --coverage"`.
- Configure coverage in `vitest.config.ts`:
  - `provider: "v8"`
  - `reporter: ["text", "lcov"]` (text for CI logs, lcov for Codecov)
  - `reportsDirectory: "./coverage"`
  - `include: ["src/**", "web/src/**"]`
  - `exclude`: `**/__tests__/**`, `**/__helpers__/**`, `**/__fixtures__/**`,
    `**/*.d.ts`, config files, and the web `test-setup.ts`.
- `coverage/` is already ignored in both `.gitignore` and `.npmignore` — no
  change needed.

### 2. `.github/workflows/ci.yml`

Triggers: `push` and `pull_request`.

**Job `test`** (library suite + coverage):
- `actions/checkout@v4`
- `actions/setup-node@v4` with `node-version: 24`, `cache: npm`
- `npm ci`
- `npm run typecheck`
- `npm run test:coverage`
- `codecov/codecov-action@v5` with `token: ${{ secrets.CODECOV_TOKEN }}` and
  `files: ./coverage/lcov.info`

**Job `examples`** (end-to-end pipelines):
- `strategy.matrix.example: [01-minimal, 02-elaborate, 03-site-output-dir]`
- `actions/checkout@v4`
- `actions/setup-node@v4` with `node-version: 24`
- Enable pnpm via `corepack enable` (pnpm is the examples' package manager)
- `npm ci` then `npm run build` at repo root (produces `dist/` the examples link
  against via `file:../..`)
- In `examples/${{ matrix.example }}`: `pnpm install`, then `pnpm test`, then
  `pnpm run test:create-docs`
  - Note: `test:create-docs`'s `pretest` hook re-runs the root build; this
    redundant rebuild is harmless and keeps the step aligned with the documented
    contributor command.

### 3. `.github/workflows/release.yml`

Trigger: `release: { types: [published] }`.

Permissions: `contents: read`, `id-token: write` (OIDC token for Trusted
Publishing).

Single job:
- `actions/checkout@v4`
- `actions/setup-node@v4` with `node-version: 24`,
  `registry-url: https://registry.npmjs.org`
- `npm install -g npm@latest` (Trusted Publishing requires npm ≥ 11.5)
- `npm ci`
- `npm run typecheck`
- `npm test`
- `npm run build`
- **Tag/version guard:** fail the job if the release tag does not match
  `package.json`'s version (compare `${{ github.event.release.tag_name }}`
  stripped of a leading `v` against `node -p "require('./package.json').version"`).
  Prevents publishing a mismatched version.
- `npm publish` (OIDC provides auth and provenance automatically; no
  `NODE_AUTH_TOKEN`).

### 4. README badges

Add a badge row near the top (below the lockup / title): **CI status**
(`ci.yml`), **Codecov coverage**, and **npm version**. Use the standard
shields.io / Codecov / GitHub Actions badge URLs for
`leonardosarmentocastro/the-owl`.

### 5. `CONTRIBUTING.md` (full rewrite + rename)

Rename `contributing.md` → `CONTRIBUTING.md`. New content:

- **Intro** — thanks + pointer to `AGENTS.md` and `CONTEXT.md` for architecture
  and domain vocabulary (do not duplicate them).
- **Getting started** — Node ≥ 24, `npm install`; the project is TypeScript built
  with tsup (library) and Vite (web app).
- **Developing & testing** — `npm test` (Vitest), `npm run test:watch`,
  `npm run typecheck`, `npm run test:coverage`; tests are co-located in
  `<domain>/__tests__/`.
- **Working with the examples** — examples use pnpm and depend on the-owl via
  `file:../..`; run `pnpm run build:the-owl` to relink after `src/` changes, and
  `pnpm run test:create-docs` to exercise the full doc pipeline.
- **Workflow conventions** — branch-first (never commit to `master`),
  conventional-commit branch prefixes (from `AGENTS.md`).
- **Release process** — bump `package.json` version → open a PR → after merge,
  create a GitHub Release with tag `vX.Y.Z` → the `release.yml` workflow publishes
  to npm via Trusted Publishing.
- **Open ideas** — a lean list; keep only "Add a linter" (e.g. try
  [`xo`](https://github.com/xojs/xo) or ESLint). Drop all other legacy topics.

Update the README "Contributing" link from `./contributing.md` to
`./CONTRIBUTING.md`.

### 6. Housekeeping / retirement

- Delete `.travis.yml`.
- Update `.npmignore`: drop the `.travis.yml` line; change `contributing.md` to
  `CONTRIBUTING.md`. (Note: `files: ["dist"]` already whitelists the publish
  surface, so `.npmignore` is largely redundant — this is consistency-only.)

## Manual setup (performed outside the repo, by the maintainer)

These are prerequisites for the workflows to succeed; document them in the PR:

1. **Codecov:** add the repository on codecov.io and set a `CODECOV_TOKEN`
   repository secret (Codecov requires the token even for public repos).
2. **npm Trusted Publishing:** on npmjs.com, configure `the-owl`'s trusted
   publisher to the `leonardosarmentocastro/the-owl` repo and the `release.yml`
   workflow.

## Release of v2.0.0 (manual, after merge)

After this branch merges to `master`:

1. Confirm `package.json` is at `2.0.0` (already true).
2. Create a GitHub Release with tag `v2.0.0`.
3. The `release.yml` workflow runs and publishes `the-owl@2.0.0` to npm.

## Out of scope

- Enabling tsup minification (topic intentionally dropped).
- Adding a linter (kept only as a documented "open idea").
- A multi-Node test matrix (single Node 24 for now).
- Publishing the docs site anywhere (only the npm package is published).

## Verification

- CI: open a PR from this branch; `test` and all three `examples` matrix legs
  pass; Codecov receives the report and the PR shows a coverage status.
- Release (post-merge): the `v2.0.0` release triggers `release.yml`, the
  tag/version guard passes, and `the-owl@2.0.0` appears on npm with provenance.
