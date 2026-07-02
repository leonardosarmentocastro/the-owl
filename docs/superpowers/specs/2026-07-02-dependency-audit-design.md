# Dependency Audit & Hardening — Design

**Date:** 2026-07-02
**Branch:** `chore/dependency-audit`
**Status:** Approved

## Context

`the-owl` reached a feature-stable version. The project began in 2019 and
accumulated dependabot pull requests over the years; the maintainer closed those
PRs manually (without accepting their suggestions) during the recent
modernization. The dependency tree is now already in good shape — this audit
confirms that, applies the remaining safe updates, and institutes automated
governance so the tree does not drift again.

### Starting state (verified 2026-07-02)

- **`npm audit` (root):** 1 low-severity advisory — esbuild
  `GHSA-g7r4-m6w7-qqqr` (arbitrary file read via the dev server, Windows only).
  esbuild is a transitive dev dependency (via vite/tsup); it does not affect the
  shipped library.
- **`npm outdated` (root):** 4 minor/patch bumps available —
  - `vite` 8.0.16 → 8.1.3
  - `@vitejs/plugin-react` 6.0.2 → 6.0.3
  - `lucide-react` 1.22.0 → 1.23.0
  - `@types/node` 25.9.3 → 26.1.0
- All dependencies already sit on current majors (React 19, Vite 8, TypeScript 6,
  Vitest 4, Express 5, Node ≥24).
- **No `.github/dependabot.yml`** exists; **no open PRs**.
- **Example lockfiles are inconsistent:** `examples/01-minimal` and
  `examples/02-elaborate` carry both `package-lock.json` and `pnpm-lock.yaml`;
  `examples/03-site-output-dir` carries only `pnpm-lock.yaml`. Every example's
  `build:the-owl` script uses `pnpm install`.

## Goals

Bring the tree fully current on **safe (minor/patch) updates only**, close the
low-severity vuln, standardize example lockfiles, add dependabot governance, and
prove that the library and all three examples still work end-to-end. **No
major-version chasing.**

## Non-goals

- Major-version upgrades of any dependency.
- Refactoring library or example source beyond what a dependency bump requires.
- Changing the examples' package manager choice (they use pnpm; that stays).

## Work items

### A. Root library updates

1. Bump in root `package.json` and refresh `package-lock.json`:
   - `vite` → 8.1.3
   - `@vitejs/plugin-react` → 6.0.3
   - `lucide-react` → 1.23.0
   - `@types/node` → 26.1.0
2. Run `npm audit fix` to resolve esbuild `GHSA-g7r4-m6w7-qqqr`. The vite 8.1.3
   bump likely already pulls a patched esbuild transitively; do not force
   anything beyond `npm audit fix`. Confirm `npm audit` reports 0 vulnerabilities
   afterward.

### B. Example lockfile reconciliation — standardize on pnpm

- Delete the stray `package-lock.json` from `examples/01-minimal` and
  `examples/02-elaborate`.
- Keep `pnpm-lock.yaml` in all three examples.
- No script changes needed — the scripts already call `pnpm install`.

### C. Dependabot governance — new `.github/dependabot.yml`

- `version: 2`, `npm` ecosystem.
- One `updates` entry per directory: `/`, `/examples/01-minimal`,
  `/examples/02-elaborate`, `/examples/03-site-output-dir`.
- Each entry: `schedule.interval: weekly`, an `open-pull-requests-limit` to cap
  noise, and a `groups` block that folds **minor + patch** updates into a single
  grouped PR (`update-types: ["minor", "patch"]`). Major updates flow as
  individual PRs so risky changes are reviewed in isolation.

## Verification — the "core functionalities still work" gate

Run in order; any failure stops the work for diagnosis (no forcing through
breakage):

1. Root `npm run typecheck` — passes.
2. Root `npm test` (full Vitest suite) — passes.
3. Root `npm run build` (tsup lib + Vite web bundle) — succeeds.
4. For each example, run its `test:create-docs` flow, which rebuilds the-owl,
   runs the example's Vitest suite with `CREATE_DOCS=true`, then runs
   `the-owl build`. Confirm the docs artifact is generated:
   - `examples/01-minimal` → `docs/`
   - `examples/02-elaborate` → `docs/` (with `THE_OWL_GROUPING_REGEX`)
   - `examples/03-site-output-dir` → `public/api-docs/`
   This exercises the real capture → drain → catalog → render pipeline.
5. Final root `npm audit` — 0 vulnerabilities.

## Deliverables

- Updated root `package.json` + `package-lock.json`.
- Cleaned example lockfiles (pnpm only).
- New `.github/dependabot.yml`.
- An audit summary (before/after vuln + outdated state and verification results)
  in the PR description.

## Workflow

All changes land on `chore/dependency-audit`, never on `master` (per AGENTS.md).
