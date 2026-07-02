# elaborate

A slightly richer example showing how to set up `the-owl` with Express.js and
the Vitest test runner. On top of [`01-minimal`](../01-minimal), it demonstrates
a route with a path param (`/users/:id`), a `404` case, that **unmarked** requests
are ignored, versioned APIs grouped in the sidebar via `THE_OWL_GROUPING_REGEX`,
and serving the docs live via `theOwl.docs()`.

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
- Routes are defined: `/users`, `/users/:id` (returns `404` for unknown ids),
  and two versioned APIs, `/api/v1/users` and `/api/v2/users`.
- When `THE_OWL_DOCS` is set, `app.use("/docs", theOwl.docs())` serves the docs live.

In `test/users.test.ts` and `test/api-versions.test.ts`:

- An **unmarked** warm-up call to `/users` (no `owlHeaders()`) demonstrates that
  only requests carrying `...owlHeaders()` are captured (**Step 2**).
- Both the `200` and `404` paths of `/users/:id`, and the two versioned
  `/api/vN/users` routes, are marked and documented.
- `theOwl.save()` runs in `afterAll` to drain captured Examples to `.owl/`
  (**Step 3**).

## Grouping the sidebar by resource

By default the docs sidebar groups Endpoints by their first path segment, so
`/users` and `/users/:id` sit under **Users**. To group by a segment further
down the path, set `THE_OWL_GROUPING_REGEX` when building — it strips the
longest matching leading prefix before grouping. This example's
`test:create-docs` script sets `THE_OWL_GROUPING_REGEX=^/api$`, so `/api` is
stripped and `/api/v1/users` and `/api/v2/users` group under **V1** and **V2**
(each holding a `/users` endpoint). Use `^/api/v[1-9]\d*$` instead to strip the
version too and merge both under **Users**.

## How can I see docs being generated?

```sh
pnpm test:create-docs
```

This runs the tests with `CREATE_DOCS=true`, drains captured traffic into
`.owl/`, and runs `the-owl build` to produce a static site in `docs/site/`
(open `docs/site/index.html`).

## Trying endpoints live

When the docs are served via `theOwl.docs()` (set `THE_OWL_DOCS=1`), each Example is
interactive: expand it, edit the path params / query / headers / body, and click
**Try it out** to fire a real same-origin request and see the live response. The
captured owl test header is dropped automatically, and any redacted value is
shown as an empty field you must fill before firing. The static `docs/site` build
(opened from `file://`) stays read-only — there is no server to call.

To browse the live docs yourself, first generate the catalog (once), then start
the app:

```sh
pnpm test:create-docs   # generates docs/site/catalog.json (and builds the-owl)
pnpm start              # serves the app with THE_OWL_DOCS=1
```

Then open <http://localhost:3000/docs> (set `PORT` to use a different port).
`pnpm start` runs `src/start.ts` directly — Node ≥ 22.6 strips the TypeScript
types, so no extra tooling is needed.

Every Example also has a **Copy as cURL** button — including in the static
`docs/site` build, which has no server to fire against. The command's base URL
comes from `THE_OWL_DOCS_HOST` (set it when generating: `THE_OWL_DOCS_HOST=https://api.example.com pnpm test:create-docs`),
defaulting to `http://localhost:3000`. Any redacted or empty value shows as
`<CHANGE_ME:name>` to flag what you must replace before running it.
