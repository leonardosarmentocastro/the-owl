# Shadcn + Tailwind Docs Reskin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the generated API docs web app (`web/`) onto shadcn/ui + Tailwind v4, preserving the exact layout and all behavior.

**Architecture:** Add Tailwind v4 and the shadcn toolchain to the existing Vite/React app, introduce an `@ → web/src` path alias (mirrored in `tsconfig.json`, `web/vite.config.ts`, `vitest.config.ts`), then refactor each hand-styled component to compose shadcn primitives. The four-domain pipeline and `src/render/` are untouched — `build:web` still emits a self-contained `dist/web`.

**Tech Stack:** React 19, Vite 8, Vitest 4, Tailwind v4 (`@tailwindcss/vite`), shadcn/ui (new-york, neutral), Radix UI, lucide-react, `clsx` + `tailwind-merge`.

## Global Constraints

- **Never commit to `master`.** Work happens on branch `feat/shadcn-docs-reskin` (already created).
- **`src/render/` and the pipeline are not modified.** Only `web/` and the three alias config files change.
- **New deps are `devDependencies` only** — they are inlined into `dist/web`; published-package consumers must gain zero runtime deps.
- **Behavior is preserved exactly.** No changes to `web/src/nav/*`, `web/src/request/*`, `web/src/api.ts`, `web/src/live.ts`.
- **Theme: light only.** Tokens are CSS variables (dark mode deferred). Keep monospace for routes/methods/code.
- **Icons:** lucide-react. Decorative icons stay `aria-hidden` (lucide default) so accessible names are unchanged.
- **Every component keeps its existing props and its visible text / accessible names**, so the existing test suite stays the regression gate.
- Verify after each task: `npm run typecheck` and the relevant `npx vitest run <file>` are green; `npm run build:web` succeeds where noted.

---

## File Structure

**New files**
- `web/components.json` — shadcn config (style/baseColor/aliases).
- `web/src/lib/utils.ts` — `cn()` helper.
- `web/src/index.css` — Tailwind import + light theme tokens.
- `web/src/test-setup.ts` — jsdom polyfills for Radix (guarded for the node env).
- `web/src/components/ui/*` — shadcn primitives (CLI-generated).
- `web/src/components/StatusBadge.tsx` — status-code badge (2xx green / else red).
- `web/src/components/MethodBadge.tsx` — HTTP-method badge.
- `web/src/components/__tests__/StatusBadge.test.tsx` — new test.

**Modified files**
- `tsconfig.json`, `web/vite.config.ts`, `vitest.config.ts` — `@` alias (+ Tailwind plugin, + setup file).
- `web/src/main.tsx` — import `./index.css`.
- `web/src/components/CodeBlock.tsx`, `CurlBlock.tsx`, `RequestForm.tsx`, `ResponsePanel.tsx`, `ExampleAccordion.tsx`, `EndpointCard.tsx`, `Sidebar.tsx`, `web/src/App.tsx` — reskin.

**Note on `ExampleAccordion` (refinement of the spec):** the spec mapped it to shadcn `Accordion`. Each `ExampleAccordion` renders a *single* independently-toggled example with its own open-state and URL-hash syncing, so Radix **`Collapsible`** is the correct primitive (Accordion is for mutually-exclusive groups). The approved outcome — "the trigger gains a real button role," same visual chevron+row pattern — is delivered either way. This plan uses `Collapsible`.

---

### Task 1: Foundation — Tailwind v4, shadcn scaffold, `@` alias, jsdom polyfills

