# minimal

Minimal example showing how to set up `the-owl` with Express.js and the Vitest
test runner.

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

- **Step 1** — `theOwl.connect(app)` adds the capture middleware so
  request/response traffic can be observed.

In `test/health.test.ts` and `test/users.test.ts`:

- **Step 2** — spread `...owlHeaders()` (from `the-owl/vitest`) into a request's
  headers to mark it for capture. Any other headers you send show up in the docs;
  the-owl's own header is filtered out.
- **Step 3** — call `theOwl.save()` in `afterAll` to drain the captured Examples
  to `.owl/`.

## How can I see docs being generated?

```sh
pnpm test:create-docs
```

This runs the tests with `CREATE_DOCS=true`, drains captured traffic into
`.owl/`, and runs `the-owl build` to produce a static site in `docs/site/`
(open `docs/site/index.html`).
