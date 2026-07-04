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
