### API (exposed methods)

Install the library as a dev dependency and import it in your server and test code:

```sh
$ npm install --save-dev the-owl
```

```ts
import theOwl from "the-owl";
import { owlHeaders } from "the-owl/vitest";
```

`the-owl` watches request/response traffic during your functional tests and turns
it into an interactive HTML **Catalog**. The flow is:

```
capture middleware → Collector → .owl/*.json → `the-owl build` → docs/site/
```

Each captured request/response pair is an **Example**. Examples that share the
same `method + route` form an **Endpoint**. The merge of every Endpoint is the
**Catalog** rendered by the docs app.

* [connect(app, options?)](#connect)
* [owlHeaders()](#owl-headers) — `the-owl/vitest`
* [buildHeaders(testName)](#build-headers)
* [save()](#save) (`createDocs()` is a deprecated alias)
* [the-owl build](#build-cli)
* [docs(options?)](#docs)
* [Default secret redaction](#redaction)

#### `connect(app, options?)` <a name="connect"></a>

Attaches the capture middleware to your Express application. Mount it before your
body parsers and routes so request bodies and the matched route template are
available when traffic is captured.

```ts
import express from "express";
import theOwl from "the-owl";

const app = express();
theOwl.connect(app); // capture middleware
app.use(express.json());

app.get("/users/:id", (req, res) => res.status(200).json({ id: req.params.id }));
```

##### app

Type: `Express`

[An Express.js application.](https://expressjs.com/en/4x/api.html#express)

##### options

Type: `ConnectOptions` (optional)

Overrides the default redaction / body-safety behaviour (see
[Default secret redaction](#redaction)):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `redactHeaders` | `Iterable<string>` | `authorization`, `cookie`, `set-cookie`, `proxy-authorization` | Header names whose values are masked but kept. |
| `redactKeys` | `Iterable<string>` | `password`, `token`, `secret`, `authenticationtoken`, `accesstoken`, `refreshtoken`, `apikey` | Object keys masked anywhere in a body or query. |
| `maxBodyBytes` | `number` | `65536` (64 KiB) | Serialized bodies larger than this are truncated. |

Header and key names are matched case-insensitively. Passing an option replaces
the corresponding default set entirely.

#### `owlHeaders()` — `the-owl/vitest` <a name="owl-headers"></a>

Returns the correlation header filled from the **current Vitest test name**.
Spread it into the headers of the request you want documented.

```ts
import { owlHeaders } from "the-owl/vitest";

it("(200) returns the application status", async () => {
  const res = await fetch(`${base}/health`, {
    headers: { "your-custom-header": "shows up in the docs", ...owlHeaders() },
  });
  expect(res.status).toBe(200);
});
```

It throws if called outside a running test (there is no test name to attach).

> **Opt-in is per request.** Only requests carrying the `x-test-name` header are
> captured; every other request is ignored. Attach `owlHeaders()` **only** to the
> specific request you want documented — never to a shared/universal request
> helper, or you will document traffic you didn't intend to. A single test may
> mark several requests: each distinct `method + route` becomes its own Endpoint,
> and they all share the test's title as the Example name.

#### `buildHeaders(testName)` <a name="build-headers"></a>

Returns the same correlation header as `owlHeaders()`, but lets you pass the test
name explicitly. Use it outside of Vitest (or when you want to control the
Example name yourself).

```ts
import theOwl from "the-owl";

const res = await fetch(`${base}/users/999`, {
  headers: { "content-type": "application/json", ...theOwl.buildHeaders("(200) returns a user") },
});
```

##### testName

Type: `string`

The Example name shown in the docs. This is both the opt-in signal and the label
the rendered Catalog uses for the captured request/response.

> The single header `the-owl` relies on is `x-test-name`. Setting it manually is
> equivalent to using `buildHeaders()` / `owlHeaders()`.

#### `save()` <a name="save"></a>

Drains this process's captured Examples to `.owl/*.json`. Call it after your tests
have run (e.g. in an `afterAll` hook). The actual `the-owl build` step renders
those files later.

`save()` is a **no-op unless the `CREATE_DOCS` environment variable is set**, so
your normal `vitest run` (and watch mode) never writes files. See
[02-process-variables.md](./02-process-variables.md#create-docs).

```ts
import { afterAll } from "vitest";
import theOwl from "the-owl";

afterAll(async () => {
  theOwl.save(); // drain this file's Examples to .owl/
  await stopServer(server);
});
```

Test runners fork a process per file and run them concurrently, so each drain
writes a **unique** file (`<slug>.<uuid>.json`); concurrent processes never
clobber each other, and `the-owl build` merges them afterwards.

> `createDocs()` is a **deprecated** alias of `save()`, kept for v1 compatibility.
> Prefer `save()`.

#### `the-owl build` <a name="build-cli"></a>

The packaged CLI reads every `.owl/*.json` in the current directory, merges them
into a single **Catalog**, and writes the docs site to `./docs/site/`
(`catalog.json` + the React bundle).

```sh
$ the-owl build
```

A typical `package.json` script wires the full pipeline together:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:create-docs": "rimraf .owl docs && CREATE_DOCS=true vitest run && the-owl build"
  }
}
```

#### `docs(options?)` <a name="docs"></a>

Returns an Express request handler that serves the built docs (the
`catalog.json` produced by `the-owl build` plus the React bundle). Mount it on a
route to expose live docs from your running server — for example, only in a
staging environment:

```ts
import theOwl from "the-owl";

if (process.env.NODE_ENV === "staging") {
  app.use("/docs", theOwl.docs());
}
```

##### options

Type: `DocsOptions` (optional)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `catalog` | `string` | `./docs/site/catalog.json` | Path to the `catalog.json` written by `the-owl build`. |
| `bundleDir` | `string` | the bundle shipped in the package | Path to the pre-built React bundle to serve. |

If `catalog.json` is missing, the handler responds `404` with a hint to run
`the-owl build`.

This gives you **two delivery modes over the same build output**: serve the
static `docs/site/` directory directly, or mount `theOwl.docs()` to serve it live
from your app.

#### Default secret redaction <a name="redaction"></a>

Captured traffic is sanitized before it ever touches disk. By default:

- **Header values** for `authorization`, `cookie`, `set-cookie`, and
  `proxy-authorization` are masked.
- **Body and query keys** named `password`, `token`, `secret`,
  `authenticationtoken`, `accesstoken`, `refreshtoken`, and `apikey` are masked
  anywhere they appear (recursively, including nested objects and arrays).

The key is always kept; only the value is replaced with `«redacted»`. Customize
the masked headers/keys (or the body-size limit) via the
[`connect(app, options?)`](#connect) options. Bodies above `maxBodyBytes` are
truncated, and non-inlineable content types (binary, multipart, etc.) are
replaced with a `[content-type]` placeholder instead of being stored verbatim.
