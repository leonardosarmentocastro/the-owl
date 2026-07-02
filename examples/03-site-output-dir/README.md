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
