import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
    expect(out).toContain("window.__OWL_LIVE__ = true");
    expect(out.indexOf("window.__OWL_LIVE__")).toBeLessThan(out.indexOf("</head>"));
  });

  it("still injects when there is no head", () => {
    const out = injectLiveFlag("<body>hi</body>");
    expect(out).toContain("window.__OWL_LIVE__ = true");
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
    expect(await res.text()).toContain("window.__OWL_LIVE__ = true");
  });
});
