# the-owl

Generate **interactive HTML API docs** from your functional tests.

`the-owl` watches the request/response traffic of your Express app while its
functional tests run, then turns that traffic into a browsable docs site — no
hand-written `.yml` or `@jsdoc` to keep in sync. You mark the requests you care
about, run your tests, and `the-owl build` renders the result.

## How it works

```
capture middleware → Collector → .owl/*.json → `the-owl build` → docs/site/
```

- **Connect** the capture middleware to your Express app.
- **Mark** the requests you want documented in your tests (per request, opt-in).
- **Run** your tests with `CREATE_DOCS=true`; each test process drains its
  captured **Examples** to `.owl/*.json`.
- **Build** the docs: `the-owl build` merges every `.owl/*.json` into a single
  **Catalog** and writes the site to `docs/site/`.

Each captured request/response pair is an **Example**. Examples sharing the same
`method + route` form an **Endpoint**; the merge of all Endpoints is the
**Catalog** the docs app renders.

## Install

```sh
npm install --save-dev the-owl
```

## Quickstart (Vitest)

This mirrors [`examples/01-minimal`](./examples/01-minimal).

**1. Connect the capture middleware** (`src/server.ts`):

```ts
import express, { type Express } from "express";
import theOwl from "the-owl";

export const createApp = (): Express => {
  const app = express();
  theOwl.connect(app); // capture middleware — mount before body parsers/routes
  app.use(express.json());

  app.get("/health", (_req, res) => res.status(200).send("OK"));
  app.get("/users", (_req, res) =>
    res.status(200).json([{ id: 1, name: "John" }, { id: 2, name: "Paul" }]));
  return app;
};
```

**2. Mark the requests you want documented and drain after the run**
(`test/health.test.ts`):

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import theOwl from "the-owl";
import { owlHeaders } from "the-owl/vitest";
import { startServer, stopServer } from "./helpers";

let server: Server;
let base: string;

beforeAll(async () => {
  ({ server, base } = await startServer());
});
afterAll(async () => {
  theOwl.save(); // drain this file's Examples to .owl/
  await stopServer(server);
});

describe("[get] /health", () => {
  it("(200) returns the application status", async () => {
    const res = await fetch(`${base}/health`, {
      headers: { "your-custom-header": "appears in the docs", ...owlHeaders() },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
  });
});
```

> **Opt-in is per request.** Only requests carrying `owlHeaders()` (the
> `x-test-name` header) are captured — attach it to the specific request you want
> documented, never to a shared request helper. The test's title becomes the
> **Example** name.

**3. Wire the pipeline in `package.json`:**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:create-docs": "rimraf .owl docs && CREATE_DOCS=true vitest run && the-owl build"
  }
}
```

`save()` only writes files when `CREATE_DOCS` is set, so your everyday `npm test`
(and watch mode) stays clean. Run `npm run test:create-docs` to generate the docs.

## Two delivery modes

Both modes read the same `the-owl build` output:

- **Static** — open or host the generated `docs/site/` directory directly
  (`docs/site/index.html` + assets).
- **Live route** — mount `theOwl.docs()` to serve the docs from your running app,
  e.g. only in staging:

```ts
import theOwl from "the-owl";

if (process.env.NODE_ENV === "staging") {
  app.use("/docs", theOwl.docs());
}
```

## Secret redaction

Captured traffic is sanitized before it touches disk. By default, sensitive
header values (`authorization`, `cookie`, `set-cookie`, `proxy-authorization`)
and body/query keys (`password`, `token`, `secret`, …) are masked with
`«redacted»` — the key is kept, the value is replaced. Customize via
`connect(app, options)`. See [the API docs](./documentation/01-api.md#redaction).

## Motivation

**Enforce functional-test development by earning something tangible from it.**

API contracts usually change in code while the documentation rots, because it
lives in a separate `.yml` or `@jsdoc` that developers forget to update. `the-owl`
was built on the idea that **all changes should be made in code** — write the
tests, get the docs.

## Documentation

Please see the [files in the `/documentation` directory](./documentation):

* [01. API](./documentation/01-api.md)
* [02. Process variables](./documentation/02-process-variables.md)

## Contributing

Please refer to [this](./contributing.md) document.
