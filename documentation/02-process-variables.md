### Process variables (aka `process.env`)

Use the process variables in your test script, as follows:

```sh
CREATE_DOCS=true npm run test
```

* [CREATE_DOCS](#create-docs)

#### `CREATE_DOCS=true` <a name="create-docs"></a>

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
