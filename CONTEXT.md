# the-owl

`the-owl` watches the request/response traffic of an Express app during its functional tests and turns that traffic into API documentation. This file fixes the vocabulary used when discussing its architecture.

## Language

**Example**:
One captured request/response pair produced by a single test case.
_Avoid_: doc, exchange, registry, test case (when referring to the captured data).

**Endpoint**:
A `method + route template` (e.g. `GET /users/:id`) documented by one or more **Examples**.
_Avoid_: route, path, doc file.

**Catalog**:
The merged set of every **Endpoint**; the complete dataset an output (e.g. the HTML app) renders.
_Avoid_: spec, collection, docs.

**Collector**:
The module that holds the **Examples** captured during one test process and drains them into a serialized **Endpoint**.
_Avoid_: store, redux, state.

**Renderer**:
An adapter that presents the **Catalog** (or a single **Endpoint**) in one output format — markdown, HTML, OpenAPI.
_Avoid_: emitter, writer, generator.

## Relationships

- An **Endpoint** is documented by one or more **Examples**.
- A **Collector** captures the **Examples** of the **Endpoint(s)** exercised within a single test process, then drains them to a serialized model.
- A **Catalog** is the merge of every drained **Endpoint** across all test processes.
- A **Renderer** consumes the serialized model (the seam) and produces one output format; many Renderers can read the same model.

## Example dialogue

> **Dev:** "When the `(500) user not found` test runs, does that create a new **Endpoint**?"
> **Maintainer:** "No — it adds an **Example** to the existing `GET /users/:id` **Endpoint**. The `(200)` test is another **Example** of the same **Endpoint**."
> **Dev:** "And the HTML app shows all of them?"
> **Maintainer:** "Right. Each test process drains its **Endpoint** to JSON; the build step merges those into the **Catalog**, and the HTML **Renderer** reads it."

## Flagged ambiguities

- "doc" was used for both a single captured request/response and the whole markdown file — resolved: the capture is an **Example**, the per-`method+route` grouping is an **Endpoint**.
