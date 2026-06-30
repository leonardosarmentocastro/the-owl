# Copy as cURL — Design

**Date:** 2026-06-29
**Status:** Approved (brainstorming)

## Problem

The interactive API docs let each captured Example be fired from the page via
**Try it out** — but only when the docs are served live through `theOwl.docs()`.
The **static** build (opened from `file://` or hosted as plain files) has no
server to call, so it stays read-only and the user gets no way to exercise the
endpoint.

Give every Example a **"Copy as cURL"** command: a copy-pasteable `curl` that
the user can run in a terminal against their own API. Available in both modes —
solving the static gap, and giving live users a reproducible command for the
exact request they have composed.

(`wget` was considered and dropped — `curl` is near-universal and covers the
use case; adding `wget` would double the formatter/test surface for little
gain. Easy to add later if asked for.)

## Approach

A single pure formatter is the source of truth, fed through the existing
`prefillFromExample` normalization seam so both modes share one code path.

`prefillFromExample(example, route)` already:

- drops the owl correlation header (`x-test-name`),
- flags redacted header/query values as `needsInput` with an empty value,
- clears redacted body values to `""`,
- prefills path params from the captured path, query, and body.

So the curl builder consumes a `RequestFormState`, not a raw `Example`.

### Data flow

- **Live mode:** `formatCurl(currentForm, baseUrl)` — reflects the user's live
  edits, so the command matches exactly what **Try it out** would fire.
- **Static mode:** `formatCurl(prefillFromExample(example, route), baseUrl)` —
  built from the captured Example (the accordion does not render an editable
  form in static mode; it calls `prefillFromExample` solely to feed the
  formatter).

## Components

### `web/src/request/curl.ts` (new, pure)

```ts
export const formatCurl = (form: RequestFormState, baseUrl: string): string
```

Helpers (module-private unless a test needs them):

- `shellQuote(s: string): string` — wrap in single quotes, escaping embedded
  single quotes via the `'\''` trick, so the command is shell-safe.
- `joinUrl(baseUrl: string, path: string): string` — strip a trailing slash
  from `baseUrl`, ensure exactly one `/` join with the leading-slash path.

Build steps:

1. **Path:** replace each `:name` in `form.route` with its path-param value, or
   `<CHANGE_ME:name>` when the value is empty.
2. **Query:** for each named row, append `name=<encoded value>`; when the row is
   `needsInput` and empty, append `name=<CHANGE_ME:name>` **raw** (not
   percent-encoded) so the placeholder stays readable. Real values are
   `encodeURIComponent`-ed.
3. **URL:** `joinUrl(baseUrl, path)` + `?` + query string (when non-empty).
4. **Headers:** one `-H 'name: value'` per row; value, or `<CHANGE_ME:name>`
   when `needsInput` and empty.
5. **Body:** when the method is not bodyless (`GET`/`HEAD`) and `form.body`
   is non-empty, add `-d '<body>'`. The body is already a JSON string from
   prefill; body-level redactions appear as `""` inside the JSON — consistent
   with what the editable form shows today (no new body-walking).
6. **Method:** always emit `-X METHOD` (explicit, including `GET`).

Output is multi-line with ` \` continuations and 2-space indentation, e.g.:

```
curl -X POST 'http://localhost:3000/users' \
  -H 'content-type: application/json' \
  -H 'authorization: <CHANGE_ME:authorization>' \
  -d '{"name":"John"}'
```

### Placeholder rule

- Empty redacted/required values → **`<CHANGE_ME:NAME>`** (e.g.
  `<CHANGE_ME:authorization>`, path param `<CHANGE_ME:id>`). `<CHANGE_ME>` is
  the loud "must edit" signal; `:name` says which field.
- Filled values (live mode, user-entered) → used verbatim.

### `web/src/components/CurlBlock.tsx` (new)

```tsx
export const CurlBlock = ({ form, baseUrl }: { form: RequestFormState; baseUrl: string }) => …
```

- Computes `formatCurl(form, baseUrl)` and renders it inside the existing
  shared `CodeBlock`.
- A **Copy** button calls `navigator.clipboard.writeText(command)` and shows a
  transient "Copied ✓" affordance.
- Labeled (e.g. a small "cURL" heading) so it reads as a distinct block.

### Base URL resolution

New optional field on the Catalog, populated at build time, resolved in the
browser:

- `src/types.ts` — add `baseUrl?: string` to `Catalog`.
- `web/src/api.ts` — mirror `baseUrl?: string` on the web `Catalog` interface.
- `src/render/build.ts` (`runBuild`) — before `emitHtml`:
  `if (process.env.THE_OWL_DOCS_HOST) catalog.baseUrl = process.env.THE_OWL_DOCS_HOST`.
  Only baked when the env var is set; the catalog stays clean when unconfigured.
- `web/src/App.tsx` — resolve once and thread down via
  `App → EndpointCard → ExampleAccordion`:

  ```ts
  const baseUrl = isLive()
    ? window.location.origin
    : (catalog.baseUrl ?? DEFAULT_DOCS_HOST);
  ```

  Live always uses the real origin (directly runnable). Static uses the baked
  host, falling back to a `DEFAULT_DOCS_HOST` constant (`http://localhost:3000`).

### UI placement

`ExampleAccordion` renders `<CurlBlock>` in **both** branches:

- **Live branch:** below `<RequestForm>` (and `<ResponsePanel>`), recomputing as
  the form changes — built from the current form.
- **Static branch:** below the read-only Request/Response code blocks — built
  from `prefillFromExample(example, route)`.

## Error handling

- `formatCurl` is total — it never throws; missing values become placeholders.
- `CurlBlock` copy: `navigator.clipboard.writeText` returns a promise; on
  rejection (e.g. insecure context) the "Copied ✓" state is simply not shown.
  No catalog/network dependency.

## Testing

- `web/src/request/__tests__/curl.test.ts` (node env): GET with no body, POST
  with body, redacted header/query → `<CHANGE_ME:…>` placeholder, path-param
  substitution and empty-path-param placeholder, query encoding of real values,
  single-quote escaping, `joinUrl` trailing-slash handling, method emitted.
- `web/src/components/__tests__/CurlBlock.test.tsx` (`// @vitest-environment
  jsdom`): renders the command text; clicking **Copy** calls
  `navigator.clipboard.writeText` with the command (clipboard mocked).
- `src/render/__tests__/build.test.ts` (or existing render test): with
  `THE_OWL_DOCS_HOST` set, `runBuild` writes `catalog.baseUrl`; without it, the
  field is absent.

## Documentation

- Root `README.md` "Two delivery modes" — note that every Example also offers a
  **Copy as cURL** command (both modes), and document `THE_OWL_DOCS_HOST` for
  baking the static base URL.
- `examples/02-elaborate` README + `package.json` — show `THE_OWL_DOCS_HOST` in
  the `test:create-docs` flow.

## Out of scope (YAGNI)

- `wget` (and any other client) generation.
- Walking the request body to turn redacted body fields into `<CHANGE_ME>`
  placeholders (kept consistent with the existing editable form).
- A global "copy all" / collection export.
