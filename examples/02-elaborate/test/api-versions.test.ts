import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import theOwl from "the-owl";
import { owlHeaders } from "the-owl/vitest";
import { startServer, stopServer } from "./helpers";

let server: Server;
let base: string;
beforeAll(async () => { ({ server, base } = await startServer()); });
afterAll(async () => { theOwl.save(); await stopServer(server); });

// Two versions of the users API under a shared /api prefix. With
// THE_OWL_GROUPING_REGEX=^/api$ the docs sidebar strips /api and groups these
// under V1 and V2 (each holding a /users endpoint) — the grouping-regex demo.
describe("[get] /api/v1/users", () => {
  it("(200) returns the v1 users", async () => {
    const res = await fetch(`${base}/api/v1/users`, { headers: owlHeaders() });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: 1, name: "John" },
      { id: 2, name: "Paul" },
    ]);
  });
});

describe("[get] /api/v2/users", () => {
  it("(200) returns the v2 users, now with an email field", async () => {
    const res = await fetch(`${base}/api/v2/users`, { headers: owlHeaders() });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: 1, name: "John", email: "john@example.com" },
      { id: 2, name: "Paul", email: "paul@example.com" },
    ]);
  });
});
