import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCollector } from "../../capture/collector";
import { drainToDisk } from "../to-disk";
import { endpointSlug } from "../slug";
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

describe("drain", () => {
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
});
