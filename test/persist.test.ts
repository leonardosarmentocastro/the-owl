import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCollector } from "../src/capture/collector";
import { drainToDisk } from "../src/persist/drain-to-disk";
import { readCatalog } from "../src/persist/read-catalog";
import { endpointSlug } from "../src/persist/slug";
import type { CapturedRequest, CapturedResponse } from "../src/types";

let dir: string;
afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

const req: CapturedRequest = { url: "u", method: "GET", path: "/users/1", query: {}, headers: {}, body: null };
const res = (body: unknown): CapturedResponse => ({ status: 200, headers: {}, body });

const seed = (name: string, body: unknown) => {
  const c = createCollector();
  c.record({ testName: name, method: "GET", route: "/users/:id", request: req, response: res(body) });
  return c;
};

describe("persist", () => {
  it("slugs an endpoint deterministically", () => {
    expect(endpointSlug("GET", "/users/:id")).toBe("get-users-id");
  });

  it("drains uniquely-named files (EC7: no clobber across processes)", () => {
    dir = mkdtempSync(join(tmpdir(), "owl-"));
    const files = drainToDisk(seed("(200) ok", { id: 1 }), dir);
    expect(files).toHaveLength(1);
    const [name] = readdirSync(dir);
    expect(name).toMatch(/^get-users-id\..+\.json$/); // <slug>.<unique>.json
  });

  it("merges Examples by endpoint key across multiple drain files (EC7)", () => {
    dir = mkdtempSync(join(tmpdir(), "owl-"));
    // simulate two separate test processes documenting the SAME endpoint
    drainToDisk(seed("(200) ok", { id: 1 }), dir);
    drainToDisk(seed("(404) missing", { error: "nope" }), dir);

    const catalog = readCatalog(dir);
    expect(catalog.endpoints).toHaveLength(1); // merged, not duplicated
    expect(catalog.endpoints[0].examples.map((e) => e.name).sort()).toEqual(["(200) ok", "(404) missing"]);
  });
});