**Files:**
- Modify: `package.json` (devDependencies)
- Create: `web/src/lib/utils.ts`, `web/src/index.css`, `web/components.json`, `web/src/test-setup.ts`
- Modify: `web/vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `web/src/main.tsx`

**Interfaces:**
- Produces: the `@/*` alias resolving to `web/src/*` in app build, typecheck, and tests; `cn(...inputs: ClassValue[]) => string` at `@/lib/utils`; a green build with no UI change yet.
- Consumes: nothing.

- [ ] **Step 1: Install the base toolchain (dev only)**

Run:
```bash
npm install -D tailwindcss @tailwindcss/vite clsx tailwind-merge lucide-react
```
Expected: installs succeed; these land in `devDependencies`.

- [ ] **Step 2: Create the `cn()` helper**

Create `web/src/lib/utils.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Create the Tailwind entry + light theme tokens**

Create `web/src/index.css`:
```css
@import "tailwindcss";

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

@layer base {
  * {
    border-color: var(--color-border);
  }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: system-ui, sans-serif;
  }
}
```

- [ ] **Step 4: Create the shadcn config**

Create `web/components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 5: Add the Tailwind plugin and `@` alias to the Vite config**

Replace `web/vite.config.ts` with:
```ts
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./", // relative asset URLs so it works under any mount path (e.g. /docs)
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: { outDir: "../dist/web", emptyOutDir: true },
});
```

- [ ] **Step 6: Add the `@` alias to the root tsconfig**

In `tsconfig.json`, add `baseUrl` and `paths` inside `compilerOptions` (keep every existing option):
```json
    "baseUrl": ".",
    "paths": { "@/*": ["web/src/*"] },
```

- [ ] **Step 7: Create the jsdom polyfill setup file**

Radix primitives (Collapsible/Dialog) reference `ResizeObserver` and pointer-capture APIs that jsdom lacks. Guards keep this safe under the node-environment `src/` tests.

Create `web/src/test-setup.ts`:
```ts
// Polyfills so Radix primitives render under jsdom. Guarded so the node-env
// `src/` tests (no DOM globals) import this file without throwing.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView ||= function () {};
  Element.prototype.hasPointerCapture ||= function () {
    return false;
  };
  Element.prototype.releasePointerCapture ||= function () {};
}
```

- [ ] **Step 8: Wire the alias + setup file into the Vitest config**

Replace `vitest.config.ts` with:
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./web/src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "web/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["./web/src/test-setup.ts"],
  },
});
```

- [ ] **Step 9: Import the stylesheet from the app entry**

In `web/src/main.tsx`, add the CSS import as the first line:
```ts
import "./index.css";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(<App />);
```

- [ ] **Step 10: Verify the whole suite and build are still green (no UI change yet)**

Run:
```bash
npm run typecheck && npm test && npm run build:web
```
Expected: typecheck passes; **all existing tests PASS** (the polyfill setup runs harmlessly); `vite build web` emits `dist/web` including a hashed CSS asset.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts web/components.json web/vite.config.ts web/src/index.css web/src/lib web/src/test-setup.ts web/src/main.tsx
git commit -m "build(web): add Tailwind v4 + shadcn toolchain and @ alias"
```

---

### Task 2: Primitives + shared badges + leaf blocks (`CodeBlock`, `CurlBlock`)

**Files:**
- Create: `web/src/components/ui/*` (CLI), `web/src/components/StatusBadge.tsx`, `web/src/components/MethodBadge.tsx`, `web/src/components/__tests__/StatusBadge.test.tsx`
- Modify: `web/src/components/CodeBlock.tsx`, `web/src/components/CurlBlock.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`; the `@` alias.
- Produces:
  - shadcn primitives at `@/components/ui/{button,badge,card,input,textarea,label,collapsible,sheet,alert}`.
  - `StatusBadge({ status: number; statusText?: string })` and `MethodBadge({ method: string; className?: string })`.
  - Reskinned `CodeBlock`/`CurlBlock` with identical props (`CodeBlock({ children })`, `CurlBlock({ form, baseUrl })`).

- [ ] **Step 1: Add all shadcn primitives this reskin needs**

Run (from the repo root, so `@` resolves via tsconfig to `web/src`):
```bash
npx shadcn@latest add button badge card input textarea label collapsible sheet alert --yes
```
Expected: files appear under `web/src/components/ui/`; Radix deps (`@radix-ui/react-*`), `class-variance-authority`, and `@radix-ui/react-slot` are installed automatically. If they land in `dependencies`, move them to `devDependencies`:
```bash
npm install -D @radix-ui/react-collapsible @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-slot class-variance-authority
```

- [ ] **Step 2: Verify primitives typecheck**

Run:
```bash
npm run typecheck
```
Expected: PASS (the new `ui/*` files compile against the installed Radix deps and `@/lib/utils`).

- [ ] **Step 3: Write the failing test for `StatusBadge`**

Create `web/src/components/__tests__/StatusBadge.test.tsx`:
```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";

afterEach(cleanup);

describe("StatusBadge", () => {
  it("renders the status code and appends statusText when given", () => {
    render(<StatusBadge status={200} statusText="OK" />);
    expect(screen.getByText(/200 OK/)).toBeTruthy();
  });

  it("renders the bare status code when statusText is omitted", () => {
    render(<StatusBadge status={404} />);
    expect(screen.getByText("404")).toBeTruthy();
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run:
```bash
npx vitest run web/src/components/__tests__/StatusBadge.test.tsx
```
Expected: FAIL — cannot resolve `../StatusBadge`.

- [ ] **Step 5: Implement `StatusBadge` and `MethodBadge`**

Create `web/src/components/StatusBadge.tsx`:
```tsx
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const StatusBadge = ({ status, statusText }: { status: number; statusText?: string }) => {
  const ok2xx = status >= 200 && status < 300;
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono",
        ok2xx
          ? "border-green-600/30 bg-green-50 text-green-700"
          : "border-red-600/30 bg-red-50 text-red-700",
      )}
    >
      {status}
      {statusText ? ` ${statusText}` : ""}
    </Badge>
  );
};
```

Create `web/src/components/MethodBadge.tsx`:
```tsx
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const MethodBadge = ({ method, className }: { method: string; className?: string }) => (
  <Badge variant="secondary" className={cn("font-mono text-primary", className)}>
    {method}
  </Badge>
);
```

- [ ] **Step 6: Run the `StatusBadge` test to verify it passes**

Run:
```bash
npx vitest run web/src/components/__tests__/StatusBadge.test.tsx
```
Expected: PASS (both cases).

- [ ] **Step 7: Reskin `CodeBlock`**

Replace `web/src/components/CodeBlock.tsx`:
```tsx
import type { ReactNode } from "react";

/** Monospace, boxed block for displaying request/response JSON and headers. */
export const CodeBlock = ({ children }: { children: ReactNode }) => (
  <pre className="my-1.5 overflow-x-auto whitespace-pre rounded-md border bg-muted px-3 py-2.5 font-mono text-xs leading-relaxed">
    {children}
  </pre>
);
```

- [ ] **Step 8: Reskin `CurlBlock`**

Replace `web/src/components/CurlBlock.tsx`:
```tsx
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { RequestFormState } from "../request/types";
import { formatCurl } from "../request/curl";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "./CodeBlock";

