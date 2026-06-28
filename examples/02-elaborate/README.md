# elaborate

A slightly richer example showing how to set up `the-owl` with Express.js and
the Vitest test runner. On top of [`01-minimal`](../01-minimal), it demonstrates
a route with a path param (`/users/:id`), a `404` case, that **unmarked** requests
are ignored, and serving the docs live via `theOwl.docs()`.

## Prerequisite: build `the-owl` first

This example consumes `the-owl` as a local `file:../..` dependency. The package
only publishes its compiled `dist/` (see the root `package.json` `files` field),
so the library must be **built before** this example can resolve it. If you skip
this, you'll see `Failed to resolve entry for package "the-owl"`.

The `test:create-docs` script handles this automatically via its
`pretest:create-docs` hook (it installs + builds the root package, then re-syncs
this example's copy). To do it manually:

```sh
# from the repo root
npm install && npm run build

# then, in this folder
pnpm install
```

## Where should I look?

In `src/server.ts`:

- `theOwl.connect(app)` adds the capture middleware (**Step 1**).
- Two routes are defined: `/users` and `/users/:id` (the latter returns `404`
  for unknown ids).
- When `OWL_DOCS` is set, `app.use("/docs", theOwl.docs())` serves the docs live.

In `test/users.test.ts`:

- An **unmarked** warm-up call to `/users` (no `owlHeaders()`) demonstrates that
  only requests carrying `...owlHeaders()` are captured (**Step 2**).
- Both the `200` and `404` paths of `/users/:id` are marked and documented.
- `theOwl.save()` runs in `afterAll` to drain captured Examples to `.owl/`
  (**Step 3**).

## How can I see docs being generated?

```sh
pnpm test:create-docs
```

This runs the tests with `CREATE_DOCS=true`, drains captured traffic into
`.owl/`, and runs `the-owl build` to produce a static site in `docs/site/`
(open `docs/site/index.html`).

## Trying endpoints live

When the docs are served via `theOwl.docs()` (set `OWL_DOCS=1`), each Example is
interactive: expand it, edit the path params / query / headers / body, and click
**Try it out** to fire a real same-origin request and see the live response. The
captured owl test header is dropped automatically, and any redacted value is
shown as an empty field you must fill before firing. The static `docs/site` build
(opened from `file://`) stays read-only — there is no server to call.
