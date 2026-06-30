import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCollector } from "../../capture/collector";
import { drainToDisk } from "../../drain/to-disk";
import { runBuild } from "../build";

let root: string;
afterEach(() => root && rmSync(root, { recursive: true, force: true }));

describe("build", () => {
  it("emits catalog.json and copies the web bundle into docs/site", () => {
    root = mkdtempSync(join(tmpdir(), "owl-root-"));
    const owlDir = join(root, ".owl");
    const bundle = join(root, "bundle");
    mkdirSync(bundle, { recursive: true });
    writeFileSync(join(bundle, "index.html"), "<html></html>");

    const c = createCollector();
    c.record({
      testName: "(200) ok", method: "GET", route: "/users/:id",
      request: { url: "u", method: "GET", path: "/users/1", query: {}, headers: {}, body: null },
      response: { status: 200, headers: {}, body: { id: 1 } },
    });
    drainToDisk(c, owlDir);

    runBuild({ owlDir, outDir: join(root, "docs"), webBundleDir: bundle });

    const site = join(root, "docs", "site");
    expect(existsSync(join(site, "index.html"))).toBe(true);
    const catalog = JSON.parse(readFileSync(join(site, "catalog.json"), "utf8"));
    expect(catalog.endpoints[0].route).toBe("/users/:id");
  });

  const seedRoot = () => {
    const r = mkdtempSync(join(tmpdir(), "owl-root-"));
    const owlDir = join(r, ".owl");
    const bundle = join(r, "bundle");
    mkdirSync(bundle, { recursive: true });
    writeFileSync(join(bundle, "index.html"), "<html></html>");
    const c = createCollector();
    c.record({
      testName: "(200) ok", method: "GET", route: "/users/:id",
      request: { url: "u", method: "GET", path: "/users/1", query: {}, headers: {}, body: null },
      response: { status: 200, headers: {}, body: { id: 1 } },
    });
    drainToDisk(c, owlDir);
    return { r, owlDir, bundle };
  };

  it("bakes THE_OWL_DOCS_HOST into catalog.baseUrl when set", () => {
    const seeded = seedRoot();
    root = seeded.r;
    process.env.THE_OWL_DOCS_HOST = "https://api.example.com";
    try {
      runBuild({ owlDir: seeded.owlDir, outDir: join(root, "docs"), webBundleDir: seeded.bundle });
    } finally {
      delete process.env.THE_OWL_DOCS_HOST;
    }
    const catalog = JSON.parse(readFileSync(join(root, "docs", "site", "catalog.json"), "utf8"));
    expect(catalog.baseUrl).toBe("https://api.example.com");
  });

  it("omits catalog.baseUrl when THE_OWL_DOCS_HOST is unset", () => {
    delete process.env.THE_OWL_DOCS_HOST;
    const seeded = seedRoot();
    root = seeded.r;
    runBuild({ owlDir: seeded.owlDir, outDir: join(root, "docs"), webBundleDir: seeded.bundle });
    const catalog = JSON.parse(readFileSync(join(root, "docs", "site", "catalog.json"), "utf8"));
    expect(catalog.baseUrl).toBeUndefined();
  });
});
