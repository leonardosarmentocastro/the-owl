# site-output-dir

Same as [`01-minimal`](../01-minimal), but it writes the generated docs to a
custom directory using the `THE_OWL_SITE_OUTPUT_DIR` environment variable — and
it also serves those same docs live through Express at `/docs`.

## What's different here?

1. **Custom build location.** The `test:create-docs` script sets
   `THE_OWL_SITE_OUTPUT_DIR=public/api-docs`, so instead of the default
   `docs/site/` the static site is written to `public/api-docs/`:

```sh
rimraf .owl public && CREATE_DOCS=true vitest run && THE_OWL_SITE_OUTPUT_DIR=public/api-docs the-owl build
```

2. **Live docs from that same location.** `src/server.ts` always mounts
   `app.use("/docs", theOwl.docs())`. The live router reads
   `THE_OWL_SITE_OUTPUT_DIR` to find `catalog.json`, so the `start` script sets
   the **same** value used at build time — no `docs({ catalog })` argument needed.

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

## Serving the docs live through Express

Once the catalog exists in `public/api-docs/`, start the app to browse the
interactive docs at `/docs`:

```sh
pnpm test:create-docs   # generates public/api-docs/catalog.json (and builds the-owl)
pnpm start              # serves the app at http://localhost:3000
```

Then open <http://localhost:3000/docs> (set `PORT` to use a different port).
Unlike [`02-elaborate`](../02-elaborate), there is no `THE_OWL_DOCS` gate — this
example always serves `/docs`.

The key detail: the docs were built to a **custom** directory, so the live
`theOwl.docs()` router must read `catalog.json` from that same place. The `start`
script sets `THE_OWL_SITE_OUTPUT_DIR=public/api-docs` — the identical value used
at build time — and `docs()` picks it up automatically, so nothing has to be
passed to `docs()` in `src/server.ts`. In the live view each Example is
interactive: expand it, edit params, and click **Try it out** to fire a real
same-origin request.
