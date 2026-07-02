### Process variables (aka `process.env`)

`the-owl` reads a few environment variables — one while your tests run, the rest
at `the-owl build` time. A typical `test:create-docs` script chains all of them:

```sh
rimraf .owl docs && CREATE_DOCS=true vitest run && THE_OWL_GROUPING_REGEX=^/api$ the-owl build
```

* [CREATE_DOCS](#create-docs)
* [THE_OWL_DOCS_HOST](#the-owl-docs-host)
* [THE_OWL_GROUPING_REGEX](#the-owl-grouping-regex)

#### `CREATE_DOCS=true` <a name="create-docs"></a>

_Read while your tests run._

The gate for [`save()`](./01-api.md#save). When this variable is **not** set,
`save()` is a no-op and nothing is written to `.owl/`.

This keeps your everyday `vitest run` — and especially watch mode — from writing
docs every time a file changes. Set it only when you actually want to (re)generate
the docs:

```sh
rimraf .owl docs && CREATE_DOCS=true vitest run && the-owl build
```

With `CREATE_DOCS` set, each test process drains its captured Examples to a unique
`.owl/*.json` file; `the-owl build` then merges them into `docs/site/`.

#### `THE_OWL_DOCS_HOST` <a name="the-owl-docs-host"></a>

_Read at `the-owl build` time._

The base URL baked into the **Copy as cURL** commands of the **static** docs
build. When unset it defaults to `http://localhost:3000`.

```sh
THE_OWL_DOCS_HOST=https://api.example.com the-owl build
```

In the live-route mode (`theOwl.docs()`), cURL commands target the page's own
origin instead, so this variable only affects the static build. See
[`examples/02-elaborate`](../examples/02-elaborate).

#### `THE_OWL_GROUPING_REGEX` <a name="the-owl-grouping-regex"></a>

_Read at `the-owl build` time._

Controls how the docs sidebar groups **Endpoints**. By default each Endpoint is
grouped by its **first path segment** (`/users/:id` and `/users/:id/orders` both
group under `Users`). When set, the regex's longest matching **leading path
prefix** is stripped before grouping, so grouping falls on the first segment
after it:

```sh
# strips /api → /api/v1/users groups under "V1", /api/v2/users under "V2"
THE_OWL_GROUPING_REGEX=^/api$ the-owl build

# strips /api/vN → both /api/v1/users and /api/v2/users merge under "Users"
THE_OWL_GROUPING_REGEX=^/api/v[1-9]\d*$ the-owl build
```

The prefix is matched at segment boundaries and never strips a route's last
segment, so every Endpoint keeps a segment to group by. An invalid regex is
ignored (grouping falls back to the first-segment default). The value is baked
onto the **Catalog** at build time; the docs app reads it from there. See
[`examples/02-elaborate`](../examples/02-elaborate), which sets `^/api$` to group
its versioned APIs under `V1` / `V2`.
