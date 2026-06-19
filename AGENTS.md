# the-owl — agent guide

`the-owl` watches the request/response traffic of an Express app during its
functional tests and turns that traffic into interactive API docs. This file is
the canonical guide for AI agents and contributors. For the domain vocabulary
(Example, Endpoint, Catalog, Collector, Renderer) read **[CONTEXT.md](./CONTEXT.md)** —
it is not repeated here.

## Architecture: four domains, one pipeline

```
capture → drain → catalog → render
```

1. **`src/capture/`** — runs inside the test process. The capture middleware
   observes any request tagged with `x-test-name`, sanitizes it, and records it
   into the in-memory `Collector`.
2. **`src/drain/`** — the write side. Empties one process's `Collector` to
   `.owl/<slug>.<uuid>.json`. The uuid keeps concurrent test processes from
   clobbering each other.
3. **`src/catalog/`** — the read + merge side. Reads every `.owl/*.json` fragment
   and merges them into one in-memory `Catalog` (the source of truth). Writes
   nothing.
4. **`src/render/`** — turns the `Catalog` into `docs/site/` (static) or serves it
   live via `docs()`.

Shared across all domains:
- **`src/types.ts`** — the shared kernel: `CapturedRequest/Response`, `Example`,
  `Endpoint`, `Catalog`.
- **`src/keys.ts`** — `endpointKey()`, an Endpoint's in-memory identity (mirrors
  `drain/slug.ts`'s on-disk identity).
- **`src/index.ts`** — the composition root and public API (`connect`, `save`,
  `docs`); the only module that wires domains together.
- **`src/bin/cli.ts`** — the `the-owl build` executable.

## Allowed dependency direction

```
capture   → types, keys
drain     → types, keys, capture        (uses the Collector type)
catalog   → types, keys
render    → types, catalog              (build reads the catalog)
index.ts  → capture, drain, render      (the ONLY cross-domain wiring)
bin/cli   → render
```

Domains may reach "sideways" ONLY along the pipeline (`drain → capture`,
`render → catalog`). Any other cross-domain coupling belongs in the composition
root. Do not let a domain import a sibling outside this list.

## Conventions

- **Factories use `create*`**: `createCaptureMiddleware()`, `createCollector()`.
- **File purity**: a behavior file exports functions only. Exported types live in
  `<domain>/types.ts`; exported constants in `<domain>/constants.ts`. A constant
  used privately by exactly one function may stay local to that file.
- **Tests are co-located** in `<domain>/__tests__/*.test.ts`. There is no
  top-level `test/` folder.
- **JSDoc the entry function of each domain** with its role in the pipeline.
- **Avoid generic names** (`utils`, `store`, `state`, `registry`) — see the
  "_Avoid_" lists in `CONTEXT.md`.

## Build & test

- `npm test` — Vitest, discovers `src/**/*.test.ts`.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run build` — `tsup` (entries: `src/index.ts`, `src/capture/vitest.ts`,
  `src/bin/cli.ts`) + the Vite web bundle.

Out of scope for the domain layout: `web/` (the React app), `examples/`, and
`documentation/`.

## Workflow conventions

- **Never commit directly to `master`.** Before starting any unit of work, create a
  branch named with a conventional-commit-style prefix:
  `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`, `refactor/<slug>`,
  `test/<slug>`. This applies to spec/plan docs too — branch first, then commit.
- **Brainstorming hand-off.** When a `/brainstorming` (or design → plan) session
  finishes, always end by giving the user a ready-to-paste prompt for a *fresh
  session* that executes the implementation plan. The prompt must name the plan
  file, the branch to work on, and the execution skill. Template:

  > Execute the implementation plan at `docs/superpowers/plans/<file>.md` on branch
  > `<branch>` using superpowers:executing-plans (or subagent-driven-development).
  > Implement it task-by-task, keep the test suite green, and commit after each task.