/** Shows a copy-pasteable curl command for a request form, in both docs modes. */
export const CurlBlock = ({ form, baseUrl }: { form: RequestFormState; baseUrl: string }) => {
  const [copied, setCopied] = useState(false);
  const command = formatCurl(form, baseUrl);

  const copy = () => {
    navigator.clipboard.writeText(command).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  };

  return (
    <div className="mt-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">cURL</span>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <CodeBlock>{command}</CodeBlock>
    </div>
  );
};
```

- [ ] **Step 9: Run the affected tests + typecheck**

Run:
```bash
npx vitest run web/src/components/__tests__/CurlBlock.test.tsx web/src/components/__tests__/StatusBadge.test.tsx && npm run typecheck
```
Expected: PASS. `CurlBlock` test still finds the curl text and the `getByRole("button", { name: /copy/i })` (button name is "Copy"; the lucide icon is `aria-hidden`).

- [ ] **Step 10: Commit**

```bash
git add web/src/components/ui web/src/components/StatusBadge.tsx web/src/components/MethodBadge.tsx web/src/components/__tests__/StatusBadge.test.tsx web/src/components/CodeBlock.tsx web/src/components/CurlBlock.tsx package.json package-lock.json
git commit -m "feat(web): add shadcn primitives and reskin CodeBlock/CurlBlock + badges"
```

---

### Task 3: Reskin `RequestForm` and `ResponsePanel`

**Files:**
- Modify: `web/src/components/RequestForm.tsx`, `web/src/components/ResponsePanel.tsx`

**Interfaces:**
- Consumes: `Button`, `Input`, `Label`, `Textarea`, `Alert`, `Collapsible` from `@/components/ui/*`; `StatusBadge`; `cn`.
- Produces: reskinned components with unchanged props (`RequestForm({ form, onChange, onFire, firing })`, `ResponsePanel({ result })`). Invariants preserved: a `<small>{error}</small>` per validation error; the submit button's accessible name contains "Try it out"; it is `disabled` when `firing || errors.length > 0`; the redacted `Input` keeps its `placeholder`.

- [ ] **Step 1: Run the baseline tests (confirm green before refactor)**

Run:
```bash
npx vitest run web/src/components/__tests__/RequestForm.test.tsx web/src/components/__tests__/ResponsePanel.test.tsx
```
Expected: PASS (current implementation).

- [ ] **Step 2: Reskin `RequestForm`**

Replace `web/src/components/RequestForm.tsx`:
```tsx
import { Play, Plus, X } from "lucide-react";
import { validateForm } from "../request/build-request";
import type { KeyValue, RequestFormState } from "../request/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  form: RequestFormState;
  onChange: (next: RequestFormState) => void;
  onFire: () => void;
  firing: boolean;
}

const labelClass = "mt-2 block text-[11px] uppercase tracking-wide text-muted-foreground";

const KeyValueRows = ({
  title, rows, onRows,
}: { title: string; rows: KeyValue[]; onRows: (rows: KeyValue[]) => void }) => (
  <div>
    <Label className={labelClass}>{title}</Label>
    {rows.map((row, i) => (
      <div key={i} className="mt-1 flex gap-1.5">
        <Input
          className="font-mono text-xs"
          placeholder="name"
          value={row.name}
          onChange={(e) => onRows(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
        />
        <Input
          className={cn("flex-1 font-mono text-xs", row.needsInput && row.value.trim() === "" && "border-amber-500")}
          placeholder={row.needsInput ? "was redacted — enter a value" : "value"}
          value={row.value}
          onChange={(e) => onRows(rows.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
        />
        <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => onRows(rows.filter((_, j) => j !== i))}>
          <X className="size-4" />
        </Button>
      </div>
    ))}
    <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => onRows([...rows, { name: "", value: "" }])}>
      <Plus className="size-3.5" /> add
    </Button>
  </div>
);

export const RequestForm = ({ form, onChange, onFire, firing }: Props) => {
  const errors = validateForm(form);
  const bodyless = form.method === "GET" || form.method === "HEAD";

  return (
    <div className="flex flex-col gap-1">
      {form.pathParams.length > 0 && (
        <div>
          <Label className={labelClass}>Path</Label>
          {form.pathParams.map((p, i) => (
            <div key={p.name} className="mt-1 flex items-center gap-1.5">
              <code className="font-mono text-xs">{p.name}</code>
              <Input
                className="flex-1 font-mono text-xs"
                value={p.value}
                onChange={(e) =>
                  onChange({ ...form, pathParams: form.pathParams.map((q, j) => (j === i ? { ...q, value: e.target.value } : q)) })
                }
              />
            </div>
          ))}
        </div>
      )}

      <KeyValueRows title="Query" rows={form.query} onRows={(query) => onChange({ ...form, query })} />
      <KeyValueRows title="Headers" rows={form.headers} onRows={(headers) => onChange({ ...form, headers })} />

      {!bodyless && (
        <div>
          <Label className={labelClass}>Body</Label>
          <Textarea
            className="min-h-20 w-full font-mono text-xs"
            value={form.body}
            onChange={(e) => onChange({ ...form, body: e.target.value })}
          />
        </div>
      )}

      {errors.map((e) => (
        <small key={e} className="text-amber-600">{e}</small>
      ))}

      <Button type="button" className="mt-2 self-start" disabled={firing || errors.length > 0} onClick={onFire}>
        <Play className="size-3.5" /> {firing ? "Firing…" : "Try it out"}
      </Button>
    </div>
  );
};
```

- [ ] **Step 3: Reskin `ResponsePanel`**

Replace `web/src/components/ResponsePanel.tsx`:
```tsx
import { AlertCircle } from "lucide-react";
import type { LiveResult } from "../request/fire";
import { CodeBlock } from "./CodeBlock";
import { StatusBadge } from "./StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const prettify = (text: string): string => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

export const ResponsePanel = ({ result }: { result: LiveResult }) => {
  if (result.error) {
    return (
      <Alert variant="destructive" className="mt-2.5">
        <AlertCircle className="size-4" />
        <AlertTitle>Request failed</AlertTitle>
        <AlertDescription>{result.error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-2.5 border-t border-dashed pt-2.5">
      <div className="flex items-center gap-2.5">
        <StatusBadge status={result.status} statusText={result.statusText} />
        <small className="text-muted-foreground">{result.timeMs} ms · {result.sizeBytes} B</small>
      </div>
      <h4>Body</h4>
      <CodeBlock>{prettify(result.bodyText)}</CodeBlock>
      <Collapsible>
        <CollapsibleTrigger className="text-sm text-muted-foreground">
          Response headers ({Object.keys(result.headers).length})
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CodeBlock>{Object.entries(result.headers).map(([k, v]) => `${k}: ${v}`).join("\n")}</CodeBlock>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
```

- [ ] **Step 4: Run the affected tests + typecheck**

Run:
```bash
npx vitest run web/src/components/__tests__/RequestForm.test.tsx web/src/components/__tests__/ResponsePanel.test.tsx && npm run typecheck
```
Expected: PASS. `RequestForm` — `getByRole("button", { name: /try it out/i })`, the disabled assertion, `getByDisplayValue("2")`, and the `<small>` validation text all still resolve. `ResponsePanel` — `getByText(/200/)` (badge "200 OK"), `getByText(/"id": 2/)`, and `getByText(/boom/)` (AlertDescription) all resolve.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/RequestForm.tsx web/src/components/ResponsePanel.tsx
git commit -m "feat(web): reskin RequestForm and ResponsePanel with shadcn"
```

---

### Task 4: Reskin `ExampleAccordion` (Collapsible) and `EndpointCard` (Card)

**Files:**
- Modify: `web/src/components/ExampleAccordion.tsx`, `web/src/components/EndpointCard.tsx`

**Interfaces:**
- Consumes: `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent`, `Card`/`CardHeader`/`CardTitle`/`CardContent`; `StatusBadge`, `MethodBadge`; lucide `ChevronDown`/`ChevronRight`.
- Produces: reskinned components with unchanged props. Invariants preserved: outer wrapper keeps `id={slug}` and the scroll ref; the trigger row shows status + `example.name` and is clickable by that text; content is **unmounted while collapsed**; opening sets `window.location.hash = slug`; collapsing the active example clears the hash.

- [ ] **Step 1: Run the baseline tests (confirm green before refactor)**

Run:
```bash
npx vitest run web/src/components/__tests__/ExampleAccordion.test.tsx web/src/components/__tests__/EndpointCard.test.tsx
```
Expected: PASS (current implementation).

- [ ] **Step 2: Reskin `ExampleAccordion` with `Collapsible`**

Replace `web/src/components/ExampleAccordion.tsx`:
```tsx
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Example } from "../api";
import { isLive } from "../live";
import { exampleSlug } from "../nav/slug";
import { prefillFromExample } from "../request/prefill";
import { fireRequest, type LiveResult } from "../request/fire";
import type { RequestFormState } from "../request/types";
import { RequestForm } from "./RequestForm";
import { ResponsePanel } from "./ResponsePanel";
import { CodeBlock } from "./CodeBlock";
import { CurlBlock } from "./CurlBlock";
import { StatusBadge } from "./StatusBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const ExampleAccordion = ({
  method, route, example, baseUrl, activeHash,
}: { method: string; route: string; example: Example; baseUrl: string; activeHash?: string }) => {
  const slug = exampleSlug(method, route, example.name);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RequestFormState | null>(null);
  const [result, setResult] = useState<LiveResult | null>(null);
  const [firing, setFiring] = useState(false);
  const live = isLive();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeHash && activeHash === slug) {
      setOpen(true);
      ref.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [activeHash, slug]);

  const onOpenChange = (next: boolean) => {
    if (next && live && !form) setForm(prefillFromExample(example, route));
    if (next) window.location.hash = slug;
    else if (window.location.hash === `#${slug}`) window.location.hash = "";
    setOpen(next);
  };

  const fire = async () => {
    if (!form) return;
    setFiring(true);
    setResult(await fireRequest(form));
    setFiring(false);
  };

  return (
    <div id={slug} ref={ref} className="scroll-mt-4 border-t">
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger className="flex w-full items-center gap-2.5 px-1 py-2.5 text-left">
          {open
            ? <ChevronDown className="size-3.5 text-muted-foreground" />
            : <ChevronRight className="size-3.5 text-muted-foreground" />}
          <StatusBadge status={example.response.status} />
          <span>{example.name}</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-1 pb-3.5 pl-9">
          {live && form ? (
            <>
              <RequestForm form={form} onChange={setForm} onFire={fire} firing={firing} />
              {result && <ResponsePanel result={result} />}
              <CurlBlock form={form} baseUrl={baseUrl} />
            </>
          ) : (
            <>
              <h4>Request</h4>
              <CodeBlock>{JSON.stringify(example.request.body ?? {}, null, 2)}</CodeBlock>
              <h4>Response</h4>
              <CodeBlock>{JSON.stringify(example.response.body ?? {}, null, 2)}</CodeBlock>
              <CurlBlock form={prefillFromExample(example, route)} baseUrl={baseUrl} />
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
```

- [ ] **Step 3: Reskin `EndpointCard` with `Card`**

Replace `web/src/components/EndpointCard.tsx`:
```tsx
import type { Endpoint } from "../api";
import { ExampleAccordion } from "./ExampleAccordion";
import { MethodBadge } from "./MethodBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EndpointCard = ({ endpoint, baseUrl, activeHash }: { endpoint: Endpoint; baseUrl: string; activeHash?: string }) => (
  <Card className="mt-4">
    <CardHeader>
      <CardTitle className="font-mono text-lg">
        <MethodBadge method={endpoint.method} /> {endpoint.route}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {endpoint.examples.map((example) => (
        <ExampleAccordion
          key={example.name}
          method={endpoint.method}
          route={endpoint.route}
          example={example}
          baseUrl={baseUrl}
          activeHash={activeHash}
        />
      ))}
    </CardContent>
  </Card>
);
```

- [ ] **Step 4: Run the affected tests + typecheck**

Run:
```bash
npx vitest run web/src/components/__tests__/ExampleAccordion.test.tsx web/src/components/__tests__/EndpointCard.test.tsx && npm run typecheck
```
Expected: PASS. Specifically: collapsed-by-default (no body text, no "try it out" button); click on `getByText(/returns the user/)` expands and reveals the body; `container.querySelector("#get-users-id-returns-the-user")` resolves; collapsing the active example clears the hash; live-mode shows the "Try it out" button.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/ExampleAccordion.tsx web/src/components/EndpointCard.tsx
git commit -m "feat(web): reskin ExampleAccordion (Collapsible) and EndpointCard (Card)"
```

---

### Task 5: Reskin `Sidebar` (Collapsible) and the `App` shell + mobile `Sheet`

**Files:**
- Modify: `web/src/components/Sidebar.tsx`, `web/src/App.tsx`

**Interfaces:**
- Consumes: `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent`, `Sheet`/`SheetTrigger`/`SheetContent`/`SheetTitle`, `Button`; lucide `ChevronDown`/`ChevronRight`/`Menu`; `cn`.
- Produces: reskinned `Sidebar({ endpoints, activeHash, onNavigate? })` and `App()`. Invariants preserved: each group is a `<button>` whose accessible name is `<METHOD> <route>` (e.g. "GET /users"); example links are anchors with `href="#<slug>"`, fire `onNavigate` on click, and carry `aria-current="page"` when active; examples are hidden until the group is expanded; `App` renders an `<h1>` "API docs" heading and the desktop sidebar.

- [ ] **Step 1: Run the baseline tests (confirm green before refactor)**

Run:
```bash
npx vitest run web/src/components/__tests__/Sidebar.test.tsx web/src/__tests__/App.test.tsx
```
Expected: PASS (current implementation).

- [ ] **Step 2: Reskin `Sidebar` with `Collapsible`**

Replace `web/src/components/Sidebar.tsx`:
```tsx
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Endpoint } from "../api";
import { exampleSlug } from "../nav/slug";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const SidebarGroup = ({ endpoint, activeHash, onNavigate }: {
  endpoint: Endpoint; activeHash: string; onNavigate?: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="list-none">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left font-mono text-[13px] hover:bg-muted">
          <span><span className="text-primary">{endpoint.method}</span> {endpoint.route}</span>
          {expanded
            ? <ChevronDown className="size-3.5 opacity-50" />
            : <ChevronRight className="size-3.5 opacity-50" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="m-0 p-0">
            {endpoint.examples.map((example) => {
              const slug = exampleSlug(endpoint.method, endpoint.route, example.name);
              const active = slug === activeHash;
              return (
                <li key={example.name} className="list-none">
                  <a
                    href={`#${slug}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => onNavigate?.()}
                    className={cn(
                      "block rounded-md py-1.5 pl-[22px] pr-2 text-[13px] no-underline",
                      active ? "bg-accent font-semibold text-primary" : "text-foreground/80",
                    )}
                  >
                    <span className="font-mono text-[11px] opacity-70">{example.response.status}</span>{" "}
                    {example.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
};

export const Sidebar = ({ endpoints, activeHash, onNavigate }: {
  endpoints: Endpoint[]; activeHash: string; onNavigate?: () => void;
}) => (
  <nav aria-label="API endpoints">
    <ul className="m-0 p-0">
      {endpoints.map((endpoint) => (
        <SidebarGroup
          key={`${endpoint.method} ${endpoint.route}`}
          endpoint={endpoint}
          activeHash={activeHash}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  </nav>
);
```

- [ ] **Step 3: Reskin the `App` shell and swap the mobile drawer for `Sheet`**

Replace `web/src/App.tsx`:
```tsx
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { loadCatalog, type Catalog, DEFAULT_DOCS_HOST } from "./api";
import { isLive } from "./live";
import { EndpointCard } from "./components/EndpointCard";
import { Sidebar } from "./components/Sidebar";
import { useHash } from "./nav/use-hash";
import { useMediaQuery } from "./nav/use-media-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const App = () => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeHash = useHash();
  const isNarrow = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((e: unknown) => setError(String(e)));
  }, []);

  if (error) return <pre className="p-4 text-red-600">{error}</pre>;
  if (!catalog) return <p className="p-6">Loading…</p>;

  const baseUrl = isLive() ? window.location.origin : (catalog.baseUrl ?? DEFAULT_DOCS_HOST);

  const sidebar = (
    <Sidebar endpoints={catalog.endpoints} activeHash={activeHash} onNavigate={() => setDrawerOpen(false)} />
  );

  const content = (
    <main className="box-border max-w-[900px] flex-1 p-6">
      <h1 className="text-2xl font-bold">API docs</h1>
      <small className="text-muted-foreground">Generated {new Date(catalog.generatedAt).toLocaleString()}</small>
      {catalog.endpoints.map((endpoint) => (
        <EndpointCard
          key={`${endpoint.method} ${endpoint.route}`}
          endpoint={endpoint}
          baseUrl={baseUrl}
          activeHash={activeHash}
        />
      ))}
    </main>
  );

  if (isNarrow) {
    return (
      <div>
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background px-4 py-2.5">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] overflow-y-auto p-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>
          <strong>API docs</strong>
        </header>
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-start">
      <aside className="sticky top-0 box-border h-screen w-[280px] shrink-0 overflow-y-auto border-r p-4">
        {sidebar}
      </aside>
      {content}
    </div>
  );
};
```

- [ ] **Step 4: Run the affected tests + typecheck**

Run:
```bash
npx vitest run web/src/components/__tests__/Sidebar.test.tsx web/src/__tests__/App.test.tsx && npm run typecheck
```
Expected: PASS. `Sidebar` — group `getByRole("button", { name: /GET \/users/i })`, examples hidden until expand, `getByRole("link", { name: /returns the list of users/ })` with the right `href`, `onNavigate` fired, `aria-current="page"` on the active link. `App` — `findByRole("heading", { name: /API docs/i })` and the desktop sidebar button (the test stubs `matchMedia(false)` → desktop path, so `Sheet` is not rendered).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/Sidebar.tsx web/src/App.tsx
git commit -m "feat(web): reskin Sidebar and App shell with shadcn + mobile Sheet"
```

---

### Task 6: Full verification — suite, build, and static/live smoke check

**Files:**
- None (verification only); add a polyfill or test tweak here only if a real failure surfaces.

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces: a green full suite, a working `dist/web` bundle, and confirmation the reskinned UI renders in both static and live modes.

- [ ] **Step 1: Run the entire suite + typecheck**

Run:
```bash
npm run typecheck && npm test
```
Expected: **all** tests PASS. If a Radix-in-jsdom failure appears (e.g. a missing DOM API), extend `web/src/test-setup.ts` with the specific guarded polyfill it names — do not add polyfills speculatively. Re-run until green, then `git commit -am "test(web): polyfill <api> for Radix under jsdom"` if a change was needed.

- [ ] **Step 2: Build the web bundle**

Run:
```bash
npm run build:web
```
Expected: `vite build web` completes; `dist/web` contains `index.html`, a hashed JS asset, and a hashed CSS asset.

- [ ] **Step 3: Smoke-check the static build against the elaborate example**

Run:
```bash
npm run build
( cd examples/02-elaborate && npm test && npx the-owl build )
```
Expected: the example's docs build succeeds and writes a `site/` with `catalog.json` + the copied bundle. Open the generated `index.html` (or serve the folder) and visually confirm: left nav with collapsible groups, endpoint Cards, status/method Badges, expandable examples, the cURL Copy button. (If `examples/02-elaborate` has its own run instructions, follow those; the point is one static render.)

- [ ] **Step 4: Smoke-check live mode**

Start the example's app with `docs()` mounted (per the example's README/start script) and confirm in the browser: the "Try it out" form renders with shadcn `Input`/`Textarea`/`Button`, firing a request shows the `ResponsePanel` with a status `Badge`, and the mobile layout (narrow the window < 768px) opens the `Sheet` drawer.

- [ ] **Step 5: Final commit (if anything changed in this task)**

```bash
git status   # if clean, nothing to commit
git commit -am "chore(web): finalize shadcn reskin verification" || true
```

---

## Self-Review

**Spec coverage:**
- Tailwind v4 + `@tailwindcss/vite` → Task 1 (steps 1, 3, 5). ✓
- `shadcn init` artifacts (`components.json`, `cn()`, tokens) → Task 1 (steps 2–4). ✓
- `@` alias in all three configs → Task 1 (steps 5, 6, 8). ✓
- Deps as devDependencies → Task 1 step 1, Task 2 step 1. ✓
- Primitives added (`card badge button input textarea label collapsible sheet alert`) → Task 2 step 1. ✓
- Component mapping (every row of the spec table) → CodeBlock/CurlBlock + badges (T2), RequestForm/ResponsePanel (T3), ExampleAccordion/EndpointCard (T4), Sidebar/App-shell/Sheet (T5). ✓
- Light-only theme, monospace, status/method badges → Task 1 step 3 + StatusBadge/MethodBadge (T2). ✓
- Behavior preserved (nav/request modules untouched) → invariants called out per task; Global Constraints. ✓
- Test impact + jsdom polyfills "only if needed" → Task 1 step 7 (proactive ResizeObserver/pointer guards, since Collapsible needs them) + Task 6 step 1 (any remainder). ✓
- Build/serve verification → Task 6 (steps 2–4); `render/` unchanged per Global Constraints. ✓
- Out-of-scope items (dark toggle, redesign, highlighting) → not implemented. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full file contents; every run step has an exact command and expected result. ✓

**Type consistency:** `StatusBadge({ status, statusText? })` and `MethodBadge({ method, className? })` are defined in T2 and consumed with those exact props in T3/T4. `cn` signature consistent. `ExampleAccordion`/`EndpointCard`/`Sidebar`/`App`/`RequestForm`/`ResponsePanel`/`CurlBlock`/`CodeBlock` keep their original prop shapes throughout. ✓

**Deviation noted:** `ExampleAccordion` uses Radix `Collapsible` rather than `Accordion` (justified in File Structure) — same approved outcome (real button trigger, chevron+row pattern).
