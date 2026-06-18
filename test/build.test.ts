import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCollector } from "../src/collector";
import { drainToDisk } from "../src/persist/drain-to-disk";
import { runBuild } from "../src/build";

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
});
