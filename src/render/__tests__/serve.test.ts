import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";
import { injectLiveFlag, docs } from "../serve";

describe("injectLiveFlag", () => {
  it("inserts the live marker before </head>", () => {
    const out = injectLiveFlag("<html><head><title>x</title></head><body></body></html>");
    expect(out).toContain("window.__THE_OWL_LIVE__ = true");
    expect(out.indexOf("window.__THE_OWL_LIVE__")).toBeLessThan(out.indexOf("</head>"));
  });

  it("still injects when there is no head", () => {
    const out = injectLiveFlag("<body>hi</body>");
    expect(out).toContain("window.__THE_OWL_LIVE__ = true");
  });
});

describe("docs() router", () => {
  let server: Server;
  let base: string;

  beforeAll(async () => {
    const bundleDir = mkdtempSync(join(tmpdir(), "owl-web-"));
    writeFileSync(join(bundleDir, "index.html"), "<html><head></head><body>docs</body></html>");
    const app = express();
    app.use("/docs", docs({ bundleDir, catalog: join(bundleDir, "missing.json") }));
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it("redirects the bare mount path to a trailing slash so relative assets resolve", async () => {
    const res = await fetch(`${base}/docs`);
    expect(res.redirected).toBe(true);
    expect(new URL(res.url).pathname).toBe("/docs/");
  });

  it("serves the live-flagged index at the trailing-slash path", async () => {
    const res = await fetch(`${base}/docs/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("window.__THE_OWL_LIVE__ = true");
  });
});

describe("docs() default catalog honors THE_OWL_SITE_OUTPUT_DIR", () => {
  const KEY = "THE_OWL_SITE_OUTPUT_DIR";
  const original = process.env[KEY];
  let server: Server;

  afterEach(() => {
    if (original === undefined) delete process.env[KEY];
    else process.env[KEY] = original;
  });
  afterAll(() => server && new Promise<void>((r) => server.close(() => r())));

  it("serves catalog.json from the custom output dir when no catalog option is given", async () => {
    const outDir = mkdtempSync(join(tmpdir(), "owl-out-"));
    writeFileSync(join(outDir, "catalog.json"), JSON.stringify({ endpoints: [] }));
    process.env[KEY] = outDir; // absolute -> used as-is

    const bundleDir = mkdtempSync(join(tmpdir(), "owl-web-"));
    writeFileSync(join(bundleDir, "index.html"), "<html><head></head><body>d</body></html>");

    const app = express();
    app.use("/docs", docs({ bundleDir })); // no catalog option -> falls back to the resolver
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const port = (server.address() as AddressInfo).port;

    const res = await fetch(`http://127.0.0.1:${port}/docs/catalog.json`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ endpoints: [] });
  });
});
