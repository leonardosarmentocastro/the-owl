import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCollector } from "../../capture/collector";
import { drainToDisk } from "../../drain/to-disk";
import { readCatalog } from "../read";
import type { CapturedRequest, CapturedResponse } from "../../types";

let dir: string;
afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

const req: CapturedRequest = { url: "u", method: "GET", path: "/users/1", query: {}, headers: {}, body: null };
const res = (body: unknown): CapturedResponse => ({ status: 200, headers: {}, body });

const seed = (name: string, body: unknown) => {
  const c = createCollector();
  c.record({ testName: name, method: "GET", route: "/users/:id", request: req, response: res(body) });
  return c;
};

describe("catalog read", () => {
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
