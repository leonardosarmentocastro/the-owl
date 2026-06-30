# Interactive API docs ("Try it out") — design

**Date:** 2026-06-28
**Branch:** `feat/interactive-api-docs`
**Status:** Approved (brainstorming)

## Problem

`the-owl` turns captured functional-test traffic into API docs, but the current
output is a read-only dump: each Example shows its request/response bodies in
`<pre>` blocks with no way to interact. It is informative but not *useful* the way
[Swagger UI](https://petstore.swagger.io/) is — there is no way to inspect an
endpoint's inputs, edit them, and fire a real call.

## Goal & scope

Evolve the generated docs into a lightweight, interactive API book: each captured
Example becomes an editable, fireable request — a mini-Postman with only the
essentials.

**In scope**
- Editable path params, query params, headers, and body per Example.
- A real "Try it out" button that fires the (possibly edited) request.
- A full response panel (status, time/size, body, headers, errors).

**Out of scope (recorded for later)**
- cURL command generation for the static build (so users can fire it themselves
  against a host of their choosing).
- Diffing the live response against the captured response.
- Auth flows, file uploads, persisting edits between sessions.

## Key decisions

1. **Execution target: live mode only.** "Try it out" works when docs are served
   via `theOwl.docs()`, because that router is mounted on the *same Express app*
   being documented — requests are same-origin and relative (e.g. `/users/2`),
   so no base-URL config or CORS is needed. The static `file://` build stays
   read-only (cURL generation is the future story for it).
2. **Everything is editable:** path params (`:id`), query params, headers, body.
3. **Per-Example accordions.** Each captured Example is its own collapsible row
   (`status · name` in the summary), collapsed by default, each with its own
   prefilled form fired independently. Chosen over a single per-endpoint form +
   example picker because real test files have 10+ Examples and this reads like a
   complete API book.
4. **Input representation:** key/value rows (add/remove) for headers and query
   params; a JSON textarea for the body.
5. **Sanitization-aware prefill:** the owl test header (`x-test-name`) is dropped
   automatically; any `[REDACTED]` header/body value is rendered as an empty,
   highlighted "needs input" field so the literal `[REDACTED]` can never be fired.
6. **Static build hides the affordance entirely** — no dead buttons; pure
   read-only book.
7. **Live detection via injected window flag.** `theOwl.docs()` injects
   `window.__OWL_LIVE__ = true` into the served HTML; the static build never has
   it. Robust regardless of protocol/host (no `file://` sniffing; no reliance on
   an app-provided `/health`).
8. **Response panel:** status badge, round-trip ms + size, pretty-printed body,
   collapsible response headers, inline red error state on fetch failure. No diff.

## Architecture & where code lives

The pipeline (`capture → drain → catalog → render`) and the on-disk `Catalog`
shape are unchanged. Nearly all new work lives in the `web/` React app (already
scoped outside the domain layout by `AGENTS.md`). Exactly one `src/` change.

### `src/render/serve.ts` (the only `src/` behavior change)

The live `docs()` router intercepts the HTML response for the app shell and
injects `<script>window.__OWL_LIVE__ = true</script>` before serving it. Static
assets continue to be served by `express.static`. The static `the-owl build`
output never receives this script. This injection is the single seam that flips
the UI from read-only to interactive.

A unit test asserts the flag is present in the live-served HTML and absent from
the static bundle.

### `web/` components

- `EndpointCard` — method + route header plus a list of Example accordions.
- `ExampleAccordion` (new) — collapsed by default; summary shows `status · name`.
  Expanded: in live mode reveals the request form + response panel; in static
  mode shows today's read-only request/response view.
- `RequestForm` (new) — key/value rows for headers and query; text inputs for
  path params; JSON textarea for body; the "Try it out" button.
- `ResponsePanel` (new) — status badge, round-trip ms + size, pretty body,
  collapsible response headers, inline red error state.

### `web/` pure logic (extracted, unit-testable)

Kept out of components so they can be tested directly:

- `parsePathParams(route, capturedPath)` — e.g.
  `("/users/:id", "/users/2") -> { id: "2" }` to prefill path inputs.
- `prefillFromExample(example)` — builds initial form state and applies the
  sanitization rules: drop `x-test-name`; mark each `[REDACTED]` header/body value
  as empty + "needs input".
- `buildRequest(formState, route)` — substitutes path params into the route
  template, appends the query string, assembles headers/body → the `fetch` args.

### Data note

`web/src/api.ts`'s `Example` type currently omits `query` (the on-disk `Catalog`
already carries it via `CapturedRequest`). Add `query` to the web type so it can
be edited.

## Data flow when firing

Live mode, same-origin: `buildRequest` produces a relative URL (e.g.
`/users/2?active=true`); `fetch` hits the very app serving the docs;
`ResponsePanel` renders status / time / body / headers, or the error.

## Error handling

- Fetch/network failure → red panel with the message; no crash.
- Redacted field left empty → firing blocked with an inline "fill this" hint.
- Non-JSON request body → validation message instead of a thrown parse error.
- Non-JSON / empty responses → shown as raw text, not force-parsed.

## Testing

Vitest, co-located. Unit tests for the three pure modules (`parsePathParams`;
`prefillFromExample` including owl-header strip + redaction handling;
`buildRequest` including path substitution + query assembly). A `render/serve.ts`
test asserting the live flag injection. Component smoke tests for accordion
expansion and a mocked fire → response render.
